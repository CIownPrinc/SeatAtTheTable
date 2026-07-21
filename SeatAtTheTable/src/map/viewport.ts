import type { Point } from '../config/types';
import { boundsForPoints, type Bounds } from './geometry';

export interface MapViewport {
  viewW: number;
  viewH: number;
  scale: number;
  center: Point;
  bounds: Bounds;
}

export function createMapViewport(viewW: number, viewH: number, points: Point[]): MapViewport {
  const bounds = boundsForPoints(points);
  const scale = Math.min(viewW/(bounds.maxX-bounds.minX), viewH/(bounds.maxY-bounds.minY));
  return {
    viewW,
    viewH,
    scale,
    bounds,
    center: { x:(bounds.minX+bounds.maxX)/2, y:(bounds.minY+bounds.maxY)/2 },
  };
}

export function worldToScreen(viewport: Pick<MapViewport, 'viewW' | 'viewH' | 'scale' | 'center'>, point: Point): Point {
  return {
    x: viewport.viewW/2 + (point.x - viewport.center.x) * viewport.scale,
    y: viewport.viewH/2 + (point.y - viewport.center.y) * viewport.scale,
  };
}

export function screenToWorld(viewport: Pick<MapViewport, 'viewW' | 'viewH' | 'scale' | 'center'>, point: Point): Point {
  return {
    x: viewport.center.x + (point.x - viewport.viewW/2) / viewport.scale,
    y: viewport.center.y + (point.y - viewport.viewH/2) / viewport.scale,
  };
}

export function clampPointToBounds(point: Point, bounds: Bounds): Point {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, point.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, point.y)),
  };
}
