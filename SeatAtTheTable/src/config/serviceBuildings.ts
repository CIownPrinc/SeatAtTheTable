import { ICONS } from './icons';
import type { ServiceBuilding } from './types';

export const serviceBuildings: ServiceBuilding[] = [
  { id:'bankHome', kind:'bankHome', name:'Rentport City National — Devlin Branch', icon:ICONS.bank, district:'devlin', x:1360, y:230, bankId:'rentport-national' },
  { id:'cardealer', kind:'garage', name:'Windhaven Auto Exchange', icon:ICONS.garage, district:'devlin', x:1360, y:430 },
  { id:'realty', kind:'realty', name:'Whitfield Realty', icon:ICONS.bld3, district:'devlin', x:1360, y:630 },
  { id:'cityhall', kind:'cityhall', name:'City Hall Annex', icon:ICONS.gov, district:'hub', x:1150, y:250 },
  { id:'heistTarget', kind:'heist', name:'First Windhaven Trust', icon:ICONS.bank, district:'hub', x:280, y:650 },
  { id:'heraldHq', kind:'missionOffice', name:'Windhaven Herald HQ', icon:ICONS.phone, district:'hub', x:820, y:360 },
  { id:'hubBusStation', kind:'missionOffice', name:'Hub Bus Station', icon:ICONS.car, district:'hub', x:430, y:930 },
  { id:'devlinAlley', kind:'missionOffice', name:'Devlin Back Alley', icon:ICONS.badge, district:'devlin', x:220, y:840 },
  { id:'docksDockmaster', kind:'missionOffice', name:'Docks Dockmaster', icon:ICONS.box, district:'westside', x:1220, y:890 },
  { id:'railyard', kind:'missionOffice', name:'Railyard', icon:ICONS.box, district:'westside', x:780, y:180 },
  { id:'marigoldLounge', kind:'missionOffice', name:'Marigold Lounge', icon:ICONS.person, district:'westside', x:1050, y:520 },
];
