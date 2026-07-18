import type { GangRecruit, Point } from '../config/types';
import type { MapObject } from './objects';
import type { MapNpc } from './markers';
import { seededRandom } from './filler';
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
}

function roamSeed(id: string): number {
  let seed = 17;
  for(let i=0;i<id.length;i++) seed = (seed * 31 + id.charCodeAt(i)) % 100000;
  return seed;
}

export const trafficCarRoutes: Array<{ id: string; color: string; speed: number; route: Point[] }> = [
  { id:'devlin-cruiser', color:'#405560', speed:72, route:[{x:270,y:300},{x:270,y:900},{x:700,y:900},{x:1130,y:900},{x:1130,y:300},{x:700,y:300}] },
  { id:'westside-sedan', color:'#704040', speed:78, route:[{x:2270,y:300},{x:3130,y:300},{x:3130,y:900},{x:2700,y:900},{x:2270,y:900}] },
  { id:'hub-cab', color:'#d4a017', speed:84, route:[{x:4270,y:600},{x:5130,y:600},{x:5130,y:300},{x:4700,y:300},{x:4270,y:300}] },
];

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
  trafficCarRoutes.forEach(function(route){
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

function choosePedestrianTarget(actor: RoamingActor, playSeconds: number, canMove: (x: number, y: number) => boolean): void {
  const rand = seededRandom(roamSeed(actor.id) + Math.floor(playSeconds / 5));
  for(let i=0;i<5;i++){
    const angle = rand() * Math.PI * 2;
    const distance = actor.radius * (0.25 + rand() * 0.75);
    const nx = actor.homeX + Math.cos(angle) * distance;
    const ny = actor.homeY + Math.sin(angle) * distance;
    if(canMove(nx, ny)){
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
  } else {
    actor.targetX = actor.homeX;
    actor.targetY = actor.homeY;
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
