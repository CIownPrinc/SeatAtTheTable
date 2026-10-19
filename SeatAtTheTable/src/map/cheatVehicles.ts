import type * as ThreeNamespace from 'three';
import type { Car } from '../config/types';

// LEGAL: Vehicles only cheat codes hand out. Kept out of the shop catalog (config/assets) so they
// LEGAL: never appear for sale, and modelled facing +X like every other vehicle.
export const CHEAT_VEHICLES: Car[] = [
  { id:'cheat-dumptruck', name:'Dump Truck', icon:'', cost:0, speedMult:0.85, heistBonus:0, respectPerSec:0, color:'#e2b21c', len:56, wid:24 },
  { id:'cheat-helicopter', name:'Helicopter', icon:'', cost:0, speedMult:1.7, heistBonus:0, respectPerSec:0, color:'#2c3a4a', len:48, wid:14 },
];

export function isFlyingVehicle(id: string | null): boolean {
  return id === 'cheat-helicopter';
}

function part(THREE: typeof ThreeNamespace, geometry: ThreeNamespace.BufferGeometry, color: string, x: number, y: number, z: number, metal = 0.2): ThreeNamespace.Mesh {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness:0.55, metalness:metal }));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

export function buildDumpTruckModel(THREE: typeof ThreeNamespace): ThreeNamespace.Group {
  const g = new THREE.Group();
  const yellow = '#e2b21c', dark = '#23262c';
  g.add(part(THREE, new THREE.BoxGeometry(56, 5, 20), dark, 0, 7, 0));
  g.add(part(THREE, new THREE.BoxGeometry(15, 16, 21), yellow, 19, 17, 0));
  g.add(part(THREE, new THREE.BoxGeometry(6, 7, 19), '#1c2733', 25.4, 20, 0, 0.6));
  // LEGAL: The tipper bed: an open box tilted up slightly at the front.
  const bed = new THREE.Group();
  bed.add(part(THREE, new THREE.BoxGeometry(34, 2, 23), yellow, 0, 0, 0));
  [-1, 1].forEach(side => bed.add(part(THREE, new THREE.BoxGeometry(34, 11, 1.5), yellow, 0, 6, side * 11)));
  bed.add(part(THREE, new THREE.BoxGeometry(1.5, 11, 23), yellow, 17, 6, 0));
  bed.add(part(THREE, new THREE.BoxGeometry(1.5, 9, 23), yellow, -17, 5, 0));
  bed.position.set(-8, 11, 0); bed.rotation.z = 0.07;
  g.add(bed);
  [21, -6, -18].forEach(function(x){
    [-1, 1].forEach(function(side){
      const tyre = part(THREE, new THREE.CylinderGeometry(5.2, 5.2, 4, 18), '#121212', x, 5.2, side * 10.5);
      tyre.rotation.x = Math.PI / 2;
      g.add(tyre);
    });
  });
  return g;
}

// LEGAL: The rotor is named so the game can spin it every frame.
export function buildHelicopterModel(THREE: typeof ThreeNamespace): ThreeNamespace.Group {
  const g = new THREE.Group();
  const body = part(THREE, new THREE.SphereGeometry(9, 20, 14), '#2c3a4a', 4, 12, 0, 0.4);
  body.scale.set(1.5, 0.95, 0.9);
  g.add(body);
  const canopy = part(THREE, new THREE.SphereGeometry(6.4, 16, 12), '#9fc3d6', 11, 13.5, 0, 0.6);
  canopy.scale.set(1.1, 0.8, 1);
  g.add(canopy);
  const boom = part(THREE, new THREE.CylinderGeometry(1.4, 2.6, 26, 10), '#2c3a4a', -16, 14, 0);
  boom.rotation.z = Math.PI / 2;
  g.add(boom);
  g.add(part(THREE, new THREE.BoxGeometry(5, 8, 1), '#c43b2e', -28, 17, 0));
  [-1, 1].forEach(side => g.add(part(THREE, new THREE.BoxGeometry(26, 1.2, 1.2), '#1a1c20', 3, 2.5, side * 6.5, 0.7)));
  const rotor = new THREE.Group();
  rotor.name = 'rotor';
  rotor.add(part(THREE, new THREE.CylinderGeometry(1.2, 1.2, 3, 8), '#1a1c20', 0, 0, 0, 0.7));
  [0, Math.PI / 2].forEach(function(angle){
    const blade = part(THREE, new THREE.BoxGeometry(52, 0.5, 3), '#1a1c20', 0, 1.6, 0, 0.5);
    blade.rotation.y = angle;
    rotor.add(blade);
  });
  rotor.position.set(4, 22, 0);
  g.add(rotor);
  return g;
}
