export interface SeededRng {
  readonly seed: number;
  next(): number;
}

/**
 * Small deterministic PRNG for scenario variation.
 * WC-03 may replace the algorithm only with explicit replay/version migration evidence.
 */
export function createSeededRng(seed: number): SeededRng {
  let state = (seed >>> 0) || 0x6d2b79f5;
  const canonicalSeed = state;

  return {
    seed: canonicalSeed,
    next(): number {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
  };
}
