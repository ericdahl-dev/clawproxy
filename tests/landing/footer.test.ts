import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

describe('landing page footer', () => {
  test('renders a footer with "made by ericdahl.dev"', async () => {
    const homePage = await import('@/app/page');
    const html = renderToStaticMarkup(homePage.default());

    const dom = new JSDOM(html);
    const document = dom.window.document;
    const footer = document.querySelector('footer');

    expect(footer).not.toBeNull();
    expect(footer?.textContent?.trim()).toBe('made by ericdahl.dev');
  });
});
