# Estate Transaction System Design

## Overview

This document describes the current design of the estate transaction system.

The project is a full-stack technical case with a NestJS backend and a Nuxt frontend. The backend enforces transaction lifecycle rules, validates agent references, calculates commission breakdowns, and stores transaction history. The frontend provides usable management flows on top of the API through typed services, Pinia stores, and page-level views.

This document reflects the current codebase, not an aspirational future state.

## Problem Understanding

The system models an estate transaction process where each transaction moves through a strict lifecycle before completion. The lifecycle cannot be treated as simple free-form status editing because skipped, repeated, or reversed transitions would create inconsistent business state.

Commission distribution also depends on the relationship between the listing agent and the selling agent. If both roles are handled by the same agent, the payout differs from the case where two different agents are involved. Once a transaction is completed, the financial breakdown needs to be stored as a stable snapshot.

The system therefore needs to support:

- reliable agent management
- transaction creation and retrieval
- strict stage transition enforcement
- commission calculation at completion
- embedded stage history for traceability
- API-backed frontend list, detail, create, and update flows

The core problem is more than CRUD. The important design concern is keeping lifecycle and financial rules explicit, testable, and difficult to bypass.

## Scope of Current Implementation

### Implemented

- NestJS backend under `api/`
- MongoDB/Mongoose persistence
- `AgentsModule`
- `TransactionsModule`
- agent creation, retrieval, update, and listing
- transaction creation, retrieval, listing, stage update, and breakdown retrieval
- transaction lifecycle validation
- commission calculation
- embedded financial breakdown storage
- embedded stage history storage
- backend pagination, filtering, search, and sorting for list endpoints
- Swagger/OpenAPI documentation for the backend API
- global request validation and environment validation
- service-level backend unit tests
- service-focused backend coverage configuration
- Nuxt frontend under `web/`
- dashboard page
- transactions list, create, and detail pages
- agents list, create, and edit pages
- typed frontend models and API services
- Pinia stores for agents and transactions
- async active-agent search in the create transaction flow
- query-aware list refresh after create/update mutations in stores
- reusable frontend components for dashboard cards, stage badges, recent transactions, and agent selection

### Not Implemented / Out of Scope

- authentication or authorization
- Docker configuration
- CI/CD configuration
- seed scripts
- dedicated backend dashboard aggregate endpoint
- browser-level frontend e2e tests
- implemented e2e test specs

The backend package includes an e2e test script and Jest e2e configuration, but no e2e spec file is currently implemented.

## High-Level Architecture

### Backend

The backend uses a modular NestJS structure:

- controllers handle HTTP routing
- DTOs validate and transform request payloads/query parameters
- services own business rules and orchestration
- schemas define MongoDB document structure
- config and database modules own infrastructure setup
- MongoDB is accessed through Mongoose

Business behavior is intentionally kept in services rather than controllers or schemas. Controllers stay thin, schemas describe persistence, and services coordinate validation, lifecycle rules, and financial calculation.

### Frontend

The frontend is a Nuxt application structured around pages, typed services, Pinia stores, and reusable UI components.

- Axios is provided through a Nuxt plugin as the API client.
- TypeScript types describe backend response and payload shapes.
- Service files wrap backend endpoints.
- Pinia stores manage list/detail/loading/error state.
- Pages consume stores and keep UI logic close to each route.
- Reusable components handle repeated UI patterns such as stage badges, dashboard cards, recent transaction rows, and agent search.

The frontend does not create parallel data sources. It consumes the backend API and keeps UI state aligned with paginated and filtered backend responses.

Current production entry points are documented for the submission:

- Frontend: `https://estate-transaction-system.vercel.app/`
- Backend API: `https://estate-transaction-api.onrender.com/`

## Module and Application Structure

### Backend Modules

#### AgentsModule

Owns agent-related behavior:

- create agent
- list agents
- search and filter agents
- retrieve agent by id
- update agent
- validate agent existence
- handle duplicate email conflicts

Agent update support exists because agent records may need operational changes without being recreated. Examples include correcting profile fields such as `fullName` or `email`, or changing availability through `isActive`.

#### TransactionsModule

Owns transaction-related behavior:

- create transaction
- list transactions
- retrieve transaction details
- update transaction stage
- retrieve financial breakdown
- validate agent references before creation
- enforce transaction lifecycle rules
- trigger commission calculation at completion

#### DatabaseModule

Owns Mongoose connection setup:

- reads MongoDB URI and database name from configuration
- configures connection options
- disables Mongoose auto-indexing in production

#### Config / Bootstrap

Startup configuration includes:

- environment validation
- CORS setup
- optional API prefix
- global validation pipe
- shutdown hooks

### Frontend Application Areas

#### Dashboard

Shows high-level transaction and agent metrics, revenue information for loaded completed results, success rate, and recent transaction previews.

#### Transactions List

Displays paginated transactions with backend-backed search, stage filtering, date filtering, and sorting.

#### Create Transaction

Allows creating a transaction with property title, listing agent, selling agent, service fee, and currency. Agent selection uses async backend search for active agents.

#### Transaction Detail

Shows transaction information, stage history, current stage, valid next-stage update controls, and financial breakdown when available.

#### Agents List

Displays paginated agents with backend-backed search and status filtering.

#### Create Agent

Creates an agent with full name, email, and active status.

#### Edit Agent

Loads an existing agent, supports editing full name, email, and active status, and submits updates through the agents store.

## Data Modeling Decisions

### Agent

Agents are stored in a separate `agents` collection.

Current agent fields:

- `_id`
- `fullName`
- `email`
- `isActive`
- `createdAt`
- `updatedAt`

Agents are separate documents because they can be reused across many transactions. Transactions reference agents by ObjectId rather than copying agent names into each transaction. This keeps identity stable, allows agent validation before transaction creation, and supports updating agent profile information independently.

The `email` field has a unique index. This protects agent identity and prevents duplicate records for the same email address.

The `isActive` field allows the frontend and backend to distinguish active and inactive agents without deleting records.

### Transaction

The transaction is the main aggregate root of the domain.

Current transaction fields include:

- `_id`
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

The transaction owns the lifecycle state, references the involved agents, stores the fee and currency, and eventually stores the final financial breakdown. This makes it the central business record for the case.

### Stage History

Stage history is embedded as an array inside the transaction document.

Current stage history fields:

- `fromStage`
- `toStage`
- `changedAt`

The current stage alone is not enough to understand how a transaction reached that state. `stageHistory` provides traceability and supports detail views that show lifecycle progression.

The initial history item is created during transaction creation:

```text
fromStage: null
toStage: agreement
```

Every valid stage update appends a new history item.

### Financial Breakdown

The financial breakdown is embedded inside the transaction document.

Current breakdown fields:

- `agencyAmount`
- `listingAgentAmount`
- `sellingAgentAmount`
- `listingAgentReason`
- `sellingAgentReason`
- `calculatedAt`

The breakdown belongs to exactly one transaction and does not have an independent lifecycle. Embedding keeps transaction detail reads simple and preserves a snapshot of the final payout decision at completion time.

The breakdown remains `null` until the transaction reaches `completed`.

## Query and Retrieval Design

The backend list endpoints are query-capable and return paginated results with metadata.

List responses use a consistent `{ items, meta }` shape. The `meta` object contains pagination information such as `page`, `limit`, `totalItems`, `totalPages`, `hasNextPage`, and `hasPreviousPage`.

### Agents

`GET /agents` supports:

- `page`
- `limit`
- `search`
- `status`

Agent search matches `fullName` and `email`. Status filtering supports `all`, `active`, and `inactive`. Agents are sorted by `createdAt` descending.

### Transactions

`GET /transactions` supports:

- `page`
- `limit`
- `stage`
- `search`
- `dateFrom`
- `dateTo`
- `sortBy`
- `sortOrder`

Transaction search matches `propertyTitle` and `currency`. Date filters apply to `createdAt`. Sorting supports `createdAt`, `updatedAt`, and `totalServiceFee`, with `updatedAt desc` as the default.

Transaction reads populate `listingAgentId` and `sellingAgentId` with agent summaries containing `fullName` and `email`.

This query support keeps frontend lists scalable and truthful. The UI does not need to pretend that search, filtering, pagination, or sorting are local-only when the backend supports those query paths.

## Transaction Lifecycle Design

All transactions begin in the `agreement` stage.

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

`StageTransitionService` owns this lifecycle rule. `TransactionsService` uses it before mutating transaction state.

Stage history is appended only after a transition is validated. This keeps stored history aligned with accepted lifecycle changes.

Strict transitions matter because they protect:

- consistency of transaction state
- predictability of frontend update flows
- auditability of lifecycle changes
- financial correctness at completion

## Transaction Processing Flow

The end-to-end transaction flow is:

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

## Commission Calculation Design

`CommissionService` owns financial distribution logic.

Implemented rules:

- agency receives 50% of the total service fee
- agent pool receives the remaining 50%
- same listing and selling agent receives the full agent pool
- different listing and selling agents split the agent pool equally
- monetary values are rounded to two decimal places

Same-agent result:

```text
agencyAmount = 50%
listingAgentAmount = 50%
sellingAgentAmount = 0
```

Different-agent result:

```text
agencyAmount = 50%
listingAgentAmount = 25%
sellingAgentAmount = 25%
```

The service also stores reason strings explaining the payout decision.

Commission logic is isolated in its own service because financial formulas are easier to test, explain, and extend when separated from transaction orchestration. `TransactionsService` decides when calculation should happen; `CommissionService` decides how the calculation works.

## Monetary Precision Handling

Financial calculations are rounded to two decimal places to reflect currency precision.

This prevents floating-point drift and keeps stored breakdown values aligned with expected accounting precision.

## Validation and Error-Handling Design

Validation is layered across DTOs, global configuration, and services.

### Request Validation

DTOs use `class-validator` and `class-transformer`.

Examples include:

- required string fields
- email format
- MongoDB ObjectId format
- numeric query and payload transformation
- service fee minimum
- currency length and uppercase transformation
- transaction stage enum validation

### Global Validation

The global validation pipe is configured with:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

Validation failures return a structured `BadRequestException` payload with field-level error messages.

### Runtime / Business Validation

Service-level validation covers rules that depend on current state or persistence:

- invalid ObjectId rejection before database lookup
- duplicate email conflict handling
- missing agent handling
- missing transaction handling
- invalid stage transition handling
- invalid date range handling
- negative service fee rejection inside `CommissionService`

Validation is distributed this way because DTOs are good for request shape, the global pipe protects the HTTP boundary, and services are the right place for business decisions that require state or domain context.

## Frontend Data Flow Design

The frontend follows a simple API-backed data flow:

1. Pages trigger store actions.
2. Stores call typed service functions.
3. Services use the Nuxt Axios plugin.
4. Responses update Pinia state.
5. Components render from store state and typed helpers.

This keeps API access centralized while allowing pages to remain focused on route-specific UI behavior.

Selected/detail entity state is maintained separately from paginated list state. This allows detail pages to remain stable while list queries are refreshed after create/update mutations.

### Dashboard

The dashboard displays:

- total transactions
- completed transactions
- active transactions
- active agents
- completed revenue for loaded completed results
- success rate
- recent transactions preview

The count-based KPIs avoid relying only on the currently loaded page slice. Total transactions use pagination metadata, and completed transactions use a count-oriented transaction query. Active transactions and success rate are derived from those counts.

Revenue is intentionally labeled as loaded completed revenue because there is no dedicated backend aggregate endpoint for global multi-currency revenue. The dashboard avoids collapsing mixed currencies into a fake total. When multiple currencies exist, it surfaces the most useful loaded amount while keeping the per-currency breakdown visible.

Recent transactions use the newest loaded records and are presented as a preview rather than a complete analytics report.

### Create Transaction Agent Selection

The create transaction page needs active agent selection, but loading every active agent would not scale.

The current `AgentCombobox` supports async backend search:

- initial active-agent list is small
- user input triggers backend search
- search is debounced
- backend query uses active status and a compact result limit
- dropdown shows loading and empty states

This keeps selection truthful even when there are more agents than the initial list contains.

### Store Mutation Consistency

The stores avoid unsafe optimistic list reconciliation for paginated and filtered lists.

For transactions:

- `fetchTransactions` tracks the last normalized query params.
- `createTransaction` updates detail state immediately, then refreshes the last fetched list query.
- `updateTransactionStage` updates detail state immediately, preserves populated agent references where useful, then refreshes the last fetched list query.

For agents:

- `fetchAgents` tracks the last normalized query params.
- `createAgent` updates selected agent state immediately, then refreshes the last fetched list query.
- `updateAgent` updates selected agent state immediately, then refreshes the last fetched list query.

This is intentionally simpler than normalized multi-query caching. It prioritizes truthful paginated and filtered list state over fragile local insertion/removal logic.

## Testing Strategy

Backend tests focus on the service layer because that is where the highest-value business logic lives.

Service-layer tests were prioritized over controller and e2e coverage for the current case because the highest-risk behavior lives in lifecycle enforcement and commission calculation rules.

Current backend service test files:

- `api/src/agents/agents.service.spec.ts`
- `api/src/transactions/transactions.service.spec.ts`
- `api/src/transactions/commission.service.spec.ts`
- `api/src/transactions/stage-transition.service.spec.ts`

Covered behavior includes:

- agent creation
- duplicate email handling
- agent retrieval and update behavior
- paginated agent listing behavior
- transaction creation
- transaction listing and query behavior
- agent validation before transaction creation
- default `agreement` stage
- stage history creation
- valid and invalid stage transitions
- commission calculation rules
- decimal and edge-case commission values
- completed-stage breakdown calculation
- breakdown retrieval
- invalid id handling
- not found handling

Coverage is intentionally scoped to service files:

```text
agents/**/*.service.ts
transactions/**/*.service.ts
```

This keeps the coverage metric focused on the domain logic that matters most in this case.

Frontend unit/component tests are implemented with Vitest around the current highest-value frontend logic:

- shared formatting and error-handling utilities
- reusable UI components such as `StageBadge`, `DashboardStatCard`, and `AgentCombobox`
- Pinia store behavior for paginated fetches, async agent search, and query-aware mutation refresh

The backend package still contains an e2e test script/configuration without implemented e2e specs, and browser-level frontend e2e coverage is not yet present.

## Trade-Offs and Current Limitations

Current trade-offs and limitations:

- Authentication and authorization are not implemented.
- Docker and CI/CD configuration are not implemented.
- Deployment uses Vercel for the frontend and Render for the backend API; provider-specific automation such as Docker or CI/CD is not implemented.
- There is no dedicated backend dashboard aggregate endpoint.
- Dashboard revenue is based on loaded completed results rather than a backend aggregate.
- Stores keep one active list state per resource rather than a normalized multi-query cache.
- Implemented e2e test specs are not present.
- Browser-level frontend e2e tests are not present.
- Seed scripts are not implemented.

These limitations are intentionally described as absent rather than implied as complete.

## Future Improvements

Realistic next improvements include:

- deployment hardening, monitoring, and custom-domain setup
- backend aggregate endpoint for dashboard summary and revenue metrics
- e2e tests for the main API and UI flows
- broader frontend component coverage for additional pages and interaction states
- authentication and authorization if the product scope expands
- more advanced query caching if the UI grows beyond one active list state per resource
- seed script for demo data

## Deployment Architecture

The system is deployed using a cloud-based architecture with separate hosting providers for the frontend and backend.

Frontend Deployment:

The Nuxt frontend is deployed on Vercel.

Production URL:

```text
https://estate-transaction-system.vercel.app/
```

The Vercel deployment builds the frontend using the production build process and serves the application through a globally distributed edge network.

Backend Deployment:

The NestJS backend API is deployed on Render.

Production API URL:

```text
https://estate-transaction-api.onrender.com/
```

Render handles:

- backend build execution
- environment variable injection
- process startup
- public API exposure

Database Deployment:

MongoDB Atlas is used as the managed cloud database provider.

The backend connects to MongoDB Atlas using environment-based configuration. Database connection credentials are not stored in source code.

Environment Separation:

The application supports environment-based configuration through environment variables.

Typical variables include:

- API base URL
- MongoDB connection URI
- CORS origin configuration
- runtime environment flags

Frontend runtime configuration uses:

```text
NUXT_PUBLIC_API_BASE
```

Backend runtime configuration uses:

```text
MONGODB_URI
FRONTEND_ORIGIN
NODE_ENV
```

This separation allows the system to run correctly in both development and production environments.

## Conclusion

The current design centers on explicit lifecycle enforcement, isolated commission logic, embedded transaction history, and embedded financial breakdown snapshots. The backend exposes query-capable list endpoints and keeps business rules in testable services. The frontend consumes those APIs through typed services and Pinia stores, with usable dashboard, transaction, and agent flows.

The project favors truthful API-backed UI behavior over fragile local assumptions. Paginated and filtered lists are refreshed after mutations, agent search is handled by backend queries, and dashboard metrics avoid claiming unsupported global aggregates.
