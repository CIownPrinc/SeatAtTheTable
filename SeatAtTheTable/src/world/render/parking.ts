import type * as ThreeNamespace from 'three';
import type { MapSceneMaterialCache } from '../../map/scenePerformance';
import { BAY_DEPTH, BAY_WIDTH, parkedCarId, parkingSignSpot, parkingSolid, parkingToWorld, type ParkingLot } from '../data/parkingLots';

// LEGAL: Draws the car parks (world/data/parkingLots): the asphalt, the bay lines, the pay-and-display
// LEGAL: sign and the parked cars, one group per district so the caller can merge each by material.
export function buildParkingLots(
  THREE: typeof ThreeNamespace,
  parking: readonly ParkingLot[],
  materials: MapSceneMaterialCache,
  makeCar: (id: string, colour: string) => ThreeNamespace.Object3D,
): ThreeNamespace.Group[] {
  const asphalt = materials.standard('parking:asphalt', { color:'#3b4049', roughness:0.95, polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1 });
  const paint = materials.standard('parking:paint', { color:'#e4e1d4', roughness:0.7, polygonOffset:true, polygonOffsetFactor:-5, polygonOffsetUnits:-5 });
  const post = materials.standard('parking:post', { color:'#8d939c', roughness:0.5, metalness:0.6 });
  const board = materials.standard('parking:board', { color:'#1f5fbf', roughness:0.5, emissive:'#0c2a5a', emissiveIntensity:0.25 });
  const letter = materials.standard('parking:letter', { color:'#f4f4f4', roughness:0.5 });
  const groups = new Map<string, ThreeNamespace.Group>();
  parking.forEach(function(lot){
    let group = groups.get(lot.district);
    if(!group){ group = new THREE.Group(); group.name = `parking:${lot.district}`; groups.set(lot.district, group); }
    const solid = parkingSolid(lot);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(solid.hw * 2, solid.hd * 2), asphalt);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(solid.x, 0.05, solid.y);
    ground.receiveShadow = true;
    group.add(ground);
    // LEGAL: A line either side of every bay, from the back of the car park to the aisle.
    const lengthwiseY = lot.out.y !== 0;
    const count = lot.bays.length;
    for(let i = 0; i <= count; i++){
      const at = parkingToWorld(lot, (i - count / 2) * BAY_WIDTH, -lot.d / 2 + 4 + BAY_DEPTH / 2);
      const line = new THREE.Mesh(new THREE.PlaneGeometry(lengthwiseY ? 1.6 : BAY_DEPTH, lengthwiseY ? BAY_DEPTH : 1.6), paint);
      line.rotation.x = -Math.PI / 2;
      line.position.set(at.x, 0.07, at.y);
      group.add(line);
    }
    const sign = parkingSignSpot(lot);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 26, 6), post);
    pole.position.set(sign.x, 13, sign.y);
    const face = new THREE.Mesh(new THREE.BoxGeometry(11, 11, 1), board);
    face.position.set(sign.x, 29, sign.y);
    face.rotation.y = lot.rot;
    // LEGAL: A white P on the board, made of three bars so it needs no texture.
    const outward = { x:lot.out.x * 0.7, y:lot.out.y * 0.7 };
    const across = { x:-lot.out.y, y:lot.out.x };
    const bar = (w: number, h: number, u: number, v: number) => {
      const piece = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), letter);
      piece.position.set(sign.x + outward.x + across.x * u, 29 + v, sign.y + outward.y + across.y * u);
      piece.rotation.y = lot.rot;
      group!.add(piece);
    };
    bar(1.6, 8, 2, 0); bar(4, 1.4, 0.6, 3.3); bar(4, 1.4, 0.6, 0.2); bar(1.4, 3.4, -1.6, 1.75);
    group.add(pole, face);
    lot.bays.forEach(function(bay){
      if(!bay.car) return;
      const car = makeCar(parkedCarId(bay.car), bay.car.colour);
      car.position.set(bay.x, 0, bay.y);
      car.rotation.y = Math.PI / 2 - bay.facing;
      group!.add(car);
    });
  });
  return [...groups.values()];
}
