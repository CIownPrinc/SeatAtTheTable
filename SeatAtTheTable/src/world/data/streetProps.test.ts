import { describe, expect, it } from 'vitest';
import { roadNetwork } from '../../map/world';
import { generateLots } from './lots';
import { generateStreetProps, streetPropSolids } from './streetProps';

const lots = generateLots([]);
const trees = [{ x: lots[3].x, y: lots[3].y }];
const props = generateStreetProps(lots, trees);

function toNearestStreet(p: { x: number; y: number }): number {
  return Math.min(...roadNetwork.horizontal.map(h => Math.abs(h.y - p.y)), ...roadNetwork.vertical.map(v => Math.abs(v.x - p.x)));
}

describe('street furniture', function () {
  it('lines the streets with benches, bins, hydrants, planters, postboxes and bus shelters', function () {
    expect(props.length).toBeGreaterThan(100);
    for(const kind of ['bench', 'bin', 'hydrant', 'planter', 'mailbox', 'shelter']) expect(props.some(p => p.kind === kind), kind).toBe(true);
  });

  it('stands in the strip between the pavement and the buildings, off the pavement itself', function () {
    for(const prop of props) expect(toNearestStreet(prop), prop.kind).toBeGreaterThan(48);
    for(const prop of props) expect(toNearestStreet(prop), prop.kind).toBeLessThan(66);
  });

  it('keeps clear of the street trees and of each other', function () {
    for(const prop of props) for(const tree of trees) expect(Math.hypot(prop.x - tree.x, prop.y - tree.y)).toBeGreaterThan(21);
    expect(streetPropSolids(props).length).toBe(props.filter(p => p.kind === 'bench' || p.kind === 'shelter').length);
  });
});
