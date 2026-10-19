import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { fitToBox, tintedClone } from './assets';

function sourceModel(): THREE.Group {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2)));
  return group;
}

describe('map asset loading', function () {
  it('keeps the texture when tinting a model, so windows and doors survive the paint', function () {
    const texture = new THREE.Texture();
    const source = new THREE.Group();
    source.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({ map: texture })));
    const tinted = tintedClone(THREE, source, '#884422');
    const material = (tinted.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;

    expect(material.map).toBe(texture);
    expect(material.color.getHexString()).not.toBe('ffffff');
  });

  it('tints a copy of the material, never the shared original', function () {
    const original = new THREE.MeshStandardMaterial();
    const source = new THREE.Group();
    source.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), original));
    tintedClone(THREE, source, '#884422');

    expect(original.color.getHexString()).toBe('ffffff');
  });

  // LEGAL: Callers add awnings, cornices, markers and signs to the returned group in WORLD
  // LEGAL: units, and overwrite position with position.set(x, h/2, y). A fitted model that
  // LEGAL: carries its own scale or offset therefore multiplies every added detail and loses
  // LEGAL: its centring — which is how a food cart's marker ended up 2000 units in the sky.
  // LEGAL: The returned group must behave exactly like the procedural fallback.
  it('returns a fitted model at unit scale and origin so callers can add detail in world units', function () {
    const fitted = fitToBox(THREE, sourceModel(), 30, 42, 22);

    expect(fitted).not.toBeNull();
    expect(fitted!.scale.toArray()).toEqual([1, 1, 1]);
    expect(fitted!.position.toArray()).toEqual([0, 0, 0]);
  });

  it('still fits the model to the requested footprint, centred on the group origin', function () {
    const fitted = fitToBox(THREE, sourceModel(), 30, 42, 22)!;
    const size = new THREE.Box3().setFromObject(fitted).getSize(new THREE.Vector3());
    const center = new THREE.Box3().setFromObject(fitted).getCenter(new THREE.Vector3());

    expect(size.x).toBeCloseTo(30);
    expect(size.y).toBeCloseTo(42);
    expect(size.z).toBeCloseTo(22);
    expect(center.length()).toBeCloseTo(0);
  });

  it('rejects a degenerate model rather than dividing by zero', function () {
    expect(fitToBox(THREE, new THREE.Group(), 30, 42, 22)).toBeNull();
  });
});
