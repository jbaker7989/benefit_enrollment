# services/

Independently deployable backend processes — primarily **async workers** for
the integrated-backend architecture (ADR 0001). Interactive API logic lives in
`apps/web` (Route Handlers / Server Actions); this directory is for work that
must run outside a request/response cycle.

Planned first service:

- **enrollment-import-worker** — consumes uploaded bulk-enrollment files,
  validates rows against `@benefit/types`, and writes results through
  `@benefit/data`. A good fit for Vercel Queues + Functions.

Each service is its own workspace package (`services/<name>/package.json`) and
is picked up by the root `workspaces` glob and Turborepo.
