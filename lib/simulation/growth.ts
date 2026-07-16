const MIN_ANNUAL_RATE = -20;
const MAX_ANNUAL_RATE = 30;

export function annualToMonthlyRate(annualRate: number): number {
  const boundedRate = Math.min(MAX_ANNUAL_RATE, Math.max(MIN_ANNUAL_RATE, annualRate));
  return Math.pow(1 + boundedRate / 100, 1 / 12) - 1;
}

export function advanceMonthlyBalance({
  openingBalance,
  monthlyRate,
  netFlow,
  lumpSum = 0,
}: {
  openingBalance: number;
  monthlyRate: number;
  netFlow: number;
  lumpSum?: number;
}): number {
  return openingBalance * (1 + monthlyRate) + netFlow + lumpSum;
}

export function monthlyGrowthFactors(annualRate: number, months: number) {
  const monthlyRate = annualToMonthlyRate(annualRate);
  let balanceFactor = 1;
  let contributionFactor = 0;

  for (let month = 0; month < Math.max(0, months); month += 1) {
    balanceFactor = advanceMonthlyBalance({
      openingBalance: balanceFactor,
      monthlyRate,
      netFlow: 0,
    });
    contributionFactor = advanceMonthlyBalance({
      openingBalance: contributionFactor,
      monthlyRate,
      netFlow: 1,
    });
  }

  return { balanceFactor, contributionFactor, monthlyRate };
}
