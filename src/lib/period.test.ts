import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { averageCycleLength, estimatePeriodDates, predictNextPeriod } from "./period";

describe("period estimates", () => {
  it("uses recorded cycle dates instead of assuming a 28-day cycle", () => {
    const records = [{ start_date: "2026-01-01" }, { start_date: "2026-01-30" }, { start_date: "2026-03-05" }];
    assert.equal(averageCycleLength(records, null), 32);
    assert.equal(predictNextPeriod(records, null)?.date, "2026-04-06");
  });

  it("uses a user-entered cycle length when only one period is recorded", () => {
    assert.equal(predictNextPeriod([{ start_date: "2026-01-01" }], 30)?.date, "2026-01-31");
  });

  it("does not predict a period without enough history or a chosen cycle length", () => {
    assert.equal(predictNextPeriod([{ start_date: "2026-01-01" }], null), null);
  });

  it("shows no assumed duration when a user has not chosen one", () => {
    assert.deepEqual(estimatePeriodDates("2026-05-08", null), ["2026-05-08"]);
    assert.deepEqual(estimatePeriodDates("2026-05-08", 3), ["2026-05-08", "2026-05-09", "2026-05-10"]);
  });
});