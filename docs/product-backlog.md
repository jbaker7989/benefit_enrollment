# New Employee Enrollment Product Backlog

- **Owner:** Product and Engineering
- **Status:** Proposed delivery backlog
- **Last updated:** 2026-10-14
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

Review follow-ons: STORY-030 and STORY-031 must land before any new write
path; STORY-048 and STORY-049 close uncovered storage-invariant paths before
those writes can be trusted; STORY-032 gates the import worker; STORY-033
extends the plan/period work before selections are exposed; STORY-034 is
required before a pilot uses an existing database.
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

### STORY-030 Enrollment identity and storage invariant enforcement

**Priority:** P1
**Outcome:** A caller cannot cause an enrollment ID to update another
employee's enrollment, and the database itself prevents a covered contact from
belonging to a different employee than the enrollment.

**Scope:** Harden enrollment upsert identity handling so a caller-supplied ID
that is already assigned to a different `(employeeId, periodId)` is rejected
before any mutation. Add SQLite-level enforcement (for example, triggers) for
the covered-contact ownership rule, while retaining repository validation for
clear user-facing errors. Design and version the schema migration for existing
databases; do not expose employee details in constraint errors or logs.

**Acceptance criteria:**

- Saving with an enrollment ID owned by a different employee or period fails
  without changing that enrollment, its selections, or its contacts.
- The database rejects an `enrollment_selection_contacts` write that crosses
  employee ownership, including a write issued outside the repository.
- Valid same-employee enrollment saves and valid contact coverage continue to
  work through all three selection paths.
- The canonical schema and selection-integrity specification in `brain/BRAIN.md`
  and `.agents/skills/benefit-selection/SKILL.md` are updated with the storage
  enforcement and migration approach.

**Test plan:** Small schema/constraint tests; integrated collision, rollback,
and direct-SQL constraint tests against in-memory SQLite; large entrypoint
regression tests when a web/import write path is added.

### STORY-031 Transaction isolation and persistence-boundary validation

**Priority:** P1
**Outcome:** Nested repository work is atomic even when an inner failure is
caught, and invalid repository input cannot create records that later fail to
read.

**Scope:** Replace nested transaction participation with savepoint semantics,
or otherwise prevent an outer transaction from committing inner partial writes
after a caught error. Validate repository limits as non-negative safe integers.
Require complete, non-blank address fields whenever a contact does not live
with the employee, before persistence. Define safe handling for legacy
incomplete addresses without fabricating values or logging PII.

**Acceptance criteria:**

- A caught inner transaction failure rolls back only its work; the outer
  transaction can continue safely and cannot commit the inner partial write.
- List limits reject negative, non-integer, and unsafe values; zero remains a
  valid request for no rows.
- A contact with `livesWithEmployee: false` and any absent or blank required
  address field is rejected before persistence.
- Persisted contact data created through supported repositories always
  round-trips without address-mapping errors.

**Test plan:** Small input-validation and savepoint-behavior tests; integrated
in-memory SQLite tests for caught nested failures, invalid limits, invalid
addresses, and read-back behavior. Add a large test if a service boundary
begins a transaction and recovers from row-level failures.

### STORY-032 Import lifecycle accounting and transition integrity

**Priority:** P1
**Outcome:** Import status, completion time, and row counts truthfully reflect
the batch outcome and cannot be moved through invalid lifecycle states.

**Scope:** Define the allowed import-status state machine; make status changes,
row-error recording, processed/error counts, and completion timestamps
transactionally consistent. Reject updates to missing imports and invalid
status transitions. Preserve detailed row errors without assuming one error per
row or exposing PII.

**Acceptance criteria:**

- Each supported transition is explicit; invalid, backward, or terminal-state
  transitions are rejected.
- Recording row results updates the appropriate counts exactly once and cannot
  produce a completed import whose counts contradict its recorded outcome.
- An import cannot be completed until its accounting reconciles with its total
  rows; completion timestamp behavior is deterministic and idempotent.
- Missing-import updates fail safely and do not create orphan error records.

**Test plan:** Small lifecycle-transition and count-reconciliation tests;
integrated in-memory SQLite tests for success, row-error, retry, duplicate,
and missing-import paths; large worker test when STORY-021 is implemented.

### STORY-033 Enrollment selection eligibility and coverage validation

**Priority:** P1
**Outcome:** Every saved selection is compatible with the plan, enrollment
period, premium tier, and covered-contact configuration it represents.

**Scope:** Extend STORY-016 with repository-level validation that the plan
exists, is active, matches the declared benefit kind and the enrollment period's
plan year, and has a premium for the chosen tier. Define and enforce coverage
tier rules for employee-only, waived, employee-plus-one, and family selections,
including how covered contacts affect each tier. Reject saves outside a valid
open period except for explicitly documented draft behavior.

**Acceptance criteria:**

- A selection with an unknown, inactive, wrong-kind, wrong-year, or
unpriced-tier plan is rejected before mutation.
- Period-open and allowed-draft behavior is explicit, deterministic, and
enforced on every selection path.
- Covered-contact counts and relationships comply with the documented tier
rules; a waived or employee-only selection cannot cover dependents.
- Validation errors identify the safe corrective action without leaking another
employee's information.

**Test plan:** Small eligibility, period-window, and tier-rule tests;
integrated in-memory SQLite tests for rejected and valid saves; large API,
manual-form, and import validation journeys as those entrypoints land.

### STORY-034 Existing-data integrity migration and quarantine

**Priority:** P1 before pilot
**Outcome:** Existing SQLite databases can adopt the strengthened integrity
rules without silently retaining unreadable or unsafe records.

**Scope:** Inventory current database versions and define an idempotent,
observable migration path for STORY-030 through STORY-033. Detect records that
violate newly enforced invariants, quarantine them from normal selection flows,
and give authorized HR operations a non-PII remediation record. Do not invent
missing address or enrollment data during migration.

**Acceptance criteria:**

- A supported existing database upgrades exactly once to the current schema
  without losing valid enrollment data.
- Records that cannot satisfy a new invariant are excluded from normal use,
  are traceable to an authorized operator, and have a documented remediation
  path.
- Re-running the migration is safe and leaves the database in the same state.
- Migration logs and remediation output avoid raw SSNs and unnecessary PII.

**Test plan:** Small migration-planning and record-classification tests;
integrated fixtures for valid upgrade, invalid legacy address, cross-employee
coverage, and idempotent re-run; large upgrade rehearsal against a temporary
on-disk database before pilot.

### STORY-048 Complete enrollment-ID collision rejection

**Priority:** P1
**Outcome:** A caller-supplied enrollment ID that belongs to a different
enrollment is always rejected before any mutation, including when the supplied
employee/period business key already exists.

**Scope:** Complete the STORY-030 identity guard. Check supplied enrollment-ID
ownership independently of whether `(employeeId, periodId)` resolves to an
existing record. Retain the documented behavior that a genuinely new supplied
ID is ignored in favor of the canonical ID for an existing business key, but
never let an ID already owned by another record be silently accepted. Keep
errors generic and free of employee, period, and enrollment identifiers.

**Acceptance criteria:**

- Saving an absent employee/period pair with an ID owned elsewhere fails
  without mutating any enrollment.
- Saving an existing employee/period pair while supplying an ID owned by a
  different enrollment also fails without changing either record or its
  selections.
- Saving an existing employee/period pair with a new, unassigned supplied ID
  still updates the canonical enrollment selected by the business key.
- The identity behavior is documented consistently in `brain/BRAIN.md` and
  `.agents/skills/benefit-selection/SKILL.md`.

**Test plan:** Small identity-resolution tests; integrated in-memory SQLite
regressions for both collision paths, no-mutation assertions, and the valid
new-ID update path. Add a large regression if an API or import entrypoint is
changed to expose this save operation.

### STORY-049 Preserve covered-contact ownership across parent updates

**Priority:** P1
**Outcome:** Once coverage is linked, no supported repository operation or
direct SQLite update can make the covered contact belong to a different
employee than the parent enrollment.

**Scope:** Complete the STORY-030 database invariant for transitive updates.
Guard the ownership-changing columns on `contacts`, `enrollments`, and
`enrollment_selections`, in addition to insert/update of
`enrollment_selection_contacts`; or use an equivalent schema design that makes
an invalid state unrepresentable. Ensure contact reassignment has an explicit,
safe policy when the contact is already covered. Constraint errors must remain
generic and contain no PII.

**Acceptance criteria:**

- Reassigning a covered contact to another employee is rejected atomically;
  the original coverage link remains valid and unchanged.
- Direct updates that change an enrollment's employee or a selection's parent
  cannot create cross-employee coverage.
- Valid contact edits that do not alter ownership, and valid same-employee
  coverage writes, continue to succeed.
- The canonical schema and selection-integrity documentation enumerate every
  guarded mutation path.

**Test plan:** Small schema-trigger/constraint tests; integrated in-memory
SQLite regressions for repository contact reassignment and raw-SQL parent-row
updates, including no-mutation assertions and valid control cases. Add a large
test if a write entrypoint is introduced or changed.

### STORY-035 Delivery branch governance and protected merging

**Priority:** P1
**Outcome:** Every change is traceable to a backlog item and reaches `main`
only through a reviewable, validated pull request.

**Scope:** Require all delivery branches to include their `STORY-###` or
`BUG-###` identifier; add a pull-request branch-name check; document the agent
workflow; and configure repository protection on `main` to require pull
requests and passing checks. Define a documented owner-authorized emergency
exception and its follow-up record.

**Acceptance criteria:**

- A pull request from a branch without a `story-###` or `bug-###` identifier
  fails the required branch-name check.
- `main` is protected remotely so direct pushes and direct local merges cannot
  bypass the pull-request workflow.
- Contributors can find the naming convention and required merge procedure in
  the repository steering contract and delivery-governance skill.
- Every approved exception is explicitly authorized and linked to a follow-up
  backlog item.

**Test plan:** Validate representative passing and failing branch names in the
CI job; manually verify the repository ruleset blocks a direct push to `main`.

### STORY-036 UI recommendation packet and prototype refinements

**Priority:** P2
**Outcome:** Executives and stakeholders can approve one coherent employee and
HR experience, with the high-risk interaction and accessibility changes ready
for prototype delivery.

**Scope:** Review the UI proposal packet; document a recommended employee and
HR direction with annotated future-state visuals; and turn the accepted changes
into prototype requirements. Preserve the light mission-control visual system
and alien spaceship guide with green status lights.

**Acceptance criteria:**

- The stakeholder packet recommends one primary employee and HR direction and
  identifies which alternate concepts are retained as supporting patterns.
- The recommendation includes visual changes for validation errors, review,
  confirmation, upload lifecycle, and reduced-motion behavior.
- The resulting implementation brief preserves desktop-first HR usage and the
  upper-right upload area without risking unsaved manual work.

**Test plan:** Executive and end-user review of the rendered packet; usability
prototype validation is defined before implementation work begins.

## UI implementation stories from the recommendation packet

These stories decompose the approved directions in
`docs/review-artifacts/New_Employee_Enrollment_UI_Recommendation_Packet.docx`
into small, independently shippable **front-end** slices. They implement the
screens and states the packet depicts: the employee **Orbit Guide**, the HR
**Enrollment Workbench**, and the **Import Control Panel** preflight mode.

Scope boundary for every story below: the UI presents and collects; it never
decides. Plan eligibility, coverage-tier rules, payroll deduction, period
status, contact ownership, import counts, and final persistence stay in the
referenced data/validation stories (STORY-016, STORY-019–021, STORY-030,
STORY-032, STORY-033) and must not be delegated to the UI or to AI. Each story
names its parent epic (STORY-022 Workbench, STORY-023 Orbit Guide) and may be
built behind a flag against seeded fixtures before its server path exists.

### STORY-037 Mission-control UI foundation and restrained Orbit guide component

**Priority:** P2
**Status:** Resolved 2026-10-14 — fixture-backed UI foundation; parent stories own production data and persistence.
**Parent/relates:** STORY-026, STORY-036
**Outcome:** Shared `@benefit/ui` primitives render the light mission-control
visual system consistently, with status communicated by text and icon rather
than color or motion alone.

**Scope:** Promote the repeated patterns into `@benefit/ui`: the light
mission-control palette as tokens; semantic status styles where **green is
reserved for success/status only** and the primary-action color is distinct;
typography, spacing, and focus/disabled/loading/error/status states; a
reduced-motion token. Implement the alien spaceship with green status lights as
a quiet, decorative **guide** component that exposes text status and honors
`prefers-reduced-motion` — a restrained accent, never a competing mascot.

**Acceptance criteria:**

- Status is never conveyed by color alone; every state has a text/icon form.
- The guide component renders a still, equivalent state under reduced motion and
  carries an accessible name; it never blocks or narrates the flow.
- Primary-action and success/status colors are visually distinct tokens, reused
  by the employee and HR surfaces.

**Test plan:** Small token/variant and reduced-motion component tests;
integrated contrast and accessible-name checks.

### STORY-038 Orbit Guide shell, bounded benefit scope, and accessible progress

**Priority:** P1
**Status:** Resolved 2026-10-14 — fixture-backed employee shell; authenticated server integration remains in STORY-023.
**Parent:** STORY-023
**Outcome:** The employee moves through a focused, benefit-only guided
conversation whose scope and position are always understandable without relying
on animation or color.

**Scope:** Build the guide conversation layout with a visible step count and
text status for each state (profile/dependents, plan choice, tier, review,
confirmation, handoff). Frame the assistant's bounded role. Redirect unrelated
prompts to the correct team with a safe handoff; do not emit a general answer.
Step state is owned by the application, not the model.

**Acceptance criteria:**

- The current step, total steps, and next action are shown as text at every
  stage; the orbit treatment is decorative and reduced-motion safe.
- Off-topic input produces a redirect/handoff, never a general-purpose answer.
- The shell is fully keyboard operable with visible focus and status messaging.

**Test plan:** Small step-indicator and off-topic-routing tests; integrated
keyboard/first-run journey against seeded data.

### STORY-039 Plan comparison and unambiguous plan selection

**Priority:** P1
**Status:** Resolved 2026-10-14 — displays application-supplied fixture data only; catalog eligibility remains in STORY-016 and STORY-033.
**Parent:** STORY-023 (data via STORY-016, STORY-033)
**Outcome:** An employee can compare plans and then select one without
confusing "compare" with the act of selecting.

**Scope:** Render plan cards from application-supplied, already-eligible plan
and premium data. Make the selected card and the primary **Select** action
unmistakable; keep **Compare** as a clearly secondary action. The UI displays
only approved comparisons and never computes eligibility or price.

**Acceptance criteria:**

- The selected plan is visually and programmatically distinct (not color alone);
  the primary selection action is distinct from comparison.
- Comparison can be opened and dismissed without changing the current selection.
- Plan/premium values shown come from the application; the UI performs no
  eligibility or pricing math.

**Test plan:** Small selection-state and action-hierarchy tests; integrated
render-from-fixture and select-persist tests.

### STORY-040 Persistent editable enrollment summary with dependents and live cost

**Priority:** P1
**Status:** Resolved 2026-10-14 — UI summary maps supplied values and does not calculate eligibility or pricing.
**Parent:** STORY-023
**Outcome:** The employee always sees their plan, covered dependents, and
per-pay-period cost, and can correct any of them before submitting.

**Scope:** A persistent summary panel showing selected plan(s), covered
dependents, and the application-computed per-pay-period deduction, each with a
**Change** link back to the relevant step. Include adding/correcting a covered
dependent so the change follows through to the affected selection. The
application computes cost and eligibility; the summary only displays them.

**Acceptance criteria:**

- Cost, plan, and covered dependents are visible before submission and update
  when a selection or dependent changes.
- Correcting a covered dependent updates the correct selection's coverage.
- Displayed deduction is the application's computed value, never derived in the
  UI or by a model.

**Test plan:** Small summary-mapping and change-link tests; integrated
dependent-correction follow-through tests.

### STORY-041 Employee review and final confirmation

**Priority:** P1
**Status:** Resolved 2026-10-14 — confirmation prototype; protected persistence remains in STORY-023.
**Parent:** STORY-023
**Outcome:** Before anything is persisted, the employee reviews exactly what
will be submitted and understands what submission does.

**Scope:** A final review state listing selected plans, covered dependents, and
the calculated payroll deduction, with an explicit, distinct **Submit** versus
**Save draft** action and plain-language text of what happens on submit.
Submission itself is a deterministic application action.

**Acceptance criteria:**

- The review shows selected plans, covered dependents, and computed deduction
  prior to persistence.
- Submit and Save draft are separate, clearly labeled actions; neither is
  conveyed by color alone.
- The screen states what submission will do before it is triggered.

**Test plan:** Small review-content and action-separation tests; integrated
confirm-before-persist journey.

### STORY-042 Enrollment Workbench layout and accessible section rail

**Priority:** P1  
**Parent:** STORY-022  
**Outcome:** An HR operator can scan, on one desktop-first screen, which parts
of an enrollment are complete, incomplete, or blocked before review.

**Scope:** Implement the Workbench shell: the manual form owns most of the
workspace and the upload card sits in the upper right. Build the section rail
communicating complete/incomplete/blocked using text, icon, and error counts
together — never red/green alone — at supported desktop widths.

**Acceptance criteria:**

- Each section shows its state with text + icon + count; color is never the only
  signal.
- The layout keeps the form primary and the upload card in the upper right at
  agreed desktop widths.
- The rail is keyboard navigable and announces section state to assistive tech.

**Test plan:** Small rail-state tests; integrated layout/responsive and
keyboard-navigation tests at supported widths.

### STORY-043 Editable enrollment form with in-context validation and contact-ownership guard

**Priority:** P1  
**Parent:** STORY-022 (rules via STORY-030, STORY-033)  
**Outcome:** HR makes accurate manual edits on a real editable form, with errors
shown in place and cross-employee coverage prevented with a clear correction.

**Scope:** A genuine editable field surface (not a dashboard of summary cards)
for employee, dependents, and elections, with field-level in-context validation
and a dedicated review action retained. Surface the server/data-layer rejection
when a selection would cover a contact outside the employee's record, with the
safe corrective action. The UI reflects deterministic rules; it does not own
them.

**Acceptance criteria:**

- Validation errors appear next to the offending field and clear when resolved.
- Attempting to cover a contact outside the employee's record is blocked and
  explained; no part of the enrollment is changed.
- A distinct review action is available separate from editing.

**Test plan:** Small field-validation and error-mapping tests; integrated
contact-ownership rejection and review-gate tests.

### STORY-044 Unsaved-work protection, action hierarchy, and upload entry

**Priority:** P1  
**Parent:** STORY-022, STORY-019  
**Outcome:** Opening import never interrupts or loses active manual work, and
draft-saving is clearly separated from final review.

**Scope:** Reserve green for success/status and use the primary-action color for
**Save draft** and **Review enrollment** as distinct actions. The upper-right
upload card opens the Import Control Panel in a panel or route while the draft
stays in place; prompt before navigating away from unsaved edits.

**Acceptance criteria:**

- Save draft and Review enrollment are distinct actions following the semantic
  color rule.
- Opening the upload area preserves the active draft; the operator is asked
  before any navigation that would discard unsaved work.
- Returning from preflight restores the in-progress enrollment unchanged.

**Test plan:** Small action-hierarchy tests; integrated unsaved-change prompt and
draft-preservation tests.

### STORY-045 Import Control Panel preflight shell and no-records-imported state

**Priority:** P1  
**Parent:** STORY-019, STORY-020  
**Outcome:** HR can choose a file and see, unambiguously, that validation is in
progress and that **no records have been imported yet**.

**Scope:** Build the four-stage lifecycle scaffold (File chosen → Preflight →
Rows need attention → Completed) and implement the first two stages: show the
selected file's type and name, support CSV and JSON, allow replacing or
cancelling the selection with no hidden upload, and present a Preflight state
that explicitly says no records are committed while showing validation progress.

**Acceptance criteria:**

- The chosen file's type and filename are visible; selection can be replaced or
  cancelled without committing anything.
- The Preflight state states plainly that no records have been imported and
  shows validation progress.
- The lifecycle stage is shown as text, not by color alone.

**Test plan:** Small stage-indicator and file-selection tests; integrated
preflight-state and cancel/replace tests.

### STORY-046 Import row-error review and pre-import review

**Priority:** P1  
**Parent:** STORY-020  
**Outcome:** When rows need attention, HR sees the counts and can take safe
corrective action before any import proceeds.

**Scope:** Implement the "Rows need attention" and pre-import review stages: a
row-error view with per-row/column messages and error counts, safe corrective
actions, and a return path to review. No import can proceed while rows need
attention. Row-error content comes from STORY-020.

**Acceptance criteria:**

- Error counts and per-row details are visible before import; messages contain
  no raw PII.
- Corrective actions and a return-to-review path are available; proceeding is
  blocked until outstanding rows are resolved or explicitly excluded.
- The view is keyboard operable and announces counts to assistive tech.

**Test plan:** Small row-error rendering/count tests; integrated
block-until-resolved and return-to-review tests.

### STORY-047 Completed import result and batch-history link

**Priority:** P2  
**Parent:** STORY-021  
**Outcome:** After an import, HR can verify what succeeded, what failed, and
what needs follow-up.

**Scope:** Implement the Completed stage: reconciled totals (succeeded, failed,
needs-follow-up), completion time, and a link to batch history. Batch Inbox is
deferred (STORY-010 family), so the link targets a placeholder/history stub
until a queue is warranted.

**Acceptance criteria:**

- Reconciled totals and completion time reflect the application's import
  accounting (STORY-032); the UI does not recompute counts.
- Failed and follow-up rows are distinguishable and lead to their details.
- The batch-history affordance is present and clearly a history view, not a live
  queue.

**Test plan:** Small result-mapping tests; integrated completed-state rendering
from reconciled fixtures.

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
