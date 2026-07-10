"use client";
// Gym Mode preferences — device-level like the theme, opt-in and
// reversible anytime from Account & Settings.
import { useSyncExternalStore } from "react";

export interface GymPrefs {
  /** master switch — shows the Gym Mode button on the Train page */
  enabled: boolean;
  /** spoken coach announcements (SpeechSynthesis) */
  voice: boolean;
  /** experimental: earbud play/pause taps log the set (Media Session) */
  earbud: boolean;
}

const KEY = "aesthetic-gym-prefs";
const DEFAULTS: GymPrefs = { enabled: false, voice: true, earbud: false };

let cache: GymPrefs | null = null;
const listeners = new Set<() => void>();

export function getGymPrefs(): GymPrefs {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULTS;
  try {
    cache = { ...DEFAULTS, ...JSON.parse(window.localStorage.getItem(KEY) ?? "{}") };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache!;
}

export function setGymPrefs(patch: Partial<GymPrefs>) {
  cache = { ...getGymPrefs(), ...patch };
  window.localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useGymPrefs(): GymPrefs {
  return useSyncExternalStore(subscribe, getGymPrefs, () => DEFAULTS);
}
