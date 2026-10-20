import type * as ThreeNamespace from 'three';
import type { PartModel, PartPaint } from '../world/assets/parts';
import type { PlaceModelName } from '../world/assets/places';
import type { MapSceneMaterialCache } from './scenePerformance';

// LEGAL: The Blender places once they've loaded (world/assets/places). Empty until then, and in unit
// LEGAL: tests, so every builder that asks keeps its own shapes as the fallback.
let models: ReadonlyMap<PlaceModelName, PartModel> = new Map();
export function usePlaceModels(loaded: ReadonlyMap<PlaceModelName, PartModel>): void { models = loaded; }
export function placeModel(name: PlaceModelName): PartModel | null { return models.get(name) ?? null; }

type MaterialSource = Pick<MapSceneMaterialCache, 'standard'>;

// LEGAL: A material cache for builders that don't share the scene's (the mall, the special places).
export function localMaterials(THREE: typeof ThreeNamespace): MaterialSource {
  const cache = new Map<string, ThreeNamespace.MeshStandardMaterial>();
  return {
    standard(key, params){
      let material = cache.get(key);
      if(!material){ material = new THREE.MeshStandardMaterial(params); cache.set(key, material); }
      return material;
    },
  };
}

// LEGAL: Adds one mesh per part of `model` to `group`. Each part keeps the paint it was given in
// LEGAL: Blender unless `recolour` names it; recolouring a lit part (a screen, a menu) changes its
// LEGAL: glow. Materials are keyed `<prefix>:<part>`, plus the colour when it's recoloured, and parts
// LEGAL: named 'roof...' end ':roof' so settling snow finds them.
export function addPlaceModel(
  THREE: typeof ThreeNamespace,
  group: ThreeNamespace.Object3D,
  model: PartModel,
  materials: MaterialSource,
  prefix: string,
  recolour: Readonly<Record<string, string>> = {},
): ThreeNamespace.Mesh[] {
  const meshes: ThreeNamespace.Mesh[] = [];
  model.forEach(function(part, name){
    const colour = recolour[name];
    const key = `${prefix}:${name}${colour ? ':' + colour : ''}${name.startsWith('roof') ? ':roof' : ''}`;
    const mesh = new THREE.Mesh(part.geometry, materials.standard(key, paintParams(part.paint, colour)));
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
    meshes.push(mesh);
  });
  return meshes;
}

function paintParams(paint: PartPaint, colour?: string): ThreeNamespace.MeshStandardMaterialParameters {
  if(paint.emissive !== undefined) return { color:paint.color, roughness:paint.roughness, metalness:paint.metalness, emissive:colour ?? paint.emissive, emissiveIntensity:paint.emissiveIntensity ?? 1 };
  return { color:colour ?? paint.color, roughness:paint.roughness, metalness:paint.metalness };
}
