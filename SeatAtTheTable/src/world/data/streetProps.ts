import type { Point, Solid } from '../../config/types';
import { lotSolid, type Lot } from './lots';

// LEGAL: The street furniture in front of the buildings: in the strip between the pavement and each
// LEGAL: building's front, where the street trees stand. What's there depends on the block: benches
// LEGAL: and bins on shopping streets, planters where the money is, a hydrant every few doors, a
// LEGAL: postbox now and then, and a bus shelter halfway along each long row.
export type PropKind = 'bench' | 'bin' | 'hydrant' | 'shelter' | 'mailbox' | 'planter';

export interface StreetProp { kind: PropKind; x: number; y: number; rot: number }

// LEGAL: How far in front of a building's face the props stand: the tree strip.
const SET_OUT = 12;
const TREE_CLEARANCE = 22;

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return function(){ s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

const BY_CHARACTER: Record<Lot['character'], PropKind[]> = {
  shopping:['bench', 'bin', 'planter', 'bin'],
  entertainment:['bin', 'bench', 'bin'],
  affluent:['planter', 'bench', 'planter'],
  corporate:['planter', 'bin', 'planter'],
  working:['bin', 'bench'],
  rough:['bin'],
  industrial:['bin'],
};

// LEGAL: `trees` are the street trees (props keep off them); `taken` anything else standing there.
export function generateStreetProps(lots: readonly Lot[], trees: readonly Point[], taken: readonly Solid[] = []): StreetProp[] {
  const props: StreetProp[] = [];
  // LEGAL: Rows of lots facing the same way along the same street line, for the shelters.
  const rows = new Map<string, Lot[]>();
  lots.forEach(function(lot, i){
    if(lot.site) return;
    const out = { x:Math.sin(lot.rot), y:Math.cos(lot.rot) };
    const front = { x:lot.x + out.x * (lot.d / 2 + SET_OUT), y:lot.y + out.y * (lot.d / 2 + SET_OUT) };
    const random = seeded(Math.floor(Math.abs(lot.x * 31 + lot.y * 17)) + i);
    const along = { x:out.y, y:-out.x };
    const kinds = BY_CHARACTER[lot.character];
    const place = (kind: PropKind, offset: number) => {
      const at = { x:front.x + along.x * offset, y:front.y + along.y * offset };
      if(trees.some(t => Math.hypot(t.x - at.x, t.y - at.y) < TREE_CLEARANCE)) return;
      if(taken.some(t => Math.abs(t.x - at.x) < t.hw + 6 && Math.abs(t.y - at.y) < t.hd + 6)) return;
      if(props.some(p => Math.hypot(p.x - at.x, p.y - at.y) < 12)) return;
      props.push({ kind, x:at.x, y:at.y, rot:lot.rot });
    };
    if(random() < 0.75) place(kinds[Math.floor(random() * kinds.length)], (random() - 0.5) * lot.w * 0.5);
    if(i % 3 === 0) place('hydrant', lot.w / 2 - 4);
    else if(i % 7 === 2) place('mailbox', -lot.w / 2 + 4);
    const key = `${Math.round(lot.rot * 100)}:${Math.round(Math.abs(out.x) > 0.5 ? front.x : front.y)}`;
    rows.set(key, [...(rows.get(key) ?? []), lot]);
  });
  rows.forEach(function(row){
    if(row.length < 5) return;
    const lot = row[Math.floor(row.length / 2)];
    const out = { x:Math.sin(lot.rot), y:Math.cos(lot.rot) };
    // LEGAL: The shelter stands at the kerb edge of the strip, its back to the buildings.
    const at = { x:lot.x + out.x * (lot.d / 2 + SET_OUT + 2), y:lot.y + out.y * (lot.d / 2 + SET_OUT + 2) };
    if(trees.some(t => Math.hypot(t.x - at.x, t.y - at.y) < 24)) return;
    const near = (p: StreetProp) => Math.abs(p.x - at.x) < 24 && Math.abs(p.y - at.y) < 24;
    for(let i = props.length - 1; i >= 0; i--) if(near(props[i])) props.splice(i, 1);
    props.push({ kind:'shelter', x:at.x, y:at.y, rot:lot.rot });
  });
  return props;
}

// LEGAL: The props you walk round rather than through: shelters and benches.
export function streetPropSolids(props: readonly StreetProp[]): Solid[] {
  return props.flatMap(function(prop): Solid[] {
    const size = prop.kind === 'shelter' ? { w:36, d:14 } : prop.kind === 'bench' ? { w:19, d:5 } : null;
    return size ? [lotSolid({ x:prop.x, y:prop.y, w:size.w, d:size.d, rot:prop.rot })] : [];
  });
}

