"use client";
// ============================================================
// DotNumber — dot-matrix numeral display (the "3.3 L" look).
// Renders digits as a 5×7 dot grid in SVG with a soft glow and
// an optional faint ghost grid behind the lit dots.
// ============================================================

const GLYPHS: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  ".": ["0", "0", "0", "0", "0", "0", "1"],
  ":": ["0", "0", "1", "0", "1", "0", "0"],
  "-": ["000", "000", "000", "111", "000", "000", "000"],
  "%": ["11000", "11001", "00010", "00100", "01000", "10011", "00011"],
  " ": ["00", "00", "00", "00", "00", "00", "00"],
};

export default function DotNumber({
  value,
  cell = 7,
  color = "#ffffff",
  ghost = true,
  className = "",
}: {
  value: string | number;
  /** grid cell size in px — dot fills ~72% of it */
  cell?: number;
  color?: string;
  /** show the unlit dot grid faintly behind */
  ghost?: boolean;
  className?: string;
}) {
  const text = String(value);
  const glyphs = [...text].map((ch) => GLYPHS[ch] ?? GLYPHS[" "]);
  const gapCells = 1; // one empty column between glyphs
  const totalCols = glyphs.reduce((n, g) => n + g[0].length, 0) + gapCells * (glyphs.length - 1);
  const rows = 7;
  const W = totalCols * cell;
  const H = rows * cell;
  const r = cell * 0.36;

  const lit: { x: number; y: number }[] = [];
  const off: { x: number; y: number }[] = [];
  let colOffset = 0;
  for (const glyph of glyphs) {
    const w = glyph[0].length;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < w; x++) {
        const cx = (colOffset + x) * cell + cell / 2;
        const cy = y * cell + cell / 2;
        if (glyph[y][x] === "1") lit.push({ x: cx, y: cy });
        else off.push({ x: cx, y: cy });
      }
    }
    colOffset += w + gapCells;
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className={className}
      style={{ filter: `drop-shadow(0 0 ${cell * 1.2}px ${color}55)` }}
      aria-label={text}
      role="img"
    >
      {ghost &&
        off.map((d, i) => (
          <circle key={`g${i}`} cx={d.x} cy={d.y} r={r * 0.75} fill={color} opacity="0.1" />
        ))}
      {lit.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={r} fill={color} />
      ))}
    </svg>
  );
}
