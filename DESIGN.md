# DESIGN.md

# Estate Transaction & Commission Management System  
## Backend Design Document

This document explains the architectural and design decisions behind the current backend implementation of the estate transaction and commission management system.

The purpose of this system is to manage real estate transactions, enforce transaction lifecycle rules, and calculate commission distribution in a traceable and maintainable way.

At the current stage, this document reflects the **implemented backend architecture**. Frontend work is planned as the next phase and is listed separately under future work.

---

# 1. Problem Understanding

The case requires a system that can:

- Track the lifecycle of a real estate transaction
- Enforce valid stage transitions
- Calculate the financial distribution for the agency and agents
- Preserve traceability of transaction progress
- Expose an API that can later be consumed by a frontend application

The main business difficulty is not simple CRUD. The core challenge is the correct implementation of domain rules:

- A transaction must move through a defined set of stages
- Invalid stage jumps should be rejected
- Commission calculation depends on the relationship between the listing agent and the selling agent
- Completed transactions must expose a clear financial breakdown

Because of this, the project was designed around **business rules first**, rather than around database persistence alone.

---

# 2. Scope of Current Implementation

## Implemented

The current implementation includes:

- NestJS backend
- MongoDB / Mongoose integration
- Agents module
- Transactions module
- Commission calculation service
- Stage transition service
- Validation and environment configuration
- Unit tests for the service layer
- Coverage focused on business logic services

## Not Yet Implemented

The following are intentionally not yet implemented:

- Frontend pages and components
- Frontend state management
- Deployment configuration
- Authentication / authorization
- Pagination / filtering
- Swagger / OpenAPI documentation
- Integration tests / end-to-end tests
- CI/CD configuration

These items were intentionally deferred to keep the first phase focused on correctness of the backend domain logic.

---

# 3. High-Level Architecture

The backend uses a modular NestJS structure.

## Main modules

- `AgentsModule`
- `TransactionsModule`
- `DatabaseModule`
- global configuration / bootstrap setup

The system follows a layered structure:

- **Controller layer**: HTTP routing and request handling
- **Service layer**: business rules and orchestration
- **Schema / persistence layer**: Mongoose models and document structure
- **Configuration layer**: environment validation and database setup

The most important architectural decision in this implementation is that **business rules are handled explicitly in services**, not hidden in controllers or mixed into schemas.

---

# 4. Module Structure

## 4.1 Agents Module

The `AgentsModule` is responsible for agent-related operations.

### Responsibilities

- Create agent
- Prevent duplicate emails
- List active agents
- Retrieve agent by ID
- Validate that an agent exists

### Files

- `agents.controller.ts`
- `agents.service.ts`
- `dto/`
- `schemas/`

The module is intentionally small because agent management is not the core domain complexity of the case. However, it is still important because transaction creation depends on valid agent references.

---

## 4.2 Transactions Module

The `TransactionsModule` is the central module of the system.

### Responsibilities

- Create transaction
- Retrieve transactions
- Retrieve transaction details
- Update transaction stage
- Return transaction breakdown
- Orchestrate stage transition validation
- Orchestrate commission calculation

### Files

- `transactions.controller.ts`
- `transactions.service.ts`
- `commission.service.ts`
- `stage-transition.service.ts`
- `dto/`
- `schemas/`
- `enums/`

This module was designed so that transaction orchestration is separated from the lower-level business rules.

---

## 4.3 Database Module

The `DatabaseModule` wraps MongoDB connection setup through `MongooseModule.forRootAsync`.

### Responsibilities

- Read MongoDB connection config from environment variables
- Provide a clean entry point for database configuration
- Keep connection logic outside business modules

This separation keeps infrastructure concerns away from domain services.

---

# 5. Data Modeling Decisions

The project uses MongoDB because the technical case requires it and because the domain fits well into document-based storage.

The data model was designed to keep the **transaction** as the main business aggregate.

---

## 5.1 Agent as a Separate Collection

Agents are stored in their own collection.

### Agent fields

- `fullName`
- `email`
- `isActive`
- `createdAt`
- `updatedAt`

### Why agents are separate

Agents were modeled as a separate collection for the following reasons:

1. **Avoiding data duplication**  
   Agent information should not be copied into every transaction as raw strings.

2. **Referential consistency**  
   A transaction should point to a known agent record.

3. **Validation**  
   The system needs to verify that the listing and selling agents actually exist.

4. **Future extensibility**  
   A separate agent model makes future reporting and filtering much easier.

5. **Cleaner transaction documents**  
   Transactions store references, not repeated copies of the same agent profile data.

Because of this, `listingAgentId` and `sellingAgentId` are stored as `ObjectId` references to `Agent`.

---

## 5.2 Transaction as the Core Aggregate

The transaction document is the main business record.

### Transaction fields

- `propertyTitle`
- `totalServiceFee`
- `currency`
- `listingAgentId`
- `sellingAgentId`
- `stage`
- `breakdown`
- `stageHistory`
- `createdAt`
- `updatedAt`

### Why transaction is the main aggregate

The case revolves around the lifecycle of a single estate transaction.  
A transaction owns:

- the current stage
- the history of stage changes
- the financial breakdown
- the agent references involved in the deal

That makes it the natural aggregate root of the domain.

---

## 5.3 Why Financial Breakdown Is Embedded

Financial breakdown is stored directly inside the transaction document instead of being moved to a separate collection.

### Breakdown fields

- `agencyAmount`
- `listingAgentAmount`
- `sellingAgentAmount`
- `listingAgentReason`
- `sellingAgentReason`
- `calculatedAt`

### Why this was chosen

Financial breakdown is tightly coupled to one transaction and does not need an independent lifecycle.

Embedding it provides several advantages:

1. **Single read for transaction details**  
   The frontend can fetch one transaction and already have its financial result.

2. **Tight domain coupling**  
   Breakdown has no meaning without a transaction.

3. **Lower complexity**  
   A separate collection would introduce unnecessary join-like logic and additional queries.

4. **Snapshot behavior**  
   Once the transaction reaches `completed`, the final calculation is stored as part of that transaction state.

This approach is well suited for the current scope of the case.

---

## 5.4 Why Stage History Is Stored

`stageHistory` is stored inside the transaction document as an array.

### Stage history fields

- `fromStage`
- `toStage`
- `changedAt`

### Why this was chosen

The case explicitly mentions traceability.  
Keeping only the current stage would not be enough to support that idea.

Stage history was added because it provides:

1. **Lifecycle traceability**
2. **Auditability**
3. **Simpler frontend timeline display**
4. **More explicit business event tracking**

The first entry is created when the transaction is created:

- `fromStage: null`
- `toStage: agreement`

Subsequent transitions append new history items.

---

# 6. Transaction Lifecycle Design

The system supports the following stage order:

- `agreement`
- `earnest_money`
- `title_deed`
- `completed`

This order is strict.

## Allowed transitions

- `agreement -> earnest_money`
- `earnest_money -> title_deed`
- `title_deed -> completed`

## Rejected transitions

- same-stage transitions
- skipped stages such as `agreement -> completed`
- reverse transitions
- any transition after `completed`

### Why strict transitions were chosen

Strict transition control was chosen for the following reasons:

1. **Business integrity**  
   Transaction state should reflect a real-world process.

2. **Predictable backend behavior**  
   Commission logic and historical tracking depend on a stable lifecycle.

3. **Cleaner frontend assumptions**  
   The UI can rely on a known order of stages.

4. **Reduced accidental misuse**  
   Invalid transitions are explicitly blocked instead of silently accepted.

The decision to reject invalid transitions was intentional and is one of the main rule-enforcement parts of the backend.

---

# 7. Commission Calculation Design

Commission logic is isolated in `CommissionService`.

## Business rules implemented

- 50% of the service fee belongs to the agency
- The remaining 50% is the agent pool

### Scenario A: Same listing and selling agent

If `listingAgentId` and `sellingAgentId` are the same:

- agency gets 50%
- listing agent gets 50%
- selling agent amount is stored as `0`

### Scenario B: Different listing and selling agents

If the agents are different:

- agency gets 50%
- listing agent gets 25%
- selling agent gets 25%

## Why CommissionService is separate

Commission calculation was moved into its own service because it is:

- an isolated business rule
- easy to unit test independently
- likely to evolve in real-world scenarios
- easier to read when separated from transaction orchestration

This separation keeps `TransactionsService` focused on process flow rather than formula details.

## Calculation timing

The financial breakdown is calculated when a transaction reaches `completed`.

### Why calculate on completion

This was chosen because:

1. the transaction is considered finalized at that stage
2. commission should represent a final snapshot
3. storing it earlier would imply that the transaction is already settled

As a result, `breakdown` remains `null` until the transaction reaches `completed`.

---

# 8. Service Layer Responsibilities

The current backend uses explicit service separation.

## 8.1 AgentsService

Responsible for:

- agent creation
- duplicate email handling
- active agent listing
- fetching agent by ID
- validating agent existence

## 8.2 TransactionsService

Responsible for:

- transaction creation
- transaction retrieval
- stage updates
- history appending
- invoking commission calculation when appropriate
- coordinating transaction-related use cases

## 8.3 CommissionService

Responsible only for:

- commission math
- payout allocation
- financial reasoning strings
- final breakdown object creation

## 8.4 StageTransitionService

Responsible only for:

- checking allowed transitions
- creating stage history entries

### Why this separation matters

This service split improves:

- readability
- testability
- maintainability
- clarity of responsibility

It also makes interviews and reviews easier because the business rules are easy to locate and explain.

---

# 9. Why Business Rules Are in Services, Not Schemas

Schemas define:

- field names
- field types
- required values
- enums
- persistence structure

Services define:

- what the system is allowed to do
- how transitions happen
- how money is distributed
- when breakdown is calculated
- when errors are raised

This separation was intentional.

## Why not put rules in schemas

If commission and transition rules were mixed into schemas:

- logic would be harder to test
- domain behavior would be spread across persistence definitions
- the code would be harder to read and maintain

For this reason:

- schemas stay structural
- services stay behavioral

This is the clearest design for the current project.

---

# 10. Validation and Error Handling Strategy

The backend uses validation at multiple layers.

## 10.1 Request DTO validation

DTOs validate incoming request payloads using `class-validator`.

Examples:

- required fields
- string fields
- numeric values
- enum values
- ObjectId format in DTOs

## 10.2 Global validation pipe

A global `ValidationPipe` is configured in `main.ts` with:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

This ensures:

- extra properties are rejected
- payloads are transformed correctly
- request contracts stay strict

## 10.3 Environment validation

Environment variables are validated before the app starts.

This prevents configuration problems such as:

- invalid `PORT`
- invalid `NODE_ENV`
- missing production `MONGODB_URI`

## 10.4 Runtime business validation

Business validations happen in services.

Examples:

- invalid ObjectId -> `BadRequestException`
- agent not found -> `NotFoundException`
- duplicate email -> `ConflictException`
- invalid stage transition -> `BadRequestException`
- negative service fee -> `BadRequestException`

### Why this approach was chosen

This layered validation strategy keeps errors closer to their source:

- input shape issues -> DTO validation
- system configuration issues -> env validation
- domain rule issues -> service exceptions

This is easier to debug and easier to document.

---

# 11. Query and Retrieval Decisions

## 11.1 Active-only agent listing

`getAllAgents()` returns only agents with `isActive: true`.

### Why

Inactive agents should not normally appear in selection flows for new transactions.

This makes the API more aligned with expected usage.

---

## 11.2 Populated transaction retrieval

Transaction queries populate:

- `listingAgentId` with `fullName` and `email`
- `sellingAgentId` with `fullName` and `email`

### Why

This avoids forcing the frontend to make extra lookups just to display names and emails.

The backend keeps the database normalized while still returning frontend-friendly responses.

---

# 12. Testing Strategy

Testing focuses on the service layer, because that is where the important business logic lives.

## Tested services

- `agents.service.spec.ts`
- `commission.service.spec.ts`
- `stage-transition.service.spec.ts`
- `transactions.service.spec.ts`

## What is covered

### AgentsService
- create success
- duplicate email handling
- unknown error propagation
- active-only listing
- invalid ID handling
- not found handling
- validateAgentExists behavior

### CommissionService
- same-agent commission distribution
- different-agent distribution
- fractional values
- zero values
- very small values
- large values
- negative fee rejection

### StageTransitionService
- valid transitions
- invalid transitions
- same-stage rejection
- history item generation

### TransactionsService
- transaction creation
- agent validation before creation
- default stage assignment
- stage history creation
- completed-stage breakdown calculation
- non-final stage updates
- invalid transition rejection
- populated transaction retrieval
- breakdown retrieval
- invalid ID handling
- not found handling

## Why the testing scope is service-focused

Coverage was intentionally narrowed to service files only.

### Included in coverage

- `src/agents/**/*.service.ts`
- `src/transactions/**/*.service.ts`

### Excluded from coverage emphasis

- controllers
- DTOs
- modules
- schemas
- bootstrap / config files

### Why

Controllers and DTOs are important, but the highest-value correctness in this project comes from business rules, transitions, and calculations.  
Service-level coverage is therefore the most meaningful signal for this case.

## Current result

Business-logic service coverage is currently approximately:

- Statements: 100%
- Lines: 100%
- Functions: 100%
- Branches: about 88.88%

This is considered strong coverage for the current backend scope.

---

# 13. Trade-offs and Non-Goals

Some choices were intentionally simplified for this phase.

## Trade-offs

### 1. No authentication / authorization yet
Not required by the case at this stage, so it was intentionally deferred.

### 2. No pagination / filtering yet
The API currently focuses on core correctness rather than list scalability features.

### 3. No Swagger / OpenAPI yet
The project currently relies on README and DESIGN.md documentation instead.

### 4. No integration or e2e tests yet
Unit tests were prioritized first because the main risk in the case is business-rule correctness.

### 5. No deployment configuration yet
This phase focuses on local backend correctness and architecture before deployment polishing.

These are conscious scope decisions, not omissions caused by uncertainty.

---

# 14. Pending Frontend Work

Frontend work has not yet been implemented.

Planned frontend responsibilities include:

- listing transactions
- showing transaction details
- showing populated agent information
- updating stages
- displaying commission breakdown
- managing agents

The intended frontend stack is:

- Nuxt 3
- Pinia
- TailwindCSS

Frontend-specific design decisions will be documented after implementation so that the document reflects actual code rather than assumptions.

---

# 15. Future Improvements

Possible next improvements include:

- frontend implementation
- deployment configuration
- API documentation generation
- integration tests
- e2e tests
- pagination and filtering
- structured logging
- role-based access control
- audit-friendly metadata expansion

These were not prioritized in the first backend phase because the case is primarily evaluated on design quality and rule correctness.

---

# 16. Conclusion

The backend was designed around the core domain concerns of the case:

- lifecycle integrity
- commission correctness
- traceability
- maintainability
- testability

The most important decisions were:

- using transaction as the aggregate root
- storing agent records separately
- embedding financial breakdown inside transactions
- recording stage history
- separating commission logic and stage-transition logic into dedicated services
- concentrating automated tests on service-layer business rules

This results in a backend that is simple enough for the current case scope, while still being structured in a way that can be extended in the next phase.
