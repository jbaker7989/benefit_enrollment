# Domain examples

Illustrative JSON for the core enrollment objects. All data is fake. These
examples mirror the types in [`@benefit/types`](../../packages/types/src/index.ts),
which is the schema source of truth.

## Objects and relationships

```
Employee ──1:many── Contact          Contact.employeeId → Employee.id
Employee ──1:many── Enrollment        Enrollment.employeeId → Employee.id
Enrollment ──1:many── EnrollmentSelection
EnrollmentSelection ──many:many── Contact   coveredContactIds[] → Contact.id
```

- **Employee** — the covered worker. Owns one address; identifiers are stored
  as a token + last-4 (`ssnToken`, `ssnLast4`), never a raw SSN.
- **Contact** — a *dependent* (spouse, child, domestic partner, other) who can
  be elected onto coverage. Belongs to one employee. Carries its own address
  only when `livesWithEmployee` is `false`.
- **Enrollment** — an employee's elections for a period. Each
  `EnrollmentSelection` names a plan, a coverage tier, and the specific
  contacts covered — this is how an election "follows through" to dependents.

See [`enrollment.example.json`](./enrollment.example.json) for a full instance
(one employee, a spouse and a child, and a submitted enrollment covering them).

> Benefit plan catalog (which plans/carriers exist) is defined by `BenefitPlan`
> and will be fleshed out later; `BenefitKind` currently covers medical, dental,
> vision, life, disability, FSA, HSA, and 401(k).
