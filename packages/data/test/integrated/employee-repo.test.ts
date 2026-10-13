/**
 * INTEGRATED test: EmployeeRepository against a real (in-memory) SQLite
 * database. Multiple units (repo + db + schema) working together, in-process,
 * no network or external services.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { createDataContext, type DataContext } from "../../src/index";
import { makeEmployee } from "../fixtures";

describe("EmployeeRepository (integrated, in-memory)", () => {
  let ctx: DataContext;

  beforeEach(() => {
    ctx = createDataContext({ path: ":memory:" });
  });
  afterEach(() => {
    ctx.close();
  });

  test("upsert round-trips via findById and findByEmployeeNumber", async () => {
    const e = makeEmployee({ employeeNumber: "EMP-001", firstName: "Ada" });
    await ctx.employees.upsert(e);

    expect((await ctx.employees.findById(e.id))?.firstName).toBe("Ada");
    expect((await ctx.employees.findByEmployeeNumber("EMP-001"))?.id).toBe(e.id);
  });

  test("re-upsert with the same id updates in place (no duplicate row)", async () => {
    const e = makeEmployee({ employeeNumber: "EMP-001", firstName: "Ada" });
    await ctx.employees.upsert(e);
    await ctx.employees.upsert({ ...e, firstName: "Grace" });

    const all = await ctx.employees.list();
    expect(all.length).toBe(1);
    expect(all[0]?.firstName).toBe("Grace");
  });

  // BUG-001 — root cause: a fresh id reusing an existing employeeNumber bypasses
  // ON CONFLICT(id) and violates UNIQUE(employee_number).
  test("a new id with an existing employeeNumber is rejected (BUG-001 cause)", async () => {
    await ctx.employees.upsert(makeEmployee({ employeeNumber: "EMP-001" }));
    await expect(
      ctx.employees.upsert(makeEmployee({ employeeNumber: "EMP-001" })),
    ).rejects.toThrow();
  });

  // BUG-001 — fix pattern: reuse the existing row's id so a re-seed updates in
  // place rather than colliding.
  test("reusing the existing id makes re-seeding idempotent (BUG-001 fix)", async () => {
    const first = makeEmployee({ employeeNumber: "EMP-001" });
    await ctx.employees.upsert(first);

    const existing = await ctx.employees.findByEmployeeNumber("EMP-001");
    expect(existing).not.toBeNull();
    const reseed = makeEmployee({ employeeNumber: "EMP-001", id: existing!.id });

    await expect(ctx.employees.upsert(reseed)).resolves.toBeDefined();
    expect((await ctx.employees.list()).length).toBe(1);
  });

  test("list filters by status", async () => {
    await ctx.employees.upsert(makeEmployee({ status: "active" }));
    await ctx.employees.upsert(makeEmployee({ status: "terminated" }));

    expect((await ctx.employees.list({ status: "active" })).length).toBe(1);
    expect((await ctx.employees.list()).length).toBe(2);
  });
});
