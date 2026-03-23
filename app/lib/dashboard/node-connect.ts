export function buildSkillYaml(origin: string, token?: string): string {
  const tokenValue = token ?? 'YOUR_NODE_TOKEN_HERE';
  return `name: clawproxy-relay
version: "1.0"
description: Pulls and delivers webhook events from clawproxy

connection:
  pull_url: "${origin}/api/nodes/pull"
  ack_url: "${origin}/api/nodes/ack"
  token: "${tokenValue}"

polling:
  interval_seconds: 30
  max_events: 10`;
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
