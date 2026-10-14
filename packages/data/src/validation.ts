/**
 * Pure, I/O-free validation helpers for the persistence boundary.
 *
 * These guard repository input *before* it reaches SQLite so callers get a
 * clear, early error instead of a constraint violation (or, worse, a row that
 * cannot be read back). Keeping them pure means they are exercised by small
 * unit tests — see `test/small/validation.test.ts`.
 *
 * STORY-031: list-limit and separate-contact-address validation.
 */
import type { Contact } from "@benefit/types";

/**
 * Validate a repository `limit`. `undefined` means "no limit" and is allowed.
 * Zero is a valid request for no rows. Everything else must be a non-negative
 * safe integer; negative, fractional, NaN, and unsafe values are rejected.
 */
export function assertValidLimit(limit: number | undefined): void {
  if (limit === undefined) return;
  if (typeof limit !== "number" || !Number.isInteger(limit) || !Number.isSafeInteger(limit)) {
    throw new RangeError(`List limit must be a safe integer; received ${String(limit)}.`);
  }
  if (limit < 0) {
    throw new RangeError(`List limit must not be negative; received ${limit}.`);
  }
}

const REQUIRED_ADDRESS_FIELDS = ["line1", "city", "state", "postalCode", "country"] as const;

/** True when `value` is a non-empty, non-whitespace string. */
function isPresent(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * A contact who does not live with the employee must carry a complete mailing
 * address. Every required field must be present and non-blank; `line2` stays
 * optional. A contact who lives with the employee must not carry an address.
 *
 * This never fabricates a value and never includes address contents or other
 * PII in the error message.
 */
export function assertContactAddress(contact: Pick<Contact, "livesWithEmployee" | "address">): void {
  if (contact.livesWithEmployee) {
    return;
  }
  const address = contact.address;
  if (!address) {
    throw new Error("A contact who does not live with the employee must have an address.");
  }
  const missing = REQUIRED_ADDRESS_FIELDS.filter((field) => !isPresent(address[field]));
  if (missing.length > 0) {
    throw new Error(
      `A contact who does not live with the employee is missing required address fields: ${missing.join(", ")}.`,
    );
  }
}
