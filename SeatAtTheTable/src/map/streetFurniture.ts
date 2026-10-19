import { STREET_FURNITURE_SCALE } from './scale';
import type * as ThreeNamespace from 'three';

export interface LampHead { x: number; y: number; z: number }

export interface StreetFurnitureOptions {
  THREE: typeof ThreeNamespace;
  worldGroup: ThreeNamespace.Group;
  streetLamps: LampHead[];
}

// LEGAL: The city has dozens of lamps, but every real light is compiled into every lit
// LEGAL: shader and paid for on every pixel. So a small, fixed pool of lights moves to the
// LEGAL: lamps nearest the player; the rest glow (emissive bulbs) without lighting the road.
export function nearestLamps(lamps: LampHead[], x: number, z: number, count: number): LampHead[] {
  return [...lamps]
    .sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))
    .slice(0, count);
}

function box(THREE: typeof ThreeNamespace, w: number, h: number, d: number, color: number | string): ThreeNamespace.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({color, roughness:0.85, metalness:0.05}));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// LEGAL: One bulb material for every street lamp, so the day/night cycle can switch them all off
// LEGAL: in daylight with a single change (each lamp used to glow at full strength at noon).
let bulbMaterial: import('three').MeshStandardMaterial | null = null;
export function streetLampBulbs(THREE: typeof import('three')): import('three').MeshStandardMaterial {
  if(!bulbMaterial) bulbMaterial = new THREE.MeshStandardMaterial({ color:'#ffe6a0', emissive:'#ffd27a', emissiveIntensity:1.4 });
  return bulbMaterial;
}

// LEGAL: `toward` is the point the arm reaches out over, normally the middle of the junction.
export function buildStreetLight(options: StreetFurnitureOptions, x: number, z: number, toward: { x: number; z: number }): void {
  const { THREE, worldGroup, streetLamps } = options;
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.8,34,8), new THREE.MeshStandardMaterial({color:'#3b3e47', roughness:0.55, metalness:0.4}));
  pole.position.set(0,17,0); pole.castShadow=true; group.add(pole);
  const arm = box(THREE, 14,1.8,1.8,'#3b3e47');
  arm.position.set(6,33,0); group.add(arm);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(3.2,10,8), streetLampBulbs(THREE));
  bulb.position.set(13,32,0); group.add(bulb);
  // LEGAL: The arm is built along +X; turn it to point at `toward` so the lamp hangs over the road.
  const angle = Math.atan2(toward.z - z, toward.x - x);
  group.rotation.y = -angle;
  group.position.set(x,0,z);
  group.scale.setScalar(STREET_FURNITURE_SCALE);
  worldGroup.add(group);
  streetLamps.push({ x: x + Math.cos(angle) * 13 * STREET_FURNITURE_SCALE, y: 32 * STREET_FURNITURE_SCALE, z: z + Math.sin(angle) * 13 * STREET_FURNITURE_SCALE });
}

export function buildStopSign(options: StreetFurnitureOptions, x: number, z: number, rot: number): void {
  const { THREE, worldGroup } = options;
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,18,6), new THREE.MeshStandardMaterial({color:'#c8cad8', roughness:0.4, metalness:0.5}));
  pole.position.set(0,9,0); pole.castShadow=true; group.add(pole);
  const signShape = new THREE.Shape();
  const radius = 5.4;
  for(let i=0;i<8;i++){
    const a = Math.PI/8 + i*Math.PI/4;
    const sx = Math.cos(a)*radius;
    const sy = Math.sin(a)*radius;
    if(i===0) signShape.moveTo(sx,sy); else signShape.lineTo(sx,sy);
  }
  signShape.closePath();
  const sign = new THREE.Mesh(new THREE.ExtrudeGeometry(signShape, { depth:0.5, bevelEnabled:false }), new THREE.MeshStandardMaterial({color:'#ad2f2f', roughness:0.5}));
  sign.position.set(0,20,-0.25); sign.castShadow=true; group.add(sign);
  // LEGAL: The white rim is a slightly larger octagon behind the face, not a 1-pixel line loop.
  const rimShape = new THREE.Shape();
  for(let i=0; i<8; i++){
    const a = Math.PI/8 + i*Math.PI/4;
    if(i===0) rimShape.moveTo(Math.cos(a)*(radius+0.55), Math.sin(a)*(radius+0.55)); else rimShape.lineTo(Math.cos(a)*(radius+0.55), Math.sin(a)*(radius+0.55));
  }
  rimShape.closePath();
  const rim = new THREE.Mesh(new THREE.ShapeGeometry(rimShape), new THREE.MeshStandardMaterial({color:'#fff8f0', roughness:0.6}));
  rim.position.set(0,20,-0.3); group.add(rim);
  const face = document.createElement('canvas');
  face.width = 256; face.height = 256;
  const fctx = face.getContext('2d')!;
  fctx.clearRect(0,0,256,256);
  fctx.fillStyle = '#fff8f0'; fctx.font = 'bold 58px Arial, sans-serif'; fctx.textAlign = 'center'; fctx.textBaseline = 'middle'; fctx.fillText('STOP',128,132);
  const tex = new THREE.CanvasTexture(face);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(9.2,9.2), new THREE.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false}));
  label.position.set(0,20,0.34); group.add(label);
  group.position.set(x,0,z); group.rotation.y=rot; group.scale.setScalar(STREET_FURNITURE_SCALE); worldGroup.add(group);
}

export function buildTrafficLight(options: StreetFurnitureOptions, x: number, z: number, rot: number): void {
  const { THREE, worldGroup } = options;
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(1,1.4,30,8), new THREE.MeshStandardMaterial({color:'#2f333c', roughness:0.5, metalness:0.5}));
  pole.position.set(0,15,0); pole.castShadow=true; group.add(pole);
  const arm = box(THREE, 22,2,2,'#2f333c'); arm.position.set(10,29,0); group.add(arm);
  const housing = box(THREE, 7,18,5,'#1b1d23'); housing.position.set(22,24,0); group.add(housing);
  ['#d4322f','#d4a017','#2fa85f'].forEach(function(color, i){
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(2.1,10,8), new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:i===0?0.9:0.25}));
    lamp.position.set(22,29-i*5,2.7); group.add(lamp);
  });
  group.position.set(x,0,z); group.rotation.y=rot; group.scale.setScalar(STREET_FURNITURE_SCALE); worldGroup.add(group);
}

export function buildIntersectionFurniture(options: StreetFurnitureOptions, x: number, z: number, index: number): void {
  buildStreetLight(options, x - 46, z - 46, { x, z });
  buildStreetLight(options, x + 46, z + 46, { x, z });
  buildStopSign(options, x - 42, z + 42, Math.PI / 4);
  if(index % 2 === 0) buildTrafficLight(options, x + 42, z - 42, -Math.PI / 4);
}
