import { z } from "zod/mini";
import {
  MAX_BACKUP_FILE_BYTES,
  MAX_CHECKINS,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from "./version";

export {
  MAX_BACKUP_FILE_BYTES,
  MAX_CHECKINS,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from "./version";

const goalActionPlanIdSchema = z.enum(["monthly", "balanced", "timeline"]);
const versionFourGoalActionPlanIdSchema = z.enum(["monthly", "upfront", "timeline"]);
const versionThreeGoalActionPlanIdSchema = z.enum(["monthly", "upfront", "balanced"]);
const monthValueSchema = z.string().check(z.regex(/^\d{4}-\d{2}$/));
const planNameSchema = z.string().check(z.minLength(1), z.maxLength(60));
const memoSchema = z.string().check(z.maxLength(300));
const nonnegativeNumberSchema = z.number().check(z.nonnegative());
const actionStepSchema = z.int().check(z.minimum(0), z.maximum(2));
const completedActionStepsSchema = z.array(actionStepSchema).check(z.maxLength(3));
const annualRateSchema = z.number().check(z.minimum(-20), z.maximum(30));
const identifierSchema = z.string().check(z.minLength(1), z.maxLength(100));
const dateStringSchema = z.string().check(z.minLength(1), z.maxLength(40));

function checkinList<T>(schema: z.ZodMiniType<T>) {
  return z.array(schema).check(z.maxLength(MAX_CHECKINS));
}

const legacyCheckinSchema = z.object({
  date: dateStringSchema,
  currentAmount: nonnegativeNumberSchema,
  arrivalDate: z.nullable(dateStringSchema),
  differenceMonths: z.nullable(z.number()),
  memo: memoSchema,
});

const versionFiveCheckinSchema = z.object({
  date: dateStringSchema,
  currentAmount: nonnegativeNumberSchema,
  projectedAtTarget: z.nullable(z.number()),
  shortage: z.nullable(nonnegativeNumberSchema),
  shortageDifference: z.nullable(z.number()),
  completedActionSteps: completedActionStepsSchema,
  memo: memoSchema,
});

const monthlyCheckinReasonSchema = z.enum([
  "living-expenses",
  "unexpected-expense",
  "income-change",
  "saved-more",
]);

const versionSixCheckinSchema = z.extend(versionFiveCheckinSchema, {
  period: monthValueSchema,
  plannedContribution: z.nullable(nonnegativeNumberSchema),
  actualContribution: z.nullable(nonnegativeNumberSchema),
  reason: z.nullable(monthlyCheckinReasonSchema),
});

const checkinSchema = z.extend(versionSixCheckinSchema, {
  monthlyIncome: z.nullable(nonnegativeNumberSchema),
  monthlyExpenses: z.nullable(nonnegativeNumberSchema),
});

const actionPlanSnapshotSchema = z.object({
  id: goalActionPlanIdSchema,
  title: planNameSchema,
  monthlyContribution: z.number(),
  upfrontAmount: nonnegativeNumberSchema,
  adjustedTargetDate: z.nullable(monthValueSchema),
});

const versionFourActionPlanSnapshotSchema = z.object({
  id: versionFourGoalActionPlanIdSchema,
  title: planNameSchema,
  monthlyContribution: z.number(),
  upfrontAmount: nonnegativeNumberSchema,
  adjustedTargetDate: z.nullable(monthValueSchema),
});

const versionThreeActionPlanSnapshotSchema = z.object({
  id: versionThreeGoalActionPlanIdSchema,
  title: planNameSchema,
  monthlyContribution: z.number(),
  upfrontAmount: nonnegativeNumberSchema,
});

const feasibilityLimitsSchema = z.object({
  maxMonthlyIncrease: nonnegativeNumberSchema,
  maxUpfrontAmount: nonnegativeNumberSchema,
});

const legacySavedPlanSchema = z.object({
  schemaVersion: z.literal(1),
  id: identifierSchema,
  name: planNameSchema,
  savedAt: dateStringSchema,
  goalAmount: z.number().check(z.positive()),
  currentAmount: nonnegativeNumberSchema,
  monthlyContribution: z.number(),
  annualRate: annualRateSchema,
  arrivalDate: z.nullable(dateStringSchema),
  checkins: checkinList(legacyCheckinSchema),
});

const versionTwoSavedPlanSchema = z.object({
  schemaVersion: z.literal(2),
  id: identifierSchema,
  name: planNameSchema,
  savedAt: dateStringSchema,
  goalAmount: z.number().check(z.positive()),
  currentAmount: nonnegativeNumberSchema,
  monthlyContribution: z.number(),
  annualRate: annualRateSchema,
  targetDate: monthValueSchema,
  arrivalDate: z.nullable(dateStringSchema),
  checkins: checkinList(legacyCheckinSchema),
});

const versionThreeSavedPlanSchema = z.object({
  schemaVersion: z.literal(3),
  id: identifierSchema,
  name: planNameSchema,
  savedAt: dateStringSchema,
  goalAmount: z.number().check(z.positive()),
  currentAmount: nonnegativeNumberSchema,
  monthlyContribution: z.number(),
  annualRate: annualRateSchema,
  targetDate: monthValueSchema,
  arrivalDate: z.nullable(dateStringSchema),
  projectedAtTarget: z.nullable(z.number()),
  shortage: z.nullable(nonnegativeNumberSchema),
  actionPlan: z.nullable(versionThreeActionPlanSnapshotSchema),
  completedActionSteps: completedActionStepsSchema,
  feasibilityLimits: z.nullable(feasibilityLimitsSchema),
  checkins: checkinList(versionFiveCheckinSchema),
});

const versionFourSavedPlanSchema = z.object({
  schemaVersion: z.literal(4),
  id: identifierSchema,
  name: planNameSchema,
  savedAt: dateStringSchema,
  goalAmount: z.number().check(z.positive()),
  currentAmount: nonnegativeNumberSchema,
  monthlyContribution: z.number(),
  annualRate: annualRateSchema,
  targetDate: monthValueSchema,
  arrivalDate: z.nullable(dateStringSchema),
  projectedAtTarget: z.nullable(z.number()),
  shortage: z.nullable(nonnegativeNumberSchema),
  actionPlan: z.nullable(versionFourActionPlanSnapshotSchema),
  completedActionSteps: completedActionStepsSchema,
  feasibilityLimits: z.nullable(feasibilityLimitsSchema),
  checkins: checkinList(versionFiveCheckinSchema),
});

const versionFiveSavedPlanSchema = z.object({
  schemaVersion: z.literal(5),
  id: identifierSchema,
  name: planNameSchema,
  savedAt: dateStringSchema,
  goalAmount: z.number().check(z.positive()),
  currentAmount: nonnegativeNumberSchema,
  monthlyContribution: z.number(),
  annualRate: annualRateSchema,
  targetDate: monthValueSchema,
  arrivalDate: z.nullable(dateStringSchema),
  projectedAtTarget: z.nullable(z.number()),
  shortage: z.nullable(nonnegativeNumberSchema),
  actionPlan: z.nullable(actionPlanSnapshotSchema),
  completedActionSteps: completedActionStepsSchema,
  feasibilityLimits: z.nullable(feasibilityLimitsSchema),
  checkins: checkinList(versionFiveCheckinSchema),
});

const versionSixSavedPlanSchema = z.extend(versionFiveSavedPlanSchema, {
  schemaVersion: z.literal(6),
  checkins: checkinList(versionSixCheckinSchema),
});

const savedPlanSchema = z.extend(versionFiveSavedPlanSchema, {
  schemaVersion: z.literal(SCHEMA_VERSION),
  checkins: checkinList(checkinSchema),
});

export type SavedPlan = z.infer<typeof savedPlanSchema>;
export type MonthlyCheckinReason = z.infer<typeof monthlyCheckinReasonSchema>;

function periodFromDate(date: string) {
  return /^\d{4}-\d{2}/.exec(date)?.[0] ?? "1970-01";
}

function migrateLegacyCheckins(checkins: z.infer<typeof legacyCheckinSchema>[]) {
  return checkins.map((checkin) => ({
    date: checkin.date,
    currentAmount: checkin.currentAmount,
    projectedAtTarget: null,
    shortage: null,
    shortageDifference: null,
    completedActionSteps: [],
    memo: checkin.memo,
    period: periodFromDate(checkin.date),
    plannedContribution: null,
    actualContribution: null,
    reason: null,
    monthlyIncome: null,
    monthlyExpenses: null,
  }));
}

function migrateVersionFiveCheckins(checkins: z.infer<typeof versionFiveCheckinSchema>[]) {
  return checkins.map((checkin) => ({
    ...checkin,
    period: periodFromDate(checkin.date),
    plannedContribution: null,
    actualContribution: null,
    reason: null,
    monthlyIncome: null,
    monthlyExpenses: null,
  }));
}

function migrateVersionSixCheckins(checkins: z.infer<typeof versionSixCheckinSchema>[]) {
  return checkins.map((checkin) => ({
    ...checkin,
    monthlyIncome: null,
    monthlyExpenses: null,
  }));
}

function upgradeVersionTwo(plan: z.infer<typeof versionTwoSavedPlanSchema>): SavedPlan {
  return savedPlanSchema.parse({
    ...plan,
    schemaVersion: SCHEMA_VERSION,
    projectedAtTarget: null,
    shortage: null,
    actionPlan: null,
    completedActionSteps: [],
    feasibilityLimits: null,
    checkins: migrateLegacyCheckins(plan.checkins),
  });
}

function upgradeVersionThree(plan: z.infer<typeof versionThreeSavedPlanSchema>): SavedPlan {
  const removedActionPlan = plan.actionPlan?.id === "balanced" || plan.actionPlan?.id === "upfront";
  const retainedActionPlan = plan.actionPlan && !removedActionPlan
    ? {
        ...plan.actionPlan,
        adjustedTargetDate: plan.targetDate,
      }
    : null;

  return savedPlanSchema.parse({
    ...plan,
    schemaVersion: SCHEMA_VERSION,
    actionPlan: retainedActionPlan,
    completedActionSteps: removedActionPlan ? [] : plan.completedActionSteps,
    checkins: migrateVersionFiveCheckins(plan.checkins),
  });
}

function upgradeVersionFour(plan: z.infer<typeof versionFourSavedPlanSchema>): SavedPlan {
  const removedUpfrontPlan = plan.actionPlan?.id === "upfront";
  return savedPlanSchema.parse({
    ...plan,
    schemaVersion: SCHEMA_VERSION,
    actionPlan: removedUpfrontPlan ? null : plan.actionPlan,
    completedActionSteps: removedUpfrontPlan ? [] : plan.completedActionSteps,
    checkins: migrateVersionFiveCheckins(plan.checkins),
  });
}

function upgradeVersionFive(plan: z.infer<typeof versionFiveSavedPlanSchema>): SavedPlan {
  return savedPlanSchema.parse({
    ...plan,
    schemaVersion: SCHEMA_VERSION,
    checkins: migrateVersionFiveCheckins(plan.checkins),
  });
}

function upgradeVersionSix(plan: z.infer<typeof versionSixSavedPlanSchema>): SavedPlan {
  return savedPlanSchema.parse({
    ...plan,
    schemaVersion: SCHEMA_VERSION,
    checkins: migrateVersionSixCheckins(plan.checkins),
  });
}

function migrateSavedPlan(value: unknown): SavedPlan {
  const current = savedPlanSchema.safeParse(value);
  if (current.success) return current.data;

  const versionSix = versionSixSavedPlanSchema.safeParse(value);
  if (versionSix.success) return upgradeVersionSix(versionSix.data);

  const versionFive = versionFiveSavedPlanSchema.safeParse(value);
  if (versionFive.success) return upgradeVersionFive(versionFive.data);

  const versionFour = versionFourSavedPlanSchema.safeParse(value);
  if (versionFour.success) return upgradeVersionFour(versionFour.data);

  const versionThree = versionThreeSavedPlanSchema.safeParse(value);
  if (versionThree.success) return upgradeVersionThree(versionThree.data);

  const versionTwo = versionTwoSavedPlanSchema.safeParse(value);
  if (versionTwo.success) return upgradeVersionTwo(versionTwo.data);

  const legacy = legacySavedPlanSchema.parse(value);
  const legacyTarget = legacy.arrivalDate
    ? new Date(legacy.arrivalDate)
    : new Date(
        new Date(legacy.savedAt).getFullYear() + 5,
        new Date(legacy.savedAt).getMonth(),
        1,
      );
  const targetDate = `${legacyTarget.getFullYear()}-${String(legacyTarget.getMonth() + 1).padStart(2, "0")}`;

  return upgradeVersionTwo({
    ...legacy,
    schemaVersion: 2,
    targetDate,
  });
}

export function loadSavedPlan(): SavedPlan | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  if (raw.length > MAX_BACKUP_FILE_BYTES) return null;
  try {
    const parsed = JSON.parse(raw) as { schemaVersion?: number };
    const plan = migrateSavedPlan(parsed);
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    }
    return plan;
  } catch {
    return null;
  }
}

export function savePlan(plan: SavedPlan): SavedPlan {
  const parsed = savedPlanSchema.parse(plan);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  return parsed;
}

export function deleteSavedPlan(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}

export function exportBackup(plan: SavedPlan): string {
  return JSON.stringify(savedPlanSchema.parse(plan), null, 2);
}

export function importBackup(raw: string): SavedPlan {
  if (raw.length > MAX_BACKUP_FILE_BYTES) {
    throw new Error("Backup file is too large");
  }
  return migrateSavedPlan(JSON.parse(raw));
}
