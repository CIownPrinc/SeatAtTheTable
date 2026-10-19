import { WARDROBE, type PersonLook } from '../map/personModel';

// LEGAL: The shops at Lakeridge Mall, and which wardrobe items are bought rather than already in
// LEGAL: the wardrobe. The basics (the four tops, the plain haircuts, a flat cap, plain shoes) are
// LEGAL: Arjun's own. Everything else is sold at one shop, and once bought it's yours to wear.
export type WardrobeSlot = keyof typeof WARDROBE;

export interface MallShop {
  id: string;
  name: string;
  tagline: string;
  // LEGAL: What the shopkeeper says when you walk up.
  pitch: string;
  slot: WardrobeSlot;
  items: Partial<Record<string, number>>;
  // LEGAL: The colour you can change here for free while you try things on.
  colour?: 'hairColor' | 'shoeColor';
  color: string;
}

export const MALL_SHOPS: MallShop[] = [
  { id:'crown', name:'Crown & Brim', tagline:'Hats', slot:'hat', color:'#7a2630',
    pitch:'A man with a tape measure looks at your head the way a tailor looks at a suit.',
    items:{ fedora:180, beanie:40, cap:35, bucket:45 } },
  { id:'spectacle', name:'Spectacle', tagline:'Eyewear', slot:'extra', color:'#2f4a6a',
    pitch:'Frames on every wall. The assistant says sunglasses indoors are a choice, not a crime.',
    items:{ glasses:90, sunglasses:140 } },
  { id:'gold', name:'Gold Standard', tagline:'Jewellery & watches', slot:'extra', color:'#c9a227',
    pitch:'Glass cases, low lights, and a jeweller who stops polishing when you come in.',
    items:{ chain:900, watch:600, earring:250 } },
  { id:'sole', name:'Sole Society', tagline:'Shoes', slot:'shoes', colour:'shoeColor', color:'#3f5a3a',
    pitch:'Boxes stacked to the ceiling. Somebody is already lacing up a pair in your size.',
    items:{ sneakers:120, boots:160 } },
  { id:'fade', name:'The Fade Room', tagline:'Barber', slot:'hair', colour:'hairColor', color:'#3a3f4b',
    pitch:'Clippers buzzing, the game on the radio. The barber points at the empty chair.',
    items:{ curly:30, quiff:45, sidepart:35, ponytail:40 } },
];

export function itemKey(slot: WardrobeSlot, value: string): string { return `${slot}:${value}`; }

// LEGAL: What an item costs, or null for one Arjun already has.
export function itemPrice(slot: WardrobeSlot, value: string): number | null {
  for(const shop of MALL_SHOPS){
    const price = shop.slot === slot ? shop.items[value] : undefined;
    if(price !== undefined) return price;
  }
  return null;
}

export function isItemOwned(owned: readonly string[], slot: WardrobeSlot, value: string): boolean {
  return itemPrice(slot, value) === null || owned.includes(itemKey(slot, value));
}

// LEGAL: The bill for walking out of a shop in `look`: every bought item in it you don't own yet.
export function lookPrice(owned: readonly string[], look: PersonLook): number {
  return (Object.keys(WARDROBE) as WardrobeSlot[]).reduce(function(total, slot){
    return total + (isItemOwned(owned, slot, look[slot]) ? 0 : itemPrice(slot, look[slot]) ?? 0);
  }, 0);
}

// LEGAL: A save from before the mall keeps whatever Arjun was already wearing.
export function ownedWardrobe(saved: unknown, worn: PersonLook): string[] {
  const owned = new Set(Array.isArray(saved) ? saved.filter((key): key is string => typeof key === 'string') : []);
  (Object.keys(WARDROBE) as WardrobeSlot[]).forEach(function(slot){
    if(itemPrice(slot, worn[slot]) !== null) owned.add(itemKey(slot, worn[slot]));
  });
  return [...owned];
}
