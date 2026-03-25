import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

describe('landing page ngrok/Cloudflare Tunnels comparison section', () => {
  test('hero badge references ngrok and Cloudflare Tunnels', async () => {
    const homePage = await import('@/app/page');
    const html = renderToStaticMarkup(homePage.default());

    expect(html).toContain('ngrok');
    expect(html).toContain('Cloudflare Tunnels');
  });

  test('renders the comparison section heading', async () => {
    const homePage = await import('@/app/page');
    const html = renderToStaticMarkup(homePage.default());

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const headings = Array.from(document.querySelectorAll('h2, p'));
    const comparisonHeading = headings.find((el) =>
      el.textContent?.includes('Coming from ngrok or Cloudflare Tunnels?'),
    );

    expect(comparisonHeading).not.toBeUndefined();
  });

  test('renders all three comparison point headings', async () => {
    const homePage = await import('@/app/page');
    const html = renderToStaticMarkup(homePage.default());

    expect(html).toContain('No tunnel dependency');
    expect(html).toContain('Events survive restarts');
    expect(html).toContain('No vendor lock-in');
  });

  test('proof points include ngrok alternative badge', async () => {
    const homePage = await import('@/app/page');
    const html = renderToStaticMarkup(homePage.default());

    expect(html).toContain('ngrok alternative');
  });
});
