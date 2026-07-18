import type { MapAmenity, MapAmenityKind, ModalOptions } from '../config/types';

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

export interface AmenityActionHandlers {
  addRespect: (amount: number) => void;
  spendCash: (amount: number) => boolean;
  log: (message: string) => void;
  renderAll: () => void;
}

export function createAmenityModal(amenity: MapAmenity, actions: AmenityActionHandlers): ModalOptions {
  if(amenity.kind==='basketball'){
    return { eyebrow:'Neighborhood Court', title:amenity.name, body:`<p>${amenity.prompt}. A few locals are already running half-court.</p><p class="flavor">Win or lose, being seen here matters.</p>`, buttons:[
      { label:'Play a quick game', onClick:function(){ actions.addRespect(1); actions.log(`You get a run in at ${amenity.name}.`); actions.renderAll(); } },
      { label:'Just watch', secondary:true },
    ] };
  }
  if(amenity.kind==='petstore'){
    return { eyebrow:'Pet Store', title:amenity.name, body:'<p>Cages, aquariums, leashes, too many squeaky toys. The owner knows every lonely person in the neighborhood by name.</p>', buttons:[
      { label:'Buy supplies ($75)', onClick:function(){ if(actions.spendCash(75)){ actions.addRespect(1); actions.log(`You buy pet supplies at ${amenity.name}.`); actions.renderAll(); } } },
      { label:'Ask about adopting', onClick:function(){ if(actions.spendCash(250)){ actions.addRespect(2); actions.log(`You cover adoption fees through ${amenity.name}. People notice.`); actions.renderAll(); } } },
      { label:'Leave', secondary:true },
    ] };
  }
  if(amenity.kind==='parkgame'){
    return { eyebrow:'Park Game', title:amenity.name, body:'<p>Old men argue over openings. Kids hover nearby pretending not to watch.</p>', buttons:[
      { label:'Sit for a game', onClick:function(){ actions.addRespect(1); actions.log(`You play a fast game at ${amenity.name}.`); actions.renderAll(); } },
      { label:'Keep walking', secondary:true },
    ] };
  }
  return { eyebrow:'Local Shop', title:amenity.name, body:'<p>A small counter, a lottery machine, a cooler that hums too loud.</p>', buttons:[
    { label:'Buy something small ($20)', onClick:function(){ if(actions.spendCash(20)){ actions.log(`You buy something at ${amenity.name}.`); actions.renderAll(); } } },
    { label:'Leave', secondary:true },
  ] };
}
