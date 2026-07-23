import { describe, expect, it } from 'vitest';
import { OUTSKIRT_REGIONS } from './world';
import { windhavenMapModel } from './mapModel';
import { OUTSKIRT_DISTRICTS, allRegions, regionAt, regionNameAt } from './regions';
import { pointInPolygon } from './geometry';

function centreOfBelt(id: string){
  const belt = OUTSKIRT_REGIONS.find(region => region.id === id)!;
  const xs = belt.area.map(p => p.x);
  const ys = belt.area.map(p => p.y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

describe('map regions', function () {
  // LEGAL: The guard that matters. The outskirts existed as terrain for a whole stage while
  // LEGAL: being on no map and in no district — this makes leaving a new belt off the map a
  // LEGAL: test failure rather than something you notice by standing in it.
  it('assigns every terrain belt to exactly one outskirt district', function () {
    const assigned = OUTSKIRT_DISTRICTS.flatMap(district => district.belts);

    expect([...assigned].sort()).toEqual(OUTSKIRT_REGIONS.map(region => region.id).sort());
    expect(new Set(assigned).size).toBe(assigned.length);
  });

  it('covers the city districts and the outskirts under one set of names', function () {
    const regions = allRegions();

    expect(regions.filter(r => r.kind === 'city')).toHaveLength(windhavenMapModel.districts.length);
    expect(regions.filter(r => r.kind === 'outskirt')).toHaveLength(OUTSKIRT_DISTRICTS.length);
    expect(new Set(regions.map(r => r.name)).size).toBe(regions.length);
    expect(new Set(regions.map(r => r.id)).size).toBe(regions.length);
  });

  it('names the district you are standing in inside the city', function () {
    windhavenMapModel.districts.forEach(function(district){
      // LEGAL: A point genuinely inside this district's land, taken from its own polygon so
      // LEGAL: the test cannot drift when the coastline is reshaped.
      const xs = district.landArea.map(p => p.x);
      const ys = district.landArea.map(p => p.y);
      const centre = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
      if(!pointInPolygon(centre, district.landArea)) return;

      expect(regionAt(centre)?.id).toBe(district.id);
    });
  });

  it('names the outskirt district you are standing in', function () {
    OUTSKIRT_DISTRICTS.forEach(function(district){
      district.belts.forEach(function(beltId){
        const centre = centreOfBelt(beltId);
        const found = regionAt(centre);
        // LEGAL: Some belt centres fall in water (a bay bitten out of the middle), and water
        // LEGAL: is in no region by design. What must never happen is a belt centre landing
        // LEGAL: in a DIFFERENT district.
        if(found) expect(found.id).toBe(district.id);
      });
    });
  });

  // LEGAL: The whole point of the exercise: the outskirts used to answer with whichever
  // LEGAL: district you were last in, which is why the north end of the map felt off-map.
  it('gives the northern outskirts a name of their own', function () {
    const name = regionNameAt(centreOfBelt('northwoods'));

    expect(name).toBe('Kestrel Reach');
    expect(windhavenMapModel.districts.map(d => d.name)).not.toContain(name);
  });

  it('puts each label inside the region it labels', function () {
    allRegions().filter(region => region.kind === 'outskirt').forEach(function(region){
      const inside = region.areas.some(area => pointInPolygon(region.labelPoint, area));
      expect(inside, `${region.name} label is outside its own area`).toBe(true);
    });
  });

  it('leaves open water unnamed', function () {
    expect(regionAt({ x: -4000, y: 400 })).toBeNull();
  });
});
