import type * as ThreeNamespace from 'three';
import { EAGER_MAP_ASSET_KEYS, MAP_ASSET_PATHS, type MapAssetKey } from './assetManifest';

export type { MapAssetKey } from './assetManifest';

export interface MapAssetLibrary {
  createFittedModel(key: MapAssetKey, width: number, height: number, depth: number): ThreeNamespace.Group | null;
}

const FALLBACK_TEXTURE_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAI0lEQVR4AYTIoQ0AAAwCwYb9R+wQNdVgCYZP3hz+lj4m6iAAAAD//+qR2V4AAAAGSURBVAMAfjEPCeZvlw0AAAAASUVORK5CYII=';

export function resolveMapAssetUrl(url: string): string {
  return url.endsWith('Textures/colormap.png') ? FALLBACK_TEXTURE_DATA_URL : url;
}

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
  const manager = new THREE.LoadingManager();
  manager.setURLModifier(resolveMapAssetUrl);
  const loader = new GLTFLoader(manager);
  const entries = await Promise.all(EAGER_MAP_ASSET_KEYS.map(async function(key){
    const path = MAP_ASSET_PATHS[key];
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
