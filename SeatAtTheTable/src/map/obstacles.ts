// LEGAL: Things that move and are solid: traffic and the train. Buildings are static Solids
// LEGAL: (axis-aligned boxes); these turn, so each is a rectangle with a heading.
export interface Obstacle {
  x: number;
  y: number;
  halfLength: number;
  halfWidth: number;
  // LEGAL: Direction of the long axis on the ground plane, radians (atan2 of the heading).
  angle: number;
}

export function vehicleObstacle(x: number, y: number, facing: number, length: number, width: number): Obstacle {
  return { x, y, halfLength:length / 2, halfWidth:width / 2, angle:facing };
}

// LEGAL: Distance from a circle to the rectangle, in the rectangle's own frame.
function gap(px: number, py: number, o: Obstacle): number {
  const dx = px - o.x, dy = py - o.y;
  const c = Math.cos(o.angle), s = Math.sin(o.angle);
  const along = dx * c + dy * s;
  const across = -dx * s + dy * c;
  const ox = Math.max(0, Math.abs(along) - o.halfLength);
  const oy = Math.max(0, Math.abs(across) - o.halfWidth);
  return Math.hypot(ox, oy);
}

export function circleHitsObstacle(px: number, py: number, radius: number, o: Obstacle): boolean {
  return gap(px, py, o) < radius;
}

// LEGAL: Slower than this a car nudges you rather than knocking you down.
const SPLAT_SPEED = 25;

// LEGAL: A car runs you over when it's moving at speed, touching you, and you're ahead of it.
export function isRunOverBy(px: number, py: number, radius: number, o: Obstacle, velocity: { x: number; y: number }): boolean {
  const speed = Math.hypot(velocity.x, velocity.y);
  if(speed < SPLAT_SPEED) return false;
  if(gap(px, py, o) > radius + 2) return false;
  return (px - o.x) * velocity.x + (py - o.y) * velocity.y > 0;
}
