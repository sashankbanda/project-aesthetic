"use client";
// ============================================================
// Chart components — SVG, no dependencies.
// Mark specs: 2px lines (round join), ≥8px markers with 2px
// surface ring, hairline solid gridlines, bars ≤24px with 4px
// rounded data-ends (square at baseline), hover tooltips.
// Series colors are the validated viz tokens (globals.css).
// ============================================================
import { useId, useMemo, useRef, useState } from "react";

const SURFACE = "#161615";
const GRID = "#242422";
const MUTED = "#6e6e6a";
const INK = "#f4f4f2";

export interface LinePoint {
  label: string;
  value: number;
}

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    min = min - 1;
    max = max + 1;
  }
  const span = max - min;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const candidates = [1, 2, 2.5, 5, 10].map((c) => c * mag);
  const step = candidates.find((c) => span / c <= count) ?? candidates[candidates.length - 1];
  const start = Math.floor(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step * 0.001; v += step) out.push(+v.toFixed(4));
  return out;
}

/** Single-series line chart with area wash, end label, crosshair tooltip. */
export function LineChart({
  points,
  color = "var(--color-viz1)",
  height = 180,
  unit = "",
  targetValue,
}: {
  points: LinePoint[];
  color?: string;
  height?: number;
  unit?: string;
  targetValue?: number;
}) {
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const W = 600;
  const H = height;
  const pad = { l: 40, r: 16, t: 14, b: 24 };

  const { xs, ys, ticks, min, max } = useMemo(() => {
    const values = points.map((p) => p.value);
    const withTarget = targetValue !== undefined ? [...values, targetValue] : values;
    let lo = Math.min(...withTarget);
    let hi = Math.max(...withTarget);
    const margin = (hi - lo) * 0.15 || 1;
    lo -= margin;
    hi += margin;
    const ticks = niceTicks(lo, hi);
    lo = Math.min(lo, ticks[0]);
    hi = Math.max(hi, ticks[ticks.length - 1]);
    const xs = points.map((_, i) =>
      points.length === 1 ? (pad.l + W - pad.r) / 2 : pad.l + (i / (points.length - 1)) * (W - pad.l - pad.r),
    );
    const ys = points.map((p) => pad.t + (1 - (p.value - lo) / (hi - lo)) * (H - pad.t - pad.b));
    return { xs, ys, ticks, min: lo, max: hi };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, targetValue, H]);

  if (points.length === 0) return null;

  const yOf = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${path} L${xs[xs.length - 1].toFixed(1)},${H - pad.b} L${xs[0].toFixed(1)},${H - pad.b} Z`;
  const last = points.length - 1;

  const onMove = (e: React.PointerEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    xs.forEach((x, i) => {
      const d = Math.abs(x - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setHover(best);
  };

  const h = hover;
  return (
    <div ref={wrapRef} className="relative w-full" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img">
        {/* gridlines — hairline, solid, recessive */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={yOf(t)} y2={yOf(t)} stroke={GRID} strokeWidth="1" />
            <text x={pad.l - 8} y={yOf(t) + 3.5} textAnchor="end" fontSize="10" fill={MUTED} fontVariant="tabular-nums">
              {t}
            </text>
          </g>
        ))}
        {/* target line — the accent's job: the goal */}
        {targetValue !== undefined && (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={yOf(targetValue)} y2={yOf(targetValue)} stroke="var(--color-accent)" strokeWidth="1" strokeDasharray="4 4" opacity="0.8" />
            <text x={W - pad.r} y={yOf(targetValue) - 5} textAnchor="end" fontSize="10" fill="var(--color-accent)">
              target {targetValue}{unit}
            </text>
          </g>
        )}
        {/* area wash ~10% */}
        <path d={area} fill={color} opacity="0.1" />
        {/* line 2px round */}
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* markers: end dot always; hovered dot */}
        {[last, ...(h !== null && h !== last ? [h] : [])].map((i) => (
          <circle key={`${id}-${i}`} cx={xs[i]} cy={ys[i]} r="4.5" fill={color} stroke={SURFACE} strokeWidth="2" />
        ))}
        {/* end label — direct label on the endpoint only */}
        <text
          x={Math.min(xs[last] + 8, W - 2)}
          y={ys[last] - 8}
          textAnchor={xs[last] > W - 70 ? "end" : "start"}
          fontSize="11"
          fontWeight="600"
          fill={INK}
        >
          {points[last].value}
          {unit}
        </text>
        {/* x labels: first, middle, last */}
        {[0, Math.floor(last / 2), last]
          .filter((v, i, a) => a.indexOf(v) === i)
          .map((i) => (
            <text
              key={i}
              x={xs[i]}
              y={H - 7}
              textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
              fontSize="10"
              fill={MUTED}
            >
              {points[i].label}
            </text>
          ))}
        {/* crosshair */}
        {h !== null && (
          <line x1={xs[h]} x2={xs[h]} y1={pad.t} y2={H - pad.b} stroke={MUTED} strokeWidth="1" opacity="0.5" />
        )}
      </svg>
      {/* tooltip */}
      {h !== null && (
        <div
          className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-lg border border-line bg-card2 px-2.5 py-1.5 text-xs shadow-xl"
          style={{ left: `${(xs[h] / W) * 100}%` }}
        >
          <span className="text-faint">{points[h].label} · </span>
          <span className="font-semibold">
            {points[h].value}
            {unit}
          </span>
        </div>
      )}
    </div>
  );
}

/** Horizontal magnitude bars (sequential job — one hue, value labels at the tip). */
export function HBars({
  data,
  color = "var(--color-viz1)",
  unit = "",
  maxValue,
}: {
  data: { label: string; value: number; hint?: string }[];
  color?: string;
  unit?: string;
  maxValue?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d, i) => (
        <div
          key={d.label}
          className="group flex items-center gap-3"
          onPointerEnter={() => setHover(i)}
          onPointerLeave={() => setHover(null)}
        >
          <div className="w-28 shrink-0 truncate text-right text-xs text-dim">{d.label}</div>
          <div className="relative h-5 flex-1">
            <div className="absolute inset-y-0 left-0 w-full rounded-r bg-elev" />
            <div
              className="absolute inset-y-0 left-0 rounded-r transition-[width] duration-500"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: color,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
                opacity: hover === null || hover === i ? 1 : 0.45,
              }}
            />
          </div>
          <div className="w-16 shrink-0 text-xs font-semibold tabular-nums text-ink">
            {d.value}
            {unit}
            {hover === i && d.hint && <span className="ml-1 font-normal text-faint">{d.hint}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Tiny sparkline for stat tiles. */
export function Sparkline({ values, color = "var(--color-viz2)" }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const W = 120;
  const H = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * W},${2 + (1 - (v - min) / span) * (H - 4)}`,
    )
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-8 w-[120px]">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
