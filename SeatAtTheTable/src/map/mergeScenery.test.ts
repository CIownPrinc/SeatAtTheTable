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
