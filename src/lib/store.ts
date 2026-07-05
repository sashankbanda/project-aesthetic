"use client";
// ============================================================
// Persistence layer — localStorage today, cloud later.
// The UI only ever talks to useApp() / update(), so swapping
// the backend means changing this one file.
// ============================================================
import { useSyncExternalStore } from "react";
import type { AppState } from "./types";
import { createInitialState } from "./seed";

const KEY = "project-aesthetic-v1";

let cache: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  if (cache) return cache;
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as AppState) : createInitialState();
  } catch {
    cache = createInitialState();
  }
  return cache;
}

function persist() {
  if (typeof window === "undefined" || !cache) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch (e) {
    // localStorage full (usually photos) — surface loudly in dev
    console.error("Failed to persist app state", e);
  }
}

export function getState(): AppState {
  return load();
}

/** Immutable-ish update: recipe mutates a shallow clone root. */
export function update(recipe: (draft: AppState) => void) {
  const next = structuredClone(load());
  recipe(next);
  cache = next;
  persist();
  listeners.forEach((l) => l());
}

export function resetAll() {
  cache = createInitialState();
  persist();
  listeners.forEach((l) => l());
}

export function importState(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as AppState;
    if (typeof parsed !== "object" || !parsed.profile || !parsed.plan) return false;
    cache = parsed;
    persist();
    listeners.forEach((l) => l());
    return true;
  } catch {
    return false;
  }
}

export function exportState(): string {
  return JSON.stringify(load(), null, 2);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverSnapshot = createInitialState();

/** React hook — components re-render on any state change. */
export function useApp(): AppState {
  return useSyncExternalStore(subscribe, load, () => serverSnapshot);
}

// ---------- date helpers ----------
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const monthStr = () => todayStr().slice(0, 7);
