# Project Log — Stories & Bugs

Tracking log for the Benefit Enrollment platform. A blank **Date resolved**
means the item is still open.

**Priority:** P1 = highest … P4 = lowest.
**Code prefixes:** `STORY-###` (features/work), `BUG-###` (defects).

## Stories

| Code | Name | Description | Priority | Date found | Date resolved |
| --- | --- | --- | --- | --- | --- |
| STORY-001 | Monorepo restructure | Convert single Next.js app into Bun workspaces + Turborepo (`apps/web`, `packages/*`, `services/`, `docs/`, `ops/`, `.agents/`). | P2 | 2026-10-10 | 2026-10-10 |
| STORY-002 | Shared packages scaffold | Create `@benefit/ui`, `@benefit/types`, `@benefit/data`, `@benefit/config` as just-in-time TS packages. | P2 | 2026-10-10 | 2026-10-10 |
| STORY-003 | Domain model | Define Employee, Contact (dependent), Enrollment and related types in `@benefit/types`. | P1 | 2026-10-10 | 2026-10-10 |
| STORY-004 | Example JSON | Add `docs/examples/` with a full employee→contacts→enrollment instance. | P4 | 2026-10-10 | 2026-10-10 |
| STORY-005 | BRAIN.md spec + schema | Functional spec and canonical SQLite DDL in `brain/BRAIN.md`. | P2 | 2026-10-10 | 2026-10-10 |
| STORY-006 | SQLite data layer | Implement `@benefit/data` repositories over `node:sqlite`; transactional enrollment save. | P1 | 2026-10-10 | 2026-10-10 |
| STORY-007 | Employee seed script | `scripts/seed-employees.ts` to generate sample employees. | P3 | 2026-10-10 | 2026-10-10 |
| STORY-008 | Choose auth provider | Decide authentication stack (ADR 0001 — still open). | P2 | 2026-10-10 | |
| STORY-009 | File storage for imports | Decide/implement object storage for uploaded bulk-import files. | P2 | 2026-10-10 | |
| STORY-010 | MCP server scaffold | Add the MCP server (import/export of employee benefits) referenced in AGENTS.md. | P3 | 2026-10-10 | |
| STORY-011 | API import path | Programmatic enrollment import endpoint + worker. | P3 | 2026-10-10 | |
| STORY-012 | Wire data layer into web | Use `@benefit/data` from a Next.js route/server action to persist elections. | P2 | 2026-10-10 | |

## Bugs

| Code | Name | Description | Priority | Date found | Date resolved |
| --- | --- | --- | --- | --- | --- |
| BUG-001 | Seed not idempotent | `seed-employees.ts:68` uses `randomUUID()` for id but fixed `employeeNumber`; re-run bypasses `ON CONFLICT(id)` and hits `UNIQUE(employee_number)` (SQLite errcode 2067). Verified. Fixed: seed reuses existing row's id via `findByEmployeeNumber`. | P1 | 2026-10-12 | 2026-10-12 |
| BUG-002 | DB open fails on missing dir | `db.ts openDatabase` throws `unable to open database file` when the parent dir is absent; default path `./data/benefit.sqlite` fails from the app until `data/` exists. Verified. Fixed: `openDatabase` mkdirs the parent dir (skips `:memory:`). | P1 | 2026-10-12 | 2026-10-12 |
| BUG-003 | Covered contact ownership unchecked | `sqlite.ts makeEnrollmentRepo.save` — `coveredContactIds` are FK-checked for existence only; a selection can cover a contact belonging to another employee. | P3 | 2026-10-12 | |
| BUG-004 | New-id save vs unique (employee, period) | `save` only does `ON CONFLICT(id)`; saving a new-id enrollment for an existing (employee, period) violates `UNIQUE(employee_id, period_id)`. Fetch-then-reuse-id flow undocumented. | P3 | 2026-10-12 | |
| BUG-005 | `limit: 0` returns all rows | `sqlite.ts list()` treats `0` as falsy (`params?.limit ? … : ""`), so `limit: 0` returns every row instead of none. | P4 | 2026-10-12 | |
| BUG-006 | `transaction()` not reentrant | `db.ts transaction()` issues a bare `BEGIN`; `plans.upsert`/`enrollments.save` cannot be composed inside an outer transaction (nested BEGIN errors). | P4 | 2026-10-12 | |
| BUG-007 | Seed script untype-checked | `scripts/` is outside tsconfig `include`, so `noUncheckedIndexedAccess` never flags `cities[index]` etc.; runtime-safe only for indices 0–9. | P4 | 2026-10-12 | |
| BUG-008 | `import_row_errors` unreachable | `EnrollmentImportRepository` has no method to write/read row errors, so the table and `ImportRowError` type are unusable. | P4 | 2026-10-12 | |
| BUG-009 | Contact address fabricated | `sqlite.ts rowToContact` fills empty-string `line1/city/state/postalCode` when `lives_with_employee=0` but address columns are NULL, masking bad data. | P4 | 2026-10-12 | |
