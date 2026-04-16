# Estate Transaction System

Full-stack technical case for tracking estate agency transactions, stage
transitions, and commission breakdowns.

## Backend Environment

The NestJS API reads MongoDB configuration from environment variables.

For local development, if `MONGODB_URI` is not set, the API falls back to:

```bash
mongodb://127.0.0.1:27017/estate_transaction_system
```

Create a local env file from the example:

```bash
cd api
cp .env.example .env
```

For production, set these variables in the deployment platform:

```bash
NODE_ENV=production
MONGODB_URI=<your MongoDB Atlas connection string>
MONGODB_DATABASE=estate_transaction_system
```

`MONGODB_URI` is required in production. Secrets should stay in the deployment
environment and should not be committed to the repository.

## Backend Commands

```bash
cd api
npm install
npm run start:dev
npm run build
```
