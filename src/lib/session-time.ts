// ============================================================
// Session time engine — splits a workout into lifting / resting
// / wasted time from the check-in time and per-set timestamps.
//
// Model: between two consecutive ticked sets there is a gap.
//   - up to the planned rest of the previous exercise → RESTING
//   - the next ~45 s (walk to station, set up, execute) → LIFTING
//   - anything beyond that → WASTED (phone, chatting…)
// The first gap gets the day's warm-up allowance instead of rest.
// It's an honest estimate, not a stopwatch — labelled as such in UI.
// ============================================================
import type { WorkoutDay, WorkoutSession } from "./types";

const EXECUTE_S = 45; // setup + perform one set
const TAIL_ALLOWANCE_S = 90; // rack weights, pack up after last set

export interface SessionTimeReport {
  totalS: number;
  liftS: number;
  restS: number;
  wasteS: number;
  /** 0–1 share of time that was purposeful (lift + rest) */
  score: number;
  verdict: "Dialed in" | "Solid" | "Distracted" | "Leaky";
  setsDone: number;
  /** false when the session predates time tracking */
  hasTimestamps: boolean;
}

export function verdictFor(score: number): SessionTimeReport["verdict"] {
  if (score >= 0.85) return "Dialed in";
  if (score >= 0.7) return "Solid";
  if (score >= 0.5) return "Distracted";
  return "Leaky";
}

export function analyzeSession(
  session: WorkoutSession,
  day: WorkoutDay | undefined,
): SessionTimeReport | null {
  if (!session.startedAt) return null;
  const start = Date.parse(session.startedAt);

  // ticked sets with timestamps, in order — timed sets carry their REAL duration
  const ticks: { t: number; restS: number; execS: number }[] = [];
  let setsDone = 0;
  for (const log of session.logs) {
    const planned = day?.exercises.find((e) => e.exerciseId === log.exerciseId);
    for (const s of log.sets) {
      if (!s.done) continue;
      setsDone++;
      if (s.at)
        ticks.push({
          t: Date.parse(s.at),
          restS: planned?.restSeconds ?? 90,
          execS: s.durationS ?? EXECUTE_S,
        });
    }
  }
  ticks.sort((a, b) => a.t - b.t);

  const end = session.completedAt
    ? Date.parse(session.completedAt)
    : ticks.length > 0
      ? ticks[ticks.length - 1].t
      : start;
  const totalS = Math.max(0, (end - start) / 1000);

  if (ticks.length === 0) {
    return {
      totalS,
      liftS: 0,
      restS: 0,
      wasteS: totalS,
      score: 0,
      verdict: "Leaky",
      setsDone,
      hasTimestamps: false,
    };
  }

  let lift = 0;
  let rest = 0;
  let waste = 0;

  // first gap: warm-up allowance counts as lifting
  let prevT = start;
  let prevAllowanceRest = (day?.warmupMin ?? 8) * 60;
  let firstGap = true;

  for (const tick of ticks) {
    const gap = Math.max(0, (tick.t - prevT) / 1000);
    const restPart = Math.min(gap, prevAllowanceRest);
    const liftPart = Math.min(Math.max(gap - prevAllowanceRest, 0), tick.execS);
    const wastePart = Math.max(gap - prevAllowanceRest - tick.execS, 0);
    if (firstGap) {
      // warm-up window is purposeful work, not rest
      lift += restPart + liftPart;
      firstGap = false;
    } else {
      rest += restPart;
      lift += liftPart;
    }
    waste += wastePart;
    prevT = tick.t;
    prevAllowanceRest = tick.restS;
  }

  // tail: last set → checkout
  if (session.completedAt) {
    const tail = Math.max(0, (end - prevT) / 1000);
    lift += Math.min(tail, TAIL_ALLOWANCE_S);
    waste += Math.max(tail - TAIL_ALLOWANCE_S, 0);
  }

  const score = totalS > 0 ? Math.max(0, Math.min(1, (lift + rest) / totalS)) : 1;

  return {
    totalS,
    liftS: lift,
    restS: rest,
    wasteS: waste,
    score,
    verdict: verdictFor(score),
    setsDone,
    hasTimestamps: true,
  };
}

/** whole-session estimates — minute precision is honest here */
export function fmtDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** exact recordings (stopwatch) — never round seconds away: 45s · 12m 30s · 1h 5m */
export function fmtClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 ? `${m}m ${s % 60}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
}
