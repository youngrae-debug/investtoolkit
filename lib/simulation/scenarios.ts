import { simulatePlan } from "./engine";
import { monthsBetween } from "./goal-solver";
import type {
  SimulationEvent,
  SimulationInput,
  SimulationResult,
} from "./types";

export type ConditionPresetId =
  | "monthly-100k"
  | "monthly-200k"
  | "bonus-5m"
  | "car-30m"
  | "pause-6m";

export interface ConditionPreset {
  id: ConditionPresetId;
  label: string;
  description: string;
  events: SimulationEvent[];
}

export interface ConditionTargetAnalysis {
  projectedAtTarget: number;
  shortage: number;
  surplus: number;
  shortageChange: number;
  insufficientFunds: boolean;
}

export const conditionPresets: ConditionPreset[] = [
  {
    id: "monthly-100k",
    label: "매달 10만 원 더 모으기",
    description: "다음 달부터 계속 적용",
    events: [
      {
        id: "monthly-100k",
        type: "direct_flow_delta",
        label: "월 적립액 10만 원 증가",
        amount: 100_000,
        startMonth: 1,
      },
    ],
  },
  {
    id: "monthly-200k",
    label: "매달 20만 원 더 모으기",
    description: "다음 달부터 계속 적용",
    events: [
      {
        id: "monthly-200k",
        type: "direct_flow_delta",
        label: "월 적립액 20만 원 증가",
        amount: 200_000,
        startMonth: 1,
      },
    ],
  },
  {
    id: "bonus-5m",
    label: "보너스 500만 원 추가",
    description: "다음 달 한 번 적용",
    events: [
      {
        id: "bonus-5m",
        type: "lump_sum",
        label: "보너스 500만 원",
        amount: 5_000_000,
        startMonth: 1,
      },
    ],
  },
  {
    id: "car-30m",
    label: "자동차에 3,000만 원 사용",
    description: "12개월 뒤 한 번 적용",
    events: [
      {
        id: "car-30m",
        type: "lump_sum",
        label: "자동차 구매",
        amount: -30_000_000,
        startMonth: 12,
      },
    ],
  },
  {
    id: "pause-6m",
    label: "6개월 모으기 쉬기",
    description: "다음 달부터 6개월 적용",
    events: [
      {
        id: "pause-6m",
        type: "contribution_pause",
        label: "6개월 적립 중단",
        startMonth: 1,
        endMonth: 6,
      },
    ],
  },
];

export function simulateCondition(
  base: SimulationInput,
  preset: ConditionPreset,
): SimulationResult {
  return simulatePlan({ ...base, events: preset.events });
}

export function analyzeConditionAtTarget(
  base: SimulationInput,
  preset: ConditionPreset,
  targetDate: Date,
  baseShortage: number,
): ConditionTargetAnalysis {
  const months = monthsBetween(base.startDate ?? new Date(), targetDate);
  const result = simulatePlan({
    ...base,
    events: preset.events,
    maxMonths: Math.max(1, months),
  });
  const projectedAtTarget = months === 0
    ? base.currentAmount
    : result.timeline[months - 1]?.closingBalance ?? base.currentAmount;
  const shortage = Math.max(0, base.goalAmount - projectedAtTarget);

  return {
    projectedAtTarget,
    shortage,
    surplus: Math.max(0, projectedAtTarget - base.goalAmount),
    shortageChange: baseShortage - shortage,
    insufficientFunds: result.insufficientMonth !== null && result.insufficientMonth <= months,
  };
}
