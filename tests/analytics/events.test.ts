import { describe, expect, it } from "vitest";
import { filterAnalyticsProperties } from "@/lib/analytics/events";

describe("privacy-safe analytics boundary", () => {
  it("keeps only the properties explicitly allowed for an event", () => {
    expect(filterAnalyticsProperties("gps_step_completed", {
      step_number: 2,
      goal_amount: 100_000_000,
      memo: "분석으로 보내면 안 되는 값",
    })).toEqual({ step_number: 2 });
  });

  it("drops non-finite and oversized values", () => {
    expect(filterAnalyticsProperties("gps_step_completed", {
      step_number: Number.POSITIVE_INFINITY,
    })).toEqual({});

    expect(filterAnalyticsProperties("goal_action_selected", {
      action_type: "a".repeat(41),
    })).toEqual({});
  });
});
