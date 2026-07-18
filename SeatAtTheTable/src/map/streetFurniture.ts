import type * as ThreeNamespace from 'three';

export interface StreetFurnitureOptions {
  THREE: typeof ThreeNamespace;
  worldGroup: ThreeNamespace.Group;
  streetLights: ThreeNamespace.PointLight[];
}

function box(THREE: typeof ThreeNamespace, w: number, h: number, d: number, color: number | string): ThreeNamespace.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({color, roughness:0.85, metalness:0.05}));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildStreetLight(options: StreetFurnitureOptions, x: number, z: number): void {
  const { THREE, worldGroup, streetLights } = options;
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.8,34,8), new THREE.MeshStandardMaterial({color:'#3b3e47', roughness:0.55, metalness:0.4}));
  pole.position.set(0,17,0); pole.castShadow=true; group.add(pole);
  const arm = box(THREE, 14,1.8,1.8,'#3b3e47');
  arm.position.set(6,33,0); group.add(arm);
  const bulbMat = new THREE.MeshStandardMaterial({color:'#ffe6a0', emissive:'#ffd27a', emissiveIntensity:1.4});
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(3.2,10,8), bulbMat);
  bulb.position.set(13,32,0); group.add(bulb);
  const light = new THREE.PointLight(0xffcc7a, 0, 230, 1.65);
  light.position.set(13,32,0); group.add(light);
  group.position.set(x,0,z);
  worldGroup.add(group);
  streetLights.push(light);
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
  const border = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length:8 }, function(_v,i){
    const a = Math.PI/8 + i*Math.PI/4;
    return new THREE.Vector3(Math.cos(a)*4.6, Math.sin(a)*4.6, 0.31);
  })), new THREE.LineBasicMaterial({color:'#fff8f0'}));
  border.position.y=20; group.add(border);
  const face = document.createElement('canvas');
  face.width = 256; face.height = 256;
  const fctx = face.getContext('2d')!;
  fctx.clearRect(0,0,256,256);
  fctx.fillStyle = '#fff8f0'; fctx.font = 'bold 58px Arial, sans-serif'; fctx.textAlign = 'center'; fctx.textBaseline = 'middle'; fctx.fillText('STOP',128,132);
  const tex = new THREE.CanvasTexture(face);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(9.2,9.2), new THREE.MeshBasicMaterial({map:tex, transparent:true, depthWrite:false}));
  label.position.set(0,20,0.34); group.add(label);
  group.position.set(x,0,z); group.rotation.y=rot; worldGroup.add(group);
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
  group.position.set(x,0,z); group.rotation.y=rot; worldGroup.add(group);
}

export function buildIntersectionFurniture(options: StreetFurnitureOptions, x: number, z: number, index: number): void {
  buildStreetLight(options, x - 46, z - 46);
  buildStreetLight(options, x + 46, z + 46);
  buildStopSign(options, x - 42, z + 42, Math.PI / 4);
  if(index % 2 === 0) buildTrafficLight(options, x + 42, z - 42, -Math.PI / 4);
}
