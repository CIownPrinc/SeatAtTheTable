import type { Point } from '../config/types';
import { CANAL_CHANNELS, DISTRICT_OFFSETS, DISTRICT_W, LAKEFRONT_BEACH, NORTH_RIVER, WINDHAVEN_LANDMASS, WORLD_H, WORLD_W, districtParkSlots, landmarks, roadNetwork } from './world';
import { boundsForPoints, isPointInWater, type Bounds } from './geometry';
import { buildableBands, distancePointToSegment } from './layout';

export interface MapDistrictRecord {
  id: 'devlin' | 'westside' | 'hub';
  name: string;
  labelPoint: Point;
  centerX: number;
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
    return {
      id: `road-diagonal-${slugForName(road.name)}`,
      name: road.name,
      roadClass: 'diagonal',
      width: road.w,
      path: [{ x: road.x1, y: road.y1 }, { x: road.x2, y: road.y2 }],
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
    path: [{ x: 3470, y: 0 }, { x: 3470, y: WORLD_H }],
    trainCycleMs: 38000,
    activeWindow: { start: 0.12, end: 0.92 },
  },
];

function parkRecords(): MapParkRecord[] {
  const localRoadXs = [270, 700, 1130];
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
    { id: 'devlin', name: 'Devlin', labelPoint: { x: DISTRICT_W/2, y: 6 }, centerX: DISTRICT_OFFSETS.devlin + DISTRICT_W/2 },
    { id: 'westside', name: 'West Side', labelPoint: { x: DISTRICT_OFFSETS.westside + DISTRICT_W/2, y: 6 }, centerX: DISTRICT_OFFSETS.westside + DISTRICT_W/2 },
    { id: 'hub', name: 'The Hub', labelPoint: { x: DISTRICT_OFFSETS.hub + DISTRICT_W/2, y: 6 }, centerX: DISTRICT_OFFSETS.hub + DISTRICT_W/2 },
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

export function districtIdAtPoint(point: Point, model: WindhavenMapModel = windhavenMapModel): MapDistrictRecord['id'] {
  return model.districts.reduce(function(best, district){
    return Math.abs(point.x - district.centerX) < Math.abs(point.x - best.centerX) ? district : best;
  }, model.districts[0]).id;
}

export function districtIdAtPlayablePoint(point: Point, radius = 0, model: WindhavenMapModel = windhavenMapModel): MapDistrictRecord['id'] | null {
  if(isPointInWater(point, radius)) return null;
  return districtIdAtPoint(point, model);
}

export function nearestRoadAtPoint(point: Point, model: WindhavenMapModel = windhavenMapModel): { road: RoadPath; distance: number } {
  return model.roadPaths.reduce(function(best, road){
    const start = road.path[0];
    const end = road.path[1];
    const distance = distancePointToSegment(point.x, point.y, start.x, start.y, end.x, end.y);
    return distance < best.distance ? { road, distance } : best;
  }, { road: model.roadPaths[0], distance: Infinity });
}
