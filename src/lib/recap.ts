// ============================================================
// Weekly recap — pure computations over sessions, Monday-based
// weeks. Rendered as a Home card early in the new week.
// ============================================================
import type { AppState, MuscleGroup } from "./types";
import { EXERCISE_MAP } from "./seed";
import { analyzeSession } from "./session-time";

/** yyyy-mm-dd of the Monday that starts the week containing `date` */
export function mondayOf(date: Date): string {
  const d = new Date(date);
  const shift = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - shift);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface WeeklyRecap {
  /** Monday of the recapped week — also the dismiss key */
  weekKey: string;
  workouts: number;
  sets: number;
  volumeKg: number;
  /** vs the week before, in percent (null when there's no baseline) */
  volumeDeltaPct: number | null;
  /** average session focus score 0–1 (null without timestamps) */
  avgScore: number | null;
}

function weekStats(state: AppState, from: string, to: string) {
  let workouts = 0;
  let sets = 0;
  let volumeKg = 0;
  const scores: number[] = [];
  for (const s of state.sessions) {
    if (s.date < from || s.date >= to) continue;
    const done = s.logs.flatMap((l) => l.sets.filter((x) => x.done));
    if (done.length === 0) continue;
    workouts++;
    sets += done.length;
    volumeKg += done.reduce((n, x) => n + x.weight * x.reps, 0);
    const day = state.plan.find((d) => d.id === s.dayId);
    const report = analyzeSession(s, day);
    if (report?.hasTimestamps) scores.push(report.score);
  }
  return { workouts, sets, volumeKg, scores };
}

/** recap of the week BEFORE the one containing `today` */
export function lastWeekRecap(state: AppState, today: Date): WeeklyRecap | null {
  const thisMonday = mondayOf(today);
  const lastMonday = addDays(thisMonday, -7);
  const prevMonday = addDays(thisMonday, -14);

  const week = weekStats(state, lastMonday, thisMonday);
  if (week.workouts === 0) return null;
  const prev = weekStats(state, prevMonday, lastMonday);

  return {
    weekKey: lastMonday,
    workouts: week.workouts,
    sets: week.sets,
    volumeKg: Math.round(week.volumeKg),
    volumeDeltaPct:
      prev.volumeKg > 0 ? Math.round(((week.volumeKg - prev.volumeKg) / prev.volumeKg) * 100) : null,
    avgScore:
      week.scores.length > 0 ? week.scores.reduce((a, b) => a + b, 0) / week.scores.length : null,
  };
}

/** hours-since-trained per muscle → 0 fresh … 1 fatigued, for the recovery map */
export function recoveryHeat(state: AppState, now: number): Partial<Record<MuscleGroup, number>> {
  const lastTrained = new Map<MuscleGroup, number>();
  for (const s of state.sessions) {
    for (const log of s.logs) {
      if (!log.sets.some((x) => x.done)) continue;
      const ex = EXERCISE_MAP[log.exerciseId];
      if (!ex) continue;
      const at = Date.parse(s.completedAt ?? s.startedAt ?? s.date + "T18:00:00");
      if (Number.isNaN(at)) continue;
      for (const mg of [ex.primary, ...ex.secondary]) {
        lastTrained.set(mg, Math.max(lastTrained.get(mg) ?? 0, at));
      }
    }
  }
  const heat: Partial<Record<MuscleGroup, number>> = {};
  for (const [mg, at] of lastTrained) {
    const hours = (now - at) / 3_600_000;
    if (hours < 24) heat[mg] = 1;
    else if (hours < 48) heat[mg] = 0.6;
    else if (hours < 72) heat[mg] = 0.3;
    // 72h+ = fully recovered — leave unset (fresh)
  }
  return heat;
}

/** render-safe wrapper — components call this instead of touching Date.now() */
export function recoveryHeatNow(state: AppState): Partial<Record<MuscleGroup, number>> {
  return recoveryHeat(state, Date.now());
}

/** Monday-based weeks (oldest first) of yyyy-mm-dd cells, for the consistency grid */
export function recentWeeks(today: Date, weeks: number): string[][] {
  const thisMonday = mondayOf(today);
  const out: string[][] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const monday = addDays(thisMonday, -7 * w);
    out.push(Array.from({ length: 7 }, (_, i) => addDays(monday, i)));
  }
  return out;
}
