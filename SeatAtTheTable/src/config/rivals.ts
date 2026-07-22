import type { RivalGang } from './types';

// LEGAL: The crews you are actually taking territory from. Before this each district just
// LEGAL: had an unnamed "rival"; naming them lets the minimap territory overlay show WHO
// LEGAL: holds a block, and gives shops on rival turf someone specific to be afraid of.
// LEGAL: One crew per district, matched to that district's character.
export const rivalGangs: RivalGang[] = [
  { id:'rockwell-kings', name:'Rockwell Kings', short:'RK', district:'devlin', color:'#a8394a',
    blurb:'Corner crew grown up. They were on these blocks before you were, and they say so often.' },
  { id:'cicero-firm', name:'Cicero Firm', short:'CF', district:'westside', color:'#7a6fb0',
    blurb:'Old-school outfit running the docks, the railyard, and every load that moves between them.' },
  { id:'meridian-group', name:'Meridian Group', short:'MG', district:'hub', color:'#2a87ff',
    blurb:'Suits, not soldiers. They hold downtown through lawyers, leases, and the occasional accident.' },
];

// LEGAL: Colors for the two non-rival states, kept beside the gang colors so the overlay
// LEGAL: legend and the minimap tint read from one place.
export const YOURS_COLOR = '#d4a017';
export const CONTESTED_COLOR = '#7d8a99';

export function rivalGangForDistrict(district: string): RivalGang | undefined {
  return rivalGangs.find(g => g.district === district);
}

export function rivalGangById(id: string | undefined): RivalGang | undefined {
  return id ? rivalGangs.find(g => g.id === id) : undefined;
}
