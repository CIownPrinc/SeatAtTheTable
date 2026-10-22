import type { LocalBusiness, Point, ServiceBuilding } from '../config/types';
import type { Landmark } from './world';
import type { MapObject, MinimapIcon } from './objects';

export type MapPlaceCategory = 'business' | 'service' | 'local' | 'amenity' | 'corner' | 'person' | 'gang' | 'landmark' | 'property';

export interface MapPlaceRecord extends Point {
  id: string;
  name: string;
  district: string;
  category: MapPlaceCategory;
  icon?: MinimapIcon | 'landmark';
  sourceKind: MapObject['kind'] | 'landmark';
  sourceObject?: MapObject;
  interactRadius: number;
}

// LEGAL: The places beyond the city worth the drive. They used to share the plain "service" dot
// LEGAL: with the newsroom and the bus station, so the map couldn't tell a casino from a back alley.
export const OUT_OF_TOWN = new Set(['airfieldKettle', 'lodgeRidgewood', 'driveInBoundary', 'motelSunset', 'fireRoadKestrel', 'mallLakeridge', 'casinoLakeridge']);

// LEGAL: What each named place is, in a word or two, for its map label.
const PLACE_LABELS: Record<string, string> = {
  playerGarage:'Your garage', heraldHq:'Newspaper', hubBusStation:'Bus station', devlinAlley:'Back alley',
  docksDockmaster:'Docks', railyard:'Railyard', marigoldLounge:'Nightclub', airfieldKettle:'Airfield',
  lodgeRidgewood:'Lodge', driveInBoundary:'Drive-in cinema', motelSunset:'Motel', fireRoadKestrel:'Fire road',
  mallLakeridge:'Shopping mall', casinoLakeridge:'Casino', resprayShop:'Paint shop',
  patel:'Corner shop', pawn:'Pawn shop', herbalist:'Herbalist', liquor:'Liquor store', bar:'Bar', marlowe:'Bar',
  chopshop:'Chop shop', jewelers:'Jeweller',
};

export function minimapIconForService(service: ServiceBuilding): MinimapIcon {
  if(service.kind === 'bankHome') return 'bank';
  if(service.kind === 'playerGarage') return 'home';
  if(OUT_OF_TOWN.has(service.id)) return 'destination';
  // LEGAL: Branded shops reuse the established garage / realty glyphs so the minimap
  // LEGAL: legend, search, and place labels keep working unchanged.
  if(service.kind === 'garage' || service.kind === 'dealership') return 'garage';
  if(service.kind === 'realty' || service.kind === 'brokerage') return 'realty';
  if(service.kind === 'cityhall') return 'cityhall';
  if(service.kind === 'heist') return 'heist';
  return 'service';
}

export function minimapIconForLocalBusiness(business: LocalBusiness): MinimapIcon {
  if(business.id === 'bar' || business.id === 'marlowe') return 'bar';
  if(business.id === 'chopshop') return 'garage';
  if(business.id === 'jewelers') return 'realty';
  return 'shop';
}

// LEGAL: What you own, for the labels and the "Yours" filter.
export interface OwnedPlaces { ventures: ReadonlySet<string>; properties: ReadonlySet<string> }

export function mapPlaceCategoryLabel(place: Pick<MapPlaceRecord, 'category' | 'icon' | 'sourceKind'> & { id?: string }, owned?: OwnedPlaces): string {
  if(place.id && PLACE_LABELS[place.id]) return PLACE_LABELS[place.id];
  if(place.category === 'business'){
    const yours = !!place.id && !!owned?.ventures.has(place.id);
    if(place.icon === 'illegal') return yours ? 'Your underground business' : 'Underground business, not yours yet';
    return yours ? 'Your business' : 'Business, not yours yet';
  }
  if(place.icon === 'estate') return 'Your property';
  if(place.icon === 'bank') return 'Bank';
  // LEGAL: "Garage" implied the player's own garage — these are dealerships that sell cars.
  if(place.icon === 'garage') return 'Car dealership';
  if(place.icon === 'realty') return 'Realty office';
  if(place.icon === 'cityhall') return 'City Hall';
  if(place.icon === 'heist') return 'Heist target';
  if(place.icon === 'bar') return 'Bar / club';
  if(place.icon === 'shop') return 'Local shop';
  if(place.category === 'service') return 'Service';
  if(place.category === 'amenity') return 'Amenity';
  if(place.category === 'corner') return 'Street corner';
  if(place.category === 'person') return 'Person';
  if(place.category === 'gang') return 'Gang recruit';
  if(place.category === 'landmark') return 'Landmark';
  if(place.sourceKind === 'local') return 'Local place';
  return 'Place';
}

function nameForMapObject(object: MapObject): string {
  if('biz' in object.ref) return object.ref.biz.name;
  if('name' in object.ref) return object.ref.name;
  return object.id;
}

function categoryForMapObject(object: MapObject): MapPlaceCategory {
  if(object.kind === 'building') return 'business';
  if(object.kind === 'property') return 'property';
  if(object.kind === 'gangnpc') return 'gang';
  if(object.kind === 'npc') return 'person';
  return object.kind;
}

export function placeRecordFromMapObject(object: MapObject): MapPlaceRecord {
  return {
    id: object.id,
    name: nameForMapObject(object),
    district: object.district,
    x: object.x,
    y: object.y,
    category: categoryForMapObject(object),
    icon: object.minimapIcon,
    sourceKind: object.kind,
    sourceObject: object,
    interactRadius: object.interactRadius,
  };
}

export function placeRecordFromLandmark(landmark: Landmark): MapPlaceRecord {
  return {
    id: landmark.id,
    name: landmark.name,
    district: landmark.district,
    x: landmark.x,
    y: landmark.y,
    category: 'landmark',
    icon: 'landmark',
    sourceKind: 'landmark',
    interactRadius: 58,
  };
}

// LEGAL: The groups the City Map filters by, in order. One table, so the filter buttons, the labels
// LEGAL: and the legend can't disagree, which is how they had drifted apart.
export type MapPlaceGroup = 'yours' | 'business' | 'service' | 'shop' | 'outoftown' | 'amenity' | 'corner' | 'people' | 'landmark';
export const MAP_PLACE_GROUPS: Array<{ id: MapPlaceGroup; label: string }> = [
  { id:'yours', label:'Yours' }, { id:'business', label:'Businesses' }, { id:'service', label:'Services' },
  { id:'shop', label:'Shops & bars' }, { id:'outoftown', label:'Out of town' }, { id:'amenity', label:'Amenities' },
  { id:'corner', label:'Corners' }, { id:'people', label:'People' }, { id:'landmark', label:'Landmarks' },
];

export function mapPlaceGroups(place: MapPlaceRecord, owned: OwnedPlaces): MapPlaceGroup[] {
  const groups: MapPlaceGroup[] = [];
  const yours = (place.category === 'business' && owned.ventures.has(place.id)) || place.id === 'playerGarage'
    || (place.category === 'property' && !!place.sourceObject && owned.properties.has(propertyIdOf(place.sourceObject)));
  if(yours) groups.push('yours');
  if(place.category === 'business') groups.push('business');
  else if(place.category === 'service') groups.push(OUT_OF_TOWN.has(place.id) ? 'outoftown' : 'service');
  else if(place.category === 'local') groups.push('shop');
  else if(place.category === 'amenity') groups.push('amenity');
  else if(place.category === 'corner') groups.push('corner');
  else if(place.category === 'person' || place.category === 'gang') groups.push('people');
  else if(place.category === 'landmark') groups.push('landmark');
  return groups;
}

function propertyIdOf(object: MapObject): string {
  return 'property' in object.ref ? object.ref.property.id : object.id;
}

// LEGAL: The one legend, used by the City Map and the strip under the map, in the same words as the
// LEGAL: place labels above.
export const MAP_LEGEND: Array<{ icon: string; label: string; color: string; ph: string }> = [
  { icon:'legal',    label:'Business',                color:'#3e7c8c', ph:'ph-storefront' },
  { icon:'illegal',  label:'Underground business',    color:'#a8394a', ph:'ph-mask-happy' },
  { icon:'home',     label:'Your garage',             color:'#d4a017', ph:'ph-house-simple' },
  { icon:'bank',     label:'Bank',                    color:'#d4a017', ph:'ph-bank' },
  { icon:'garage',   label:'Car dealership',          color:'#2a87ff', ph:'ph-car-profile' },
  { icon:'realty',   label:'Realty office',           color:'#7a6fb0', ph:'ph-house-line' },
  { icon:'cityhall', label:'City Hall',               color:'#f0efe8', ph:'ph-buildings' },
  { icon:'heist',    label:'Heist target',            color:'#f04848', ph:'ph-lock-key' },
  { icon:'shop',     label:'Shop',                    color:'#7a6fb0', ph:'ph-t-shirt' },
  { icon:'bar',      label:'Bar',                     color:'#a385ff', ph:'ph-martini' },
  { icon:'service',  label:'Other place to go',       color:'#d4a017', ph:'ph-map-pin-simple' },
  { icon:'destination', label:'Out of town',          color:'#4fc3c8', ph:'ph-flag' },
  { icon:'corner',   label:'Street corner',           color:'#d4a017', ph:'ph-map-pin' },
  { icon:'amenity',  label:'Amenity',                 color:'#5fbf8f', ph:'ph-basketball' },
  { icon:'person',   label:'Person',                  color:'#f0efe8', ph:'ph-user' },
  { icon:'gang',     label:'Gang recruit',            color:'#f0efe8', ph:'ph-users-three' },
  { icon:'estate',   label:'Your property',           color:'#5fbf8f', ph:'ph-house' },
  { icon:'landmark', label:'Landmark',                color:'#e0c860', ph:'ph-star' },
  { icon:'you',      label:'You',                     color:'#e8e6de', ph:'ph-navigation-arrow' },
  { icon:'waypoint', label:'Waypoint and route',      color:'#35e0ff', ph:'ph-crosshair' },
];


export function createMapPlaceRecords(objects: MapObject[], landmarks: Landmark[]): MapPlaceRecord[] {
  return [
    ...objects.map(placeRecordFromMapObject),
    ...landmarks.map(placeRecordFromLandmark),
  ];
}

export function nearestMapPlace(places: MapPlaceRecord[], point: Point, maxDistance: number): MapPlaceRecord | null {
  let best: MapPlaceRecord | null = null;
  let bestDistance = maxDistance;

  places.forEach(function(place){
    const distance = Math.hypot(point.x - place.x, point.y - place.y);
    const limit = Math.min(bestDistance, place.interactRadius);
    if(distance < limit){
      bestDistance = distance;
      best = place;
    }
  });

  return best;
}
