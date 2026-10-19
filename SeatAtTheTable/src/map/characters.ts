import type * as ThreeNamespace from 'three';
import { animatePerson, buildPerson, createPersonParts, lookForStranger, type PersonLook, type PersonRig } from './personModel';

// LEGAL: Everyone on the map, and the loop that animates them. Callers only move a person's root;
// LEGAL: each figure works out its own ground speed from how far it moved since last frame, so
// LEGAL: roaming walkers, dealers and the player all animate without their movement code knowing.
export interface CharacterAnimator {
  add(root: ThreeNamespace.Object3D, rig: PersonRig): void;
  tick(dt: number, time: number, focus?: { x: number; z: number }): void;
  count(): number;
}

// LEGAL: People beyond this distance from the player hold their pose; nobody can see their legs,
// LEGAL: and skipping them keeps a full street of walkers cheap on phones.
const ANIMATE_RADIUS = 1100;

interface Entry {
  root: ThreeNamespace.Object3D;
  rig: PersonRig;
  phase: number;
  speed: number;
  lastX: number;
  lastZ: number;
  // LEGAL: People are registered before they're added to the world, so only one that was placed
  // LEGAL: and then removed counts as gone.
  placed: boolean;
}

export function createCharacterAnimator(THREE: typeof ThreeNamespace): CharacterAnimator {
  const entries: Entry[] = [];
  const world = new THREE.Vector3();
  return {
    add(root, rig){
      entries.push({ root, rig, phase:0, speed:0, lastX:NaN, lastZ:NaN, placed:!!root.parent });
    },
    tick(dt, time, focus){
      for(let i = entries.length - 1; i >= 0; i--){
        const entry = entries[i];
        if(!entry.root.parent){
          if(entry.placed) entries.splice(i, 1);
          continue;
        }
        entry.placed = true;
        if(dt <= 0) continue;
        entry.root.getWorldPosition(world);
        const moved = Number.isNaN(entry.lastX) ? 0 : Math.hypot(world.x - entry.lastX, world.z - entry.lastZ) / dt;
        entry.lastX = world.x; entry.lastZ = world.z;
        // LEGAL: Smoothed, so one frame of collision stall doesn't flicker the legs to standing.
        entry.speed += (Math.min(moved, 600) - entry.speed) * (1 - Math.exp(-14 * dt));
        if(focus && Math.hypot(world.x - focus.x, world.z - focus.z) > ANIMATE_RADIUS) continue;
        entry.phase = animatePerson(entry.rig, entry.phase, entry.speed, dt, time + i * 0.37);
      }
    },
    count(){ return entries.length; },
  };
}

export interface CharacterLibrary {
  // LEGAL: A person whose feet sit at y=0 and who faces +Z. `coat` is the actor's colour (gold
  // LEGAL: marks inducted crew and dealers); 'arjun' is dressed from the player's wardrobe.
  create(identity: string, coat: string): ThreeNamespace.Group;
  animator: CharacterAnimator;
}

export function createCharacterLibrary(THREE: typeof ThreeNamespace, playerLook: () => PersonLook): CharacterLibrary {
  const parts = createPersonParts(THREE);
  const animator = createCharacterAnimator(THREE);
  return {
    animator,
    create(identity, coat){
      const look = identity === 'arjun' ? playerLook() : lookForStranger(identity, coat);
      const person = buildPerson(THREE, parts, look);
      person.root.name = `character:${identity}`;
      animator.add(person.root, person.rig);
      return person.root;
    },
  };
}
