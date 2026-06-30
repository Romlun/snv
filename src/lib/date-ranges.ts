export type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

export function getTransactionDateRange(range: TimeRange): { start: Date | null; end: Date } {
  const end = new Date();
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);

  if (range === 'week') {
    start.setDate(start.getDate() - start.getDay());
  } else if (range === 'month') {
    start.setDate(1);
  } else if (range === 'quarter') {
    const quarterStartMonth = Math.floor(start.getMonth() / 3) * 3;
    start.setMonth(quarterStartMonth, 1);
  } else if (range === 'year') {
    start.setMonth(0, 1);
  } else {
    return { start: null, end };
  }

  return { start, end };
}
