import type { Corner, FillerItem, Point } from '../config/types';
import type { MapObject, MinimapIcon } from './objects';
import { roadLandSegments, windhavenMapModel } from './mapModel';
import type { RoadPath } from './mapModel';
import { activeTrainSnapshot } from './queries';
import { mapTerrainTheme, terrainForDistrict } from './renderTheme';
import type { BlockHolding } from './territory';
import type { RegionRecord } from './regions';
import { OUTSKIRT_REGIONS, type OutskirtRegion } from './world';

// LEGAL: Minimap tints for the outskirt belts. Lighter than the 3D terrain colours because
// LEGAL: the minimap sits behind icons and must not compete with them.
function minimapOutskirtColor(kind: OutskirtRegion['kind']): string {
  if(kind === 'forest') return '#4a6b40';
  if(kind === 'suburb') return '#7d8a63';
  if(kind === 'industrial') return '#79786a';
  return '#8c9c52';
}

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
  districtNames?: Array<{ x: number; y?: number; name: string }>;
  highlightPoint?: Point | null;
  highlightLabel?: string;
  // LEGAL: Territory overlay. Null/empty leaves the minimap exactly as it was, so the
  // LEGAL: overlay is purely additive and costs nothing while toggled off.
  territory?: BlockHolding[] | null;
  // LEGAL: Ids of places sitting on rival turf, ringed so you can see which shops will
  // LEGAL: mark you up before making the drive.
  warnObjectIds?: Set<string>;
  // LEGAL: Draw each block's name inside it. Only the full City Map has the room; the
  // LEGAL: 150px minimap would be unreadable, so it leaves this off.
  territoryLabels?: boolean;
  // LEGAL: District overlay. Outlines every named region of the map and writes its name
  // LEGAL: inside it, so "where am I" has a visual answer as well as a HUD one. Null leaves
  // LEGAL: the map exactly as it was — additive, like the territory layer.
  regions?: RegionRecord[] | null;
}

interface MinimapRenderFrame {
  viewW: number;
  viewH: number;
  halfX: number;
  halfY: number;
  scale: number;
  glyphScale: number;
  center: Point;
}

const staticLayerCache = new Map<string, HTMLCanvasElement>();

export function minimapStaticLayerCacheKey(options: MinimapRenderOptions): string {
  const frame = minimapRenderFrame(options);
  const districtNames = options.districtNames?.map(name => `${name.name}:${Math.round(name.x)}:${Math.round(name.y ?? 6)}`).join('|') ?? '';
  const roadVersion = roadLandSegments().map(segment => `${segment.road.id}:${segment.road.roadClass}:${segment.road.width}:${Math.round(segment.path[0].x)}:${Math.round(segment.path[0].y)}:${Math.round(segment.path[1].x)}:${Math.round(segment.path[1].y)}`).join('|');
  const waterVersion = `${windhavenMapModel.canals.length}:${windhavenMapModel.lake.length}:${windhavenMapModel.lakefrontBeach.length}`;
  const terrainVersion = [
    mapTerrainTheme.openWater,
    mapTerrainTheme.baseLand,
    mapTerrainTheme.canalWater,
    ...windhavenMapModel.districts.map(district => `${district.id}:${terrainForDistrict(district.id).minimapLand}:${district.landArea.length}`),
  ].join('|');
  const fillerVersion = ['devlin','westside','hub'].map(districtId => `${districtId}:${options.fillerFor(districtId).length}`).join('|');
  return [
    frame.viewW,
    frame.viewH,
    frame.scale.toFixed(5),
    Math.round(frame.center.x),
    Math.round(frame.center.y),
    frame.glyphScale.toFixed(2),
    options.landmass.length,
    options.landmarks.length,
    waterVersion,
    roadVersion,
    terrainVersion,
    fillerVersion,
    districtNames,
  ].join(':');
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

function minimapRenderFrame(options: MinimapRenderOptions): MinimapRenderFrame {
  const size = options.size ?? MINIMAP_SIZE;
  const viewW = options.viewW ?? size;
  const viewH = options.viewH ?? size;
  const halfX = viewW/2;
  const halfY = viewH/2;
  const scale = options.scale ?? MINIMAP_SCALE;
  const glyphScale = options.glyphScale ?? 1;

  if(!options.center && !options.dragging && Math.hypot(options.player.vx, options.player.vy) > 5){
    options.pan.x = 0;
    options.pan.y = 0;
  }
  const center = options.center ? options.center : { x: options.player.x + options.pan.x, y: options.player.y + options.pan.y };
  return { viewW, viewH, halfX, halfY, scale, glyphScale, center };
}

function minimapProject(frame: MinimapRenderFrame, wx: number, wy: number): Point {
  return { x: frame.halfX + (wx-frame.center.x)*frame.scale, y: frame.halfY + (wy-frame.center.y)*frame.scale };
}

function drawStaticMinimapLayer(mctx: CanvasRenderingContext2D, options: MinimapRenderOptions, frame: MinimapRenderFrame): void {
  const { viewW, viewH, scale, glyphScale } = frame;
  const proj = function(wx: number, wy: number){ return minimapProject(frame, wx, wy); };
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

  mctx.fillStyle = mapTerrainTheme.openWater; mctx.fillRect(0,0,viewW,viewH);

  mctx.save();
  if(options.landmass.length){
    traceLandmass(mctx, options.landmass, proj);
    mctx.fillStyle = mapTerrainTheme.baseLand;
    mctx.fill();
    mctx.strokeStyle = 'rgba(217,210,184,0.48)';
    mctx.lineWidth = Math.max(1, 1.5*glyphScale);
    mctx.stroke();
    mctx.clip();
  }

  // LEGAL: Outskirt belts first, so the districts still draw on top of them. Without this
  // LEGAL: the whole ring renders as one flat field on the minimap and City Map even though
  // LEGAL: the 3D world shows farmland, forest, suburb and industrial edge.
  OUTSKIRT_REGIONS.forEach(function(region){
    drawPolygon(region.area, minimapOutskirtColor(region.kind), 'rgba(235,226,190,0.14)', Math.max(1, 0.8*glyphScale));
  });

  windhavenMapModel.districts.forEach(function(district){
    drawPolygon(district.landArea, terrainForDistrict(district.id).minimapLand, 'rgba(235,226,190,0.32)', Math.max(1, 1.2*glyphScale));
  });

  windhavenMapModel.canals.forEach(function(channel){
    const x0 = channel.x, x1 = channel.x + channel.width;
    const a = proj(x0, -90);
    const b = proj(x1, options.worldHeight + 90);
    mctx.fillStyle = mapTerrainTheme.canalWater;
    mctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    drawPolyline([{x:x0+18,y:0},{x:x0+34,y:260},{x:x0+12,y:620},{x:x0+30,y:980},{x:x0+18,y:options.worldHeight}], 'rgba(228,239,232,0.28)', Math.max(1, 1.1*glyphScale));
    drawPolyline([{x:x1-18,y:0},{x:x1-34,y:320},{x:x1-12,y:680},{x:x1-30,y:1030},{x:x1-18,y:options.worldHeight}], 'rgba(228,239,232,0.28)', Math.max(1, 1.1*glyphScale));
  });

  drawPolygon(windhavenMapModel.lake, mapTerrainTheme.canalWater, 'rgba(228,239,232,0.28)', Math.max(1, 1.2*glyphScale));

  ['devlin','westside','hub'].forEach(function(distId){
    const off = options.districtOffsets[distId];
    options.fillerFor(distId).forEach(function(f){
      if(f.kind==='building'){
        const p = proj(f.x+off, f.y);
        if(!isOnMap(p, viewW, viewH)) return;
        const bw = Math.max(1.5, f.w*scale);
        const bd = Math.max(1.5, f.d*scale);
        mctx.fillStyle = 'rgba(120,126,142,0.72)';
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

  const drawRoad = function(road: RoadPath){
    if(road.roadClass === 'country'){
      // LEGAL: Dirt lanes read as tracks, not streets: thinner, earth-coloured, no kerb outline.
      mctx.strokeStyle='rgba(150,122,82,0.9)';
      mctx.lineWidth=Math.max(1.5, road.width*0.7*scale);
      mctx.lineJoin='round';
      mctx.beginPath();
      road.path.forEach(function(point, index){ const p=proj(point.x,point.y); if(index===0) mctx.moveTo(p.x,p.y); else mctx.lineTo(p.x,p.y); });
      mctx.stroke();
      return;
    }
    const surfaceWidth = road.width + (road.roadClass === 'arterial' ? 10 : road.roadClass === 'diagonal' ? 4 : 0);
    const coreColor = road.roadClass === 'arterial' ? 'rgba(102,108,121,0.98)' : road.roadClass === 'diagonal' ? 'rgba(91,96,109,0.96)' : 'rgba(76,82,96,0.94)';
    const edgeColor = road.roadClass === 'arterial' ? 'rgba(18,20,27,0.98)' : 'rgba(22,24,31,0.95)';
    mctx.strokeStyle='rgba(22,24,31,0.95)';
    mctx.strokeStyle=edgeColor;
    mctx.lineWidth=Math.max(2, surfaceWidth*scale + 2*glyphScale);
    mctx.beginPath();
    road.path.forEach(function(point, index){ const p=proj(point.x,point.y); if(index===0) mctx.moveTo(p.x,p.y); else mctx.lineTo(p.x,p.y); });
    mctx.stroke();
    mctx.strokeStyle=coreColor;
    mctx.lineWidth=Math.max(1, surfaceWidth*scale);
    mctx.beginPath();
    road.path.forEach(function(point, index){ const p=proj(point.x,point.y); if(index===0) mctx.moveTo(p.x,p.y); else mctx.lineTo(p.x,p.y); });
    mctx.stroke();
    if(road.roadClass === 'arterial'){
      mctx.strokeStyle='rgba(193,188,158,0.28)';
      mctx.lineWidth=Math.max(1, 1.2*glyphScale);
      mctx.setLineDash([8*glyphScale, 8*glyphScale]);
      mctx.beginPath();
      road.path.forEach(function(point, index){ const p=proj(point.x,point.y); if(index===0) mctx.moveTo(p.x,p.y); else mctx.lineTo(p.x,p.y); });
      mctx.stroke();
      mctx.setLineDash([]);
    }
  };
  roadLandSegments().forEach(function(segment){
    drawRoad({ ...segment.road, path:segment.path });
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
  });

  mctx.restore();

  mctx.save();
  if(options.landmass.length){
    traceLandmass(mctx, options.landmass, proj);
    mctx.clip();
  }

  options.landmarks.forEach(function(landmark){
    const p = proj(landmark.x, landmark.y);
    if(!isOnMap(p, viewW, viewH)) return;
    mctx.save(); mctx.translate(p.x,p.y); mctx.rotate(Math.PI/4);
    mctx.fillStyle='#e0c860'; const ls = 3*glyphScale; mctx.fillRect(-ls,-ls,ls*2,ls*2); mctx.restore();
  });
  mctx.restore();

  // LEGAL: District names are drawn AFTER the landmass clip is released. They now sit in
  // LEGAL: the water north of each district so they stop covering blocks, streets and
  // LEGAL: place glyphs — and inside the clip a label over water was being erased outright.
  if(options.districtNames){
    mctx.fillStyle='rgba(224,200,96,0.62)';
    mctx.font=`700 ${Math.round(12*glyphScale)}px Oswald, sans-serif`;
    mctx.textAlign='center'; mctx.textBaseline='top';
    options.districtNames.forEach(function(d){
      const p = proj(d.x, d.y ?? 6);
      if(p.x < -20 || p.x > viewW+20) return;
      mctx.fillText(d.name.toUpperCase(), p.x, Math.max(2, p.y));
    });
  }
}

function traceLandmass(mctx: CanvasRenderingContext2D, landmass: readonly Point[], proj: (wx: number, wy: number) => Point): void {
  mctx.beginPath();
  landmass.forEach(function(point, index){
    const p = proj(point.x, point.y);
    if(index === 0) mctx.moveTo(p.x, p.y);
    else mctx.lineTo(p.x, p.y);
  });
  mctx.closePath();
}

function drawDynamicMinimapLayer(mctx: CanvasRenderingContext2D, options: MinimapRenderOptions, frame: MinimapRenderFrame): void {
  const { viewW, viewH, glyphScale } = frame;
  const proj = function(wx: number, wy: number){ return minimapProject(frame, wx, wy); };

  mctx.save();
  if(options.landmass.length){
    traceLandmass(mctx, options.landmass, proj);
    mctx.clip();
  }

  // LEGAL: District outlines sit below the territory tint and everything else. Outlines and
  // LEGAL: a faint wash rather than a solid fill: the point is to show you where the seams
  // LEGAL: are, and a map you cannot read through is not a map.
  if(options.regions?.length){
    options.regions.forEach(function(region){
      region.areas.forEach(function(area){
        if(!area.length) return;
        mctx.beginPath();
        area.forEach(function(point, index){
          const p = proj(point.x, point.y);
          if(index === 0) mctx.moveTo(p.x, p.y); else mctx.lineTo(p.x, p.y);
        });
        mctx.closePath();
        mctx.globalAlpha = 0.16;
        mctx.fillStyle = region.color;
        mctx.fill();
        mctx.globalAlpha = 0.85;
        mctx.strokeStyle = region.color;
        mctx.lineWidth = Math.max(1, 1.6 * glyphScale);
        mctx.setLineDash([Math.max(3, 4 * glyphScale), Math.max(2, 3 * glyphScale)]);
        mctx.stroke();
        mctx.setLineDash([]);
      });
    });
    mctx.globalAlpha = 1;
  }

  // LEGAL: Territory tint sits under everything else so roads, glyphs and the player
  // LEGAL: marker stay readable. Drawn inside the landmass clip, so turf stops at the
  // LEGAL: shoreline instead of bleeding across the canals.
  if(options.territory?.length){
    options.territory.forEach(function(holding){
      const a = proj(holding.block.x, holding.block.y);
      const b = proj(holding.block.x + holding.block.w, holding.block.y + holding.block.h);
      mctx.globalAlpha = holding.owner === 'contested' ? 0.2 : 0.36;
      mctx.fillStyle = holding.color;
      mctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      mctx.globalAlpha = 0.5;
      mctx.strokeStyle = holding.color;
      mctx.lineWidth = 1;
      mctx.strokeRect(a.x + 0.5, a.y + 0.5, b.x - a.x - 1, b.y - a.y - 1);
    });
    mctx.globalAlpha = 1;

    // LEGAL: Block names sit just inside the top edge, clear of the place glyphs that
    // LEGAL: cluster mid-block. Blocks are narrow, so the label shrinks and then truncates
    // LEGAL: to fit rather than bleeding into the neighbouring block's name.
    if(options.territoryLabels){
      mctx.textAlign = 'center';
      mctx.textBaseline = 'top';
      options.territory.forEach(function(holding){
        const a = proj(holding.block.x, holding.block.y);
        const b = proj(holding.block.x + holding.block.w, holding.block.y + holding.block.h);
        const cx = (a.x + b.x) / 2;
        const top = Math.min(a.y, b.y) + 4;
        const maxWidth = Math.abs(b.x - a.x) - 6;
        if(maxWidth < 16) return;
        if(!isOnMap({ x: cx, y: top }, viewW, viewH)) return;

        let label = holding.block.name.toUpperCase();
        let size = 9;
        mctx.font = `600 ${size}px IBM Plex Mono, monospace`;
        while(mctx.measureText(label).width > maxWidth && size > 7){
          size -= 1;
          mctx.font = `600 ${size}px IBM Plex Mono, monospace`;
        }
        while(label.length > 3 && mctx.measureText(label).width > maxWidth){
          label = label.slice(0, -1);
        }

        mctx.lineWidth = 3;
        mctx.strokeStyle = 'rgba(8,9,13,0.9)';
        mctx.strokeText(label, cx, top);
        mctx.fillStyle = holding.color;
        mctx.fillText(label, cx, top);
      });
    }
  }

  windhavenMapModel.railLines.forEach(function(rail){
    const train = activeTrainSnapshot(Date.now(), rail);
    if(!train) return;
    const p = proj(train.point.x, train.point.y);
    mctx.fillStyle='#b43a35';
    // LEGAL: Sized off glyphScale with small floors. The old floors (6x30px) drew a train
    // LEGAL: a fifth of the height of the 150px minimap — bigger than the districts it ran
    // LEGAL: through.
    const trainW = Math.max(2, 3.2*glyphScale);
    const trainH = Math.max(5, 9*glyphScale);
    mctx.fillRect(p.x - trainW/2, p.y - trainH/2, trainW, trainH);
    mctx.strokeStyle='#f0d38a';
    mctx.lineWidth = Math.max(0.6, 0.5*glyphScale);
    mctx.strokeRect(p.x - trainW/2, p.y - trainH/2, trainW, trainH);
  });

  options.mapObjects.forEach(function(object){
    const p = proj(object.x, object.y);
    if(!isOnMap(p, viewW, viewH)) return;
    drawGlyph(mctx, p, object.minimapIcon, objectColor(object), Math.max(1.5, object.minimapSize*glyphScale));
    // LEGAL: Ring shops standing on rival turf so the markup is visible from the map.
    if(options.warnObjectIds?.has(object.id)){
      const r = Math.max(4, object.minimapSize * glyphScale * 2.2);
      mctx.strokeStyle = '#ffffff';
      mctx.lineWidth = 1.4;
      mctx.beginPath(); mctx.arc(p.x, p.y, r, 0, Math.PI*2); mctx.stroke();
    }
  });

  mctx.restore();

  // LEGAL: Region names go on last and OUTSIDE the landmass clip, for the same reason the
  // LEGAL: district names do: a label that crosses the shoreline was being erased at the
  // LEGAL: waterline, which read as the text being cut in half. Only drawn at City Map scale
  // LEGAL: — on the 150px minimap a region name is wider than the region.
  if(options.regions?.length && glyphScale >= 1.5){
    mctx.save();
    mctx.textAlign = 'center';
    mctx.textBaseline = 'middle';
    mctx.font = `700 ${Math.round(11 * glyphScale)}px Oswald, sans-serif`;
    options.regions.forEach(function(region){
      // LEGAL: The base map already writes the three city district names (districtNames,
      // LEGAL: static layer). Drawing them again from here printed each one twice at the
      // LEGAL: same point in a different colour, which just looked like blurred text.
      if(region.kind === 'city') return;
      const p = proj(region.labelPoint.x, region.labelPoint.y);
      if(!isOnMap(p, viewW, viewH)) return;
      const label = region.name.toUpperCase();
      mctx.lineWidth = 4;
      mctx.strokeStyle = 'rgba(8,9,13,0.92)';
      mctx.strokeText(label, p.x, p.y);
      mctx.fillStyle = region.color;
      mctx.fillText(label, p.x, p.y);
    });
    mctx.restore();
  }

  const drawWaypoint = function(wp: Point): void {
    const p = proj(wp.x, wp.y);
    const r = 6*glyphScale;
    mctx.strokeStyle='#d4a017';
    mctx.lineWidth=2;
    mctx.beginPath(); mctx.moveTo(p.x-r,p.y); mctx.lineTo(p.x+r,p.y); mctx.moveTo(p.x,p.y-r); mctx.lineTo(p.x,p.y+r); mctx.stroke();
    mctx.beginPath(); mctx.arc(p.x,p.y,r+1,0,Math.PI*2); mctx.stroke();
  };
  if(options.waypoint) drawWaypoint(options.waypoint);

  if(options.highlightPoint){
    const hp = proj(options.highlightPoint.x, options.highlightPoint.y);
    if(isOnMap(hp, viewW, viewH)){
      const r = 9*glyphScale;
      mctx.save();
      mctx.strokeStyle='rgba(240,239,232,0.95)';
      mctx.lineWidth=Math.max(1.5, 1.3*glyphScale);
      mctx.beginPath();
      mctx.arc(hp.x, hp.y, r, 0, Math.PI*2);
      mctx.stroke();
      mctx.strokeStyle='rgba(212,160,23,0.9)';
      mctx.beginPath();
      mctx.moveTo(hp.x-r-4*glyphScale, hp.y);
      mctx.lineTo(hp.x-r+3*glyphScale, hp.y);
      mctx.moveTo(hp.x+r-3*glyphScale, hp.y);
      mctx.lineTo(hp.x+r+4*glyphScale, hp.y);
      mctx.moveTo(hp.x, hp.y-r-4*glyphScale);
      mctx.lineTo(hp.x, hp.y-r+3*glyphScale);
      mctx.moveTo(hp.x, hp.y+r-3*glyphScale);
      mctx.lineTo(hp.x, hp.y+r+4*glyphScale);
      mctx.stroke();
      if(options.highlightLabel && glyphScale >= 1.8){
        mctx.font=`700 ${Math.round(10*glyphScale)}px IBM Plex Mono, monospace`;
        mctx.textAlign='center';
        mctx.textBaseline='bottom';
        mctx.fillStyle='rgba(4,6,10,0.86)';
        const textWidth = mctx.measureText(options.highlightLabel).width;
        const labelX = Math.max(8 + textWidth/2, Math.min(viewW - 8 - textWidth/2, hp.x));
        const labelY = Math.max(24, hp.y - r - 8*glyphScale);
        mctx.fillRect(labelX - textWidth/2 - 6, labelY - 17*glyphScale, textWidth + 12, 17*glyphScale);
        mctx.fillStyle='rgba(240,239,232,0.94)';
        mctx.fillText(options.highlightLabel, labelX, labelY - 3*glyphScale);
      }
      mctx.restore();
    }
  }

  const pp = proj(options.player.x,options.player.y);
  mctx.save(); mctx.translate(pp.x,pp.y); mctx.rotate(options.player.facing);
  const ps = 5*glyphScale;
  mctx.beginPath(); mctx.moveTo(ps+1,0); mctx.lineTo(-ps*0.8,-ps*0.8); mctx.lineTo(-ps*0.8,ps*0.8); mctx.closePath();
  mctx.fillStyle='#e8e6de'; mctx.fill();
  // LEGAL: The gold outline was a 1px hairline, which antialiasing blended into the
  // LEGAL: off-white fill until almost no gold pixels survived — hard to pick out at
  // LEGAL: 150px, and the reason the two "gold pixel" smoke checks read zero.
  mctx.lineWidth=Math.max(2,glyphScale*1.6); mctx.strokeStyle='#d4a017'; mctx.stroke();
  mctx.restore();

  mctx.strokeStyle='rgba(212,160,23,0.5)';
  mctx.lineWidth=1;
  mctx.strokeRect(0.5,0.5,viewW-1,viewH-1);
}

function getStaticMinimapLayer(options: MinimapRenderOptions, frame: MinimapRenderFrame): HTMLCanvasElement {
  const key = minimapStaticLayerCacheKey(options);
  const cached = staticLayerCache.get(key);
  if(cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = frame.viewW;
  canvas.height = frame.viewH;
  const ctx = canvas.getContext('2d');
  if(!ctx) return canvas;
  drawStaticMinimapLayer(ctx, options, frame);
  staticLayerCache.set(key, canvas);
  return canvas;
}

export function drawMinimap(options: MinimapRenderOptions): void {
  const mctx = options.ctx;
  const frame = minimapRenderFrame(options);

  if(options.indoors){
    mctx.fillStyle = mapTerrainTheme.openWater;
    mctx.fillRect(0,0,frame.viewW,frame.viewH);
    mctx.fillStyle='#6c7080'; mctx.font='10px IBM Plex Mono, monospace'; mctx.textAlign='center'; mctx.textBaseline='middle';
    mctx.fillText('Indoors', frame.halfX, frame.halfY);
    mctx.strokeStyle='rgba(212,160,23,0.5)'; mctx.strokeRect(0.5,0.5,frame.viewW-1,frame.viewH-1);
    return;
  }

  const staticLayer = getStaticMinimapLayer(options, frame);
  mctx.drawImage(staticLayer, 0, 0);
  drawDynamicMinimapLayer(mctx, options, frame);
}
