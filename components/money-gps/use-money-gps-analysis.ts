import { useMemo } from "react";
import { manwonToWon } from "@/lib/format/currency";
import { monthValueToDate } from "@/lib/format/month-value";
import { analyzeGoalPlan, type GoalFeasibilityLimits } from "@/lib/simulation/goal-solver";
import { simulatePlan } from "@/lib/simulation/engine";
import type { SimulationInput } from "@/lib/simulation/types";

interface UseMoneyGpsAnalysisInput {
  annualRate: number;
  cashflowMode: boolean;
  currentManwon: number | null;
  feasibilityLimits: GoalFeasibilityLimits | null;
  goalDate: string;
  goalManwon: number | null;
  monthlyManwon: number | null;
}

export function useMoneyGpsAnalysis({
  annualRate,
  cashflowMode,
  currentManwon,
  feasibilityLimits,
  goalDate,
  goalManwon,
  monthlyManwon,
}: UseMoneyGpsAnalysisInput) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const startDate = useMemo(() => new Date(currentYear, currentMonth, 1), [currentMonth, currentYear]);

  const baseInput = useMemo<SimulationInput | null>(() => {
    if (goalManwon === null || currentManwon === null || monthlyManwon === null) return null;
    return {
      goalAmount: manwonToWon(goalManwon),
      currentAmount: manwonToWon(currentManwon),
      monthlyNetFlow: manwonToWon(monthlyManwon),
      annualRate,
      startDate,
      planningMode: cashflowMode ? "cashflow" : "direct",
    };
  }, [annualRate, cashflowMode, currentManwon, goalManwon, monthlyManwon, startDate]);

  const result = useMemo(() => baseInput ? simulatePlan(baseInput) : null, [baseInput]);
  const parsedGoalDate = useMemo(() => monthValueToDate(goalDate), [goalDate]);
  const goalDateIsFuture = parsedGoalDate !== null && parsedGoalDate > startDate;
  const goalAnalysis = useMemo(
    () => baseInput && parsedGoalDate ? analyzeGoalPlan(baseInput, parsedGoalDate, feasibilityLimits) : null,
    [baseInput, feasibilityLimits, parsedGoalDate],
  );

  return { baseInput, goalAnalysis, goalDateIsFuture, parsedGoalDate, result, startDate };
}
