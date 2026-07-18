import type { Corner, FillerItem, Point } from '../config/types';
import type { MapObject, MinimapIcon } from './objects';

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
  roadNetwork: { vertical: Array<{ x: number }>; horizontal: Array<{ y: number }>; diagonal: Array<{ x1: number; y1: number; x2: number; y2: number }> };
  worldWidth: number;
  worldHeight: number;
  landmarks: Array<{ x: number; y: number; name?: string }>;
  waypoint: Point | null;
  // LEGAL: The full City Map passes every district's waypoint so all dropped markers show.
  waypoints?: Array<Point | null>;
  // LEGAL: Optional overrides. Defaults render the small 150px follow-cam minimap; the
  // LEGAL: full City Map passes viewW/viewH/scale/center to frame the whole world at once.
  size?: number;
  viewW?: number;
  viewH?: number;
  scale?: number;
  center?: Point | null;
  glyphScale?: number;
  districtNames?: Array<{ x: number; name: string }>;
}

function isOnMap(point: Point, w: number, h: number): boolean {
  const m = 8;
  return point.x >= -m && point.x <= w + m && point.y >= -m && point.y <= h + m;
}

function objectColor(object: MapObject): string {
  if(object.kind==='corner'){
    const corner = object.ref as Corner;
    return corner.busted?'#5f6275':(corner.dealer?'#d4a017':'#a8394a');
  }
  return object.minimapColor;
}

// LEGAL: Consistent GTA-style symbol per category (see the on-screen legend): square =
// LEGAL: your legal business, triangle = illegal venture, house = local shop/home,
// LEGAL: ringed dot = city service, diamond = corner/amenity, dot = person.
export function drawGlyph(ctx: CanvasRenderingContext2D, p: Point, icon: MinimapIcon | undefined, color: string, s: number): void {
  ctx.fillStyle = color; ctx.strokeStyle = color;
  switch(icon){
    case 'legal':
      ctx.fillRect(p.x - s, p.y - s, s*2, s*2);
      break;
    case 'illegal':
      ctx.beginPath(); ctx.moveTo(p.x, p.y - s*1.25); ctx.lineTo(p.x + s*1.15, p.y + s); ctx.lineTo(p.x - s*1.15, p.y + s); ctx.closePath(); ctx.fill();
      break;
    case 'home':
      ctx.fillRect(p.x - s*0.85, p.y - s*0.15, s*1.7, s*1.15);
      ctx.beginPath(); ctx.moveTo(p.x - s*1.05, p.y - s*0.15); ctx.lineTo(p.x, p.y - s*1.3); ctx.lineTo(p.x + s*1.05, p.y - s*0.15); ctx.closePath(); ctx.fill();
      break;
    case 'service':
      ctx.beginPath(); ctx.arc(p.x, p.y, s*0.75, 0, Math.PI*2); ctx.fill();
      ctx.lineWidth = Math.max(1, s*0.35); ctx.beginPath(); ctx.arc(p.x, p.y, s*1.5, 0, Math.PI*2); ctx.stroke();
      break;
    case 'corner':
    case 'amenity':
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.PI/4); ctx.fillRect(-s*0.95, -s*0.95, s*1.9, s*1.9); ctx.restore();
      break;
    case 'gang':
      ctx.beginPath(); ctx.arc(p.x, p.y, s*0.95, 0, Math.PI*2); ctx.fill();
      ctx.lineWidth = Math.max(1, s*0.3); ctx.strokeStyle = '#d4a017'; ctx.stroke();
      break;
    case 'person':
    default:
      ctx.beginPath(); ctx.arc(p.x, p.y, s*0.8, 0, Math.PI*2); ctx.fill();
      break;
  }
}

export function drawMinimap(options: MinimapRenderOptions): void {
  const mctx = options.ctx;
  const size = options.size ?? MINIMAP_SIZE;
  const viewW = options.viewW ?? size;
  const viewH = options.viewH ?? size;
  const halfX = viewW/2;
  const halfY = viewH/2;
  const scale = options.scale ?? MINIMAP_SCALE;
  const glyphScale = options.glyphScale ?? 1;

  mctx.fillStyle = '#12141c'; mctx.fillRect(0,0,viewW,viewH);
  if(options.indoors){
    mctx.fillStyle='#6c7080'; mctx.font='10px IBM Plex Mono, monospace'; mctx.textAlign='center'; mctx.textBaseline='middle';
    mctx.fillText('Indoors', halfX, halfY);
    mctx.strokeStyle='rgba(212,160,23,0.5)'; mctx.strokeRect(0.5,0.5,viewW-1,viewH-1);
    return;
  }
  if(!options.center && !options.dragging && Math.hypot(options.player.vx, options.player.vy) > 5){
    options.pan.x = 0;
    options.pan.y = 0;
  }
  const centerX = options.center ? options.center.x : options.player.x + options.pan.x;
  const centerY = options.center ? options.center.y : options.player.y + options.pan.y;
  const proj = function(wx: number, wy: number){ return { x: halfX + (wx-centerX)*scale, y: halfY + (wy-centerY)*scale }; };

  ['devlin','westside','hub'].forEach(function(distId){
    const off = options.districtOffsets[distId];
    options.fillerFor(distId).forEach(function(f){
      if(f.kind==='building' || f.kind==='edge'){
        const p = proj(f.x+off, f.y);
        if(!isOnMap(p, viewW, viewH)) return;
        const bw = Math.max(1.5, f.w*scale);
        const bd = Math.max(1.5, f.d*scale);
        mctx.fillStyle = f.kind==='edge' ? 'rgba(84,90,104,0.5)' : 'rgba(120,126,142,0.72)';
        mctx.fillRect(p.x-bw/2, p.y-bd/2, bw, bd);
      } else if(f.kind==='park'){
        const p = proj((f.x0+f.x1)/2+off,(f.y0+f.y1)/2);
        if(!isOnMap(p, viewW, viewH)) return;
        const w=(f.x1-f.x0)*scale;
        const d=(f.y1-f.y0)*scale;
        mctx.fillStyle='rgba(58,108,68,0.55)';
        mctx.fillRect(p.x-w/2,p.y-d/2,w,d);
      }
    });
  });

  const beachA = proj(4000,48);
  const beachB = proj(5500,118);
  mctx.fillStyle='rgba(185,167,119,0.55)';
  mctx.beginPath();
  mctx.moveTo(beachA.x, beachA.y);
  mctx.quadraticCurveTo(proj(4750,150).x, proj(4750,150).y, beachB.x, beachB.y);
  mctx.lineTo(proj(5500,48).x, proj(5500,48).y);
  mctx.lineTo(beachA.x, beachA.y);
  mctx.fill();

  mctx.strokeStyle='rgba(120,120,135,0.4)';
  mctx.lineWidth = Math.max(2, 3*glyphScale);
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
  options.roadNetwork.diagonal.forEach(function(r){
    const p1=proj(r.x1,r.y1);
    const p2=proj(r.x2,r.y2);
    mctx.beginPath(); mctx.moveTo(p1.x,p1.y); mctx.lineTo(p2.x,p2.y); mctx.stroke();
  });

  if(options.districtNames){
    mctx.fillStyle='rgba(224,200,96,0.5)';
    mctx.font=`700 ${Math.round(11*glyphScale)}px Oswald, sans-serif`;
    mctx.textAlign='center'; mctx.textBaseline='top';
    options.districtNames.forEach(function(d){
      const p = proj(d.x, 6);
      if(p.x < -20 || p.x > viewW+20) return;
      mctx.fillText(d.name.toUpperCase(), p.x, Math.max(2, p.y));
    });
  }

  options.mapObjects.forEach(function(object){
    const p = proj(object.x, object.y);
    if(!isOnMap(p, viewW, viewH)) return;
    drawGlyph(mctx, p, object.minimapIcon, objectColor(object), Math.max(1.5, object.minimapSize*glyphScale));
  });

  options.landmarks.forEach(function(landmark){
    const p = proj(landmark.x, landmark.y);
    if(!isOnMap(p, viewW, viewH)) return;
    mctx.save(); mctx.translate(p.x,p.y); mctx.rotate(Math.PI/4);
    mctx.fillStyle='#e0c860'; const ls = 3*glyphScale; mctx.fillRect(-ls,-ls,ls*2,ls*2); mctx.restore();
  });

  const drawWaypoint = function(wp: Point){
    const p = proj(wp.x, wp.y);
    const r = 6*glyphScale;
    mctx.strokeStyle='#d4a017';
    mctx.lineWidth=2;
    mctx.beginPath(); mctx.moveTo(p.x-r,p.y); mctx.lineTo(p.x+r,p.y); mctx.moveTo(p.x,p.y-r); mctx.lineTo(p.x,p.y+r); mctx.stroke();
    mctx.beginPath(); mctx.arc(p.x,p.y,r+1,0,Math.PI*2); mctx.stroke();
  };
  const waypointList = options.waypoints ?? [options.waypoint];
  waypointList.forEach(function(wp){ if(wp) drawWaypoint(wp); });

  const pp = proj(options.player.x,options.player.y);
  mctx.save(); mctx.translate(pp.x,pp.y); mctx.rotate(options.player.facing);
  const ps = 5*glyphScale;
  mctx.beginPath(); mctx.moveTo(ps+1,0); mctx.lineTo(-ps*0.8,-ps*0.8); mctx.lineTo(-ps*0.8,ps*0.8); mctx.closePath();
  mctx.fillStyle='#e8e6de'; mctx.fill();
  mctx.lineWidth=Math.max(1,glyphScale); mctx.strokeStyle='#d4a017'; mctx.stroke();
  mctx.restore();

  mctx.strokeStyle='rgba(212,160,23,0.5)';
  mctx.lineWidth=1;
  mctx.strokeRect(0.5,0.5,viewW-1,viewH-1);
}
