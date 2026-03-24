import { describe, expect, test } from 'vitest';

import {
  buildOpenClawSetupBlock,
  buildSkillYaml,
  getNodeHealth,
} from '@/app/lib/dashboard/node-connect';

describe('buildSkillYaml', () => {
  test('embeds origin URLs and placeholder token when token omitted', () => {
    const yaml = buildSkillYaml('https://relay.example');
    expect(yaml).toContain('ws_url: "wss://relay.example/api/nodes/ws"');
    expect(yaml).toContain('pull_url: "https://relay.example/api/nodes/pull"');
    expect(yaml).toContain('ack_url: "https://relay.example/api/nodes/ack"');
    expect(yaml).toContain('token: "YOUR_NODE_TOKEN_HERE"');
    expect(yaml).toContain('name: clawproxy-relay');
  });

  test('uses wss:// for https:// origin', () => {
    const yaml = buildSkillYaml('https://relay.example');
    expect(yaml).toContain('ws_url: "wss://relay.example/api/nodes/ws"');
  });

  test('uses ws:// for http:// origin', () => {
    const yaml = buildSkillYaml('http://localhost:3000');
    expect(yaml).toContain('ws_url: "ws://localhost:3000/api/nodes/ws"');
  });

  test('embeds provided token', () => {
    const yaml = buildSkillYaml('http://localhost:3000', 'secret-token');
    expect(yaml).toContain('token: "secret-token"');
  });

  test('includes placeholder forward webhook_url when forwardBaseUrl is omitted', () => {
    const yaml = buildSkillYaml('https://relay.example');
    expect(yaml).toContain('forward:');
    expect(yaml).toContain('webhook_url: "http://YOUR_OPENCLAW_HOST/webhook/{routeSlug}"');
  });

  test('embeds forwardBaseUrl in forward webhook_url', () => {
    const yaml = buildSkillYaml('https://relay.example', 'tok', 'http://openclaw-host:8080');
    expect(yaml).toContain('webhook_url: "http://openclaw-host:8080/webhook/{routeSlug}"');
  });
});

describe('buildOpenClawSetupBlock', () => {
  test('includes full skill definition with websocket and http fallback', () => {
    const block = buildOpenClawSetupBlock('https://relay.example', 'tok', 'http://openclaw-host:8080');
    expect(block).toContain('name: clawproxy-relay');
    expect(block).toContain('version: "1.1"');
    expect(block).toContain('url: "wss://relay.example/api/nodes/ws"');
    expect(block).toContain('auth_message: {"type":"auth","token":"tok"}');
    expect(block).toContain('ack_message_template: {"type":"ack","eventIds":["{eventId}"]}');
    expect(block).toContain('http_fallback:');
    expect(block).toContain('pull_url: "https://relay.example/api/nodes/pull"');
    expect(block).toContain('ack_url: "https://relay.example/api/nodes/ack"');
    expect(block).toContain('auth_header: "Authorization: Bearer tok"');
    expect(block).toContain('instructions:');
    expect(block).toContain('Never ack before a successful forward.');
    expect(block).toContain('http://openclaw-host:8080/webhook/{routeSlug}');
  });

  test('uses placeholder token and webhook when omitted', () => {
    const block = buildOpenClawSetupBlock('http://localhost:3000');
    expect(block).toContain('token: "YOUR_NODE_TOKEN_HERE"');
    expect(block).toContain('http://YOUR_OPENCLAW_HOST/webhook/{routeSlug}');
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
