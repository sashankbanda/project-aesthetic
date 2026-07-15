import { describe, expect, it } from "vitest";
import { fmtClock } from "./session-time";

describe("fmtClock", () => {
  it("keeps stopwatch precision across units", () => {
    expect(fmtClock(45)).toBe("45s");
    expect(fmtClock(60)).toBe("1m");
    expect(fmtClock(750)).toBe("12m 30s");
    expect(fmtClock(3600)).toBe("1h");
    expect(fmtClock(3900)).toBe("1h 5m");
    expect(fmtClock(0)).toBe("0s");
  });
});
