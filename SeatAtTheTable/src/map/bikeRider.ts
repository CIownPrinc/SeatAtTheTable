import type * as ThreeNamespace from 'three';
import { PERSON_HIP_Y, buildPerson, type PersonLook, type createPersonParts } from './personModel';
import { BIKE_SCALE, PERSON_SCALE } from './scale';

// LEGAL: Arjun on a bike: the same figure the wardrobe dresses, sat on the seat with his legs
// LEGAL: forward to the pegs and his hands on the bars. A bike has no cabin, so you see who's riding.
// LEGAL: Seats are in the bike model's own units (art/blender/vehicles.py), drawn at BIKE_SCALE; `x` is along the bike, + forward.
export const BIKE_SEATS = {
  // LEGAL: Sat back and upright on a chopper, arms up to the ape-hangers.
  chopper:{ x:-2.4, top:6.3, lean:0.05, arms:-2.0, legs:-1.5 },
  // LEGAL: Tucked forward over the tank on a streetfighter, arms down to the clip-ons.
  sportbike:{ x:-2.0, top:6.8, lean:0.55, arms:-1.05, legs:-1.2 },
} as const;
export type BikeClass = keyof typeof BIKE_SEATS;

export function seatedRider(THREE: typeof ThreeNamespace, parts: ReturnType<typeof createPersonParts>, look: PersonLook, bike: BikeClass): ThreeNamespace.Group {
  const seat = BIKE_SEATS[bike];
  const person = buildPerson(THREE, parts, look);
  const { rig } = person;
  rig.legLeft.rotation.x = seat.legs;
  rig.legRight.rotation.x = seat.legs;
  rig.armLeft.rotation.x = seat.arms;
  rig.armRight.rotation.x = seat.arms;
  rig.upper.rotation.x = seat.lean;
  person.root.scale.setScalar(PERSON_SCALE);
  const rider = new THREE.Group();
  rider.name = 'bike:rider';
  rider.add(person.root);
  rider.position.set(0, seat.top * BIKE_SCALE - PERSON_HIP_Y * PERSON_SCALE, seat.x * BIKE_SCALE);
  rider.traverse(node => { node.castShadow = true; });
  return rider;
}
