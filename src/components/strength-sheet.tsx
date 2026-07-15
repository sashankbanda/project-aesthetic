"use client";
// Full strength history for one exercise — the "am I getting
// stronger?" view. e1RM trend chart + per-session breakdown.
import { createPortal } from "react-dom";
import { LineChart } from "./charts";
import { Card } from "./ui";
import { EXERCISE_MAP } from "@/lib/seed";
import { prFor } from "@/lib/overload";
import { strengthHistory } from "@/lib/strength";
import { useApp } from "@/lib/store";
import { TrendingUp, Trophy, X } from "lucide-react";

export default function StrengthSheet({
  exerciseId,
  onClose,
}: {
  exerciseId: string;
  onClose: () => void;
}) {
  const state = useApp();
  const ex = EXERCISE_MAP[exerciseId];
  const points = strengthHistory(state, exerciseId);
  const pr = prFor(state, exerciseId);
  const latest = points[points.length - 1];
  const first = points[0];
  const gain = latest && first && first.bestE1rm > 0 ? latest.bestE1rm - first.bestE1rm : 0;

  if (!ex) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center">
      <button aria-label="close" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="rise-in pb-safe relative w-full max-w-lg p-4">
        <div className="card max-h-[85dvh] overflow-y-auto overscroll-contain !rounded-3xl p-5">
          <div className="mb-1 flex items-start justify-between gap-3">
            <div>
              <div className="text-[17px] font-semibold">{ex.name}</div>
              <div className="text-xs text-faint">{ex.primary} · {points.length} session{points.length === 1 ? "" : "s"} logged</div>
            </div>
            <button onClick={onClose} aria-label="close strength view" className="pressable -m-1 p-2 text-faint">
              <X size={17} />
            </button>
          </div>

          {points.length === 0 ? (
            <p className="py-10 text-center text-sm text-faint">
              No sets logged yet — finish a session and your strength curve starts here.
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-2.5">
                {pr && pr.weight > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-elev px-3 py-1.5 text-xs font-semibold">
                    <Trophy size={12} className="text-accent2" /> PR {pr.weight} kg × {pr.reps}
                  </span>
                )}
                {latest && latest.bestE1rm > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-elev px-3 py-1.5 text-xs font-semibold">
                    est. 1RM {latest.bestE1rm} kg
                  </span>
                )}
                {gain > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-good/30 bg-good/10 px-3 py-1.5 text-xs font-semibold text-good">
                    <TrendingUp size={12} /> +{gain.toFixed(1)} kg since day 1
                  </span>
                )}
              </div>

              {points.filter((p) => p.bestE1rm > 0).length >= 2 ? (
                <>
                  <div className="label-mono mb-1.5 text-faint">Estimated 1RM</div>
                  <LineChart
                    points={points
                      .filter((p) => p.bestE1rm > 0)
                      .slice(-20)
                      .map((p) => ({ label: p.date.slice(5), value: p.bestE1rm }))}
                    unit="kg"
                    height={160}
                  />
                </>
              ) : (
                <p className="rounded-2xl border border-line bg-elev px-3.5 py-3 text-[12px] text-dim">
                  {ex.isBodyweight
                    ? "Bodyweight exercise — the chart appears once you log added weight."
                    : "Two weighted sessions and the trend chart appears."}
                </p>
              )}

              <div className="label-mono mb-1.5 mt-5 text-faint">Sessions</div>
              <Card className="!p-0">
                {points
                  .slice(-15)
                  .reverse()
                  .map((p) => (
                    <div key={p.date} className="flex items-center gap-3 border-b border-line/40 px-4 py-2.5 text-[13px] last:border-b-0">
                      <span className="w-[84px] shrink-0 text-faint tabular-nums">{p.date}</span>
                      <span className="flex-1 font-semibold tabular-nums">
                        {p.topWeight > 0 ? `${p.topWeight} kg × ${p.topReps}` : `${p.topReps} reps`}
                      </span>
                      {p.bestE1rm > 0 && (
                        <span className="text-xs text-dim tabular-nums">e1RM {p.bestE1rm}</span>
                      )}
                      <span className="w-[70px] shrink-0 text-right text-xs text-faint tabular-nums">
                        {p.volume > 0 ? `${p.volume.toLocaleString()} kg` : `${p.sets} sets`}
                      </span>
                    </div>
                  ))}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
