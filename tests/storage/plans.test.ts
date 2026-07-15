import { describe, expect, it } from "vitest";
import { importBackup, SCHEMA_VERSION } from "@/lib/storage/plans";

describe("saved plan migration", () => {
  it("moves a version 1 plan to the goal-date schema", () => {
    const plan = importBackup(JSON.stringify({
      schemaVersion: 1,
      id: "legacy-plan",
      name: "기존 목표",
      savedAt: "2026-07-15T00:00:00.000Z",
      goalAmount: 100_000_000,
      currentAmount: 30_000_000,
      monthlyContribution: 1_000_000,
      annualRate: 0,
      arrivalDate: "2032-05-01T00:00:00.000Z",
      checkins: [],
    }));

    expect(plan.schemaVersion).toBe(SCHEMA_VERSION);
    expect(plan.targetDate).toBe("2032-05");
    expect(plan.actionPlan).toBeNull();
    expect(plan.completedActionSteps).toEqual([]);
  });

  it("moves a version 2 plan and its old updates to the shortage schema", () => {
    const plan = importBackup(JSON.stringify({
      schemaVersion: 2,
      id: "version-two",
      name: "두 번째 계획",
      savedAt: "2026-07-15T00:00:00.000Z",
      goalAmount: 100_000_000,
      currentAmount: 30_000_000,
      monthlyContribution: 1_000_000,
      annualRate: 0,
      targetDate: "2031-07",
      arrivalDate: "2032-05-01T00:00:00.000Z",
      checkins: [{
        date: "2026-08-15T00:00:00.000Z",
        currentAmount: 31_000_000,
        arrivalDate: "2032-04-01T00:00:00.000Z",
        differenceMonths: 1,
        memo: "첫 기록",
      }],
    }));

    expect(plan.schemaVersion).toBe(SCHEMA_VERSION);
    expect(plan.shortage).toBeNull();
    expect(plan.checkins[0]).toMatchObject({
      projectedAtTarget: null,
      shortage: null,
      shortageDifference: null,
      completedActionSteps: [],
    });
  });

  it("keeps a selected action, limits, and checklist in a current backup", () => {
    const plan = importBackup(JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      id: "current-plan",
      name: "실행 계획",
      savedAt: "2026-07-15T00:00:00.000Z",
      goalAmount: 100_000_000,
      currentAmount: 30_000_000,
      monthlyContribution: 1_000_000,
      annualRate: 0,
      targetDate: "2031-07",
      arrivalDate: "2032-05-01T00:00:00.000Z",
      projectedAtTarget: 100_000_000,
      shortage: 0,
      actionPlan: { id: "timeline", title: "목표 날짜 조정하기", monthlyContribution: 1_000_000, upfrontAmount: 0, adjustedTargetDate: "2032-05" },
      completedActionSteps: [0, 2],
      feasibilityLimits: { maxMonthlyIncrease: 100_000, maxUpfrontAmount: 5_000_000 },
      checkins: [],
    }));

    expect(plan.actionPlan?.id).toBe("timeline");
    expect(plan.completedActionSteps).toEqual([0, 2]);
    expect(plan.feasibilityLimits?.maxUpfrontAmount).toBe(5_000_000);
  });

  it("removes a retired balanced action when moving a version 3 plan", () => {
    const plan = importBackup(JSON.stringify({
      schemaVersion: 3,
      id: "balanced-plan",
      name: "기존 조합 계획",
      savedAt: "2026-07-15T00:00:00.000Z",
      goalAmount: 100_000_000,
      currentAmount: 30_000_000,
      monthlyContribution: 1_000_000,
      annualRate: 0,
      targetDate: "2031-07",
      arrivalDate: "2032-05-01T00:00:00.000Z",
      projectedAtTarget: 100_000_000,
      shortage: 0,
      actionPlan: { id: "balanced", title: "가능 범위 함께 쓰기", monthlyContribution: 1_100_000, upfrontAmount: 4_000_000 },
      completedActionSteps: [0, 1],
      feasibilityLimits: { maxMonthlyIncrease: 100_000, maxUpfrontAmount: 5_000_000 },
      checkins: [],
    }));

    expect(plan.schemaVersion).toBe(SCHEMA_VERSION);
    expect(plan.actionPlan).toBeNull();
    expect(plan.completedActionSteps).toEqual([]);
  });
});
