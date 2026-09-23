import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

async function openClawLandingHtml() {
  const page = await import('@/app/openclaw/page');
  return renderToStaticMarkup(page.default());
}

describe('OpenClaw landing page', () => {
  test('targets OpenClaw users with a clear hero and dashboard CTA', async () => {
    const html = await openClawLandingHtml();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    expect(document.querySelector('h1')?.textContent).toContain('OpenClaw workflows');
    expect(html).toContain('webhook relay for OpenClaw workflows');
    const dashboardLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href="/dashboard"]'));

    expect(dashboardLinks.some((link) => link.textContent?.trim() === 'Open dashboard')).toBe(true);
  });

  test('shows the OpenClaw setup snippet and delivery path', async () => {
    const html = await openClawLandingHtml();

    expect(html).toContain('OPENCLAW_WEBHOOK_RELAY_URL');
    expect(html).toContain('wss://clawproxy.io/api/nodes/ws');
    expect(html).toContain('https://clawproxy.io/api/ingress/&lt;user-id&gt;/github-to-openclaw');
    expect(html).toContain('/api/ingress/&lt;user-id&gt;/github-to-openclaw');
    expect(html).toContain('dashboard-generated route URL that includes your user id');
    expect(html).not.toContain('https://clawproxy.io/api/ingress/github-to-openclaw');
    expect(html).toContain('GitHub, Stripe, and Slack webhooks');
    expect(html).toContain('OpenClaw node');
    expect(html).toContain('outbound WebSocket');
  });
});
