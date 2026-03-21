# clawproxy Plan

## Overview

`clawproxy` is a lightweight Node/Next.js app that provides public webhook ingress for OpenClaw installations running on private networks.

Its job is to accept inbound internet traffic on behalf of private OpenClaw nodes, persist that traffic durably, and make it available to those nodes over authenticated outbound requests.

This is not a generic open proxy in v1. It is a secure webhook/event relay designed for installations that cannot receive inbound webhooks directly.

## Problem

Many OpenClaw deployments live:
- behind NAT
- behind residential routers
- inside private LANs
- on machines without stable public ingress
- in environments where opening ports is not practical or safe

That makes inbound webhooks difficult or impossible.

However, those same installations can usually make outbound HTTPS requests.

`clawproxy` solves this by acting as a public relay:
- third-party services send webhooks to `clawproxy`
- `clawproxy` stores them in Neon Postgres
- the private OpenClaw node fetches them over an outbound authenticated connection
- the node acknowledges successful receipt

## Goals

### Primary goals
- Provide public webhook endpoints for private OpenClaw nodes
- Reliably persist inbound events before delivery
- Deliver events to private nodes through outbound polling
- Support multiple users, nodes, and routes
- Provide a simple dashboard for management and debugging
- Be easy to deploy via Docker or Nixpacks

### Non-goals for v1
- Full bidirectional HTTP tunneling
- Generic open proxy behavior
- Raw TCP forwarding
- Browser-based reverse proxying
- Multi-region replication
- Billing/subscription system
- Complex transformation pipelines

## Core Product Definition

`clawproxy` is a self-hostable public webhook relay for OpenClaw.

It exposes public endpoints, validates and stores inbound requests in Neon Postgres, and securely delivers them to private OpenClaw nodes using authenticated outbound pull requests.

## Tech Stack

- **App framework:** Next.js
- **Language:** TypeScript
- **Runtime:** Node.js
- **Database:** Neon Postgres
- **User auth:** Neon Auth
- **ORM/query layer:** Drizzle or Prisma
- **Deployment:** Docker and Nixpacks

## Auth Model

Authentication should be split into two distinct domains.

### 1. Human users
Handled by **Neon Auth**.

Users can:
- sign in to the dashboard
- create and manage nodes
- create and manage routes
- inspect event history and failures
- rotate machine credentials
- configure webhook validation settings

### 2. Machine nodes
Handled by **app-native node credentials**, not user sessions.

Private OpenClaw nodes should authenticate with:
- generated node token
- hashed secret in database
- revocable and rotatable credentials

Nodes can:
- poll for pending events
- acknowledge delivered events
- heartbeat/update status

This separation keeps service auth simple, secure, and independently revocable.

## MVP Architecture

### 1. Public ingress layer
Next.js route handlers accept inbound webhooks.

Responsibilities:
- accept POST requests for configured routes
- apply request size limits
- validate route existence
- validate signatures/secrets where configured
- normalize and persist event data
- return `202 Accepted`

### 2. Persistence layer
Neon Postgres is the system of record.

Store:
- users
- nodes
- routes
- events
- request logs
- delivery attempts/status

### 3. Delivery layer
Private OpenClaw nodes poll for waiting events.

Responsibilities:
- authenticate node
- fetch pending events in batches
- lock or mark events as leased/in-flight
- accept acknowledgements
- retry expired/unacked events
- expire old events by TTL

### 4. Dashboard/admin UI
Next.js app for authenticated users.

Show:
- nodes
- routes
- event volume
- delivery failures
- recent requests
- node last seen time
- token rotation controls

## Delivery Model

### MVP delivery: pull-based
This should be the v1 default.

Flow:
1. third party sends webhook to public `clawproxy` endpoint
2. `clawproxy` validates and stores event
3. private OpenClaw node polls for new events
4. `clawproxy` returns a batch of queued events
5. node processes them locally
6. node acknowledges success
7. `clawproxy` marks them delivered

### Why pull-first
- works behind NAT/firewalls
- simplest operationally
- no long-lived connection requirement
- easier to reason about retries and acknowledgements
- easier to host on common platforms

### Future optional delivery modes
After MVP:
- long-polling
- SSE
- WebSocket-based low-latency delivery

These are optimizations, not prerequisites.

## Security Requirements

### Minimum required controls
- strong per-node credentials
- hashed token storage
- HTTPS everywhere
- payload size limits
- route-level secrets when needed
- provider signature validation where possible
- replay protection for signed webhooks
- rate limiting on ingress
- audit logs for access and delivery actions
- TTL/expiration for stale events

### Security posture for v1
Do **not** make this a generic public forwarding service.

Instead:
- only registered routes are valid
- every route maps to a known node
- every node uses explicit machine auth
- events are durably stored before delivery
- dashboard access requires authenticated user session

## Multitenancy Model

### Simple v1 model
- one user owns many nodes
- one node owns many routes
- one route maps to one node
- one event belongs to one route and one node

### Future evolution
- teams/workspaces
- shared ownership
- role-based permissions
- org-level settings

## Data Model

## Tables

### users
Provided or linked through Neon Auth.

Suggested app columns:
- `id`
- `email`
- `display_name`
- `created_at`
- `updated_at`

### nodes
Represents one private OpenClaw installation.

Columns:
- `id`
- `user_id`
- `name`
- `slug`
- `token_hash`
- `status` (`active`, `disabled`)
- `last_seen_at`
- `created_at`
- `updated_at`

### routes
Public ingress endpoints.

Columns:
- `id`
- `user_id`
- `node_id`
- `slug`
- `provider` (nullable)
- `signing_mode` (`none`, `shared_secret`, `provider_signature`)
- `secret_hash` (nullable)
- `enabled`
- `created_at`
- `updated_at`

### events
Durable stored inbound webhook deliveries.

Columns:
- `id`
- `user_id`
- `node_id`
- `route_id`
- `status` (`pending`, `leased`, `delivered`, `failed`, `expired`)
- `headers_json`
- `body_json` or `body_text`
- `content_type`
- `provider_event_id` (nullable)
- `received_at`
- `lease_expires_at` (nullable)
- `attempt_count`
- `next_attempt_at`
- `acked_at` (nullable)
- `expires_at`

### event_attempts
Useful for audit/debugging.

Columns:
- `id`
- `event_id`
- `node_id`
- `attempt_number`
- `leased_at`
- `acked_at` (nullable)
- `result` (`leased`, `acked`, `timeout`, `failed`)
- `error_message` (nullable)

### request_logs
Low-retention ingress and API logging.

Columns:
- `id`
- `route_id` (nullable)
- `node_id` (nullable)
- `kind` (`ingress`, `pull`, `ack`, `auth_failure`)
- `method`
- `path`
- `status_code`
- `ip_address` (nullable)
- `user_agent` (nullable)
- `created_at`

## Indexing Notes

Important indexes:
- `events(node_id, status, next_attempt_at)`
- `events(route_id, received_at desc)`
- `nodes(user_id)`
- `routes(node_id)`
- unique `routes.slug`
- unique `nodes.slug`

Since Neon is remote Postgres, prefer batch reads/writes over chatty row-by-row operations.

## API Design

## Public ingress

### `POST /api/ingress/:routeSlug`
Receives webhook/event payloads.

Behavior:
- resolve route
- verify route is enabled
- validate signature or route secret if configured
- persist event and request metadata
- return `202 Accepted`

Response:
```json
{
  "ok": true,
  "eventId": "evt_123",
  "status": "accepted"
}
```

## Node APIs

### `POST /api/nodes/pull`
Authenticated machine endpoint.

Request:
```json
{
  "nodeId": "node_123",
  "maxEvents": 10
}
```

Response:
```json
{
  "events": [
    {
      "id": "evt_123",
      "routeSlug": "github-webhooks",
      "headers": {},
      "contentType": "application/json",
      "body": {}
    }
  ]
}
```

Behavior:
- authenticate node token
- fetch pending events for node
- mark them leased with timeout
- return batch

### `POST /api/nodes/ack`
Authenticated machine endpoint.

Request:
```json
{
  "nodeId": "node_123",
  "eventIds": ["evt_123", "evt_124"]
}
```

Response:
```json
{
  "ok": true,
  "acked": 2
}
```

Behavior:
- validate node ownership of leased events
- mark events delivered
- record attempt completion

### `POST /api/nodes/heartbeat`
Optional but useful.

Request:
```json
{
  "nodeId": "node_123",
  "version": "0.1.0"
}
```

Behavior:
- update `last_seen_at`
- optionally capture version/metadata

## Dashboard APIs

### `GET /api/me/nodes`
List nodes owned by current user.

### `POST /api/me/nodes`
Create a node and generate token.

### `POST /api/me/nodes/:nodeId/rotate-token`
Rotate machine credential.

### `GET /api/me/routes`
List routes.

### `POST /api/me/routes`
Create route.

### `PATCH /api/me/routes/:routeId`
Enable/disable or update validation config.

### `GET /api/me/events`
List recent events with filters.

## Dashboard Pages

### `/`
Landing page or redirect to dashboard.

### `/dashboard`
Overview metrics:
- total nodes
- active routes
- pending events
- failed deliveries
- recent ingress activity

### `/dashboard/nodes`
List nodes, status, last seen, route counts.

### `/dashboard/nodes/:id`
Node details:
- routes
- last seen
- token rotate action
- recent events

### `/dashboard/routes`
List routes and validation modes.

### `/dashboard/routes/:id`
Route details:
- public ingress URL
- provider config
- secret/signature settings
- recent events

### `/dashboard/events`
Recent event log with filtering by route/node/status.

## Event Lifecycle

1. inbound request received
2. route validated
3. event persisted as `pending`
4. node pulls batch
5. event marked `leased`
6. node processes event
7. node acknowledges
8. event marked `delivered`

Failure paths:
- invalid signature -> reject at ingress
- node never acks -> lease expires, retry later
- event exceeds TTL -> mark `expired`
- repeated failures -> mark `failed`

## Retry Policy

Suggested MVP defaults:
- lease duration: 30–60 seconds
- max batch size: 10–100
- retry backoff: exponential or stepped backoff
- event TTL: 24 hours by default
- failure threshold: after N attempts, mark failed

## Operational Requirements

### Observability
Track at minimum:
- ingress request count
- accepted vs rejected requests
- pending event count
- ack latency
- failed delivery count
- node last seen age

### Limits
Set sensible defaults:
- max payload size
- max pull batch size
- rate limit per route/IP
- request timeout ceilings

### Retention
Retention strategy for v1:
- recent event history visible in dashboard
- request logs kept for a short retention window
- old delivered events cleaned up periodically

## Suggested Repo Structure

```txt
clawproxy/
  app/
    api/
      ingress/[routeSlug]/route.ts
      nodes/pull/route.ts
      nodes/ack/route.ts
      nodes/heartbeat/route.ts
      me/nodes/route.ts
      me/routes/route.ts
      me/events/route.ts
    dashboard/
      page.tsx
      nodes/
      routes/
      events/
  lib/
    auth/
    db/
    nodes/
    ingress/
    events/
    rate-limit/
  prisma/ or drizzle/
  public/
  Dockerfile
  docker-compose.yml
  nixpacks.toml
  README.md
  PLAN.md
```

## MVP Feature List

### Must-have
- Neon Auth login
- node creation and token generation
- route creation
- public webhook ingestion endpoint
- event persistence in Neon Postgres
- node polling endpoint
- node ack endpoint
- dashboard for nodes/routes/events
- basic retry and TTL logic
- request logging
- rate limiting and payload caps

### Nice-to-have if time allows
- node heartbeat endpoint
- route-level provider presets
- signature validation helpers for GitHub/Stripe/etc.
- token rotation UI
- event replay button in dashboard

### Not in MVP
- full real-time socket delivery
- generic reverse proxying
- streaming large request bodies end-to-end
- enterprise tenancy model

## Product Risks

### 1. Scope creep into generic tunneling
Mitigation: keep v1 focused on webhooks/events only.

### 2. Weak machine auth
Mitigation: use generated secrets, hashing, rotation, and audit logs.

### 3. Duplicate event delivery
Mitigation: design for at-least-once delivery and encourage idempotent consumers.

### 4. Operational noise from retries
Mitigation: use leases, backoff, TTL, and failure caps.

### 5. DB overuse from chatty polling
Mitigation: batch operations, index carefully, tune poll intervals.

## Open Questions

1. Should routes support raw body passthrough, normalized JSON, or both?
2. Do we want route-specific provider helpers in MVP or later?
3. What should the OpenClaw-side connector look like?
   - built into OpenClaw
   - standalone companion process
4. Do we want one environment to support many users from day one, or optimize first for single-owner self-hosting?
5. Should acknowledgements be per-event only, or support partial batch success/failure reporting?

## Recommended Next Steps

### Step 1
Create `README.md` with product summary and local development instructions.

### Step 2
Choose ORM:
- **Drizzle** if we want lighter control and SQL-ish clarity
- **Prisma** if we want batteries-included workflows

### Step 3
Initialize app:
- Next.js
- TypeScript
- auth integration
- DB connection

### Step 4
Implement vertical slice:
- create node
- create route
- ingest event
- pull event
- ack event
- show event in dashboard

### Step 5
Add hardening:
- rate limits
- signature validation
- retry logic
- cleanup jobs

## Build Order Recommendation

1. project scaffold
2. Neon Postgres connection
3. Neon Auth integration
4. schema + migrations
5. dashboard auth gate
6. node + route CRUD
7. ingress endpoint
8. pull + ack endpoints
9. event history UI
10. retries, cleanup, and polish

## One-Sentence Project Brief

`clawproxy` is a lightweight, self-hostable Next.js service that uses Neon Auth and Neon Postgres to provide secure public webhook ingress and queued event delivery for private OpenClaw installations that can only communicate outbound.
