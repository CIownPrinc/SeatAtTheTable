import type { Corner, FillerItem, Point } from '../config/types';
import type { MapObject, MinimapIcon } from './objects';
import { windhavenMapModel } from './mapModel';

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
  worldWidth: number;
  worldHeight: number;
  landmass: Point[];
  landmarks: Array<{ x: number; y: number; name?: string }>;
  waypoint: Point | null;
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

// LEGAL: Consistent GTA-style symbol per category, mirrored by the expanded map legend.
export function drawGlyph(ctx: CanvasRenderingContext2D, p: Point, icon: MinimapIcon | undefined, color: string, s: number): void {
  const stroke = Math.max(1.2, s*0.24);
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = stroke; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch(icon){
    case 'legal':
      ctx.strokeRect(p.x - s*1.05, p.y - s*0.4, s*2.1, s*1.25);
      ctx.beginPath(); ctx.moveTo(p.x - s*1.15, p.y - s*0.4); ctx.lineTo(p.x - s*0.85, p.y - s*1); ctx.lineTo(p.x + s*0.85, p.y - s); ctx.lineTo(p.x + s*1.15, p.y - s*0.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x - s*0.55, p.y + s*0.15); ctx.lineTo(p.x + s*0.55, p.y + s*0.15); ctx.stroke();
      break;
    case 'illegal':
      ctx.beginPath(); ctx.arc(p.x, p.y, s*0.98, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x - s*0.55, p.y - s*0.15); ctx.lineTo(p.x, p.y - s*0.6); ctx.lineTo(p.x + s*0.55, p.y - s*0.15); ctx.lineTo(p.x + s*0.35, p.y + s*0.55); ctx.lineTo(p.x - s*0.35, p.y + s*0.55); ctx.closePath(); ctx.stroke();
      break;
    case 'bank':
      ctx.beginPath(); ctx.moveTo(p.x - s*1.25, p.y - s*0.55); ctx.lineTo(p.x, p.y - s*1.25); ctx.lineTo(p.x + s*1.25, p.y - s*0.55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x - s*1.05, p.y - s*0.38); ctx.lineTo(p.x + s*1.05, p.y - s*0.38); ctx.moveTo(p.x - s*1.05, p.y + s*0.78); ctx.lineTo(p.x + s*1.05, p.y + s*0.78); ctx.stroke();
      [-0.62, 0, 0.62].forEach(function(offset){ ctx.beginPath(); ctx.moveTo(p.x + offset*s, p.y - s*0.22); ctx.lineTo(p.x + offset*s, p.y + s*0.58); ctx.stroke(); });
      break;
    case 'garage':
      ctx.strokeRect(p.x - s*1.15, p.y - s*0.15, s*2.3, s*0.8);
      ctx.beginPath(); ctx.moveTo(p.x - s*0.65, p.y - s*0.15); ctx.lineTo(p.x - s*0.35, p.y - s*0.65); ctx.lineTo(p.x + s*0.5, p.y - s*0.65); ctx.lineTo(p.x + s*0.85, p.y - s*0.15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x - s*0.35, p.y + s*0.65); ctx.lineTo(p.x - s*0.35, p.y + s*0.15); ctx.lineTo(p.x + s*0.35, p.y + s*0.15); ctx.lineTo(p.x + s*0.35, p.y + s*0.65); ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x - s*0.62, p.y + s*0.75, s*0.22, 0, Math.PI*2); ctx.arc(p.x + s*0.62, p.y + s*0.75, s*0.22, 0, Math.PI*2); ctx.stroke();
      break;
    case 'realty':
      ctx.strokeRect(p.x - s*0.85, p.y - s*0.05, s*1.7, s*1.05);
      ctx.beginPath(); ctx.moveTo(p.x - s*1.05, p.y - s*0.05); ctx.lineTo(p.x, p.y - s*1.1); ctx.lineTo(p.x + s*1.05, p.y - s*0.05); ctx.stroke();
      ctx.strokeRect(p.x - s*0.18, p.y + s*0.35, s*0.36, s*0.65);
      break;
    case 'cityhall':
      ctx.beginPath(); ctx.moveTo(p.x - s*1.05, p.y - s*0.65); ctx.lineTo(p.x, p.y - s*1.15); ctx.lineTo(p.x + s*1.05, p.y - s*0.65); ctx.moveTo(p.x - s*0.95, p.y - s*0.48); ctx.lineTo(p.x + s*0.95, p.y - s*0.48); ctx.moveTo(p.x - s*0.95, p.y + s*0.82); ctx.lineTo(p.x + s*0.95, p.y + s*0.82); ctx.stroke();
      [-0.55, 0, 0.55].forEach(function(offset){ ctx.beginPath(); ctx.moveTo(p.x + offset*s, p.y - s*0.3); ctx.lineTo(p.x + offset*s, p.y + s*0.62); ctx.stroke(); });
      break;
    case 'heist':
      ctx.strokeRect(p.x - s*0.7, p.y - s*0.05, s*1.4, s*0.95);
      ctx.beginPath(); ctx.arc(p.x, p.y - s*0.05, s*0.48, Math.PI, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y + s*0.38, s*0.12, 0, Math.PI*2); ctx.stroke();
      break;
    case 'shop':
      ctx.beginPath(); ctx.moveTo(p.x - s*0.35, p.y - s*0.92); ctx.lineTo(p.x - s*0.75, p.y - s*0.65); ctx.lineTo(p.x - s*1.05, p.y - s*0.08); ctx.lineTo(p.x - s*0.58, p.y + s*0.18); ctx.lineTo(p.x - s*0.5, p.y + s); ctx.lineTo(p.x + s*0.5, p.y + s); ctx.lineTo(p.x + s*0.58, p.y + s*0.18); ctx.lineTo(p.x + s*1.05, p.y - s*0.08); ctx.lineTo(p.x + s*0.75, p.y - s*0.65); ctx.lineTo(p.x + s*0.35, p.y - s*0.92); ctx.quadraticCurveTo(p.x, p.y - s*0.6, p.x - s*0.35, p.y - s*0.92); ctx.stroke();
      break;
    case 'bar':
      ctx.beginPath(); ctx.moveTo(p.x - s*0.9, p.y - s*0.9); ctx.lineTo(p.x + s*0.9, p.y - s*0.9); ctx.lineTo(p.x + s*0.38, p.y - s*0.08); ctx.quadraticCurveTo(p.x, p.y + s*0.18, p.x - s*0.38, p.y - s*0.08); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x, p.y + s*0.18); ctx.lineTo(p.x, p.y + s*0.86); ctx.moveTo(p.x - s*0.5, p.y + s*0.86); ctx.lineTo(p.x + s*0.5, p.y + s*0.86); ctx.stroke();
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

  mctx.fillStyle = '#17364b'; mctx.fillRect(0,0,viewW,viewH);
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
  const drawPolygon = function(points: Point[], fill: string, stroke: string | null, lineWidth: number): void {
    if(points.length < 3) return;
    mctx.beginPath();
    points.forEach(function(point, index){
      const p = proj(point.x, point.y);
      if(index === 0) mctx.moveTo(p.x, p.y);
      else mctx.lineTo(p.x, p.y);
    });
    mctx.closePath();
    mctx.fillStyle = fill;
    mctx.fill();
    if(stroke){
      mctx.strokeStyle = stroke;
      mctx.lineWidth = lineWidth;
      mctx.stroke();
    }
  };
  const drawPolyline = function(points: Point[], stroke: string, lineWidth: number): void {
    if(points.length < 2) return;
    mctx.beginPath();
    points.forEach(function(point, index){
      const p = proj(point.x, point.y);
      if(index === 0) mctx.moveTo(p.x, p.y);
      else mctx.lineTo(p.x, p.y);
    });
    mctx.strokeStyle = stroke;
    mctx.lineWidth = lineWidth;
    mctx.stroke();
  };

  mctx.save();
  if(options.landmass.length){
    mctx.beginPath();
    options.landmass.forEach(function(point, index){
      const p = proj(point.x, point.y);
      if(index === 0) mctx.moveTo(p.x, p.y);
      else mctx.lineTo(p.x, p.y);
    });
    mctx.closePath();
    mctx.fillStyle = '#303438';
    mctx.fill();
    mctx.strokeStyle = 'rgba(217,210,184,0.48)';
    mctx.lineWidth = Math.max(1, 1.5*glyphScale);
    mctx.stroke();
    mctx.clip();
  }

  windhavenMapModel.canals.forEach(function(channel){
    const x0 = channel.x, x1 = channel.x + channel.width;
    const a = proj(x0, -90);
    const b = proj(x1, options.worldHeight + 90);
    mctx.fillStyle = '#1c3a52';
    mctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    drawPolyline([{x:x0+18,y:0},{x:x0+34,y:260},{x:x0+12,y:620},{x:x0+30,y:980},{x:x0+18,y:options.worldHeight}], 'rgba(228,239,232,0.28)', Math.max(1, 1.1*glyphScale));
    drawPolyline([{x:x1-18,y:0},{x:x1-34,y:320},{x:x1-12,y:680},{x:x1-30,y:1030},{x:x1-18,y:options.worldHeight}], 'rgba(228,239,232,0.28)', Math.max(1, 1.1*glyphScale));
  });

  drawPolygon(windhavenMapModel.northRiver, '#1c3a52', 'rgba(228,239,232,0.22)', Math.max(1, 1.2*glyphScale));

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
        mctx.fillStyle='rgba(58,128,76,0.72)';
        mctx.fillRect(p.x-w/2,p.y-d/2,w,d);
        mctx.strokeStyle='rgba(115,180,120,0.5)';
        mctx.lineWidth=Math.max(1, 1*glyphScale);
        mctx.strokeRect(p.x-w/2,p.y-d/2,w,d);
      }
    });
  });

  drawPolygon(windhavenMapModel.lakefrontBeach, 'rgba(185,167,119,0.55)', 'rgba(217,210,184,0.34)', Math.max(1, 1*glyphScale));

  const drawRoad = function(points: Point[], width: number){
    mctx.strokeStyle='rgba(22,24,31,0.95)';
    mctx.lineWidth=Math.max(2, width*scale + 2*glyphScale);
    mctx.beginPath();
    points.forEach(function(point, index){ const p=proj(point.x,point.y); if(index===0) mctx.moveTo(p.x,p.y); else mctx.lineTo(p.x,p.y); });
    mctx.stroke();
    mctx.strokeStyle='rgba(84,90,104,0.94)';
    mctx.lineWidth=Math.max(1, width*scale);
    mctx.beginPath();
    points.forEach(function(point, index){ const p=proj(point.x,point.y); if(index===0) mctx.moveTo(p.x,p.y); else mctx.lineTo(p.x,p.y); });
    mctx.stroke();
  };
  windhavenMapModel.roadPaths.forEach(function(road){
    drawRoad(road.path, road.width);
  });

  windhavenMapModel.bridges.forEach(function(bridge){
    const a=proj(bridge.path[0].x, bridge.path[0].y);
    const b=proj(bridge.path[1].x, bridge.path[1].y);
    mctx.strokeStyle='rgba(154,160,174,0.96)';
    mctx.lineWidth=Math.max(3, (bridge.width + 4)*scale);
    mctx.beginPath(); mctx.moveTo(a.x,a.y); mctx.lineTo(b.x,b.y); mctx.stroke();
    mctx.strokeStyle='rgba(60,64,76,0.95)';
    mctx.lineWidth=Math.max(2, Math.max(56, bridge.width - 16)*scale);
    mctx.beginPath(); mctx.moveTo(a.x,a.y); mctx.lineTo(b.x,b.y); mctx.stroke();
  });

  windhavenMapModel.railLines.forEach(function(rail){
    const railA = proj(rail.path[0].x, rail.path[0].y);
    const railB = proj(rail.path[1].x, rail.path[1].y);
    mctx.strokeStyle='rgba(18,18,22,0.98)';
    mctx.lineWidth=Math.max(2, (rail.width - 6)*scale);
    mctx.beginPath(); mctx.moveTo(railA.x,railA.y); mctx.lineTo(railB.x,railB.y); mctx.stroke();
    mctx.strokeStyle='rgba(170,164,150,0.85)';
    mctx.lineWidth=Math.max(1, 4*glyphScale);
    [-7,7].forEach(function(offset){
      const a=proj(rail.path[0].x+offset, rail.path[0].y);
      const b=proj(rail.path[1].x+offset, rail.path[1].y);
      mctx.beginPath(); mctx.moveTo(a.x,a.y); mctx.lineTo(b.x,b.y); mctx.stroke();
    });
    mctx.strokeStyle='rgba(86,78,68,0.75)';
    mctx.lineWidth=Math.max(1, 2*glyphScale);
    for(let y=20;y<options.worldHeight;y+=60){
      const a=proj(rail.path[0].x-18,y);
      const b=proj(rail.path[0].x+18,y);
      mctx.beginPath(); mctx.moveTo(a.x,a.y); mctx.lineTo(b.x,b.y); mctx.stroke();
    }
    const trainT = (Date.now() % rail.trainCycleMs) / rail.trainCycleMs;
    if(trainT > rail.activeWindow.start && trainT < rail.activeWindow.end){
      const y = (trainT - rail.activeWindow.start) / (rail.activeWindow.end - rail.activeWindow.start) * options.worldHeight;
      const p = proj(rail.path[0].x, y);
      mctx.fillStyle='#b43a35';
      mctx.fillRect(p.x - Math.max(3,6*glyphScale), p.y - Math.max(8,15*glyphScale), Math.max(6,12*glyphScale), Math.max(16,30*glyphScale));
      mctx.strokeStyle='#f0d38a';
      mctx.strokeRect(p.x - Math.max(3,6*glyphScale), p.y - Math.max(8,15*glyphScale), Math.max(6,12*glyphScale), Math.max(16,30*glyphScale));
    }
  });

  mctx.restore();

  mctx.save();
  if(options.landmass.length){
    mctx.beginPath();
    options.landmass.forEach(function(point, index){ const p=proj(point.x, point.y); if(index===0) mctx.moveTo(p.x,p.y); else mctx.lineTo(p.x,p.y); });
    mctx.closePath();
    mctx.clip();
  }

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
  mctx.restore();

  const drawWaypoint = function(wp: Point){
    const p = proj(wp.x, wp.y);
    const r = 6*glyphScale;
    mctx.strokeStyle='#d4a017';
    mctx.lineWidth=2;
    mctx.beginPath(); mctx.moveTo(p.x-r,p.y); mctx.lineTo(p.x+r,p.y); mctx.moveTo(p.x,p.y-r); mctx.lineTo(p.x,p.y+r); mctx.stroke();
    mctx.beginPath(); mctx.arc(p.x,p.y,r+1,0,Math.PI*2); mctx.stroke();
  };
  if(options.waypoint) drawWaypoint(options.waypoint);

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
