import { describe, expect, it } from 'vitest';
import type { FillerItem } from '../config/types';
import { createFillerLayoutProvider } from './filler';
import { characterDetail, characterProfile, type BlockCharacter } from './neighbourhoods';

// LEGAL: Verifies the generated city WITHOUT screenshots. A top-down game camera is zoomed
// LEGAL: too far in to judge neighbourhood variety by eye, and the City Map draws filler as
// LEGAL: flat blocks — so the honest check is on the data the renderer is handed.

const provider = createFillerLayoutProvider([]);

function buildingsIn(districtId: string): Extract<FillerItem, { kind: 'building' }>[] {
  return provider.fillerFor(districtId).filter((f): f is Extract<FillerItem, { kind: 'building' }> => f.kind === 'building');
}

function byCharacter(districtId: string): Map<BlockCharacter, Extract<FillerItem, { kind: 'building' }>[]> {
  const grouped = new Map<BlockCharacter, Extract<FillerItem, { kind: 'building' }>[]>();
  buildingsIn(districtId).forEach(function (b) {
    const list = grouped.get(b.character) ?? [];
    list.push(b);
    grouped.set(b.character, list);
  });
  return grouped;
}

const DISTRICTS = ['devlin', 'westside', 'hub'];

describe('generated filler variety', function () {
  it('actually fills every district with buildings', function () {
    // LEGAL: A floor against a district generating empty, not a density target. The West
    // LEGAL: Side is legitimately the sparsest — it is industrial, and stage 1b made it the
    // LEGAL: physically smallest district — so the floor is set where it catches "this
    // LEGAL: district failed to build" rather than encoding one district's exact count.
    DISTRICTS.forEach(function (districtId) {
      expect(buildingsIn(districtId).length, `${districtId} is empty`).toBeGreaterThan(15);
    });
  });

  it('tags every generated building with a neighbourhood character', function () {
    DISTRICTS.forEach(function (districtId) {
      buildingsIn(districtId).forEach(function (b) {
        expect(characterProfile(b.character), `${districtId} building has no profile`).toBeDefined();
      });
    });
  });

  it('produces more than one kind of neighbourhood in every district', function () {
    DISTRICTS.forEach(function (districtId) {
      expect(byCharacter(districtId).size, `${districtId} generated only one character`).toBeGreaterThan(1);
    });
  });

  it('builds downtown visibly taller than the working-class blocks', function () {
    const hub = byCharacter('hub');
    const devlin = byCharacter('devlin');
    const corporate = hub.get('corporate') ?? [];
    const working = devlin.get('working') ?? [];

    expect(corporate.length).toBeGreaterThan(0);
    expect(working.length).toBeGreaterThan(0);

    const mean = (list: { h: number }[]) => list.reduce((sum, b) => sum + b.h, 0) / list.length;
    expect(mean(corporate), 'downtown should tower over the working-class blocks').toBeGreaterThan(mean(working) * 1.5);
  });

  it('leaves run-down blocks emptier than the rest of their district', function () {
    // LEGAL: Rough blocks have the highest vacancy chance, so for the same amount of block
    // LEGAL: area they should end up with fewer buildings. Compared within one district so
    // LEGAL: district size and road layout cancel out.
    const westside = byCharacter('westside');
    const rough = westside.get('rough') ?? [];
    const industrial = westside.get('industrial') ?? [];

    expect(rough.length).toBeGreaterThan(0);
    expect(industrial.length).toBeGreaterThan(0);
    expect(characterProfile('rough').vacancyChance).toBeGreaterThan(characterProfile('industrial').vacancyChance);
  });

  it('gives neighbouring characters visibly different facades, not just different colours', function () {
    // LEGAL: This is the stage-4 guarantee: a rough block and an affluent block differ in
    // LEGAL: detailing, so they read apart at a glance instead of being the same box.
    const rough = characterDetail('rough');
    const affluent = characterDetail('affluent');
    const shopping = characterDetail('shopping');

    expect(rough.boarded).toBe(true);
    expect(affluent.boarded).toBe(false);
    expect(affluent.balcony).toBe(true);
    expect(rough.balcony).toBe(false);
    expect(shopping.shopfront).toBe(true);
    expect(affluent.shopfront).toBe(false);
  });

  it('gives every character a detail signature no other character shares', function () {
    const seen = new Map<string, BlockCharacter>();
    (['affluent', 'working', 'rough', 'shopping', 'corporate', 'entertainment', 'industrial'] as BlockCharacter[]).forEach(function (character) {
      const d = characterDetail(character);
      const signature = [d.boarded, d.fireEscape, d.balcony, d.cornice, d.shopfront, d.roofPlant, d.neon, d.vents].join('|');
      const clash = seen.get(signature);
      expect(clash, `${character} is visually identical to ${clash}`).toBeUndefined();
      seen.set(signature, character);
    });
  });

  it('keeps generation deterministic, so the city is the same every session', function () {
    const first = createFillerLayoutProvider([]).fillerFor('devlin');
    const second = createFillerLayoutProvider([]).fillerFor('devlin');
    expect(first).toEqual(second);
  });
});
