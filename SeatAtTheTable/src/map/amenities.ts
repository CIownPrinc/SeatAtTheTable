import type { MapAmenity, MapAmenityKind } from '../config/types';

export const mapAmenities: MapAmenity[] = [
  { id:'devlin-court', kind:'basketball', name:'Devlin Courts', district:'devlin', x:1265, y:1035, prompt:'Shoot around' },
  { id:'rockwell-pets', kind:'petstore', name:'Rockwell Pet Supply', district:'devlin', x:1320, y:745, prompt:'Browse pets and supplies' },
  { id:'cicero-court', kind:'basketball', name:'Cicero Rec Court', district:'westside', x:2480, y:1035, prompt:'Run a quick game' },
  { id:'pulaski-pets', kind:'petstore', name:'Pulaski Pet & Feed', district:'westside', x:2920, y:455, prompt:'Browse pets and supplies' },
  { id:'wicker-news', kind:'shop', name:'Wabash Newsstand', district:'hub', x:4120, y:455, prompt:'Buy a paper' },
  { id:'millennium-chess', kind:'parkgame', name:'Park Chess Tables', district:'hub', x:4485, y:1035, prompt:'Play a fast game' },
];

export function amenityHasSolidFootprint(kind: MapAmenityKind): boolean {
  return kind === 'petstore' || kind === 'shop';
}
