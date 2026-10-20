import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mergeMeshesWithin } from './mergeScenery';

function palm(): THREE.Group {
  const trunk = new THREE.MeshStandardMaterial();
  const frond = new THREE.MeshStandardMaterial();
  const group = new THREE.Group();
  group.name = 'resort:palm';
  group.position.set(100, 0, 50);
  for(let i = 0; i < 5; i += 1){
    const segment = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 6, 7), trunk);
    segment.position.y = i * 6;
    segment.castShadow = true;
    group.add(segment);
  }
  const crown = new THREE.Group();
  crown.position.y = 30;
  for(let i = 0; i < 4; i += 1){
    const blade = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 3), frond);
    blade.position.x = 4 + i * 5;
    crown.add(blade);
  }
  group.add(crown);
  group.add(new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), trunk));
  return group;
}

function worldBox(object: THREE.Object3D): THREE.Box3 {
  object.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(object);
}

describe('merging a scenery group into one mesh per material', function () {
  it('keeps quantized Blender geometry its real size (traffic cars were crushed to specks)', function () {
    // LEGAL: How a quantized export arrives: positions as normalised int16, scaled up by the node.
    const quantized = (half: number) => {
      const box = new THREE.BoxGeometry(2, 2, 2);
      const source = box.getAttribute('position');
      const ints = new Int16Array(source.count * 3);
      for(let i = 0; i < ints.length; i++) ints[i] = Math.round((source.array[i] as number) * 32767);
      box.setAttribute('position', new THREE.BufferAttribute(ints, 3, true));
      box.deleteAttribute('normal'); box.deleteAttribute('uv');
      const mesh = new THREE.Mesh(box, material);
      mesh.scale.setScalar(half);
      return mesh;
    };
    const material = new THREE.MeshStandardMaterial();
    const car = new THREE.Group();
    car.scale.setScalar(2);
    const body = quantized(16), roof = quantized(6);
    roof.position.y = 10;
    car.add(body, roof);
    const before = worldBox(car).getSize(new THREE.Vector3());
    expect(mergeMeshesWithin(THREE, car, mergeGeometries)).toBe(true);
    const after = worldBox(car).getSize(new THREE.Vector3());
    expect(after.x).toBeCloseTo(before.x, 0);
    expect(after.x).toBeGreaterThan(60);
  });

  it('turns many meshes into one per material without moving anything', function () {
    const group = palm();
    const before = worldBox(group);

    expect(mergeMeshesWithin(THREE, group, mergeGeometries)).toBe(true);

    expect(group.name).toBe('resort:palm');
    expect(group.children).toHaveLength(2);
    const after = worldBox(group);
    expect(after.min.distanceTo(before.min)).toBeLessThan(1e-6);
    expect(after.max.distanceTo(before.max)).toBeLessThan(1e-6);
  });

  it('keeps shadows on a merged mesh if any part cast them', function () {
    const group = palm();
    mergeMeshesWithin(THREE, group, mergeGeometries);

    expect(group.children.some(function(child){ return (child as THREE.Mesh).castShadow; })).toBe(true);
  });

  it('leaves a group alone when it holds something that is not a plain mesh', function () {
    const group = palm();
    group.add(new THREE.Sprite());
    const childCount = group.children.length;

    expect(mergeMeshesWithin(THREE, group, mergeGeometries)).toBe(false);
    expect(group.children).toHaveLength(childCount);
  });
});
