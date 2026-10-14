/** INTEGRATED regression coverage for import-row error persistence. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { createDataContext, type DataContext } from "../../src/index";
import { makePeriod } from "../fixtures";

describe("EnrollmentImportRepository (integrated, in-memory)", () => {
  let ctx: DataContext;

  beforeEach(() => {
    ctx = createDataContext({ path: ":memory:" });
  });
  afterEach(() => {
    ctx.close();
  });

  test("records and retrieves row errors for an import (BUG-008)", async () => {
    const period = makePeriod();
    await ctx.periods.upsert(period);
    const importRecord = await ctx.imports.create({
      periodId: period.id,
      source: "file",
      fileName: "elections.csv",
      storageRef: "imports/elections.csv",
      status: "validating",
      totalRows: 1,
      processedRows: 0,
      errorRows: 1,
      uploadedBy: "test-user",
    });

    await ctx.imports.addRowError(importRecord.id, {
      row: 4,
      column: "coveredContactIds",
      code: "CONTACT_NOT_OWNED",
      message: "Covered contact does not belong to employee.",
    });

    expect(await ctx.imports.listRowErrors(importRecord.id)).toEqual([
      {
        row: 4,
        column: "coveredContactIds",
        code: "CONTACT_NOT_OWNED",
        message: "Covered contact does not belong to employee.",
      },
    ]);
  });
});
