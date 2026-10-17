import type { GangRecruit, Point } from '../config/types';
import type { MapObject } from './objects';
import type { MapNpc } from './markers';
import { seededRandom } from './filler';
import { widenAuthoredX } from './world';
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
}

export interface RoamingUpdateOptions {
  dt: number;
  playSeconds: number;
  indoors: boolean;
  canMove: (x: number, y: number) => boolean;
  // LEGAL: Nearest standable point to somewhere unstandable. Supplied by the caller so the
  // LEGAL: pedestrians use the same escape the player does rather than a second opinion.
  rescue?: (x: number, y: number) => Point;
}

function roamSeed(id: string): number {
  let seed = 17;
  for(let i=0;i<id.length;i++) seed = (seed * 31 + id.charCodeAt(i)) % 100000;
  return seed;
}

// LEGAL: Traffic routes are authored on the road grid, so their x values must be widened
// LEGAL: exactly like the roads in map/world.ts — otherwise the cars drive down what used
// LEGAL: to be a street and is now the middle of a block.
export const trafficCarRoutes: Array<{ id: string; color: string; speed: number; route: Point[] }> = ([
  { id:'devlin-cruiser', color:'#405560', speed:72, route:[{x:270,y:300},{x:270,y:900},{x:700,y:900},{x:1130,y:900},{x:1130,y:300},{x:700,y:300}] },
  { id:'westside-sedan', color:'#704040', speed:78, route:[{x:2270,y:300},{x:3130,y:300},{x:3130,y:900},{x:2700,y:900},{x:2270,y:900}] },
  { id:'hub-cab', color:'#d4a017', speed:84, route:[{x:4270,y:600},{x:5130,y:600},{x:5130,y:300},{x:4700,y:300},{x:4270,y:300}] },
]).map(entry => ({ ...entry, route: entry.route.map(p => ({ x: widenAuthoredX(p.x), y: p.y })) }));

export const outskirtVehicleRoutes: Array<{ id: string; color: string; speed: number; route: Point[] }> = ([
  { id:'kettle-tractor', color:'#5d753e', speed:34, route:[{x:-1000,y:680},{x:-620,y:680},{x:-620,y:1030},{x:-1000,y:1030}] },
  { id:'harrow-tractor', color:'#b37a32', speed:31, route:[{x:420,y:-1120},{x:1000,y:-1120},{x:1500,y:-1120},{x:1000,y:-1120}] },
  { id:'cicero-freight', color:'#59616c', speed:55, route:[{x:5800,y:500},{x:6200,y:500},{x:6200,y:1020},{x:5800,y:1020}] },
]).map(entry => ({ ...entry, route: entry.route.map(p => ({ x: widenAuthoredX(p.x), y: p.y })) }));

export function createRoamingActors(mapObjects: MapObject[]): RoamingActor[] {
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
  [...trafficCarRoutes, ...outskirtVehicleRoutes].forEach(function(route){
    const start = route.route[0];
    const target = route.route[1];
    actors.push({
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
    });
  });
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
  const dx = actor.targetX - actor.x;
  const dy = actor.targetY - actor.y;
  const dist = Math.hypot(dx, dy);
  if(dist < 5){
    if(actor.route && actor.route.length > 1){
      actor.routeIndex = (actor.routeIndex + 1) % actor.route.length;
      const next = actor.route[actor.routeIndex];
      actor.targetX = next.x;
      actor.targetY = next.y;
    } else {
      choosePedestrianTarget(actor, options.playSeconds, options.canMove);
    }
    return;
  }
  const step = Math.min(dist, actor.speed * options.dt);
  const nx = actor.x + dx / dist * step;
  const ny = actor.y + dy / dist * step;
  actor.facing = Math.atan2(dy, dx);
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

export function updateRoamingActors(actors: RoamingActor[], options: RoamingUpdateOptions): void {
  if(options.indoors) return;
  actors.forEach(function(actor){
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
