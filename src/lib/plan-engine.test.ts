import { describe, expect, it } from "vitest";
import { resolvePlan } from "./plan-engine";
import { DEFAULT_PLAN, EXERCISES, EXERCISE_MAP } from "./seed";
import { TRAINING_WEEKDAYS } from "./templates";
import type { TrainingProfile } from "./types";

const base: TrainingProfile = {
  gender: "unspecified",
  ageGroup: "18-29",
  environment: "gym",
  goal: "bodybuilding",
  experience: "intermediate",
  daysPerWeek: 4,
  sessionMin: 60,
};

const plannedExercises = (t: TrainingProfile) =>
  resolvePlan(t)
    .filter((d) => !d.isRest)
    .flatMap((d) => d.exercises.map((pe) => ({ pe, ex: EXERCISE_MAP[pe.exerciseId] })));

describe("exercise library", () => {
  it("has 150+ exercises with unique ids", () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(150);
  });

  it("every progression link points at a real exercise", () => {
    for (const e of EXERCISES) {
      if (e.progressTo) expect(EXERCISE_MAP[e.progressTo], `${e.id} → ${e.progressTo}`).toBeDefined();
      if (e.regressTo) expect(EXERCISE_MAP[e.regressTo], `${e.id} → ${e.regressTo}`).toBeDefined();
    }
  });
});

describe("resolvePlan", () => {
  it("bodyweight-only plans use zero equipment", () => {
    const rows = plannedExercises({ ...base, environment: "bodyweight", goal: "general-fitness" });
    expect(rows.length).toBeGreaterThan(0);
    for (const { ex } of rows) expect(ex.equipment, ex.id).toBe("Bodyweight");
  });

  it("home-minimal allows only bands, bar and bodyweight", () => {
    const rows = plannedExercises({ ...base, environment: "home-minimal", goal: "calisthenics" });
    for (const { ex } of rows) expect(["Band", "Pull-up Bar", "Bodyweight"]).toContain(ex.equipment);
  });

  it("60+ plans exclude contraindicated exercises and include balance work", () => {
    const t: TrainingProfile = { ...base, ageGroup: "60+", goal: "general-fitness", daysPerWeek: 3 };
    const days = resolvePlan(t).filter((d) => !d.isRest);
    for (const day of days) {
      const exs = day.exercises.map((pe) => EXERCISE_MAP[pe.exerciseId]);
      for (const ex of exs) {
        expect(ex.avoidIf ?? [], ex.id).not.toContain("high-impact");
        expect(ex.avoidIf ?? [], ex.id).not.toContain("spine");
        expect(ex.difficulty ?? 2, ex.id).toBeLessThanOrEqual(2);
      }
      expect(exs.some((e) => e.pattern === "balance" || e.pattern === "core"), day.name).toBe(true);
    }
    // at least one dedicated balance movement across the week
    expect(days.flatMap((d) => d.exercises).some((pe) => EXERCISE_MAP[pe.exerciseId].pattern === "balance")).toBe(true);
  });

  it("teens never get sub-6-rep maximal work", () => {
    const rows = plannedExercises({ ...base, ageGroup: "13-17", goal: "strength" });
    for (const { pe, ex } of rows) {
      if (ex.pattern === "cardio" || ex.pattern === "mobility") continue;
      expect(pe.repsMin, ex.id).toBeGreaterThanOrEqual(6);
    }
  });

  it("selects the right split for days per week", () => {
    for (const days of [2, 3, 4, 5, 6] as const) {
      const plan = resolvePlan({ ...base, daysPerWeek: days });
      const training = plan.filter((d) => !d.isRest);
      const rest = plan.filter((d) => d.isRest);
      expect(training.length).toBe(days);
      expect(rest.length).toBe(7 - days);
      expect(training.map((d) => d.weekday)).toEqual(TRAINING_WEEKDAYS[days]);
      expect(new Set(plan.map((d) => d.weekday)).size).toBe(7); // every weekday resolves
    }
  });

  it("applies rep ranges by goal", () => {
    const compound = (t: TrainingProfile) =>
      plannedExercises(t).filter(
        ({ ex }) => ex.pattern && !ex.pattern.startsWith("iso-") && !["core", "balance", "cardio", "mobility"].includes(ex.pattern),
      );
    for (const { pe } of compound({ ...base, goal: "strength" })) {
      expect(pe.repsMin).toBeGreaterThanOrEqual(3);
      expect(pe.repsMax).toBeLessThanOrEqual(6);
    }
    for (const { pe } of compound({ ...base, goal: "bodybuilding" })) {
      expect(pe.repsMin).toBeGreaterThanOrEqual(6);
      expect(pe.repsMax).toBeLessThanOrEqual(12);
    }
    for (const { pe } of compound({ ...base, goal: "endurance" })) {
      expect(pe.repsMin).toBeGreaterThanOrEqual(12);
    }
  });

  it("no exercise repeats within a single day", () => {
    for (const goal of ["fat-loss", "bodybuilding", "calisthenics", "starter"] as const) {
      for (const day of resolvePlan({ ...base, goal }).filter((d) => !d.isRest)) {
        const ids = day.exercises.map((pe) => pe.exerciseId);
        expect(new Set(ids).size, `${goal}/${day.name}`).toBe(ids.length);
      }
    }
  });

  it("is deterministic", () => {
    expect(resolvePlan(base)).toEqual(resolvePlan(base));
  });

  it("returns the hand-tuned plan for the original lean-aesthetic gym profile", () => {
    const plan = resolvePlan({ ...base, goal: "lean-aesthetic", environment: "gym", daysPerWeek: 6 });
    expect(plan).toEqual(DEFAULT_PLAN);
  });

  it("fills every session with exercises", () => {
    // sweep a broad sample of the combination space — no empty sessions anywhere
    for (const environment of ["gym", "home-gym", "home-minimal", "bodyweight"] as const) {
      for (const goal of ["fat-loss", "strength", "bodybuilding", "calisthenics", "general-fitness", "endurance", "recomp", "mobility", "starter", "lean-aesthetic"] as const) {
        for (const ageGroup of ["13-17", "18-29", "60+"] as const) {
          const days = resolvePlan({ ...base, environment, goal, ageGroup, experience: "beginner", daysPerWeek: 3 }).filter((d) => !d.isRest);
          for (const day of days) {
            expect(day.exercises.length, `${environment}/${goal}/${ageGroup}/${day.name}`).toBeGreaterThanOrEqual(3);
          }
        }
      }
    }
  });
});
