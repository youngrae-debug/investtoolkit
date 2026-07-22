import type { MonthlyCheckinReason } from "@/lib/storage/plans";
import { formatCurrency } from "./currency";

export const MONTHLY_CHECKIN_REASONS: ReadonlyArray<{
  id: MonthlyCheckinReason;
  label: string;
}> = [
  { id: "living-expenses", label: "생활비가 늘었어요" },
  { id: "unexpected-expense", label: "예상 밖 지출" },
  { id: "income-change", label: "수입이 달라졌어요" },
  { id: "saved-more", label: "계획보다 더 모았어요" },
];

export function formatMonthlyPeriod(period: string) {
  const [year, month] = period.split("-");
  return `${year}년 ${Number(month)}월`;
}

export function savingsDifferenceCopy(difference: number) {
  if (difference > 0) return `계획보다 ${formatCurrency(difference)} 더 모았어요`;
  if (difference < 0) return `계획보다 ${formatCurrency(Math.abs(difference))} 덜 모았어요`;
  return "이번 달 계획만큼 모았어요";
}

export function monthlyCheckinReasonLabel(reason: MonthlyCheckinReason | null) {
  return MONTHLY_CHECKIN_REASONS.find((option) => option.id === reason)?.label ?? null;
}
