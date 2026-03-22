# Copilot Instructions for clawproxy

## Project Overview

`clawproxy` is a lightweight, self-hostable Next.js service that provides secure public webhook ingress and queued event delivery for private OpenClaw nodes that can only communicate outbound.

Private OpenClaw nodes sit behind NAT, residential routers, or private LANs and cannot receive inbound webhooks directly. `clawproxy` solves this by:
1. Accepting inbound webhook traffic from third-party services (GitHub, Stripe, Slack, etc.)
2. Persisting events durably in Neon Postgres
3. Allowing private nodes to pull and acknowledge events over authenticated outbound requests

See `PLAN.md` for the full product specification and architectural decisions.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Runtime:** Node.js using Yarn 4
- **Database:** Neon Postgres
- **ORM:** Drizzle ORM (`drizzle-orm`, config in `drizzle.config.ts`, schema in `db/schema.ts`)
- **Auth:** Neon Auth (`@neondatabase/auth`)
- **Styles:** Tailwind CSS v4
- **Testing:** Vitest (`tests/` directory)
- **Linting:** ESLint (`eslint.config.mjs`)

## Repository Structure

```
app/
  api/
    ingress/[routeSlug]/    # Public webhook ingestion endpoint
    nodes/pull/             # Node event polling endpoint
    nodes/ack/              # Node event acknowledgement endpoint
    admin/                  # Admin API routes (events, nodes, routes)
    auth/                   # Auth-related API routes
    version/                # Version endpoint
  auth/                     # Auth pages (sign-in, sign-up, forgot-password)
  action/                   # Next.js server actions
  dashboard/                # Dashboard UI pages (nodes, routes, events)
  lib/
    auth/                   # Auth helpers (server, client, require-admin, require-node)
    db.ts                   # Raw postgres.js connection (sql template tag)
    db/                     # Drizzle ORM client (db)
    events/                 # Event business logic (leases, expiry, lifecycle, ack)
    http/                   # HTTP utilities (header helpers)
db/
  schema.ts                 # Drizzle ORM table definitions
  migrations/               # Generated Drizzle migrations
tests/
  api/                      # API route unit tests (ingress, admin, nodes-pull)
  auth/                     # Auth unit tests
  dashboard/                # Dashboard component tests
  events/                   # Event logic unit tests
  http/                     # HTTP utility tests
  landing/                  # Landing page component tests
  support/                  # Test support utilities (server-only stub)
```

## Database Schema

The core tables (defined in `db/schema.ts`):

- **nodes** – Represents a private OpenClaw installation. Each node has a `token_hash` for machine auth, a `slug`, and a `status` (`active` | `disabled`).
- **routes** – Public ingress endpoints. Each route has a `slug` (used in the URL), belongs to a `node`, and can be enabled/disabled.
- **events** – Durable stored inbound webhooks. Statuses: `pending` → `leased` → `delivered` (or `failed` / `expired`).

## Development Workflow

### Install dependencies
```bash
npm install
```

### Run development server
```bash
npm run dev
```

### Run tests
```bash
npm run test:run    # run all tests once
npm run test        # run tests in watch mode
```

### Lint
```bash
npm run lint
```

### Database
```bash
npm run db:generate   # generate migrations from schema changes
npm run db:migrate    # apply migrations
npm run db:push       # push schema directly (dev only)
```

## Coding Conventions

- **TypeScript everywhere** – all files are `.ts` or `.tsx`. Avoid `any`; prefer explicit types.
- **Next.js App Router** – use route handlers (`route.ts`) for API endpoints; use React Server Components where possible.
- **Drizzle ORM** – write queries using the Drizzle query builder. Import `db` from `@/app/lib/db/client`. Import table definitions from `@/db/schema`.
- **Path aliases** – use `@/` as the root alias (maps to the repo root, configured in `tsconfig.json` and `vitest.config.ts`).
- **`server-only`** – import `server-only` at the top of any module that must never run in the browser.
- **API responses** – return `NextResponse.json(...)` with appropriate HTTP status codes. Successful ingestion returns `202 Accepted`.
- **No comments by default** – only add inline comments when explaining non-obvious logic.

## Testing Conventions

- Tests live in `tests/` and match the pattern `tests/**/*.test.ts`.
- Use `vitest` with `describe` / `test` / `expect` from `vitest`. Import `describe`, `expect`, and `test` explicitly.
- The `server-only` module is stubbed in tests via `tests/support/server-only.ts`.
- Unit tests focus on pure helper functions (e.g. event lease helpers, expiry calculations). Do not import Next.js internals or database clients in unit tests.

## Security Notes

- Node tokens are **hashed** before storage; never store or log raw tokens.
- Every pull/ack request from a node must be authenticated using the node's machine credential.
- Only registered (and enabled) routes accept inbound events; unknown routes return `404`.
- Dashboard access requires an authenticated user session via Neon Auth.
- Apply payload size limits on ingress routes.
