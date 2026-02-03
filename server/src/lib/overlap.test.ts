import { describe, test, expect } from "bun:test";
import { calculateTemporalOverlap, DateRange } from "./overlap";

describe("calculateTemporalOverlap", () => {
  test("returns 0 months when no overlap exists", () => {
    const a: DateRange = { startYear: 2020, startMonth: 1, endYear: 2020, endMonth: 12 };
    const b: DateRange = { startYear: 2021, startMonth: 1, endYear: 2021, endMonth: 12 };

    const result = calculateTemporalOverlap(a, b);
    expect(result.months).toBe(0);
    expect(result.period).toBeNull();
  });

  test("calculates overlap for fully contained range", () => {
    const a: DateRange = { startYear: 2020, startMonth: 1, endYear: 2020, endMonth: 12 };
    const b: DateRange = { startYear: 2020, startMonth: 3, endYear: 2020, endMonth: 6 };

    const result = calculateTemporalOverlap(a, b);
    expect(result.months).toBeGreaterThan(0);
    expect(result.period?.start).toBe("2020-03");
    expect(result.period?.end).toBe("2020-06");
  });

  test("calculates overlap for partially overlapping ranges", () => {
    const a: DateRange = { startYear: 2020, startMonth: 1, endYear: 2020, endMonth: 6 };
    const b: DateRange = { startYear: 2020, startMonth: 4, endYear: 2020, endMonth: 12 };

    const result = calculateTemporalOverlap(a, b);
    expect(result.months).toBeGreaterThan(0);
    expect(result.period?.start).toBe("2020-04");
    expect(result.period?.end).toBe("2020-06");
  });

  test("handles current positions (null end date)", () => {
    const a: DateRange = { startYear: 2020, startMonth: 1, endYear: null, endMonth: null };
    const b: DateRange = { startYear: 2021, startMonth: 1, endYear: 2022, endMonth: 12 };

    const result = calculateTemporalOverlap(a, b);
    expect(result.months).toBeGreaterThan(0);
    expect(result.period?.start).toBe("2021-01");
    expect(result.period?.end).toBe("2022-12");
  });

  test("handles both positions being current", () => {
    const a: DateRange = { startYear: 2020, startMonth: 1, endYear: null, endMonth: null };
    const b: DateRange = { startYear: 2021, startMonth: 6, endYear: null, endMonth: null };

    const result = calculateTemporalOverlap(a, b);
    expect(result.months).toBeGreaterThan(0);
    expect(result.period?.start).toBe("2021-06");
  });

  test("returns -1 when start year is null (unknown dates)", () => {
    const a: DateRange = { startYear: null, startMonth: 1, endYear: 2020, endMonth: 12 };
    const b: DateRange = { startYear: 2020, startMonth: 1, endYear: 2020, endMonth: 12 };

    const result = calculateTemporalOverlap(a, b);
    expect(result.months).toBe(-1); // -1 indicates "worked at same company, dates unknown"
    expect(result.period).toBeNull();
  });

  test("uses month 1 as default when start month is null", () => {
    const a: DateRange = { startYear: 2020, startMonth: null, endYear: 2020, endMonth: 12 };
    const b: DateRange = { startYear: 2020, startMonth: 6, endYear: 2020, endMonth: 12 };

    const result = calculateTemporalOverlap(a, b);
    expect(result.months).toBeGreaterThan(0);
  });

  test("returns at least 1 month for valid multi-month overlap", () => {
    const a: DateRange = { startYear: 2020, startMonth: 1, endYear: 2020, endMonth: 3 };
    const b: DateRange = { startYear: 2020, startMonth: 2, endYear: 2020, endMonth: 4 };

    const result = calculateTemporalOverlap(a, b);
    expect(result.months).toBeGreaterThanOrEqual(1);
  });

  test("returns 0 for same-month single-day positions", () => {
    // When both start and end are the same month, there's no duration
    const a: DateRange = { startYear: 2020, startMonth: 6, endYear: 2020, endMonth: 6 };
    const b: DateRange = { startYear: 2020, startMonth: 6, endYear: 2020, endMonth: 6 };

    const result = calculateTemporalOverlap(a, b);
    expect(result.months).toBe(0);
  });

  test("calculates correct overlap period format", () => {
    const a: DateRange = { startYear: 2020, startMonth: 1, endYear: 2020, endMonth: 12 };
    const b: DateRange = { startYear: 2020, startMonth: 1, endYear: 2020, endMonth: 12 };

    const result = calculateTemporalOverlap(a, b);
    expect(result.period?.start).toMatch(/^\d{4}-\d{2}$/);
    expect(result.period?.end).toMatch(/^\d{4}-\d{2}$/);
  });
});
