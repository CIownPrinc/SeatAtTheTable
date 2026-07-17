import type { MapZoneType } from '../config/types';

export function zoneForDistrictBlock(districtId: string, xi: number, yi: number): MapZoneType {
  if(districtId === 'hub'){
    if(yi <= 1) return 'corporate';
    if(xi === 1 || xi === 2) return 'entertainment';
    return 'smallBusiness';
  }
  if(districtId === 'westside'){
    if(xi >= 2 || yi <= 1) return 'industrial';
    if(yi === 2) return 'logistics';
    return 'residential';
  }
  if(yi >= 2 && xi !== 1) return 'residential';
  if(xi === 1) return 'smallBusiness';
  return 'smallBusiness';
}

export function renderZoneType(zone: MapZoneType): string {
  if(zone === 'corporate') return 'skyscraper';
  if(zone === 'industrial' || zone === 'logistics' || zone === 'street') return 'industrial';
  if(zone === 'entertainment' || zone === 'smallBusiness') return 'commercial';
  return 'residential';
}
