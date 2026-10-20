import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { specialPlace, specialPlaceSolids } from './placeSpecials';
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
