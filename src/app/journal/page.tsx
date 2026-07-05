"use client";
import { useState } from "react";
import Mounted from "@/components/mounted";
import { GlyphMatrix, MOOD_GLYPHS } from "@/components/glyph";
import { Btn, Card, Empty, PageHead, SectionTitle, inputCls } from "@/components/ui";
import { todayStr, update, useApp } from "@/lib/store";
import { Calendar, NotebookPen, Star } from "lucide-react";

const MOODS = ["😞", "😐", "🙂", "😊", "🤩"];

export default function JournalPage() {
  return (
    <Mounted>
      <JournalInner />
    </Mounted>
  );
}

function Stars({ value, onChange, size = 26 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "pressable" : undefined}
        >
          <Star
            size={size}
            className={n <= value ? "fill-warn text-warn" : "text-line"}
            strokeWidth={1.6}
          />
        </button>
      ))}
    </div>
  );
}

function JournalInner() {
  const state = useApp();
  const today = todayStr();
  const existing = state.journal.find((j) => j.date === today);
  const [energy, setEnergy] = useState(existing?.energy ?? 0);
  const [sleepH, setSleepH] = useState(existing?.sleepH ? String(existing.sleepH) : "");
  const [mood, setMood] = useState(existing?.mood ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saved, setSaved] = useState(false);

  const save = () => {
    update((draft) => {
      draft.journal = draft.journal.filter((j) => j.date !== today);
      draft.journal.push({
        date: today,
        energy,
        sleepH: parseFloat(sleepH) || 0,
        mood,
        notes: notes.trim(),
      });
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const history = [...state.journal].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 30);

  return (
    <>
      <PageHead
        eyebrow="Reflect"
        title="Journal"
        sub="Thirty seconds a day. Patterns show up here before they show up in the mirror."
      />

      <Card>
        <div className="mb-4 text-sm font-semibold">Today — {today}</div>

        <div className="mb-1.5 text-xs font-semibold text-dim">Energy</div>
        <div className="mb-4">
          <Stars value={energy} onChange={setEnergy} />
        </div>

        <div className="mb-1.5 text-xs font-semibold text-dim">Mood</div>
        <div className="mb-4 flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(mood === m ? "" : m)}
              aria-label={`mood ${m}`}
              className={`pressable rounded-2xl border px-2.5 py-2 ${
                mood === m ? "border-accent/40 bg-accent/10" : "border-line"
              }`}
            >
              <GlyphMatrix frames={[MOOD_GLYPHS[m]]} cell={3} color={mood === m ? "#ff4b2f" : "#6e6e6a"} />
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <div className="mb-1.5 text-xs font-semibold text-dim">Sleep (hours)</div>
            <input
              type="number"
              step="0.5"
              inputMode="decimal"
              className={inputCls}
              value={sleepH}
              onChange={(e) => setSleepH(e.target.value)}
              placeholder="8"
            />
          </label>
          <label>
            <div className="mb-1.5 text-xs font-semibold text-dim">Notes</div>
            <textarea
              className={inputCls + " min-h-[46px] resize-y"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='"Bench felt easier today."'
            />
          </label>
        </div>

        <Btn variant="primary" className="mt-4 w-full md:w-auto" onClick={save}>
          {saved ? "Saved ✓" : existing ? "Update entry" : "Save entry"}
        </Btn>
      </Card>

      <SectionTitle>
        <Calendar size={17} className="text-accent2" /> Past entries
      </SectionTitle>
      {history.length === 0 ? (
        <Card>
          <Empty icon={<NotebookPen size={36} strokeWidth={1.4} />}>
            No entries yet — write your first one above.
          </Empty>
        </Card>
      ) : (
        <div className="grid gap-3">
          {history.map((j) => (
            <Card key={j.date} className="!p-4">
              <div className="flex items-center gap-3">
                {MOOD_GLYPHS[j.mood] ? (
                  <GlyphMatrix frames={[MOOD_GLYPHS[j.mood]]} cell={2.8} color="#a6a6a2" />
                ) : (
                  <span className="w-6 text-center text-faint">·</span>
                )}
                <div className="flex-1">
                  <div className="text-sm font-semibold">
                    {new Date(j.date + "T12:00:00").toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-faint">
                    <Stars value={j.energy} size={12} />
                    {j.sleepH ? `${j.sleepH} h sleep` : ""}
                  </div>
                </div>
              </div>
              {j.notes && <p className="mt-2 text-sm text-dim">&ldquo;{j.notes}&rdquo;</p>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
