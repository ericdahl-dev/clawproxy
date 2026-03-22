import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

describe('landing page dashboard CTA', () => {
  test('top navigation CTA uses a clear Dashboard label', async () => {
    const homePage = await import('@/app/page');
    const html = renderToStaticMarkup(homePage.default());

    const dom = new JSDOM(html);
    const document = dom.window.document;
    const navDashboardLink = document.querySelector('header a[href="/dashboard"]');

    expect(navDashboardLink).not.toBeNull();
    expect(navDashboardLink?.getAttribute('href')).toBe('/dashboard');
    expect(navDashboardLink?.textContent?.trim()).toBe('Dashboard');
  });
});
