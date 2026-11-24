# AI-LOG.md

Format: one entry per task. `Changed`, `Rejected` and `By hand` are written by the team member who
did the work. Lines marked `TODO(team)` are still waiting for that account.

## 2026-11-24 — repository hygiene before PA#2

Tool: none for the mistake; Claude Code (Opus 5.5) for the fix.
What went wrong: the initial commit 5fa5aea (by hand) committed `.DS_Store` files and saved the
course AI-log template as `LOG.md`, not `AI-LOG.md`.
Fix (Claude Code, in b476181): removed both from the index, added `.gitignore`, and added two lines
to `AGENTS.md` (stage files by name; course files keep their exact names).

## 2026-11-24 — PA#2 harness: checks, CI, rules file

Tool: Claude Code (Opus 5.5).
Asked for: read the PA#2 rubric and build the harness: lint/format/typecheck/test commands, a CI
workflow that runs the same commands, the rules file and the README.
Kept: the four npm scripts plus `npm run check`; the CI job `checks` that calls the same scripts.
Changed: TODO(team)
Rejected: TODO(team)
By hand: chose the stack (TypeScript + Express), the endpoint (`POST /plans/{planId}/save`) and the
model provider (Groq). TODO(team): add anything else.

## 2026-11-24 — contract and contract tests for `POST /plans/{planId}/save`

Tool: Claude Code (Opus 5.5).
Asked for: write the contract first, then tests that hold the code to it, then the handler, and
show both a blocked red PR and a deliberate break.
Kept: the error table (10 problem types), the 404-for-outsiders / 403-for-members ownership rule,
idempotency scoped per user with a 24 h TTL and `sharedNow` on repeats.
Changed (by the assistant, during the run): the first 501 stub failed **lint** (unused `deps`), so
PR #1 would have gone red for the wrong reason, not because of the contract. The stub was changed so
only `npm test` fails; run 45319209376 confirms the failing step is `npm test`.
Changed (by the assistant): typescript-eslint strict rejected `!` in test fixtures; the rule was turned
off for `tests/**` only, not for `src/`.
Changed: TODO(team) — what you changed after reading the contract.
Rejected: TODO(team)
By hand: TODO(team)

## 2026-11-24 — branch protection

Tool: Claude Code (Opus 5.5), via `gh api`.
Asked for: protect `main` so a red check blocks the merge.
Kept: required check `checks` (strict), no force-push, no deletion.
Changed (by the assistant): `required_approving_review_count` is 0, not 1. With one approval required,
a solo owner can never merge their own PR. `enforce_admins` is on, so the owner cannot bypass the
check either (`docs/evidence/pr1-merge-refused.txt`).
Rejected: TODO(team)
