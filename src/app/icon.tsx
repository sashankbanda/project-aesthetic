import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// dot-matrix dumbbell — the app's glyph identity ('1' lit · '2' accent)
const ART = [
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

export default function Icon() {
  const cell = 38;
  const cols = ART[0].length;
  const rows = ART.length;
  const ox = (512 - cols * cell) / 2;
  const oy = (512 - rows * cell) / 2;
  const r = cell * 0.36;

  const dots: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = ART[y][x];
      const cx = ox + x * cell + cell / 2;
      const cy = oy + y * cell + cell / 2;
      if (ch === "1") {
        dots.push(<circle key={`${x}-${y}`} cx={cx} cy={cy} r={r} fill="#f4f4f2" />);
      } else if (ch === "2") {
        dots.push(<circle key={`${x}-${y}`} cx={cx} cy={cy} r={r} fill="#ff4b2f" />);
      } else {
        // faint ghost grid — the matrix behind the glyph
        dots.push(<circle key={`${x}-${y}`} cx={cx} cy={cy} r={r * 0.55} fill="#f4f4f2" opacity={0.07} />);
      }
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0d0c",
          borderRadius: 110,
        }}
      >
        <svg width="512" height="512" viewBox="0 0 512 512">
          {dots}
        </svg>
      </div>
    ),
    { ...size },
  );
}
