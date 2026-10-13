/**
 * INTEGRATED test: openDatabase against the real filesystem (temp dirs).
 * This is the direct regression for BUG-002 — the caller must NOT have to
 * pre-create the parent directory.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openDatabase } from "../../src/db";

describe("openDatabase (integrated, filesystem)", () => {
  const tempRoots: string[] = [];
  afterAll(() => {
    for (const root of tempRoots) rmSync(root, { recursive: true, force: true });
  });

  // BUG-002: node:sqlite throws "unable to open database file" when the parent
  // directory is absent; openDatabase must create it on demand.
  test("creates missing parent directories (BUG-002)", () => {
    const root = mkdtempSync(join(tmpdir(), "benefit-db-"));
    tempRoots.push(root);
    const dbPath = join(root, "nested", "deep", "benefit.sqlite");

    const db = openDatabase(dbPath);
    db.close();

    expect(existsSync(dbPath)).toBe(true);
  });

  test(":memory: opens without touching the filesystem", () => {
    const db = openDatabase(":memory:");
    expect(() => db.exec("SELECT 1;")).not.toThrow();
    db.close();
  });
});
