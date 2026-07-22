import type { Point } from '../config/types';
import type { MapDistrictRecord, WindhavenMapModel } from './mapModel';
import { windhavenMapModel } from './mapModel';
import type { MapPlaceRecord } from './places';
import { mapPointContext, routeHintBetween, routeSummary } from './queries';

export type MapGameplayHookKind = 'mission' | 'delivery' | 'policePatrol' | 'territoryPressure' | 'tutorial';

export interface MapGameplayHook {
  kind: MapGameplayHookKind;
  point: Point;
  districtId: MapDistrictRecord['id'] | null;
  placeId?: string;
  label: string;
  routeLabel?: string;
}

export interface MapGameplayHookOptions {
  player: Point;
  heat?: number;
  territoryPressure?: Partial<Record<MapDistrictRecord['id'], number>>;
  model?: WindhavenMapModel;
}

export function gameplayHooksAtPoint(point: Point, places: MapPlaceRecord[], options: MapGameplayHookOptions): MapGameplayHook[] {
  const model = options.model ?? windhavenMapModel;
  const context = mapPointContext(point, places, { model, placeMaxDistance:48 });
  const hooks: MapGameplayHook[] = [];

  if(!context.isLand || context.isWater){
    hooks.push({ kind:'tutorial', point, districtId:context.districtId, label:'Waypoints and jobs need land access.' });
    return hooks;
  }

  const routeLabel = routeSummary(routeHintBetween(options.player, point, model)).label;
  if(context.nearestPlace){
    hooks.push({
      kind:'mission',
      point,
      districtId:context.districtId,
      placeId:context.nearestPlace.id,
      label:`Job hook near ${context.nearestPlace.name}`,
      routeLabel,
    });
    if(context.nearestPlace.category === 'business' || context.nearestPlace.category === 'local' || context.nearestPlace.category === 'service'){
      hooks.push({
        kind:'delivery',
        point,
        districtId:context.districtId,
        placeId:context.nearestPlace.id,
        label:`Delivery route to ${context.nearestPlace.name}`,
        routeLabel,
      });
    }
  }

  if((options.heat ?? 0) >= 55 && context.nearestRoad.distance <= 80){
    hooks.push({ kind:'policePatrol', point, districtId:context.districtId, label:`Patrol pressure on ${context.nearestRoad.road.name}`, routeLabel });
  }

  const districtPressure = context.districtId ? options.territoryPressure?.[context.districtId] ?? 0 : 0;
  if(context.districtId && districtPressure >= 40){
    hooks.push({ kind:'territoryPressure', point, districtId:context.districtId, label:`Territory pressure in ${context.districtId}`, routeLabel });
  }

  if(hooks.length === 0){
    hooks.push({ kind:'tutorial', point, districtId:context.districtId, label:'No active hook here yet.' });
  }

  return hooks;
}
