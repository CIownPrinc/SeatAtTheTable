import type * as ThreeNamespace from 'three';
import { addPlaceModel, localMaterials, placeModel } from './placeModels';

// LEGAL: The minigames' 3D views. Each owns a small renderer on its own canvas while the game is
// LEGAL: open, the same way the wardrobe preview does, so the map's renderer and scene are never
// LEGAL: touched. Units are tenths of a metre: the rim is 3.05 m up, so at y = 30.5.

type Three = typeof ThreeNamespace;

interface View { renderer: ThreeNamespace.WebGLRenderer; scene: ThreeNamespace.Scene; camera: ThreeNamespace.PerspectiveCamera }

function createView(THREE: Three, canvas: HTMLCanvasElement, background: string, fov: number): View {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(canvas.width, canvas.height, false);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  const camera = new THREE.PerspectiveCamera(fov, canvas.width / canvas.height, 0.5, 2000);
  return { renderer, scene, camera };
}

function disposeView(view: View): void {
  view.scene.traverse(function(node){
    const mesh = node as ThreeNamespace.Mesh;
    if(mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material as (ThreeNamespace.Material & { map?: ThreeNamespace.Texture | null }) | undefined;
    if(material){ material.map?.dispose(); material.dispose(); }
  });
  view.renderer.dispose();
}

function canvasTexture(THREE: Three, size: number, paint: (ctx: CanvasRenderingContext2D, size: number) => void): ThreeNamespace.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  paint(canvas.getContext('2d')!, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// LEGAL: A Blender set piece (art/blender/furniture.py) added to a scene, if it has loaded.
function addSetPiece(THREE: Three, scene: ThreeNamespace.Scene, name: 'hoop' | 'chess-table'): boolean {
  const model = placeModel(name);
  if(!model) return false;
  const g = new THREE.Group();
  addPlaceModel(THREE, g, model, localMaterials(THREE), `minigame:${name}`);
  scene.add(g);
  return true;
}

function addLights(THREE: Three, scene: ThreeNamespace.Scene): void {
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x40503a, 1.8));
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.8);
  sun.position.set(40, 90, 60);
  scene.add(sun);
}

// LEGAL: ---------- the court ----------

export type ShotResult = 'swish' | 'in-off-rim' | 'rim-out' | 'short' | 'long';

export interface CourtScene {
  // LEGAL: Throws the ball and calls back when it has landed.
  shoot(result: ShotResult, onLanded: () => void): void;
  dispose(): void;
}

const RIM = { y:30.5, z:0, r:2.3 };
const HANDS: [number, number, number] = [0.8, 15.5, 44];

function addSimpleHoop(THREE: Three, scene: ThreeNamespace.Scene): void {
  const metal = new THREE.MeshStandardMaterial({ color:'#3a3d44', roughness:0.5, metalness:0.5 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 36, 12), metal);
  pole.position.set(0, 18, -14);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 12), metal);
  arm.position.set(0, 34, -8);
  const board = new THREE.Mesh(new THREE.BoxGeometry(18, 10.5, 0.6), new THREE.MeshStandardMaterial({ color:'#f4f4f0', roughness:0.4 }));
  board.position.set(0, 34, -2);
  const square = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.5), new THREE.MeshBasicMaterial({ color:'#d4693a' }));
  square.position.set(0, 33, -1.65);
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.5), new THREE.MeshBasicMaterial({ color:'#f4f4f0' }));
  inner.position.set(0, 33.2, -1.6);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RIM.r, 0.22, 8, 32), new THREE.MeshStandardMaterial({ color:'#d4693a', roughness:0.4, metalness:0.4 }));
  rim.rotation.x = Math.PI / 2; rim.position.set(0, RIM.y, RIM.z);
  const net = new THREE.Mesh(new THREE.CylinderGeometry(RIM.r, 1.4, 4.4, 12, 3, true), new THREE.MeshBasicMaterial({ color:'#f0efe8', wireframe:true, transparent:true, opacity:0.8 }));
  net.position.set(0, RIM.y - 2.2, RIM.z);
  scene.add(pole, arm, board, square, inner, rim, net);
}

export function createCourtScene(THREE: Three, canvas: HTMLCanvasElement): CourtScene {
  const view = createView(THREE, canvas, '#9cc4e4', 52);
  const { scene, camera } = view;
  addLights(THREE, scene);
  camera.position.set(0, 17, 50);
  camera.lookAt(0, 26, 0);

  const floorTexture = canvasTexture(THREE, 512, function(ctx, size){
    ctx.fillStyle = '#b07a48'; ctx.fillRect(0, 0, size, size);
    for(let i = 0; i < size; i += 16){ ctx.fillStyle = i % 32 ? '#a87244' : '#b8824e'; ctx.fillRect(0, i, size, 15); }
  });
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map:floorTexture, roughness:0.7 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = 30;
  scene.add(floor);
  // LEGAL: The painted key and the free-throw line you're standing on.
  const paint = new THREE.Mesh(new THREE.PlaneGeometry(49, 58), new THREE.MeshStandardMaterial({ color:'#7a2630', roughness:0.8 }));
  paint.rotation.x = -Math.PI / 2; paint.position.set(0, 0.05, 23);
  scene.add(paint);
  const line = new THREE.Mesh(new THREE.PlaneGeometry(49, 0.8), new THREE.MeshBasicMaterial({ color:'#f0efe8' }));
  line.rotation.x = -Math.PI / 2; line.position.set(0, 0.08, 46);
  scene.add(line);

  // LEGAL: Pole, backboard with its target square, the rim and the net: the Blender hoop once it's
  // LEGAL: loaded, plain shapes otherwise. Both put the rim where the ball's flight aims (RIM).
  if(!addSetPiece(THREE, scene, 'hoop')) addSimpleHoop(THREE, scene);

  // LEGAL: Chain-link fence round the court, with the city behind it.
  const fenceTexture = canvasTexture(THREE, 128, function(ctx, size){
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(200,205,210,0.75)'; ctx.lineWidth = 3;
    for(let i = -size; i < size * 2; i += 16){ ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + size, size); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i + size, 0); ctx.lineTo(i, size); ctx.stroke(); }
  });
  fenceTexture.wrapS = fenceTexture.wrapT = THREE.RepeatWrapping;
  fenceTexture.repeat.set(12, 3);
  const fence = new THREE.Mesh(new THREE.PlaneGeometry(200, 40), new THREE.MeshBasicMaterial({ map:fenceTexture, transparent:true, side:THREE.DoubleSide }));
  fence.position.set(0, 20, -30);
  scene.add(fence);
  [['#5a4a3e', -70, 60], ['#46516d', -35, 90], ['#6b5a48', 10, 70], ['#3e6b78', 50, 110], ['#5b5268', 85, 64]].forEach(function([color, x, h]){
    const block = new THREE.Mesh(new THREE.BoxGeometry(30, h as number, 20), new THREE.MeshStandardMaterial({ color:color as string, roughness:0.9 }));
    block.position.set(x as number, (h as number) / 2, -70);
    scene.add(block);
  });

  const ballTexture = canvasTexture(THREE, 256, function(ctx, size){
    ctx.fillStyle = '#d4682a'; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2); ctx.stroke();
    for(const x of [size * 0.25, size * 0.75]){ ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke(); }
  });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.2, 20, 14), new THREE.MeshStandardMaterial({ map:ballTexture, roughness:0.75 }));
  ball.position.set(...HANDS);
  scene.add(ball);

  // LEGAL: A flight is a list of legs, each a parabola from one point to the next.
  interface Leg { from: ThreeNamespace.Vector3; to: ThreeNamespace.Vector3; apex: number; seconds: number }
  let legs: Leg[] = [];
  let legStart = 0;
  let landed: (() => void) | null = null;
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  function flightFor(result: ShotResult): Leg[] {
    const start = v(...HANDS);
    const top = v(0, RIM.y + 0.4, RIM.z);
    const front = v(0, RIM.y + 0.6, RIM.z + RIM.r);
    const below = v(0, 0.2 + 1.2, RIM.z + 1);
    switch(result){
      case 'swish': return [{ from:start, to:top, apex:42, seconds:1 }, { from:top, to:below, apex:0, seconds:0.55 }];
      case 'in-off-rim': return [{ from:start, to:front, apex:41, seconds:0.95 }, { from:front, to:top, apex:RIM.y + 3, seconds:0.35 }, { from:top, to:below, apex:0, seconds:0.55 }];
      case 'rim-out': return [{ from:start, to:front, apex:41, seconds:0.95 }, { from:front, to:v(3, 1.2, 12), apex:RIM.y + 4, seconds:0.8 }];
      case 'short': return [{ from:start, to:v(0, 1.2, 8), apex:34, seconds:1 }, { from:v(0, 1.2, 8), to:v(0, 1.2, 22), apex:8, seconds:0.6 }];
      case 'long': return [{ from:start, to:v(0, 33, -1.2), apex:44, seconds:1 }, { from:v(0, 33, -1.2), to:v(-2, 1.2, 18), apex:34, seconds:0.8 }];
    }
  }

  let running = true;
  function frame(now: number): void {
    if(!running) return;
    if(legs.length){
      const leg = legs[0];
      const t = Math.min(1, (now - legStart) / 1000 / leg.seconds);
      const base = Math.max(leg.from.y, leg.to.y);
      const lift = Math.max(0, leg.apex - base);
      ball.position.lerpVectors(leg.from, leg.to, t);
      ball.position.y = leg.from.y + (leg.to.y - leg.from.y) * t + lift * 4 * t * (1 - t);
      ball.rotation.x -= 0.18;
      if(t >= 1){
        legs.shift();
        legStart = now;
        if(!legs.length){ const callback = landed; landed = null; window.setTimeout(function(){ ball.position.set(...HANDS); callback?.(); }, 250); }
      }
    }
    // LEGAL: A slight breathing sway, so it feels like standing at the line.
    camera.position.x = Math.sin(now / 900) * 0.4;
    camera.lookAt(0, 26, 0);
    view.renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    shoot(result, onLanded){
      if(legs.length) return;
      legs = flightFor(result);
      legStart = performance.now();
      landed = onLanded;
    },
    dispose(){ running = false; disposeView(view); },
  };
}

// LEGAL: ---------- the park chess table ----------

export interface ChessScene {
  setPosition(fen: string): void;
  dispose(): void;
}

const SQUARE = 6;

// LEGAL: Each piece is turned on a lathe from a profile (radius, height), the way real ones are.
const PROFILES: Record<string, Array<[number, number]>> = {
  p:[[2, 0], [2, 0.8], [1.2, 1.4], [0.8, 3.2], [1.3, 3.6], [0.6, 3.8], [1.2, 4.6], [1.1, 5.6], [0, 6]],
  r:[[2.2, 0], [2.2, 0.9], [1.5, 1.6], [1.3, 5], [1.9, 5.4], [1.9, 6.8], [0, 6.8]],
  b:[[2.2, 0], [2.2, 0.9], [1.3, 1.6], [0.9, 5], [1.4, 5.4], [0.7, 5.8], [1.3, 7], [0.5, 8.4], [0.4, 8.9], [0, 9]],
  q:[[2.3, 0], [2.3, 0.9], [1.4, 1.7], [0.9, 6], [1.6, 6.6], [1.1, 7.2], [1.7, 8.6], [0.6, 8.8], [0.5, 9.6], [0, 9.8]],
  k:[[2.3, 0], [2.3, 0.9], [1.4, 1.7], [1, 6.4], [1.7, 7], [1.2, 7.6], [1.5, 9], [0, 9.2]],
  n:[[2.2, 0], [2.2, 0.9], [1.4, 1.6], [1.2, 3], [0, 3]],
};

function pieceMesh(THREE: Three, type: string, material: ThreeNamespace.Material): ThreeNamespace.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.LatheGeometry(PROFILES[type].map(([r, y]) => new THREE.Vector2(r, y)), 20), material);
  g.add(body);
  if(type === 'n'){
    // LEGAL: The knight's head: a neck and a muzzle, leaning forward.
    const neck = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.2, 2.4), material);
    neck.position.set(0, 4.8, 0.2); neck.rotation.x = -0.25;
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 2.8), material);
    muzzle.position.set(0, 6.2, 1.4);
    g.add(neck, muzzle);
  }
  if(type === 'k'){
    const upright = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.5), material);
    upright.position.y = 10;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.5), material);
    bar.position.y = 10.2;
    g.add(upright, bar);
  }
  return g;
}

function addSimpleChessTable(THREE: Three, scene: ThreeNamespace.Scene): void {
  const stone = new THREE.MeshStandardMaterial({ color:'#9a958a', roughness:0.9 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(64, 3, 64), stone);
  top.position.y = -1.5;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(6, 8, 28, 16), stone);
  leg.position.y = -16;
  scene.add(top, leg);
  const light = new THREE.MeshStandardMaterial({ color:'#d8cfb8', roughness:0.6 });
  const dark = new THREE.MeshStandardMaterial({ color:'#5a4632', roughness:0.6 });
  for(let r = 0; r < 8; r++) for(let c = 0; c < 8; c++){
    const square = new THREE.Mesh(new THREE.BoxGeometry(SQUARE, 0.4, SQUARE), (r + c) % 2 === 0 ? light : dark);
    square.position.set((c - 3.5) * SQUARE, 0.2, (r - 3.5) * SQUARE);
    scene.add(square);
  }
}

export function createChessScene(THREE: Three, canvas: HTMLCanvasElement): ChessScene {
  const view = createView(THREE, canvas, '#a8c8a0', 40);
  const { scene, camera } = view;
  addLights(THREE, scene);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color:'#4f7a3e', roughness:1 }));
  grass.rotation.x = -Math.PI / 2; grass.position.y = -30;
  scene.add(grass);
  // LEGAL: The stone park table with the board inlaid in it: the Blender one, or plain shapes.
  if(!addSetPiece(THREE, scene, 'chess-table')) addSimpleChessTable(THREE, scene);
  const white = new THREE.MeshStandardMaterial({ color:'#efe6d2', roughness:0.45 });
  const black = new THREE.MeshStandardMaterial({ color:'#2a2a30', roughness:0.4 });
  const pieces = new THREE.Group();
  scene.add(pieces);

  let running = true;
  function frame(now: number): void {
    if(!running) return;
    // LEGAL: Seated at the white side, leaning in a little now and then.
    const sway = Math.sin(now / 2400);
    camera.position.set(sway * 6, 46 + Math.sin(now / 1700) * 1.5, 52);
    camera.lookAt(0, 0, 2);
    view.renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    setPosition(fen){
      pieces.children.slice().forEach(function(child){ pieces.remove(child); child.traverse(node => (node as ThreeNamespace.Mesh).geometry?.dispose()); });
      fen.split('/').forEach(function(row, r){
        for(let c = 0; c < 8; c++){
          const ch = row[c] ?? '.';
          const type = ch.toLowerCase();
          if(!PROFILES[type]) continue;
          const isWhite = ch !== type;
          const piece = pieceMesh(THREE, type, isWhite ? white : black);
          piece.position.set((c - 3.5) * SQUARE, 0.4, (r - 3.5) * SQUARE);
          // LEGAL: Knights face the other side of the board.
          piece.rotation.y = isWhite ? Math.PI : 0;
          pieces.add(piece);
        }
      });
    },
    dispose(){ running = false; disposeView(view); },
  };
}
