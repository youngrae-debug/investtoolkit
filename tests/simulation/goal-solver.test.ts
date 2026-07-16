import { describe, expect, it } from "vitest";
import {
  analyzeGoalPlan,
  monthsBetween,
  projectedBalanceAtTarget,
  requiredMonthlyContribution,
} from "@/lib/simulation/goal-solver";
import { simulatePlan } from "@/lib/simulation/engine";

const startDate = new Date(2026, 6, 1);
const targetDate = new Date(2031, 6, 1);

describe("goal date solver", () => {
  it("counts calendar months to the desired date", () => {
    expect(monthsBetween(startDate, targetDate)).toBe(60);
  });

  it("calculates the amount projected at the desired date", () => {
    expect(projectedBalanceAtTarget({ currentAmount: 30_000_000, monthlyContribution: 1_000_000, annualRate: 0, months: 60 })).toBe(90_000_000);
  });

  it("calculates the monthly contribution required to close the gap", () => {
    expect(requiredMonthlyContribution({ goalAmount: 100_000_000, currentAmount: 30_000_000, annualRate: 0, months: 60 })).toBeCloseTo(1_166_666.67, 1);
  });

  it("returns three plans that each meet an underfunded goal", () => {
    const analysis = analyzeGoalPlan({ goalAmount: 100_000_000, currentAmount: 30_000_000, monthlyNetFlow: 1_000_000, annualRate: 0, startDate }, targetDate);
    expect(analysis.shortage).toBe(10_000_000);
    expect(analysis.requiredMonthlyContribution).toBe(1_170_000);
    expect(analysis.monthlyIncreaseNeeded).toBe(170_000);
    expect(analysis.actionPlans).toHaveLength(3);
    expect(analysis.actionPlans.every((plan) => plan.projectedAtTarget >= 100_000_000)).toBe(true);
  });

  it("offers maintenance, minimum, and buffer plans when already on track", () => {
    const analysis = analyzeGoalPlan({ goalAmount: 100_000_000, currentAmount: 30_000_000, monthlyNetFlow: 1_500_000, annualRate: 0, startDate }, targetDate);
    expect(analysis.onTrack).toBe(true);
    expect(analysis.surplus).toBe(20_000_000);
    expect(analysis.actionPlans.map((plan) => plan.title)).toEqual(["현재 계획 유지", "월 적립 부담 낮추기", "현재 속도의 도착일 보기"]);
  });

  it("uses the same effective monthly return convention as the simulator", () => {
    const analysis = analyzeGoalPlan({ goalAmount: 100_000_000, currentAmount: 30_000_000, monthlyNetFlow: 1_000_000, annualRate: 4, startDate }, targetDate);
    expect(analysis.projectedAtTarget).toBeGreaterThan(90_000_000);
    expect(analysis.requiredMonthlyContribution).toBeLessThan(1_170_000);
  });

  it.each([-20, 0, 5, 30])("matches the monthly simulator at an annual rate of %s percent", (annualRate) => {
    const input = {
      goalAmount: 100_000_000,
      currentAmount: 30_000_000,
      monthlyNetFlow: 1_000_000,
      annualRate,
      startDate,
      maxMonths: 60,
    };
    const simulated = simulatePlan(input);
    const projected = projectedBalanceAtTarget({
      currentAmount: input.currentAmount,
      monthlyContribution: input.monthlyNetFlow,
      annualRate,
      months: 60,
    });

    expect(projected).toBeCloseTo(simulated.timeline[59].closingBalance, 2);
  });

  it("keeps action amounts within the user's stated limits", () => {
    const analysis = analyzeGoalPlan(
      { goalAmount: 100_000_000, currentAmount: 30_000_000, monthlyNetFlow: 1_000_000, annualRate: 0, startDate },
      targetDate,
      { maxMonthlyIncrease: 100_000, maxUpfrontAmount: 5_000_000 },
    );

    const monthly = analysis.actionPlans.find((plan) => plan.id === "monthly");
    const upfront = analysis.actionPlans.find((plan) => plan.id === "upfront");
    const timeline = analysis.actionPlans.find((plan) => plan.id === "timeline");
    expect(monthly?.monthlyIncrease).toBe(100_000);
    expect(monthly?.shortageAtTarget).toBe(4_000_000);
    expect(upfront?.upfrontAmount).toBe(5_000_000);
    expect(upfront?.shortageAtTarget).toBe(5_000_000);
    expect(timeline?.monthlyIncrease).toBe(0);
    expect(timeline?.upfrontAmount).toBe(0);
    expect(timeline?.monthAdjustment).toBe(10);
    expect(timeline?.feasible).toBe(true);
  });

  it("reports the remaining shortage when the stated limits cannot meet the goal", () => {
    const analysis = analyzeGoalPlan(
      { goalAmount: 100_000_000, currentAmount: 30_000_000, monthlyNetFlow: 1_000_000, annualRate: 0, startDate },
      targetDate,
      { maxMonthlyIncrease: 0, maxUpfrontAmount: 0 },
    );

    expect(analysis.actionPlans.find((plan) => plan.id === "monthly")?.feasible).toBe(false);
    expect(analysis.actionPlans.find((plan) => plan.id === "upfront")?.feasible).toBe(false);
    expect(analysis.actionPlans.find((plan) => plan.id === "timeline")?.feasible).toBe(true);
    expect(analysis.actionPlans.find((plan) => plan.id === "timeline")?.monthAdjustment).toBe(10);
  });
});
