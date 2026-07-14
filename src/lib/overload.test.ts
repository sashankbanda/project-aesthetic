import { describe, expect, it } from "vitest";
import { streakInfo, warmupRamp } from "./overload";
import type { AppState, Exercise } from "./types";

/** minimal state: 7 training days a week, sessions completed on the given dates */
function stateWith(dates: string[]): AppState {
  return {
    plan: [0, 1, 2, 3, 4, 5, 6].map((w) => ({
      id: `d${w}`,
      weekday: w,
      name: "",
      focus: "",
      durationMin: 60,
      warmupMin: 8,
      exercises: [],
    })),
    sessions: dates.map((date) => ({
      id: `${date}_d0`,
      date,
      dayId: "d0",
      completedAt: `${date}T10:00:00.000Z`,
      logs: [],
    })),
  } as unknown as AppState;
}

/** yyyy-mm-dd for March 2026 */
const mar = (d: number) => `2026-03-${String(d).padStart(2, "0")}`;
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => mar(from + i));

describe("streak shields", () => {
  it("a miss with no shield kills the streak", () => {
    const state = stateWith([...range(20, 24), ...range(26, 27)]); // miss the 25th
    expect(streakInfo(state, mar(28))).toEqual({ streak: 2, shields: 0 });
  });

  it("14 clean days bank a shield that absorbs one missed day", () => {
    const state = stateWith(range(15, 29)); // 15 clean days, miss the 30th
    expect(streakInfo(state, mar(31))).toEqual({ streak: 15, shields: 0 });
  });

  it("shields cap at 2 on a long clean run", () => {
    const state = stateWith(range(1, 31).concat(["2026-04-01", "2026-04-02", "2026-04-03"]));
    expect(streakInfo(state, "2026-04-03")).toEqual({ streak: 34, shields: 2 });
  });

  it("today still pending never breaks the streak", () => {
    const state = stateWith(range(10, 13));
    expect(streakInfo(state, mar(14)).streak).toBe(4);
  });
});

describe("warmupRamp", () => {
  const barbell = { equipment: "Barbell", incrementKg: 2.5 } as Exercise;
  const dumbbell = { equipment: "Dumbbell", incrementKg: 2 } as Exercise;

  it("barbell: bar first, then 50% and 75% rounded to 2.5", () => {
    expect(warmupRamp(barbell, 60)).toEqual([
      { kg: 20, reps: 10 },
      { kg: 30, reps: 5 },
      { kg: 45, reps: 3 },
    ]);
  });

  it("working weight at/under the bar needs no ramp", () => {
    expect(warmupRamp(barbell, 20)).toEqual([]);
  });

  it("dumbbell: two submaximal steps on the DB increment", () => {
    expect(warmupRamp(dumbbell, 20)).toEqual([
      { kg: 10, reps: 10 },
      { kg: 16, reps: 5 },
    ]);
  });

  it("bodyweight and zero-weight ramp to nothing", () => {
    expect(warmupRamp({ ...dumbbell, isBodyweight: true }, 20)).toEqual([]);
    expect(warmupRamp(barbell, 0)).toEqual([]);
  });
});
