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
Changed: No Changed at this time. Will change the API_KEY for future runs, and the README will be updated with the spending cap.
Rejected: None at this time. Will reject any changes that violate the rules, such as adding a secret to the repo.
By hand: chose the stack (TypeScript + Express), the endpoint (`POST /plans/{planId}/save`) and the model provider (Groq). Will change the API_KEY for future runs.

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
Changed: None
Rejected: None
By hand: None at this time. Will reject any changes that violate the rules, such as editing a test to make it pass.

## 2026-11-24 — branch protection

Tool: Claude Code (Opus 5.5), via `gh api`.
Asked for: protect `main` so a red check blocks the merge.
Kept: required check `checks` (strict), no force-push, no deletion.
Changed (by the assistant): `required_approving_review_count` is 0, not 1. With one approval required,
a solo owner can never merge their own PR. `enforce_admins` is on, so the owner cannot bypass the
check either (`docs/evidence/pr1-merge-refused.txt`).
Rejected: None at this time. Will reject any changes that violate the rules, such as disabling a check or force-pushing to `main`.
By hand: added the branch-protection screenshot `docs/evidence/branch-protection.png` (done).

## 2026-11-24 — PA#2 report edit caught by the gate

Tool: the CI job `checks` caught it.
What went wrong: commit 4e3e692 (AI-LOG, README, self-assessment) left the Markdown
tables unformatted. On PR #3, run 45322225150 went red at `npm run format:check` (lint passed;
typecheck and test were skipped), so the PR could not merge.
Fix (8715b5a): reformatted the tables so Prettier passes; run 45322367867 went green and PR #3
merged. The gate checks our own docs, not only the assistant's code.
