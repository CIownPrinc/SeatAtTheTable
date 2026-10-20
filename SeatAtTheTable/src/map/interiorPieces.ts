import type { Solid } from '../config/types';
import type { FurnitureName } from '../world/assets/places';

// LEGAL: The vocabulary rooms are built from, as plain data in room units: x across the room and z
// LEGAL: from the back wall (0) to the door. Shared by the room layouts (map/interiorLayout.ts,
// LEGAL: map/mallInterior.ts) and turned into meshes by map/interiorRoom3d.ts.
export interface InteriorSpot { id: string; x: number; y: number; label: string; icon: string }

export interface InteriorPiece {
  shape: 'box' | 'cyl' | 'sphere';
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  // LEGAL: Height of the piece's base above the floor.
  y: number;
  color: string;
  emissive?: string;
  // LEGAL: A cylinder stands up (y) unless it faces the room (z), like a vault door on the wall.
  axis?: 'y' | 'z';
}

export interface InteriorPerson { x: number; z: number; facing: number; identity: string; coat: string }

// LEGAL: A real car model stands here: yours in the garage, the brand's on a showroom floor.
export interface InteriorCar { x: number; z: number; heading: number; color: string; use: 'garage' | 'showroom' | 'bay' }

// LEGAL: Someone walking a loop round the room, starting `offset` (0-1) of the way along it.
// LEGAL: `scale` under 1 is a child.
export interface InteriorWalker { path: Array<{ x: number; z: number }>; speed: number; offset: number; identity: string; coat: string; scale: number }

// LEGAL: A Blender piece of furniture (art/blender/furniture.py) standing at (x, z), turned and
// LEGAL: stretched to fit, some parts recoloured for the room. `fallback` is the same thing in plain
// LEGAL: shapes, drawn when the model hasn't loaded (and in unit tests).
export interface InteriorFixture {
  model: FurnitureName;
  x: number;
  z: number;
  y: number;
  turn: number;
  scale: [number, number, number];
  recolour: Record<string, string>;
  fallback: InteriorPiece[];
}
export function fixture(model: FurnitureName, x: number, z: number, fallback: InteriorPiece[], opts: { y?: number; turn?: number; scale?: [number, number, number]; recolour?: Record<string, string> } = {}): InteriorFixture {
  return { model, x, z, y:opts.y ?? 0, turn:opts.turn ?? 0, scale:opts.scale ?? [1, 1, 1], recolour:opts.recolour ?? {}, fallback };
}

// LEGAL: Everything one hotspot or one stretch of decor adds to a room.
export interface Prop { pieces: InteriorPiece[]; people: InteriorPerson[]; solids: Solid[]; cars?: InteriorCar[]; walkers?: InteriorWalker[]; fixtures?: InteriorFixture[] }

export const WALL_HEIGHT = 80;
export const PERSON_FACING_DOOR = Math.PI / 2;

export function box(x: number, z: number, w: number, d: number, h: number, color: string, y = 0, emissive?: string): InteriorPiece {
  return { shape:'box', x, z, w, d, h, y, color, emissive };
}
export function cyl(x: number, z: number, r: number, h: number, color: string, y = 0, emissive?: string): InteriorPiece {
  return { shape:'cyl', x, z, w:r * 2, d:r * 2, h, y, color, emissive };
}
export function ball(x: number, z: number, r: number, color: string, y = 0, emissive?: string): InteriorPiece {
  return { shape:'sphere', x, z, w:r * 2, d:r * 2, h:r * 2, y, color, emissive };
}
export function solidOf(x: number, z: number, w: number, d: number): Solid { return { x, y:z, hw:w / 2, hd:d / 2 }; }
// LEGAL: The solid under a piece that stands on the floor.
export function solidUnder(piece: InteriorPiece): Solid { return solidOf(piece.x, piece.z, piece.w, piece.d); }
