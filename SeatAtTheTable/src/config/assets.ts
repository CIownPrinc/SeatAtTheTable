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

  // LEGAL: ---- Dealer-only stock ----
  // LEGAL: The online catalog is frozen to what the old Assets tab sold, so every brand
  // LEGAL: needs its own in-person exclusives or its shop is pointless to drive to.
  // LEGAL: No Problem Auto and Mudster previously had none at all.
  { id:'beater_wagon', name:'Karolla Wagon', icon:ICONS.car, cost:1400, speedMult:1.12, heistBonus:0.06, respectPerSec:0, color:'#6b7360', len:30, wid:15, brand:'no-problem-auto' },
  { id:'panel_van', name:'Ridgeline Panel Van', icon:ICONS.car, cost:9500, speedMult:1.18, heistBonus:0.14, respectPerSec:0, color:'#8a8577', len:34, wid:17, brand:'no-problem-auto' },
  { id:'outlaw_racer', name:'Outlaw Streetfighter', icon:ICONS.car, cost:12000, speedMult:1.52, heistBonus:0.02, respectPerSec:0.12, color:'#7a1f2a', len:19, wid:8, brand:'outlaw-riders' },
  { id:'mudster_pickup', name:'Mudster Ranger', icon:ICONS.car, cost:18000, speedMult:1.30, heistBonus:0.10, respectPerSec:0.08, color:'#3d4a35', len:33, wid:17, brand:'mudster' },
  { id:'mudster_armored', name:'Mudster Bulwark', icon:ICONS.car, cost:88000, speedMult:1.34, heistBonus:0.22, respectPerSec:0.3, color:'#171a1f', len:35, wid:19, brand:'mudster' },
  { id:'electron_van', name:'Electron Haul', icon:ICONS.car, cost:62000, speedMult:1.38, heistBonus:0.16, respectPerSec:0.15, color:'#3f5a66', len:33, wid:17, brand:'electron' },
  { id:'diamond_roadster', name:'Diamond Mirage', icon:ICONS.car, cost:260000, speedMult:1.62, heistBonus:0.08, respectPerSec:0.55, color:'#1f4f6b', len:29, wid:15, brand:'diamond-exotics' },
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

  // LEGAL: ---- Broker-only listings ----
  // LEGAL: Same rule as the dealerships: Ironpoint and Lakeshore had nothing you had to
  // LEGAL: visit for, so their offices did nothing. These are seen in person only.
  { id:'corner_store_block', name:'Sixteenth Street Storefronts', icon:ICONS.bld1, cost:9500, incomePerSec:13, brand:'concrete-dreams' },
  { id:'canal_walkup', name:'Canal Row Walk-Up', icon:ICONS.bld1, cost:5200, incomePerSec:7.5, brand:'concrete-dreams' },
  { id:'freight_depot', name:'Freightline Depot', icon:ICONS.bld1, cost:48000, incomePerSec:64, brand:'ironpoint' },
  { id:'coldstore', name:'Tannery Cold Store', icon:ICONS.bld1, cost:135000, incomePerSec:180, brand:'ironpoint' },
  { id:'brownstone_row', name:'Gilt Shore Brownstones', icon:ICONS.bld2, cost:340000, incomePerSec:450, brand:'horizon' },
  { id:'marina_block', name:'Waterfront Marina Block', icon:ICONS.bld3, cost:420000, incomePerSec:520, brand:'lakeshore' },
  { id:'harbour_tower', name:'Harbourlight Tower', icon:ICONS.bld3, cost:1250000, incomePerSec:1500, brand:'lakeshore' },
];
