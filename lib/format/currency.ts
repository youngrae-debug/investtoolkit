export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "0원";
  const sign = value < 0 ? "-" : "";
  const absolute = Math.round(Math.abs(value));
  if (absolute === 0) return "0원";

  const eok = Math.floor(absolute / 100_000_000);
  const man = Math.floor((absolute % 100_000_000) / 10_000);
  const won = absolute % 10_000;
  const parts: string[] = [];

  if (eok > 0) parts.push(`${eok.toLocaleString("ko-KR")}억`);
  if (man > 0) parts.push(`${man.toLocaleString("ko-KR")}만`);
  if (won > 0 && eok === 0 && man === 0) {
    parts.push(won.toLocaleString("ko-KR"));
  }

  const suffix = eok > 0 || man > 0 ? " 원" : "원";
  return `${sign}${parts.join(" ")}${suffix}`;
}

export function manwonToWon(value: number): number {
  return Math.round(value * 10_000);
}

export function wonToManwon(value: number): number {
  return value / 10_000;
}
