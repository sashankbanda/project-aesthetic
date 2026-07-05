"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { GlyphSpinner } from "./glyph";

const emptySubscribe = () => () => {};

/**
 * Renders children only after hydration — all views read localStorage
 * and dates, so this keeps server and client markup consistent.
 * (useSyncExternalStore returns the server snapshot during hydration,
 * then the client snapshot — no effect/setState needed.)
 */
export default function Mounted({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  if (!ready)
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-5">
        <GlyphSpinner cell={5} />
        <div className="label-mono text-faint">Loading</div>
      </div>
    );
  return <>{children}</>;
}
