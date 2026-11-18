import { describe, expect, test } from "bun:test";
import { averageCycleLength, estimatePeriodDates, predictNextPeriod } from "./period";

describe("period estimates", () => {
  test("uses recorded cycle dates instead of assuming a 28-day cycle", () => {
    const records = [{ start_date: "2026-01-01" }, { start_date: "2026-01-30" }, { start_date: "2026-03-05" }];
    expect(averageCycleLength(records, null)).toBe(32);
    expect(predictNextPeriod(records, null)?.date).toBe("2026-04-06");
  });

  test("uses a user-entered cycle length when only one period is recorded", () => {
    expect(predictNextPeriod([{ start_date: "2026-01-01" }], 30)?.date).toBe("2026-01-31");
  });

  test("does not predict a period without enough history or a chosen cycle length", () => {
    expect(predictNextPeriod([{ start_date: "2026-01-01" }], null)).toBeNull();
  });

  test("shows no assumed duration when a user has not chosen one", () => {
    expect(estimatePeriodDates("2026-05-08", null)).toEqual(["2026-05-08"]);
    expect(estimatePeriodDates("2026-05-08", 3)).toEqual(["2026-05-08", "2026-05-09", "2026-05-10"]);
  });
});