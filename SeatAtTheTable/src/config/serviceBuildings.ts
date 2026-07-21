import { ICONS } from './icons';
import type { ServiceBuilding } from './types';

export const serviceBuildings: ServiceBuilding[] = [
  { id:'bankHome', kind:'bankHome', name:'Rentport City National — Devlin Branch', icon:ICONS.bank, district:'devlin', x:1360, y:230, bankId:'rentport-national' },
  { id:'cardealer', kind:'garage', name:'Windhaven Auto Exchange', icon:ICONS.garage, district:'devlin', x:1360, y:430 },
  { id:'realty', kind:'realty', name:'Whitfield Realty', icon:ICONS.bld3, district:'devlin', x:1360, y:630 },
  { id:'cityhall', kind:'cityhall', name:'City Hall Annex', icon:ICONS.gov, district:'hub', x:1150, y:250 },
  { id:'heistTarget', kind:'heist', name:'First Windhaven Trust', icon:ICONS.bank, district:'hub', x:280, y:650 },
];
