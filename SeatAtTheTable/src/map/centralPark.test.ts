import { describe, expect, it } from 'vitest';
import { CENTRAL_PARK, centralParkSolids, inPond, parkPaths, parkTrees } from './centralPark';
import { COUNTRY_ROADS } from './countryRoads';
import { distancePointToSegment } from './layout';
import { roadDeadEnds } from './mapModel';
import { OUTSKIRT_PLACE_LOTS } from './world';

const inside = (p: { x: number; y: number }) => CENTRAL_PARK.some(r => p.x > r.x0 && p.x < r.x1 && p.y > r.y0 && p.y < r.y1);

describe('Central Park', function () {
  it('is full of trees, none of them on a path or in the pond', function () {
    const trees = parkTrees();
    expect(trees.length).toBeGreaterThan(60);
    for(const tree of trees){
      expect(inside(tree)).toBe(true);
      expect(inPond(tree)).toBe(false);
      expect(parkPaths().some(r => tree.x > r.x0 - 4 && tree.x < r.x1 + 4 && tree.y > r.y0 - 4 && tree.y < r.y1 + 4)).toBe(false);
    }
  });

  it('leaves Ridgewood Lane and the turning circles clear', function () {
    const lane = COUNTRY_ROADS.find(road => road.id === 'road-country-ridgewood')!;
    for(const rect of CENTRAL_PARK) for(let y = rect.y0; y <= rect.y1; y += 10) for(const x of [rect.x0, rect.x1]){
      const d = Math.min(...lane.path.slice(0, -1).map((a, i) => distancePointToSegment(x, y, a.x, a.y, lane.path[i + 1].x, lane.path[i + 1].y)));
      expect(d).toBeGreaterThan(lane.width / 2 + 8);
    }
    for(const end of roadDeadEnds()){
      const radius = end.road.width * 0.82 + 11;
      for(const rect of CENTRAL_PARK){
        const nx = Math.max(rect.x0, Math.min(rect.x1, end.point.x)), ny = Math.max(rect.y0, Math.min(rect.y1, end.point.y));
        expect(Math.hypot(nx - end.point.x, ny - end.point.y), end.road.name).toBeGreaterThan(radius);
      }
    }
  });

  it('stays clear of the Ridgewood lodge', function () {
    const lodge = OUTSKIRT_PLACE_LOTS.lodgeRidgewood;
    expect(CENTRAL_PARK.some(r => lodge.x > r.x0 - 40 && lodge.x < r.x1 + 40 && lodge.y > r.y0 - 40 && lodge.y < r.y1 + 40)).toBe(false);
  });

  it('makes the trunks and the pond solid', function () {
    expect(centralParkSolids().length).toBe(parkTrees().length + 1);
  });
});
