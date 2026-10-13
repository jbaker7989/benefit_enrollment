/**
 * Seed script: generate 10 employees into the SQLite database.
 *
 * Usage (from repo root):
 *   bun packages/data/scripts/seed-employees.ts
 *   BENEFIT_DB_PATH=./data/benefit.sqlite bun packages/data/scripts/seed-employees.ts
 */

import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { Address, Employee, EmployeeId, EmploymentStatus, IsoDate, IsoDateTime, Sex } from "@benefit/types";

import { createDataContext } from "../src/index.ts";

const dbPath = resolve(process.env.BENEFIT_DB_PATH ?? "./data/benefit.sqlite");
mkdirSync(dirname(dbPath), { recursive: true });

const firstNames = ["James", "Maria", "Robert", "Jennifer", "Michael", "Linda", "William", "Patricia", "David", "Elizabeth"];
const middleNames = ["A", "M", "J", "R", "K", "E", "L", "T", "S", "D"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
const cities = [
  { city: "Austin", state: "TX", postalCode: "78701" },
  { city: "Seattle", state: "WA", postalCode: "98101" },
  { city: "Denver", state: "CO", postalCode: "80202" },
  { city: "Atlanta", state: "GA", postalCode: "30303" },
  { city: "Boston", state: "MA", postalCode: "02101" },
  { city: "Portland", state: "OR", postalCode: "97201" },
  { city: "Phoenix", state: "AZ", postalCode: "85001" },
  { city: "Nashville", state: "TN", postalCode: "37201" },
  { city: "Chicago", state: "IL", postalCode: "60601" },
  { city: "Raleigh", state: "NC", postalCode: "27601" },
];
const sexes: Sex[] = ["male", "female", "other", "unspecified"];
const statuses: EmploymentStatus[] = ["active", "active", "active", "active", "active", "active", "active", "terminated", "on_leave", "retired"];

function isoDate(year: number, month: number, day: number): IsoDate {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` as IsoDate;
}

function isoDateTime(): IsoDateTime {
  return new Date().toISOString() as IsoDateTime;
}

function makeEmployee(index: number): Employee {
  const dobYear = 1960 + Math.floor(Math.random() * 36);
  const dobMonth = 1 + Math.floor(Math.random() * 12);
  const dobDay = 1 + Math.floor(Math.random() * 28);
  const hireYear = 2015 + Math.floor(Math.random() * 9);
  const hireMonth = 1 + Math.floor(Math.random() * 12);
  const hireDay = 1 + Math.floor(Math.random() * 28);
  const location = cities[index];
  const address: Address = {
    line1: `${1000 + index * 123} Main St`,
    line2: index % 3 === 0 ? `Apt ${100 + index}` : null,
    city: location.city,
    state: location.state,
    postalCode: location.postalCode,
    country: "US",
  };
  const firstName = firstNames[index];
  const lastName = lastNames[index];
  const employeeNumber = `EMP-${String(index + 1).padStart(3, "0")}`;
  const now = isoDateTime();

  return {
    id: randomUUID() as EmployeeId,
    employeeNumber,
    firstName,
    middleName: middleNames[index],
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: `555-01${index + 10}`,
    dateOfBirth: isoDate(dobYear, dobMonth, dobDay),
    sex: sexes[index % sexes.length],
    ssnToken: randomUUID(),
    ssnLast4: `${1000 + Math.floor(Math.random() * 9000)}`,
    address,
    hireDate: isoDate(hireYear, hireMonth, hireDay),
    status: statuses[index],
    createdAt: now,
    updatedAt: now,
  };
}

const ctx = createDataContext({ path: dbPath });

try {
  for (let i = 0; i < 10; i++) {
    const draft = makeEmployee(i);
    // Idempotent re-runs: employee_number is the stable business key, but the
    // DB upsert keys on `id`. Reuse the existing row's id (and original
    // createdAt) so a re-seed updates in place instead of colliding on
    // UNIQUE(employee_number).
    const existing = await ctx.employees.findByEmployeeNumber(draft.employeeNumber);
    const employee = existing
      ? { ...draft, id: existing.id, createdAt: existing.createdAt }
      : draft;
    await ctx.employees.upsert(employee);
  }
  console.log("Seeded 10 employees.");
} finally {
  ctx.close();
}
