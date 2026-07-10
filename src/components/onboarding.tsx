"use client";
// First-run gate — shows the plan wizard once for brand-new installs.
// The wizard itself lives in plan-wizard.tsx (also used to switch
// plans later from the More page).
import { useSyncExternalStore } from "react";
import PlanWizard from "./plan-wizard";
import { useApp } from "@/lib/store";

const emptySubscribe = () => () => {};

export default function OnboardingGate() {
  const ready = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const state = useApp();
  if (!ready) return null;
  // only brand-new installs: never logged a session and never finished/skipped
  if (state.onboarded || state.sessions.length > 0) return null;
  return <PlanWizard mode="onboard" />;
}
