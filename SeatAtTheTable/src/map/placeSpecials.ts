import type * as ThreeNamespace from 'three';
import type { Solid } from '../config/types';

// LEGAL: Places that are one of a kind and were drawn with a generic shell: the airfield, the docks
// LEGAL: and the railyard all got the same fenced yard with a hut and two containers, the drive-in
// LEGAL: was a garage, the lodge a factory. Each is built here as what it is, standing on the ground
// LEGAL: at its origin, front (+Z) to the street, with the solids you walk round in the same space.
interface Special { build(THREE: typeof ThreeNamespace): ThreeNamespace.Group; solids: Solid[] }

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
  // LEGAL: A grass strip with a runway, a curved hangar, a windsock and a crop-duster on the apron.
  airfieldKettle:{
    solids:[{ x:-30, y:-18, hw:20, hd:26 }],
    build(THREE){
      const g = new THREE.Group(); const add = kit(THREE, g);
      add(flat(THREE, 260, 34), '#3a3c42', 40, 0.14, 26);
      for(let x = -70; x < 160; x += 22) add(flat(THREE, 10, 1.6), '#f0efe8', x, 0.2, 26);
      add(flat(THREE, 70, 40), '#4a4c52', -30, 0.16, -10);
      // LEGAL: The hangar: a barrel roof, half of a cylinder lying along its length above the ground.
      add(new THREE.CylinderGeometry(20, 20, 52, 18), '#8f949c', -30, 0, -18, { rot:[Math.PI / 2, 0, 0] });
      add(new THREE.BoxGeometry(30, 18, 0.6), '#3a3d44', -30, 9, 8.2);
      add(new THREE.CylinderGeometry(0.6, 0.6, 26, 6), '#d8d8d8', 30, 13, -18);
      add(new THREE.ConeGeometry(2.6, 10, 10), '#e8742a', 34.5, 25, -18, { rot:[0, 0, -Math.PI / 2] });
      // LEGAL: The crop-duster: fuselage, low wing, tailplane, fin and propeller.
      add(new THREE.CylinderGeometry(2.6, 1.6, 26, 12), '#d4a017', 10, 5, -6, { rot:[0, 0, Math.PI / 2] });
      add(new THREE.BoxGeometry(6, 0.8, 40), '#d4a017', 13, 3.4, -6);
      add(new THREE.BoxGeometry(4, 0.6, 14), '#d4a017', -2, 5.4, -6);
      add(new THREE.BoxGeometry(4, 6, 0.6), '#c0392b', -2, 8, -6);
      add(new THREE.BoxGeometry(0.6, 10, 1.2), '#2a2a2a', 23.4, 5, -6);
      add(new THREE.BoxGeometry(5, 3, 3), '#333333', 18, 2, -6);
      return g;
    },
  },
  // LEGAL: A timber wharf with bollards, stacked containers and a dockside gantry crane.
  docksDockmaster:{
    solids:[{ x:-34, y:-14, hw:16, hd:12 }, { x:30, y:-20, hw:20, hd:8 }],
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
      return g;
    },
  },
  // LEGAL: Three tracks with their sleepers, a rake of freight wagons and the signal hut.
  railyard:{
    // LEGAL: The wagons stand on the back track, so the yard's middle stays open to walk into.
    solids:[{ x:-10, y:-22, hw:44, hd:6 }, { x:44, y:30, hw:7, hd:6 }],
    build(THREE){
      const g = new THREE.Group(); const add = kit(THREE, g);
      add(flat(THREE, 118, 86), '#5a5248', 0, 0.14, 0);
      for(const z of [-36, -22, -8]){
        for(let x = -56; x <= 56; x += 5) add(new THREE.BoxGeometry(1.4, 0.6, 9), '#4a3a2a', x, 0.3, z);
        for(const side of [-1, 1]) add(new THREE.BoxGeometry(116, 0.7, 0.7), '#8f949c', 0, 0.9, z + side * 3);
      }
      const wagons = ['#7a3b2a', '#3e5a6a', '#7a3b2a', '#5a5a3a'];
      wagons.forEach(function(color, i){
        const x = -40 + i * 22;
        add(new THREE.BoxGeometry(20, 11, 8.6), color, x, 7.8, -22);
        add(new THREE.BoxGeometry(20.4, 0.8, 9), '#2a2a2a', x, 13.6, -22);
        for(const dx of [-6, 6]) add(new THREE.CylinderGeometry(1.6, 1.6, 9.6, 10), '#1a1a1a', x + dx, 1.6, -22, { rot:[Math.PI / 2, 0, 0] });
      });
      add(new THREE.BoxGeometry(14, 12, 12), '#8a7a62', 44, 6, 30);
      add(new THREE.BoxGeometry(16, 1.4, 14), '#4a4038', 44, 12.7, 30);
      add(new THREE.CylinderGeometry(0.5, 0.5, 18, 6), '#2a2a2a', 28, 9, 16);
      add(new THREE.BoxGeometry(2.4, 5, 2), '#1a1a1a', 28, 18, 16);
      add(new THREE.SphereGeometry(0.8, 8, 6), '#ff3030', 28, 19.4, 17.1, { emissive:'#ff2020' });
      return g;
    },
  },
  // LEGAL: The drive-in: a big screen on its frame facing rows of parking humps, the projection booth
  // LEGAL: in the middle and a snack bar to one side.
  driveInBoundary:{
    solids:[{ x:0, y:-42, hw:60, hd:3 }, { x:0, y:28, hw:8, hd:7 }, { x:-50, y:24, hw:9, hd:7 }],
    build(THREE){
      const g = new THREE.Group(); const add = kit(THREE, g);
      add(flat(THREE, 130, 100), '#3a3b40', 0, 0.14, 0);
      for(const x of [-56, 56]) add(new THREE.BoxGeometry(3, 52, 3), '#4a4c52', x, 26, -42);
      add(new THREE.BoxGeometry(116, 46, 1.2), '#000000', 0, 30, -42, { emissive:'#cfd8e0' });
      add(new THREE.BoxGeometry(120, 3, 2), '#4a4c52', 0, 54, -42);
      for(let row = 0; row < 4; row++) add(new THREE.BoxGeometry(110, 1.2, 4), '#4f5157', 0, 0.6, -20 + row * 16);
      add(new THREE.BoxGeometry(16, 12, 14), '#8a7a62', 0, 6, 28);
      add(new THREE.BoxGeometry(4, 3, 0.4), '#000000', 0, 9, 20.8, { emissive:'#fff2c8' });
      add(new THREE.BoxGeometry(18, 11, 14), '#c0392b', -50, 5.5, 24);
      add(new THREE.BoxGeometry(20, 1.2, 16), '#f0efe8', -50, 11.6, 24);
      return g;
    },
  },
  // LEGAL: The lodge: a log cabin with a stone chimney, a porch along the front and a shingle roof.
  lodgeRidgewood:{
    solids:[],
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
    solids:[],
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
      add(new THREE.CylinderGeometry(1.2, 1.2, 46, 8), '#3a3d44', w / 2 + 12, 23, d / 2 + 8);
      add(new THREE.BoxGeometry(2, 14, 26), '#000000', w / 2 + 12, 44, d / 2 + 8, { emissive:'#ff6a3a' });
      return g;
    },
  },
};

export function specialPlace(id: string): Special | null { return SPECIALS[id] ?? null; }

export function specialPlaceSolids(id: string, x: number, y: number): Solid[] {
  return (SPECIALS[id]?.solids ?? []).map(s => ({ x:x + s.x, y:y + s.y, hw:s.hw, hd:s.hd }));
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
