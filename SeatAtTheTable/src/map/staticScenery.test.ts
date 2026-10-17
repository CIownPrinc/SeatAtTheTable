import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { freezeStaticScenery } from './staticScenery';

function named(name: string, x: number): THREE.Object3D {
  const object = new THREE.Group();
  object.name = name;
  object.position.x = x;
  object.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)));
  return object;
}

describe('freezing scenery that never moves', function () {
  it('bakes static scenery matrices once and stops recomputing them', function () {
    const world = new THREE.Group();
    const palm = named('resort:palm-trunk', 40);
    world.add(palm);

    freezeStaticScenery(world);

    expect(palm.matrixAutoUpdate).toBe(false);
    expect(palm.matrixWorldAutoUpdate).toBe(false);
    expect(palm.children[0]!.matrixAutoUpdate).toBe(false);
    expect(palm.children[0]!.matrixWorld.elements[12]).toBe(40);
  });

  it('leaves things that move alone', function () {
    const world = new THREE.Group();
    const pedestrian = named('actor:roaming', 0);
    const shop = named('place:venture', 0);
    world.add(pedestrian, shop);

    freezeStaticScenery(world);

    expect(pedestrian.matrixAutoUpdate).toBe(true);
    expect(shop.matrixAutoUpdate).toBe(true);
  });
});
