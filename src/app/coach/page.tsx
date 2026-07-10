"use client";
// ============================================================
// AI Coach — weekly check-in and free-form questions, answered
// from a compact digest of the user's own training data.
// ============================================================
import { useEffect, useState } from "react";
import Mounted from "@/components/mounted";
import { GlyphSpinner } from "@/components/glyph";
import { Btn, Card, PageHead, inputCls } from "@/components/ui";
import { buildCoachSummary } from "@/lib/coach-summary";
import { getState } from "@/lib/store";
import { Lock, Send, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Why has my main lift stalled?",
  "I can only train 3 days next week — what should I keep?",
  "Am I eating enough protein for my goal?",
  "How do I know when to deload?",
];

export default function CoachPage() {
  return (
    <Mounted>
      <CoachInner />
    </Mounted>
  );
}

function CoachInner() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState("");
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coach")
      .then((r) => r.json())
      .then((d) => setAvailable(!!d.available))
      .catch(() => setAvailable(false));
  }, []);

  const ask = async (q?: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setAdvice(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: buildCoachSummary(getState()), question: q ?? "" }),
      });
      const data = await res.json();
      if (!res.ok || !data.advice) throw new Error(data.error ?? "no answer");
      setAdvice(data.advice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead
        eyebrow="Coach"
        title="AI Coach"
        sub="Reads your training digest — volume, lift trends, streak — and tells you what to change."
      />

      {available === false && (
        <Card>
          <div className="text-[15px] font-semibold">Coach isn&apos;t connected yet</div>
          <p className="mt-2 text-[13px] leading-relaxed text-dim">
            Add a free API key to the server environment and redeploy — either{" "}
            <span className="font-semibold text-ink">GROQ_API_KEY</span> (console.groq.com, recommended) or{" "}
            <span className="font-semibold text-ink">GEMINI_API_KEY</span> (aistudio.google.com). Both have
            generous free tiers.
          </p>
        </Card>
      )}

      {available && (
        <>
          <Btn variant="primary" className="w-full !py-4" onClick={() => ask()} disabled={busy}>
            <Sparkles size={16} /> Weekly check-in
          </Btn>

          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                disabled={busy}
                className="pressable rounded-full border border-line bg-card px-3.5 py-2 text-left text-[12px] text-dim disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              className={inputCls}
              placeholder="Ask anything about your training…"
              value={question}
              maxLength={300}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && question.trim() && ask(question.trim())}
            />
            <button
              onClick={() => question.trim() && ask(question.trim())}
              disabled={busy || !question.trim()}
              aria-label="ask"
              className="pressable grid w-12 shrink-0 place-items-center rounded-xl bg-grad text-white disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>

          {busy && (
            <Card className="mt-4 flex items-center gap-4">
              <GlyphSpinner cell={3.5} />
              <span className="text-[13px] text-dim">Reading your training data…</span>
            </Card>
          )}

          {error && !busy && (
            <Card className="mt-4 border-warn/25 text-[13px] text-dim">{error}</Card>
          )}

          {advice && !busy && (
            <Card className="mt-4">
              <div className="label-mono mb-2.5 flex items-center gap-1.5 text-faint">
                <Sparkles size={12} /> Coach
              </div>
              <p className="whitespace-pre-wrap text-[14px] font-light leading-relaxed">{advice}</p>
            </Card>
          )}

          <p className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-faint">
            <Lock size={12} className="mt-0.5 shrink-0" />
            The coach sees only an aggregate digest — weekly totals and lift trends. Never your raw logs,
            name, or photos. General guidance, not medical advice.
          </p>
        </>
      )}

      {available === null && (
        <Card className="flex items-center gap-4">
          <GlyphSpinner cell={3.5} />
          <span className="text-[13px] text-dim">Checking coach availability…</span>
        </Card>
      )}
    </>
  );
}
