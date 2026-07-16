export function dateToMonthValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthValueToDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return new Date(year, month - 1, 1);
}

export function futureMonthValue(years: number): string {
  const now = new Date();
  return dateToMonthValue(new Date(now.getFullYear() + years, now.getMonth(), 1));
}
