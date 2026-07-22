import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { addInstancedMesh, createMapSceneMaterials, createSceneBuildTimer } from './scenePerformance';

describe('map scene performance helpers', function () {
  it('reuses materials by stable key', function () {
    const materials = createMapSceneMaterials(THREE);

    const roadA = materials.standard('road', { color:'#333333', roughness:0.9 });
    const roadB = materials.standard('road', { color:'#ffffff', roughness:0.1 });
    const sidewalk = materials.standard('sidewalk', { color:'#777777', roughness:0.9 });

    expect(roadA).toBe(roadB);
    expect(roadA).not.toBe(sidewalk);

    materials.dispose();
  });

  it('adds repeated scene props as one instanced mesh', function () {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color:'#ffffff' });
    const mesh = addInstancedMesh(
      THREE,
      group,
      new THREE.BoxGeometry(2, 2, 2),
      material,
      [
        { x:1, y:2, z:3 },
        { x:4, y:5, z:6, rotationY:Math.PI / 2 },
      ],
      { cast:true, receive:true },
    );

    expect(group.children).toHaveLength(1);
    expect(mesh.count).toBe(2);
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);

    material.dispose();
    mesh.geometry.dispose();
  });

  it('records named scene build timings without changing return values', function () {
    let time = 100;
    const timer = createSceneBuildTimer(function(): number {
      time += 12;
      return time;
    });

    const result = timer.measure('terrain', function(): string {
      return 'built';
    });

    expect(result).toBe('built');
    expect(timer.entries()).toEqual([{ name:'terrain', ms:12 }]);
    expect(timer.totalMs()).toBe(12);
  });
});
