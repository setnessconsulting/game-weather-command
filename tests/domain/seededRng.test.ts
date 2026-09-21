import { describe, expect, it } from "vitest";

import { createSeededRng } from "@/domain";

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
});
