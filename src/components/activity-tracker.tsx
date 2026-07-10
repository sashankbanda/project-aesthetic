"use client";
// ============================================================
// Own exercises — stretching, planks, hangs, anything unplanned.
// Pick a name (chips build themselves from everything you've ever
// logged) or type a new one, run the stopwatch, done. Entries
// sync like all other data.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Play, Square, X } from "lucide-react";
import DotNumber from "./dot-number";
import { Card } from "./ui";
import { todayStr, update, useApp } from "@/lib/store";
import { haptic } from "@/lib/fx";
import { fmtDuration } from "@/lib/session-time";

/** starter suggestions until the user's own history takes over */
const STARTERS = ["Stretching", "Plank", "Dead Hang", "Walking", "Foam Rolling"];

export default function ActivityTracker() {
  const state = useApp();
  const today = todayStr();
  const [name, setName] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef<number | null>(null);

  // chips: your own names first (most recent), starters fill the gaps
  const seen = new Set<string>();
  const ownNames: string[] = [];
  for (const a of [...(state.activities ?? [])].sort((x, y) => y.at.localeCompare(x.at))) {
    const key = a.name.trim();
    if (key && !seen.has(key.toLowerCase())) {
      seen.add(key.toLowerCase());
      ownNames.push(key);
    }
  }
  const chips = [...ownNames, ...STARTERS.filter((s) => !seen.has(s.toLowerCase()))].slice(0, 10);

  useEffect(() => {
    startedRef.current = startedAt;
    if (startedAt === null) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [startedAt]);

  const start = () => {
    if (!name.trim()) return;
    haptic();
    setElapsed(0);
    setStartedAt(Date.now());
  };

  const stop = () => {
    const began = startedRef.current;
    setStartedAt(null);
    if (began === null) return;
    const seconds = Math.max(1, Math.round((Date.now() - began) / 1000));
    haptic([60, 40, 60]);
    const label = name.trim().slice(0, 60);
    update((draft) => {
      draft.activities.push({
        id: `${today}_${began}`,
        date: today,
        name: label,
        seconds,
        at: new Date().toISOString(),
      });
    });
  };

  const remove = (id: string) =>
    update((draft) => {
      draft.activities = draft.activities.filter((a) => a.id !== id);
    });

  const todays = (state.activities ?? []).filter((a) => a.date === today);
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, "0");
  const running = startedAt !== null;

  return (
    <Card className="!p-4">
      {running ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="label-mono text-faint">{name.trim()}</div>
          <DotNumber value={`${mm}:${ss}`} cell={mm >= 10 ? 5 : 6.5} ghost={false} />
          <button
            onClick={stop}
            className="bg-grad pressable flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium text-white shadow-lg shadow-accent/25"
          >
            <Square size={15} /> Stop &amp; save
          </button>
        </div>
      ) : (
        <>
          {/* recognition over recall: your history IS the picker */}
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2.5 [scrollbar-width:none]">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => setName(name.trim() === c ? "" : c)}
                className={`pressable h-9 shrink-0 rounded-xl border px-3.5 text-xs font-semibold ${
                  name.trim() === c ? "border-accent/40 bg-accent/15 text-ink" : "border-line bg-elev text-dim"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-xl border border-line bg-elev px-3.5 py-3 text-[14px] text-ink outline-none transition focus:border-accent"
              placeholder="Or type a new one…"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && start()}
            />
            <button
              onClick={start}
              disabled={!name.trim()}
              aria-label="start stopwatch"
              className="bg-grad pressable grid w-14 shrink-0 place-items-center rounded-xl text-white shadow-lg shadow-accent/25 disabled:opacity-40"
            >
              <Play size={17} />
            </button>
          </div>
        </>
      )}

      {todays.length > 0 && (
        <div className="mt-3.5 grid gap-1.5 border-t border-line/40 pt-3">
          {todays.map((a) => (
            <div key={a.id} className="flex items-center gap-2.5 text-[13px]">
              <span className="min-w-0 flex-1 truncate text-dim">{a.name}</span>
              <span className="font-bold tabular-nums">{fmtDuration(a.seconds)}</span>
              <button onClick={() => remove(a.id)} aria-label={`delete ${a.name}`} className="pressable p-1 text-faint">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
