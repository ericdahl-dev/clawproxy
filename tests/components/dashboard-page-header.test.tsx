import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { DashboardPageHeader } from '@/components/app/dashboard-page-header';

describe('DashboardPageHeader', () => {
  test('renders eyebrow, title, and description', () => {
    const html = renderToStaticMarkup(
      <DashboardPageHeader
        eyebrow="Events"
        title="Delivery events"
        description="Inspect queued webhook deliveries."
      />,
    );

    expect(html).toContain('Events');
    expect(html).toContain('Delivery events');
    expect(html).toContain('Inspect queued webhook deliveries.');
    expect(html).toContain('text-brand-accent');
  });
});
