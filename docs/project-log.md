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
| STORY-013 | Test suite + CI gate | Add `bun test` suite (small/integrated/large) for `@benefit/data` incl. BUG-001/002 regressions; wire `test` task into Turbo; add GitHub Actions CI running typecheck/lint/build/test on every PR. | P1 | 2026-10-12 | 2026-10-12 |
| STORY-014 | QA testing skill | Author `.agents/skills/qa-testing/SKILL.md` defining the small/integrated/large taxonomy and the requirement that every story/bug ships tests; register it in AGENTS.md. | P2 | 2026-10-12 | 2026-10-12 |
| STORY-015 | Data integrity and repository corrective release | Resolve BUG-003 through BUG-009; enforce contact ownership and reliable persistence/import repository behavior. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | 2026-10-13 |
| STORY-016 | Benefit catalog and enrollment period administration | Manage active plans, premiums, and valid enrollment windows. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-017 | Authentication authorization and role enforcement | Select auth and enforce employee self-only and HR access server-side. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-018 | Security privacy retention and audit decision | Define PII handling, retention, audit, deployment, and vendor review requirements. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-019 | HR file upload intake | Secure CSV/JSON upload, storage reference, lifecycle status, and error presentation. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-020 | Import parsing validation and error reporting | Normalize CSV/JSON, validate rows, and persist/retrieve actionable row errors. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-021 | Atomic import worker and batch reconciliation | Process each employee atomically, reconcile batch results, and make retries safe. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-022 | HR manual enrollment workspace | Implement the approved HR form-first workspace with its upper-right import area. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-023 | Employee self service enrollment | Implement scoped guided employee enrollment, comparisons, review, and confirmation. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-024 | AI provider governance and Jev feasibility spike | Evaluate provider fit, privacy/security, cost, and Jev's decision-layer role using synthetic data. Details: `docs/product-backlog.md`. | P2 | 2026-10-13 | |
| STORY-025 | AI guided conversation guardrails and fallback | Add optional provider integration with strict scope, confidence thresholds, deterministic fallback, and PII controls. Details: `docs/product-backlog.md`. | P2 | 2026-10-13 | |
| STORY-026 | Accessibility responsive behavior and design system hardening | Make selected experiences accessible and reusable across supported viewports. Details: `docs/product-backlog.md`. | P2 | 2026-10-13 | |
| STORY-027 | Audit history and operational observability | Trace enrollment/import outcomes safely and monitor failures without PII logs. Details: `docs/product-backlog.md`. | P2 | 2026-10-13 | |
| STORY-028 | Enrollment review export and reporting | Deliver authorized enrollment review, export, and reporting. Details: `docs/product-backlog.md`. | P3 | 2026-10-13 | |
| STORY-029 | Pilot release readiness and end to end acceptance | Prepare and approve the first employer pilot across every enabled entrypoint. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-030 | Enrollment identity and storage invariant enforcement | Reject cross-record enrollment-ID collisions and enforce covered-contact ownership in SQLite as well as repositories. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-031 | Transaction isolation and persistence-boundary validation | Add nested savepoint safety and reject invalid limits or incomplete separate-contact addresses before storage. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-032 | Import lifecycle accounting and transition integrity | Make import status changes, counts, row errors, and completion reconciliation consistent and guarded. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-033 | Enrollment selection eligibility and coverage validation | Validate plan, period, premium tier, and covered-contact configuration before any selection is saved. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-034 | Existing-data integrity migration and quarantine | Safely migrate existing SQLite data to new integrity rules and quarantine records requiring remediation. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-035 | Delivery branch governance and protected merging | Require story/bug-linked delivery branches, PR-only merging to main, and enforced branch-name CI validation. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-036 | UI recommendation packet and prototype refinements | Recommend the employee and HR UI directions, document annotated refinements, and prepare prototype requirements. Details: `docs/product-backlog.md`. | P2 | 2026-10-13 | |
| STORY-037 | Mission-control UI foundation and restrained Orbit guide component | Resolved: shared mission-control tokens, semantic status, reduced-motion support, and an accessible, restrained alien spaceship guide in `@benefit/ui`. Details: `docs/product-backlog.md`. | P2 | 2026-10-13 | 2026-10-14 |
| STORY-038 | Orbit Guide shell, bounded scope, and accessible progress | Resolved: fixture-backed employee guide with visible text progress, benefit-only scope, keyboard operation, and a safe off-topic redirect. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | 2026-10-14 |
| STORY-039 | Plan comparison and unambiguous plan selection | Resolved: application-supplied plans use separate Compare and Select actions, selected-state text, and no UI pricing/eligibility calculation. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | 2026-10-14 |
| STORY-040 | Persistent editable enrollment summary | Resolved: plan, dependents, and application-supplied per-pay-period cost remain visible with Change links and dependent correction flow. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | 2026-10-14 |
| STORY-041 | Employee review and final confirmation | Resolved: review distinguishes Save draft from Submit and explains what submission does before protected server persistence is added by STORY-023. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | 2026-10-14 |
| STORY-042 | Enrollment Workbench layout and section rail | Desktop-first single-screen workspace with form primary, upper-right upload card, and a complete/incomplete/blocked section rail using text+icon+counts. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-043 | Editable enrollment form with in-context validation | Real editable HR form with field-level validation and a surfaced contact-ownership guard; UI reflects deterministic rules, does not own them. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-044 | Unsaved-work protection and action hierarchy | Separate Save draft / Review actions, semantic color use, and upload entry that opens preflight without discarding the active draft. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-045 | Import Control Panel preflight and no-records-imported state | Four-stage lifecycle scaffold; file-chosen (CSV/JSON, replace/cancel, no hidden upload) and explicit no-records-committed preflight with validation progress. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-046 | Import row-error review and pre-import review | Row-error view with counts and safe corrective actions, return-to-review, and no import proceeding while rows need attention. Details: `docs/product-backlog.md`. | P1 | 2026-10-13 | |
| STORY-047 | Completed import result and batch-history link | Completed stage showing reconciled totals, completion time, and a link to deferred batch history; UI does not recompute counts. Details: `docs/product-backlog.md`. | P2 | 2026-10-13 | |

## Bugs

| Code | Name | Description | Priority | Date found | Date resolved |
| --- | --- | --- | --- | --- | --- |
| BUG-001 | Seed not idempotent | `seed-employees.ts:68` uses `randomUUID()` for id but fixed `employeeNumber`; re-run bypasses `ON CONFLICT(id)` and hits `UNIQUE(employee_number)` (SQLite errcode 2067). Verified. Fixed: seed reuses existing row's id via `findByEmployeeNumber`. | P1 | 2026-10-12 | 2026-10-12 |
| BUG-002 | DB open fails on missing dir | `db.ts openDatabase` throws `unable to open database file` when the parent dir is absent; default path `./data/benefit.sqlite` fails from the app until `data/` exists. Verified. Fixed: `openDatabase` mkdirs the parent dir (skips `:memory:`). | P1 | 2026-10-12 | 2026-10-12 |
| BUG-003 | Covered contact ownership unchecked | Fixed: enrollment saves validate every covered contact belongs to the enrollment employee before mutation; regression test verifies no partial update. | P3 | 2026-10-12 | 2026-10-13 |
| BUG-004 | New-id save vs unique (employee, period) | Fixed: saves resolve the existing employee/period record and reuse its canonical ID; regression test covers a caller-provided new ID. | P3 | 2026-10-12 | 2026-10-13 |
| BUG-005 | `limit: 0` returns all rows | Fixed: list checks `limit !== undefined`, so zero is honored; regression test added. | P4 | 2026-10-12 | 2026-10-13 |
| BUG-006 | `transaction()` not reentrant | Fixed: nested repository transactions participate in the outer transaction; regression test covers composition. | P4 | 2026-10-12 | 2026-10-13 |
| BUG-007 | Seed script untype-checked | Fixed: scripts are included in the package TypeScript project and seed-data indexing is checked; regression test added. | P4 | 2026-10-12 | 2026-10-13 |
| BUG-008 | `import_row_errors` unreachable | Fixed: import repository now writes and retrieves row errors; integrated persistence regression test added. | P4 | 2026-10-12 | 2026-10-13 |
| BUG-009 | Contact address fabricated | Fixed: contacts living apart require an address on write and incomplete stored addresses raise an error rather than becoming fabricated fields; regression test added. | P4 | 2026-10-12 | 2026-10-13 |
