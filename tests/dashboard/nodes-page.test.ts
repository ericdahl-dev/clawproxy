import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

describe('dashboard nodes page', () => {
  test('renders nodes heading and description', async () => {
    const { default: DashboardNodesPage } = await import('@/app/dashboard/nodes/page');
    const html = renderToStaticMarkup(DashboardNodesPage());
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('Connected nodes');
    expect(dom.window.document.body.textContent).toContain('Nodes');
  });

  test('shows a placeholder when no nodes are registered', async () => {
    const { default: DashboardNodesPage } = await import('@/app/dashboard/nodes/page');
    const html = renderToStaticMarkup(DashboardNodesPage());
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('No nodes have been registered yet');
  });
});
