import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

describe('landing page footer', () => {
  test('renders a footer with a link to ericdahl.dev', async () => {
    const homePage = await import('@/app/page');
    const html = renderToStaticMarkup(homePage.default());

    const dom = new JSDOM(html);
    const document = dom.window.document;
    const footer = document.querySelector('footer');
    const link = footer?.querySelector('a[href="https://ericdahl.dev"]');

    expect(footer).not.toBeNull();
    expect(link).not.toBeNull();
    expect(footer?.textContent?.trim()).toBe('made by ericdahl.dev');
  });
});
