import type * as ThreeNamespace from 'three';

export interface SceneInstance {
  x: number;
  y: number;
  z: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
}

export class MapSceneMaterialCache {
  private readonly standardMaterials = new Map<string, ThreeNamespace.MeshStandardMaterial>();
  private readonly basicMaterials = new Map<string, ThreeNamespace.MeshBasicMaterial>();
  private readonly lineMaterials = new Map<string, ThreeNamespace.LineBasicMaterial>();

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

  line(key: string, params: ThreeNamespace.LineBasicMaterialParameters): ThreeNamespace.LineBasicMaterial {
    const existing = this.lineMaterials.get(key);
    if(existing) return existing;
    const material = new this.THREE.LineBasicMaterial(params);
    this.lineMaterials.set(key, material);
    return material;
  }

  dispose(): void {
    this.standardMaterials.forEach(material => material.dispose());
    this.basicMaterials.forEach(material => material.dispose());
    this.lineMaterials.forEach(material => material.dispose());
    this.standardMaterials.clear();
    this.basicMaterials.clear();
    this.lineMaterials.clear();
  }
}

export function createMapSceneMaterials(THREE: typeof ThreeNamespace): MapSceneMaterialCache {
  return new MapSceneMaterialCache(THREE);
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
