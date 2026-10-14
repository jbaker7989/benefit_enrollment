/**
 * INTEGRATED test: enrollment persistence — the full graph (employee →
 * contacts → plan → period → enrollment → selections → covered contacts) over
 * an in-memory SQLite database, including foreign-key enforcement.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { createDataContext, type DataContext } from "../../src/index";
import { makeContact, makeEmployee, makeEnrollment, makePeriod, makePlan } from "../fixtures";

describe("EnrollmentRepository (integrated, in-memory)", () => {
  let ctx: DataContext;

  beforeEach(() => {
    ctx = createDataContext({ path: ":memory:" });
  });
  afterEach(() => {
    ctx.close();
  });

  async function seedGraph() {
    const emp = makeEmployee();
    await ctx.employees.upsert(emp);
    const child = makeContact(emp.id, { relationship: "child" });
    await ctx.contacts.upsert(child);
    const plan = makePlan({ kind: "medical" });
    await ctx.plans.upsert(plan);
    const period = makePeriod();
    await ctx.periods.upsert(period);
    return { emp, child, plan, period };
  }

  test("save then read back — election follows through to the covered contact", async () => {
    const { emp, child, plan, period } = await seedGraph();
    const enrollment = makeEnrollment(emp.id, period.id, {
      status: "submitted",
      selections: [
        {
          planId: plan.id,
          kind: "medical",
          tier: "employee_children",
          coveredContactIds: [child.id],
        },
      ],
    });

    await ctx.enrollments.save(enrollment);

    const read = await ctx.enrollments.findForEmployee(emp.id, period.id);
    expect(read?.status).toBe("submitted");
    expect(read?.selections.length).toBe(1);
    expect(read?.selections[0]?.coveredContactIds).toEqual([child.id]);
  });

  test("re-saving replaces selections rather than accumulating them", async () => {
    const { emp, child, plan, period } = await seedGraph();
    const enrollment = makeEnrollment(emp.id, period.id, {
      selections: [{ planId: plan.id, kind: "medical", tier: "employee_only", coveredContactIds: [] }],
    });
    await ctx.enrollments.save(enrollment);

    await ctx.enrollments.save({
      ...enrollment,
      selections: [
        { planId: plan.id, kind: "medical", tier: "employee_children", coveredContactIds: [child.id] },
      ],
    });

    const read = await ctx.enrollments.findById(enrollment.id);
    expect(read?.selections.length).toBe(1);
    expect(read?.selections[0]?.tier).toBe("employee_children");
    expect(read?.selections[0]?.coveredContactIds).toEqual([child.id]);
  });

  test("saving an enrollment for a non-existent employee is rejected (FK)", async () => {
    const { plan, period } = await seedGraph();
    const ghost = makeEmployee(); // intentionally not persisted
    const enrollment = makeEnrollment(ghost.id, period.id, {
      selections: [{ planId: plan.id, kind: "medical", tier: "employee_only", coveredContactIds: [] }],
    });

    await expect(ctx.enrollments.save(enrollment)).rejects.toThrow();
  });

  test("covering a non-existent contact is rejected (FK)", async () => {
    const { emp, plan, period } = await seedGraph();
    const strayContact = makeContact(emp.id); // not persisted
    const enrollment = makeEnrollment(emp.id, period.id, {
      selections: [
        { planId: plan.id, kind: "medical", tier: "employee_children", coveredContactIds: [strayContact.id] },
      ],
    });

    await expect(ctx.enrollments.save(enrollment)).rejects.toThrow();
  });

  // BUG-003 — a valid contact may still belong to a different employee and
  // therefore must not be covered by this employee's election.
  test("rejects a covered contact owned by a different employee without changing the enrollment (BUG-003)", async () => {
    const { emp, child, plan, period } = await seedGraph();
    const original = makeEnrollment(emp.id, period.id, {
      selections: [{ planId: plan.id, kind: "medical", tier: "employee_children", coveredContactIds: [child.id] }],
    });
    await ctx.enrollments.save(original);

    const otherEmployee = makeEmployee();
    await ctx.employees.upsert(otherEmployee);
    const otherChild = makeContact(otherEmployee.id, { relationship: "child" });
    await ctx.contacts.upsert(otherChild);

    await expect(
      ctx.enrollments.save({
        ...original,
        selections: [{ planId: plan.id, kind: "medical", tier: "employee_children", coveredContactIds: [otherChild.id] }],
      }),
    ).rejects.toThrow("does not belong to employee");

    expect(await ctx.enrollments.findById(original.id)).toEqual(original);
  });

  // BUG-004 — callers can legitimately construct a fresh id when updating an
  // existing employee/period; the business key must still select one record.
  test("updates an existing employee and period when the caller provides a new id (BUG-004)", async () => {
    const { emp, plan, period } = await seedGraph();
    const first = makeEnrollment(emp.id, period.id, {
      selections: [{ planId: plan.id, kind: "medical", tier: "employee_only", coveredContactIds: [] }],
    });
    await ctx.enrollments.save(first);

    const replacement = makeEnrollment(emp.id, period.id, {
      status: "submitted",
      selections: [{ planId: plan.id, kind: "medical", tier: "waived", coveredContactIds: [] }],
    });
    const saved = await ctx.enrollments.save(replacement);

    expect(saved.id).toBe(first.id);
    expect((await ctx.enrollments.findForEmployee(emp.id, period.id))?.id).toBe(first.id);
    expect((await ctx.enrollments.findForEmployee(emp.id, period.id))?.status).toBe("submitted");
  });
});
