import type { Point } from '../config/types';
import { bayInterior } from './archetypes';
import { actorRadius } from './movement';

// LEGAL: ---- Driving into your own garage ----
// LEGAL: Section 0b. Parking used to be a thing that happened TO the car: you got out
// LEGAL: anywhere, and a few minutes later it teleported home. Now the garage is a room with
// LEGAL: a mouth in one wall, and putting the car away is something you do — you line it up
// LEGAL: and drive it in.
// LEGAL:
// LEGAL: Pure geometry, no DOM and no three.js, so the trigger the game uses and the trigger
// LEGAL: the tests check are the same arithmetic. Every function takes the garage's RUNTIME
// LEGAL: position, because the lot allocator chooses where the garage ends up — a bay derived
// LEGAL: from the authored coordinates would sit in the wrong block entirely.

export interface Bay {
  x: number;
  y: number;
  hw: number;
  hd: number;
}

export function garageBay(garage: Point, w: number, d: number): Bay {
  return bayInterior(garage.x, garage.y, w, d);
}

// LEGAL: The trigger. True the moment the car's centre is past the mouth, rather than once it
// LEGAL: is neatly squared up — the walls already force you to line the car up to get this
// LEGAL: far, so demanding a tidy final position would only punish you for the last two feet.
export function isCarInBay(car: Point, bay: Bay): boolean {
  return Math.abs(car.x - bay.x) <= bay.hw && Math.abs(car.y - bay.y) <= bay.hd;
}

// LEGAL: Where the car ends up once you are in: drawn back off the mouth so it sits inside
// LEGAL: the building rather than half out on the apron, and no closer to the back wall than
// LEGAL: its own radius, so it is never parked inside the workbench.
export function bayParkSpot(bay: Bay): Point {
  const car = actorRadius(true);
  return { x: bay.x, y: bay.y - Math.max(0, bay.hd - car - 2) };
}

// LEGAL: Where Arjun stands after getting out — beside the car, not in it, and far enough off
// LEGAL: the centre line that the car does not appear to be parked on top of him. Kept inside
// LEGAL: the walls so stepping out never puts you through one.
export function bayStandSpot(bay: Bay): Point {
  const spot = bayParkSpot(bay);
  // LEGAL: Just clear of the car and within reach of it (interact reach is 46), so pressing E gets
  // LEGAL: you straight back in. Kept inside the walls for narrow bays.
  const offset = Math.min(actorRadius(true) + actorRadius(false) + 6, bay.hw - actorRadius(false) - 3);
  return { x: bay.x + offset, y: spot.y + 6 };
}

// LEGAL: The width a car must physically pass through to get in. Exposed so a test can fail
// LEGAL: loudly if the garage is ever resized to something a car cannot enter — the failure
// LEGAL: mode is invisible in the picture and infuriating in play: you drive at your own
// LEGAL: garage and bounce off it.
export function bayClearance(bay: Bay): number {
  return bay.hw * 2;
}

// LEGAL: The office annex on the garage's east side, and its door onto the street. The door is
// LEGAL: the garage's interaction point, so the bay itself is only ever about the car.
export const GARAGE_OFFICE = { w: 30, d: 34 };

export function garageOfficeCenter(garage: Point, w: number, d: number): Point {
  return { x: garage.x + w / 2 + GARAGE_OFFICE.w / 2, y: garage.y + d / 2 - GARAGE_OFFICE.d / 2 };
}

export function garageOfficeDoor(garage: Point, w: number, d: number): Point {
  const office = garageOfficeCenter(garage, w, d);
  return { x: office.x, y: office.y + GARAGE_OFFICE.d / 2 + 10 };
}

// LEGAL: Park on the frame the car crosses into the bay, not on every frame it's inside. Getting
// LEGAL: into a car that was parked in the bay starts inside it, and used to re-park you at once.
export function shouldParkInBay(wasInBay: boolean, isInBay: boolean): boolean {
  return isInBay && !wasInBay;
}
