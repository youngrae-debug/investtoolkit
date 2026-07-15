import type {
  CashflowInput,
  SimulationEvent,
  SimulationInput,
  SimulationResult,
} from "./types";

export const MAX_SIMULATION_MONTHS = 1_200;

export function annualToMonthlyRate(annualRate: number): number {
  const boundedRate = Math.min(30, Math.max(-20, annualRate));
  return Math.pow(1 + boundedRate / 100, 1 / 12) - 1;
}

export function calculateMonthlyNetFlow(input: CashflowInput): number {
  return (
    input.monthlyNetIncome -
    input.fixedExpenses -
    input.livingExpenses -
    input.debtPayments
  );
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isActive(event: SimulationEvent, month: number): boolean {
  return (
    month >= event.startMonth &&
    (event.endMonth === undefined || month <= event.endMonth)
  );
}

function eventEffect(
  events: SimulationEvent[],
  month: number,
  baseMonthlyNetFlow: number,
): { recurringDelta: number; lumpSum: number } {
  let recurringDelta = 0;
  let lumpSum = 0;

  for (const event of events) {
    if (!isActive(event, month)) continue;

    if (event.type === "lump_sum") {
      if (event.startMonth === month) lumpSum += event.amount ?? 0;
    } else if (event.type === "recurring_expense_delta") {
      recurringDelta -= event.amount ?? 0;
    } else if (event.type === "contribution_pause") {
      recurringDelta -= Math.max(0, baseMonthlyNetFlow);
    } else {
      recurringDelta += event.amount ?? 0;
    }
  }

  return { recurringDelta, lumpSum };
}

export function simulatePlan(input: SimulationInput): SimulationResult {
  const maxMonths = Math.min(
    MAX_SIMULATION_MONTHS,
    Math.max(1, input.maxMonths ?? MAX_SIMULATION_MONTHS),
  );
  const startDate = input.startDate ?? new Date();
  const monthlyRate = annualToMonthlyRate(input.annualRate);
  const events = input.events ?? [];
  const timeline = [];
  let balance = input.currentAmount;
  let cumulativeNetFlow = 0;
  let cumulativeInvestmentGain = 0;
  let monthsToGoal: number | null =
    input.currentAmount >= input.goalAmount ? 0 : null;
  let arrivalDate: Date | null =
    monthsToGoal === 0 ? addMonths(startDate, 0) : null;
  let insufficientMonth: number | null = null;
  let insufficientAmount: number | null = null;

  for (let month = 1; month <= maxMonths; month += 1) {
    const openingBalance = balance;
    const gain = openingBalance * monthlyRate;
    const { recurringDelta, lumpSum } = eventEffect(
      events,
      month,
      input.monthlyNetFlow,
    );
    const netFlow = input.monthlyNetFlow + recurringDelta;
    balance = openingBalance + gain + netFlow + lumpSum;
    cumulativeNetFlow += netFlow + lumpSum;
    cumulativeInvestmentGain += gain;

    timeline.push({
      month,
      date: addMonths(startDate, month),
      openingBalance,
      netFlow,
      eventAmount: lumpSum,
      investmentGain: gain,
      closingBalance: balance,
    });

    if (balance < 0 && insufficientMonth === null) {
      insufficientMonth = month;
      insufficientAmount = Math.abs(balance);
    }

    if (monthsToGoal === null && balance >= input.goalAmount) {
      monthsToGoal = month;
      arrivalDate = addMonths(startDate, month);
    }
  }

  const reached = monthsToGoal !== null;
  return {
    status:
      insufficientMonth !== null
        ? "insufficient_funds"
        : reached
          ? "reached"
          : "not_reached",
    reached,
    monthsToGoal,
    arrivalDate,
    endingBalance: balance,
    cumulativeNetFlow,
    investmentGain: cumulativeInvestmentGain,
    insufficientMonth,
    insufficientAmount,
    timeline,
  };
}

export function monthDifference(
  baseMonths: number | null,
  changedMonths: number | null,
): number | null {
  if (baseMonths === null || changedMonths === null) return null;
  return baseMonths - changedMonths;
}

