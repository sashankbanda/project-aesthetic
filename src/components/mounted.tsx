"use client";
import { useSyncExternalStore, type ReactNode } from "react";

const emptySubscribe = () => () => {};

/**
 * Renders children only after hydration — all views read localStorage
 * and dates, so this keeps server and client markup consistent.
 * (useSyncExternalStore returns the server snapshot during hydration,
 * then the client snapshot — no effect/setState needed.)
 * The fallback is a skeleton of the typical page shape, not a spinner —
 * perceived speed beats a loading indicator (Doherty threshold).
 */
export default function Mounted({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  if (!ready)
    return (
      <div className="animate-pulse" aria-hidden>
        <div className="mb-2 h-3 w-24 rounded-full bg-card2" />
        <div className="mb-8 h-9 w-52 rounded-2xl bg-card2" />
        <div className="mb-4 h-40 rounded-[28px] bg-card2" />
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="h-28 rounded-[28px] bg-card2" />
          <div className="h-28 rounded-[28px] bg-card2" />
          <div className="h-28 rounded-[28px] bg-card2" />
        </div>
        <div className="h-24 rounded-3xl bg-card2" />
      </div>
    );
  return <>{children}</>;
}
