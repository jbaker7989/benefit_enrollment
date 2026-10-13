/**
 * LARGE test: runs the seed CLI as a real subprocess, end-to-end, against a
 * temp database whose parent directory does not yet exist. Exercises the whole
 * entrypoint (`bun scripts/seed-employees.ts`) across a process boundary.
 *
 * Regression for BUG-001: running the seed twice must not crash on
 * UNIQUE(employee_number) and must leave exactly 10 employees.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { createDataContext } from "../../src/index";

const PKG_ROOT = resolve(import.meta.dir, "..", "..");
const SEED_SCRIPT = resolve(PKG_ROOT, "scripts", "seed-employees.ts");

async function runSeed(dbPath: string): Promise<{ code: number; stderr: string }> {
  const proc = Bun.spawn(["bun", SEED_SCRIPT], {
    cwd: PKG_ROOT,
    env: { ...process.env, BENEFIT_DB_PATH: dbPath },
    stdout: "pipe",
    stderr: "pipe",
  });
  const code = await proc.exited;
  const stderr = await new Response(proc.stderr).text();
  return { code, stderr };
}

describe("seed-employees end-to-end (large)", () => {
  const tempRoots: string[] = [];
  afterAll(() => {
    for (const root of tempRoots) rmSync(root, { recursive: true, force: true });
  });

  test("seeds into a fresh dir and is idempotent across runs (BUG-001)", async () => {
    const root = mkdtempSync(join(tmpdir(), "benefit-seed-"));
    tempRoots.push(root);
    const dbPath = join(root, "fresh", "benefit.sqlite");

    const run1 = await runSeed(dbPath);
    if (run1.code !== 0) console.error("run 1 stderr:\n", run1.stderr);
    expect(run1.code).toBe(0);

    const run2 = await runSeed(dbPath);
    if (run2.code !== 0) console.error("run 2 stderr:\n", run2.stderr);
    expect(run2.code).toBe(0);

    const ctx = createDataContext({ path: dbPath });
    try {
      expect((await ctx.employees.list()).length).toBe(10);
    } finally {
      ctx.close();
    }
  }, 30_000);
});
