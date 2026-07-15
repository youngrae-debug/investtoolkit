import { describe, expect, it } from "vitest";
import { analyzeConditionAtTarget, conditionPresets } from "@/lib/simulation/scenarios";

const startDate = new Date(2026, 6, 1);
const targetDate = new Date(2031, 6, 1);
const base = {
  goalAmount: 100_000_000,
  currentAmount: 30_000_000,
  monthlyNetFlow: 1_000_000,
  annualRate: 0,
  startDate,
};

describe("condition comparison at the target date", () => {
  it("reports how much a monthly increase reduces the target-date shortage", () => {
    const preset = conditionPresets.find((item) => item.id === "monthly-100k");
    expect(preset).toBeDefined();

    const analysis = analyzeConditionAtTarget(base, preset!, targetDate, 10_000_000);
    expect(analysis.projectedAtTarget).toBe(96_000_000);
    expect(analysis.shortage).toBe(4_000_000);
    expect(analysis.shortageChange).toBe(6_000_000);
  });

  it("marks a large planned expense as insufficient funds before the target", () => {
    const preset = conditionPresets.find((item) => item.id === "car-30m");
    expect(preset).toBeDefined();

    const analysis = analyzeConditionAtTarget(
      { ...base, currentAmount: 10_000_000, monthlyNetFlow: 0 },
      preset!,
      targetDate,
      90_000_000,
    );
    expect(analysis.insufficientFunds).toBe(true);
  });
});
