export type DownloadedMapAssetPack = 'kenney-modular-buildings' | 'kenney-car-kit';

export type DownloadedMapAssetCategory = 'building' | 'vehicle' | 'character' | 'texture' | 'license' | 'building-detail';

export type DownloadedMapAssetStatus = 'used' | 'reserved' | 'fallback';

export type MapAssetKey =
  | 'houseA'
  | 'houseB'
  | 'towerA'
  | 'towerC'
  | 'commercialAwning'
  | 'commercialWide'
  | 'carSedan'
  | 'carSport'
  | 'carTaxi'
  | 'carPolice'
  | 'carSuv'
  | 'carLuxurySuv'
  | 'carDelivery'
  | 'carVan';

export interface DownloadedMapAsset {
  path: string;
  pack: DownloadedMapAssetPack;
  category: DownloadedMapAssetCategory;
  status: DownloadedMapAssetStatus;
  key?: MapAssetKey;
  futureUse?: string[];
  note?: string;
}

export const MAP_ASSET_PUBLIC_BASE = '/assets/map/';
export const BUILDING_ASSET_BASE = `${MAP_ASSET_PUBLIC_BASE}kenney-modular-buildings/`;
export const CAR_ASSET_BASE = `${MAP_ASSET_PUBLIC_BASE}kenney-car-kit/`;

export const MAP_ASSET_PATHS: Record<MapAssetKey, string> = {
  houseA: `${BUILDING_ASSET_BASE}building-sample-house-a.glb`,
  houseB: `${BUILDING_ASSET_BASE}building-sample-house-b.glb`,
  towerA: `${BUILDING_ASSET_BASE}building-sample-tower-a.glb`,
  towerC: `${BUILDING_ASSET_BASE}building-sample-tower-c.glb`,
  commercialAwning: `${BUILDING_ASSET_BASE}building-window-awnings.glb`,
  commercialWide: `${BUILDING_ASSET_BASE}building-window-wide.glb`,
  carSedan: `${CAR_ASSET_BASE}sedan.glb`,
  carSport: `${CAR_ASSET_BASE}sedan-sports.glb`,
  carTaxi: `${CAR_ASSET_BASE}taxi.glb`,
  carPolice: `${CAR_ASSET_BASE}police.glb`,
  carSuv: `${CAR_ASSET_BASE}suv.glb`,
  carLuxurySuv: `${CAR_ASSET_BASE}suv-luxury.glb`,
  carDelivery: `${CAR_ASSET_BASE}delivery.glb`,
  carVan: `${CAR_ASSET_BASE}van.glb`,
};

export const EAGER_MAP_ASSET_KEYS: MapAssetKey[] = ['houseA', 'houseB', 'towerA', 'towerC', 'commercialAwning', 'commercialWide'];

export const DOWNLOADED_MAP_ASSETS: DownloadedMapAsset[] = [
  { path: MAP_ASSET_PATHS.houseA, pack:'kenney-modular-buildings', category:'building', status:'used', key:'houseA' },
  { path: MAP_ASSET_PATHS.houseB, pack:'kenney-modular-buildings', category:'building', status:'used', key:'houseB' },
  { path: MAP_ASSET_PATHS.towerA, pack:'kenney-modular-buildings', category:'building', status:'used', key:'towerA' },
  { path: MAP_ASSET_PATHS.towerC, pack:'kenney-modular-buildings', category:'building', status:'used', key:'towerC' },
  { path: MAP_ASSET_PATHS.commercialAwning, pack:'kenney-modular-buildings', category:'building', status:'used', key:'commercialAwning' },
  { path: MAP_ASSET_PATHS.commercialWide, pack:'kenney-modular-buildings', category:'building', status:'used', key:'commercialWide' },
  { path: `${BUILDING_ASSET_BASE}detail-ac-a.glb`, pack:'kenney-modular-buildings', category:'building-detail', status:'reserved', futureUse:['building facade dressing', 'district-specific roof details'] },
  { path: `${BUILDING_ASSET_BASE}roof-flat-detail-a.glb`, pack:'kenney-modular-buildings', category:'building-detail', status:'reserved', futureUse:['rooftop clutter', 'train station variants'] },
  { path: `${BUILDING_ASSET_BASE}License.txt`, pack:'kenney-modular-buildings', category:'license', status:'used', note:'License file retained with the downloaded building pack.' },
  { path: MAP_ASSET_PATHS.carDelivery, pack:'kenney-car-kit', category:'vehicle', status:'reserved', key:'carDelivery', futureUse:['delivery routes', 'job vehicles'] },
  { path: MAP_ASSET_PATHS.carPolice, pack:'kenney-car-kit', category:'vehicle', status:'reserved', key:'carPolice', futureUse:['police patrol vehicle model', 'wanted-state roadblocks'] },
  { path: MAP_ASSET_PATHS.carSport, pack:'kenney-car-kit', category:'vehicle', status:'reserved', key:'carSport', futureUse:['traffic model variants', 'player garage variants'] },
  { path: MAP_ASSET_PATHS.carSedan, pack:'kenney-car-kit', category:'vehicle', status:'reserved', key:'carSedan', futureUse:['traffic model variants', 'player garage variants'] },
  { path: MAP_ASSET_PATHS.carLuxurySuv, pack:'kenney-car-kit', category:'vehicle', status:'reserved', key:'carLuxurySuv', futureUse:['high-value traffic', 'player garage variants'] },
  { path: MAP_ASSET_PATHS.carSuv, pack:'kenney-car-kit', category:'vehicle', status:'reserved', key:'carSuv', futureUse:['traffic model variants', 'crew transport'] },
  { path: MAP_ASSET_PATHS.carTaxi, pack:'kenney-car-kit', category:'vehicle', status:'reserved', key:'carTaxi', futureUse:['taxi traffic', 'district ambience'] },
  { path: MAP_ASSET_PATHS.carVan, pack:'kenney-car-kit', category:'vehicle', status:'reserved', key:'carVan', futureUse:['delivery routes', 'crew transport'] },
  { path: `${CAR_ASSET_BASE}License.txt`, pack:'kenney-car-kit', category:'license', status:'used', note:'License file retained with the downloaded vehicle pack.' },
  { path: `${BUILDING_ASSET_BASE}Textures/colormap.png`, pack:'kenney-modular-buildings', category:'texture', status:'used', note:'Palette atlas every building GLB samples.' },
  { path: `${CAR_ASSET_BASE}Textures/colormap.png`, pack:'kenney-car-kit', category:'texture', status:'used', note:'Palette atlas every vehicle GLB samples.' },
];
