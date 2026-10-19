import type { Point } from '../config/types';
import { smoothPath } from './countryRoads';
import { distancePointToSegment } from './layout';

// LEGAL: Footpaths off the country lanes: into the woods, to the lodge's door, along field edges.
// LEGAL: They're narrow worn dirt, for walking; not roads, so the GPS and traffic never use them.
// LEGAL: Control points are in world coordinates and start on a lane or a place's yard.
export interface Trail { id: string; path: Point[] }

export const TRAIL_WIDTH = 12;

const CONTROLS: Array<[string, Point[]]> = [
  // LEGAL: From Ridgewood Lane through the forest to the lodge's front door.
  ['ridgewood-lodge', [{ x:3600, y:1620 }, { x:3760, y:1662 }, { x:3920, y:1632 }, { x:4050, y:1604 }]],
  // LEGAL: West from the lane into the trees, ending in a clearing.
  ['ridgewood-west', [{ x:3592, y:1560 }, { x:3420, y:1602 }, { x:3230, y:1662 }, { x:3060, y:1640 }, { x:2900, y:1680 }]],
  // LEGAL: From the Kestrel Woods trailhead east along the north woods.
  ['kestrel-woods', [{ x:4480, y:-800 }, { x:4650, y:-758 }, { x:4850, y:-800 }, { x:5050, y:-760 }, { x:5250, y:-792 }]],
  // LEGAL: A tractor track north off the ring road between the south fields.
  ['south-fields', [{ x:1600, y:1722 }, { x:1640, y:1600 }, { x:1580, y:1480 }, { x:1660, y:1380 }]],
  // LEGAL: South off Kettle Flats Lane down the west farms.
  ['west-farms', [{ x:-700, y:610 }, { x:-660, y:800 }, { x:-760, y:980 }, { x:-680, y:1150 }]],
];

export const TRAILS: Trail[] = CONTROLS.map(([id, controls]) => ({ id, path:smoothPath(controls, 30) }));

export function distanceToTrails(point: Point): number {
  let best = Infinity;
  for(const trail of TRAILS){
    for(let i = 0; i < trail.path.length - 1; i++){
      const a = trail.path[i], b = trail.path[i + 1];
      best = Math.min(best, distancePointToSegment(point.x, point.y, a.x, a.y, b.x, b.y));
    }
  }
  return best;
}
