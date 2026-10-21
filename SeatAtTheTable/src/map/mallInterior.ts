import type { Solid } from '../config/types';
import { MALL_SHOPS, type MallShop } from '../config/mallShops';
import { PERSON_FACING_DOOR, WALL_HEIGHT, ball, box, cyl, fixture, solidOf, solidUnder, type InteriorFixture, type InteriorPiece, type InteriorSpot, type InteriorWalker, type Prop } from './interiorPieces';

// LEGAL: Inside Lakeridge Mall: shopfronts along the back, a fountain in the middle with a perfume
// LEGAL: kiosk and an ice cream cart either side of it, a food court on the left, an indoor
// LEGAL: playground on the right, and shoppers walking round. It should feel like walking outside.
// LEGAL: Positions are in the mall's room units (core/header.ts MALL_ROOM is 1000 x 640).
export const MALL_ROOM = { w:1000, h:640 };

// LEGAL: Where each hotspot sits; core/header.ts builds the mall's hotspots from these.
const SHOP_X = [120, 310, 500, 690, 880];
export const MALL_SHOP_DEPTH = 110;
export const MALL_SPOTS = {
  shops:MALL_SHOPS.map((shop, i) => ({ shop, x:SHOP_X[i], y:150 })),
  perfume:{ x:300, y:450 },
  icecream:{ x:700, y:415 },
  foodcourt:{ x:70, y:300 },
  playground:{ x:740, y:380 },
};
const FOUNTAIN = { x:500, z:360, r:54 };

// LEGAL: The upper concourse, up the escalator: an arcade on the left, the cinema on the right.
export const MALL_UPPER_SPOTS = { arcade:{ x:260, y:260 }, cinema:{ x:760, y:250 } };
export function mallUpperDecor(): Prop {
  const fixtures: InteriorFixture[] = [];
  const solids: Solid[] = [];
  const glows = ['#ffd23a', '#5ad1ff', '#ff6b9a', '#5ad18a', '#c040ff', '#ff8a2a'];
  glows.forEach(function(glow, i){
    const x = 150 + i * 30;
    fixtures.push(fixture('slot-machine', x, 200, [box(x, 200, 24, 20, 46, '#2a2d33')], { recolour:{ screen:glow, cabinet:'#2a2d33' } }));
  });
  solids.push(solidOf(225, 200, 184, 22));
  fixtures.push(fixture('ticket-booth', 760, 180, [box(760, 180, 40, 36, 50, '#5c6470')]));
  solids.push(solidOf(760, 180, 40, 36));
  for(const x of [640, 880]){ fixtures.push(fixture('notice-board', x, 120, [box(x, 120, 66, 4, 66, '#6b4a2c')], { recolour:{ wood:'#2a2d33' } })); solids.push(solidOf(x, 120, 70, 8)); }
  for(const [x, z] of [[380, 420], [620, 420]] as const){ fixtures.push(fixture('bench-row', x, z, [box(x, z, 72, 14, 20, '#3a6a9a')], { turn:Math.PI })); solids.push(solidOf(x, z, 72, 14)); }
  for(const x of [460, 540]){ fixtures.push(fixture('planter', x, 560, [box(x, 560, 40, 40, 14, '#8a7a62')])); solids.push(solidOf(x, 560, 40, 40)); }
  // LEGAL: The glass balustrade over the hall below runs across the middle.
  const pieces: InteriorPiece[] = [box(500, 320, 260, 4, 18, '#cfe8f4', 0)];
  solids.push(solidOf(500, 320, 260, 6));
  const walkers: InteriorWalker[] = [
    { path:[{ x:200, z:300 }, { x:800, z:300 }, { x:800, z:500 }, { x:200, z:500 }], speed:30, offset:0.2, identity:'mall:upper:1', coat:'#5a7c8a', scale:1 },
    { path:[{ x:240, z:270 }, { x:320, z:270 }], speed:20, offset:0, identity:'mall:upper:kid', coat:'#e85a5a', scale:0.58 },
  ];
  return { pieces, fixtures, solids, people:[{ x:760, z:150, facing:Math.PI / 2, identity:'mall:usher', coat:'#7a2630' }], walkers };
}

function shopDisplay(shop: MallShop, cx: number): InteriorPiece[] {
  const pieces: InteriorPiece[] = [];
  switch(shop.id){
    case 'crown':
      for(const dx of [-55, 55]){
        pieces.push(cyl(cx + dx, 76, 2, 34, '#5a4632'), cyl(cx + dx, 76, 9, 6, shop.color, 34), cyl(cx + dx, 76, 13, 1.4, shop.color, 34));
      }
      for(let i = 0; i < 5; i++) pieces.push(cyl(cx - 52 + i * 26, 6, 8, 7, ['#2a2a2a', '#7a2630', '#c9b48e', '#2f4a6a', '#3f5a3a'][i], 44));
      break;
    case 'spectacle':
      pieces.push(box(cx, 3, 140, 4, 40, '#e8e6e0', 20));
      for(let row = 0; row < 3; row++) for(let i = 0; i < 7; i++) pieces.push(box(cx - 54 + i * 18, 5.5, 12, 1, 4, '#141414', 26 + row * 11));
      break;
    case 'gold':
      for(const dx of [-50, 50]){
        pieces.push(box(cx + dx, 80, 36, 20, 24, '#3a3028'), box(cx + dx, 80, 34, 18, 10, '#bfe3f0', 24, '#5a7a8a'));
        for(let i = 0; i < 3; i++) pieces.push(ball(cx + dx - 10 + i * 10, 80, 2, '#e8c24a', 26));
      }
      break;
    case 'sole':
      pieces.push(box(cx, 4, 150, 8, 56, '#6a4a32'));
      for(let row = 0; row < 4; row++) for(let i = 0; i < 8; i++) pieces.push(box(cx - 63 + i * 18, 9, 12, 6, 5, ['#f0efe8', '#111217', '#7a2630', '#2f4a6a'][(i + row) % 4], 6 + row * 13));
      pieces.push(box(cx - 50, 86, 34, 14, 10, '#3a3f4b'), box(cx + 50, 86, 34, 14, 10, '#3a3f4b'));
      break;
    case 'fade':
      for(const dx of [-48, 48]){
        pieces.push(box(cx + dx, 3, 34, 2, 30, '#000000', 22, '#cfd8dc'), cyl(cx + dx, 26, 5, 12, '#b9bcc4'), box(cx + dx, 26, 18, 16, 8, '#8a1f2a', 12), box(cx + dx, 19, 18, 3, 16, '#8a1f2a', 18));
      }
      // LEGAL: The barber's pole by the door.
      pieces.push(cyl(cx + 78, 104, 3, 30, '#f0efe8', 4), cyl(cx + 78, 104, 3.2, 4, '#c0392b', 12), cyl(cx + 78, 104, 3.2, 4, '#2f4a9a', 22));
      break;
  }
  return pieces;
}

// LEGAL: A shop unit: partition walls each side, its colour across the top of the open front, a
// LEGAL: counter with the shopkeeper behind it, and what it sells on display.
function shopProp(shop: MallShop, cx: number, refId: string): Prop {
  const half = 85;
  const pieces: InteriorPiece[] = [
    box(cx - half, MALL_SHOP_DEPTH / 2, 6, MALL_SHOP_DEPTH, WALL_HEIGHT, '#d8d0c0'),
    box(cx + half, MALL_SHOP_DEPTH / 2, 6, MALL_SHOP_DEPTH, WALL_HEIGHT, '#d8d0c0'),
    box(cx, MALL_SHOP_DEPTH, 176, 4, 16, shop.color, 56, shop.color),
    box(cx, MALL_SHOP_DEPTH / 2, 164, MALL_SHOP_DEPTH, 0.4, '#cfc6b4'),
    box(cx, 46, 80, 18, 22, '#f0ebe0'), box(cx, 46, 84, 22, 3, shop.color, 22),
    ...shopDisplay(shop, cx),
  ];
  const solids: Solid[] = [
    solidOf(cx - half, MALL_SHOP_DEPTH / 2, 6, MALL_SHOP_DEPTH),
    solidOf(cx + half, MALL_SHOP_DEPTH / 2, 6, MALL_SHOP_DEPTH),
    solidOf(cx, 40, 84, 34),
  ];
  return { pieces, solids, people:[{ x:cx, z:24, facing:PERSON_FACING_DOOR, identity:`${refId}:${shop.id}`, coat:shop.color }] };
}

export function mallSpotProp(spot: InteriorSpot, refId: string): Prop | null {
  const shop = MALL_SHOPS.find(s => spot.id === `shop:${s.id}`);
  if(shop) return shopProp(shop, spot.x, refId);
  // LEGAL: The kiosks, food court and playground are part of the hall itself (mallDecor).
  if(['perfume', 'icecream', 'foodcourt', 'playground'].includes(spot.id)) return { pieces:[], people:[], solids:[] };
  return null;
}

function fountain(): Prop {
  const { x, z, r } = FOUNTAIN;
  return {
    pieces:[],
    fixtures:[fixture('fountain', x, z, [cyl(x, z, r, 10, '#cfc9bb'), cyl(x, z, r - 6, 10.6, '#3a8ab0', 0, '#1a4a6a'), cyl(x, z, 7, 34, '#cfc9bb'), cyl(x, z, 20, 4, '#cfc9bb', 30), cyl(x, z, 16, 4.4, '#5ab0d8', 30, '#2a6a8a')])],
    people:[], solids:[solidOf(x, z, r * 2, r * 2)],
  };
}

// LEGAL: The perfume seller doesn't stay behind her kiosk; she's out front with a tester.
function perfumeKiosk(): Prop {
  const x = 300, z = 360;
  const pieces = [cyl(x, z, 30, 24, '#f4e6ee'), cyl(x, z, 32, 3, '#c98aa8', 24)];
  for(let i = 0; i < 8; i++){
    const a = (i / 8) * Math.PI * 2;
    pieces.push(cyl(x + Math.cos(a) * 20, z + Math.sin(a) * 20, 2.6, 8, ['#e8b4c8', '#b4d8e8', '#f0d890', '#c8e0b4'][i % 4], 27));
  }
  pieces.push(cyl(x, z, 3, 40, '#c98aa8', 27), box(x, z, 40, 3, 16, '#c98aa8', 60));
  return { pieces:[], fixtures:[fixture('perfume-kiosk', x, z, pieces)], solids:[solidOf(x, z, 64, 64)], people:[{ x, z:410, facing:PERSON_FACING_DOOR, identity:'mall:perfume', coat:'#c98aa8' }] };
}

function iceCreamCart(): Prop {
  const x = 700, z = 360;
  const pieces = [
    box(x, z, 54, 26, 22, '#f0efe8', 6), box(x, z + 13.2, 50, 1, 14, '#5ab0d8', 8),
    cyl(x - 20, z + 10, 6, 6, '#2a2a2a'), cyl(x + 20, z + 10, 6, 6, '#2a2a2a'),
    cyl(x, z, 1.6, 50, '#d6d0c0', 28), { shape:'sphere' as const, x, z, w:66, d:66, h:14, y:72, color:'#e85a8a' },
    ball(x - 12, z - 4, 4, '#f0d0e0', 28), ball(x, z - 4, 4, '#f0e0a0', 28), ball(x + 12, z - 4, 4, '#8a5a3a', 28),
  ];
  return { pieces:[], fixtures:[fixture('ice-cream-cart', x, z, pieces)], solids:[solidOf(x, z, 56, 28)], people:[{ x, z:z - 26, facing:PERSON_FACING_DOOR, identity:'mall:icecream', coat:'#5ab0d8' }] };
}

function foodCourt(): Prop {
  const fixtures: InteriorFixture[] = [];
  const solids: Solid[] = [];
  const people: Prop['people'] = [];
  // LEGAL: Two food counters on the left wall with lit menus, and tables to sit at.
  for(const [z, color, menu] of [[240, '#c0392b', '#f0c060'], [400, '#2f6b4a', '#f0e0b0']] as const){
    fixtures.push(fixture('food-counter', 30, z, [box(30, z, 26, 100, 24, color), box(30, z, 30, 104, 3, '#f0ebe0', 24), box(1.5, z, 2, 80, 22, '#000000', 40, menu)], { recolour:{ counter:color, menu } }));
    solids.push(solidOf(30, z, 30, 104));
    people.push({ x:12, z, facing:0, identity:`mall:cook:${z}`, coat:'#f0efe8' });
  }
  for(const x of [140, 220]) for(const z of [250, 350, 450]){
    const table = [cyl(x, z, 16, 2, '#f0ebe0', 20), cyl(x, z, 2.5, 20, '#5a5e66')];
    for(const [dx, dz] of [[-24, 0], [24, 0], [0, -24], [0, 24]] as const) table.push(box(x + dx, z + dz, 10, 10, 12, '#c0392b'));
    fixtures.push(fixture('food-table', x, z, table));
    solids.push(solidOf(x, z, 32, 32));
  }
  return { pieces:[], fixtures, solids, people };
}

function playground(): Prop {
  const pieces: InteriorPiece[] = [];
  const solids: Solid[] = [];
  const x0 = 790, x1 = 990, z0 = 220, z1 = 540;
  pieces.push(box((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0.6, '#3a8a5a'));
  // LEGAL: A low fence with a gap facing the fountain.
  const fence = (x: number, z: number, w: number, d: number) => { pieces.push(box(x, z, w, d, 14, '#f0c040')); solids.push(solidOf(x, z, w, d)); };
  fence(x0, (z0 + 350) / 2, 4, 350 - z0);
  fence(x0, (410 + z1) / 2, 4, z1 - 410);
  fence((x0 + x1) / 2, z0, x1 - x0, 4);
  fence((x0 + x1) / 2, z1, x1 - x0, 4);
  // LEGAL: Climbing frame with a slide off it, and a ball pit.
  const frame: InteriorPiece[] = [];
  for(const [dx, dz] of [[0, 0], [50, 0], [0, 50], [50, 50]] as const) frame.push(box(860 + dx, 270 + dz, 4, 4, 40, '#c0392b'));
  frame.push(box(885, 295, 56, 56, 4, '#2f6bb0', 36), box(885, 295, 60, 60, 2, '#f0c040', 52), box(940, 295, 50, 16, 3, '#f0c040', 18));
  solids.push(solidOf(885, 295, 60, 60));
  const pit = [box(900, 470, 90, 4, 12, '#2f6bb0'), box(900, 510, 90, 4, 12, '#2f6bb0'), box(855, 490, 4, 44, 12, '#2f6bb0'), box(945, 490, 4, 44, 12, '#2f6bb0')];
  solids.push(solidOf(900, 490, 94, 44));
  const colours = ['#e85a5a', '#f0c040', '#5ab0d8', '#5ad18a', '#c98aa8'];
  for(let i = 0; i < 36; i++) pit.push(ball(862 + (i % 9) * 9.5, 476 + Math.floor(i / 9) * 9, 4, colours[i % 5], 2 + (i % 3)));
  return { pieces, fixtures:[fixture('climbing-frame', 885, 295, frame), fixture('ball-pit', 900, 490, pit)], solids, people:[] };
}

function seating(): Prop {
  const fixtures: InteriorFixture[] = [];
  const solids: Solid[] = [];
  // LEGAL: Benches facing the fountain, planters by the door and columns holding up the roof.
  for(const [x, z, w, d] of [[500, 432, 60, 12], [500, 288, 60, 12]] as const){
    const bench = box(x, z, w, d, 9, '#6a4a32');
    fixtures.push(fixture('mall-bench', x, z, [bench, box(x, z, w, 3, 3, '#3a3f4b', 9)]));
    solids.push(solidUnder(bench));
  }
  for(const x of [380, 620]){
    fixtures.push(fixture('planter', x, 580, [box(x, 580, 40, 40, 14, '#8a7a62'), ball(x, 580, 18, '#3c7a44', 14)]));
    solids.push(solidOf(x, 580, 40, 40));
  }
  // LEGAL: The room's column model is 12 across; these are 10.
  for(const [x, z] of [[260, 200], [740, 200], [260, 560], [740, 560]] as const){
    fixtures.push(fixture('column', x, z, [cyl(x, z, 10, WALL_HEIGHT, '#efeae0'), cyl(x, z, 13, 5, '#c9a227')], { scale:[10 / 12, 1, 10 / 12], recolour:{ stone:'#efeae0', flute:'#e2ddd0' } }));
    solids.push(solidOf(x, z, 20, 20));
  }
  return { pieces:[], fixtures, solids, people:[] };
}

function shoppers(): InteriorWalker[] {
  const loop = [{ x:380, z:250 }, { x:620, z:250 }, { x:620, z:510 }, { x:380, z:510 }];
  const back = [...loop].reverse();
  const front = [{ x:60, z:190 }, { x:940, z:190 }];
  const kids = [{ x:830, z:250 }, { x:960, z:250 }, { x:960, z:400 }, { x:830, z:400 }];
  return [
    { path:loop, speed:38, offset:0, identity:'mall:shopper:1', coat:'#5a7c8a', scale:1 },
    { path:loop, speed:34, offset:0.5, identity:'mall:shopper:2', coat:'#8a5a3a', scale:1 },
    { path:back, speed:40, offset:0.25, identity:'mall:shopper:3', coat:'#3f5a3a', scale:1 },
    { path:front, speed:36, offset:0.1, identity:'mall:shopper:4', coat:'#7a2630', scale:1 },
    { path:front, speed:30, offset:0.6, identity:'mall:shopper:5', coat:'#2b2f3a', scale:1 },
    { path:kids, speed:56, offset:0, identity:'mall:kid:1', coat:'#e85a5a', scale:0.58 },
    { path:[...kids].reverse(), speed:62, offset:0.4, identity:'mall:kid:2', coat:'#5ab0d8', scale:0.55 },
  ];
}

export function mallDecor(): Prop {
  const parts = [fountain(), perfumeKiosk(), iceCreamCart(), foodCourt(), playground(), seating()];
  return {
    pieces:parts.flatMap(p => p.pieces),
    solids:parts.flatMap(p => p.solids),
    people:parts.flatMap(p => p.people),
    fixtures:parts.flatMap(p => p.fixtures ?? []),
    walkers:shoppers(),
  };
}
