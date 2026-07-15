import { describe, expect, it } from "vitest";
import {
  annualToMonthlyRate,
  calculateMonthlyNetFlow,
  monthDifference,
  simulatePlan,
} from "@/lib/simulation/engine";

const startDate = new Date(2026, 6, 1);

describe("Money GPS simulation engine", () => {
  it("reaches 12 million won in 12 months at zero return", () => {
    const result = simulatePlan({ goalAmount: 12_000_000, currentAmount: 0, monthlyNetFlow: 1_000_000, annualRate: 0, startDate });
    expect(result.monthsToGoal).toBe(12);
  });

  it("returns zero months when the goal is already reached", () => {
    const result = simulatePlan({ goalAmount: 10_000_000, currentAmount: 12_000_000, monthlyNetFlow: 0, annualRate: 0, startDate });
    expect(result.monthsToGoal).toBe(0);
  });

  it("does not reach a positive goal with no assets and no flow", () => {
    const result = simulatePlan({ goalAmount: 10_000_000, currentAmount: 0, monthlyNetFlow: 0, annualRate: 0, startDate });
    expect(result.reached).toBe(false);
    expect(result.monthsToGoal).toBeNull();
  });

  it("matches the 5 percent reference case", () => {
    const result = simulatePlan({ goalAmount: 100_000_000, currentAmount: 30_000_000, monthlyNetFlow: 900_000, annualRate: 5, startDate });
    expect(result.monthsToGoal).toBe(61);
  });

  it("shortens the reference case when monthly flow increases", () => {
    const result = simulatePlan({ goalAmount: 100_000_000, currentAmount: 30_000_000, monthlyNetFlow: 1_100_000, annualRate: 5, startDate });
    expect(result.monthsToGoal).toBe(52);
    expect(monthDifference(61, result.monthsToGoal)).toBe(9);
  });

  it("converts annual return to effective monthly return", () => {
    const monthly = annualToMonthlyRate(12);
    expect((1 + monthly) ** 12).toBeCloseTo(1.12, 10);
  });

  it("supports a negative annual return", () => {
    expect(annualToMonthlyRate(-10)).toBeLessThan(0);
  });

  it("limits simulation to 1200 months", () => {
    const result = simulatePlan({ goalAmount: 1_000_000_000, currentAmount: 0, monthlyNetFlow: 1, annualRate: 0, startDate, maxMonths: 9_999 });
    expect(result.timeline).toHaveLength(1_200);
  });

  it("keeps calculating after reaching the goal", () => {
    const result = simulatePlan({ goalAmount: 12_000_000, currentAmount: 0, monthlyNetFlow: 1_000_000, annualRate: 0, startDate });
    expect(result.timeline[119].closingBalance).toBe(120_000_000);
  });

  it("calculates cashflow from income and four expense categories", () => {
    expect(calculateMonthlyNetFlow({ monthlyNetIncome: 3_500_000, fixedExpenses: 1_000_000, livingExpenses: 1_000_000, debtPayments: 500_000 })).toBe(1_000_000);
  });

  it("keeps negative cashflow negative", () => {
    expect(calculateMonthlyNetFlow({ monthlyNetIncome: 2_000_000, fixedExpenses: 1_000_000, livingExpenses: 1_000_000, debtPayments: 500_000 })).toBe(-500_000);
  });

  it("subtracts negative monthly flow from assets", () => {
    const result = simulatePlan({ goalAmount: 100_000_000, currentAmount: 10_000_000, monthlyNetFlow: -1_000_000, annualRate: 0, startDate, maxMonths: 3 });
    expect(result.timeline[2].closingBalance).toBe(7_000_000);
  });

  it("applies a recurring expense reduction for the active months", () => {
    const result = simulatePlan({ goalAmount: 100_000_000, currentAmount: 0, monthlyNetFlow: 1_000_000, annualRate: 0, startDate, maxMonths: 3, events: [{ id: "cut", type: "recurring_expense_delta", label: "지출 감소", amount: -200_000, startMonth: 2, endMonth: 3 }] });
    expect(result.timeline.map((month) => month.netFlow)).toEqual([1_000_000, 1_200_000, 1_200_000]);
  });

  it("applies a lump sum only once", () => {
    const result = simulatePlan({ goalAmount: 100_000_000, currentAmount: 0, monthlyNetFlow: 0, annualRate: 0, startDate, maxMonths: 3, events: [{ id: "bonus", type: "lump_sum", label: "보너스", amount: 5_000_000, startMonth: 2 }] });
    expect(result.timeline.map((month) => month.eventAmount)).toEqual([0, 5_000_000, 0]);
  });

  it("reports insufficient funds without clamping the balance", () => {
    const result = simulatePlan({ goalAmount: 100_000_000, currentAmount: 10_000_000, monthlyNetFlow: 0, annualRate: 0, startDate, maxMonths: 2, events: [{ id: "car", type: "lump_sum", label: "자동차", amount: -30_000_000, startMonth: 1 }] });
    expect(result.status).toBe("insufficient_funds");
    expect(result.insufficientAmount).toBe(20_000_000);
    expect(result.timeline[0].closingBalance).toBe(-20_000_000);
  });

  it("pauses direct contributions for exactly six months", () => {
    const result = simulatePlan({ goalAmount: 100_000_000, currentAmount: 0, monthlyNetFlow: 1_000_000, annualRate: 0, startDate, maxMonths: 8, events: [{ id: "pause", type: "contribution_pause", label: "휴식", startMonth: 2, endMonth: 7 }] });
    expect(result.timeline.map((month) => month.netFlow)).toEqual([1_000_000, 0, 0, 0, 0, 0, 0, 1_000_000]);
  });

  it("sums overlapping events", () => {
    const result = simulatePlan({ goalAmount: 100_000_000, currentAmount: 0, monthlyNetFlow: 1_000_000, annualRate: 0, startDate, maxMonths: 1, events: [{ id: "a", type: "direct_flow_delta", label: "추가1", amount: 100_000, startMonth: 1 }, { id: "b", type: "direct_flow_delta", label: "추가2", amount: 200_000, startMonth: 1 }] });
    expect(result.timeline[0].netFlow).toBe(1_300_000);
  });
});

