import { describe, expect, it } from 'vitest';
import { interiorLayout, type InteriorSpot } from './interiorLayout';
import { actorRadius, collidesSolid } from './movement';
import { MALL_ROOM, MALL_SPOTS } from './mallInterior';

const ROOM = { w: 480, h: 280, door: { x: 240 } };
const DOOR = { x: 240, y: 234 };
const AMBIENT = { x: 408, y: 154 };
const free = (x: number, y: number, solids: Parameters<typeof collidesSolid>[2]) => !collidesSolid(x, y, solids, actorRadius(false));
const spot = (id: string, x: number, y: number, label = id): InteriorSpot => ({ id, x, y, label, icon: '' });

// LEGAL: The hotspot sets the game builds (core/header.ts hotspotsFor), one per kind of room.
const ROOMS: Array<[string, InteriorSpot[]]> = [
  ['venture', [spot('counter', 240, 80), spot('backoffice', AMBIENT.x, AMBIENT.y)]],
  ['local', [spot('register', 154, 80), spot('owner', 326, 80), spot('board', AMBIENT.x, AMBIENT.y), spot('armory', 240, 148), spot('mission', 86, 80, 'Mission Contact')]],
  ['bankHome', [spot('teller', 240, 80), spot('notices', AMBIENT.x, AMBIENT.y)]],
  ['heist', [spot('vault', 240, 75), spot('security-desk', 96, 213)]],
  ['playerGarage', [spot('fleet', 240, 80), spot('wardrobe', 173, 205), spot('vault', 298, 205), spot('bench', AMBIENT.x, AMBIENT.y)]],
  ['casino', [spot('tables', 240, 78), spot('slots', 150, 110), spot('bar', AMBIENT.x, AMBIENT.y)]],
  ['respray', [spot('bay', 240, 80)]],
  ['dealership', [spot('counter', 240, 80), spot('floor', AMBIENT.x, AMBIENT.y)]],
  ['brokerage', [spot('counter', 240, 80), spot('floor', AMBIENT.x, AMBIENT.y)]],
  ['cityhall', [spot('clerk', 240, 80), spot('notices', AMBIENT.x, AMBIENT.y)]],
  ['missionOffice', [spot('frontdesk', 240, 80)]],
  ['missionOffice', [spot('trailhead', 240, 80)]],
  ['missionOffice', [spot('mission', 86, 80, 'Mission Contact'), spot('screen', 240, 80)]],
  ['missionOffice', [spot('mission', 154, 80, 'Mission Contact'), spot('manifest', 326, 80)]],
  ['missionOffice', [spot('wartable', 240, 80)]],
];

describe('interior rooms', function () {
  it.each(ROOMS)('%s: you can stand on every hotspot and walk to the door', function (kind, spots) {
    const layout = interiorLayout(kind, 'test', ROOM, spots);
    expect(layout.pieces.length).toBeGreaterThan(8);
    for(const hotspot of spots) expect(free(hotspot.x, hotspot.y, layout.solids), hotspot.id).toBe(true);
    expect(free(DOOR.x, DOOR.y, layout.solids)).toBe(true);
    // LEGAL: The middle of the floor, between the hotspots and the door, stays open.
    expect(free(240, 190, layout.solids)).toBe(true);
  });

  it('puts a person behind a counter, so a clerk is someone you talk to', function () {
    const layout = interiorLayout('cityhall', 'cityhall', ROOM, [spot('clerk', 240, 80)]);
    expect(layout.people.some(person => person.z < 80 && Math.abs(person.x - 240) < 1)).toBe(true);
  });

  it('keeps all furniture inside the walls', function () {
    for(const [kind, spots] of ROOMS){
      for(const solid of interiorLayout(kind, 'test', ROOM, spots).solids){
        expect(solid.x - solid.hw, kind).toBeGreaterThanOrEqual(-1);
        expect(solid.x + solid.hw, kind).toBeLessThanOrEqual(ROOM.w + 1);
        expect(solid.y + solid.hd, kind).toBeLessThanOrEqual(ROOM.h + 1);
      }
    }
  });
});

describe('the mall', function () {
  const room = { ...MALL_ROOM, door: { x: MALL_ROOM.w / 2 } };
  const spots = [
    ...MALL_SPOTS.shops.map(entry => spot(`shop:${entry.shop.id}`, entry.x, entry.y, entry.shop.name)),
    spot('perfume', MALL_SPOTS.perfume.x, MALL_SPOTS.perfume.y), spot('icecream', MALL_SPOTS.icecream.x, MALL_SPOTS.icecream.y),
    spot('foodcourt', MALL_SPOTS.foodcourt.x, MALL_SPOTS.foodcourt.y), spot('playground', MALL_SPOTS.playground.x, MALL_SPOTS.playground.y),
    spot('mission', 150, 560, 'Mission Contact'),
  ];
  const layout = interiorLayout('mall', 'mallLakeridge', room, spots);

  it('lets you stand at every shop, kiosk and the door', function () {
    for(const hotspot of spots) expect(free(hotspot.x, hotspot.y, layout.solids), hotspot.id).toBe(true);
    expect(free(MALL_ROOM.w / 2, MALL_ROOM.h - 46, layout.solids)).toBe(true);
  });

  it('has a shopkeeper in every shop and shoppers walking round', function () {
    expect(layout.people.length).toBeGreaterThanOrEqual(MALL_SPOTS.shops.length + 3);
    expect(layout.walkers.some(walker => walker.scale < 1)).toBe(true);
  });

  it('keeps every walker\'s route clear of the furniture', function () {
    for(const walker of layout.walkers){
      walker.path.forEach(function(a, i){
        const b = walker.path[(i + 1) % walker.path.length];
        for(let t = 0; t <= 1; t += 0.05) expect(collidesSolid(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, layout.solids, 4), walker.identity).toBe(false);
      });
    }
  });
});
