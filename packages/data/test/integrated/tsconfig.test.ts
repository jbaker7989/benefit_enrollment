/** INTEGRATED regression coverage for the seed-script typecheck boundary. */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const packageRoot = resolve(import.meta.dir, "..", "..");

describe("package TypeScript configuration", () => {
  test("includes scripts so seed code is type-checked (BUG-007)", () => {
    const tsconfig = JSON.parse(readFileSync(resolve(packageRoot, "tsconfig.json"), "utf8")) as {
      include?: string[];
    };
    expect(tsconfig.include).toContain("scripts/**/*.ts");
  });
});
