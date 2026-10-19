import type { Solid } from '../config/types';

import { PERSON_FACING_DOOR, WALL_HEIGHT, box, cyl, solidOf, type InteriorCar, type InteriorPerson, type InteriorPiece, type InteriorSpot, type InteriorWalker, type Prop } from './interiorPieces';
import { mallDecor, mallSpotProp } from './mallInterior';

export type { InteriorCar, InteriorPerson, InteriorPiece, InteriorSpot, InteriorWalker } from './interiorPieces';

// LEGAL: What stands in each room: furniture, people and cars, keyed by the kind of room and its
// LEGAL: hotspots. The room used to be a top-down 2D sketch with an emoji per hotspot; now every
// LEGAL: hotspot is a real thing (a counter with a clerk behind it, a board you can read, a safe),
// LEGAL: and the furniture blocks you. map/interiorRoom3d.ts turns this into meshes.
export type FloorPattern = 'wood' | 'tile' | 'marble' | 'carpet' | 'concrete';

export interface InteriorLayout {
  floor: FloorPattern;
  floorColor: string;
  wallColor: string;
  trimColor: string;
  pieces: InteriorPiece[];
  people: InteriorPerson[];
  cars: InteriorCar[];
  walkers: InteriorWalker[];
  // LEGAL: In the same room units the player moves in.
  solids: Solid[];
}

export interface RoomSize { w: number; h: number; door: { x: number } }

export { WALL_HEIGHT };
export const FRONT_WALL_HEIGHT = 9;
export const DOOR_WIDTH = 64;

interface Look { floor: FloorPattern; floorColor: string; wallColor: string; trimColor: string; accent: string; wood: string }

const LOOKS: Record<string, Look> = {
  venture:      { floor:'wood',     floorColor:'#5a4330', wallColor:'#4a3a2c', trimColor:'#2a2018', accent:'#7c3540', wood:'#6b4a2c' },
  local:        { floor:'wood',     floorColor:'#8a6a48', wallColor:'#c9b48e', trimColor:'#5a4128', accent:'#c98a2b', wood:'#7a5532' },
  bankHome:     { floor:'marble',   floorColor:'#d8d4ca', wallColor:'#b9b3a4', trimColor:'#5c5446', accent:'#c9b26b', wood:'#5a4a3a' },
  heist:        { floor:'concrete', floorColor:'#5a6068', wallColor:'#3c434c', trimColor:'#22272e', accent:'#d4a017', wood:'#3a4048' },
  playerGarage: { floor:'concrete', floorColor:'#6a6e74', wallColor:'#8a8478', trimColor:'#3a3832', accent:'#c0392b', wood:'#6b4a2c' },
  dealership:   { floor:'tile',     floorColor:'#d6d8dc', wallColor:'#e8e6e0', trimColor:'#3e6b78', accent:'#3e6b78', wood:'#4a5058' },
  respray:      { floor:'concrete', floorColor:'#6c7076', wallColor:'#7c8288', trimColor:'#2e3238', accent:'#2f8f6a', wood:'#4a4f56' },
  brokerage:    { floor:'carpet',   floorColor:'#4c5a54', wallColor:'#d9d3c6', trimColor:'#4a4356', accent:'#5a7c6b', wood:'#6a4a32' },
  cityhall:     { floor:'marble',   floorColor:'#cfc9bb', wallColor:'#c2baa6', trimColor:'#4e4638', accent:'#c9b26b', wood:'#5a4632' },
  casino:       { floor:'carpet',   floorColor:'#6a1e28', wallColor:'#3a1a22', trimColor:'#c9a227', accent:'#d4a017', wood:'#4a2a1c' },
  mall:         { floor:'marble',   floorColor:'#e4dfd4', wallColor:'#e8e2d6', trimColor:'#8a7a62', accent:'#c9a227', wood:'#6a4a32' },
  missionOffice:{ floor:'wood',     floorColor:'#6e5440', wallColor:'#a89a84', trimColor:'#3e3226', accent:'#d4a017', wood:'#5c4330' },
};
const DEFAULT_LOOK = LOOKS.venture;

export function lookFor(kind: string): Look { return LOOKS[kind] ?? DEFAULT_LOOK; }

// LEGAL: Everything a hotspot is: the thing you walk up to, and who stands behind it. A hotspot's
// LEGAL: point is where you stand, so its prop sits just behind it, toward the back wall.

function counter(x: number, z: number, w: number, look: Look, top = '#e0d6bf'): InteriorPiece[] {
  return [box(x, z, w, 22, 24, look.wood), box(x, z, w + 4, 26, 3, top, 24)];
}
function staffBehind(x: number, z: number, identity: string, coat: string): InteriorPerson {
  return { x, z, facing:PERSON_FACING_DOOR, identity, coat };
}

function deskProp(spot: InteriorSpot, look: Look, refId: string, width = 96, extras: InteriorPiece[] = []): Prop {
  const z = spot.y - 26;
  return {
    pieces:[...counter(spot.x, z, width, look), ...extras],
    people:[staffBehind(spot.x, z - 26, `${refId}:${spot.id}`, look.accent)],
    solids:[solidOf(spot.x, z, width + 4, 26)],
  };
}

function boardProp(spot: InteriorSpot, look: Look): Prop {
  const z = spot.y - 26;
  const papers = ['#f1ead2', '#e8c46a', '#9ec3d6', '#f0a8a0', '#ffffff', '#c8e0a4'];
  const pieces = [
    box(spot.x - 32, z, 4, 4, 70, look.wood), box(spot.x + 32, z, 4, 4, 70, look.wood),
    box(spot.x, z, 64, 4, 40, '#8a6a42', 26),
  ];
  papers.forEach(function(color, i){ pieces.push(box(spot.x - 22 + (i % 3) * 22, z + 3, 14, 1, 12, color, 32 + Math.floor(i / 3) * 16)); });
  return { pieces, people:[], solids:[solidOf(spot.x, z, 70, 8)] };
}

function safeProp(spot: InteriorSpot): Prop {
  const z = spot.y - 22;
  return {
    pieces:[box(spot.x, z, 30, 26, 34, '#3a4048'), box(spot.x, z + 13.5, 22, 1, 24, '#4c535c', 5), cyl(spot.x + 5, z + 15, 3, 2, '#c9b26b', 18)],
    people:[], solids:[solidOf(spot.x, z, 30, 26)],
  };
}

function vaultDoorProp(spot: InteriorSpot, look: Look): Prop {
  const pieces: InteriorPiece[] = [
    { shape:'cyl', axis:'z', x:spot.x, z:3, w:76, d:6, h:76, y:2, color:'#4a525c' },
    { shape:'cyl', axis:'z', x:spot.x, z:6, w:56, d:4, h:56, y:12, color:'#5c656f' },
    { shape:'cyl', axis:'z', x:spot.x, z:9, w:12, d:4, h:12, y:34, color:look.accent },
  ];
  // LEGAL: The planning table in front of it, with the blueprint on top.
  pieces.push(box(spot.x, spot.y - 24, 70, 30, 28, '#3a3028'), box(spot.x, spot.y - 24, 60, 22, 1, '#3d6a9a', 28));
  return { pieces, people:[], solids:[solidOf(spot.x, spot.y - 24, 70, 30), solidOf(spot.x, 4, 80, 10)] };
}

function wardrobeProp(spot: InteriorSpot, look: Look): Prop {
  const z = spot.y - 22;
  return {
    pieces:[box(spot.x, z, 50, 20, 72, look.wood), box(spot.x - 0.5, z + 10.5, 1, 1, 64, '#2a1d12', 4), cyl(spot.x - 5, z + 11, 1.5, 2, '#c9b26b', 36), cyl(spot.x + 5, z + 11, 1.5, 2, '#c9b26b', 36)],
    people:[], solids:[solidOf(spot.x, z, 50, 20)],
  };
}

function benchProp(spot: InteriorSpot, look: Look): Prop {
  const z = spot.y - 24;
  return {
    pieces:[box(spot.x, z, 70, 24, 30, '#5c4a36'), box(spot.x, z, 74, 26, 3, '#8a7458', 30), box(spot.x - 20, z, 12, 8, 6, '#c0392b', 33), box(spot.x + 14, z - 2, 18, 6, 3, '#9aa0a8', 33), box(spot.x, z - 14, 70, 2, 40, '#4a3a2a', 34)],
    people:[], solids:[solidOf(spot.x, z, 74, 26)],
  };
}

function showroomProp(spot: InteriorSpot, look: Look): Prop {
  const z = spot.y - 56;
  return {
    pieces:[cyl(spot.x, z, 40, 4, '#cfd3d8')],
    people:[], solids:[solidOf(spot.x, z, 80, 80)],
    cars:[{ x:spot.x, z, heading:Math.PI * 0.35, color:look.accent, use:'showroom' }],
  };
}

function slotsProp(spot: InteriorSpot): Prop {
  const z = spot.y - 26;
  const pieces: InteriorPiece[] = [];
  [-30, 0, 30].forEach(function(dx, i){
    pieces.push(box(spot.x + dx, z, 24, 20, 46, '#7a1f2a'), box(spot.x + dx, z + 10.5, 16, 1, 14, '#000000', 22, ['#ffd23a', '#5ad1ff', '#ff6b9a'][i]), box(spot.x + dx, z, 26, 22, 4, '#c9a227', 46));
  });
  return { pieces, people:[], solids:[solidOf(spot.x, z, 88, 22)] };
}

function cardTableProp(spot: InteriorSpot, refId: string, look: Look): Prop {
  const z = spot.y - 40;
  const pieces = [cyl(spot.x, z, 24, 4, '#1f6a3a', 24), cyl(spot.x, z, 26, 3, '#5a3a22', 22), cyl(spot.x, z, 6, 22, '#2a1d12')];
  return {
    pieces,
    people:[staffBehind(spot.x, z - 30, `${refId}:dealer`, look.accent)],
    solids:[solidOf(spot.x, z, 52, 52)],
  };
}

function barProp(spot: InteriorSpot, refId: string, look: Look): Prop {
  const z = spot.y - 26;
  const bottles = ['#5a8a3a', '#c98a2b', '#8a2a2a', '#d6d0c0', '#3a5a8a'];
  const pieces = [...counter(spot.x, z, 80, look, '#2a1a12')];
  bottles.forEach((color, i) => pieces.push(cyl(spot.x - 24 + i * 12, z - 4, 2.5, 10, color, 27)));
  return { pieces, people:[staffBehind(spot.x, z - 26, `${refId}:bartender`, '#f0efe8')], solids:[solidOf(spot.x, z, 84, 26)] };
}

function paintBayProp(spot: InteriorSpot, look: Look): Prop {
  const z = spot.y - 50;
  const frame = '#9aa0a8';
  return {
    pieces:[
      box(spot.x - 60, z, 4, 4, 70, frame), box(spot.x + 60, z, 4, 4, 70, frame), box(spot.x, z, 124, 4, 4, frame, 70),
      box(spot.x - 60, z - 40, 4, 4, 70, frame), box(spot.x + 60, z - 40, 4, 4, 70, frame), box(spot.x, z - 40, 124, 4, 4, frame, 70),
    ],
    people:[], solids:[solidOf(spot.x, z - 20, 130, 50)],
    cars:[{ x:spot.x, z:z - 20, heading:0, color:look.accent, use:'bay' }],
  };
}

function screenProp(spot: InteriorSpot): Prop {
  return { pieces:[box(spot.x, 4, 180, 2, 70, '#000000', 4, '#e8e4d8'), box(spot.x, 2, 190, 4, 4, '#2a2a2a', 0)], people:[], solids:[] };
}

function flagProp(spot: InteriorSpot): Prop {
  const z = spot.y - 30;
  const pieces = [box(spot.x - 50, z, 4, 4, 64, '#d6d0c0'), box(spot.x + 50, z, 4, 4, 64, '#d6d0c0')];
  for(let i = 0; i < 10; i++) pieces.push(box(spot.x - 45 + i * 10, z, 10, 2, 8, i % 2 ? '#111111' : '#f5f5f5', 56));
  for(let i = 0; i < 10; i++) pieces.push(box(spot.x - 45 + i * 10, z, 10, 2, 8, i % 2 ? '#f5f5f5' : '#111111', 48));
  return { pieces, people:[], solids:[solidOf(spot.x - 50, z, 6, 6), solidOf(spot.x + 50, z, 6, 6)] };
}

function warTableProp(spot: InteriorSpot, look: Look): Prop {
  const z = spot.y - 30;
  const pieces = [box(spot.x, z, 110, 44, 28, look.wood), box(spot.x, z, 100, 36, 1, '#c8b88a', 28), box(spot.x - 20, z - 4, 6, 6, 4, '#c0392b', 29), box(spot.x + 18, z + 6, 6, 6, 4, '#2f6b9a', 29)];
  return { pieces, people:[], solids:[solidOf(spot.x, z, 110, 44)] };
}

function contactProp(spot: InteriorSpot, refId: string): Prop {
  const z = spot.y - 22;
  return {
    pieces:[box(spot.x + 9, z + 2, 10, 4, 8, '#3a2a1a', 4)],
    people:[{ x:spot.x, z, facing:PERSON_FACING_DOOR, identity:`${refId}:contact`, coat:'#2c2c34' }],
    solids:[solidOf(spot.x, z, 16, 12)],
  };
}

function personProp(spot: InteriorSpot, refId: string, look: Look): Prop {
  const z = spot.y - 22;
  return { pieces:[], people:[{ x:spot.x, z, facing:PERSON_FACING_DOOR, identity:`${refId}:${spot.id}`, coat:look.accent }], solids:[solidOf(spot.x, z, 14, 12)] };
}

function officeDeskProp(spot: InteriorSpot, look: Look): Prop {
  const z = spot.y - 24;
  return {
    pieces:[box(spot.x, z, 64, 28, 28, look.wood), box(spot.x - 10, z - 6, 18, 4, 14, '#20242a', 28), box(spot.x - 10, z - 3.5, 15, 1, 10, '#000000', 30, '#5ad1ff'), box(spot.x + 40, z - 4, 18, 22, 44, '#5a5e66')],
    people:[], solids:[solidOf(spot.x + 5, z, 82, 28)],
  };
}

function lockerProp(spot: InteriorSpot): Prop {
  const z = spot.y - 22;
  const pieces: InteriorPiece[] = [];
  [-26, 0, 26].forEach(dx => pieces.push(box(spot.x + dx, z, 24, 20, 44, '#3e4a3a'), box(spot.x + dx, z + 10.5, 1, 1, 38, '#262e24', 4)));
  return { pieces, people:[], solids:[solidOf(spot.x, z, 78, 20)] };
}

function keyCabinetProp(spot: InteriorSpot, look: Look): Prop {
  const pieces = [box(spot.x, 3, 56, 4, 36, look.wood, 30)];
  for(let i = 0; i < 6; i++) pieces.push(box(spot.x - 20 + i * 8, 6, 3, 2, 6, '#c9b26b', 44));
  return { pieces:[...pieces, ...counter(spot.x, spot.y - 26, 70, look)], people:[], solids:[solidOf(spot.x, spot.y - 26, 74, 26)] };
}

function pedestalProp(spot: InteriorSpot, look: Look): Prop {
  const z = spot.y - 20;
  return { pieces:[cyl(spot.x, z, 10, 26, look.wood), cyl(spot.x, z, 12, 3, look.accent, 26)], people:[], solids:[solidOf(spot.x, z, 22, 22)] };
}

function propFor(spot: InteriorSpot, kind: string, refId: string, look: Look): Prop {
  if(kind === 'mall') return mallSpotProp(spot, refId) ?? pedestalProp(spot, look);
  switch(spot.id){
    case 'counter': case 'register': case 'clerk': case 'frontdesk':
      return deskProp(spot, look, refId, spot.id === 'register' ? 80 : 96, spot.id === 'register' ? [box(spot.x + 20, spot.y - 30, 18, 14, 10, '#2a2d34', 27)] : []);
    case 'teller': {
      const posts: InteriorPiece[] = [];
      for(let dx = -40; dx <= 40; dx += 20) posts.push(box(spot.x + dx, spot.y - 32, 2, 2, 34, '#c9b26b', 27));
      return deskProp(spot, look, refId, 110, [...posts, box(spot.x, spot.y - 32, 84, 1, 2, '#c9b26b', 61)]);
    }
    case 'owner': return personProp(spot, refId, look);
    case 'board': case 'notices': case 'manifest': return boardProp(spot, look);
    case 'vault': return kind === 'heist' ? vaultDoorProp(spot, look) : safeProp(spot);
    case 'wardrobe': return wardrobeProp(spot, look);
    case 'bench': return benchProp(spot, look);
    case 'fleet': return keyCabinetProp(spot, look);
    case 'floor': return kind === 'dealership' ? showroomProp(spot, look) : boardProp(spot, look);
    case 'tables': return cardTableProp(spot, refId, look);
    case 'slots': return slotsProp(spot);
    case 'bar': return barProp(spot, refId, look);
    case 'bay': return paintBayProp(spot, look);
    case 'screen': return screenProp(spot);
    case 'trailhead': return flagProp(spot);
    case 'wartable': return warTableProp(spot, look);
    case 'mission': return spot.label === 'Mission Contact' ? contactProp(spot, refId) : deskProp(spot, look, refId);
    case 'backoffice': case 'security-desk': return officeDeskProp(spot, look);
    case 'armory': return lockerProp(spot);
    default: return pedestalProp(spot, look);
  }
}

function plant(x: number, z: number): InteriorPiece[] {
  return [cyl(x, z, 8, 14, '#6b4a2c'), { shape:'sphere', x, z, w:22, d:22, h:26, y:12, color:'#3c7a44' }];
}
function tyres(x: number, z: number): InteriorPiece[] {
  return [0, 1, 2].flatMap(i => [cyl(x, z, 14, 6.4, '#1b1e23', i * 7), cyl(x, z, 7, 6.6, '#8a8f98', i * 7)]);
}
function column(x: number, z: number, color: string): InteriorPiece[] {
  return [cyl(x, z, 12, WALL_HEIGHT, color), cyl(x, z, 15, 5, color)];
}

// LEGAL: The furniture that gives each kind of room its character, kept to the walls and the
// LEGAL: corners so the middle of the floor, the door and every hotspot stay clear.
function decorFor(kind: string, room: RoomSize, look: Look): Prop {
  const { w, h } = room;
  const pieces: InteriorPiece[] = [];
  const solids: Solid[] = [];
  const people: InteriorPerson[] = [];
  const cars: InteriorCar[] = [];
  const add = (piece: InteriorPiece, solid = true) => { pieces.push(piece); if(solid && piece.y < 20) solids.push(solidOf(piece.x, piece.z, piece.w, piece.d)); };
  switch(kind){
    case 'mall': return mallDecor();
    case 'local': {
      // LEGAL: Open shelving down both walls: a back panel, three shelves, goods on each.
      for(const side of [-1, 1]){
        const sx = side < 0 ? 12 : w - 12;
        pieces.push(box(sx + side * 7, 150, 3, 140, 56, look.wood));
        solids.push(solidOf(sx, 150, 18, 140));
        for(let level = 0; level < 3; level++){
          pieces.push(box(sx, 150, 16, 140, 2, look.wood, 4 + level * 17));
          for(let i = 0; i < 7; i++) pieces.push(box(sx, 90 + i * 20, 10, 13, 9, [look.accent, '#7c9a3a', '#c0392b', '#3a6a9a', '#e8dcc0'][(i + level * 2) % 5], 6 + level * 17));
        }
      }
      add(box(w / 2, 2, 60, 2, 22, '#1b241d', 44), false);
      plant(w - 30, h - 30).forEach(p => add(p));
      break;
    }
    case 'bankHome':
      [30, w - 30].forEach(x => column(x, h / 2, '#e2ddd0').forEach(p => add(p)));
      for(const rx of [w / 2 - 40, w / 2 + 40]){
        add(cyl(rx, h - 70, 3, 22, look.accent)); add(cyl(rx, h - 110, 3, 22, look.accent));
        pieces.push(box(rx, h - 90, 2, 40, 2, '#8a1f2a', 18));
      }
      plant(30, h - 30).forEach(p => add(p));
      break;
    case 'heist':
      for(let x = 30; x < w - 20; x += 26) pieces.push(box(x, h - 34, 12, 14, 0.6, look.accent));
      pieces.push(box(w - 16, 10, 8, 8, 6, '#8a939c', WALL_HEIGHT - 14), { shape:'sphere', x:w - 16, z:15, w:3, d:3, h:3, y:WALL_HEIGHT - 12, color:'#000000', emissive:'#ff3030' });
      break;
    case 'playerGarage':
      cars.push({ x:70, z:160, heading:Math.PI / 2, color:'#3e6b8a', use:'garage' }); solids.push(solidOf(70, 160, 44, 80));
      for(let i = 0; i < 4; i++) add(box(w - 120 + i * 26, 12, 24, 20, 40, '#a82a22'));
      tyres(w - 30, h - 34).forEach(p => add(p));
      break;
    case 'dealership':
      cars.push({ x:70, z:160, heading:Math.PI * 0.6, color:'#c0392b', use:'showroom' }); solids.push(solidOf(70, 160, 60, 84));
      tyres(w - 30, h - 34).forEach(p => add(p));
      pieces.push(box(w / 2, 1, 180, 1, 16, '#000000', 54, look.accent));
      break;
    case 'respray':
      for(let i = 0; i < 5; i++) add(cyl(30 + i * 12, 20, 4, 14, ['#c0392b', '#2f8f6a', '#3a6a9a', '#d4a017', '#8e44ad'][i]));
      add(box(w - 30, 40, 30, 50, 46, '#5a5e66'));
      break;
    case 'brokerage':
      pieces.push(box(w / 2, h - 70, 150, 80, 0.6, '#5a7c6b'));
      for(let i = 0; i < 3; i++) add(box(20, 100 + i * 30, 26, 26, 40, '#4a4856'));
      for(let i = 0; i < 3; i++) pieces.push(box(w - 120 + i * 40, 2, 30, 2, 22, '#20242a', 40), box(w - 120 + i * 40, 3.2, 24, 1, 16, '#9ec3d6', 43));
      plant(w - 30, h - 30).forEach(p => add(p));
      break;
    case 'cityhall':
      [30, w - 30].forEach(x => column(x, h / 2, '#e2ddd0').forEach(p => add(p)));
      pieces.push(cyl(w / 2, h - 70, 28, 0.6, '#c9b26b'), cyl(w / 2, h - 70, 20, 0.8, '#b8a060'));
      add(cyl(w - 40, 40, 2, 72, '#8a8f9c'));
      pieces.push(box(w - 28, 40, 24, 1, 16, '#2a4a8a', 52), box(w - 28, 40.6, 24, 1, 5, '#c0392b', 52));
      break;
    case 'casino':
      [30, w - 30].forEach(x => column(x, h / 2, '#c9a227').forEach(p => add(p)));
      for(let x = 40; x < w; x += 50) pieces.push(box(x, 1, 30, 1, 4, '#000000', WALL_HEIGHT - 20, '#ffcf5a'));
      break;
    case 'missionOffice':
      add(box(22, 60, 26, 26, 44, '#5a5e66'));
      add(box(w - 22, 60, 20, 20, 40, '#d6e4ec'));
      plant(w - 30, h - 30).forEach(p => add(p));
      plant(30, h - 30).forEach(p => add(p));
      break;
    default:
      for(const [bx, bz] of [[24, h - 50], [46, h - 30], [w - 26, h - 48], [w - 50, h - 30]] as const) add(box(bx, bz, 24, 20, 22, '#6b4a2c'));
      pieces.push(box(w / 2, 20, 2, 2, 20, '#222222', WALL_HEIGHT - 20));
      break;
  }
  // LEGAL: Daylight through a window on each side wall, and framed pictures either side of the
  // LEGAL: back counter, so no wall is a blank sheet.
  if(kind !== 'heist' && kind !== 'casino' && kind !== 'mall'){
    for(const side of [-1, 1]){
      const wx = side < 0 ? 0.6 : w - 0.6;
      pieces.push(box(wx, h * 0.62, 2, 70, 34, '#000000', 30, '#bcd8ea'), box(wx, h * 0.62, 3, 74, 3, look.trimColor, 28), box(wx, h * 0.62, 3, 3, 34, look.trimColor, 30));
    }
    for(const fx of [w * 0.1, w * 0.9]) pieces.push(box(fx, 1, 34, 2, 26, look.trimColor, 40), box(fx, 2.2, 28, 1, 20, kind === 'cityhall' || kind === 'bankHome' ? '#6a5a3a' : '#5a7c8a', 43));
  }
  return { pieces, people, solids, cars };
}

function wallPieces(room: RoomSize, look: Look): InteriorPiece[] {
  const { w, h, door } = room;
  const t = 8;
  const left = door.x - DOOR_WIDTH / 2, right = door.x + DOOR_WIDTH / 2;
  return [
    box(w / 2, -t / 2, w + t * 2, t, WALL_HEIGHT, look.wallColor),
    box(-t / 2, h / 2, t, h, WALL_HEIGHT, look.wallColor),
    box(w + t / 2, h / 2, t, h, WALL_HEIGHT, look.wallColor),
    // LEGAL: The front wall is cut down to a kerb so you can see in, with a gap for the door.
    box(left / 2 - t / 2, h + t / 2, left + t, t, FRONT_WALL_HEIGHT, look.wallColor),
    box((right + w) / 2 + t / 2, h + t / 2, w - right + t, t, FRONT_WALL_HEIGHT, look.wallColor),
    // LEGAL: Skirting along the walls you can see.
    box(w / 2, 0.6, w, 1.4, 5, look.trimColor), box(0.6, h / 2, 1.4, h, 5, look.trimColor), box(w - 0.6, h / 2, 1.4, h, 5, look.trimColor),
    // LEGAL: A doormat at the way out.
    box(door.x, h - 12, DOOR_WIDTH - 10, 20, 0.5, '#2a2a2a'),
  ];
}

export function interiorLayout(kind: string, refId: string, room: RoomSize, spots: InteriorSpot[]): InteriorLayout {
  const look = lookFor(kind);
  const decor = decorFor(kind, room, look);
  const props = spots.map(spot => propFor(spot, kind, refId, look));
  return {
    floor:look.floor, floorColor:look.floorColor, wallColor:look.wallColor, trimColor:look.trimColor,
    pieces:[...wallPieces(room, look), ...decor.pieces, ...props.flatMap(p => p.pieces)],
    people:[...decor.people, ...props.flatMap(p => p.people)],
    cars:[...(decor.cars ?? []), ...props.flatMap(p => p.cars ?? [])],
    walkers:[...(decor.walkers ?? []), ...props.flatMap(p => p.walkers ?? [])],
    solids:[...decor.solids, ...props.flatMap(p => p.solids)],
  };
}
