"use client";
import { useMemo, useState } from "react";
import Mounted from "@/components/mounted";
import MuscleMap from "@/components/muscle-map";
import LiteVideo from "@/components/lite-video";
import ExerciseMedia from "@/components/exercise-media";
import HomeAlt from "@/components/home-alt";
import { Card, PageHead, Pill, inputCls } from "@/components/ui";
import { EXERCISES } from "@/lib/seed";
import { prFor } from "@/lib/overload";
import { useApp } from "@/lib/store";
import type { Exercise, MuscleGroup } from "@/lib/types";
import { AlertTriangle, Check, ChevronDown, Play, Repeat, Search, TrendingUp } from "lucide-react";

const GROUPS: (MuscleGroup | "All")[] = [
  "All",
  "Upper Chest",
  "Mid Chest",
  "Side Delts",
  "Front Delts",
  "Rear Delts",
  "Lats",
  "Upper Back",
  "Traps",
  "Biceps",
  "Triceps",
  "Forearms",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Abs",
  "Lower Back",
];

export default function LibraryPage() {
  return (
    <Mounted>
      <LibraryInner />
    </Mounted>
  );
}

function LibraryInner() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("All");

  const filtered = useMemo(
    () =>
      EXERCISES.filter(
        (e) =>
          (group === "All" || e.primary === group || e.secondary.includes(group as MuscleGroup)) &&
          e.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, group],
  );

  return (
    <>
      <PageHead
        eyebrow="Knowledge"
        title="Exercise Library"
        sub="Every movement in your plan — form cues, mistakes, alternatives, progression."
      />

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          className={inputCls + " !pl-10"}
          placeholder="Search exercises…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1.5">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              group === g ? "border-accent/40 bg-accent/15 text-ink" : "border-line text-dim hover:text-ink"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid gap-3.5">
        {filtered.map((e) => (
          <ExerciseEntry key={e.id} ex={e} />
        ))}
        {filtered.length === 0 && (
          <Card className="py-8 text-center text-sm text-faint">No exercises match.</Card>
        )}
      </div>
    </>
  );
}

function ExerciseEntry({ ex }: { ex: Exercise }) {
  const [open, setOpen] = useState(false);
  const state = useApp();
  const pr = prFor(state, ex.id);
  return (
    <div className="card overflow-hidden">
      <button className="flex w-full items-center gap-3.5 p-4 text-left" onClick={() => setOpen(!open)}>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{ex.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-faint">
            <Pill tone="accent">{ex.primary}</Pill>
            {ex.secondary.map((s) => (
              <Pill key={s}>{s}</Pill>
            ))}
            <span className="ml-1">{ex.equipment}</span>
          </div>
        </div>
        {pr && pr.weight > 0 && (
          <div className="shrink-0 text-right text-xs">
            <div className="font-bold tabular-nums">{pr.weight} kg</div>
            <div className="text-faint">PR × {pr.reps}</div>
          </div>
        )}
        <ChevronDown size={17} className={`text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="grid gap-2.5 border-t border-line/40 px-4 pb-4 pt-3.5">
          {ex.videoId ? (
            <LiteVideo videoId={ex.videoId} title={`${ex.name} — demo`} />
          ) : (
            <a
              href={ex.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="pressable flex items-center justify-center gap-2 rounded-full border border-line bg-card2 py-3 text-[13px] font-medium"
            >
              <Play size={15} /> Watch video demo
            </a>
          )}
          <MuscleMap primary={ex.primary} secondary={ex.secondary} />
          <ExerciseMedia ex={ex} />
          <Info icon={<Check size={12} />} title="Form cues" items={ex.cues} />
          <Info icon={<AlertTriangle size={12} />} title="Common mistakes" items={ex.mistakes} />
          <Info icon={<Repeat size={12} />} title="Alternatives" items={ex.alternatives} />
          <HomeAlt ex={ex} />
          <div className="rounded-xl border border-line bg-elev px-3.5 py-2.5">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-accent2">
              <TrendingUp size={12} /> Progression
            </div>
            <p className="text-[13px] text-dim">{ex.progression}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-line bg-elev px-3.5 py-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-accent2">
        {icon} {title}
      </div>
      <ul className="list-inside list-disc space-y-0.5 text-[13px] text-dim">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
