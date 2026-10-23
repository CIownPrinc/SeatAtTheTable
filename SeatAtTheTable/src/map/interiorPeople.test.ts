import { describe, expect, it } from 'vitest';
import { brandById } from '../config/brands';
import { localBusinesses } from '../config/localBusinesses';
import { properties } from '../config/assets';
import { serviceBuildings } from '../config/serviceBuildings';
import { businesses } from '../config/ventures';
import { interiorLayout, type InteriorSpot } from './interiorLayout';
import { interiorPlanFor, stairsLanding } from './interiorPlans';
import { MALL_SPOTS, MALL_UPPER_SPOTS } from './mallInterior';

// LEGAL: Nobody inside a room may stand inside a piece of furniture. Every regular was once drawn
// LEGAL: inside a wooden post (the fallback prop for a hotspot with nothing of its own), so they
// LEGAL: looked like barrels with heads. This builds every room on every floor the way the game does
// LEGAL: and checks each person against everything standing on the floor around them.
const places: Array<{ kind: string; refId: string; brand?: string }> = [
  ...businesses.map(b => ({ kind:'venture', refId:b.id })),
  ...localBusinesses.map(b => ({ kind:'local', refId:b.id })),
  ...serviceBuildings.map(s => ({ kind:s.kind, refId:s.id, brand:brandById(s.brandId)?.category })),
  ...properties.map(p => ({ kind:'property', refId:p.id })),
];

describe('people in rooms', () => {
  places.forEach(place => {
    const plan = interiorPlanFor(place.kind, place.refId, place.brand);
    plan.floors.forEach((floor, index) => {
      it(`stand clear of furniture in ${place.refId} (${floor.id})`, () => {
        const { w, h } = plan;
        const named = (spots: Record<string, unknown>): InteriorSpot[] => Object.entries(spots).filter((entry): entry is [string, { x: number; y: number }] => typeof (entry[1] as { x?: unknown }).x === 'number').map(([id, at]) => ({ id, x:at.x, y:at.y, label:id, icon:'' }));
        const spots: InteriorSpot[] = place.kind === 'mall'
          ? named(index === 0 ? MALL_SPOTS : MALL_UPPER_SPOTS)
          : index === 0
            ? [{ id:'counter', x:w / 2, y:80, label:'Counter', icon:'' }, { id:'backoffice', x:w * 0.85, y:h * 0.55, label:'Back office', icon:'' }]
            : [];
        const landing = stairsLanding(plan);
        if(landing) spots.push({ id:index === 0 ? 'stairs-up' : 'stairs-down', x:landing.x, y:landing.y, label:'Stairs', icon:'' });
        plan.regulars.filter(r => r.floor === index).forEach(r => spots.push({ id:`talk:${r.id}`, x:r.x, y:r.z + 20, label:r.name, icon:'' }));
        const layout = interiorLayout(place.kind, place.refId, { w, h, door:{ x:w / 2 } }, spots, plan, index);
        const standing = [...layout.pieces, ...layout.fixtures.flatMap(f => f.fallback)].filter(p => p.y < 14 && p.h > 10 && p.shape !== 'sphere');
        layout.people.forEach(person => {
          const inside = standing.find(p => Math.abs(person.x - p.x) < p.w / 2 - 2 && Math.abs(person.z - p.z) < p.d / 2 - 2);
          expect(inside, `${person.identity} at ${Math.round(person.x)},${Math.round(person.z)} inside a ${inside?.shape} ${inside?.w}x${inside?.d}`).toBeUndefined();
        });
      });
    });
  });
});
