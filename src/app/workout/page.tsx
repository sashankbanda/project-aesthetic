"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Mounted from "@/components/mounted";
import DotNumber from "@/components/dot-number";
import { CHECK_FRAMES, DUMBBELL_FRAMES, GlyphMatrix, MOON_FRAMES, TROPHY_FRAMES } from "@/components/glyph";
import MuscleMap from "@/components/muscle-map";
import ExerciseMedia from "@/components/exercise-media";
import HomeAlt from "@/components/home-alt";
import { Btn, Card, Meter, PageHead, Pill, SectionTitle, Stepper } from "@/components/ui";
import ActivityTracker from "@/components/activity-tracker";
import { getState, todayStr, update, useApp } from "@/lib/store";
import { buildWorkoutReceipt, shareCard } from "@/lib/share-card";
import { adviseFor, historyFor, prFor } from "@/lib/overload";
import { rotatePlanOrder } from "@/lib/plan-engine";
import { Sparkline } from "@/components/charts";
import { chime, haptic, unlockAudio } from "@/lib/fx";
import { ensureSession, sessionId } from "@/lib/workout-session";
import GymMode from "@/components/gym-mode";
import { useGymPrefs } from "@/lib/gym-prefs";
import { EXERCISE_MAP, ACHIEVEMENTS } from "@/lib/seed";
import { evaluateAchievements } from "@/lib/stats";
import { analyzeSession, fmtDuration, type SessionTimeReport } from "@/lib/session-time";
import type { AppState, PlannedExercise, WorkoutDay, WorkoutSession } from "@/lib/types";
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Info,
  LogIn,
  Maximize2,
  MoreHorizontal,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Share2,
  StickyNote,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
  Undo2,
  X,
} from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WorkoutPage() {
  return (
    <Mounted>
      <WorkoutInner />
    </Mounted>
  );
}

/** Rest request — the pill component owns the actual countdown. */
interface RestRequest {
  id: number;
  seconds: number;
  label: string;
}

/**
 * After an undo, revoke achievements that were unlocked TODAY and no
 * longer hold (a mistaken "Finish" shouldn't leave badges behind).
 * Older, legitimately earned badges are never touched.
 */
function pruneTodayAchievements(draft: AppState) {
  const valid = new Set(evaluateAchievements(draft));
  const today = todayStr();
  for (const [id, date] of Object.entries(draft.unlocked)) {
    if (date === today && !valid.has(id)) delete draft.unlocked[id];
  }
}

function WorkoutInner() {
  const state = useApp();
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [rest, setRest] = useState<RestRequest | null>(null);
  // accordion: null = auto (first incomplete), -1 = all closed, n = user's pick
  const [openPick, setOpenPick] = useState<number | null>(null);
  const [prToast, setPrToast] = useState<{ id: number; name: string; weight: number } | null>(null);
  const gymPrefs = useGymPrefs();
  const [gym, setGym] = useState(false);
  const [reorder, setReorder] = useState(false);
  const [summary, setSummary] = useState<{
    report: SessionTimeReport | null;
    achievements: string[];
    session: WorkoutSession;
  } | null>(null);

  const weekday = new Date().getDay();
  const days = [...state.plan].sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7));
  const day =
    state.plan.find((d) => d.id === selectedDayId) ??
    state.plan.find((d) => d.weekday === weekday) ??
    days[0];

  const session = state.sessions.find((s) => s.id === sessionId(todayStr(), day.id));
  const totalSets = day.exercises.reduce((n, e) => n + e.workingSets, 0);
  const doneSets =
    session?.logs.reduce((n, l) => n + l.sets.filter((s) => s.done).length, 0) ?? 0;
  const allDone = totalSets > 0 && doneSets === totalSets && !session?.completedAt;

  // auto mode opens the first exercise with unfinished sets
  const firstIncomplete = day.exercises.findIndex((pe) => {
    const log = session?.logs.find((l) => l.exerciseId === pe.exerciseId);
    return (log?.sets.filter((s) => s.done).length ?? 0) < pe.workingSets;
  });
  const openIndex = openPick ?? (firstIncomplete === -1 ? null : firstIncomplete);

  const startRest = (seconds: number, label: string) =>
    setRest({ id: Date.now(), seconds, label });

  const skipRest = () => setRest(null);

  const checkIn = () => {
    haptic();
    update((draft) => {
      const s = ensureSession(draft, day);
      if (!s.startedAt) s.startedAt = new Date().toISOString();
    });
  };

  // ---------- mistake recovery ----------
  const [sheet, setSheet] = useState(false);

  const reopenWorkout = () => {
    update((draft) => {
      const s = draft.sessions.find((x) => x.id === sessionId(todayStr(), day.id));
      if (s) s.completedAt = undefined;
      pruneTodayAchievements(draft);
    });
    setSummary(null);
    setSheet(false);
  };

  const undoCheckIn = () => {
    update((draft) => {
      const s = draft.sessions.find((x) => x.id === sessionId(todayStr(), day.id));
      if (s) s.startedAt = undefined;
    });
    setSheet(false);
  };

  const clearSession = () => {
    update((draft) => {
      draft.sessions = draft.sessions.filter((x) => x.id !== sessionId(todayStr(), day.id));
      pruneTodayAchievements(draft);
    });
    setSummary(null);
    setSheet(false);
  };

  const finishWorkout = () => {
    const fresh: string[] = [];
    let finished: WorkoutSession | undefined;
    update((draft) => {
      const s = ensureSession(draft, day);
      const now = new Date().toISOString();
      if (!s.startedAt) s.startedAt = now;
      s.completedAt = now;
      for (const id of evaluateAchievements(draft)) {
        if (!draft.unlocked[id]) {
          draft.unlocked[id] = todayStr();
          fresh.push(id);
        }
      }
      finished = s;
    });
    haptic(200);
    skipRest();
    if (finished) {
      const report = analyzeSession(finished, day);
      const names = fresh
        .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
        .filter(Boolean)
        .map((a) => a!.name);
      setSummary({ report, achievements: names, session: finished });
    }
  };

  return (
    <>
      <PageHead
        eyebrow={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        title="Train"
        sub="Everything is pre-filled — just tap the check as you finish each set."
      />

      {/* day chips */}
      <div className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1.5 md:mx-0 md:px-0">
        <button
          onClick={() => setReorder(true)}
          aria-label="Shift workout order"
          data-tour="train-reorder"
          className="pressable grid w-11 shrink-0 place-items-center self-stretch rounded-2xl border border-line bg-card text-dim"
        >
          <ArrowLeftRight size={15} />
        </button>
        {days.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              setSelectedDayId(d.id);
              setOpenPick(null);
            }}
            className={`pressable shrink-0 rounded-2xl border px-4 py-2.5 text-left text-sm ${
              d.id === day.id
                ? "border-ink/30 bg-card2 font-medium text-ink"
                : "border-line bg-card font-light text-dim"
            } ${d.isRest ? "opacity-70" : ""}`}
          >
            {d.name}
            <span className="label-mono block text-[8px] text-faint">
              {WEEKDAYS[d.weekday]}
              {d.weekday === weekday ? " · today" : ""}
            </span>
          </button>
        ))}
      </div>

      {day.isRest ? (
        <Card className="py-12 text-center">
          <GlyphMatrix frames={MOON_FRAMES} fps={1.6} cell={5.5} className="mx-auto" />
          <div className="mt-4 text-xl font-light">Rest Day</div>
          <p className="mx-auto mt-2 max-w-sm text-sm font-light text-dim">
            Walk, stretch, hit your protein, sleep 8 hours. Growth happens here.
          </p>
        </Card>
      ) : (
        <>
          {/* progress strip — check-in / live session clock */}
          <Card className="mb-5 !p-4" data-tour="train-strip">
            <div className="flex items-center gap-3">
              {session?.startedAt ? (
                <ElapsedClock startedAt={session.startedAt} stoppedAt={session.completedAt} />
              ) : (
                <button
                  onClick={checkIn}
                  className="pressable flex items-center gap-2 rounded-xl bg-grad px-3.5 py-2 text-[13px] font-bold text-white shadow-lg shadow-accent/30"
                >
                  <LogIn size={15} /> Check in
                </button>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs text-faint">{day.focus}</div>
                <div className="flex items-center gap-1 text-[11px] text-faint">
                  <Clock size={11} /> plan ~{day.durationMin} min
                </div>
              </div>
              <div className="text-sm font-bold tabular-nums">
                {doneSets}<span className="text-faint">/{totalSets}</span>
              </div>
              {gymPrefs.enabled && !session?.completedAt && (
                <button
                  onClick={() => {
                    unlockAudio(); // user gesture — arms voice/chime for iOS
                    setGym(true);
                  }}
                  aria-label="Enter gym mode"
                  className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-accent"
                >
                  <Maximize2 size={15} />
                </button>
              )}
              {session && (
                <button
                  onClick={() => setSheet(true)}
                  aria-label="Session options"
                  className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line text-faint"
                >
                  <MoreHorizontal size={16} />
                </button>
              )}
            </div>
            <Meter ratio={totalSets ? doneSets / totalSets : 0} color="var(--color-viz2)" className="mt-3" />
          </Card>

          {day.exercises.map((pe, i) => (
            <ExerciseCard
              key={`${day.id}-${pe.exerciseId}-${i}`}
              planned={pe}
              index={i}
              day={day}
              session={session}
              open={openIndex === i}
              onToggle={() => setOpenPick(openIndex === i ? -1 : i)}
              onAllDone={() => setOpenPick(null)} // flow: auto-advance to the next unfinished exercise
              onPr={(name, weight) => setPrToast({ id: Date.now(), name, weight })}
              onSetDone={(restS, name) => startRest(restS, name)}
            />
          ))}

          <Btn
            variant="primary"
            className={`mt-5 w-full !py-4 text-base ${allDone ? "animate-pulse" : ""}`}
            onClick={finishWorkout}
            disabled={!!session?.completedAt}
          >
            {session?.completedAt ? (
              <>
                <CheckCheck size={18} /> Completed
              </>
            ) : (
              <>Finish Workout{allDone ? " — all sets done!" : ` (${doneSets}/${totalSets})`}</>
            )}
          </Btn>
          {session?.completedAt && (
            <button
              onClick={reopenWorkout}
              className="pressable mx-auto mt-3 flex items-center gap-1.5 text-xs font-semibold text-accent2"
            >
              <Undo2 size={13} /> Finished by mistake? Reopen workout
            </button>
          )}
        </>
      )}

      {/* own exercises — stretching, planks, hangs; works on rest days too */}
      <SectionTitle>Own exercises</SectionTitle>
      <div data-tour="train-own">
        <ActivityTracker />
      </div>

      {gym && !day.isRest && <GymMode day={day} onExit={() => setGym(false)} />}

      {prToast && <PrToast key={prToast.id} name={prToast.name} weight={prToast.weight} onDone={() => setPrToast(null)} />}

      {/* shift order sheet — the everyone-benches-on-Monday fix */}
      {reorder && (
        <ActionSheet onClose={() => setReorder(false)}>
          <p className="px-2 pb-3 text-[12px] font-light leading-relaxed text-dim">
            Gym crowded on certain days? Pick which workout opens your week — the rest follow in
            order, so recovery spacing stays intact.
          </p>
          {days
            .filter((d) => !d.isRest)
            .map((d) => (
              <SheetBtn
                key={d.id}
                icon={<ArrowLeftRight size={17} />}
                label={`Start the week with ${d.name}`}
                sub={d.focus}
                onClick={() => {
                  update((draft) => {
                    draft.plan = rotatePlanOrder(draft.plan, d.id);
                  });
                  setSelectedDayId(null);
                  setOpenPick(null);
                  setReorder(false);
                }}
              />
            ))}
        </ActionSheet>
      )}

      {/* session options sheet */}
      {sheet && (
        <ActionSheet onClose={() => setSheet(false)}>
          {session?.completedAt && (
            <SheetBtn icon={<Undo2 size={17} />} label="Reopen workout" sub="Clears the checkout — sets stay logged" onClick={reopenWorkout} />
          )}
          {session?.startedAt && !session?.completedAt && (
            <SheetBtn icon={<RotateCcw size={17} />} label="Undo check-in" sub="Resets the session clock — sets stay logged" onClick={undoCheckIn} />
          )}
          <SheetBtn
            icon={<Trash2 size={17} />}
            label="Clear today's session"
            sub="Removes every logged set for this day — cannot be undone"
            danger
            onClick={clearSession}
          />
        </ActionSheet>
      )}

      {/* rest timer popup — portal to <body>, always centered in view */}
      {rest && (
        <RestPopup
          key={rest.id}
          seconds={rest.seconds}
          label={rest.label}
          onDone={() => setRest(null)}
          onSkip={skipRest}
        />
      )}

      {/* checkout summary */}
      {summary && (
        <SessionSummary
          report={summary.report}
          achievements={summary.achievements}
          session={summary.session}
          onClose={() => setSummary(null)}
          onReopen={reopenWorkout}
        />
      )}
    </>
  );
}

// ------------------------------------------------------------
/** iOS-style bottom action sheet. */
function ActionSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center">
      <button aria-label="close" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="rise-in pb-safe relative w-full max-w-md p-4">
        <div className="card divide-y divide-line/40 overflow-hidden !rounded-3xl">{children}</div>
        <button
          onClick={onClose}
          className="pressable card mt-2.5 w-full !rounded-3xl py-3.5 text-center text-[15px] font-bold text-accent2"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}

function SheetBtn({
  icon,
  label,
  sub,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const handle = () => {
    if (danger && !confirming) {
      setConfirming(true);
      return;
    }
    onClick();
  };
  return (
    <button
      onClick={handle}
      className={`pressable flex w-full items-center gap-3.5 px-5 py-4 text-left ${
        danger ? "text-bad" : "text-ink"
      } ${confirming ? "bg-bad/10" : ""}`}
    >
      <span className={danger ? "text-bad" : "text-accent2"}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">
          {confirming ? "Tap again to confirm" : label}
        </span>
        {sub && !confirming && <span className="block text-xs text-faint">{sub}</span>}
        {confirming && <span className="block text-xs text-bad/70">This permanently deletes today&apos;s sets</span>}
      </span>
    </button>
  );
}

// ------------------------------------------------------------
/** Live session clock — isolated so ticking doesn't re-render the page. */
function ElapsedClock({ startedAt, stoppedAt }: { startedAt: string; stoppedAt?: string }) {
  const [now, setNow] = useState(() => Date.parse(startedAt));
  useEffect(() => {
    if (stoppedAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [stoppedAt]);
  const end = stoppedAt ? Date.parse(stoppedAt) : now;
  const s = Math.max(0, Math.floor((end - Date.parse(startedAt)) / 1000));
  const mm = Math.floor(s / 60);
  const hh = Math.floor(mm / 60);
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[15px] font-bold tabular-nums ${
        stoppedAt ? "border-good/30 bg-good/10 text-good" : "border-accent/30 bg-accent/10 text-ink"
      }`}
    >
      {stoppedAt ? (
        <Timer size={15} className="text-good" />
      ) : (
        /* live session — the dumbbell does reps inside the chip */
        <GlyphMatrix frames={DUMBBELL_FRAMES} fps={4} cell={1.9} color="var(--color-accent)" />
      )}
      {hh > 0 ? `${hh}:${String(mm % 60).padStart(2, "0")}:` : `${mm}:`}
      {String(s % 60).padStart(2, "0")}
    </div>
  );
}

// ------------------------------------------------------------
/** Post-checkout report: where did the time go, was it productive. */
function SessionSummary({
  report,
  achievements,
  session,
  onClose,
  onReopen,
}: {
  report: SessionTimeReport | null;
  achievements: string[];
  session: WorkoutSession;
  onClose: () => void;
  onReopen: () => void;
}) {
  const volume = Math.round(
    session.logs.reduce(
      (n, l) => n + l.sets.filter((s) => s.done).reduce((v, s) => v + s.weight * s.reps, 0),
      0,
    ),
  );
  const setsDone = session.logs.reduce((n, l) => n + l.sets.filter((s) => s.done).length, 0);

  const rows =
    report && report.hasTimestamps
      ? ([
          { label: "Lifting", value: report.liftS, color: "var(--color-good)" },
          { label: "Resting", value: report.restS, color: "var(--color-viz2)" },
          { label: "Wasted", value: report.wasteS, color: "var(--color-bad)" },
        ] as const)
      : null;

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center p-6">
      <button aria-label="close" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="rise-in card relative max-h-[85vh] w-full max-w-sm overflow-y-auto border-accent/25 p-6 shadow-2xl shadow-black/70">
        <div className="text-center">
          <GlyphMatrix frames={CHECK_FRAMES} fps={4} cell={5} color="var(--color-accent)" className="mx-auto" />
          <div className="mt-3 text-xl font-light">Workout Complete</div>
          {report && report.hasTimestamps && (
            <>
              <div className="mt-3 flex items-end justify-center gap-1.5">
                <DotNumber
                  value={`${Math.round(report.score * 100)}%`}
                  cell={7}
                  color={
                    report.score >= 0.7
                      ? "var(--color-good)"
                      : report.score >= 0.5
                        ? "var(--color-warn)"
                        : "var(--color-bad)"
                  }
                />
              </div>
              <div
                className={`mt-1.5 text-sm font-bold ${
                  report.score >= 0.7 ? "text-good" : report.score >= 0.5 ? "text-warn" : "text-bad"
                }`}
              >
                {report.verdict}
              </div>
            </>
          )}
        </div>

        {/* headline numbers */}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-elev p-3">
            <div className="text-lg font-bold tabular-nums">{report ? fmtDuration(report.totalS) : "—"}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-faint">Total</div>
          </div>
          <div className="rounded-2xl bg-elev p-3">
            <div className="text-lg font-bold tabular-nums">{setsDone}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-faint">Sets</div>
          </div>
          <div className="rounded-2xl bg-elev p-3">
            <div className="text-lg font-bold tabular-nums">
              {volume >= 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume}`}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-faint">
              {volume >= 1000 ? "Volume" : "Volume kg"}
            </div>
          </div>
        </div>

        {/* time split */}
        {rows && report && (
          <div className="mt-5">
            {/* stacked share bar */}
            <div className="flex h-3 overflow-hidden rounded-full bg-elev">
              {rows.map((r) =>
                r.value > 0 ? (
                  <div
                    key={r.label}
                    style={{
                      width: `${(r.value / Math.max(report.totalS, 1)) * 100}%`,
                      background: r.color,
                    }}
                    className="border-r-2 border-card last:border-r-0"
                  />
                ) : null,
              )}
            </div>
            <div className="mt-3 grid gap-1.5">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-2.5 text-[13px]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                  <span className="flex-1 text-dim">{r.label}</span>
                  <span className="font-bold tabular-nums">{fmtDuration(r.value)}</span>
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-faint">
              Estimated from your check-in time and when you ticked each set. Rest within your
              planned timer counts as productive — &ldquo;wasted&rdquo; is time beyond it.
            </p>
          </div>
        )}

        {!report?.hasTimestamps && (
          <p className="mt-4 text-center text-xs text-faint">
            Check in at the start of your next session to get the full time breakdown.
          </p>
        )}

        {achievements.length > 0 && (
          <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-warn/25 bg-warn/10 px-4 py-3">
            <GlyphMatrix frames={TROPHY_FRAMES} fps={3} cell={3.2} color="var(--color-warn)" className="shrink-0" />
            <div>
              <div className="label-mono text-[9px] text-warn">Unlocked</div>
              <div className="mt-0.5 text-[13px] text-ink">{achievements.join(" · ")}</div>
            </div>
          </div>
        )}

        <div className="mt-5 flex gap-2.5">
          <Btn
            variant="ghost"
            className="flex-1"
            onClick={() => {
              const state = getState();
              const day = state.plan.find((d) => d.id === session.dayId);
              void buildWorkoutReceipt(state, session, day).then((blob) =>
                shareCard(blob, `workout-${session.date}.png`, "Paid in full — in sweat."),
              );
            }}
          >
            <Share2 size={15} /> Share
          </Btn>
          <Btn variant="primary" className="flex-1" onClick={onClose}>
            Done
          </Btn>
        </div>
        <button
          onClick={onReopen}
          className="pressable mx-auto mt-3 flex items-center gap-1.5 text-xs font-semibold text-faint"
        >
          <Undo2 size={13} /> Finished by mistake? Reopen workout
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ------------------------------------------------------------
/**
 * Centered rest-timer popup. Rendered via portal to <body> so it can
 * never be trapped inside a scrolling/transformed container. Owns its
 * interval so the page doesn't re-render every tick, counts against a
 * wall-clock deadline (accurate through phone lock), and alerts with
 * chime + vibration when the rest is over.
 */
function RestPopup({
  seconds,
  label,
  onDone,
  onSkip,
}: {
  seconds: number;
  label: string;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [left, setLeft] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  const [finished, setFinished] = useState(false);
  const deadlineRef = useRef(0);
  const done = useRef(onDone);

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    deadlineRef.current = Date.now() + seconds * 1000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        chime();
        haptic([250, 120, 250]);
        setFinished(true);
        setTimeout(() => done.current(), 1600);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [seconds]);

  const addThirty = () => {
    deadlineRef.current += 30_000;
    setTotal((t) => t + 30);
    setLeft((l) => l + 30);
  };

  const R = 62;
  const C = 2 * Math.PI * R;
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center p-6">
      <button
        aria-label="dismiss"
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onSkip}
      />
      <div className="rise-in tile-dark relative w-full max-w-xs p-7 text-center shadow-2xl shadow-black/80">
        <div className="dot-texture text-ink" />
        <div className="relative">
          <div className="relative mx-auto grid h-40 w-40 place-items-center">
            {/* dotted progress ring — accent sweeps as rest elapses */}
            <svg viewBox="0 0 140 140" className="absolute inset-0 -rotate-90">
              <circle
                cx="70" cy="70" r={R} fill="none"
                stroke="color-mix(in srgb, var(--color-ink) 14%, transparent)" strokeWidth="3"
                strokeLinecap="round" strokeDasharray="0.5 7.5"
              />
              <circle
                cx="70" cy="70" r={R} fill="none"
                stroke={finished ? "var(--color-accent)" : "var(--color-ink)"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${C * (finished ? 1 : left / total)} ${C}`}
                style={{ transition: "stroke-dasharray 0.25s linear, stroke 0.3s" }}
              />
            </svg>
            {finished ? (
              <GlyphMatrix frames={CHECK_FRAMES} fps={5} cell={7} color="var(--color-accent)" />
            ) : (
              <DotNumber value={`${mm}:${ss}`} cell={mm >= 10 ? 4.5 : 5.5} ghost={false} />
            )}
          </div>

          <div className="mt-4 text-[15px] font-medium">
            {finished ? "Rest over — go" : "Resting"}
          </div>
          <div className="label-mono mt-1 truncate text-[9px] text-faint">{label}</div>

          {!finished && (
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={addThirty}
                className="pressable flex-1 rounded-full border border-line bg-card2 py-3 text-sm font-medium text-ink"
              >
                +30s
              </button>
              <button
                onClick={onSkip}
                className="bg-grad pressable flex-1 rounded-full py-3 text-sm font-medium text-white shadow-lg shadow-accent/25"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ------------------------------------------------------------
function ExerciseCard({
  planned,
  index,
  day,
  session,
  open,
  onToggle,
  onAllDone,
  onPr,
  onSetDone,
}: {
  planned: PlannedExercise;
  index: number;
  day: WorkoutDay;
  session?: WorkoutSession;
  open: boolean;
  onToggle: () => void;
  onAllDone: () => void;
  onPr: (name: string, weight: number) => void;
  onSetDone: (restSeconds: number, exerciseName: string) => void;
}) {
  const state = useApp();
  const [showInfo, setShowInfo] = useState(false);
  const [editingSet, setEditingSet] = useState<number | null>(null);
  // set stopwatch: start before the set, stop via ✓ — real duration gets recorded
  const [timing, setTiming] = useState<{ setIdx: number; startedAt: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!timing) return;
    const tick = () => setElapsed(Math.floor((Date.now() - timing.startedAt) / 1000));
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [timing]);
  const ex = EXERCISE_MAP[planned.exerciseId];
  const log = session?.logs.find((l) => l.exerciseId === planned.exerciseId);
  const advice = adviseFor(state, planned, { excludeSessionId: session?.id });
  const pr = prFor(state, planned.exerciseId);
  const doneCount = log?.sets.filter((s) => s.done).length ?? 0;
  const complete = doneCount === planned.workingSets && doneCount > 0;

  // bring the card into view when the accordion opens it (skip initial mount)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (open) cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [open]);

  const patchSet = (
    setIdx: number,
    patch: Partial<{ weight: number; reps: number; done: boolean; at: string; durationS: number }>,
  ) => {
    update((draft) => {
      const s = ensureSession(draft, day);
      const l = s.logs.find((x) => x.exerciseId === planned.exerciseId);
      const target = l?.sets[setIdx];
      if (target) Object.assign(target, patch);
      // ticking any set auto checks you in
      if (patch.done && !s.startedAt) s.startedAt = new Date().toISOString();
    });
  };

  const toggleSet = (setIdx: number) => {
    const row = log?.sets[setIdx];
    const willBeDone = !(row?.done ?? false);
    const durationS =
      willBeDone && timing?.setIdx === setIdx
        ? Math.min(3600, Math.max(1, Math.round((Date.now() - timing.startedAt) / 1000)))
        : undefined;
    if (timing?.setIdx === setIdx) setTiming(null);
    patchSet(setIdx, {
      done: willBeDone,
      ...(willBeDone ? { at: new Date().toISOString() } : {}),
      ...(durationS !== undefined ? { durationS } : {}),
    });
    if (willBeDone) {
      haptic();
      unlockAudio(); // user gesture — arms the completion chime for iOS
      setEditingSet(null);
      // beat your recorded best → celebrate (peak moments are what people remember)
      const w = row?.weight ?? 0;
      if (pr && pr.weight > 0 && w > pr.weight) onPr(ex?.name ?? "", w);
      if (doneCount + 1 === planned.workingSets) {
        onAllDone(); // exercise finished — accordion flows to the next one
      }
      onSetDone(planned.restSeconds, ex?.name ?? "");
    }
  };

  if (!ex) return null;

  // pre-filled defaults shown before a session exists
  const defaultWeight = advice.suggestedWeight ?? 0;

  return (
    <div ref={cardRef} className={`card mb-3 overflow-hidden transition ${complete ? "border-good/25" : ""}`}>
      {/* head */}
      <button className="pressable flex w-full items-center gap-3.5 p-4 text-left" onClick={onToggle}>
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-medium ${
            complete ? "bg-ink text-bg" : "bg-card2 text-dim"
          }`}
        >
          {complete ? <Check size={16} strokeWidth={2.6} /> : index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">{ex.name}</div>
          <div className="text-xs text-faint">
            {ex.primary} · {planned.workingSets}×{planned.repsMin}–{planned.repsMax} · rest {planned.restSeconds}s
          </div>
        </div>
        {!complete && doneCount > 0 && (
          <Pill>
            {doneCount}/{planned.workingSets}
          </Pill>
        )}
        <ChevronDown size={17} className={`shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-line/40 px-4 pb-4">
          {/* overload advice — a weight increase is THE signal, so it gets the accent */}
          <div
            className={`mt-3.5 flex items-start gap-2.5 rounded-2xl border px-3.5 py-2.5 text-[13px] leading-snug ${
              advice.kind === "increase"
                ? "border-accent/40 bg-accent/10 text-(--accent-soft)"
                : advice.kind === "hold"
                  ? "border-line bg-card2 text-warn"
                  : "border-line bg-card2 text-dim"
            }`}
          >
            {advice.kind === "increase" ? (
              <TrendingUp size={16} className="mt-0.5 shrink-0" />
            ) : advice.kind === "hold" ? (
              <Pause size={16} className="mt-0.5 shrink-0" />
            ) : (
              <Target size={16} className="mt-0.5 shrink-0" />
            )}
            <span>{advice.message}</span>
          </div>

          {pr && pr.weight > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-faint">
              <Trophy size={12} /> PR: {pr.weight} kg × {pr.reps}
              <HistorySpark exerciseId={planned.exerciseId} />
            </div>
          )}

          {/* set rows — ONE TAP to log */}
          <div className="mt-3 flex flex-col gap-2">
            {Array.from({ length: planned.workingSets }, (_, si) => {
              const row = log?.sets[si];
              const weight = row?.weight ?? defaultWeight;
              const reps = row?.reps ?? planned.repsMin;
              const done = row?.done ?? false;
              const editing = editingSet === si;
              const isTiming = timing?.setIdx === si;
              return (
                <div key={si} className={`rounded-2xl border transition ${done ? "border-ink/25 bg-ink/[0.04]" : isTiming ? "border-accent/40 bg-accent/[0.05]" : "border-line bg-elev"}`}>
                  <div className="flex items-center gap-3 px-3.5 py-2">
                    <span className="label-mono w-11 text-[9px] text-faint">Set {si + 1}</span>
                    <button
                      className="pressable flex-1 py-1.5 text-left text-[15px] font-bold tabular-nums"
                      onClick={() => setEditingSet(editing ? null : si)}
                    >
                      {ex.isBodyweight && weight === 0 ? "BW" : `${weight} kg`}
                      <span className="mx-1.5 text-faint">×</span>
                      {reps}
                      {isTiming ? (
                        <span className="ml-2 text-[12px] font-bold text-accent tabular-nums">
                          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
                        </span>
                      ) : done && row?.durationS ? (
                        <span className="ml-2 text-[10px] font-medium text-faint">{row.durationS}s</span>
                      ) : (
                        <span className="ml-2 text-[10px] font-medium text-faint">{editing ? "done" : "edit"}</span>
                      )}
                    </button>
                    {!done && (
                      <button
                        aria-label={isTiming ? `cancel set ${si + 1} stopwatch` : `start set ${si + 1} stopwatch`}
                        data-tour={index === 0 && si === 0 ? "train-set-timer" : undefined}
                        onClick={() => {
                          unlockAudio();
                          haptic();
                          setTiming(isTiming ? null : { setIdx: si, startedAt: Date.now() });
                        }}
                        className={`pressable grid h-11 w-11 shrink-0 place-items-center rounded-full border transition ${
                          isTiming ? "border-accent/50 bg-accent/15 text-accent" : "border-line bg-card text-faint"
                        }`}
                      >
                        {isTiming ? <X size={16} strokeWidth={2.5} /> : <Timer size={16} />}
                      </button>
                    )}
                    <button
                      aria-label={`Set ${si + 1} ${done ? "done" : isTiming ? "stop and finish" : "not done"}`}
                      onClick={() => toggleSet(si)}
                      className={`pressable grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 transition ${
                        done
                          ? "border-transparent bg-ink text-bg"
                          : isTiming
                            ? "border-accent bg-accent text-white"
                            : "border-line bg-card text-faint"
                      }`}
                    >
                      <Check size={19} strokeWidth={3} />
                    </button>
                  </div>
                  {editing && (
                    // stacked rows — side-by-side steppers overflow narrow phones
                    <div className="grid gap-2.5 border-t border-line/40 px-3.5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-faint">Weight</div>
                        <Stepper
                          value={weight}
                          step={ex.incrementKg || 2.5}
                          onChange={(v) => patchSet(si, { weight: v })}
                          suffix="kg"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-faint">Reps</div>
                        <Stepper value={reps} step={1} onChange={(v) => patchSet(si, { reps: v })} />
                      </div>
                    </div>
                  )}
                  {editing && (ex.equipment === "Barbell" || ex.equipment === "Smith") && (
                    <PlateHint weight={weight} />
                  )}
                </div>
              );
            })}
          </div>

          {planned.notes && (
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-line bg-elev px-3.5 py-2.5 text-[13px] text-dim">
              <StickyNote size={14} className="mt-0.5 shrink-0 text-faint" />
              {planned.notes}
            </div>
          )}

          <button
            className="pressable mt-3 flex items-center gap-1.5 text-xs font-semibold text-accent2"
            onClick={() => setShowInfo(!showInfo)}
          >
            <Info size={13} />
            {showInfo ? "Hide" : "Form guide, mistakes & alternatives"}
          </button>
          {showInfo && (
            <div className="mt-2 grid gap-2.5">
              <a
                href={ex.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="pressable flex items-center justify-center gap-2 rounded-full border border-line bg-card2 py-3 text-[13px] font-medium"
              >
                <Play size={15} /> Watch video demo
              </a>
              <MuscleMap primary={ex.primary} secondary={ex.secondary} />
              <ExerciseMedia ex={ex} />
              <InfoBlock icon={<Check size={12} />} title="Form cues" items={ex.cues} />
              <InfoBlock icon={<AlertTriangle size={12} />} title="Common mistakes" items={ex.mistakes} />
              <InfoBlock icon={<Repeat size={12} />} title="Alternatives" items={ex.alternatives} />
              <HomeAlt ex={ex} />
              <div className="rounded-2xl border border-line bg-elev px-3.5 py-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-accent2">
                  <TrendingUp size={12} /> Progression
                </div>
                <p className="text-[13px] text-dim">{ex.progression}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** top working weight across the last handful of sessions — progress you can SEE mid-set */
function HistorySpark({ exerciseId }: { exerciseId: string }) {
  const state = useApp();
  const weights = historyFor(state, exerciseId)
    .slice(0, 6)
    .reverse()
    .map((h) => Math.max(0, ...h.log.sets.filter((s) => s.done).map((s) => s.weight)))
    .filter((w) => w > 0);
  if (weights.length < 2) return null;
  return (
    <span className="ml-1.5 inline-flex items-center gap-1.5">
      <Sparkline values={weights} color="var(--color-viz2)" />
      <span>last {weights.length}</span>
    </span>
  );
}

/** what to load per side — barbell math nobody should do between sets */
function PlateHint({ weight, barKg = 20 }: { weight: number; barKg?: number }) {
  if (weight < barKg) return null;
  let side = (weight - barKg) / 2;
  const plates: number[] = [];
  for (const p of [25, 20, 15, 10, 5, 2.5, 1.25]) {
    while (side >= p - 1e-9) {
      plates.push(p);
      side -= p;
    }
  }
  const loadable = side <= 1e-9;
  return (
    <div className="border-t border-line/40 px-3.5 py-2 text-[11px] text-faint">
      {weight === barKg
        ? "Just the bar (20 kg)"
        : loadable
          ? `Bar + per side: ${plates.join(" · ")} kg`
          : `${weight} kg isn't loadable with standard plates — try ${weight - (weight % 2.5)} kg`}
    </div>
  );
}

/** brief top-of-screen celebration when a set beats the recorded PR */
function PrToast({ name, weight, onDone }: { name: string; weight: number; onDone: () => void }) {
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 220]);
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return createPortal(
    <div className="rise-in pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),16px)] z-[110] flex justify-center px-6">
      <div className="tile-accent flex items-center gap-3.5 px-5 py-3.5 shadow-2xl">
        <GlyphMatrix frames={TROPHY_FRAMES} fps={5} cell={3.2} color="#ffffff" />
        <div>
          <div className="label-mono text-[9px] text-white/70">New personal record</div>
          <div className="text-[14px] font-semibold text-white">
            {name} · {weight} kg
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function InfoBlock({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-line bg-elev px-3.5 py-2.5">
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
