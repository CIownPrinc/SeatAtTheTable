import type { LocalBusiness, MapZoneType, ServiceBuilding, Solid } from '../config/types';
import { brandById } from '../config/brands';
import type { MapBuilding } from './markers';
import type { PropertyPlace } from './propertyPlaces';

// LEGAL: ---- Place archetypes ----
// LEGAL: Every place on the map used to be a box with a sign on it, sized by a silhouette
// LEGAL: table keyed on which config array it happened to live in. That is why the world read
// LEGAL: as noise: twelve service buildings shared one `missionOffice` kind, so a BACK ALLEY,
// LEGAL: a RAILYARD, a BUS STATION, a NEWSPAPER HQ, a DOCKMASTER and a LOUNGE were all drawn
// LEGAL: as the same box. The map was lying about what was in it.
// LEGAL:
// LEGAL: An archetype says what a place physically IS. It is assigned per place, deliberately,
// LEGAL: never derived from a config bucket — and archetypes.test.ts fails if any place in any
// LEGAL: config is missing one, so a new place cannot quietly inherit a wrong shape.

export type PlaceArchetype =
  | 'cart'
  | 'alley'
  | 'lot'
  | 'tenement'
  | 'storefront'
  | 'showroom'
  | 'office'
  | 'tower'
  | 'civic'
  | 'works'
  | 'bay'
  | 'plaza';

// LEGAL: What to draw. `stall`, `open` and `bay` deliberately have NO building shell — that
// LEGAL: is the whole point of them.
export type ArchetypeShell = 'building' | 'stall' | 'open' | 'bay';

export interface ArchetypeForm {
  shell: ArchetypeShell;
  // LEGAL: Fraction of the footprint that blocks movement. Zero means you walk right in,
  // LEGAL: which is what makes an alley an alley instead of a box you bump into. This is the
  // LEGAL: SAME number the renderer sizes the shell from, so the drawn thing and the thing
  // LEGAL: you collide with cannot drift apart the way the old fixed 35x31 bounds did.
  solidScale: number;
  // LEGAL: Ground treatment for open archetypes — asphalt yard vs. wet cobbles.
  ground?: string;
}

const FORMS: Record<PlaceArchetype, ArchetypeForm> = {
  cart:       { shell:'stall',    solidScale:0.5 },
  alley:      { shell:'open',     solidScale:0, ground:'#2b2b30' },
  lot:        { shell:'open',     solidScale:0, ground:'#33343a' },
  tenement:   { shell:'building', solidScale:1 },
  storefront: { shell:'building', solidScale:1 },
  showroom:   { shell:'building', solidScale:1 },
  office:     { shell:'building', solidScale:1 },
  tower:      { shell:'building', solidScale:1 },
  civic:      { shell:'building', solidScale:1 },
  works:      { shell:'building', solidScale:1 },
  // LEGAL: Three walls and an open mouth. solidScale 0 for the same reason the alley has it:
  // LEGAL: the middle of a garage is not solid, it is where the car goes. The walls come back
  // LEGAL: as extra solids below, so you can drive in but not through.
  bay:        { shell:'bay',      solidScale:0, ground:'#6b6459' },
  // LEGAL: Paved open ground in front of a big building: the mall's forecourt.
  plaza:      { shell:'open',     solidScale:0, ground:'#b5ad9c' },
};

export function archetypeForm(archetype: PlaceArchetype): ArchetypeForm {
  return FORMS[archetype];
}

// LEGAL: The zoneType the detailed-building renderer already understands, per archetype, so
// LEGAL: the existing facade detailing hangs off the right shell.
const ZONE_TYPES: Record<PlaceArchetype, string> = {
  cart: 'shop',
  alley: 'industrial',
  lot: 'industrial',
  tenement: 'residential',
  storefront: 'shop',
  showroom: 'commercial',
  office: 'commercial',
  tower: 'skyscraper',
  civic: 'service',
  works: 'industrial',
  bay: 'industrial',
  plaza: 'commercial',
};

export function archetypeZoneType(archetype: PlaceArchetype): string {
  return ZONE_TYPES[archetype];
}

// LEGAL: Footprints for the archetypes that are not buildings, which need shapes a building
// LEGAL: silhouette table cannot express: an alley is a long NARROW gap, a yard is wide and
// LEGAL: barely tall, a stall is small enough to walk up to. Returns null for archetypes that
// LEGAL: keep their config's own building footprint.
const OPEN_SHAPES: Partial<Record<PlaceArchetype, { w: number; h: number; d: number; color: string }>> = {
  alley: { w:46, h:40, d:104, color:'#3d3a38' },
  lot:   { w:118, h:18, d:86, color:'#4a453e' },
  cart:  { w:30, h:16, d:24, color:'#b4432f' },
  plaza: { w:220, h:2, d:90, color:'#b5ad9c' },
};

export function archetypeSilhouette(archetype: PlaceArchetype): { w: number; h: number; d: number; color: string } | null {
  return OPEN_SHAPES[archetype] ?? null;
}

// LEGAL: ---- Assignments ----
// LEGAL: Keyed on the place's own id. Read these as claims about the fiction: a cab company
// LEGAL: keeps a depot yard, a chop ring needs a warehouse, an export ring is not a shop.

export const VENTURE_ARCHETYPES: Record<string, PlaceArchetype> = {
  cart: 'cart',                     // LEGAL: Kailash's Cart — a food stall, not a building.
  store: 'storefront',              // LEGAL: Corner Store.
  laundromat: 'storefront',         // LEGAL: Sudsy Laundromat.
  restaurant: 'storefront',         // LEGAL: Windhaven Chaat House.
  lounge: 'storefront',             // LEGAL: Marigold Lounge — shopfront with neon.
  backroom_cards: 'alley',          // LEGAL: Backroom Card Games — entered off the alley.
  wire_network: 'alley',            // LEGAL: Bookmaking & wire ops behind an unmarked door.
  chop_ring: 'works',               // LEGAL: Stolen Vehicle Export Ring — a yard and a shed.
  garage: 'works',                  // LEGAL: Ashok's Auto Garage — a workshop, not a showroom.
  cab: 'lot',                       // LEGAL: Windhaven Cab Co. — a depot yard of parked cabs.
  syndicate_logistics: 'works',     // LEGAL: A freight warehouse.
  realestate: 'office',             // LEGAL: West Side Holdings.
  family_office: 'tower',           // LEGAL: Hub corporate.
};

export const LOCAL_ARCHETYPES: Record<string, PlaceArchetype> = {
  patel: 'storefront',              // LEGAL: Patel Grocery.
  pawn: 'storefront',               // LEGAL: Nowak's Pawn Shop.
  herbalist: 'storefront',          // LEGAL: Golden Lotus Herbalist.
  bar: 'storefront',                // LEGAL: O'Malley's Bar.
  liquor: 'storefront',             // LEGAL: Corner Liquor.
  jewelers: 'storefront',           // LEGAL: Whitfield & Co. Jewelers.
  marlowe: 'storefront',            // LEGAL: The Marlowe Club.
  chopshop: 'works',                // LEGAL: West Side Chop Shop — a garage, not a shop.
};

export const SERVICE_ARCHETYPES: Record<string, PlaceArchetype> = {
  bankHome: 'civic',                // LEGAL: Rentport City National — columns and steps.
  bankFirstWindhaven: 'civic',
  bankLakeside: 'civic',
  heistTarget: 'civic',             // LEGAL: First Windhaven Trust is a bank; rob a bank.
  cityhall: 'civic',                // LEGAL: City Hall Annex.
  hubBusStation: 'civic',           // LEGAL: A public transit hall.
  heraldHq: 'office',               // LEGAL: Windhaven Herald HQ — a newsroom.
  marigoldLounge: 'storefront',     // LEGAL: The lounge's street entrance.
  playerGarage: 'bay',              // LEGAL: Your garage — you DRIVE INTO it. See BAY_WALL.
  devlinAlley: 'alley',             // LEGAL: Devlin Back ALLEY. Was drawn as a building.
  railyard: 'lot',                  // LEGAL: Open ground, fencing, a hut. Not a building.
  docksDockmaster: 'lot',           // LEGAL: A dockside yard.
  airfieldKettle: 'lot',            // LEGAL: A crop-duster strip is open ground, not an office.
  lodgeRidgewood: 'works',          // LEGAL: A remote lodge is a weathered meeting house.
  driveInBoundary: 'bay',           // LEGAL: The drive-in is an open parking bay facing one screen.
  motelSunset: 'storefront',        // LEGAL: The shore motel is one low, enterable roadside building.
  fireRoadKestrel: 'lot',           // LEGAL: A trailhead shed and dirt turnout, with the course beyond it.
  // LEGAL: The mall's front plaza is the place you walk into; the building behind it is map/mall.
  mallLakeridge: 'plaza',
  casinoLakeridge: 'civic',         // LEGAL: The Gilded Kettle — a big lit hall out of town.
  resprayShop: 'works',             // LEGAL: A paint shop is a workshop, not a showroom.
};

// LEGAL: Branded shops are generated per brand rather than authored one by one, so they are
// LEGAL: assigned by the brand's kind — a dealership is a glass showroom whatever it sells.
const SERVICE_KIND_ARCHETYPES: Record<string, PlaceArchetype> = {
  garage: 'works',
  dealership: 'showroom',
  brokerage: 'office',
  realty: 'office',
};

// LEGAL: Property archetype comes from the BRAND's character, which is the rule section 0a
// LEGAL: called out as violated: a Concrete Dreams walk-up must be a run-down tenement, not
// LEGAL: the same clean box as a Horizon apartment.
const PROPERTY_CATEGORY_ARCHETYPES: Record<string, PlaceArchetype> = {
  cheap: 'tenement',
  luxury: 'tower',
  waterfront: 'tower',
  commercial: 'works',
};

// LEGAL: What an unnamed filler building is, from its block's land use: so the background city is
// LEGAL: drawn from the same Blender models as the named places rather than a different kit.
export function fillerArchetype(zone: MapZoneType, apartment: boolean, height: number): PlaceArchetype {
  if(apartment || zone === 'residential') return 'tenement';
  if(zone === 'corporate') return height > 160 ? 'tower' : 'office';
  if(zone === 'industrial' || zone === 'logistics') return 'works';
  if(zone === 'civic') return 'civic';
  return 'storefront';
}

export function ventureArchetype(building: MapBuilding): PlaceArchetype | null {
  return VENTURE_ARCHETYPES[building.id] ?? null;
}

export function localArchetype(business: LocalBusiness): PlaceArchetype | null {
  return LOCAL_ARCHETYPES[business.id] ?? null;
}

export function serviceArchetype(building: ServiceBuilding): PlaceArchetype | null {
  return SERVICE_ARCHETYPES[building.id] ?? SERVICE_KIND_ARCHETYPES[building.kind] ?? null;
}

export function propertyArchetype(place: PropertyPlace): PlaceArchetype | null {
  const category = brandById(place.property.brand)?.category;
  if(!category) return null;
  return PROPERTY_CATEGORY_ARCHETYPES[category] ?? null;
}

// LEGAL: Solids an archetype needs BEYOND its own bounds. An alley is the gap between two
// LEGAL: buildings, so the gap itself must stay walkable (solidScale 0) while the buildings
// LEGAL: forming it are solid. One bounds box cannot express "blocked, open, blocked", so the
// LEGAL: flanks come from here. Kept next to the archetype table rather than in the renderer
// LEGAL: so the collision and the drawn shell are sized from the same numbers.
export const ALLEY_FLANK_W = 30;

// LEGAL: Thickness of the garage's two side walls and its back wall. The mouth is the +y face
// LEGAL: and is left entirely open, so a car (radius 24, see movement.actorRadius) drives in
// LEGAL: under its own power. A 84-wide bay minus two 9-thick walls leaves 66 of clear
// LEGAL: opening — 48 of car and 9 of slack either side, which is enough to aim at without
// LEGAL: being so wide the walls stop reading as walls.
export const BAY_WALL = 9;

export function archetypeExtraSolids(archetype: PlaceArchetype | null, x: number, y: number, w: number, d: number): Solid[] {
  if(archetype === 'alley'){
    const offset = w/2 + ALLEY_FLANK_W/2 - 2;
    return [-1, 1].map(function(side){
      return { x: x + side * offset, y, hw: ALLEY_FLANK_W/2, hd: d/2 };
    });
  }
  if(archetype === 'bay'){
    return [
      // LEGAL: Side walls, running the full depth.
      ...[-1, 1].map(function(side): Solid {
        return { x: x + side * (w/2 - BAY_WALL/2), y, hw: BAY_WALL/2, hd: d/2 };
      }),
      // LEGAL: Back wall, spanning between them. Nothing is added along the +y face: that
      // LEGAL: absence IS the door.
      { x, y: y - (d/2 - BAY_WALL/2), hw: w/2, hd: BAY_WALL/2 },
    ];
  }
  return [];
}

// LEGAL: The drivable volume inside a bay: the footprint less its walls, with the mouth open.
// LEGAL: Kept here beside the walls so the space you park in and the walls you would hit are
// LEGAL: derived from one set of numbers.
export function bayInterior(x: number, y: number, w: number, d: number): { x: number; y: number; hw: number; hd: number } {
  return { x, y: y + BAY_WALL/2, hw: w/2 - BAY_WALL, hd: (d - BAY_WALL)/2 };
}
