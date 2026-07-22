import type { TerritoryBlock } from './types';
import { DISTRICT_W } from '../map/world';

// LEGAL: Each district is split into a 4x2 grid of named blocks. x is district-local (the
// LEGAL: same convention as serviceBuildings) and is turned into a world x by
// LEGAL: applyMapWorldCoordinates; y is already world. The two bands straddle the y=600
// LEGAL: mid-line so the north band holds the lot rows at y 205/450 and the south band
// LEGAL: holds y 750/1030.
const BLOCK_W = DISTRICT_W / 4;
const NORTH_Y = 40;
const SOUTH_Y = 600;
const BAND_H = 560;

// LEGAL: `resistance` is the authored order in which blocks fall to you as control rises.
// LEGAL: Low numbers sit near your existing strength; the high numbers are the crew's
// LEGAL: strongholds, so pushing a district visibly peels blocks off one at a time.
function band(district: string, names: [string, string, string, string], y: number, resistances: [number, number, number, number]): TerritoryBlock[] {
  return names.map(function(name, i){
    return {
      id: `${district}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      district,
      resistance: resistances[i],
      x: i * BLOCK_W,
      y,
      w: BLOCK_W,
      h: BAND_H,
    };
  });
}

export const territoryBlocks: TerritoryBlock[] = [
  // LEGAL: Devlin — your home turf. Your strength sits west, the Rockwell Kings hold the canal.
  ...band('devlin', ['Rockwell', 'Mills Yard', 'Boundary Row', 'Devlin Heights'], NORTH_Y, [0, 2, 4, 6]),
  ...band('devlin', ['Sixteenth Street', 'Playlot Blocks', 'Saint Casimir', 'Canal Row'], SOUTH_Y, [1, 3, 5, 7]),

  // LEGAL: West Side — the Cicero Firm's yard. The docks and railyard are the last to fall.
  ...band('westside', ['Cicero Works', 'Freightline', 'Chop Alley', 'Tannery Flats'], NORTH_Y, [1, 3, 0, 5]),
  ...band('westside', ['Viaduct', 'Lower Cicero', 'Railyard South', 'Dockmaster Quay'], SOUTH_Y, [2, 4, 6, 7]),

  // LEGAL: The Hub — Meridian Group country. The financial mile never really becomes yours.
  ...band('hub', ['Pressman Row', 'Herald Square', 'Statehouse', 'Gilt Shore'], NORTH_Y, [0, 2, 5, 7]),
  ...band('hub', ['Union Station', 'The Ring', 'Waterfront Towers', 'Financial Mile'], SOUTH_Y, [1, 3, 4, 6]),
];

export const BLOCKS_PER_DISTRICT = 8;
