---
name: benefit-selection
description: >
  Domain skill for benefit enrollment selection workflows. Covers the three
  supported selection paths (employee self-service, HR manual entry, HR bulk
  file upload), file format detection (CSV vs JSON), RBAC placeholders, and
  data-integrity rules that must be enforced when creating enrollments and
  contacts.
---

# Benefit Selection

Use this skill when implementing, reviewing, or debugging anything related to
employee benefit selections, enrollment creation, bulk imports, or
contact/dependent coverage.

## Selection paths

The system supports exactly three ways to create or update an employee's
benefit selections:

1. **Employee self-service** — The authenticated employee can make selections
   for themselves. Later this will be gated by RBAC role `employee`.
2. **HR manual entry** — HR personnel can create or edit a single employee's
   selections. Later this will be gated by RBAC role `hr`.
3. **HR bulk upload** — HR personnel can upload a file containing selections
   for many employees at once. File type is determined by suffix:
   - `.csv` → comma-separated values
   - `.json` → JSON array of enrollment records

## RBAC (deferred)

Authorization is not implemented yet. When it is added:

- Create a `roles` table and associate users with one or more roles.
- Roles needed: `employee` and `hr`.
- The self-service path must restrict the caller to their own `employeeId`.
- The manual and bulk HR paths require role `hr`.

Mark any temporary gaps with: `ponytail: RBAC stub; wire role check when roles table exists`.

## Data integrity rules

These rules must be enforced at the storage layer and validated at import time:

1. **No enrollment without an employee.** Every `enrollments` row must have a
   valid `employee_id` referencing `employees.id`.
2. **No selection without a valid coverage relationship.** Every
   `enrollment_selection_contacts` row must reference a `contacts.id` that
   belongs to the enrollment's employee (`contacts.employee_id ==
   enrollments.employee_id`).
3. **No contact without an employee.** Every `contacts` row must have a valid
   `employee_id` referencing `employees.id`.

Prefer SQLite foreign keys and `NOT NULL` constraints for enforcement, and add
application-level validation for user-facing error messages.

## Bulk file requirements

A bulk upload must include enough data to upsert the employee, their contacts,
and their selections atomically (one transaction per employee). Each record in
the file should map to the storage schema in [`brain/BRAIN.md`](./brain/BRAIN.md).

If an uploaded row references an employee that does not exist, create the
employee first; do not create orphan contacts or selections.

## Chatbot / LLM interface

A future chatbot interface may use an assignable LLM configured via `.env`
(e.g., `BENEFIT_CHATBOT_PROVIDER`, `BENEFIT_CHATBOT_MODEL`). The same three
selection paths and data-integrity rules apply regardless of whether the
caller is a web UI, an import file, or a chatbot-driven agent.
