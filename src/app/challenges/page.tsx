"use client";
// ============================================================
// Challenges — pick an arc, show up, watch adherence. One active
// challenge at a time; abandoning needs a second tap.
// ============================================================
import { useState } from "react";
import Mounted from "@/components/mounted";
import DotNumber from "@/components/dot-number";
import { GlyphMatrix, TROPHY_FRAMES } from "@/components/glyph";
import { Btn, Card, Meter, PageHead } from "@/components/ui";
import { CHALLENGE_DEFS, challengeProgress } from "@/lib/challenges";
import { todayStr, update, useApp } from "@/lib/store";
import { Flag } from "lucide-react";

export default function ChallengesPage() {
  return (
    <Mounted>
      <ChallengesInner />
    </Mounted>
  );
}

function ChallengesInner() {
  const state = useApp();
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const progress = challengeProgress(state, todayStr());

  const start = (id: string) => {
    const def = CHALLENGE_DEFS.find((d) => d.id === id)!;
    update((draft) => {
      draft.challenge = { id: def.id, name: def.name, days: def.days, startedAt: todayStr() };
    });
  };

  const clear = () => {
    update((draft) => {
      draft.challenge = undefined;
    });
    setConfirmAbandon(false);
  };

  return (
    <>
      <PageHead
        eyebrow="Commit"
        title="Challenges"
        sub="Pick an arc. The only rule: complete the training days your plan schedules."
      />

      {progress && state.challenge ? (
        <>
          <div className="tile-dark p-6">
            <div className="dot-texture text-ink" />
            <div className="relative">
              <div className="label-mono text-faint">{progress.name}</div>
              {progress.finished ? (
                <div className="mt-4 flex flex-col items-center gap-4 py-4 text-center">
                  <GlyphMatrix frames={TROPHY_FRAMES} fps={3} cell={5} color="var(--color-accent)" />
                  <div className="text-[26px] font-light">Challenge complete</div>
                  <p className="text-[13px] font-light text-dim">
                    {progress.done} of {progress.planned} scheduled workouts done —{" "}
                    {progress.adherencePct ?? 0}% adherence over {progress.total} days.
                  </p>
                  <Btn variant="primary" onClick={clear}>
                    Start the next one
                  </Btn>
                </div>
              ) : (
                <>
                  <div className="mt-4 flex items-end gap-2.5">
                    <DotNumber value={progress.day} cell={9} />
                    <span className="label-mono pb-1 text-faint">/ {progress.total} days</span>
                  </div>
                  <Meter ratio={progress.day / progress.total} className="mt-5" color="var(--color-accent)" />
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-elev p-3">
                      <div className="text-lg font-bold tabular-nums">{progress.done}</div>
                      <div className="text-[10px] uppercase tracking-wide text-faint">done</div>
                    </div>
                    <div className="rounded-2xl bg-elev p-3">
                      <div className="text-lg font-bold tabular-nums">{progress.planned}</div>
                      <div className="text-[10px] uppercase tracking-wide text-faint">scheduled</div>
                    </div>
                    <div className="rounded-2xl bg-elev p-3">
                      <div className="text-lg font-bold tabular-nums">{progress.adherencePct ?? "—"}%</div>
                      <div className="text-[10px] uppercase tracking-wide text-faint">adherence</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {!progress.finished && (
            <button
              onClick={() => (confirmAbandon ? clear() : setConfirmAbandon(true))}
              className={`pressable mx-auto mt-5 block rounded-full border px-5 py-3 text-xs font-semibold ${
                confirmAbandon ? "border-bad/40 bg-bad/10 text-bad" : "border-line text-faint"
              }`}
            >
              {confirmAbandon ? "Tap again to abandon — progress is lost" : "Abandon challenge"}
            </button>
          )}
        </>
      ) : (
        <div className="grid gap-3">
          {CHALLENGE_DEFS.map((def) => (
            <Card key={def.id} className="!p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[16px] font-medium">{def.name}</div>
                  <p className="mt-1 text-[13px] font-light leading-relaxed text-dim">{def.blurb}</p>
                </div>
                <span className="label-mono shrink-0 rounded-full border border-line px-2.5 py-1 text-[9px] text-faint">
                  {def.days} days
                </span>
              </div>
              <Btn variant="primary" className="mt-4" onClick={() => start(def.id)}>
                <Flag size={14} /> Start
              </Btn>
            </Card>
          ))}
          <p className="mt-2 text-center text-[11px] text-faint">
            Adherence = completed workouts ÷ the training days your plan scheduled. Rest days are free.
          </p>
        </div>
      )}
    </>
  );
}
