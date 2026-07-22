"use client";

import { formatCurrency } from "@/lib/format/currency";
import {
  formatMonthlyPeriod,
  monthlyCheckinReasonLabel,
  savingsDifferenceCopy,
} from "@/lib/format/monthly-checkin";
import { summarizeMonthlySavingsTrend } from "@/lib/simulation/monthly-checkin";
import type { SavedPlan } from "@/lib/storage/plans";

interface MonthlySavingsTrendProps {
  checkins: SavedPlan["checkins"];
}

function barHeight(value: number, maxAmount: number) {
  if (value === 0) return "0%";
  return `${Math.max(8, Math.round((value / maxAmount) * 100))}%`;
}

export function MonthlySavingsTrend({ checkins }: MonthlySavingsTrendProps) {
  const trend = summarizeMonthlySavingsTrend(checkins);
  if (trend.points.length === 0) return null;

  const chartLabel = trend.points
    .map((point) => `${formatMonthlyPeriod(point.period)} 계획 ${formatCurrency(point.plannedContribution)}, 실제 ${formatCurrency(point.actualContribution)}`)
    .join(". ");
  const differenceCopy = trend.totalDifference === 0 && trend.points.length > 1
    ? `${trend.points.length}개월 합계가 계획과 같아요`
    : savingsDifferenceCopy(trend.totalDifference);
  const latestPeriod = trend.points.at(-1)?.period ?? null;
  const latestReason = monthlyCheckinReasonLabel(
    checkins.find((checkin) => checkin.period === latestPeriod)?.reason ?? null,
  );
  const latestChangeCopy = trend.latestActualChange === null
    ? null
    : trend.latestActualChange > 0
      ? `지난달보다 ${formatCurrency(trend.latestActualChange)} 더 모았어요`
      : trend.latestActualChange < 0
        ? `지난달보다 ${formatCurrency(Math.abs(trend.latestActualChange))} 덜 모았어요`
        : "지난달과 같은 금액을 모았어요";
  const nextMonthCopy = trend.recoveryAmount > 0
    ? `다음 달에 계획보다 ${formatCurrency(trend.recoveryAmount)} 더 모으면 최근 기록의 누적 계획과 같아져요.`
    : `다음 달에는 계획 ${formatCurrency(trend.nextPlannedContribution ?? 0)}을 유지하면 돼요.`;

  return (
    <section className="monthly-savings-trend" aria-labelledby="monthly-savings-trend-title">
      <div className="monthly-savings-trend__heading">
        <div>
          <span>계획과 실제 비교</span>
          <h3 id="monthly-savings-trend-title">최근 3개월 저축 흐름</h3>
        </div>
        <strong>{trend.points.length}개월 기록</strong>
      </div>

      <p className="monthly-savings-trend__summary">
        <strong className={trend.totalDifference < 0 ? "negative" : ""}>{differenceCopy}</strong>
        <span>계획 {formatCurrency(trend.totalPlanned)} · 실제 {formatCurrency(trend.totalActual)}</span>
      </p>

      <div className="monthly-savings-chart" role="img" aria-label={chartLabel}>
        {trend.points.map((point) => (
          <div className="monthly-savings-chart__point" key={point.period}>
            <div className="monthly-savings-chart__bars" aria-hidden="true">
              <span className="monthly-savings-chart__bar monthly-savings-chart__bar--planned" style={{ height: barHeight(point.plannedContribution, trend.maxAmount) }} />
              <span className="monthly-savings-chart__bar monthly-savings-chart__bar--actual" style={{ height: barHeight(point.actualContribution, trend.maxAmount) }} />
            </div>
            <small>{Number(point.period.slice(5))}월</small>
          </div>
        ))}
      </div>

      <div className="monthly-savings-trend__legend" aria-hidden="true">
        <span><i className="monthly-savings-trend__legend-plan" />계획</span>
        <span><i className="monthly-savings-trend__legend-actual" />실제</span>
      </div>

      {trend.points.length === 1 && (
        <p className="monthly-savings-trend__prompt">한 달 더 기록하면 지난달과 달라진 흐름을 비교할 수 있어요.</p>
      )}

      {latestChangeCopy && (
        <div className="monthly-savings-trend__insight">
          <div>
            <span>지난달 비교</span>
            <strong>{latestChangeCopy}</strong>
            {latestReason && <small>기록한 이유: {latestReason}</small>}
          </div>
          <div>
            <span>다음 달</span>
            <strong>{nextMonthCopy}</strong>
          </div>
        </div>
      )}
    </section>
  );
}
