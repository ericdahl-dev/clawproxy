import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockOrderBy = vi.fn();
const mockGroupBy = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockWhere = vi.fn(() => ({ groupBy: mockGroupBy }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock('@/app/lib/db/client', () => ({
  db: {
    select: mockSelect,
  },
}));

describe('getDailyEventCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrderBy.mockResolvedValue([]);
  });

  test('returns a full UTC day series with zeros when the database has no rows', async () => {
    const { getDailyEventCounts, DAILY_EVENT_CHART_DAYS } = await import(
      '@/app/lib/dashboard/event-daily-counts'
    );

    const result = await getDailyEventCounts('user-1');

    expect(result).toHaveLength(DAILY_EVENT_CHART_DAYS);
    expect(result.every((p) => p.events === 0)).toBe(true);
    expect(result[0]?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('merges database counts into the day series for the current UTC day', async () => {
    const today = new Date().toISOString().slice(0, 10);
    mockOrderBy.mockResolvedValue([{ day: today, count: 5 }]);

    const { getDailyEventCounts, DAILY_EVENT_CHART_DAYS } = await import(
      '@/app/lib/dashboard/event-daily-counts'
    );

    const result = await getDailyEventCounts('user-1');
    expect(result).toHaveLength(DAILY_EVENT_CHART_DAYS);
    expect(result.find((p) => p.date === today)?.events).toBe(5);
  });
});
