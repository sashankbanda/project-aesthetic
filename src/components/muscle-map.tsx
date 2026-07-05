"use client";
// ============================================================
// MuscleMap — stylized mannequin (front + back) with the target
// muscles glowing. Primary = green glow, secondary = amber.
// Pure SVG: crisp at any size, zero assets, theme-native.
// ============================================================
import type { MuscleGroup } from "@/lib/types";

type View = "front" | "back";

/** Left-side (or center) shapes per muscle, in a 200×345 viewBox. */
interface Shape {
  d: string;
  /** center shapes are not mirrored */
  center?: boolean;
}

/** rounded-rect path helper baked into constants below: x,y,w,h,r */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${w - 2 * r} a${r},${r} 0 0 1 -${r},-${r} v-${h - 2 * r} a${r},${r} 0 0 1 ${r},-${r} z`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${2 * rx},0 a${rx},${ry} 0 1,0 -${2 * rx},0`;

const FRONT: Partial<Record<MuscleGroup, Shape[]>> = {
  "Side Delts": [{ d: ellipse(59, 68, 12.5, 11) }],
  "Front Delts": [{ d: ellipse(71, 62, 9, 8) }],
  Traps: [{ d: "M80,48 L97,42 L97,56 L84,58 Z" }],
  "Upper Chest": [{ d: rr(70, 64, 27, 16, 7) }],
  "Mid Chest": [{ d: rr(70, 84, 27, 24, 9) }],
  Biceps: [{ d: rr(45, 88, 14, 32, 6) }],
  Forearms: [{ d: rr(41, 128, 10, 36, 4.5) }],
  Abs: [
    { d: rr(84, 114, 32, 17, 4), center: true },
    { d: rr(84, 134, 32, 17, 4), center: true },
    { d: rr(84, 154, 32, 17, 4), center: true },
    { d: rr(85, 174, 30, 18, 6), center: true },
  ],
  Quads: [{ d: rr(72, 214, 24, 64, 11) }],
  Calves: [{ d: rr(74, 288, 18, 36, 7) }],
};

const BACK: Partial<Record<MuscleGroup, Shape[]>> = {
  Traps: [{ d: "M100,40 L123,56 L106,92 L100,98 L94,92 L77,56 Z", center: true }],
  "Rear Delts": [{ d: ellipse(59, 68, 12.5, 11) }],
  "Upper Back": [{ d: rr(72, 62, 26, 28, 6) }],
  Lats: [{ d: "M70,94 C61,102 57,118 62,134 L82,152 L92,124 L92,98 Z" }],
  "Lower Back": [{ d: rr(84, 150, 32, 30, 6), center: true }],
  Triceps: [{ d: rr(45, 86, 14, 34, 6) }],
  Forearms: [{ d: rr(41, 128, 10, 36, 4.5) }],
  Glutes: [{ d: ellipse(86, 201, 15, 13) }],
  Hamstrings: [{ d: rr(72, 216, 24, 60, 11) }],
  Calves: [{ d: ellipse(83, 302, 10, 19) }],
};

const VIEW_FOR: Record<MuscleGroup, View> = {
  "Upper Chest": "front",
  "Mid Chest": "front",
  "Side Delts": "front",
  "Front Delts": "front",
  "Rear Delts": "back",
  Lats: "back",
  "Upper Back": "back",
  Traps: "back",
  Biceps: "front",
  Triceps: "back",
  Forearms: "front",
  Quads: "front",
  Hamstrings: "back",
  Glutes: "back",
  Calves: "back",
  Abs: "front",
  "Lower Back": "back",
};

const BASE = "var(--color-elev)";
const BASE_STROKE = "var(--color-line)";
const MUSCLE_IDLE = "var(--color-card2)";
const PRIMARY = "var(--color-accent)";
const SECONDARY = "var(--color-viz2)";

/** Body silhouette shared by both views. */
function Silhouette() {
  return (
    <g fill={BASE} stroke={BASE_STROKE} strokeWidth="1">
      {/* head + neck */}
      <circle cx="100" cy="22" r="14" />
      <rect x="92" y="32" width="16" height="14" rx="5" />
      {/* torso */}
      <path d="M64,48 L136,48 C145,50 149,58 149,68 L144,128 C142,150 136,166 128,180 L124,192 L76,192 L72,180 C64,166 58,150 56,128 L51,68 C51,58 55,50 64,48 Z" />
      {/* hips */}
      <rect x="70" y="188" width="60" height="26" rx="12" />
      {/* arms */}
      <rect x="42" y="56" width="20" height="66" rx="10" />
      <rect x="38" y="122" width="16" height="56" rx="8" />
      <circle cx="45" cy="184" r="6.5" />
      <g transform="translate(200 0) scale(-1 1)">
        <rect x="42" y="56" width="20" height="66" rx="10" />
        <rect x="38" y="122" width="16" height="56" rx="8" />
        <circle cx="45" cy="184" r="6.5" />
      </g>
      {/* legs */}
      <rect x="70" y="208" width="28" height="86" rx="13" />
      <rect x="72" y="286" width="22" height="50" rx="10" />
      <g transform="translate(200 0) scale(-1 1)">
        <rect x="70" y="208" width="28" height="86" rx="13" />
        <rect x="72" y="286" width="22" height="50" rx="10" />
      </g>
    </g>
  );
}

function MuscleShapes({
  shapes,
  fill,
  glow,
  opacity = 1,
}: {
  shapes: Shape[];
  fill: string;
  glow?: boolean;
  opacity?: number;
}) {
  return (
    <g fill={fill} opacity={opacity} filter={glow ? "url(#mm-glow)" : undefined}>
      {shapes.map((s, i) => (
        <g key={i}>
          <path d={s.d} />
          {!s.center && (
            <g transform="translate(200 0) scale(-1 1)">
              <path d={s.d} />
            </g>
          )}
        </g>
      ))}
    </g>
  );
}

function Figure({
  view,
  primary,
  secondary,
}: {
  view: View;
  primary: MuscleGroup;
  secondary: MuscleGroup[];
}) {
  const shapesFor = view === "front" ? FRONT : BACK;
  const idle = Object.entries(shapesFor).filter(
    ([mg]) => mg !== primary && !secondary.includes(mg as MuscleGroup),
  );
  const primaryShapes = VIEW_FOR[primary] === view ? shapesFor[primary] : undefined;
  const secondaryHere = secondary.filter((mg) => VIEW_FOR[mg] === view && shapesFor[mg]);

  return (
    <g>
      <Silhouette />
      {/* idle muscles — barely visible definition */}
      {idle.map(([mg, shapes]) => (
        <MuscleShapes key={mg} shapes={shapes!} fill={MUSCLE_IDLE} />
      ))}
      {/* secondary — amber, no glow */}
      {secondaryHere.map((mg) => (
        <MuscleShapes key={mg} shapes={shapesFor[mg]!} fill={SECONDARY} opacity={0.55} />
      ))}
      {/* primary — green with glow */}
      {primaryShapes && <MuscleShapes shapes={primaryShapes} fill={PRIMARY} glow />}
    </g>
  );
}

export default function MuscleMap({
  primary,
  secondary = [],
  className = "",
}: {
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-elev p-4 ${className}`}>
      <svg viewBox="0 0 420 345" className="mx-auto block w-full max-w-72">
        <defs>
          <filter id="mm-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <Figure view="front" primary={primary} secondary={secondary} />
        <g transform="translate(220 0)">
          <Figure view="back" primary={primary} secondary={secondary} />
        </g>
      </svg>
      <div className="mt-3 flex items-center justify-center gap-5 text-[11px] text-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIMARY, boxShadow: `0 0 8px ${PRIMARY}` }} />
          Target · {primary}
        </span>
        {secondary.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full opacity-70" style={{ background: SECONDARY }} />
            Assisting
          </span>
        )}
      </div>
      <div className="mt-1 flex justify-center gap-24 text-[10px] uppercase tracking-wider text-faint/70">
        <span>Front</span>
        <span>Back</span>
      </div>
    </div>
  );
}
