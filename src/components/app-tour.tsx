"use client";
// ============================================================
// Tour engine — builds Quick (30s essentials) and Full (every
// feature, page by page) tours from lib/tour-registry.ts. It
// navigates between pages, waits for each target to render,
// spotlights it, and silently skips targets that don't exist
// (conditional features, desktop layouts).
//
// Mounted once in the Shell. New features only need a registry
// stop + a data-tour attribute — the coverage test enforces it.
// ============================================================
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { TOUR_STOPS, type TourStop } from "@/lib/tour-registry";
import { useApp } from "@/lib/store";

const DONE_KEY = "aesthetic-tour-done";
const REQUEST_KEY = "aesthetic-tour-request";

export type TourMode = "quick" | "full";

/** call from anywhere, then navigate — the engine picks it up */
export function requestTour(mode: TourMode) {
  try {
    window.sessionStorage.setItem(REQUEST_KEY, mode);
  } catch {
    /* private mode — tour just won't auto-start */
  }
}

export default function AppTour() {
  const state = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [steps, setSteps] = useState<TourStop[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // start: explicit request wins; otherwise auto quick-tour once after onboarding
  useEffect(() => {
    const requested = window.sessionStorage.getItem(REQUEST_KEY) as TourMode | null;
    if (requested === "quick" || requested === "full") {
      window.sessionStorage.removeItem(REQUEST_KEY);
      const t = setTimeout(() => {
        setIdx(0);
        setSteps(requested === "quick" ? TOUR_STOPS.filter((s) => s.quick) : TOUR_STOPS);
      }, 400);
      return () => clearTimeout(t);
    }
    if (
      window.localStorage.getItem(DONE_KEY) !== "1" &&
      state.onboarded &&
      state.sessions.length === 0 &&
      pathname === "/"
    ) {
      const t = setTimeout(() => {
        setIdx(0);
        setSteps(TOUR_STOPS.filter((s) => s.quick));
      }, 800);
      return () => clearTimeout(t);
    }
  }, [state.onboarded, state.sessions.length, pathname]);

  const finish = useCallback(() => {
    window.localStorage.setItem(DONE_KEY, "1");
    setSteps(null);
    setRect(null);
    setIdx(0);
  }, []);

  const next = useCallback(() => {
    if (!steps) return;
    if (idx >= steps.length - 1) finish();
    else {
      setRect(null);
      setIdx((i) => i + 1);
    }
  }, [steps, idx, finish]);

  const back = useCallback(() => {
    setRect(null);
    setIdx((i) => Math.max(0, i - 1));
  }, []);

  const step = steps?.[idx];

  // navigate to the step's page when needed
  useEffect(() => {
    if (step && pathname !== step.path) router.push(step.path);
  }, [step, pathname, router]);

  // wait for the target to exist (pages hydrate behind a skeleton), then measure
  useEffect(() => {
    if (!step || pathname !== step.path) return;
    let tries = 0;
    let raf = 0;
    const poll = setInterval(() => {
      const el = document.querySelector(`[data-tour="${step.key}"]`);
      if (el) {
        clearInterval(poll);
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          raf = requestAnimationFrame(() => setRect(el.getBoundingClientRect()));
        }, 350);
      } else if (++tries > 16) {
        clearInterval(poll);
        next(); // target doesn't exist here — skip the stop
      }
    }, 150);
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.key}"]`);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", measure);
    return () => {
      clearInterval(poll);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [step, pathname, next]);

  if (!steps || !step || !rect) return null;

  const pad = 8;
  const top = Math.max(0, rect.top - pad);
  const left = Math.max(0, rect.left - pad);
  const width = Math.min(window.innerWidth - left, rect.width + pad * 2);
  const height = rect.height + pad * 2;
  const cardBelow = rect.top + rect.height / 2 < window.innerHeight / 2;

  return createPortal(
    <div className="fixed inset-0 z-[90]" role="dialog" aria-label="app tour">
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
            {idx + 1} / {steps.length}
          </div>
          <div className="text-[17px] font-medium">{step.title}</div>
          <p className="mt-1 text-[13px] font-light leading-relaxed text-dim">{step.text}</p>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex flex-1 flex-wrap gap-1.5">
              {steps.map((_, i) => (
                <span key={i} className={`h-1 w-3 rounded-full ${i <= idx ? "bg-accent" : "bg-card2"}`} />
              ))}
            </div>
            {idx > 0 && (
              <button onClick={back} aria-label="back" className="pressable grid h-11 w-11 place-items-center rounded-full border border-line text-dim">
                <ArrowLeft size={16} />
              </button>
            )}
            <button
              onClick={next}
              className="bg-grad pressable flex h-11 items-center gap-1.5 rounded-full px-5 text-[13px] font-medium text-white"
            >
              {idx === steps.length - 1 ? "Done" : "Next"} <ArrowRight size={14} />
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
