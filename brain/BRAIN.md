# BRAIN — Functional Spec & Schema

Authoritative functional reference for the Benefit Enrollment application. The
TypeScript source of truth for these shapes is
[`@benefit/types`](../packages/types/src/index.ts); this file is the
human-readable spec and the canonical **storage schema**.

## Purpose

Employees elect benefits through three ingest paths:

1. **Manual** — interactive enrollment in the web app.
2. **File import** — bulk upload of enrollment selections (end-of-year).
3. **API import** — programmatic submission of selections.

Once elections are made (by any path) they are persisted to a **SQLite**
database so they are referenceable for review, export, and reporting.

## Core objects

### Employee

The covered worker. One address. Identifiers are stored as a token + last-4
(`ssnToken`, `ssnLast4`) — **raw SSN is never stored**.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Primary key |
| `employeeNumber` | string | Employer-assigned; unique; used in imports |
| `firstName` / `middleName` / `lastName` | string | middle optional |
| `email` | string | |
| `phone` | string \| null | |
| `dateOfBirth` | ISO date | |
| `sex` | enum | male / female / other / unspecified |
| `ssnToken` | string \| null | Tokenized reference |
| `ssnLast4` | string \| null | Display/verification only |
| `address` | Address | line1, line2, city, state, postalCode, country |
| `hireDate` | ISO date | |
| `status` | enum | active / terminated / on_leave / retired |
| `createdAt` / `updatedAt` | ISO datetime | |

### Contact (dependent)

A dependent who may be elected onto coverage (spouse, child, domestic partner,
other). **One employee has many contacts** (`contacts.employee_id` →
`employees.id`). Carries its own address only when `livesWithEmployee` is false.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Primary key |
| `employeeId` | string | **FK → Employee.id** |
| `firstName` / `lastName` | string | |
| `dateOfBirth` | ISO date | |
| `sex` | enum | |
| `relationship` | enum | spouse / domestic_partner / child / other |
| `ssnToken` / `ssnLast4` | string \| null | token + last-4 only |
| `livesWithEmployee` | boolean | |
| `address` | Address \| null | null when `livesWithEmployee` is true |
| `createdAt` / `updatedAt` | ISO datetime | |

### Enrollment

An employee's elections for a period. Each **selection** names a plan, a
coverage tier, and the specific contacts covered — this is how an election
"follows through" to dependents. One enrollment per (employee, period).

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Primary key |
| `employeeId` | string | FK → Employee.id |
| `periodId` | string | FK → EnrollmentPeriod.id |
| `status` | enum | draft / submitted / approved / rejected / cancelled |
| `selections[]` | EnrollmentSelection | plan + tier + coveredContactIds[] |
| `submittedAt` | ISO datetime \| null | |
| `sourceImportId` | string \| null | set when created via file/API import |
| `createdAt` / `updatedAt` | ISO datetime | |

**EnrollmentSelection**: `planId`, `kind`, `tier`, `coveredContactIds[]`
(each **FK → Contact.id**).

## Storage — SQLite

Relational, normalized, foreign keys enforced. Booleans are `INTEGER` (0/1);
dates/datetimes are ISO-8601 `TEXT`; money is integer cents. Tables use
`STRICT` typing.

```sql
PRAGMA foreign_keys = ON;

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

-- Which dependents are covered by each selection (many-to-many).
CREATE TABLE IF NOT EXISTS enrollment_selection_contacts (
  selection_id TEXT NOT NULL REFERENCES enrollment_selections(id) ON DELETE CASCADE,
  contact_id   TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (selection_id, contact_id)
) STRICT;
```

## Persistence flow

When an enrollment is saved (manual submit, or a processed import row):

1. Upsert the `employees` row and the employee's `contacts`.
2. Upsert the `enrollments` row (one per employee + period).
3. Replace the enrollment's `enrollment_selections` and their
   `enrollment_selection_contacts` within a single transaction, so an
   enrollment and its elections are always consistent.

The implementation lives in [`@benefit/data`](../packages/data/src/index.ts)
behind the repository interfaces, so callers never touch SQL directly.
