import type { LocalBusiness, Point, ServiceBuilding } from '../config/types';
import type { Landmark } from './world';
import type { MapObject, MinimapIcon } from './objects';

export type MapPlaceCategory = 'business' | 'service' | 'local' | 'amenity' | 'corner' | 'person' | 'gang' | 'landmark';

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

export function minimapIconForService(service: ServiceBuilding): MinimapIcon {
  if(service.kind === 'bankHome') return 'bank';
  if(service.kind === 'garage') return 'garage';
  if(service.kind === 'realty') return 'realty';
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

function nameForMapObject(object: MapObject): string {
  if('biz' in object.ref) return object.ref.biz.name;
  if('name' in object.ref) return object.ref.name;
  return object.id;
}

function categoryForMapObject(object: MapObject): MapPlaceCategory {
  if(object.kind === 'building') return 'business';
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
