import { ICONS } from './icons';
import type { LocalBusiness } from './types';

export const localBusinesses: LocalBusiness[] = [
  { id:'patel', name:'Patel Grocery', icon:ICONS.store, owner:'Mr. Patel', robBase:900, extortIncome:0.8, extortHeat:0.12, district:'devlin', x:260, y:430, extorted:false, nextRobAt:0 },
  { id:'pawn', name:"Nowak's Pawn Shop", icon:ICONS.store, owner:'Nowak', robBase:1500, extortIncome:1.3, extortHeat:0.18, district:'devlin', x:520, y:400, extorted:false, nextRobAt:0 },
  { id:'herbalist', name:'Golden Lotus Herbalist', icon:ICONS.store, owner:'Mrs. Lin', robBase:700, extortIncome:0.6, extortHeat:0.10, district:'devlin', x:780, y:440, extorted:false, nextRobAt:0 },
  { id:'bar', name:"O'Malley's Bar", icon:ICONS.lounge, owner:"O'Malley", robBase:1700, extortIncome:1.5, extortHeat:0.20, district:'devlin', x:1040, y:410, extorted:false, nextRobAt:0 },
  { id:'chopshop', name:'West Side Chop Shop', icon:ICONS.garage, owner:'Deke', robBase:2000, extortIncome:1.8, extortHeat:0.22, district:'westside', x:220, y:560, extorted:false, nextRobAt:0 },
  { id:'liquor', name:'Corner Liquor', icon:ICONS.store, owner:'Miss Odell', robBase:1100, extortIncome:1.0, extortHeat:0.15, district:'westside', x:920, y:600, extorted:false, nextRobAt:0 },
  { id:'jewelers', name:'Whitfield & Co. Jewelers', icon:ICONS.diamond, owner:'Mr. Whitfield', robBase:3500, extortIncome:2.2, extortHeat:0.25, district:'hub', x:320, y:300, extorted:false, nextRobAt:0 },
  { id:'marlowe', name:'The Marlowe Club', icon:ICONS.music, owner:'Vivienne', robBase:2600, extortIncome:1.9, extortHeat:0.20, district:'hub', x:900, y:320, extorted:false, nextRobAt:0 },
];
