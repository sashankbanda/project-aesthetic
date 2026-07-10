"use client";
// ============================================================
// Gym Mode — the phone lies on the bench, you barely touch it.
//   · Wake Lock keeps the screen on (feature-detected)
//   · the WHOLE SCREEN is the "set done" button
//   · Coach Voice speaks every transition (SpeechSynthesis, offline)
//   · optional: earbud play/pause taps log the set (Media Session)
// Everything degrades gracefully — no API, no problem, the big
// display and tap still work on any browser.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, SkipForward, Undo2, Volume2, VolumeX, X } from "lucide-react";
import DotNumber from "./dot-number";
import { CHECK_FRAMES, GlyphMatrix } from "./glyph";
import { Card, Switch } from "./ui";
import { todayStr, update, useApp } from "@/lib/store";
import { chime, haptic, speak, stopSpeaking, unlockAudio } from "@/lib/fx";
import { ensureSession, sessionId } from "@/lib/workout-session";
import { getGymPrefs, setGymPrefs, useGymPrefs } from "@/lib/gym-prefs";
import { EXERCISE_MAP } from "@/lib/seed";
import type { WorkoutDay } from "@/lib/types";

export default function GymMode({ day, onExit }: { day: WorkoutDay; onExit: () => void }) {
  const state = useApp();
  const prefs = useGymPrefs();
  const [voiceOn, setVoiceOn] = useState(() => getGymPrefs().voice);
  const [restUntil, setRestUntil] = useState<number | null>(null);

  const session = state.sessions.find((s) => s.id === sessionId(todayStr(), day.id));

  // position: first exercise with an undone set, and that set's index
  let exIdx = -1;
  let setIdx = 0;
  for (let i = 0; i < day.exercises.length; i++) {
    const pe = day.exercises[i];
    const log = session?.logs.find((l) => l.exerciseId === pe.exerciseId);
    const firstUndone = log ? log.sets.findIndex((s) => !s.done) : 0;
    const doneCount = log?.sets.filter((s) => s.done).length ?? 0;
    if (doneCount < pe.workingSets) {
      exIdx = i;
      setIdx = firstUndone === -1 ? doneCount : firstUndone;
      break;
    }
  }
  const planned = exIdx >= 0 ? day.exercises[exIdx] : null;
  const ex = planned ? EXERCISE_MAP[planned.exerciseId] : null;
  const log = planned ? session?.logs.find((l) => l.exerciseId === planned.exerciseId) : null;
  const row = log?.sets[setIdx];
  const weight = row?.weight ?? 0;
  const reps = row?.reps ?? planned?.repsMin ?? 0;
  const complete = exIdx === -1;

  // ---------- wake lock ----------
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let alive = true;
    const acquire = () =>
      navigator.wakeLock
        ?.request("screen")
        .then((l) => {
          if (alive) lock = l;
          else void l.release();
        })
        .catch(() => {});
    void acquire();
    const onVisible = () => {
      if (document.visibilityState === "visible" && alive) void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => {});
    };
  }, []);

  // ---------- announce the current lift (once per exercise/set) ----------
  const announcedRef = useRef("");
  useEffect(() => {
    if (restUntil !== null || complete || !ex || !planned) return;
    const key = `${exIdx}-${setIdx}`;
    if (announcedRef.current === key) return;
    announcedRef.current = key;
    if (voiceOn)
      speak(
        `${ex.name}. Set ${setIdx + 1} of ${planned.workingSets}.${weight > 0 ? ` ${weight} kilos.` : ""}`,
      );
  }, [exIdx, setIdx, restUntil, complete, ex, planned, weight, voiceOn]);

  useEffect(() => () => stopSpeaking(), []);

  // ---------- the one big action ----------
  const tapRef = useRef<() => void>(() => {});
  const tapDone = () => {
    if (complete || !planned) return;
    unlockAudio();
    haptic();
    const isLastOverall =
      exIdx === day.exercises.length - 1 && setIdx === planned.workingSets - 1;
    update((draft) => {
      const s = ensureSession(draft, day);
      if (!s.startedAt) s.startedAt = new Date().toISOString();
      const l = s.logs.find((x) => x.exerciseId === planned.exerciseId);
      const target = l?.sets.find((x) => !x.done);
      if (target) {
        target.done = true;
        target.at = new Date().toISOString();
      }
    });
    if (isLastOverall) {
      if (voiceOn) speak("Workout complete. Outstanding.");
      setRestUntil(null);
    } else {
      if (voiceOn) speak(`Rest ${planned.restSeconds} seconds.`);
      setRestUntil(Date.now() + planned.restSeconds * 1000);
    }
  };
  useEffect(() => {
    tapRef.current = tapDone; // keep the earbud handler pointed at the latest closure
  });

  // ---------- optional earbud taps (Media Session over a silent stream) ----------
  useEffect(() => {
    if (!prefs.earbud || !("mediaSession" in navigator)) return;
    let ctx: AudioContext | null = null;
    let audio: HTMLAudioElement | null = null;
    const actions: MediaSessionAction[] = ["play", "pause", "nexttrack", "previoustrack"];
    try {
      ctx = new AudioContext();
      const dest = ctx.createMediaStreamDestination();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001; // inaudible carrier so the session stays "playing"
      osc.connect(gain).connect(dest);
      osc.start();
      audio = new Audio();
      audio.srcObject = dest.stream;
      void audio.play().catch(() => {});
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Gym Mode",
        artist: "Aesthetic — tap earbud to log a set",
      });
      for (const a of actions) {
        try {
          navigator.mediaSession.setActionHandler(a, () => tapRef.current());
        } catch {
          /* action unsupported on this platform */
        }
      }
    } catch {
      /* no media session — screen tap still works */
    }
    return () => {
      for (const a of actions) {
        try {
          navigator.mediaSession.setActionHandler(a, null);
        } catch {
          /* ignore */
        }
      }
      audio?.pause();
      void ctx?.close().catch(() => {});
    };
  }, [prefs.earbud]);

  // ---------- undo the most recent set ----------
  const undoLast = () => {
    haptic();
    setRestUntil(null);
    update((draft) => {
      const s = draft.sessions.find((x) => x.id === sessionId(todayStr(), day.id));
      if (!s) return;
      let last: { at: string; set: { done: boolean; at?: string } } | null = null;
      for (const l of s.logs) {
        for (const set of l.sets) {
          if (set.done && set.at && (!last || set.at > last.at)) last = { at: set.at, set };
        }
      }
      if (last) {
        last.set.done = false;
        last.set.at = undefined;
      }
    });
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    setGymPrefs({ voice: next });
    if (!next) stopSpeaking();
  };

  const restDone = () => {
    setRestUntil(null);
    chime();
    haptic([250, 120, 250]);
    if (voiceOn && ex) speak("Go.");
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-bg">
      {/* top bar — small, out of the tap zone */}
      <div className="pt-safe flex items-center justify-between px-5 pt-4">
        <button onClick={onExit} aria-label="exit gym mode" className="pressable grid h-11 w-11 place-items-center rounded-full border border-line text-dim">
          <X size={18} />
        </button>
        <div className="label-mono text-faint">{day.name}</div>
        <button onClick={toggleVoice} aria-label="toggle voice" className="pressable grid h-11 w-11 place-items-center rounded-full border border-line text-dim">
          {voiceOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
      </div>

      {complete ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
          <GlyphMatrix frames={CHECK_FRAMES} fps={4} cell={7} color="var(--color-accent)" />
          <div className="text-[30px] font-light">All sets done</div>
          <button onClick={onExit} className="bg-grad pressable rounded-full px-8 py-4 text-[15px] font-medium text-white shadow-lg shadow-accent/30">
            Exit &amp; finish workout
          </button>
        </div>
      ) : restUntil !== null && planned ? (
        <GymRest
          key={restUntil}
          deadline={restUntil}
          nextLabel={
            setIdx + 1 < planned.workingSets
              ? `Next: set ${setIdx + 1} of ${planned.workingSets} — ${ex?.name ?? ""}`
              : `Next: ${EXERCISE_MAP[day.exercises[exIdx + 1]?.exerciseId]?.name ?? "last stretch"}`
          }
          onExtend={() => setRestUntil((r) => (r ?? Date.now()) + 30_000)}
          onSkip={restDone}
          onDone={restDone}
        />
      ) : (
        <button onClick={tapDone} className="flex flex-1 select-none flex-col items-center justify-center gap-7 px-8 text-center">
          <div className="label-mono flex items-center gap-2 text-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Set {setIdx + 1} of {planned?.workingSets}
          </div>
          <div className="text-[34px] font-light leading-tight tracking-[-0.02em]">{ex?.name}</div>
          <div className="flex items-end gap-3">
            {weight > 0 ? (
              <>
                <DotNumber value={weight} cell={8} />
                <span className="label-mono pb-1 text-faint">kg × {reps}</span>
              </>
            ) : (
              <>
                <DotNumber value={reps} cell={8} />
                <span className="label-mono pb-1 text-faint">reps · bodyweight</span>
              </>
            )}
          </div>
          <div className="label-mono mt-6 text-[9px] text-faint">Tap anywhere when the set is done</div>
        </button>
      )}

      {/* bottom bar — undo, out of the tap zone */}
      {!complete && (
        <div className="pb-safe flex justify-center px-5 pb-6">
          <button onClick={undoLast} className="pressable flex items-center gap-1.5 rounded-full border border-line px-5 py-3 text-[12px] font-semibold text-faint">
            <Undo2 size={13} /> Undo last set
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}

/** Rest countdown — owns its own ticking so nothing else re-renders. */
function GymRest({
  deadline,
  nextLabel,
  onExtend,
  onSkip,
  onDone,
}: {
  deadline: number;
  nextLabel: string;
  onExtend: () => void;
  onSkip: () => void;
  onDone: () => void;
}) {
  const [left, setLeft] = useState<number | null>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const tick = () => {
      const s = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) doneRef.current();
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [deadline]);

  const mm = Math.floor((left ?? 0) / 60);
  const ss = String((left ?? 0) % 60).padStart(2, "0");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-7 px-8 text-center">
      <div className="label-mono text-faint">Rest</div>
      <DotNumber value={`${mm}:${ss}`} cell={mm >= 10 ? 7 : 9} ghost={false} />
      <div className="max-w-xs text-[13px] font-light text-dim">{nextLabel}</div>
      <div className="mt-2 flex gap-3">
        <button onClick={onExtend} className="pressable flex items-center gap-1.5 rounded-full border border-line bg-card2 px-6 py-3.5 text-sm font-medium">
          <Plus size={15} /> 30s
        </button>
        <button onClick={onSkip} className="bg-grad pressable flex items-center gap-1.5 rounded-full px-6 py-3.5 text-sm font-medium text-white shadow-lg shadow-accent/25">
          <SkipForward size={15} /> Skip
        </button>
      </div>
    </div>
  );
}

/** Settings card for the More page — theme-style opt-in, off by default. */
export function GymModeCard() {
  const prefs = useGymPrefs();
  const earbudSupported = typeof navigator !== "undefined" && "mediaSession" in navigator;
  return (
    <Card className="mb-4 !p-4">
      <div className="flex items-center gap-3.5">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium">Gym Mode</div>
          <div className="text-[11px] font-light text-faint">
            Phone on the bench, screen stays on — the whole screen is the &quot;set done&quot; button.
          </div>
        </div>
        <Switch checked={prefs.enabled} label="gym mode" onChange={(v) => setGymPrefs({ enabled: v })} />
      </div>
      {prefs.enabled && (
        <div className="mt-3 grid gap-3 border-t border-line/40 pt-3">
          <div className="flex items-center gap-3.5">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium">Coach voice</div>
              <div className="text-[11px] font-light text-faint">Speaks each set, weight and rest — great with earbuds</div>
            </div>
            <Switch checked={prefs.voice} label="coach voice" onChange={(v) => setGymPrefs({ voice: v })} />
          </div>
          {earbudSupported && (
            <div className="flex items-center gap-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">Earbud tap logs the set</div>
                <div className="text-[11px] font-light text-faint">Experimental — uses your earbud&apos;s play/pause button</div>
              </div>
              <Switch checked={prefs.earbud} label="earbud tap" onChange={(v) => setGymPrefs({ earbud: v })} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
