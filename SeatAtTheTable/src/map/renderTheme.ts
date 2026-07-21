export interface DistrictTerrainTheme {
  id: 'devlin' | 'westside' | 'hub';
  land: string;
  minimapLand: string;
}

export interface MapTerrainTheme {
  openWater: string;
  canalWater: string;
  baseLand: string;
  coastline: string;
  coastlineSecondary: string;
  districtStroke: string;
  districts: DistrictTerrainTheme[];
}

export const mapTerrainTheme: MapTerrainTheme = {
  openWater: '#06324f',
  canalWater: '#074264',
  baseLand: '#596b4d',
  coastline: '#f0e5bf',
  coastlineSecondary: '#f6efcf',
  districtStroke: '#f0e5bf',
  districts: [
    { id: 'devlin', land: '#789060', minimapLand: '#789060' },
    { id: 'westside', land: '#827851', minimapLand: '#827851' },
    { id: 'hub', land: '#6b8b83', minimapLand: '#6b8b83' },
  ],
};

export function terrainForDistrict(id: DistrictTerrainTheme['id']): DistrictTerrainTheme {
  return mapTerrainTheme.districts.find(theme => theme.id === id) ?? mapTerrainTheme.districts[0];
}
