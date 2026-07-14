// ============================================================
// Progressive Overload engine — pure functions, no storage.
// Looks at recent history for an exercise and tells you exactly
// what to do next session. The future AI coach augments this,
// it never replaces it.
// ============================================================
import type { AppState, Exercise, ExerciseLog, PlannedExercise, WorkoutSession } from "./types";
import { EXERCISE_MAP } from "./seed";

export interface OverloadAdvice {
  kind: "increase" | "reps" | "hold" | "start";
  message: string;
  /** suggested working weight for next session */
  suggestedWeight?: number;
}

/** All logged instances of an exercise, most recent first. */
export function historyFor(state: AppState, exerciseId: string): { date: string; log: ExerciseLog }[] {
  const out: { date: string; log: ExerciseLog }[] = [];
  for (const s of state.sessions) {
    for (const log of s.logs) {
      if (log.exerciseId === exerciseId && log.sets.some((x) => x.done)) {
        out.push({ date: s.date, log });
      }
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Heaviest completed set ever for an exercise (PR). */
export function prFor(state: AppState, exerciseId: string): { weight: number; reps: number } | null {
  let best: { weight: number; reps: number } | null = null;
  for (const { log } of historyFor(state, exerciseId)) {
    for (const set of log.sets) {
      if (!set.done || set.weight <= 0) continue;
      if (!best || set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)) {
        best = { weight: set.weight, reps: set.reps };
      }
    }
  }
  return best;
}

/**
 * Core rule (double progression):
 *  - every working set hit repsMax at the same weight → increase weight
 *  - all sets ≥ repsMin → push for more reps at same weight
 *  - sets below repsMin → hold / consider small deload
 */
export function adviseFor(
  state: AppState,
  planned: PlannedExercise,
  opts: { excludeSessionId?: string } = {},
): OverloadAdvice {
  const ex = EXERCISE_MAP[planned.exerciseId];
  const history = historyFor(state, planned.exerciseId).filter(
    () => true,
  );
  const relevant = opts.excludeSessionId
    ? history.filter((h) => {
        const session = state.sessions.find(
          (s) => s.date === h.date && s.logs.includes(h.log),
        );
        return session?.id !== opts.excludeSessionId;
      })
    : history;

  const last = relevant[0];
  if (!last) {
    return {
      kind: "start",
      message: ex?.isBodyweight
        ? "First time — log your reps and build from there."
        : "First time — pick a weight you can control for the full rep range.",
    };
  }

  const doneSets = last.log.sets.filter((s) => s.done);
  if (doneSets.length === 0) {
    return { kind: "start", message: "No completed sets last time — restart light." };
  }

  const weight = Math.max(...doneSets.map((s) => s.weight));
  const inc = ex?.incrementKg ?? 2.5;

  const allAtMax = doneSets.length >= planned.workingSets && doneSets.every((s) => s.reps >= planned.repsMax);
  const allAtMin = doneSets.every((s) => s.reps >= planned.repsMin);

  if (allAtMax) {
    if (ex?.isBodyweight && weight === 0) {
      const next = ex.progressTo ? EXERCISE_MAP[ex.progressTo] : undefined;
      return {
        kind: "increase",
        message: next
          ? `Owned ${planned.repsMax}+ reps every set — you've outgrown this. Move up to ${next.name}.`
          : `Owned ${planned.repsMax}+ reps every set — add weight (belt/backpack) or slow the tempo.`,
        suggestedWeight: next ? 0 : inc,
      };
    }
    const next = +(weight + inc).toFixed(1);
    return {
      kind: "increase",
      message: `All sets hit ${planned.repsMax} @ ${weight} kg — increase to ${next} kg next session.`,
      suggestedWeight: next,
    };
  }

  if (allAtMin) {
    const worst = Math.min(...doneSets.map((s) => s.reps));
    return {
      kind: "reps",
      message: `Stay at ${weight} kg — push each set toward ${planned.repsMax} reps (last time your lowest set was ${worst}).`,
      suggestedWeight: weight,
    };
  }

  return {
    kind: "hold",
    message: `Some sets fell under ${planned.repsMin} reps @ ${weight} kg — repeat this weight and own every rep before moving up.`,
    suggestedWeight: weight,
  };
}

/**
 * Warm-up ramp toward a working weight — bar first for barbell lifts,
 * then submaximal steps rounded to the exercise's plate/pin increment.
 * Empty when there's nothing meaningful to ramp (bodyweight, no weight).
 */
export function warmupRamp(ex: Exercise, workingKg: number): { kg: number; reps: number }[] {
  if (!workingKg || workingKg <= 0 || ex.isBodyweight) return [];
  const barbell = ex.equipment === "Barbell" || ex.equipment === "Smith";
  const inc = barbell ? 2.5 : ex.incrementKg || 2.5;
  const at = (f: number) => Math.round((workingKg * f) / inc) * inc;
  const steps = barbell
    ? [{ kg: 20, reps: 10 }, { kg: at(0.5), reps: 5 }, { kg: at(0.75), reps: 3 }]
    : [{ kg: at(0.5), reps: 10 }, { kg: at(0.75), reps: 5 }];
  // strictly ascending, under the working weight, never below an empty bar
  const out: { kg: number; reps: number }[] = [];
  for (const s of steps) {
    if (s.kg <= 0 || s.kg >= workingKg) continue;
    if (barbell && s.kg < 20) continue;
    if (out.length > 0 && s.kg <= out[out.length - 1].kg) continue;
    out.push(s);
  }
  return out;
}

// ---------- streak / completion ----------
export function completedDates(sessions: WorkoutSession[]): Set<string> {
  return new Set(sessions.filter((s) => s.completedAt).map((s) => s.date));
}

/** Streak shields: earn one per 14 consecutive completed training days, hold at most this many. */
export const SHIELD_EVERY = 14;
export const SHIELD_CAP = 2;

export interface StreakInfo {
  streak: number;
  /** unspent shields — each silently absorbs one missed training day */
  shields: number;
}

/**
 * Streak = consecutive planned training days completed, counting up to
 * today (rest days don't break it; today doesn't break it if still
 * pending). Shields are streak insurance: every 14 clean days banks
 * one (max 2), and a missed training day spends a shield instead of
 * killing the streak — one sick day no longer erases two months.
 */
export function streakInfo(state: AppState, today: string = localDateStr(new Date())): StreakInfo {
  const done = completedDates(state.sessions);
  const restDays = new Set(state.plan.filter((d) => d.isRest).map((d) => d.weekday));
  if (done.size === 0) return { streak: 0, shields: 0 };

  // walk forward from the first completed day (bounded — 800 days is
  // beyond any realistic unbroken history)
  const first = [...done].sort()[0];
  const cursor = new Date(first + "T12:00:00");
  let streak = 0;
  let shields = 0;
  let cleanRun = 0;
  for (let i = 0; i < 800; i++) {
    const dateStr = localDateStr(cursor);
    if (dateStr > today) break;
    if (done.has(dateStr)) {
      streak++;
      cleanRun++;
      if (cleanRun % SHIELD_EVERY === 0 && shields < SHIELD_CAP) shields++;
    } else if (!restDays.has(cursor.getDay()) && dateStr !== today) {
      cleanRun = 0; // a miss breaks the earn run either way
      if (shields > 0) shields--;
      else streak = 0;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return { streak, shields };
}

export function workoutStreak(state: AppState): number {
  return streakInfo(state).streak;
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** completed / planned sessions for the current week (Mon-based). */
export function weeklyCompletion(state: AppState): { done: number; planned: number } {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // Mon=0
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow);

  const planned = state.plan.filter((d) => !d.isRest).length;
  const done = new Set(
    state.sessions
      .filter((s) => {
        if (!s.completedAt) return false;
        const d = new Date(s.date + "T12:00:00");
        return d >= new Date(monday.toDateString()) && d <= now;
      })
      .map((s) => s.date),
  ).size;
  return { done, planned };
}
