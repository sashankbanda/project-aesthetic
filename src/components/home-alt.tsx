"use client";
// "No gym?" block — the bodyweight/household substitute that hits
// the same primary muscle. Shown in the library detail and in the
// workout card's form guide.
import { House } from "lucide-react";
import type { Exercise } from "@/lib/types";

export default function HomeAlt({ ex }: { ex: Exercise }) {
  if (!ex.home) return null;
  return (
    <div className="rounded-2xl border border-line bg-elev px-3.5 py-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-accent2">
          <House size={12} /> No gym? Home version
        </div>
        <span className="label-mono text-[9px] text-faint">{ex.home.reps}</span>
      </div>
      <div className="text-[13px] font-semibold">
        {ex.home.name}
        <span className="ml-2 text-[11px] font-medium text-faint">targets {ex.primary}</span>
      </div>
      <p className="mt-0.5 text-[13px] leading-relaxed text-dim">{ex.home.how}</p>
    </div>
  );
}
