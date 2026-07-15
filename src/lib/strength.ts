// ============================================================
// Strength progress — pure functions over logged sets.
// e1RM uses Epley (w × (1 + reps/30)), capped at 12 reps where
// the formula stops being meaningful.
// ============================================================
import type { AppState } from "./types";
import { historyFor } from "./overload";

export function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return +(weight * (1 + Math.min(reps, 12) / 30)).toFixed(1);
}

export interface StrengthPoint {
  date: string;
  topWeight: number;
  bestE1rm: number;
  /** total kg lifted (Σ weight × reps of done sets) */
  volume: number;
  sets: number;
  /** reps at the top weight */
  topReps: number;
}

/** one point per logged session, oldest → newest */
export function strengthHistory(state: AppState, exerciseId: string): StrengthPoint[] {
  return historyFor(state, exerciseId)
    .map(({ date, log }) => {
      const done = log.sets.filter((s) => s.done);
      const topWeight = Math.max(0, ...done.map((s) => s.weight));
      return {
        date,
        topWeight,
        bestE1rm: Math.max(0, ...done.map((s) => e1rm(s.weight, s.reps))),
        volume: Math.round(done.reduce((n, s) => n + s.weight * s.reps, 0)),
        sets: done.length,
        topReps: Math.max(0, ...done.filter((s) => s.weight === topWeight).map((s) => s.reps)),
      };
    })
    .reverse();
}
