import { describe, expect, it } from 'vitest';
import { roadDeadEnds, roadLandSegments, turningCircleRadius, windhavenMapModel } from './mapModel';
import { isPointInWater, pointInPolygon } from './geometry';

describe('city roads on land', function () {
  it('run all the way to each bridge instead of stopping short of the canal', function () {
    windhavenMapModel.bridges.forEach(function(bridge){
      const start = bridge.path[0];
      const reaches = roadLandSegments().some(function(segment){
        return segment.road.name === bridge.roadName && segment.path.some(p => Math.abs(p.y - start.y) < 1 && p.x <= start.x + 1 && p.x >= start.x - 40)
          || segment.road.name === bridge.roadName && segment.path[0].x < start.x && segment.path[segment.path.length - 1].x > start.x;
      });
      expect(reaches, bridge.name).toBe(true);
    });
  });

  it('never run into water or onto the beach', function () {
    roadLandSegments().filter(s => s.road.roadClass !== 'country').forEach(function(segment){
      const [a, b] = [segment.path[0], segment.path[segment.path.length - 1]];
      [a, b].forEach(function(end){
        expect(pointInPolygon(end, windhavenMapModel.lakefrontBeach), `${segment.road.name} end on the beach`).toBe(false);
      });
    });
  });
});

describe('roadDeadEnds', function () {
  const ends = roadDeadEnds();

  it('ends a street in a T at the cross street when only a stub would be left before the shore', function () {
    expect(ends.find(end => end.road.name === 'Rockwell Avenue' && end.point.y < 400)).toBeUndefined();
    const rockwell = roadLandSegments().filter(s => s.road.name === 'Rockwell Avenue');
    const northmost = Math.min(...rockwell.flatMap(s => s.path.map(p => p.y)));
    expect(northmost).toBeGreaterThan(300 - 74);
    expect(northmost).toBeLessThan(300);
  });

  it('gives a street that runs on past its last junction a turning circle', function () {
    // LEGAL: Cicero Avenue stops at Central Park's gate; Rockwell now runs on as a country lane.
    expect(ends.find(end => end.road.name === 'Cicero Avenue' && end.point.y > 1000)).toBeDefined();
  });

  it('does not mark a street that carries on as a country lane', function () {
    expect(ends.find(end => end.road.name === 'Devlin Street' && end.point.y > 1000)).toBeUndefined();
    expect(ends.find(end => end.road.name === 'Roosevelt Road' && end.point.x < 100)).toBeUndefined();
    expect(ends.find(end => end.road.name === 'Rockwell Avenue' && end.point.y > 1000)).toBeUndefined();
    expect(ends.find(end => end.road.name === 'Grand Avenue' && end.point.x < 100)).toBeUndefined();
  });

  it('points each dead end along its road, away from the street it came from', function () {
    const end = ends.find(e => e.road.name === 'Cicero Avenue' && e.point.y > 1000)!;
    expect(end.direction.y).toBeGreaterThan(0.9);
  });

  // LEGAL: The whole turning circle, kerb included, on dry ground: not in the water and not on the
  // LEGAL: beach. It used to check only half the road's width against the water, and Wabash Avenue's
  // LEGAL: turning circle sat across the beach with its edge in the lake.
  it('leaves room for a turning circle on dry land, clear of the beach', function () {
    ends.forEach(function(end){
      const radius = turningCircleRadius(end.road);
      const where = `${end.road.name} at ${Math.round(end.point.x)},${Math.round(end.point.y)}`;
      expect(isPointInWater(end.point, radius), where).toBe(false);
      for(let k = 0; k < 16; k++){
        const edge = { x:end.point.x + Math.cos(k * Math.PI / 8) * radius, y:end.point.y + Math.sin(k * Math.PI / 8) * radius };
        expect(pointInPolygon(edge, windhavenMapModel.lakefrontBeach), `${where}, kerb on the beach`).toBe(false);
      }
    });
  });
});
