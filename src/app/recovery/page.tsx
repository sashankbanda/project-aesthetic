"use client";
import Mounted from "@/components/mounted";
import { Card, Meter, PageHead, SectionTitle } from "@/components/ui";
import { todayStr, update, useApp } from "@/lib/store";
import { Calendar, Check, Droplets, Footprints, Moon, StretchHorizontal } from "lucide-react";

export default function RecoveryPage() {
  return (
    <Mounted>
      <RecoveryInner />
    </Mounted>
  );
}

function RecoveryInner() {
  const state = useApp();
  const today = todayStr();
  const entry = state.recovery.find((r) => r.date === today);
  const p = state.profile;

  const patch = (fields: Partial<NonNullable<typeof entry>>) =>
    update((draft) => {
      let e = draft.recovery.find((r) => r.date === today);
      if (!e) {
        e = { date: today };
        draft.recovery.push(e);
      }
      Object.assign(e, fields);
    });

  const sleep = entry?.sleepH ?? 0;
  const water = entry?.waterMl ?? 0;
  const steps = entry?.steps ?? 0;

  return (
    <>
      <PageHead
        eyebrow="Recovery"
        title="Recovery"
        sub="You grow while resting, not while lifting. Protect these four."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* sleep */}
        <Card>
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
              <Moon size={13} /> Sleep
            </div>
            <div className="text-sm font-bold tabular-nums">
              {sleep || "—"} / {p.sleepGoalH} h
            </div>
          </div>
          <Meter ratio={sleep / p.sleepGoalH} className="mt-3" color="var(--color-viz1)" />
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {[5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((h) => (
              <button
                key={h}
                onClick={() => patch({ sleepH: h })}
                className={`pressable rounded-xl border px-2.5 py-2 text-xs font-semibold tabular-nums ${
                  sleep === h ? "border-accent/40 bg-accent/15 text-ink" : "border-line text-dim"
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </Card>

        {/* water */}
        <Card>
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
              <Droplets size={13} /> Water
            </div>
            <div className="text-sm font-bold tabular-nums">
              {water} / {p.waterGoalMl} ml
            </div>
          </div>
          <Meter ratio={water / p.waterGoalMl} className="mt-3" color="var(--color-viz2)" />
          <div className="mt-3.5 flex gap-2">
            <button
              onClick={() => patch({ waterMl: water + 250 })}
              className="pressable flex-1 rounded-xl border border-line py-2.5 text-xs font-semibold text-dim"
            >
              + Glass (250)
            </button>
            <button
              onClick={() => patch({ waterMl: water + 500 })}
              className="pressable flex-1 rounded-xl border border-line py-2.5 text-xs font-semibold text-dim"
            >
              + Bottle (500)
            </button>
            <button
              onClick={() => patch({ waterMl: 0 })}
              className="pressable rounded-xl border border-line px-3 py-2.5 text-xs text-faint"
            >
              reset
            </button>
          </div>
        </Card>

        {/* steps */}
        <Card>
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
              <Footprints size={13} /> Steps
            </div>
            <div className="text-sm font-bold tabular-nums">
              {steps.toLocaleString("en-IN")} / {p.stepsGoal.toLocaleString("en-IN")}
            </div>
          </div>
          <Meter ratio={steps / p.stepsGoal} className="mt-3" color="var(--color-viz3)" />
          <input
            type="number"
            inputMode="numeric"
            placeholder="Enter today's steps"
            className="mt-3.5 w-full rounded-xl border border-line bg-elev px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={steps || ""}
            onChange={(e) => patch({ steps: parseInt(e.target.value) || 0 })}
          />
        </Card>

        {/* stretching */}
        <Card>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
            <StretchHorizontal size={13} /> Stretching
          </div>
          <p className="mt-2 text-xs leading-relaxed text-dim">
            10 minutes after training or before bed — hips, hamstrings, chest doorway stretch, lats on the rack.
          </p>
          <button
            onClick={() => patch({ stretched: !entry?.stretched })}
            className={`pressable mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold ${
              entry?.stretched ? "border-good/30 bg-good/10 text-good" : "border-line text-dim"
            }`}
          >
            {entry?.stretched && <Check size={15} strokeWidth={3} />}
            {entry?.stretched ? "Stretched today" : "Mark as done"}
          </button>
        </Card>
      </div>

      <SectionTitle>
        <Calendar size={17} className="text-accent2" /> Last 7 days
      </SectionTitle>
      <Card>
        <div className="grid grid-cols-7 gap-2 text-center">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const e = state.recovery.find((r) => r.date === ds);
            const score = [
              (e?.sleepH ?? 0) >= state.profile.sleepGoalH,
              (e?.waterMl ?? 0) >= state.profile.waterGoalMl,
              (e?.steps ?? 0) >= state.profile.stepsGoal,
              e?.stretched,
            ].filter(Boolean).length;
            return (
              <div key={ds}>
                <div className="text-[10px] text-faint">
                  {d.toLocaleDateString("en-IN", { weekday: "short" })}
                </div>
                <div
                  className={`mx-auto mt-1.5 grid h-9 w-9 place-items-center rounded-xl text-xs font-bold ${
                    score >= 3
                      ? "bg-good/20 text-good"
                      : score >= 1
                        ? "bg-card2 text-dim"
                        : "bg-elev text-faint"
                  }`}
                >
                  {score}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
