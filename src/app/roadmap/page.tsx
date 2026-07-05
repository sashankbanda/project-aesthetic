"use client";
import { useState } from "react";
import Mounted from "@/components/mounted";
import { Btn, Card, Meter, PageHead, inputCls } from "@/components/ui";
import { monthStr, update, useApp } from "@/lib/store";
import { Check } from "lucide-react";

export default function RoadmapPage() {
  return (
    <Mounted>
      <RoadmapInner />
    </Mounted>
  );
}

function RoadmapInner() {
  const state = useApp();
  const [newGoal, setNewGoal] = useState("");
  const [targetMonth, setTargetMonth] = useState(monthStr());

  const byMonth = new Map<string, typeof state.roadmap>();
  for (const g of state.roadmap) {
    if (!byMonth.has(g.month)) byMonth.set(g.month, []);
    byMonth.get(g.month)!.push(g);
  }
  const months = [...byMonth.keys()].sort();

  const toggle = (id: string) =>
    update((draft) => {
      const g = draft.roadmap.find((x) => x.id === id);
      if (g) g.done = !g.done;
    });

  const remove = (id: string) =>
    update((draft) => {
      draft.roadmap = draft.roadmap.filter((x) => x.id !== id);
    });

  const add = () => {
    const label = newGoal.trim();
    if (!label) return;
    update((draft) => {
      draft.roadmap.push({
        id: `${targetMonth}-${Date.now()}`,
        month: targetMonth,
        label,
        done: false,
      });
    });
    setNewGoal("");
  };

  const monthName = (m: string) =>
    new Date(m + "-15").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <>
      <PageHead
        eyebrow="Direction"
        title="Monthly Roadmap"
        sub="Small monthly targets stack into a transformation. Check them off as you land them."
      />

      {/* add goal */}
      <Card className="mb-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            className={inputCls + " flex-1"}
            placeholder="New goal — e.g. Incline DB press 26 kg × 10"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <input
            type="month"
            className={inputCls + " md:w-44"}
            value={targetMonth}
            onChange={(e) => setTargetMonth(e.target.value)}
          />
          <Btn variant="primary" onClick={add}>
            Add goal
          </Btn>
        </div>
      </Card>

      {months.map((m) => {
        const goals = byMonth.get(m)!;
        const done = goals.filter((g) => g.done).length;
        const isCurrent = m === monthStr();
        return (
          <Card key={m} className={`mb-4 ${isCurrent ? "border-accent/30" : ""}`}>
            <div className="mb-1 flex items-center justify-between">
              <div className="font-semibold">
                {monthName(m)}{" "}
                {isCurrent && <span className="ml-1 text-[10px] font-bold uppercase text-accent2">current</span>}
              </div>
              <span className="text-xs tabular-nums text-faint">
                {done}/{goals.length}
              </span>
            </div>
            <Meter ratio={goals.length ? done / goals.length : 0} className="mb-3" color="var(--color-good)" />
            <div className="divide-y divide-line/40">
              {goals.map((g) => (
                <div key={g.id} className="group flex items-center gap-3 py-2.5">
                  <button
                    onClick={() => toggle(g.id)}
                    className={`pressable grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition ${
                      g.done ? "border-transparent bg-ink text-bg" : "border-line bg-elev text-transparent"
                    }`}
                  >
                    <Check size={15} strokeWidth={3} />
                  </button>
                  <span className={`flex-1 text-sm ${g.done ? "text-faint line-through" : ""}`}>{g.label}</span>
                  <button
                    onClick={() => remove(g.id)}
                    className="text-xs text-faint opacity-0 transition hover:text-bad group-hover:opacity-100"
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </>
  );
}
