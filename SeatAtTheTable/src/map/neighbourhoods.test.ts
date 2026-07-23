import { describe, expect, it } from 'vitest';
import { characterForDistrictBlock, characterLabel, characterProfile, type BlockCharacter } from './neighbourhoods';
import { zoneForDistrictBlock } from './zoning';

const DISTRICTS = ['devlin', 'westside', 'hub'];
const ALL: BlockCharacter[] = ['affluent', 'working', 'rough', 'shopping', 'corporate', 'entertainment', 'industrial'];

function charactersIn(districtId: string): BlockCharacter[] {
  const found: BlockCharacter[] = [];
  for(let xi = 0; xi < 4; xi += 1){
    for(let yi = 0; yi < 4; yi += 1) found.push(characterForDistrictBlock(districtId, xi, yi));
  }
  return found;
}

describe('neighbourhood character', function () {
  it('gives every block in every district a character', function () {
    DISTRICTS.forEach(function (districtId) {
      charactersIn(districtId).forEach(function (character) {
        expect(ALL, `${districtId} produced an unknown character`).toContain(character);
      });
    });
  });

  it('is stable — the same block always has the same character', function () {
    expect(characterForDistrictBlock('devlin', 2, 3)).toBe(characterForDistrictBlock('devlin', 2, 3));
    expect(charactersIn('hub')).toEqual(charactersIn('hub'));
  });

  it('mixes several characters inside each district rather than painting it one colour', function () {
    DISTRICTS.forEach(function (districtId) {
      expect(new Set(charactersIn(districtId)).size, `${districtId} is monotone`).toBeGreaterThanOrEqual(3);
    });
  });

  it('gives each district a recognisably different social make-up', function () {
    // LEGAL: The point of stage 3: downtown money, an industrial West Side, and a
    // LEGAL: working-class Devlin with blocks that have gone to seed.
    expect(charactersIn('hub')).toContain('corporate');
    expect(charactersIn('hub')).toContain('affluent');
    expect(charactersIn('westside')).toContain('industrial');
    expect(charactersIn('westside')).toContain('rough');
    expect(charactersIn('devlin')).toContain('working');
    expect(charactersIn('devlin')).toContain('rough');
    // LEGAL: No skyscraper district outside the Hub, and no money on the works.
    expect(charactersIn('westside')).not.toContain('corporate');
    expect(charactersIn('devlin')).not.toContain('corporate');
    expect(charactersIn('westside')).not.toContain('affluent');
  });

  it('is independent of land use — a residential block can be rich or poor', function () {
    // LEGAL: This is the whole reason character exists as a separate axis from zoning.
    const residentialCharacters = new Set<BlockCharacter>();
    DISTRICTS.forEach(function (districtId) {
      for(let xi = 0; xi < 4; xi += 1){
        for(let yi = 0; yi < 4; yi += 1){
          if(zoneForDistrictBlock(districtId, xi, yi) === 'residential'){
            residentialCharacters.add(characterForDistrictBlock(districtId, xi, yi));
          }
        }
      }
    });
    expect(residentialCharacters.size).toBeGreaterThan(1);
  });

  it('makes run-down blocks emptier and lower than affluent ones', function () {
    const rough = characterProfile('rough');
    const affluent = characterProfile('affluent');

    expect(rough.vacancyChance).toBeGreaterThan(affluent.vacancyChance);
    expect(rough.heightMult).toBeLessThan(affluent.heightMult);
    expect(rough.jitterMult).toBeGreaterThan(affluent.jitterMult);
  });

  it('makes downtown the tallest thing in the city', function () {
    const corporate = characterProfile('corporate');
    ALL.filter(c => c !== 'corporate').forEach(function (other) {
      expect(corporate.heightMult, `${other} should not out-build downtown`).toBeGreaterThan(characterProfile(other).heightMult);
    });
  });

  it('gives every character its own facade palette', function () {
    const seen = new Set<string>();
    ALL.forEach(function (character) {
      const profile = characterProfile(character);
      expect(profile.palette.length, `${character} has no palette`).toBeGreaterThan(2);
      const key = profile.palette.join('|');
      expect(seen.has(key), `${character} reuses another character's palette`).toBe(false);
      seen.add(key);
    });
  });

  it('keeps every generation parameter in a sane range', function () {
    ALL.forEach(function (character) {
      const p = characterProfile(character);
      expect(p.vacancyChance, character).toBeGreaterThanOrEqual(0);
      expect(p.vacancyChance, character).toBeLessThan(0.5);
      expect(p.heightMult, character).toBeGreaterThan(0);
      expect(p.footprintMult, character).toBeGreaterThan(0);
      expect(p.apartmentChance, character).toBeGreaterThanOrEqual(0);
      expect(p.apartmentChance, character).toBeLessThanOrEqual(1);
    });
  });

  it('names every character for the UI', function () {
    ALL.forEach(function (character) {
      expect(characterLabel(character).length).toBeGreaterThan(3);
    });
  });
});
