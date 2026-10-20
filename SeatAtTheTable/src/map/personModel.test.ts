import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ARJUN_SKIN, animatePerson, bakePerson, buildPerson, createPersonParts, DEFAULT_PLAYER_LOOK, lookForStranger, normalizeLook, WARDROBE } from './personModel';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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

  it('keeps the leading foot on the ground and steps as far as the legs reach, so walkers do not skate', function () {
    const person = buildPerson(THREE, parts, DEFAULT_PLAYER_LOOK);
    let phase = 0, travelled = 0, steps = 0, last = Math.sign(Math.sin(phase));
    for(let i = 0; i < 240; i++){
      phase = animatePerson(person.rig, phase, 30, 1 / 60, 0);
      travelled += 30 / 60;
      const side = Math.sign(Math.sin(phase));
      if(side !== last && side !== 0){ steps++; last = side; }
      if(i > 60){
        // LEGAL: The lower sole of the two legs, from the hip pivot down a leg of 11.
        const sole = Math.min(...[person.rig.legLeft, person.rig.legRight].map(leg => leg.position.y - 11 * Math.cos(leg.rotation.x)));
        expect(Math.abs(sole)).toBeLessThan(0.8);
      }
    }
    const reach = 2 * 11 * Math.sin(0.6);
    expect(travelled / steps).toBeLessThan(reach * 1.4);
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

describe('bakePerson', function () {
  const parts = createPersonParts(THREE);
  const countMeshes = (o: THREE.Object3D) => { let n = 0; o.traverse(node => { if((node as THREE.Mesh).isMesh) n++; }); return n; };

  it('draws a person in a handful of meshes instead of one per part', function () {
    const plain = buildPerson(THREE, parts, DEFAULT_PLAYER_LOOK);
    const baked = buildPerson(THREE, parts, DEFAULT_PLAYER_LOOK);
    bakePerson(THREE, baked.root, mergeGeometries);
    expect(countMeshes(plain.root)).toBeGreaterThan(18);
    expect(countMeshes(baked.root)).toBeLessThanOrEqual(6);
  });

  it('keeps the colours, as vertex colours', function () {
    const baked = buildPerson(THREE, parts, { ...DEFAULT_PLAYER_LOOK, topColor: '#d4a017' });
    bakePerson(THREE, baked.root, mergeGeometries);
    let colors = 0;
    baked.root.traverse(node => { const mesh = node as THREE.Mesh; if(mesh.isMesh && mesh.geometry.getAttribute('color')) colors++; });
    expect(colors).toBeGreaterThan(0);
  });

  it('still animates: the limbs keep their own pivots', function () {
    const baked = buildPerson(THREE, parts, DEFAULT_PLAYER_LOOK);
    bakePerson(THREE, baked.root, mergeGeometries);
    let phase = 0;
    for(let i = 0; i < 12; i++) phase = animatePerson(baked.rig, phase, 30, 1 / 60, 0);
    expect(Math.abs(baked.rig.legLeft.rotation.x)).toBeGreaterThan(0.05);
  });
});

describe('Arjun', function () {
  it('always has his brown skin: it is part of who he is, so the wardrobe cannot change it', function () {
    expect(normalizeLook({ ...DEFAULT_PLAYER_LOOK, skin: '#f1d0b0' } as unknown as Record<string, unknown>).skin).toBe(ARJUN_SKIN);
  });
});

describe('wardrobe range', function () {
  const parts = createPersonParts(THREE);

  it('offers a real range of hair, hats, shoes and accessories', function () {
    expect(WARDROBE.hair.length).toBeGreaterThanOrEqual(9);
    expect(WARDROBE.hat.length).toBeGreaterThanOrEqual(6);
    expect(WARDROBE.extra.length).toBeGreaterThanOrEqual(6);
    expect(WARDROBE.shoes.length).toBeGreaterThanOrEqual(3);
  });

  it('builds every option without breaking the figure', function () {
    (Object.keys(WARDROBE) as Array<keyof typeof WARDROBE>).forEach(function(slot){
      (WARDROBE[slot] as readonly string[]).forEach(function(option){
        const { root } = buildPerson(THREE, parts, { ...DEFAULT_PLAYER_LOOK, [slot]: option });
        const box = new THREE.Box3().setFromObject(root);
        expect(box.max.y, `${slot}=${option}`).toBeLessThan(48);
        expect(box.min.y, `${slot}=${option}`).toBeGreaterThan(-1);
      });
    });
  });

  it('puts a watch on the wrist, where it swings with the arm', function () {
    const person = buildPerson(THREE, parts, { ...DEFAULT_PLAYER_LOOK, extra: 'watch' });
    expect(person.rig.armLeft.getObjectByName('extra:watch')).toBeDefined();
  });
});
