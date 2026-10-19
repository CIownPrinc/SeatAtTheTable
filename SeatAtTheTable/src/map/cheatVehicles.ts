import type { Car } from '../config/types';

// LEGAL: Vehicles only cheat codes hand out. Kept out of the shop catalog (config/assets) so they
// LEGAL: never appear for sale. Their models are in the Blender catalog (map/vehicleModels.ts).
export const CHEAT_VEHICLES: Car[] = [
  { id:'cheat-dumptruck', name:'Garbage Truck', icon:'', cost:0, speedMult:0.85, heistBonus:0, respectPerSec:0, color:'#2f6b3a', len:40, wid:15 },
  { id:'cheat-helicopter', name:'Helicopter', icon:'', cost:0, speedMult:1.7, heistBonus:0, respectPerSec:0, color:'#2c3a4a', len:40, wid:40 },
  // LEGAL: Lent for a street race when you don't own a car; handed back at the finish.
  { id:'race-loaner', name:'Borrowed Chevalier', icon:'', cost:0, speedMult:1.25, heistBonus:0, respectPerSec:0, color:'#3e6b8a', len:29, wid:15 },
];

export function isFlyingVehicle(id: string | null): boolean {
  return id === 'cheat-helicopter';
}

// LEGAL: The rocketman cheat's jetpack: twin tanks on the player's back (-Z, since people face
// LEGAL: +Z) with flames named so the game can flicker them.
export function buildJetpack(THREE: typeof import('three')): import('three').Group {
  const pack = new THREE.Group();
  pack.name = 'jetpack';
  const metal = new THREE.MeshStandardMaterial({ color:'#9aa0a8', roughness:0.3, metalness:0.85 });
  const flame = new THREE.MeshStandardMaterial({ color:'#ffb347', emissive:'#ff7a1a', emissiveIntensity:2.4, transparent:true, opacity:0.85 });
  pack.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(9, 9, 2.6), metal), { castShadow:true }));
  [-1, 1].forEach(function(side){
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 12, 14), metal);
    tank.position.set(side * 3.2, -1, -2.4); tank.castShadow = true; pack.add(tank);
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.4, 12), metal);
    nozzle.position.set(side * 3.2, -8.2, -2.4); pack.add(nozzle);
    const fire = new THREE.Mesh(new THREE.ConeGeometry(1.6, 7, 12), flame);
    fire.name = 'jetpack-flame';
    fire.rotation.x = Math.PI; fire.position.set(side * 3.2, -12.5, -2.4); pack.add(fire);
  });
  pack.position.set(0, 21, -5.4);
  return pack;
}
