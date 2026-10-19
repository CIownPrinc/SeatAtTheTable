import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createCharacterLibrary } from './characters';
import { DEFAULT_PLAYER_LOOK } from './personModel';

function library(look = DEFAULT_PLAYER_LOOK) {
  return createCharacterLibrary(THREE, () => look);
}

describe('createCharacterLibrary', function () {
  it('dresses Arjun from the wardrobe, not at random', function () {
    const person = library({ ...DEFAULT_PLAYER_LOOK, hat: 'fedora' }).create('arjun', '#ffffff');
    expect(person.getObjectByName('hat:fedora')).toBeDefined();
  });

  it('keeps an actor colour as the coat, so gold still marks crew', function () {
    const person = library().create('crew-1', '#d4a017');
    const top = person.getObjectByName('top') as THREE.Mesh;
    expect((top.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('d4a017');
  });
});

describe('character animator', function () {
  it('moves a walker\'s legs and lets a standing one rest', function () {
    const lib = library();
    const world = new THREE.Group();
    const walker = lib.create('ped-1', '#334455');
    const stander = lib.create('ped-2', '#334455');
    world.add(walker, stander);
    for(let i = 0; i < 30; i++){ walker.position.x += 0.6; lib.animator.tick(1 / 60, i / 60); }
    // LEGAL: A person's root holds the upper body first, then the left and right hip pivots.
    const legOf = (person: THREE.Object3D) => Math.abs(person.children[1].rotation.x);
    expect(legOf(walker)).toBeGreaterThan(legOf(stander));
  });

  it('keeps a person that has been built but not yet placed in the world', function () {
    const lib = library();
    lib.create('ped-1', '#334455');
    lib.animator.tick(1 / 60, 0);
    expect(lib.animator.count()).toBe(1);
  });

  it('forgets people that were removed from the world', function () {
    const lib = library();
    const world = new THREE.Group();
    const person = lib.create('ped-1', '#334455');
    world.add(person);
    lib.animator.tick(1 / 60, 0);
    world.remove(person);
    lib.animator.tick(1 / 60, 0);
    expect(lib.animator.count()).toBe(0);
  });
});
