export function formatDuration(months: number | null): string {
  if (months === null) return "계산 범위 안에서 도달하기 어려워요";
  if (months === 0) return "이미 도착했어요";
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths}개월`;
  if (remainingMonths === 0) return `${years}년`;
  return `${years}년 ${remainingMonths}개월`;
}

export function formatMonthDifference(months: number): string {
  if (months === 0) return "변화 없음";
  return formatDuration(Math.abs(months));
}

