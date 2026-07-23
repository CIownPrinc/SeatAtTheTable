// LEGAL: Per-building-type interior decor for the lightweight top-down 2D room scene.
// LEGAL: header.ts owns the outer walls, door, interactive hotspots and the player
// LEGAL: token; this module fills the floor and furnishes the room so a bank reads
// LEGAL: differently from a corner shop or a car dealership. Everything here is
// LEGAL: purely decorative (no game state, no interaction) — it takes a 2D context
// LEGAL: and the room rectangle and paints top-down furniture footprints inside it.

// LEGAL: Minimal slice of CanvasRenderingContext2D so this stays unit-testable with a
// LEGAL: recording stub and never reaches into the DOM.
export interface Ctx2D {
  save(): void;
  restore(): void;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  arc(x: number, y: number, r: number, start: number, end: number): void;
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void;
  fill(): void;
  stroke(): void;
  clip(): void;
  // LEGAL: Widened to the canvas union so a real CanvasRenderingContext2D satisfies
  // LEGAL: this interface; the renderer only ever assigns plain colour strings.
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
}

export interface InteriorRoom {
  ox: number;
  oy: number;
  w: number;
  h: number;
}

// LEGAL: Palette per interior kind. wall = far-edge band, floor = main surface,
// LEGAL: seam = floor texture line colour, accent = the type's signature furniture tone.
interface Palette { wall: string; floor: string; seam: string; accent: string; wood: string; }

const PALETTES: Record<string, Palette> = {
  venture:  { wall:'#2a2118', floor:'#232019', seam:'rgba(0,0,0,0.28)',     accent:'#7c3540', wood:'#4a3524' },
  local:    { wall:'#3a2c1c', floor:'#332a1e', seam:'rgba(0,0,0,0.22)',     accent:'#c98a2b', wood:'#6b4a2c' },
  bankHome: { wall:'#2c3138', floor:'#2b2f38', seam:'rgba(255,255,255,0.05)', accent:'#c9b26b', wood:'#3e4652' },
  heist:    { wall:'#1c2026', floor:'#1e2228', seam:'rgba(255,255,255,0.04)', accent:'#8a939c', wood:'#333a42' },
  garage:   { wall:'#23262c', floor:'#26292f', seam:'rgba(255,255,255,0.05)', accent:'#3e6b78', wood:'#3a3f47' },
  realty:   { wall:'#2c2a34', floor:'#282730', seam:'rgba(255,255,255,0.04)', accent:'#5a7c6b', wood:'#4a4356' },
  cityhall: { wall:'#2e3038', floor:'#2c2e36', seam:'rgba(255,255,255,0.05)', accent:'#c9b26b', wood:'#41444f' },
};
const DEFAULT_PALETTE: Palette = { wall:'#252734', floor:'#232734', seam:'rgba(255,255,255,0.04)', accent:'#d4a017', wood:'#454a5c' };

function paletteFor(kind: string): Palette { return PALETTES[kind] ?? DEFAULT_PALETTE; }

function rrect(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number){
  const rad = Math.max(0, Math.min(r, Math.abs(w)/2, Math.abs(h)/2));
  ctx.beginPath();
  ctx.moveTo(x+rad, y);
  ctx.arcTo(x+w, y, x+w, y+h, rad);
  ctx.arcTo(x+w, y+h, x, y+h, rad);
  ctx.arcTo(x, y+h, x, y, rad);
  ctx.arcTo(x, y, x+w, y, rad);
  ctx.closePath();
}
function box(ctx: Ctx2D, x: number, y: number, w: number, h: number, fill: string, r = 3){
  rrect(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
}
function outlineBox(ctx: Ctx2D, x: number, y: number, w: number, h: number, fill: string, stroke: string, r = 3){
  rrect(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1.4; ctx.stroke();
}
function disc(ctx: Ctx2D, x: number, y: number, r: number, fill: string){
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fillStyle = fill; ctx.fill();
}

// LEGAL: Floor surface + a far "wall" band along the top edge, textured per material:
// LEGAL: wood planks (horizontal seams), tile (grid), or marble (sparse seams).
function drawFloor(ctx: Ctx2D, room: InteriorRoom, pal: Palette, texture: 'wood'|'tile'|'marble'){
  const { ox, oy, w, h } = room;
  const wallH = Math.round(h * 0.22);
  box(ctx, ox, oy, w, h, pal.floor, 0);
  box(ctx, ox, oy, w, wallH, pal.wall, 0);
  ctx.strokeStyle = pal.seam; ctx.lineWidth = 1;
  if(texture === 'tile'){
    for(let gx = 34; gx < w; gx += 34){ ctx.beginPath(); ctx.moveTo(ox+gx, oy+wallH); ctx.lineTo(ox+gx, oy+h); ctx.stroke(); }
    for(let gy = wallH+34; gy < h; gy += 34){ ctx.beginPath(); ctx.moveTo(ox, oy+gy); ctx.lineTo(ox+w, oy+gy); ctx.stroke(); }
  } else if(texture === 'wood'){
    for(let gy = wallH+18; gy < h; gy += 18){ ctx.beginPath(); ctx.moveTo(ox, oy+gy); ctx.lineTo(ox+w, oy+gy); ctx.stroke(); }
  } else {
    for(let gy = wallH+46; gy < h; gy += 46){ ctx.beginPath(); ctx.moveTo(ox, oy+gy); ctx.lineTo(ox+w, oy+gy); ctx.stroke(); }
  }
  // LEGAL: soft skirting line where the far wall meets the floor.
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ox, oy+wallH); ctx.lineTo(ox+w, oy+wallH); ctx.stroke();
  return wallH;
}

// LEGAL: A back counter spanning the far wall — the shared "service desk" motif that
// LEGAL: sits behind the register / teller / clerk hotspots in most building types.
function backCounter(ctx: Ctx2D, room: InteriorRoom, wallH: number, top: string, front: string){
  const { ox, oy, w } = room;
  const cy = oy + wallH + 4;
  box(ctx, ox+40, cy, w-80, 26, front, 3);
  box(ctx, ox+40, cy, w-80, 10, top, 3);
}

// LEGAL: Top-down potted plant in a corner — cheap, universal warmth.
function plant(ctx: Ctx2D, x: number, y: number){
  disc(ctx, x, y, 12, '#2f6b3a');
  disc(ctx, x-4, y-3, 6, '#3c8a4a');
  disc(ctx, x+5, y+2, 5, '#357a41');
  disc(ctx, x, y, 5, '#6b4a2c');
}

// LEGAL: Draws the type-specific furniture layout for one interior kind. Coordinates
// LEGAL: keep the top-centre band (hotspots), bottom-centre (door) and mid-floor
// LEGAL: (player walk space) clear.
export function drawInteriorRoom(ctx: Ctx2D, kind: string, room: InteriorRoom): void {
  const pal = paletteFor(kind);
  const { ox, oy, w, h } = room;
  ctx.save();
  rrect(ctx, ox, oy, w, h, 0); ctx.clip();

  switch(kind){
    case 'local': {
      const wallH = drawFloor(ctx, room, pal, 'wood');
      backCounter(ctx, room, wallH, '#e0c48a', pal.wood);
      // LEGAL: wall shelving down both sides, stocked with colourful goods.
      for(const sx of [ox+14, ox+w-30]){
        box(ctx, sx, oy+wallH+16, 16, h-wallH-70, '#3a2c1c', 2);
        for(let i=0;i<5;i++) box(ctx, sx+2, oy+wallH+22+i*22, 12, 12, i%2? pal.accent : '#7c9a3a', 1);
      }
      // LEGAL: chalkboard price sign on the far wall + doormat.
      outlineBox(ctx, ox+w/2-24, oy+8, 48, 20, '#1b241d', '#3c5a3c', 3);
      box(ctx, ox+w/2-30, oy+h-24, 60, 12, 'rgba(0,0,0,0.25)', 2);
      plant(ctx, ox+w-24, oy+h-30);
      break;
    }
    case 'bankHome': {
      const wallH = drawFloor(ctx, room, pal, 'tile');
      // LEGAL: teller counter with grille dividers across the far wall.
      backCounter(ctx, room, wallH, '#d8cfa0', pal.wood);
      for(let gx = ox+90; gx < ox+w-70; gx += 70){ box(ctx, gx, oy+wallH-14, 3, 18, '#8a8f9c', 0); }
      // LEGAL: marble columns flanking the lobby + a velvet-rope queue lane.
      disc(ctx, ox+34, oy+h*0.5, 13, '#3e4652'); disc(ctx, ox+34, oy+h*0.5, 9, '#525a66');
      disc(ctx, ox+w-34, oy+h*0.5, 13, '#3e4652'); disc(ctx, ox+w-34, oy+h*0.5, 9, '#525a66');
      for(const rx of [ox+w/2-40, ox+w/2+40]){
        disc(ctx, rx, oy+h-70, 4, pal.accent); disc(ctx, rx, oy+h-34, 4, pal.accent);
      }
      break;
    }
    case 'heist': {
      const wallH = drawFloor(ctx, room, pal, 'tile');
      // LEGAL: hazard striping in front of a massive round vault door.
      for(let sx = ox+20; sx < ox+w-20; sx += 24){
        ctx.beginPath(); ctx.moveTo(sx, oy+h-40); ctx.lineTo(sx+12, oy+h-40); ctx.lineTo(sx+2, oy+h-24); ctx.lineTo(sx-10, oy+h-24); ctx.closePath();
        ctx.fillStyle = 'rgba(212,160,23,0.35)'; ctx.fill();
      }
      const vx = ox+w/2, vy = oy+wallH+18;
      disc(ctx, vx, vy, 34, '#3a4048'); disc(ctx, vx, vy, 28, '#4a525c'); disc(ctx, vx, vy, 20, '#333a42');
      disc(ctx, vx, vy, 6, pal.accent);
      for(let a=0;a<8;a++){ const ang=a*Math.PI/4; box(ctx, vx+Math.cos(ang)*14-2, vy+Math.sin(ang)*14-2, 4, 4, '#8a939c', 1); }
      // LEGAL: security camera nub in the corner.
      disc(ctx, ox+w-22, oy+wallH+14, 5, '#8a939c'); disc(ctx, ox+w-22, oy+wallH+14, 2, '#c0392b');
      break;
    }
    // LEGAL: Branded dealerships and brokerages reuse the showroom / office decor; the
    // LEGAL: brand identity comes from the counter stock, not a bespoke room per lot.
    case 'playerGarage':
    case 'dealership':
    case 'garage': {
      const wallH = drawFloor(ctx, room, pal, 'tile');
      // LEGAL: a top-down showroom car parked on the left.
      const cx = ox+70, cy = oy+h*0.56;
      box(ctx, cx-24, cy-40, 48, 80, pal.accent, 10);
      box(ctx, cx-18, cy-26, 36, 20, '#22303a', 4);
      box(ctx, cx-18, cy+8, 36, 20, '#22303a', 4);
      for(const wx of [cx-26, cx+22]) for(const wy of [cy-30, cy+22]) box(ctx, wx, wy, 6, 12, '#15181d', 2);
      // LEGAL: sales desk top-right + a stack of tyres.
      outlineBox(ctx, ox+w-96, oy+wallH+20, 70, 30, pal.wood, 'rgba(255,255,255,0.08)', 3);
      disc(ctx, ox+w-40, oy+h-40, 14, '#15181d'); disc(ctx, ox+w-40, oy+h-40, 6, '#26292f');
      break;
    }
    case 'brokerage':
    case 'realty': {
      const wallH = drawFloor(ctx, room, pal, 'tile');
      // LEGAL: centre rug, an agent's desk, filing cabinets and framed listings.
      box(ctx, ox+w/2-70, oy+h-96, 140, 74, 'rgba(90,124,107,0.14)', 6);
      outlineBox(ctx, ox+w/2-46, oy+wallH+16, 92, 30, pal.wood, 'rgba(255,255,255,0.08)', 3);
      box(ctx, ox+w/2-8, oy+wallH+20, 16, 10, '#20242a', 2);
      // LEGAL: filing cabinets down the left wall, framed listings along the far wall.
      for(let i=0;i<3;i++) outlineBox(ctx, ox+14, oy+wallH+18+i*30, 26, 24, '#33313d', 'rgba(255,255,255,0.06)', 2);
      for(let i=0;i<3;i++) outlineBox(ctx, ox+w-118+i*34, oy+6, 26, 18, '#20242a', pal.accent, 2);
      plant(ctx, ox+w-24, oy+h-30);
      break;
    }
    case 'cityhall': {
      const wallH = drawFloor(ctx, room, pal, 'tile');
      backCounter(ctx, room, wallH, '#d8cfa0', pal.wood);
      // LEGAL: a floor seal, flanking columns and a corner flag.
      disc(ctx, ox+w/2, oy+h-56, 26, 'rgba(201,178,107,0.12)');
      disc(ctx, ox+w/2, oy+h-56, 26, 'rgba(201,178,107,0)'); ctx.strokeStyle = 'rgba(201,178,107,0.4)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(ox+w/2, oy+h-56, 20, 0, Math.PI*2); ctx.stroke();
      disc(ctx, ox+w/2, oy+h-56, 8, pal.accent);
      disc(ctx, ox+34, oy+h*0.5, 13, '#41444f'); disc(ctx, ox+34, oy+h*0.5, 9, '#565a66');
      disc(ctx, ox+w-34, oy+h*0.5, 13, '#41444f'); disc(ctx, ox+w-34, oy+h*0.5, 9, '#565a66');
      box(ctx, ox+w-30, oy+wallH+12, 3, 34, '#8a8f9c', 0); box(ctx, ox+w-27, oy+wallH+12, 20, 12, '#7c3540', 1);
      break;
    }
    case 'venture':
    default: {
      const wallH = drawFloor(ctx, room, pal, 'wood');
      backCounter(ctx, room, wallH, '#5a4632', pal.wood);
      // LEGAL: a moody back-room front: stacked crates, a hanging bulb glow, floor marks.
      for(const [bx, by] of [[ox+16, oy+h-58],[ox+30, oy+h-40],[ox+w-46, oy+h-56],[ox+w-32, oy+h-38]] as const){
        outlineBox(ctx, bx, by, 26, 22, '#4a3524', 'rgba(0,0,0,0.35)', 2);
        ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bx, by+11); ctx.lineTo(bx+26, by+11); ctx.stroke();
      }
      disc(ctx, ox+w/2, oy+wallH+30, 30, 'rgba(212,160,23,0.10)');
      disc(ctx, ox+w/2, oy+wallH+30, 5, pal.accent);
      break;
    }
  }
  ctx.restore();
}
