"use client";
// Renders optional exercise demo images (mannequin renders etc.)
// with right/wrong form framing. Files live in /public/exercises/.
import { Check, X } from "lucide-react";
import type { Exercise } from "@/lib/types";

export default function ExerciseMedia({ ex }: { ex: Exercise }) {
  if (!ex.images || ex.images.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {ex.images.map((img) => (
        <figure
          key={img.src}
          className={`relative overflow-hidden rounded-2xl border ${
            img.kind === "wrong"
              ? "border-bad/40"
              : img.kind === "right"
                ? "border-good/40"
                : "border-line"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.src} alt={img.caption} className="aspect-square w-full object-cover" />
          {img.kind === "right" && (
            <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-good text-bg">
              <Check size={15} strokeWidth={3} />
            </span>
          )}
          {img.kind === "wrong" && (
            <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-bad text-white">
              <X size={15} strokeWidth={3} />
            </span>
          )}
          <figcaption className="bg-elev px-3 py-2 text-[11px] text-dim">{img.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
