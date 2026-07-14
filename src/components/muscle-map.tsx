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

// Anatomical bezier shapes, hand-tuned against reference renders.
// Left-side coordinates; MuscleShapes mirrors non-center shapes.

const FRONT: Partial<Record<MuscleGroup, Shape[]>> = {
  Traps: [{ d: "M92,47 C86,49 76,53 68,58 C72,61 78,61 84,59 C89,57 92,53 94,50 Z" }],
  "Side Delts": [{ d: "M56,67 C48,70 44,77 44,85 C44,92 48,96 54,95 C60,93 63,86 63,78 C63,71 60,66 56,67 Z" }],
  "Front Delts": [{ d: "M61,70 C65,66 70,66 73,70 C74,74 72,78 68,80 C64,80 61,76 61,72 Z" }],
  "Upper Chest": [{ d: "M97,58 C90,56 80,57 72,61 C69,65 70,69 74,71 C82,73 91,72 97,70 Z" }],
  "Mid Chest": [{ d: "M97,72 C89,72 78,74 71,78 C67,86 69,95 77,99 C85,103 94,101 97,95 Z" }],
  Biceps: [{ d: "M46,88 C44,82 50,78 56,80 C61,83 62,92 61,102 C60,110 56,116 51,115 C46,113 45,104 45,96 Z" }],
  Forearms: [{ d: "M45,136 C48,130 53,130 55,136 C56,144 53,156 49,166 C46,172 41,172 40,166 C40,156 42,144 45,136 Z" }],
  Abs: [
    { d: "M87,105 C95,103 105,103 113,105 L112,121 C104,123 96,123 88,121 Z", center: true },
    { d: "M89,125 C96,123 104,123 111,125 L110,141 C104,143 96,143 90,141 Z", center: true },
    { d: "M91,145 C97,143 103,143 109,145 L108,161 C103,163 97,163 92,161 Z", center: true },
    { d: "M92,165 C97,163 103,163 108,165 C108,174 105,182 100,186 C95,182 92,174 92,165 Z", center: true },
  ],
  Quads: [{ d: "M69,196 C63,210 61,228 62,244 C63,256 66,264 70,268 C77,270 84,266 86,257 C89,243 90,224 89,210 C88,201 84,196 78,194 C74,193 71,194 69,196 Z" }],
  Calves: [{ d: "M68,276 C66,288 66,300 69,312 C71,318 75,318 77,312 C79,300 79,286 76,276 C73,272 70,272 68,276 Z" }],
};

const BACK: Partial<Record<MuscleGroup, Shape[]>> = {
  Traps: [{ d: "M100,44 C93,47 82,52 72,57 C80,62 88,68 93,78 C96,86 97,94 100,100 C103,94 104,86 107,78 C112,68 120,62 128,57 C118,52 107,47 100,44 Z", center: true }],
  "Rear Delts": [{ d: "M56,67 C48,70 44,78 45,86 C46,93 51,96 57,94 C62,91 64,84 63,76 C62,70 59,66 56,67 Z" }],
  "Upper Back": [{ d: "M69,63 C65,69 64,78 66,86 C69,93 76,96 83,96 C88,95 91,91 91,85 C91,77 88,68 84,63 C79,59 72,59 69,63 Z" }],
  Lats: [{ d: "M64,92 C61,102 60,114 63,126 C67,138 78,147 90,151 C94,152 96,148 96,142 C95,128 93,112 89,102 C83,94 73,90 67,90 C65,90 64,91 64,92 Z" }],
  "Lower Back": [{ d: "M100,134 C94,138 90,147 92,158 C94,167 98,171 100,171 C102,171 106,167 108,158 C110,147 106,138 100,134 Z", center: true }],
  Triceps: [{ d: "M46,88 C44,82 49,78 54,80 C60,83 62,92 61,102 C61,112 57,118 51,116 C46,114 44,106 45,98 Z" }],
  Forearms: [{ d: "M45,136 C48,130 53,130 55,136 C56,144 53,156 49,166 C46,172 41,172 40,166 C40,156 42,144 45,136 Z" }],
  Glutes: [{ d: "M74,166 C66,170 62,179 64,190 C66,199 75,203 85,202 C92,201 96,195 95,187 C94,177 89,169 83,167 C80,165 77,165 74,166 Z" }],
  Hamstrings: [{ d: "M69,210 C64,222 62,238 64,252 C66,262 70,268 75,268 C81,268 85,262 86,252 C88,238 87,222 84,212 C80,205 73,205 69,210 Z" }],
  Calves: [{ d: "M66,272 C63,282 63,296 67,308 C70,315 78,315 81,308 C85,296 85,282 82,272 C78,265 70,265 66,272 Z" }],
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

/** Anatomical body silhouette shared by both views. */
const ARM_D =
  "M55,66 C47,68 42,75 42,84 C42,94 44,102 46,110 C47,118 47,126 46,134 C44,144 41,154 38,164 C36,172 34,178 33,184 C37,187 41,187 44,185 C47,177 50,168 52,158 C54,148 55,140 56,132 C58,122 60,112 61,102 C62,92 62,80 60,70 C58,66 56,65 55,66 Z";
const HAND_D =
  "M33,186 C29,190 26,196 27,202 C28,208 33,210 37,207 C40,203 42,195 42,189 C39,186 35,185 33,186 Z";
const LEG_D =
  "M70,192 C64,206 60,224 61,242 C62,254 64,264 67,272 C64,282 63,294 65,306 C67,318 69,326 70,331 L82,331 C84,320 86,308 86,297 C87,286 85,276 83,269 C86,256 89,240 90,224 C91,210 94,201 98,198 C90,196 78,194 70,192 Z";
const FOOT_D = "M69,331 C64,335 61,339 62,343 L84,343 C84,337 83,333 82,331 Z";

function Silhouette() {
  return (
    <g fill={BASE} stroke={BASE_STROKE} strokeWidth="1">
      {/* head */}
      <path d="M100,6 C109,6 114,13 114,21 C114,29 110,35 106,39 L106,44 C104,46 96,46 94,44 L94,39 C90,35 86,29 86,21 C86,13 91,6 100,6 Z" />
      {/* torso — trap slope, lat taper, athletic waist */}
      <path d="M93,44 C92,50 88,53 82,55 C72,58 62,62 56,67 C58,76 61,82 64,88 C66,96 67,104 68,114 C69,124 70,132 71,140 C68,148 66,156 66,164 C66,176 68,185 71,192 C78,198 90,200 97,200 C99,196 99,193 100,193 C101,193 101,196 103,200 C110,200 122,198 130,192 C132,185 134,176 134,164 C134,156 132,148 129,140 C130,132 131,124 132,114 C133,104 134,96 136,88 C139,82 142,76 144,67 C138,62 128,58 118,55 C112,53 108,50 107,44 C103,46 97,46 93,44 Z" />
      {/* arms + hands */}
      <path d={ARM_D} />
      <path d={HAND_D} />
      <g transform="translate(200 0) scale(-1 1)">
        <path d={ARM_D} />
        <path d={HAND_D} />
      </g>
      {/* legs + feet */}
      <path d={LEG_D} />
      <path d={FOOT_D} />
      <g transform="translate(200 0) scale(-1 1)">
        <path d={LEG_D} />
        <path d={FOOT_D} />
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

/**
 * Recovery heat view — every muscle shaded by how recently it was
 * trained (1 = just trained/fatigued → 0 = fully fresh).
 */
export function MuscleHeatMap({
  heat,
  className = "",
}: {
  heat: Partial<Record<MuscleGroup, number>>;
  className?: string;
}) {
  const figure = (view: View) => {
    const shapesFor = view === "front" ? FRONT : BACK;
    return (
      <g>
        <Silhouette />
        {Object.entries(shapesFor).map(([mg, shapes]) => {
          const h = heat[mg as MuscleGroup] ?? 0;
          return h > 0 ? (
            <MuscleShapes key={mg} shapes={shapes!} fill={PRIMARY} opacity={0.2 + 0.8 * h} />
          ) : (
            <MuscleShapes key={mg} shapes={shapes!} fill={MUSCLE_IDLE} />
          );
        })}
      </g>
    );
  };
  return (
    <div className={className}>
      <svg viewBox="0 0 420 345" className="mx-auto block w-full max-w-72">
        {figure("front")}
        <g transform="translate(220 0)">{figure("back")}</g>
      </svg>
      <div className="mt-3 flex items-center justify-center gap-5 text-[11px] text-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIMARY }} /> Fatigued
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full opacity-40" style={{ background: PRIMARY }} /> Recovering
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: MUSCLE_IDLE }} /> Fresh
        </span>
      </div>
      <div className="mt-1 flex justify-center gap-24 text-[10px] uppercase tracking-wider text-faint/70">
        <span>Front</span>
        <span>Back</span>
      </div>
    </div>
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
