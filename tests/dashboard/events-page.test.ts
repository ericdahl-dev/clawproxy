import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

describe('dashboard events page', () => {
  test('renders events heading and description', async () => {
    const { default: DashboardEventsPage } = await import('@/app/dashboard/events/page');
    const html = renderToStaticMarkup(DashboardEventsPage());
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('Delivery events');
    expect(dom.window.document.body.textContent).toContain('Events');
  });

  test('shows a placeholder when no delivery events are available', async () => {
    const { default: DashboardEventsPage } = await import('@/app/dashboard/events/page');
    const html = renderToStaticMarkup(DashboardEventsPage());
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain(
      'No delivery events are available yet',
    );
  });
});
