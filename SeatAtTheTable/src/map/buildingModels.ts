import type * as ThreeNamespace from 'three';
import type { PlaceArchetype } from './archetypes';

// LEGAL: The Blender building catalog (art/blender/buildings.py): one model per archetype, so a
// LEGAL: tenement has a stoop and fire escapes, a civic hall a colonnade and dome, a works a sawtooth
// LEGAL: roof and chimney. They replace the generic box-with-windows for named places.
export const BUILDING_MODELS = ['tenement', 'storefront', 'showroom', 'office', 'tower', 'civic', 'works'] as const;
export type BuildingModel = typeof BUILDING_MODELS[number];

export function buildingModelFor(archetype: PlaceArchetype): BuildingModel | null {
  return (BUILDING_MODELS as readonly string[]).includes(archetype) ? archetype as BuildingModel : null;
}

export interface BuildingLibrary {
  // LEGAL: Fitted to the footprint and centred on the origin, exactly like buildDetailedBuilding, so
  // LEGAL: the caller's placement (y = h / 2) and its added signage line up unchanged.
  create(model: BuildingModel, color: string, w: number, h: number, d: number): ThreeNamespace.Group;
}

const BUILDING_BASE = '/assets/world/buildings/';

export async function loadBuildingLibrary(THREE: typeof ThreeNamespace): Promise<BuildingLibrary | null> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  const models = new Map<BuildingModel, { scene: ThreeNamespace.Group; size: ThreeNamespace.Vector3; center: ThreeNamespace.Vector3 }>();
  try {
    await Promise.all(BUILDING_MODELS.map(async function(name){
      const gltf = await loader.loadAsync(`${BUILDING_BASE}${name}.glb`);
      const box = new THREE.Box3().setFromObject(gltf.scene);
      models.set(name, { scene:gltf.scene, size:box.getSize(new THREE.Vector3()), center:box.getCenter(new THREE.Vector3()) });
    }));
  } catch {
    return null;
  }
  const paints = new Map<string, ThreeNamespace.Material>();
  return {
    create(name, color, w, h, d){
      const model = models.get(name)!;
      const clone = model.scene.clone(true);
      clone.traverse(function(node){
        const mesh = node as ThreeNamespace.Mesh;
        if(!mesh.isMesh) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const material = mesh.material as ThreeNamespace.MeshStandardMaterial;
        if(material.name !== 'paint') return;
        let paint = paints.get(color);
        if(!paint){ paint = material.clone(); (paint as ThreeNamespace.MeshStandardMaterial).color = new THREE.Color(color); paints.set(color, paint); }
        mesh.material = paint;
      });
      // LEGAL: Modelled front-to-+Y in Blender, which exports as -Z; places face +Z, so half a turn.
      const turned = new THREE.Group();
      turned.rotation.y = Math.PI;
      clone.position.set(-model.center.x, -model.center.y, -model.center.z);
      turned.add(clone);
      turned.scale.set(w / model.size.x, h / model.size.y, d / model.size.z);
      const wrapper = new THREE.Group();
      wrapper.name = `building:${name}`;
      wrapper.add(turned);
      return wrapper;
    },
  };
}
