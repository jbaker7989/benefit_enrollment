# ops/

Deployment, infrastructure, and CI/CD assets.

- `ci/` — pipeline definitions (GitHub Actions, etc.)
- `scripts/` — operational scripts (migrations runner, data backfills)
- `infra/` — infrastructure-as-code, if/when introduced

Keep secrets out of this directory; use environment variables (`vercel env`).
