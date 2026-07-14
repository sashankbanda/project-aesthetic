// ============================================================
// Tour coverage — the enforcement half of the registry rule.
// Scans every source file for data-tour targets and asserts a
// perfect 1:1 match with tour-registry.ts. Add a feature with a
// target but no stop (or vice versa) and this test fails the
// build — tours maintain themselves.
// ============================================================
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TOUR_STOPS } from "./tour-registry";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..");

function collectTargets(dir: string, found: Set<string>) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectTargets(full, found);
      continue;
    }
    if (!entry.endsWith(".tsx")) continue;
    const text = readFileSync(full, "utf8");
    // literal attributes:  data-tour="key"  (template interpolations are the engine, not targets)
    for (const m of text.matchAll(/data-tour="([^"]+)"/g)) {
      if (!m[1].includes("${")) found.add(m[1]);
    }
    // conditional attributes:  data-tour={cond ? "key" : undefined}
    for (const m of text.matchAll(/data-tour=\{[^}]*?"([^"]+)"/g)) found.add(m[1]);
    // registry-style props (the tab bar):  tour: "key"
    for (const m of text.matchAll(/tour: "([^"]+)"/g)) found.add(m[1]);
  }
}

describe("tour registry", () => {
  it("every data-tour target has a registry stop, and vice versa", () => {
    const targets = new Set<string>();
    collectTargets(SRC, targets);
    const stops = new Set(TOUR_STOPS.map((s) => s.key));

    const untoured = [...targets].filter((t) => !stops.has(t));
    const orphanStops = [...stops].filter((s) => !targets.has(s));

    expect(untoured, `data-tour targets missing a registry stop: ${untoured.join(", ")}`).toEqual([]);
    expect(orphanStops, `registry stops without a data-tour target: ${orphanStops.join(", ")}`).toEqual([]);
  });

  it("keys are unique and the quick tour is actually quick", () => {
    const keys = TOUR_STOPS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    const quick = TOUR_STOPS.filter((s) => s.quick);
    expect(quick.length).toBeGreaterThanOrEqual(5);
    expect(quick.length).toBeLessThanOrEqual(8);
  });
});
