import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { ModelPart } from '../world/assets/parts';
import { addPlaceModel, localMaterials } from './placeModels';
import { snowSurfaceFor } from './snow';

const part = (color: number): ModelPart => ({ geometry:new THREE.BoxGeometry(1, 1, 1), paint:{ color, roughness:0.8, metalness:0 } });

describe('addPlaceModel', () => {
  it('keeps Blender paint, recolours named parts, and marks roofs for snow', () => {
    const keys: string[] = [];
    const cache = localMaterials(THREE);
    const materials = { standard(key: string, params: THREE.MeshStandardMaterialParameters){ keys.push(key); return cache.standard(key, params); } };
    const group = new THREE.Group();
    const meshes = addPlaceModel(THREE, group, new Map([['siding', part(0xffffff)], ['roof', part(0x111111)], ['trim', part(0xeeeeee)]]), materials, 'suburb:house', { siding:'#a8c0c8' });
    expect(group.children).toHaveLength(3);
    expect(keys).toEqual(['suburb:house:siding:#a8c0c8', 'suburb:house:roof:roof', 'suburb:house:trim']);
    expect((meshes[0].material as THREE.MeshStandardMaterial).color.getHexString()).toBe('a8c0c8');
    expect((meshes[2].material as THREE.MeshStandardMaterial).color.getHex()).toBe(0xeeeeee);
    expect(snowSurfaceFor(keys[1])).toBe('ground');
    expect(snowSurfaceFor(keys[2])).toBeNull();
  });
});
