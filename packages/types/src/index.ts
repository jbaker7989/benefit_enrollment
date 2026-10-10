/**
 * @benefit/types — shared domain model for benefit enrollment.
 *
 * Provider-agnostic TypeScript types. This is the schema source of truth,
 * shared across the web app, server actions, and import workers. The concrete
 * persistence layer (ORM/DB) is chosen later in `@benefit/data`.
 *
 * Relationships:
 *   Employee 1 ── many Contact   (Contact.employeeId  → Employee.id)
 *   Employee 1 ── many Enrollment (Enrollment.employeeId → Employee.id)
 *   Enrollment ── many EnrollmentSelection ── many Contact
 *                 (EnrollmentSelection.coveredContactIds → Contact.id)
 *
 * PII note: raw SSNs are never stored. Only a tokenized reference (`ssnToken`)
 * and the last four digits (`ssnLast4`, display/verification) are kept.
 */

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type EmployeeId = Brand<string, "EmployeeId">;
export type ContactId = Brand<string, "ContactId">;
export type PlanId = Brand<string, "PlanId">;
export type EnrollmentId = Brand<string, "EnrollmentId">;
export type EnrollmentPeriodId = Brand<string, "EnrollmentPeriodId">;
export type ImportId = Brand<string, "ImportId">;

/** ISO-8601 date string, e.g. "2026-01-01". */
export type IsoDate = Brand<string, "IsoDate">;
/** ISO-8601 datetime string, e.g. "2026-01-01T00:00:00Z". */
export type IsoDateTime = Brand<string, "IsoDateTime">;

export type BenefitKind =
  | "medical"
  | "dental"
  | "vision"
  | "life"
  | "disability"
  | "fsa"
  | "hsa"
  | "401k";

export type CoverageTier =
  | "employee_only"
  | "employee_spouse"
  | "employee_children"
  | "employee_family"
  | "waived";

/** Contacts are dependents — people who may be covered under an election. */
export type ContactRelationship = "spouse" | "domestic_partner" | "child" | "other";

export type Sex = "male" | "female" | "other" | "unspecified";

export type EmploymentStatus = "active" | "terminated" | "on_leave" | "retired";

export type EnrollmentStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "cancelled";

/** Reusable postal address, shared by Employee and Contact. */
export interface Address {
  line1: string;
  line2: string | null;
  city: string;
  /** Two-letter US state/territory code, e.g. "CA". */
  state: string;
  /** ZIP or ZIP+4. */
  postalCode: string;
  /** ISO 3166-1 alpha-2; defaults to "US". */
  country: string;
}

export interface Employee {
  id: EmployeeId;
  /** Employer-assigned identifier used in bulk/API imports. */
  employeeNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: IsoDate;
  sex: Sex;
  /** Tokenized SSN reference; raw SSN is never stored. */
  ssnToken: string | null;
  /** Last four digits of SSN, for display/verification only. */
  ssnLast4: string | null;
  address: Address;
  hireDate: IsoDate;
  status: EmploymentStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/**
 * A dependent of an employee (spouse, child, etc.) who may be elected onto
 * coverage. Each contact belongs to exactly one employee.
 */
export interface Contact {
  id: ContactId;
  /** FK → Employee.id. One employee can have many contacts. */
  employeeId: EmployeeId;
  firstName: string;
  lastName: string;
  dateOfBirth: IsoDate;
  sex: Sex;
  relationship: ContactRelationship;
  /** Tokenized SSN reference; raw SSN is never stored. */
  ssnToken: string | null;
  /** Last four digits of SSN, for display/verification only. */
  ssnLast4: string | null;
  /** When true, the contact shares the employee's address. */
  livesWithEmployee: boolean;
  /** Present only when `livesWithEmployee` is false; otherwise null. */
  address: Address | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface BenefitPlan {
  id: PlanId;
  kind: BenefitKind;
  name: string;
  carrier: string;
  planYear: number;
  /** Monthly premiums in cents, keyed by coverage tier. */
  premiumCentsByTier: Partial<Record<CoverageTier, number>>;
  active: boolean;
}

export interface EnrollmentPeriod {
  id: EnrollmentPeriodId;
  name: string;
  planYear: number;
  opensAt: IsoDateTime;
  closesAt: IsoDateTime;
  /** Open enrollment vs. a qualifying-life-event special enrollment. */
  type: "open" | "special";
}

export interface EnrollmentSelection {
  planId: PlanId;
  kind: BenefitKind;
  tier: CoverageTier;
  /** FK → Contact.id; dependents covered under this election. */
  coveredContactIds: ContactId[];
}

export interface Enrollment {
  id: EnrollmentId;
  employeeId: EmployeeId;
  periodId: EnrollmentPeriodId;
  status: EnrollmentStatus;
  selections: EnrollmentSelection[];
  submittedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  /** Set when this enrollment originated from a bulk/API import. */
  sourceImportId: ImportId | null;
}

/* ---------- Bulk / API import ---------- */

export type ImportSource = "file" | "api";

export type ImportStatus =
  | "uploaded"
  | "validating"
  | "validated"
  | "processing"
  | "completed"
  | "failed";

export interface EnrollmentImport {
  id: ImportId;
  periodId: EnrollmentPeriodId;
  source: ImportSource;
  fileName: string | null;
  /** Storage key/URL for an uploaded file (provider decided later). */
  storageRef: string | null;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  uploadedBy: string;
  createdAt: IsoDateTime;
  completedAt: IsoDateTime | null;
}

export interface ImportRowError {
  row: number;
  column: string | null;
  code: string;
  message: string;
}
