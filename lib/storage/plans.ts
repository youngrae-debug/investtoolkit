import { z } from "zod";

export const STORAGE_KEY = "invetk-money-gps";
export const SCHEMA_VERSION = 1;

const checkinSchema = z.object({
  date: z.string(),
  currentAmount: z.number().nonnegative(),
  arrivalDate: z.string().nullable(),
  differenceMonths: z.number().nullable(),
  memo: z.string().max(300),
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
  arrivalDate: z.string().nullable(),
  checkins: z.array(checkinSchema),
});

export type SavedPlan = z.infer<typeof savedPlanSchema>;

export function loadSavedPlan(): SavedPlan | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return savedPlanSchema.parse(JSON.parse(raw));
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
  return savedPlanSchema.parse(JSON.parse(raw));
}

