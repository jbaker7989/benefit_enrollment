/**
 * Canonical storage schema (SQLite). Mirrors the DDL documented in
 * `brain/BRAIN.md`. `PRAGMA foreign_keys` is set by the driver in `db.ts`.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS employees (
  id              TEXT PRIMARY KEY,
  employee_number TEXT NOT NULL UNIQUE,
  first_name      TEXT NOT NULL,
  middle_name     TEXT,
  last_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  date_of_birth   TEXT NOT NULL,
  sex             TEXT NOT NULL,
  ssn_token       TEXT,
  ssn_last4       TEXT,
  address_line1   TEXT NOT NULL,
  address_line2   TEXT,
  city            TEXT NOT NULL,
  state           TEXT NOT NULL,
  postal_code     TEXT NOT NULL,
  country         TEXT NOT NULL DEFAULT 'US',
  hire_date       TEXT NOT NULL,
  status          TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS contacts (
  id                  TEXT PRIMARY KEY,
  employee_id         TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  date_of_birth       TEXT NOT NULL,
  sex                 TEXT NOT NULL,
  relationship        TEXT NOT NULL,
  ssn_token           TEXT,
  ssn_last4           TEXT,
  lives_with_employee INTEGER NOT NULL DEFAULT 1,
  address_line1       TEXT,
  address_line2       TEXT,
  city                TEXT,
  state               TEXT,
  postal_code         TEXT,
  country             TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_contacts_employee ON contacts(employee_id);

CREATE TABLE IF NOT EXISTS benefit_plans (
  id        TEXT PRIMARY KEY,
  kind      TEXT NOT NULL,
  name      TEXT NOT NULL,
  carrier   TEXT NOT NULL,
  plan_year INTEGER NOT NULL,
  active    INTEGER NOT NULL DEFAULT 1
) STRICT;

CREATE TABLE IF NOT EXISTS plan_premiums (
  plan_id       TEXT NOT NULL REFERENCES benefit_plans(id) ON DELETE CASCADE,
  tier          TEXT NOT NULL,
  premium_cents INTEGER NOT NULL,
  PRIMARY KEY (plan_id, tier)
) STRICT;

CREATE TABLE IF NOT EXISTS enrollment_periods (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  plan_year INTEGER NOT NULL,
  opens_at  TEXT NOT NULL,
  closes_at TEXT NOT NULL,
  type      TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS enrollment_imports (
  id             TEXT PRIMARY KEY,
  period_id      TEXT NOT NULL REFERENCES enrollment_periods(id),
  source         TEXT NOT NULL,
  file_name      TEXT,
  storage_ref    TEXT,
  status         TEXT NOT NULL,
  total_rows     INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  error_rows     INTEGER NOT NULL DEFAULT 0,
  uploaded_by    TEXT NOT NULL,
  created_at     TEXT NOT NULL,
  completed_at   TEXT
) STRICT;

CREATE TABLE IF NOT EXISTS import_row_errors (
  import_id   TEXT NOT NULL REFERENCES enrollment_imports(id) ON DELETE CASCADE,
  row_number  INTEGER NOT NULL,
  column_name TEXT,
  code        TEXT NOT NULL,
  message     TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS enrollments (
  id               TEXT PRIMARY KEY,
  employee_id      TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_id        TEXT NOT NULL REFERENCES enrollment_periods(id),
  status           TEXT NOT NULL,
  submitted_at     TEXT,
  source_import_id TEXT REFERENCES enrollment_imports(id),
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  UNIQUE (employee_id, period_id)
) STRICT;
CREATE INDEX IF NOT EXISTS idx_enrollments_employee ON enrollments(employee_id);

CREATE TABLE IF NOT EXISTS enrollment_selections (
  id            TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  plan_id       TEXT NOT NULL REFERENCES benefit_plans(id),
  kind          TEXT NOT NULL,
  tier          TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_selections_enrollment ON enrollment_selections(enrollment_id);

CREATE TABLE IF NOT EXISTS enrollment_selection_contacts (
  selection_id TEXT NOT NULL REFERENCES enrollment_selections(id) ON DELETE CASCADE,
  contact_id   TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (selection_id, contact_id)
) STRICT;
`;
