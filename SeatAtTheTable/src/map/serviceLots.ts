import type { Solid } from '../config/types';
import { serviceBuildings } from '../config/serviceBuildings';
import { localBusinesses } from '../config/localBusinesses';
import { districts } from '../config/districts';
import { mapAmenities } from './amenities';
import { allocateLots, districtLotSlots, spreadSlots } from './lots';
import { applyMapWorldCoordinates } from './markers';
import { districtIdAtPlayablePoint } from './mapModel';
import { DISTRICT_OFFSETS, DISTRICT_W, WORLD_H, roadNetwork, ventureMapLots, widenAuthoredX } from './world';

// LEGAL: Where every service building actually ends up. Lives here rather than inline in
// LEGAL: header.ts so the game and the layout tests allocate from one implementation — a
// LEGAL: test that re-derived positions its own way would happily pass while the real map
// LEGAL: overlapped.
// LEGAL:
// LEGAL: Ventures, local businesses and amenities keep their authored spots (they are the
// LEGAL: city's character, and have their own non-overlap and off-road guarantees) and go
// LEGAL: in here as obstacles so services are placed around them.

export const SERVICE_HALF_W = 40;
export const SERVICE_HALF_D = 36;
const LOT_GAP = 16;

// LEGAL: Only ventures and amenities are fixed. The authored data double-books hub lots —
// LEGAL: jewelers sat on the lounge, marlowe on wire_network, cityhall on realestate — so
// LEGAL: local businesses are allocated too rather than left to collide. They keep their
// LEGAL: names and their district; only the exact lot is chosen for them.
export function serviceLotObstacles(): Solid[] {
  return [
    ...Object.values(ventureMapLots).map(lot => ({ x: lot.x, y: lot.y, hw: 46, hd: 42 })),
    ...mapAmenities.map(a => ({ x: a.x, y: a.y, hw: 34, hd: 30 })),
  ];
}

export function allocateServiceLots() {
  return allocateLots({
    requests: [
      ...serviceBuildings.map(s => ({ id: s.id, district: s.district, hw: SERVICE_HALF_W, hd: SERVICE_HALF_D })),
      ...localBusinesses.map(b => ({ id: b.id, district: b.district, hw: 36, hd: 32 })),
    ],
    slotsByDistrict: Object.fromEntries(districts.map(function(d){
      const slots = districtLotSlots({
        districtOffset: DISTRICT_OFFSETS[d.id] ?? 0,
        districtWidth: DISTRICT_W,
        worldHeight: WORLD_H,
        // LEGAL: District-local vertical road positions, widened to match DISTRICT_W.
        roadXs: [270, 700, 1130].map(widenAuthoredX),
        roadYs: roadNetwork.horizontal.map(r => r.y),
        roadClearance: 72,
        perCell: 2,
      });
      // LEGAL: The road grid is rectangular but the districts are not — stage 1b gave them
      // LEGAL: bays, headlands and a peninsula. Drop any candidate lot whose footprint is
      // LEGAL: not fully on this district's land, or buildings get allocated into water.
      const onLand = slots.filter(function(slot){
        return [
          { x: slot.x - SERVICE_HALF_W, y: slot.y - SERVICE_HALF_D },
          { x: slot.x + SERVICE_HALF_W, y: slot.y - SERVICE_HALF_D },
          { x: slot.x - SERVICE_HALF_W, y: slot.y + SERVICE_HALF_D },
          { x: slot.x + SERVICE_HALF_W, y: slot.y + SERVICE_HALF_D },
        ].every(corner => districtIdAtPlayablePoint(corner, 0) === d.id);
      });
      return [d.id, spreadSlots(onLand)];
    })),
    obstacles: serviceLotObstacles(),
    gap: LOT_GAP,
  });
}
