import type { Point } from '../config/types';
import { isPointInWater } from './geometry';
import { onAnyRoad } from './queries';
import { signalGreen, type Axis } from './trafficRules';
import { roadNetwork } from './world';

// LEGAL: The city's pavements as a network people can find their way along (TODO 163). Walkers used to
// LEGAL: circle one block forever and never crossed a street. Now each corner of every junction is a
// LEGAL: point on the network, joined along the pavement to the next corner down the street and across
// LEGAL: the street by the crossing; a walker picks somewhere to go, finds the shortest way there and
// LEGAL: waits at the kerb for the lights before crossing.
export const PAVEMENT = 42;
// LEGAL: Streets further apart than this have water between them (the canals): no pavement joins them.
const DISTRICT_GAP = 800;

export interface PavementCrossing { junction: Point; axis: Axis }
export interface PavementNode { x: number; y: number }
export interface PavementEdge { a: number; b: number; length: number; crossing: PavementCrossing | null }
export interface PavementGraph { nodes: PavementNode[]; edges: PavementEdge[]; links: number[][] }

function junctionDrawn(v: { x: number; name: string }, h: { y: number; name: string }): boolean {
  const at = { x:v.x, y:h.y };
  return onAnyRoad(at, 2, undefined, road => road.name !== v.name) && onAnyRoad(at, 2, undefined, road => road.name !== h.name);
}

function standable(point: Point): boolean {
  return !isPointInWater(point, 6) && !onAnyRoad(point, 2);
}

// LEGAL: A stretch of pavement is usable if every step along it is dry and off every carriageway (a
// LEGAL: diagonal street cuts straight through some blocks).
function clearRun(a: Point, b: Point): boolean {
  const steps = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 10));
  for(let i = 0; i <= steps; i++){
    const t = i / steps;
    if(!standable({ x:a.x + (b.x - a.x) * t, y:a.y + (b.y - a.y) * t })) return false;
  }
  return true;
}

let cached: PavementGraph | null = null;
export function pavementGraph(): PavementGraph {
  if(cached) return cached;
  const vs = [...roadNetwork.vertical].sort((a, b) => a.x - b.x);
  const hs = [...roadNetwork.horizontal].sort((a, b) => a.y - b.y);
  const nodes: PavementNode[] = [];
  const edges: PavementEdge[] = [];
  // LEGAL: corner[vi][hi][sx][sy], sx and sy 0 for the west or north corner and 1 for the east or south.
  const corner = new Map<string, number>();
  const key = (vi: number, hi: number, sx: number, sy: number) => `${vi}:${hi}:${sx}:${sy}`;
  const drawn = vs.map(v => hs.map(h => junctionDrawn(v, h)));
  vs.forEach(function(v, vi){
    hs.forEach(function(h, hi){
      if(!drawn[vi][hi]) return;
      for(const sx of [0, 1]) for(const sy of [0, 1]){
        const point = { x:v.x + (sx ? PAVEMENT : -PAVEMENT), y:h.y + (sy ? PAVEMENT : -PAVEMENT) };
        if(!standable(point)) continue;
        corner.set(key(vi, hi, sx, sy), nodes.length);
        nodes.push(point);
      }
    });
  });
  const join = (a: number | undefined, b: number | undefined, crossing: PavementCrossing | null) => {
    if(a === undefined || b === undefined) return;
    if(!crossing && !clearRun(nodes[a], nodes[b])) return;
    edges.push({ a, b, length:Math.hypot(nodes[b].x - nodes[a].x, nodes[b].y - nodes[a].y), crossing });
  };
  vs.forEach(function(v, vi){
    hs.forEach(function(h, hi){
      if(!drawn[vi][hi]) return;
      const junction = { x:v.x, y:h.y };
      // LEGAL: Across the avenue (walking east or west) and across the street (walking north or south).
      for(const sy of [0, 1]) join(corner.get(key(vi, hi, 0, sy)), corner.get(key(vi, hi, 1, sy)), { junction, axis:'ew' });
      for(const sx of [0, 1]) join(corner.get(key(vi, hi, sx, 0)), corner.get(key(vi, hi, sx, 1)), { junction, axis:'ns' });
      // LEGAL: Down the pavement to the next junction south, and to the next one east.
      if(hi + 1 < hs.length && drawn[vi][hi + 1]) for(const sx of [0, 1]) join(corner.get(key(vi, hi, sx, 1)), corner.get(key(vi, hi + 1, sx, 0)), null);
      if(vi + 1 < vs.length && drawn[vi + 1][hi] && vs[vi + 1].x - v.x <= DISTRICT_GAP) for(const sy of [0, 1]) join(corner.get(key(vi, hi, 1, sy)), corner.get(key(vi + 1, hi, 0, sy)), null);
    });
  });
  const links = nodes.map(() => [] as number[]);
  edges.forEach(function(edge, i){ links[edge.a].push(i); links[edge.b].push(i); });
  cached = { nodes, edges, links };
  return cached;
}

export interface PavementStep { to: number; crossing: PavementCrossing | null }

// LEGAL: The shortest way along the pavements from one corner to another (Dijkstra; the network is a
// LEGAL: hundred-odd corners). Empty if there's no way there, as across a canal with no bridge.
export function pavementPath(graph: PavementGraph, from: number, to: number): PavementStep[] {
  const distance = graph.nodes.map(() => Infinity);
  const via: Array<number | null> = graph.nodes.map(() => null);
  const done = graph.nodes.map(() => false);
  distance[from] = 0;
  for(;;){
    let current = -1;
    distance.forEach(function(d, i){ if(!done[i] && d < Infinity && (current < 0 || d < distance[current])) current = i; });
    if(current < 0 || current === to) break;
    done[current] = true;
    graph.links[current].forEach(function(e){
      const edge = graph.edges[e];
      const next = edge.a === current ? edge.b : edge.a;
      const through = distance[current] + edge.length;
      if(through < distance[next]){ distance[next] = through; via[next] = e; }
    });
  }
  if(distance[to] === Infinity) return [];
  const steps: PavementStep[] = [];
  let at = to;
  while(at !== from){
    const edge = graph.edges[via[at]!];
    steps.unshift({ to:at, crossing:edge.crossing });
    at = edge.a === at ? edge.b : edge.a;
  }
  return steps;
}

export function nearestPavementNode(graph: PavementGraph, point: Point): number {
  let best = 0, bestDistance = Infinity;
  graph.nodes.forEach(function(node, i){
    const d = Math.hypot(node.x - point.x, node.y - point.y);
    if(d < bestDistance){ best = i; bestDistance = d; }
  });
  return best;
}

// LEGAL: Whether to step off the kerb: the traffic running the way you're walking has green, and will
// LEGAL: still have it by the time you're across. Cars on the street you're crossing have red.
export function safeToCross(crossing: PavementCrossing, time: number, secondsToCross: number): boolean {
  return signalGreen(crossing.axis, crossing.junction, time) && signalGreen(crossing.axis, crossing.junction, time + secondsToCross + 0.5);
}
