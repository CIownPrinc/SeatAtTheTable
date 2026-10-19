import type * as ThreeNamespace from 'three';

// LEGAL: The game's own figure: long coat, round head, small feet. That silhouette is the
// LEGAL: style the player wanted kept; what it lacked was hair on top of the head (it was modelled
// LEGAL: upside down, a bowl inside the skull), a face, and any movement at all. Every piece is
// LEGAL: a swappable wardrobe slot so the player can dress Arjun, and strangers vary the same way.
export const WARDROBE = {
  top: ['longcoat', 'jacket', 'hoodie', 'suit'],
  hair: ['short', 'slick', 'buzz', 'long', 'bald'],
  hat: ['none', 'flatcap', 'fedora', 'beanie'],
  extra: ['none', 'glasses', 'chain'],
} as const;

export interface PersonLook {
  top: typeof WARDROBE.top[number];
  hair: typeof WARDROBE.hair[number];
  hat: typeof WARDROBE.hat[number];
  extra: typeof WARDROBE.extra[number];
  skin: string;
  hairColor: string;
  topColor: string;
  shirtColor: string;
  pantsColor: string;
  shoeColor: string;
}

export const SKIN_TONES = ['#f1d0b0', '#e0b48f', '#c99168', '#a8714c', '#7f5236', '#5c3a26'];
export const HAIR_COLORS = ['#141210', '#3a2618', '#6b4426', '#a8763e', '#c9c2b4'];
export const CLOTH_COLORS = ['#1d2028', '#2b2f3a', '#3a3f4b', '#f0efe8', '#7a2630', '#3f5a3a', '#2f4a6a', '#5a3f2f', '#d4a017', '#6b6f78'];

export const DEFAULT_PLAYER_LOOK: PersonLook = {
  top:'longcoat', hair:'slick', hat:'none', extra:'none',
  skin:'#a8714c', hairColor:'#141210',
  topColor:'#2b2f3a', shirtColor:'#7a2630', pantsColor:'#1d2028', shoeColor:'#111217',
};

const HEX = /^#[0-9a-f]{6}$/i;

// LEGAL: Saves outlive code. A look from an older save (or a hand-edited one) keeps every valid
// LEGAL: piece and falls back to the default for anything this version doesn't know.
export function normalizeLook(raw: Record<string, unknown> | null | undefined): PersonLook {
  const look: PersonLook = { ...DEFAULT_PLAYER_LOOK };
  if(!raw) return look;
  (Object.keys(WARDROBE) as Array<keyof typeof WARDROBE>).forEach(function(slot){
    const value = raw[slot];
    if(typeof value === 'string' && (WARDROBE[slot] as readonly string[]).includes(value)) (look as unknown as Record<string, string>)[slot] = value;
  });
  (['skin', 'hairColor', 'topColor', 'shirtColor', 'pantsColor', 'shoeColor'] as const).forEach(function(slot){
    const value = raw[slot];
    if(typeof value === 'string' && HEX.test(value)) look[slot] = value;
  });
  return look;
}

function hashString(text: string): number {
  let hash = 2166136261;
  for(let i = 0; i < text.length; i++){ hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function pick<T>(items: readonly T[], seed: number, salt: number): T {
  return items[(Math.imul(seed ^ salt, 2654435761) >>> 0) % items.length];
}

// LEGAL: `coat` is the colour the caller already gives each actor (gold for inducted crew and
// LEGAL: dealers), so the meaning of that colour survives the new figure.
export function lookForStranger(identity: string, coat: string): PersonLook {
  const seed = hashString(identity);
  return {
    top: pick(WARDROBE.top, seed, 1),
    hair: pick(WARDROBE.hair, seed, 2),
    // LEGAL: Most people go bareheaded; a hat on everyone reads as a costume party.
    hat: pick(['none', 'none', 'none', 'flatcap', 'fedora', 'beanie'] as const, seed, 3),
    extra: pick(['none', 'none', 'none', 'none', 'glasses', 'chain'] as const, seed, 4),
    skin: pick(SKIN_TONES, seed, 5),
    hairColor: pick(HAIR_COLORS, seed, 6),
    topColor: HEX.test(coat) ? coat : pick(CLOTH_COLORS, seed, 7),
    shirtColor: pick(CLOTH_COLORS, seed, 8),
    pantsColor: pick(['#1d2028', '#202c35', '#2e2b28', '#273126', '#3a3f4b', '#4a4f5a'], seed, 9),
    shoeColor: pick(['#111217', '#2a1d14', '#3a3f4b'], seed, 10),
  };
}

export interface PersonParts {
  geometry(key: string, make: () => ThreeNamespace.BufferGeometry): ThreeNamespace.BufferGeometry;
  material(color: string, kind?: 'cloth' | 'skin' | 'shiny' | 'eye'): ThreeNamespace.Material;
}

// LEGAL: One cache per scene: every person shares the same few dozen geometries and one material
// LEGAL: per colour, so fifty people cost little more GPU memory than one.
export function createPersonParts(THREE: typeof ThreeNamespace): PersonParts {
  const geometries = new Map<string, ThreeNamespace.BufferGeometry>();
  const materials = new Map<string, ThreeNamespace.Material>();
  return {
    geometry(key, make){
      let geometry = geometries.get(key);
      if(!geometry){ geometry = make(); geometries.set(key, geometry); }
      return geometry;
    },
    material(color, kind = 'cloth'){
      const key = `${kind}:${color}`;
      let material = materials.get(key);
      if(!material){
        const settings = { cloth:{ roughness:0.82, metalness:0.02 }, skin:{ roughness:0.62, metalness:0 }, shiny:{ roughness:0.3, metalness:0.75 }, eye:{ roughness:0.25, metalness:0 } }[kind];
        material = new THREE.MeshStandardMaterial({ color, ...settings });
        materials.set(key, material);
      }
      return material;
    },
  };
}

export interface PersonRig {
  upper: ThreeNamespace.Group;
  legLeft: ThreeNamespace.Group;
  legRight: ThreeNamespace.Group;
  armLeft: ThreeNamespace.Group;
  armRight: ThreeNamespace.Group;
  // LEGAL: Everything above the neck, pivoting at the neck: scale it for the big-head cheat.
  head: ThreeNamespace.Group;
  // LEGAL: How far into a run the body is (0 standing, 1 full sprint), eased between frames.
  effort: number;
}

const HIP_Y = 11;
const SHOULDER_Y = 24.2;
const HEAD_Y = 32.2;
const HEAD_R = 6;
const NECK_Y = 28.5;

export function buildPerson(THREE: typeof ThreeNamespace, parts: PersonParts, look: PersonLook): { root: ThreeNamespace.Group; rig: PersonRig } {
  const root = new THREE.Group();
  const upper = new THREE.Group();
  root.add(upper);
  const cloth = (color: string) => parts.material(color, 'cloth');
  const skin = parts.material(look.skin, 'skin');

  function mesh(name: string, key: string, make: () => ThreeNamespace.BufferGeometry, material: ThreeNamespace.Material, parent: ThreeNamespace.Object3D, x: number, y: number, z: number, shadow = true): ThreeNamespace.Mesh {
    const m = new THREE.Mesh(parts.geometry(key, make), material);
    m.name = name;
    m.position.set(x, y, z);
    m.castShadow = shadow;
    parent.add(m);
    return m;
  }

  // LEGAL: Legs hang from a hip pivot so a single rotation swings the whole leg and shoe.
  const legs = [-1, 1].map(function(side){
    const pivot = new THREE.Group();
    pivot.position.set(side * 2.8, HIP_Y, 0);
    root.add(pivot);
    mesh('leg', 'leg', () => new THREE.CapsuleGeometry(2.15, 7.4, 4, 8), cloth(look.pantsColor), pivot, 0, -5.4, 0);
    mesh('shoe', 'shoe', () => new THREE.BoxGeometry(4.6, 2.2, 7.6), cloth(look.shoeColor), pivot, 0, -10.1, 1.5);
    return pivot;
  });

  // LEGAL: The top. A long coat flares to the knee, which is what gave the old figure its shape.
  const topMat = cloth(look.topColor);
  const shirtMat = cloth(look.shirtColor);
  if(look.top === 'longcoat'){
    mesh('top', 'top:longcoat', () => new THREE.CylinderGeometry(5.5, 7.6, 18, 12), topMat, upper, 0, 16.6, 0);
  } else if(look.top === 'hoodie'){
    mesh('top', 'top:hoodie', () => new THREE.CylinderGeometry(5.7, 6.4, 13.5, 12), topMat, upper, 0, 18.4, 0);
    const hood = mesh('hood', 'hood', () => new THREE.TorusGeometry(3.6, 1.6, 6, 12), topMat, upper, 0, 25.6, -1.6);
    hood.rotation.x = Math.PI / 2;
  } else {
    // LEGAL: Jacket and suit: cut at the hip, with the trousers showing below.
    mesh('top', 'top:jacket', () => new THREE.CylinderGeometry(5.6, 6.6, 13, 12), topMat, upper, 0, 18.7, 0);
  }
  if(look.top !== 'hoodie'){
    // LEGAL: The shirt shows in a V down the front of the coat.
    const shirt = mesh('shirt', 'shirt', () => new THREE.CylinderGeometry(0.01, 3.3, 9, 3, 1), shirtMat, upper, 0, 21.4, 4.85, false);
    shirt.rotation.set(Math.PI, Math.PI / 6, 0);
    shirt.scale.z = 0.25;
  }
  if(look.top === 'suit'){
    mesh('tie', 'tie', () => new THREE.BoxGeometry(1.2, 6.5, 0.6), parts.material('#7a1f26'), upper, 0, 21, 5.6, false);
  }

  // LEGAL: Arms hang from shoulder pivots, in the coat's colour, with a hand at the end.
  const arms = [-1, 1].map(function(side){
    const pivot = new THREE.Group();
    pivot.position.set(side * 6.9, SHOULDER_Y, 0.2);
    pivot.rotation.z = side * 0.1;
    upper.add(pivot);
    mesh('arm', 'arm', () => new THREE.CapsuleGeometry(1.85, 10, 4, 8), topMat, pivot, 0, -6.2, 0);
    mesh('hand', 'hand', () => new THREE.SphereGeometry(2.05, 10, 8), skin, pivot, 0, -13.1, 0.3);
    return pivot;
  });

  mesh('neck', 'neck', () => new THREE.CylinderGeometry(2.3, 2.6, 3.4, 10), skin, upper, 0, 27.4, 0);
  const head = mesh('head', 'head', () => new THREE.SphereGeometry(HEAD_R, 18, 14), skin, upper, 0, HEAD_Y, 0);
  head.scale.set(1, 1.06, 1);
  [-1, 1].forEach(function(side){
    mesh('ear', 'ear', () => new THREE.SphereGeometry(1.25, 8, 6), skin, upper, side * 5.9, HEAD_Y - 0.4, -0.2, false).scale.set(0.6, 1, 0.9);
    // LEGAL: Eyes: a white with a dark pupil in front of it, so the face reads at map zoom.
    mesh(side < 0 ? 'eye-left' : 'eye-right', 'eye-white', () => new THREE.SphereGeometry(1.25, 10, 8), parts.material('#f4f1ea', 'eye'), upper, side * 2.25, HEAD_Y + 0.6, 5.05, false);
    mesh('pupil', 'pupil', () => new THREE.SphereGeometry(0.68, 8, 6), parts.material('#15130f', 'eye'), upper, side * 2.25, HEAD_Y + 0.55, 6.1, false);
    const brow = mesh('brow', 'brow', () => new THREE.BoxGeometry(2.6, 0.65, 0.8), parts.material(look.hairColor), upper, side * 2.3, HEAD_Y + 2.55, 5.25, false);
    brow.rotation.z = side * -0.12;
  });
  mesh('nose', 'nose', () => new THREE.SphereGeometry(1.05, 8, 6), skin, upper, 0, HEAD_Y - 0.9, 5.95, false).scale.set(1, 1.15, 1);
  mesh('mouth', 'mouth', () => new THREE.BoxGeometry(2.4, 0.45, 0.4), parts.material('#4a2a22'), upper, 0, HEAD_Y - 3.2, 5.45, false);

  // LEGAL: Hair is a cap over the crown, tipped back so it covers the back of the head and leaves
  // LEGAL: the forehead clear. Built as a separate group so a hat can sit on top of it.
  const hairMat = cloth(look.hairColor);
  if(look.hair !== 'bald'){
    const hair = new THREE.Group();
    hair.name = 'hair';
    hair.position.y = HEAD_Y;
    upper.add(hair);
    const capTheta = look.hair === 'buzz' ? 0.42 : 0.5;
    const cap = mesh('hair-cap', `hair:${look.hair}`, () => new THREE.SphereGeometry(HEAD_R + (look.hair === 'buzz' ? 0.2 : 0.55), 18, 10, 0, Math.PI * 2, 0, Math.PI * capTheta), hairMat, hair, 0, 0.35, 0);
    cap.rotation.x = -0.32;
    if(look.hair === 'slick') cap.scale.set(1, 0.92, 1.06);
    if(look.hair === 'long'){
      mesh('hair-back', 'hair:long-back', () => new THREE.BoxGeometry(10.4, 9, 3), hairMat, hair, 0, -3.6, -4.3);
    }
  }

  if(look.hat !== 'none'){
    const hat = new THREE.Group();
    hat.name = `hat:${look.hat}`;
    hat.position.y = HEAD_Y + HEAD_R * 0.72;
    upper.add(hat);
    if(look.hat === 'fedora'){
      mesh('hat-crown', 'hat:fedora-crown', () => new THREE.CylinderGeometry(4.6, 5.3, 4.8, 14), cloth('#2a2620'), hat, 0, 2.2, 0);
      mesh('hat-brim', 'hat:fedora-brim', () => new THREE.CylinderGeometry(8.6, 8.6, 0.6, 18), cloth('#2a2620'), hat, 0, 0, 0);
      mesh('hat-band', 'hat:fedora-band', () => new THREE.CylinderGeometry(5.35, 5.35, 1.1, 14), cloth('#7a2630'), hat, 0, 0.9, 0, false);
    } else if(look.hat === 'flatcap'){
      mesh('hat-crown', 'hat:flatcap', () => new THREE.CylinderGeometry(6.2, 6.5, 2.2, 14), cloth(look.topColor), hat, 0, 0.6, 0);
      mesh('hat-brim', 'hat:flatcap-brim', () => new THREE.BoxGeometry(7, 0.6, 3.6), cloth(look.topColor), hat, 0, -0.1, 6.2);
    } else {
      mesh('hat-crown', 'hat:beanie', () => new THREE.SphereGeometry(6.55, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), cloth(look.shirtColor), hat, 0, -1.4, -0.2);
      mesh('hat-band', 'hat:beanie-band', () => new THREE.CylinderGeometry(6.65, 6.65, 1.8, 16), cloth(look.shirtColor), hat, 0, -1.2, -0.2);
    }
  }

  if(look.extra === 'glasses'){
    const glasses = new THREE.Group();
    glasses.name = 'extra:glasses';
    upper.add(glasses);
    const frame = parts.material('#141414', 'shiny');
    [-1, 1].forEach(function(side){
      mesh('lens', 'glasses:lens', () => new THREE.TorusGeometry(1.55, 0.32, 6, 14), frame, glasses, side * 2.3, HEAD_Y + 0.6, 6.25, false);
    });
    mesh('bridge', 'glasses:bridge', () => new THREE.BoxGeometry(1.4, 0.35, 0.35), frame, glasses, 0, HEAD_Y + 0.8, 6.3, false);
  } else if(look.extra === 'chain'){
    const chain = mesh('extra:chain', 'chain', () => new THREE.TorusGeometry(3.4, 0.45, 6, 18), parts.material('#d4a017', 'shiny'), upper, 0, 25.2, 1.1, false);
    chain.rotation.x = Math.PI / 2 - 0.35;
  }

  const headPivot = new THREE.Group();
  headPivot.name = 'head-pivot';
  headPivot.position.y = NECK_Y;
  const headParts = upper.children.filter(child => child.name === 'extra:glasses' || (child.name !== 'extra:chain' && child.position.y > NECK_Y));
  headParts.forEach(function(child){ upper.remove(child); child.position.y -= NECK_Y; headPivot.add(child); });
  upper.add(headPivot);

  return { root, rig: { upper, legLeft:legs[0], legRight:legs[1], armLeft:arms[0], armRight:arms[1], head:headPivot, effort:0 } };
}

// LEGAL: Ground covered per step, walking and sprinting. Phase advances by distance, not time, so
// LEGAL: feet stay planted at any speed instead of skating.
const WALK_STEP = 15;
const RUN_STEP = 38;
const RUN_SPEED = 140;

// LEGAL: One frame of procedural walk cycle. Returns the new stride phase for the caller to keep.
export function animatePerson(rig: PersonRig, phase: number, speed: number, dt: number, time: number): number {
  const targetEffort = Math.min(1, speed / RUN_SPEED);
  rig.effort += (targetEffort - rig.effort) * (1 - Math.exp(-8 * dt));
  const moving = speed > 4;
  const step = WALK_STEP + (RUN_STEP - WALK_STEP) * rig.effort;
  const nextPhase = moving ? phase + (speed * dt / step) * Math.PI : phase;
  // LEGAL: Swing fades out as the body slows, so stopping eases the limbs home.
  const swing = moving ? 0.42 + 0.5 * rig.effort : 0;
  const ease = 1 - Math.exp(-12 * dt);
  const legAngle = Math.sin(nextPhase) * swing;
  rig.legLeft.rotation.x += (legAngle - rig.legLeft.rotation.x) * ease;
  rig.legRight.rotation.x += (-legAngle - rig.legRight.rotation.x) * ease;
  rig.armLeft.rotation.x += (-legAngle * 0.9 - rig.armLeft.rotation.x) * ease;
  rig.armRight.rotation.x += (legAngle * 0.9 - rig.armRight.rotation.x) * ease;
  // LEGAL: Bob twice per stride, lean forward into a run, breathe when standing still.
  const bob = moving ? Math.abs(Math.cos(nextPhase)) * (0.5 + 1.1 * rig.effort) : Math.sin(time * 2.2) * 0.18;
  rig.upper.position.y += (bob - rig.upper.position.y) * ease;
  const lean = 0.03 + 0.17 * rig.effort * (moving ? 1 : 0);
  rig.upper.rotation.x += (lean - rig.upper.rotation.x) * ease;
  return nextPhase % (Math.PI * 2);
}
