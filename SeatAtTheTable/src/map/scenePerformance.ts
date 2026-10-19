import type * as ThreeNamespace from 'three';

export interface SceneInstance {
  x: number;
  y: number;
  z: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
}

export interface SceneTimingEntry {
  name: string;
  ms: number;
}

export interface SceneBuildTimer {
  measure: <T>(name: string, action: () => T) => T;
  entries: () => SceneTimingEntry[];
  totalMs: () => number;
}

export class MapSceneMaterialCache {
  private readonly standardMaterials = new Map<string, ThreeNamespace.MeshStandardMaterial>();
  private readonly basicMaterials = new Map<string, ThreeNamespace.MeshBasicMaterial>();

  constructor(private readonly THREE: typeof ThreeNamespace) {}

  standard(key: string, params: ThreeNamespace.MeshStandardMaterialParameters): ThreeNamespace.MeshStandardMaterial {
    const existing = this.standardMaterials.get(key);
    if(existing) return existing;
    const material = new this.THREE.MeshStandardMaterial(params);
    this.standardMaterials.set(key, material);
    return material;
  }

  basic(key: string, params: ThreeNamespace.MeshBasicMaterialParameters): ThreeNamespace.MeshBasicMaterial {
    const existing = this.basicMaterials.get(key);
    if(existing) return existing;
    const material = new this.THREE.MeshBasicMaterial(params);
    this.basicMaterials.set(key, material);
    return material;
  }

  // LEGAL: Every lit material by its key, so a world-wide change (settling snow) can find the
  // LEGAL: ground, trees and roads without each builder having to register them.
  entries(): Array<[string, ThreeNamespace.MeshStandardMaterial]> {
    return [...this.standardMaterials.entries()];
  }

  dispose(): void {
    this.standardMaterials.forEach(material => material.dispose());
    this.basicMaterials.forEach(material => material.dispose());
    this.standardMaterials.clear();
    this.basicMaterials.clear();
  }
}

export function createMapSceneMaterials(THREE: typeof ThreeNamespace): MapSceneMaterialCache {
  return new MapSceneMaterialCache(THREE);
}

export function createSceneBuildTimer(now: () => number = function(): number { return performance.now(); }): SceneBuildTimer {
  const measurements: SceneTimingEntry[] = [];
  return {
    measure<T>(name: string, action: () => T): T {
      const start = now();
      try{
        return action();
      } finally {
        measurements.push({ name, ms:now() - start });
      }
    },
    entries(): SceneTimingEntry[] {
      return measurements.slice();
    },
    totalMs(): number {
      return measurements.reduce(function(total, entry): number {
        return total + entry.ms;
      }, 0);
    },
  };
}

export function addInstancedMesh(
  THREE: typeof ThreeNamespace,
  worldGroup: ThreeNamespace.Group,
  geometry: ThreeNamespace.BufferGeometry,
  material: ThreeNamespace.Material,
  instances: SceneInstance[],
  shadow: { cast?: boolean; receive?: boolean } = {},
): ThreeNamespace.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, instances.length);
  const dummy = new THREE.Object3D();
  instances.forEach(function(instance, index){
    dummy.position.set(instance.x, instance.y, instance.z);
    dummy.rotation.set(instance.rotationX ?? 0, instance.rotationY ?? 0, instance.rotationZ ?? 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = shadow.cast ?? false;
  mesh.receiveShadow = shadow.receive ?? false;
  worldGroup.add(mesh);
  return mesh;
}
