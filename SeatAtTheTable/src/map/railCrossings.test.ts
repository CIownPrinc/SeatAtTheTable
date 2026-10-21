import { describe, expect, it } from 'vitest';
import { windhavenMapModel } from './mapModel';
import { RAIL_CROSSING_MARGIN, railCrossingSpans, railOpenSpans } from './queries';
import { BRIDGE_DECK_TOP } from './sceneBuilding';

// LEGAL: The raised track (rails and sleepers) must never run across a road, and a bridge's deck must
// LEGAL: be level with the road, because people and cars walk and drive at ground height. Both were
// LEGAL: wrong: the rails stood four units proud through every road, and Arjun walked inside bridges.
describe('rail crossings', () => {
  windhavenMapModel.railLines.forEach(function(rail){
    const a = rail.path[0], b = rail.path[rail.path.length - 1];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / length, uy = (b.y - a.y) / length;
    const crossings = windhavenMapModel.roadPaths.flatMap(road => road.path.slice(0, -1).map((p, i) => ({ road, p, q:road.path[i + 1] })));

    it(`keeps the raised track of ${rail.name} off every road`, () => {
      const open = railOpenSpans(rail);
      expect(open.length).toBeGreaterThan(0);
      // LEGAL: Walk the open track in steps; no step may be on a road's carriageway.
      open.forEach(span => {
        for(let d = span.from; d <= span.to; d += 2){
          const point = { x:a.x + ux * d, y:a.y + uy * d };
          crossings.forEach(({ road, p, q }) => {
            const dx = q.x - p.x, dy = q.y - p.y, len = dx * dx + dy * dy || 1;
            const t = Math.max(0, Math.min(1, ((point.x - p.x) * dx + (point.y - p.y) * dy) / len));
            const gap = Math.hypot(point.x - (p.x + dx * t), point.y - (p.y + dy * t));
            expect(gap, `${rail.name} at ${Math.round(d)} on ${road.name}`).toBeGreaterThanOrEqual(road.width / 2 - 0.5);
          });
        }
      });
    });

    it(`gives ${rail.name} a level crossing wherever it meets a road`, () => {
      railCrossingSpans(rail).forEach(span => expect(span.to - span.from).toBeGreaterThan(2 * RAIL_CROSSING_MARGIN));
    });
  });
});

describe('bridges', () => {
  it('have decks level with the road, so people and cars cross on top of them', () => {
    expect(BRIDGE_DECK_TOP).toBeLessThanOrEqual(0.5);
    expect(BRIDGE_DECK_TOP).toBeGreaterThanOrEqual(0);
  });
});
