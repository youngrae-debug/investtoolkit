import { simulatePlan } from "@/lib/simulation/engine";
import type { SimulationInput } from "@/lib/simulation/types";

export type IncomeKind = "salary" | "business" | "none";
export type WelfareStatus =
  | "livelihood-medical"
  | "housing-education-near-poverty"
  | "other"
  | "unknown";
export type PolicyProgramId = "youth-future" | "hope-one" | "hope-two";
export type PolicyMatchStatus = "possible" | "check" | "unlikely";

export interface PolicyProfile {
  age: number;
  incomeKind: IncomeKind;
  annualIncomeManwon: number | null;
  householdSize: number;
  householdAnnualIncomeManwon: number | null;
  marriedCoupleOnly: boolean;
  welfareStatus: WelfareStatus;
}

export interface PolicyProgram {
  id: PolicyProgramId;
  name: string;
  provider: string;
  summary: string;
  benefit: string;
  availability: string;
  defaultSupportMonths: number;
  officialUrl: string;
  verifiedAt: string;
}

export interface PolicyMatch extends PolicyProgram {
  matchStatus: PolicyMatchStatus;
  matchReason: string;
}

export interface PolicyBenefitImpact {
  benefitAtTarget: number;
  shortageAtTarget: number;
  shortageReduction: number;
  monthsEarlier: number | null;
  changedMonthsToGoal: number | null;
  becameReachable: boolean;
}

export const MEDIAN_INCOME_2026_MONTHLY = [
  0,
  2_564_238,
  4_199_292,
  5_359_036,
  6_494_738,
  7_556_719,
  8_555_952,
  9_515_150,
] as const;

export function calculateHouseholdIncomeThresholdManwon(
  householdSize: number,
  percentage: number,
): number {
  const size = Math.max(1, Math.round(householdSize));
  const sixPerson = MEDIAN_INCOME_2026_MONTHLY[6];
  const sevenPerson = MEDIAN_INCOME_2026_MONTHLY[7];
  const monthlyMedian = size <= 7
    ? MEDIAN_INCOME_2026_MONTHLY[size]
    : sevenPerson + (sevenPerson - sixPerson) * (size - 7);
  return Math.floor((monthlyMedian * 12 * percentage) / 100 / 10_000);
}

export const POLICY_PROGRAMS: PolicyProgram[] = [
  {
    id: "youth-future",
    name: "청년미래적금",
    provider: "금융위원회 · 참여 금융기관",
    summary: "소득이나 매출이 있는 청년이 월 최대 50만 원씩 3년간 자유롭게 적립하는 정책형 적금입니다.",
    benefit: "정부기여금 6% 또는 12%, 이자소득 비과세와 금융기관 금리가 적용됩니다.",
    availability: "2026년 첫 신청 종료 · 다음 공고 확인",
    defaultSupportMonths: 36,
    officialUrl: "https://www.fsc.go.kr/po010104/87005",
    verifiedAt: "2026.07.16",
  },
  {
    id: "hope-one",
    name: "희망저축계좌Ⅰ",
    provider: "보건복지부 · 거주지 지방자치단체",
    summary: "일하는 생계·의료급여 수급 가구의 자산 형성을 지원하는 통장입니다.",
    benefit: "본인 저축과 근로 유지 등 요건을 충족하면 근로소득장려금이 더해집니다.",
    availability: "거주지별 모집 일정 확인",
    defaultSupportMonths: 36,
    officialUrl: "https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00000100",
    verifiedAt: "2026.07.16",
  },
  {
    id: "hope-two",
    name: "희망저축계좌Ⅱ",
    provider: "보건복지부 · 거주지 지방자치단체",
    summary: "일하는 주거·교육급여 수급 가구와 차상위 가구의 자립을 돕는 통장입니다.",
    benefit: "통장 유지, 근로활동과 교육 등 요건을 충족하면 근로소득장려금이 더해집니다.",
    availability: "거주지별 모집 일정 확인",
    defaultSupportMonths: 36,
    officialUrl: "https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00000100",
    verifiedAt: "2026.07.16",
  },
];

function youthFutureMatch(profile: PolicyProfile): Pick<PolicyMatch, "matchStatus" | "matchReason"> {
  if (profile.age < 19 || profile.age > 40) {
    return { matchStatus: "unlikely", matchReason: "기본 연령 범위와 차이가 있어요." };
  }
  if (profile.age > 34) {
    return { matchStatus: "check", matchReason: "병역이행기간에 따라 연령 인정 여부가 달라질 수 있어요." };
  }
  if (profile.incomeKind === "none") {
    return { matchStatus: "unlikely", matchReason: "소득이나 사업 매출이 있는 청년을 대상으로 해요." };
  }
  if (profile.annualIncomeManwon === null) {
    return { matchStatus: "check", matchReason: "지난해 소득·매출과 가구소득 확인이 필요해요." };
  }
  const exceedsIncomeLimit = profile.incomeKind === "salary"
    ? profile.annualIncomeManwon > 7_500
    : profile.annualIncomeManwon > 30_000;
  if (exceedsIncomeLimit) {
    return { matchStatus: "unlikely", matchReason: "입력한 개인소득·매출이 기본 가입 기준보다 높을 수 있어요." };
  }
  if (profile.householdAnnualIncomeManwon === null) {
    return { matchStatus: "check", matchReason: "연령과 개인소득은 맞지만 가구원의 지난해 소득 합계 확인이 필요해요." };
  }
  const householdPercentage = profile.marriedCoupleOnly && profile.householdSize === 2 ? 250 : 200;
  const householdThreshold = calculateHouseholdIncomeThresholdManwon(
    profile.householdSize,
    householdPercentage,
  );
  if (profile.householdAnnualIncomeManwon > householdThreshold) {
    return {
      matchStatus: "unlikely",
      matchReason: `입력한 가구소득이 ${profile.householdSize}인 가구 ${householdPercentage}% 간이 기준보다 높아요.`,
    };
  }
  if (profile.incomeKind === "salary" && profile.annualIncomeManwon > 6_000) {
    return {
      matchStatus: "possible",
      matchReason: "가입 가능성은 있지만 이 개인소득 구간은 정부기여금 없이 비과세만 적용될 수 있어요.",
    };
  }
  return {
    matchStatus: "possible",
    matchReason: `개인소득과 ${profile.householdSize}인 가구소득 간이 기준상 대상 가능성이 있어요.`,
  };
}

function hopeSavingsMatch(
  profile: PolicyProfile,
  requiredStatus: WelfareStatus,
): Pick<PolicyMatch, "matchStatus" | "matchReason"> {
  if (profile.incomeKind === "none") {
    return { matchStatus: "unlikely", matchReason: "현재 근로·사업소득이 있는 가구를 대상으로 해요." };
  }
  if (profile.welfareStatus === requiredStatus) {
    return { matchStatus: "possible", matchReason: "입력한 근로·복지 조건상 대상 가능성이 있어요." };
  }
  if (profile.welfareStatus === "unknown") {
    return { matchStatus: "check", matchReason: "가구의 수급·차상위 자격 확인이 필요해요." };
  }
  return { matchStatus: "unlikely", matchReason: "입력한 복지 자격과 이 통장의 기본 대상이 달라요." };
}

export function matchPolicyPrograms(profile: PolicyProfile): PolicyMatch[] {
  const score: Record<PolicyMatchStatus, number> = { possible: 0, check: 1, unlikely: 2 };
  return POLICY_PROGRAMS.map((program) => {
    const match = program.id === "youth-future"
      ? youthFutureMatch(profile)
      : program.id === "hope-one"
        ? hopeSavingsMatch(profile, "livelihood-medical")
        : hopeSavingsMatch(profile, "housing-education-near-poverty");
    return { ...program, ...match };
  }).sort((a, b) => score[a.matchStatus] - score[b.matchStatus]);
}

export function calculatePolicyBenefitImpact({
  input,
  targetMonths,
  monthlySupport,
  supportMonths,
}: {
  input: SimulationInput;
  targetMonths: number;
  monthlySupport: number;
  supportMonths: number;
}): PolicyBenefitImpact {
  const boundedTargetMonths = Math.max(1, Math.round(targetMonths));
  const boundedSupportMonths = Math.min(1_200, Math.max(1, Math.round(supportMonths)));
  const supportEvent = {
    id: "confirmed-policy-support",
    type: "direct_flow_delta" as const,
    label: "확인한 정책 지원금",
    amount: Math.max(0, monthlySupport),
    startMonth: 1,
    endMonth: boundedSupportMonths,
  };
  const baselineAtTarget = simulatePlan({ ...input, maxMonths: boundedTargetMonths });
  const changedInput: SimulationInput = {
    ...input,
    events: [...(input.events ?? []), supportEvent],
  };
  const changedAtTarget = simulatePlan({ ...changedInput, maxMonths: boundedTargetMonths });
  const baselineFull = simulatePlan(input);
  const changedFull = simulatePlan(changedInput);
  const baselineShortage = Math.max(0, input.goalAmount - baselineAtTarget.endingBalance);
  const shortageAtTarget = Math.max(0, input.goalAmount - changedAtTarget.endingBalance);
  const monthsEarlier = baselineFull.monthsToGoal !== null && changedFull.monthsToGoal !== null
    ? Math.max(0, baselineFull.monthsToGoal - changedFull.monthsToGoal)
    : null;

  return {
    benefitAtTarget: Math.max(0, changedAtTarget.endingBalance - baselineAtTarget.endingBalance),
    shortageAtTarget,
    shortageReduction: Math.max(0, baselineShortage - shortageAtTarget),
    monthsEarlier,
    changedMonthsToGoal: changedFull.monthsToGoal,
    becameReachable: baselineFull.monthsToGoal === null && changedFull.monthsToGoal !== null,
  };
}
