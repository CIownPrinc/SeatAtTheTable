import type * as ThreeNamespace from 'three';
import type { Solid } from '../config/types';
import type { PlaceModelName } from '../world/assets/places';
import { addPlaceModel, localMaterials, placeModel } from './placeModels';
import { AIRFIELD_GATE, airfieldSolids, buildAirfield } from './airfield';
import { RAILYARD_GATE, buildRailyard, railyardSolids } from './railyard';
import { PLACE_SCALE } from './scale';

// LEGAL: Places that are one of a kind and were drawn with a generic shell: the airfield, the docks
// LEGAL: and the railyard all got the same fenced yard with a hut and two containers, the drive-in
// LEGAL: was a garage, the lodge a factory. Each is built here as what it is, standing on the ground
// LEGAL: at its origin, front (+Z) to the street, with the solids you walk round in the same space.
// LEGAL: The docks, the drive-in, the lodge and the motel are authored at the old half size (a 1.2 m
// LEGAL: door, a 1.7 m motel) and `grown` by PLACE_SCALE, model, solids and all. `extent` is the ground
// LEGAL: a place covers, `entrance` the spot in front of its door, which is put on the place's map
// LEGAL: position so you use it from the door, and `turn` faces it some other way than south.
interface Special {
  build(THREE: typeof ThreeNamespace): ThreeNamespace.Group;
  solids: Solid[];
  extent?: { hw: number; hd: number };
  entrance?: { x: number; y: number };
  grown?: boolean;
  turn?: number;
}

type Add = (geometry: ThreeNamespace.BufferGeometry, color: string, x: number, y: number, z: number, opts?: { emissive?: string; rot?: [number, number, number] }) => ThreeNamespace.Mesh;
function kit(THREE: typeof ThreeNamespace, group: ThreeNamespace.Group): Add {
  const materials = new Map<string, ThreeNamespace.Material>();
  return function(geometry, color, x, y, z, opts = {}){
    const key = `${color}|${opts.emissive ?? ''}`;
    let material = materials.get(key);
    if(!material){ material = new THREE.MeshStandardMaterial({ color, roughness:0.8, ...(opts.emissive ? { emissive:opts.emissive, emissiveIntensity:0.9 } : {}) }); materials.set(key, material); }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if(opts.rot) mesh.rotation.set(...opts.rot);
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
}
const flat = (THREE: typeof ThreeNamespace, w: number, d: number) => new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2);

const SPECIALS: Record<string, Special> = {
  // LEGAL: Kettle Flats Airfield (map/airfield), round its car park.
  airfieldKettle:{
    solids:airfieldSolids().map(s => ({ ...s, x:s.x - AIRFIELD_GATE.x, y:s.y - AIRFIELD_GATE.y })),
    build:buildAirfield,
  },
  // LEGAL: A timber wharf with bollards, stacked containers and a dockside gantry crane.
  docksDockmaster:{
    // LEGAL: The container stacks, the crane and the dockmaster's office. The quay (+Z) faces the canal.
    solids:[{ x:-34, y:-14, hw:16, hd:12 }, { x:30, y:-20, hw:20, hd:8 }, { x:34, y:14, hw:22, hd:15 }],
    extent:{ hw:59, hd:43 }, grown:true, turn:-Math.PI / 2,
    build(THREE){
      const g = new THREE.Group(); const add = kit(THREE, g);
      add(flat(THREE, 118, 86), '#6a5a44', 0, 0.14, 0);
      for(let x = -54; x <= 54; x += 6) add(flat(THREE, 0.6, 86), '#4f4232', x, 0.17, 0);
      for(let x = -50; x <= 50; x += 20) add(new THREE.CylinderGeometry(1.6, 2, 4, 10), '#2a2d33', x, 2, 38);
      const colours = ['#a83228', '#2f6bb0', '#d4a017', '#2f8f6a', '#7a4a8a', '#c86a2a'];
      // LEGAL: Two stacks of containers, three high.
      colours.forEach((color, i) => add(new THREE.BoxGeometry(22, 10, 9), color, -34, 5 + Math.floor(i / 2) * 10, -19 + (i % 2) * 10));
      for(const x of [14, 46]) for(const z of [-28, -12]) add(new THREE.BoxGeometry(2.6, 46, 2.6), '#d4692a', x, 23, z);
      add(new THREE.BoxGeometry(40, 3, 24), '#d4692a', 30, 46, -20);
      add(new THREE.BoxGeometry(6, 5, 6), '#3a3d44', 30, 42, -20);
      add(new THREE.BoxGeometry(0.4, 22, 0.4), '#1a1a1a', 30, 30, -20);
      add(new THREE.BoxGeometry(22, 10, 9), '#2f6bb0', 30, 15, -20);
      add(new THREE.BoxGeometry(44, 16, 30), '#8a9aa4', 34, 8, 14);
      return g;
    },
  },
  // LEGAL: The railyard beside the freight line (map/railyard), round its gate.
  railyard:{
    solids:railyardSolids().map(s => ({ ...s, x:s.x - RAILYARD_GATE.x, y:s.y - RAILYARD_GATE.y })),
    build:buildRailyard,
  },
  // LEGAL: The drive-in: a big screen on its frame facing rows of parking humps, the projection booth
  // LEGAL: in the middle and a snack bar to one side.
  driveInBoundary:{
    solids:[{ x:0, y:-42, hw:60, hd:3 }, { x:0, y:28, hw:8, hd:7 }, { x:-42, y:24, hw:20, hd:14 }],
    extent:{ hw:65, hd:60 }, grown:true,
    build(THREE){
      const g = new THREE.Group(); const add = kit(THREE, g);
      add(flat(THREE, 130, 100), '#3a3b40', 0, 0.14, 0);
      for(const x of [-56, 56]) add(new THREE.BoxGeometry(3, 52, 3), '#4a4c52', x, 26, -42);
      add(new THREE.BoxGeometry(116, 46, 1.2), '#000000', 0, 30, -42, { emissive:'#cfd8e0' });
      add(new THREE.BoxGeometry(120, 3, 2), '#4a4c52', 0, 54, -42);
      for(let row = 0; row < 4; row++) add(new THREE.BoxGeometry(110, 1.2, 4), '#4f5157', 0, 0.6, -20 + row * 16);
      add(new THREE.BoxGeometry(16, 12, 14), '#8a7a62', 0, 6, 28);
      add(new THREE.BoxGeometry(4, 3, 0.4), '#000000', 0, 9, 20.8, { emissive:'#fff2c8' });
      add(new THREE.BoxGeometry(40, 11, 28), '#c0392b', -42, 5.5, 24);
      add(new THREE.BoxGeometry(42, 1.2, 30), '#f0efe8', -42, 11.6, 24);
      return g;
    },
  },
  // LEGAL: The lodge: a log cabin with a stone chimney, a porch along the front and a shingle roof.
  lodgeRidgewood:{
    // LEGAL: The cabin and its chimney; the porch is open to walk onto. It had no solids at all.
    solids:[{ x:0, y:0, hw:34, hd:25 }, { x:34, y:-11.5, hw:4.5, hd:4.5 }],
    extent:{ hw:40, hd:35 }, entrance:{ x:0, y:30 }, grown:true,
    build(THREE){
      const g = new THREE.Group(); const add = kit(THREE, g);
      const w = 64, d = 46, wallH = 22;
      for(let y = 1.6; y < wallH; y += 3.2){
        for(const z of [-d / 2, d / 2]) add(new THREE.CylinderGeometry(1.6, 1.6, w + 4, 8), '#7a5232', 0, y, z, { rot:[0, 0, Math.PI / 2] });
        for(const x of [-w / 2, w / 2]) add(new THREE.CylinderGeometry(1.6, 1.6, d + 4, 8), '#6a4a2c', x, y + 1.6, 0, { rot:[Math.PI / 2, 0, 0] });
      }
      add(new THREE.BoxGeometry(w - 2, wallH, d - 2), '#5a3e26', 0, wallH / 2, 0);
      const shape = new THREE.Shape();
      shape.moveTo(-d / 2 - 5, 0); shape.lineTo(d / 2 + 5, 0); shape.lineTo(0, 18); shape.closePath();
      const roof = new THREE.ExtrudeGeometry(shape, { depth:w + 8, bevelEnabled:false }).rotateY(Math.PI / 2).translate(-(w + 8) / 2, 0, 0);
      add(roof, '#3a3430', 0, wallH, 0);
      add(new THREE.BoxGeometry(8, wallH + 24, 8), '#8a8478', w / 2 - 6, (wallH + 24) / 2, -d / 4);
      add(new THREE.BoxGeometry(w, 1.6, 10), '#6a4a2c', 0, 1, d / 2 + 5);
      for(const x of [-w / 2 + 3, -w / 6, w / 6, w / 2 - 3]) add(new THREE.CylinderGeometry(1, 1, 14, 6), '#6a4a2c', x, 8, d / 2 + 9);
      add(new THREE.BoxGeometry(w + 2, 1.4, 12), '#3a3430', 0, 15.4, d / 2 + 5);
      add(new THREE.BoxGeometry(8, 13, 0.6), '#3a2a1a', 0, 7.5, d / 2 + 0.6);
      for(const x of [-18, 18]) add(new THREE.BoxGeometry(8, 7, 0.6), '#000000', x, 12, d / 2 + 0.6, { emissive:'#ffcf70' });
      return g;
    },
  },
  // LEGAL: The motel: a one-storey row of rooms, each with its door and window, the office at one end
  // LEGAL: and the tall sign out front.
  motelSunset:{
    // LEGAL: The block of rooms, the office at its west end and the sign's pole out front. The block
    // LEGAL: wasn't solid: you walked through the rooms. You use the motel at the office door.
    solids:[{ x:0, y:-4, hw:36, hd:20 }, { x:-56, y:5, hw:22, hd:15 }, { x:48, y:28, hw:2, hd:2 }],
    extent:{ hw:80, hd:42 }, entrance:{ x:-68, y:30 }, grown:true,
    build(THREE){
      const g = new THREE.Group(); const add = kit(THREE, g);
      const w = 72, d = 40, h = 18;
      add(new THREE.BoxGeometry(w, h, d), '#e0c8a0', 0, h / 2, -4);
      add(new THREE.BoxGeometry(w + 4, 1.6, d + 10), '#7a3a2a', 0, h + 0.8, 0);
      for(let i = 0; i < 6; i++){
        const x = -w / 2 + 8 + i * 11;
        add(new THREE.BoxGeometry(5, 11, 0.6), ['#2f6b8a', '#8a2f3a', '#2f8a5a'][i % 3], x, 5.5, d / 2 - 3.6);
        add(new THREE.BoxGeometry(4, 4, 0.6), '#000000', x + 4.6, 9, d / 2 - 3.6, { emissive:'#ffd89a' });
      }
      for(let x = -w / 2 + 2; x <= w / 2 - 2; x += 11) add(new THREE.BoxGeometry(1, h, 1), '#f0efe8', x, h / 2, d / 2 + 4.4);
      add(new THREE.BoxGeometry(44, h, 30), '#e0c8a0', -56, h / 2, 5);
      add(new THREE.CylinderGeometry(1.2, 1.2, 46, 8), '#3a3d44', w / 2 + 12, 23, d / 2 + 8);
      add(new THREE.BoxGeometry(2, 14, 26), '#000000', w / 2 + 12, 44, d / 2 + 8, { emissive:'#ff6a3a' });
      return g;
    },
  },
};

// LEGAL: Each place's Blender model (art/blender/places.py), which replaces its shapes above once loaded.
const MODELS: Record<string, PlaceModelName> = {
  docksDockmaster:'docks', driveInBoundary:'drive-in', lodgeRidgewood:'lodge', motelSunset:'motel',
};

// LEGAL: From a place's authored space to the space round its map position: entrance to the origin,
// LEGAL: grown to size, then turned. Quarter turns only, so a box stays a box.
function placed(special: Special, s: Solid): Solid {
  const k = special.grown ? PLACE_SCALE : 1;
  const ex = special.entrance?.x ?? 0, ey = special.entrance?.y ?? 0;
  const x = (s.x - ex) * k, y = (s.y - ey) * k;
  const turn = special.turn ?? 0;
  const c = Math.round(Math.cos(turn)), sn = Math.round(Math.sin(turn));
  const swap = c === 0;
  return { x:x * c + y * sn, y:-x * sn + y * c, hw:(swap ? s.hd : s.hw) * k, hd:(swap ? s.hw : s.hd) * k };
}

export function specialPlace(id: string): Special | null {
  const special = SPECIALS[id];
  if(!special) return null;
  const name = MODELS[id];
  const k = special.grown ? PLACE_SCALE : 1;
  return {
    solids:special.solids.map(s => placed(special, s)),
    build(THREE){
      const model = name ? placeModel(name) : null;
      const inner = new THREE.Group();
      // LEGAL: The Blender model is grown already (art/blender/places.py); the shapes are grown here.
      if(model) addPlaceModel(THREE, inner, model, localMaterials(THREE), `special:${name}`);
      else { inner.add(special.build(THREE)); inner.scale.setScalar(k); }
      inner.position.set(-(special.entrance?.x ?? 0) * k, 0, -(special.entrance?.y ?? 0) * k);
      const g = new THREE.Group();
      g.rotation.y = special.turn ?? 0;
      g.add(inner);
      return g;
    },
  };
}

export function specialPlaceSolids(id: string, x: number, y: number): Solid[] {
  return (specialPlace(id)?.solids ?? []).map(s => ({ x:x + s.x, y:y + s.y, hw:s.hw, hd:s.hd }));
}

// LEGAL: The ground a one-of-a-kind place covers, for the city's lots and the countryside to keep off.
export function specialPlaceFootprint(id: string, x: number, y: number): Solid | null {
  const special = SPECIALS[id];
  if(!special?.extent) return null;
  const s = placed(special, { x:0, y:0, ...special.extent });
  return { x:x + s.x, y:y + s.y, hw:s.hw, hd:s.hd };
}

// LEGAL: The Gilded Kettle is the civic hall model with a casino's front: a lit marquee over the
// LEGAL: door and a red carpet down the steps.
export function addCasinoFront(THREE: typeof ThreeNamespace, building: ThreeNamespace.Object3D, w: number, h: number, d: number): void {
  const g = new THREE.Group();
  const add = kit(THREE, g);
  add(new THREE.BoxGeometry(w * 0.7, 6, 4), '#2a1a12', 0, -h / 2 + 22, d / 2 + 3);
  add(new THREE.BoxGeometry(w * 0.66, 3.6, 0.6), '#000000', 0, -h / 2 + 22, d / 2 + 5.3, { emissive:'#ffcf5a' });
  for(let i = 0; i < 14; i++) add(new THREE.SphereGeometry(0.7, 6, 4), '#000000', -w * 0.33 + i * (w * 0.66 / 13), -h / 2 + 25.5, d / 2 + 5.3, { emissive:'#fff2c0' });
  add(new THREE.BoxGeometry(12, 0.3, 18), '#8a1f2a', 0, -h / 2 + 0.2, d / 2 + 9);
  building.add(g);
}
