import { describe, expect, it } from 'vitest';
import { serviceBuildings } from '../config/serviceBuildings';
import { archetypeExtraSolids, serviceArchetype } from './archetypes';
import { bayClearance, bayParkSpot, bayStandSpot, garageBay, isCarInBay } from './driveIn';
import { canMoveTo, actorRadius } from './movement';
import { serviceBuildingSilhouette } from './placeRendering';

const GARAGE = serviceBuildings.find(s => s.id === 'playerGarage');

function garageShape(){
  const shape = serviceBuildingSilhouette(GARAGE!);
  return { shape, bay: garageBay({ x:GARAGE!.x, y:GARAGE!.y }, shape.w, shape.d) };
}

describe('drive-in garage', function () {
  it('makes the player garage a bay rather than a solid block', function () {
    expect(serviceArchetype(GARAGE!)).toBe('bay');
  });

  // LEGAL: The one that matters. A garage narrower than a car is a garage you bounce off,
  // LEGAL: and nothing in the picture would tell you why.
  it('leaves an opening a car can actually drive through', function () {
    const { bay } = garageShape();

    expect(bayClearance(bay)).toBeGreaterThan(actorRadius(true) * 2);
  });

  // LEGAL: Three walls and no fourth. If a solid ever appears across the mouth the garage
  // LEGAL: silently goes back to being a box, so this checks the gap directly by trying to
  // LEGAL: drive a car through it.
  it('blocks the walls but not the doorway', function () {
    const { shape, bay } = garageShape();
    const walls = archetypeExtraSolids('bay', GARAGE!.x, GARAGE!.y, shape.w, shape.d);

    const mouth = { x: bay.x, y: GARAGE!.y + shape.d/2 };
    expect(canMoveTo(mouth.x, mouth.y, walls, true)).toBe(true);
    expect(canMoveTo(bay.x, bayParkSpot(bay).y, walls, true)).toBe(true);
    // LEGAL: ...but not in through a side wall or the back.
    expect(canMoveTo(GARAGE!.x - shape.w/2, GARAGE!.y, walls, true)).toBe(false);
    expect(canMoveTo(GARAGE!.x, GARAGE!.y - shape.d/2, walls, true)).toBe(false);
  });

  it('triggers as the car crosses the mouth and not before', function () {
    const { shape, bay } = garageShape();

    expect(isCarInBay({ x:bay.x, y:bay.y }, bay)).toBe(true);
    // LEGAL: Out on the apron, still driving.
    expect(isCarInBay({ x:bay.x, y:GARAGE!.y + shape.d/2 + 20 }, bay)).toBe(false);
    // LEGAL: Passing along the side of the building is not parking in it.
    expect(isCarInBay({ x:GARAGE!.x + shape.w, y:bay.y }, bay)).toBe(false);
  });

  it('parks the car inside the walls, clear of the back', function () {
    const { shape, bay } = garageShape();
    const walls = archetypeExtraSolids('bay', GARAGE!.x, GARAGE!.y, shape.w, shape.d);
    const spot = bayParkSpot(bay);

    expect(isCarInBay(spot, bay)).toBe(true);
    expect(canMoveTo(spot.x, spot.y, walls, true)).toBe(true);
    // LEGAL: Fully in: no part of the car left hanging out of the door.
    expect(spot.y + actorRadius(true)).toBeLessThanOrEqual(GARAGE!.y + shape.d/2);
  });

  it('stands the player beside the car rather than under it', function () {
    const { shape, bay } = garageShape();
    const walls = archetypeExtraSolids('bay', GARAGE!.x, GARAGE!.y, shape.w, shape.d);
    const stand = bayStandSpot(bay);
    const parked = bayParkSpot(bay);

    expect(canMoveTo(stand.x, stand.y, walls, false)).toBe(true);
    expect(Math.hypot(stand.x - parked.x, stand.y - parked.y)).toBeGreaterThan(actorRadius(false));
  });
});
