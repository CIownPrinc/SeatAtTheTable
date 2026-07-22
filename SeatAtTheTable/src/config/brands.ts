import type { Brand } from './types';

// LEGAL: Retail brands. Each is a themed building on the map where its stock is bought in
// LEGAL: person; `x` is district-local (applyMapWorldCoordinates makes it a world x) and
// LEGAL: `y` is world. Vehicles and properties in config/assets reference these by id.
// LEGAL: `caveat` is the theme's downside — the gameplay hooks for each (breakdowns,
// LEGAL: robberies, appreciation, laundering) land in the next pass. `haggle` marks the
// LEGAL: cash-only lots where bargaining is natural; `rivalLine` is what the counter says
// LEGAL: when the block underneath belongs to another crew.
export const brands: Brand[] = [
  // LEGAL: Vehicles
  { id:'no-problem-auto', name:'No Problem Auto', sells:'vehicle', category:'used', district:'devlin',
    x:915, y:450, haggle:true,
    blurb:'Cash-only lot, hand-painted signs, every car sold "as-is, no problem."',
    caveat:'Used and unreliable — these can break down on you at the worst time.',
    rivalLine:'The salesman keeps glancing at the two men by the fence. "Price is the price today, friend."' },
  { id:'diamond-exotics', name:'Diamond Exotics', sells:'vehicle', category:'luxury', district:'hub',
    x:485, y:750,
    blurb:'Glass showroom, valet parking, champagne you did not order. Pure status.',
    rivalLine:'"We do have an arrangement with the people who run this street. It is reflected in the figure."' },
  { id:'outlaw-riders', name:'Outlaw Riders Auto', sells:'vehicle', category:'bike', district:'westside',
    x:485, y:450,
    blurb:'Chrome, leather, and a mechanic who has clearly seen some things.',
    caveat:'Out in the open — bikes are quick and cheap but draw more heat and give less cover.',
    rivalLine:'The mechanic wipes his hands slowly. "We pay rent to somebody. You want a bike, you cover it."' },
  { id:'mudster', name:'Mudster', sells:'vehicle', category:'suv', district:'westside',
    x:915, y:450,
    blurb:'Trucks and SUVs built to climb curbs, ford canals, and dodge questions.',
    rivalLine:'"Nothing personal. This lot sits on their ground and their ground costs extra."' },
  { id:'electron', name:'Electron', sells:'vehicle', category:'ev', district:'hub',
    x:915, y:750,
    blurb:'Silent, self-parking, and always, always listening.',
    rivalLine:'The tablet in her hands reprices itself as you walk in. "Local market conditions," she says.' },

  // LEGAL: Real estate
  { id:'concrete-dreams', name:'Concrete Dreams Properties', sells:'property', category:'cheap', district:'devlin',
    x:1330, y:450, haggle:true,
    blurb:'Walk-ups and vacants on the cheap. Bring your own imagination — and a padlock.',
    caveat:'Rough blocks — these get hit by crews and draw police attention to you.',
    rivalLine:'"I can sell you the deed. I cannot promise anybody on that block honors it."' },
  { id:'horizon', name:'Horizon Properties', sells:'property', category:'luxury', district:'hub',
    x:1330, y:750,
    blurb:'Floor-to-ceiling glass, doormen, and beautifully clean money.',
    rivalLine:'"Our board is sensitive about who controls the surrounding parcels. The price reflects that sensitivity."' },
  { id:'ironpoint', name:'Ironpoint Commercial', sells:'property', category:'commercial', district:'westside',
    x:120, y:750,
    blurb:'Warehouses, lots, and loading docks — the quiet backbone of any laundering operation.',
    caveat:'Best used as fronts: strong at washing money, thin on street respect.',
    rivalLine:'"Every truck in and out of here gets taxed by somebody who is not you. Factor it in."' },
  { id:'lakeshore', name:'Lakeshore Development', sells:'property', category:'waterfront', district:'hub',
    x:120, y:450,
    blurb:'New-build waterfront towers in a market that, conveniently, only ever goes up.',
    caveat:'Premium and appreciating — income climbs over time, but the buy-in is steep.',
    rivalLine:'"The syndicate holds the air rights on this parcel. You are welcome to buy around them."' },
];

export function brandById(id: string | undefined): Brand | undefined {
  return id ? brands.find(b => b.id === id) : undefined;
}
