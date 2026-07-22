import type { MapAmenity, MapAmenityKind, ModalOptions } from '../config/types';
import { widenAuthoredX } from './world';

// LEGAL: Amenities are authored in ABSOLUTE world x (unlike serviceBuildings and local
// LEGAL: businesses, which use district-local x and go through applyMapWorldCoordinates).
// LEGAL: They therefore have to be widened here, or they land in the wrong district — the
// LEGAL: layout guard caught exactly that when the districts grew.
export const mapAmenities: MapAmenity[] = ([
  { id:'devlin-court', kind:'basketball', name:'Devlin Courts', district:'devlin', x:1265, y:1035, prompt:'Shoot around' },
  { id:'rockwell-pets', kind:'petstore', name:'Rockwell Pet Supply', district:'devlin', x:1320, y:745, prompt:'Browse pets and supplies' },
  { id:'cicero-court', kind:'basketball', name:'Cicero Rec Court', district:'westside', x:2480, y:1035, prompt:'Run a quick game' },
  { id:'pulaski-pets', kind:'petstore', name:'Pulaski Pet & Feed', district:'westside', x:2920, y:455, prompt:'Browse pets and supplies' },
  { id:'wicker-news', kind:'shop', name:'Wabash Newsstand', district:'hub', x:4120, y:455, prompt:'Buy a paper' },
  { id:'millennium-chess', kind:'parkgame', name:'Park Chess Tables', district:'hub', x:4485, y:1035, prompt:'Play a fast game' },
] as MapAmenity[]).map(a => ({ ...a, x: widenAuthoredX(a.x) }));

export function amenityHasSolidFootprint(kind: MapAmenityKind): boolean {
  return kind === 'petstore' || kind === 'shop';
}

export interface AmenityActionHandlers {
  addRespect: (amount: number) => void;
  spendCash: (amount: number) => boolean;
  log: (message: string) => void;
  renderAll: () => void;
  // LEGAL: Launches the amenity's skill minigame (see map/minigames), for the two
  // LEGAL: amenities that are actually games (a court, a chess table). Header owns the
  // LEGAL: overlay lifecycle and applies the reward — this module only wires the button.
  // LEGAL: Shops (pet store, newsstand) are plain buy modals and never call this.
  playGame: (amenity: MapAmenity) => void;
}

// LEGAL: A shop line item: buy it if you can afford it, then bank a little standing and
// LEGAL: log some flavour. Keeps the pet store / newsstand purchase buttons uniform.
function buyButton(actions: AmenityActionHandlers, label: string, cost: number, respect: number, line: string) {
  return { label:`${label} ($${cost})`, onClick:function(){
    if(actions.spendCash(cost)){ if(respect) actions.addRespect(respect); actions.log(line); actions.renderAll(); }
  } };
}

export function createAmenityModal(amenity: MapAmenity, actions: AmenityActionHandlers): ModalOptions {
  if(amenity.kind==='basketball'){
    return { eyebrow:'Neighborhood Court', title:amenity.name, body:`<p>${amenity.prompt}. A few locals are already running half-court.</p><p class="flavor">Win or lose, being seen here matters. Best of five from the line.</p>`, buttons:[
      { label:'Shoot around', onClick:function(){ actions.playGame(amenity); } },
      { label:'Just watch', secondary:true },
    ] };
  }
  if(amenity.kind==='parkgame'){
    return { eyebrow:'Park Game', title:amenity.name, body:'<p>Old men argue over openings. Kids hover nearby pretending not to watch. Somebody slides a board your way.</p>', buttons:[
      { label:'Sit for a game', onClick:function(){ actions.playGame(amenity); } },
      { label:'Keep walking', secondary:true },
    ] };
  }
  if(amenity.kind==='petstore'){
    // LEGAL: A real pet shop — a small catalogue you can buy from. No game, just buying
    // LEGAL: animals/supplies; each purchase reads as goodwill on the block (respect).
    return { eyebrow:'Pet Store', title:amenity.name, body:'<p>Cages, aquariums, leashes, too many squeaky toys. The owner knows every lonely person in the neighborhood by name.</p><p class="flavor">Buy an animal a home and word travels — folks remember who looks out.</p>', buttons:[
      buyButton(actions, 'Buy a goldfish', 40, 1, `You pick up a goldfish from ${amenity.name}.`),
      buyButton(actions, 'Take home a puppy', 450, 3, `You walk out of ${amenity.name} with a puppy. People smile.`),
      buyButton(actions, 'Buy a guard dog', 1500, 4, `You buy a trained guard dog from ${amenity.name}.`),
      buyButton(actions, 'Stock up on supplies', 75, 1, `You buy pet supplies at ${amenity.name}.`),
      { label:'Leave', secondary:true },
    ] };
  }
  return { eyebrow:'Local Shop', title:amenity.name, body:'<p>A small counter, a lottery machine, a cooler that hums too loud. Racks of papers and magazines out front.</p>', buttons:[
    buyButton(actions, 'Buy the morning paper', 5, 0, `You grab a paper at ${amenity.name} and catch up on the city.`),
    buyButton(actions, 'Grab a snack & a soda', 20, 0, `You buy something at ${amenity.name}.`),
    buyButton(actions, 'Buy a lottery ticket', 50, 1, `You buy a lottery ticket at ${amenity.name}. The owner wishes you luck.`),
    { label:'Leave', secondary:true },
  ] };
}
