import type { MapAmenity, MapAmenityKind, ModalOptions } from '../config/types';
import { widenAuthoredX } from './world';
import { BANDSTAND, PARK_CHESS, PARK_NAME, PARK_RUN_BOARD, PARK_RUN_LIMIT } from './centralPark';

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
] as MapAmenity[]).map(a => ({ ...a, x: widenAuthoredX(a.x) })).concat(PARK_AMENITIES());

// LEGAL: What there is to do in Grunt Park (map/centralPark), placed in world coordinates by the park's
// LEGAL: own layout. The chess tables moved here from a patch of grass in the Hub. The park is outside
// LEGAL: the districts, south of the West Side.
function PARK_AMENITIES(): MapAmenity[] {
  return [
    { id:'millennium-chess', kind:'parkgame', name:`${PARK_NAME} Chess Tables`, district:'westside', x:PARK_CHESS.x, y:PARK_CHESS.y, prompt:'Play a fast game' },
    { id:'grunt-bandstand', kind:'bandstand', name:'The Bandstand', district:'westside', x:BANDSTAND.x, y:BANDSTAND.y + BANDSTAND.r + 12, prompt:'Book the bandstand' },
    { id:'grunt-loop', kind:'parkrun', name:`The ${PARK_NAME} Loop`, district:'westside', x:PARK_RUN_BOARD.x, y:PARK_RUN_BOARD.y, prompt:'Run the loop' },
  ];
}
export const PARK_AMENITY_IDS = new Set(['millennium-chess', 'grunt-bandstand', 'grunt-loop']);

// LEGAL: A free concert: a lot of goodwill and a little good press, once in a while.
export const CONCERT_COST = 400;
export const CONCERT_RESPECT = 6;
export const CONCERT_HEAT_OFF = 3;
export const CONCERT_COOLDOWN_SECONDS = 600;

export function amenityHasSolidFootprint(kind: MapAmenityKind): boolean {
  return kind === 'petstore' || kind === 'shop';
}

export interface AmenityActionHandlers {
  addRespect: (amount: number) => void;
  // LEGAL: Grunt Park: book a concert (false if the bandstand is still booked), and start the run.
  holdConcert?: () => boolean;
  startParkRun?: () => void;
  // LEGAL: Your best time round the loop, in seconds, if you've finished it.
  parkRunBest?: number | null;
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
  if(amenity.kind==='bandstand'){
    return { eyebrow:PARK_NAME, title:amenity.name, body:`<p>A brass band rehearses to nobody on a Tuesday. The park office will let anyone with $${CONCERT_COST} put on a free concert, and put their name on the banner.</p><p class="flavor">Respect +${CONCERT_RESPECT} and heat -${CONCERT_HEAT_OFF}: it's hard to be a menace to society while sponsoring the oompah hour.</p>`, buttons:[
      { label:`Put on a free concert ($${CONCERT_COST})`, onClick:function(){ actions.holdConcert?.(); } },
      { label:'Just listen', secondary:true },
    ] };
  }
  if(amenity.kind==='parkrun'){
    const best = actions.parkRunBest;
    return { eyebrow:PARK_NAME, title:amenity.name, body:`<p>Twice round the loop, touching every corner, inside ${PARK_RUN_LIMIT} seconds. The joggers have chalked their times on the board.</p><p class="flavor">${best ? `Your best: ${best.toFixed(1)}s. Beat it for a little respect.` : 'Finish it once for some respect from the regulars.'}</p>`, buttons:[
      { label:'Run the loop', onClick:function(){ actions.startParkRun?.(); } },
      { label:'Not today', secondary:true },
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
