# AGENTS.md — rules for any assistant working in this repo

AI Travel Planner backend (CSC13114, 23KTPM1). `CLAUDE.md` imports this file; keep one source.

## Stack

- Node 24 (`.nvmrc`), TypeScript strict, ESM. Express 5 for HTTP.
- Vitest + Supertest for tests, ESLint (typescript-eslint strict), Prettier.
- LLM provider: Groq, called from the backend only (arrives in PA#3).

## Commands

- `npm ci` — install exactly what `package-lock.json` pins.
- `npm run lint` · `npm run format:check` · `npm run typecheck` · `npm test`
- `npm run check` — all four, in the order CI runs them. Run it before every push.

## Conventions

- Every endpoint has a contract in `docs/contract/<endpoint>.md`. The contract is written first;
  code and tests follow it. Changing behaviour means changing the contract in the same PR.
- Every error response is `application/problem+json` (RFC 9457) with a `type` listed in the contract.
- Money is integer VND, computed by code (`src/plans/cost.ts`), never by the model.
- Dependencies (store, validator, clock, model client) are injected into `createApp`, so tests use fakes.
- Work on a branch, open a PR, merge with a merge commit after `checks` is green. A commit that changes
  a test does not also change the code it tests.
- Stage files by name. Never `git add -A` / `git add .` (see 5fa5aea: `.DS_Store` was committed).
- Course files keep their exact names: the AI log is `AI-LOG.md` (5fa5aea committed it as `LOG.md`).

## Never

- Never put a model key (or any secret) in the browser bundle, in a `NEXT_PUBLIC_`/`VITE_` variable,
  in a commit, or in a prompt. Keys live in `.env`, read only by the backend.
- Never make a real model or network call in tests. `tests/setup/no-network.ts` makes `fetch` throw.
- Never edit a test, the eval data, or a validator rule to make a check pass. Fix the code, or change
  the contract first and say why in the PR.
- Never add `|| true`, `continue-on-error` or a skipped test to get CI green.
- Never send names or e-mail addresses to the model: only places and interests.
- Never push to `main`, force-push, or rewrite history that is already pushed.

## Permissions (assistant)

| Tier      | What                                                                                                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Allowed   | Read any tracked file; edit `src/`, `docs/`; run `npm run *`, `npm ci`, `git status/diff/log`, create branches and commits.                                                      |
| Ask first | Edit anything under `tests/` or `.github/`; add or upgrade a dependency; `git push`; open/merge a PR; change branch protection; any command that costs money (a real Groq call). |
| Never     | Read or print `.env`; force-push; push to `main`; delete branches or tags on the remote; disable a CI check; commit a secret.                                                    |

`.claude/settings.json` enforces the same tiers for Claude Code.
