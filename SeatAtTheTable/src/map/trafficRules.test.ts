import { describe, expect, it } from 'vitest';
import { SIGNAL_ALL_RED_SECONDS, SIGNAL_GREEN_SECONDS, axisOf, blockerPace, followingPace, signalGreen, signalPace } from './trafficRules';

const junction = { x: 1000, y: 500 };
const EAST = 0, SOUTH = Math.PI / 2;

// LEGAL: A time when this junction shows green for `axis`, found by stepping through a cycle.
function timeWhen(axis: 'ns' | 'ew', green: boolean): number {
  for(let t = 0; t < 40; t += 0.25) if(signalGreen(axis, junction, t) === green && signalGreen(axis === 'ns' ? 'ew' : 'ns', junction, t) !== green) return t;
  throw new Error('no such time');
}

describe('traffic lights', function () {
  it('never shows green both ways at once, and gives each way its turn', function () {
    let ns = 0, ew = 0;
    for(let t = 0; t < 32.8; t += 0.1){
      const a = signalGreen('ns', junction, t), b = signalGreen('ew', junction, t);
      expect(a && b).toBe(false);
      if(a) ns++; if(b) ew++;
    }
    expect(ns).toBeGreaterThan(SIGNAL_GREEN_SECONDS * 10);
    expect(ew).toBeGreaterThan(SIGNAL_GREEN_SECONDS * 10);
    expect(SIGNAL_ALL_RED_SECONDS).toBeGreaterThan(0);
  });

  it('stops a car at the line on red, and lets it through on green', function () {
    const red = timeWhen('ew', false);
    const atLine = { id: 'a', x: junction.x - 74, y: junction.y + 18, facing: EAST };
    expect(signalPace(atLine, [junction], red)).toBe(0);
    expect(signalPace(atLine, [junction], timeWhen('ew', true))).toBe(1);
  });

  it('starts braking before the line rather than stopping dead', function () {
    const car = { id: 'a', x: junction.x - 100, y: junction.y + 18, facing: EAST };
    const pace = signalPace(car, [junction], timeWhen('ew', false));
    expect(pace).toBeGreaterThan(0);
    expect(pace).toBeLessThan(1);
  });

  it('lets a car already in the junction carry on through a red', function () {
    const inside = { id: 'a', x: junction.x - 20, y: junction.y + 18, facing: EAST };
    expect(signalPace(inside, [junction], timeWhen('ew', false))).toBe(1);
  });

  it('reads which way a car is going', function () {
    expect(axisOf(EAST)).toBe('ew');
    expect(axisOf(SOUTH)).toBe('ns');
  });
});

describe('following', function () {
  const car = { id: 'me', x: 0, y: 0, facing: EAST };

  it('stops behind a car close in front in the same lane', function () {
    expect(followingPace(car, [{ id: 'front', x: 68, y: 0, facing: EAST }])).toBe(0);
  });

  it('ignores cars behind, in the other lane, or crossing', function () {
    expect(followingPace(car, [
      { id: 'behind', x: -40, y: 0, facing: EAST },
      { id: 'oncoming', x: 60, y: -36, facing: Math.PI },
      { id: 'crossing', x: 60, y: 0, facing: SOUTH },
    ])).toBe(1);
  });

  it('eases off for a car a little way ahead', function () {
    const pace = followingPace(car, [{ id: 'front', x: 95, y: 0, facing: EAST }]);
    expect(pace).toBeGreaterThan(0);
    expect(pace).toBeLessThan(1);
  });
});

// LEGAL: Traffic drove straight through the player's car, because only a car it was following made it
// LEGAL: slow down. It now stops short of the player in its lane, whichever way the player faces.
describe('braking for the player', () => {
  const car = { id:'t1', x:0, y:0, facing:0 };
  it('stops for a car parked across its lane just ahead', () => {
    expect(blockerPace(car, { x:50, y:0, radius:28 })).toBe(0);
  });
  it('slows as it closes in and ignores what is far ahead, behind or in the next lane', () => {
    const near = blockerPace(car, { x:120, y:0, radius:28 });
    expect(near).toBeGreaterThan(0); expect(near).toBeLessThan(1);
    expect(blockerPace(car, { x:400, y:0, radius:28 })).toBe(1);
    expect(blockerPace(car, { x:-60, y:0, radius:28 })).toBe(1);
    expect(blockerPace(car, { x:60, y:80, radius:28 })).toBe(1);
  });
});
