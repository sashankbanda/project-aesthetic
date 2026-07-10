// ============================================================
// Plan engine — pure, deterministic resolver.
// TrainingProfile in → WorkoutDay[] out, in the exact shape the
// tracker/overload/analytics already consume. No I/O, no Date,
// no randomness: same profile always yields the same plan.
// ============================================================
import type {
  AgeGroup,
  Caution,
  Exercise,
  Experience,
  MovementPattern,
  PlannedExercise,
  TrainingProfile,
  WorkoutDay,
} from "./types";
import {
  DAY_NAMES,
  DAY_SLOTS,
  ENV_EQUIPMENT,
  SLOTS_BY_SESSION,
  STANDARD_SPLITS,
  TEMPLATES,
  TRAINING_WEEKDAYS,
  type DayKind,
} from "./templates";
import { DEFAULT_PLAN, EXERCISES } from "./seed";

// ---------- age & experience rules (docs/programming-principles.md) ----------

const AGE_RULES: Record<
  AgeGroup,
  { avoid: Caution[]; maxDifficulty: 1 | 2 | 3; extraWarmup: number; balanceSlot?: boolean; repsFloor?: number }
> = {
  "13-17": { avoid: [], maxDifficulty: 2, extraWarmup: 0, repsFloor: 6 },
  "18-29": { avoid: [], maxDifficulty: 3, extraWarmup: 0 },
  "30-44": { avoid: [], maxDifficulty: 3, extraWarmup: 0 },
  "45-59": { avoid: ["high-impact"], maxDifficulty: 3, extraWarmup: 3 },
  "60+": { avoid: ["high-impact", "spine"], maxDifficulty: 2, extraWarmup: 5, balanceSlot: true },
};

const EXP_CAP: Record<Experience, 1 | 2 | 3> = { beginner: 2, intermediate: 2, advanced: 3 };
const EXP_TARGET: Record<Experience, number> = { beginner: 1, intermediate: 2, advanced: 3 };

/** when a pattern has no candidates (e.g. v-pull with zero equipment), try these instead */
const PATTERN_FALLBACKS: Partial<Record<MovementPattern, MovementPattern[]>> = {
  "v-pull": ["h-pull"],
  "v-push": ["h-push"],
  "iso-chest": ["h-push"],
  "iso-side-delt": ["v-push", "h-push"],
  "iso-rear-delt": ["h-pull"],
  "iso-biceps": ["v-pull", "h-pull"],
  "iso-triceps": ["h-push"],
  "iso-quads": ["squat", "lunge"],
  "iso-hams": ["hinge"],
  "iso-glutes": ["hinge", "lunge"],
  squat: ["lunge"],
  hinge: ["squat"],
  lunge: ["squat"],
  balance: ["core"],
};

/** goal-appropriate equipment preference — loadable lifts first, unless the goal IS bodyweight mastery */
const CALISTHENIC_RANK = ["Bodyweight", "Pull-up Bar", "Band", "Dumbbell", "Kettlebell", "Cable", "Machine", "Smith", "Barbell"];
const LOADABLE_RANK = ["Barbell", "Dumbbell", "Machine", "Cable", "Pull-up Bar", "Smith", "Kettlebell", "Band", "Bodyweight"];
const equipRankFor = (goal: TrainingProfile["goal"]): string[] =>
  goal === "calisthenics" || goal === "mobility" ? CALISTHENIC_RANK : LOADABLE_RANK;

const FOCUS_PATTERNS: Record<"glutes-legs" | "chest-arms", MovementPattern[]> = {
  "glutes-legs": ["iso-glutes", "iso-hams"],
  "chest-arms": ["iso-chest", "iso-biceps"],
};
const FOCUS_DAYS: Record<"glutes-legs" | "chest-arms", DayKind[]> = {
  "glutes-legs": ["lower", "legs", "full"],
  "chest-arms": ["upper", "push", "full", "skill"],
};

const isIsoPattern = (p: MovementPattern) =>
  p.startsWith("iso-") || p === "core" || p === "balance" || p === "mobility";

// ---------- the resolver ----------

export function resolvePlan(t: TrainingProfile): WorkoutDay[] {
  // the hand-tuned original beats anything generated for its own combination
  if (t.goal === "lean-aesthetic" && t.environment === "gym" && t.daysPerWeek === 6) {
    return structuredClone(DEFAULT_PLAN);
  }

  const template = TEMPLATES[t.goal];
  const age = AGE_RULES[t.ageGroup];
  const maxDiff = Math.min(EXP_CAP[t.experience], age.maxDifficulty) as 1 | 2 | 3;
  const target = EXP_TARGET[t.experience];
  const allowedEq = ENV_EQUIPMENT[t.environment];

  const pool = EXERCISES.filter(
    (e) =>
      e.pattern &&
      allowedEq.includes(e.equipment) &&
      (e.difficulty ?? 2) <= maxDiff &&
      !e.avoidIf?.some((c) => age.avoid.includes(c)),
  );

  const split = template.splitOverride?.[t.daysPerWeek] ?? STANDARD_SPLITS[t.daysPerWeek];
  const trainingDays = TRAINING_WEEKDAYS[t.daysPerWeek];
  const slotCount = SLOTS_BY_SESSION[t.sessionMin];
  const usedWeek = new Map<string, number>(); // id → times programmed this week

  const equipRank = equipRankFor(t.goal);
  // chain floors (wall push-up, dead hang…) are on-ramps: fine for beginners,
  // deprioritized once someone can do the real movement
  const floorPenalty = (e: Exercise) =>
    t.experience !== "beginner" && e.progressTo && !e.regressTo ? 1 : 0;

  const pick = (slot: MovementPattern, usedToday: Set<string>): Exercise | null => {
    const patterns = [slot, ...(PATTERN_FALLBACKS[slot] ?? [])];
    for (const p of patterns) {
      const candidates = pool
        .filter((e) => e.pattern === p && !usedToday.has(e.id))
        .sort(
          (a, b) =>
            (usedWeek.get(a.id) ?? 0) - (usedWeek.get(b.id) ?? 0) ||
            floorPenalty(a) - floorPenalty(b) ||
            equipRank.indexOf(a.equipment) - equipRank.indexOf(b.equipment) ||
            Math.abs((a.difficulty ?? 2) - target) - Math.abs((b.difficulty ?? 2) - target) ||
            a.id.localeCompare(b.id),
        );
      if (candidates.length > 0) return candidates[0];
    }
    return null;
  };

  const kindCount = new Map<DayKind, number>();
  const days: WorkoutDay[] = split.map((kind, dayIdx) => {
    let slots = DAY_SLOTS[kind].slice(0, slotCount);

    // optional emphasis — swaps the tail of matching days, never gender-defaulted
    if (t.focus && t.focus !== "balanced" && FOCUS_DAYS[t.focus].includes(kind)) {
      const extras = FOCUS_PATTERNS[t.focus];
      slots = [...slots.slice(0, -1), extras[0]];
      if (t.sessionMin >= 60) slots.push(extras[1]);
    }
    // 60+: every session ends with balance work (WHO fall-prevention guidance)
    if (age.balanceSlot && !slots.includes("balance")) {
      slots = [...slots.slice(0, -1), "balance"];
    }

    const usedToday = new Set<string>();
    const exercises: PlannedExercise[] = [];
    slots.forEach((slot, slotIdx) => {
      const ex = pick(slot, usedToday);
      if (!ex) return; // pattern unfillable in this environment — session just gets one slot shorter
      usedToday.add(ex.id);
      usedWeek.set(ex.id, (usedWeek.get(ex.id) ?? 0) + 1);

      const iso = isIsoPattern(slot) || isIsoPattern(ex.pattern ?? slot);
      const cardio = ex.pattern === "cardio";
      const mobility = ex.pattern === "mobility";
      let [repsMin, repsMax] = cardio
        ? [10, t.sessionMin === 30 ? 12 : 20]
        : iso
          ? template.isoReps
          : template.reps;
      if (age.repsFloor && !cardio && !mobility && repsMin < age.repsFloor) {
        repsMin = age.repsFloor;
        repsMax = Math.max(repsMax, repsMin + 4);
      }

      const notes = cardio
        ? "Reps = minutes of steady work"
        : mobility
          ? "Reps = seconds per hold"
          : t.ageGroup === "13-17" && slotIdx === 0
            ? "Technique first — add load only with perfect form"
            : undefined;

      exercises.push({
        exerciseId: ex.id,
        warmupSets: cardio || mobility ? 0 : slotIdx === 0 ? 2 : slotIdx === 1 && !iso ? 1 : 0,
        workingSets: cardio ? 1 : (iso ? template.setsIso : template.setsMain)[t.experience],
        repsMin,
        repsMax,
        restSeconds: iso || cardio ? template.restIsoS : template.restMainS,
        notes,
      });
    });

    const nth = (kindCount.get(kind) ?? 0) + 1;
    kindCount.set(kind, nth);
    const repeats = split.filter((k) => k === kind).length > 1;

    return {
      id: `gen-${t.goal}-${dayIdx}`,
      weekday: trainingDays[dayIdx],
      name: repeats ? `${DAY_NAMES[kind]} ${String.fromCharCode(64 + nth)}` : DAY_NAMES[kind],
      focus: template.label + (t.focus && t.focus !== "balanced" ? ` · ${t.focus === "glutes-legs" ? "glute & leg focus" : "chest & arm focus"}` : ""),
      durationMin: t.sessionMin,
      warmupMin: (t.sessionMin === 30 ? 5 : t.sessionMin === 60 ? 8 : 10) + age.extraWarmup,
      exercises,
    };
  });

  // fill the remaining weekdays with rest so every weekday resolves
  const restDays: WorkoutDay[] = [0, 1, 2, 3, 4, 5, 6]
    .filter((w) => !trainingDays.includes(w))
    .map((w, i) => ({
      id: `gen-rest-${i}`,
      weekday: w,
      name: "Rest",
      focus: "Recovery — walk, stretch, sleep",
      durationMin: 0,
      warmupMin: 0,
      isRest: true,
      exercises: [],
    }));

  return [...days, ...restDays].sort((a, b) => a.weekday - b.weekday);
}

// ---------- companions the UI consumes ----------

/** safety notes to surface in the preview and on the plan — data, not medical advice */
export function disclaimersFor(t: TrainingProfile): string[] {
  const out: string[] = [];
  if (t.ageGroup === "13-17")
    out.push(
      "Under 18: train supervised where possible, focus on technique, and skip max-effort single reps. Share this plan with a parent or guardian.",
    );
  if (t.ageGroup === "60+")
    out.push(
      "60+: check with your physician before starting. Every session includes balance work; stop any exercise that causes joint pain.",
    );
  if (t.experience === "beginner")
    out.push("New to training: start lighter than feels necessary — the first weeks are about form, not load.");
  out.push("This is general fitness guidance, not medical advice.");
  return out;
}

/** high-level nutrition stance per goal — guidance, not a meal plan */
export function nutritionFor(t: TrainingProfile, weightKg: number): { proteinG: number; stance: string; note: string } {
  const { nutrition } = TEMPLATES[t.goal];
  const gPerKg = nutrition.stance === "deficit" ? 2.2 : nutrition.stance === "surplus" ? 2.0 : 1.8;
  return {
    proteinG: Math.round((weightKg * gPerKg) / 5) * 5,
    stance:
      nutrition.stance === "deficit"
        ? "Calorie deficit"
        : nutrition.stance === "surplus"
          ? "Lean surplus"
          : "Maintenance",
    note: nutrition.note,
  };
}
