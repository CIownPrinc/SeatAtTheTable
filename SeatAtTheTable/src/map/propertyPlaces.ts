import type { Point, Property, Solid } from '../config/types';
import { properties } from '../config/assets';
import { brandById } from '../config/brands';
import { districts } from '../config/districts';
import { allocateLots, districtLotSlots, spreadSlots } from './lots';
import { districtIdAtPlayablePoint } from './mapModel';
import { allocateServiceLots, serviceLotObstacles } from './serviceLots';
import { DISTRICT_OFFSETS, DISTRICT_W, WORLD_H, roadNetwork, widenAuthoredX } from './world';

// LEGAL: ---- Owned real estate on the map (world expansion stage 7) ----
// LEGAL: Properties were rows in a phone list with no physical existence — you could own
// LEGAL: half of Windhaven and never see it. Every property now has a real lot, so the
// LEGAL: building is there in the world and the ones you own are findable on the map.
// LEGAL:
// LEGAL: Lots come from the same allocator the shops use, with the shops and the authored
// LEGAL: city passed in as obstacles, so a property can never land on top of a business or
// LEGAL: in a street. Deterministic: your holdings are in the same place every session.

export interface PropertyPlace extends Point {
  id: string;
  name: string;
  district: string;
  property: Property;
}

const PROPERTY_HALF_W = 34;
const PROPERTY_HALF_D = 30;

function propertyDistrict(property: Property): string {
  // LEGAL: A property sits in the district of the brand that sells it — Concrete Dreams
  // LEGAL: stock is on Devlin's rough blocks, Lakeshore's is on the Hub waterfront.
  return brandById(property.brand)?.district ?? 'devlin';
}

export function allocatePropertyLots() {
  return allocateLots({
    requests: properties.map(p => ({ id: p.id, district: propertyDistrict(p), hw: PROPERTY_HALF_W, hd: PROPERTY_HALF_D })),
    slotsByDistrict: Object.fromEntries(districts.map(function(d){
      const slots = districtLotSlots({
        districtOffset: DISTRICT_OFFSETS[d.id] ?? 0,
        districtWidth: DISTRICT_W,
        worldHeight: WORLD_H,
        roadXs: [270, 700, 1130].map(widenAuthoredX),
        roadYs: roadNetwork.horizontal.map(r => r.y),
        roadClearance: 72,
        perCell: 2,
      });
      // LEGAL: Same land test as the shops — the road grid is rectangular, the districts
      // LEGAL: are not, so a grid lot can sit in water.
      const onLand = slots.filter(function(slot){
        return [
          { x: slot.x - PROPERTY_HALF_W, y: slot.y - PROPERTY_HALF_D },
          { x: slot.x + PROPERTY_HALF_W, y: slot.y - PROPERTY_HALF_D },
          { x: slot.x - PROPERTY_HALF_W, y: slot.y + PROPERTY_HALF_D },
          { x: slot.x + PROPERTY_HALF_W, y: slot.y + PROPERTY_HALF_D },
        ].every(corner => districtIdAtPlayablePoint(corner, 0) === d.id);
      });
      // LEGAL: Reversed so properties fill from the opposite end of the district to the
      // LEGAL: shops, spreading holdings across the map instead of clustering them.
      return [d.id, spreadSlots(onLand).reverse()];
    })),
    obstacles: propertyObstacles(),
    gap: 16,
  });
}

// LEGAL: Everything the shops were placed around, plus the shops and local businesses
// LEGAL: themselves, so real estate is fitted into whatever the city has left over.
export function propertyObstacles(): Solid[] {
  const services = allocateServiceLots().placed;
  return [
    ...serviceLotObstacles(),
    ...Object.values(services).map(p => ({ x: p.x, y: p.y, hw: 40, hd: 36 })),
  ];
}

export function propertyPlaces(): PropertyPlace[] {
  const placed = allocatePropertyLots().placed;
  return properties
    .filter(p => !!placed[p.id])
    .map(p => ({
      id: `property-${p.id}`,
      name: p.name,
      district: propertyDistrict(p),
      x: placed[p.id].x,
      y: placed[p.id].y,
      property: p,
    }));
}
