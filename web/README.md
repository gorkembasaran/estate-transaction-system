# Estate Transaction Frontend

Nuxt frontend for the estate transaction and commission management system.

The app consumes the NestJS backend API and provides usable dashboard, transaction, and agent management flows. It uses typed service functions, Pinia stores, reusable components, and route-level pages to keep frontend behavior aligned with the backend.

## Current Frontend Status

Implemented:

- application shell with sidebar navigation
- light/dark theme mode
- API integration through an Axios Nuxt plugin
- typed models for agents, transactions, pagination, and API errors
- Pinia stores for agents and transactions
- dashboard page
- transactions list, create, and detail pages
- agents list, create, and edit pages
- backend-backed pagination, filtering, search, and sorting where the API supports it
- async active-agent search in the create transaction flow
- loading, error, and empty states on the main data pages
- query-aware list refresh after create/update mutations

Not currently implemented:

- frontend automated tests
- authentication or authorization UI
- dedicated dashboard aggregate API integration for global revenue totals

## Tech Stack

- Nuxt, current package version `^4.4.2`
- Vue 3 / Composition API
- TypeScript
- Pinia
- Axios
- Tailwind CSS module
- custom global and scoped CSS

## Runtime Requirements

- Node.js
- npm
- running backend API

The frontend expects the backend API to be available before API-backed pages can load data.

## Environment / API Configuration

The backend API base URL is configured in `nuxt.config.ts` through runtime config:

```ts
runtimeConfig: {
  public: {
    apiBase: defaultApiBase,
  },
}
```

Nuxt overrides this public runtime config value from `NUXT_PUBLIC_API_BASE` when it is provided. The Axios plugin reads `config.public.apiBase`, normalizes trailing slashes, and creates the injected `$api` client.

Default local API base:

```text
http://127.0.0.1:3000
```

Create a local environment file from the example:

```bash
cp .env.example .env
```

To override it locally:

```bash
NUXT_PUBLIC_API_BASE=http://127.0.0.1:3000 npm run dev
```

For production frontend deployments, set:

```text
NUXT_PUBLIC_API_BASE=https://estate-transaction-api.onrender.com/
```

Production frontend URL:

```text
https://estate-transaction-system.vercel.app/
```

If the runtime config value is missing or empty, the plugin falls back to the local default.

## Frontend Quick Start

From the repository root:

```bash
cd web
npm install
npm run dev
```

Nuxt will print the local frontend URL in the terminal. The backend should be running separately, usually on:

```text
http://127.0.0.1:3000
```

## Implemented Pages / Routes

### `/`

Dashboard page.

Shows transaction and agent summary cards, completed revenue for loaded completed results, success rate, and recent transaction preview rows.

### `/transactions`

Transactions list page.

Supports backend-backed pagination, search, stage filtering, created-date range filtering, and sorting by created date, updated date, or service fee. Agent names link to the matching edit-agent route when populated agent data is available.

### `/transactions/create`

Create transaction page.

Allows creating a transaction with property title, listing agent, selling agent, service fee, and currency. Agent selection uses async backend search against active agents.

### `/transactions/:id`

Transaction detail page.

Shows transaction information, populated agent summaries when available, stage history timeline, current stage, next-stage update controls, and financial breakdown when the transaction has completed.

### `/agents`

Agents list page.

Supports backend-backed pagination, search by name/email, and status filtering for all, active, and inactive agents.

### `/agents/create`

Create agent page.

Allows creating an agent with full name, email, and active status.

### `/agents/:id/edit`

Edit agent page.

Loads an agent by id and allows editing full name, email, and active status.

## Frontend Architecture

The frontend is organized around route pages, stores, typed services, reusable components, and helper utilities.

Important directories:

```text
web/app/
├── app.vue
├── layouts/
│   └── default.vue
├── pages/
├── components/
├── plugins/
│   └── api.ts
├── services/
├── stores/
├── types/
└── utils/
```

Responsibilities:

- `pages/` contains route-level UI and page-specific behavior.
- `layouts/default.vue` contains the application shell, sidebar navigation, user block, and theme toggle.
- `plugins/api.ts` creates and injects the Axios `$api` client.
- `services/` wraps backend endpoints with typed functions.
- `stores/` manages loading, error, list, detail, pagination, and mutation state.
- `types/` defines frontend representations of backend payloads and responses.
- `components/` contains reusable UI pieces.
- `utils/` contains formatting and error-normalization helpers.

## Data Flow Design

The current data flow is:

1. A page calls a Pinia store action.
2. The store calls a typed service function.
3. The service uses the injected Axios `$api` client.
4. The backend response updates store state.
5. The page and components render from store state.

Loading and error state are stored centrally in the relevant resource store. Pages use these states for skeleton loading, retryable error alerts, and empty states.

Selected/detail state is kept separately from paginated list state. This allows detail pages to remain stable while list queries are refreshed after mutations.

## Stores

### Agents Store

The agents store is responsible for:

- fetching paginated agents
- fetching one agent by id
- backend-backed active-agent search for combobox usage
- creating an agent
- updating an agent
- tracking `items`
- tracking `selectedAgent`
- tracking pagination metadata
- tracking loading and error state
- caching recent list fetches for a short freshness window
- refreshing the last fetched list query after create/update mutations

The store tracks the last normalized fetch params so list refreshes stay aligned with the active backend query.

### Transactions Store

The transactions store is responsible for:

- fetching paginated transactions
- fetching one transaction by id
- fetching transaction counts through pagination metadata
- creating a transaction
- updating transaction stage
- fetching transaction breakdown
- tracking `items`
- tracking `selectedTransaction`
- tracking current `breakdown`
- tracking pagination metadata
- tracking loading and error state
- caching recent list fetches for a short freshness window
- refreshing the last fetched list query after create/update mutations

After stage updates, the store preserves populated agent references where useful for detail-page continuity while refreshing the list query for truthfulness.

## Key UI Components

### `DashboardStatCard`

Reusable dashboard metric card with loading state, icon tones, supporting labels, and optional custom slot content.

### `StageBadge`

Displays transaction stages with user-friendly labels and consistent badge styling.

Supported stages:

- `agreement`
- `earnest_money`
- `title_deed`
- `completed`

### `RecentTransactionsTable`

Dashboard preview table for recent transaction activity.

It displays property title, stage, listing agent, selling agent, fee, and last update date for the provided preview rows.

### `AgentCombobox`

Searchable agent selector used by the create transaction page.

It supports:

- selected agent display
- async backend search
- debounced typing
- loading state
- empty state
- safe selection by agent id

## Important Frontend Design Decisions

### Dashboard Truthfulness

The dashboard avoids presenting page-slice data as complete global analytics.

- Total transaction count comes from backend pagination metadata.
- Completed transaction count uses a count-oriented backend query.
- Active transaction count is derived from total and completed counts.
- Success rate is derived from true count values.
- Revenue is labeled as completed revenue from loaded results because there is no dedicated backend aggregate endpoint for global revenue totals.
- Recent transactions are treated as a preview, not as a complete report.

### Async Agent Search

The create transaction flow does not assume that all active agents are loaded locally.

The combobox performs backend-backed active-agent search with debounce and compact result limits. This keeps agent selection usable and truthful when the agent dataset grows.

### Query-Aware List Refresh

Agents and transactions lists are paginated and filterable. After create/update mutations, the stores refresh the last fetched query rather than blindly inserting or replacing rows locally.

This avoids misleading UI states when the active list depends on page, limit, search, filters, or sort order.

### Theme Mode

The app supports light and dark theme modes.

An inline head script initializes the theme before page paint using local storage or system preference. The layout provides a small toggle in the sidebar header.

## Current Limitations / Notes

- Frontend automated tests are not currently implemented.
- The dashboard revenue card is based on loaded completed results, not a dedicated backend aggregate endpoint.
- Stores keep one active list state per resource rather than a normalized multi-query cache.
- Authentication and authorization UI are not implemented.
- The frontend depends on the backend API being available for data-backed pages.

## Available Scripts

Development server:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Generate static output:

```bash
npm run generate
```

Preview production output:

```bash
npm run preview
```

Nuxt preparation after install:

```bash
npm run postinstall
```

## Documentation Map

- `web/README.md` -> frontend-specific setup, structure, and usage
- `../README.md` -> repository-level overview and current project status
- `../api/README.md` -> backend setup, endpoints, query params, and backend behavior
- `../DESIGN.md` -> architecture decisions, data modeling rationale, frontend/backend design, and testing strategy
