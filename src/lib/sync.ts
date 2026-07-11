"use client";
// ============================================================
// Client sync engine — local-first, last-write-wins snapshots.
//
//   pull:  GET /api/sync  → if server is newer, adopt it
//          (photo IMAGES are device-only: local thumbnails are
//           preserved and only metadata merges)
//   push:  PUT /api/sync  → sanitized state, images stripped
//
// The store stays the single source of truth for the UI; sync
// happens around it, never inside it.
// ============================================================
import { getState, replaceState } from "./store";
import { createInitialState } from "./seed";
import type { AppState, PhotoSet, WorkoutDay } from "./types";
import type { SyncState } from "./schemas";

export type SyncStatus = {
  state: "idle" | "syncing" | "ok" | "error" | "offline";
  lastSyncedAt?: string;
  detail?: string;
};

let status: SyncStatus = { state: "idle" };
const statusListeners = new Set<() => void>();

function setStatus(next: SyncStatus) {
  status = next;
  statusListeners.forEach((l) => l());
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function subscribeSyncStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

/** Strip photo images — only metadata may leave the device. */
function toSyncPayload(state: AppState): SyncState {
  const photoMeta: SyncState["photoMeta"] = [];
  for (const set of state.photos) {
    for (const angle of ["front", "side", "back"] as const) {
      if (set[angle]) {
        photoMeta.push({
          month: set.month,
          angle,
          weightKg: set.weightKg,
          capturedAt: set.capturedAt,
        });
      }
    }
  }
  return {
    modifiedAt: state.modifiedAt ?? new Date(0).toISOString(),
    profile: {
      name: state.profile.name,
      heightCm: state.profile.heightCm,
      birthYear: state.profile.birthYear,
      phase: state.profile.phase,
      targetWeightKg: state.profile.targetWeightKg,
      targetBodyFatPct: state.profile.targetBodyFatPct,
      proteinGoalG: state.profile.proteinGoalG,
      waterGoalMl: state.profile.waterGoalMl,
      stepsGoal: state.profile.stepsGoal,
      sleepGoalH: state.profile.sleepGoalH,
      nextMilestone: state.profile.nextMilestone,
      training: state.profile.training,
    },
    plan: state.plan,
    sessions: state.sessions,
    measurements: state.measurements,
    foodLog: state.foodLog,
    recovery: state.recovery,
    journal: state.journal,
    roadmap: state.roadmap,
    activities: state.activities ?? [],
    challenge: state.challenge,
    photoMeta,
    unlocked: state.unlocked,
  };
}

/** Build local AppState from server state, keeping device-only photo images. */
function fromServerState(server: SyncState, local: AppState): AppState {
  const photos: PhotoSet[] = [...local.photos];
  for (const meta of server.photoMeta) {
    let set = photos.find((p) => p.month === meta.month);
    if (!set) {
      // photo exists on another device — keep the metadata visible
      set = { month: meta.month };
      photos.push(set);
    }
    set.weightKg = set.weightKg ?? meta.weightKg;
    set.capturedAt = set.capturedAt ?? meta.capturedAt;
  }
  const base = createInitialState();
  return {
    version: local.version || base.version,
    modifiedAt: server.modifiedAt,
    profile: { ...base.profile, ...server.profile },
    plan: (server.plan as WorkoutDay[])?.length ? (server.plan as WorkoutDay[]) : local.plan,
    sessions: server.sessions,
    measurements: server.measurements,
    foodLog: server.foodLog,
    recovery: server.recovery,
    journal: server.journal,
    roadmap: server.roadmap,
    activities: server.activities ?? [],
    challenge: server.challenge,
    photos,
    unlocked: server.unlocked,
  };
}

async function push(state: AppState): Promise<void> {
  const res = await fetch("/api/sync", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toSyncPayload(state)),
  });
  if (!res.ok) throw new Error(`push failed (${res.status})`);
}

/**
 * Full sync: newer side wins wholesale, then both sides converge.
 * Simple, predictable, right-sized for a single-owner dataset.
 */
export async function syncNow(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus({ ...status, state: "offline" });
    return;
  }
  setStatus({ ...status, state: "syncing" });
  try {
    const res = await fetch("/api/sync");
    const local = getState();

    if (res.status === 404) {
      // first device — seed the server
      await push(local);
    } else if (res.ok) {
      const server = (await res.json()) as SyncState;
      const serverTime = Date.parse(server.modifiedAt) || 0;
      const localTime = Date.parse(local.modifiedAt ?? "") || 0;
      if (serverTime > localTime) {
        replaceState(fromServerState(server, local));
      } else if (localTime > serverTime) {
        await push(local);
      }
    } else if (res.status === 401 || res.status === 503) {
      setStatus({ state: "idle" });
      return;
    } else {
      throw new Error(`pull failed (${res.status})`);
    }

    setStatus({ state: "ok", lastSyncedAt: new Date().toISOString() });
  } catch (e) {
    setStatus({
      state: "error",
      lastSyncedAt: status.lastSyncedAt,
      detail: e instanceof Error ? e.message : "sync failed",
    });
  }
}

/** Debounced push after local edits (called by the sync agent). */
let pushTimer: ReturnType<typeof setTimeout> | null = null;
export function schedulePush(delayMs = 4000) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void syncNow();
  }, delayMs);
}
