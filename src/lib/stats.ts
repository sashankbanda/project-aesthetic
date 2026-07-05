// ============================================================
// Body stats + achievement evaluation — pure functions.
// ============================================================
import type { AppState, Measurement } from "./types";
import { FOOD_MAP } from "./foods";
import { prFor, workoutStreak } from "./overload";

export function latestMeasurement(state: AppState): Measurement | undefined {
  return [...state.measurements].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

export function bmi(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  return +(weightKg / (h * h)).toFixed(1);
}

/** Fat-Free Mass Index, height-normalized to 1.83 m. */
export function ffmi(weightKg: number, heightCm: number, bodyFatPct: number): number {
  const h = heightCm / 100;
  const ffm = weightKg * (1 - bodyFatPct / 100);
  const raw = ffm / (h * h);
  return +(raw + 6.1 * (1.8 - h)).toFixed(1);
}

export function proteinForDate(state: AppState, date: string): number {
  return state.foodLog
    .filter((e) => e.date === date)
    .reduce((sum, e) => sum + (FOOD_MAP[e.foodId]?.proteinG ?? 0) * e.servings, 0);
}

/** ids of achievements whose conditions currently hold. */
export function evaluateAchievements(state: AppState): string[] {
  const earned: string[] = [];
  const completed = state.sessions.filter((s) => s.completedAt);
  const n = completed.length;
  if (n >= 1) earned.push("first-workout");
  if (n >= 10) earned.push("workouts-10");
  if (n >= 50) earned.push("workouts-50");
  if (n >= 100) earned.push("workouts-100");

  const streak = workoutStreak(state);
  if (streak >= 7) earned.push("streak-7");
  if (streak >= 30) earned.push("streak-30");
  if (streak >= 180) earned.push("streak-180");

  const bench = prFor(state, "flat-bb-bench");
  if (bench && bench.weight >= 40) earned.push("bench-40");
  if (bench && bench.weight >= 60) earned.push("bench-60");

  const pulldown = prFor(state, "lat-pulldown");
  if (pulldown && pulldown.weight >= 45) earned.push("pulldown-45");

  const pullup = prFor(state, "pullup");
  if (pullup && pullup.reps >= 1) earned.push("first-pullup");

  const bf = latestMeasurement(state)?.bodyFatPct;
  if (bf !== undefined) {
    if (bf <= 15) earned.push("bf-15");
    if (bf <= 12) earned.push("bf-12");
    if (bf <= 10) earned.push("bf-10");
  }

  // 7 consecutive days hitting protein goal
  let run = 0;
  const d = new Date();
  for (let i = 0; i < 60; i++) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (proteinForDate(state, ds) >= state.profile.proteinGoalG) {
      run++;
      if (run >= 7) break;
    } else if (i > 0) {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  if (run >= 7) earned.push("protein-week");

  const monthsWithPhotos = state.photos.filter((p) => p.front || p.side || p.back).length;
  if (monthsWithPhotos >= 3) earned.push("photo-3");

  return earned;
}
