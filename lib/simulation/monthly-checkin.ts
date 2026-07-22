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

export interface MonthlyMoneyInput {
  income: number;
  expenses: number;
}

export interface MonthlySavingsTrendInput {
  period: string;
  plannedContribution: number | null;
  actualContribution: number | null;
}

export function calculateMonthlyMoney(input: MonthlyMoneyInput) {
  const remainingAmount = input.income - input.expenses;

  return {
    remainingAmount,
    actualContribution: Math.max(0, remainingAmount),
  };
}

export function summarizeMonthlySavingsTrend(
  records: readonly MonthlySavingsTrendInput[],
  limit = 3,
) {
  const points = records
    .filter((record): record is MonthlySavingsTrendInput & {
      plannedContribution: number;
      actualContribution: number;
    } => (
      record.plannedContribution !== null
      && record.actualContribution !== null
      && Number.isFinite(record.plannedContribution)
      && Number.isFinite(record.actualContribution)
      && record.plannedContribution >= 0
      && record.actualContribution >= 0
    ))
    .sort((left, right) => left.period.localeCompare(right.period))
    .slice(-Math.max(1, Math.floor(limit)));
  const totalPlanned = points.reduce((sum, point) => sum + point.plannedContribution, 0);
  const totalActual = points.reduce((sum, point) => sum + point.actualContribution, 0);
  const latestPoint = points.at(-1) ?? null;
  const previousPoint = points.at(-2) ?? null;
  const totalDifference = totalActual - totalPlanned;
  const maxAmount = Math.max(
    1,
    ...points.flatMap((point) => [point.plannedContribution, point.actualContribution]),
  );

  return {
    points,
    totalPlanned,
    totalActual,
    totalDifference,
    latestActualChange: latestPoint && previousPoint
      ? latestPoint.actualContribution - previousPoint.actualContribution
      : null,
    recoveryAmount: Math.max(0, -totalDifference),
    nextPlannedContribution: latestPoint?.plannedContribution ?? null,
    maxAmount,
  };
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
