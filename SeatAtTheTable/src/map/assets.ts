import type * as ThreeNamespace from 'three';

export type MapAssetKey =
  | 'houseA'
  | 'houseB'
  | 'towerA'
  | 'towerC'
  | 'commercialAwning'
  | 'commercialWide'
  | 'carSedan'
  | 'carSport'
  | 'carTaxi'
  | 'carPolice'
  | 'carSuv'
  | 'carLuxurySuv'
  | 'carDelivery'
  | 'carVan'
  | 'characterA'
  | 'characterC'
  | 'characterE'
  | 'characterH'
  | 'characterK'
  | 'characterN';

export interface MapAssetLibrary {
  createFittedModel(key: MapAssetKey, width: number, height: number, depth: number): ThreeNamespace.Group | null;
}

const BUILDING_ASSET_BASE = '/assets/map/kenney-modular-buildings/';
const CAR_ASSET_BASE = '/assets/map/kenney-car-kit/';
const CHARACTER_ASSET_BASE = '/assets/map/kenney-blocky-characters/';

const ASSET_PATHS: Record<MapAssetKey, string> = {
  houseA: `${BUILDING_ASSET_BASE}building-sample-house-a.glb`,
  houseB: `${BUILDING_ASSET_BASE}building-sample-house-b.glb`,
  towerA: `${BUILDING_ASSET_BASE}building-sample-tower-a.glb`,
  towerC: `${BUILDING_ASSET_BASE}building-sample-tower-c.glb`,
  commercialAwning: `${BUILDING_ASSET_BASE}building-window-awnings.glb`,
  commercialWide: `${BUILDING_ASSET_BASE}building-window-wide.glb`,
  carSedan: `${CAR_ASSET_BASE}sedan.glb`,
  carSport: `${CAR_ASSET_BASE}sedan-sports.glb`,
  carTaxi: `${CAR_ASSET_BASE}taxi.glb`,
  carPolice: `${CAR_ASSET_BASE}police.glb`,
  carSuv: `${CAR_ASSET_BASE}suv.glb`,
  carLuxurySuv: `${CAR_ASSET_BASE}suv-luxury.glb`,
  carDelivery: `${CAR_ASSET_BASE}delivery.glb`,
  carVan: `${CAR_ASSET_BASE}van.glb`,
  characterA: `${CHARACTER_ASSET_BASE}character-a.glb`,
  characterC: `${CHARACTER_ASSET_BASE}character-c.glb`,
  characterE: `${CHARACTER_ASSET_BASE}character-e.glb`,
  characterH: `${CHARACTER_ASSET_BASE}character-h.glb`,
  characterK: `${CHARACTER_ASSET_BASE}character-k.glb`,
  characterN: `${CHARACTER_ASSET_BASE}character-n.glb`,
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
