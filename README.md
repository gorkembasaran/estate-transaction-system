# Estate Transaction System

Full-stack technical case for tracking estate agency transactions, stage
transitions, and commission breakdowns.

This repository contains both backend and frontend components.
At the current stage, the backend implementation is completed and fully tested.
Frontend implementation will follow in the next phase.

---

# Project Overview

The goal of this system is to manage real estate transactions between agents
while enforcing strict lifecycle transitions and automatically calculating
commission breakdowns.

Core responsibilities of the system:

- Manage real estate agents
- Track transaction lifecycle stages
- Enforce valid stage transitions
- Calculate commission distribution
- Store transaction history
- Maintain financial transparency
- Ensure business rule correctness

---

# Current Status

## Backend (api/)

✔ Implemented  
✔ Business logic completed  
✔ Unit tests implemented  
✔ Service-level coverage enabled  
✔ MongoDB integration completed  

Key backend features:

- Agent management
- Transaction creation
- Stage transition validation
- Commission calculation
- Breakdown generation
- Stage history tracking

## Frontend

⏳ Pending

Planned features:

- Transaction list interface
- Transaction detail view
- Stage update interface
- Breakdown visualization
- Agent management UI

---

# Tech Stack

## Backend

- Node.js
- TypeScript
- NestJS
- MongoDB
- Mongoose
- Jest

## Frontend (planned)

- Nuxt 3
- Pinia
- TailwindCSS

---

# Project Structure

project-root/

README.md  
DESIGN.md  

api/  
 ├── src/  
 ├── test/  
 ├── package.json  
 ├── .env.example  

frontend/ (planned)

---

# Backend Setup

Navigate into backend:

```bash
cd api
```

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env
```

If `MONGODB_URI` is not set, the API falls back to:

```bash
mongodb://127.0.0.1:27017/estate_transaction_system
```

Run development server:

```bash
npm run start:dev
```

Build production version:

```bash
npm run build
npm run start:prod
```

Default backend URL:

```
http://localhost:3000
```

---

# Running Tests

Run all tests:

```bash
npm run test
```

Run coverage:

```bash
npm run test:cov
```

Test coverage focuses on:

- Core business logic services
- Transaction lifecycle validation
- Commission calculation rules

Controllers and DTOs are intentionally excluded from coverage metrics
since they mainly handle routing and validation logic.

---

# Database

The system uses MongoDB.

Supported options:

- Local MongoDB
- MongoDB Atlas

Default local database:

```
mongodb://127.0.0.1:27017/estate_transaction_system
```

Production configuration requires:

```bash
NODE_ENV=production
MONGODB_URI=<your MongoDB Atlas connection string>
MONGODB_DATABASE=estate_transaction_system
```

Secrets must not be committed to the repository.

---

# API Summary

Main API modules:

## Agents

- Create agent
- Retrieve active agents
- Retrieve agent by ID
- Validate agent existence

## Transactions

- Create transaction
- Update transaction stage
- Validate stage transitions
- Store stage history
- Generate commission breakdown
- Retrieve transaction details

---

# Design Documentation

Architectural decisions and system design details are documented in:

```
DESIGN.md
```

This includes:

- Service responsibilities
- Transaction lifecycle logic
- Commission distribution rules
- Data modeling decisions
- Testing strategy

---

# Future Work

Planned improvements:

- Frontend implementation
- Integration testing
- Deployment configuration
- Logging and monitoring
- Role-based authorization
- Pagination support
- API versioning

---

# Notes

This project prioritizes:

- Business rule correctness
- Maintainable architecture
- Testable services
- Clear lifecycle enforcement
