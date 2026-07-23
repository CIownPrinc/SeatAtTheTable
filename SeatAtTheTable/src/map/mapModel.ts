import type { Point } from '../config/types';
import { CANAL_CHANNELS, DISTRICT_OFFSETS, DISTRICT_W, LAKEFRONT_BEACH, NORTH_RIVER, WINDHAVEN_LANDMASS, WORLD_H, WORLD_W, districtParkSlots, landmarks, roadNetwork, widenAuthoredX } from './world';
import { boundsForPoints, isPointInWater, pointInPolygon, type Bounds } from './geometry';
import { buildableBands, distancePointToSegment } from './layout';

export interface MapDistrictRecord {
  id: 'devlin' | 'westside' | 'hub';
  name: string;
  labelPoint: Point;
  centerX: number;
  landArea: Point[];
}

export type RoadClass = 'arterial' | 'local' | 'diagonal';

export interface RoadPath {
  id: string;
  name: string;
  roadClass: RoadClass;
  width: number;
  path: Point[];
}

export interface BridgeRecord {
  id: string;
  name: string;
  canalName: string;
  roadName: string;
  width: number;
  path: Point[];
}

export interface MapParkRecord {
  id: string;
  name: string;
  district: MapDistrictRecord['id'];
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  center: Point;
}

export interface RailLineRecord {
  id: string;
  name: string;
  width: number;
  path: Point[];
  trainCycleMs: number;
  activeWindow: { start: number; end: number };
}

export interface RoadLandSegment {
  road: RoadPath;
  path: Point[];
}

export interface WindhavenMapModel {
  worldWidth: number;
  worldHeight: number;
  landmass: Point[];
  landBounds: Bounds;
  districts: MapDistrictRecord[];
  canals: typeof CANAL_CHANNELS;
  northRiver: Point[];
  lakefrontBeach: Point[];
  roads: typeof roadNetwork;
  roadPaths: RoadPath[];
  bridges: BridgeRecord[];
  parks: MapParkRecord[];
  railLines: RailLineRecord[];
  landmarks: typeof landmarks;
}

function slugForName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

const roadPaths: RoadPath[] = [
  ...roadNetwork.vertical.map(function(road): RoadPath {
    return {
      id: `road-vertical-${slugForName(road.name)}`,
      name: road.name,
      roadClass: 'local',
      width: road.w,
      path: [{ x: road.x, y: 0 }, { x: road.x, y: WORLD_H }],
    };
  }),
  ...roadNetwork.horizontal.map(function(road): RoadPath {
    return {
      id: `road-horizontal-${slugForName(road.name)}`,
      name: road.name,
      roadClass: road.name === 'Roosevelt Road' ? 'arterial' : 'local',
      width: road.w,
      path: [{ x: 0, y: road.y }, { x: WORLD_W, y: road.y }],
    };
  }),
  ...roadNetwork.diagonal.map(function(road): RoadPath {
    const dx = road.x2 - road.x1;
    const dy = road.y2 - road.y1;
    const bend = road.name === 'Canal Bend Road' ? -72 : 58;
    return {
      id: `road-diagonal-${slugForName(road.name)}`,
      name: road.name,
      roadClass: 'diagonal',
      width: road.w,
      path: [
        { x: road.x1, y: road.y1 },
        { x: (road.x1 + road.x2) / 2 - dy / Math.hypot(dx, dy) * bend, y: (road.y1 + road.y2) / 2 + dx / Math.hypot(dx, dy) * bend },
        { x: road.x2, y: road.y2 },
      ],
    };
  }),
];

const bridges: BridgeRecord[] = CANAL_CHANNELS.flatMap(function(channel): BridgeRecord[] {
  return roadNetwork.horizontal.map(function(road): BridgeRecord {
    return {
      id: `bridge-${slugForName(channel.name)}-${slugForName(road.name)}`,
      name: `${road.name} Bridge`,
      canalName: channel.name,
      roadName: road.name,
      width: road.w,
      path: [{ x: channel.x, y: road.y }, { x: channel.x + channel.width, y: road.y }],
    };
  });
});

const railLines: RailLineRecord[] = [
  {
    id: 'cicero-freight-line',
    name: 'Cicero Freight Line',
    width: 40,
    // LEGAL: Authored to run down the eastern edge of the West Side. Roads and bridges
    // LEGAL: derive from already-widened data, but this literal does not — without
    // LEGAL: widening it the line drifts into the middle of the district.
    path: [{ x: widenAuthoredX(3470), y: 0 }, { x: widenAuthoredX(3470), y: WORLD_H }],
    trainCycleMs: 38000,
    activeWindow: { start: 0.12, end: 0.92 },
  },
];

// LEGAL: Authored against the original 1500-wide districts and stretched by
// LEGAL: widenAuthoredX, exactly like the coastline and roads in map/world.ts. Keeping the
// LEGAL: authored numbers means these polygons still line up with the anchors inside them.
function widenLandArea(points: Point[]): Point[] {
  return points.map(p => ({ x: widenAuthoredX(p.x), y: p.y }));
}

// LEGAL: District shapes follow the stage-1b coastline in map/world.ts, so each district
// LEGAL: has its own silhouette rather than all three being the same rounded rectangle:
// LEGAL: Devlin runs south into a peninsula, the West Side is compact and pushed north
// LEGAL: against the river, and the Hub is a headland with a bay bitten out of its south
// LEGAL: edge. These sit just inside the coastline so no district claims water.
const districtLandAreas: Record<MapDistrictRecord['id'], Point[]> = {
  devlin: widenLandArea([
    // LEGAL: Devlin's north edge hugs the coast rather than sitting well inside it — the
    // LEGAL: NORTH_SHORE_LOT_Y=205 venture lots (cart, store, laundromat) sit close to the
    // LEGAL: water here, and their footprints need to stay on district land.
    { x: 30, y: 148 },
    { x: 300, y: 168 },
    { x: 640, y: 154 },
    { x: 980, y: 126 },
    { x: 1290, y: 106 },
    { x: 1470, y: 124 },
    { x: 1462, y: 1180 },
    { x: 1180, y: 1256 },
    { x: 840, y: 1286 },
    { x: 520, y: 1262 },
    { x: 190, y: 1212 },
    { x: 46, y: 1040 },
    { x: 62, y: 620 },
    { x: 78, y: 340 },
  ]),
  westside: widenLandArea([
    { x: 2035, y: 118 },
    { x: 2210, y: 106 },
    { x: 2600, y: 100 },
    { x: 2980, y: 104 },
    { x: 3290, y: 116 },
    { x: 3468, y: 128 },
    { x: 3466, y: 1088 },
    { x: 3180, y: 1074 },
    { x: 2820, y: 1082 },
    { x: 2460, y: 1102 },
    { x: 2100, y: 1128 },
    { x: 2038, y: 1060 },
  ]),
  hub: widenLandArea([
    { x: 4038, y: 166 },
    { x: 4310, y: 198 },
    { x: 4560, y: 150 },
    { x: 4770, y: 110 },
    { x: 4980, y: 130 },
    { x: 5260, y: 174 },
    { x: 5462, y: 244 },
    { x: 5470, y: 620 },
    { x: 5468, y: 1046 },
    { x: 5260, y: 1180 },
    { x: 5020, y: 1136 },
    { x: 4820, y: 1052 },
    { x: 4640, y: 1126 },
    { x: 4380, y: 1176 },
    { x: 4060, y: 1152 },
  ]),
};

function parkRecords(): MapParkRecord[] {
  // LEGAL: District-local road positions, widened to match DISTRICT_W. Devlin sits at
  // LEGAL: offset 0, so widenAuthoredX is exactly the district-local transform here.
  const localRoadXs = [270, 700, 1130].map(widenAuthoredX);
  const xBands = buildableBands(localRoadXs, DISTRICT_W, 56);
  const yBands = buildableBands(roadNetwork.horizontal.map(road => road.y), WORLD_H, 66);

  return Object.entries(districtParkSlots).flatMap(function([district, slots]): MapParkRecord[] {
    const districtId = district as MapDistrictRecord['id'];
    const offset = DISTRICT_OFFSETS[districtId];
    return slots.map(function(slot): MapParkRecord {
      const yBandIndex = slot.yi === 'south' ? yBands.length - 1 : slot.yi;
      const xBand = xBands[slot.xi];
      const yBand = yBands[yBandIndex];
      const x0 = xBand[0] + offset;
      const x1 = xBand[1] + offset;
      const y0 = yBand[0];
      const y1 = yBand[1];
      return {
        id: slugForName(`${district}-${slot.name}`),
        name: slot.name,
        district: districtId,
        x0,
        y0,
        x1,
        y1,
        center: { x: (x0 + x1) / 2, y: (y0 + y1) / 2 },
      };
    });
  });
}

export const windhavenMapModel: WindhavenMapModel = {
  worldWidth: WORLD_W,
  worldHeight: WORLD_H,
  landmass: WINDHAVEN_LANDMASS,
  landBounds: boundsForPoints(WINDHAVEN_LANDMASS),
  districts: [
    { id: 'devlin', name: 'Devlin', labelPoint: { x: DISTRICT_W/2, y: -118 }, centerX: DISTRICT_OFFSETS.devlin + DISTRICT_W/2, landArea: districtLandAreas.devlin },
    { id: 'westside', name: 'West Side', labelPoint: { x: DISTRICT_OFFSETS.westside + DISTRICT_W/2, y: -118 }, centerX: DISTRICT_OFFSETS.westside + DISTRICT_W/2, landArea: districtLandAreas.westside },
    { id: 'hub', name: 'The Hub', labelPoint: { x: DISTRICT_OFFSETS.hub + DISTRICT_W/2, y: -118 }, centerX: DISTRICT_OFFSETS.hub + DISTRICT_W/2, landArea: districtLandAreas.hub },
  ],
  canals: CANAL_CHANNELS,
  northRiver: NORTH_RIVER,
  lakefrontBeach: LAKEFRONT_BEACH,
  roads: roadNetwork,
  roadPaths,
  bridges,
  parks: parkRecords(),
  railLines,
  landmarks,
};

export function districtIdAtPoint(point: Point, model: WindhavenMapModel = windhavenMapModel): MapDistrictRecord['id'] | null {
  if(isPointInWater(point, 0)) return null;
  return model.districts.find(area => pointInPolygon(point, area.landArea))?.id ?? null;
}

export function districtIdAtPlayablePoint(point: Point, radius = 0, model: WindhavenMapModel = windhavenMapModel): MapDistrictRecord['id'] | null {
  if(isPointInWater(point, radius)) return null;
  return districtIdAtPoint(point, model);
}

export function nearestRoadAtPoint(point: Point, model: WindhavenMapModel = windhavenMapModel): { road: RoadPath; distance: number } {
  return model.roadPaths.reduce(function(best, road){
    const distance = road.path.slice(0, -1).reduce(function(segmentBest, start, index){
      const end = road.path[index + 1];
      return Math.min(segmentBest, distancePointToSegment(point.x, point.y, start.x, start.y, end.x, end.y));
    }, Infinity);
    return distance < best.distance ? { road, distance } : best;
  }, { road: model.roadPaths[0], distance: Infinity });
}

function pointBetween(start: Point, end: Point, t: number): Point {
  return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
}

export function roadLandSegments(model: WindhavenMapModel = windhavenMapModel, sampleLength = 36): RoadLandSegment[] {
  const segments: RoadLandSegment[] = [];
  model.roadPaths.forEach(function(road){
    road.path.slice(0, -1).forEach(function(start, index){
      const end = road.path[index + 1];
      const length = Math.hypot(end.x - start.x, end.y - start.y);
      const sampleCount = Math.max(1, Math.ceil(length / sampleLength));
      let runStart: Point | null = null;
      let runEnd: Point | null = null;

      for(let sample = 1; sample <= sampleCount; sample += 1){
        const t0 = (sample - 1) / sampleCount;
        const t1 = sample / sampleCount;
        const mid = pointBetween(start, end, (t0 + t1) / 2);
        const onLand = districtIdAtPoint(mid, model) !== null;
        if(onLand){
          if(!runStart) runStart = pointBetween(start, end, t0);
          runEnd = pointBetween(start, end, t1);
        } else if(runStart && runEnd){
          segments.push({ road, path:[runStart, runEnd] });
          runStart = null;
          runEnd = null;
        }
      }

      if(runStart && runEnd) segments.push({ road, path:[runStart, runEnd] });
    });
  });
  return segments;
}
