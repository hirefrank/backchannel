export interface DateRange {
  startYear: number | null;
  startMonth: number | null;
  endYear: number | null;
  endMonth: number | null;
}

export interface OverlapResult {
  months: number;
  period: { start: string; end: string } | null;
}

export function calculateTemporalOverlap(a: DateRange, b: DateRange): OverlapResult {
  const aStart = toDate(a.startYear, a.startMonth || 1);
  const aEnd = a.endYear ? toDate(a.endYear, (a.endMonth || 12)) : new Date();
  const bStart = toDate(b.startYear, b.startMonth || 1);
  const bEnd = b.endYear ? toDate(b.endYear, (b.endMonth || 12)) : new Date();

  // If either has missing dates, still report a potential overlap (unknown period)
  if (!aStart || !bStart) {
    return { months: -1, period: null }; // -1 indicates "worked at same company, dates unknown"
  }

  const overlapStart = new Date(Math.max(aStart.getTime(), bStart.getTime()));
  const overlapEnd = new Date(Math.min(aEnd.getTime(), bEnd.getTime()));

  if (overlapStart >= overlapEnd) return { months: 0, period: null };

  const months = Math.max(1, Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  return { months, period: { start: formatYearMonth(overlapStart), end: formatYearMonth(overlapEnd) } };
}

function toDate(year: number | null, month: number): Date | null {
  if (!year) return null;
  return new Date(year, month - 1);
}

function formatYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
