import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const postgresMock = vi.hoisted(() => vi.fn(() => ({})));

vi.mock('postgres', () => ({
  default: postgresMock,
}));

describe('app/lib/db bootstrap', () => {
  const originalUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    postgresMock.mockClear();
    process.env.DATABASE_URL = 'postgres://user:***@localhost:5432/testdb';
  });

  afterEach(() => {
    vi.resetModules();
    if (originalUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalUrl;
    }
  });

  test('opens a postgres connection with ssl require when DATABASE_URL is a Neon host', async () => {
    process.env.DATABASE_URL = 'postgres://user:***@ep-example.us-east-2.aws.neon.tech/testdb';
    vi.resetModules();
    await import('@/app/lib/db');
    await import('@/app/lib/db/client');

    expect(postgresMock).toHaveBeenCalledWith(
      'postgres://user:***@ep-example.us-east-2.aws.neon.tech/testdb',
      { ssl: 'require' }
    );
  });

  test('opens a postgres connection without ssl for a local/coolify host', async () => {
    vi.resetModules();
    await import('@/app/lib/db');
    await import('@/app/lib/db/client');

    expect(postgresMock).toHaveBeenCalledWith('postgres://user:***@localhost:5432/testdb', {
      ssl: false,
    });
  });

  test('throws when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();

    await expect(import('@/app/lib/db')).rejects.toThrow('DATABASE_URL is not set');
    expect(postgresMock).not.toHaveBeenCalled();
  });
});
