"use client";
import Mounted from "@/components/mounted";
import ProgressNav from "@/components/progress-nav";
import { Card, PageHead, SectionTitle, Stat } from "@/components/ui";
import { HBars } from "@/components/charts";
import { ChartNoAxesColumn, Trophy } from "lucide-react";
import { useApp } from "@/lib/store";
import { EXERCISE_MAP } from "@/lib/seed";
import { prFor } from "@/lib/overload";
import { analyzeSession, fmtDuration } from "@/lib/session-time";
import type { MuscleGroup } from "@/lib/types";
import { Timer } from "lucide-react";

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

const KEY_LIFTS = [
  { id: "flat-bb-bench", label: "Bench Press" },
  { id: "lat-pulldown", label: "Lat Pulldown" },
  { id: "squat", label: "Squat" },
  { id: "incline-db-press", label: "Incline DB Press" },
];

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
      <Card>
        <HBars data={rows} unit="" color="var(--color-viz1)" />
        <p className="mt-4 text-xs leading-relaxed text-faint">
          Rough guide: 10–20 weekly sets per priority muscle grows it; under 8 maintains.
          Your weak points (upper chest, side delts, lats, rear delts) should sit near the top of this chart.
        </p>
      </Card>

      <RecentSessions />

      <SectionTitle>
        <Trophy size={17} className="text-accent2" /> Key lift PRs
      </SectionTitle>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {KEY_LIFTS.map(({ id, label }) => {
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
            </div>
          );
        })}
      </Card>
    </>
  );
}
