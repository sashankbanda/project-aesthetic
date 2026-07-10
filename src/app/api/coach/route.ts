// ============================================================
// AI Coach — free-tier LLM behind a thin server proxy.
// Provider by env: GROQ_API_KEY (console.groq.com, preferred) or
// GEMINI_API_KEY (aistudio.google.com). Keys never reach the
// client; the client sends only the compact CoachSummary digest —
// no raw logs, no photos, no name.
// ============================================================
import { NextResponse } from "next/server";

const SYSTEM = `You are the coach inside "Aesthetic", a personal fitness app. You receive a JSON digest of the user's training: goal, plan, weekly volume, lift trends, body weight trend, streak.

Rules:
- Be specific to THEIR numbers ("your bench moved 40→47.5 kg in 6 sessions"), never generic filler.
- Evidence-based: double progression, 10–20 weekly sets per muscle, 2×/week frequency, deloads every 4–8 weeks.
- Plain text only — no markdown headers or bullets syntax; short paragraphs. Max ~220 words.
- Direct and encouraging, never sycophantic. Call out what's stalling and give ONE concrete next action.
- You are not a doctor: injuries or pain → advise seeing a professional, briefly.`;

type Provider = { kind: "groq" | "gemini"; key: string };

function provider(): Provider | null {
  if (process.env.GROQ_API_KEY) return { kind: "groq", key: process.env.GROQ_API_KEY };
  if (process.env.GEMINI_API_KEY) return { kind: "gemini", key: process.env.GEMINI_API_KEY };
  return null;
}

async function askGroq(key: string, user: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      max_tokens: 600,
      temperature: 0.6,
    }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function askGemini(key: string, user: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.6 },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
}

export async function GET() {
  const p = provider();
  return NextResponse.json({ available: !!p, provider: p?.kind ?? null });
}

export async function POST(request: Request) {
  const p = provider();
  if (!p) {
    return NextResponse.json(
      { available: false, message: "No AI key configured. Add GROQ_API_KEY (free at console.groq.com) or GEMINI_API_KEY to the server env." },
      { status: 200 },
    );
  }

  const body = await request.json().catch(() => null);
  const summary = body?.summary;
  const question = typeof body?.question === "string" ? body.question.slice(0, 500) : "";
  if (!summary || JSON.stringify(summary).length > 10_000) {
    return NextResponse.json({ error: "bad summary" }, { status: 400 });
  }

  const user = `My training digest:\n${JSON.stringify(summary)}\n\n${
    question || "Give me my weekly check-in: what's working, what's stalling, and the one thing to change next week."
  }`;

  try {
    const advice = p.kind === "groq" ? await askGroq(p.key, user) : await askGemini(p.key, user);
    if (!advice) throw new Error("empty response");
    return NextResponse.json({ available: true, advice });
  } catch (e) {
    console.error("coach:", e);
    return NextResponse.json({ error: "The coach is unreachable right now — try again in a minute." }, { status: 502 });
  }
}
