import { describe, expect, test } from 'vitest';

import { buildSkillYaml, getNodeHealth } from '@/app/lib/dashboard/node-connect';

describe('buildSkillYaml', () => {
  test('embeds origin URLs and placeholder token when token omitted', () => {
    const yaml = buildSkillYaml('https://relay.example');
    expect(yaml).toContain('pull_url: "https://relay.example/api/nodes/pull"');
    expect(yaml).toContain('ack_url: "https://relay.example/api/nodes/ack"');
    expect(yaml).toContain('token: "YOUR_NODE_TOKEN_HERE"');
    expect(yaml).toContain('name: clawproxy-relay');
  });

  test('embeds provided token', () => {
    const yaml = buildSkillYaml('http://localhost:3000', 'secret-token');
    expect(yaml).toContain('token: "secret-token"');
  });
});

describe('getNodeHealth', () => {
  const now = new Date('2025-01-01T12:00:00.000Z').getTime();

  test('offline when never seen', () => {
    expect(getNodeHealth(null, now)).toBe('offline');
  });

  test('active within five minutes', () => {
    const last = new Date('2025-01-01T11:56:00.000Z').toISOString();
    expect(getNodeHealth(last, now)).toBe('active');
  });

  test('stale within an hour but older than five minutes', () => {
    const last = new Date('2025-01-01T11:30:00.000Z').toISOString();
    expect(getNodeHealth(last, now)).toBe('stale');
  });

  test('offline beyond an hour', () => {
    const last = new Date('2025-01-01T10:00:00.000Z').toISOString();
    expect(getNodeHealth(last, now)).toBe('offline');
  });
});
