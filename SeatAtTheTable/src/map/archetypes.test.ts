import { describe, expect, it } from 'vitest';
import { businesses } from '../config/ventures';
import { localBusinesses } from '../config/localBusinesses';
import { serviceBuildings } from '../config/serviceBuildings';
import { createMapBuildings } from './markers';
import { propertyPlaces } from './propertyPlaces';
import {
  archetypeForm,
  localArchetype,
  propertyArchetype,
  serviceArchetype,
  ventureArchetype,
} from './archetypes';

describe('place archetypes', function () {
  // LEGAL: The point of the whole exercise. A place with no archetype falls back to a generic
  // LEGAL: box, which is how a BACK ALLEY, a RAILYARD, a BUS STATION and a LOUNGE ended up
  // LEGAL: drawn identically. These fail the moment someone adds a place and forgets.
  it('gives every venture an archetype', function () {
    const missing = createMapBuildings(businesses).filter(m => ventureArchetype(m) === null).map(m => m.id);
    expect(missing, `ventures with no archetype: ${missing.join(', ')}`).toEqual([]);
  });

  it('gives every local business an archetype', function () {
    const missing = localBusinesses.filter(b => localArchetype(b) === null).map(b => b.id);
    expect(missing, `local businesses with no archetype: ${missing.join(', ')}`).toEqual([]);
  });

  it('gives every service building an archetype', function () {
    const missing = serviceBuildings.filter(b => serviceArchetype(b) === null).map(b => b.id);
    expect(missing, `service buildings with no archetype: ${missing.join(', ')}`).toEqual([]);
  });

  it('gives every property an archetype', function () {
    const missing = propertyPlaces().filter(p => propertyArchetype(p) === null).map(p => p.id);
    expect(missing, `properties with no archetype: ${missing.join(', ')}`).toEqual([]);
  });

  // LEGAL: The specific lies section 0a called out, pinned so they cannot come back.
  it('draws the places that are not buildings without a building', function () {
    const alley = serviceBuildings.find(b => b.id === 'devlinAlley')!;
    const railyard = serviceBuildings.find(b => b.id === 'railyard')!;
    const dockmaster = serviceBuildings.find(b => b.id === 'docksDockmaster')!;

    expect(serviceArchetype(alley)).toBe('alley');
    expect(serviceArchetype(railyard)).toBe('lot');
    expect(serviceArchetype(dockmaster)).toBe('lot');

    // LEGAL: You walk INTO an alley. It must not block movement at all.
    [alley, railyard, dockmaster].forEach(function(place){
      const form = archetypeForm(serviceArchetype(place)!);
      expect(form.shell).toBe('open');
      expect(form.solidScale).toBe(0);
    });
  });

  it('makes Kailash\'s Cart a stall rather than a building', function () {
    const cart = createMapBuildings(businesses).find(m => m.id === 'cart')!;

    expect(ventureArchetype(cart)).toBe('cart');
    expect(archetypeForm('cart').shell).toBe('stall');
  });

  // LEGAL: Rule 1 of section 0a: a property's archetype comes from its brand's character.
  it('makes a cheap-brand walk-up a tenement and a luxury one a tower', function () {
    const places = propertyPlaces();
    const cheap = places.filter(p => p.property.brand === 'concrete-dreams');
    const luxury = places.filter(p => p.property.brand === 'horizon');

    expect(cheap.length).toBeGreaterThan(0);
    expect(luxury.length).toBeGreaterThan(0);
    cheap.forEach(place => expect(propertyArchetype(place)).toBe('tenement'));
    luxury.forEach(place => expect(propertyArchetype(place)).toBe('tower'));
  });

  it('keeps a repair garage and a chop shop out of the shopfront bucket', function () {
    const chopshop = localBusinesses.find(b => b.id === 'chopshop')!;
    const garage = createMapBuildings(businesses).find(m => m.id === 'garage')!;

    expect(localArchetype(chopshop)).toBe('works');
    expect(ventureArchetype(garage)).toBe('works');
  });

  it('blocks movement for every archetype that has a building shell', function () {
    (['tenement','storefront','showroom','office','tower','civic','works'] as const).forEach(function(archetype){
      expect(archetypeForm(archetype).shell).toBe('building');
      expect(archetypeForm(archetype).solidScale).toBeGreaterThan(0);
    });
  });
});
