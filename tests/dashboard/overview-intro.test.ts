import { describe, expect, test } from 'vitest';

import { overviewIntro } from '@/app/lib/dashboard/overview-intro';

describe('overviewIntro', () => {
  test('a brand-new account gets a first-run setup prompt, not "Welcome back"', () => {
    const intro = overviewIntro(0);
    expect(intro.title).not.toMatch(/welcome back/i);
    expect(intro.title).toMatch(/first node/i);
    expect(intro.isFirstRun).toBe(true);
    expect(intro.cta).toEqual({ href: '/dashboard/nodes', label: 'Create your first node' });
  });

  test('an account with a node gets the returning view and no CTA', () => {
    const intro = overviewIntro(1);
    expect(intro.title).toBe('Welcome back');
    expect(intro.isFirstRun).toBe(false);
    expect(intro.cta).toBeNull();
  });

  test('metrics are hidden until there is a node to produce them', () => {
    expect(overviewIntro(0).showMetrics).toBe(false);
    expect(overviewIntro(2).showMetrics).toBe(true);
  });
});
