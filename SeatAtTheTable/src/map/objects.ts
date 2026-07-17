import type { Corner, GangRecruit, LocalBusiness, MapAmenity, ServiceBuilding, Solid } from '../config/types';
import type { MapBuilding, MapNpc } from './markers';

export type MapObjectKind = 'building' | 'service' | 'local' | 'amenity' | 'corner' | 'npc' | 'gangnpc';

export type MapObjectRef = MapBuilding | ServiceBuilding | LocalBusiness | MapAmenity | Corner | MapNpc | GangRecruit;

export interface MapBounds extends Solid {}

export interface MapObject<TKind extends MapObjectKind = MapObjectKind, TRef extends MapObjectRef = MapObjectRef> {
  kind: TKind;
  id: string;
  district: string;
  x: number;
  y: number;
  bounds?: MapBounds;
  interactRadius: number;
  minimapColor: string;
  minimapSize: number;
  ref: TRef;
}

export function createBounds(x: number, y: number, hw: number, hd: number): MapBounds {
  return { x, y, hw, hd };
}

export function solidFromObject(object: MapObject): Solid | null {
  return object.bounds ?? null;
}

export function solidsFromObjects(objects: MapObject[]): Solid[] {
  return objects.map(solidFromObject).filter((solid): solid is Solid => solid !== null);
}

export function nearestMapObject<T extends MapObject>(objects: T[], x: number, y: number, maxDistance: number): T | null {
  let best: T | null = null;
  let bestDistance = maxDistance;

  objects.forEach(function(object){
    const distance = Math.hypot(x - object.x, y - object.y);
    const limit = Math.min(bestDistance, object.interactRadius);
    if(distance < limit){
      bestDistance = distance;
      best = object;
    }
  });

  return best;
}
