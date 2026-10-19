import { describe, expect, it } from 'vitest';
import { isPointInWater, pointInPolygon } from './geometry';
import { WINDHAVEN_LAKE, WINDHAVEN_LANDMASS } from './world';
import type { Point } from '../config/types';

function slowPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for(let i = 0, j = polygon.length - 1; i < polygon.length; j = i++){
    const pi = polygon[i];
    const pj = polygon[j];
    if(((pi.y > point.y) !== (pj.y > point.y)) && point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x) inside = !inside;
  }
  return inside;
}

describe('pointInPolygon with a cached bounding box', function () {
  it('gives the same answer as a full scan across the whole world', function () {
    for(const polygon of [WINDHAVEN_LANDMASS, WINDHAVEN_LAKE]){
      for(let x = -2000; x <= 9000; x += 137){
        for(let y = -2000; y <= 2500; y += 113){
          expect(pointInPolygon({ x, y }, polygon)).toBe(slowPointInPolygon({ x, y }, polygon));
        }
      }
    }
  });

  it('rejects a point outside the bounds without scanning', function () {
    const square = [{ x:0, y:0 }, { x:10, y:0 }, { x:10, y:10 }, { x:0, y:10 }];

    expect(pointInPolygon({ x:5, y:5 }, square)).toBe(true);
    expect(pointInPolygon({ x:50, y:5 }, square)).toBe(false);
  });
});

describe('canal extent', function () {
  it('is water inside the city, between its banks', function () {
    expect(isPointInWater({ x: 2350, y: 450 }, 0)).toBe(true);
  });

  it('is dry land in the countryside north of the lake at the same x', function () {
    expect(isPointInWater({ x: 2350, y: -1000 }, 0)).toBe(false);
    expect(isPointInWater({ x: 4950, y: -1000 }, 0)).toBe(false);
  });

  it('is dry land south of the city where the canal ends', function () {
    expect(isPointInWater({ x: 2350, y: 1500 }, 0)).toBe(false);
  });
});
