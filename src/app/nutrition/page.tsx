"use client";
import { useState } from "react";
import Mounted from "@/components/mounted";
import DotNumber from "@/components/dot-number";
import { FLEX_FRAMES, GlyphMatrix } from "@/components/glyph";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui";
import { todayStr, update, useApp } from "@/lib/store";
import { budgetPlan, FOOD_MAP, FOODS } from "@/lib/foods";
import { proteinForDate } from "@/lib/stats";
import { Check, History, IndianRupee, Leaf, Minus, Plus, Wallet } from "lucide-react";

export default function NutritionPage() {
  return (
    <Mounted>
      <NutritionInner />
    </Mounted>
  );
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function NutritionInner() {
  const state = useApp();
  const [vegOnly, setVegOnly] = useState(false);
  const [pgOnly, setPgOnly] = useState(true);
  const today = todayStr();
  const goal = state.profile.proteinGoalG;
  const entries = state.foodLog.filter((e) => e.date === today);
  const yesterday = state.foodLog.filter((e) => e.date === yesterdayStr());
  const total = proteinForDate(state, today);
  const calories = entries.reduce((n, e) => n + (FOOD_MAP[e.foodId]?.calories ?? 0) * e.servings, 0);
  const cost = entries.reduce((n, e) => n + (FOOD_MAP[e.foodId]?.costRs ?? 0) * e.servings, 0);
  const gap = Math.max(0, goal - total);
  const suggestions = gap > 0 ? budgetPlan(gap, { vegOnly, pgOnly }) : [];

  const addFood = (foodId: string, n = 1) =>
    update((draft) => {
      const existing = draft.foodLog.find((e) => e.date === today && e.foodId === foodId);
      if (existing) existing.servings += n;
      else draft.foodLog.push({ date: today, foodId, servings: n });
    });

  const removeFood = (foodId: string) =>
    update((draft) => {
      const existing = draft.foodLog.find((e) => e.date === today && e.foodId === foodId);
      if (!existing) return;
      existing.servings -= 1;
      if (existing.servings <= 0)
        draft.foodLog = draft.foodLog.filter((e) => !(e.date === today && e.foodId === foodId));
    });

  const repeatYesterday = () =>
    update((draft) => {
      for (const e of yesterday) {
        const existing = draft.foodLog.find((x) => x.date === today && x.foodId === e.foodId);
        if (existing) existing.servings = Math.max(existing.servings, e.servings);
        else draft.foodLog.push({ date: today, foodId: e.foodId, servings: e.servings });
      }
    });

  return (
    <>
      <PageHead
        eyebrow="Fuel"
        title="Nutrition"
        sub="Hit the protein number. Everything else is noise."
      />

      {/* today's protein — hero tile */}
      <div className="tile-dark p-6">
        <div className="dot-texture text-ink" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="label-mono text-faint">Today&apos;s Protein</div>
            <div className="text-right text-[11px] font-light leading-relaxed text-faint">
              <div>{Math.round(calories)} kcal</div>
              <div className="flex items-center justify-end gap-0.5">
                <IndianRupee size={10} />
                {Math.round(cost)}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-end gap-2.5">
            <DotNumber
              value={Math.round(total)}
              cell={9}
              color={total >= goal ? "var(--color-accent)" : "var(--color-ink)"}
            />
            <span className="pb-1 text-sm font-light text-dim">/ {goal} g</span>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${
                total >= goal ? "bg-accent" : "bg-ink"
              }`}
              style={{ width: `${Math.min(100, (total / goal) * 100)}%` }}
            />
          </div>
          {total >= goal && (
            <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-accent">
              <GlyphMatrix frames={FLEX_FRAMES} fps={2} cell={2.4} color="var(--color-accent)" />
              Goal hit
            </div>
          )}
        </div>
      </div>

      {/* one-tap repeat */}
      {yesterday.length > 0 && entries.length === 0 && (
        <button onClick={repeatYesterday} className="pressable mt-3 w-full">
          <Card className="flex items-center gap-3 !p-4 border-accent/25">
            <History size={18} className="shrink-0 text-accent2" />
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold">Same as yesterday</div>
              <div className="text-[11px] text-faint">
                Log all {yesterday.length} foods from yesterday in one tap
              </div>
            </div>
            <Plus size={17} className="text-accent2" />
          </Card>
        </button>
      )}

      {/* logged foods */}
      {entries.length > 0 && (
        <>
          <SectionTitle>Logged today</SectionTitle>
          <Card className="divide-y divide-line/40 !py-2">
            {entries.map((e) => {
              const f = FOOD_MAP[e.foodId];
              if (!f) return null;
              return (
                <div key={e.foodId} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{f.name}</div>
                    <div className="text-xs text-faint">
                      {e.servings} × {f.serving} · {Math.round(f.proteinG * e.servings)} g protein
                    </div>
                  </div>
                  <button
                    onClick={() => removeFood(e.foodId)}
                    className="pressable grid h-9 w-9 place-items-center rounded-xl border border-line text-dim"
                  >
                    <Minus size={15} />
                  </button>
                  <button
                    onClick={() => addFood(e.foodId)}
                    className="pressable grid h-9 w-9 place-items-center rounded-xl border border-line text-dim"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              );
            })}
          </Card>
        </>
      )}

      {/* budget gap-closer */}
      <SectionTitle
        right={
          <div className="flex gap-2">
            <Pill tone={pgOnly ? "accent" : "default"} onClick={() => setPgOnly(!pgOnly)}>
              PG friendly
            </Pill>
            <Pill tone={vegOnly ? "good" : "default"} onClick={() => setVegOnly(!vegOnly)}>
              <Leaf size={11} /> Veg
            </Pill>
          </div>
        }
      >
        <Wallet size={17} className="text-accent2" /> Close the gap
      </SectionTitle>
      <Card>
        {gap === 0 ? (
          <div className="flex items-center justify-center gap-1.5 py-3 text-center text-sm text-dim">
            <Check size={15} className="text-good" /> Nothing to close — protein done.
          </div>
        ) : (
          <>
            <div className="mb-3 text-[13px] text-dim">
              <strong className="text-ink">{Math.round(gap)} g</strong> to go. Cheapest combo:
            </div>
            <div className="flex flex-col gap-2">
              {suggestions.map(({ food, servings, proteinG, costRs }) => (
                <div key={food.id} className="flex items-center gap-3 rounded-2xl border border-line bg-elev px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold">
                      {servings} × {food.serving}
                    </span>{" "}
                    <span className="text-[13px] text-dim">{food.name}</span>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-dim">{Math.round(proteinG)} g</span>
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums text-faint">₹{Math.round(costRs)}</span>
                  <button
                    onClick={() => addFood(food.id, servings)}
                    className="pressable shrink-0 rounded-full border border-ink/25 bg-ink px-3.5 py-1.5 text-xs font-semibold text-bg"
                  >
                    Log
                  </button>
                </div>
              ))}
              <div className="mt-1 text-right text-xs font-semibold text-dim">
                ~₹{Math.round(suggestions.reduce((n, s) => n + s.costRs, 0))} for{" "}
                {Math.round(suggestions.reduce((n, s) => n + s.proteinG, 0))} g
              </div>
            </div>
          </>
        )}
      </Card>

      {/* quick add grid */}
      <SectionTitle>Quick add</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
        {FOODS.filter((f) => (!vegOnly || f.veg) && (!pgOnly || f.pgFriendly)).map((f) => (
          <button key={f.id} onClick={() => addFood(f.id)} className="pressable card p-3.5 text-left">
            <div className="text-sm font-semibold">{f.name}</div>
            <div className="mt-0.5 text-[11px] text-faint">
              {f.serving} · {f.proteinG} g · ₹{f.costRs}
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-accent2">
              <Plus size={11} strokeWidth={3} /> add
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
