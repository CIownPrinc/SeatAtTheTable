import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { specialPlace, specialPlaceFootprint, specialPlaceSolids } from './placeSpecials';
import { isPointInWater } from './geometry';
import { onAnyRoad } from './queries';
import { UNITS_PER_METRE } from './scale';
import { OUTSKIRT_PLACE_LOTS, QUAYSIDE_PLACE_LOTS } from './world';
import { actorRadius, collidesSolid } from './movement';

const PLACES = ['airfieldKettle', 'docksDockmaster', 'railyard', 'driveInBoundary', 'lodgeRidgewood', 'motelSunset'];
// LEGAL: Yards and open ground you walk or drive into, so their middle must stay clear.
const OPEN = ['airfieldKettle', 'docksDockmaster', 'railyard', 'driveInBoundary'];

describe('one-of-a-kind places', function () {
  it.each(PLACES)('builds %s as itself, from real parts', function (id) {
    let meshes = 0;
    specialPlace(id)!.build(THREE).traverse(node => { if((node as THREE.Mesh).isMesh) meshes++; });
    expect(meshes).toBeGreaterThan(8);
  });

  it.each(OPEN)('leaves the middle of %s open to walk into', function (id) {
    expect(collidesSolid(500, 500, specialPlaceSolids(id, 500, 500), actorRadius(false))).toBe(false);
  });
});

// LEGAL: Placement, proportion, and the inside matching the outside (TODO 110). The lodge and motel were
// LEGAL: half size and you walked through them; the docks were 26 m from the water.
describe('one-of-a-kind places at real size, where they belong', function () {
  const LOTS = { ...OUTSKIRT_PLACE_LOTS, ...QUAYSIDE_PLACE_LOTS };
  const GROWN = ['docksDockmaster', 'driveInBoundary', 'lodgeRidgewood', 'motelSunset'];

  it.each(GROWN)('stands %s on dry land, off every road', function (id) {
    const lot = LOTS[id];
    const f = specialPlaceFootprint(id, lot.x, lot.y)!;
    for(let x = f.x - f.hw + 6; x <= f.x + f.hw - 6; x += 10){
      for(let y = f.y - f.hd + 6; y <= f.y + f.hd - 6; y += 10){
        expect(isPointInWater({ x, y }, 0), `${id} water at ${Math.round(x)},${Math.round(y)}`).toBe(false);
        expect(onAnyRoad({ x, y }, 0), `${id} road at ${Math.round(x)},${Math.round(y)}`).toBe(false);
      }
    }
  });

  it('puts the docks on the water, the quay along the canal', function () {
    const lot = QUAYSIDE_PLACE_LOTS.docksDockmaster;
    const f = specialPlaceFootprint('docksDockmaster', lot.x, lot.y)!;
    expect(isPointInWater({ x:f.x - f.hw - 20, y:f.y }, 0)).toBe(true);
  });

  it.each(['lodgeRidgewood', 'motelSunset'])('makes %s solid, so you walk round it, and lets you use it from its door', function (id) {
    const lot = LOTS[id];
    const solids = specialPlaceSolids(id, lot.x, lot.y);
    expect(collidesSolid(lot.x, lot.y, solids, actorRadius(false))).toBe(false);
    const building = solids[0];
    expect(collidesSolid(building.x, building.y, solids, actorRadius(false))).toBe(true);
    expect(building.hw * 2 / UNITS_PER_METRE, id).toBeGreaterThan(10);
  });
});
