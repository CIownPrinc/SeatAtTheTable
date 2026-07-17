import type { Business } from '../config/types';
import { namedBuildingLots, ventureDistricts, ventureLots } from './world';

export interface MapBuilding {
  id: string;
  biz: Business;
  district: string;
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

export function createMapBuildings(businesses: Business[]): MapBuilding[] {
  const districtCounts: Record<string, number> = {};

  return businesses.map(function(business, index){
    const district = ventureDistricts[index] || 'hub';
    const districtIndex = districtCounts[district] || 0;
    districtCounts[district] = districtIndex + 1;
    const lot = ventureLots[district][districtIndex] || ventureLots.hub[ventureLots.hub.length - 1];
    return { id:business.id, biz:business, district, x:lot.x, y:lot.y };
  });
}

export const mapNpcs: MapNpc[] = [
  { id:'sanjay', name:'Sanjay', district:'devlin', x:1300, y:960, type:'named' },
  { id:'stranger', name:'Stranger', district:'devlin', x:150, y:960, type:'procedural' },
  { id:'dice', name:'Dice', district:'westside', x:2750, y:400, type:'named' },
  { id:'reyes', name:'Councilman Reyes', district:'hub', x:4600, y:720, type:'named' },
];
