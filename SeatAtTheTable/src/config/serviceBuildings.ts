import { brands } from './brands';
import { ICONS } from './icons';
import type { ServiceBuilding } from './types';

// LEGAL: Every brand in config/brands becomes a real place you walk into. Dealerships and
// LEGAL: brokerages carry their brandId so the interior knows whose stock to show. This
// LEGAL: replaces the old single generic 'cardealer' / 'realty' pair, which routed every
// LEGAL: purchase straight to the phone.
const brandBuildings: ServiceBuilding[] = brands.map(function(brand){
  return {
    id: `brand-${brand.id}`,
    kind: brand.sells === 'vehicle' ? 'dealership' : 'brokerage',
    name: brand.name,
    icon: brand.sells === 'vehicle' ? ICONS.garage : ICONS.bld3,
    district: brand.district,
    x: brand.x,
    y: brand.y,
    brandId: brand.id,
  };
});

export const serviceBuildings: ServiceBuilding[] = [
  // LEGAL: One walk-in branch per bank in config/banks, so in-person banking is possible
  // LEGAL: for all three accounts rather than only Rentport's.
  { id:'bankHome', kind:'bankHome', name:'Rentport City National — Devlin Branch', icon:ICONS.bank, district:'devlin', x:1360, y:230, bankId:'rentport-national' },
  { id:'bankFirstWindhaven', kind:'bankHome', name:'First Windhaven — West Side Branch', icon:ICONS.bank, district:'westside', x:915, y:750, bankId:'first-windhaven' },
  { id:'bankLakeside', kind:'bankHome', name:'Lakeside Offshore — Dockside Office', icon:ICONS.bank, district:'westside', x:1330, y:750, bankId:'lakeside-offshore' },

  ...brandBuildings,

  // LEGAL: The player's own garage — where the fleet lives and where cars come back to if
  // LEGAL: you leave them parked in the street. Home turf, so there is one place you always
  // LEGAL: know to find your cars. Distinct kind from 'dealership' so nothing that SELLS
  // LEGAL: cars can be mistaken for it.
  { id:'playerGarage', kind:'playerGarage', name:'Your Garage', icon:ICONS.garage, district:'devlin', x:700, y:750 },

  { id:'cityhall', kind:'cityhall', name:'City Hall Annex', icon:ICONS.gov, district:'hub', x:1150, y:250 },
  { id:'heistTarget', kind:'heist', name:'First Windhaven Trust', icon:ICONS.bank, district:'hub', x:280, y:650 },
  { id:'heraldHq', kind:'missionOffice', name:'Windhaven Herald HQ', icon:ICONS.phone, district:'hub', x:820, y:360 },
  { id:'hubBusStation', kind:'missionOffice', name:'Hub Bus Station', icon:ICONS.car, district:'hub', x:430, y:930 },
  { id:'devlinAlley', kind:'missionOffice', name:'Devlin Back Alley', icon:ICONS.badge, district:'devlin', x:220, y:840 },
  { id:'docksDockmaster', kind:'missionOffice', name:'Docks Dockmaster', icon:ICONS.box, district:'westside', x:1220, y:890 },
  { id:'railyard', kind:'missionOffice', name:'Railyard', icon:ICONS.box, district:'westside', x:780, y:180 },
  { id:'marigoldLounge', kind:'missionOffice', name:'Marigold Lounge', icon:ICONS.person, district:'westside', x:1050, y:520 },
  { id:'airfieldKettle', kind:'missionOffice', name:'Kettle Flats Airfield', icon:ICONS.car, district:'hub', x:0, y:0 },
  { id:'lodgeRidgewood', kind:'missionOffice', name:'Ridgewood Stand Lodge', icon:ICONS.person, district:'hub', x:0, y:0 },
  { id:'driveInBoundary', kind:'missionOffice', name:'Boundary Meadows Drive-In', icon:ICONS.car, district:'hub', x:0, y:0 },
  { id:'motelSunset', kind:'missionOffice', name:'Sunset Shore Motel', icon:ICONS.bld3, district:'hub', x:0, y:0 },
  { id:'fireRoadKestrel', kind:'missionOffice', name:'Kestrel Woods Fire Road', icon:ICONS.car, district:'hub', x:0, y:0 },
  { id:'mudsterTrailhead', kind:'dealership', name:'Mudster Kestrel Trailhead', icon:ICONS.garage, district:'hub', x:0, y:0, brandId:'mudster' },
  // LEGAL: Out past the city limits in the Lakeridge belt — see OUTSKIRT_PLACE_LOTS for why
  // LEGAL: its position is absolute rather than district-local. Somewhere you drive TO.
  { id:'casinoLakeridge', kind:'casino', name:'The Gilded Kettle', icon:ICONS.cards, district:'hub', x:0, y:0 },
  // LEGAL: Respray and trim. Stays in the city, on the West Side among the working garages.
  { id:'resprayShop', kind:'respray', name:'Vega Custom Paint & Trim', icon:ICONS.garage, district:'westside', x:640, y:300 },
];
