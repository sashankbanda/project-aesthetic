// ============================================================
// Zod schemas — single source of validation.
// SyncStateSchema guards the sync API (server boundary);
// BackupSchema guards Restore-from-file (client boundary).
// ============================================================
import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected yyyy-mm-dd");
const monthStr = z.string().regex(/^\d{4}-\d{2}$/, "expected yyyy-mm");

export const ProfileSchema = z.object({
  name: z.string().min(1).max(60),
  heightCm: z.number().positive().max(300),
  birthYear: z.number().int().min(1900).max(2100),
  phase: z.string().max(80),
  targetWeightKg: z.number().positive().max(500),
  targetBodyFatPct: z.number().min(1).max(80),
  proteinGoalG: z.number().positive().max(1000),
  waterGoalMl: z.number().int().positive().max(20000),
  stepsGoal: z.number().int().positive().max(200000),
  sleepGoalH: z.number().positive().max(24),
  nextMilestone: z.string().max(200),
});

export const SetLogSchema = z.object({
  weight: z.number().min(0).max(2000),
  reps: z.number().int().min(0).max(1000),
  done: z.boolean(),
  at: z.string().optional(),
});

export const ExerciseLogSchema = z.object({
  exerciseId: z.string().max(80),
  sets: z.array(SetLogSchema).max(30),
});

export const WorkoutSessionSchema = z.object({
  id: z.string().max(120),
  date: dateStr,
  dayId: z.string().max(80),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  logs: z.array(ExerciseLogSchema).max(50),
});

export const MeasurementSchema = z.object({
  date: dateStr,
  weightKg: z.number().positive().max(500).optional(),
  bodyFatPct: z.number().min(1).max(80).optional(),
  waistCm: z.number().positive().max(300).optional(),
  chestCm: z.number().positive().max(300).optional(),
  armsCm: z.number().positive().max(150).optional(),
  shouldersCm: z.number().positive().max(300).optional(),
  thighCm: z.number().positive().max(200).optional(),
  calfCm: z.number().positive().max(150).optional(),
});

export const FoodEntrySchema = z.object({
  date: dateStr,
  foodId: z.string().max(80),
  servings: z.number().positive().max(100),
});

export const RecoveryEntrySchema = z.object({
  date: dateStr,
  sleepH: z.number().min(0).max(24).optional(),
  waterMl: z.number().int().min(0).max(30000).optional(),
  steps: z.number().int().min(0).max(300000).optional(),
  stretched: z.boolean().optional(),
});

export const JournalEntrySchema = z.object({
  date: dateStr,
  energy: z.number().int().min(0).max(5),
  sleepH: z.number().min(0).max(24),
  mood: z.string().max(16),
  notes: z.string().max(2000),
});

export const RoadmapGoalSchema = z.object({
  id: z.string().max(120),
  month: monthStr,
  label: z.string().min(1).max(300),
  done: z.boolean(),
});

/** photo METADATA only — image fields are stripped before sync */
export const PhotoMetaSchema = z.object({
  month: monthStr,
  angle: z.enum(["front", "side", "back"]),
  weightKg: z.number().positive().max(500).optional(),
  capturedAt: z.string().optional(),
});

/** the payload the client PUTs to /api/sync — no photo images, ever */
export const SyncStateSchema = z.object({
  modifiedAt: z.string(),
  profile: ProfileSchema,
  plan: z.array(z.unknown()).max(14),
  sessions: z.array(WorkoutSessionSchema).max(2000),
  measurements: z.array(MeasurementSchema).max(2000),
  foodLog: z.array(FoodEntrySchema).max(20000),
  recovery: z.array(RecoveryEntrySchema).max(2000),
  journal: z.array(JournalEntrySchema).max(2000),
  roadmap: z.array(RoadmapGoalSchema).max(500),
  photoMeta: z.array(PhotoMetaSchema).max(500),
  unlocked: z.record(z.string(), z.string()),
});

export type SyncState = z.infer<typeof SyncStateSchema>;

/** lenient shape-check for Restore-from-file (old backups stay importable) */
export const BackupSchema = z
  .object({
    version: z.number(),
    profile: z.object({ name: z.string() }).passthrough(),
    plan: z.array(z.unknown()),
    sessions: z.array(z.unknown()),
    measurements: z.array(z.unknown()),
  })
  .passthrough();
