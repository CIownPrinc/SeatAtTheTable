import type { Politician } from './types';

export const politicians: Politician[] = [
  { id:'cole', name:'City Councilman Cole', role:'Zoning', favor:0, pocketed:false, desc:"Zoning favors: -10% research cost on every venture once he's in your pocket.", flavor:"Cole stops pretending the envelopes are for his re-election fund. \"We understand each other now,\" is all he says." },
  { id:'boyle', name:'Commissioner Boyle', role:'Police', favor:0, pocketed:false, desc:"Fewer patrols where it counts: -20% heat generation once he's in your pocket.", flavor:"Boyle doesn't say yes outright. He just stops assigning patrols to your streets, and that's answer enough." },
  { id:'whitmore', name:'Judge Whitmore', role:'Courts', favor:0, pocketed:false, desc:"A friendlier bench: raids and busts cost 30% less once she's in your pocket.", flavor:"Whitmore never looks at you directly in public. In private, cases involving your name start moving oddly fast, and not against you." },
];
