import type * as ThreeNamespace from 'three';
import { EAGER_MAP_ASSET_KEYS, MAP_ASSET_PATHS, type MapAssetKey } from './assetManifest';

export type { MapAssetKey } from './assetManifest';

export interface MapAssetLibrary {
  createFittedModel(key: MapAssetKey, width: number, height: number, depth: number, tint?: string): ThreeNamespace.Group | null;
}

// LEGAL: Each Kenney pack ships Textures/colormap.png beside its GLBs: one palette atlas
// LEGAL: that every model samples for its walls, glass, doors and trim. The tint multiplies
// LEGAL: that atlas, so a building takes its neighbourhood colour and keeps its windows.
// LEGAL: Materials are cloned per instance first: a GLB scene shares its materials between
// LEGAL: every clone, so tinting in place would repaint every building in the city.
export function tintedClone(THREE: typeof ThreeNamespace, scene: ThreeNamespace.Group, tint?: string): ThreeNamespace.Group {
  const clone = scene.clone(true);

  clone.traverse(function(child){
    const mesh = child as ThreeNamespace.Mesh;
    if(!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if(!tint) return;
    const source = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const copies = source.map(function(material){
      const copy = (material as ThreeNamespace.MeshStandardMaterial).clone();
      copy.color = new THREE.Color(tint);
      return copy;
    });
    mesh.material = copies.length === 1 ? copies[0] : copies;
  });

  return clone;
}

// LEGAL: Returns a WRAPPER at unit scale and origin, with the fitted model inside it.
// LEGAL:
// LEGAL: The fit used to be applied to the returned group itself, which broke callers two
// LEGAL: ways. First, every caller adds detail in world units — awnings, cornices, fire
// LEGAL: escapes, category markers, signs — and a group scaled to (30, 41.6, 22) multiplied
// LEGAL: all of it, flinging a food cart's marker two thousand units into the sky. That is
// LEGAL: the "random floating blocks and lines everywhere" report. Second, the recentring
// LEGAL: offset was written to group.position, which callers then overwrote with
// LEGAL: position.set(x, h/2, y), so asset-backed buildings sat off-centre as well.
// LEGAL:
// LEGAL: With the transform on an inner child, the wrapper behaves exactly like the
// LEGAL: procedural fallback: unit scale, origin at the building's centre, world units.
export function fitToBox(THREE: typeof ThreeNamespace, group: ThreeNamespace.Group, width: number, height: number, depth: number): ThreeNamespace.Group | null {
  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  if(size.x <= 0 || size.y <= 0 || size.z <= 0) return null;

  const scale = new THREE.Vector3(width / size.x, height / size.y, depth / size.z);
  group.scale.copy(scale);
  group.position.set(-center.x * scale.x, -center.y * scale.y, -center.z * scale.z);

  const wrapper = new THREE.Group();
  wrapper.add(group);
  return wrapper;
}

export async function loadMapAssetLibrary(THREE: typeof ThreeNamespace): Promise<MapAssetLibrary> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const manager = new THREE.LoadingManager();
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
    createFittedModel(key: MapAssetKey, width: number, height: number, depth: number, tint?: string): ThreeNamespace.Group | null {
      const scene = scenes.get(key);
      if(!scene) return null;
      return fitToBox(THREE, tintedClone(THREE, scene, tint), width, height, depth);
    },
  };
}
