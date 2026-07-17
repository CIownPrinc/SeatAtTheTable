import type { MapZoneType } from '../config/types';

export function zoneForDistrictBlock(districtId: string, xi: number, yi: number): MapZoneType {
  if(districtId === 'hub'){
    if(yi <= 1) return xi === 0 ? 'smallBusiness' : 'corporate';
    if(xi === 1 || xi === 2) return yi === 2 ? 'entertainment' : 'corporate';
    return 'smallBusiness';
  }
  if(districtId === 'westside'){
    if(xi >= 2 || yi <= 1) return xi === 1 ? 'logistics' : 'industrial';
    if(yi === 2) return xi === 0 ? 'residential' : 'logistics';
    return 'residential';
  }
  if(yi >= 2 && xi !== 1) return xi === 2 ? 'smallBusiness' : 'residential';
  if(xi === 1) return 'smallBusiness';
  return 'smallBusiness';
}

export function renderZoneType(zone: MapZoneType): string {
  if(zone === 'corporate') return 'skyscraper';
  if(zone === 'industrial' || zone === 'logistics' || zone === 'street') return 'industrial';
  if(zone === 'entertainment' || zone === 'smallBusiness') return 'commercial';
  return 'residential';
}
