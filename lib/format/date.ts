export function formatArrivalDate(date: Date | null): string {
  if (!date) return "100년 안에 도달하지 못함";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export function compareArrivalDates(previous: Date, current: Date): number {
  return (
    (previous.getFullYear() - current.getFullYear()) * 12 +
    previous.getMonth() -
    current.getMonth()
  );
}

