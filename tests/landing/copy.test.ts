import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

async function landingHtml() {
  const homePage = await import('@/app/page');
  return renderToStaticMarkup(homePage.default());
}

describe('landing page copy', () => {
  test('does not claim there is no third-party relay (clawproxy is one)', async () => {
    expect(await landingHtml()).not.toContain('No third-party relay in the webhook path');
  });

  test('states the current price instead of implying a pricing model', async () => {
    const html = await landingHtml();
    expect(html).toMatch(/free while in beta/i);
    expect(html).not.toMatch(/no usage-based pricing/i);
  });

  test('is agent-agnostic: names Hermes Agent and OpenClaw as examples', async () => {
    const html = await landingHtml();
    expect(html).toContain('Hermes Agent');
    expect(html).toContain('OpenClaw');
    expect(html).not.toContain('private OpenClaw nodes');
  });
});
