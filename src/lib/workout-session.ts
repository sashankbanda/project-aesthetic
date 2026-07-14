// Session helpers shared by the workout tracker and Gym Mode.
import type { AppState, WorkoutDay, WorkoutSession } from "./types";
import { adviseFor } from "./overload";
import { todayStr } from "./store";

export function sessionId(date: string, dayId: string) {
  return `${date}_${dayId}`;
}

/**
 * Get or lazily create today's session — sets come PRE-FILLED from
 * the overload engine (weight) and last session (reps), so logging
 * a set is a single tap.
 */
export function ensureSession(draft: AppState, day: WorkoutDay): WorkoutSession {
  const date = todayStr();
  const id = sessionId(date, day.id);
  let session = draft.sessions.find((s) => s.id === id);
  if (!session) {
    session = { id, date, dayId: day.id, logs: [] };
    draft.sessions.push(session);
  }
  // reconcile: every exercise in the (possibly swapped/edited) day gets
  // a pre-filled log — existing logs and their ticked sets are untouched
  for (const pe of day.exercises) {
    if (session.logs.some((l) => l.exerciseId === pe.exerciseId)) continue;
    const advice = adviseFor(draft, pe);
    session.logs.push({
      exerciseId: pe.exerciseId,
      sets: Array.from({ length: pe.workingSets }, () => ({
        weight: advice.suggestedWeight ?? 0,
        reps: pe.repsMin,
        done: false,
      })),
    });
  }
  return session;
}
