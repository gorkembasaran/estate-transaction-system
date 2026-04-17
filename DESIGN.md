# Estate Transaction System Design

## Overview

This document explains the current backend design for the estate transaction and commission management technical case.

The implemented backend focuses on transaction lifecycle control, agent validation, commission calculation, and traceable financial breakdowns. It is built with NestJS, TypeScript, MongoDB, Mongoose, and Jest.

Frontend work is pending. This document only describes implemented backend behavior and clearly separates future work from completed work.

## Problem Understanding

The case describes a real estate agency process where transactions move through several stages before completion. After completion, the total service fee must be distributed between the agency and the involved agents according to defined business rules.

The main backend responsibilities are:

- manage agents
- create and retrieve transactions
- enforce valid transaction stage transitions
- calculate commission distribution
- preserve transaction traceability
- expose APIs that can later be consumed by a frontend

The core challenge is not basic CRUD. The important part is making the lifecycle and commission rules explicit, testable, and difficult to misuse.

## Scope of Current Implementation

Implemented:

- NestJS backend under `api/`
- MongoDB / Mongoose database integration
- `AgentsModule`
- `TransactionsModule`
- `CommissionService`
- `StageTransitionService`
- global validation pipe
- environment validation
- dedicated database module
- service-level Jest unit tests
- service-focused coverage configuration

Not implemented yet:

- functional frontend pages, components, and state management
- deployment configuration
- live API URL
- live frontend URL
- authentication or authorization
- pagination, filtering, or search
- Swagger / OpenAPI generation
- Docker configuration
- CI/CD configuration
- seed scripts

## Architecture Decisions

The backend follows a modular NestJS structure:

- controllers handle HTTP routes
- DTOs validate request payload shape
- services contain business rules and orchestration
- schemas define MongoDB document structure
- database module owns MongoDB connection setup
- config validation protects application startup

The main design choice is to keep business behavior in services rather than spreading it across controllers or Mongoose schemas.

This keeps the code easier to:

- test
- explain
- extend
- review in a technical interview

## Module Structure

Current backend structure:

```text
api/src/
├── agents/
│   ├── agents.controller.ts
│   ├── agents.module.ts
│   ├── agents.service.ts
│   ├── agents.service.spec.ts
│   ├── dto/
│   │   └── create-agent.dto.ts
│   └── schemas/
│       └── agent.schema.ts
├── transactions/
│   ├── commission.service.ts
│   ├── commission.service.spec.ts
│   ├── stage-transition.service.ts
│   ├── stage-transition.service.spec.ts
│   ├── transactions.controller.ts
│   ├── transactions.module.ts
│   ├── transactions.service.ts
│   ├── transactions.service.spec.ts
│   ├── dto/
│   ├── enums/
│   └── schemas/
├── config/
│   └── env.validation.ts
├── database/
│   └── database.module.ts
├── app.module.ts
└── main.ts
```

### Agents Module

Responsibilities:

- create agents
- list active agents
- retrieve an agent by id
- validate agent existence
- handle duplicate email conflicts

### Transactions Module

Responsibilities:

- create transactions
- list transactions
- retrieve transaction details
- update transaction stage
- return transaction breakdown
- coordinate agent validation
- coordinate stage-transition validation
- coordinate commission calculation

### Database Module

Responsibilities:

- configure Mongoose connection
- read `MONGODB_URI` and `MONGODB_DATABASE`
- disable automatic index creation in production
- keep infrastructure setup outside domain modules

## Data Modeling Decisions

MongoDB is used as the persistence layer through Mongoose schemas.

The transaction document is treated as the main business aggregate because it owns:

- current lifecycle stage
- stage history
- agent references
- final financial breakdown
- transaction fee and currency

## Why Agents Are a Separate Collection

Agents are stored in a separate `agents` collection.

Current agent fields:

- `fullName`
- `email`
- `isActive`
- `createdAt`
- `updatedAt`

Reasons for using a separate collection:

- agents can be reused across many transactions
- transaction documents avoid duplicating agent profile data
- transaction creation can validate that referenced agents exist
- agent email uniqueness can be enforced at the agent level
- future reporting can group transactions by agent

Transactions store `listingAgentId` and `sellingAgentId` as `ObjectId` references to the agent collection.

## Database Index Considerations

Indexes are used to support lookup performance and data integrity.

Current indexes:

- MongoDB-managed `_id` indexes for agent and transaction lookup by id
- unique `email` index in the `Agent` collection
- compound transaction index on `stage` and `createdAt`
- transaction index on `listingAgentId`
- transaction index on `sellingAgentId`

The agent email index protects data integrity by preventing duplicate agent emails at the database level. The transaction indexes support common backend access patterns such as stage-based retrieval and agent-related transaction lookup.

Future improvements may include additional query-driven compound indexes after frontend usage patterns, pagination, and filtering requirements are implemented.

## Performance Considerations

Current design choices support performance without premature optimization.

- Embedded financial breakdown avoids additional collection lookups.
- Embedded stage history allows full lifecycle retrieval in a single read.
- Unique email index prevents duplicate agent creation efficiently.
- Future query-driven indexes can be introduced when real usage patterns emerge.

## Why Financial Breakdown Is Embedded in Transaction

Financial breakdown is embedded directly inside the transaction document.

Current breakdown fields:

- `agencyAmount`
- `listingAgentAmount`
- `sellingAgentAmount`
- `listingAgentReason`
- `sellingAgentReason`
- `calculatedAt`

This was chosen because the breakdown belongs to exactly one transaction and does not need an independent lifecycle.

Embedding provides:

- a single read for transaction detail and financial result
- a clear snapshot of the completed transaction
- lower persistence complexity
- simpler frontend consumption later

The breakdown remains `null` until the transaction reaches `completed`.

## Why Stage History Is Stored

`stageHistory` is stored as an embedded array inside the transaction document.

Current stage history fields:

- `fromStage`
- `toStage`
- `changedAt`

This supports traceability. The system should show not only the current stage, but also how the transaction reached that stage.

The initial history item is created when the transaction is created:

```text
fromStage: null
toStage: agreement
```

Each valid stage update appends a new history item.

## Why Business Rules Are Handled in Services Rather Than Schemas

Schemas define persistence structure:

- field types
- required fields
- enum values
- indexes
- references

Services define behavior:

- whether an action is allowed
- how stage transitions work
- when a breakdown is calculated
- how commission is distributed
- what exceptions should be raised

Keeping business rules in services makes the important logic easier to unit test and easier to reason about. It also avoids mixing domain behavior with persistence definitions.

## Transaction Lifecycle Design

Transactions always start in:

```text
agreement
```

The create endpoint does not accept an initial stage. This prevents callers from bypassing the lifecycle by creating a transaction directly as `completed`.

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
- transitions from `completed`

`StageTransitionService` owns this validation so the rules are isolated and directly testable.

## Transaction Processing Flow

The transaction flow is designed as a small orchestration around explicit domain services.

1. Client sends a request to create a transaction.
2. `TransactionsService` validates listing and selling agent existence.
3. Transaction is created with initial stage `agreement`.
4. Initial `stageHistory` entry (`null -> agreement`) is stored.
5. Client sends a stage update request.
6. `StageTransitionService` validates the requested lifecycle transition.
7. A new `stageHistory` item is appended.
8. If the new stage is `completed`, `CommissionService` calculates the financial breakdown.
9. Transaction document is updated and persisted.
10. Updated transaction is returned to the client.

## Idempotency Considerations

Stage transitions are designed to be idempotent at the business level.

If a transaction is already in the `completed` stage:

- further transitions are rejected
- commission calculation is not re-triggered
- the stored financial breakdown remains unchanged

This protects financial consistency and prevents duplicate payout logic execution.

## Commission Calculation Design

`CommissionService` owns commission calculation.

Implemented rules:

- agency receives 50% of the total service fee
- agent pool is the remaining 50%
- same listing and selling agent receives the full agent pool
- different listing and selling agents split the agent pool equally

Same-agent case:

```text
agencyAmount = 50%
listingAgentAmount = 50%
sellingAgentAmount = 0
```

The same-agent payout is stored once under `listingAgentAmount` to avoid visually duplicating a payout for the same person.

Different-agent case:

```text
agencyAmount = 50%
listingAgentAmount = 25%
sellingAgentAmount = 25%
```

The service rounds monetary values to two decimal places and includes reason strings explaining the payout decision.

The breakdown is calculated when a transaction transitions to `completed`. This makes the stored breakdown a final transaction snapshot.

`CommissionService` also rejects negative service fees with `BadRequestException`.

## Monetary Precision Handling

Financial calculations are rounded to two decimal places to reflect currency precision.

This prevents floating-point drift and ensures that:

- totals remain predictable
- frontend displays stable monetary values
- stored breakdown values match expected accounting precision

## Validation and Error-Handling Approach

Validation happens at multiple levels.

### Request Validation

DTOs use `class-validator` and `class-transformer` for request payload validation and transformation.

Examples:

- required string fields
- email format
- MongoDB ObjectId format
- numeric service fee transformation
- currency length and uppercase validation
- transaction stage enum validation

### Global Validation Pipe

The global validation pipe is configured with:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

Validation errors are returned as a structured `BadRequestException` payload with field-level messages.

### Environment Validation

Environment variables are validated during application startup.

Validation covers:

- `NODE_ENV`
- `PORT`
- optional `API_PREFIX`
- optional `FRONTEND_ORIGIN`
- `MONGODB_URI`
- `MONGODB_DATABASE`

In production, `MONGODB_URI` is required.

### Runtime Business Errors

Implemented runtime error behavior:

- invalid ObjectId -> `BadRequestException`
- missing agent or transaction -> `NotFoundException`
- duplicate agent email -> `ConflictException`
- invalid stage transition -> `BadRequestException`
- negative service fee in `CommissionService` -> `BadRequestException`

## Failure Handling Strategy

The backend follows a fail-fast strategy to prevent invalid state transitions and inconsistent financial data.

- Invalid ObjectIds are rejected before database queries.
- Missing agents block transaction creation.
- Invalid stage transitions are rejected before persistence.
- Negative service fees are rejected before commission calculation.

This protects data integrity and ensures financial correctness.

## Testing Strategy

Testing currently focuses on the service layer because this is where the business rules live.

Implemented unit test files:

- `agents.service.spec.ts`
- `commission.service.spec.ts`
- `stage-transition.service.spec.ts`
- `transactions.service.spec.ts`

Covered behavior includes:

- agent creation
- duplicate email handling
- unknown database error pass-through
- active-only agent listing
- invalid id handling
- missing resource handling
- transaction creation
- agent validation before transaction creation
- default `agreement` stage
- stage history creation
- valid and invalid stage transitions
- commission calculation rules
- decimal and edge-case commission values
- completed-stage breakdown calculation
- populated transaction reads
- breakdown retrieval

Tests instantiate services directly with mocked dependencies where practical. This keeps unit tests fast and focused on business behavior.

## Coverage Scope Rationale

Coverage is intentionally scoped to service files:

```text
src/agents/**/*.service.ts
src/transactions/**/*.service.ts
```

This is configured in the Jest `collectCoverageFrom` setting.

The goal is to measure coverage for the domain logic that matters most in this case:

- agent rules
- transaction orchestration
- stage transition rules
- commission calculation

Controllers, DTOs, modules, schemas, enums, bootstrap files, config files, and database setup files are intentionally excluded from the coverage metric. They are still part of the application, but they are not the primary source of business-rule complexity.

Current business-logic coverage is approximately:

- Statements: 100%
- Lines: 100%
- Functions: 100%
- Branches: about 88.88%

## Trade-Offs / Future Improvements

Current trade-offs:

- No authentication or authorization has been implemented.
- No pagination, filtering, or search has been implemented.
- No Swagger / OpenAPI documentation has been implemented.
- No Docker configuration has been added.
- No CI/CD configuration has been added.
- No seed scripts have been added.
- Integration and e2e tests are not the current focus.

Future backend improvements may include:

- integration tests for controller and database behavior
- e2e tests for the API lifecycle
- pagination and filtering if list size becomes important
- generated API documentation
- structured logging
- deployment configuration

These are intentionally not described as implemented.

## Pending Frontend Work

Frontend implementation is pending.

The planned frontend phase will likely consume the existing backend endpoints for:

- listing agents
- creating transactions
- listing transactions
- viewing transaction details
- updating transaction stages
- displaying financial breakdowns

Frontend pages, components, composables, and state management decisions will be documented after they are implemented.

## Deployment Note

Deployment has not been completed yet.

There is currently no live API URL and no live frontend URL. The backend is documented for local development and testing at this stage.
