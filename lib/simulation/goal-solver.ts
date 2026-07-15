import { addMonths, annualToMonthlyRate } from "./engine";
import type { SimulationInput } from "./types";

export type GoalActionPlanId = "monthly" | "upfront" | "timeline";

export interface GoalFeasibilityLimits {
  maxMonthlyIncrease: number;
  maxUpfrontAmount: number;
}

export interface GoalActionPlan {
  id: GoalActionPlanId;
  title: string;
  monthlyContribution: number;
  monthlyIncrease: number;
  upfrontAmount: number;
  projectedAtTarget: number;
  shortageAtTarget: number;
  feasible: boolean;
  adjustedTargetDate: Date | null;
  monthAdjustment: number | null;
}

export interface GoalPlanAnalysis {
  targetDate: Date;
  monthsRemaining: number;
  projectedAtTarget: number;
  shortage: number;
  surplus: number;
  requiredMonthlyContribution: number;
  monthlyIncreaseNeeded: number;
  upfrontAmountNeeded: number;
  onTrack: boolean;
  actionPlans: GoalActionPlan[];
}

const DISPLAY_UNIT = 10_000;

export function monthsBetween(startDate: Date, targetDate: Date): number {
  return Math.max(
    0,
    (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
      targetDate.getMonth() -
      startDate.getMonth(),
  );
}

export function roundUpToDisplayUnit(value: number): number {
  if (value <= 0) return 0;
  return Math.ceil(value / DISPLAY_UNIT) * DISPLAY_UNIT;
}

function growthFactors(annualRate: number, months: number) {
  const monthlyRate = annualToMonthlyRate(annualRate);
  const balanceFactor = (1 + monthlyRate) ** months;
  const contributionFactor =
    monthlyRate === 0
      ? months
      : (balanceFactor - 1) / monthlyRate;
  return { balanceFactor, contributionFactor };
}

export function projectedBalanceAtTarget({
  currentAmount,
  monthlyContribution,
  upfrontAmount = 0,
  annualRate,
  months,
}: {
  currentAmount: number;
  monthlyContribution: number;
  upfrontAmount?: number;
  annualRate: number;
  months: number;
}): number {
  if (months <= 0) return currentAmount + upfrontAmount;
  const { balanceFactor, contributionFactor } = growthFactors(annualRate, months);
  return (
    (currentAmount + upfrontAmount) * balanceFactor +
    monthlyContribution * contributionFactor
  );
}

export function requiredMonthlyContribution({
  goalAmount,
  currentAmount,
  upfrontAmount = 0,
  annualRate,
  months,
}: {
  goalAmount: number;
  currentAmount: number;
  upfrontAmount?: number;
  annualRate: number;
  months: number;
}): number {
  if (months <= 0) return goalAmount <= currentAmount + upfrontAmount ? 0 : Number.POSITIVE_INFINITY;
  const { balanceFactor, contributionFactor } = growthFactors(annualRate, months);
  return Math.max(
    0,
    (goalAmount - (currentAmount + upfrontAmount) * balanceFactor) /
      contributionFactor,
  );
}

function buildPlan(
  id: GoalActionPlanId,
  title: string,
  input: SimulationInput,
  months: number,
  monthlyContribution: number,
  upfrontAmount: number,
  adjustedMonths?: number | null,
): GoalActionPlan {
  const projectionMonths = adjustedMonths === undefined ? months : adjustedMonths ?? months;
  const projectedAtTarget = projectedBalanceAtTarget({
    currentAmount: input.currentAmount,
    monthlyContribution,
    upfrontAmount,
    annualRate: input.annualRate,
    months: projectionMonths,
  });
  const adjustedTargetDate = adjustedMonths === null
    ? null
    : addMonths(input.startDate ?? new Date(), projectionMonths);
  return {
    id,
    title,
    monthlyContribution,
    monthlyIncrease: monthlyContribution - input.monthlyNetFlow,
    upfrontAmount,
    projectedAtTarget,
    shortageAtTarget: Math.max(0, input.goalAmount - projectedAtTarget),
    feasible: adjustedMonths !== null && projectedAtTarget + 1 >= input.goalAmount,
    adjustedTargetDate,
    monthAdjustment: adjustedMonths === null ? null : projectionMonths - months,
  };
}

function monthsToReachGoal(input: SimulationInput, maxMonths = 1_200): number | null {
  for (let month = 0; month <= maxMonths; month += 1) {
    const balance = projectedBalanceAtTarget({
      currentAmount: input.currentAmount,
      monthlyContribution: input.monthlyNetFlow,
      annualRate: input.annualRate,
      months: month,
    });
    if (balance >= input.goalAmount) return month;
  }
  return null;
}

export function requiredUpfrontAmount({
  goalAmount,
  currentAmount,
  monthlyContribution,
  annualRate,
  months,
}: {
  goalAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  annualRate: number;
  months: number;
}): number {
  if (months <= 0) return Math.max(0, goalAmount - currentAmount);
  const { balanceFactor, contributionFactor } = growthFactors(annualRate, months);
  return Math.max(
    0,
    (goalAmount - currentAmount * balanceFactor - monthlyContribution * contributionFactor) /
      balanceFactor,
  );
}

export function analyzeGoalPlan(
  input: SimulationInput,
  targetDate: Date,
  feasibilityLimits?: GoalFeasibilityLimits | null,
): GoalPlanAnalysis {
  const startDate = input.startDate ?? new Date();
  const monthsRemaining = monthsBetween(startDate, targetDate);
  const projectedAtTarget = projectedBalanceAtTarget({
    currentAmount: input.currentAmount,
    monthlyContribution: input.monthlyNetFlow,
    annualRate: input.annualRate,
    months: monthsRemaining,
  });
  const shortage = Math.max(0, input.goalAmount - projectedAtTarget);
  const surplus = Math.max(0, projectedAtTarget - input.goalAmount);
  const rawRequiredMonthly = requiredMonthlyContribution({
    goalAmount: input.goalAmount,
    currentAmount: input.currentAmount,
    annualRate: input.annualRate,
    months: monthsRemaining,
  });
  const requiredMonthly = Number.isFinite(rawRequiredMonthly)
    ? roundUpToDisplayUnit(rawRequiredMonthly)
    : rawRequiredMonthly;
  const { balanceFactor } = growthFactors(input.annualRate, monthsRemaining);
  const rawUpfrontAmount = monthsRemaining <= 0
    ? shortage
    : shortage / balanceFactor;
  const upfrontAmountNeeded = roundUpToDisplayUnit(rawUpfrontAmount);
  const onTrack = shortage <= 0;
  const adjustedTimelineMonths = monthsToReachGoal(input);

  let actionPlans: GoalActionPlan[];

  if (onTrack) {
    actionPlans = [
      buildPlan("monthly", "현재 계획 유지", input, monthsRemaining, input.monthlyNetFlow, 0),
      buildPlan("upfront", "월 적립 부담 낮추기", input, monthsRemaining, requiredMonthly, 0),
      buildPlan("timeline", "현재 속도의 도착일 보기", input, monthsRemaining, input.monthlyNetFlow, 0, adjustedTimelineMonths),
    ];
  } else if (feasibilityLimits) {
    const maxMonthlyIncrease = Math.max(0, feasibilityLimits.maxMonthlyIncrease);
    const maxUpfrontAmount = Math.max(0, feasibilityLimits.maxUpfrontAmount);
    const maxMonthlyContribution = input.monthlyNetFlow + maxMonthlyIncrease;
    const monthlyOnlyContribution = Math.min(requiredMonthly, maxMonthlyContribution);
    const upfrontOnlyAmount = Math.min(upfrontAmountNeeded, maxUpfrontAmount);
    actionPlans = [
      buildPlan("monthly", "매달 가능한 만큼 채우기", input, monthsRemaining, monthlyOnlyContribution, 0),
      buildPlan("upfront", "여유자금 안에서 채우기", input, monthsRemaining, input.monthlyNetFlow, upfrontOnlyAmount),
      buildPlan("timeline", "목표 날짜 조정하기", input, monthsRemaining, input.monthlyNetFlow, 0, adjustedTimelineMonths),
    ];
  } else {
    actionPlans = [
      buildPlan("monthly", "매달 나눠 채우기", input, monthsRemaining, requiredMonthly, 0),
      buildPlan("upfront", "시작 자금으로 채우기", input, monthsRemaining, input.monthlyNetFlow, upfrontAmountNeeded),
      buildPlan("timeline", "목표 날짜 조정하기", input, monthsRemaining, input.monthlyNetFlow, 0, adjustedTimelineMonths),
    ];
  }

  return {
    targetDate,
    monthsRemaining,
    projectedAtTarget,
    shortage,
    surplus,
    requiredMonthlyContribution: requiredMonthly,
    monthlyIncreaseNeeded: requiredMonthly - input.monthlyNetFlow,
    upfrontAmountNeeded,
    onTrack,
    actionPlans,
  };
}
