// Session helpers shared by the workout tracker and Gym Mode.
import type { AppState, WorkoutDay, WorkoutSession } from "./types";
import { adviseFor, historyFor } from "./overload";
import { todayStr } from "./store";

/** reps the user actually did for this set slot last session — the best prefill there is */
export function lastRepsFor(state: AppState, exerciseId: string, setIdx: number): number | undefined {
  const last = historyFor(state, exerciseId)[0]?.log;
  const set = last?.sets[setIdx];
  return set?.done ? set.reps : undefined;
}

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
      // reps come from what the user ACTUALLY did last time, per set —
      // so a bare ✓ tap logs the truth, not the template's minimum
      sets: Array.from({ length: pe.workingSets }, (_, i) => ({
        weight: advice.suggestedWeight ?? 0,
        reps: lastRepsFor(draft, pe.exerciseId, i) ?? pe.repsMin,
        done: false,
      })),
    });
  }
  return session;
}
