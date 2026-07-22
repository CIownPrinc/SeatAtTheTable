export type DownloadedMapAssetPack = 'kenney-modular-buildings' | 'kenney-car-kit' | 'kenney-blocky-characters';

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
  | 'carVan'
  | 'characterA'
  | 'characterC'
  | 'characterE'
  | 'characterH'
  | 'characterK'
  | 'characterN';

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
export const CHARACTER_ASSET_BASE = `${MAP_ASSET_PUBLIC_BASE}kenney-blocky-characters/`;

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
  characterA: `${CHARACTER_ASSET_BASE}character-a.glb`,
  characterC: `${CHARACTER_ASSET_BASE}character-c.glb`,
  characterE: `${CHARACTER_ASSET_BASE}character-e.glb`,
  characterH: `${CHARACTER_ASSET_BASE}character-h.glb`,
  characterK: `${CHARACTER_ASSET_BASE}character-k.glb`,
  characterN: `${CHARACTER_ASSET_BASE}character-n.glb`,
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
  { path: MAP_ASSET_PATHS.characterA, pack:'kenney-blocky-characters', category:'character', status:'reserved', key:'characterA', futureUse:['pedestrian variants', 'named NPC variants'] },
  { path: MAP_ASSET_PATHS.characterC, pack:'kenney-blocky-characters', category:'character', status:'reserved', key:'characterC', futureUse:['pedestrian variants', 'named NPC variants'] },
  { path: MAP_ASSET_PATHS.characterE, pack:'kenney-blocky-characters', category:'character', status:'reserved', key:'characterE', futureUse:['pedestrian variants', 'named NPC variants'] },
  { path: MAP_ASSET_PATHS.characterH, pack:'kenney-blocky-characters', category:'character', status:'reserved', key:'characterH', futureUse:['pedestrian variants', 'named NPC variants'] },
  { path: MAP_ASSET_PATHS.characterK, pack:'kenney-blocky-characters', category:'character', status:'reserved', key:'characterK', futureUse:['pedestrian variants', 'named NPC variants'] },
  { path: MAP_ASSET_PATHS.characterN, pack:'kenney-blocky-characters', category:'character', status:'reserved', key:'characterN', futureUse:['pedestrian variants', 'named NPC variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-a.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-b.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-c.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-d.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-e.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-f.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-g.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-h.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-i.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-j.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-k.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-l.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-m.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-n.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-o.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-p.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-q.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}Textures/texture-r.png`, pack:'kenney-blocky-characters', category:'texture', status:'reserved', futureUse:['pedestrian texture variants'] },
  { path: `${CHARACTER_ASSET_BASE}License.txt`, pack:'kenney-blocky-characters', category:'license', status:'used', note:'License file retained with the downloaded character pack.' },
  { path: 'Textures/colormap.png', pack:'kenney-modular-buildings', category:'texture', status:'fallback', note:'Some Kenney GLB files ask for this relative texture. The loader redirects it to an inline fallback because the file is not in the downloaded pack.' },
];
