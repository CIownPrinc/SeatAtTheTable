import { ICONS } from './icons';
import type { Car, Property } from './types';

export const cars: Car[] = [
  { id:'sedan', name:'Used Sedan', icon:ICONS.car, cost:800, speedMult:1.10, heistBonus:0.02, respectPerSec:0, color:'#7d8a99', len:26, wid:14 },
  { id:'impala', name:"Impala '19", icon:ICONS.car, cost:5000, speedMult:1.25, heistBonus:0.05, respectPerSec:0, color:'#3e6b8a', len:29, wid:15 },
  { id:'escalade', name:'Cadillac Escalade', icon:ICONS.car, cost:35000, speedMult:1.40, heistBonus:0.08, respectPerSec:0.15, color:'#20242c', len:32, wid:17 },
  { id:'bentley', name:'Vintage Bentley', icon:ICONS.car, cost:150000, speedMult:1.55, heistBonus:0.12, respectPerSec:0.4, color:'#c9a227', len:31, wid:16 },
];

export const properties: Property[] = [
  { id:'twoflat', name:'Rockwell Two-Flat', icon:ICONS.bld1, cost:3000, incomePerSec:4.5 },
  { id:'retailstrip', name:'Devlin Retail Strip', icon:ICONS.bld1, cost:22000, incomePerSec:32 },
  { id:'aptbuilding', name:'Uptown Apartments', icon:ICONS.bld2, cost:120000, incomePerSec:165 },
  { id:'loft', name:'Riverside Lofts', icon:ICONS.bld3, cost:600000, incomePerSec:800 },
];
