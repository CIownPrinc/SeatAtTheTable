import type { FloorPattern } from './interiorLayout';

// LEGAL: What each building is inside. Every room used to share one size and one of a dozen looks
// LEGAL: keyed on which config list the place was in, so the noodle bar, the laundromat and the cab
// LEGAL: office were the same panelled box with crates in the corners. Now each place has a theme
// LEGAL: chosen by what it is, its brand and its neighbourhood (a Mudster showroom out at the
// LEGAL: trailhead is rough timber and mud, Diamond Exotics is marble), a room sized from the
// LEGAL: building it's in, upper floors where the building has them, and the people who belong there.
export type RoomTheme =
  | 'stall' | 'diner' | 'convenience' | 'grocery' | 'liquor' | 'laundromat' | 'lounge' | 'club' | 'pub'
  | 'backroom' | 'wireroom' | 'workshop' | 'chopshop' | 'paintShop' | 'depot' | 'warehouse'
  | 'office' | 'newsroom' | 'executive' | 'bank' | 'bankPrestige' | 'vaultBank' | 'civic' | 'busStation'
  | 'pawn' | 'herbalist' | 'jeweler'
  | 'usedLot' | 'luxuryShowroom' | 'bikeShop' | 'ruggedShowroom' | 'trailheadShowroom' | 'evShowroom'
  | 'brokerCheap' | 'brokerLuxury' | 'brokerCommercial' | 'brokerWaterfront'
  | 'garageHome' | 'casino' | 'mall' | 'lodge' | 'motel' | 'yardOffice' | 'hangar' | 'dockOffice' | 'snackBar' | 'alley';

export interface ThemeLook { floor: FloorPattern; floorColor: string; wallColor: string; trimColor: string; accent: string; wood: string }

export interface FloorPlan { id: string; name: string }

// LEGAL: Someone you can walk up to and talk to. Lines rotate; nothing changes hands.
export interface Regular { id: string; name: string; role: string; coat: string; x: number; z: number; floor: number; lines: string[] }

export interface InteriorPlan {
  theme: RoomTheme;
  w: number;
  h: number;
  look: ThemeLook;
  floors: FloorPlan[];
  // LEGAL: Where the stairs (or escalator, or lift) stand and how you go up, if there's an upper floor.
// LEGAL: You use them from STAIRS_LANDING in front of their foot (or in front of the lift doors).
  stairs: { x: number; z: number; kind: 'stairs' | 'escalator' | 'lift' } | null;
  regulars: Regular[];
}

const LOOKS: Record<RoomTheme, ThemeLook> = {
  stall:            { floor:'tile',     floorColor:'#c9b48e', wallColor:'#e8d8b0', trimColor:'#8a4a2a', accent:'#d4a017', wood:'#7a5532' },
  diner:            { floor:'tile',     floorColor:'#e8e2d2', wallColor:'#d9c49a', trimColor:'#7a2630', accent:'#c0392b', wood:'#6b4a2c' },
  convenience:      { floor:'tile',     floorColor:'#d6d8dc', wallColor:'#e8e6e0', trimColor:'#2f6b4a', accent:'#c0392b', wood:'#7a5532' },
  grocery:          { floor:'wood',     floorColor:'#8a6a48', wallColor:'#c9b48e', trimColor:'#5a4128', accent:'#c98a2b', wood:'#7a5532' },
  liquor:           { floor:'tile',     floorColor:'#5a5e66', wallColor:'#3c434c', trimColor:'#c9a227', accent:'#8a2a2a', wood:'#4a3020' },
  laundromat:       { floor:'tile',     floorColor:'#dfe6ea', wallColor:'#9fc4d8', trimColor:'#3a6a9a', accent:'#3a6a9a', wood:'#7a5532' },
  lounge:           { floor:'carpet',   floorColor:'#3a1a2a', wallColor:'#2a1420', trimColor:'#d44d96', accent:'#d44d96', wood:'#3a2018' },
  club:             { floor:'wood',     floorColor:'#3a2418', wallColor:'#2a2a30', trimColor:'#c9a227', accent:'#7a2630', wood:'#3a2418' },
  pub:              { floor:'wood',     floorColor:'#5a3e26', wallColor:'#3f5a3a', trimColor:'#2a1d12', accent:'#c98a2b', wood:'#4a3020' },
  backroom:         { floor:'concrete', floorColor:'#4a4440', wallColor:'#3a3430', trimColor:'#1a1612', accent:'#c0392b', wood:'#4a3a2a' },
  wireroom:         { floor:'concrete', floorColor:'#4a4e52', wallColor:'#3c4248', trimColor:'#1a1d20', accent:'#4ac06a', wood:'#5a4a36' },
  workshop:         { floor:'concrete', floorColor:'#6c7076', wallColor:'#8a8478', trimColor:'#3a3832', accent:'#c0392b', wood:'#6b4a2c' },
  chopshop:         { floor:'concrete', floorColor:'#4e5258', wallColor:'#5a5e64', trimColor:'#222428', accent:'#d4a017', wood:'#4a4f56' },
  paintShop:        { floor:'concrete', floorColor:'#6c7076', wallColor:'#7c8288', trimColor:'#2e3238', accent:'#2f8f6a', wood:'#4a4f56' },
  depot:            { floor:'concrete', floorColor:'#6a6e74', wallColor:'#c9b48e', trimColor:'#d4a017', accent:'#d4a017', wood:'#6b4a2c' },
  warehouse:        { floor:'concrete', floorColor:'#7a7e84', wallColor:'#9aa0a8', trimColor:'#d4692a', accent:'#d4692a', wood:'#8a6a42' },
  office:           { floor:'carpet',   floorColor:'#4c5a54', wallColor:'#d9d3c6', trimColor:'#4a4356', accent:'#5a7c6b', wood:'#6a4a32' },
  newsroom:         { floor:'carpet',   floorColor:'#5a5a62', wallColor:'#d8d2c4', trimColor:'#3a3d44', accent:'#c0392b', wood:'#5a4632' },
  executive:        { floor:'marble',   floorColor:'#2a2d33', wallColor:'#c8c2b4', trimColor:'#c9a227', accent:'#c9a227', wood:'#3a2418' },
  bank:             { floor:'marble',   floorColor:'#d8d4ca', wallColor:'#b9b3a4', trimColor:'#5c5446', accent:'#c9b26b', wood:'#5a4a3a' },
  bankPrestige:     { floor:'marble',   floorColor:'#ece6d8', wallColor:'#d6cbb0', trimColor:'#8a6a2a', accent:'#c9a227', wood:'#4a2a1c' },
  vaultBank:        { floor:'concrete', floorColor:'#5a6068', wallColor:'#3c434c', trimColor:'#22272e', accent:'#d4a017', wood:'#3a4048' },
  civic:            { floor:'marble',   floorColor:'#cfc9bb', wallColor:'#c2baa6', trimColor:'#4e4638', accent:'#c9b26b', wood:'#5a4632' },
  busStation:       { floor:'tile',     floorColor:'#c8c4b8', wallColor:'#a8b0b8', trimColor:'#2f4a8a', accent:'#2f4a8a', wood:'#5a5e66' },
  pawn:             { floor:'wood',     floorColor:'#6a5038', wallColor:'#7a6a52', trimColor:'#3a2a1a', accent:'#c9a227', wood:'#5a3e26' },
  herbalist:        { floor:'wood',     floorColor:'#8a6a48', wallColor:'#b8a070', trimColor:'#7a2630', accent:'#7a2630', wood:'#6b4a2c' },
  jeweler:          { floor:'carpet',   floorColor:'#2a2a3a', wallColor:'#e8e2d6', trimColor:'#c9a227', accent:'#c9a227', wood:'#3a2418' },
  usedLot:          { floor:'tile',     floorColor:'#b8b4a8', wallColor:'#d8d0b8', trimColor:'#c0392b', accent:'#c0392b', wood:'#6b4a2c' },
  luxuryShowroom:   { floor:'marble',   floorColor:'#f0ece4', wallColor:'#2a2d33', trimColor:'#c9a227', accent:'#c9a227', wood:'#2a1a12' },
  bikeShop:         { floor:'concrete', floorColor:'#3a3a3e', wallColor:'#2a2420', trimColor:'#c0392b', accent:'#c0392b', wood:'#3a2418' },
  ruggedShowroom:   { floor:'concrete', floorColor:'#6a5e4e', wallColor:'#8a7458', trimColor:'#3a2a1a', accent:'#5a7a3a', wood:'#6a4a2c' },
  trailheadShowroom:{ floor:'wood',     floorColor:'#6a4a2c', wallColor:'#5a3e26', trimColor:'#2a1d12', accent:'#5a7a3a', wood:'#7a5232' },
  evShowroom:       { floor:'tile',     floorColor:'#f2f4f6', wallColor:'#f8f8f8', trimColor:'#3a8ad1', accent:'#3a8ad1', wood:'#c8ccd0' },
  brokerCheap:      { floor:'carpet',   floorColor:'#5a5448', wallColor:'#a89a7a', trimColor:'#4a4030', accent:'#8a6a3a', wood:'#5a4632' },
  brokerLuxury:     { floor:'marble',   floorColor:'#e8e2d8', wallColor:'#e0dcd4', trimColor:'#4a4356', accent:'#c9a227', wood:'#3a2418' },
  brokerCommercial: { floor:'concrete', floorColor:'#6a6e74', wallColor:'#9aa0a8', trimColor:'#d4692a', accent:'#d4692a', wood:'#5a5e66' },
  brokerWaterfront: { floor:'wood',     floorColor:'#c8b898', wallColor:'#e8f0f4', trimColor:'#2f6b8a', accent:'#2f6b8a', wood:'#a08060' },
  garageHome:       { floor:'concrete', floorColor:'#6a6e74', wallColor:'#8a8478', trimColor:'#3a3832', accent:'#c0392b', wood:'#6b4a2c' },
  casino:           { floor:'carpet',   floorColor:'#6a1e28', wallColor:'#3a1a22', trimColor:'#c9a227', accent:'#d4a017', wood:'#4a2a1c' },
  mall:             { floor:'marble',   floorColor:'#e4dfd4', wallColor:'#e8e2d6', trimColor:'#8a7a62', accent:'#c9a227', wood:'#6a4a32' },
  lodge:            { floor:'wood',     floorColor:'#6a4a2c', wallColor:'#7a5232', trimColor:'#3a2a1a', accent:'#8a2a2a', wood:'#6a4a2c' },
  motel:            { floor:'carpet',   floorColor:'#7a5a3a', wallColor:'#d8b888', trimColor:'#7a3a2a', accent:'#c86a2a', wood:'#6b4a2c' },
  yardOffice:       { floor:'wood',     floorColor:'#6e5440', wallColor:'#a89a84', trimColor:'#3e3226', accent:'#d4a017', wood:'#5c4330' },
  hangar:           { floor:'concrete', floorColor:'#7a7e84', wallColor:'#8f949c', trimColor:'#3a3d44', accent:'#d4a017', wood:'#5c4330' },
  dockOffice:       { floor:'wood',     floorColor:'#6a5a44', wallColor:'#8a9aa4', trimColor:'#2f4a6a', accent:'#d4692a', wood:'#5c4330' },
  snackBar:         { floor:'tile',     floorColor:'#e8e2d2', wallColor:'#c0392b', trimColor:'#f0efe8', accent:'#f0c040', wood:'#6b4a2c' },
  alley:            { floor:'concrete', floorColor:'#3a3a3e', wallColor:'#3d3a38', trimColor:'#1a1a1a', accent:'#c0392b', wood:'#4a3a2a' },
};

// LEGAL: The room's size follows its building: a narrow shopfront is a narrow room, a civic hall or
// LEGAL: a works is big, the casino is huge. In room units (the player moves in these).
const SIZES: Partial<Record<RoomTheme, [number, number]>> = {
  stall:[380, 240], convenience:[420, 260], grocery:[440, 270], liquor:[400, 250], laundromat:[440, 260], pawn:[420, 260],
  herbalist:[400, 250], jeweler:[420, 260], backroom:[420, 260], wireroom:[440, 260], diner:[500, 290], pub:[500, 290],
  workshop:[600, 340], chopshop:[600, 340], paintShop:[560, 320], warehouse:[680, 380], depot:[520, 300],
  civic:[640, 360], bank:[580, 330], bankPrestige:[620, 350], vaultBank:[580, 330], busStation:[640, 340],
  usedLot:[520, 300], luxuryShowroom:[640, 360], bikeShop:[540, 310], ruggedShowroom:[600, 340], trailheadShowroom:[520, 300], evShowroom:[620, 350],
  casino:[900, 560], mall:[1000, 640], garageHome:[480, 280], lodge:[560, 320], hangar:[640, 360],
};

const FLOORS: Partial<Record<RoomTheme, FloorPlan[]>> = {
  garageHome:[{ id:'garage', name:'The garage' }, { id:'flat', name:"Arjun's flat" }],
  civic:[{ id:'hall', name:'The hall' }, { id:'chamber', name:'Council chamber' }],
  casino:[{ id:'floor', name:'The floor' }, { id:'vip', name:'The high-roller room' }],
  newsroom:[{ id:'newsroom', name:'The newsroom' }, { id:'editor', name:"The editor's office" }],
  executive:[{ id:'lobby', name:'The lobby' }, { id:'boardroom', name:'The boardroom' }],
  mall:[{ id:'ground', name:'Ground floor' }, { id:'upper', name:'Upper concourse' }],
};
const STAIRS_KIND: Partial<Record<RoomTheme, 'stairs' | 'escalator' | 'lift'>> = { mall:'escalator', executive:'lift', casino:'stairs' };

const VENTURES: Record<string, RoomTheme> = {
  cart:'stall', store:'convenience', laundromat:'laundromat', restaurant:'diner', lounge:'lounge', backroom_cards:'backroom',
  wire_network:'wireroom', chop_ring:'chopshop', garage:'workshop', cab:'depot', syndicate_logistics:'warehouse',
  realestate:'office', family_office:'executive',
};
const LOCALS: Record<string, RoomTheme> = {
  patel:'grocery', pawn:'pawn', herbalist:'herbalist', bar:'pub', liquor:'liquor', jewelers:'jeweler', marlowe:'club', chopshop:'chopshop',
};
const SERVICES: Record<string, RoomTheme> = {
  bankHome:'bank', bankFirstWindhaven:'bank', bankLakeside:'bankPrestige', heistTarget:'vaultBank', cityhall:'civic',
  hubBusStation:'busStation', heraldHq:'newsroom', marigoldLounge:'lounge', playerGarage:'garageHome', devlinAlley:'alley',
  railyard:'yardOffice', docksDockmaster:'dockOffice', airfieldKettle:'hangar', fireRoadKestrel:'yardOffice', lodgeRidgewood:'lodge',
  driveInBoundary:'snackBar', motelSunset:'motel', mallLakeridge:'mall', casinoLakeridge:'casino', resprayShop:'paintShop',
  mudsterTrailhead:'trailheadShowroom',
};
const DEALERSHIP_THEMES: Record<string, RoomTheme> = { used:'usedLot', luxury:'luxuryShowroom', bike:'bikeShop', suv:'ruggedShowroom', ev:'evShowroom' };
const BROKER_THEMES: Record<string, RoomTheme> = { cheap:'brokerCheap', luxury:'brokerLuxury', commercial:'brokerCommercial', waterfront:'brokerWaterfront' };

// LEGAL: `brandCategory` is the brand's category for a branded shop (config/brands).
export function themeFor(kind: string, refId: string, brandCategory?: string): RoomTheme {
  if(kind === 'venture') return VENTURES[refId] ?? 'office';
  if(kind === 'local') return LOCALS[refId] ?? 'convenience';
  if(SERVICES[refId]) return SERVICES[refId];
  if(kind === 'dealership') return DEALERSHIP_THEMES[brandCategory ?? ''] ?? 'usedLot';
  if(kind === 'brokerage' || kind === 'realty') return BROKER_THEMES[brandCategory ?? ''] ?? 'brokerCheap';
  if(kind === 'bankHome') return 'bank';
  if(kind === 'casino') return 'casino';
  if(kind === 'mall') return 'mall';
  return 'office';
}

// LEGAL: The regulars: one or two people per kind of place you can walk up to. Names come from the
// LEGAL: place, so the same person is always there.
const FIRST = ['Marcus', 'Yolanda', 'Chen', 'Fatima', 'Danny', 'Rosa', 'Terrence', 'Aleksey', 'Priya', 'Deshawn', 'Grace', 'Miguel', 'Ines', 'Bill', 'Tomasz', 'Lena'];
const LAST = ['Okafor', 'Reyes', 'Kowalski', 'Haddad', 'Brennan', 'Liu', 'Ferreira', 'Novak', 'Singh', 'Moreau', 'Walsh', 'Ito'];
function nameFor(seed: string, n: number): string {
  let h = 0;
  for(let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `${FIRST[(h + n * 7) % FIRST.length]} ${LAST[(h * 3 + n * 5) % LAST.length]}`;
}

interface RegularSeed { role: string; coat: string; at: [number, number]; floor?: number; lines: string[] }
const REGULARS: Partial<Record<RoomTheme, RegularSeed[]>> = {
  diner:[{ role:'Waitress', coat:'#c0392b', at:[0.3, 0.62], lines:["Sit anywhere, hon. The chaat's fresh, the coffee's not.", 'Table four tips in quarters. Every time.', "Kitchen closes when the cook says it closes."] }],
  laundromat:[{ role:'Regular', coat:'#5a7c8a', at:[0.4, 0.66], lines:['Machine six eats quarters. Everybody knows. Nobody fixes it.', "I come here for the quiet. And the dryers. Mostly the quiet."] }],
  grocery:[{ role:'Shopper', coat:'#7c9a3a', at:[0.5, 0.62], lines:['Mr Patel keeps the good rice in the back if you ask nice.', 'Prices went up again. Everything goes up.'] }],
  convenience:[{ role:'Night shift', coat:'#2f6b4a', at:[0.6, 0.6], lines:['You buying or browsing? Browsing costs nothing. Buying costs more.'] }],
  pub:[{ role:'Barfly', coat:'#5a3e26', at:[0.36, 0.6], lines:["Darts league's Thursday. You any good? You look like you'd cheat.", "O'Malley waters the whiskey. Don't tell him I said that.", 'Saw a cop drinking here last week. Off duty. Probably.'] }],
  lounge:[{ role:'Singer', coat:'#d44d96', at:[0.3, 0.58], lines:["The band's late again. I sing either way.", 'The back booth is booked. Always booked. Never ask by who.'] }],
  club:[{ role:'Pianist', coat:'#2a2a30', at:[0.22, 0.55], lines:['Requests cost a twenty. Silence costs a fifty.', 'Old men in this room decided half this city. Over brandy.'] }],
  backroom:[{ role:'Card sharp', coat:'#3a3430', at:[0.66, 0.58], lines:['Table minimum is respect. You got it? Sit down.', "The house doesn't cheat. The house doesn't have to."] }],
  wireroom:[{ role:'Runner', coat:'#4ac06a', at:[0.3, 0.62], lines:['Fourth at Hawthorne, the grey. Trust me. Or don\'t.', 'Phones ring, I run. That\'s the job.'] }],
  workshop:[{ role:'Mechanic', coat:'#3a4a6a', at:[0.32, 0.6], lines:['Whatever you hit, it was the other guy\'s fault, right?', 'Brake pads are cheaper than funerals.'] }],
  chopshop:[{ role:'Strip crew', coat:'#4a4f56', at:[0.34, 0.6], lines:['Nobody comes in here by accident. Who sent you?', "VIN plates go in the bucket. Don't touch the bucket."] }],
  depot:[{ role:'Dispatcher', coat:'#d4a017', at:[0.3, 0.55], lines:['Car nine, you there? ...Car nine never answers.', 'Every fare\'s a story. Most of them are boring.'] }],
  warehouse:[{ role:'Forklift driver', coat:'#d4692a', at:[0.4, 0.62], lines:['Manifests say forty crates. I count forty-two. I stopped asking.'] }],
  newsroom:[{ role:'Reporter', coat:'#5a5a62', at:[0.46, 0.56], lines:["Off the record? Nothing's off the record.", "Deadline's at nine. It's always nine somewhere."] }],
  bank:[{ role:'Guard', coat:'#2a3a5a', at:[0.2, 0.7], lines:['Have a nice day, sir.', "Bank's open. The vault's not. That's how it works."] }],
  civic:[{ role:'Clerk', coat:'#5a4632', at:[0.32, 0.66], lines:['Form 27-B. In triplicate. No, the other triplicate.', 'The alderman is in a meeting. He\'s always in a meeting.'] }],
  busStation:[{ role:'Traveller', coat:'#3a6a9a', at:[0.36, 0.6], lines:['The 12:40 is late. The 12:40 is always late.', 'Going back home. Or away from it. Same bus.'] }],
  pawn:[{ role:'Browser', coat:'#6a5038', at:[0.4, 0.62], lines:["That guitar's been here six years. Nobody plays anymore."] }],
  casino:[{ role:'Waiter', coat:'#f0efe8', at:[0.66, 0.6], lines:['Champagne, sir? Compliments of the house. For now.', "Table three's running hot. Not for long."] }, { role:'High roller', coat:'#7a2630', at:[0.5, 0.5], floor:1, lines:["Five thousand a hand. Don't sit if you're going to flinch."] }],
  lodge:[{ role:'Hunter', coat:'#5a6a3a', at:[0.36, 0.62], lines:['Season opens next month. Deer don\'t know that yet.', 'City folk come up here to think. Then they leave.'] }],
  ruggedShowroom:[{ role:'Salesman', coat:'#5a7a3a', at:[0.36, 0.64], lines:['Mud is a feature. Ask me about the winch.'] }],
  trailheadShowroom:[{ role:'Guide', coat:'#5a7a3a', at:[0.36, 0.64], lines:['Fire road\'s washed out past the second bend. Mudsters don\'t care.'] }],
  luxuryShowroom:[{ role:'Concierge', coat:'#c9a227', at:[0.36, 0.64], lines:['We don\'t discuss price on the floor. Price is discussed in private.'] }],
  evShowroom:[{ role:'Product genius', coat:'#3a8ad1', at:[0.36, 0.64], lines:['Zero to sixty before you finish the sentence.'] }],
  usedLot:[{ role:'Lot man', coat:'#c0392b', at:[0.36, 0.64], lines:['She runs. Mostly. Every car runs mostly.'] }],
  bikeShop:[{ role:'Biker', coat:'#2a2420', at:[0.36, 0.64], lines:['Four wheels move the body. Two move the soul.'] }],
  garageHome:[{ role:'Mechanic next door', coat:'#3a4a6a', at:[0.32, 0.72], lines:["Your music's fine. Your car alarm isn't.", 'Borrowed your jack. Brought it back. Mostly.'] }],
};

// LEGAL: Where you stand to use the stairs or escalator, in front of their foot (their solid runs 42 out).
export const STAIRS_LANDING = 54;
export function stairsLanding(plan: InteriorPlan): { x: number; y: number } | null {
  if(!plan.stairs) return null;
  return plan.stairs.kind === 'lift' ? { x:plan.stairs.x, y:44 } : { x:plan.stairs.x, y:plan.stairs.z + STAIRS_LANDING };
}

const planCache = new Map<string, InteriorPlan>();
export function interiorPlanFor(kind: string, refId: string, brandCategory?: string): InteriorPlan {
  const key = `${kind}|${refId}|${brandCategory ?? ''}`;
  const cached = planCache.get(key);
  if(cached) return cached;
  const theme = themeFor(kind, refId, brandCategory);
  const [w, h] = SIZES[theme] ?? [480, 280];
  const floors = FLOORS[theme] ?? [{ id:'ground', name:'' }];
  const stairs = floors.length > 1 ? { x:theme === 'mall' ? 160 : 56, z:h * 0.5, kind:STAIRS_KIND[theme] ?? 'stairs' } : null;
  const regulars = (REGULARS[theme] ?? []).map(function(seed, n): Regular {
    return { id:`${refId}:regular:${n}`, name:nameFor(refId, n), role:seed.role, coat:seed.coat, x:seed.at[0] * w, z:seed.at[1] * h, floor:seed.floor ?? 0, lines:seed.lines };
  });
  const plan: InteriorPlan = { theme, w, h, look:LOOKS[theme], floors, stairs, regulars };
  planCache.set(key, plan);
  return plan;
}
