import {
  boolean,
  index,
  integer,
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

export const authUsers = pgTable(
  'auth_users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('auth_users_email_key').on(table.email)]
);

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: text('id').primaryKey(),
    tokenHash: text('token_hash').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('auth_sessions_token_hash_key').on(table.tokenHash),
    index('auth_sessions_user_id_idx').on(table.userId),
    index('auth_sessions_expires_at_idx').on(table.expiresAt),
  ]
);

export const authRateLimits = pgTable(
  'auth_rate_limits',
  {
    key: text('key').primaryKey(),
    kind: text('kind').notNull(),
    count: integer('count').notNull().default(0),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('auth_rate_limits_kind_idx').on(table.kind)]
);

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
    uniqueIndex('nodes_user_id_slug_key').on(table.userId, table.slug),
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
    uniqueIndex('routes_user_id_slug_key').on(table.userId, table.slug),
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
    headersJson: text('headers_json').notNull(),
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

export type AuthUser = typeof authUsers.$inferSelect;
export type NewAuthUser = typeof authUsers.$inferInsert;
export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;
export type AuthRateLimit = typeof authRateLimits.$inferSelect;
export type NewAuthRateLimit = typeof authRateLimits.$inferInsert;
export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
