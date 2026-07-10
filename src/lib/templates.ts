// ============================================================
// Plan templates — one per goal. Pure data: the resolver
// (plan-engine.ts) fills these with exercises from the library.
// Numbers follow docs/programming-principles.md (ACSM/NSCA,
// Schoenfeld volume & rest evidence, WHO age guidance).
// ============================================================
import type { Environment, Experience, Gender, Goal, MovementPattern } from "./types";

export type DayKind =
  | "full"
  | "upper"
  | "lower"
  | "push"
  | "pull"
  | "legs"
  | "skill"
  | "conditioning"
  | "mobility";

export interface GoalTemplate {
  goal: Goal;
  label: string;
  blurb: string;
  /** rep window for compound slots */
  reps: [number, number];
  /** rep window for isolation/core slots */
  isoReps: [number, number];
  restMainS: number;
  restIsoS: number;
  /** working sets per compound exercise, by experience */
  setsMain: Record<Experience, number>;
  setsIso: Record<Experience, number>;
  deloadWeeks: number;
  progressionNote: string;
  cardioNote: string;
  nutrition: { stance: "deficit" | "maintenance" | "surplus"; note: string };
  /** override the standard split for specific day counts */
  splitOverride?: Partial<Record<2 | 3 | 4 | 5 | 6, DayKind[]>>;
}

/** default weekly split by training days */
export const STANDARD_SPLITS: Record<2 | 3 | 4 | 5 | 6, DayKind[]> = {
  2: ["full", "full"],
  3: ["full", "full", "full"],
  4: ["upper", "lower", "upper", "lower"],
  5: ["push", "pull", "legs", "upper", "lower"],
  6: ["push", "pull", "legs", "push", "pull", "legs"],
};

/** ordered slot lists per day kind — the resolver takes the first N for the session length */
export const DAY_SLOTS: Record<DayKind, MovementPattern[]> = {
  full: ["squat", "h-push", "h-pull", "hinge", "v-pull", "core", "iso-side-delt", "iso-calves"],
  upper: ["h-push", "v-pull", "v-push", "h-pull", "iso-side-delt", "iso-biceps", "iso-triceps", "iso-rear-delt"],
  lower: ["squat", "hinge", "lunge", "iso-hams", "iso-calves", "core", "iso-glutes", "iso-quads"],
  push: ["h-push", "v-push", "h-push", "iso-side-delt", "iso-triceps", "iso-chest", "iso-triceps"],
  pull: ["v-pull", "h-pull", "h-pull", "iso-rear-delt", "iso-biceps", "iso-biceps", "iso-rear-delt"],
  legs: ["squat", "hinge", "lunge", "iso-quads", "iso-hams", "iso-calves", "core"],
  skill: ["v-push", "v-pull", "h-push", "h-pull", "core", "balance", "iso-triceps", "iso-biceps"],
  conditioning: ["cardio", "squat", "h-push", "h-pull", "core", "cardio", "lunge"],
  mobility: ["mobility", "mobility", "balance", "core", "mobility", "mobility", "balance"],
};

export const DAY_NAMES: Record<DayKind, string> = {
  full: "Full Body",
  upper: "Upper Body",
  lower: "Lower Body",
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  skill: "Skill + Strength",
  conditioning: "Conditioning",
  mobility: "Mobility & Flow",
};

/** exercises per session by length */
export const SLOTS_BY_SESSION: Record<30 | 60 | 90, number> = { 30: 4, 60: 6, 90: 7 };

/** which weekdays train, by days per week (1 = Monday) */
export const TRAINING_WEEKDAYS: Record<2 | 3 | 4 | 5 | 6, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
};

/** equipment reachable in each training environment */
export const ENV_EQUIPMENT: Record<Environment, string[]> = {
  gym: ["Barbell", "Dumbbell", "Cable", "Machine", "Bodyweight", "Smith", "Band", "Kettlebell", "Pull-up Bar"],
  "home-gym": ["Dumbbell", "Band", "Bodyweight"],
  "home-minimal": ["Band", "Pull-up Bar", "Bodyweight"],
  bodyweight: ["Bodyweight"],
};

export const TEMPLATES: Record<Goal, GoalTemplate> = {
  "fat-loss": {
    goal: "fat-loss",
    label: "Fat Loss",
    blurb: "Lift to keep muscle, circuits and cardio to burn — diet does the cutting.",
    reps: [10, 15],
    isoReps: [12, 20],
    restMainS: 60,
    restIsoS: 45,
    setsMain: { beginner: 2, intermediate: 3, advanced: 3 },
    setsIso: { beginner: 2, intermediate: 3, advanced: 3 },
    deloadWeeks: 6,
    progressionNote: "Add reps within the range, then add load. Keep rest short and honest.",
    cardioNote: "2–4× LISS (30–40 min brisk walk/cycle) or 1–2× HIIT weekly. Walk daily.",
    nutrition: { stance: "deficit", note: "Eat ~300–500 kcal below maintenance, protein high to keep muscle." },
    splitOverride: {
      3: ["full", "full", "conditioning"],
      4: ["full", "conditioning", "full", "conditioning"],
      5: ["full", "conditioning", "full", "conditioning", "full"],
      6: ["full", "conditioning", "full", "conditioning", "full", "conditioning"],
    },
  },
  strength: {
    goal: "strength",
    label: "Strength",
    blurb: "Heavy compounds, long rests, powerlifting-style progression.",
    reps: [3, 6],
    isoReps: [6, 10],
    restMainS: 180,
    restIsoS: 120,
    setsMain: { beginner: 3, intermediate: 4, advanced: 5 },
    setsIso: { beginner: 2, intermediate: 3, advanced: 3 },
    deloadWeeks: 5,
    progressionNote: "Add weight every session while bar speed holds (5×5 style); stall twice → deload 10%.",
    cardioNote: "Minimal — 1–2 easy walks or bike rides, kept away from leg days.",
    nutrition: { stance: "maintenance", note: "Eat at maintenance or a small surplus; strength needs fuel." },
  },
  bodybuilding: {
    goal: "bodybuilding",
    label: "Bodybuilding",
    blurb: "Maximum muscle: volume, tension, and the pump — every muscle, every week.",
    reps: [6, 12],
    isoReps: [10, 15],
    restMainS: 120,
    restIsoS: 75,
    setsMain: { beginner: 3, intermediate: 3, advanced: 4 },
    setsIso: { beginner: 2, intermediate: 3, advanced: 4 },
    deloadWeeks: 6,
    progressionNote: "Double progression: hit the top of the rep range on all sets → add load.",
    cardioNote: "Optional 1–2× LISS for heart health — never at the cost of recovery.",
    nutrition: { stance: "surplus", note: "Lean surplus of ~200–300 kcal; ~1.6–2.2 g protein per kg." },
  },
  "lean-aesthetic": {
    goal: "lean-aesthetic",
    label: "Lean Aesthetic",
    blurb: "The classic V-taper: delts, upper chest, lats and a tight waist.",
    reps: [6, 10],
    isoReps: [12, 15],
    restMainS: 120,
    restIsoS: 60,
    setsMain: { beginner: 3, intermediate: 3, advanced: 4 },
    setsIso: { beginner: 2, intermediate: 3, advanced: 4 },
    deloadWeeks: 8,
    progressionNote: "Double progression on everything; isolations chase the pump, compounds chase load.",
    cardioNote: "8k+ daily steps; optional 1–2× LISS. Abs are made by the deficit, not the treadmill.",
    nutrition: { stance: "maintenance", note: "Recomp at maintenance: high protein, whole foods, patience." },
  },
  calisthenics: {
    goal: "calisthenics",
    label: "Calisthenics",
    blurb: "Own your bodyweight: progress toward pull-ups, dips, pistols and handstands.",
    reps: [5, 8],
    isoReps: [8, 15],
    restMainS: 150,
    restIsoS: 90,
    setsMain: { beginner: 3, intermediate: 3, advanced: 4 },
    setsIso: { beginner: 2, intermediate: 3, advanced: 3 },
    deloadWeeks: 6,
    progressionNote: "Hit the top of the range with clean form → move to the harder variation.",
    cardioNote: "Easy-pace only — skill quality beats fatigue.",
    nutrition: { stance: "maintenance", note: "Stay lean: relative strength is the whole game." },
    splitOverride: {
      2: ["skill", "skill"],
      3: ["skill", "skill", "skill"],
      4: ["skill", "legs", "skill", "legs"],
      5: ["skill", "legs", "skill", "legs", "skill"],
      6: ["skill", "legs", "skill", "legs", "skill", "mobility"],
    },
  },
  "general-fitness": {
    goal: "general-fitness",
    label: "General Fitness",
    blurb: "Strong, mobile, healthy — the WHO-recommended dose, made concrete.",
    reps: [8, 12],
    isoReps: [10, 15],
    restMainS: 90,
    restIsoS: 60,
    setsMain: { beginner: 2, intermediate: 3, advanced: 3 },
    setsIso: { beginner: 2, intermediate: 2, advanced: 3 },
    deloadWeeks: 8,
    progressionNote: "Add a rep or a little load most weeks — consistency beats intensity.",
    cardioNote: "Hit 150 min of moderate cardio weekly (walks count) on top of the lifting.",
    nutrition: { stance: "maintenance", note: "Balanced plate, protein at every meal, mostly whole foods." },
    splitOverride: {
      3: ["full", "conditioning", "full"],
      4: ["full", "conditioning", "full", "conditioning"],
      5: ["full", "conditioning", "full", "conditioning", "full"],
      6: ["full", "conditioning", "full", "conditioning", "full", "mobility"],
    },
  },
  endurance: {
    goal: "endurance",
    label: "Endurance",
    blurb: "Build the engine: conditioning first, lifting to stay durable.",
    reps: [12, 20],
    isoReps: [15, 20],
    restMainS: 45,
    restIsoS: 45,
    setsMain: { beginner: 2, intermediate: 3, advanced: 3 },
    setsIso: { beginner: 2, intermediate: 2, advanced: 3 },
    deloadWeeks: 6,
    progressionNote: "Progress cardio duration ~10% per week; lifting stays light and crisp.",
    cardioNote: "The cardio IS the plan — ramp gradually, one long session weekly.",
    nutrition: { stance: "maintenance", note: "Fuel the work: carbs around sessions, protein steady." },
    splitOverride: {
      2: ["conditioning", "full"],
      3: ["conditioning", "full", "conditioning"],
      4: ["conditioning", "full", "conditioning", "full"],
      5: ["conditioning", "full", "conditioning", "full", "conditioning"],
      6: ["conditioning", "full", "conditioning", "full", "conditioning", "mobility"],
    },
  },
  recomp: {
    goal: "recomp",
    label: "Toning & Recomp",
    blurb: "Trade fat for muscle at the same body weight — lift hard, eat exact.",
    reps: [8, 12],
    isoReps: [12, 15],
    restMainS: 90,
    restIsoS: 60,
    setsMain: { beginner: 3, intermediate: 3, advanced: 4 },
    setsIso: { beginner: 2, intermediate: 3, advanced: 3 },
    deloadWeeks: 6,
    progressionNote: "Double progression; the scale won't move much — the mirror and the tape will.",
    cardioNote: "2–3× LISS (30 min) plus 8k daily steps.",
    nutrition: { stance: "maintenance", note: "Maintenance calories, protein ~2 g/kg — recomp is won in the kitchen." },
  },
  mobility: {
    goal: "mobility",
    label: "Mobility & Flexibility",
    blurb: "Move better everywhere: hips, spine, shoulders, ankles — plus balance.",
    reps: [30, 45],
    isoReps: [30, 45],
    restMainS: 30,
    restIsoS: 30,
    setsMain: { beginner: 2, intermediate: 2, advanced: 3 },
    setsIso: { beginner: 2, intermediate: 2, advanced: 3 },
    deloadWeeks: 8,
    progressionNote: "Reps are SECONDS held. Deepen the position before adding time.",
    cardioNote: "Daily walks — mobility work pairs with movement, not rest.",
    nutrition: { stance: "maintenance", note: "No special demands — hydrate and eat enough protein to recover." },
    splitOverride: {
      2: ["mobility", "mobility"],
      3: ["mobility", "mobility", "mobility"],
      4: ["mobility", "mobility", "mobility", "mobility"],
      5: ["mobility", "mobility", "mobility", "mobility", "mobility"],
      6: ["mobility", "mobility", "mobility", "mobility", "mobility", "mobility"],
    },
  },
  starter: {
    goal: "starter",
    label: "Get Started",
    blurb: "Never trained? This is the on-ramp: simple, short, impossible to fail.",
    reps: [8, 12],
    isoReps: [10, 15],
    restMainS: 90,
    restIsoS: 60,
    setsMain: { beginner: 2, intermediate: 3, advanced: 3 },
    setsIso: { beginner: 2, intermediate: 2, advanced: 2 },
    deloadWeeks: 8,
    progressionNote: "Show up, do the sets, add a rep when it feels easy. That's the whole secret.",
    cardioNote: "A 10-minute walk after each session. Nothing fancy.",
    nutrition: { stance: "maintenance", note: "Don't diet yet — just add protein and drop liquid calories." },
    splitOverride: {
      3: ["full", "full", "full"],
      4: ["full", "conditioning", "full", "conditioning"],
      5: ["full", "conditioning", "full", "conditioning", "full"],
      6: ["full", "conditioning", "full", "conditioning", "full", "mobility"],
    },
  },
};

/** wizard display order — recommended default first for new users */
export const GOAL_ORDER: Goal[] = [
  "starter",
  "fat-loss",
  "lean-aesthetic",
  "bodybuilding",
  "strength",
  "recomp",
  "calisthenics",
  "general-fitness",
  "endurance",
  "mobility",
];

/**
 * Gender tunes ORDER and suggestion badges only — every goal stays
 * available to everyone, and the programming behind each goal is
 * identical (see docs/programming-principles.md §8).
 */
export function goalOrderFor(gender: Gender): Goal[] {
  if (gender === "male")
    return ["starter", "lean-aesthetic", "bodybuilding", "strength", "fat-loss", "recomp", "calisthenics", "general-fitness", "endurance", "mobility"];
  if (gender === "female")
    return ["starter", "recomp", "fat-loss", "general-fitness", "bodybuilding", "lean-aesthetic", "strength", "calisthenics", "endurance", "mobility"];
  return GOAL_ORDER;
}

/** a concrete first milestone per goal — the wizard writes this into the profile */
export function milestoneFor(goal: Goal, environment: Environment): string {
  if (goal === "strength" && (environment === "bodyweight" || environment === "home-minimal"))
    return "10 strict push-ups → archer push-up";
  const map: Record<Goal, string> = {
    starter: "Complete your first 10 workouts",
    "fat-loss": "Waist −4 cm",
    strength: "Bench Press 60 kg × 8",
    bodybuilding: "Add 2 kg at the same waist size",
    "lean-aesthetic": "Bench Press 60 kg × 8",
    calisthenics: "First strict pull-up",
    "general-fitness": "8 weeks without missing a session",
    endurance: "30 minutes nonstop cardio",
    recomp: "Same weight, −3% body fat",
    mobility: "Full-depth squat, heels down",
  };
  return map[goal];
}

export function goalBadgesFor(gender: Gender): Partial<Record<Goal, string>> {
  if (gender === "male") return { starter: "Recommended", "lean-aesthetic": "Popular", bodybuilding: "Popular" };
  if (gender === "female") return { starter: "Recommended", recomp: "Popular", "fat-loss": "Popular" };
  return { starter: "Recommended" };
}
