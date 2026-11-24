# AI Travel Planner — backend

CSC13114 class project (23KTPM1). A day-by-day schedule and spending planner for a group trip in
Ho Chi Minh City. This repository holds the API, its contracts and its quality gate.

## Run the checks (fresh clone)

Requires Node 24 (see `.nvmrc`) and npm.

```sh
git clone https://github.com/AkiraTomori/TravelPlanner.git
cd TravelPlanner
npm ci
npm run lint          # ESLint
npm run format:check  # Prettier, check only
npm run typecheck     # tsc --noEmit
npm test              # Vitest + Supertest (no network, no model calls)
npm run check         # all four, same order as CI
```

CI (`.github/workflows/ci.yml`, job `checks`) runs exactly these four commands on every pull request,
on `main` and on `pa*` tags. `main` is protected: `checks` must pass before a PR can merge.

## Run the API

```sh
cp .env.example .env   # fill in values locally; .env is git-ignored
npm run dev            # http://localhost:3000/health
```

## Contracts

- [`POST /plans/{planId}/save`](docs/contract/save-plan.md)

## Model and spending cap

- Provider: Groq (`GROQ_API_KEY`, `GROQ_MODEL` in `.env`). The key is read by the backend only and
  never reaches the browser.
- Spending cap: Only use Free tier API_KEY
  (e.g. "free tier, no payment method on the account, so spend is capped at $0"). Do not write this line before it is true.
- Cost of one plan: measured in PA#3.

## Repository

- `AGENTS.md` — rules for assistants (stack, commands, conventions, never, permissions).
- `AI-LOG.md` — what the assistant did and what we changed or rejected.
- `PA2.md` — PA#2 evidence links.
