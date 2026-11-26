# PA#2 — Harness and quality gate

Team repository: https://github.com/AkiraTomori/TravelPlanner (public). Submitted at tag `pa2`.

## Evidence links

| What                      | Link                                                                                                                                                                                                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository                | https://github.com/AkiraTomori/TravelPlanner                                                                                                                                                                                                                                                                           |
| Protected-branch settings | https://github.com/AkiraTomori/TravelPlanner/settings/branches · API dump: [`docs/evidence/branch-protection.json`](docs/evidence/branch-protection.json) · screenshot: [`docs/evidence/branch-protection.png`](docs/evidence/branch-protection.png)                                                                   |
| Blocked PR                | https://github.com/AkiraTomori/TravelPlanner/pull/1 — red run https://github.com/AkiraTomori/TravelPlanner/actions/runs/45319209376 on commit [`25bb51f`](https://github.com/AkiraTomori/TravelPlanner/commit/25bb51f), merge refused: [`docs/evidence/pr1-merge-refused.txt`](docs/evidence/pr1-merge-refused.txt)    |
| PR that turned green      | https://github.com/AkiraTomori/TravelPlanner/pull/1 — commit [`028e3a3`](https://github.com/AkiraTomori/TravelPlanner/commit/028e3a3) (code only), green run https://github.com/AkiraTomori/TravelPlanner/actions/runs/45319305553, merged as [`05deedf`](https://github.com/AkiraTomori/TravelPlanner/commit/05deedf) |
| CI run for the tag        | https://github.com/AkiraTomori/TravelPlanner/actions/runs/45322477846 (tag `pa2`, green)                                                                                                                                                                                                                               |
| Deliberate contract break | https://github.com/AkiraTomori/TravelPlanner/pull/2 — commit [`64f0a50`](https://github.com/AkiraTomori/TravelPlanner/commit/64f0a50), red run https://github.com/AkiraTomori/TravelPlanner/actions/runs/45319521976 (`Who may call it > 404 plan-not-found for another group's plan`), closed unmerged                |

## What is where

- Rules file: [`AGENTS.md`](AGENTS.md) (stack, commands, conventions, never, permissions). `CLAUDE.md` imports it.
- Permissions, three tiers: [`AGENTS.md` § Permissions](AGENTS.md), enforced by [`.claude/settings.json`](.claude/settings.json).
- Secrets: [`.env.example`](.env.example) (names only), `.env` git-ignored, model key and spending cap in [`README.md`](README.md#model-and-spending-cap).
- Checks: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test` ([`README.md`](README.md#run-the-checks-fresh-clone)); CI runs the same four in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
- Contract: [`docs/contract/save-plan.md`](docs/contract/save-plan.md) — `POST /plans/{planId}/save`.
- Contract tests: [`tests/contract/save-plan.test.ts`](tests/contract/save-plan.test.ts); validator unit tests [`tests/unit/validate.test.ts`](tests/unit/validate.test.ts).

## Timeline

1. `b476181` (2026-11-24 03:20 UTC): harness pushed to `main`; CI green.
2. 03:21 UTC: `main` protected — required check `checks` (strict), `enforce_admins: true`, PRs required,
   no force-push, no deletion. Nothing has been pushed straight to `main` since; every later change
   arrived through a PR merge commit.
3. PR #1: contract + tests + 501 stub (`25bb51f`) → red, merge refused → handler only (`028e3a3`) → green → merged.
4. PR #2: deliberate break (`64f0a50`) → red, merge refused → closed.
5. PR #3: this file, the self-assessment and the AI log → merged; the merge commit is tagged `pa2`.
