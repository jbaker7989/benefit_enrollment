/** INTEGRATED regression coverage for contact address validation. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { createDataContext, type DataContext } from "../../src/index";
import { makeContact, makeEmployee } from "../fixtures";

describe("ContactRepository (integrated, in-memory)", () => {
  let ctx: DataContext;

  beforeEach(() => {
    ctx = createDataContext({ path: ":memory:" });
  });
  afterEach(() => {
    ctx.close();
  });

  test("rejects a contact who does not live with the employee but has no address (BUG-009)", async () => {
    const employee = makeEmployee();
    await ctx.employees.upsert(employee);
    const contact = makeContact(employee.id, { livesWithEmployee: false, address: null });

    await expect(ctx.contacts.upsert(contact)).rejects.toThrow("must have an address");
    expect(await ctx.contacts.findById(contact.id)).toBeNull();
  });
});
