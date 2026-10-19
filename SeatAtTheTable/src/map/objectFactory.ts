import type { Corner, GangRecruit, LocalBusiness, MapAmenity, ServiceBuilding, Solid } from '../config/types';
import { amenityHasSolidFootprint } from './amenities';
import type { MapBuilding, MapNpc } from './markers';
import type { MapObject } from './objects';
import type { PropertyPlace } from './propertyPlaces';
import { createBounds } from './objects';
import { minimapIconForLocalBusiness, minimapIconForService } from './places';
import { localBusinessSilhouette, propertySilhouette, serviceBuildingSilhouette } from './placeRendering';
import { archetypeForm, localArchetype, propertyArchetype, serviceArchetype, ventureArchetype, type PlaceArchetype } from './archetypes';

// LEGAL: Collision comes from the archetype, so a place blocks exactly the shape it draws.
// LEGAL: An alley or a yard has solidScale 0 and returns NO bounds — you walk in, which is
// LEGAL: the entire difference between an alley and a box with a sign on it. Keeping this in
// LEGAL: one place is deliberate: bounds that were maintained separately from the drawn
// LEGAL: silhouette are exactly what produced the invisible barriers around buildings.
function archetypeBounds(archetype: PlaceArchetype | null, x: number, y: number, w: number, d: number): Solid | undefined {
  const scale = archetype ? archetypeForm(archetype).solidScale : 1;
  if(scale <= 0) return undefined;
  return createBounds(x, y, (w/2) * scale, (d/2) * scale);
}

export interface VentureFootprint {
  w: number;
  d: number;
  h: number;
  zoneType: string;
}

export interface MapObjectFactoryInput {
  mapBuildings: MapBuilding[];
  serviceBuildings: ServiceBuilding[];
  propertyPlaces?: PropertyPlace[];
  localBusinesses: LocalBusiness[];
  amenities: MapAmenity[];
  corners: Corner[];
  npcs: MapNpc[];
  gangRecruits: GangRecruit[];
}

export function ventureFootprint(m: MapBuilding): VentureFootprint {
  if(m.id==='cart') return { w:30, d:22, h:14, zoneType:'shop' };
  if(m.zone==='corporate') return { w:72, d:58, h:m.id==='family_office'?96:82, zoneType:'skyscraper' };
  if(m.zone==='logistics') return { w:82, d:58, h:32, zoneType:'industrial' };
  if(m.zone==='industrial') return { w:76, d:54, h:28, zoneType:'industrial' };
  if(m.zone==='entertainment') return { w:70, d:54, h:42, zoneType:'commercial' };
  if(m.zone==='street') return { w:56, d:44, h:26, zoneType:'industrial' };
  return { w:m.biz.baseCost<1000?46:58, d:m.biz.baseCost<1000?34:46, h:m.biz.baseCost>=18000?38:24, zoneType:'shop' };
}

export function ventureBounds(m: MapBuilding): Solid | undefined {
  const footprint = ventureFootprint(m);
  return archetypeBounds(ventureArchetype(m), m.x, m.y, footprint.w + 12, footprint.d + 12);
}

export function buildMapObjects(input: MapObjectFactoryInput): MapObject[] {
  return [
    ...input.mapBuildings.map(function(m): MapObject<'building', typeof m> {
      const legit = m.biz.category==='legit';
      return { kind:'building', id:m.id, district:m.district, x:m.x, y:m.y, bounds:ventureBounds(m), interactRadius:46, minimapColor:legit?'#3e7c8c':'#a8394a', minimapSize:3, minimapIcon:legit?'legal':'illegal', ref:m };
    }),
    ...input.serviceBuildings.map(function(m): MapObject<'service', ServiceBuilding> {
      // LEGAL: Collision derived from the drawn silhouette instead of a fixed 35x31. Those
      // LEGAL: constants stopped matching anything once buildings got their own footprints:
      // LEGAL: you clipped into the wide dealerships and hit an invisible wall about 30
      // LEGAL: units short of the small ones.
      const shape = serviceBuildingSilhouette(m);
      return { kind:'service', id:m.id, district:m.district, x:m.x, y:m.y, bounds:archetypeBounds(serviceArchetype(m),m.x,m.y,shape.w,shape.d), interactRadius:Math.max(46, shape.w*0.62), minimapColor:'#d4a017', minimapSize:3, minimapIcon:minimapIconForService(m), ref:m };
    }),
    // LEGAL: Real estate you can own. Always in the world (a walk-up exists whether or not
    // LEGAL: you hold the deed); header filters the minimap to the ones you actually own.
    ...(input.propertyPlaces ?? []).map(function(m): MapObject<'property', PropertyPlace> {
      const shape = propertySilhouette(m);
      return { kind:'property', id:m.id, district:m.district, x:m.x, y:m.y, bounds:archetypeBounds(propertyArchetype(m),m.x,m.y,shape.w,shape.d), interactRadius:Math.max(44, shape.w*0.62), minimapColor:'#5fbf8f', minimapSize:2.6, minimapIcon:'estate', ref:m };
    }),
    ...input.localBusinesses.map(function(m): MapObject<'local', LocalBusiness> {
      const shape = localBusinessSilhouette(m);
      return { kind:'local', id:m.id, district:m.district, x:m.x, y:m.y, bounds:archetypeBounds(localArchetype(m),m.x,m.y,shape.w,shape.d), interactRadius:Math.max(46, shape.w*0.62), minimapColor:'#7a6fb0', minimapSize:2.5, minimapIcon:minimapIconForLocalBusiness(m), ref:m };
    }),
    ...input.amenities.map(function(m): MapObject<'amenity', MapAmenity> {
      // LEGAL: The pet store is a shop building; the newsstand only a kiosk.
      const bounds = amenityHasSolidFootprint(m.kind) ? (m.kind === 'shop' ? createBounds(m.x,m.y,14,10) : createBounds(m.x,m.y,27,24)) : undefined;
      return { kind:'amenity', id:m.id, district:m.district, x:m.x, y:m.y, bounds, interactRadius:52, minimapColor:m.kind==='basketball'?'#d47a2a':'#5fbf8f', minimapSize:2.5, minimapIcon:'amenity', ref:m };
    }),
    ...input.corners.map(function(m): MapObject<'corner', Corner> {
      return { kind:'corner', id:m.id, district:m.district, x:m.x, y:m.y, interactRadius:46, minimapColor:m.busted?'#5f6275':(m.dealer?'#d4a017':'#a8394a'), minimapSize:2, minimapIcon:'corner', ref:m };
    }),
    ...input.npcs.map(function(m): MapObject<'npc', MapNpc> {
      return { kind:'npc', id:m.id, district:m.district, x:m.x, y:m.y, interactRadius:46, minimapColor:'#f0efe8', minimapSize:2, minimapIcon:'person', ref:m };
    }),
    ...input.gangRecruits.map(function(m): MapObject<'gangnpc', GangRecruit> {
      return { kind:'gangnpc', id:m.id, district:m.district, x:m.x, y:m.y, interactRadius:46, minimapColor:'#f0efe8', minimapSize:2, minimapIcon:'gang', ref:m };
    }),
  ];
}
