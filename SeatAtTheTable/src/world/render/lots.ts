import type * as ThreeNamespace from 'three';
import { buildConstructionSite, buildTowerCrane } from '../../map/construction';
import type { BuildingLibrary } from '../../map/buildingModels';
import type { MapSceneMaterialCache } from '../../map/scenePerformance';
import type { Lot, LotModel } from '../data/lots';

// LEGAL: Draws the city's lots (world/data/lots): finished buildings as instanced Blender models,
// LEGAL: one group per district and model so each can still be culled when it's off screen, and
// LEGAL: the building sites with their cranes. `fallback` draws one building when the models
// LEGAL: didn't load.
export function buildCityLots(
  THREE: typeof ThreeNamespace,
  lots: readonly Lot[],
  library: BuildingLibrary | null,
  materials: MapSceneMaterialCache,
  fallback: (lot: Lot) => ThreeNamespace.Object3D,
): ThreeNamespace.Object3D[] {
  const out: ThreeNamespace.Object3D[] = [];
  const groups = new Map<string, Lot[]>();
  lots.forEach(function(lot){
    if(lot.site){
      const seed = Math.floor(Math.abs(lot.x * 13 + lot.y * 7));
      const site = buildConstructionSite(THREE, materials, lot.w, lot.d, seed);
      const crane = buildTowerCrane(THREE, materials, lot.w, lot.d, seed);
      [site, crane].forEach(function(part){ part.position.set(lot.x, 0, lot.y); part.rotation.y = lot.rot; });
      site.name = `filler:construction:lot@${Math.round(lot.x)},${Math.round(lot.y)}`;
      crane.name = `crane:lot@${Math.round(lot.x)},${Math.round(lot.y)}`;
      out.push(site, crane);
      return;
    }
    if(!library){ out.push(fallback(lot)); return; }
    const key = `${lot.district}:${lot.model}`;
    const list = groups.get(key) ?? [];
    list.push(lot);
    groups.set(key, list);
  });
  groups.forEach(function(list, key){
    const [district, model] = key.split(':') as [string, LotModel];
    const group = library!.instanced(model, list.map(lot => ({ x:lot.x, y:lot.y, w:lot.w, h:lot.h, d:lot.d, rot:lot.rot, color:lot.color })));
    group.name = `lots:${district}:${model}`;
    out.push(group);
  });
  return out;
}
