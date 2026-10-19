import type { Point } from '../config/types';
import { COUNTRY_ROADS } from './countryRoads';
import { OUTSKIRT_PLACE_LOTS } from './world';

// LEGAL: Street races, GTA-style: a course of checkpoints on a real road, rival cars racing it with
// LEGAL: you, positions, and a prize by placing. The old "race" was a timing bar in a popup. This is
// LEGAL: the rules; core/header.ts drives the cars, draws the checkpoints and shows the HUD.
export interface RaceCourse {
  path: Point[];
  // LEGAL: Distance from the start of each path point, for converting between distance and place.
  distances: number[];
  length: number;
  checkpoints: Array<Point & { along: number }>;
}

export function buildCourse(path: Point[], spacing: number): RaceCourse {
  const distances = [0];
  for(let i = 1; i < path.length; i++) distances.push(distances[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
  const length = distances[distances.length - 1];
  const count = Math.max(1, Math.round(length / spacing));
  const course: RaceCourse = { path, distances, length, checkpoints:[] };
  for(let i = 1; i <= count; i++){
    const along = length * i / count;
    course.checkpoints.push({ ...pointAlong(course, along).point, along });
  }
  return course;
}

export function pointAlong(course: RaceCourse, along: number): { point: Point; heading: number } {
  const d = Math.max(0, Math.min(course.length, along));
  let i = 1;
  while(i < course.distances.length - 1 && course.distances[i] < d) i++;
  const a = course.path[i - 1], b = course.path[i];
  const span = course.distances[i] - course.distances[i - 1] || 1;
  const t = (d - course.distances[i - 1]) / span;
  return { point:{ x:a.x + (b.x - a.x) * t, y:a.y + (b.y - a.y) * t }, heading:Math.atan2(b.y - a.y, b.x - a.x) };
}

// LEGAL: Where someone is along the course: the nearest point on the path, searched near `hint`
// LEGAL: (their last known progress) so a course that doubles back can't jump them ahead.
export function progressAlong(course: RaceCourse, point: Point, hint: number): number {
  let best = { along:hint, distance:Infinity };
  for(let i = 0; i < course.path.length - 1; i++){
    if(course.distances[i + 1] < hint - 600 || course.distances[i] > hint + 600) continue;
    const a = course.path[i], b = course.path[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    const distance = Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
    if(distance < best.distance) best = { along:course.distances[i] + (course.distances[i + 1] - course.distances[i]) * t, distance };
  }
  return best.along;
}

export interface Racer { id: string; along: number; speed: number; finishedAt: number | null }

// LEGAL: A rival far behind you drives up to 18% faster, so the race stays a race; one ahead of you
// LEGAL: gets no help. Done in distance along the course, so rivals follow every bend.
const CATCH_UP = 0.18;
const CATCH_UP_GAP = 600;

export function advanceRacer(racer: Racer, course: RaceCourse, dt: number, playerAlong: number, elapsed: number): void {
  if(racer.finishedAt !== null) return;
  const behind = Math.max(0, Math.min(1, (playerAlong - racer.along) / CATCH_UP_GAP));
  racer.along = Math.min(course.length, racer.along + racer.speed * (1 + CATCH_UP * behind) * dt);
  if(racer.along >= course.length) racer.finishedAt = elapsed;
}

export function placings(entries: Array<{ id: string; along: number; finishedAt: number | null }>): string[] {
  return [...entries].sort(function(a, b){
    if(a.finishedAt !== null && b.finishedAt !== null) return a.finishedAt - b.finishedAt;
    if(a.finishedAt !== null) return -1;
    if(b.finishedAt !== null) return 1;
    return b.along - a.along;
  }).map(entry => entry.id);
}

export function racePrize(place: number, field: number): { cash: number; respect: number } {
  if(place >= field) return { cash:0, respect:0 };
  return [{ cash:2500, respect:40 }, { cash:900, respect:15 }, { cash:300, respect:5 }][place - 1] ?? { cash:0, respect:0 };
}

// LEGAL: The Fire Road course: from the Kestrel Woods trailhead west along the north-shore lane to
// LEGAL: the far side of the lake. Taken from the ring road itself, so it is a real road all the way.
function fireRoadPath(): Point[] {
  const ring = COUNTRY_ROADS.find(road => road.id === 'road-country-ring')!.path;
  const lot = OUTSKIRT_PLACE_LOTS.fireRoadKestrel;
  const nearest = (target: Point) => ring.reduce((best, p, i) => (Math.hypot(p.x - target.x, p.y - target.y) < Math.hypot(ring[best].x - target.x, ring[best].y - target.y) ? i : best), 0);
  const start = nearest({ x:lot.x, y:lot.y - 210 });
  const end = nearest({ x:-560, y:-880 });
  const slice = start > end ? ring.slice(end, start + 1) : [...ring.slice(end), ...ring.slice(0, start + 1)];
  return slice.reverse();
}

export const FIRE_ROAD_COURSE = buildCourse(fireRoadPath(), 520);
