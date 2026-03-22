import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

describe('dashboard routes page', () => {
  test('renders routes heading and description', async () => {
    const { default: DashboardRoutesPage } = await import('@/app/dashboard/routes/page');
    const html = renderToStaticMarkup(DashboardRoutesPage());
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('Webhook routes');
    expect(dom.window.document.body.textContent).toContain('Routes');
  });

  test('shows a placeholder when no routes are configured', async () => {
    const { default: DashboardRoutesPage } = await import('@/app/dashboard/routes/page');
    const html = renderToStaticMarkup(DashboardRoutesPage());
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('No routes have been configured yet');
  });
});
