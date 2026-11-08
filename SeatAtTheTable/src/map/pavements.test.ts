import { describe, expect, it } from 'vitest';
import { generateLots, lotSolid } from '../world/data/lots';
import { nearestPavementNode, pavementGraph, pavementPath, safeToCross } from './pavements';
import { CITY_JUNCTIONS } from './traffic';
import { SIGNAL_ALL_RED_SECONDS, SIGNAL_GREEN_SECONDS, signalGreen } from './trafficRules';
import { isPointInWater } from './geometry';

const graph = pavementGraph();

describe('the pavement network', function () {
  it('has a corner at every side of the junctions, joined along the pavements and by crossings', function () {
    expect(graph.nodes.length).toBeGreaterThan(60);
    expect(graph.edges.filter(e => e.crossing).length).toBeGreaterThan(40);
    expect(graph.edges.filter(e => !e.crossing).length).toBeGreaterThan(40);
    graph.nodes.forEach(node => expect(isPointInWater(node, 4)).toBe(false));
  });

  it('runs nowhere through a building', function () {
    const solids = generateLots([]).map(lotSolid);
    graph.edges.filter(e => !e.crossing).forEach(function(edge){
      const a = graph.nodes[edge.a], b = graph.nodes[edge.b];
      for(let t = 0; t <= 1; t += 0.05){
        const p = { x:a.x + (b.x - a.x) * t, y:a.y + (b.y - a.y) * t };
        expect(solids.some(s => Math.abs(p.x - s.x) < s.hw + 3 && Math.abs(p.y - s.y) < s.hd + 3), `${Math.round(p.x)},${Math.round(p.y)}`).toBe(false);
      }
    });
  });

  it('finds the way across a district, crossing streets only at the junctions', function () {
    const from = nearestPavementNode(graph, { x:CITY_JUNCTIONS[0].x, y:CITY_JUNCTIONS[0].y });
    const far = graph.nodes.reduce((best, node, i) => (Math.hypot(node.x - graph.nodes[from].x, node.y - graph.nodes[from].y) > Math.hypot(graph.nodes[best].x - graph.nodes[from].x, graph.nodes[best].y - graph.nodes[from].y) && pavementPath(graph, from, i).length ? i : best), from);
    const path = pavementPath(graph, from, far);
    expect(path.length).toBeGreaterThan(3);
    expect(path[path.length - 1].to).toBe(far);
    let at = graph.nodes[from];
    path.forEach(function(step){
      const next = graph.nodes[step.to];
      // LEGAL: Every step is straight along one axis: no cutting across a block or a junction.
      expect(Math.min(Math.abs(next.x - at.x), Math.abs(next.y - at.y))).toBeLessThan(1);
      if(step.crossing) expect(Math.hypot((at.x + next.x) / 2 - step.crossing.junction.x, (at.y + next.y) / 2 - step.crossing.junction.y)).toBeLessThan(60);
      at = next;
    });
  });

  it('crosses only on a green that lasts long enough to get across', function () {
    const crossing = graph.edges.find(e => e.crossing)!.crossing!;
    let sawGo = false, sawWait = false;
    for(let t = 0; t < (SIGNAL_GREEN_SECONDS + SIGNAL_ALL_RED_SECONDS) * 2; t += 0.25){
      const go = safeToCross(crossing, t, 3);
      if(go){ sawGo = true; expect(signalGreen(crossing.axis, crossing.junction, t + 3)).toBe(true); }
      else sawWait = true;
    }
    expect(sawGo && sawWait).toBe(true);
  });
});
