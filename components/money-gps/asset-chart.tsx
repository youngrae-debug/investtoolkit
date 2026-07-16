import { formatCurrency } from "@/lib/format/currency";
import type { SimulationResult } from "@/lib/simulation/types";

interface AssetChartProps {
  result: SimulationResult;
  goalAmount: number;
  currentAmount: number;
  horizonMonths?: number;
}

export function AssetChart({ result, goalAmount, currentAmount, horizonMonths }: AssetChartProps) {
  const horizon = Math.max(1, Math.min(horizonMonths ?? result.monthsToGoal ?? 120, 120));
  const points = Array.from({ length: 9 }, (_, index) => {
    if (index === 0) return { month: 0, balance: currentAmount };
    const month = Math.max(1, Math.round((horizon * index) / 8));
    return { month, balance: result.timeline[month - 1]?.closingBalance ?? 0 };
  });
  const maxValue = Math.max(goalAmount, ...points.map((point) => point.balance), 1);

  return (
    <div className="asset-chart" role="img" aria-label={`현재 ${formatCurrency(currentAmount)}에서 ${horizon}개월 동안의 예상 자산 변화`}>
      <div className="chart-goal"><span>목표 {formatCurrency(goalAmount)}</span></div>
      <div className="chart-bars" aria-hidden="true">
        {points.map((point) => (
          <div className="chart-bar-wrap" key={point.month}>
            <span className="chart-bar" style={{ height: `${Math.max(4, (point.balance / maxValue) * 86)}%` }} />
            <small>{point.month === 0 ? "지금" : `${point.month}개월`}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
