import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/lib/format/currency";
import { formatArrivalDate } from "@/lib/format/date";
import { formatDuration, formatMonthDifference } from "@/lib/format/duration";

describe("Korean formatting", () => {
  it("formats one hundred million won", () => expect(formatCurrency(100_000_000)).toBe("1억 원"));
  it("formats 3.5 million won", () => expect(formatCurrency(3_500_000)).toBe("350만 원"));
  it("formats 61 months", () => expect(formatDuration(61)).toBe("5년 1개월"));
  it("formats 9 month difference", () => expect(formatMonthDifference(9)).toBe("9개월"));
  it("formats 25 month difference", () => expect(formatMonthDifference(25)).toBe("2년 1개월"));
  it("formats a Korean arrival month", () => expect(formatArrivalDate(new Date(2031, 7, 1))).toContain("2031년 8월"));
});
