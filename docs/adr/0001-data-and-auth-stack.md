# ADR 0001: Data, auth, and file-storage stack

- **Status:** Accepted (data store); auth & file storage still open
- **Date:** 2026-10-10

## Context

The benefit-enrollment platform stores sensitive employee PII (names, dates of
birth, dependents, benefit selections). Write paths: interactive enrollment,
bulk file import, and API import. Elections must be persisted so they are
referenceable for review, export, and reporting.

## Decision

**Data store: SQLite**, accessed through Node's built-in **`node:sqlite`**
driver.

- Rationale: the app runs on **Node 24** (where `next dev`/`next build`
  execute). `node:sqlite` is built in — zero native dependency, no build
  toolchain — and works in both the Next.js server and Bun-run import workers.
- `better-sqlite3` was the first choice but has **no prebuilt binary for Node
  24 / arm64** in this environment and no `node-gyp` toolchain to compile it, so
  it could not be installed. `node:sqlite` has a near-identical API and is a
  one-module swap if we later want `better-sqlite3`.
- Caveat: `node:sqlite` is marked experimental (emits a startup warning). It is
  stable in practice on Node 24; revisit if we pin an older Node.
- Caveat: SQLite is single-file. Fine for local/dev and single-instance
  deployments; **not** suitable for Vercel serverless (ephemeral FS). If we
  deploy serverless, migrate to a networked DB (Postgres) behind the same
  `@benefit/data` interfaces.

The persistence contract lives in `@benefit/data` as repository interfaces, so
the backing store can change without touching the app. Schema DDL is in
`brain/BRAIN.md` and `packages/data/src/schema.ts`.

## Still open

- **Auth** provider (Clerk, Supabase Auth, Sign in with Vercel, …).
- **File storage** for uploaded bulk-import files (Vercel Blob, Supabase
  Storage, …).

## Consequences

- No ORM and no provider SDK are dependencies; `@benefit/data` uses `node:sqlite`
  directly behind its interfaces.
- Per-employee access control, encryption at rest, audit logging, and retention
  still need design when auth and (if needed) a networked DB are chosen.
