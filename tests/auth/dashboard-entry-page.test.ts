import { JSDOM } from 'jsdom';
import { beforeEach, describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

describe('dashboard entry page', () => {
  beforeEach(() => {
    // no-op: page is presentational; layout handles auth
  });

  test('renders dashboard entry content', async () => {
    const dashboardPage = await import('@/app/dashboard/page');
    const html = renderToStaticMarkup(await dashboardPage.default());
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('Welcome back');
    expect(dom.window.document.body.textContent).toContain('Nodes');
    expect(dom.window.document.body.textContent).toContain('Routes');
    expect(dom.window.document.body.textContent).toContain('Events');
  });
});
