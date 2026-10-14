/**
 * @benefit/data — data-access layer.
 *
 * Decision (ADR 0001): storage is SQLite, accessed through Node's built-in
 * `node:sqlite` driver (see `db.ts`). Callers depend on the repository
 * interfaces below and never touch SQL directly, so the backing store can be
 * swapped (better-sqlite3, Postgres, …) without changing the app.
 */

import type {
  BenefitPlan,
  Contact,
  ContactId,
  Employee,
  EmployeeId,
  EmploymentStatus,
  Enrollment,
  EnrollmentId,
  EnrollmentImport,
  EnrollmentPeriod,
  EnrollmentPeriodId,
  ImportId,
  ImportRowError,
  ImportStatus,
  PlanId,
} from "@benefit/types";

import { createSqliteDataContext } from "./sqlite";

export interface EmployeeRepository {
  findById(id: EmployeeId): Promise<Employee | null>;
  findByEmployeeNumber(employeeNumber: string): Promise<Employee | null>;
  list(params?: { status?: EmploymentStatus; limit?: number }): Promise<Employee[]>;
  upsert(employee: Employee): Promise<Employee>;
}

export interface ContactRepository {
  findById(id: ContactId): Promise<Contact | null>;
  listForEmployee(employeeId: EmployeeId): Promise<Contact[]>;
  upsert(contact: Contact): Promise<Contact>;
}

export interface BenefitPlanRepository {
  findById(id: PlanId): Promise<BenefitPlan | null>;
  list(params?: { planYear?: number; activeOnly?: boolean }): Promise<BenefitPlan[]>;
  upsert(plan: BenefitPlan): Promise<BenefitPlan>;
}

export interface EnrollmentPeriodRepository {
  findById(id: EnrollmentPeriodId): Promise<EnrollmentPeriod | null>;
  upsert(period: EnrollmentPeriod): Promise<EnrollmentPeriod>;
}

export interface EnrollmentRepository {
  findById(id: EnrollmentId): Promise<Enrollment | null>;
  findForEmployee(
    employeeId: EmployeeId,
    periodId: EnrollmentPeriodId,
  ): Promise<Enrollment | null>;
  /** Upsert an enrollment and replace its selections + covered contacts atomically. */
  save(enrollment: Enrollment): Promise<Enrollment>;
}

export interface EnrollmentImportRepository {
  create(
    input: Omit<EnrollmentImport, "id" | "createdAt" | "completedAt">,
  ): Promise<EnrollmentImport>;
  findById(id: ImportId): Promise<EnrollmentImport | null>;
  updateStatus(id: ImportId, status: ImportStatus): Promise<void>;
  addRowError(importId: ImportId, error: ImportRowError): Promise<void>;
  listRowErrors(importId: ImportId): Promise<ImportRowError[]>;
}

/** The composition root the app wires up once at startup. */
export interface DataContext {
  employees: EmployeeRepository;
  contacts: ContactRepository;
  plans: BenefitPlanRepository;
  periods: EnrollmentPeriodRepository;
  enrollments: EnrollmentRepository;
  imports: EnrollmentImportRepository;
  /** Close the underlying database connection. */
  close(): void;
}

export interface DataContextOptions {
  /**
   * Path to the SQLite file. Use ":memory:" for an ephemeral DB (tests).
   * Defaults to `process.env.BENEFIT_DB_PATH` or `./data/benefit.sqlite`.
   */
  path?: string;
}

export function createDataContext(options?: DataContextOptions): DataContext {
  return createSqliteDataContext(options);
}

export { openDatabase, transaction } from "./db";
export type { Db } from "./db";
