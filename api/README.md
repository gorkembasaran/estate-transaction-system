# Estate Transaction Backend

Backend service for an estate transaction and commission management technical case.

The backend manages agents, tracks transaction lifecycle stages, validates allowed transitions, and calculates commission breakdowns when a transaction is completed. It is implemented with NestJS, MongoDB, Mongoose, TypeScript, and Jest.

This README is scoped to the backend only. Frontend implementation is pending and is not documented as completed here.

## Current Implementation Status

Backend:

- Implemented for the current case scope
- Unit tested at the service layer
- Business rules validated with Jest
- Coverage focused on business-logic service files
- MongoDB integration configured through Mongoose

Frontend:

- Pending
- Will be documented separately after implementation

Deployment:

- Not completed yet
- No live backend URL is currently documented

## Tech Stack

- Node.js
- TypeScript
- NestJS
- MongoDB
- Mongoose
- Jest

## Runtime Requirements

- Node.js
- npm
- MongoDB local instance or MongoDB Atlas connection string

## API Base URL

Default local base URL:

```text
http://localhost:3000
```

If `API_PREFIX=api` is configured, the API base becomes:

```text
http://localhost:3000/api
```

## Implemented Backend Features

### Agents Module

The agents module handles agent-related operations.

Implemented behavior:

- Create an agent
- Prevent duplicate agent emails
- Retrieve active agents
- Sort active agents by newest first
- Retrieve agent by id
- Validate agent existence for transaction creation
- Reject invalid ObjectId values

### Transactions Module

The transactions module handles transaction lifecycle and financial processing.

Implemented behavior:

- Create a transaction
- Always start new transactions at `agreement`
- Validate listing and selling agents before creation
- Retrieve transactions
- Populate `listingAgentId` and `sellingAgentId` with `fullName` and `email`
- Retrieve a transaction by id with populated agent fields
- Update transaction stage
- Validate stage transitions
- Store stage history
- Calculate financial breakdown when the transaction reaches `completed`
- Retrieve stored transaction breakdown

## Transaction Stages

Supported stages:

```text
agreement
earnest_money
title_deed
completed
```

Allowed transitions:

```text
agreement -> earnest_money
earnest_money -> title_deed
title_deed -> completed
```

### Initial Stage Rule

All transactions are automatically created in the `agreement` stage. The create endpoint does not allow setting an initial stage manually. This prevents bypassing lifecycle validation by creating transactions directly in later stages.

Rejected transitions:

- skipped stages
- reverse transitions
- same-stage transitions
- transitions after `completed`

## CommissionService

Commission distribution is handled by `CommissionService`.

Implemented rules:

- 50% of the total service fee goes to the agency
- 50% of the total service fee becomes the agent pool
- If listing agent and selling agent are the same person, that agent receives the full agent pool
- If listing agent and selling agent are different, the agent pool is split equally
- Negative service fees are rejected with `BadRequestException`
- Monetary values are rounded to two decimal places

Financial breakdown fields:

- `agencyAmount`
- `listingAgentAmount`
- `sellingAgentAmount`
- `listingAgentReason`
- `sellingAgentReason`
- `calculatedAt`

The breakdown is embedded in the transaction document and remains `null` until the transaction reaches `completed`.

## StageTransitionService

Stage transition validation is handled by `StageTransitionService`.

Responsibilities:

- enforce allowed transaction transitions
- reject invalid lifecycle changes
- create stage history entries

Each transaction stores `stageHistory`, including the initial entry:

```text
fromStage: null
toStage: agreement
```

### Idempotency Considerations

Once a transaction reaches the `completed` stage, further transitions are rejected. Commission calculation is not executed again after completion. This prevents duplicate financial calculations and protects data consistency.

## Transaction Processing Flow

High-level transaction request lifecycle:

1. Client sends a request to create a transaction.
2. `TransactionsService` validates that listing and selling agents exist.
3. Transaction is created with initial stage `agreement`.
4. Initial `stageHistory` entry is stored (`null -> agreement`).
5. Client requests a stage update.
6. `StageTransitionService` validates the requested transition.
7. A new `stageHistory` item is appended.
8. If the stage becomes `completed`, `CommissionService` calculates the financial breakdown.
9. The updated transaction document is saved.
10. The updated transaction is returned to the client.

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

## Database Index Considerations

Indexes are used to support lookup performance and data integrity.

- MongoDB-managed `_id` indexes support lookup by id.
- A unique index exists on the `email` field in the `Agent` collection.
- Transaction lookups rely on `_id` and referenced agent fields.
- Additional indexes can be added later if query patterns grow.

## Project Structure

```text
api/
|-- .env.example
|-- package.json
|-- src/
|   |-- agents/
|   |   |-- agents.controller.ts
|   |   |-- agents.module.ts
|   |   |-- agents.service.ts
|   |   |-- agents.service.spec.ts
|   |   |-- dto/
|   |   `-- schemas/
|   |-- transactions/
|   |   |-- commission.service.ts
|   |   |-- commission.service.spec.ts
|   |   |-- stage-transition.service.ts
|   |   |-- stage-transition.service.spec.ts
|   |   |-- transactions.controller.ts
|   |   |-- transactions.module.ts
|   |   |-- transactions.service.ts
|   |   |-- transactions.service.spec.ts
|   |   |-- dto/
|   |   |-- enums/
|   |   `-- schemas/
|   |-- config/
|   |-- database/
|   |-- app.module.ts
|   `-- main.ts
`-- test/
```

## Database

The backend uses MongoDB through Mongoose.

Supported development options:

- local MongoDB
- MongoDB Atlas

Default local URI:

```text
mongodb://127.0.0.1:27017
```

Default database name:

```text
estate_transaction_system
```

## Environment Variables

Create an `.env` file in the `api/` directory. You can start from `.env.example`.

```env
NODE_ENV=development
PORT=3000
FRONTEND_ORIGIN=http://localhost:3001
API_PREFIX=
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DATABASE=estate_transaction_system
```

Notes:

- `NODE_ENV` must be `development`, `test`, or `production`
- `PORT` must be a valid TCP port
- `FRONTEND_ORIGIN` is used for CORS configuration
- `API_PREFIX` is optional
- `MONGODB_URI` is required in production
- `MONGODB_DATABASE` defaults to `estate_transaction_system`
- Secrets should not be committed to the repository

## Installation

From the repository root:

```bash
cd api
npm install
cp .env.example .env
```

Make sure MongoDB is available locally or configure `MONGODB_URI` for Atlas.

## Running the Backend

Development mode:

```bash
npm run start:dev
```

Production build:

```bash
npm run build
npm run start:prod
```

## Running Tests

Run all unit tests:

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

## Test Coverage Strategy

Coverage is intentionally focused on business-logic service files.

Included coverage paths:

```text
agents/**/*.service.ts
transactions/**/*.service.ts
```

These paths are relative to Jest `rootDir`, which is configured as `src`.

The service layer contains the most important business behavior:

- agent validation and duplicate email handling
- transaction orchestration
- stage transition validation
- commission calculation

Controllers, DTOs, modules, schemas, enums, bootstrap files, config files, and database setup files are intentionally excluded from the coverage metric.

Current business-logic coverage is approximately:

- Statements: 100%
- Lines: 100%
- Functions: 100%
- Branches: about 88.88%

## API Overview

Routes are unprefixed by default. If `API_PREFIX` is configured, place the prefix before each route.

Agents:

```text
POST /agents
GET /agents
GET /agents/:id
```

Transactions:

```text
POST /transactions
GET /transactions
GET /transactions/:id
PATCH /transactions/:id/stage
GET /transactions/:id/breakdown
```

## Validation Strategy

Request and runtime validation are handled separately.

### Request Validation

- DTOs validate request payload structure.
- `class-validator` and `class-transformer` are used.
- Invalid payloads return `BadRequestException`.

### Runtime Validation

- ObjectId format validation before database lookup.
- Agent existence validation before transaction creation.
- Stage transition validation before state update.
- Negative service fee validation before commission calculation.

## Failure Handling Strategy

The backend follows a fail-fast approach to protect data integrity.

- Invalid ObjectIds are rejected before database lookup.
- Missing agents block transaction creation.
- Invalid stage transitions are rejected before persistence.
- Negative service fees are rejected before commission calculation.

This prevents inconsistent transaction states and protects financial correctness.

## Error Handling

Implemented error behavior:

- invalid ObjectId -> `BadRequestException`
- missing agent or transaction -> `NotFoundException`
- duplicate agent email -> `ConflictException`
- invalid stage transition -> `BadRequestException`
- negative service fee -> `BadRequestException`
- invalid request payload -> `BadRequestException`

## Backend Future Work

Potential backend improvements:

- integration tests for controllers and database behavior
- e2e tests for the main API lifecycle
- generated API documentation if needed
- deployment configuration
- structured logging
- pagination and filtering if list requirements grow
- authentication and authorization if the product scope requires it

Frontend implementation is pending and is intentionally not described as completed in this backend README.

## Documentation Map

- `api/README.md`: backend setup, commands, endpoints, and current backend status
- `../README.md`: project-level overview
- `../DESIGN.md`: architecture decisions, data modeling rationale, lifecycle design, and testing strategy
