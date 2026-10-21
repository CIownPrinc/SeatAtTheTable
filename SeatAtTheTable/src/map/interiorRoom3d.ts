import type * as ThreeNamespace from 'three';
import type { Solid } from '../config/types';
import type { InteriorPlan } from './interiorPlans';
import { interiorLayout, type FloorPattern, type InteriorCar, type InteriorPiece, type InteriorSpot, type RoomSize } from './interiorLayout';
import { mergeMeshesWithin, type MergeGeometries } from './mergeScenery';
import { addPlaceModel, localMaterials, placeModel } from './placeModels';

// LEGAL: A room you walk around in, in 3D. Room units (what the player moves in) are scaled down by
// LEGAL: INTERIOR_SCALE so a 480-unit room is a shop-sized 27 m across a 22-unit person, not a hall.
export const INTERIOR_SCALE = 0.6;

export interface InteriorView {
  root: ThreeNamespace.Group;
  // LEGAL: Furniture you can't walk through, in room units.
  solids: Solid[];
  // LEGAL: Lights up the ring of the hotspot you're next to ('door' for the way out).
  setHighlight(key: string | null, time: number): void;
  // LEGAL: Moves the people who walk round the room.
  tick(dt: number): void;
  dispose(): void;
}

export interface InteriorBuild {
  kind: string;
  refId: string;
  room: RoomSize;
  // LEGAL: The way out, on the ground floor; upper floors have none.
  door: { x: number; y: number } | null;
  plan?: InteriorPlan;
  floor?: number;
  spots: InteriorSpot[];
  makePerson(identity: string, coat: string): ThreeNamespace.Object3D;
  makeCar(car: InteriorCar): ThreeNamespace.Object3D | null;
  merge?: MergeGeometries;
}

// LEGAL: Hotspot rings are keyed by position in the list, since two hotspots can share an id.
export function spotKey(index: number): string { return `spot:${index}`; }

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * (1 + amount))));
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}

// LEGAL: The floor's texture, painted once per room on a small canvas and tiled.
function floorTexture(THREE: typeof ThreeNamespace, pattern: FloorPattern, color: string): ThreeNamespace.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color; ctx.fillRect(0, 0, size, size);
  let seed = 7;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  if(pattern === 'wood'){
    for(let row = 0; row < 8; row++){
      const offset = (row % 2) * 96;
      for(let x = -offset; x < size; x += 192){
        ctx.fillStyle = shade(color, (random() - 0.5) * 0.18);
        ctx.fillRect(x, row * 32, 192, 32);
      }
      ctx.fillStyle = shade(color, -0.35); ctx.fillRect(0, row * 32, size, 2);
    }
  } else if(pattern === 'tile' || pattern === 'marble'){
    const step = pattern === 'tile' ? 64 : 128;
    if(pattern === 'marble'){
      ctx.strokeStyle = shade(color, -0.06); ctx.lineWidth = 1;
      for(let i = 0; i < 5; i++){
        ctx.beginPath(); ctx.moveTo(random() * size, random() * size);
        for(let k = 0; k < 4; k++) ctx.lineTo(random() * size, random() * size);
        ctx.stroke();
      }
    }
    ctx.fillStyle = shade(color, -0.22);
    for(let i = 0; i < size; i += step){ ctx.fillRect(i, 0, 2, size); ctx.fillRect(0, i, size, 2); }
  } else {
    // LEGAL: Carpet and concrete: fine speckle; concrete also gets its expansion joints.
    for(let i = 0; i < 2600; i++){
      ctx.fillStyle = shade(color, (random() - 0.5) * (pattern === 'carpet' ? 0.3 : 0.2));
      ctx.fillRect(random() * size, random() * size, 2, 2);
    }
    if(pattern === 'concrete'){ ctx.fillStyle = shade(color, -0.3); ctx.fillRect(0, 0, size, 2); ctx.fillRect(0, 0, 2, size); }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// LEGAL: A name card floating over each hotspot, in place of the old emoji tile.
function labelSprite(THREE: typeof ThreeNamespace, text: string): ThreeNamespace.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.font = '600 40px IBM Plex Sans, system-ui, sans-serif';
  const width = Math.min(500, ctx.measureText(text).width + 48);
  const x = (512 - width) / 2;
  ctx.fillStyle = 'rgba(12,13,18,0.82)';
  ctx.beginPath(); ctx.roundRect(x, 14, width, 68, 18); ctx.fill();
  ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#f0efe8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 50);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map:texture, depthTest:false, transparent:true }));
  sprite.scale.set(58, 11, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function pieceMesh(THREE: typeof ThreeNamespace, piece: InteriorPiece, material: ThreeNamespace.Material): ThreeNamespace.Mesh {
  const s = INTERIOR_SCALE;
  let geometry: ThreeNamespace.BufferGeometry;
  if(piece.shape === 'box') geometry = new THREE.BoxGeometry(piece.w * s, piece.h * s, piece.d * s);
  else if(piece.shape === 'sphere'){
    geometry = new THREE.SphereGeometry(piece.w * s / 2, 14, 10);
    geometry.scale(1, piece.h / piece.w, piece.d / piece.w);
  } else if(piece.axis === 'z'){
    geometry = new THREE.CylinderGeometry(piece.w * s / 2, piece.w * s / 2, piece.d * s, 28);
    geometry.rotateX(Math.PI / 2);
  } else geometry = new THREE.CylinderGeometry(piece.w * s / 2, piece.w * s / 2, piece.h * s, 20);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(piece.x * s, (piece.y + piece.h / 2) * s, piece.z * s);
  return mesh;
}

export function buildInteriorRoom3d(THREE: typeof ThreeNamespace, build: InteriorBuild): InteriorView {
  const s = INTERIOR_SCALE;
  const { room } = build;
  const layout = interiorLayout(build.kind, build.refId, room, build.spots, build.plan, build.floor ?? 0);
  const root = new THREE.Group();
  root.name = `interior:${build.refId}`;

  const lights = new THREE.Group();
  lights.add(new THREE.HemisphereLight(0xfff4e0, 0x403830, 1.9));
  const key = new THREE.DirectionalLight(0xfff0d8, 1.5);
  key.position.set(room.w * s * 0.3, 160, room.h * s * 1.4);
  key.target.position.set(room.w * s * 0.5, 0, room.h * s * 0.4);
  lights.add(key, key.target);
  root.add(lights);

  const texture = floorTexture(THREE, layout.floor, layout.floorColor);
  texture.repeat.set(room.w / 64, room.h / 64);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(room.w * s, room.h * s), new THREE.MeshStandardMaterial({ map:texture, roughness:0.82 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(room.w * s / 2, 0, room.h * s / 2);
  floor.name = 'interior:floor';
  root.add(floor);

  const materials = new Map<string, ThreeNamespace.MeshStandardMaterial>();
  const materialFor = (piece: InteriorPiece) => {
    const id = `${piece.color}|${piece.emissive ?? ''}`;
    let material = materials.get(id);
    if(!material){
      material = new THREE.MeshStandardMaterial({ color:piece.color, roughness:0.7, ...(piece.emissive ? { emissive:piece.emissive, emissiveIntensity:1.1 } : {}) });
      materials.set(id, material);
    }
    return material;
  };
  const furniture = new THREE.Group();
  furniture.name = 'interior:furniture';
  layout.pieces.forEach(piece => furniture.add(pieceMesh(THREE, piece, materialFor(piece))));
  // LEGAL: The Blender furniture (art/blender/furniture.py), each piece in room units like the rest,
  // LEGAL: or its plain shapes when the model hasn't loaded.
  const fixtureMaterials = localMaterials(THREE);
  layout.fixtures.forEach(function(item){
    const model = placeModel(item.model);
    if(!model){ item.fallback.forEach(piece => furniture.add(pieceMesh(THREE, piece, materialFor(piece)))); return; }
    const g = new THREE.Group();
    addPlaceModel(THREE, g, model, fixtureMaterials, `interior:${item.model}`, item.recolour);
    g.position.set(item.x * s, item.y * s, item.z * s);
    g.rotation.y = item.turn;
    g.scale.set(item.scale[0] * s, item.scale[1] * s, item.scale[2] * s);
    furniture.add(g);
  });
  if(build.merge) mergeMeshesWithin(THREE, furniture, build.merge);
  root.add(furniture);

  // LEGAL: People and cars come from the shared character and vehicle libraries (people are animated
  // LEGAL: by it, cars share their geometry), so they're kept apart from what this room disposes.
  const people = new THREE.Group();
  people.name = 'interior:people';
  layout.cars.forEach(function(car){
    const model = build.makeCar(car);
    if(!model) return;
    model.position.set(car.x * s, car.use === 'showroom' ? 4 * s : 0, car.z * s);
    model.rotation.y = -car.heading;
    people.add(model);
  });
  layout.people.forEach(function(person){
    const figure = build.makePerson(person.identity, person.coat);
    figure.position.set(person.x * s, 0, person.z * s);
    figure.rotation.y = -person.facing + Math.PI / 2;
    people.add(figure);
  });
  root.add(people);

  const walkers = layout.walkers.map(function(walker){
    const figure = build.makePerson(walker.identity, walker.coat);
    figure.scale.setScalar(walker.scale);
    people.add(figure);
    const legs = walker.path.map((p, i) => { const q = walker.path[(i + 1) % walker.path.length]; return Math.hypot(q.x - p.x, q.z - p.z); });
    const length = legs.reduce((a, b) => a + b, 0);
    return { walker, figure, legs, length, along:walker.offset * length };
  });
  const placeWalker = (entry: typeof walkers[number]) => {
    let d = entry.along % entry.length, i = 0;
    while(d > entry.legs[i]){ d -= entry.legs[i]; i++; }
    const a = entry.walker.path[i], b = entry.walker.path[(i + 1) % entry.walker.path.length];
    const t = entry.legs[i] ? d / entry.legs[i] : 0;
    entry.figure.position.set((a.x + (b.x - a.x) * t) * s, 0, (a.z + (b.z - a.z) * t) * s);
    entry.figure.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x) + Math.PI / 2;
  };
  walkers.forEach(placeWalker);

  // LEGAL: A ring on the floor where you stand to use each hotspot, and its name above the thing.
  const rings = new Map<string, ThreeNamespace.Mesh>();
  const ringGeometry = new THREE.RingGeometry(10, 13, 40);
  ringGeometry.rotateX(-Math.PI / 2);
  const addRing = (keyName: string, x: number, z: number, color: string) => {
    const ring = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.4, depthWrite:false }));
    ring.position.set(x * s, 0.5, z * s);
    ring.name = `interior:ring:${keyName}`;
    rings.set(keyName, ring);
    root.add(ring);
  };
  build.spots.forEach(function(spot, index){
    addRing(spotKey(index), spot.x, spot.y, '#d4a017');
    const label = labelSprite(THREE, spot.label);
    label.position.set(spot.x * s, 56, (spot.y - 30) * s);
    label.name = `interior:label:${spot.id}`;
    root.add(label);
  });
  if(build.door) addRing('door', build.door.x, build.door.y, '#5ad1ff');

  if(build.door){
    const exitLabel = labelSprite(THREE, 'Exit');
    exitLabel.position.set(build.door.x * s, 18, (room.h + 10) * s);
    exitLabel.scale.set(30, 7.5, 1);
    root.add(exitLabel);
  }

  return {
    root,
    solids:layout.solids,
    setHighlight(keyName, time){
      rings.forEach(function(ring, name){
        const on = name === keyName;
        (ring.material as ThreeNamespace.MeshBasicMaterial).opacity = on ? 0.95 : 0.35;
        ring.scale.setScalar(on ? 1.12 + Math.sin(time * 6) * 0.06 : 1);
      });
    },
    tick(dt){
      walkers.forEach(function(entry){ entry.along = (entry.along + entry.walker.speed * dt) % entry.length; placeWalker(entry); });
    },
    dispose(){
      root.remove(people);
      root.traverse(function(node){
        const mesh = node as ThreeNamespace.Mesh;
        if(mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as (ThreeNamespace.Material & { map?: ThreeNamespace.Texture | null }) | undefined;
        if(material){ material.map?.dispose(); material.dispose(); }
      });
    },
  };
}
