import type * as ThreeNamespace from 'three';
import type { Point, Solid } from '../config/types';
import { mergeMeshesWithin, type MergeGeometries } from './mergeScenery';
import { addPlaceModel, localMaterials, placeModel } from './placeModels';
import { storeys } from './scale';

// LEGAL: Lakeridge Mall, at the end of Wabash Avenue where the city gives way to the suburbs. The
// LEGAL: plaza in front is the place you walk into (the service lot, so it's reachable like any
// LEGAL: door); the building and its parking garage behind it are drawn and made solid here.
export const MALL_ENTRANCE: Point = { x:6180, y:1310 };
export const MALL_BODY = { x:6180, y:1445, w:340, d:170, h:storeys(50) };
export const MALL_GARAGE = { x:6450, y:1440, w:160, d:160, deck:30, decks:3 };

export function mallSolids(): Solid[] {
  return [
    { x:MALL_BODY.x, y:MALL_BODY.y, hw:MALL_BODY.w / 2, hd:MALL_BODY.d / 2 },
    // LEGAL: The garage and its ramp, which runs up the outside of its east wall.
    { x:MALL_GARAGE.x + 15, y:MALL_GARAGE.y, hw:MALL_GARAGE.w / 2 + 15, hd:MALL_GARAGE.d / 2 },
  ];
}

// LEGAL: Where countryside scenery must not grow: the building, the garage and the plaza, with a margin.
export function mallKeepClear(): Solid[] {
  const margin = 30;
  return [
    ...mallSolids().map(s => ({ ...s, hw:s.hw + margin, hd:s.hd + margin })),
    { x:MALL_ENTRANCE.x, y:MALL_ENTRANCE.y, hw:110 + margin, hd:50 + margin },
  ];
}

const SHOPFRONTS = ['#7a2630', '#2f4a6a', '#c9a227', '#3f5a3a', '#3a3f4b', '#8a4a2a'];

function signTexture(THREE: typeof ThreeNamespace, text: string): ThreeNamespace.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1c2230'; ctx.fillRect(0, 0, 1024, 160);
  ctx.fillStyle = '#ffd98a'; ctx.font = '700 86px IBM Plex Sans, system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 512, 84);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildBody(THREE: typeof ThreeNamespace, materials: (color: string, emissive?: string) => ThreeNamespace.Material): ThreeNamespace.Group {
  const { w, d, h } = MALL_BODY;
  const g = new THREE.Group();
  const add = (geometry: ThreeNamespace.BufferGeometry, color: string, x: number, y: number, z: number, emissive?: string) => {
    const mesh = new THREE.Mesh(geometry, materials(color, emissive));
    mesh.position.set(x, y, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh);
  };
  add(new THREE.BoxGeometry(w, h, d), '#d9cdb4', 0, h / 2, 0);
  add(new THREE.BoxGeometry(w + 4, 6, d + 4), '#8a7a62', 0, h + 3, 0);
  add(new THREE.BoxGeometry(w + 2, 4, d + 2), '#a8987e', 0, h * 0.5, 0);
  // LEGAL: The glass atrium over the entrance, standing proud of the front.
  const front = -d / 2;
  add(new THREE.BoxGeometry(96, h + 22, 22), '#9cc4d8', 0, (h + 22) / 2, front - 8, '#3a5a6a');
  add(new THREE.BoxGeometry(100, 4, 26), '#5c6470', 0, h + 24, front - 8);
  for(const x of [-36, -12, 12, 36]) add(new THREE.BoxGeometry(2.4, h + 22, 24), '#5c6470', x, (h + 22) / 2, front - 8);
  add(new THREE.BoxGeometry(52, 34, 2), '#2a2f38', 0, 17, front - 20);
  // LEGAL: Lit shopfronts with coloured awnings along the ground floor, either side of the atrium.
  SHOPFRONTS.forEach(function(color, i){
    const side = i < 3 ? -1 : 1;
    const x = side * (74 + (i % 3) * 32);
    add(new THREE.BoxGeometry(26, 26, 1.5), '#f6e3b8', x, 16, front - 0.8, '#7a6a4a');
    add(new THREE.BoxGeometry(28, 2.4, 8), color, x, 31, front - 4);
  });
  // LEGAL: Upper-floor windows: a dark band of glass.
  add(new THREE.BoxGeometry(w - 120, 18, 1.5), '#33475a', -0, h * 0.72, front - 0.8);
  for(const side of [-1, 1]) add(new THREE.BoxGeometry(1.5, 18, d - 40), '#33475a', side * (w / 2 + 0.8), h * 0.72, 0);
  // LEGAL: Roof plant and a skylight strip down the middle.
  add(new THREE.BoxGeometry(w * 0.6, 3, 18), '#9cc4d8', 0, h + 1.5, 0);
  for(const [x, z] of [[-120, 40], [-90, 40], [110, -40], [130, 50]] as const) add(new THREE.BoxGeometry(22, 12, 18), '#7c8088', x, h + 6, z);
  return g;
}

function buildGarage(THREE: typeof ThreeNamespace, materials: (color: string, emissive?: string) => ThreeNamespace.Material): ThreeNamespace.Group {
  const { w, d, deck, decks } = MALL_GARAGE;
  const g = new THREE.Group();
  const add = (geometry: ThreeNamespace.BufferGeometry, color: string, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, materials(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  for(let level = 1; level <= decks; level++){
    const y = level * deck;
    add(new THREE.BoxGeometry(w, 4, d), '#a7a59e', 0, y - 2, 0);
    // LEGAL: Low concrete walls round each deck, open between them so it reads as a car park.
    for(const side of [-1, 1]){
      add(new THREE.BoxGeometry(w, 9, 3), '#bdbab2', 0, y + 4.5, side * (d / 2 - 1.5));
      add(new THREE.BoxGeometry(3, 9, d), '#bdbab2', side * (w / 2 - 1.5), y + 4.5, 0);
    }
    // LEGAL: Parking bay lines on the deck.
    for(let x = -w / 2 + 16; x < w / 2 - 8; x += 20) add(new THREE.BoxGeometry(1.2, 0.3, 30), '#f0efe8', x, y + 0.2, -d / 2 + 24);
  }
  for(let x = -w / 2 + 6; x <= w / 2 - 6; x += (w - 12) / 3){
    for(const z of [-d / 2 + 6, 0, d / 2 - 6]) add(new THREE.BoxGeometry(5, decks * deck, 5), '#9a978f', x, decks * deck / 2, z);
  }
  // LEGAL: The ramp up the east side, and the stair tower with its P sign.
  const ramp = add(new THREE.BoxGeometry(30, 3, d * 0.8), '#8e8c85', w / 2 + 15, deck / 2, 0);
  ramp.rotation.x = Math.atan2(deck, d * 0.8);
  add(new THREE.BoxGeometry(22, decks * deck + 14, 22), '#6d7a86', w / 2 - 11, (decks * deck + 14) / 2, -d / 2 + 11);
  add(new THREE.BoxGeometry(14, 14, 1.5), '#2f6bb0', w / 2 - 11, decks * deck + 2, -d / 2 - 0.8);
  return g;
}

export function buildMall(THREE: typeof ThreeNamespace, merge?: MergeGeometries): ThreeNamespace.Group {
  const cache = new Map<string, ThreeNamespace.Material>();
  const materials = (color: string, emissive?: string) => {
    const key = `${color}|${emissive ?? ''}`;
    let material = cache.get(key);
    if(!material){
      material = new THREE.MeshStandardMaterial({ color, roughness:0.75, ...(emissive ? { emissive, emissiveIntensity:0.6 } : {}) });
      cache.set(key, material);
    }
    return material;
  };
  const mall = new THREE.Group();
  mall.name = 'landmark:mall';
  // LEGAL: The Blender mall and garage (art/blender/places.py) when they've loaded, else the shapes above.
  const parts = localMaterials(THREE);
  const modelled = (name: 'mall' | 'mall-garage', fallback: () => ThreeNamespace.Group) => {
    const model = placeModel(name);
    if(!model) return fallback();
    const g = new THREE.Group();
    addPlaceModel(THREE, g, model, parts, name);
    return g;
  };
  const body = modelled('mall', () => buildBody(THREE, materials));
  body.position.set(MALL_BODY.x, 0, MALL_BODY.y);
  const garage = modelled('mall-garage', () => buildGarage(THREE, materials));
  garage.position.set(MALL_GARAGE.x, 0, MALL_GARAGE.y);
  if(merge){ mergeMeshesWithin(THREE, body, merge); mergeMeshesWithin(THREE, garage, merge); }
  mall.add(body, garage);
  // LEGAL: The name across the atrium, kept out of the merge because it carries its own texture.
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(92, 14.4), new THREE.MeshBasicMaterial({ map:signTexture(THREE, 'LAKERIDGE MALL') }));
  sign.position.set(MALL_BODY.x, MALL_BODY.h + 8, MALL_BODY.y - MALL_BODY.d / 2 - 19.4);
  sign.rotation.y = Math.PI;
  mall.add(sign);
  return mall;
}
