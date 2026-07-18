import type * as ThreeNamespace from 'three';

export type MapAssetKey =
  | 'houseA'
  | 'houseB'
  | 'towerA'
  | 'towerC'
  | 'commercialAwning'
  | 'commercialWide';

export interface MapAssetLibrary {
  createFittedModel(key: MapAssetKey, width: number, height: number, depth: number): ThreeNamespace.Group | null;
}

const ASSET_BASE = '/assets/map/kenney-modular-buildings/';

const ASSET_PATHS: Record<MapAssetKey, string> = {
  houseA: `${ASSET_BASE}building-sample-house-a.glb`,
  houseB: `${ASSET_BASE}building-sample-house-b.glb`,
  towerA: `${ASSET_BASE}building-sample-tower-a.glb`,
  towerC: `${ASSET_BASE}building-sample-tower-c.glb`,
  commercialAwning: `${ASSET_BASE}building-window-awnings.glb`,
  commercialWide: `${ASSET_BASE}building-window-wide.glb`,
};

function cloneScene(THREE: typeof ThreeNamespace, scene: ThreeNamespace.Group): ThreeNamespace.Group {
  const clone = scene.clone(true);

  clone.traverse(function(child){
    const mesh = child as ThreeNamespace.Mesh;
    if(!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  return clone;
}

function fitToBox(THREE: typeof ThreeNamespace, group: ThreeNamespace.Group, width: number, height: number, depth: number): ThreeNamespace.Group | null {
  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  if(size.x <= 0 || size.y <= 0 || size.z <= 0) return null;

  const scale = new THREE.Vector3(width / size.x, height / size.y, depth / size.z);
  group.scale.copy(scale);
  group.position.set(-center.x * scale.x, -center.y * scale.y, -center.z * scale.z);
  return group;
}

export async function loadMapAssetLibrary(THREE: typeof ThreeNamespace): Promise<MapAssetLibrary> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  const entries = await Promise.all(Object.entries(ASSET_PATHS).map(async function(entry){
    const [key, path] = entry as [MapAssetKey, string];
    try {
      const gltf = await loader.loadAsync(path);
      return [key, gltf.scene] as const;
    } catch {
      return [key, null] as const;
    }
  }));
  const scenes = new Map<MapAssetKey, ThreeNamespace.Group>();
  entries.forEach(function(entry){
    const [key, scene] = entry;
    if(scene) scenes.set(key, scene);
  });

  return {
    createFittedModel(key: MapAssetKey, width: number, height: number, depth: number): ThreeNamespace.Group | null {
      const scene = scenes.get(key);
      if(!scene) return null;
      return fitToBox(THREE, cloneScene(THREE, scene), width, height, depth);
    },
  };
}
