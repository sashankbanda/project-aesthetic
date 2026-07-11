"use client";
import Mounted from "@/components/mounted";
import ProgressNav from "@/components/progress-nav";
import { MuscleHeatMap } from "@/components/muscle-map";
import { Card, PageHead, SectionTitle, Stat } from "@/components/ui";
import { HBars } from "@/components/charts";
import { ChartNoAxesColumn, Flame, HeartPulse, Share2, Timer, Trophy } from "lucide-react";
import { todayStr, useApp } from "@/lib/store";
import { EXERCISE_MAP } from "@/lib/seed";
import { completedDates, prFor } from "@/lib/overload";
import { recentWeeks, recoveryHeatNow } from "@/lib/recap";
import { buildWorkoutReceipt, shareCard } from "@/lib/share-card";
import { analyzeSession, fmtDuration } from "@/lib/session-time";
import type { MuscleGroup } from "@/lib/types";

/** primary set = 1.0, secondary = 0.5 */
function weeklyVolume(state: ReturnType<typeof useApp>): Map<MuscleGroup, number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const vol = new Map<MuscleGroup, number>();
  const add = (mg: MuscleGroup, v: number) => vol.set(mg, (vol.get(mg) ?? 0) + v);

  for (const s of state.sessions) {
    if (new Date(s.date + "T12:00:00") < cutoff) continue;
    for (const log of s.logs) {
      const ex = EXERCISE_MAP[log.exerciseId];
      if (!ex) continue;
      const done = log.sets.filter((x) => x.done).length;
      if (done === 0) continue;
      add(ex.primary, done);
      for (const sec of ex.secondary) add(sec, done * 0.5);
    }
  }
  return vol;
}

/** what the plan would deliver in a full week — the "planned" baseline */
function plannedVolume(state: ReturnType<typeof useApp>): Map<MuscleGroup, number> {
  const vol = new Map<MuscleGroup, number>();
  const add = (mg: MuscleGroup, v: number) => vol.set(mg, (vol.get(mg) ?? 0) + v);
  for (const day of state.plan) {
    for (const pe of day.exercises) {
      const ex = EXERCISE_MAP[pe.exerciseId];
      if (!ex) continue;
      add(ex.primary, pe.workingSets);
      for (const sec of ex.secondary) add(sec, pe.workingSets * 0.5);
    }
  }
  return vol;
}

/** the user's own most-trained weighted lifts — no hardcoded lift list */
function keyLifts(state: ReturnType<typeof useApp>): { id: string; label: string }[] {
  const counts = new Map<string, number>();
  for (const s of state.sessions) {
    for (const l of s.logs) {
      if (l.sets.some((x) => x.done && x.weight > 0)) {
        counts.set(l.exerciseId, (counts.get(l.exerciseId) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => ({ id, label: EXERCISE_MAP[id]?.name ?? id }));
}

export default function AnalyticsPage() {
  return (
    <Mounted>
      <AnalyticsInner />
    </Mounted>
  );
}

function AnalyticsInner() {
  const state = useApp();
  const actual = weeklyVolume(state);
  const planned = plannedVolume(state);
  const hasData = actual.size > 0;

  const source = hasData ? actual : planned;
  const rows = [...source.entries()]
    .map(([label, value]) => ({ label, value: Math.round(value * 10) / 10 }))
    .sort((a, b) => b.value - a.value);

  const completed = state.sessions.filter((s) => s.completedAt).length;
  const totalSets = state.sessions.reduce(
    (n, s) => n + s.logs.reduce((m, l) => m + l.sets.filter((x) => x.done).length, 0),
    0,
  );
  const totalVolume = Math.round(
    state.sessions.reduce(
      (n, s) =>
        n +
        s.logs.reduce(
          (m, l) => m + l.sets.filter((x) => x.done).reduce((v, x) => v + x.weight * x.reps, 0),
          0,
        ),
      0,
    ),
  );

  return (
    <>
      <PageHead
        eyebrow="Progress"
        title="Analytics"
        sub="Weekly training volume per muscle — primary sets count full, secondary count half."
      />
      <ProgressNav />

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Workouts done" value={completed} />
        <Stat label="Sets completed" value={totalSets} />
        <Stat label="Volume lifted" value={totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume} kg`} />
      </div>

      <SectionTitle>
        <ChartNoAxesColumn size={17} className="text-accent2" />
        {hasData ? "Last 7 days — sets per muscle" : "Planned weekly volume (log workouts to see actuals)"}
      </SectionTitle>
      <Card data-tour="analytics-volume">
        <HBars data={rows} unit="" color="var(--color-viz1)" />
        <p className="mt-4 text-xs leading-relaxed text-faint">
          Rough guide: 10–20 weekly sets per priority muscle grows it; under 8 maintains.
          The muscles your plan prioritizes should sit near the top of this chart.
        </p>
      </Card>

      <RecoveryMap />
      <ConsistencyGrid />
      <RecentSessions />

      {keyLifts(state).length > 0 && (
        <>
          <SectionTitle>
            <Trophy size={17} className="text-accent2" /> Key lift PRs
          </SectionTitle>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {keyLifts(state).map(({ id, label }) => {
              const pr = prFor(state, id);
              return (
                <Stat
                  key={id}
                  label={label}
                  value={pr && pr.weight > 0 ? `${pr.weight} kg` : "—"}
                  sub={pr && pr.weight > 0 ? `× ${pr.reps} reps` : "no lifts logged yet"}
                />
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/** Which muscles are ready to hit again — recency-shaded mannequin. */
function RecoveryMap() {
  const state = useApp();
  const heat = recoveryHeatNow(state);
  if (Object.keys(heat).length === 0) return null;
  return (
    <>
      <SectionTitle>
        <HeartPulse size={17} className="text-accent2" /> Recovery status
      </SectionTitle>
      <Card>
        <MuscleHeatMap heat={heat} />
        <p className="mt-3 text-center text-xs text-faint">
          Muscles fade back to fresh over ~72 hours — train what&apos;s fresh, let the rest recover.
        </p>
      </Card>
    </>
  );
}

/** Don't-break-the-chain grid — one dot per day, last 12 weeks. */
function ConsistencyGrid() {
  const state = useApp();
  const trained = completedDates(state.sessions);
  if (trained.size === 0) return null;
  const weeks = recentWeeks(new Date(), 12);
  const today = todayStr();
  return (
    <>
      <SectionTitle>
        <Flame size={17} className="text-accent2" /> Consistency
      </SectionTitle>
      <Card className="!p-4">
        <div className="flex justify-between gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-1 flex-col gap-1">
              {week.map((date) => (
                <div
                  key={date}
                  title={date}
                  className={`aspect-square w-full rounded-[3px] ${
                    trained.has(date)
                      ? "bg-accent"
                      : date > today
                        ? "bg-transparent"
                        : "bg-card2"
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex justify-between text-[10px] text-faint">
          <span>12 weeks ago</span>
          <span>this week</span>
        </div>
      </Card>
    </>
  );
}

/** Recent sessions — duration + productivity from the time engine. */
function RecentSessions() {
  const state = useApp();
  const recent = [...state.sessions]
    .filter((s) => s.completedAt)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7);

  if (recent.length === 0) return null;

  return (
    <>
      <SectionTitle>
        <Timer size={17} className="text-accent2" /> Recent sessions
      </SectionTitle>
      <Card className="divide-y divide-line/40 !py-2">
        {recent.map((s) => {
          const day = state.plan.find((d) => d.id === s.dayId);
          const report = analyzeSession(s, day);
          return (
            <div key={s.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{day?.name ?? s.dayId}</div>
                <div className="text-[11px] text-faint">
                  {new Date(s.date + "T12:00:00").toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  {report && ` · ${report.setsDone} sets`}
                </div>
              </div>
              {report ? (
                <>
                  <span className="text-xs font-bold tabular-nums text-dim">{fmtDuration(report.totalS)}</span>
                  {report.hasTimestamps && (
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                        report.score >= 0.7
                          ? "border-good/30 bg-good/10 text-good"
                          : report.score >= 0.5
                            ? "border-warn/30 bg-warn/10 text-warn"
                            : "border-bad/30 bg-bad/10 text-bad"
                      }`}
                    >
                      {Math.round(report.score * 100)}%
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-faint">no check-in</span>
              )}
              <button
                onClick={() =>
                  void buildWorkoutReceipt(state, s, day).then((blob) =>
                    shareCard(blob, `workout-${s.date}.png`, "Paid in full — in sweat."),
                  )
                }
                aria-label="share this workout as a receipt"
                data-tour="share-receipt"
                className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line text-faint"
              >
                <Share2 size={14} />
              </button>
            </div>
          );
        })}
      </Card>
    </>
  );
}
