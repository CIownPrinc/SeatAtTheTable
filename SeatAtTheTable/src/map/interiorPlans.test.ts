import { describe, expect, it } from 'vitest';
import { brandById } from '../config/brands';
import { localBusinesses } from '../config/localBusinesses';
import { properties } from '../config/assets';
import { serviceBuildings } from '../config/serviceBuildings';
import { businesses } from '../config/ventures';
import { interiorPlanFor, stairsLanding } from './interiorPlans';
import { themeDecor, themeHasDecor } from './interiorThemes';

// LEGAL: Every place you can walk into gets its own plan, and its furniture leaves room to use it:
// LEGAL: nothing stands where the hotspots put you (the counter at the back in the middle, the second
// LEGAL: hotspot right of centre, a mission contact left of the counter), in the doorway, on the stairs
// LEGAL: landing, or where a regular stands to be talked to.
const places: Array<{ kind: string; refId: string; brand?: string }> = [
  ...businesses.map(b => ({ kind:'venture', refId:b.id })),
  ...localBusinesses.map(b => ({ kind:'local', refId:b.id })),
  ...serviceBuildings.map(s => ({ kind:s.kind, refId:s.id, brand:brandById(s.brandId)?.category })),
  ...properties.map(p => ({ kind:'property', refId:p.id })),
];

function inside(x: number, z: number, solids: Array<{ x: number; y: number; hw: number; hd: number }>, margin: number): boolean {
  return solids.some(s => Math.abs(x - s.x) < s.hw + margin && Math.abs(z - s.y) < s.hd + margin);
}

describe('interior plans', () => {
  it('give every place a theme with furniture of its own, except the mall which has its own hall', () => {
    places.forEach(place => {
      const plan = interiorPlanFor(place.kind, place.refId, place.brand);
      if(plan.theme === 'mall') return;
      expect(themeHasDecor(plan.theme), `${place.refId} (${plan.theme})`).toBe(true);
    });
  });

  it('size the Mudster trailhead showroom and the city one differently from Diamond Exotics', () => {
    const trailhead = interiorPlanFor('dealership', 'mudsterTrailhead', 'suv');
    const luxury = interiorPlanFor('dealership', 'brand-diamond-exotics', 'luxury');
    expect(trailhead.theme).not.toBe(luxury.theme);
    expect(trailhead.look.floor).not.toBe(luxury.look.floor);
  });

  places.forEach(place => {
    const plan = interiorPlanFor(place.kind, place.refId, place.brand);
    if(plan.theme === 'mall' || !themeHasDecor(plan.theme)) return;
    plan.floors.forEach((floor, index) => {
      it(`leaves ${place.refId} (${plan.theme}, ${floor.id}) clear where you stand to use things`, () => {
        const { w, h } = plan;
        const solids = themeDecor(plan, place.refId, index).solids;
        const stands: Array<[string, number, number]> = index === 0
          ? [['counter', w / 2, 80], ['second hotspot', w * 0.85, h * 0.55], ['mission contact', w * 0.18, 80], ['door', w / 2, h - 46]]
          : [];
        const landing = stairsLanding(plan);
        if(landing) stands.push(['stairs landing', landing.x, landing.y]);
        plan.regulars.filter(r => r.floor === index).forEach(r => stands.push([`regular ${r.name}`, r.x, r.z + 20]));
        stands.forEach(([what, x, z]) => {
          expect(inside(x, z, solids, 6), `${what} at ${Math.round(x)},${Math.round(z)}`).toBe(false);
          expect(x > 10 && x < w - 10 && z > 10 && z < h - 6, `${what} inside the room`).toBe(true);
        });
      });
    });
  });
});
