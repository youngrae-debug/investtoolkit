import { describe, expect, it } from "vitest";
import {
  calculateHouseholdIncomeThresholdManwon,
  calculatePolicyBenefitImpact,
  matchPolicyPrograms,
  type PolicyProfile,
} from "@/lib/policies/policy-benefits";

const baseProfile: PolicyProfile = {
  age: 29,
  incomeKind: "salary",
  annualIncomeManwon: 3_600,
  householdSize: 1,
  householdAnnualIncomeManwon: 3_600,
  marriedCoupleOnly: false,
  welfareStatus: "other",
};

describe("policy benefit matching", () => {
  it("finds a youth policy when the basic age and income conditions fit", () => {
    const matches = matchPolicyPrograms(baseProfile);
    const youthFuture = matches.find((program) => program.id === "youth-future");

    expect(youthFuture?.matchStatus).toBe("possible");
    expect(youthFuture?.availability).toContain("신청 종료");
  });

  it("keeps unknown household conditions as a check instead of claiming eligibility", () => {
    const matches = matchPolicyPrograms({
      ...baseProfile,
      householdAnnualIncomeManwon: null,
      welfareStatus: "unknown",
    });

    expect(matches.find((program) => program.id === "youth-future")?.matchStatus).toBe("check");
    expect(matches.filter((program) => program.matchStatus === "possible")).toHaveLength(0);
  });

  it("matches the correct hope savings account from welfare status", () => {
    const matches = matchPolicyPrograms({
      ...baseProfile,
      welfareStatus: "housing-education-near-poverty",
    });

    expect(matches.find((program) => program.id === "hope-two")?.matchStatus).toBe("possible");
    expect(matches.find((program) => program.id === "hope-one")?.matchStatus).toBe("unlikely");
  });

  it("calculates household thresholds and applies the married two-person exception", () => {
    expect(calculateHouseholdIncomeThresholdManwon(2, 200)).toBe(10_078);
    expect(calculateHouseholdIncomeThresholdManwon(2, 250)).toBe(12_597);

    const regular = matchPolicyPrograms({
      ...baseProfile,
      householdSize: 2,
      householdAnnualIncomeManwon: 11_000,
    });
    const marriedCouple = matchPolicyPrograms({
      ...baseProfile,
      householdSize: 2,
      householdAnnualIncomeManwon: 11_000,
      marriedCoupleOnly: true,
    });

    expect(regular.find((program) => program.id === "youth-future")?.matchStatus).toBe("unlikely");
    expect(marriedCouple.find((program) => program.id === "youth-future")?.matchStatus).toBe("possible");
  });
});

describe("policy benefit impact", () => {
  it("applies only the confirmed support months to the goal calculation", () => {
    const impact = calculatePolicyBenefitImpact({
      input: {
        goalAmount: 100_000_000,
        currentAmount: 30_000_000,
        monthlyNetFlow: 1_000_000,
        annualRate: 0,
        startDate: new Date(2026, 6, 1),
      },
      targetMonths: 60,
      monthlySupport: 100_000,
      supportMonths: 36,
    });

    expect(impact.benefitAtTarget).toBe(3_600_000);
    expect(impact.shortageAtTarget).toBe(6_400_000);
    expect(impact.shortageReduction).toBe(3_600_000);
    expect(impact.monthsEarlier).toBe(3);
  });
});
