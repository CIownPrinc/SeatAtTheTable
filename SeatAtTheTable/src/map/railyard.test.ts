import { describe, expect, it } from 'vitest';
import type { Point, Solid } from '../config/types';
import { generateLots, lotSolid } from '../world/data/lots';
import { CENTRAL_PARK } from './centralPark';
import { isPointInWater } from './geometry';
import { windhavenMapModel } from './mapModel';
import { actorRadius, collidesSolid } from './movement';
import { createOutskirtSceneryLayout } from './outskirtScenery';
import { onAnyRoad } from './queries';
import { LEAD, MAIN_LINE_X, RAILYARD_AREA, RAILYARD_GATE, SIDING_END_Y, SIDING_XS, STANDING_CARS, YARD_OFFICE, railyardSolids, sidingStartY } from './railyard';
import { carSize } from './rollingStock';
import { UNITS_PER_METRE } from './scale';
import { distanceToTrails } from './trails';
import { OUTSKIRT_PLACE_LOTS, freightLinePath } from './world';

const metres = (units: number) => units / UNITS_PER_METRE;
const overlaps = (a: Solid, b: Solid) => Math.abs(a.x - b.x) < a.hw + b.hw && Math.abs(a.y - b.y) < a.hd + b.hd;
const AREA: Solid = { x:(RAILYARD_AREA.x0 + RAILYARD_AREA.x1) / 2, y:(RAILYARD_AREA.y0 + RAILYARD_AREA.y1) / 2, hw:(RAILYARD_AREA.x1 - RAILYARD_AREA.x0) / 2, hd:(RAILYARD_AREA.y1 - RAILYARD_AREA.y0) / 2 };

// LEGAL: The railyard was 11 by 8 m on any free lot in the West Side, nowhere near the rails, with
// LEGAL: wagons under 2 m long (user, 2026-10-20: "isn't to scale and isn't near the rails").
describe('the railyard', () => {
  it('sits on the freight line: the lead leaves the line itself and the sidings run beside it', () => {
    const line = freightLinePath();
    expect(MAIN_LINE_X).toBe(line[0].x);
    expect(LEAD.from.x).toBe(MAIN_LINE_X);
    expect(LEAD.from.y).toBeGreaterThan(line[0].y);
    expect(LEAD.from.y).toBeLessThan(line[1].y);
    SIDING_XS.forEach(x => expect(MAIN_LINE_X - x).toBeLessThan(200));
    expect(RAILYARD_AREA.x1).toBeLessThanOrEqual(MAIN_LINE_X - 20);
  });

  it('is where the game places it', () => {
    expect(OUTSKIRT_PLACE_LOTS.railyard).toEqual(RAILYARD_GATE);
  });

  it('is a real yard: about 50 m of sidings, each long enough for wagons', () => {
    expect(metres(RAILYARD_AREA.y1 - RAILYARD_AREA.y0)).toBeGreaterThan(45);
    SIDING_XS.forEach(x => expect(SIDING_END_Y - sidingStartY(x)).toBeGreaterThan(2 * carSize('wagon').length * 0.9));
  });

  it('keeps every standing car on its siding, with room between them', () => {
    STANDING_CARS.forEach(function(car){
      const half = carSize(car.kind).length / 2;
      expect(car.y - half, `${car.kind} on siding ${car.siding}`).toBeGreaterThanOrEqual(sidingStartY(SIDING_XS[car.siding]));
      expect(car.y + half).toBeLessThanOrEqual(SIDING_END_Y);
    });
    SIDING_XS.forEach(function(_x, siding){
      const cars = STANDING_CARS.filter(c => c.siding === siding).sort((a, b) => a.y - b.y);
      cars.slice(1).forEach(function(car, i){
        const before = cars[i];
        expect(car.y - carSize(car.kind).length / 2 - (before.y + carSize(before.kind).length / 2)).toBeGreaterThan(0);
      });
    });
  });

  it('stands on dry land, off every road, clear of Central Park, the lodge and the trails', () => {
    for(let x = RAILYARD_AREA.x0; x <= RAILYARD_AREA.x1; x += 15){
      for(let y = RAILYARD_AREA.y0; y <= RAILYARD_AREA.y1; y += 15){
        const p: Point = { x, y };
        expect(isPointInWater(p, 0), `water at ${x},${y}`).toBe(false);
        expect(onAnyRoad(p, 0), `road at ${x},${y}`).toBe(false);
        expect(distanceToTrails(p), `trail at ${x},${y}`).toBeGreaterThan(10);
      }
    }
    CENTRAL_PARK.forEach(p => expect(overlaps(AREA, { x:(p.x0 + p.x1) / 2, y:(p.y0 + p.y1) / 2, hw:(p.x1 - p.x0) / 2, hd:(p.y1 - p.y0) / 2 })).toBe(false));
    const lodge = OUTSKIRT_PLACE_LOTS.lodgeRidgewood;
    expect(overlaps(AREA, { x:lodge.x, y:lodge.y, hw:70, hd:56 })).toBe(false);
  });

  it('has no city building or countryside tree, barn or house inside it', () => {
    generateLots([]).forEach(lot => expect(overlaps(AREA, lotSolid(lot)), `lot at ${Math.round(lot.x)},${Math.round(lot.y)}`).toBe(false));
    createOutskirtSceneryLayout().forEach(item => expect(overlaps(AREA, { x:item.x, y:item.y, hw:1, hd:1 }), `${item.kind} at ${Math.round(item.x)},${Math.round(item.y)}`).toBe(false));
  });

  it('can be walked into from the Ring Road, through the gate to the office door', () => {
    const solids = railyardSolids();
    const radius = actorRadius(false);
    const ring = windhavenMapModel.roadPaths.find(r => r.name === 'Windhaven Ring Road')!;
    const roadY = ring.path.reduce((best, p) => Math.abs(p.x - RAILYARD_GATE.x) < Math.abs(best.x - RAILYARD_GATE.x) ? p : best).y;
    for(let y = roadY; y >= RAILYARD_GATE.y; y -= 4) expect(collidesSolid(RAILYARD_GATE.x, y, solids, radius), `blocked at y ${y}`).toBe(false);
    const door = YARD_OFFICE.x + YARD_OFFICE.w / 2 + radius + 1;
    for(let x = RAILYARD_GATE.x; x >= door; x -= 4) expect(collidesSolid(x, YARD_OFFICE.y, solids, radius), `blocked at x ${x}`).toBe(false);
  });

  it('has an office the size of its room inside', () => {
    expect(metres(YARD_OFFICE.w)).toBeGreaterThan(10);
    expect(metres(YARD_OFFICE.d)).toBeGreaterThan(6);
    expect(metres(YARD_OFFICE.h)).toBeGreaterThan(3);
  });
});
