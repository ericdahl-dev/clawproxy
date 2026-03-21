import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const nodeStatusEnum = pgEnum('node_status', ['active', 'disabled']);
export const eventStatusEnum = pgEnum('event_status', [
  'pending',
  'leased',
  'delivered',
  'failed',
  'expired',
]);

export const nodes = pgTable(
  'nodes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    tokenHash: text('token_hash').notNull(),
    status: nodeStatusEnum('status').notNull().default('active'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('nodes_user_id_idx').on(table.userId),
    uniqueIndex('nodes_slug_key').on(table.slug),
  ]
);

export const routes = pgTable(
  'routes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('routes_node_id_idx').on(table.nodeId),
    index('routes_user_id_idx').on(table.userId),
    uniqueIndex('routes_slug_key').on(table.slug),
  ]
);

export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    routeId: uuid('route_id')
      .notNull()
      .references(() => routes.id, { onDelete: 'cascade' }),
    status: eventStatusEnum('status').notNull().default('pending'),
    headersJson: jsonb('headers_json').notNull(),
    bodyText: text('body_text').notNull(),
    contentType: text('content_type'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
    attemptCount: integer('attempt_count').notNull().default(0),
    ackedAt: timestamp('acked_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('events_node_status_idx').on(table.nodeId, table.status),
    index('events_node_status_received_idx').on(table.nodeId, table.status, table.receivedAt),
    index('events_route_received_idx').on(table.routeId, table.receivedAt),
    index('events_expires_at_idx').on(table.expiresAt),
  ]
);

export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
