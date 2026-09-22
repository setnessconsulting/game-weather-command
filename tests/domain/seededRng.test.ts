import { describe, expect, it } from "vitest";

import { createSeededRng, deterministicSignedNoise } from "@/domain";

describe("createSeededRng", () => {
  it("replays the same sequence from the same seed", () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it("normalizes a zero seed to a deterministic non-zero state", () => {
    const a = createSeededRng(0);
    const b = createSeededRng(0);
    expect(a.seed).not.toBe(0);
    expect(a.next()).toBe(b.next());
  });

  it("returns values in the half-open unit interval", () => {
    const rng = createSeededRng(7);
    for (let i = 0; i < 100; i += 1) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("maps a negative seed through unsigned 32-bit wrap", () => {
    const negative = createSeededRng(-1);
    const unsigned = createSeededRng(4294967295);
    expect(negative.seed).toBe(4294967295);
    expect(negative.seed).toBe(unsigned.seed);
    expect(negative.next()).toBe(unsigned.next());
  });

  it("maps a large seed through unsigned 32-bit wrap", () => {
    // 2^32 >>> 0 is 0, so the zero-seed fallback applies.
    const large = createSeededRng(4294967296);
    const zero = createSeededRng(0);
    expect(large.seed).toBe(zero.seed);
    expect(large.next()).toBe(zero.next());

    const justAbove = createSeededRng(4294967297);
    expect(justAbove.seed).toBe(1);
    expect(justAbove.next()).toBe(createSeededRng(1).next());
  });
});

describe("deterministicSignedNoise", () => {
  it("returns a precomputed draw within [-amplitude, amplitude]", () => {
    // Precomputed: (createSeededRng((42 ^ hashKey("west:temp")) >>> 0).next() * 2 - 1) * 1.5
    const amplitude = 1.5;
    const value = deterministicSignedNoise(42, "west:temp", amplitude);
    expect(value).toBe(-0.18464072467759252);
    expect(value).toBeGreaterThanOrEqual(-amplitude);
    expect(value).toBeLessThanOrEqual(amplitude);
    expect(deterministicSignedNoise(42, "west:temp", amplitude)).toBe(value);
  });
});
