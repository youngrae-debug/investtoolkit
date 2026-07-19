import { simulatePlan } from "./engine";
import { analyzeGoalPlan, type GoalFeasibilityLimits } from "./goal-solver";

export interface MonthlyCheckinInput {
  goalAmount: number;
  currentAmount: number;
  previousActualContribution?: number;
  plannedContribution: number;
  actualContribution: number;
  futureMonthlyContribution: number;
  annualRate: number;
  targetDate: Date;
  checkinDate: Date;
  feasibilityLimits: GoalFeasibilityLimits | null;
}

export function analyzeMonthlyCheckin(input: MonthlyCheckinInput) {
  const baseCurrentAmount = Math.max(
    0,
    input.currentAmount - (input.previousActualContribution ?? 0),
  );
  const currentAmount = baseCurrentAmount + input.actualContribution;
  const nextMonth = new Date(
    input.checkinDate.getFullYear(),
    input.checkinDate.getMonth() + 1,
    1,
  );
  const simulationInput = {
    goalAmount: input.goalAmount,
    currentAmount,
    monthlyNetFlow: input.futureMonthlyContribution,
    annualRate: input.annualRate,
    startDate: nextMonth,
  };
  const result = simulatePlan({
    ...simulationInput,
    startDate: input.checkinDate,
  });
  const analysis = analyzeGoalPlan(
    simulationInput,
    input.targetDate,
    input.feasibilityLimits,
  );

  return {
    currentAmount,
    contributionDifference: input.actualContribution - input.plannedContribution,
    arrivalDate: result.arrivalDate,
    projectedAtTarget: analysis.projectedAtTarget,
    shortage: analysis.shortage,
  };
}
