import { describe, expect, it } from 'vitest';
import { properties } from '../config/assets';
import { brandById } from '../config/brands';
import { rectsOverlap } from './layout';
import { districtIdAtPlayablePoint } from './mapModel';
import { propertyObstacles, propertyPlaces } from './propertyPlaces';
import { propertySilhouette } from './placeRendering';
import { roadNetwork } from './world';

const places = propertyPlaces();

describe('owned real estate on the map', function () {
  it('gives every property a real place in the world', function () {
    // LEGAL: Properties used to be rows in a phone list with no physical existence.
    expect(places).toHaveLength(properties.length);
    properties.forEach(function (property) {
      expect(places.some(p => p.property.id === property.id), `${property.id} has no lot`).toBe(true);
    });
  });

  it('puts each property in the district of the brand that sells it', function () {
    places.forEach(function (place) {
      expect(place.district, `${place.id} is in the wrong district`).toBe(brandById(place.property.brand)?.district);
    });
  });

  it('stands every property on playable land in its own district', function () {
    places.forEach(function (place) {
      expect(districtIdAtPlayablePoint({ x: place.x, y: place.y }, 16), `${place.id} is not on ${place.district} land`).toBe(place.district);
    });
  });

  it('never puts a property in a street', function () {
    places.forEach(function (place) {
      roadNetwork.vertical.forEach(function (road) {
        expect(Math.abs(place.x - road.x), `${place.id} sits on ${road.name}`).toBeGreaterThan(road.w / 2);
      });
      roadNetwork.horizontal.forEach(function (road) {
        expect(Math.abs(place.y - road.y), `${place.id} sits on ${road.name}`).toBeGreaterThan(road.w / 2);
      });
    });
  });

  it('never overlaps another property or anything already in the city', function () {
    const footprints = places.map(p => ({ id: p.id, x: p.x, y: p.y, hw: 34, hd: 30 }));
    footprints.forEach(function (a, index) {
      footprints.slice(index + 1).forEach(function (b) {
        expect(rectsOverlap(a, b, 0), `${a.id} overlaps ${b.id}`).toBe(false);
      });
      propertyObstacles().forEach(function (obstacle) {
        expect(rectsOverlap(a, obstacle, 0), `${a.id} overlaps an existing building`).toBe(false);
      });
    });
  });

  it('is deterministic, so your holdings are where you left them', function () {
    expect(propertyPlaces()).toEqual(places);
  });

  it('sizes a building by what it earns, so a walk-up is not a tower', function () {
    const walkUp = propertySilhouette(places.find(p => p.property.id === 'vacantflat')!);
    const tower = propertySilhouette(places.find(p => p.property.id === 'harbour_tower')!);

    expect(tower.h).toBeGreaterThan(walkUp.h * 2);
  });

  it('spreads holdings across more than one district', function () {
    expect(new Set(places.map(p => p.district)).size).toBeGreaterThan(1);
  });
});
