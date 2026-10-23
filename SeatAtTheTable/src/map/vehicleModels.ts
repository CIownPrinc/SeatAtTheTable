import type * as ThreeNamespace from 'three';
import { BIKE_SCALE, VEHICLE_HEIGHT, VEHICLE_SCALE } from './scale';

// LEGAL: The Blender vehicle catalog (art/blender/vehicles.py). Every car used to be the same
// LEGAL: procedural body in a different paint; each now has a model that looks like what it is.
export const VEHICLE_CLASSES = ['sedan', 'beater', 'wagon', 'muscle', 'suv', 'armored', 'pickup', 'van', 'ev', 'ev-luxury', 'ev-van', 'supercar', 'roadster', 'police', 'taxi', 'truck', 'tractor', 'garbage', 'helicopter', 'chopper', 'sportbike'] as const;
export type VehicleClass = typeof VEHICLE_CLASSES[number];

const CLASS_FOR_CAR: Record<string, VehicleClass> = {
  sedan:'beater', impala:'muscle', escalade:'suv', electron3:'ev', bentley:'ev-luxury', exotic:'supercar',
  beater_wagon:'wagon', panel_van:'van', mudster_pickup:'pickup', mudster_armored:'armored',
  electron_van:'ev-van', diamond_roadster:'roadster', chopper:'chopper', outlaw_racer:'sportbike',
  'cheat-dumptruck':'garbage', 'cheat-helicopter':'helicopter', 'race-loaner':'muscle',
};

export function vehicleClassForCar(id: string): VehicleClass | null {
  return CLASS_FOR_CAR[id] ?? null;
}

// LEGAL: Traffic is keyed by its route id: cruisers are police, cabs are taxis, and so on.
export function vehicleClassForTraffic(id: string): VehicleClass {
  if(id.includes('cruiser')) return 'police';
  const named = VEHICLE_CLASSES.find(cls => id.split('-').includes(cls));
  if(named) return named;
  if(id.includes('cab')) return 'taxi';
  if(id.includes('tractor')) return 'tractor';
  if(id.includes('freight') || id.includes('truck')) return 'truck';
  if(id.includes('van')) return 'van';
  return 'sedan';
}

// LEGAL: Footprint (catalog units, before VEHICLE_SCALE) for each traffic class, so a box
// LEGAL: truck isn't squashed to a sedan's length. Drawing and collision both read this.
const TRAFFIC_FOOTPRINT: Record<VehicleClass, { length: number; width: number }> = {
  sedan:{ length:32, width:15 }, beater:{ length:28, width:14 }, wagon:{ length:32, width:15 }, muscle:{ length:34, width:16 },
  suv:{ length:33, width:17 }, armored:{ length:35, width:19 }, pickup:{ length:35, width:17 }, van:{ length:34, width:17 },
  ev:{ length:31, width:15 }, 'ev-luxury':{ length:34, width:16 }, 'ev-van':{ length:33, width:17 }, supercar:{ length:31, width:16 },
  roadster:{ length:29, width:15 }, police:{ length:34, width:17 }, taxi:{ length:32, width:15 }, truck:{ length:50, width:18 },
  tractor:{ length:22, width:13 }, garbage:{ length:40, width:15 }, helicopter:{ length:40, width:40 },
  chopper:{ length:18, width:8 }, sportbike:{ length:19, width:8 },
};

export function trafficFootprint(id: string): { length: number; width: number } {
  return TRAFFIC_FOOTPRINT[vehicleClassForTraffic(id)];
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
      if(cls === 'chopper' || cls === 'sportbike') wrapper.scale.setScalar(BIKE_SCALE);
      else wrapper.scale.set(VEHICLE_SCALE, VEHICLE_HEIGHT, VEHICLE_SCALE);
      wrapper.add(turned);
      return wrapper;
    },
  };
}

// LEGAL: Turns every wheel on a vehicle by the distance it just travelled. Wheels are separate parts
// LEGAL: named 'wheel-...' (art/blender/vehicles.py), each pivoting on its own axle, which is the
// LEGAL: part's local Y once exported; its radius is measured once from how tall it stands.
export function spinWheels(THREE: typeof ThreeNamespace, vehicle: ThreeNamespace.Object3D, distance: number): void {
  if(!distance) return;
  vehicle.traverse(function(node){
    if(!node.name.startsWith('wheel-')) return;
    let radius = node.userData.wheelRadius as number | undefined;
    if(!radius){
      vehicle.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(node);
      radius = Math.max(0.5, (box.max.y - box.min.y) / 2);
      node.userData.wheelRadius = radius;
    }
    node.rotateY(-distance / radius);
  });
}
