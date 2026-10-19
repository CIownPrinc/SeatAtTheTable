// LEGAL: The world's one scale. Everything was sized by eye with no common unit, so a person was
// LEGAL: as tall as a shop and a four-storey tenement barely twice a person. Pinned to the roads,
// LEGAL: which every placement already depends on: a two-lane street is 74 units, about 7 metres.
export const UNITS_PER_METRE = 10.5;

// LEGAL: A person, drawn about 1.2x life so a face still reads from the map camera.
export const PERSON_HEIGHT = 22;
// LEGAL: The person model (map/personModel.ts) is authored 38 units tall; this shrinks it to size.
export const PERSON_MODEL_HEIGHT = 38;
export const PERSON_SCALE = PERSON_HEIGHT / PERSON_MODEL_HEIGHT;

// LEGAL: Building heights were authored with storeys about 16 units tall (1.5 m). This multiplier
// LEGAL: brings them to about 3 m. Applied where heights are set, so signs and roofs follow.
export const BUILDING_HEIGHT_SCALE = 1.9;

export function storeys(authoredHeight: number): number {
  return authoredHeight * BUILDING_HEIGHT_SCALE;
}
