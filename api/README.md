# Estate Transaction Backend

NestJS backend for the estate transaction and commission management technical case.

The backend manages agents, transactions, lifecycle stage transitions, and commission breakdowns. It exposes REST endpoints consumed by the Nuxt frontend, stores data in MongoDB through Mongoose, and includes focused service-layer tests for the main business rules.

## Current Backend Status

- Core backend API is implemented for the current case scope.
- Agent and transaction modules are implemented.
- Pagination, filtering, and sorting are implemented where described below.
- Service-layer unit tests cover the main business logic.
- MongoDB integration is configured through Mongoose.
- Production backend API is available at `https://estate-transaction-api.onrender.com/`.

## Tech Stack

- Node.js
- TypeScript
- NestJS
- MongoDB
- Mongoose
- class-validator
- class-transformer
- Swagger / OpenAPI
- Jest

## Runtime Requirements

- Node.js
- npm
- MongoDB local instance or MongoDB Atlas connection string

## API Base URL

Default local base URL:

```text
http://127.0.0.1:3001
```

Routes are unprefixed by default.

If `API_PREFIX=api` is configured, the API base becomes:

```text
http://127.0.0.1:3001/api
```

Production API base URL:

```text
https://estate-transaction-api.onrender.com
```

## API Documentation

Swagger UI is available at:

```text
http://127.0.0.1:3001/docs
```

The generated OpenAPI JSON document is available at:

```text
http://127.0.0.1:3001/docs-json
```

Production Swagger UI:

```text
https://estate-transaction-api.onrender.com/docs
```

If `API_PREFIX` is configured, REST API routes are prefixed, but the Swagger documentation remains available at `/docs`.

## Implemented Backend Features

### Agents Module

Implemented behavior:

- Create agents.
- List agents with pagination.
- Search agents by full name or email.
- Filter agents by status: all, active, or inactive.
- Sort agent lists by newest first.
- Retrieve an agent by id.
- Update an agent by id.
- Prevent duplicate agent emails.
- Validate agent existence before transaction creation.
- Reject invalid ObjectId values before database lookup.
- Swagger/OpenAPI metadata for agent endpoints and DTOs.

### Transactions Module

Implemented behavior:

- Create transactions.
- Always create new transactions in the `agreement` stage.
- Validate listing and selling agents before transaction creation.
- List transactions with pagination.
- Filter transactions by stage and created date range.
- Search transactions by property title or currency.
- Sort transactions by `createdAt`, `updatedAt`, or `totalServiceFee`.
- Populate `listingAgentId` and `sellingAgentId` with agent `fullName` and `email` in transaction reads.
- Retrieve a transaction by id.
- Update transaction stage.
- Validate stage transitions.
- Store stage history in the transaction document.
- Calculate financial breakdown when a transaction reaches `completed`.
- Retrieve stored transaction breakdown.
- Swagger/OpenAPI metadata for transaction endpoints, query params, and DTOs.

## Transaction Lifecycle

Supported stages:

```text
agreement
earnest_money
title_deed
completed
```

All transactions are created with the initial stage:

```text
agreement
```

Allowed transitions:

```text
agreement -> earnest_money
earnest_money -> title_deed
title_deed -> completed
```

Rejected transitions include:

- skipped stages
- reverse transitions
- same-stage transitions
- transitions after `completed`

Each transaction stores `stageHistory`. The initial history entry uses `fromStage: null` and `toStage: agreement`. Every successful stage update appends a new history item with `fromStage`, `toStage`, and `changedAt`.

Once a transaction reaches `completed`, further transitions are rejected. This prevents commission calculation from being executed again for the same transaction.

## Commission Logic

Commission calculation is handled by `CommissionService`.

Implemented rules:

- 50% of the total service fee goes to the agency.
- 50% of the total service fee becomes the agent pool.
- If listing agent and selling agent are the same agent, that agent receives the full agent pool.
- If listing agent and selling agent are different agents, the agent pool is split equally.
- Monetary values are rounded to two decimal places.
- Negative service fees are rejected with `BadRequestException`.

The financial breakdown is calculated when a transaction transitions to `completed`.

Breakdown fields:

- `agencyAmount`
- `listingAgentAmount`
- `sellingAgentAmount`
- `listingAgentReason`
- `sellingAgentReason`
- `calculatedAt`

The breakdown is embedded in the transaction document and remains `null` until the transaction is completed.

## Data Model Overview

### Agent

Stored in the `agents` collection.

Fields:

- `fullName`
- `email`
- `isActive`
- `createdAt`
- `updatedAt`

The `email` field has a unique index.

### Transaction

Stored in the `transactions` collection.

Fields:

- `propertyTitle`
- `totalServiceFee`
- `currency`
- `listingAgentId`
- `sellingAgentId`
- `stage`
- `stageHistory`
- `breakdown`
- `createdAt`
- `updatedAt`

`listingAgentId` and `sellingAgentId` are MongoDB ObjectId references to agents.

Transaction reads populate agent summaries with:

- `_id`
- `fullName`
- `email`

### Stage History

Embedded inside the transaction document.

Fields:

- `fromStage`
- `toStage`
- `changedAt`

### Financial Breakdown

Embedded inside the transaction document.

Fields:

- `agencyAmount`
- `listingAgentAmount`
- `sellingAgentAmount`
- `listingAgentReason`
- `sellingAgentReason`
- `calculatedAt`

### Indexes

Implemented schema indexes:

- Agent `email` unique index.
- MongoDB-managed `_id` indexes.
- Transaction compound index on `stage` and `createdAt`.
- Transaction index on `listingAgentId`.
- Transaction index on `sellingAgentId`.

Mongoose `autoIndex` is enabled outside production and disabled in production.

## Query Capabilities

List endpoints return a consistent shape:

```ts
{
  items: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

### `GET /agents`

Supported query parameters:

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | number | `1` | Minimum `1` |
| `limit` | number | `10` | Minimum `1`, maximum `100` |
| `search` | string | none | Matches `fullName` and `email`, case-insensitive |
| `status` | `all`, `active`, `inactive` | `all` | Filters by `isActive` |

Sort behavior:

- Agents are sorted by `createdAt` descending.

Examples:

```text
GET /agents
GET /agents?page=2&limit=10
GET /agents?status=active&search=sarah
GET /agents?status=inactive
```

### `GET /transactions`

Supported query parameters:

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | number | `1` | Minimum `1` |
| `limit` | number | `10` | Minimum `1`, maximum `100` |
| `stage` | transaction stage | none | Filters by exact stage |
| `search` | string | none | Matches `propertyTitle` and `currency`, case-insensitive |
| `dateFrom` | ISO date string | none | Filters `createdAt` from start of day UTC |
| `dateTo` | ISO date string | none | Filters `createdAt` through end of day UTC |
| `sortBy` | `createdAt`, `updatedAt`, `totalServiceFee` | `updatedAt` | Sort field |
| `sortOrder` | `asc`, `desc` | `desc` | Sort direction |

Valid stage values:

```text
agreement
earnest_money
title_deed
completed
```

Examples:

```text
GET /transactions
GET /transactions?page=1&limit=10
GET /transactions?stage=completed
GET /transactions?search=usd
GET /transactions?dateFrom=2026-04-01&dateTo=2026-04-30
GET /transactions?sortBy=totalServiceFee&sortOrder=asc
```

## API Endpoints

Routes are unprefixed unless `API_PREFIX` is configured.

### Agents

```text
POST /agents
```

Creates an agent.

Supported payload:

- `fullName`
- `email`
- `isActive` optional

```text
GET /agents
```

Returns a paginated agent list with optional search and status filtering.

```text
GET /agents/:id
```

Returns one agent by id.

```text
PATCH /agents/:id
```

Updates one agent by id.

Supported payload fields:

- `fullName` optional
- `email` optional
- `isActive` optional

### Transactions

```text
POST /transactions
```

Creates a transaction. Listing and selling agents must already exist. The initial stage is always `agreement`.

Supported payload:

- `propertyTitle`
- `totalServiceFee`
- `currency`
- `listingAgentId`
- `sellingAgentId`

```text
GET /transactions
```

Returns a paginated transaction list with optional filtering, search, and sorting.

```text
GET /transactions/:id
```

Returns one transaction by id with populated listing and selling agent summaries.

```text
PATCH /transactions/:id/stage
```

Updates a transaction stage if the requested transition is valid.

Supported payload:

- `stage`

```text
GET /transactions/:id/breakdown
```

Returns the stored financial breakdown for a transaction. The value can be `null` if the transaction is not completed.

## Validation and Error Handling

Request validation is handled with DTOs, `class-validator`, `class-transformer`, and a global `ValidationPipe`.

Global validation behavior:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

Validation failures return `BadRequestException` with this structure:

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "fieldName",
      "messages": ["Validation message"]
    }
  ]
}
```

Implemented runtime error behavior:

- Invalid agent id -> `BadRequestException`
- Invalid transaction id -> `BadRequestException`
- Missing agent -> `NotFoundException`
- Missing transaction -> `NotFoundException`
- Duplicate agent email -> `ConflictException`
- Invalid stage transition -> `BadRequestException`
- Invalid date range -> `BadRequestException`
- Negative service fee inside `CommissionService` -> `BadRequestException`

Additional validation notes:

- Agent email input is trimmed and lowercased.
- Transaction currency input is trimmed and uppercased.
- Transaction service fee must be at least `0.01` in the create DTO.
- Query parameter numbers are transformed from strings.
- Unknown request fields are rejected.

## Environment Variables

Configuration is loaded from `.env.local` and `.env`.

Use `.env.example` as the starting point.

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | Must be `development`, `test`, or `production` |
| `HOST` | no | `0.0.0.0` | Host used by `app.listen` |
| `PORT` | no | `3001` | Must be a valid TCP port |
| `FRONTEND_ORIGIN` | no | none | Comma-separated CORS origins; trailing slashes are normalized |
| `API_PREFIX` | no | none | Optional global route prefix; leading/trailing slashes are trimmed |
| `MONGODB_URI` | production only | `mongodb://127.0.0.1:27017` | Required when `NODE_ENV=production` |
| `MONGODB_DATABASE` | no | `estate_transaction_system` | Database name passed to Mongoose |

Development CORS defaults include:

```text
http://127.0.0.1:3000
http://localhost:3000
```

In production, CORS is disabled unless `FRONTEND_ORIGIN` is configured.

Production deployments should set `FRONTEND_ORIGIN` to the deployed frontend origin:

```text
FRONTEND_ORIGIN=https://estate-transaction-system.vercel.app
```

Multiple allowed origins can be provided as a comma-separated list.

## Installation

From the repository root:

```bash
cd api
npm install
cp .env.example .env
```

Make sure MongoDB is running locally or configure `MONGODB_URI` for MongoDB Atlas.

## Running the Backend

Development mode:

```bash
npm run start:dev
```

Standard start:

```bash
npm run start
```

Debug mode:

```bash
npm run start:debug
```

Production build:

```bash
npm run build
npm run start:prod
```

Format source files:

```bash
npm run format
```

Lint source files:

```bash
npm run lint
```

## Running Tests

Run all Jest unit tests:

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

Run coverage:

```bash
npm run test:cov
```

Coverage can also be run with:

```bash
npm run test -- --coverage
```

Jest generates coverage through Istanbul-based coverage reporting and writes the report to `api/coverage/`.

Debug tests:

```bash
npm run test:debug
```

The package also contains an e2e test script:

```bash
npm run test:e2e
```

At the moment, the repository contains e2e Jest configuration but no implemented e2e spec file.

## Test Coverage Strategy

Unit tests are focused on the service layer because that is where the core business logic is implemented.

Current service test files:

- `src/agents/services/agents.service.spec.ts`
- `src/transactions/services/transactions/transactions.service.spec.ts`
- `src/transactions/services/commission/commission.service.spec.ts`
- `src/transactions/services/lifecycle/stage-transition.service.spec.ts`

Jest coverage is intentionally scoped to business-logic service files:

```text
agents/**/*.service.ts
transactions/**/*.service.ts
```

These paths are relative to Jest `rootDir`, which is configured as `src`.

Normal test execution still runs all `*.spec.ts` files matched by the Jest configuration.

Covered behavior includes:

- agent creation
- duplicate email handling
- agent retrieval and update behavior
- paginated agent listing behavior
- transaction creation
- transaction listing and query behavior
- transaction stage updates
- financial breakdown calculation
- stage transition validation
- invalid id handling
- not found handling

Controllers, DTOs, modules, schemas, config files, database setup, bootstrap files, and enums are not part of the coverage metric.

## Current Limitations / Non-Goals

The following are not currently implemented in this backend:

- authentication or authorization
- Docker configuration
- CI/CD configuration
- seed scripts
- dedicated dashboard aggregate endpoint
- implemented e2e test specs

## Documentation Map

- `api/README.md` -> backend-specific setup, commands, endpoints, and behavior
- `../README.md` -> repository-level overview and current project status
- `../DESIGN.md` -> architecture decisions, data modeling rationale, lifecycle design, and testing strategy
