// ============================================================
// Progressive Overload engine — pure functions, no storage.
// Looks at recent history for an exercise and tells you exactly
// what to do next session. The future AI coach augments this,
// it never replaces it.
// ============================================================
import type { AppState, ExerciseLog, PlannedExercise, WorkoutSession } from "./types";
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
      return {
        kind: "increase",
        message: `Owned ${planned.repsMax}+ reps every set — add weight (belt/dumbbell) or try a harder variation.`,
        suggestedWeight: inc,
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

/** Default weight to prefill set rows for a planned exercise. */
export function prefillWeight(state: AppState, planned: PlannedExercise, excludeSessionId?: string): number {
  const advice = adviseFor(state, planned, { excludeSessionId });
  return advice.suggestedWeight ?? 0;
}

// ---------- streak / completion ----------
export function completedDates(sessions: WorkoutSession[]): Set<string> {
  return new Set(sessions.filter((s) => s.completedAt).map((s) => s.date));
}

/**
 * Streak = consecutive planned training days completed, counting back
 * from today (rest days don't break it; today doesn't break it if
 * still pending).
 */
export function workoutStreak(state: AppState): number {
  const done = completedDates(state.sessions);
  const restDays = new Set(state.plan.filter((d) => d.isRest).map((d) => d.weekday));
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 400; i++) {
    const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    const isRest = restDays.has(cursor.getDay());
    if (done.has(dateStr)) {
      streak++;
    } else if (!isRest) {
      // today still in progress doesn't break the streak
      if (i !== 0) break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
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
