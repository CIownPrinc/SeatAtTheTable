import { describe, expect, it } from 'vitest';
import { BANDSTAND, CENTRAL_PARK, CENTRAL_POND, PARK_RUN_RADIUS, centralParkSolids, inPark, inPond, parkPaths, parkRunCheckpoints, parkTrees, pondSolids } from './centralPark';
import { PARK_AMENITY_IDS, mapAmenities } from './amenities';
import { COUNTRY_ROADS } from './countryRoads';
import { distancePointToSegment } from './layout';
import { roadDeadEnds } from './mapModel';
import { OUTSKIRT_PLACE_LOTS } from './world';

const inside = (p: { x: number; y: number }) => CENTRAL_PARK.some(r => p.x > r.x0 && p.x < r.x1 && p.y > r.y0 && p.y < r.y1);

describe('Grunt Park', function () {
  it('is full of trees, none of them on a path or in the pond', function () {
    const trees = parkTrees();
    expect(trees.length).toBeGreaterThan(36);
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

  it('makes the trunks, the bandstand and all of the pond solid', function () {
    expect(centralParkSolids().length).toBe(parkTrees().length + pondSolids().length + 1);
    const solids = pondSolids();
    for(let x = CENTRAL_POND.x - CENTRAL_POND.rx; x <= CENTRAL_POND.x + CENTRAL_POND.rx; x += 4){
      for(let y = CENTRAL_POND.y - CENTRAL_POND.ry; y <= CENTRAL_POND.y + CENTRAL_POND.ry; y += 4){
        if(!inPond({ x, y })) continue;
        expect(solids.some(s => Math.abs(x - s.x) <= s.hw && Math.abs(y - s.y) <= s.hd), `${x},${y}`).toBe(true);
      }
    }
  });

  it('is one park, not a kilometre of strip, with no path running through the pond', function () {
    expect(CENTRAL_PARK.length).toBe(1);
    expect(CENTRAL_PARK[0].x1 - CENTRAL_PARK[0].x0).toBeLessThan(700);
    for(const path of parkPaths()) for(let x = path.x0; x <= path.x1; x += 4) for(let y = path.y0; y <= path.y1; y += 4) expect(inPond({ x, y }, 4)).toBe(false);
  });

  it('has its things to do inside it, on open ground, and a run loop round its paths', function () {
    const park = mapAmenities.filter(a => PARK_AMENITY_IDS.has(a.id));
    expect(park.map(a => a.kind).sort()).toEqual(['bandstand', 'parkgame', 'parkrun']);
    const solids = centralParkSolids();
    park.forEach(function(amenity){
      expect(inPark(amenity), amenity.id).toBe(true);
      expect(solids.some(s => Math.abs(amenity.x - s.x) < s.hw + 6 && Math.abs(amenity.y - s.y) < s.hd + 6), amenity.id).toBe(false);
    });
    const checkpoints = parkRunCheckpoints();
    expect(checkpoints.length).toBe(9);
    checkpoints.forEach(function(point){
      expect(parkPaths().some(r => point.x >= r.x0 && point.x <= r.x1 && point.y >= r.y0 && point.y <= r.y1)).toBe(true);
      expect(solids.some(s => Math.abs(point.x - s.x) < s.hw && Math.abs(point.y - s.y) < s.hd)).toBe(false);
    });
    expect(Math.hypot(BANDSTAND.x - checkpoints[0].x, BANDSTAND.y - checkpoints[0].y)).toBeGreaterThan(PARK_RUN_RADIUS);
  });
});
