// LEGAL: The map camera. It used to be welded 260 up and 72 behind the player, which is nearly
// LEGAL: straight down: you saw roofs and the top of a head, and every step jerked the whole
// LEGAL: screen. Top-down crime games (GTA 1/2, The Ascent, Hotline Miami) instead ease toward a
// LEGAL: point slightly ahead of where you're going, and back off as you speed up.
export interface Vec3 { x: number; y: number; z: number }

export interface CameraRigInput {
  x: number;
  y: number;
  vx: number;
  vy: number;
  inVehicle: boolean;
  dt: number;
}

export interface CameraView { eye: Vec3; target: Vec3 }

export interface CameraRig {
  update(input: CameraRigInput): CameraView;
  // LEGAL: Jump straight to the player on the next update (entering or leaving a building).
  snap(): void;
}

// LEGAL: 58 degrees down: building fronts and faces read, and the north-up view still lines up
// LEGAL: with the minimap and with screen-relative movement keys.
const PITCH = 58 * Math.PI / 180;
// LEGAL: Closer on foot now people are drawn life-size; buildings are taller, so not much closer.
const WALK_DISTANCE = 235;
const DRIVE_DISTANCE = 380;
const SPEED_PULLBACK = 0.32;
const MAX_PULLBACK = 170;
const LOOK_AHEAD_SECONDS = 0.38;
const MAX_LOOK_AHEAD = 150;
const FOLLOW_RATE = 7;
const LEAD_RATE = 2.4;
const ZOOM_RATE = 1.6;
const AIM_HEIGHT = 14;
const TELEPORT_DISTANCE = 600;

export function createCameraRig(): CameraRig {
  let fresh = true;
  const focus = { x: 0, z: 0 };
  const lead = { x: 0, z: 0 };
  let distance = WALK_DISTANCE;

  return {
    snap(){ fresh = true; },
    update(input: CameraRigInput): CameraView {
      const speed = Math.hypot(input.vx, input.vy);
      const ahead = Math.min(MAX_LOOK_AHEAD, speed * LOOK_AHEAD_SECONDS);
      const wantLeadX = speed > 0 ? input.vx / speed * ahead : 0;
      const wantLeadZ = speed > 0 ? input.vy / speed * ahead : 0;
      const wantDistance = (input.inVehicle ? DRIVE_DISTANCE : WALK_DISTANCE) + Math.min(MAX_PULLBACK, speed * SPEED_PULLBACK);
      // LEGAL: A taxi, the garage or a door moves the player hundreds of units in one frame;
      // LEGAL: easing across that would sweep the camera over half the city.
      if(Math.hypot(input.x - focus.x, input.y - focus.z) > TELEPORT_DISTANCE) fresh = true;
      if(fresh){
        focus.x = input.x; focus.z = input.y;
        lead.x = wantLeadX; lead.z = wantLeadZ;
        distance = wantDistance;
        fresh = false;
      } else {
        // LEGAL: Frame-rate independent exponential smoothing: the same feel at 30 and 144 fps.
        const follow = 1 - Math.exp(-FOLLOW_RATE * input.dt);
        const leadEase = 1 - Math.exp(-LEAD_RATE * input.dt);
        const zoomEase = 1 - Math.exp(-ZOOM_RATE * input.dt);
        focus.x += (input.x - focus.x) * follow;
        focus.z += (input.y - focus.z) * follow;
        lead.x += (wantLeadX - lead.x) * leadEase;
        lead.z += (wantLeadZ - lead.z) * leadEase;
        distance += (wantDistance - distance) * zoomEase;
      }
      const target = { x: focus.x + lead.x, y: AIM_HEIGHT, z: focus.z + lead.z };
      return {
        target,
        eye: { x: target.x, y: target.y + Math.sin(PITCH) * distance, z: target.z + Math.cos(PITCH) * distance },
      };
    },
  };
}

// LEGAL: Where the sun's shadow camera sits. It was aimed at the middle of an 8,000-unit world
// LEGAL: with a 1,000-unit box, so most of the city had no shadows, and a sun skimming the
// LEGAL: horizon striped what was left. This keeps the box on the player and the sun high
// LEGAL: enough that shadows stay short and clean.
export const SHADOW_HALF_SIZE = 520;
const SHADOW_DISTANCE = 900;
const MIN_ELEVATION = 35 * Math.PI / 180;
const MAX_ELEVATION = 68 * Math.PI / 180;

export function sunShadowFrame(focus: { x: number; z: number }, sunHeight: number, texelSize: number): { position: Vec3; target: Vec3 } {
  // LEGAL: Snap to whole shadow-map texels; a box sliding by fractions of a texel makes every
  // LEGAL: shadow edge crawl as you walk.
  const target = { x: Math.round(focus.x / texelSize) * texelSize, y: 0, z: Math.round(focus.z / texelSize) * texelSize };
  const elevation = MIN_ELEVATION + (MAX_ELEVATION - MIN_ELEVATION) * Math.max(0, Math.min(1, sunHeight));
  // LEGAL: The sun's compass direction is fixed (south-west, so shadows fall up and to the right
  // LEGAL: on screen). It moving with the clock made every shadow swing as you played.
  const horizontal = Math.cos(elevation) * SHADOW_DISTANCE;
  return {
    target,
    position: {
      x: target.x - horizontal * 0.6,
      y: Math.sin(elevation) * SHADOW_DISTANCE,
      z: target.z + horizontal * 0.8,
    },
  };
}
