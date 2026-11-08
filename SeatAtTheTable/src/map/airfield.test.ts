import { describe, expect, it } from 'vitest';
import type { Solid } from '../config/types';
import { AIRFIELD_AREA, AIRFIELD_GATE, AIRFIELD_PRICES, APRON, DROP_ZONES, HANGAR, LESSON_RINGS, PLANE_STAND, RUNWAY, TAKEOFF_START, airfieldSolids, canTakeOff, cargoPay, dropResult, landingCheck, lessonTimeLimit, nextDropZone, onRunway, ringPassed } from './airfield';
import { isPointInWater } from './geometry';
import { windhavenMapModel } from './mapModel';
import { actorRadius, collidesSolid } from './movement';
import { createOutskirtSceneryLayout } from './outskirtScenery';
import { onAnyRoad } from './queries';
import { UNITS_PER_METRE } from './scale';
import { OUTSKIRT_PLACE_LOTS } from './world';

const metres = (units: number) => units / UNITS_PER_METRE;
const AREA: Solid = { x:(AIRFIELD_AREA.x0 + AIRFIELD_AREA.x1) / 2, y:(AIRFIELD_AREA.y0 + AIRFIELD_AREA.y1) / 2, hw:(AIRFIELD_AREA.x1 - AIRFIELD_AREA.x0) / 2, hd:(AIRFIELD_AREA.y1 - AIRFIELD_AREA.y0) / 2 };

describe('Kettle Flats Airfield', () => {
  it('is where the game places it', () => {
    expect(OUTSKIRT_PLACE_LOTS.airfieldKettle).toEqual(AIRFIELD_GATE);
  });

  it('is a real strip: about 90 m of runway, 10 m wide, and a hangar a crop-duster fits in', () => {
    expect(metres(RUNWAY.x1 - RUNWAY.x0)).toBeGreaterThan(85);
    expect(metres(RUNWAY.width)).toBeGreaterThanOrEqual(10);
    expect(metres(HANGAR.w)).toBeGreaterThan(18);
    expect(metres(HANGAR.h)).toBeGreaterThan(5);
    expect(APRON.y1).toBeGreaterThan(APRON.y0);
  });

  it('stands on dry land, off every road, with nothing else built on it', () => {
    for(let x = AIRFIELD_AREA.x0; x <= AIRFIELD_AREA.x1; x += 20){
      for(let y = AIRFIELD_AREA.y0; y <= AIRFIELD_AREA.y1; y += 20){
        expect(isPointInWater({ x, y }, 0), `water at ${x},${y}`).toBe(false);
        expect(onAnyRoad({ x, y }, 0), `road at ${x},${y}`).toBe(false);
      }
    }
    createOutskirtSceneryLayout().forEach(item => expect(Math.abs(item.x - AREA.x) < AREA.hw && Math.abs(item.y - AREA.y) < AREA.hd, `${item.kind} at ${Math.round(item.x)},${Math.round(item.y)}`).toBe(false));
  });

  it('leaves the car park, the apron and the runway open', () => {
    const solids = airfieldSolids();
    [AIRFIELD_GATE, PLANE_STAND, TAKEOFF_START, { x:RUNWAY.x1 - 40, y:RUNWAY.y }].forEach(p => expect(collidesSolid(p.x, p.y, solids, actorRadius(true)), `${p.x},${p.y}`).toBe(false));
  });
});

describe('flying the plane', () => {
  const top = 500;
  it('takes off only on the runway, lined up with it and fast enough', () => {
    expect(canTakeOff({ x:-600, y:RUNWAY.y }, 0, top * 0.8, top)).toBe(true);
    expect(canTakeOff({ x:-600, y:RUNWAY.y }, Math.PI, top * 0.8, top)).toBe(true);
    expect(canTakeOff({ x:-600, y:RUNWAY.y }, 0, top * 0.4, top)).toBe(false);
    expect(canTakeOff({ x:-600, y:RUNWAY.y }, Math.PI / 2, top * 0.8, top)).toBe(false);
    expect(canTakeOff({ x:-600, y:RUNWAY.y - 200 }, 0, top * 0.8, top)).toBe(false);
  });

  it('lands only on the runway, lined up and slow enough, and says why not', () => {
    expect(landingCheck({ x:-500, y:RUNWAY.y }, 0.1, top * 0.5, top)).toBe('ok');
    expect(landingCheck({ x:400, y:RUNWAY.y }, 0, top * 0.5, top)).toBe('not-runway');
    expect(landingCheck({ x:-500, y:RUNWAY.y }, 1.2, top * 0.5, top)).toBe('not-aligned');
    expect(landingCheck({ x:-500, y:RUNWAY.y }, 0, top, top)).toBe('too-fast');
  });

  it('starts the take-off roll on the runway', () => {
    expect(onRunway(TAKEOFF_START)).toBe(true);
  });
});

describe('the flying lesson', () => {
  it('has rings spread out inside the edge of the world', () => {
    const b = windhavenMapModel.landBounds;
    LESSON_RINGS.forEach(r => expect(r.x > b.minX - 200 && r.x < b.maxX + 200 && r.y > b.minY - 200 && r.y < b.maxY + 200, `${r.x},${r.y}`).toBe(true));
    LESSON_RINGS.slice(1).forEach((r, i) => expect(Math.hypot(r.x - LESSON_RINGS[i].x, r.y - LESSON_RINGS[i].y)).toBeGreaterThan(400));
  });

  it('counts a ring when you fly through it, not past it', () => {
    expect(ringPassed({ x:LESSON_RINGS[0].x + 30, y:LESSON_RINGS[0].y }, LESSON_RINGS[0])).toBe(true);
    expect(ringPassed({ x:LESSON_RINGS[0].x + 200, y:LESSON_RINGS[0].y }, LESSON_RINGS[0])).toBe(false);
  });

  it('gives time for the course at cruising speed, with room to turn, but not all day', () => {
    const limit = lessonTimeLimit(500);
    expect(limit).toBeGreaterThan(30);
    expect(limit).toBeLessThan(180);
  });
});

describe("Deke's cargo runs", () => {
  it('drops on land you can see, away from the strip', () => {
    DROP_ZONES.forEach(function(zone){
      expect(isPointInWater(zone, 60), zone.id).toBe(false);
      expect(Math.hypot(zone.x - RUNWAY.x0, zone.y - RUNWAY.y), zone.id).toBeGreaterThan(2000);
    });
  });

  it('pays more for a bullseye and for a longer flight, and nothing for a miss', () => {
    const near = DROP_ZONES.reduce((a, b) => Math.hypot(a.x - RUNWAY.x0, a.y - RUNWAY.y) < Math.hypot(b.x - RUNWAY.x0, b.y - RUNWAY.y) ? a : b);
    const far = DROP_ZONES.reduce((a, b) => Math.hypot(a.x - RUNWAY.x0, a.y - RUNWAY.y) > Math.hypot(b.x - RUNWAY.x0, b.y - RUNWAY.y) ? a : b);
    expect(dropResult(near, near)).toBe('bullseye');
    expect(dropResult({ x:near.x + 60, y:near.y }, near)).toBe('hit');
    expect(dropResult({ x:near.x + 300, y:near.y }, near)).toBe('miss');
    expect(cargoPay(near, 'bullseye')).toBeGreaterThan(cargoPay(near, 'hit'));
    expect(cargoPay(far, 'hit')).toBeGreaterThan(cargoPay(near, 'hit'));
    expect(cargoPay(near, 'miss')).toBe(0);
    expect(cargoPay(near, 'hit')).toBeGreaterThan(AIRFIELD_PRICES.charterFee);
  });

  it('never sends you to the same drop twice in a row', () => {
    for(let roll = 0; roll < 1; roll += 0.05) expect(nextDropZone('north-shore', roll).id).not.toBe('north-shore');
  });
});
