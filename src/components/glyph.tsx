"use client";
// ============================================================
// Glyph Matrix — Nothing-style dot-matrix animations.
// GlyphMatrix plays hand-authored frames ('1' lit · '2' dim ·
// '.' off); GlyphSpinner is a procedural orbiting-dot loader.
// Both freeze on prefers-reduced-motion.
// ============================================================
import { useEffect, useState } from "react";

// ---------- frame art ----------
// glyphs are authored like the Glyph Editor: rows of . 1 2

export const FLAME_FRAMES: string[][] = [
  [
    "...1....",
    "...11...",
    "..111...",
    "..1111..",
    ".11111..",
    ".112211.",
    ".122221.",
    ".122221.",
    "..1221..",
    "...11...",
  ],
  [
    "....1...",
    "...11...",
    "...111..",
    "..1111..",
    ".11111..",
    ".112211.",
    ".122221.",
    ".122221.",
    "..1221..",
    "...11...",
  ],
  [
    "...1....",
    "..11....",
    "..111...",
    ".1111...",
    ".11111..",
    ".112211.",
    ".122221.",
    ".122221.",
    "..1221..",
    "...11...",
  ],
];

export const MOON_FRAMES: string[][] = [
  [
    "............",
    "....1111....",
    "..111111.1..",
    ".11111......",
    ".1111.......",
    "11111.....2.",
    "11111.......",
    ".1111.......",
    ".11111......",
    "..111111....",
    "....1111....",
    "............",
  ],
  [
    "............",
    "....1111....",
    "..111111....",
    ".11111....1.",
    ".1111.......",
    "11111.......",
    "11111.......",
    ".1111....2..",
    ".11111......",
    "..111111....",
    "....1111....",
    "............",
  ],
  [
    "............",
    "....1111....",
    "..111111.2..",
    ".11111......",
    ".1111.......",
    "11111.....1.",
    "11111.......",
    ".1111.......",
    ".11111......",
    "..111111....",
    "....1111....",
    "............",
  ],
];

export const CHECK_FRAMES: string[][] = [
  [
    "............",
    "..........1.",
    ".........11.",
    "........11..",
    ".1.....11...",
    ".11...11....",
    "..11.11.....",
    "...111......",
    "....1.......",
    "............",
  ],
  [
    ".....2......",
    "..........1.",
    ".2.......11.",
    "........11..",
    ".1.....11..2",
    ".11...11....",
    "..11.11.....",
    "2..111......",
    "....1.......",
    ".......2....",
  ],
  [
    "............",
    "..........1.",
    ".........11.",
    "........11..",
    ".1.....11...",
    ".11...11....",
    "..11.11.....",
    "...111......",
    "....1.......",
    "............",
  ],
];

/** dumbbell rep — bar rises and falls over its shadow */
const DB_TOP = [
  "............",
  ".1........1.",
  ".11......11.",
  ".1111111111.",
  ".11......11.",
  ".1........1.",
  "............",
  "............",
  "....2222....",
  "............",
];
const DB_MID = [
  "............",
  "............",
  ".1........1.",
  ".11......11.",
  ".1111111111.",
  ".11......11.",
  ".1........1.",
  "............",
  "....2222....",
  "............",
];
const DB_LOW = [
  "............",
  "............",
  "............",
  ".1........1.",
  ".11......11.",
  ".1111111111.",
  ".11......11.",
  ".1........1.",
  "....2222....",
  "............",
];
export const DUMBBELL_FRAMES: string[][] = [DB_MID, DB_TOP, DB_MID, DB_LOW];

export const TROPHY_FRAMES: string[][] = [
  [
    "............",
    ".1111111111.",
    ".1.111111.1.",
    ".1.111111.1.",
    "..1.1111.1..",
    "...111111...",
    "....1111....",
    ".....11.....",
    "....1111....",
    "...111111...",
  ],
  [
    "..2......2..",
    ".1111111111.",
    ".1.111111.1.",
    ".1.111111.1.",
    "..1.1111.1..",
    "...111111...",
    "....1111....",
    ".....11.....",
    "....1111....",
    "...111111...",
  ],
  [
    ".....2......",
    ".1111111111.",
    ".1.111111.1.",
    ".1.111111.1.",
    "..1.1111.1..",
    "...111111...",
    "....1111....",
    ".....11.....",
    "....1111....",
    "...111111...",
  ],
];

/** three Z's breathing in sequence */
export const SLEEP_FRAMES: string[][] = [
  [
    ".....1111.",
    ".......1..",
    "......1...",
    ".....1111.",
    "...222....",
    "....2.....",
    "...222....",
    ".222......",
    "..2.......",
    ".222......",
  ],
  [
    ".....2222.",
    ".......2..",
    "......2...",
    ".....2222.",
    "...111....",
    "....1.....",
    "...111....",
    ".222......",
    "..2.......",
    ".222......",
  ],
  [
    ".....2222.",
    ".......2..",
    "......2...",
    ".....2222.",
    "...222....",
    "....2.....",
    "...222....",
    ".111......",
    "..1.......",
    ".111......",
  ],
];

/** droplet falls, ripples on the surface */
export const DROP_FRAMES: string[][] = [
  [
    "...1....",
    "..111...",
    ".11111..",
    ".11111..",
    "..111...",
    "........",
    "........",
    "........",
    "........",
    "..2222..",
  ],
  [
    "........",
    "........",
    "...1....",
    "..111...",
    ".11111..",
    ".11111..",
    "..111...",
    "........",
    "........",
    "..2222..",
  ],
  [
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
    "...11...",
    "..2112..",
    ".2....2.",
    "..2222..",
  ],
];

/** alternating footprints */
export const STEPS_FRAMES: string[][] = [
  [
    ".111....",
    ".111....",
    ".1111...",
    "..111...",
    "..2.....",
    "....222.",
    "....222.",
    "....2222",
    ".....222",
    ".....2..",
  ],
  [
    ".222....",
    ".222....",
    ".2222...",
    "..222...",
    "..2.....",
    "....111.",
    "....111.",
    "....1111",
    ".....111",
    ".....1..",
  ],
];

/** bicep flex — the protein-goal reward */
export const FLEX_FRAMES: string[][] = [
  [
    "............",
    "............",
    "...11.......",
    "...111......",
    "..11111.....",
    ".1111111....",
    ".11111111...",
    ".111111111..",
    "..11111111..",
    "............",
  ],
  [
    "...11.......",
    "..1111......",
    "..1111......",
    "...1111.....",
    "..111111....",
    ".11111111...",
    ".111111111..",
    ".111111111..",
    "..11111111..",
    "............",
  ],
];

/** camera — lens blinks */
export const CAMERA_FRAMES: string[][] = [
  [
    "............",
    "...11.......",
    ".1111111111.",
    ".1........1.",
    ".1...11...1.",
    ".1..1221..1.",
    ".1...11...1.",
    ".1........1.",
    ".1111111111.",
  ],
  [
    "............",
    "...11.......",
    ".1111111111.",
    ".1........1.",
    ".1..1111..1.",
    ".1..1111..1.",
    ".1..1111..1.",
    ".1........1.",
    ".1111111111.",
  ],
];

/**
 * Mood faces — keyed by the emoji stored in the journal so existing
 * data keeps working; the UI renders these instead of emoji.
 */
export const MOOD_GLYPHS: Record<string, string[]> = {
  "😞": [
    "..11111..",
    ".1.....1.",
    "1..1.1..1",
    "1.......1",
    "1..111..1",
    "1.1...1.1",
    ".1.....1.",
    "..11111..",
  ],
  "😐": [
    "..11111..",
    ".1.....1.",
    "1..1.1..1",
    "1.......1",
    "1.......1",
    "1.11111.1",
    ".1.....1.",
    "..11111..",
  ],
  "🙂": [
    "..11111..",
    ".1.....1.",
    "1..1.1..1",
    "1.......1",
    "1.1...1.1",
    "1..111..1",
    ".1.....1.",
    "..11111..",
  ],
  "😊": [
    "..11111..",
    ".1.....1.",
    "1..1.1..1",
    "1.......1",
    "1.11111.1",
    "1..111..1",
    ".1.....1.",
    "..11111..",
  ],
  "🤩": [
    "2.11111.2",
    ".1.....1.",
    "1.11.11.1",
    "1.......1",
    "1.11111.1",
    "1..111..1",
    ".1.....1.",
    "2.11111.2",
  ],
};

// ---------- components ----------

export function GlyphMatrix({
  frames,
  fps = 5,
  cell = 5,
  color = "var(--color-ink)",
  className = "",
}: {
  frames: string[][];
  fps?: number;
  cell?: number;
  color?: string;
  className?: string;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (frames.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % frames.length), 1000 / fps);
    return () => clearInterval(t);
  }, [frames.length, fps]);

  const frame = frames[i % frames.length];
  const rows = frame.length;
  const cols = frame[0].length;
  const r = cell * 0.38;

  return (
    <svg
      viewBox={`0 0 ${cols * cell} ${rows * cell}`}
      width={cols * cell}
      height={rows * cell}
      className={className}
      style={{ filter: `drop-shadow(0 0 ${cell}px color-mix(in srgb, ${color} 27%, transparent))` }}
      aria-hidden
    >
      {frame.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === "1" || ch === "2" ? (
            <circle
              key={`${x}-${y}`}
              cx={x * cell + cell / 2}
              cy={y * cell + cell / 2}
              r={r}
              fill={color}
              opacity={ch === "2" ? 0.35 : 1}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

/** Procedural loader — a dot with a fading tail orbiting a matrix ring. */
export function GlyphSpinner({
  cell = 5,
  color = "var(--color-ink)",
  className = "",
}: {
  cell?: number;
  color?: string;
  className?: string;
}) {
  const SIZE = 13; // grid cells per side
  const SLOTS = 20;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setTick((n) => (n + 1) % SLOTS), 80);
    return () => clearInterval(t);
  }, []);

  const c = (SIZE - 1) / 2;
  const radius = c - 1;
  const dots = Array.from({ length: SLOTS }, (_, s) => {
    const angle = (s / SLOTS) * Math.PI * 2 - Math.PI / 2;
    const x = Math.round(c + radius * Math.cos(angle));
    const y = Math.round(c + radius * Math.sin(angle));
    // distance behind the head, 0 = head
    const behind = (tick - s + SLOTS) % SLOTS;
    const opacity = behind === 0 ? 1 : behind <= 4 ? 0.55 - behind * 0.11 : 0.1;
    return { x, y, opacity };
  });
  const r = cell * 0.38;

  return (
    <svg
      viewBox={`0 0 ${SIZE * cell} ${SIZE * cell}`}
      width={SIZE * cell}
      height={SIZE * cell}
      className={className}
      style={{ filter: `drop-shadow(0 0 ${cell}px color-mix(in srgb, ${color} 27%, transparent))` }}
      aria-label="loading"
      role="img"
    >
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x * cell + cell / 2}
          cy={d.y * cell + cell / 2}
          r={r}
          fill={color}
          opacity={d.opacity}
        />
      ))}
    </svg>
  );
}
