import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mockSql = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/db', () => ({ sql: mockSql }));
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));

import ActionPage from '@/app/action/page';

describe('app/action/page (server action example)', () => {
  beforeEach(() => {
    mockSql.mockReset();
    revalidatePathMock.mockReset();
    mockSql.mockImplementation((parts: TemplateStringsArray, ...values: unknown[]) => {
      const text = parts.reduce((acc, chunk, i) => acc + chunk + String(values[i] ?? ''), '');
      if (text.includes('SELECT')) {
        return Promise.resolve([]);
      }
      return Promise.resolve(undefined);
    });
  });

  test('renders the example heading and comment list shell', async () => {
    const element = await ActionPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain('Server Action Example');
    expect(html).toContain('Comments:');
    expect(mockSql).toHaveBeenCalled();
  });
});
