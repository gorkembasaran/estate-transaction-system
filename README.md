# Estate Transaction System

Full-stack technical case repository for managing estate transactions, transaction lifecycle stages, and commission breakdowns.

The repository contains a NestJS backend under `api/` and a Nuxt 3 frontend workspace under `web/`. The backend core implementation is complete for the current case scope. The frontend setup has started, but functional pages, components, and documented UI behavior are still in progress.

## Current Phase

- Backend core implementation is complete for the current case scope.
- Backend service-layer tests are implemented.
- Backend business-logic coverage is strong and intentionally service-focused.
- Frontend setup has started with Nuxt 3, but functional UI implementation is still in progress.
- Deployment is not completed yet.

## Current Status

Backend:

- Implemented under `api/`
- Agents and transactions modules are available
- Transaction lifecycle and commission rules are implemented
- MongoDB / Mongoose integration is configured
- Jest unit tests cover backend business logic

Frontend:

- Initialized under `web/`
- Nuxt 3 setup has started
- Functional pages, components, state management, and documented UI behavior are still pending

Deployment:

- Not completed
- No live API or frontend URL is available at the current stage

## Tech Stack

Backend:

- Node.js
- TypeScript
- NestJS
- MongoDB
- Mongoose
- Jest

Frontend:

- Nuxt 3 initialized
- Functional frontend implementation pending

## Business Rules Summary

The backend enforces a strict transaction lifecycle:

```text
agreement -> earnest_money -> title_deed -> completed
```

Transactions always start in `agreement`, and transitions after `completed` are rejected.

Commission rules:

- 50% of the service fee belongs to the agency
- 50% is the agent pool
- same listing and selling agent receives the full agent pool
- different listing and selling agents split the agent pool equally
- financial breakdown is calculated when the transaction reaches `completed`

## Project Structure

```text
estate-transaction-system/
├── api/
│   ├── src/
│   ├── test/
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── web/
│   ├── app/
│   ├── nuxt.config.ts
│   ├── package.json
│   └── README.md
├── DESIGN.md
└── README.md
```

## Requirements

- Node.js (recommended LTS version)
- npm
- MongoDB local instance or MongoDB Atlas connection

## Backend Quick Start

The backend is the currently usable part of the project.

```bash
cd api
npm install
cp .env.example .env
npm run start:dev
```

Default backend URL:

```text
http://localhost:3000
```

The backend expects MongoDB to be available locally or through a configured MongoDB Atlas connection string. See `api/README.md` for full backend setup and environment details.

## Backend Tests

From the `api/` directory:

```bash
npm run test
npm run test:cov
```

Coverage is intentionally focused on backend service files:

```text
src/agents/**/*.service.ts
src/transactions/**/*.service.ts
```

Detailed coverage rationale is documented in `api/README.md` and `DESIGN.md`.

## API Overview

The following endpoints represent the currently available backend API surface.

Routes are unprefixed by default. If `API_PREFIX` is configured, the prefix is added before these routes.

Agents:

- `POST /agents`
- `GET /agents`
- `GET /agents/:id`

Transactions:

- `POST /transactions`
- `GET /transactions`
- `GET /transactions/:id`
- `PATCH /transactions/:id/stage`
- `GET /transactions/:id/breakdown`

## Frontend Status

The frontend workspace has been initialized with Nuxt 3 under `web/`.

Current frontend status:

- setup has started
- implementation is in progress
- functional pages and components are pending
- frontend state management and documented UI behavior are pending

Frontend details will be documented after functional implementation exists.

## Documentation Map

- `README.md` -> repository overview and implementation status
- `api/README.md` -> backend setup, commands, endpoints, and backend-specific usage
- `DESIGN.md` -> architectural decisions, data modeling rationale, lifecycle design, and testing strategy

## Future Work Overview

- frontend functional implementation
- integration and e2e testing
- deployment setup
- optional API documentation generation
- potential pagination and filtering support
