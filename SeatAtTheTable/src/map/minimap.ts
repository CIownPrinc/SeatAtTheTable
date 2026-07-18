import type { Corner, FillerItem, Point } from '../config/types';
import type { MapObject } from './objects';

export const MINIMAP_SIZE = 150;
export const MINIMAP_SCALE = MINIMAP_SIZE / 600;

export interface MinimapPlayerSnapshot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
}

export interface MinimapRenderOptions {
  ctx: CanvasRenderingContext2D;
  indoors: boolean;
  dragging: boolean;
  pan: Point;
  player: MinimapPlayerSnapshot;
  mapObjects: MapObject[];
  districtOffsets: Record<string, number>;
  fillerFor: (districtId: string) => FillerItem[];
  roadNetwork: { vertical: Array<{ x: number }>; horizontal: Array<{ y: number }> };
  worldWidth: number;
  worldHeight: number;
  landmarks: Array<{ x: number; y: number }>;
  waypoint: Point | null;
}

function projectPoint(wx: number, wy: number, centerX: number, centerY: number): Point {
  return { x:75+(wx-centerX)*MINIMAP_SCALE, y:75+(wy-centerY)*MINIMAP_SCALE };
}

function isOnMap(point: Point): boolean {
  return point.x>=-8 && point.x<=158 && point.y>=-8 && point.y<=158;
}

function objectColor(object: MapObject): string {
  if(object.kind==='corner'){
    const corner = object.ref as Corner;
    return corner.busted?'#5f6275':(corner.dealer?'#d4a017':'#a8394a');
  }
  return object.minimapColor;
}

export function drawMinimap(options: MinimapRenderOptions): void {
  const mctx = options.ctx;
  mctx.fillStyle = '#12141c'; mctx.fillRect(0,0,150,150);
  if(options.indoors){
    mctx.fillStyle='#6c7080'; mctx.font='10px IBM Plex Mono, monospace'; mctx.textAlign='center'; mctx.textBaseline='middle';
    mctx.fillText('Indoors', 75, 75);
    mctx.strokeStyle='rgba(212,160,23,0.5)'; mctx.strokeRect(0.5,0.5,149,149);
    return;
  }
  if(!options.dragging && Math.hypot(options.player.vx, options.player.vy) > 5){
    options.pan.x = 0;
    options.pan.y = 0;
  }
  const centerX = options.player.x + options.pan.x;
  const centerY = options.player.y + options.pan.y;
  const proj = function(wx: number, wy: number){ return projectPoint(wx, wy, centerX, centerY); };
  ['devlin','westside','hub'].forEach(function(distId){
    const off = options.districtOffsets[distId];
    options.fillerFor(distId).forEach(function(f){
      if(f.kind==='building' || f.kind==='edge'){
        const p = proj(f.x+off, f.y);
        if(!isOnMap(p)) return;
        const bw = Math.max(1.5, f.w*MINIMAP_SCALE);
        const bd = Math.max(1.5, f.d*MINIMAP_SCALE);
        mctx.fillStyle = f.kind==='edge' ? 'rgba(84,90,104,0.5)' : 'rgba(120,126,142,0.72)';
        mctx.fillRect(p.x-bw/2, p.y-bd/2, bw, bd);
      } else if(f.kind==='park'){
        const p = proj((f.x0+f.x1)/2+off,(f.y0+f.y1)/2);
        if(!isOnMap(p)) return;
        const w=(f.x1-f.x0)*MINIMAP_SCALE;
        const d=(f.y1-f.y0)*MINIMAP_SCALE;
        mctx.fillStyle='rgba(58,108,68,0.55)';
        mctx.fillRect(p.x-w/2,p.y-d/2,w,d);
      }
    });
  });
  mctx.strokeStyle='rgba(120,120,135,0.4)';
  mctx.lineWidth=3;
  options.roadNetwork.vertical.forEach(function(r){
    const p1=proj(r.x,0);
    const p2=proj(r.x,options.worldHeight);
    mctx.beginPath(); mctx.moveTo(p1.x,p1.y); mctx.lineTo(p2.x,p2.y); mctx.stroke();
  });
  options.roadNetwork.horizontal.forEach(function(r){
    const p1=proj(0,r.y);
    const p2=proj(options.worldWidth,r.y);
    mctx.beginPath(); mctx.moveTo(p1.x,p1.y); mctx.lineTo(p2.x,p2.y); mctx.stroke();
  });
  const dot = function(wx: number, wy: number, color: string, size: number){
    const p=proj(wx,wy);
    if(p.x<-6||p.x>156||p.y<-6||p.y>156) return;
    mctx.beginPath(); mctx.arc(p.x,p.y,size,0,Math.PI*2); mctx.fillStyle=color; mctx.fill();
  };
  options.mapObjects.forEach(function(object){ dot(object.x, object.y, objectColor(object), object.minimapSize); });
  options.landmarks.forEach(function(landmark){
    const p = proj(landmark.x, landmark.y);
    if(!isOnMap(p)) return;
    mctx.save(); mctx.translate(p.x,p.y); mctx.rotate(Math.PI/4);
    mctx.fillStyle='#e0c860'; mctx.fillRect(-3,-3,6,6); mctx.restore();
  });
  if(options.waypoint){
    const p = proj(options.waypoint.x,options.waypoint.y);
    mctx.strokeStyle='#d4a017';
    mctx.lineWidth=2;
    mctx.beginPath(); mctx.moveTo(p.x-6,p.y); mctx.lineTo(p.x+6,p.y); mctx.moveTo(p.x,p.y-6); mctx.lineTo(p.x,p.y+6); mctx.stroke();
    mctx.beginPath(); mctx.arc(p.x,p.y,7,0,Math.PI*2); mctx.stroke();
  }
  const pp = proj(options.player.x,options.player.y);
  mctx.save(); mctx.translate(pp.x,pp.y); mctx.rotate(options.player.facing);
  mctx.beginPath(); mctx.moveTo(6,0); mctx.lineTo(-4,-4); mctx.lineTo(-4,4); mctx.closePath();
  mctx.fillStyle='#d4a017'; mctx.fill(); mctx.restore();
  mctx.strokeStyle='rgba(212,160,23,0.5)';
  mctx.lineWidth=1;
  mctx.strokeRect(0.5,0.5,149,149);
}
