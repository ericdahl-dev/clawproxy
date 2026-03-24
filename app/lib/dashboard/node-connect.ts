export function buildSkillYaml(origin: string, token?: string, forwardBaseUrl?: string): string {
  const tokenValue = token ?? 'YOUR_NODE_TOKEN_HERE';
  const webhookUrl = forwardBaseUrl
    ? `${forwardBaseUrl}/webhook/{routeSlug}`
    : 'http://YOUR_OPENCLAW_HOST/webhook/{routeSlug}';
  const wsOrigin = origin.replace(/^http/, 'ws');
  return `name: clawproxy-relay
version: "1.0"
description: Pulls and delivers webhook events from clawproxy

connection:
  ws_url: "${wsOrigin}/api/nodes/ws"
  pull_url: "${origin}/api/nodes/pull"
  ack_url: "${origin}/api/nodes/ack"
  token: "${tokenValue}"

polling:
  interval_seconds: 30
  max_events: 10

forward:
  webhook_url: "${webhookUrl}"`;
}

export function buildOpenClawSetupBlock(
  origin: string,
  token?: string,
  forwardBaseUrl?: string,
): string {
  const tokenValue = token ?? 'YOUR_NODE_TOKEN_HERE';
  const webhookUrl = forwardBaseUrl
    ? `${forwardBaseUrl}/webhook/{routeSlug}`
    : 'http://YOUR_OPENCLAW_HOST/webhook/{routeSlug}';
  const wsOrigin = origin.replace(/^http/, 'ws');
  return `name: clawproxy-relay
version: "1.1"
description: Receive and deliver clawproxy events to OpenClaw webhooks

connection:
  token: "${tokenValue}"
  websocket:
    enabled: true
    url: "${wsOrigin}/api/nodes/ws"
    auth_message: {"type":"auth","token":"${tokenValue}"}
    ack_message_template: {"type":"ack","eventIds":["{eventId}"]}
  http_fallback:
    enabled: true
    pull_url: "${origin}/api/nodes/pull"
    ack_url: "${origin}/api/nodes/ack"
    auth_header: "Authorization: Bearer ${tokenValue}"
    poll_interval_seconds: 30
    max_events_per_poll: 10

forward:
  webhook_url_template: "${webhookUrl}"
  replace_route_slug_placeholder: "{routeSlug}"
  preserve_headers: true
  preserve_content_type: true

instructions:
  - Connect to websocket.url first.
  - Immediately send connection.websocket.auth_message.
  - On each websocket event payload, forward the event body to forward.webhook_url_template with {routeSlug} replaced by event.routeSlug.
  - After successful forward, send websocket ack using connection.websocket.ack_message_template with {eventId}=event.id.
  - If websocket connection fails or disconnects, use connection.http_fallback.pull_url and process events the same way.
  - After successful forward in HTTP mode, ack to connection.http_fallback.ack_url with JSON {"eventIds":[event.id]}.
  - Never ack before a successful forward.
`;
}

export type NodeHealth = 'active' | 'stale' | 'offline';

export function getNodeHealth(
  lastSeenAt: Date | string | null,
  nowMs: number = Date.now(),
): NodeHealth {
  if (!lastSeenAt) return 'offline';
  const ms = nowMs - new Date(lastSeenAt).getTime();
  if (ms < 5 * 60 * 1000) return 'active';
  if (ms < 60 * 60 * 1000) return 'stale';
  return 'offline';
}
