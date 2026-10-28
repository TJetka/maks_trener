/** Deterministic mulberry32 random source. Never use Math.random in generators. */
export function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const int = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
export const pick = (rng, items) => items[int(rng, 0, items.length - 1)];
export function shuffle(rng, values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = int(rng, 0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function newSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]; }
export function hash(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
}
