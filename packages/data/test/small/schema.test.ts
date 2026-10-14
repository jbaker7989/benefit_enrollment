/**
 * SMALL test: pure assertions on the generated DDL string. No database, no
 * filesystem, no I/O — just the module under test.
 */
import { describe, expect, test } from "bun:test";

import { SCHEMA_SQL } from "../../src/schema";

describe("SCHEMA_SQL (small)", () => {
  const createTableStatements = SCHEMA_SQL.match(/CREATE TABLE[^;]+;/gis) ?? [];

  test("declares the expected tables", () => {
    for (const table of [
      "employees",
      "contacts",
      "benefit_plans",
      "plan_premiums",
      "enrollment_periods",
      "enrollment_imports",
      "import_row_errors",
      "enrollments",
      "enrollment_selections",
      "enrollment_selection_contacts",
    ]) {
      expect(SCHEMA_SQL).toContain(table);
    }
  });

  test("every table is STRICT", () => {
    expect(createTableStatements.length).toBeGreaterThan(0);
    for (const stmt of createTableStatements) {
      expect(stmt).toContain("STRICT");
    }
  });

  test("employee_number is unique (the BUG-001 constraint)", () => {
    expect(SCHEMA_SQL).toMatch(/employee_number\s+TEXT NOT NULL UNIQUE/i);
  });

  test("one enrollment per (employee, period)", () => {
    expect(SCHEMA_SQL).toMatch(/UNIQUE\s*\(\s*employee_id\s*,\s*period_id\s*\)/i);
  });

  test("covered-contact join is foreign-keyed to both parents", () => {
    expect(SCHEMA_SQL).toMatch(/enrollment_selection_contacts/i);
    expect(SCHEMA_SQL).toMatch(/REFERENCES enrollment_selections\(id\)/i);
    expect(SCHEMA_SQL).toMatch(/REFERENCES contacts\(id\)/i);
  });

  test("contacts and enrollments are foreign-keyed to employees", () => {
    const empRefs = SCHEMA_SQL.match(/REFERENCES employees\(id\)/gi) ?? [];
    expect(empRefs.length).toBeGreaterThanOrEqual(2);
  });

  // STORY-030: covered-contact ownership is enforced by database triggers, not
  // only by the repository, so a direct write cannot cross employee ownership.
  test("declares covered-contact ownership triggers on insert and update", () => {
    expect(SCHEMA_SQL).toMatch(
      /CREATE TRIGGER[^;]*trg_selection_contact_ownership_insert[\s\S]*?BEFORE INSERT ON enrollment_selection_contacts/i,
    );
    expect(SCHEMA_SQL).toMatch(
      /CREATE TRIGGER[^;]*trg_selection_contact_ownership_update[\s\S]*?BEFORE UPDATE ON enrollment_selection_contacts/i,
    );
  });

  test("ownership trigger aborts and leaks no identifiers in its message", () => {
    const triggers = SCHEMA_SQL.match(/CREATE TRIGGER[\s\S]*?END;/gi) ?? [];
    expect(triggers.length).toBeGreaterThanOrEqual(2);
    for (const trigger of triggers) {
      expect(trigger).toMatch(/RAISE\(ABORT,\s*'covered contact does not belong to the enrollment employee'\)/i);
      // The message must not interpolate NEW.* values (no PII / identifiers).
      expect(trigger).not.toMatch(/RAISE\([^)]*NEW\./i);
    }
  });
});
