// ============================================================
// Project Aesthetic — data models
// Everything is plain-JSON serializable so the store can swap
// localStorage → cloud DB later without touching the UI.
// ============================================================

export type MuscleGroup =
  | "Upper Chest"
  | "Mid Chest"
  | "Side Delts"
  | "Front Delts"
  | "Rear Delts"
  | "Lats"
  | "Upper Back"
  | "Traps"
  | "Biceps"
  | "Triceps"
  | "Forearms"
  | "Quads"
  | "Hamstrings"
  | "Glutes"
  | "Calves"
  | "Abs"
  | "Lower Back";

export interface Exercise {
  id: string;
  name: string;
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  equipment: "Barbell" | "Dumbbell" | "Cable" | "Machine" | "Bodyweight" | "Smith";
  /** YouTube search URL — swap for real embeds later */
  videoUrl: string;
  cues: string[];
  mistakes: string[];
  alternatives: string[];
  progression: string;
  /** weight step used by the overload engine (2.5 kg barbell, 2 kg DBs…) */
  incrementKg: number;
  isBodyweight?: boolean;
  /** bodyweight / household substitute hitting the same primary muscle — for no-gym days */
  home?: {
    name: string;
    /** suggested scheme, e.g. "3×8–15" */
    reps: string;
    /** setup + how to bias the target muscle + how to progress */
    how: string;
  };
  /**
   * Optional demo images (e.g. mannequin renders) served from /public.
   * Drop files in public/exercises/<id>/ and list them here — they show
   * automatically in the workout card and library.
   */
  images?: { src: string; caption: string; kind?: "target" | "right" | "wrong" }[];
}

export interface PlannedExercise {
  exerciseId: string;
  warmupSets: number;
  workingSets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  notes?: string;
}

export interface WorkoutDay {
  id: string;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  name: string;
  focus: string;
  durationMin: number;
  warmupMin: number;
  isRest?: boolean;
  exercises: PlannedExercise[];
}

export interface SetLog {
  weight: number;
  reps: number;
  done: boolean;
  /** ISO timestamp of when the set was ticked — powers time analytics */
  at?: string;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}

export interface WorkoutSession {
  id: string;
  /** yyyy-mm-dd */
  date: string;
  dayId: string;
  /** check-in — set explicitly or on the first ticked set */
  startedAt?: string;
  /** check-out */
  completedAt?: string;
  logs: ExerciseLog[];
}

export interface Measurement {
  date: string;
  weightKg?: number;
  bodyFatPct?: number;
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  shouldersCm?: number;
  thighCm?: number;
  calfCm?: number;
}

export interface Profile {
  name: string;
  heightCm: number;
  birthYear: number;
  phase: string;
  targetWeightKg: number;
  targetBodyFatPct: number;
  proteinGoalG: number;
  waterGoalMl: number;
  stepsGoal: number;
  sleepGoalH: number;
  nextMilestone: string;
}

export interface FoodEntry {
  date: string;
  foodId: string;
  servings: number;
}

export interface RecoveryEntry {
  date: string;
  sleepH?: number;
  waterMl?: number;
  steps?: number;
  stretched?: boolean;
}

export interface JournalEntry {
  date: string;
  energy: number; // 1–5
  sleepH: number;
  mood: string; // emoji
  notes: string;
}

export interface PhotoSet {
  /** yyyy-mm */
  month: string;
  /** framed thumbnails (data URLs) — full images live only on the user's device */
  front?: string;
  side?: string;
  back?: string;
  /** metadata baked into the generated frames */
  weightKg?: number;
  capturedAt?: string;
}

export interface RoadmapGoal {
  id: string;
  /** yyyy-mm */
  month: string;
  label: string;
  done: boolean;
}

export interface AchievementDef {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

export interface AppState {
  version: number;
  /** stamped on every change — drives last-write-wins sync */
  modifiedAt?: string;
  /** first-run wizard completed (or skipped) */
  onboarded?: boolean;
  profile: Profile;
  plan: WorkoutDay[];
  sessions: WorkoutSession[];
  measurements: Measurement[];
  foodLog: FoodEntry[];
  recovery: RecoveryEntry[];
  journal: JournalEntry[];
  photos: PhotoSet[];
  roadmap: RoadmapGoal[];
  /** achievementId → ISO date unlocked */
  unlocked: Record<string, string>;
}
