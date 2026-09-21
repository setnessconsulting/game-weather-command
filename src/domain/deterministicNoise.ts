import { createSeededRng } from "./seededRng";

function hashKey(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function deterministicSignedNoise(seed: number, key: string, amplitude: number): number {
  if (amplitude === 0) return 0;
  const mixed = (seed ^ hashKey(key)) >>> 0;
  return (createSeededRng(mixed).next() * 2 - 1) * amplitude;
}
