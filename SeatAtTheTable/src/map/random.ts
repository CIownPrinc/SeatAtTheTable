// LEGAL: A small seeded random number generator (mulberry32), so anything laid out "at random" comes
// LEGAL: out the same every time the game loads.
export function seededRandom(seed: number): () => number {
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
