/**
 * INTEGRATED test (STORY-031): transaction isolation and persistence-boundary
 * validation over in-memory SQLite.
 *
 *  - A caught inner transaction failure rolls back only its own work; the outer
 *    transaction continues and never commits the inner partial write.
 *  - Repository list limits reject negative / non-integer / unsafe values;
 *    zero still returns no rows.
 *  - A separate-residence contact with a blank/absent address is rejected
 *    before persistence, and valid contacts round-trip.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { createDataContext, openDatabase, transaction, type Db, type DataContext } from "../../src/index";
import { makeContact, makeEmployee } from "../fixtures";

describe("transaction boundary (integrated, in-memory)", () => {
  // STORY-031: savepoint semantics — a caught inner failure must not poison the
  // outer transaction, and its partial write must not be committed.
  test("a caught inner failure rolls back only its work; the outer commits the rest", () => {
    const db: Db = openDatabase(":memory:");
    try {
      db.exec("CREATE TABLE entries (value TEXT NOT NULL) STRICT;");
      const insert = db.prepare("INSERT INTO entries (value) VALUES (?)");

      transaction(db, () => {
        insert.run("outer-before");
        // Inner unit of work fails, but the OUTER caller catches it.
        try {
          transaction(db, () => {
            insert.run("inner-should-roll-back");
            throw new Error("inner boom");
          });
        } catch {
          // swallowed on purpose — outer decides to continue
        }
        insert.run("outer-after");
      });

      const values = (db.prepare("SELECT value FROM entries ORDER BY rowid").all() as Array<{ value: string }>).map(
        (r) => r.value,
      );
      expect(values).toEqual(["outer-before", "outer-after"]);
      expect(values).not.toContain("inner-should-roll-back");
    } finally {
      db.close();
    }
  });

  test("an uncaught inner failure rolls the whole unit of work back", () => {
    const db: Db = openDatabase(":memory:");
    try {
      db.exec("CREATE TABLE entries (value TEXT NOT NULL) STRICT;");
      const insert = db.prepare("INSERT INTO entries (value) VALUES (?)");

      expect(() =>
        transaction(db, () => {
          insert.run("outer");
          transaction(db, () => {
            insert.run("inner");
            throw new Error("boom");
          });
        }),
      ).toThrow("boom");

      expect(db.prepare("SELECT COUNT(*) AS n FROM entries").get()).toEqual({ n: 0 });
    } finally {
      db.close();
    }
  });
});

describe("persistence-boundary validation (integrated, in-memory)", () => {
  let ctx: DataContext;

  beforeEach(() => {
    ctx = createDataContext({ path: ":memory:" });
  });
  afterEach(() => {
    ctx.close();
  });

  // STORY-031: list-limit validation surfaced through the real repository.
  test("employee list rejects negative, non-integer, and unsafe limits", async () => {
    await expect(ctx.employees.list({ limit: -1 })).rejects.toThrow(RangeError);
    await expect(ctx.employees.list({ limit: 1.5 })).rejects.toThrow(RangeError);
    await expect(ctx.employees.list({ limit: Number.MAX_SAFE_INTEGER + 1 })).rejects.toThrow(RangeError);
  });

  test("employee list honors a zero limit as no rows", async () => {
    await ctx.employees.upsert(makeEmployee());
    expect(await ctx.employees.list({ limit: 0 })).toEqual([]);
    // Sanity: without the limit the row is there.
    expect((await ctx.employees.list()).length).toBe(1);
  });

  // STORY-031: separate-residence contact address rules at the repository.
  test("rejects a separate-residence contact with no address", async () => {
    const emp = makeEmployee();
    await ctx.employees.upsert(emp);
    const contact = makeContact(emp.id, { livesWithEmployee: false, address: null });
    await expect(ctx.contacts.upsert(contact)).rejects.toThrow(/must have an address/i);
  });

  test("rejects a separate-residence contact with a blank required field", async () => {
    const emp = makeEmployee();
    await ctx.employees.upsert(emp);
    const contact = makeContact(emp.id, {
      livesWithEmployee: false,
      address: { line1: "5 Oak", line2: null, city: "   ", state: "TX", postalCode: "78701", country: "US" },
    });
    await expect(ctx.contacts.upsert(contact)).rejects.toThrow(/missing required address fields/i);
  });

  test("a valid separate-residence contact round-trips", async () => {
    const emp = makeEmployee();
    await ctx.employees.upsert(emp);
    const contact = makeContact(emp.id, {
      livesWithEmployee: false,
      address: { line1: "5 Oak", line2: "Unit 2", city: "Dallas", state: "TX", postalCode: "75201", country: "US" },
    });
    await ctx.contacts.upsert(contact);

    const read = await ctx.contacts.findById(contact.id);
    expect(read?.livesWithEmployee).toBe(false);
    expect(read?.address?.city).toBe("Dallas");
    expect(read?.address?.line2).toBe("Unit 2");
  });
});
