import { z } from "zod";

export const STORAGE_KEY = "invetk-money-gps";
export const SCHEMA_VERSION = 5;

const goalActionPlanIdSchema = z.enum(["monthly", "balanced", "timeline"]);
const versionFourGoalActionPlanIdSchema = z.enum(["monthly", "upfront", "timeline"]);
const versionThreeGoalActionPlanIdSchema = z.enum(["monthly", "upfront", "balanced"]);

const legacyCheckinSchema = z.object({
  date: z.string(),
  currentAmount: z.number().nonnegative(),
  arrivalDate: z.string().nullable(),
  differenceMonths: z.number().nullable(),
  memo: z.string().max(300),
});

const checkinSchema = z.object({
  date: z.string(),
  currentAmount: z.number().nonnegative(),
  projectedAtTarget: z.number().nullable(),
  shortage: z.number().nonnegative().nullable(),
  shortageDifference: z.number().nullable(),
  completedActionSteps: z.array(z.number().int().min(0).max(2)),
  memo: z.string().max(300),
});

const actionPlanSnapshotSchema = z.object({
  id: goalActionPlanIdSchema,
  title: z.string().min(1).max(60),
  monthlyContribution: z.number(),
  upfrontAmount: z.number().nonnegative(),
  adjustedTargetDate: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
});

const versionFourActionPlanSnapshotSchema = z.object({
  id: versionFourGoalActionPlanIdSchema,
  title: z.string().min(1).max(60),
  monthlyContribution: z.number(),
  upfrontAmount: z.number().nonnegative(),
  adjustedTargetDate: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
});

const versionThreeActionPlanSnapshotSchema = z.object({
  id: versionThreeGoalActionPlanIdSchema,
  title: z.string().min(1).max(60),
  monthlyContribution: z.number(),
  upfrontAmount: z.number().nonnegative(),
});

const feasibilityLimitsSchema = z.object({
  maxMonthlyIncrease: z.number().nonnegative(),
  maxUpfrontAmount: z.number().nonnegative(),
});

const legacySavedPlanSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  name: z.string().min(1).max(60),
  savedAt: z.string(),
  goalAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  monthlyContribution: z.number(),
  annualRate: z.number().min(-20).max(30),
  arrivalDate: z.string().nullable(),
  checkins: z.array(legacyCheckinSchema),
});

const versionTwoSavedPlanSchema = z.object({
  schemaVersion: z.literal(2),
  id: z.string(),
  name: z.string().min(1).max(60),
  savedAt: z.string(),
  goalAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  monthlyContribution: z.number(),
  annualRate: z.number().min(-20).max(30),
  targetDate: z.string().regex(/^\d{4}-\d{2}$/),
  arrivalDate: z.string().nullable(),
  checkins: z.array(legacyCheckinSchema),
});

const versionThreeSavedPlanSchema = z.object({
  schemaVersion: z.literal(3),
  id: z.string(),
  name: z.string().min(1).max(60),
  savedAt: z.string(),
  goalAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  monthlyContribution: z.number(),
  annualRate: z.number().min(-20).max(30),
  targetDate: z.string().regex(/^\d{4}-\d{2}$/),
  arrivalDate: z.string().nullable(),
  projectedAtTarget: z.number().nullable(),
  shortage: z.number().nonnegative().nullable(),
  actionPlan: versionThreeActionPlanSnapshotSchema.nullable(),
  completedActionSteps: z.array(z.number().int().min(0).max(2)),
  feasibilityLimits: feasibilityLimitsSchema.nullable(),
  checkins: z.array(checkinSchema),
});

const versionFourSavedPlanSchema = z.object({
  schemaVersion: z.literal(4),
  id: z.string(),
  name: z.string().min(1).max(60),
  savedAt: z.string(),
  goalAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  monthlyContribution: z.number(),
  annualRate: z.number().min(-20).max(30),
  targetDate: z.string().regex(/^\d{4}-\d{2}$/),
  arrivalDate: z.string().nullable(),
  projectedAtTarget: z.number().nullable(),
  shortage: z.number().nonnegative().nullable(),
  actionPlan: versionFourActionPlanSnapshotSchema.nullable(),
  completedActionSteps: z.array(z.number().int().min(0).max(2)),
  feasibilityLimits: feasibilityLimitsSchema.nullable(),
  checkins: z.array(checkinSchema),
});

const savedPlanSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: z.string(),
  name: z.string().min(1).max(60),
  savedAt: z.string(),
  goalAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  monthlyContribution: z.number(),
  annualRate: z.number().min(-20).max(30),
  targetDate: z.string().regex(/^\d{4}-\d{2}$/),
  arrivalDate: z.string().nullable(),
  projectedAtTarget: z.number().nullable(),
  shortage: z.number().nonnegative().nullable(),
  actionPlan: actionPlanSnapshotSchema.nullable(),
  completedActionSteps: z.array(z.number().int().min(0).max(2)),
  feasibilityLimits: feasibilityLimitsSchema.nullable(),
  checkins: z.array(checkinSchema),
});

export type SavedPlan = z.infer<typeof savedPlanSchema>;

function migrateLegacyCheckins(checkins: z.infer<typeof legacyCheckinSchema>[]) {
  return checkins.map((checkin) => ({
    date: checkin.date,
    currentAmount: checkin.currentAmount,
    projectedAtTarget: null,
    shortage: null,
    shortageDifference: null,
    completedActionSteps: [],
    memo: checkin.memo,
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
  });
}

function upgradeVersionFour(plan: z.infer<typeof versionFourSavedPlanSchema>): SavedPlan {
  const removedUpfrontPlan = plan.actionPlan?.id === "upfront";
  return savedPlanSchema.parse({
    ...plan,
    schemaVersion: SCHEMA_VERSION,
    actionPlan: removedUpfrontPlan ? null : plan.actionPlan,
    completedActionSteps: removedUpfrontPlan ? [] : plan.completedActionSteps,
  });
}

function migrateSavedPlan(value: unknown): SavedPlan {
  const current = savedPlanSchema.safeParse(value);
  if (current.success) return current.data;

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
  return migrateSavedPlan(JSON.parse(raw));
}
