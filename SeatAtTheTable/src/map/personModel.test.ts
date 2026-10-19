import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { animatePerson, buildPerson, createPersonParts, DEFAULT_PLAYER_LOOK, lookForStranger, normalizeLook, WARDROBE } from './personModel';

function heightOf(object: THREE.Object3D): { min: number; max: number } {
  const box = new THREE.Box3().setFromObject(object);
  return { min: box.min.y, max: box.max.y };
}

describe('buildPerson', function () {
  const parts = createPersonParts(THREE);

  it('stands on the ground at about the old figure height', function () {
    const { root } = buildPerson(THREE, parts, { ...DEFAULT_PLAYER_LOOK, hat: 'none' });
    const { min, max } = heightOf(root);
    expect(min).toBeCloseTo(0, 0);
    expect(max).toBeGreaterThan(36);
    expect(max).toBeLessThan(41);
  });

  it('puts the hair on top of the head, not inside it', function () {
    const { root } = buildPerson(THREE, parts, { ...DEFAULT_PLAYER_LOOK, hair: 'short', hat: 'none' });
    const hair = root.getObjectByName('hair')!;
    const head = root.getObjectByName('head')!;
    root.updateMatrixWorld(true);
    expect(new THREE.Box3().setFromObject(hair).max.y).toBeGreaterThan(new THREE.Box3().setFromObject(head).max.y);
  });

  it('has a face: two eyes looking forward', function () {
    const { root } = buildPerson(THREE, parts, DEFAULT_PLAYER_LOOK);
    root.updateMatrixWorld(true);
    const eyes = ['eye-left', 'eye-right'].map(name => root.getObjectByName(name)!.getWorldPosition(new THREE.Vector3()));
    eyes.forEach(eye => expect(eye.z).toBeGreaterThan(4));
  });

  it('wears what the look asks for', function () {
    const { root } = buildPerson(THREE, parts, { ...DEFAULT_PLAYER_LOOK, hat: 'fedora', extra: 'glasses' });
    expect(root.getObjectByName('hat:fedora')).toBeDefined();
    expect(root.getObjectByName('extra:glasses')).toBeDefined();
  });

  it('shares geometry and materials between people so a crowd stays cheap', function () {
    const a = buildPerson(THREE, parts, lookForStranger('a', '#334455')).root;
    const b = buildPerson(THREE, parts, lookForStranger('a', '#334455')).root;
    const meshA = a.getObjectByName('head') as THREE.Mesh;
    const meshB = b.getObjectByName('head') as THREE.Mesh;
    expect(meshA.geometry).toBe(meshB.geometry);
    expect(meshA.material).toBe(meshB.material);
  });
});

describe('animatePerson', function () {
  const parts = createPersonParts(THREE);

  it('swings the legs in opposite directions while walking', function () {
    const person = buildPerson(THREE, parts, DEFAULT_PLAYER_LOOK);
    let phase = 0;
    for(let i = 0; i < 12; i++) phase = animatePerson(person.rig, phase, 30, 1 / 60, 0);
    expect(Math.sign(person.rig.legLeft.rotation.x)).toBe(-Math.sign(person.rig.legRight.rotation.x));
    expect(Math.abs(person.rig.legLeft.rotation.x)).toBeGreaterThan(0.05);
  });

  it('swings each arm against its leg, like people do', function () {
    const person = buildPerson(THREE, parts, DEFAULT_PLAYER_LOOK);
    let phase = 0;
    for(let i = 0; i < 12; i++) phase = animatePerson(person.rig, phase, 30, 1 / 60, 0);
    expect(Math.sign(person.rig.armLeft.rotation.x)).toBe(-Math.sign(person.rig.legLeft.rotation.x));
  });

  it('leans into a run but stands upright at a walk', function () {
    const walker = buildPerson(THREE, parts, DEFAULT_PLAYER_LOOK);
    const runner = buildPerson(THREE, parts, DEFAULT_PLAYER_LOOK);
    let a = 0, b = 0;
    for(let i = 0; i < 60; i++){ a = animatePerson(walker.rig, a, 30, 1 / 60, 0); b = animatePerson(runner.rig, b, 150, 1 / 60, 0); }
    expect(runner.rig.upper.rotation.x).toBeGreaterThan(walker.rig.upper.rotation.x + 0.05);
  });

  it('settles back to standing when stopped', function () {
    const person = buildPerson(THREE, parts, DEFAULT_PLAYER_LOOK);
    let phase = 0;
    for(let i = 0; i < 30; i++) phase = animatePerson(person.rig, phase, 150, 1 / 60, 0);
    for(let i = 0; i < 120; i++) phase = animatePerson(person.rig, phase, 0, 1 / 60, i / 60);
    expect(Math.abs(person.rig.legLeft.rotation.x)).toBeLessThan(0.02);
  });
});

describe('looks', function () {
  it('dresses the same stranger the same way every visit', function () {
    expect(lookForStranger('ped-4', '#335577')).toEqual(lookForStranger('ped-4', '#335577'));
  });

  it('gives strangers a variety of styles', function () {
    const styles = new Set(Array.from({ length: 30 }, (_, i) => { const l = lookForStranger(`p${i}`, '#445566'); return `${l.top}/${l.hair}/${l.hat}`; }));
    expect(styles.size).toBeGreaterThan(8);
  });

  it('repairs a saved look with unknown or missing pieces instead of crashing', function () {
    const look = normalizeLook({ top: 'cape', hat: 'fedora', skin: 42 } as unknown as Record<string, unknown>);
    expect(WARDROBE.top).toContain(look.top);
    expect(look.hat).toBe('fedora');
    expect(look.skin).toBe(DEFAULT_PLAYER_LOOK.skin);
  });
});
