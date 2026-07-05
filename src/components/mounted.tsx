"use client";
import { useSyncExternalStore, type ReactNode } from "react";

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
      <div className="flex h-64 items-center justify-center text-sm text-faint">
        Loading…
      </div>
    );
  return <>{children}</>;
}
