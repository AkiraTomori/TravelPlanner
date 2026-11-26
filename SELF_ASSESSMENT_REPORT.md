# Self-assessment — PA#2

Submitted by: `23127128 — Nguyễn Thành Tiến`; `23127379 — Thái Minh Huy`; `23127449 — Nguyễn Tấn Phát`

Total we claim: 95 / 100

| #   | Criterion                   | Max | We claim | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | --------------------------- | --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Rules file                  | 15  | 12       | `AGENTS.md`: Stack, Commands, Conventions, Never (no key in browser bundle, no real model call in tests, never edit a test / eval data / validator rule to pass). Three lines trace to things that went wrong: commit `5fa5aea` (`.DS_Store`, `LOG.md`) and the PR #1 stub that failed lint instead of the tests, all logged in `AI-LOG.md` 2026-11-24. Team members have checked the rules.                                 |
| 2   | Permissions and secrets     | 10  | 10       | Three tiers in `AGENTS.md` § Permissions + `.claude/settings.json`; `.env.example` lists `PORT`, `GROQ_API_KEY`, `GROQ_MODEL` without values; `docs/evidence/secret-scan.md`: gitleaks over all refs and the tree, no leaks (positive control caught). `README.md` § Model and spending cap: Groq free tier, no billing, cap $0.                                                                                             |
| 3   | One command for every check | 10  | 10       | `README.md` § Run the checks; `.github/workflows/ci.yml` runs the same `npm run lint / format:check / typecheck / test`. Fresh clone + `npm ci` → all green (verified 2026-11-24).                                                                                                                                                                                                                                           |
| 4   | CI that blocks a merge      | 20  | 20       | `docs/evidence/branch-protection.json` (required `checks`, strict, `enforce_admins`). PR #1 red on `25bb51f`, merge refused (`docs/evidence/pr1-merge-refused.txt`), green on `028e3a3`. PR #6 red on `5a2658b` (run 45741962874, merge blocked), green on `2ef495c` (run 45742178095). No direct push to `main` after `b476181`.                                                                                            |
| 5   | Contract of one endpoint    | 25  | 23       | `docs/contract/save-plan.md`: who may call it (creator only; 403 member / 404 outsider), request + response field rules, 11 problem types with status and check order, example error bodies, per-type client actions, idempotency with a full exchange, paging N/A, what changes, change policy.                                                                                                                             |
| 6   | Contract tests that bite    | 15  | 15       | `tests/contract/save-plan.test.ts`: every problem `type` asserted on body, ownership (outsider → 404, member → 403), idempotency (replay, byte-identical reuse, new key, per-user, 24 h), every step of the check order, 413 at 16 385 / 200 at 16 384 bytes. Runs in required CI. PR #6: tests-only `5a2658b` red at `npm test`, code-only `2ef495c` green. Deliberate break: PR #2, commit `64f0a50`, run 45319521976 red. |
| 7   | AI-LOG.md                   | 5   | 5        | `AI-LOG.md`: tool and task per entry; real `Changed` entries (501 stub failing lint, not the tests; review count 0 not 1; format:check red on PR #3, run 45322225150). Team `Rejected` lines are still generic.                                                                                                                                                                                                              |
|     | **Total**                   | 100 | **95**   |                                                                                                                                                                                                                                                                                                                                                                                                                              |

## What we did not manage

- The rules file and the contract were drafted by the assistant. Three rules lines have a story; two
  of them trace to the same initial commit.
- IA#3's `CONTRACT.md` was not in the repository, so the section list of `save-plan.md` follows the
  rubric's wording, not a copy of that file.
- The validator covers places, items, stop order and money only. Opening hours, travel time and rain
  wait for the shared data (published 2026-11-27).
- Plans and idempotency keys are in memory; auth is a token lookup. Both are replaced in PA#3.

## What we would do differently

Write `.gitignore` before the first commit. Two of our rules exist because we did not.
