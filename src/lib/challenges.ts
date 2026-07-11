// ============================================================
// Challenges — commitment arcs measured in adherence: of the
// training days your plan scheduled since you started, how many
// did you actually complete?
// ============================================================
import type { AppState } from "./types";

export interface ChallengeDef {
  id: string;
  name: string;
  days: number;
  blurb: string;
}

export const CHALLENGE_DEFS: ChallengeDef[] = [
  {
    id: "kickstart-30",
    name: "30-Day Kickstart",
    days: 30,
    blurb: "One month of showing up — build the habit that builds everything else.",
  },
  {
    id: "arc-60",
    name: "60-Day Arc",
    days: 60,
    blurb: "A full training block. Strength moves first, the mirror follows.",
  },
  {
    id: "transform-90",
    name: "90-Day Transformation",
    days: 90,
    blurb: "The classic. Ninety days of consistency changes how you look and live.",
  },
];

export interface ChallengeProgress {
  name: string;
  /** 1-based current day, capped at total */
  day: number;
  total: number;
  /** training days the plan scheduled inside the window so far */
  planned: number;
  /** completed sessions inside the window */
  done: number;
  adherencePct: number | null;
  finished: boolean;
}

const addDays = (dateStr: string, n: number) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export function challengeProgress(state: AppState, today: string): ChallengeProgress | null {
  const c = state.challenge;
  if (!c) return null;

  const elapsed = Math.floor(
    (new Date(today + "T12:00:00").getTime() - new Date(c.startedAt + "T12:00:00").getTime()) / 86_400_000,
  );
  const finished = elapsed >= c.days;
  const lastDay = addDays(c.startedAt, c.days - 1);
  const windowEnd = finished ? lastDay : today;

  const trainWeekdays = new Set(state.plan.filter((d) => !d.isRest).map((d) => d.weekday));
  let planned = 0;
  for (let cursor = c.startedAt; cursor <= windowEnd; cursor = addDays(cursor, 1)) {
    if (trainWeekdays.has(new Date(cursor + "T12:00:00").getDay())) planned++;
  }
  const done = state.sessions.filter(
    (s) => s.completedAt && s.date >= c.startedAt && s.date <= windowEnd,
  ).length;

  return {
    name: c.name,
    day: Math.min(elapsed + 1, c.days),
    total: c.days,
    planned,
    done,
    adherencePct: planned > 0 ? Math.round((Math.min(done, planned) / planned) * 100) : null,
    finished,
  };
}
