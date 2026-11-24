# Self-assessment — PA#2

Submitted by: TODO(team) — one line per member: `<student ID> — <full name>`

Total we claim: 85 / 100

| #   | Criterion                   | Max | We claim | Evidence                                                                                                                                                                                                                                                                                   |
| --- | --------------------------- | --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Rules file                  | 15  | 12       | `AGENTS.md`: Stack, Commands, Conventions, Never (no key in browser bundle, no real model call in tests, never edit a test / eval data / validator rule to pass). Two lines trace to commit `5fa5aea` (`.DS_Store`, `LOG.md`), logged in `AI-LOG.md` 2026-11-24. Drafted by the assistant. |
| 2   | Permissions and secrets     | 10  | 7        | Three tiers in `AGENTS.md` § Permissions + `.claude/settings.json`; `.env.example` lists `PORT`, `GROQ_API_KEY`, `GROQ_MODEL` without values; history scanned, no secret. Spending cap line in `README.md` still TODO.                                                                     |
| 3   | One command for every check | 10  | 9        | `README.md` § Run the checks; `.github/workflows/ci.yml` runs the same `npm run lint / format:check / typecheck / test`. Fresh clone + `npm ci` → all green (verified 2026-11-24).                                                                                                         |
| 4   | CI that blocks a merge      | 20  | 18       | `docs/evidence/branch-protection.json` (required `checks`, strict, `enforce_admins`). PR #1 red on `25bb51f`, merge refused (`docs/evidence/pr1-merge-refused.txt`), green on `028e3a3`. No direct push to `main` after `b476181`.                                                         |
| 5   | Contract of one endpoint    | 25  | 22       | `docs/contract/save-plan.md`: who may call it (creator only; 403 member / 404 outsider), request + response field rules, 10 problem types with status, idempotency, paging N/A, what changes, change policy.                                                                               |
| 6   | Contract tests that bite    | 15  | 14       | `tests/contract/save-plan.test.ts`: every problem `type` asserted on body, ownership (outsider → 404, member → 403), idempotency (replay, reuse, new key, per-user, 24 h). Runs in required CI. Deliberate break: PR #2, commit `64f0a50`, run 45319521976 red.                            |
| 7   | AI-LOG.md                   | 5   | 3        | `AI-LOG.md`: tool and task per entry; `Changed` / `Rejected` for the team still partly TODO.                                                                                                                                                                                               |
|     | **Total**                   | 100 | **85**   |                                                                                                                                                                                                                                                                                            |

## What we did not manage

- The Groq spending cap is not yet stated in the README (criterion 2), and the branch-protection
  screenshot is not yet in `docs/evidence/`.
- The rules file and the contract were drafted by the assistant. Only two of the rules lines have a
  story so far, and both trace to the same initial commit.
- IA#3's `CONTRACT.md` was not in the repository, so the section list of `save-plan.md` follows the
  rubric's wording, not a copy of that file.
- The validator covers places, items, stop order and money only. Opening hours, travel time and rain
  wait for the shared data (published 2026-11-27).
- Plans and idempotency keys are in memory; auth is a token lookup. Both are replaced in PA#3.

## What we would do differently

Write `.gitignore` before the first commit. Two of our rules exist because we did not.
