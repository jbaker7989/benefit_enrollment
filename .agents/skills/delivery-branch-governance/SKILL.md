---
name: delivery-branch-governance
description: Enforce story- or bug-linked branches and pull-request delivery for repository changes; use when creating branches, preparing merges, or changing CI workflow.
---

# Delivery Branch Governance

All code and documentation changes must be developed and merged through a
non-`main` branch whose name identifies the tracked delivery item.

## Required workflow

1. Confirm the applicable `STORY-###` or `BUG-###` in `docs/project-log.md`.
   Create a tracked story before beginning work that has no existing item.
2. Create or switch to a branch containing that exact, case-insensitive code.
   Use lowercase names such as `story-015-data-integrity` or
   `bug-003-contact-ownership`.
3. Commit and push the delivery branch. Open a pull request into `main`; do not
   commit or push the work directly to `main`, and do not merge locally into
   `main`.
4. Before merging, verify the required CI checks and the branch-name check pass.
   Merge only through the pull request after the configured approvals and
   protections are satisfied.

## Enforcement boundary

The repository workflow validates pull-request branch names. GitHub branch
protection or a ruleset on `main` must require pull requests and the relevant
status checks to prevent direct pushes outside local agent workflows. If that
remote protection is not enabled, report the remaining administrative step;
do not claim the policy is fully enforced.

## Exceptions

Only the repository owner may authorize an emergency exception explicitly and
record its reason and follow-up item. An agent must not infer an exception from
urgency, a clean worktree, or a previously merged change.
