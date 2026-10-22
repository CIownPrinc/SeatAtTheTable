import type { Corner, GangRecruit, LocalBusiness, MapAmenity, ServiceBuilding, Solid } from '../config/types';
import type { MapBuilding, MapNpc } from './markers';
import type { PropertyPlace } from './propertyPlaces';

export type MapObjectKind = 'building' | 'service' | 'local' | 'amenity' | 'corner' | 'npc' | 'gangnpc' | 'property';

// LEGAL: Icon category for the minimap / city map, so each thing on the map reads with
// LEGAL: a consistent GTA-style symbol (square = legal business, triangle = illegal
// LEGAL: venture, house = home/local shop, etc.) explained by the on-screen legend.
// LEGAL: 'home' is Arjun's own garage; 'destination' a place out of town worth the drive.
export type MinimapIcon = 'legal' | 'illegal' | 'bank' | 'garage' | 'realty' | 'cityhall' | 'heist' | 'shop' | 'bar' | 'service' | 'amenity' | 'corner' | 'person' | 'gang' | 'estate' | 'home' | 'destination';

export type MapObjectRef = MapBuilding | ServiceBuilding | LocalBusiness | MapAmenity | Corner | MapNpc | GangRecruit | PropertyPlace;

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
  minimapIcon?: MinimapIcon;
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
