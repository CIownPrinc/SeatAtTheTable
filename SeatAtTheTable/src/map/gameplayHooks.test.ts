import { describe, expect, it } from 'vitest';
import type { MapObject } from './objects';
import type { MapNpc } from './markers';
import { windhavenMapModel } from './mapModel';
import { createMapPlaceRecords } from './places';
import { gameplayHooksAtPoint } from './gameplayHooks';

describe('map gameplay hooks', function () {
  const npc: MapNpc = { id:'sanjay', name:'Sanjay', district:'devlin', x:1300, y:960, type:'named' };
  const npcObject: MapObject<'npc', MapNpc> = {
    kind:'npc',
    id:npc.id,
    district:npc.district,
    x:npc.x,
    y:npc.y,
    interactRadius:46,
    minimapColor:'#f0efe8',
    minimapSize:2,
    minimapIcon:'person',
    ref:npc,
  };
  const places = createMapPlaceRecords([npcObject], windhavenMapModel.landmarks);

  it('returns mission and route hooks for exact places', function () {
    const hooks = gameplayHooksAtPoint({ x:1300, y:960 }, places, { player:{ x:700, y:600 } });

    expect(hooks.map(hook => hook.kind)).toContain('mission');
    expect(hooks.find(hook => hook.kind === 'mission')?.placeId).toBe('sanjay');
    expect(hooks.find(hook => hook.kind === 'mission')?.routeLabel).toContain('via');
  });

  it('returns patrol and territory hooks from heat and district pressure', function () {
    const hooks = gameplayHooksAtPoint({ x:700, y:600 }, places, { player:{ x:700, y:600 }, heat:70, territoryPressure:{ devlin:60 } });

    expect(hooks.map(hook => hook.kind)).toContain('policePatrol');
    expect(hooks.map(hook => hook.kind)).toContain('territoryPressure');
  });

  it('returns a tutorial hook for water points', function () {
    const hooks = gameplayHooksAtPoint({ x:1700, y:560 }, places, { player:{ x:700, y:600 } });

    expect(hooks).toEqual([{ kind:'tutorial', point:{ x:1700, y:560 }, districtId:null, label:'Waypoints and jobs need land access.' }]);
  });
});
