"use client";
import { useState } from "react";
import Mounted from "@/components/mounted";
import ProgressNav from "@/components/progress-nav";
import { Card, PageHead, SectionTitle } from "@/components/ui";
import { monthStr, update, useApp } from "@/lib/store";
import type { Measurement, PhotoSet } from "@/lib/types";
import { ArrowDown, ArrowUp, Camera, GitCompareArrows, History, Minus, Ruler, X as XIcon } from "lucide-react";

const ANGLES = ["front", "side", "back"] as const;
type Angle = (typeof ANGLES)[number];

/** Resize + compress to keep localStorage happy (~5 MB budget). */
async function fileToDataUrl(file: File, maxW = 640, quality = 0.72): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export default function PhotosPage() {
  return (
    <Mounted>
      <PhotosInner />
    </Mounted>
  );
}

function PhotosInner() {
  const state = useApp();
  const thisMonth = monthStr();
  const months = [...state.photos].sort((a, b) => (a.month < b.month ? 1 : -1));
  const current = months.find((p) => p.month === thisMonth);
  const previous = months.find((p) => p.month !== thisMonth);
  const [compareAngle, setCompareAngle] = useState<Angle>("front");
  const [slider, setSlider] = useState(50);

  const upload = (angle: Angle) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await fileToDataUrl(file);
        update((draft) => {
          let set = draft.photos.find((p) => p.month === thisMonth);
          if (!set) {
            set = { month: thisMonth };
            draft.photos.push(set);
          }
          set[angle] = dataUrl;
        });
      } catch {
        alert("Couldn't read that image — try a different one.");
      }
    };
    input.click();
  };

  const removePhoto = (month: string, angle: Angle) =>
    update((draft) => {
      const set = draft.photos.find((p) => p.month === month);
      if (set) set[angle] = undefined;
    });

  return (
    <>
      <PageHead
        eyebrow="Progress"
        title="Photos"
        sub="Same lighting, same spot, same pose — first week of every month."
      />
      <ProgressNav />

      <SectionTitle>
        <Camera size={17} className="text-accent2" /> This month — {thisMonth}
      </SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        {ANGLES.map((angle) => {
          const src = current?.[angle];
          return (
            <div key={angle} className="relative">
              <button
                onClick={() => upload(angle)}
                className="card grid aspect-3/4 w-full place-items-center overflow-hidden border-dashed"
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={`${angle} pose`} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-faint">
                    + {angle[0].toUpperCase() + angle.slice(1)}
                  </span>
                )}
              </button>
              {src && (
                <button
                  onClick={() => removePhoto(thisMonth, angle)}
                  className="pressable absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/60 text-white"
                >
                  <XIcon size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* comparison slider */}
      {current && previous && current[compareAngle] && previous[compareAngle] ? (
        <>
          <SectionTitle
            right={
              <div className="flex gap-1.5">
                {ANGLES.map((a) => (
                  <button
                    key={a}
                    onClick={() => setCompareAngle(a)}
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
                      compareAngle === a ? "border-accent/40 bg-accent/15 text-ink" : "border-line text-dim"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            }
          >
            <GitCompareArrows size={17} className="text-accent2" /> {previous.month} vs {current.month}
          </SectionTitle>
          <Card>
            <div className="relative mx-auto aspect-3/4 max-w-sm select-none overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previous[compareAngle]} alt="before" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${slider}%` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current[compareAngle]}
                  alt="after"
                  className="h-full w-full object-cover"
                  style={{ width: `${10000 / slider}%`, maxWidth: "none" }}
                />
              </div>
              <div className="absolute inset-y-0 w-0.5 bg-white/80" style={{ left: `${slider}%` }} />
              <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                {current.month}
              </span>
              <span className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                {previous.month}
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={98}
              value={slider}
              onChange={(e) => setSlider(parseInt(e.target.value))}
              className="mt-4 w-full accent-[#ff4b2f]"
            />
          </Card>
          <PhysiqueDelta />
        </>
      ) : (
        months.length <= 1 && (
          <Card className="mt-6 py-8 text-center text-sm text-faint">
            Upload photos this month and next month — the comparison slider appears automatically.
          </Card>
        )
      )}

      {/* history */}
      {months.length > 0 && (
        <>
          <SectionTitle>
            <History size={17} className="text-accent2" /> History
          </SectionTitle>
          <div className="grid gap-4">
            {months.map((set) => (
              <MonthRow key={set.month} set={set} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function MonthRow({ set }: { set: PhotoSet }) {
  return (
    <Card>
      <div className="mb-2.5 text-sm font-semibold">{set.month}</div>
      <div className="grid grid-cols-3 gap-3">
        {ANGLES.map((angle) =>
          set[angle] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={angle}
              src={set[angle]}
              alt={`${set.month} ${angle}`}
              className="aspect-3/4 w-full rounded-lg object-cover"
            />
          ) : (
            <div key={angle} className="grid aspect-3/4 place-items-center rounded-lg bg-elev text-xs text-faint">
              no {angle}
            </div>
          ),
        )}
      </div>
    </Card>
  );
}

/** measurement deltas between the two most recent entries ≥3 weeks apart */
function PhysiqueDelta() {
  const state = useApp();
  const sorted = [...state.measurements].sort((a, b) => (a.date < b.date ? 1 : -1));
  const latest = sorted[0];
  const prior = sorted.find(
    (m) => new Date(latest.date).getTime() - new Date(m.date).getTime() > 21 * 86400e3,
  );
  if (!latest || !prior) return null;

  const rows: { label: string; key: keyof Measurement; upGood: boolean; unit: string }[] = [
    { label: "Chest", key: "chestCm", upGood: true, unit: "cm" },
    { label: "Shoulders", key: "shouldersCm", upGood: true, unit: "cm" },
    { label: "Arms", key: "armsCm", upGood: true, unit: "cm" },
    { label: "Waist", key: "waistCm", upGood: false, unit: "cm" },
    { label: "Weight", key: "weightKg", upGood: false, unit: "kg" },
  ];

  const deltas = rows
    .map((r) => {
      const a = prior[r.key] as number | undefined;
      const b = latest[r.key] as number | undefined;
      if (a === undefined || b === undefined) return null;
      return { ...r, delta: +(b - a).toFixed(1) };
    })
    .filter(Boolean) as ((typeof rows)[number] & { delta: number })[];

  if (deltas.length === 0) return null;

  return (
    <Card className="mt-4">
      <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <Ruler size={15} className="text-accent2" /> Physique change ({prior.date} → {latest.date})
      </div>
      <div className="flex flex-wrap gap-2.5">
        {deltas.map((d) => {
          const improved = d.upGood ? d.delta > 0 : d.delta < 0;
          return (
            <span
              key={d.label}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                d.delta === 0
                  ? "border-line text-dim"
                  : improved
                    ? "border-good/30 bg-good/10 text-good"
                    : "border-warn/30 bg-warn/10 text-warn"
              }`}
            >
              {d.label}
              {d.delta > 0 ? <ArrowUp size={12} /> : d.delta < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
              {d.delta > 0 ? "+" : ""}
              {d.delta} {d.unit}
            </span>
          );
        })}
      </div>
    </Card>
  );
}
