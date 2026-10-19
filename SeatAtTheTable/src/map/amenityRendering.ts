import type { MapAmenity } from '../config/types';
import type { PlaceArchetype } from './archetypes';
import type * as ThreeNamespace from 'three';

export interface AmenityRenderHelpers {
  box: (w: number, h: number, d: number, color: number | string) => ThreeNamespace.Mesh;
  addSign: (parent: ThreeNamespace.Object3D, text: string, w: number, h: number, y: number, color: string) => void;
  buildDetailedBuilding: (w: number, h: number, d: number, color: number | string, zoneType: string, variant: number) => ThreeNamespace.Group;
  // LEGAL: The Blender model for an archetype, or null when the models didn't load.
  buildPlaceModel: (archetype: PlaceArchetype, color: string, w: number, h: number, d: number) => ThreeNamespace.Group | null;
  variantForId: (id: string) => number;
}

// LEGAL: One checkerboard texture, shared by every chess table.
let boardTexture: ThreeNamespace.CanvasTexture | null = null;
function chessBoardTexture(THREE: typeof ThreeNamespace): ThreeNamespace.CanvasTexture {
  if(boardTexture) return boardTexture;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#9a958a'; ctx.fillRect(0, 0, 128, 128);
  for(let r = 0; r < 8; r++) for(let c = 0; c < 8; c++){
    ctx.fillStyle = (r + c) % 2 ? '#2a2620' : '#e8e0c8';
    ctx.fillRect(8 + c * 14, 8 + r * 14, 14, 14);
  }
  boardTexture = new THREE.CanvasTexture(canvas);
  boardTexture.colorSpace = THREE.SRGBColorSpace;
  return boardTexture;
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

// LEGAL: The park chess tables: round stone tables on a paved pad, each with a board inlaid in its
// LEGAL: top and a stone stool either side.
function buildParkGameSpot(THREE: typeof ThreeNamespace, amenity: MapAmenity, helpers: AmenityRenderHelpers): ThreeNamespace.Group {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(58,36), new THREE.MeshStandardMaterial({color:'#8f8a7e', roughness:1}));
  pad.rotation.x=-Math.PI/2; pad.position.y=0.13; pad.receiveShadow=true; g.add(pad);
  const stone = new THREE.MeshStandardMaterial({color:'#a8a294', roughness:0.85});
  const board = new THREE.MeshStandardMaterial({ map:chessBoardTexture(THREE), roughness:0.7 });
  [-13,13].forEach(function(x){
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(2.2,3,6,10), stone); leg.position.set(x,3,0); g.add(leg);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(7,7,1.4,20), stone); top.position.set(x,6.7,0); top.castShadow=true; g.add(top);
    const inlay = new THREE.Mesh(new THREE.PlaneGeometry(8.4,8.4), board);
    inlay.rotation.x=-Math.PI/2; inlay.position.set(x,7.45,0); g.add(inlay);
    [-10,10].forEach(function(z){ const stool = new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.8,4.4,10), stone); stool.position.set(x,2.2,z); stool.castShadow=true; g.add(stool); });
  });
  helpers.addSign(g, amenity.name, 38, 7, 13, '#cde8c4');
  return g;
}

// LEGAL: The newsstand: a green kiosk with its front open onto the pavement, racks of papers and
// LEGAL: magazines in it, and a striped awning.
function buildNewsstand(THREE: typeof ThreeNamespace, amenity: MapAmenity, helpers: AmenityRenderHelpers): ThreeNamespace.Group {
  const g = new THREE.Group();
  const add = (w: number, h: number, d: number, color: string, x: number, y: number, z: number) => { const m = helpers.box(w, h, d, color); m.position.set(x, y, z); g.add(m); return m; };
  const w = 26, d = 16, h = 16;
  add(w, h, 2, '#2f5a3e', 0, h / 2, -d / 2 + 1);
  add(2, h, d, '#2f5a3e', -w / 2 + 1, h / 2, 0);
  add(2, h, d, '#2f5a3e', w / 2 - 1, h / 2, 0);
  add(w + 2, 2, d + 2, '#24452f', 0, h + 1, 0);
  add(w - 4, 6, 4, '#3a3d44', 0, 3, d / 2 - 3);
  const covers = ['#c0392b', '#f0efe8', '#2f6bb0', '#d4a017', '#8e44ad', '#2f8f6a'];
  for(let row = 0; row < 2; row++) for(let i = 0; i < 6; i++) add(3, 4, 0.6, covers[(i + row * 2) % 6], -9 + i * 3.6, 8 + row * 4.6, -d / 2 + 2.6);
  for(let i = 0; i < 7; i++) add(3, 3, 4, covers[i % 6], -9 + i * 3, 6.6, d / 2 - 3);
  for(let i = 0; i < 6; i++){
    const stripe = add(w / 6, 0.8, 8, i % 2 ? '#f0efe8' : '#2f5a3e', -w / 2 + w / 12 + i * w / 6, h - 1, d / 2 + 3);
    stripe.rotation.x = 0.35;
  }
  helpers.addSign(g, amenity.name, 34, 8, h + 10, '#ffd8a0');
  return g;
}

// LEGAL: Every amenity is built standing on the ground at its origin, so they all place the same way.
export function buildAmenityModel(THREE: typeof ThreeNamespace, amenity: MapAmenity, helpers: AmenityRenderHelpers): ThreeNamespace.Group {
  if(amenity.kind === 'basketball') return buildBasketballCourt(THREE, amenity, helpers);
  if(amenity.kind === 'parkgame') return buildParkGameSpot(THREE, amenity, helpers);
  if(amenity.kind === 'shop') return buildNewsstand(THREE, amenity, helpers);
  // LEGAL: The pet store is a shopfront like the other shops, with a green awning over the window.
  const g = new THREE.Group();
  const h = 22;
  const shop = helpers.buildPlaceModel('storefront', '#4f795c', 42, h, 36) ?? helpers.buildDetailedBuilding(42, h, 36, '#4f795c', 'shop', helpers.variantForId(amenity.id));
  shop.position.y = h / 2;
  g.add(shop);
  const awning = helpers.box(30, 1.2, 7, '#2f8f6a');
  awning.position.set(0, 12, 21); awning.rotation.x = 0.3; g.add(awning);
  helpers.addSign(g, amenity.name, 34, 8, h + 6, '#d0f0d8');
  return g;
}
