# clawproxy — v1.0 Working Product Plan

> **Status:** Foundation complete. Pushing past MVP toward production-ready.

## What We Have (MVP Complete ✅)

clawproxy is a **public webhook relay for private OpenClaw nodes**. The core engine works:

- ✅ **Auth:** Neon Auth for human admins, hashed bearer tokens for machine nodes
- ✅ **Database:** Postgres schema with nodes, routes, events (Drizzle ORM)
- ✅ **Ingress:** `POST /api/ingress/:routeSlug` accepts and persists webhooks
- ✅ **Delivery:** Pull-based polling with lease/ack, retry on expiry, TTL enforcement
- ✅ **APIs:** Admin CRUD endpoints for nodes, routes, events
- ✅ **Deployment:** Docker + Nixpacks ready, CI pipeline with tests
- ✅ **Testing:** 68 passing tests covering auth, ingress, pull, ack, leases, lifecycle

**The relay works. Private nodes can receive public webhooks.**

## What's Missing (Path to v1.0)

The dashboard shows "Signed in as user@example.com" and nothing else.

To be production-ready, operators need:
1. **Create and manage nodes** (generate tokens, view status)
2. **Create and manage routes** (link to nodes, enable/disable)
3. **See event queue status** (pending/delivered/failed)
4. **Inspect individual events** (headers, body, delivery attempts)
5. **Retry failed events** manually when needed
6. **Monitor node health** (last-seen, active/stale indicators)

Without these, clawproxy is operationally blind.

## v1.0 Milestones

### Milestone 1: Nodes Management UI

**Goal:** Create, list, and delete nodes. Generate bearer tokens. Show node health.

**User Stories:**
- As an admin, I can create a new node with a name and slug
- As an admin, I can see the generated bearer token immediately after creation
- As an admin, I can view all my nodes with their last-seen status
- As an admin, I can delete a node and cascade-remove its routes/events
- As an admin, I can copy a node's bearer token to configure my private OpenClaw instance

**Deliverables:**
- `/dashboard/nodes` page with table view
- "Create Node" form with name/slug inputs
- Token display modal (show-once after creation)
- Delete confirmation modal
- Last-seen timestamp with visual health indicator (active/stale/offline)

### Milestone 2: Routes Management UI

**Goal:** Create, list, and manage webhook routes. Link routes to nodes.

**User Stories:**
- As an admin, I can create a route with a slug and assign it to a node
- As an admin, I can see all routes with their assigned node names
- As an admin, I can copy the public webhook URL for any route
- As an admin, I can enable/disable a route without deleting it
- As an admin, I can delete a route

**Deliverables:**
- `/dashboard/routes` page with table view
- "Create Route" form with slug input + node selector dropdown
- Public URL display with copy button (`https://clawproxy.example.com/api/ingress/:slug`)
- Enable/disable toggle
- Delete confirmation modal

### Milestone 3: Events List & Inspection

**Goal:** See event queue. Filter by status. Inspect individual events.

**User Stories:**
- As an admin, I can see all events across all my nodes
- As an admin, I can filter events by status (pending/delivered/failed/expired)
- As an admin, I can filter events by node
- As an admin, I can click an event to see full headers, body, and delivery attempts
- As an admin, I can see when an event was received and when it expires

**Deliverables:**
- `/dashboard/events` page with paginated table
- Filter controls (status, node, date range)
- Event detail modal showing headers JSON, body text, timestamps, attempt count
- Status badges with color coding

### Milestone 4: Operational Actions

**Goal:** Retry failed events. Monitor delivery health.

**User Stories:**
- As an admin, I can manually retry a failed or expired event
- As an admin, I can see aggregate metrics (total events, delivery rate, avg latency)
- As an admin, I can see which nodes are actively polling
- As an admin, I can regenerate a node's bearer token

**Deliverables:**
- "Retry Event" button in event detail modal
- Dashboard summary cards (event counts by status, success rate)
- Node health indicators with polling activity timestamps
- Token regeneration flow with confirmation

## Post-v1.0 Enhancements

These can wait until after the dashboard is operational:

### Security & Validation
- Route-level webhook secrets (shared secret or provider-specific HMAC)
- Request size limits and rate limiting on ingress
- Replay protection for signed webhooks

### Multi-tenancy
- Teams/workspaces (shared node ownership)
- Role-based access (admin, viewer)
- Per-user rate limits

### Observability
- Detailed audit logs (who created/deleted what)
- Webhook delivery latency histograms
- Alerting on delivery failures

### Advanced Delivery
- Long-polling or SSE for lower latency (optional upgrade from pull)
- Batch size configuration per node
- Custom retry policies

## Technical Approach

### UI Framework
- **Continue with Next.js App Router** (already in use)
- **Server Components for data fetching** (auth already server-side)
- **Client Components for interactivity** (forms, modals, filters)
- **Tailwind CSS** (already configured, matches landing/dashboard style)

### Data Fetching Pattern
- Use existing `/api/admin/*` endpoints from dashboard pages
- Server Components call endpoints directly (no separate client fetch)
- Client Components use React state + fetch for mutations
- Optimistic UI updates where appropriate

### Form Handling
- Native HTML forms with Server Actions for creates/updates
- Client-side validation with `react-hook-form` if needed
- Toast notifications for success/error feedback

### State Management
- URL state for filters (enables shareable links)
- React state for modals and transient UI
- Server state is source of truth (no complex client caching)

## Implementation Strategy

1. **Build one milestone at a time** (don't start Milestone 2 until Milestone 1 is done)
2. **TDD for all new backend logic** (if admin APIs need changes)
3. **Test UI with Playwright or Vitest component tests** (add as needed)
4. **Frequent commits** after each feature (nodes list, create form, delete flow, etc.)
5. **PRs per milestone** (review after completing each full feature area)

## Success Criteria for v1.0

clawproxy is production-ready when an admin can:
- [ ] Create a node and configure a private OpenClaw instance with the token
- [ ] Create a route and give the webhook URL to a third-party service
- [ ] See incoming webhooks appear in the events list
- [ ] Verify the private node pulled and acknowledged the events
- [ ] Retry a failed event without SSH-ing into the server
- [ ] Determine if a node is healthy by checking its last-seen timestamp

At that point, clawproxy is **operationally useful** and deployable for real workloads.
