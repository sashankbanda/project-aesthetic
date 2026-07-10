// Prints the 6 verification profiles from the brief as readable plans.
// Run: npm run sample-plans
import { describe, expect, it } from "vitest";
import { resolvePlan, disclaimersFor, nutritionFor } from "./plan-engine";
import { EXERCISE_MAP } from "./seed";
import { TEMPLATES } from "./templates";
import type { TrainingProfile } from "./types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SAMPLES: { who: string; t: TrainingProfile; weightKg: number }[] = [
  {
    who: "Female, 25 · gym · bodybuilding · intermediate · 5 days",
    t: { gender: "female", ageGroup: "18-29", environment: "gym", goal: "bodybuilding", experience: "intermediate", daysPerWeek: 5, sessionMin: 60 },
    weightKg: 60,
  },
  {
    who: "Male, 50 · home minimal · weight loss · beginner · 3 days",
    t: { gender: "male", ageGroup: "45-59", environment: "home-minimal", goal: "fat-loss", experience: "beginner", daysPerWeek: 3, sessionMin: 60 },
    weightKg: 88,
  },
  {
    who: "Female, 62 · bodyweight only · general fitness · beginner · 3 days",
    t: { gender: "female", ageGroup: "60+", environment: "bodyweight", goal: "general-fitness", experience: "beginner", daysPerWeek: 3, sessionMin: 30 },
    weightKg: 65,
  },
  {
    who: "Male, 16 · bodyweight only · calisthenics · beginner · 4 days",
    t: { gender: "male", ageGroup: "13-17", environment: "bodyweight", goal: "calisthenics", experience: "beginner", daysPerWeek: 4, sessionMin: 60 },
    weightKg: 58,
  },
  {
    who: "Female, 35 · home gym · toning/recomp · intermediate · 4 days",
    t: { gender: "female", ageGroup: "30-44", environment: "home-gym", goal: "recomp", experience: "intermediate", daysPerWeek: 4, sessionMin: 60, focus: "glutes-legs" },
    weightKg: 62,
  },
  {
    who: "Male, 28 · gym · strength · advanced · 4 days",
    t: { gender: "male", ageGroup: "18-29", environment: "gym", goal: "strength", experience: "advanced", daysPerWeek: 4, sessionMin: 90 },
    weightKg: 82,
  },
];

describe("sample plans (the 6 verification profiles)", () => {
  for (const { who, t, weightKg } of SAMPLES) {
    it(who, () => {
      const plan = resolvePlan(t);
      const template = TEMPLATES[t.goal];
      const nutri = nutritionFor(t, weightKg);
      const lines: string[] = ["", `━━ ${who}`];
      for (const day of plan.filter((d) => !d.isRest)) {
        lines.push(`  ${WEEKDAYS[day.weekday]} · ${day.name} (warm-up ${day.warmupMin} min)`);
        for (const pe of day.exercises) {
          const ex = EXERCISE_MAP[pe.exerciseId];
          lines.push(
            `    ${ex.name.padEnd(34)} ${pe.workingSets}×${pe.repsMin}–${pe.repsMax} · rest ${pe.restSeconds}s${pe.notes ? ` · ${pe.notes}` : ""}`,
          );
        }
      }
      lines.push(`  progression: ${template.progressionNote}`);
      lines.push(`  cardio: ${template.cardioNote}`);
      lines.push(`  nutrition: ${nutri.stance} · protein ~${nutri.proteinG} g/day`);
      const disc = disclaimersFor(t);
      if (disc.length) lines.push(`  disclaimers: ${disc.join(" | ")}`);
      console.log(lines.join("\n"));

      // sanity: right day count, no empty days, all ids resolve
      const days = plan.filter((d) => !d.isRest);
      expect(days.length).toBe(t.daysPerWeek);
      for (const day of days) {
        expect(day.exercises.length).toBeGreaterThanOrEqual(3);
        for (const pe of day.exercises) expect(EXERCISE_MAP[pe.exerciseId]).toBeDefined();
      }
    });
  }
});
