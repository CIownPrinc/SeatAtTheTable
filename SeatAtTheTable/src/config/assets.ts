import { ICONS } from './icons';
import type { Car, Property } from './types';

// LEGAL: Vehicles, grouped by the brand (config/brands) that sells them. `online:true`
// LEGAL: items are also orderable from the phone AutoMart app; the rest become dealer-only
// LEGAL: once the in-person lots exist. Existing four keep their ids so saves stay valid.
export const cars: Car[] = [
  // LEGAL: No Problem Auto - used, cheap, unreliable
  { id:'sedan', name:'Karolla', icon:ICONS.car, cost:800, speedMult:1.10, heistBonus:0.02, respectPerSec:0, color:'#7d8a99', len:26, wid:14, brand:'no-problem-auto', online:true },
  { id:'impala', name:'Chevalier SS', icon:ICONS.car, cost:5000, speedMult:1.25, heistBonus:0.05, respectPerSec:0, color:'#3e6b8a', len:29, wid:15, brand:'no-problem-auto', online:true },
  // LEGAL: Outlaw Riders Auto - bikes, quick and cheap, exposed
  { id:'chopper', name:'Outlaw Chopper', icon:ICONS.car, cost:1800, speedMult:1.34, heistBonus:0.01, respectPerSec:0.05, color:'#1c1e24', len:18, wid:8, brand:'outlaw-riders' },
  // LEGAL: Mudster - SUVs / off-road
  { id:'escalade', name:'Mudster XL', icon:ICONS.car, cost:35000, speedMult:1.40, heistBonus:0.08, respectPerSec:0.15, color:'#20242c', len:32, wid:17, brand:'mudster', online:true },
  // LEGAL: Electron - EVs
  { id:'electron3', name:'Electron 3', icon:ICONS.car, cost:45000, speedMult:1.45, heistBonus:0.06, respectPerSec:0.2, color:'#4a6b7a', len:28, wid:15, brand:'electron' },
  { id:'bentley', name:'Electron S', icon:ICONS.car, cost:150000, speedMult:1.55, heistBonus:0.12, respectPerSec:0.4, color:'#c9a227', len:31, wid:16, brand:'electron', online:true },
  // LEGAL: Diamond Exotics - luxury supercars, status
  { id:'exotic', name:'Diamond Veyra', icon:ICONS.car, cost:450000, speedMult:1.70, heistBonus:0.10, respectPerSec:0.8, color:'#b02a3a', len:30, wid:16, brand:'diamond-exotics' },
];

export const properties: Property[] = [
  // LEGAL: Concrete Dreams - cheap, rough, gets hit
  { id:'twoflat', name:'Rockwell Two-Flat', icon:ICONS.bld1, cost:3000, incomePerSec:4.5, brand:'concrete-dreams', online:true },
  { id:'vacantflat', name:'Vacant Three-Flat', icon:ICONS.bld1, cost:1800, incomePerSec:2.5, brand:'concrete-dreams' },
  // LEGAL: Ironpoint Commercial - warehouses / laundering fronts
  { id:'retailstrip', name:'Devlin Retail Strip', icon:ICONS.bld1, cost:22000, incomePerSec:32, brand:'ironpoint', online:true },
  // LEGAL: Horizon Properties - luxury, clean
  { id:'aptbuilding', name:'Uptown Apartments', icon:ICONS.bld2, cost:120000, incomePerSec:165, brand:'horizon', online:true },
  { id:'penthouse', name:'Skyline Penthouse', icon:ICONS.bld2, cost:950000, incomePerSec:1250, brand:'horizon' },
  // LEGAL: Lakeshore Development - waterfront, appreciates
  { id:'loft', name:'Riverside Lofts', icon:ICONS.bld3, cost:600000, incomePerSec:800, brand:'lakeshore', online:true },
];
