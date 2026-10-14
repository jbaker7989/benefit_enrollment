/**
 * INTEGRATED test (STORY-030): enrollment identity and storage-invariant
 * enforcement over in-memory SQLite.
 *
 *  - The repository rejects a caller-supplied enrollment id that already
 *    belongs to a different (employee, period) without mutating that record.
 *  - The database itself rejects an `enrollment_selection_contacts` write that
 *    crosses employee ownership, including a raw SQL write issued outside the
 *    repository.
 *  - Valid same-employee coverage continues to persist.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { createDataContext, openDatabase, type Db, type DataContext } from "../../src/index";
import { makeContact, makeEmployee, makeEnrollment, makePeriod, makePlan } from "../fixtures";

describe("storage invariants (integrated, in-memory)", () => {
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

  // STORY-030: a caller-supplied id already owned by a different (employee,
  // period) must not hijack that enrollment via ON CONFLICT(id).
  test("rejects reusing an enrollment id owned by a different employee/period, without changing it", async () => {
    const { emp, plan, period } = await seedGraph();
    const existing = makeEnrollment(emp.id, period.id, {
      status: "submitted",
      selections: [{ planId: plan.id, kind: "medical", tier: "employee_only", coveredContactIds: [] }],
    });
    const saved = await ctx.enrollments.save(existing);

    // A second employee and a second period — a genuinely different enrollment
    // identity that reuses the first enrollment's id.
    const other = makeEmployee();
    await ctx.employees.upsert(other);
    const otherPeriod = makePeriod({ name: "Special Enrollment 2026" });
    await ctx.periods.upsert(otherPeriod);

    const collision = makeEnrollment(other.id, otherPeriod.id, {
      status: "draft",
      selections: [{ planId: plan.id, kind: "medical", tier: "employee_only", coveredContactIds: [] }],
    });
    collision.id = saved.id; // reuse the first enrollment's id

    await expect(ctx.enrollments.save(collision)).rejects.toThrow(/already assigned to a different enrollment/i);

    // The original enrollment is untouched.
    const reread = await ctx.enrollments.findById(saved.id);
    expect(reread?.employeeId).toBe(emp.id);
    expect(reread?.periodId).toBe(period.id);
    expect(reread?.status).toBe("submitted");
  });

  // STORY-030: valid same-employee coverage still works end to end.
  test("allows covering the employee's own contact", async () => {
    const { emp, child, plan, period } = await seedGraph();
    const enrollment = makeEnrollment(emp.id, period.id, {
      selections: [{ planId: plan.id, kind: "medical", tier: "employee_children", coveredContactIds: [child.id] }],
    });
    const saved = await ctx.enrollments.save(enrollment);
    expect(saved.selections[0]?.coveredContactIds).toEqual([child.id]);
  });

  // STORY-030: the database trigger rejects a cross-ownership covered-contact
  // write even when it bypasses the repository and goes straight to SQL.
  // Built directly on a raw connection to prove the rule lives in the database,
  // not in @benefit/data.
  test("database trigger rejects a cross-ownership covered-contact row written via raw SQL", () => {
    const db: Db = openDatabase(":memory:");
    try {
      // e1 owns enrollment en1/selection s1; e2 owns contact c2.
      db.exec(
        "INSERT INTO employees (id, employee_number, first_name, last_name, email, date_of_birth, sex, address_line1, city, state, postal_code, country, hire_date, status, created_at, updated_at) " +
          "VALUES ('e1','EMP-1','A','B','a@b.c','1990-01-01','unspecified','1 St','Austin','TX','78701','US','2020-01-01','active','t','t')",
      );
      db.exec(
        "INSERT INTO employees (id, employee_number, first_name, last_name, email, date_of_birth, sex, address_line1, city, state, postal_code, country, hire_date, status, created_at, updated_at) " +
          "VALUES ('e2','EMP-2','C','D','c@d.e','1990-01-01','unspecified','2 St','Austin','TX','78701','US','2020-01-01','active','t','t')",
      );
      db.exec(
        "INSERT INTO contacts (id, employee_id, first_name, last_name, date_of_birth, sex, relationship, lives_with_employee, created_at, updated_at) " +
          "VALUES ('c2','e2','Kid','D','2015-01-01','unspecified','child',1,'t','t')",
      );
      db.exec("INSERT INTO enrollment_periods (id, name, plan_year, opens_at, closes_at, type) VALUES ('p1','OE',2026,'t','t','open')");
      db.exec(
        "INSERT INTO enrollments (id, employee_id, period_id, status, created_at, updated_at) VALUES ('en1','e1','p1','draft','t','t')",
      );
      db.exec("INSERT INTO benefit_plans (id, kind, name, carrier, plan_year, active) VALUES ('pl1','medical','PPO','Acme',2026,1)");
      db.exec("INSERT INTO enrollment_selections (id, enrollment_id, plan_id, kind, tier) VALUES ('s1','en1','pl1','medical','employee_children')");

      // e1's enrollment covering e2's contact — must be aborted by the trigger.
      expect(() =>
        db.exec("INSERT INTO enrollment_selection_contacts (selection_id, contact_id) VALUES ('s1','c2')"),
      ).toThrow(/does not belong to the enrollment employee/i);

      // And the own-contact case still succeeds.
      db.exec(
        "INSERT INTO contacts (id, employee_id, first_name, last_name, date_of_birth, sex, relationship, lives_with_employee, created_at, updated_at) " +
          "VALUES ('c1','e1','Kid','B','2015-01-01','unspecified','child',1,'t','t')",
      );
      expect(() =>
        db.exec("INSERT INTO enrollment_selection_contacts (selection_id, contact_id) VALUES ('s1','c1')"),
      ).not.toThrow();
    } finally {
      db.close();
    }
  });
});
