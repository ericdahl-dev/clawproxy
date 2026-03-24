export type WsEventPayload = {
  id: string;
  routeId: string;
  routeSlug: string;
  headers: Record<string, string>;
  body: string;
  contentType: string | null;
  receivedAt: string;
  leaseExpiresAt: string;
  attemptCount: number;
};

export type ServerMessage =
  | { type: 'auth_ok'; nodeId: string }
  | { type: 'auth_error'; error: string }
  | ({ type: 'event' } & WsEventPayload)
  | { type: 'ack_ok'; acked: number; eventIds: string[] }
  | { type: 'ack_error'; error: string };

export type ClientAuthMessage = { type: 'auth'; token: string };
export type ClientAckMessage = { type: 'ack'; eventIds: string[] };
export type ClientMessage = ClientAuthMessage | ClientAckMessage;
