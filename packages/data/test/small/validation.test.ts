/**
 * SMALL test: pure persistence-boundary validators. No database, no I/O.
 * Guards STORY-031 input rules (list limits, separate-contact addresses).
 */
import { describe, expect, test } from "bun:test";

import type { Address } from "@benefit/types";

import { assertContactAddress, assertValidLimit } from "../../src/validation";

const fullAddress: Address = {
  line1: "10 Elm St",
  line2: null,
  city: "Denver",
  state: "CO",
  postalCode: "80202",
  country: "US",
};

describe("assertValidLimit (small)", () => {
  test("undefined means no limit and is allowed", () => {
    expect(() => assertValidLimit(undefined)).not.toThrow();
  });

  test("zero is a valid request for no rows", () => {
    expect(() => assertValidLimit(0)).not.toThrow();
  });

  test("positive safe integers are allowed", () => {
    expect(() => assertValidLimit(1)).not.toThrow();
    expect(() => assertValidLimit(1000)).not.toThrow();
  });

  test("negative limits are rejected", () => {
    expect(() => assertValidLimit(-1)).toThrow(RangeError);
  });

  test("non-integer limits are rejected", () => {
    expect(() => assertValidLimit(2.5)).toThrow(RangeError);
    expect(() => assertValidLimit(Number.NaN)).toThrow(RangeError);
    expect(() => assertValidLimit(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  test("unsafe integers are rejected", () => {
    expect(() => assertValidLimit(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe("assertContactAddress (small)", () => {
  test("a contact living with the employee needs no address", () => {
    expect(() => assertContactAddress({ livesWithEmployee: true, address: null })).not.toThrow();
  });

  test("a separate-residence contact with a complete address passes", () => {
    expect(() => assertContactAddress({ livesWithEmployee: false, address: fullAddress })).not.toThrow();
  });

  test("a separate-residence contact with no address is rejected", () => {
    expect(() => assertContactAddress({ livesWithEmployee: false, address: null })).toThrow(
      /must have an address/i,
    );
  });

  test("a separate-residence contact with a blank required field is rejected", () => {
    expect(() =>
      assertContactAddress({ livesWithEmployee: false, address: { ...fullAddress, city: "   " } }),
    ).toThrow(/missing required address fields/i);
  });

  test("the rejection names only the missing field names, no address values", () => {
    let message = "";
    try {
      assertContactAddress({
        livesWithEmployee: false,
        address: { ...fullAddress, line1: "", postalCode: "" },
      });
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain("line1");
    expect(message).toContain("postalCode");
    // Values that ARE present must not leak into the message.
    expect(message).not.toContain("Denver");
    expect(message).not.toContain("CO");
  });
});
