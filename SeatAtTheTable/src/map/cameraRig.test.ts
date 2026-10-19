import { describe, expect, it } from 'vitest';
import { createCameraRig, sunShadowFrame } from './cameraRig';

function settle(rig: ReturnType<typeof createCameraRig>, input: Parameters<ReturnType<typeof createCameraRig>['update']>[0], seconds: number) {
  let view = rig.update(input);
  for(let t = 0; t < seconds; t += input.dt) view = rig.update(input);
  return view;
}

describe('createCameraRig', function () {
  const still = { x: 1000, y: 500, vx: 0, vy: 0, inVehicle: false, dt: 1 / 60 };

  it('starts on the player instead of swooping in from the world origin', function () {
    const view = createCameraRig().update(still);
    expect(view.target.x).toBeCloseTo(1000);
    expect(view.target.z).toBeCloseTo(500);
  });

  it('looks down at an angle, not straight down, so building fronts and faces show', function () {
    const view = createCameraRig().update(still);
    const pitch = Math.atan2(view.eye.y - view.target.y, view.eye.z - view.target.z) * 180 / Math.PI;
    expect(pitch).toBeGreaterThan(50);
    expect(pitch).toBeLessThan(66);
  });

  it('trails a moving player instead of being welded to them', function () {
    const rig = createCameraRig();
    rig.update(still);
    const view = rig.update({ ...still, x: 1100 });
    expect(view.target.x).toBeGreaterThan(1000);
    expect(view.target.x).toBeLessThan(1100);
  });

  it('leads in the direction of travel once settled', function () {
    const view = settle(createCameraRig(), { ...still, vx: 300 }, 3);
    expect(view.target.x).toBeGreaterThan(still.x + 20);
  });

  it('pulls back while driving fast so there is time to react', function () {
    const walking = settle(createCameraRig(), still, 3);
    const driving = settle(createCameraRig(), { ...still, vx: 420, inVehicle: true }, 3);
    expect(driving.eye.y - driving.target.y).toBeGreaterThan(walking.eye.y - walking.target.y);
  });

  it('jumps straight to the player after a teleport such as a taxi ride', function () {
    const rig = createCameraRig();
    rig.update(still);
    const view = rig.update({ ...still, x: 4000 });
    expect(view.target.x).toBeCloseTo(4000);
  });

  it('can be snapped after a teleport, such as leaving a building', function () {
    const rig = createCameraRig();
    rig.update(still);
    rig.snap();
    const view = rig.update({ ...still, x: 5000 });
    expect(view.target.x).toBeCloseTo(5000);
  });
});

describe('sunShadowFrame', function () {
  it('centres the shadow area on the player, wherever they are in the world', function () {
    const frame = sunShadowFrame({ x: 6000, z: 900 }, 0.5, 4);
    expect(frame.target.x).toBeCloseTo(6000, -1);
    expect(frame.target.z).toBeCloseTo(900, -1);
  });

  it('never drops the sun low enough to smear shadows across the ground', function () {
    [0, 0.2, 0.5, 0.8, 1].forEach(function (elevation) {
      const frame = sunShadowFrame({ x: 0, z: 0 }, elevation, 4);
      const dx = frame.position.x - frame.target.x;
      const dz = frame.position.z - frame.target.z;
      const angle = Math.atan2(frame.position.y - frame.target.y, Math.hypot(dx, dz)) * 180 / Math.PI;
      expect(angle).toBeGreaterThanOrEqual(34);
    });
  });

  it('moves the shadow area in whole shadow-map texels so edges do not shimmer', function () {
    const a = sunShadowFrame({ x: 100, z: 100 }, 0.5, 4);
    const b = sunShadowFrame({ x: 101, z: 100.5 }, 0.5, 4);
    expect(b.target).toEqual(a.target);
  });
});
