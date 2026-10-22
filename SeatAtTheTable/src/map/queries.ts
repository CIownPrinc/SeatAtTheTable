import type { Point } from '../config/types';
import { isPointInWater, isPointOnWindhavenLand } from './geometry';
import { distancePointToSegment } from './layout';
import { districtIdAtPlayablePoint, nearestRoadAtPoint, windhavenMapModel, type BridgeRecord, type MapDistrictRecord, type RailLineRecord, type RoadPath, type WindhavenMapModel, roadLandSegments } from './mapModel';
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

export interface RouteSummary {
  distanceMeters: number;
  streetNames: string[];
  bridgeNames: string[];
  label: string;
}

export interface TrainSnapshot {
  rail: RailLineRecord;
  point: Point;
  progress: number;
}

export interface RailCrossingBlock {
  rail: RailLineRecord;
  road: RoadPath;
  point: Point;
  train: TrainSnapshot;
  distance: number;
}

interface RoadSegment {
  road: RoadPath;
  start: Point;
  end: Point;
}

interface RouteGraphNode {
  id: string;
  point: Point;
}

interface RouteGraphEdge {
  to: string;
  road: RoadPath;
  distance: number;
}

interface RouteGraph {
  nodes: Map<string, RouteGraphNode>;
  edges: Map<string, RouteGraphEdge[]>;
}

interface RouteSearchResult {
  pointIds: string[];
  roads: RoadPath[];
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
  const routeGraph = buildRouteGraph(startRoad, endRoad, model);
  const routeResult = shortestRoute(
    routeGraph,
    pointKey(startRoad.point),
    pointKey(endRoad.point),
  );
  const roadPoints = routeResult.pointIds.map(id => routeGraph.nodes.get(id)?.point).filter((point): point is Point => point !== undefined);
  const fallbackRoadPoints = [startRoad.point, endRoad.point];
  const waypoints = compactRoutePoints([
    start,
    ...(roadPoints.length > 0 ? roadPoints : fallbackRoadPoints),
    end,
  ]);
  const roads = uniqueRoads(routeResult.roads.length > 0 ? routeResult.roads : [startRoad.road, endRoad.road]);
  const bridges = bridgesOnRoute(waypoints, roads, model);

  return {
    start,
    end,
    waypoints,
    roads,
    bridges,
    distance: routeDistance(waypoints),
  };
}

export function routeSummary(route: RouteHint): RouteSummary {
  const distanceMeters = Math.round(route.distance);
  const streetNames = route.roads.map(road => road.name);
  const bridgeNames = route.bridges.map(bridge => bridge.name);
  const streetLabel = streetNames.length > 0 ? `via ${streetNames.slice(0, 3).join(' / ')}` : 'direct route';
  const bridgeLabel = bridgeNames.length > 0 ? `, crossing ${bridgeNames.slice(0, 2).join(' / ')}` : '';
  return {
    distanceMeters,
    streetNames,
    bridgeNames,
    label: `${streetLabel}${bridgeLabel} - ${distanceMeters}m`,
  };
}

export function activeTrainSnapshot(timeMs: number, rail: RailLineRecord): TrainSnapshot | null {
  const cycle = positiveModulo(timeMs, rail.trainCycleMs) / rail.trainCycleMs;
  if(cycle < rail.activeWindow.start || cycle > rail.activeWindow.end) return null;
  const progress = (cycle - rail.activeWindow.start) / (rail.activeWindow.end - rail.activeWindow.start);
  const start = rail.path[0];
  const end = rail.path[rail.path.length - 1];
  return {
    rail,
    point: {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress,
    },
    progress,
  };
}

export function trainCrossingBlockAtPoint(point: Point, timeMs: number, radius = 28, model: WindhavenMapModel = windhavenMapModel): RailCrossingBlock | null {
  const candidates = model.railLines.flatMap(function(rail): RailCrossingBlock[] {
    const train = activeTrainSnapshot(timeMs, rail);
    if(!train) return [];
    return railCrossings(rail, model).map(function(crossing): RailCrossingBlock {
      return {
        rail,
        road: crossing.road,
        point: crossing.point,
        train,
        distance: Math.hypot(point.x - crossing.point.x, point.y - crossing.point.y),
      };
    });
  });
  return candidates.find(function(candidate): boolean {
    const trainNearCrossing = Math.abs(candidate.train.point.y - candidate.point.y) <= Math.max(96, candidate.rail.width * 2);
    return trainNearCrossing && candidate.distance <= radius + candidate.rail.width / 2 + candidate.road.width / 2;
  }) ?? null;
}

function buildRouteGraph(startRoad: RoadProjection, endRoad: RoadProjection, model: WindhavenMapModel): RouteGraph {
  const nodes = new Map<string, RouteGraphNode>();
  const edges = new Map<string, RouteGraphEdge[]>();
  const segments = roadSegments(model);
  const pointsByRoad = new Map<string, Point[]>();

  model.roadPaths.forEach(function(road): void {
    pointsByRoad.set(road.id, [...road.path]);
  });

  for(let i = 0; i < segments.length; i++){
    for(let j = i + 1; j < segments.length; j++){
      const intersection = segmentIntersection(segments[i].start, segments[i].end, segments[j].start, segments[j].end);
      if(intersection){
        pointsByRoad.get(segments[i].road.id)?.push(intersection);
        pointsByRoad.get(segments[j].road.id)?.push(intersection);
      }
    }
  }

  pointsByRoad.get(startRoad.road.id)?.push(startRoad.point);
  pointsByRoad.get(endRoad.road.id)?.push(endRoad.point);

  segments.forEach(function(segment): void {
    const segmentPoints = (pointsByRoad.get(segment.road.id) ?? [])
      .filter(point => pointOnSegment(point, segment.start, segment.end, 0.75))
      .sort(function(a, b): number {
        return segmentT(a, segment.start, segment.end) - segmentT(b, segment.start, segment.end);
      })
      .filter(function(point, index, points): boolean {
        const previous = points[index - 1];
        return !previous || pointDistance(point, previous) > 0.75;
      });

    segmentPoints.forEach(function(point): void {
      addGraphNode(nodes, edges, point);
    });

    segmentPoints.slice(1).forEach(function(point, index): void {
      const previous = segmentPoints[index];
      addGraphEdge(edges, previous, point, segment.road);
      addGraphEdge(edges, point, previous, segment.road);
    });
  });

  return { nodes, edges };
}

// LEGAL: Where each railway crosses the roads: fixed once the map is built, and asked for on every
// LEGAL: movement check, so it's worked out once per line.
const crossingCache = new WeakMap<RailLineRecord, Array<{ road: RoadPath; point: Point }>>();
function railCrossings(rail: RailLineRecord, model: WindhavenMapModel): Array<{ road: RoadPath; point: Point }> {
  const cached = crossingCache.get(rail);
  if(cached) return cached;
  const computed = computeRailCrossings(rail, model);
  crossingCache.set(rail, computed);
  return computed;
}

// LEGAL: Whether a point is on any drawn road's carriageway, give or take `margin`: for anything that
// LEGAL: must stand beside a road and never in it (street trees, signal and lamp poles).
export function onAnyRoad(point: Point, margin: number, model: WindhavenMapModel = windhavenMapModel, except?: (road: RoadPath) => boolean): boolean {
  return roadLandSegments(model).some(function(segment){
    if(except?.(segment.road)) return false;
    const half = segment.road.width / 2 + margin;
    return segment.path.slice(0, -1).some(function(a, i){
      const b = segment.path[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y, len = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len));
      return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t)) < half;
    });
  });
}

// LEGAL: The stretches of a railway that cross a road, as distances along the line from its first
// LEGAL: point: the road's width where it meets the rails (wider for a road crossing at a slant), plus
// LEGAL: a margin. The raised rails and sleepers stop at these and flush crossing rails run through
// LEGAL: the road instead; they used to stand four units proud straight across every road.
export interface RailSpan { from: number; to: number }
export const RAIL_CROSSING_MARGIN = 6;
export function railCrossingSpans(rail: RailLineRecord, model: WindhavenMapModel = windhavenMapModel): RailSpan[] {
  const a = rail.path[0], b = rail.path[rail.path.length - 1];
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ux = (b.x - a.x) / length, uy = (b.y - a.y) / length;
  const spans = railCrossings(rail, model).map(function({ road, point }){
    // LEGAL: The road's direction where it crosses: the segment nearest the crossing point.
    let dir = { x:1, y:0 }, best = Infinity;
    road.path.slice(0, -1).forEach(function(start, i){
      const end = road.path[i + 1];
      const mid = { x:(start.x + end.x) / 2, y:(start.y + end.y) / 2 };
      const d = Math.hypot(mid.x - point.x, mid.y - point.y);
      const len = Math.hypot(end.x - start.x, end.y - start.y) || 1;
      if(d < best){ best = d; dir = { x:(end.x - start.x) / len, y:(end.y - start.y) / len }; }
    });
    const sin = Math.max(0.3, Math.abs(dir.x * uy - dir.y * ux));
    const along = (point.x - a.x) * ux + (point.y - a.y) * uy;
    const half = road.width / 2 / sin + RAIL_CROSSING_MARGIN;
    return { from:along - half, to:along + half };
  }).sort((p, q) => p.from - q.from);
  const merged: RailSpan[] = [];
  spans.forEach(function(span){
    const last = merged[merged.length - 1];
    if(last && span.from <= last.to) last.to = Math.max(last.to, span.to);
    else merged.push({ ...span });
  });
  return merged;
}
// LEGAL: Where the line crosses water, as distances along it: there it runs on a trestle bridge
// LEGAL: (RAIL_BRIDGE_HEIGHT up, with BRIDGE_RAMP-long approaches either side) instead of on ballast.
export const RAIL_BRIDGE_HEIGHT = 7;
export const RAIL_BRIDGE_RAMP = 60;
const waterSpanCache = new WeakMap<RailLineRecord, RailSpan[]>();
export function railWaterSpans(rail: RailLineRecord): RailSpan[] {
  const cached = waterSpanCache.get(rail);
  if(cached) return cached;
  const a = rail.path[0], b = rail.path[rail.path.length - 1];
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const spans: RailSpan[] = [];
  let start: number | null = null;
  for(let d = 0; d <= length; d += 5){
    const wet = isPointInWater({ x:a.x + (b.x - a.x) * d / length, y:a.y + (b.y - a.y) * d / length }, rail.width / 2);
    if(wet && start === null) start = d;
    if(!wet && start !== null){ spans.push({ from:start, to:d }); start = null; }
  }
  if(start !== null) spans.push({ from:start, to:length });
  waterSpanCache.set(rail, spans);
  return spans;
}
// LEGAL: How high the track is at a distance along the line: up on the bridge, ramping up to it.
export function railHeightAt(rail: RailLineRecord, along: number): number {
  let height = 0;
  railWaterSpans(rail).forEach(function(span){
    if(along >= span.from && along <= span.to) height = RAIL_BRIDGE_HEIGHT;
    else if(along > span.from - RAIL_BRIDGE_RAMP && along < span.from) height = Math.max(height, RAIL_BRIDGE_HEIGHT * (1 - (span.from - along) / RAIL_BRIDGE_RAMP));
    else if(along > span.to && along < span.to + RAIL_BRIDGE_RAMP) height = Math.max(height, RAIL_BRIDGE_HEIGHT * (1 - (along - span.to) / RAIL_BRIDGE_RAMP));
  });
  return height;
}

// LEGAL: The rest of the line on dry ground: where the raised track runs on its ballast.
export function railOpenSpans(rail: RailLineRecord, model: WindhavenMapModel = windhavenMapModel): RailSpan[] {
  const a = rail.path[0], b = rail.path[rail.path.length - 1];
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const open: RailSpan[] = [];
  let at = 0;
  const breaks = [...railCrossingSpans(rail, model), ...railWaterSpans(rail).map(span => ({ from:span.from - RAIL_BRIDGE_RAMP, to:span.to + RAIL_BRIDGE_RAMP }))].sort((p, q) => p.from - q.from);
  breaks.forEach(function(span){
    if(span.from > at) open.push({ from:at, to:Math.min(span.from, length) });
    at = Math.max(at, span.to);
  });
  if(at < length) open.push({ from:at, to:length });
  return open.filter(span => span.to - span.from > 1);
}

function computeRailCrossings(rail: RailLineRecord, model: WindhavenMapModel): Array<{ road: RoadPath; point: Point }> {
  const railSegments = rail.path.slice(0, -1).map(function(start, index): { start: Point; end: Point } {
    return { start, end: rail.path[index + 1] };
  });
  return model.roadPaths.flatMap(function(road): Array<{ road: RoadPath; point: Point }> {
    return road.path.slice(0, -1).flatMap(function(start, index): Array<{ road: RoadPath; point: Point }> {
      const end = road.path[index + 1];
      const intersections = railSegments
        .map(segment => segmentIntersection(segment.start, segment.end, start, end))
        .filter((intersection): intersection is Point => intersection !== null);
      return intersections.map(point => ({ road, point }));
    });
  });
}

function roadSegments(model: WindhavenMapModel): RoadSegment[] {
  return model.roadPaths.flatMap(function(road): RoadSegment[] {
    return road.path.slice(0, -1).map(function(start, index): RoadSegment {
      return { road, start, end: road.path[index + 1] };
    });
  });
}

function addGraphNode(nodes: Map<string, RouteGraphNode>, edges: Map<string, RouteGraphEdge[]>, point: Point): string {
  const id = pointKey(point);
  if(!nodes.has(id)) nodes.set(id, { id, point: normalizedPoint(point) });
  if(!edges.has(id)) edges.set(id, []);
  return id;
}

function addGraphEdge(edges: Map<string, RouteGraphEdge[]>, from: Point, to: Point, road: RoadPath): void {
  const fromId = pointKey(from);
  const toId = pointKey(to);
  if(fromId === toId) return;
  edges.get(fromId)?.push({ to:toId, road, distance:pointDistance(from, to) });
}

function shortestRoute(graph: RouteGraph, startId: string, endId: string): RouteSearchResult {
  const distances = new Map<string, number>();
  const previous = new Map<string, { nodeId: string; road: RoadPath }>();
  const unvisited = new Set<string>(graph.nodes.keys());

  graph.nodes.forEach(function(_node, id): void {
    distances.set(id, id === startId ? 0 : Infinity);
  });

  while(unvisited.size > 0){
    const currentId = nearestUnvisited(unvisited, distances);
    if(currentId === null || currentId === endId) break;
    unvisited.delete(currentId);
    const currentDistance = distances.get(currentId) ?? Infinity;
    (graph.edges.get(currentId) ?? []).forEach(function(edge): void {
      if(!unvisited.has(edge.to)) return;
      const nextDistance = currentDistance + edge.distance;
      if(nextDistance < (distances.get(edge.to) ?? Infinity)){
        distances.set(edge.to, nextDistance);
        previous.set(edge.to, { nodeId:currentId, road:edge.road });
      }
    });
  }

  if(startId !== endId && !previous.has(endId)) return { pointIds:[], roads:[] };

  const pointIds = [endId];
  const roads: RoadPath[] = [];
  let cursor = endId;
  while(cursor !== startId){
    const step = previous.get(cursor);
    if(!step) break;
    roads.unshift(step.road);
    cursor = step.nodeId;
    pointIds.unshift(cursor);
  }

  return { pointIds, roads: uniqueRoads(roads) };
}

function nearestUnvisited(unvisited: Set<string>, distances: Map<string, number>): string | null {
  let bestId: string | null = null;
  let bestDistance = Infinity;
  unvisited.forEach(function(id): void {
    const distance = distances.get(id) ?? Infinity;
    if(distance < bestDistance){
      bestDistance = distance;
      bestId = id;
    }
  });
  return bestId;
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

function bridgesOnRoute(points: Point[], roads: RoadPath[], model: WindhavenMapModel): BridgeRecord[] {
  return model.bridges.filter(function(bridge): boolean {
    if(!roads.some(road => road.name === bridge.roadName)) return false;
    const center = bridgeCenter(bridge);
    return points.slice(1).some(function(point, index): boolean {
      const previous = points[index];
      return distancePointToSegment(center.x, center.y, previous.x, previous.y, point.x, point.y) <= Math.max(bridge.width, 70);
    });
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

function segmentIntersection(aStart: Point, aEnd: Point, bStart: Point, bEnd: Point): Point | null {
  const ax = aEnd.x - aStart.x;
  const ay = aEnd.y - aStart.y;
  const bx = bEnd.x - bStart.x;
  const by = bEnd.y - bStart.y;
  const denominator = ax*by - ay*bx;
  if(Math.abs(denominator) < 0.00001){
    return sharedEndpoint(aStart, aEnd, bStart, bEnd);
  }
  const cx = bStart.x - aStart.x;
  const cy = bStart.y - aStart.y;
  const t = (cx*by - cy*bx) / denominator;
  const u = (cx*ay - cy*ax) / denominator;
  if(t < -0.00001 || t > 1.00001 || u < -0.00001 || u > 1.00001) return null;
  return normalizedPoint({ x:aStart.x + t*ax, y:aStart.y + t*ay });
}

function sharedEndpoint(aStart: Point, aEnd: Point, bStart: Point, bEnd: Point): Point | null {
  const endpoints = [aStart, aEnd];
  return endpoints.find(endpoint => pointDistance(endpoint, bStart) < 0.75 || pointDistance(endpoint, bEnd) < 0.75) ?? null;
}

function pointOnSegment(point: Point, start: Point, end: Point, tolerance: number): boolean {
  return distancePointToSegment(point.x, point.y, start.x, start.y, end.x, end.y) <= tolerance && segmentT(point, start, end) >= -0.00001 && segmentT(point, start, end) <= 1.00001;
}

function segmentT(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lenSq = dx*dx + dy*dy;
  if(lenSq === 0) return 0;
  return ((point.x - start.x)*dx + (point.y - start.y)*dy) / lenSq;
}

function pointKey(point: Point): string {
  const normalized = normalizedPoint(point);
  return `${normalized.x},${normalized.y}`;
}

function normalizedPoint(point: Point): Point {
  return { x:Math.round(point.x * 1000) / 1000, y:Math.round(point.y * 1000) / 1000 };
}

function pointDistance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
