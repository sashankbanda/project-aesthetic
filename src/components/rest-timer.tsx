"use client";
// Global rest timer — a floating pill, not a modal. Resting is not a
// reason to lock someone out of their own app: the pill follows them
// across every page (mounted in Shell), keeps counting, and announces
// the end with chime + haptics + an accent flare. Gym Mode keeps its
// own immersive full-screen timer by design.
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { chime, haptic } from "@/lib/fx";

interface RestState {
  id: number;
  label: string;
  /** total seconds (grows with +30) — drives the ring */
  total: number;
  deadline: number;
}

let rest: RestState | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** start (or restart) the rest countdown — callable from anywhere */
export function startRest(seconds: number, label: string) {
  rest = { id: Date.now(), label, total: seconds, deadline: Date.now() + seconds * 1000 };
  emit();
}

export function skipRest() {
  rest = null;
  emit();
}

function addThirty() {
  if (!rest) return;
  rest = { ...rest, total: rest.total + 30, deadline: rest.deadline + 30_000 };
  emit();
}

export default function RestTimerHost() {
  const active = useSyncExternalStore(subscribe, () => rest, () => null);
  const [left, setLeft] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const l = Math.max(0, Math.ceil((active.deadline - Date.now()) / 1000));
      setLeft(l);
      if (l > 0) return;
      clearInterval(timer);
      chime();
      haptic([250, 120, 250]);
      setFinished(true);
      setTimeout(skipRest, 3000);
    };
    const timer = setInterval(tick, 250);
    const reset = () => setFinished(false);
    reset();
    tick();
    return () => clearInterval(timer);
  }, [active]);

  if (!active) return null;

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  const R = 13;
  const C = 2 * Math.PI * R;
  const ratio = active.total > 0 ? left / active.total : 0;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-[104px] z-[90] flex justify-center px-5 md:bottom-8">
      <div
        className={`pointer-events-auto rise-in flex max-w-full items-center gap-2.5 rounded-full border py-1.5 pl-2 pr-1.5 shadow-xl backdrop-blur-md transition-colors ${
          finished
            ? "animate-pulse border-accent bg-accent text-white shadow-accent/40"
            : "border-line bg-card/95 shadow-black/30"
        }`}
      >
        {finished ? (
          <button onClick={skipRest} className="pressable px-3 py-1 text-[13px] font-bold">
            Rest over — go!
          </button>
        ) : (
          <>
            <svg width="32" height="32" viewBox="0 0 32 32" className="-rotate-90 shrink-0">
              <circle cx="16" cy="16" r={R} fill="none" stroke="var(--color-line)" strokeWidth="2.5" />
              <circle
                cx="16" cy="16" r={R} fill="none"
                stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={`${C * ratio} ${C}`}
                style={{ transition: "stroke-dasharray 0.25s linear" }}
              />
            </svg>
            <span className="text-[15px] font-bold tabular-nums">
              {mm}:{ss}
            </span>
            <span className="label-mono max-w-[96px] truncate text-[8px] text-faint">{active.label}</span>
            <button
              onClick={addThirty}
              aria-label="add 30 seconds"
              className="pressable flex h-8 shrink-0 items-center gap-0.5 rounded-full border border-line bg-elev px-2.5 text-[11px] font-bold text-dim"
            >
              <Plus size={11} strokeWidth={3} />30s
            </button>
            <button
              onClick={skipRest}
              aria-label="skip rest"
              className="pressable grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-elev text-faint"
            >
              <X size={13} />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
