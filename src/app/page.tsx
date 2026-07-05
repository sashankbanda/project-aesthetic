"use client";
import Link from "next/link";
import Mounted from "@/components/mounted";
import SyncNudge from "@/components/sync-nudge";
import { Card, Meter, Pill, SectionTitle, Tile } from "@/components/ui";
import { FLAME_FRAMES, GlyphMatrix, MOOD_GLYPHS } from "@/components/glyph";
import { Sparkline } from "@/components/charts";
import { useApp, todayStr, update } from "@/lib/store";
import { weeklyCompletion, workoutStreak } from "@/lib/overload";
import { latestMeasurement, proteinForDate } from "@/lib/stats";
import {
  ArrowRight,
  Check,
  CheckCheck,
  Droplets,
  Footprints,
  Moon,
  Smile,
  Target,
} from "lucide-react";

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

      {/* coach focus */}
      <SectionTitle>Coach&apos;s focus</SectionTitle>
      <Card className="!p-4">
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((p, i) => (
            <Pill key={p} tone={i < 4 ? "accent" : "default"}>
              <span className="font-bold">{i + 1}</span> {p}
            </Pill>
          ))}
        </div>
      </Card>
    </>
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
