import { describe, expect, it } from 'vitest';
import type { GangRecruit } from '../config/types';
import type { MapNpc } from './markers';
import type { MapObject } from './objects';
import { createRoamingActors, trafficCarRoutes, updateRoamingActors } from './roaming';
import { roadNetwork } from './world';

function npcObject(id: string, type: MapNpc['type']): MapObject<'npc', MapNpc> {
  const ref: MapNpc = { id, name:id, district:id==='dice'?'westside':'hub', x:100, y:100, type };
  return { kind:'npc', id, district:ref.district, x:ref.x, y:ref.y, interactRadius:46, minimapColor:'#fff', minimapSize:2, ref };
}

function gangObject(id: string): MapObject<'gangnpc', GangRecruit> {
  const ref: GangRecruit = { id, name:id, trait:'test', reqRespect:0, cost:0, bonus:'test', inducted:false, dialogueKey:id, district:'westside', x:160, y:160 };
  return { kind:'gangnpc', id, district:ref.district, x:ref.x, y:ref.y, interactRadius:46, minimapColor:'#fff', minimapSize:2, ref };
}

describe('roaming actors', function () {
  it('creates lore-constrained actors for notable NPCs and gang recruits', function () {
    const actors = createRoamingActors([npcObject('dice', 'named'), npcObject('reyes', 'named'), gangObject('maria')]);

    expect(actors.find(a=>a.id==='dice')?.radius).toBe(82);
    expect(actors.find(a=>a.id==='reyes')?.radius).toBe(115);
    expect(actors.find(a=>a.id==='maria')?.radius).toBe(95);
    expect(actors.filter(a=>a.kind==='car').length).toBe(3);
  });

  it('syncs pedestrian movement back into the shared map object', function () {
    const object = npcObject('reyes', 'named');
    const actor = createRoamingActors([object]).find(a=>a.id==='reyes');

    expect(actor).toBeDefined();
    if(!actor) return;

    actor.targetX = 130;
    actor.targetY = 100;
    updateRoamingActors([actor], { dt:1, playSeconds:10, indoors:false, canMove:function(){ return true; } });

    expect(actor.x).toBeGreaterThan(100);
    expect(object.x).toBe(actor.x);
    expect(object.y).toBe(actor.y);
  });

  it('does not move actors while the player is indoors', function () {
    const actor = createRoamingActors([npcObject('reyes', 'named')]).find(a=>a.id==='reyes');

    expect(actor).toBeDefined();
    if(!actor) return;

    actor.targetX = 130;
    updateRoamingActors([actor], { dt:1, playSeconds:10, indoors:true, canMove:function(){ return true; } });

    expect(actor.x).toBe(100);
  });

  it('keeps traffic car routes on road centers with no diagonal shortcuts', function () {
    const verticalRoads = new Set(roadNetwork.vertical.map(r=>r.x));
    const horizontalRoads = new Set(roadNetwork.horizontal.map(r=>r.y));

    trafficCarRoutes.forEach(function(route){
      route.route.forEach(function(point, index){
        expect(verticalRoads.has(point.x) || horizontalRoads.has(point.y)).toBe(true);
        const next = route.route[(index + 1) % route.route.length];
        expect(point.x === next.x || point.y === next.y).toBe(true);
        if(point.x === next.x) expect(verticalRoads.has(point.x)).toBe(true);
        if(point.y === next.y) expect(horizontalRoads.has(point.y)).toBe(true);
      });
    });
  });
});
