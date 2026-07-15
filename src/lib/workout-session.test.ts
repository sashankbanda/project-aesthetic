import { describe, expect, it } from "vitest";
import { ensureSession, lastRepsFor } from "./workout-session";
import type { AppState, WorkoutDay } from "./types";

const day: WorkoutDay = {
  id: "d1",
  weekday: 1,
  name: "Push",
  focus: "",
  durationMin: 60,
  warmupMin: 8,
  exercises: [
    { exerciseId: "flat-bb-bench", warmupSets: 2, workingSets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
  ],
};

function stateWithLastSession(): AppState {
  return {
    profile: {},
    plan: [day],
    sessions: [
      {
        id: "2026-07-01_d1",
        date: "2026-07-01",
        dayId: "d1",
        completedAt: "2026-07-01T10:00:00Z",
        logs: [
          {
            exerciseId: "flat-bb-bench",
            sets: [
              { weight: 60, reps: 10, done: true },
              { weight: 60, reps: 9, done: true },
              { weight: 60, reps: 8, done: true },
            ],
          },
        ],
      },
    ],
  } as unknown as AppState;
}

describe("reps prefill from last session", () => {
  it("lastRepsFor reads the per-set reps actually done", () => {
    const state = stateWithLastSession();
    expect(lastRepsFor(state, "flat-bb-bench", 0)).toBe(10);
    expect(lastRepsFor(state, "flat-bb-bench", 2)).toBe(8);
    expect(lastRepsFor(state, "flat-bb-bench", 5)).toBeUndefined();
  });

  it("ensureSession pre-fills each set with last session's reps", () => {
    const draft = stateWithLastSession();
    const session = ensureSession(draft, day);
    expect(session.logs[0].sets.map((s) => s.reps)).toEqual([10, 9, 8]);
  });

  it("no history → template minimum", () => {
    const draft = { profile: {}, plan: [day], sessions: [] } as unknown as AppState;
    const session = ensureSession(draft, day);
    expect(session.logs[0].sets.map((s) => s.reps)).toEqual([8, 8, 8]);
  });
});
