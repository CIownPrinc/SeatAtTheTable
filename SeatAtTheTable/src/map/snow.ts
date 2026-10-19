// LEGAL: Snow that settles. While it snows the ground whitens over SNOW_SETTLE_SECONDS; when it
// LEGAL: stops it melts over SNOW_MELT_SECONDS. Once enough has settled the plow comes out and
// LEGAL: clears the roads, which then stay darker than the verges until everything melts.
export const SNOW_SETTLE_SECONDS = 24;
export const SNOW_MELT_SECONDS = 70;
export const PLOW_CLEAR_SECONDS = 40;
// LEGAL: How much snow on the ground before the plow is sent out.
export const PLOW_COVER = 0.2;

export function stepSnowCover(cover: number, snowing: boolean, dt: number): number {
  const next = snowing ? cover + dt / SNOW_SETTLE_SECONDS : cover - dt / SNOW_MELT_SECONDS;
  return Math.max(0, Math.min(1, next));
}

// LEGAL: How much of the road the plow has cleared, 0 to 1. Starts again from nothing after a thaw.
export function stepPlowed(plowed: number, cover: number, dt: number): number {
  if(cover <= 0) return 0;
  if(cover < PLOW_COVER && plowed === 0) return 0;
  return Math.min(1, plowed + dt / PLOW_CLEAR_SECONDS);
}

export function plowOut(cover: number, plowed: number): boolean {
  return cover >= PLOW_COVER || (cover > 0 && plowed > 0 && plowed < 1);
}

// LEGAL: How white each surface goes: grass the most, trees less, roads less again and only
// LEGAL: until the plow has been along.
export function snowWhiteness(surface: 'ground' | 'tree' | 'road', cover: number, plowed: number): number {
  if(surface === 'ground') return cover * 0.85;
  if(surface === 'tree') return cover * 0.55;
  return cover * 0.7 * (1 - plowed * 0.85);
}

// LEGAL: Which surface a scene material is, from its key in the material cache (map/scenePerformance),
// LEGAL: or null for one snow doesn't settle on (water, walls, signs).
export function snowSurfaceFor(key: string): 'ground' | 'tree' | 'road' | null {
  if(key.includes('water')) return null;
  if(key.startsWith('ground:') || key.startsWith('terrain:outskirt:') || key.startsWith('terrain:district:')) return 'ground';
  if(key === 'transport:lane-verge' || key === 'transport:dirt' || key.endsWith(':roof')) return 'ground';
  if(key.startsWith('prop:tree-crown') || key === 'outskirt:tree-canopy') return 'tree';
  if(key.startsWith('path:') || key === 'transport:lane') return 'road';
  return null;
}
