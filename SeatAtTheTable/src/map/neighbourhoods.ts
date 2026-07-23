// LEGAL: ---- Neighbourhood character (world expansion stage 3) ----
// LEGAL: Zoning already said what a block is FOR (residential, corporate, industrial...).
// LEGAL: It said nothing about what kind of place it is, so a rough walk-up block and a
// LEGAL: waterfront block both rendered as generic "residential". Character is that missing
// LEGAL: axis: same land use, different money, upkeep and density — the difference between
// LEGAL: a bougie neighbourhood and a poor one.
// LEGAL:
// LEGAL: Deliberately loose: a handful of readable characters mapped over the block grid,
// LEGAL: not a per-building simulation.

export type BlockCharacter =
  | 'affluent'
  | 'working'
  | 'rough'
  | 'shopping'
  | 'corporate'
  | 'entertainment'
  | 'industrial';

export interface CharacterProfile {
  /** Multiplies generated building height. */
  heightMult: number;
  /** Chance a filler cell is left empty — vacant lots read as neglect. */
  vacancyChance: number;
  /** Chance a residential building is a walk-up apartment rather than a house. */
  apartmentChance: number;
  /** Footprint fill within its cell. Dense neighbourhoods crowd their plots. */
  footprintMult: number;
  /** How crooked buildings sit. Money buys straight frontages. */
  jitterMult: number;
  /** Facade colours for this character. */
  palette: string[];
}

const PROFILES: Record<BlockCharacter, CharacterProfile> = {
  // LEGAL: Money: tall-ish, well kept, generous plots, almost no vacancy.
  affluent: {
    heightMult: 1.2, vacancyChance: 0.03, apartmentChance: 0.5, footprintMult: 0.94, jitterMult: 0.35,
    palette: ['#6d7486', '#7b7f92', '#5f6b80', '#847e88', '#6a7590', '#8a8f7e', '#59607a'],
  },
  // LEGAL: The default: brick, mixed, a little worn.
  working: {
    heightMult: 1, vacancyChance: 0.09, apartmentChance: 0.55, footprintMult: 1, jitterMult: 1,
    palette: ['#6a4b3f', '#705848', '#61564d', '#7a6254', '#5d4a46', '#4f5159', '#365344'],
  },
  // LEGAL: Neglect: low, crowded, crooked, and full of gaps where buildings came down.
  rough: {
    heightMult: 0.78, vacancyChance: 0.24, apartmentChance: 0.62, footprintMult: 1.04, jitterMult: 1.8,
    palette: ['#4a4038', '#514440', '#443f3c', '#5a4a3e', '#3f3a37', '#3d4442', '#5a3f42'],
  },
  // LEGAL: Retail strips: wide, low, packed shoulder to shoulder, bright frontages.
  shopping: {
    heightMult: 0.86, vacancyChance: 0.04, apartmentChance: 0.08, footprintMult: 1.12, jitterMult: 0.5,
    palette: ['#8a5a3c', '#7d6340', '#8c6a52', '#6f5c48', '#94684a', '#6b7350', '#a07a52'],
  },
  // LEGAL: Downtown: towers, glass and steel, nothing empty.
  corporate: {
    heightMult: 1.75, vacancyChance: 0.03, apartmentChance: 0, footprintMult: 0.96, jitterMult: 0.25,
    palette: ['#283247', '#33405c', '#4d445f', '#2f5360', '#57515a', '#3a4a3f', '#5c6478'],
  },
  // LEGAL: Bars and clubs: mid-rise, saturated, tightly packed.
  entertainment: {
    heightMult: 1.05, vacancyChance: 0.06, apartmentChance: 0.12, footprintMult: 1.06, jitterMult: 0.8,
    palette: ['#5a345e', '#4a3f68', '#6a3d4a', '#3c5264', '#63385a', '#7a4a3a', '#455a4a'],
  },
  // LEGAL: Works and yards: big low sheds, plenty of open ground. footprintMult is kept
  // LEGAL: close to 1 — pushing it to 1.15 made sheds so wide that the layout rejected most
  // LEGAL: of them for overlap and the whole West Side came out nearly empty (19 buildings).
  industrial: {
    heightMult: 0.72, vacancyChance: 0.1, apartmentChance: 0, footprintMult: 1.02, jitterMult: 0.6,
    palette: ['#463f34', '#55443c', '#3f4542', '#5c4638', '#3d3946', '#4e5148', '#6a5a44'],
  },
};

export function characterProfile(character: BlockCharacter): CharacterProfile {
  return PROFILES[character];
}

// LEGAL: ---- Facade detailing (stage 4) ----
// LEGAL: Palette alone still left every building the same box. These are the details that
// LEGAL: make a block legible at a glance: boarded windows and fire escapes on run-down
// LEGAL: blocks, cornices and balconies where there is money, awnings and signage on a
// LEGAL: retail strip, roof plant downtown, vents and tanks on the works.
export interface CharacterDetail {
  /** Boarded-up openings and patched frontages. */
  boarded: boolean;
  /** Zig-zag fire escape down the front. */
  fireEscape: boolean;
  /** Projecting balconies. */
  balcony: boolean;
  /** Decorative cornice along the roofline. */
  cornice: boolean;
  /** Shopfront awning plus a signage band. */
  shopfront: boolean;
  /** Rooftop plant / aircon housings. */
  roofPlant: boolean;
  /** Neon sign band. */
  neon: boolean;
  /** Roof vents and a water tank. */
  vents: boolean;
  /** Accent colour for whichever trim this character uses. */
  trim: string;
}

const DETAILS: Record<BlockCharacter, CharacterDetail> = {
  affluent: { boarded:false, fireEscape:false, balcony:true, cornice:true, shopfront:false, roofPlant:false, neon:false, vents:false, trim:'#c9bfa4' },
  working: { boarded:false, fireEscape:true, balcony:false, cornice:false, shopfront:false, roofPlant:false, neon:false, vents:false, trim:'#8a7f6b' },
  rough: { boarded:true, fireEscape:true, balcony:false, cornice:false, shopfront:false, roofPlant:false, neon:false, vents:false, trim:'#5a5148' },
  shopping: { boarded:false, fireEscape:false, balcony:false, cornice:false, shopfront:true, roofPlant:false, neon:false, vents:false, trim:'#b8452f' },
  corporate: { boarded:false, fireEscape:false, balcony:false, cornice:true, shopfront:false, roofPlant:true, neon:false, vents:false, trim:'#8fa8bd' },
  entertainment: { boarded:false, fireEscape:false, balcony:false, cornice:false, shopfront:true, roofPlant:false, neon:true, vents:false, trim:'#d44d96' },
  industrial: { boarded:false, fireEscape:false, balcony:false, cornice:false, shopfront:false, roofPlant:false, neon:false, vents:true, trim:'#7a6a4a' },
};

export function characterDetail(character: BlockCharacter): CharacterDetail {
  return DETAILS[character];
}

// LEGAL: Character over the 4x4 block grid of each district. Kept in one readable table
// LEGAL: rather than spread through the renderer, so the city's social geography can be
// LEGAL: retuned without touching generation code.
export function characterForDistrictBlock(districtId: string, xi: number, yi: number): BlockCharacter {
  if(districtId === 'hub'){
    // LEGAL: Financial core north and centre; Gilt Shore money along the east edge; the
    // LEGAL: club strip mid-south; retail on the southern edge.
    if(xi === 3) return yi <= 1 ? 'corporate' : 'affluent';
    if(yi <= 1) return 'corporate';
    if(yi === 2) return 'entertainment';
    return 'shopping';
  }

  if(districtId === 'westside'){
    // LEGAL: Works and freight across the north and the whole eastern edge; what housing
    // LEGAL: there is sits south-west, and it is the poorest in the city.
    if(yi <= 1) return 'industrial';
    if(xi >= 2) return xi === 3 ? 'industrial' : 'rough';
    return yi === 3 ? 'rough' : 'working';
  }

  // LEGAL: Devlin, home turf: working-class throughout, a retail strip on the second row,
  // LEGAL: and the blocks down by the canal have gone to seed.
  if(yi === 1) return 'shopping';
  if(yi >= 2 && xi >= 2) return 'rough';
  return 'working';
}

export function characterLabel(character: BlockCharacter): string {
  if(character === 'affluent') return 'Affluent';
  if(character === 'rough') return 'Run-down';
  if(character === 'shopping') return 'Shopping strip';
  if(character === 'corporate') return 'Financial district';
  if(character === 'entertainment') return 'Nightlife';
  if(character === 'industrial') return 'Industrial';
  return 'Working-class';
}
