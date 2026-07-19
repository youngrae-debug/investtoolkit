import { describe, expect, it } from "vitest";
import { analyzeMonthlyCheckin } from "@/lib/simulation/monthly-checkin";

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
