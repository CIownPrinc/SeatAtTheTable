import { describe, expect, it } from 'vitest';
import type { GangRecruit } from '../config/types';
import type { MapNpc } from './markers';
import type { MapObject } from './objects';
import { createRoamingActors, updateRoamingActors } from './roaming';

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
});
