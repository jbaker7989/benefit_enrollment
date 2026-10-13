/**
 * Shared test fixtures. Build valid domain records with sensible defaults and
 * per-field overrides, so each test states only what it cares about.
 *
 * Not a test file (no assertions) — Bun's runner ignores it.
 */
import { randomUUID } from "node:crypto";

import type {
  BenefitPlan,
  Contact,
  ContactId,
  Employee,
  EmployeeId,
  Enrollment,
  EnrollmentId,
  EnrollmentPeriod,
  EnrollmentPeriodId,
  IsoDate,
  IsoDateTime,
  PlanId,
} from "@benefit/types";

const now = (): IsoDateTime => new Date().toISOString() as IsoDateTime;
const date = (s: string): IsoDate => s as IsoDate;

export function makeEmployee(over: Partial<Employee> = {}): Employee {
  const ts = now();
  return {
    id: randomUUID() as EmployeeId,
    employeeNumber: `EMP-${randomUUID().slice(0, 8)}`,
    firstName: "Test",
    middleName: null,
    lastName: "Employee",
    email: "test.employee@example.com",
    phone: null,
    dateOfBirth: date("1990-01-01"),
    sex: "unspecified",
    ssnToken: null,
    ssnLast4: null,
    address: {
      line1: "1 Main St",
      line2: null,
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      country: "US",
    },
    hireDate: date("2020-01-01"),
    status: "active",
    createdAt: ts,
    updatedAt: ts,
    ...over,
  };
}

export function makeContact(employeeId: EmployeeId, over: Partial<Contact> = {}): Contact {
  const ts = now();
  return {
    id: randomUUID() as ContactId,
    employeeId,
    firstName: "Dependent",
    lastName: "Employee",
    dateOfBirth: date("2015-01-01"),
    sex: "unspecified",
    relationship: "child",
    ssnToken: null,
    ssnLast4: null,
    livesWithEmployee: true,
    address: null,
    createdAt: ts,
    updatedAt: ts,
    ...over,
  };
}

export function makePlan(over: Partial<BenefitPlan> = {}): BenefitPlan {
  return {
    id: randomUUID() as PlanId,
    kind: "medical",
    name: "PPO 1000",
    carrier: "Acme Health",
    planYear: 2026,
    premiumCentsByTier: { employee_only: 10000, employee_children: 20000, employee_family: 30000 },
    active: true,
    ...over,
  };
}

export function makePeriod(over: Partial<EnrollmentPeriod> = {}): EnrollmentPeriod {
  return {
    id: randomUUID() as EnrollmentPeriodId,
    name: "Open Enrollment 2026",
    planYear: 2026,
    opensAt: now(),
    closesAt: now(),
    type: "open",
    ...over,
  };
}

export function makeEnrollment(
  employeeId: EmployeeId,
  periodId: EnrollmentPeriodId,
  over: Partial<Enrollment> = {},
): Enrollment {
  const ts = now();
  return {
    id: randomUUID() as EnrollmentId,
    employeeId,
    periodId,
    status: "draft",
    selections: [],
    submittedAt: null,
    createdAt: ts,
    updatedAt: ts,
    sourceImportId: null,
    ...over,
  };
}
