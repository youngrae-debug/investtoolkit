export type PlanningMode = "direct" | "cashflow";

export type SimulationEventType =
  | "recurring_income_delta"
  | "recurring_expense_delta"
  | "direct_flow_delta"
  | "lump_sum"
  | "contribution_pause";

export interface SimulationEvent {
  id: string;
  type: SimulationEventType;
  label: string;
  amount?: number;
  startMonth: number;
  endMonth?: number;
}

export interface SimulationInput {
  goalAmount: number;
  currentAmount: number;
  monthlyNetFlow: number;
  annualRate: number;
  startDate?: Date;
  maxMonths?: number;
  events?: SimulationEvent[];
  planningMode?: PlanningMode;
}

export interface MonthlySnapshot {
  month: number;
  date: Date;
  openingBalance: number;
  netFlow: number;
  eventAmount: number;
  investmentGain: number;
  closingBalance: number;
}

export type SimulationStatus =
  | "reached"
  | "not_reached"
  | "insufficient_funds";

export interface SimulationResult {
  status: SimulationStatus;
  reached: boolean;
  monthsToGoal: number | null;
  arrivalDate: Date | null;
  endingBalance: number;
  cumulativeNetFlow: number;
  investmentGain: number;
  insufficientMonth: number | null;
  insufficientAmount: number | null;
  timeline: MonthlySnapshot[];
}

export interface CashflowInput {
  monthlyNetIncome: number;
  fixedExpenses: number;
  livingExpenses: number;
  debtPayments: number;
}

