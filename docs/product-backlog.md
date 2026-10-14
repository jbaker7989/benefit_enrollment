# New Employee Enrollment Product Backlog

- **Owner:** Product and Engineering
- **Status:** Proposed delivery backlog
- **Last updated:** 2026-10-13
- **Audience:** Product, Design, Engineering, HR operations, Security
- **Related decisions:** ADR 0001; `brain/BRAIN.md`; UI proposals in `docs/review-artifacts/`
- **Next review trigger:** Before committing to the first employee or HR production pilot

## Purpose and planning assumptions

This is the implementation backlog for the New Employee Enrollment app. It
turns the functional specification and reviewed UI directions into small,
independently reviewable stories. The priority order is deliberate: no
employee or HR selection flow should be shipped before identity, data
integrity, and the import failure path are safe.

Assumptions to validate before a production pilot:

1. The first release supports one employer, one active enrollment period, and
   desktop-first HR users.
2. Employee self-service is limited to the authenticated employee's own
   enrollment. HR can work with any employee record.
3. The existing SQLite adapter remains appropriate for local and single-instance
   environments; a networked database is required before a serverless or
   multi-instance deployment.
4. AI is optional. It may guide employee self-service, but may not determine
   eligibility, premiums, data integrity, or final persistence.

## Delivery rules

- Every story follows `.agents/skills/qa-testing/SKILL.md`: small and integrated
  tests are required; add a large test for API routes, upload processing,
  workers, or other process boundaries.
- Tests must cover unhappy paths and all three data-integrity rules: no orphan
  enrollment, no orphan contact, and no selection covering another employee's
  contact.
- Do not log employee PII or commit real enrollment files. Raw SSNs are never
  accepted for storage.
- A story is only complete when its tests pass, the corresponding row in
  `docs/project-log.md` has a resolved date, and its acceptance criteria are
  demonstrably met.

## Sequence and dependencies

```text
Foundation and decisions
  STORY-008 Auth decision ─┬─ STORY-017 RBAC ─────────┬─ STORY-023 Employee enrollment
  STORY-009 File storage ──┼─ STORY-019 Upload intake ┼─ STORY-020 Import validation ─ STORY-021 Import worker
  STORY-015 Data integrity ┘                           │
  STORY-016 Plans and periods ─────────────────────────┼─ STORY-022 HR workspace ────┘
  STORY-018 Security and privacy ──────────────────────┤
  STORY-024 AI governance ─ STORY-025 Guided chat ─────┘

Cross-cutting release work: STORY-026 accessibility, STORY-027 auditability,
STORY-028 reporting, STORY-029 pilot readiness.
```

## Existing open stories to refine before implementation

| Code | Required outcome | Dependency or decision |
| --- | --- | --- |
| STORY-008 | Select and document an auth provider and session model. | ADR 0001; security review |
| STORY-009 | Select and implement secure import-file storage. | Retention and access policy |
| STORY-010 | Decide whether an MCP integration is needed after core web/API flows work. | Product demand; API authorization |
| STORY-011 | Deliver the programmatic import endpoint and worker. | STORY-020 and STORY-021 |
| STORY-012 | Wire the established data layer to protected web routes/server actions. | STORY-017; STORY-022; STORY-023 |

## Planned stories

### STORY-015 Data integrity and repository corrective release

**Priority:** P1  
**Outcome:** Every persisted enrollment is internally consistent, and current
repository defects cannot corrupt, hide, or misrepresent enrollment data.

**Scope:** Resolve BUG-003 through BUG-009. Enforce contact ownership for every
covered contact, make enrollment saves correct for `(employeeId, periodId)`,
honor list limits, support safe composition of transactions, type-check seed
scripts, expose import-row errors, and reject impossible dependent addresses.

**Acceptance criteria:**

- A selection containing a contact owned by another employee is rejected before
  commit; no part of that enrollment is changed.
- Saving the same employee/period creates or updates exactly one enrollment.
- Import row errors can be recorded and retrieved by import ID and row number.
- Existing behavior remains compatible with the domain types and schema.

**Test plan:** Small validation tests; integrated SQLite transaction and
foreign-key tests; large seed regression test where applicable.

### STORY-016 Benefit catalog and enrollment period administration

**Priority:** P1  
**Outcome:** The app can present only active, correctly priced plans inside a
valid enrollment period.

**Scope:** Establish an HR-authorized way to create/update plans, premiums, and
periods; seed non-production fixtures; define the rule for closed periods.

**Acceptance criteria:**

- Active plans are filtered by plan year and expose premiums for the selected
  coverage tier.
- A submission is rejected when the period is closed, absent, or incompatible
  with the selected plan year.
- The UI has an explicit empty state when a period has no eligible plans.

**Test plan:** Small period/window and premium-selection tests; integrated
repository tests; large route test if an admin entrypoint is added.

### STORY-017 Authentication authorization and role enforcement

**Priority:** P1  
**Outcome:** Each write path is protected by an authenticated identity and the
correct role.

**Scope:** Complete STORY-008; add role mapping and protected-route policy.
Mark deferred work with the existing RBAC-stub convention only until this
story is complete.

**Acceptance criteria:**

- An employee may read and change only their own enrollment and contacts.
- An HR user may work with permitted employee records and imports.
- Unauthenticated and unauthorized requests return safe, non-PII responses.
- Server-side checks exist independently of UI visibility.

**Test plan:** Small policy tests; integrated authenticated data-access tests;
large route tests for employee and HR boundaries.

### STORY-018 Security privacy retention and audit decision

**Priority:** P1  
**Outcome:** A production-ready handling policy exists for employee PII,
imports, audit events, deletion/retention, and vendor data processing.

**Scope:** Define encryption and secret-management expectations; approve data
retention and deletion rules; document required audit events; determine whether
SQLite deployment limits require a database migration; complete vendor review
for any AI or file-storage provider.

**Acceptance criteria:**

- A documented policy defines what is stored, for how long, who may access it,
  and how it is deleted.
- Audit events include actor, action, target type/ID, timestamp, and outcome;
  they do not contain raw PII or secrets.
- Deployment architecture is approved for the intended production topology.

**Test plan:** Small PII-redaction/logging tests; integrated audit-persistence
tests when implemented; security review evidence attached to the story.

### STORY-019 HR file-upload intake

**Priority:** P1  
**Outcome:** HR can securely upload one CSV or JSON batch from the upper-right
upload area of the enrollment workspace.

**Scope:** Complete STORY-009; validate suffix and file size; create an
`EnrollmentImport` record; store only a secure reference; show uploaded,
validating, failed, and complete states.

**Acceptance criteria:**

- Only `.csv` and `.json` files are accepted, selected solely by suffix.
- Unsupported, empty, unreadable, and oversized uploads show actionable errors
  and never create partial employee records.
- HR can see the batch filename, status, counts, and row-error summary.

**Test plan:** Small suffix/size tests; integrated import-record and storage
adapter tests; large upload-route test with a temporary file.

### STORY-020 Import parsing validation and error reporting

**Priority:** P1  
**Outcome:** Each uploaded or API record is normalized and validated before it
can affect enrollment data.

**Scope:** Parse CSV and JSON-array payloads; validate required employee,
contact, plan, tier, and period data; write `import_row_errors`; prepare a
downloadable error report.

**Acceptance criteria:**

- CSV and JSON choose the correct parser by suffix and produce the same
normalized record shape.
- Errors include row number, optional column, machine-readable code, and a
safe human-readable message.
- Validation identifies an invalid dependent/employee relationship before a
selection is written.

**Test plan:** Small parser and validation fixture tests; integrated
import-error repository tests; large malformed-file entrypoint test.

### STORY-021 Atomic import worker and batch reconciliation

**Priority:** P1  
**Outcome:** A batch processes employee records reliably: each employee is
upserted with contacts and selections in one transaction, while failures are
contained to the affected employee record.

**Scope:** Create the planned `services/enrollment-import-worker`; implement
status transitions and idempotency; reconcile totals and completion status.

**Acceptance criteria:**

- For each valid record, employee, contacts, enrollment, selections, and
  selection-contact links commit together or not at all.
- A failed employee record produces errors without creating orphan contacts or
  selections and without corrupting a different employee's record.
- Reprocessing the same batch is idempotent or explicitly refused with a clear
  state; counts reconcile to the source rows.

**Test plan:** Small state-transition tests; integrated per-employee rollback
tests; large worker test using a temporary database and input file.

### STORY-022 HR manual enrollment workspace

**Priority:** P1  
**Outcome:** HR can find an employee, update dependents and elections, review
costs, save a draft, and submit a single enrollment in the approved desktop
workspace.

**Scope:** Implement the recommended Enrollment Workbench direction: broad
manual form, section rail, persistent summary, and upper-right file-upload
area. The form and upload are separate operations within one workspace.

**Acceptance criteria:**

- HR can create or edit an employee enrollment for a selected period.
- The form prevents a selection from covering a contact outside the employee's
  record and explains the correction.
- Save-draft, validation-error, empty, loading, and submitted states are
  accessible and visible.
- The upload area directs HR to STORY-019 without replacing unsaved form work.

**Test plan:** Small form-state/selection mapping tests; integrated protected
save tests; large browser/API flow once the entrypoint exists.

### STORY-023 Employee self-service enrollment

**Priority:** P1  
**Outcome:** An employee can complete only their own enrollment through a
guided, benefit-only conversation and review it before submission.

**Scope:** Implement the recommended Orbit Guide direction: explicit step
progress, approved plan comparisons, a live enrollment summary, and a final
confirmation summary. The experience may not answer unrelated prompts or
perform HR actions.

**Acceptance criteria:**

- The employee can only affect their authenticated employee ID.
- The conversation has explicit states for profile/dependents, plan choice,
  coverage tier, review, confirmation, and handoff.
- Off-topic text is redirected to benefit enrollment; it does not trigger a
  general-answer response.
- Submission presents selected plans, covered dependents, and calculated
  payroll deductions before persistence.

**Test plan:** Small state-machine and off-topic-routing tests; integrated
self-service persistence tests; large authenticated browser/API journey.

### STORY-024 AI provider governance and Jev feasibility spike

**Priority:** P2  
**Outcome:** The team can make an evidence-based decision on whether to use an
AI provider and, specifically, whether Jev is appropriate as a structured
decision layer.

**Scope:** Compare providers; complete a privacy/security/DPA and retention
review; define an input-minimization contract; prototype Jev only with
synthetic data. Jev is not a text-generating chat model, so it can classify
scope, choose a next approved step, and report confidence—not generate final
benefits advice.

**Acceptance criteria:**

- The decision record names the chat text provider, if any, and whether Jev is
  approved, rejected, or deferred.
- A synthetic evaluation measures on-topic classification, next-step choice,
  low-confidence escalation, latency, and cost against deterministic rules.
- No raw SSN, real enrollment record, or unnecessary PII is sent to any
  external model during the spike or future runtime use.

**Test plan:** Small schema/input-minimization tests; integrated provider
adapter contract tests with mocks; manual security and procurement approval.

### STORY-025 AI-guided conversation guardrails and fallback

**Priority:** P2  
**Outcome:** If AI is approved, it makes the guided conversation more helpful
without becoming an authority on benefits or escaping the defined task.

**Scope:** Provider abstraction; allowed-topic classifier; response templates
and retrieval boundaries; confidence thresholds; deterministic fallback;
human/HR handoff. This story depends on STORY-023 and the outcome of
STORY-024.

**Acceptance criteria:**

- The application, not the model, computes eligibility, premium, period,
  contact ownership, and final submission rules.
- Low-confidence, unsafe, unavailable, or off-topic requests take a safe
  deterministic path with an appropriate handoff.
- Prompts, tool calls, and model output are not logged with PII.
- The provider can be disabled without blocking the guided enrollment flow.

**Test plan:** Small guardrail and threshold tests; integrated mocked-provider
tests; large degraded-provider journey.

### STORY-026 Accessibility responsive behavior and design-system hardening

**Priority:** P2  
**Outcome:** The selected employee and HR experiences are usable with keyboard,
screen reader, zoom, and smaller desktop/tablet viewports.

**Scope:** Promote repeated UI patterns into `@benefit/ui`; define error,
focus, disabled, loading, status, and responsive behavior; test semantic form
labels and contrast.

**Acceptance criteria:**

- All interactive controls have accessible names, visible focus, keyboard
  operation, and status messaging.
- The HR workspace remains usable at agreed supported desktop widths; the
  employee experience has a documented responsive layout.
- Color is never the only way to communicate success, warning, or error.

**Test plan:** Small component tests; integrated accessibility checks; large
keyboard-only journeys at supported viewports.

### STORY-027 Audit history and operational observability

**Priority:** P2  
**Outcome:** Support and compliance teams can trace enrollment and import
outcomes without exposing sensitive details in logs.

**Scope:** Implement the audit-event decision from STORY-018; record enrollment
submission, import lifecycle, failure, and authorization events; add health
metrics and alerts for failed batches.

**Acceptance criteria:**

- A permitted operator can see when, by whom, and through which source an
  enrollment changed.
- Import status, processed/error counts, and retry outcome are observable.
- Operational logs contain identifiers and safe metadata, never raw SSNs or
  full employee records.

**Test plan:** Small event-shape/redaction tests; integrated audit repository
tests; large failed-import observability test.

### STORY-028 Enrollment review export and reporting

**Priority:** P3  
**Outcome:** Authorized HR users can review completed elections and export
approved operational data safely.

**Scope:** Define report fields, filters, export format, audit behavior, and
access constraints. Do not expose raw SSNs or unsupported PII fields.

**Acceptance criteria:**

- HR can filter enrollment outcomes by period and status.
- Exported records match persisted selections and covered contacts.
- Every export is authorized, auditable, and contains only approved columns.

**Test plan:** Small export-mapping tests; integrated filtered-query tests;
large authorized-export route test.

### STORY-029 Pilot release readiness and end-to-end acceptance

**Priority:** P1 before pilot  
**Outcome:** The first employer pilot has explicit launch approval, trained
operators, a support path, and evidence that the three enrollment paths work.

**Scope:** Define pilot scope and success metrics; prepare synthetic rehearsal
data; run end-to-end acceptance for employee self-service, HR manual entry,
file import, and API import if STORY-011 is in pilot scope; document rollback
and incident response.

**Acceptance criteria:**

- Each enabled path has a passing end-to-end acceptance script and an owner.
- HR receives a row-error remediation guide and employee support escalation
path.
- Security, product, engineering, and HR operations explicitly approve pilot
readiness; unresolved risks have owners and dates.

**Test plan:** Large acceptance tests for every enabled entrypoint plus a
documented manual operational rehearsal.

## Deferred until evidence or a product decision exists

| Item | Why deferred | Revisit trigger |
| --- | --- | --- |
| MCP server (STORY-010) | It does not enable a core employee/HR workflow. | A named integration customer or internal automation need. |
| API import (STORY-011) | It adds a high-risk external write path. | A verified partner/API use case and auth design. |
| Multi-employer tenancy | No tenant model or requirements exist. | Second employer/customer onboarding. |
| Mobile-first HR workspace | Current direction is desktop-first. | Field research shows recurring HR mobile use. |
| AI production rollout | Provider and PII handling are undecided. | STORY-024 approval and successful synthetic evaluation. |

## Backlog health check

Before moving a story into delivery, confirm its owner, design reference,
dependency status, API/data contract, test plan, and release metric. If a
story changes the selection schema, import procedure, or integrity rules,
update both `brain/BRAIN.md` and `.agents/skills/benefit-selection/SKILL.md` in
the same change.
