# AI-LOG.md

Format: one entry per task. `Changed`, `Rejected` and `By hand` are written by the team member who
did the work. Lines marked `TODO(team)` are still waiting for that account.

## 2026-11-24 — repository hygiene before PA#2

Tool: none.
What went wrong: the initial commit 5fa5aea committed `.DS_Store` files (from `git add -A`) and
saved the course AI-log template as `LOG.md`, not `AI-LOG.md`.
Fix: removed both from the index, added `.gitignore`, and added two lines to `AGENTS.md`
(stage files by name; course files keep their exact names).

## 2026-11-24 — PA#2 harness: checks, CI, rules file

Tool: Claude Code (Opus 5.5).
Asked for: read the PA#2 rubric and build the harness: lint/format/typecheck/test commands, a CI
workflow that runs the same commands, the rules file and the README.
Kept: the four npm scripts plus `npm run check`; the CI job `checks` that calls the same scripts.
Changed: TODO(team)
Rejected: TODO(team)
By hand: chose the stack (TypeScript + Express), the endpoint (`POST /plans/{planId}/save`) and the
model provider (Groq). TODO(team): add anything else.
