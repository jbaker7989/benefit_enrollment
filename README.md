# Benefit Enrollment

A Bun + Turborepo monorepo for an employee benefit-enrollment platform:
interactive enrollment on the web and bulk file import of enrollment selections
during end-of-year enrollment periods.

## Prerequisites

- [Bun](https://bun.sh) `1.4.3+`

## Getting started

```bash
bun install
bun run dev        # runs apps/web via Turborepo
```

Other tasks (all routed through Turborepo):

```bash
bun run build      # build all packages/apps
bun run lint       # lint
bun run typecheck  # type-check everything
```

## Workspace layout

| Path | Package | Purpose |
| --- | --- | --- |
| `apps/web` | `@benefit/web` | Next.js 16 app (App Router, Turbopack) |
| `packages/ui` | `@benefit/ui` | Shared React components |
| `packages/types` | `@benefit/types` | Domain model (source of truth) |
| `packages/data` | `@benefit/data` | Data-access contracts (provider TBD) |
| `packages/config` | `@benefit/config` | Shared TypeScript presets |
| `services/` | — | Async workers (e.g. bulk-import processing) |
| `docs/` | — | Specs and architecture decision records |
| `ops/` | — | Deployment, CI/CD, infrastructure |

See [`AGENTS.md`](./AGENTS.md) for conventions and
[`docs/adr/`](./docs/adr/) for architecture decisions.
