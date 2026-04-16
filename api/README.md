# Estate Transaction & Commission Management System

This project is a backend-first implementation of an estate transaction and commission management system developed as part of a technical case study.

The system manages real estate transactions between agents, enforces stage transitions, and automatically calculates financial commissions when a transaction is completed.

At the current stage, the backend is fully implemented and tested. The frontend implementation is planned as the next phase.

---

# Project Overview

The goal of this system is to manage real estate transactions between agents while ensuring:

- Correct transaction lifecycle progression
- Controlled stage transitions
- Automatic commission distribution
- Transparent financial breakdown tracking
- Historical tracking of transaction stages

The system enforces strict business rules and records all transitions and financial changes for auditability.

---

# Current Implementation Status

## Backend
✔ Implemented  
✔ Fully unit tested  
✔ Business logic validated  
✔ Coverage focused on service layer  

## Frontend
⏳ Pending  
Planned as the next phase of development.

---

# Tech Stack

## Backend

- Node.js
- TypeScript
- NestJS
- MongoDB
- Mongoose
- Jest

## Testing

- Jest
- Unit testing at service level
- Business logic coverage prioritized

---

# API Base URL

Default:

http://localhost:3000

---

# Transaction Stages

The system supports the following stages:

- agreement
- earnest_money
- title_deed
- completed

---

# Implemented Backend Features

## Agents Module

Handles agent management.

Implemented features:

- Create new agent
- Prevent duplicate emails
- Retrieve agent by ID
- Retrieve active agents
- Validate agent existence
- Sort agents by newest first

Business rules:

- Agent emails must be unique
- Only active agents are returned in list queries
- Invalid ObjectId inputs are rejected

---

## Transactions Module

Handles transaction lifecycle and financial processing.

Implemented features:

- Create new transaction
- Automatically start at `agreement`
- Update transaction stage
- Validate stage transitions
- Store stage history
- Populate agent references
- Calculate financial breakdown
- Retrieve transactions
- Retrieve breakdown information

---

## Commission Calculation

Commission distribution is handled by:

`CommissionService`

Rules:

- 50% → Agency
- 50% → Agent pool
- Same agent (listing + selling):
  - Receives full agent portion
- Different agents:
  - Split agent portion equally

Breakdown includes:

- agencyAmount
- listingAgentAmount
- sellingAgentAmount
- listingAgentReason
- sellingAgentReason
- calculatedAt

---

## Stage Transition System

Managed by:

`StageTransitionService`

Allowed transitions:

agreement → earnest_money  
earnest_money → title_deed  
title_deed → completed  
completed → (no further transitions)

Invalid transitions:

- Skipped stages
- Reverse transitions
- Same-stage transitions

All transitions are recorded in:

`stageHistory`

---

# Data Model Overview

## Agent

Stored as a separate collection.

Fields:

- fullName
- email
- isActive
- createdAt
- updatedAt

---

## Transaction

Stores the core business record.

Fields:

- propertyTitle
- totalServiceFee
- currency
- listingAgentId
- sellingAgentId
- stage
- stageHistory
- breakdown
- createdAt
- updatedAt

---

## Stage History

Stored inside transaction.

Fields:

- fromStage
- toStage
- changedAt

Used for:

- auditability
- tracking transaction lifecycle

---

## Financial Breakdown

Stored inside transaction.

Fields:

- agencyAmount
- listingAgentAmount
- sellingAgentAmount
- listingAgentReason
- sellingAgentReason
- calculatedAt

Stored only after:

`completed` stage

---

# Project Structure

project-root/
│
├── .env  
├── src/
│   ├── agents/
│   │   ├── agents.controller.ts
│   │   ├── agents.service.ts
│   │   ├── dto/
│   │   └── schemas/
│   │
│   ├── transactions/
│   │   ├── transactions.controller.ts
│   │   ├── transactions.service.ts
│   │   ├── commission.service.ts
│   │   ├── stage-transition.service.ts
│   │   ├── dto/
│   │   ├── enums/
│   │   └── schemas/
│   │
│   ├── database/
│   ├── config/
│   ├── main.ts
│   └── app.module.ts

---

# Database

This project uses MongoDB.

You can use:

- Local MongoDB
- MongoDB Atlas

Default local example:

mongodb://localhost:27017/estate-db

---

# Environment Variables

Create a `.env` file:

MONGO_URI=mongodb://localhost:27017/estate-db  
PORT=3000

---

# Installation

Install dependencies:

npm install

---

# Running the Backend

Development mode:

npm run start:dev

Production build:

npm run build  
npm run start:prod

Default server:

http://localhost:3000

---

# Running Tests

Run all tests:

npm run test

Watch mode:

npm run test:watch

Run coverage:

npm run test:cov

---

# Test Coverage Strategy

Coverage is intentionally focused on:

- Business logic services

Included:

agents/**/*.service.ts  
transactions/**/*.service.ts  

Reason:

Service layer contains the core business logic and rule enforcement.

Controllers and DTOs are intentionally excluded since they mainly handle routing and validation, not business rules.

---

# API Overview

## Agents

POST /agents  
GET /agents  
GET /agents/:id  

## Transactions

POST /transactions  
GET /transactions  
GET /transactions/:id  
PATCH /transactions/:id/stage  
GET /transactions/:id/breakdown  

---

# Error Handling

The system handles:

- Invalid ObjectId → BadRequestException
- Missing resources → NotFoundException
- Duplicate email → ConflictException
- Invalid stage transition → BadRequestException
- Negative service fee → BadRequestException

---

# Next Steps

Planned frontend implementation:

- Transaction list page
- Transaction detail page
- Stage update UI
- Financial breakdown display
- Agent management UI

Frontend stack (planned):

- Nuxt 3
- Pinia
- TailwindCSS

---

# Design Documentation

Detailed architectural decisions are documented in:

DESIGN.md

This includes:

- Data modeling decisions
- Service responsibilities
- Transaction lifecycle design
- Commission calculation logic
- Testing strategy

---

# Notes

This implementation prioritizes:

- Data consistency
- Business rule correctness
- Maintainability
- Testability
