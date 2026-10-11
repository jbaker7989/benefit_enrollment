---
name: benefit-selection
description: >
  Domain skill for benefit enrollment selection workflows. Covers the three
  supported selection paths (employee chatbot self-service, HR web form,
  HR bulk file upload), file format detection (CSV vs JSON), RBAC
  placeholders, and data-integrity rules for enrollments and contacts.
---

# Benefit Selection

Use this skill when implementing, reviewing, or debugging anything related to
employee benefit selections, enrollment creation, bulk imports, or
contact/dependent coverage.

For the canonical functional spec and storage schema, read
[`brain/BRAIN.md`](./brain/BRAIN.md) first. Changes to schemas, flows, or
procedures must be reflected there.

## Selection paths

The system supports exactly three ways to create or update an employee's
benefit selections:

1. **Employee chatbot self-service** — The authenticated employee makes selections
   through a chatbot interface. Later this will be gated by RBAC role `employee`
   and the caller must be restricted to their own `employeeId`.
2. **HR manual input form** — HR personnel use a web form to create or edit a
   single employee's selections. Later this will be gated by RBAC role `hr`.
3. **HR bulk upload** — HR personnel upload a file containing selections for
   many employees at once. File type is determined by suffix:
   - `.csv` → comma-separated values
   - `.json` → JSON array of enrollment records

## RBAC (deferred)

Authorization is not implemented yet. When it is added:

- Create a `roles` table and associate users with one or more roles.
- Roles needed at minimum: `employee` and `hr`.
- Self-service is allowed only for role `employee` and only for the caller's own
  `employeeId`.
- Manual input and bulk upload require role `hr`.

Mark any temporary gaps with: `ponytail: RBAC stub; wire role check when roles table exists`.

## Data integrity rules

These rules must be enforced at the storage layer and validated at import time:

1. **No enrollment without an employee.** Every `enrollments` row must have a
   valid `employee_id` referencing `employees.id`.
2. **No contact without an employee.** Every `contacts` row must have a valid
   `employee_id` referencing `employees.id`.
3. **No selection covering a contact that does not belong to the employee.**
   Every `enrollment_selection_contacts` row must reference a `contacts.id`
   whose `employee_id` matches the parent enrollment's `employee_id`.

Prefer SQLite foreign keys and `NOT NULL` constraints for enforcement, and add
application-level validation for user-facing error messages.

## Bulk upload requirements

A bulk upload must include enough data to upsert the employee, their contacts,
and their selections atomically (one transaction per employee). Each record in
the file should map to the storage schema in `brain/BRAIN.md`.

If an uploaded row references an employee that does not exist, create the
employee first; do not create orphan contacts or selections.

## Chatbot / LLM interface

A future chatbot interface may use an assignable LLM configured via `.env`
(e.g., `BENEFIT_CHATBOT_PROVIDER`, `BENEFIT_CHATBOT_MODEL`). It must only
support **employee self-service selections**. The chatbot must not be used for
HR manual input or bulk upload.
