import type { Brand } from './types';

// LEGAL: Retail brands. Each gets a themed building on the map (added with placement in a
// LEGAL: later pass) where its stock is bought in person. Vehicles and properties in
// LEGAL: config/assets reference these by id. `caveat` is the theme's downside; the
// LEGAL: gameplay hooks for each (breakdowns, robberies, appreciation, laundering) land
// LEGAL: with the in-person shops.
export const brands: Brand[] = [
  // LEGAL: Vehicles
  { id:'no-problem-auto', name:'No Problem Auto', sells:'vehicle', category:'used', district:'devlin',
    blurb:'Cash-only lot, hand-painted signs, every car sold "as-is, no problem."',
    caveat:'Used and unreliable — these can break down on you at the worst time.' },
  { id:'diamond-exotics', name:'Diamond Exotics', sells:'vehicle', category:'luxury', district:'hub',
    blurb:'Glass showroom, valet parking, champagne you did not order. Pure status.' },
  { id:'outlaw-riders', name:'Outlaw Riders Auto', sells:'vehicle', category:'bike', district:'westside',
    blurb:'Chrome, leather, and a mechanic who has clearly seen some things.',
    caveat:'Out in the open — bikes are quick and cheap but draw more heat and give less cover.' },
  { id:'mudster', name:'Mudster', sells:'vehicle', category:'suv', district:'westside',
    blurb:'Trucks and SUVs built to climb curbs, ford canals, and dodge questions.' },
  { id:'electron', name:'Electron', sells:'vehicle', category:'ev', district:'hub',
    blurb:'Silent, self-parking, and always, always listening.' },

  // LEGAL: Real estate
  { id:'concrete-dreams', name:'Concrete Dreams Properties', sells:'property', category:'cheap', district:'devlin',
    blurb:'Walk-ups and vacants on the cheap. Bring your own imagination — and a padlock.',
    caveat:'Rough blocks — these get hit by crews and draw police attention to you.' },
  { id:'horizon', name:'Horizon Properties', sells:'property', category:'luxury', district:'hub',
    blurb:'Floor-to-ceiling glass, doormen, and beautifully clean money.' },
  { id:'ironpoint', name:'Ironpoint Commercial', sells:'property', category:'commercial', district:'westside',
    blurb:'Warehouses, lots, and loading docks — the quiet backbone of any laundering operation.',
    caveat:'Best used as fronts: strong at washing money, thin on street respect.' },
  { id:'lakeshore', name:'Lakeshore Development', sells:'property', category:'waterfront', district:'hub',
    blurb:'New-build waterfront towers in a market that, conveniently, only ever goes up.',
    caveat:'Premium and appreciating — income climbs over time, but the buy-in is steep.' },
];

export function brandById(id: string | undefined): Brand | undefined {
  return id ? brands.find(b => b.id === id) : undefined;
}
