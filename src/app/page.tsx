"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Mounted from "@/components/mounted";
import SyncNudge from "@/components/sync-nudge";
import { Card, Meter, Pill, SectionTitle, Tile } from "@/components/ui";
import { FLAME_FRAMES, GlyphMatrix, MOOD_GLYPHS } from "@/components/glyph";
import { Sparkline } from "@/components/charts";
import { useApp, todayStr, update } from "@/lib/store";
import { weeklyCompletion, workoutStreak } from "@/lib/overload";
import { latestMeasurement, proteinForDate } from "@/lib/stats";
import { EXERCISE_MAP } from "@/lib/seed";
import { lastWeekRecap } from "@/lib/recap";
import type { AppState, WorkoutDay, WorkoutSession } from "@/lib/types";
import {
  ArrowRight,
  Battery,
  Check,
  CheckCheck,
  Droplets,
  Footprints,
  Moon,
  Smile,
  Target,
  X,
} from "lucide-react";

// the original hand-tuned lean-aesthetic priorities — used only for
// legacy profiles that never ran the plan wizard
const PRIORITIES = [
  "Upper Chest",
  "Side Delts",
  "Lats",
  "Rear Delts",
  "Arms",
  "Upper Back",
  "Waist Reduction",
  "Legs",
];

/** wizard users: focus = where their actual plan puts its weekly sets */
function prioritiesFor(state: AppState): string[] {
  if (!state.profile.training) return PRIORITIES;
  const sets = new Map<string, number>();
  for (const day of state.plan) {
    for (const pe of day.exercises) {
      const primary = EXERCISE_MAP[pe.exerciseId]?.primary;
      if (primary) sets.set(primary, (sets.get(primary) ?? 0) + pe.workingSets);
    }
  }
  return [...sets.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([muscle]) => muscle);
}

const MOODS = ["😞", "😐", "🙂", "😊", "🤩"];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Home() {
  return (
    <Mounted>
      <HomeInner />
    </Mounted>
  );
}

function HomeInner() {
  const state = useApp();
  const { profile } = state;
  const m = latestMeasurement(state);
  const today = todayStr();
  const weekday = new Date().getDay();
  const todayPlan = state.plan.find((d) => d.weekday === weekday);
  const todaySession = state.sessions.find((s) => s.date === today);
  const streak = workoutStreak(state);
  const week = weeklyCompletion(state);
  const protein = proteinForDate(state, today);

  const weights = [...state.measurements]
    .filter((x) => x.weightKg !== undefined)
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((x) => x.weightKg as number);

  return (
    <>
      <div className="mb-8">
        <div className="label-mono mb-1.5 flex items-center gap-2 text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <h1 className="text-[32px] font-light tracking-[-0.02em] md:text-[38px]">
          {greeting()}, {profile.name}
        </h1>
      </div>

      {/* hero: today's workout — inverted (off-white) tile */}
      <Link href="/workout" className="pressable block">
        <div className="tile-light p-6">
          <div className="dot-texture" />
          <div className="relative">
            <div className="label-mono text-(--ti-faint)">Today</div>
            <div className="mt-1.5 text-[30px] font-light tracking-[-0.02em] text-(--ti-ink)">
              {todayPlan?.isRest ? "Rest Day" : (todayPlan?.name ?? "Training")}
            </div>
            {todayPlan && !todayPlan.isRest && (
              <div className="mt-0.5 text-xs font-light text-(--ti-dim)">
                {todayPlan.focus} · ~{todayPlan.durationMin} min
              </div>
            )}
            <div className="mt-5">
              {todayPlan?.isRest ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-(--ti-chip) px-4 py-2 text-sm font-medium text-(--ti-chip-ink)">
                  <Moon size={14} /> Walk · Stretch · Sleep
                </span>
              ) : todaySession?.completedAt ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-(--ti-chip) px-4 py-2 text-sm font-medium text-(--ti-chip-ink)">
                  <CheckCheck size={15} /> Completed
                </span>
              ) : todaySession?.startedAt ? (
                <span className="inline-flex items-center gap-3">
                  <span className="bg-grad inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/30">
                    Continue <ArrowRight size={15} />
                  </span>
                  <LivePulse session={todaySession} plan={todayPlan} />
                </span>
              ) : (
                <span className="bg-grad inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/30">
                  Start Workout <ArrowRight size={15} />
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* stats row — dot-matrix tiles, streak carries the accent */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Tile
          tone="accent"
          label="Streak"
          value={streak}
          cell={6}
          sub={streak === 1 ? "day" : "days"}
        >
          <div className="absolute -top-1 right-0">
            <GlyphMatrix frames={FLAME_FRAMES} fps={4} cell={3.5} color="#ffffff" />
          </div>
        </Tile>
        <Tile
          tone="dark"
          label="Weight"
          value={m?.weightKg !== undefined ? m.weightKg : "-"}
          cell={6}
          unit="kg"
          sub={`→ ${profile.targetWeightKg} kg`}
        />
        <Tile
          tone="dark"
          label="Protein"
          value={Math.round(protein)}
          cell={6}
          unit="g"
          sub={`goal ${profile.proteinGoalG} g`}
        />
      </div>

      <RecapCard />
      <DeloadBanner />

      {/* week + milestone */}
      <Card className="mt-4 !p-4">
        <div className="flex items-center justify-between">
          <div className="label-mono text-faint">This week</div>
          <div className="text-xs font-bold tabular-nums">
            {week.done}<span className="text-faint">/{week.planned}</span>
          </div>
        </div>
        <Meter ratio={week.done / week.planned} className="mt-2.5" color="var(--color-viz2)" />
        <div className="mt-3 flex items-center gap-2 text-[13px]">
          <Target size={14} className="shrink-0 text-accent2" />
          <span className="text-dim">Next milestone:</span>
          <span className="font-semibold">{profile.nextMilestone}</span>
        </div>
        {weights.length >= 2 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] text-faint">weight trend</span>
            <Sparkline values={weights.slice(-12)} />
          </div>
        )}
      </Card>

      {/* explore mode: quiet backup nudge (hidden when signed in/dismissed) */}
      <SyncNudge />

      {/* daily check-in — 3 taps, no page hopping */}
      <SectionTitle>Daily check-in</SectionTitle>
      <CheckInCard />

      {/* coach focus — where this week's plan actually puts its volume */}
      <SectionTitle>Coach&apos;s focus</SectionTitle>
      <Card className="!p-4">
        <div className="flex flex-wrap gap-2">
          {prioritiesFor(state).map((p, i) => (
            <Pill key={p} tone={i < 4 ? "accent" : "default"}>
              <span className="font-bold">{i + 1}</span> {p}
            </Pill>
          ))}
        </div>
      </Card>
    </>
  );
}

/** Live session ticker inside the hero — sets done and minutes elapsed. */
function LivePulse({
  session,
  plan,
}: {
  session: WorkoutSession;
  plan?: WorkoutDay;
}) {
  const [minutes, setMinutes] = useState<number | null>(null);
  useEffect(() => {
    const tick = () =>
      setMinutes(Math.max(0, Math.floor((Date.now() - Date.parse(session.startedAt!)) / 60000)));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [session.startedAt]);
  const done = session.logs.reduce((n, l) => n + l.sets.filter((s) => s.done).length, 0);
  const total = plan?.exercises.reduce((n, e) => n + e.workingSets, 0) ?? 0;
  return (
    <span className="text-[12px] font-medium text-(--ti-dim) tabular-nums">
      {done}/{total} sets{minutes !== null ? ` · ${minutes} min` : ""}
    </span>
  );
}

/** Monday/Tuesday recap of last week — the peak-end of every training week. */
function RecapCard() {
  const state = useApp();
  const [dismissed, setDismissed] = useState(false);
  const weekday = new Date(todayStr() + "T12:00:00").getDay();
  if (weekday !== 1 && weekday !== 2) return null;
  const recap = lastWeekRecap(state, new Date(todayStr() + "T12:00:00"));
  if (!recap || dismissed) return null;
  if (typeof window !== "undefined" && window.localStorage.getItem(`recap-${recap.weekKey}`) === "1")
    return null;
  const dismiss = () => {
    window.localStorage.setItem(`recap-${recap.weekKey}`, "1");
    setDismissed(true);
  };
  const vol = recap.volumeKg >= 1000 ? `${(recap.volumeKg / 1000).toFixed(1)}t` : `${recap.volumeKg} kg`;
  return (
    <div className="tile-dark mt-4 p-5">
      <div className="dot-texture text-ink" />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="label-mono text-faint">Last week</div>
          <button onClick={dismiss} aria-label="dismiss recap" className="pressable -mr-1 -mt-1 p-1 text-faint">
            <X size={14} />
          </button>
        </div>
        <div className="mt-2 flex items-end gap-6">
          <div>
            <div className="text-[26px] font-light leading-none tabular-nums">{recap.workouts}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-faint">workouts</div>
          </div>
          <div>
            <div className="text-[26px] font-light leading-none tabular-nums">{vol}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-faint">lifted</div>
          </div>
          {recap.avgScore !== null && (
            <div>
              <div className="text-[26px] font-light leading-none tabular-nums">
                {Math.round(recap.avgScore * 100)}%
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-faint">focus</div>
            </div>
          )}
        </div>
        {recap.volumeDeltaPct !== null && (
          <div className={`mt-3 text-[12px] font-medium ${recap.volumeDeltaPct >= 0 ? "text-good" : "text-warn"}`}>
            {recap.volumeDeltaPct >= 0 ? "+" : ""}
            {recap.volumeDeltaPct}% volume vs the week before
          </div>
        )}
      </div>
    </div>
  );
}

/** Every Nth week per the plan's template: back off so the next block hits harder. */
function DeloadBanner() {
  const state = useApp();
  const t = state.profile.training;
  if (!t?.planStartedAt || !t.deloadWeeks) return null;
  const weeks = Math.floor(
    (new Date(todayStr()).getTime() - new Date(t.planStartedAt).getTime()) / (7 * 86400000),
  );
  if (weeks <= 0 || (weeks + 1) % t.deloadWeeks !== 0) return null;
  return (
    <Card className="mt-4 flex items-center gap-3 !p-4 border-warn/25">
      <Battery size={17} className="shrink-0 text-warn" />
      <div className="text-[13px] leading-snug">
        <span className="font-semibold">Deload week.</span>{" "}
        <span className="text-dim">Halve your working sets, keep every rep crisp — growth happens in the recovery.</span>
      </div>
    </Card>
  );
}

/** Water, sleep and mood — logged from Home in a few taps. */
function CheckInCard() {
  const state = useApp();
  const today = todayStr();
  const rec = state.recovery.find((r) => r.date === today);
  const journal = state.journal.find((j) => j.date === today);
  const water = rec?.waterMl ?? 0;

  const patchRecovery = (fields: Partial<NonNullable<typeof rec>>) =>
    update((draft) => {
      let e = draft.recovery.find((r) => r.date === today);
      if (!e) {
        e = { date: today };
        draft.recovery.push(e);
      }
      Object.assign(e, fields);
    });

  const setMood = (mood: string) =>
    update((draft) => {
      let j = draft.journal.find((x) => x.date === today);
      if (!j) {
        j = { date: today, energy: 0, sleepH: 0, mood: "", notes: "" };
        draft.journal.push(j);
      }
      j.mood = j.mood === mood ? "" : mood;
    });

  const chip = (active: boolean) =>
    `pressable shrink-0 rounded-xl border px-2.5 py-1.5 text-xs font-bold tabular-nums ${
      active ? "border-accent/40 bg-accent/15 text-ink" : "border-line bg-elev text-faint"
    }`;

  return (
    <Card className="!p-4">
      {/* water — +/− so a mistaken tap is reversible */}
      <div className="flex items-center gap-3">
        <Droplets size={18} className="shrink-0 text-viz2" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">
            Water <span className="text-faint">· {water} ml</span>
          </div>
          <Meter ratio={water / state.profile.waterGoalMl} className="mt-1.5" color="var(--color-viz2)" />
        </div>
        <button
          onClick={() => patchRecovery({ waterMl: Math.max(0, water - 250) })}
          aria-label="remove 250 ml"
          className="pressable rounded-xl border border-line bg-elev px-2.5 py-2 text-xs font-bold text-faint"
        >
          −
        </button>
        <button
          onClick={() => patchRecovery({ waterMl: water + 250 })}
          className="pressable rounded-xl border border-line bg-elev px-3 py-2 text-xs font-bold text-dim"
        >
          +250
        </button>
        <button
          onClick={() => patchRecovery({ waterMl: water + 500 })}
          className="pressable rounded-xl border border-line bg-elev px-3 py-2 text-xs font-bold text-dim"
        >
          +500
        </button>
      </div>

      {/* sleep — scrollable range, tap again to clear */}
      <div className="mt-4 flex items-center gap-3">
        <Moon size={18} className="shrink-0 text-viz1" />
        <div className="text-[13px] font-semibold">Sleep</div>
        <div className="-mr-4 flex flex-1 gap-1.5 overflow-x-auto pr-4 [scrollbar-width:none]">
          {[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((h) => (
            <button
              key={h}
              onClick={() => patchRecovery({ sleepH: rec?.sleepH === h ? undefined : h })}
              className={chip(rec?.sleepH === h)}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* steps — no pedometer API on the web, so entry is 1 tap */}
      <div className="mt-4 flex items-center gap-3">
        <Footprints size={18} className="shrink-0 text-viz3" />
        <div className="text-[13px] font-semibold">Steps</div>
        <div className="-mr-4 flex flex-1 gap-1.5 overflow-x-auto pr-4 [scrollbar-width:none]">
          {[3000, 4000, 5000, 6000, 8000, 10000, 12000, 15000].map((n) => (
            <button
              key={n}
              onClick={() => patchRecovery({ steps: rec?.steps === n ? undefined : n })}
              className={chip(rec?.steps === n)}
            >
              {n / 1000}k
            </button>
          ))}
        </div>
      </div>

      {/* mood — glyph faces, tap again to clear */}
      <div className="mt-4 flex items-center gap-3">
        <Smile size={18} className="shrink-0 text-warn" />
        <div className="text-[13px] font-semibold">Mood</div>
        <div className="flex flex-1 justify-end gap-1.5">
          {MOODS.map((mo) => (
            <button
              key={mo}
              onClick={() => setMood(mo)}
              aria-label={`mood ${mo}`}
              className={`pressable rounded-xl border px-2 py-1.5 ${
                journal?.mood === mo ? "border-accent/40 bg-accent/10" : "border-transparent"
              }`}
            >
              <GlyphMatrix
                frames={[MOOD_GLYPHS[mo]]}
                cell={2.4}
                color={journal?.mood === mo ? "var(--color-accent)" : "var(--color-faint)"}
              />
            </button>
          ))}
        </div>
      </div>

      {(rec?.sleepH || water > 0 || rec?.steps || journal?.mood) && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-good">
          <Check size={12} strokeWidth={3} /> Logged for today
        </div>
      )}
    </Card>
  );
}
