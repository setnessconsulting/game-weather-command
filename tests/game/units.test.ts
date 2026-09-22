import { describe, expect, it } from "vitest";

import {
  abbreviateWindDirection,
  describeWindDirection,
  formatDuration,
  formatSimulatedClock,
  SIMULATED_CLOCK_START_MINUTE
} from "@/game";

describe("formatSimulatedClock", () => {
  it("rolls over to the next day at minute 1080", () => {
    // Start is 06:00; minute 1080 → 06:00 + 18 h = 24:00 → 00:00.
    expect(SIMULATED_CLOCK_START_MINUTE).toBe(360);
    expect(formatSimulatedClock(1079)).toBe("23:59");
    expect(formatSimulatedClock(1080)).toBe("00:00");
    expect(formatSimulatedClock(1081)).toBe("00:01");
  });
});

describe("formatDuration", () => {
  it("formats zero, hours-only, and mixed durations", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(120)).toBe("2 h");
    expect(formatDuration(90)).toBe("1 h 30 min");
    expect(formatDuration(45)).toBe("45 min");
  });
});

describe("compass 22.5° bucket boundaries", () => {
  it("assigns midpoints with Math.round half-up into the next sector", () => {
    // Sectors are 22.5° wide; the midpoint between N (0°) and NNE (22.5°) is 11.25°.
    expect(describeWindDirection(0)).toBe("north");
    expect(abbreviateWindDirection(0)).toBe("N");

    expect(describeWindDirection(11.24)).toBe("north");
    expect(abbreviateWindDirection(11.24)).toBe("N");

    expect(describeWindDirection(11.25)).toBe("north-north-east");
    expect(abbreviateWindDirection(11.25)).toBe("NNE");

    expect(describeWindDirection(22.5)).toBe("north-north-east");
    expect(abbreviateWindDirection(22.5)).toBe("NNE");

    // Midpoint between NNW (337.5°) and N (360°) is 348.75° → wraps to N.
    expect(describeWindDirection(348.75)).toBe("north");
    expect(abbreviateWindDirection(348.75)).toBe("N");
    expect(describeWindDirection(360)).toBe("north");
  });
});
