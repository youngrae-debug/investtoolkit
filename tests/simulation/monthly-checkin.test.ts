import { describe, expect, it } from "vitest";
import {
  analyzeMonthlyCheckin,
  calculateMonthlyMoney,
  summarizeMonthlySavingsTrend,
} from "@/lib/simulation/monthly-checkin";

const baseInput = {
  goalAmount: 100_000_000,
  currentAmount: 30_000_000,
  plannedContribution: 1_000_000,
  futureMonthlyContribution: 1_000_000,
  annualRate: 0,
  targetDate: new Date(2031, 6, 1),
  checkinDate: new Date(2026, 6, 19),
  feasibilityLimits: null,
};

describe("monthly check-in", () => {
  it("calculates the amount left after this month's total spending", () => {
    expect(calculateMonthlyMoney({ income: 3_500_000, expenses: 2_100_000 })).toEqual({
      remainingAmount: 1_400_000,
      actualContribution: 1_400_000,
    });
  });

  it("keeps a monthly deficit visible without recording negative savings", () => {
    expect(calculateMonthlyMoney({ income: 2_500_000, expenses: 2_800_000 })).toEqual({
      remainingAmount: -300_000,
      actualContribution: 0,
    });
  });

  it("sorts and summarizes the latest three valid monthly savings records", () => {
    const trend = summarizeMonthlySavingsTrend([
      { period: "2026-07", plannedContribution: 1_000_000, actualContribution: 1_200_000 },
      { period: "2026-04", plannedContribution: 1_000_000, actualContribution: 900_000 },
      { period: "2026-06", plannedContribution: 1_000_000, actualContribution: 1_100_000 },
      { period: "2026-03", plannedContribution: null, actualContribution: null },
      { period: "2026-05", plannedContribution: 1_000_000, actualContribution: 800_000 },
    ]);

    expect(trend.points.map((point) => point.period)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
    ]);
    expect(trend.totalPlanned).toBe(3_000_000);
    expect(trend.totalActual).toBe(3_100_000);
    expect(trend.totalDifference).toBe(100_000);
    expect(trend.latestActualChange).toBe(100_000);
    expect(trend.recoveryAmount).toBe(0);
    expect(trend.nextPlannedContribution).toBe(1_000_000);
    expect(trend.maxAmount).toBe(1_200_000);
  });

  it("turns the recent cumulative shortfall into a next-month recovery amount", () => {
    const trend = summarizeMonthlySavingsTrend([
      { period: "2026-06", plannedContribution: 1_000_000, actualContribution: 800_000 },
      { period: "2026-07", plannedContribution: 1_000_000, actualContribution: 900_000 },
    ]);

    expect(trend.latestActualChange).toBe(100_000);
    expect(trend.totalDifference).toBe(-300_000);
    expect(trend.recoveryAmount).toBe(300_000);
    expect(trend.nextPlannedContribution).toBe(1_000_000);
  });

  it("keeps the original goal projection when the planned amount was saved", () => {
    const impact = analyzeMonthlyCheckin({
      ...baseInput,
      actualContribution: 1_000_000,
    });

    expect(impact.currentAmount).toBe(31_000_000);
    expect(impact.contributionDifference).toBe(0);
    expect(impact.arrivalDate).toEqual(new Date(2032, 3, 1));
    expect(impact.projectedAtTarget).toBe(90_000_000);
    expect(impact.shortage).toBe(10_000_000);
  });

  it("shows the exact goal impact of saving less than planned", () => {
    const impact = analyzeMonthlyCheckin({
      ...baseInput,
      actualContribution: 800_000,
    });

    expect(impact.contributionDifference).toBe(-200_000);
    expect(impact.shortage).toBe(10_200_000);
  });

  it("replaces an existing update instead of adding it twice", () => {
    const impact = analyzeMonthlyCheckin({
      ...baseInput,
      currentAmount: 31_000_000,
      previousActualContribution: 1_000_000,
      actualContribution: 1_200_000,
    });

    expect(impact.currentAmount).toBe(31_200_000);
    expect(impact.contributionDifference).toBe(200_000);
  });
});
