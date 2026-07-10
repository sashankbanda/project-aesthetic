// ============================================================
// Coach summary — the compact, anonymized digest of training
// data the AI coach sees. Aggregates only: no raw logs, no
// photos, no name. Small enough to keep prompts fast and free.
// ============================================================
import type { AppState } from "./types";
import { EXERCISE_MAP } from "./seed";
import { workoutStreak } from "./overload";
import { analyzeSession } from "./session-time";

export interface CoachSummary {
  goal?: string;
  experience?: string;
  environment?: string;
  daysPerWeek?: number;
  ageGroup?: string;
  phase: string;
  proteinGoalG: number;
  streakDays: number;
  weeksTracked: { week: string; workouts: number; volumeKg: number; avgFocusPct: number | null }[];
  lifts: { name: string; firstKg: number; latestKg: number; sessions: number }[];
  weightTrendKg: { first: number; latest: number } | null;
  planDays: { name: string; exercises: number }[];
}

export function buildCoachSummary(state: AppState): CoachSummary {
  const t = state.profile.training;

  // last 4 ISO weeks, newest last
  const weeks = new Map<string, { workouts: number; volumeKg: number; scores: number[] }>();
  const weekOf = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  };
  for (const s of state.sessions) {
    const done = s.logs.flatMap((l) => l.sets.filter((x) => x.done));
    if (done.length === 0) continue;
    const wk = weekOf(s.date);
    const bucket = weeks.get(wk) ?? { workouts: 0, volumeKg: 0, scores: [] };
    bucket.workouts++;
    bucket.volumeKg += done.reduce((n, x) => n + x.weight * x.reps, 0);
    const report = analyzeSession(s, state.plan.find((d) => d.id === s.dayId));
    if (report?.hasTimestamps) bucket.scores.push(report.score);
    weeks.set(wk, bucket);
  }
  const weeksTracked = [...weeks.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-4)
    .map(([week, b]) => ({
      week,
      workouts: b.workouts,
      volumeKg: Math.round(b.volumeKg),
      avgFocusPct: b.scores.length ? Math.round((b.scores.reduce((x, y) => x + y, 0) / b.scores.length) * 100) : null,
    }));

  // per-exercise top-weight trend (first vs latest), most-trained first
  const byExercise = new Map<string, { dates: string[]; tops: number[] }>();
  for (const s of [...state.sessions].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const log of s.logs) {
      const top = Math.max(0, ...log.sets.filter((x) => x.done).map((x) => x.weight));
      if (top <= 0) continue;
      const e = byExercise.get(log.exerciseId) ?? { dates: [], tops: [] };
      e.dates.push(s.date);
      e.tops.push(top);
      byExercise.set(log.exerciseId, e);
    }
  }
  const lifts = [...byExercise.entries()]
    .sort((a, b) => b[1].tops.length - a[1].tops.length)
    .slice(0, 8)
    .map(([id, e]) => ({
      name: EXERCISE_MAP[id]?.name ?? id,
      firstKg: e.tops[0],
      latestKg: e.tops[e.tops.length - 1],
      sessions: e.tops.length,
    }));

  const weights = [...state.measurements]
    .filter((m) => m.weightKg !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    goal: t?.goal,
    experience: t?.experience,
    environment: t?.environment,
    daysPerWeek: t?.daysPerWeek,
    ageGroup: t?.ageGroup,
    phase: state.profile.phase,
    proteinGoalG: state.profile.proteinGoalG,
    streakDays: workoutStreak(state),
    weeksTracked,
    lifts,
    weightTrendKg:
      weights.length >= 2
        ? { first: weights[0].weightKg!, latest: weights[weights.length - 1].weightKg! }
        : null,
    planDays: state.plan.filter((d) => !d.isRest).map((d) => ({ name: d.name, exercises: d.exercises.length })),
  };
}
