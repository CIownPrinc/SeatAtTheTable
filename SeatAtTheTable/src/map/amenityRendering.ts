import type { MapAmenity } from '../config/types';
import type * as ThreeNamespace from 'three';

export interface AmenityRenderHelpers {
  box: (w: number, h: number, d: number, color: number | string) => ThreeNamespace.Mesh;
  addSign: (parent: ThreeNamespace.Object3D, text: string, w: number, h: number, y: number, color: string) => void;
  buildDetailedBuilding: (w: number, h: number, d: number, color: number | string, zoneType: string, variant: number) => ThreeNamespace.Group;
  variantForId: (id: string) => number;
}

function buildBasketballCourt(THREE: typeof ThreeNamespace, amenity: MapAmenity, helpers: AmenityRenderHelpers): ThreeNamespace.Group {
  const g = new THREE.Group();
  const court = new THREE.Mesh(new THREE.PlaneGeometry(112,70), new THREE.MeshStandardMaterial({color:'#8b4b28', roughness:0.95}));
  court.rotation.x=-Math.PI/2; court.position.y=0.12; court.receiveShadow=true; g.add(court);
  const lineMat = new THREE.MeshBasicMaterial({color:'#f0efe8'});
  [0,-32,32].forEach(function(z){
    const line = new THREE.Mesh(new THREE.PlaneGeometry(104,2), lineMat);
    line.rotation.x=-Math.PI/2; line.position.set(0,0.18,z); g.add(line);
  });
  [0,-52,52].forEach(function(x){
    const line = new THREE.Mesh(new THREE.PlaneGeometry(2,66), lineMat);
    line.rotation.x=-Math.PI/2; line.position.set(x,0.18,0); g.add(line);
  });
  [-43,43].forEach(function(x){
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,22,6), new THREE.MeshStandardMaterial({color:'#202329'}));
    pole.position.set(x,11,0); pole.castShadow=true; g.add(pole);
    const backboard = new THREE.Mesh(new THREE.BoxGeometry(2,12,20), new THREE.MeshStandardMaterial({color:'#e6e2d5', roughness:0.6}));
    backboard.position.set(x,23,0); backboard.castShadow=true; g.add(backboard);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(5,0.6,8,18), new THREE.MeshStandardMaterial({color:'#d47a2a', roughness:0.45}));
    rim.rotation.y=Math.PI/2; rim.position.set(x > 0 ? x-4 : x+4,18,0); g.add(rim);
  });
  helpers.addSign(g, amenity.name, 42, 8, 18, '#ffe6a0');
  return g;
}

function buildParkGameSpot(THREE: typeof ThreeNamespace, amenity: MapAmenity, helpers: AmenityRenderHelpers): ThreeNamespace.Group {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(54,34), new THREE.MeshStandardMaterial({color:'#2f3f31', roughness:1}));
  pad.rotation.x=-Math.PI/2; pad.position.y=0.13; pad.receiveShadow=true; g.add(pad);
  [-10,10].forEach(function(x){
    const table = helpers.box(12,3,12,'#484c55'); table.position.set(x,5,0); g.add(table);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(14,14), new THREE.MeshBasicMaterial({color:'#d7d0b8'}));
    top.rotation.x=-Math.PI/2; top.position.set(x,6.7,0); g.add(top);
    [-9,9].forEach(function(z){ const bench = helpers.box(15,3,4,'#5a3f2a'); bench.position.set(x,3,z); g.add(bench); });
  });
  helpers.addSign(g, amenity.name, 38, 7, 13, '#cde8c4');
  return g;
}

export function buildAmenityModel(THREE: typeof ThreeNamespace, amenity: MapAmenity, helpers: AmenityRenderHelpers): ThreeNamespace.Group {
  if(amenity.kind === 'basketball') return buildBasketballCourt(THREE, amenity, helpers);
  if(amenity.kind === 'parkgame') return buildParkGameSpot(THREE, amenity, helpers);
  const color = amenity.kind === 'petstore' ? '#4f795c' : '#6d5142';
  const mesh = helpers.buildDetailedBuilding(42,20,36,color,'shop', helpers.variantForId(amenity.id));
  if(amenity.kind === 'petstore'){
    const paw = new THREE.Mesh(new THREE.SphereGeometry(4,10,8), new THREE.MeshStandardMaterial({color:'#f0efe8', roughness:0.7}));
    paw.position.set(0,13,20); mesh.add(paw);
  }
  helpers.addSign(mesh, amenity.name, 34, 8, 18, amenity.kind === 'petstore' ? '#d0f0d8' : '#ffd8a0');
  return mesh;
}
