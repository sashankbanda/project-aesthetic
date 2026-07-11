"use client";
// ============================================================
// App tour — Photoshop-style coach marks. A dimmed overlay with
// a spotlight cutout walks through the Home screen and the tab
// bar. Auto-runs once after onboarding; restartable from More.
// Skippable at every step (Hick's law: guidance, never a cage).
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useApp } from "@/lib/store";

const DONE_KEY = "aesthetic-tour-done";
const REQUEST_KEY = "aesthetic-tour-request";

/** More page calls this, then navigates home — the tour picks it up there. */
export function requestTour() {
  try {
    window.sessionStorage.setItem(REQUEST_KEY, "1");
  } catch {
    /* private mode — tour just won't auto-start */
  }
}

interface Step {
  target: string; // [data-tour=...]
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    target: "hero",
    title: "Today, decided for you",
    text: "Your plan puts the right workout here every day. One tap starts it — sets, reps and weights come pre-filled.",
  },
  {
    target: "stats",
    title: "Your vitals",
    text: "Streak, weight and protein at a glance. The streak turns orange — keep it alive.",
  },
  {
    target: "checkin",
    title: "Two-second check-ins",
    text: "Water, sleep, steps and mood — everything logs with a single tap, and taps are reversible.",
  },
  {
    target: "tab-train",
    title: "Train",
    text: "Your workout tracker: tick sets, auto rest timer, Gym Mode for barely touching the phone.",
  },
  {
    target: "tab-fuel",
    title: "Fuel",
    text: "Protein tracking with one-tap foods — and budget-friendly suggestions to close the gap.",
  },
  {
    target: "tab-progress",
    title: "Progress",
    text: "Measurements, progress photos (they never leave your device) and analytics like your recovery map.",
  },
  {
    target: "tab-more",
    title: "Everything else",
    text: "AI coach, plan switching, themes, reminders, backups. Retake this tour from here anytime.",
  },
];

export default function AppTour() {
  const state = useApp();
  const [idx, setIdx] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // start: explicit request (from More) or first Home visit after onboarding
  useEffect(() => {
    const requested = window.sessionStorage.getItem(REQUEST_KEY) === "1";
    const done = window.localStorage.getItem(DONE_KEY) === "1";
    if (requested) {
      window.sessionStorage.removeItem(REQUEST_KEY);
      const t = setTimeout(() => setIdx(0), 400);
      return () => clearTimeout(t);
    }
    if (!done && state.onboarded && state.sessions.length === 0) {
      const t = setTimeout(() => setIdx(0), 800); // let the page settle first
      return () => clearTimeout(t);
    }
  }, [state.onboarded, state.sessions.length]);

  const finish = useCallback(() => {
    window.localStorage.setItem(DONE_KEY, "1");
    setIdx(null);
  }, []);
  const next = useCallback(() => {
    if (idx !== null && idx >= STEPS.length - 1) finish();
    else setIdx((i) => (i === null ? null : i + 1));
  }, [idx, finish]);

  // measure the current target (skipping steps whose element isn't on screen)
  useEffect(() => {
    if (idx === null || idx >= STEPS.length) return;
    const el = document.querySelector(`[data-tour="${STEPS[idx].target}"]`);
    if (!el) {
      // e.g. tab bar steps on desktop — move on (async: effects must not set state directly)
      const skip = setTimeout(next, 0);
      return () => clearTimeout(skip);
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    let raf = 0;
    const measure = () => setRect(el.getBoundingClientRect());
    const t = setTimeout(() => {
      raf = requestAnimationFrame(measure);
    }, 350); // after the smooth scroll settles
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [idx, next]);

  if (idx === null || idx >= STEPS.length || !rect) return null;
  const step = STEPS[idx];

  const pad = 8;
  const top = Math.max(0, rect.top - pad);
  const left = Math.max(0, rect.left - pad);
  const width = Math.min(window.innerWidth - left, rect.width + pad * 2);
  const height = rect.height + pad * 2;
  // card above or below the spotlight, whichever half has room
  const cardBelow = rect.top + rect.height / 2 < window.innerHeight / 2;

  return createPortal(
    <div className="fixed inset-0 z-[90]" role="dialog" aria-label="app tour">
      {/* spotlight: one hole, everything else dimmed */}
      <div
        className="absolute rounded-3xl transition-all duration-300"
        style={{
          top,
          left,
          width,
          height,
          boxShadow: "0 0 0 9999px color-mix(in srgb, var(--color-bg) 82%, transparent)",
        }}
      />
      {/* click-shield so taps don't hit the page mid-tour */}
      <button aria-label="next" className="absolute inset-0 cursor-default" onClick={next} />

      <div
        className="absolute inset-x-4 mx-auto max-w-sm"
        style={cardBelow ? { top: top + height + 14 } : { bottom: window.innerHeight - top + 14 }}
      >
        <div className="rise-in card relative p-5 shadow-2xl">
          <div className="label-mono mb-1.5 flex items-center gap-2 text-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {idx + 1} / {STEPS.length}
          </div>
          <div className="text-[17px] font-medium">{step.title}</div>
          <p className="mt-1 text-[13px] font-light leading-relaxed text-dim">{step.text}</p>

          <div className="mt-4 flex items-center gap-2">
            {/* dot progress (goal-gradient: the end is visibly close) */}
            <div className="flex flex-1 gap-1.5">
              {STEPS.map((_, i) => (
                <span key={i} className={`h-1 w-4 rounded-full ${i <= idx ? "bg-accent" : "bg-card2"}`} />
              ))}
            </div>
            {idx > 0 && (
              <button onClick={() => setIdx(idx - 1)} aria-label="back" className="pressable grid h-11 w-11 place-items-center rounded-full border border-line text-dim">
                <ArrowLeft size={16} />
              </button>
            )}
            <button
              onClick={next}
              className="bg-grad pressable flex h-11 items-center gap-1.5 rounded-full px-5 text-[13px] font-medium text-white"
            >
              {idx === STEPS.length - 1 ? "Done" : "Next"} <ArrowRight size={14} />
            </button>
          </div>
          <button onClick={finish} aria-label="skip tour" className="pressable absolute right-3 top-3 flex items-center gap-1 p-1.5 text-[11px] font-semibold text-faint">
            Skip <X size={13} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
