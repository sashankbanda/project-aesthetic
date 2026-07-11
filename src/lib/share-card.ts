// ============================================================
// Share cards — the Gym Receipt. A thermal-printer style summary
// of a workout, rendered on-device to a PNG and handed to the
// native share sheet. Dot-matrix identity, now literal.
// ============================================================
import type { AppState, WorkoutDay, WorkoutSession } from "./types";
import { EXERCISE_MAP } from "./seed";
import { workoutStreak } from "./overload";
import { analyzeSession, fmtDuration } from "./session-time";

const W = 1080;
const M = 84; // side margin
const PAPER = "#f6f5f0";
const INK = "#171614";
const FAINT = "#8a8880";
const ACCENT = "#e8391c";
const MONO = "'Courier New', ui-monospace, monospace";

interface ReceiptLine {
  name: string;
  detail: string; // "3×10"
  amount: string; // "22 KG" | "BW"
  pr: boolean;
}

function collectLines(state: AppState, session: WorkoutSession): ReceiptLine[] {
  const lines: ReceiptLine[] = [];
  for (const log of session.logs) {
    const done = log.sets.filter((s) => s.done);
    if (done.length === 0) continue;
    const ex = EXERCISE_MAP[log.exerciseId];
    const top = Math.max(...done.map((s) => s.weight));
    const reps = Math.round(done.reduce((n, s) => n + s.reps, 0) / done.length);
    // PR = this session's top beats every OTHER session's top for this exercise
    let bestBefore = 0;
    for (const s2 of state.sessions) {
      if (s2.id === session.id) continue;
      const l2 = s2.logs.find((l) => l.exerciseId === log.exerciseId);
      if (l2) for (const st of l2.sets) if (st.done && st.weight > bestBefore) bestBefore = st.weight;
    }
    lines.push({
      name: (ex?.name ?? log.exerciseId).toUpperCase(),
      detail: `${done.length}×${reps}`,
      amount: top > 0 ? `${top} KG` : "BW",
      pr: top > 0 && top > bestBefore && bestBefore > 0,
    });
  }
  return lines;
}

/** dashed separator, receipt style */
function dashes(ctx: CanvasRenderingContext2D, y: number) {
  ctx.save();
  ctx.strokeStyle = FAINT;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(M, y);
  ctx.lineTo(W - M, y);
  ctx.stroke();
  ctx.restore();
}

/** deterministic dot-matrix "barcode" from the session id */
function barcode(ctx: CanvasRenderingContext2D, y: number, seed: string) {
  ctx.fillStyle = INK;
  const cols = 44;
  const cw = (W - M * 2) / cols;
  for (let i = 0; i < cols; i++) {
    const v = seed.charCodeAt(i % seed.length) + i * 7;
    const h = 26 + (v % 46);
    if (v % 3 !== 0) ctx.fillRect(M + i * cw, y + (72 - h) / 2, cw * 0.55, h);
  }
}

export function buildWorkoutReceipt(
  state: AppState,
  session: WorkoutSession,
  day: WorkoutDay | undefined,
): Promise<Blob> {
  const lines = collectLines(state, session);
  const report = analyzeSession(session, day);
  const streak = workoutStreak(state);
  const volume = Math.round(
    session.logs.flatMap((l) => l.sets.filter((s) => s.done)).reduce((n, s) => n + s.weight * s.reps, 0),
  );
  const sets = session.logs.reduce((n, l) => n + l.sets.filter((s) => s.done).length, 0);
  const when = new Date(session.completedAt ?? session.date + "T12:00:00");

  const totals: [string, string][] = [
    ["SETS", String(sets)],
    ["VOLUME", volume >= 1000 ? `${(volume / 1000).toFixed(1)} T` : `${volume} KG`],
  ];
  if (report?.hasTimestamps) {
    totals.push(["DURATION", fmtDuration(report.totalS).toUpperCase()]);
    totals.push(["FOCUS", `${Math.round(report.score * 100)}%`]);
  }
  if (streak > 1) totals.push(["STREAK", `${streak} DAYS`]);

  const H = 560 + lines.length * 58 + totals.length * 56 + 330;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // paper
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  let y = 130;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.font = `bold 64px ${MONO}`;
  ctx.fillText("AESTHETIC", W / 2, y);
  y += 44;
  ctx.font = `28px ${MONO}`;
  ctx.fillStyle = FAINT;
  ctx.fillText("P E R S O N A L   C O A C H", W / 2, y);

  y += 64;
  dashes(ctx, y);
  y += 74;
  ctx.fillStyle = INK;
  ctx.font = `bold 44px ${MONO}`;
  ctx.fillText("GYM RECEIPT", W / 2, y);
  y += 48;
  ctx.font = `30px ${MONO}`;
  ctx.fillStyle = FAINT;
  const dateStr = when
    .toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
  const timeStr = when.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }).toUpperCase();
  ctx.fillText(`${dateStr} · ${timeStr}`, W / 2, y);
  y += 44;
  ctx.fillStyle = INK;
  ctx.font = `bold 34px ${MONO}`;
  ctx.fillText((day?.name ?? "TRAINING").toUpperCase(), W / 2, y);

  y += 52;
  dashes(ctx, y);
  y += 64;

  // items
  ctx.font = `30px ${MONO}`;
  for (const line of lines) {
    ctx.textAlign = "left";
    ctx.fillStyle = INK;
    const name = line.name.length > 22 ? line.name.slice(0, 21) + "…" : line.name;
    ctx.fillText(name, M, y);
    ctx.fillStyle = FAINT;
    ctx.fillText(line.detail, M + 700 - ctx.measureText(line.detail).width, y);
    ctx.textAlign = "right";
    ctx.fillStyle = line.pr ? ACCENT : INK;
    ctx.fillText(line.pr ? `★ ${line.amount}` : line.amount, W - M, y);
    if (line.pr) {
      ctx.textAlign = "left";
      ctx.fillStyle = ACCENT;
      ctx.font = `bold 22px ${MONO}`;
      ctx.fillText("NEW PERSONAL RECORD", M, y + 28);
      ctx.font = `30px ${MONO}`;
      y += 30;
    }
    y += 58;
  }

  y += 8;
  dashes(ctx, y);
  y += 64;

  // totals
  for (const [label, value] of totals) {
    ctx.textAlign = "left";
    ctx.fillStyle = FAINT;
    ctx.font = `30px ${MONO}`;
    ctx.fillText(label, M, y);
    ctx.textAlign = "right";
    ctx.fillStyle = INK;
    ctx.font = `bold 34px ${MONO}`;
    ctx.fillText(value, W - M, y);
    y += 56;
  }

  y += 10;
  dashes(ctx, y);
  y += 68;
  ctx.textAlign = "center";
  ctx.fillStyle = ACCENT;
  ctx.font = `bold 38px ${MONO}`;
  ctx.fillText("PAID IN FULL — IN SWEAT", W / 2, y);

  y += 60;
  barcode(ctx, y, session.id);
  y += 116;
  ctx.fillStyle = FAINT;
  ctx.font = `26px ${MONO}`;
  ctx.fillText("project-aesthetic.vercel.app", W / 2, y);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("receipt render failed"))), "image/png");
  });
}

/** native share sheet on phones, download fallback elsewhere */
export async function shareCard(blob: Blob, fileName: string, text: string): Promise<void> {
  const file = new File([blob], fileName, { type: "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // user closed the sheet
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}
