import { PERSON_HEIGHT } from './scale';
import type * as ThreeNamespace from 'three';
import type { RoamingActor } from './roaming';
import { actorDisplayName } from './roaming';
import type { GangRecruit } from '../config/types';

export interface MapActorRenderHelpers {
  buildTrafficCarModel: (id: string, color: string) => ThreeNamespace.Group;
  buildPedestrianModel: (color: number | string, identity?: string) => ThreeNamespace.Group;
  addSign: (parent: ThreeNamespace.Object3D, text: string, w: number, h: number, y: number, color: string) => void;
}

export interface MapActorRenderOptions {
  worldGroup: ThreeNamespace.Group;
  actors: RoamingActor[];
  helpers: MapActorRenderHelpers;
}

export function renderRoamingActors(options: MapActorRenderOptions): void {
  const { worldGroup, actors, helpers } = options;
  actors.forEach(function(actor){
    if(actor.kind === 'car'){
      const car = helpers.buildTrafficCarModel(actor.id, actor.color);
      car.position.set(actor.x, 0, actor.y);
      car.rotation.y = -actor.facing + Math.PI / 2;
      worldGroup.add(car);
      actor.group = car;
      return;
    }
    const color = actor.object?.kind === 'gangnpc' && (actor.object.ref as GangRecruit).inducted ? '#d4a017' : actor.color;
    const pedestrian = helpers.buildPedestrianModel(color, actor.id);
    pedestrian.position.set(actor.x, 0, actor.y);
    pedestrian.rotation.y = -actor.facing + Math.PI / 2;
    worldGroup.add(pedestrian);
    actor.group = pedestrian;
    // LEGAL: Only people who matter get a name over their head; the background crowd doesn't.
    if(actor.object) helpers.addSign(pedestrian, actorDisplayName(actor), 28, 7, PERSON_HEIGHT + 6, '#f0efe8');
  });
}
