import { describe, expect, it } from "vitest";
import { detectPlateaus, isDeloadWeek, streakInfo, warmupRamp } from "./overload";
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

describe("isDeloadWeek", () => {
  const stateAt = (planStartedAt: string): AppState =>
    ({ profile: { training: { planStartedAt, deloadWeeks: 6 } }, plan: [], sessions: [] }) as unknown as AppState;

  it("fires on every 6th week of the plan, not before", () => {
    // week 6 = days 35–41 after start
    expect(isDeloadWeek(stateAt("2026-03-01"), new Date("2026-04-06T12:00:00"))).toBe(true); // day 36
    expect(isDeloadWeek(stateAt("2026-03-01"), new Date("2026-03-20T12:00:00"))).toBe(false); // week 3
    expect(isDeloadWeek(stateAt("2026-03-01"), new Date("2026-03-03T12:00:00"))).toBe(false); // week 1
  });

  it("off when the plan has no deload config", () => {
    expect(isDeloadWeek({ profile: {}, plan: [], sessions: [] } as unknown as AppState)).toBe(false);
  });
});

describe("detectPlateaus", () => {
  const sessionWith = (date: string, weight: number, reps: number) => ({
    id: `${date}_d1`,
    date,
    dayId: "d1",
    completedAt: `${date}T10:00:00Z`,
    logs: [{ exerciseId: "flat-bb-bench", sets: [{ weight, reps, done: true }] }],
  });
  const base = (sessions: unknown[]): AppState =>
    ({
      profile: {},
      plan: [{ id: "d1", weekday: 1, exercises: [{ exerciseId: "flat-bb-bench", workingSets: 3 }] }],
      sessions,
    }) as unknown as AppState;

  it("flags 3 sessions stuck at the same weight and reps", () => {
    const state = base([sessionWith("2026-03-01", 60, 8), sessionWith("2026-03-08", 60, 8), sessionWith("2026-03-15", 60, 8)]);
    expect(detectPlateaus(state)).toEqual([{ exerciseId: "flat-bb-bench", weight: 60, exposures: 3 }]);
  });

  it("rep progress at the same weight is NOT a plateau", () => {
    const state = base([sessionWith("2026-03-01", 60, 6), sessionWith("2026-03-08", 60, 7), sessionWith("2026-03-15", 60, 8)]);
    expect(detectPlateaus(state)).toEqual([]);
  });

  it("weight progress is NOT a plateau", () => {
    const state = base([sessionWith("2026-03-01", 55, 8), sessionWith("2026-03-08", 57.5, 8), sessionWith("2026-03-15", 60, 8)]);
    expect(detectPlateaus(state)).toEqual([]);
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
