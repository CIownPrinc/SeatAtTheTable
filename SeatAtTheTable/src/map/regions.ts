import type { Point } from '../config/types';
import { OUTSKIRT_REGIONS } from './world';
import { boundsForPoints, pointInPolygon, isPointInWater } from './geometry';
import { windhavenMapModel } from './mapModel';

// LEGAL: ---- Regions: the whole map, named ----
// LEGAL: Windhaven has three DISTRICTS, and they are a gameplay concept: control, turf
// LEGAL: pushes, spawn points, parking. The outskirts have none of that and should not — a
// LEGAL: gang war in a wheat field is not a thing anyone wants. But the outskirts are half
// LEGAL: the landmass, and until now standing in them put you nowhere: the HUD kept naming
// LEGAL: whichever district you were last in, so the map had a large region that officially
// LEGAL: did not exist.
// LEGAL:
// LEGAL: A REGION is the weaker, purely geographic idea: a named part of the map. The three
// LEGAL: districts are regions, and so are three new outskirt districts, each grouping the
// LEGAL: terrain belts that were already out there. Grouping rather than promoting all eight
// LEGAL: belts is deliberate — "Kestrel Woods, Harrow End, Sunset Shore" are landscape
// LEGAL: features, and a map with eleven top-level areas reads as a list rather than a place.

export type RegionKind = 'city' | 'outskirt';

export interface RegionRecord {
  id: string;
  name: string;
  kind: RegionKind;
  // LEGAL: Plural because an outskirt district is made of several belts, which are not
  // LEGAL: necessarily contiguous once the canals and the lake are cut out of them.
  areas: Point[][];
  labelPoint: Point;
  color: string;
}

interface OutskirtDistrictSpec {
  id: string;
  name: string;
  belts: string[];
  color: string;
}

// LEGAL: Three outskirt districts, by the compass. Every belt in OUTSKIRT_REGIONS must appear
// LEGAL: in exactly one of these — regions.test.ts fails otherwise, so a new belt cannot be
// LEGAL: added and quietly left off the map the way the whole outskirts were.
export const OUTSKIRT_DISTRICTS: OutskirtDistrictSpec[] = [
  // LEGAL: The northern shore, the woods behind it and the farmland at the top of the world.
  // LEGAL: Only reachable at all since the landmass was wrapped over the lake.
  { id:'northreach', name:'Kestrel Reach', belts:['northshore', 'northwoods', 'northfarms'], color:'#5f9c6e' },
  // LEGAL: The land side: flats to the west, meadows along the south, woods in between.
  { id:'kettlereach', name:'Kettle Reach', belts:['westfarms', 'southfields', 'ridgewood'], color:'#9c8a4e' },
  // LEGAL: The east end — the lake suburb where the Gilded Kettle sits, and the works beyond.
  { id:'lakeridge', name:'Lakeridge County', belts:['lakeridge', 'eastworks'], color:'#5f7fa8' },
];

// LEGAL: Where to write the region's name. The obvious answer — the centre of everything it
// LEGAL: covers — is wrong, and wrong in a way that only shows up on the map: Kettle Reach is
// LEGAL: an L wrapped around the west and south of the city, so the centre of its bounding
// LEGAL: box lands in the middle of DOWNTOWN, and the label for the farmland would have been
// LEGAL: printed over the Hub. Non-convex regions do not contain their own averages.
// LEGAL:
// LEGAL: So: label the biggest piece, and if even that piece's centre falls in a notch, walk
// LEGAL: a grid over it and take the interior point nearest the middle. A label is only ever
// LEGAL: written somewhere that is actually inside the thing it names.
function areaOfBounds(points: Point[]): number {
  const bounds = boundsForPoints(points);
  return (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
}

function labelPointFor(areas: Point[][]): Point {
  const largest = areas.reduce((best, area) => (areaOfBounds(area) > areaOfBounds(best) ? area : best), areas[0]);
  const bounds = boundsForPoints(largest);
  const centre = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  if(pointInPolygon(centre, largest)) return centre;

  const STEPS = 12;
  let best: Point | null = null;
  let bestDistance = Infinity;
  for(let ix = 1; ix < STEPS; ix += 1){
    for(let iy = 1; iy < STEPS; iy += 1){
      const candidate = {
        x: bounds.minX + (bounds.maxX - bounds.minX) * (ix / STEPS),
        y: bounds.minY + (bounds.maxY - bounds.minY) * (iy / STEPS),
      };
      if(!pointInPolygon(candidate, largest)) continue;
      const distance = Math.hypot(candidate.x - centre.x, candidate.y - centre.y);
      if(distance < bestDistance){ bestDistance = distance; best = candidate; }
    }
  }
  // LEGAL: A polygon with no interior sample point at this resolution is a broken polygon,
  // LEGAL: not a labelling problem — fall back rather than throw so the map still draws.
  return best ?? centre;
}

function outskirtRegion(spec: OutskirtDistrictSpec): RegionRecord {
  const areas = spec.belts.map(function(beltId){
    const belt = OUTSKIRT_REGIONS.find(region => region.id === beltId);
    if(!belt) throw new Error(`outskirt district ${spec.id} names a belt that does not exist: ${beltId}`);
    return belt.area;
  });
  return { id: spec.id, name: spec.name, kind: 'outskirt', areas, labelPoint: labelPointFor(areas), color: spec.color };
}

export function allRegions(): RegionRecord[] {
  return [
    ...windhavenMapModel.districts.map(function(district): RegionRecord {
      return {
        id: district.id,
        name: district.name,
        kind: 'city',
        areas: [district.landArea],
        // LEGAL: The city districts keep their authored label point, which sits north of the
        // LEGAL: district so it does not cover the blocks. Not recomputed here — that would
        // LEGAL: move labels that are already placed correctly on the minimap.
        labelPoint: district.labelPoint,
        color: '#c9a227',
      };
    }),
    ...OUTSKIRT_DISTRICTS.map(outskirtRegion),
  ];
}

// LEGAL: Which named part of the map a point is in. City districts are tested first: the
// LEGAL: belts were authored to sit outside them, but an overlap would be a boundary bug, and
// LEGAL: answering "The Hub" for a point in the middle of the Hub is right either way.
export function regionAt(point: Point, regions: RegionRecord[] = allRegions()): RegionRecord | null {
  if(isPointInWater(point, 0)) return null;
  return regions.find(function(region){
    return region.areas.some(area => pointInPolygon(point, area));
  }) ?? null;
}

export function regionNameAt(point: Point, regions: RegionRecord[] = allRegions()): string | null {
  return regionAt(point, regions)?.name ?? null;
}
