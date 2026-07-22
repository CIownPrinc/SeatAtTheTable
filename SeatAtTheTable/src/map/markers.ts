import type { Business, MapZoneType } from '../config/types';
import { DISTRICT_OFFSETS, DISTRICT_W, namedBuildingLots, ventureDistricts, ventureLots, ventureMapLots } from './world';

export interface MapBuilding {
  id: string;
  biz: Business;
  district: string;
  zone: MapZoneType;
  x: number;
  y: number;
}

export interface MapNpc {
  id: string;
  name: string;
  district: string;
  x: number;
  y: number;
  type: 'named' | 'procedural';
}

export function applyNamedBuildingLots<T extends { id: string; x: number; y: number }>(items: T[]): void {
  items.forEach(function(item){
    const lot = namedBuildingLots[item.id];
    if(!lot) return;
    item.x = lot.x;
    item.y = lot.y;
  });
}

export function worldXForDistrict(district: string, x: number): number {
  const offset = DISTRICT_OFFSETS[district] || 0;
  return offset > 0 && x < DISTRICT_W ? x + offset : x;
}

export function applyMapWorldCoordinates<T extends { id: string; district: string; x: number; y: number }>(items: T[]): void {
  items.forEach(function(item){
    const namedLot = namedBuildingLots[item.id];
    if(namedLot){
      item.x = namedLot.x;
      item.y = namedLot.y;
      return;
    }
    item.x = worldXForDistrict(item.district, item.x);
  });
}

export function createMapBuildings(businesses: Business[]): MapBuilding[] {
  const districtCounts: Record<string, number> = {};

  return businesses.map(function(business, index){
    const mappedLot = ventureMapLots[business.id];
    if(mappedLot) return { id:business.id, biz:business, district:mappedLot.district, zone:mappedLot.zone, x:mappedLot.x, y:mappedLot.y };
    const district = ventureDistricts[index] || 'hub';
    const districtIndex = districtCounts[district] || 0;
    districtCounts[district] = districtIndex + 1;
    const lot = ventureLots[district][districtIndex] || ventureLots.hub[ventureLots.hub.length - 1];
    return { id:business.id, biz:business, district, zone:business.category === 'street' ? 'street' : 'smallBusiness', x:lot.x, y:lot.y };
  });
}

export const mapNpcs: MapNpc[] = [
  { id:'sanjay', name:'Sanjay', district:'devlin', x:1300, y:960, type:'named' },
  { id:'stranger', name:'Stranger', district:'devlin', x:150, y:960, type:'procedural' },
  { id:'dice', name:'Dice', district:'westside', x:2750, y:430, type:'named' },
  { id:'reyes', name:'Councilman Reyes', district:'hub', x:5260, y:520, type:'named' },
];
