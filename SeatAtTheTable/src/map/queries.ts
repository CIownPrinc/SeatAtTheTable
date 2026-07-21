import type { Point } from '../config/types';
import { isPointInWater, isPointOnWindhavenLand } from './geometry';
import { distancePointToSegment } from './layout';
import { districtIdAtPlayablePoint, nearestRoadAtPoint, windhavenMapModel, type BridgeRecord, type MapDistrictRecord, type RoadPath, type WindhavenMapModel } from './mapModel';
import { nearestMapPlace, type MapPlaceCategory, type MapPlaceRecord } from './places';

export interface MapPointContext {
  point: Point;
  districtId: MapDistrictRecord['id'] | null;
  isLand: boolean;
  isWater: boolean;
  bridge: BridgeRecord | null;
  nearestRoad: { road: RoadPath; distance: number };
  nearestPlace: MapPlaceRecord | null;
}

export interface MapQueryOptions {
  radius?: number;
  placeMaxDistance?: number;
  model?: WindhavenMapModel;
}

export interface RoadProjection {
  road: RoadPath;
  point: Point;
  distance: number;
}

export interface RouteHint {
  start: Point;
  end: Point;
  waypoints: Point[];
  roads: RoadPath[];
  bridges: BridgeRecord[];
  distance: number;
}

export function placesByCategory(places: MapPlaceRecord[], category: MapPlaceCategory): MapPlaceRecord[] {
  return places.filter(place => place.category === category);
}

export function nearestPlaceAtPoint(places: MapPlaceRecord[], point: Point, maxDistance: number): MapPlaceRecord | null {
  return nearestMapPlace(places, point, maxDistance);
}

export function bridgeAtPoint(point: Point, radius = 0, model: WindhavenMapModel = windhavenMapModel): BridgeRecord | null {
  const paddedRadius = Math.max(4, radius);
  return model.bridges.find(function(bridge){
    const start = bridge.path[0];
    const end = bridge.path[bridge.path.length - 1];
    const distance = distancePointToSegment(point.x, point.y, start.x, start.y, end.x, end.y);
    return distance <= bridge.width/2 + paddedRadius;
  }) ?? null;
}

export function isPointOnPlayableLand(point: Point, radius = 0): boolean {
  return isPointOnWindhavenLand(point, radius) && !isPointInWater(point, radius);
}

export function projectPointToRoad(point: Point, model: WindhavenMapModel = windhavenMapModel): RoadProjection {
  return model.roadPaths.reduce(function(best, road){
    const projection = projectPointToRoadPath(point, road);
    return projection.distance < best.distance ? projection : best;
  }, { road:model.roadPaths[0], point:model.roadPaths[0].path[0], distance:Infinity });
}

export function mapPointContext(point: Point, places: MapPlaceRecord[], options: MapQueryOptions = {}): MapPointContext {
  const radius = options.radius ?? 0;
  const model = options.model ?? windhavenMapModel;
  const placeMaxDistance = options.placeMaxDistance ?? 42;
  const isWater = isPointInWater(point, radius);
  return {
    point,
    districtId: districtIdAtPlayablePoint(point, radius, model),
    isLand: isPointOnPlayableLand(point, radius),
    isWater,
    bridge: bridgeAtPoint(point, radius, model),
    nearestRoad: nearestRoadAtPoint(point, model),
    nearestPlace: nearestPlaceAtPoint(places, point, placeMaxDistance),
  };
}

export function routeHintBetween(start: Point, end: Point, model: WindhavenMapModel = windhavenMapModel): RouteHint {
  const startRoad = projectPointToRoad(start, model);
  const endRoad = projectPointToRoad(end, model);
  const bridges = bridgesBetween(start, end, model);
  const bridgeRoads = bridges
    .map(bridge => model.roadPaths.find(road => road.name === bridge.roadName) ?? null)
    .filter((road): road is RoadPath => road !== null);
  const roads = uniqueRoads([startRoad.road, ...bridgeRoads, endRoad.road]);
  const waypoints = compactRoutePoints([
    start,
    startRoad.point,
    ...bridges.map(bridgeCenter),
    endRoad.point,
    end,
  ]);

  return {
    start,
    end,
    waypoints,
    roads,
    bridges,
    distance: routeDistance(waypoints),
  };
}

function projectPointToRoadPath(point: Point, road: RoadPath): RoadProjection {
  return road.path.slice(0, -1).reduce(function(best, start, index){
    const end = road.path[index + 1];
    const projected = projectPointToSegment(point, start, end);
    const distance = Math.hypot(point.x - projected.x, point.y - projected.y);
    return distance < best.distance ? { road, point:projected, distance } : best;
  }, { road, point:road.path[0], distance:Infinity });
}

function projectPointToSegment(point: Point, start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lenSq = dx*dx + dy*dy;
  if(lenSq === 0) return start;
  const t = Math.max(0, Math.min(1, ((point.x - start.x)*dx + (point.y - start.y)*dy) / lenSq));
  return { x:start.x + t*dx, y:start.y + t*dy };
}

function bridgesBetween(start: Point, end: Point, model: WindhavenMapModel): BridgeRecord[] {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  return model.bridges
    .filter(function(bridge){
      const center = bridgeCenter(bridge);
      const routeDistanceToBridge = distancePointToSegment(center.x, center.y, start.x, start.y, end.x, end.y);
      return center.x >= minX && center.x <= maxX && routeDistanceToBridge <= Math.max(110, bridge.width);
    })
    .sort(function(a, b){
      const ax = bridgeCenter(a).x;
      const bx = bridgeCenter(b).x;
      return start.x <= end.x ? ax - bx : bx - ax;
    });
}

function bridgeCenter(bridge: BridgeRecord): Point {
  const start = bridge.path[0];
  const end = bridge.path[bridge.path.length - 1];
  return { x:(start.x + end.x)/2, y:(start.y + end.y)/2 };
}

function uniqueRoads(roads: RoadPath[]): RoadPath[] {
  const seen = new Set<string>();
  return roads.filter(function(road){
    if(seen.has(road.id)) return false;
    seen.add(road.id);
    return true;
  });
}

function compactRoutePoints(points: Point[]): Point[] {
  return points.filter(function(point, index){
    const previous = points[index - 1];
    if(!previous) return true;
    return Math.hypot(point.x - previous.x, point.y - previous.y) > 2;
  });
}

function routeDistance(points: Point[]): number {
  return points.slice(1).reduce(function(total, point, index){
    const previous = points[index];
    return total + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);
}
