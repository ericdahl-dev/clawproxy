import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

describe('landing page dashboard CTA', () => {
  test('top navigation CTA uses a clear Dashboard label', async () => {
    const homePage = await import('@/app/page');
    const html = renderToStaticMarkup(homePage.default());

    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('>Dashboard<');
  });
});
