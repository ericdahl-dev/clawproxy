export type EventStatus = 'pending' | 'leased' | 'delivered' | 'failed' | 'expired';

/** One day bucket for the dashboard events-over-time chart (ISO date `YYYY-MM-DD`). */
export type DailyEventPoint = {
  date: string;
  events: number;
};

export type EventRow = {
  id: string;
  nodeId: string;
  nodeName: string | null;
  routeId: string;
  status: EventStatus;
  contentType: string | null;
  receivedAt: Date | string;
  leaseExpiresAt: Date | string | null;
  attemptCount: number;
  ackedAt: Date | string | null;
  expiresAt: Date | string;
  createdAt: Date | string;
};

export type EventDetail = EventRow & {
  headersJson: unknown;
  bodyText: string;
  updatedAt: Date | string;
};

export type NodeOption = {
  id: string;
  name: string;
};

export type NodeRow = {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'disabled';
  lastSeenAt: Date | string | null;
  createdAt: Date | string;
};

export type RouteRow = {
  id: string;
  userId: string;
  nodeId: string;
  nodeName: string | null;
  slug: string;
  enabled: boolean;
  createdAt: Date | string;
};
