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

// LEGAL: Cars, vans and trucks, from their catalog sizes. Drawn bigger than life on purpose, the way
// LEGAL: driving games do: at life size (1.6) a sedan was under 5 m beside people drawn 1.2x life,
// LEGAL: and from the map's high camera the cars looked tiny. Collision, lane gaps and stop lines
// LEGAL: all follow this. Bikes keep 1.6 so the rider still fits the seat.
export const VEHICLE_SCALE = 2.0;
export const BIKE_SCALE = 1.6;

// LEGAL: Street lamps, traffic lights and signs were sized against the old oversized people: a
// LEGAL: lamp was 3 m tall. Scaled up to real height (about 6-8 m for a lamp).
export const STREET_FURNITURE_SCALE = 1.8;
// LEGAL: Street trees likewise: from shrub-height to a young city tree, about 5-6 m.
export const TREE_SCALE = 1.6;
