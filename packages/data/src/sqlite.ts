import { randomUUID } from "node:crypto";

import type {
  Address,
  BenefitKind,
  BenefitPlan,
  Contact,
  ContactId,
  ContactRelationship,
  CoverageTier,
  Employee,
  EmployeeId,
  EmploymentStatus,
  Enrollment,
  EnrollmentId,
  EnrollmentImport,
  EnrollmentPeriod,
  EnrollmentPeriodId,
  EnrollmentSelection,
  EnrollmentStatus,
  ImportId,
  ImportRowError,
  ImportSource,
  ImportStatus,
  IsoDate,
  IsoDateTime,
  PlanId,
  Sex,
} from "@benefit/types";

import type {
  BenefitPlanRepository,
  ContactRepository,
  DataContext,
  DataContextOptions,
  EmployeeRepository,
  EnrollmentImportRepository,
  EnrollmentPeriodRepository,
  EnrollmentRepository,
} from "./index";
import { openDatabase, transaction, type Db } from "./db";
import { assertContactAddress, assertValidLimit } from "./validation";

const bool = (n: unknown): boolean => n === 1 || n === true;
const bit = (b: boolean): number => (b ? 1 : 0);
const now = (): IsoDateTime => new Date().toISOString() as IsoDateTime;

/* ---------- row shapes ---------- */

interface EmployeeRow {
  id: string;
  employee_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string;
  sex: string;
  ssn_token: string | null;
  ssn_last4: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  hire_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ContactRow {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: string;
  relationship: string;
  ssn_token: string | null;
  ssn_last4: string | null;
  lives_with_employee: number;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

/* ---------- mappers ---------- */

function rowToEmployee(r: EmployeeRow): Employee {
  return {
    id: r.id as EmployeeId,
    employeeNumber: r.employee_number,
    firstName: r.first_name,
    middleName: r.middle_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    dateOfBirth: r.date_of_birth as IsoDate,
    sex: r.sex as Sex,
    ssnToken: r.ssn_token,
    ssnLast4: r.ssn_last4,
    address: {
      line1: r.address_line1,
      line2: r.address_line2,
      city: r.city,
      state: r.state,
      postalCode: r.postal_code,
      country: r.country,
    },
    hireDate: r.hire_date as IsoDate,
    status: r.status as EmploymentStatus,
    createdAt: r.created_at as IsoDateTime,
    updatedAt: r.updated_at as IsoDateTime,
  };
}

function rowToContact(r: ContactRow): Contact {
  const livesWithEmployee = bool(r.lives_with_employee);
  if (!livesWithEmployee && (!r.address_line1 || !r.city || !r.state || !r.postal_code || !r.country)) {
    throw new Error(`Contact ${r.id} does not live with employee and has an incomplete address.`);
  }
  const address: Address | null = livesWithEmployee
    ? null
    : {
        line1: r.address_line1!,
        line2: r.address_line2,
        city: r.city!,
        state: r.state!,
        postalCode: r.postal_code!,
        country: r.country!,
      };
  return {
    id: r.id as ContactId,
    employeeId: r.employee_id as EmployeeId,
    firstName: r.first_name,
    lastName: r.last_name,
    dateOfBirth: r.date_of_birth as IsoDate,
    sex: r.sex as Sex,
    relationship: r.relationship as ContactRelationship,
    ssnToken: r.ssn_token,
    ssnLast4: r.ssn_last4,
    livesWithEmployee,
    address,
    createdAt: r.created_at as IsoDateTime,
    updatedAt: r.updated_at as IsoDateTime,
  };
}

/* ---------- context ---------- */

export function createSqliteDataContext(options?: DataContextOptions): DataContext {
  const path =
    options?.path ?? process.env.BENEFIT_DB_PATH ?? "./data/benefit.sqlite";
  const db = openDatabase(path);

  return {
    employees: makeEmployeeRepo(db),
    contacts: makeContactRepo(db),
    plans: makePlanRepo(db),
    periods: makePeriodRepo(db),
    enrollments: makeEnrollmentRepo(db),
    imports: makeImportRepo(db),
    close: () => db.close(),
  };
}

function makeEmployeeRepo(db: Db): EmployeeRepository {
  const upsert = db.prepare(`
    INSERT INTO employees (
      id, employee_number, first_name, middle_name, last_name, email, phone,
      date_of_birth, sex, ssn_token, ssn_last4, address_line1, address_line2,
      city, state, postal_code, country, hire_date, status, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      employee_number=excluded.employee_number, first_name=excluded.first_name,
      middle_name=excluded.middle_name, last_name=excluded.last_name,
      email=excluded.email, phone=excluded.phone, date_of_birth=excluded.date_of_birth,
      sex=excluded.sex, ssn_token=excluded.ssn_token, ssn_last4=excluded.ssn_last4,
      address_line1=excluded.address_line1, address_line2=excluded.address_line2,
      city=excluded.city, state=excluded.state, postal_code=excluded.postal_code,
      country=excluded.country, hire_date=excluded.hire_date, status=excluded.status,
      updated_at=excluded.updated_at
  `);
  const byId = db.prepare("SELECT * FROM employees WHERE id = ?");
  const byNumber = db.prepare("SELECT * FROM employees WHERE employee_number = ?");

  return {
    async findById(id) {
      const r = byId.get(id) as EmployeeRow | undefined;
      return r ? rowToEmployee(r) : null;
    },
    async findByEmployeeNumber(employeeNumber) {
      const r = byNumber.get(employeeNumber) as EmployeeRow | undefined;
      return r ? rowToEmployee(r) : null;
    },
    async list(params) {
      assertValidLimit(params?.limit); // STORY-031: reject negative/non-integer/unsafe limits
      const clauses: string[] = [];
      const args: Array<string | number> = [];
      if (params?.status) {
        clauses.push("status = ?");
        args.push(params.status);
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const limit = params?.limit !== undefined ? "LIMIT ?" : "";
      if (params?.limit !== undefined) args.push(params.limit);
      const rows = db
        .prepare(`SELECT * FROM employees ${where} ORDER BY last_name, first_name ${limit}`)
        .all(...args) as unknown as EmployeeRow[];
      return rows.map(rowToEmployee);
    },
    async upsert(e) {
      const a = e.address;
      upsert.run(
        e.id, e.employeeNumber, e.firstName, e.middleName, e.lastName, e.email,
        e.phone, e.dateOfBirth, e.sex, e.ssnToken, e.ssnLast4, a.line1, a.line2,
        a.city, a.state, a.postalCode, a.country, e.hireDate, e.status,
        e.createdAt, e.updatedAt,
      );
      return e;
    },
  };
}

function makeContactRepo(db: Db): ContactRepository {
  const upsert = db.prepare(`
    INSERT INTO contacts (
      id, employee_id, first_name, last_name, date_of_birth, sex, relationship,
      ssn_token, ssn_last4, lives_with_employee, address_line1, address_line2,
      city, state, postal_code, country, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      employee_id=excluded.employee_id, first_name=excluded.first_name,
      last_name=excluded.last_name, date_of_birth=excluded.date_of_birth,
      sex=excluded.sex, relationship=excluded.relationship,
      ssn_token=excluded.ssn_token, ssn_last4=excluded.ssn_last4,
      lives_with_employee=excluded.lives_with_employee,
      address_line1=excluded.address_line1, address_line2=excluded.address_line2,
      city=excluded.city, state=excluded.state, postal_code=excluded.postal_code,
      country=excluded.country, updated_at=excluded.updated_at
  `);
  const byId = db.prepare("SELECT * FROM contacts WHERE id = ?");
  const byEmployee = db.prepare(
    "SELECT * FROM contacts WHERE employee_id = ? ORDER BY date_of_birth",
  );

  return {
    async findById(id) {
      const r = byId.get(id) as ContactRow | undefined;
      return r ? rowToContact(r) : null;
    },
    async listForEmployee(employeeId) {
      const rows = byEmployee.all(employeeId) as unknown as ContactRow[];
      return rows.map(rowToContact);
    },
    async upsert(c) {
      // STORY-031: a separate-residence contact needs a complete, non-blank
      // address before persistence, so stored rows always round-trip.
      assertContactAddress(c);
      const a = c.address;
      upsert.run(
        c.id, c.employeeId, c.firstName, c.lastName, c.dateOfBirth, c.sex,
        c.relationship, c.ssnToken, c.ssnLast4, bit(c.livesWithEmployee),
        a?.line1 ?? null, a?.line2 ?? null, a?.city ?? null, a?.state ?? null,
        a?.postalCode ?? null, a?.country ?? null, c.createdAt, c.updatedAt,
      );
      return c;
    },
  };
}

function makePlanRepo(db: Db): BenefitPlanRepository {
  const upsertPlan = db.prepare(`
    INSERT INTO benefit_plans (id, kind, name, carrier, plan_year, active)
    VALUES (?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      kind=excluded.kind, name=excluded.name, carrier=excluded.carrier,
      plan_year=excluded.plan_year, active=excluded.active
  `);
  const delPremiums = db.prepare("DELETE FROM plan_premiums WHERE plan_id = ?");
  const insPremium = db.prepare(
    "INSERT INTO plan_premiums (plan_id, tier, premium_cents) VALUES (?,?,?)",
  );
  const byId = db.prepare("SELECT * FROM benefit_plans WHERE id = ?");
  const premiumsFor = db.prepare(
    "SELECT tier, premium_cents FROM plan_premiums WHERE plan_id = ?",
  );

  const hydrate = (r: {
    id: string;
    kind: string;
    name: string;
    carrier: string;
    plan_year: number;
    active: number;
  }): BenefitPlan => {
    const premiumRows = premiumsFor.all(r.id) as Array<{
      tier: string;
      premium_cents: number;
    }>;
    const premiumCentsByTier: Partial<Record<CoverageTier, number>> = {};
    for (const p of premiumRows) premiumCentsByTier[p.tier as CoverageTier] = p.premium_cents;
    return {
      id: r.id as PlanId,
      kind: r.kind as BenefitKind,
      name: r.name,
      carrier: r.carrier,
      planYear: r.plan_year,
      premiumCentsByTier,
      active: bool(r.active),
    };
  };

  return {
    async findById(id) {
      const r = byId.get(id) as Parameters<typeof hydrate>[0] | undefined;
      return r ? hydrate(r) : null;
    },
    async list(params) {
      const clauses: string[] = [];
      const args: Array<string | number> = [];
      if (params?.planYear) {
        clauses.push("plan_year = ?");
        args.push(params.planYear);
      }
      if (params?.activeOnly) clauses.push("active = 1");
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const rows = db
        .prepare(`SELECT * FROM benefit_plans ${where} ORDER BY kind, name`)
        .all(...args) as Array<Parameters<typeof hydrate>[0]>;
      return rows.map(hydrate);
    },
    async upsert(plan) {
      transaction(db, () => {
        upsertPlan.run(
          plan.id, plan.kind, plan.name, plan.carrier, plan.planYear, bit(plan.active),
        );
        delPremiums.run(plan.id);
        for (const [tier, cents] of Object.entries(plan.premiumCentsByTier)) {
          if (cents != null) insPremium.run(plan.id, tier, cents);
        }
      });
      return plan;
    },
  };
}

function makePeriodRepo(db: Db): EnrollmentPeriodRepository {
  const upsert = db.prepare(`
    INSERT INTO enrollment_periods (id, name, plan_year, opens_at, closes_at, type)
    VALUES (?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, plan_year=excluded.plan_year, opens_at=excluded.opens_at,
      closes_at=excluded.closes_at, type=excluded.type
  `);
  const byId = db.prepare("SELECT * FROM enrollment_periods WHERE id = ?");

  return {
    async findById(id) {
      const r = byId.get(id) as
        | { id: string; name: string; plan_year: number; opens_at: string; closes_at: string; type: string }
        | undefined;
      if (!r) return null;
      return {
        id: r.id as EnrollmentPeriodId,
        name: r.name,
        planYear: r.plan_year,
        opensAt: r.opens_at as IsoDateTime,
        closesAt: r.closes_at as IsoDateTime,
        type: r.type as EnrollmentPeriod["type"],
      };
    },
    async upsert(p) {
      upsert.run(p.id, p.name, p.planYear, p.opensAt, p.closesAt, p.type);
      return p;
    },
  };
}

function makeEnrollmentRepo(db: Db): EnrollmentRepository {
  const upsertEnrollment = db.prepare(`
    INSERT INTO enrollments (
      id, employee_id, period_id, status, submitted_at, source_import_id,
      created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      status=excluded.status, submitted_at=excluded.submitted_at,
      source_import_id=excluded.source_import_id, updated_at=excluded.updated_at
  `);
  const delSelections = db.prepare(
    "DELETE FROM enrollment_selections WHERE enrollment_id = ?",
  );
  const insSelection = db.prepare(
    "INSERT INTO enrollment_selections (id, enrollment_id, plan_id, kind, tier) VALUES (?,?,?,?,?)",
  );
  const insCovered = db.prepare(
    "INSERT INTO enrollment_selection_contacts (selection_id, contact_id) VALUES (?,?)",
  );
  const byId = db.prepare("SELECT * FROM enrollments WHERE id = ?");
  const byEmployeePeriod = db.prepare(
    "SELECT * FROM enrollments WHERE employee_id = ? AND period_id = ?",
  );
  const selectionsFor = db.prepare(
    "SELECT * FROM enrollment_selections WHERE enrollment_id = ?",
  );
  const coveredFor = db.prepare(
    "SELECT contact_id FROM enrollment_selection_contacts WHERE selection_id = ?",
  );
  const ownedContact = db.prepare(
    "SELECT id FROM contacts WHERE id = ? AND employee_id = ?",
  );

  interface EnrollmentRow {
    id: string;
    employee_id: string;
    period_id: string;
    status: string;
    submitted_at: string | null;
    source_import_id: string | null;
    created_at: string;
    updated_at: string;
  }

  const hydrate = (r: EnrollmentRow): Enrollment => {
    const selRows = selectionsFor.all(r.id) as Array<{
      id: string;
      plan_id: string;
      kind: string;
      tier: string;
    }>;
    const selections: EnrollmentSelection[] = selRows.map((s) => {
      const covered = coveredFor.all(s.id) as Array<{ contact_id: string }>;
      return {
        planId: s.plan_id as PlanId,
        kind: s.kind as BenefitKind,
        tier: s.tier as CoverageTier,
        coveredContactIds: covered.map((c) => c.contact_id as ContactId),
      };
    });
    return {
      id: r.id as EnrollmentId,
      employeeId: r.employee_id as EmployeeId,
      periodId: r.period_id as EnrollmentPeriodId,
      status: r.status as EnrollmentStatus,
      selections,
      submittedAt: (r.submitted_at as IsoDateTime | null) ?? null,
      createdAt: r.created_at as IsoDateTime,
      updatedAt: r.updated_at as IsoDateTime,
      sourceImportId: (r.source_import_id as ImportId | null) ?? null,
    };
  };

  return {
    async findById(id) {
      const r = byId.get(id) as EnrollmentRow | undefined;
      return r ? hydrate(r) : null;
    },
    async findForEmployee(employeeId, periodId) {
      const r = byEmployeePeriod.get(employeeId, periodId) as EnrollmentRow | undefined;
      return r ? hydrate(r) : null;
    },
    async save(enrollment) {
      transaction(db, () => {
        // Validate ownership before mutating the enrollment. A contact can be
        // foreign-key valid yet still belong to another employee.
        for (const selection of enrollment.selections) {
          for (const contactId of selection.coveredContactIds) {
            if (!ownedContact.get(contactId, enrollment.employeeId)) {
              throw new Error(`Covered contact ${contactId} does not belong to employee ${enrollment.employeeId}.`);
            }
          }
        }
        const existing = byEmployeePeriod.get(
          enrollment.employeeId,
          enrollment.periodId,
        ) as EnrollmentRow | undefined;
        if (!existing) {
          // STORY-030: this is a new enrollment for (employee, period). A
          // caller-supplied id that already belongs to a *different*
          // enrollment must not be allowed to hijack that row via ON
          // CONFLICT(id). Reject before any mutation; the message exposes no
          // employee or period identifiers.
          const idOwner = byId.get(enrollment.id) as EnrollmentRow | undefined;
          if (idOwner) {
            throw new Error(
              "Enrollment id is already assigned to a different enrollment and cannot be reused.",
            );
          }
        }
        const persisted = existing
          ? {
              ...enrollment,
              id: existing.id as EnrollmentId,
              createdAt: existing.created_at as IsoDateTime,
            }
          : enrollment;
        upsertEnrollment.run(
          persisted.id, persisted.employeeId, persisted.periodId,
          persisted.status, persisted.submittedAt, persisted.sourceImportId,
          persisted.createdAt, persisted.updatedAt,
        );
        delSelections.run(persisted.id);
        for (const sel of persisted.selections) {
          const selectionId = randomUUID();
          insSelection.run(selectionId, persisted.id, sel.planId, sel.kind, sel.tier);
          for (const contactId of sel.coveredContactIds) {
            insCovered.run(selectionId, contactId);
          }
        }
      });
      const saved = byEmployeePeriod.get(
        enrollment.employeeId,
        enrollment.periodId,
      ) as EnrollmentRow | undefined;
      if (!saved) throw new Error("Enrollment save completed without a persisted enrollment.");
      return hydrate(saved);
    },
  };
}

function makeImportRepo(db: Db): EnrollmentImportRepository {
  const ins = db.prepare(`
    INSERT INTO enrollment_imports (
      id, period_id, source, file_name, storage_ref, status, total_rows,
      processed_rows, error_rows, uploaded_by, created_at, completed_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const setStatus = db.prepare(
    "UPDATE enrollment_imports SET status = ? WHERE id = ?",
  );
  const byId = db.prepare("SELECT * FROM enrollment_imports WHERE id = ?");
  const insRowError = db.prepare(`
    INSERT INTO import_row_errors (import_id, row_number, column_name, code, message)
    VALUES (?,?,?,?,?)
  `);
  const rowErrorsFor = db.prepare(`
    SELECT row_number, column_name, code, message
    FROM import_row_errors
    WHERE import_id = ?
    ORDER BY row_number, column_name, code
  `);

  interface ImportRow {
    id: string;
    period_id: string;
    source: string;
    file_name: string | null;
    storage_ref: string | null;
    status: string;
    total_rows: number;
    processed_rows: number;
    error_rows: number;
    uploaded_by: string;
    created_at: string;
    completed_at: string | null;
  }

  const hydrate = (r: ImportRow): EnrollmentImport => ({
    id: r.id as ImportId,
    periodId: r.period_id as EnrollmentPeriodId,
    source: r.source as ImportSource,
    fileName: r.file_name,
    storageRef: r.storage_ref,
    status: r.status as ImportStatus,
    totalRows: r.total_rows,
    processedRows: r.processed_rows,
    errorRows: r.error_rows,
    uploadedBy: r.uploaded_by,
    createdAt: r.created_at as IsoDateTime,
    completedAt: (r.completed_at as IsoDateTime | null) ?? null,
  });

  return {
    async create(input) {
      const record: EnrollmentImport = {
        ...input,
        id: randomUUID() as ImportId,
        createdAt: now(),
        completedAt: null,
      };
      ins.run(
        record.id, record.periodId, record.source, record.fileName,
        record.storageRef, record.status, record.totalRows, record.processedRows,
        record.errorRows, record.uploadedBy, record.createdAt, record.completedAt,
      );
      return record;
    },
    async findById(id) {
      const r = byId.get(id) as ImportRow | undefined;
      return r ? hydrate(r) : null;
    },
    async updateStatus(id, status) {
      setStatus.run(status, id);
    },
    async addRowError(importId, error) {
      insRowError.run(importId, error.row, error.column, error.code, error.message);
    },
    async listRowErrors(importId) {
      const rows = rowErrorsFor.all(importId) as Array<{
        row_number: number;
        column_name: string | null;
        code: string;
        message: string;
      }>;
      return rows.map((row) => ({
        row: row.row_number,
        column: row.column_name,
        code: row.code,
        message: row.message,
      }));
    },
  };
}
