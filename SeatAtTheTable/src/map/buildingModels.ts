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
  // LEGAL: Many buildings of one model in one go: one InstancedMesh per part, each building its own
  // LEGAL: footprint, height, turn and paint colour. A street of fifty costs a handful of draw calls.
  instanced(model: BuildingModel, buildings: readonly InstancedBuilding[]): ThreeNamespace.Group;
}

// LEGAL: A building standing on the ground at (x, y), `rot` radians about the vertical, front +Z.
export interface InstancedBuilding { x: number; y: number; w: number; h: number; d: number; rot: number; color: string }

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
  // LEGAL: A white copy of each model's paint, so the per-building instance colour comes through true.
  const whitePaints = new Map<BuildingModel, ThreeNamespace.Material>();
  return {
    instanced(name, buildings){
      const model = models.get(name)!;
      const group = new THREE.Group();
      group.name = `buildings:${name}`;
      model.scene.updateMatrixWorld(true);
      const toModel = new THREE.Matrix4().copy(model.scene.matrixWorld).invert();
      const centre = new THREE.Matrix4().makeTranslation(-model.center.x, -model.center.y, -model.center.z);
      const turn = new THREE.Matrix4().makeRotationY(Math.PI);
      const placements = buildings.map(function(b){
        const place = new THREE.Matrix4().makeTranslation(b.x, b.h / 2, b.y)
          .multiply(new THREE.Matrix4().makeRotationY(b.rot))
          .multiply(new THREE.Matrix4().makeScale(b.w / model.size.x, b.h / model.size.y, b.d / model.size.z))
          .multiply(turn).multiply(centre);
        return place;
      });
      model.scene.traverse(function(node){
        const mesh = node as ThreeNamespace.Mesh;
        if(!mesh.isMesh) return;
        const local = new THREE.Matrix4().multiplyMatrices(toModel, mesh.matrixWorld);
        let material = mesh.material as ThreeNamespace.MeshStandardMaterial;
        const painted = material.name === 'paint';
        if(painted){
          let white = whitePaints.get(name);
          if(!white){ white = material.clone(); (white as ThreeNamespace.MeshStandardMaterial).color = new THREE.Color('#ffffff'); whitePaints.set(name, white); }
          material = white as ThreeNamespace.MeshStandardMaterial;
        }
        const instances = new THREE.InstancedMesh(mesh.geometry, material, buildings.length);
        instances.castShadow = true; instances.receiveShadow = true;
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        placements.forEach(function(place, i){
          instances.setMatrixAt(i, matrix.multiplyMatrices(place, local));
          if(painted) instances.setColorAt(i, color.set(buildings[i].color));
        });
        instances.instanceMatrix.needsUpdate = true;
        if(instances.instanceColor) instances.instanceColor.needsUpdate = true;
        instances.computeBoundingSphere();
        group.add(instances);
      });
      return group;
    },
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
