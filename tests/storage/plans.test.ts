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
      actionPlan: { id: "balanced", title: "월 적립과 시작 자금 나눠 채우기", monthlyContribution: 1_090_000, upfrontAmount: 5_000_000, adjustedTargetDate: "2031-07" },
      completedActionSteps: [0, 2],
      feasibilityLimits: { maxMonthlyIncrease: 100_000, maxUpfrontAmount: 5_000_000 },
      checkins: [],
    }));

    expect(plan.actionPlan?.id).toBe("balanced");
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

  it("removes a retired upfront-only action when moving a version 4 plan", () => {
    const plan = importBackup(JSON.stringify({
      schemaVersion: 4,
      id: "upfront-plan",
      name: "기존 목돈 계획",
      savedAt: "2026-07-15T00:00:00.000Z",
      goalAmount: 100_000_000,
      currentAmount: 30_000_000,
      monthlyContribution: 1_000_000,
      annualRate: 0,
      targetDate: "2031-07",
      arrivalDate: "2031-07-01T00:00:00.000Z",
      projectedAtTarget: 100_000_000,
      shortage: 0,
      actionPlan: { id: "upfront", title: "시작 자금으로 채우기", monthlyContribution: 1_000_000, upfrontAmount: 10_000_000, adjustedTargetDate: "2031-07" },
      completedActionSteps: [0, 1],
      feasibilityLimits: null,
      checkins: [],
    }));

    expect(plan.schemaVersion).toBe(SCHEMA_VERSION);
    expect(plan.actionPlan).toBeNull();
    expect(plan.completedActionSteps).toEqual([]);
  });

  it("moves version 5 updates to the simple monthly savings schema", () => {
    const plan = importBackup(JSON.stringify({
      schemaVersion: 5,
      id: "version-five-plan",
      name: "기존 월간 기록",
      savedAt: "2026-07-15T00:00:00.000Z",
      goalAmount: 100_000_000,
      currentAmount: 31_000_000,
      monthlyContribution: 1_000_000,
      annualRate: 0,
      targetDate: "2031-07",
      arrivalDate: "2032-04-01T00:00:00.000Z",
      projectedAtTarget: 91_000_000,
      shortage: 9_000_000,
      actionPlan: { id: "monthly", title: "매달 나눠 채우기", monthlyContribution: 1_170_000, upfrontAmount: 0, adjustedTargetDate: "2031-07" },
      completedActionSteps: [],
      feasibilityLimits: null,
      checkins: [{
        date: "2026-07-15T00:00:00.000Z",
        currentAmount: 31_000_000,
        projectedAtTarget: 91_000_000,
        shortage: 9_000_000,
        shortageDifference: 1_000_000,
        completedActionSteps: [],
        memo: "이전 기록",
      }],
    }));

    expect(plan.schemaVersion).toBe(SCHEMA_VERSION);
    expect(plan.checkins[0]).toMatchObject({
      period: "2026-07",
      plannedContribution: null,
      actualContribution: null,
      reason: null,
    });
  });
});
