// LEGAL: GTA-style cheat codes: type a word anywhere in the game and it fires. Keeps only the
// LEGAL: last few keys, so it costs nothing however long you play.
export interface CheatListener {
  // LEGAL: Feed every key press; returns the code that just completed, or null.
  feed(key: string): string | null;
}

export function createCheatListener(codes: string[]): CheatListener {
  const longest = Math.max(...codes.map(code => code.length));
  let typed = '';
  return {
    feed(key){
      if(key.length !== 1) return null;
      typed = (typed + key.toLowerCase()).slice(-longest);
      const match = codes.find(code => typed.endsWith(code));
      if(match) typed = '';
      return match ?? null;
    },
  };
}
