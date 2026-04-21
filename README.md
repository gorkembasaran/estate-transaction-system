# Estate Transaction System

Full-stack technical case project for managing real estate transactions, transaction lifecycle stages, and commission breakdowns.

The repository contains a NestJS backend under `api/` and a Nuxt 3 frontend under `web/`. The backend implements the core domain logic, persistence, validation, and service-layer tests. The frontend is implemented to a usable degree with dashboard, transaction, and agent management flows connected to the backend API.

## Current Project Status

Backend:

- Implemented under `api/`
- Agents and transactions modules are available
- Transaction lifecycle and commission rules are implemented
- MongoDB / Mongoose persistence is configured
- Pagination, filtering, search, and sorting are supported where currently needed
- Jest service-layer tests cover the core backend business logic

Frontend:

- Implemented under `web/`
- Nuxt 3 app shell, routing, Pinia stores, typed services, and Axios plugin are available
- Usable dashboard, transactions, and agents pages exist
- Create/edit flows are implemented for the currently supported API surface
- Dark/light theme support is implemented

Deployment:

- Live frontend is available at `https://estate-transaction-system.vercel.app/`
- Live backend API is available at `https://estate-transaction-api.onrender.com/`
- Production backend configuration is environment-based and uses MongoDB Atlas through `MONGODB_URI`

## Live Deployment

The application is deployed and accessible through public production environments.

Frontend Application:

```text
https://estate-transaction-system.vercel.app
```

Backend API:

```text
https://estate-transaction-api.onrender.com
```

Deployment Platforms:

- Frontend: Vercel
- Backend API: Render
- Database: MongoDB Atlas

## API Health Check

The backend API can be verified using:

```text
https://estate-transaction-api.onrender.com/agents
```

This endpoint confirms that the API is running and accessible. It returns paginated agent results and can be used as a basic availability test.

## Tech Stack

Backend:

- Node.js
- TypeScript
- NestJS
- MongoDB
- Mongoose
- Jest

Frontend:

- Nuxt 3
- TypeScript
- Pinia
- Axios
- Tailwind CSS module is installed, with most page styling currently handled through app-level CSS and Vue component styles

## Core Business Rules

Transactions always start in the `agreement` stage.

Valid lifecycle:

```text
agreement -> earnest_money -> title_deed -> completed
```

Invalid transitions are rejected. Once a transaction reaches `completed`, no further stage transitions are allowed.

Commission rules:

- 50% of the service fee belongs to the agency
- 50% is the agent pool
- if the listing and selling agent are the same person, that agent receives the full agent pool
- if the listing and selling agents are different, they split the agent pool equally
- the financial breakdown is stored when the transaction reaches `completed`
- stage history is recorded inside the transaction document

## Current Implemented Features

Backend:

- Create, list, retrieve, and update agents
- Create, list, retrieve, and update transaction stages
- Retrieve transaction financial breakdowns
- Validate agent existence before transaction creation
- Enforce strict transaction stage transitions
- Calculate commission breakdowns
- Store embedded stage history and financial breakdowns
- Paginate, search, filter, and sort backend list endpoints
- Swagger/OpenAPI documentation for the backend API
- Handle validation, duplicate email, invalid id, not found, invalid transition, and negative fee errors
- Service-layer unit tests for agents, transactions, commission, and stage transition logic

Frontend:

- Dashboard page with transaction, agent, success-rate, revenue, and recent activity summaries
- Transactions list with backend pagination, filtering, date range filtering, and sorting
- Transaction detail page with stage history, stage update flow, and financial breakdown display
- Create transaction page
- Agents list with backend pagination, search, and status filtering
- Create agent page
- Edit agent page
- Async active-agent search in the create transaction flow
- Query-aware list refresh after create/update mutations to keep paginated and filtered results consistent with backend query results
- Shared transaction stage badges, formatting helpers, and store error handling

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
│   ├── assets/
│   ├── public/
│   ├── nuxt.config.ts
│   ├── package.json
│   └── README.md
├── DESIGN.md
└── README.md
```

## Requirements

- Node.js, recommended LTS version
- npm
- MongoDB local instance or MongoDB Atlas connection

## Environment Variables Overview

Environment variables control runtime configuration for local development and production deployment. Both projects include `.env.example` files that document the expected values without storing secrets.

Backend variables:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/
MONGODB_DATABASE=estate_transaction_system
FRONTEND_ORIGIN=https://estate-transaction-system.vercel.app
API_PREFIX=
```

Frontend variables:

```env
NUXT_PUBLIC_API_BASE=https://estate-transaction-api.onrender.com
NUXT_PUBLIC_API_TIMEOUT_MS=60000
```

## Backend Quick Start

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

The backend expects MongoDB to be available locally or through a configured MongoDB Atlas connection string. Full backend setup details are documented in `api/README.md`.

## Frontend Quick Start

```bash
cd web
npm install
npm run dev
```

The frontend reads the API base URL from `NUXT_PUBLIC_API_BASE` when provided. If it is not set, the Nuxt config currently defaults to:

```text
http://127.0.0.1:3000
```

The frontend is expected to run against the local backend during development.

Production URLs:

```text
Frontend: https://estate-transaction-system.vercel.app/
Backend API: https://estate-transaction-api.onrender.com/
```

## Available Application Areas

- Dashboard
- Transactions list
- Create transaction
- Transaction detail and stage update
- Agents list
- Create agent
- Edit agent

## API Overview

Routes are unprefixed by default. If `API_PREFIX` is configured in the backend, the prefix is added before these routes.

Agents:

- `POST /agents`
- `GET /agents`
- `GET /agents/:id`
- `PATCH /agents/:id`

Transactions:

- `POST /transactions`
- `GET /transactions`
- `GET /transactions/:id`
- `PATCH /transactions/:id/stage`
- `GET /transactions/:id/breakdown`

All list endpoints support pagination parameters:

- `page`
- `limit`

## Data Model Overview

Main entities:

Agent:

- fullName
- email
- isActive
- createdAt

Transaction:

- propertyTitle
- currency
- totalServiceFee
- stage
- listingAgentId
- sellingAgentId
- stageHistory
- breakdown (stored after completion)

Notes:

- Transactions reference agents using ObjectId references.
- Agent summaries are populated when listing transactions.

## Testing

Backend service-layer tests exist under `api/src`.

From the `api/` directory:

```bash
npm run test
npm run test:cov
```

Coverage is intentionally focused on backend business-logic service files:

```text
src/agents/**/*.service.ts
src/transactions/**/*.service.ts
```

Frontend unit/component tests are implemented under `web/` with Vitest and cover shared formatting utilities, store error handling, reusable UI components, async agent combobox behavior, and query-aware store mutation flows.

Frontend browser-level E2E tests are implemented under `web/e2e` with Playwright. The local suite covers smoke checks, agent create/edit flow, and transaction lifecycle completion. A deployed smoke mode is also available for the public frontend and backend URLs.

## Documentation Map

- `README.md` -> repository overview and current implementation status
- `api/README.md` -> backend setup, commands, endpoints, and backend-specific usage
- `DESIGN.md` -> architectural decisions, data modeling rationale, lifecycle design, and testing strategy
- `web/README.md` -> frontend setup and usage notes

## Current Limitations / Notes

- Live frontend and backend API URLs are documented; provider-specific deployment automation is intentionally minimal.
- Dashboard revenue is intentionally based on loaded completed transaction results, not a dedicated backend aggregate endpoint.
- Frontend and backend documentation are maintained separately; some detailed docs may need follow-up updates as implementation evolves.
- Docker, authentication, CI/CD, and seed scripts are not currently documented as implemented features.
