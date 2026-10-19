import type { Point } from '../config/types';
import type { RoadPath } from './mapModel';

// LEGAL: The countryside had no roads at all: every street stopped at the city box, so drives
// LEGAL: to the airfield, the lodge or the casino were cross-country and the GPS drew a straight
// LEGAL: line over the lake. These are dirt lanes: one ring round the whole countryside, and short
// LEGAL: spurs joining it to city streets. They are ordinary RoadPaths, so the GPS routes on them.
// LEGAL: Control points are in world coordinates and are smoothed into curves below.

// LEGAL: Centripetal-free uniform Catmull-Rom: passes through every control point and keeps the
// LEGAL: lane's bends round. `step` is the spacing of the output points in world units.
export function smoothPath(controls: Point[], step: number, closed = false): Point[] {
  if(controls.length < 2) return [...controls];
  const pts = closed ? [controls[controls.length - 1], ...controls, controls[0], controls[1]] : [controls[0], ...controls, controls[controls.length - 1]];
  const out: Point[] = [];
  const spans = closed ? controls.length : controls.length - 1;
  for(let i = 0; i < spans; i++){
    const p0 = pts[i], p1 = pts[i + 1], p2 = pts[i + 2], p3 = pts[i + 3];
    const samples = Math.max(1, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / step));
    for(let s = 0; s < samples; s++){
      const t = s / samples, t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(closed ? { ...controls[0] } : { ...controls[controls.length - 1] });
  return out;
}

const LANE_WIDTH = 44;
const SAMPLE_STEP = 70;

function lane(id: string, name: string, controls: Point[], closed = false): RoadPath {
  return { id:`road-country-${id}`, name, roadClass:'country', width:LANE_WIDTH, path:smoothPath(controls, SAMPLE_STEP, closed) };
}

// LEGAL: Clockwise from the west. Each stretch runs 140-240 units off the countryside places so
// LEGAL: the lane passes their front gate rather than their building: west of Kettle Flats
// LEGAL: Airfield, north of the Sunset Shore Motel, the fire road and the trailhead, through the
// LEGAL: narrow land bridge between the lake's east tip and the sea inlet, then back west past
// LEGAL: the casino, the lodge and the drive-in along the south coast.
const RING: Point[] = [
  { x:-1300, y:620 }, { x:-1240, y:120 }, { x:-1040, y:-430 }, { x:-560, y:-880 },
  { x:400, y:-960 }, { x:1540, y:-1000 }, { x:2600, y:-1010 }, { x:3600, y:-1020 },
  { x:4420, y:-1040 }, { x:5460, y:-1000 }, { x:6460, y:-930 }, { x:7360, y:-720 },
  { x:7600, y:-300 }, { x:7470, y:60 }, { x:7440, y:330 }, { x:7640, y:760 },
  { x:7700, y:1250 }, { x:7300, y:1700 }, { x:6200, y:1700 }, { x:5100, y:1720 },
  { x:4140, y:1730 }, { x:3000, y:1740 }, { x:2000, y:1720 }, { x:1120, y:1740 },
  { x:200, y:1700 }, { x:-700, y:1600 }, { x:-1180, y:1240 },
];

export const COUNTRY_ROADS: RoadPath[] = [
  lane('ring', 'Windhaven Ring Road', RING, true),
  // LEGAL: Spurs. Each starts exactly at a city street's end point (the GPS graph merges equal
  // LEGAL: points) and runs a little past the ring, because the graph only joins lines that cross.
  lane('kettle', 'Kettle Flats Lane', [{ x:0, y:600 }, { x:-500, y:604 }, { x:-1000, y:612 }, { x:-1340, y:621 }]),
  lane('meadow', 'Meadow Lane', [{ x:980, y:1200 }, { x:984, y:1460 }, { x:1000, y:1790 }]),
  lane('ridgewood', 'Ridgewood Lane', [{ x:3580, y:1200 }, { x:3590, y:1480 }, { x:3600, y:1790 }]),
  lane('lakeridge', 'Lakeridge Lane', [{ x:6782, y:1200 }, { x:6800, y:1460 }, { x:6830, y:1750 }]),
  lane('outworks', 'Outworks Lane', [{ x:7300, y:300 }, { x:7380, y:312 }, { x:7500, y:340 }]),
];
