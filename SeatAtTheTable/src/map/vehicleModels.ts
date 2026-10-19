import type * as ThreeNamespace from 'three';

// LEGAL: The Blender vehicle catalog (art/blender/vehicles.py). Every car used to be the same
// LEGAL: procedural body in a different paint; each now has a model that looks like what it is.
export const VEHICLE_CLASSES = ['sedan', 'beater', 'wagon', 'muscle', 'suv', 'armored', 'pickup', 'van', 'ev', 'ev-luxury', 'ev-van', 'supercar', 'roadster', 'police', 'taxi', 'truck', 'tractor', 'garbage', 'helicopter'] as const;
export type VehicleClass = typeof VEHICLE_CLASSES[number];

const CLASS_FOR_CAR: Record<string, VehicleClass> = {
  sedan:'beater', impala:'muscle', escalade:'suv', electron3:'ev', bentley:'ev-luxury', exotic:'supercar',
  beater_wagon:'wagon', panel_van:'van', mudster_pickup:'pickup', mudster_armored:'armored',
  electron_van:'ev-van', diamond_roadster:'roadster',
  'cheat-dumptruck':'garbage', 'cheat-helicopter':'helicopter',
};

export function vehicleClassForCar(id: string): VehicleClass | null {
  return CLASS_FOR_CAR[id] ?? null;
}

// LEGAL: Traffic is keyed by its route id: cruisers are police, cabs are taxis, and so on.
export function vehicleClassForTraffic(id: string): VehicleClass {
  if(id.includes('cruiser')) return 'police';
  if(id.includes('cab')) return 'taxi';
  if(id.includes('tractor')) return 'tractor';
  if(id.includes('freight') || id.includes('truck')) return 'truck';
  if(id.includes('van')) return 'van';
  return 'sedan';
}

// LEGAL: Length and width come from the car catalog (they drive collision too), height follows
// LEGAL: the footprint so a compact isn't squashed flat or a van stretched up.
export function fitScale(size: { x: number; y: number; z: number }, length: number, width: number): { x: number; y: number; z: number } {
  const x = length / size.x;
  const z = width / size.z;
  return { x, y: (x + z) / 2, z };
}

export interface VehicleLibrary {
  create(cls: VehicleClass, color: string, length: number, width: number): ThreeNamespace.Group;
}

const VEHICLE_BASE = '/assets/world/vehicles/';
// LEGAL: The same city scale buildCarModel applies, so new models match the old ones' size.
const CITY_SCALE = 1.6;

export async function loadVehicleLibrary(THREE: typeof ThreeNamespace): Promise<VehicleLibrary | null> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  const models = new Map<VehicleClass, { scene: ThreeNamespace.Group; size: ThreeNamespace.Vector3; minY: number }>();
  try {
    await Promise.all(VEHICLE_CLASSES.map(async function(cls){
      const gltf = await loader.loadAsync(`${VEHICLE_BASE}${cls}.glb`);
      const box = new THREE.Box3().setFromObject(gltf.scene);
      models.set(cls, { scene:gltf.scene, size:box.getSize(new THREE.Vector3()), minY:box.min.y });
    }));
  } catch {
    return null;
  }
  // LEGAL: One paint material per colour, shared by every car of that colour.
  const paints = new Map<string, ThreeNamespace.Material>();
  function paintFor(template: ThreeNamespace.MeshStandardMaterial, color: string): ThreeNamespace.Material {
    let paint = paints.get(color);
    if(!paint){
      const copy = template.clone();
      copy.color = new THREE.Color(color);
      paints.set(color, copy);
      paint = copy;
    }
    return paint;
  }
  return {
    create(cls, color, length, width){
      const model = models.get(cls)!;
      const clone = model.scene.clone(true);
      clone.traverse(function(node){
        const mesh = node as ThreeNamespace.Mesh;
        if(!mesh.isMesh) return;
        mesh.castShadow = true;
        const material = mesh.material as ThreeNamespace.MeshStandardMaterial;
        if(material.name === 'paint') mesh.material = paintFor(material, color);
        // LEGAL: The game finds headlight lenses by this name to light them at night; each car gets
        // LEGAL: its own copy so one car's lights don't switch on every car of that model.
        if(mesh.name.startsWith('headlight') || mesh.name.startsWith('lightbar-front')){
          mesh.name = 'lamp:head';
          mesh.material = material.clone();
        }
      });
      const scale = fitScale(model.size, length, width);
      clone.scale.set(scale.x, scale.y, scale.z);
      clone.position.y = -model.minY * scale.y;
      // LEGAL: Modelled facing +X; the game's shared heading convention is +Z forward
      // LEGAL: (playerGroup.rotation.y = -facing + PI/2), and cars are drawn at city scale.
      const turned = new THREE.Group();
      turned.rotation.y = -Math.PI / 2;
      turned.add(clone);
      const wrapper = new THREE.Group();
      wrapper.name = `vehicle:${cls}`;
      wrapper.scale.setScalar(CITY_SCALE);
      wrapper.add(turned);
      return wrapper;
    },
  };
}
