import { CITY_JUNCTIONS, trafficRoutes, type RouteMark, type TrafficRoute } from './traffic';
import { blockerPace, followingPace, signalPace, type RoadBlocker } from './trafficRules';
import { nearestPavementNode, pavementGraph, pavementPath, safeToCross } from './pavements';

// LEGAL: Enough that a street is rarely empty; few enough that phones keep their frame rate.
const WALKER_COUNT = 36;
import type { GangRecruit, Point } from '../config/types';
import type { MapObject } from './objects';
import type { MapNpc } from './markers';
import { seededRandom } from './random';
import type * as ThreeNamespace from 'three';

export type RoamingActorKind = 'pedestrian' | 'car';

export interface RoamingActor {
  id: string;
  kind: RoamingActorKind;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  targetX: number;
  targetY: number;
  radius: number;
  speed: number;
  color: string;
  facing: number;
  object?: MapObject<'npc'> | MapObject<'gangnpc'>;
  group: ThreeNamespace.Group | null;
  route?: Point[];
  routeIndex: number;
  // LEGAL: Share of its speed a car is using (0 stopped, 1 cruising), eased so it brakes and pulls away.
  pace?: number;
  // LEGAL: Off duty: not drawn, not moving, and not in anyone's way (the snow plow between snowfalls).
  dormant?: boolean;
  // LEGAL: What to do on the way to each point of the route (map/traffic RouteMark), by index.
  marks?: Array<RouteMark | undefined>;
  // LEGAL: Standing still until this time: parked in a bay, or waiting at the kerb.
  waitUntil?: number;
  // LEGAL: Out on a crossing, so cars stop for them.
  crossing?: boolean;
  // LEGAL: A walker finding its way along the pavements (map/pavements): the corner it's heading for,
  // LEGAL: and how many trips it has made, to pick the next place to go.
  pavement?: { goal: number; trips: number };
  // LEGAL: When a walker found every way forward blocked.
  boxedSince?: number;
}

export interface RoamingUpdateOptions {
  dt: number;
  playSeconds: number;
  indoors: boolean;
  canMove: (x: number, y: number) => boolean;
  // LEGAL: Nearest standable point to somewhere unstandable. Supplied by the caller so the
  // LEGAL: pedestrians use the same escape the player does rather than a second opinion.
  rescue?: (x: number, y: number) => Point;
  // LEGAL: Things in the road that cars must stop for (the player).
  blockers?: RoadBlocker[];
}

function roamSeed(id: string): number {
  let seed = 17;
  for(let i=0;i<id.length;i++) seed = (seed * 31 + id.charCodeAt(i)) % 100000;
  return seed;
}

// LEGAL: A fresh trip along the pavements from the corner nearest a walker to somewhere a few streets
// LEGAL: away, chosen from its id and how many trips it has made, so it's the same every session.
function planWalk(actor: RoamingActor): void {
  const graph = pavementGraph();
  const from = nearestPavementNode(graph, actor);
  const trips = (actor.pavement?.trips ?? 0) + 1;
  const rand = seededRandom(roamSeed(actor.id) + trips * 7919);
  let steps = pavementPath(graph, from, from);
  for(let i = 0; i < 6 && steps.length < 3; i++) steps = pavementPath(graph, from, Math.floor(rand() * graph.nodes.length));
  if(steps.length === 0) steps = graph.links[from].map(e => graph.edges[e]).slice(0, 1).map(edge => ({ to:edge.a === from ? edge.b : edge.a, crossing:edge.crossing }));
  const start = graph.nodes[from];
  actor.route = [{ x:start.x, y:start.y }, ...steps.map(step => ({ x:graph.nodes[step.to].x, y:graph.nodes[step.to].y }))];
  actor.marks = [undefined, ...steps.map(step => (step.crossing ? { crossing:step.crossing } : undefined))];
  actor.routeIndex = 0;
  actor.targetX = start.x; actor.targetY = start.y;
  actor.pavement = { goal:steps.length ? steps[steps.length - 1].to : from, trips };
}

// LEGAL: A traffic car driving its route from the start.
export function carActor(route: TrafficRoute): RoamingActor {
  const start = route.route[0];
  const target = route.route[1];
  return {
    id: route.id,
    kind: 'car',
    x: start.x,
    y: start.y,
    homeX: start.x,
    homeY: start.y,
    targetX: target.x,
    targetY: target.y,
    radius: 0,
    speed: route.speed,
    color: route.color,
    facing: Math.atan2(target.y - start.y, target.x - start.x),
    group: null,
    route: route.route,
    routeIndex: 1,
    dormant: route.id.startsWith('snowplow'),
    marks: route.marks,
  };
}

export function createRoamingActors(mapObjects: MapObject[], errands: TrafficRoute[] = []): RoamingActor[] {
  const actors: RoamingActor[] = [];
  mapObjects.filter(o=>o.kind==='npc' || o.kind==='gangnpc').forEach(function(object){
    const isGang = object.kind === 'gangnpc';
    const npc = object.kind === 'npc' ? object.ref as MapNpc : null;
    const named = npc?.type === 'named';
    const baseRadius = object.id === 'dice' ? 82 : (named ? 115 : 155);
    actors.push({
      id: object.id,
      kind: 'pedestrian',
      x: object.x,
      y: object.y,
      homeX: object.x,
      homeY: object.y,
      targetX: object.x,
      targetY: object.y,
      radius: isGang ? 95 : baseRadius,
      speed: named ? 26 : 34,
      color: isGang ? '#5f6275' : (named ? '#d4a017' : '#7a6fb0'),
      facing: Math.PI / 2,
      object: object as MapObject<'npc'> | MapObject<'gangnpc'>,
      group: null,
      routeIndex: 0,
    });
  });
  // LEGAL: The background crowd: no name, no mission, just people walking round the block.
  const graph = pavementGraph();
  const crowd = seededRandom(9091);
  for(let n = 0; n < WALKER_COUNT; n++){
    const start = graph.nodes[Math.floor(crowd() * graph.nodes.length)];
    const walker: RoamingActor = {
      id: `walker-${n}`, kind: 'pedestrian', x: start.x, y: start.y, homeX: start.x, homeY: start.y,
      targetX: start.x, targetY: start.y, radius: 0, speed: 22 + crowd() * 14, color: '', facing: 0,
      group: null, routeIndex: 0, pavement: { goal:0, trips:0 },
    };
    planWalk(walker);
    actors.push(walker);
  }
  [...trafficRoutes(), ...errands].forEach(route => actors.push(carActor(route)));
  return actors;
}

function rehomeActor(actor: RoamingActor, point: Point): void {
  actor.x = point.x; actor.y = point.y;
  actor.homeX = point.x; actor.homeY = point.y;
  actor.targetX = point.x; actor.targetY = point.y;
  if(actor.object){ actor.object.x = point.x; actor.object.y = point.y; }
}

// LEGAL: Pedestrians spawn on their map object's authored point, which nobody ever checked
// LEGAL: was standable. One authored inside a building was stuck there permanently: every
// LEGAL: candidate target failed canMove, and the fallback was to walk back to the home point
// LEGAL: it was already trapped in. Settling the spawn once, before anyone sees it, is the
// LEGAL: fix — moving HOME too, so it does not simply wander back inside.
export function settleRoamingActors(
  actors: RoamingActor[],
  canMove: (x: number, y: number) => boolean,
  rescue: (x: number, y: number) => Point,
): number {
  let moved = 0;
  actors.forEach(function(actor){
    if(actor.kind === 'car' || canMove(actor.x, actor.y)) return;
    const free = rescue(actor.x, actor.y);
    rehomeActor(actor, free);
    moved += 1;
  });
  return moved;
}

// LEGAL: Pedestrians walk in a straight line to their target, so a clear DESTINATION is not
// LEGAL: enough — a target on the far side of a building sends the actor into the wall, where
// LEGAL: it is blocked, retreats home, picks the same sort of target and does it again. That
// LEGAL: pacing against a wall is what reads as an NPC stuck in a building. Sampling the
// LEGAL: line means it only accepts somewhere it can actually walk to.
function pathIsClear(fromX: number, fromY: number, toX: number, toY: number, canMove: (x: number, y: number) => boolean): boolean {
  const steps = Math.max(2, Math.ceil(Math.hypot(toX - fromX, toY - fromY) / 12));
  for(let i=1;i<=steps;i++){
    const t = i / steps;
    if(!canMove(fromX + (toX - fromX) * t, fromY + (toY - fromY) * t)) return false;
  }
  return true;
}

function choosePedestrianTarget(actor: RoamingActor, playSeconds: number, canMove: (x: number, y: number) => boolean): void {
  const rand = seededRandom(roamSeed(actor.id) + Math.floor(playSeconds / 5));
  for(let i=0;i<5;i++){
    const angle = rand() * Math.PI * 2;
    const distance = actor.radius * (0.25 + rand() * 0.75);
    const nx = actor.homeX + Math.cos(angle) * distance;
    const ny = actor.homeY + Math.sin(angle) * distance;
    if(canMove(nx, ny) && pathIsClear(actor.x, actor.y, nx, ny, canMove)){
      actor.targetX = nx;
      actor.targetY = ny;
      break;
    }
  }
}

function moveActorToward(actor: RoamingActor, options: RoamingUpdateOptions): void {
  if(actor.waitUntil !== undefined){
    if(options.playSeconds < actor.waitUntil) return;
    actor.waitUntil = undefined;
  }
  const dx = actor.targetX - actor.x;
  const dy = actor.targetY - actor.y;
  const dist = Math.hypot(dx, dy);
  const mark = actor.marks?.[actor.routeIndex];
  if(dist < 5){
    actor.crossing = false;
    if(mark?.dwell) actor.waitUntil = options.playSeconds + mark.dwell;
    if(actor.pavement && actor.route && actor.routeIndex >= actor.route.length - 1){
      planWalk(actor);
    } else if(actor.route && actor.route.length > 1){
      actor.routeIndex = (actor.routeIndex + 1) % actor.route.length;
      const next = actor.route[actor.routeIndex];
      actor.targetX = next.x;
      actor.targetY = next.y;
    } else {
      choosePedestrianTarget(actor, options.playSeconds, options.canMove);
    }
    return;
  }
  // LEGAL: At the kerb, a walker waits for the lights, facing the way it's going.
  if(mark?.crossing && !actor.crossing){
    actor.facing = Math.atan2(dy, dx);
    if(!safeToCross(mark.crossing, options.playSeconds, dist / actor.speed)) return;
    actor.crossing = true;
  }
  const step = Math.min(dist, actor.speed * (actor.pace ?? 1) * (mark?.slow ?? 1) * options.dt);
  const nx = actor.x + dx / dist * step;
  const ny = actor.y + dy / dist * step;
  // LEGAL: Backing out of a bay: it moves toward the point with its nose the other way.
  actor.facing = mark?.reverse ? Math.atan2(-dy, -dx) : Math.atan2(dy, dx);
  if(actor.pavement){
    stepAlongPavement(actor, dx / dist, dy / dist, step, options);
    return;
  }
  if(actor.kind === 'car' || options.canMove(nx, ny)){
    actor.x = nx;
    actor.y = ny;
    if(actor.object){
      actor.object.x = nx;
      actor.object.y = ny;
    }
  } else if(options.canMove(actor.homeX, actor.homeY)){
    actor.targetX = actor.homeX;
    actor.targetY = actor.homeY;
  } else if(options.rescue){
    // LEGAL: Blocked AND with nowhere to retreat to — the world changed under the actor
    // LEGAL: (a building appeared, a lot was re-allocated). Re-home it somewhere standable
    // LEGAL: instead of leaving it shoving against a wall forever.
    const free = options.rescue(actor.x, actor.y);
    rehomeActor(actor, free);
  }
}

// LEGAL: A walker on the pavement steers round what's in the way (a street tree's trunk, a bench)
// LEGAL: by turning a little off its line, and finds another way if it's boxed in for a moment.
const STEER = [0, 0.6, -0.6, 1.1, -1.1, 1.5, -1.5];
const BOXED_IN_SECONDS = 1.5;
function stepAlongPavement(actor: RoamingActor, ux: number, uy: number, step: number, options: RoamingUpdateOptions): void {
  for(const turn of STEER){
    const c = Math.cos(turn), s = Math.sin(turn);
    const vx = ux * c - uy * s, vy = ux * s + uy * c;
    const nx = actor.x + vx * step, ny = actor.y + vy * step;
    // LEGAL: Out on the crossing there's nothing to steer round but traffic, which stops for them.
    if(!actor.crossing && !options.canMove(nx, ny)) continue;
    actor.x = nx; actor.y = ny;
    actor.facing = Math.atan2(vy, vx);
    actor.boxedSince = undefined;
    return;
  }
  actor.boxedSince ??= options.playSeconds;
  if(options.playSeconds - actor.boxedSince > BOXED_IN_SECONDS){
    actor.boxedSince = undefined;
    const free = options.rescue?.(actor.x, actor.y);
    if(free){ actor.x = free.x; actor.y = free.y; }
    planWalk(actor);
  }
}

// LEGAL: Red lights and the car in front set how fast each car may go this frame.
function updateCarPace(actors: RoamingActor[], options: RoamingUpdateOptions): void {
  const cars = actors.filter(actor => actor.kind === 'car' && !actor.dormant);
  cars.forEach(function(car){
    const blocked = (options.blockers ?? []).reduce((pace, blocker) => Math.min(pace, blockerPace(car, blocker)), 1);
    const target = Math.min(signalPace(car, CITY_JUNCTIONS, options.playSeconds), followingPace(car, cars), blocked);
    const current = car.pace ?? 1;
    // LEGAL: Braking is quicker than pulling away.
    const rate = target < current ? 6 : 1.6;
    car.pace = current + (target - current) * Math.min(1, rate * options.dt);
    if(target === 0 && car.pace < 0.04) car.pace = 0;
  });
}

export function updateRoamingActors(actors: RoamingActor[], options: RoamingUpdateOptions): void {
  if(options.indoors) return;
  // LEGAL: Cars stop for anyone out on a crossing, as well as for you.
  const walkers = actors.filter(actor => actor.crossing).map(actor => ({ x:actor.x, y:actor.y, radius:6 }));
  updateCarPace(actors, walkers.length ? { ...options, blockers:[...(options.blockers ?? []), ...walkers] } : options);
  actors.forEach(function(actor){
    if(actor.group) actor.group.visible = !actor.dormant;
    if(actor.dormant) return;
    moveActorToward(actor, options);
    if(actor.group){
      actor.group.position.set(actor.x, 0, actor.y);
      actor.group.rotation.y = -actor.facing + Math.PI / 2;
    }
  });
}

export function actorDisplayName(actor: RoamingActor): string {
  if(actor.object?.kind === 'npc') return (actor.object.ref as MapNpc).name;
  if(actor.object?.kind === 'gangnpc') return (actor.object.ref as GangRecruit).name;
  return actor.id;
}
