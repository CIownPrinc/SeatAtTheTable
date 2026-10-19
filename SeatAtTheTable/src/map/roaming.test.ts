import { describe, expect, it } from 'vitest';
import type { GangRecruit } from '../config/types';
import type { MapNpc } from './markers';
import type { MapObject } from './objects';
import { createRoamingActors, settleRoamingActors, updateRoamingActors } from './roaming';
import { trafficRoutes } from './traffic';

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
    expect(actors.filter(a=>a.kind==='car').length).toBe(trafficRoutes().length);
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

  // LEGAL: An NPC authored inside a building used to stand in the wall forever: every
  // LEGAL: candidate destination failed the walkability test, and being blocked sent it back
  // LEGAL: to the home point it was already trapped in.
  it('settles a pedestrian spawned inside a building onto standable ground, home included', function () {
    const actors = createRoamingActors([npcObject('walled', 'named')]);
    const blocked = function(x: number, y: number){ return x > 150; };

    const moved = settleRoamingActors(actors, blocked, function(){ return { x:200, y:200 }; });

    expect(moved).toBe(1);
    expect(actors[0].x).toBe(200);
    // LEGAL: Home moves too, or it simply walks back inside on the next retreat.
    expect(actors[0].homeX).toBe(200);
    expect(actors[0].object?.x).toBe(200);
  });

  it('leaves a pedestrian that spawned somewhere standable exactly where it is', function () {
    const actors = createRoamingActors([npcObject('fine', 'named')]);

    expect(settleRoamingActors(actors, function(){ return true; }, function(){ return { x:999, y:999 }; })).toBe(0);
    expect(actors[0].x).toBe(100);
  });

  // LEGAL: Pedestrians walk in a straight line, so a clear DESTINATION is not enough — a
  // LEGAL: target on the far side of a building sends the actor into the wall to pace against
  // LEGAL: it. The wall here has clear ground BEYOND it, so a target past the wall passes the
  // LEGAL: destination check and is only rejected if the path itself is tested.
  it('never picks a target it would have to walk through a wall to reach', function () {
    const actors = createRoamingActors([npcObject('pacer', 'named')]);
    const actor = actors[0];
    // LEGAL: A band north of home is solid; everything past it is open.
    const wall = function(_x: number, y: number){ return !(y > 106 && y < 132); };
    const chosen: Array<{ x: number; y: number }> = [];

    for(let i=0;i<60;i++){
      const before = actor.targetY;
      updateRoamingActors([actor], { dt:1, playSeconds:i*5, indoors:false, canMove:wall });
      if(actor.targetY !== before) chosen.push({ x:actor.targetX, y:actor.targetY });
    }

    // LEGAL: Home is at y=100, so anything beyond the band is only reachable through it.
    expect(chosen.length).toBeGreaterThan(0);
    expect(chosen.filter(point => point.y >= 132)).toEqual([]);
  });
});
