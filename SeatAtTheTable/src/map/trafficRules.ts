import type { Point } from '../config/types';
import { VEHICLE_SCALE } from './scale';

// LEGAL: The rules of the road for traffic: stop at a red light, and don't drive into the car in
// LEGAL: front. Each returns how much of its normal speed a car may use right now (0 to 1), so the
// LEGAL: route-following in map/roaming.ts stays as it is and only the pace changes.
export interface CarPose { id: string; x: number; y: number; facing: number }

// LEGAL: Each junction's lights run north-south green, all red, east-west green, all red.
export const SIGNAL_GREEN_SECONDS = 7;
export const SIGNAL_ALL_RED_SECONDS = 1.2;
const CYCLE = (SIGNAL_GREEN_SECONDS + SIGNAL_ALL_RED_SECONDS) * 2;

// LEGAL: Where a car's centre stops: its front bumper (half a sedan) just short of the junction box,
// LEGAL: which is half a 74-wide road.
const HALF_CAR = 32 * VEHICLE_SCALE / 2;
const HALF_WIDTH = 15 * VEHICLE_SCALE / 2;
const STOP_LINE = 37 + HALF_CAR + 3;
// LEGAL: How far before the line a car starts braking.
const BRAKING = 48;
// LEGAL: Centre to centre, bumper to bumper is two half-lengths; cars keep a little more than that.
const MIN_GAP = HALF_CAR * 2 + 6;
const FOLLOW = 46;

export type Axis = 'ns' | 'ew';

export function axisOf(facing: number): Axis {
  return Math.abs(Math.cos(facing)) >= Math.abs(Math.sin(facing)) ? 'ew' : 'ns';
}

// LEGAL: Junctions are out of step with each other, so the whole city doesn't stop at once.
function phaseOffset(junction: Point): number {
  return ((Math.abs(junction.x * 7 + junction.y * 13) % 97) / 97) * CYCLE;
}

export function signalGreen(axis: Axis, junction: Point, time: number): boolean {
  const t = (time + phaseOffset(junction)) % CYCLE;
  if(axis === 'ns') return t < SIGNAL_GREEN_SECONDS;
  const start = SIGNAL_GREEN_SECONDS + SIGNAL_ALL_RED_SECONDS;
  return t >= start && t < start + SIGNAL_GREEN_SECONDS;
}

// LEGAL: What a light shows: amber is the last stretch of green, so a car can still go on it.
export const SIGNAL_AMBER_SECONDS = 1.6;
export type SignalState = 'green' | 'amber' | 'red';

export function signalState(axis: Axis, junction: Point, time: number): SignalState {
  if(!signalGreen(axis, junction, time)) return 'red';
  return signalGreen(axis, junction, time + SIGNAL_AMBER_SECONDS) ? 'green' : 'amber';
}

function clamp01(value: number): number { return Math.max(0, Math.min(1, value)); }

// LEGAL: Brakes for a red light ahead. A car already past the line keeps going and clears the box.
export function signalPace(car: CarPose, junctions: readonly Point[], time: number): number {
  const hx = Math.cos(car.facing), hy = Math.sin(car.facing);
  const axis = axisOf(car.facing);
  let pace = 1;
  for(const junction of junctions){
    const dx = junction.x - car.x, dy = junction.y - car.y;
    const along = dx * hx + dy * hy;
    if(along < STOP_LINE || along > STOP_LINE + BRAKING) continue;
    if(Math.abs(dx * hy - dy * hx) > 40) continue;
    if(signalGreen(axis, junction, time)) continue;
    pace = Math.min(pace, clamp01((along - STOP_LINE - 2) / BRAKING));
  }
  return pace;
}

// LEGAL: Slows for the nearest car ahead in the same lane going the same way, and stops behind it.
// LEGAL: Something in the road that isn't another car going the same way: you, in your car or on foot.
// LEGAL: Traffic used to drive straight into you and through you, since only cars it was following
// LEGAL: slowed it down. It now brakes to a stop short of anything in its lane ahead, whichever way
// LEGAL: that thing is facing.
export interface RoadBlocker { x: number; y: number; radius: number }
export function blockerPace(car: CarPose, blocker: RoadBlocker): number {
  const hx = Math.cos(car.facing), hy = Math.sin(car.facing);
  const dx = blocker.x - car.x, dy = blocker.y - car.y;
  const along = dx * hx + dy * hy;
  const stopAt = HALF_CAR + blocker.radius + 6;
  if(along <= 0 || along > stopAt + FOLLOW * 1.5) return 1;
  if(Math.abs(dx * hy - dy * hx) > HALF_WIDTH + blocker.radius) return 1;
  return clamp01((along - stopAt) / (FOLLOW * 1.5));
}

export function followingPace(car: CarPose, others: readonly CarPose[]): number {
  const hx = Math.cos(car.facing), hy = Math.sin(car.facing);
  let pace = 1;
  for(const other of others){
    if(other.id === car.id) continue;
    const dx = other.x - car.x, dy = other.y - car.y;
    const along = dx * hx + dy * hy;
    if(along <= 0 || along > MIN_GAP + FOLLOW) continue;
    if(Math.abs(dx * hy - dy * hx) > 12) continue;
    if(Math.cos(other.facing - car.facing) < 0.5) continue;
    pace = Math.min(pace, clamp01((along - MIN_GAP) / FOLLOW));
  }
  return pace;
}
