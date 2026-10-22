import type { Solid } from '../config/types';
import type { FurnitureName } from '../world/assets/places';
import { WALL_HEIGHT, box, cyl, fixture, solidOf, type InteriorCar, type InteriorFixture, type InteriorPerson, type InteriorPiece, type InteriorWalker, type Prop } from './interiorPieces';
import type { InteriorPlan, RoomTheme, ThemeLook } from './interiorPlans';

// LEGAL: The furniture that makes each kind of place itself (map/interiorPlans picks the theme), for
// LEGAL: each floor. Kept to the walls, the corners and the sides of the room, clear of the hotspots
// LEGAL: (the counter at the back in the middle, the second hotspot right of centre, a mission
// LEGAL: contact left of the counter), the door in the front wall and the stairs on the left.
// LEGAL: Every piece is a Blender model with a plain box under it as its fallback and its solid.

interface Builder {
  pieces: InteriorPiece[];
  fixtures: InteriorFixture[];
  solids: Solid[];
  people: InteriorPerson[];
  walkers: InteriorWalker[];
  cars: InteriorCar[];
}

function builder(): Builder { return { pieces:[], fixtures:[], solids:[], people:[], walkers:[], cars:[] }; }

// LEGAL: A model at (x, z) over a fallback box w x d x h, solid where the box stands on the floor.
function put(b: Builder, model: FurnitureName, x: number, z: number, w: number, d: number, h: number, color: string, opts: { turn?: number; y?: number; recolour?: Record<string, string>; solid?: boolean } = {}): void {
  const turned = opts.turn !== undefined && Math.abs(Math.sin(opts.turn)) > 0.7;
  const fw = turned ? d : w, fd = turned ? w : d;
  b.fixtures.push(fixture(model, x, z, [box(x, z, fw, fd, h, color, opts.y ?? 0)], { turn:opts.turn, y:opts.y, recolour:opts.recolour }));
  if(opts.solid !== false && (opts.y ?? 0) < 20) b.solids.push(solidOf(x, z, fw, fd));
}
function staff(b: Builder, x: number, z: number, identity: string, coat: string, facing = Math.PI / 2): void {
  b.people.push({ x, z, facing, identity, coat });
}
function stroll(b: Builder, path: Array<[number, number]>, identity: string, coat: string, speed = 26, offset = 0): void {
  b.walkers.push({ path:path.map(([x, z]) => ({ x, z })), speed, offset, identity, coat, scale:1 });
}
function car(b: Builder, x: number, z: number, heading: number, color: string, cls?: InteriorCar['cls']): void {
  b.cars.push({ x, z, heading, color, use:'showroom', cls });
  b.solids.push(solidOf(x, z, 60, 84));
}

function plantAt(b: Builder, x: number, z: number): void { put(b, 'potted-plant', x, z, 16, 16, 30, '#3c7a44'); }
function columnAt(b: Builder, x: number, z: number, color: string): void {
  b.fixtures.push(fixture('column', x, z, [cyl(x, z, 12, WALL_HEIGHT, color)], { recolour:{ stone:color, flute:color } }));
  b.solids.push(solidOf(x, z, 26, 26));
}
function shelvesBothSides(b: Builder, w: number, h: number, look: ThemeLook): void {
  for(const side of [-1, 1]){
    const sx = side < 0 ? 12 : w - 12;
    put(b, 'shop-shelf', sx, h * 0.52, 18, 140, 56, look.wood, { turn:side < 0 ? 0 : Math.PI, recolour:{ wood:look.wood, accent:look.accent } });
  }
}

type ThemeBuild = (b: Builder, w: number, h: number, look: ThemeLook, refId: string, floor: number) => void;

const SHOWROOM: (cls: InteriorCar['cls'], extras: (b: Builder, w: number, h: number, look: ThemeLook) => void) => ThemeBuild = (cls, extras) => function(b, w, h, look){
  car(b, w * 0.2, h * 0.62, Math.PI * 0.62, look.accent, cls);
  extras(b, w, h, look);
  plantAt(b, w - 26, h - 30);
};

const THEMES: Partial<Record<RoomTheme, ThemeBuild>> = {
  stall(b, w, h, look){
    put(b, 'kitchenette', w * 0.22, 14, 80, 22, 24, '#e8e4d8', { recolour:{ cabinet:look.wallColor } });
    put(b, 'drinks-fridge', w * 0.82, 12, 30, 22, 64, '#2a2d33');
    put(b, 'food-table', w * 0.25, h * 0.7, 32, 32, 22, '#f0ebe0');
  },
  diner(b, w, h, look){
    for(const z of [h * 0.36, h * 0.62]) put(b, 'booth', 30, z, 60, 48, 30, '#a82a22', { turn:Math.PI / 2, recolour:{ upholstery:look.accent } });
    put(b, 'dining-set', w * 0.64, h * 0.72, 46, 46, 24, look.wood, { recolour:{ wood:look.wood } });
    put(b, 'kitchenette', w * 0.78, 14, 80, 22, 24, '#e8e4d8');
    put(b, 'drinks-fridge', w - 20, 14, 30, 22, 64, '#2a2d33');
    stroll(b, [[w * 0.3, h * 0.5], [w * 0.55, h * 0.5], [w * 0.55, h * 0.8], [w * 0.3, h * 0.8]], 'diner:waiter', '#f0efe8', 22);
  },
  convenience(b, w, h, look){
    shelvesBothSides(b, w, h, look);
    put(b, 'drinks-fridge', w * 0.76, 12, 30, 22, 64, '#2a2d33');
    put(b, 'drinks-fridge', w * 0.84, 12, 30, 22, 64, '#2a2d33');
  },
  grocery(b, w, h, look){
    shelvesBothSides(b, w, h, look);
    put(b, 'crate-stack', w * 0.3, h * 0.78, 42, 22, 38, '#8a6a42');
    plantAt(b, w - 30, h - 30);
  },
  liquor(b, w, h, look){
    shelvesBothSides(b, w, h, look);
    for(const x of [0.68, 0.76, 0.84]) put(b, 'drinks-fridge', w * x, 12, 30, 22, 64, '#2a2d33');
  },
  laundromat(b, w, h){
    for(let z = 46; z < h - 70; z += 28) put(b, 'washer', 14, z, 22, 22, 30, '#eceae4', { turn:Math.PI / 2 });
    for(let z = 46; z < h * 0.42; z += 28) put(b, 'dryer', w - 14, z, 22, 22, 30, '#eceae4', { turn:-Math.PI / 2 });
    put(b, 'folding-table', w * 0.52, h * 0.6, 70, 22, 28, '#d8d2c4');
    put(b, 'bench-row', w * 0.75, h * 0.82, 72, 14, 20, '#3a6a9a', { turn:Math.PI });
  },
  lounge(b, w, h, look){
    for(const z of [h * 0.4, h * 0.66]) put(b, 'booth', 30, z, 60, 48, 30, '#3a1a2a', { turn:Math.PI / 2, recolour:{ upholstery:look.accent } });
    put(b, 'stage', w * 0.74, 28, 90, 50, 8, '#2a2018');
    put(b, 'sofa', w * 0.66, h * 0.78, 60, 22, 30, '#4a5a7a', { turn:Math.PI, recolour:{ upholstery:'#5a2a4a' } });
  },
  club(b, w, h, look){
    put(b, 'piano', w * 0.76, 22, 50, 40, 42, '#111114');
    put(b, 'sofa', 28, h * 0.46, 60, 22, 30, '#4a5a7a', { turn:Math.PI / 2, recolour:{ upholstery:look.accent } });
    put(b, 'coffee-table', 60, h * 0.46, 36, 20, 12, '#3a2418', { turn:Math.PI / 2 });
    put(b, 'pool-table', w * 0.62, h * 0.72, 74, 44, 26, '#1f6a3a');
  },
  pub(b, w, h, look){
    put(b, 'pool-table', w * 0.24, h * 0.42, 74, 44, 26, '#1f6a3a');
    put(b, 'dartboard', w * 0.8, 0, 30, 4, 60, '#1f3a2a', { solid:false });
    for(const z of [h * 0.72]) put(b, 'booth', w - 30, z, 60, 48, 30, '#5a3e26', { turn:-Math.PI / 2, recolour:{ upholstery:'#7a2630' } });
    put(b, 'dining-set', w * 0.3, h * 0.78, 46, 46, 24, look.wood, { recolour:{ wood:look.wood } });
  },
  backroom(b, w, h){
    put(b, 'card-table', w * 0.26, h * 0.64, 52, 52, 26, '#1f6a3a');
    put(b, 'card-table', w * 0.72, h * 0.34, 52, 52, 26, '#1f6a3a');
    put(b, 'crate-stack', 30, h - 40, 42, 22, 38, '#8a6a42');
    staff(b, w * 0.26, h * 0.64 - 34, 'backroom:dealer', '#2a2a2a');
  },
  wireroom(b, w, h){
    put(b, 'phone-bank', w * 0.24, 22, 80, 22, 28, '#5a4a36');
    put(b, 'filing-cabinet', w - 18, h * 0.3, 26, 26, 40, '#4a4856', { turn:-Math.PI / 2 });
    put(b, 'filing-cabinet', w - 18, h * 0.42, 26, 26, 40, '#4a4856', { turn:-Math.PI / 2 });
    staff(b, w * 0.18, 40, 'wire:clerk', '#4ac06a');
  },
  workshop(b, w, h){
    put(b, 'car-lift', w * 0.24, h * 0.5, 80, 30, 64, '#2f5a9a', { solid:false });
    b.solids.push(solidOf(w * 0.24 - 34, h * 0.5, 8, 8), solidOf(w * 0.24 + 34, h * 0.5, 8, 8));
    b.cars.push({ x:w * 0.24, z:h * 0.5, heading:0, color:'#8a8f98', use:'bay' });
    put(b, 'parts-shelf', w - 14, h * 0.3, 18, 58, 60, '#5a5e66', { turn:-Math.PI / 2 });
    put(b, 'tool-chest', w * 0.72, 12, 24, 20, 40, '#a82a22');
    put(b, 'tyre-stack', w - 30, h - 34, 28, 28, 20, '#1b1e23');
  },
  chopshop(b, w, h){
    put(b, 'car-lift', w * 0.26, h * 0.5, 80, 30, 64, '#2f5a9a', { solid:false });
    b.solids.push(solidOf(w * 0.26 - 34, h * 0.5, 8, 8), solidOf(w * 0.26 + 34, h * 0.5, 8, 8));
    b.cars.push({ x:w * 0.26, z:h * 0.5, heading:0, color:'#3a3d44', use:'bay' });
    put(b, 'parts-shelf', w - 14, h * 0.28, 18, 58, 60, '#5a5e66', { turn:-Math.PI / 2 });
    put(b, 'crate-stack', w * 0.7, h - 40, 42, 22, 38, '#8a6a42');
    put(b, 'tyre-stack', 26, h - 34, 28, 28, 20, '#1b1e23');
  },
  paintShop(b, w, h){
    for(let i = 0; i < 5; i++) b.pieces.push(cyl(30 + i * 12, 20, 4, 14, ['#c0392b', '#2f8f6a', '#3a6a9a', '#d4a017', '#8e44ad'][i]));
    b.solids.push(solidOf(54, 20, 64, 10));
    put(b, 'parts-shelf', w - 14, h * 0.26, 18, 58, 60, '#5a5e66', { turn:-Math.PI / 2 });
  },
  depot(b, w, h){
    put(b, 'phone-bank', w * 0.24, 22, 80, 22, 28, '#5a4a36');
    put(b, 'lockers', w - 14, h * 0.36, 20, 78, 44, '#3e4a3a', { turn:-Math.PI / 2 });
    put(b, 'bench-row', w * 0.3, h * 0.82, 72, 14, 20, '#3a6a9a', { turn:Math.PI });
    staff(b, w * 0.18, 40, 'depot:dispatcher', '#d4a017');
  },
  warehouse(b, w, h){
    put(b, 'pallet-rack', 16, h * 0.42, 26, 100, 72, '#d4692a', { turn:Math.PI / 2 });
    put(b, 'pallet-rack', w - 16, h * 0.42, 26, 100, 72, '#d4692a', { turn:-Math.PI / 2 });
    put(b, 'forklift', w * 0.3, h * 0.68, 20, 34, 38, '#e8b923', { turn:0.6 });
    put(b, 'crate-stack', w * 0.7, h * 0.74, 42, 22, 38, '#8a6a42');
  },
  office(b, w, h, look){
    put(b, 'office-desk', w * 0.24, h * 0.62, 82, 28, 44, look.wood, { recolour:{ wood:look.wood } });
    put(b, 'filing-cabinet', 18, h * 0.3, 26, 26, 40, '#4a4856', { turn:Math.PI / 2 });
    plantAt(b, w - 30, h - 30);
  },
  newsroom(b, w, h, look, refId, floor){
    if(floor === 1){
      put(b, 'office-desk', w * 0.5, 40, 82, 28, 44, look.wood, { recolour:{ wood:'#4a2a1c' } });
      put(b, 'sofa', w * 0.8, h * 0.6, 60, 22, 30, '#4a5a7a', { turn:-Math.PI / 2 });
      put(b, 'filing-cabinet', w - 18, 30, 26, 26, 40, '#4a4856', { turn:-Math.PI / 2 });
      plantAt(b, w - 26, h - 30);
      return;
    }
    for(const [x, z] of [[0.3, 0.42], [0.3, 0.7], [0.62, 0.7]] as const) put(b, 'newsroom-desk', w * x, h * z, 56, 26, 30, '#6a6e74');
    put(b, 'tv-wall', w * 0.78, 0, 60, 14, 14, '#1a1c20', { solid:false });
    for(let i = 0; i < 3; i++) put(b, 'filing-cabinet', w - 18, h * 0.3 + i * 30, 26, 26, 40, '#4a4856', { turn:-Math.PI / 2 });
    stroll(b, [[w * 0.45, h * 0.55], [w * 0.75, h * 0.55], [w * 0.75, h * 0.85], [w * 0.45, h * 0.85]], 'herald:runner', '#c0392b', 30);
  },
  executive(b, w, h, look, refId, floor){
    if(floor === 1){
      put(b, 'war-table', w * 0.5, h * 0.44, 110, 44, 28, look.wood, { recolour:{ wood:'#2a1a12' } });
      put(b, 'tv-wall', w * 0.5, 0, 60, 14, 14, '#1a1c20', { solid:false });
      plantAt(b, w - 26, 30); plantAt(b, w - 26, h - 30);
      return;
    }
    put(b, 'sofa', w * 0.78, h * 0.42, 60, 22, 30, '#4a5a7a', { turn:-Math.PI / 2, recolour:{ upholstery:'#2a2d33' } });
    put(b, 'coffee-table', w * 0.68, h * 0.42, 36, 20, 12, '#3a2418', { turn:Math.PI / 2 });
    put(b, 'display-case', w * 0.3, h * 0.8, 60, 24, 28, '#3a2418');
    plantAt(b, w - 26, h - 30);
  },
  bank(b, w, h){
    [40, w - 40].forEach(x => columnAt(b, x, h / 2, '#e2ddd0'));
    put(b, 'velvet-rope', w * 0.5 - 70, h * 0.46, 64, 6, 22, '#8a1f2a', { turn:Math.PI / 2, solid:false });
    put(b, 'bench-row', w * 0.26, h * 0.82, 72, 14, 20, '#3a6a9a', { turn:Math.PI });
    plantAt(b, 30, h - 30);
  },
  bankPrestige(b, w, h){
    [40, w * 0.33, w * 0.67, w - 40].forEach(x => columnAt(b, x, h * 0.5, '#efe8d8'));
    put(b, 'velvet-rope', w * 0.5 - 80, h * 0.46, 64, 6, 22, '#8a1f2a', { turn:Math.PI / 2, solid:false });
    put(b, 'display-case', w * 0.26, h * 0.8, 60, 24, 28, '#4a2a1c');
    put(b, 'sofa', w * 0.74, h * 0.82, 60, 22, 30, '#4a5a7a', { turn:Math.PI, recolour:{ upholstery:'#2a3a5a' } });
  },
  civic(b, w, h, look, refId, floor){
    if(floor === 1){
      put(b, 'war-table', w * 0.5, h * 0.44, 110, 44, 28, look.wood, { recolour:{ wood:look.wood } });
      for(const x of [w * 0.32, w * 0.68]) put(b, 'dining-set', x, h * 0.72, 46, 46, 24, look.wood, { recolour:{ wood:look.wood } });
      [w - 40].forEach(x => columnAt(b, x, h / 2, '#e2ddd0'));
      return;
    }
    [w * 0.3, w * 0.7].forEach(x => columnAt(b, x, h * 0.4, '#e2ddd0'));
    put(b, 'bench-row', w * 0.25, h * 0.84, 72, 14, 20, '#5a4632', { turn:Math.PI, recolour:{ 'bench-seat':'#5a4632' } });
    put(b, 'display-case', w * 0.75, h * 0.84, 60, 24, 28, '#5a4632', { recolour:{ item:'#8f949c' } });
  },
  busStation(b, w, h){
    for(const z of [h * 0.5, h * 0.7]) for(const x of [w * 0.3, w * 0.62]) put(b, 'bench-row', x, z, 72, 14, 20, '#3a6a9a', { turn:Math.PI });
    put(b, 'departure-board', w * 0.78, 0, 92, 4, 30, '#16181d', { solid:false });
    put(b, 'ticket-booth', 40, h * 0.3, 40, 36, 50, '#5c6470');
    put(b, 'drinks-fridge', w - 20, h * 0.3, 30, 22, 64, '#2a2d33', { turn:-Math.PI / 2 });
    stroll(b, [[w * 0.15, h * 0.85], [w * 0.85, h * 0.85]], 'bus:traveller', '#5a7c8a', 24);
  },
  pawn(b, w, h, look){
    put(b, 'display-case', w * 0.26, h * 0.5, 60, 24, 28, look.wood, { recolour:{ item:'#c9a227' } });
    put(b, 'display-case', w * 0.74, h * 0.82, 60, 24, 28, look.wood, { recolour:{ item:'#8f949c' } });
    put(b, 'shop-shelf', 12, h * 0.4, 18, 140, 56, look.wood, { recolour:{ wood:look.wood, accent:look.accent } });
    put(b, 'tv-wall', w * 0.8, 0, 60, 14, 14, '#1a1c20', { solid:false });
  },
  herbalist(b, w, h, look){
    put(b, 'jar-wall', w * 0.2, 6, 70, 14, 60, look.wood, { recolour:{ wood:look.wood } });
    put(b, 'jar-wall', w * 0.8, 6, 70, 14, 60, look.wood, { recolour:{ wood:look.wood } });
    put(b, 'display-case', w * 0.3, h * 0.76, 60, 24, 28, look.wood, { recolour:{ item:'#7c9a3a' } });
    plantAt(b, w - 30, h - 30); plantAt(b, 30, h - 30);
  },
  jeweler(b, w, h, look){
    for(const [x, z] of [[0.24, 0.5], [0.24, 0.76], [0.76, 0.82]] as const) put(b, 'display-case', w * x, h * z, 60, 24, 28, look.wood, { recolour:{ item:x > 0.5 ? '#d8eef6' : '#e8c24a' } });
    put(b, 'velvet-rope', w * 0.5, h * 0.62, 64, 6, 22, '#8a1f2a', { solid:false });
    staff(b, 30, h - 40, 'jeweler:guard', '#2a3a5a', -Math.PI / 2);
  },
  usedLot:SHOWROOM('sedan', function(b, w, h){
    put(b, 'tyre-stack', w - 30, 40, 28, 28, 20, '#1b1e23');
    put(b, 'sofa', w * 0.72, h * 0.82, 60, 22, 30, '#4a5a7a', { turn:Math.PI, recolour:{ upholstery:'#6a5a3a' } });
    put(b, 'drinks-fridge', w - 20, h * 0.36, 30, 22, 64, '#2a2d33', { turn:-Math.PI / 2 });
  }),
  luxuryShowroom:SHOWROOM('supercar', function(b, w, h, look){
    car(b, w * 0.6, h * 0.82, Math.PI * 0.4, '#c9a227', 'roadster');
    put(b, 'velvet-rope', w * 0.2, h * 0.86, 64, 6, 22, '#8a1f2a', { solid:false });
    put(b, 'sofa', w - 30, h * 0.36, 60, 22, 30, '#4a5a7a', { turn:-Math.PI / 2, recolour:{ upholstery:'#2a2d33' } });
    put(b, 'display-case', w * 0.62, 20, 60, 24, 28, look.wood, { recolour:{ item:'#c9a227' } });
  }),
  bikeShop:SHOWROOM('sportbike', function(b, w, h){
    car(b, w * 0.62, h * 0.84, 0.3, '#2a2420', 'chopper');
    put(b, 'parts-shelf', w - 14, h * 0.3, 18, 58, 60, '#5a5e66', { turn:-Math.PI / 2 });
    put(b, 'tool-chest', w * 0.72, 12, 24, 20, 40, '#a82a22');
  }),
  ruggedShowroom:SHOWROOM('suv', function(b, w, h){
    put(b, 'tyre-stack', w - 30, 40, 28, 28, 20, '#1b1e23');
    put(b, 'tyre-stack', w - 60, 40, 28, 28, 20, '#1b1e23');
    put(b, 'crate-stack', w * 0.7, h * 0.84, 42, 22, 38, '#8a6a42');
    put(b, 'parts-shelf', w - 14, h * 0.4, 18, 58, 60, '#5a5e66', { turn:-Math.PI / 2 });
  }),
  trailheadShowroom:SHOWROOM('pickup', function(b, w, h){
    put(b, 'fireplace', w - 14, h * 0.36, 50, 14, 80, '#8a8478', { turn:-Math.PI / 2 });
    put(b, 'sofa', w * 0.7, h * 0.36, 60, 22, 30, '#4a5a7a', { turn:Math.PI / 2, recolour:{ upholstery:'#6a3a2a' } });
    put(b, 'crate-stack', w * 0.7, h * 0.84, 42, 22, 38, '#8a6a42');
    put(b, 'tyre-stack', 30, 40, 28, 28, 20, '#1b1e23');
  }),
  evShowroom:SHOWROOM('ev', function(b, w, h){
    car(b, w * 0.62, h * 0.8, Math.PI * 0.3, '#f2f4f6', 'ev-luxury');
    put(b, 'display-case', w * 0.62, 20, 60, 24, 28, '#c8ccd0', { recolour:{ item:'#3a8ad1' } });
  }),
  brokerCheap(b, w, h, look){
    put(b, 'office-desk', w * 0.24, h * 0.62, 82, 28, 44, look.wood, { recolour:{ wood:look.wood } });
    put(b, 'filing-cabinet', 18, h * 0.3, 26, 26, 40, '#5a5e66', { turn:Math.PI / 2 });
    put(b, 'bench-row', w * 0.7, h * 0.84, 72, 14, 20, '#6a5a3a', { turn:Math.PI, recolour:{ 'bench-seat':'#6a5a3a' } });
  },
  brokerLuxury(b, w, h){
    put(b, 'sofa', w * 0.24, h * 0.62, 60, 22, 30, '#4a5a7a', { turn:Math.PI / 2, recolour:{ upholstery:'#e8e2d8' } });
    put(b, 'coffee-table', w * 0.34, h * 0.62, 36, 20, 12, '#3a2418', { turn:Math.PI / 2 });
    plantAt(b, 30, h - 30); plantAt(b, w - 30, h - 30);
  },
  brokerCommercial(b, w, h){
    put(b, 'office-desk', w * 0.24, h * 0.62, 82, 28, 44, '#5a5e66', { recolour:{ wood:'#5a5e66' } });
    put(b, 'crate-stack', w * 0.74, h * 0.84, 42, 22, 38, '#8a6a42');
  },
  brokerWaterfront(b, w, h){
    put(b, 'sofa', w * 0.24, h * 0.62, 60, 22, 30, '#4a5a7a', { turn:Math.PI / 2, recolour:{ upholstery:'#2f6b8a' } });
    plantAt(b, 30, h - 30); plantAt(b, w - 30, h - 30);
  },
  garageHome(b, w, h, look, refId, floor){
    if(floor === 1){
      put(b, 'bed', w * 0.82, 40, 50, 72, 18, '#2f4a6a', { solid:true });
      put(b, 'kitchenette', w * 0.42, 14, 80, 22, 24, '#e8e4d8');
      put(b, 'sofa', w * 0.5, h * 0.84, 60, 22, 30, '#4a5a7a', { turn:Math.PI });
      put(b, 'coffee-table', w * 0.5, h * 0.7, 36, 20, 12, '#3a2418');
      put(b, 'tv-wall', w * 0.2, 0, 60, 14, 14, '#1a1c20', { solid:false });
      return;
    }
    // LEGAL: Two bays for the cars Arjun owns that he isn't out in; the one he drives is parked outside.
    [0.57, 0.72].forEach((at, bay) => {
      b.cars.push({ x:w * at, z:h * 0.58, heading:0, color:'#3e6b8a', use:'garage', bay });
      b.solids.push(solidOf(w * at, h * 0.58, 44, 80));
    });
    for(let i = 0; i < 3; i++) put(b, 'tool-chest', w - 100 + i * 26, 12, 24, 20, 40, '#a82a22');
    put(b, 'tyre-stack', w - 30, h - 34, 28, 28, 20, '#1b1e23');
  },
  casino(b, w, h, look, refId, floor){
    if(floor === 1){
      put(b, 'card-table', w * 0.5, h * 0.38, 52, 52, 26, '#1f6a3a');
      put(b, 'piano', w * 0.82, 24, 50, 40, 42, '#111114');
      put(b, 'sofa', w * 0.3, h * 0.76, 60, 22, 30, '#4a5a7a', { turn:Math.PI, recolour:{ upholstery:'#7a1f2a' } });
      put(b, 'velvet-rope', w * 0.5, h * 0.62, 64, 6, 22, '#8a1f2a', { solid:false });
      staff(b, w * 0.5, h * 0.38 - 32, 'casino:vip-dealer', '#c9a227');
      return;
    }
    // LEGAL: A big floor that should feel full: the cashier's cage on the left wall, two banks of slots,
    // LEGAL: four tables with their dealers, columns, plants and the people moving between them.
    [40, w * 0.36, w * 0.64].forEach(x => columnAt(b, x, h * 0.5, '#c9a227'));
    put(b, 'counter', 40, h * 0.22, 96, 22, 26, '#4a2a1c', { turn:Math.PI / 2, recolour:{ wood:'#4a2a1c', top:'#c9a227' } });
    put(b, 'cell', 62, h * 0.22, 60, 4, 72, '#c9a227', { turn:Math.PI / 2, recolour:{ bars:'#c9a227' }, solid:false });
    staff(b, 22, h * 0.22, 'casino:cashier', '#c9a227', 0);
    const glows = ['#ffd23a', '#5ad1ff', '#ff6b9a', '#5ad18a', '#c040ff', '#ff8a2a'];
    for(let i = 0; i < 6; i++) put(b, 'slot-machine', w * 0.6 + i * 30, h * 0.34, 24, 20, 50, '#7a1f2a', { recolour:{ screen:glows[i] } });
    for(let i = 0; i < 6; i++) put(b, 'slot-machine', w * 0.6 + i * 30, h * 0.34 + 40, 24, 20, 50, '#7a1f2a', { turn:Math.PI, recolour:{ screen:glows[(i + 3) % 6] } });
    for(const [x, z] of [[0.22, 0.66], [0.46, 0.7], [0.72, 0.7], [0.86, 0.84]] as const){ put(b, 'card-table', w * x, h * z, 52, 52, 26, '#1f6a3a'); staff(b, w * x, h * z - 32, `casino:dealer:${x}`, '#c9a227'); }
    for(const x of [w * 0.1, w * 0.9]) plantAt(b, x, h - 34);
    // LEGAL: Ropes either side of the way in, an aisle from the door onto the floor.
    for(const side of [-1, 1]) put(b, 'velvet-rope', w * 0.5 + side * 70, h * 0.86, 64, 6, 22, '#8a1f2a', { turn:Math.PI / 2 });
    for(let x = 60; x < w; x += 90) b.pieces.push(box(x, 1, 40, 1, 5, '#000000', WALL_HEIGHT - 20, '#ffcf5a'));
    stroll(b, [[w * 0.2, h * 0.82], [w * 0.8, h * 0.82], [w * 0.8, h * 0.5], [w * 0.2, h * 0.5]], 'casino:waiter', '#f0efe8', 24);
    stroll(b, [[w * 0.4, h * 0.45], [w * 0.6, h * 0.45], [w * 0.6, h * 0.8], [w * 0.4, h * 0.8]], 'casino:gambler', '#7a2630', 18, 0.5);
    stroll(b, [[w * 0.55, h * 0.52], [w * 0.95, h * 0.52]], 'casino:slots-player', '#2f4a6a', 14, 0.3);
    stroll(b, [[w * 0.15, h * 0.4], [w * 0.15, h * 0.85], [w * 0.3, h * 0.85]], 'casino:guest', '#3f5a3a', 20, 0.7);
  },
  lodge(b, w, h, look){
    put(b, 'fireplace', w * 0.8, 6, 50, 14, 80, '#8a8478');
    put(b, 'sofa', w * 0.8, h * 0.42, 60, 22, 30, '#4a5a7a', { turn:Math.PI, recolour:{ upholstery:'#6a3a2a' } });
    for(const x of [w * 0.25, w * 0.45]) put(b, 'dining-set', x, h * 0.72, 46, 46, 24, look.wood, { recolour:{ wood:look.wood } });
  },
  motel(b, w, h){
    put(b, 'sofa', w * 0.2, h * 0.7, 60, 22, 30, '#4a5a7a', { turn:Math.PI / 2, recolour:{ upholstery:'#c86a2a' } });
    put(b, 'drinks-fridge', w - 20, h * 0.3, 30, 22, 64, '#2a2d33', { turn:-Math.PI / 2 });
    plantAt(b, w - 30, h - 30);
  },
  yardOffice(b, w, h, look){
    put(b, 'filing-cabinet', 18, h * 0.3, 26, 26, 40, '#5a5e66', { turn:Math.PI / 2 });
    put(b, 'lockers', w - 14, h * 0.36, 20, 78, 44, '#3e4a3a', { turn:-Math.PI / 2 });
    put(b, 'crate-stack', w * 0.3, h * 0.82, 42, 22, 38, '#8a6a42');
    void look;
  },
  hangar(b, w, h){
    put(b, 'pallet-rack', 16, h * 0.42, 26, 100, 72, '#d4692a', { turn:Math.PI / 2 });
    put(b, 'tool-chest', w * 0.72, 12, 24, 20, 40, '#a82a22');
    put(b, 'crate-stack', w * 0.7, h * 0.8, 42, 22, 38, '#8a6a42');
  },
  dockOffice(b, w, h){
    put(b, 'crate-stack', 30, h - 40, 42, 22, 38, '#8a6a42');
    put(b, 'crate-stack', w * 0.3, h * 0.82, 42, 22, 38, '#8a6a42');
    put(b, 'filing-cabinet', w - 18, h * 0.3, 26, 26, 40, '#5a5e66', { turn:-Math.PI / 2 });
  },
  snackBar(b, w, h){
    put(b, 'kitchenette', w * 0.22, 14, 80, 22, 24, '#e8e4d8');
    put(b, 'drinks-fridge', w * 0.8, 12, 30, 22, 64, '#2a2d33');
    for(const x of [w * 0.25, w * 0.62]) put(b, 'food-table', x, h * 0.74, 32, 32, 22, '#f0ebe0');
  },
  vaultBank(b, w, h){
    // LEGAL: Behind the counters: hazard tape along the vault approach, a camera over the corner, lockers.
    for(let x = 30; x < w - 20; x += 26) b.pieces.push(box(x, h - 34, 12, 14, 0.6, '#d4a017'));
    b.pieces.push(box(w - 16, 10, 8, 8, 6, '#8a939c', WALL_HEIGHT - 14), { shape:'sphere', x:w - 16, z:15, w:3, d:3, h:3, y:WALL_HEIGHT - 12, color:'#000000', emissive:'#ff3030' });
    put(b, 'lockers', w - 14, h * 0.4, 20, 78, 44, '#3e4a3a', { turn:-Math.PI / 2 });
    put(b, 'filing-cabinet', 18, h * 0.44, 26, 26, 40, '#4a4856', { turn:Math.PI / 2 });
  },
  alley(b, w, h){
    put(b, 'crate-stack', 30, h - 40, 42, 22, 38, '#8a6a42');
    put(b, 'crate-stack', w - 40, 40, 42, 22, 38, '#8a6a42');
  },
};

// LEGAL: The stairs, escalator or lift between floors, on every floor that has them.
function stairsFor(b: Builder, plan: InteriorPlan, floor: number): void {
  if(!plan.stairs) return;
  const { x, z, kind } = plan.stairs;
  if(kind === 'lift'){ put(b, 'lift', x, 0, 34, 6, 56, '#5c6470', { solid:false }); b.solids.push(solidOf(x, 3, 34, 6)); return; }
  if(floor > 0){ stairwellDown(b, x, z, kind === 'escalator' ? 30 : 32, kind === 'escalator' ? 100 : 84, kind === 'escalator' ? '#8a929c' : '#6b4a2c'); return; }
  if(kind === 'escalator') put(b, 'escalator', x, z, 30, 100, 80, '#5c6470');
  else put(b, 'staircase', x, z, 32, 84, 80, '#6b4a2c');
}

// LEGAL: Upstairs, the way down: an opening in the floor where the stairs drop away from the landing,
// LEGAL: each step darker than the one above it, railed on three sides and open where you step on.
// LEGAL: It used to be the same rising staircase as downstairs, so "stairs down" looked like stairs up.
function stairwellDown(b: Builder, x: number, z: number, w: number, d: number, tread: string): void {
  const STEPS = 7;
  b.pieces.push(box(x, z, w + 4, d + 4, 0.25, '#0b0907', 0.05));
  for(let i = 0; i < STEPS; i++){
    const depth = d / STEPS;
    const cz = z + d / 2 - depth * (i + 0.5);
    b.pieces.push(box(x, cz, w - 2, depth - 1.2, 0.3, shade(tread, 1 - i / STEPS * 0.85), 0.3));
    b.pieces.push(box(x, cz + depth / 2 - 0.8, w - 2, 1.2, 0.35, shade('#d8d0c0', 1 - i / STEPS * 0.8), 0.3));
  }
  const rail = '#2a2420', top = 26;
  for(const side of [-1, 1]){
    const rx = x + side * (w / 2 + 2);
    for(let pz = z - d / 2; pz <= z + d / 2 - 6; pz += 14) b.pieces.push(box(rx, pz, 1.6, 1.6, top, rail));
    b.pieces.push(box(rx, z - 3, 2.2, d - 6, 2, rail, top));
  }
  for(let px = x - w / 2; px <= x + w / 2; px += 10) b.pieces.push(box(px, z - d / 2 - 2, 1.6, 1.6, top, rail));
  b.pieces.push(box(x, z - d / 2 - 2, w + 6, 2.2, 2, rail, top));
  b.solids.push(solidOf(x, z, w + 6, d));
}

// LEGAL: A colour darkened toward black by `amount` (1 keeps it, 0 is black).
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.round(((n >> shift) & 255) * Math.max(0, Math.min(1, amount))).toString(16).padStart(2, '0');
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

// LEGAL: Whether a theme builds its own decor (the rest keep interiorLayout's older per-kind rooms).
export function themeHasDecor(theme: RoomTheme): boolean { return !!THEMES[theme]; }

export function themeDecor(plan: InteriorPlan, refId: string, floor: number): Prop {
  const b = builder();
  THEMES[plan.theme]?.(b, plan.w, plan.h, plan.look, refId, floor);
  stairsFor(b, plan, floor);
  plan.regulars.filter(r => r.floor === floor).forEach(r => staff(b, r.x, r.z - 2, r.id, r.coat));
  return { pieces:b.pieces, fixtures:b.fixtures, solids:b.solids, people:b.people, walkers:b.walkers, cars:b.cars };
}
