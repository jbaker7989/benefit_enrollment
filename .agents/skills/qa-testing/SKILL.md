---
name: qa-testing
description: >
  QA and testing standard for the benefit enrollment platform. Defines the
  three test sizes (small / integrated / large), when each is required, where
  tests live, how to run them, and the rule that every new story or bug ships
  with tests at the appropriate levels before it can be marked resolved.
---

# QA & Testing

Use this skill whenever you add a feature (story) or fix a defect (bug), review
someone else's change, or touch test infrastructure or CI. It is the authority
on **what to test and at which level**. The companion tracker is
[`docs/project-log.md`](../../../docs/project-log.md); the enforcement gate is
[`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml).

## Runner & layout

- Runner: **`bun test`** (Bun's built-in runner). Fast, zero-config, TS-native.
- Orchestrated through Turbo: `bun run test` at the repo root runs the `test`
  task in every package that defines one.
- Tests live under `packages/<pkg>/test/`, split by size:

  ```
  packages/<pkg>/test/
    small/        unit tests        *.test.ts
    integrated/   integration tests *.test.ts
    large/        end-to-end tests  *.test.ts
    fixtures.ts   shared builders (not a test file)
  ```

- Name files `*.test.ts`. Keep non-test helpers out of that pattern so the
  runner ignores them (e.g. `fixtures.ts`).
- Reference the bug/story code in a comment or test name when a test exists to
  guard a specific item, e.g. `// BUG-002 regression`.

## The three test sizes

Pick the **smallest** size that can actually exercise the behavior. Smaller
tests are faster, more numerous, and pinpoint failures; larger tests are fewer
and prove the pieces work together.

### Small (unit)

- **Scope:** one function or module in isolation.
- **May use:** pure, in-process logic only.
- **Must NOT use:** database, filesystem, network, subprocesses, env, clock
  randomness you don't control.
- **Example:** asserting the generated DDL string declares the right tables and
  constraints (`test/small/schema.test.ts`).

### Integrated (integration)

- **Scope:** several units working together through a real in-process
  dependency.
- **May use:** an **in-memory SQLite** database (`createDataContext({ path:
  ":memory:" })`), or a temp directory for filesystem behavior.
- **Must NOT use:** the network, external services, or spawning other
  processes.
- **Example:** repository round-trips and foreign-key enforcement
  (`test/integrated/*.test.ts`), and `openDatabase` creating missing parent
  directories against a temp dir.

### Large (end-to-end)

- **Scope:** a whole entrypoint across a process/service boundary.
- **May use:** subprocesses (`Bun.spawn`), the real CLI/app, temp databases on
  disk, longer timeouts.
- **Example:** running `bun scripts/seed-employees.ts` twice as a subprocess
  and asserting idempotency (`test/large/seed-e2e.test.ts`).
- Keep these few and deterministic. Clean up temp artifacts in `afterAll`.

## Requirements — every story and every bug

A change is **not done** until its tests exist and pass. Record the item in
`docs/project-log.md`; only fill its **Date resolved** once the tests are green.

### New bug (BUG-###)

1. Write a **failing** regression test first, at the smallest size that
   reproduces the defect. Confirm it fails on the unfixed code.
2. Apply the fix; confirm the test now passes.
3. If the bug crossed a boundary (CLI, service, filesystem), add a **large**
   test that reproduces it end-to-end in addition to the focused one.
4. Name/annotate the test with the bug code.

### New story (STORY-###)

- **Minimum:** small tests for the new pure logic **and** integrated tests for
  its data/persistence behavior.
- **Add a large test** when the story introduces or changes an entrypoint that
  runs across a process or service boundary (a CLI, an API route, an import
  worker).
- Cover the unhappy paths: validation failures, constraint/FK violations, and
  the data-integrity rules in [`brain/BRAIN.md`](../../../brain/BRAIN.md) and
  the [`benefit-selection`](../benefit-selection/SKILL.md) skill (no orphan
  contacts/selections; a selection may only cover the employee's own contacts).

## Running tests

```bash
bun run test                         # all packages, via Turbo
cd packages/data && bun test         # one package
bun test test/small                  # one size
bun test test/integrated/db-open.test.ts   # one file
bun test --watch                     # watch mode while developing
```

## CI gate

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`,
executing — in order — `typecheck`, `lint`, `build`, then `test`. A red gate
blocks merge. Do not weaken, skip, or `.only`/`.skip` tests to make CI pass;
fix the code or the test.

## Definition of done (checklist)

- [ ] Smallest-size test(s) added for the new/changed behavior.
- [ ] Integrated test(s) for any data or persistence behavior.
- [ ] Large test(s) if a process/service boundary was added or changed.
- [ ] Unhappy paths and data-integrity rules covered.
- [ ] `bun run test` (and `typecheck`, `lint`, `build`) pass locally.
- [ ] `docs/project-log.md` row added/updated; **Date resolved** set only when green.
