export interface DistrictTerrainTheme {
  id: 'devlin' | 'westside' | 'hub';
  land: string;
  minimapLand: string;
}

export interface MapTerrainTheme {
  openWater: string;
  canalWater: string;
  waterEmissive: string;
  waterHighlight: string;
  baseLand: string;
  outskirtFarmland: string;
  outskirtForest: string;
  outskirtSuburb: string;
  outskirtIndustrial: string;
  coastline: string;
  coastlineSecondary: string;
  districtStroke: string;
  districts: DistrictTerrainTheme[];
}

export interface MapTransportTheme {
  roadSurface: string;
  arterialSurface: string;
  sidewalk: string;
  lane: string;
  crosswalk: string;
  bridgeDeck: string;
  bridgeRail: string;
  seawall: string;
}

export const mapTerrainTheme: MapTerrainTheme = {
  openWater: '#0b5f93',
  canalWater: '#0a6fa3',
  waterEmissive: '#06496f',
  waterHighlight: '#7ecfff',
  baseLand: '#5f7445',
  // LEGAL: Outskirt belts (stage 1c). Distinct enough from baseLand and from each other to
  // LEGAL: read at City Map zoom, but all muted so the city core stays the focal point.
  outskirtFarmland: '#7c8c46',
  outskirtForest: '#3f5c38',
  outskirtSuburb: '#6d7b58',
  outskirtIndustrial: '#6a6a5a',
  coastline: '#f0e5bf',
  coastlineSecondary: '#f6efcf',
  districtStroke: '#f0e5bf',
  districts: [
    { id: 'devlin', land: '#7fa65b', minimapLand: '#7fa65b' },
    { id: 'westside', land: '#836f47', minimapLand: '#836f47' },
    { id: 'hub', land: '#5f8674', minimapLand: '#5f8674' },
  ],
};

export const mapTransportTheme: MapTransportTheme = {
  roadSurface: '#414753',
  arterialSurface: '#363d4a',
  sidewalk: '#69706b',
  lane: '#d8c66a',
  crosswalk: '#d9d6c8',
  bridgeDeck: '#4c5260',
  bridgeRail: '#c2c8d0',
  seawall: '#b8b7a8',
};

export function terrainForDistrict(id: DistrictTerrainTheme['id']): DistrictTerrainTheme {
  return mapTerrainTheme.districts.find(theme => theme.id === id) ?? mapTerrainTheme.districts[0];
}
