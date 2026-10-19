import type * as ThreeNamespace from 'three';
import type { Point } from '../../config/types';
import { boundsForPoints } from '../../map/geometry';
import { characterForDistrictBlock } from '../../map/neighbourhoods';
import { windhavenMapModel } from '../../map/mapModel';
import { DISTRICT_OFFSETS, DISTRICT_W, OUTSKIRT_REGIONS, WORLD_H } from '../../map/world';
import { GROUND_COLORS, ZONE_BLEND_RADIUS, type GroundZone } from '../data/zoning';

// LEGAL: The ground: one mesh cut to the exact coastline, coloured by a painted zoning texture.
// LEGAL: It replaces a stack of flat polygons (landmass, then countryside regions, then districts),
// LEGAL: whose hard-edged colour bands looked cheap and whose 0.01-unit gaps strobed.

// LEGAL: Texture resolution: about 5 world units per pixel over the whole island, which keeps it
// LEGAL: near 5 MB of GPU memory, fine on phones. Fine grain comes from the shader, not pixels.
const UNITS_PER_PIXEL = 5;

function css(color: [number, number, number], shade = 0): string {
  // LEGAL: GROUND_COLORS are linear; the canvas works in sRGB.
  const toSrgb = (c: number) => Math.round(255 * Math.min(1, Math.max(0, c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)));
  return `rgb(${toSrgb(color[0] * (1 + shade))},${toSrgb(color[1] * (1 + shade))},${toSrgb(color[2] * (1 + shade))})`;
}

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return function(){ s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

export function paintGroundTexture(canvas: HTMLCanvasElement): void {
  const land = boundsForPoints(windhavenMapModel.landmass);
  const ctx = canvas.getContext('2d')!;
  const px = (x: number) => (x - land.minX) / UNITS_PER_PIXEL;
  const py = (y: number) => (y - land.minY) / UNITS_PER_PIXEL;
  const path = (points: Point[]) => { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(px(p.x), py(p.y)) : ctx.moveTo(px(p.x), py(p.y))); ctx.closePath(); };
  const zone = (name: GroundZone) => css(GROUND_COLORS[name]);

  // LEGAL: 1. Flat zone colours.
  ctx.fillStyle = zone('meadow');
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  OUTSKIRT_REGIONS.forEach(function(region){
    path(region.area);
    ctx.fillStyle = zone(region.kind === 'industrial' ? 'works' : region.kind);
    ctx.fill();
  });
  windhavenMapModel.districts.forEach(function(district){
    ctx.save();
    path(district.landArea);
    ctx.clip();
    for(let xi = 0; xi < 4; xi++) for(let yi = 0; yi < 4; yi++){
      ctx.fillStyle = zone(characterForDistrictBlock(district.id, xi, yi));
      const x0 = DISTRICT_OFFSETS[district.id] + xi * DISTRICT_W / 4;
      // LEGAL: The blocks overhang the district so the clip, not the grid, defines the edge.
      ctx.fillRect(px(x0) - 1, py(yi * WORLD_H / 4) - (yi === 0 ? 400 : 1), DISTRICT_W / 4 / UNITS_PER_PIXEL + 2, WORLD_H / 4 / UNITS_PER_PIXEL + (yi === 0 || yi === 3 ? 400 : 2));
    }
    ctx.restore();
  });

  // LEGAL: 2. Blur, so zones fade into each other over about half a block instead of meeting at
  // LEGAL: a line. Copied through a second canvas because a canvas can't blur onto itself.
  const copy = document.createElement('canvas');
  copy.width = canvas.width; copy.height = canvas.height;
  copy.getContext('2d')!.drawImage(canvas, 0, 0);
  ctx.filter = `blur(${ZONE_BLEND_RADIUS / UNITS_PER_PIXEL / 2}px)`;
  ctx.drawImage(copy, 0, 0);
  ctx.filter = 'none';

  // LEGAL: 3. Detail that should stay sharp: crop rows in fields, clumps in woods, worn patches in
  // LEGAL: rough blocks.
  OUTSKIRT_REGIONS.forEach(function(region, index){
    const random = seeded(7919 * (index + 1));
    ctx.save();
    path(region.area);
    ctx.clip();
    const b = boundsForPoints(region.area);
    if(region.kind === 'farmland'){
      // LEGAL: Fields: patches of parallel rows, each at its own angle and tint.
      for(let f = 0; f < 26; f++){
        const cx = b.minX + random() * (b.maxX - b.minX), cy = b.minY + random() * (b.maxY - b.minY);
        const size = 160 + random() * 220;
        ctx.save();
        ctx.translate(px(cx), py(cy));
        ctx.rotate(random() * Math.PI);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = css(GROUND_COLORS.farmland, (random() - 0.5) * 0.35);
        ctx.fillRect(-size / 2 / UNITS_PER_PIXEL, -size / 2 / UNITS_PER_PIXEL, size / UNITS_PER_PIXEL, size / UNITS_PER_PIXEL);
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = css(GROUND_COLORS.farmland, -0.3);
        for(let r = -size / 2; r < size / 2; r += 14) ctx.fillRect(-size / 2 / UNITS_PER_PIXEL, r / UNITS_PER_PIXEL, size / UNITS_PER_PIXEL, 1);
        ctx.restore();
      }
    } else if(region.kind === 'forest'){
      for(let c = 0; c < 900; c++){
        ctx.globalAlpha = 0.18 + random() * 0.2;
        ctx.fillStyle = css(GROUND_COLORS.forest, -0.2 - random() * 0.25);
        ctx.beginPath();
        ctx.arc(px(b.minX + random() * (b.maxX - b.minX)), py(b.minY + random() * (b.maxY - b.minY)), (8 + random() * 22) / UNITS_PER_PIXEL, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  });
  windhavenMapModel.districts.forEach(function(district, index){
    const random = seeded(104729 * (index + 1));
    ctx.save();
    path(district.landArea);
    ctx.clip();
    for(let xi = 0; xi < 4; xi++) for(let yi = 0; yi < 4; yi++){
      if(characterForDistrictBlock(district.id, xi, yi) !== 'rough') continue;
      for(let p = 0; p < 22; p++){
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = css(GROUND_COLORS.rough, 0.15);
        ctx.beginPath();
        const x = DISTRICT_OFFSETS[district.id] + (xi + random()) * DISTRICT_W / 4, y = (yi + random()) * WORLD_H / 4;
        ctx.ellipse(px(x), py(y), (14 + random() * 30) / UNITS_PER_PIXEL, (10 + random() * 20) / UNITS_PER_PIXEL, random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  });
  ctx.globalAlpha = 1;

  // LEGAL: 4. Per-pixel grain so no area is a flat fill.
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const random = seeded(31337);
  for(let i = 0; i < image.data.length; i += 4){
    const n = (random() - 0.5) * 14;
    image.data[i] += n; image.data[i + 1] += n; image.data[i + 2] += n * 0.7;
  }
  ctx.putImageData(image, 0, 0);
}

// LEGAL: Fine grass grain in the shader, at a scale the texture can't hold.
const GRAIN_CHUNK = `
  vec2 grainCell = floor(vTerrainPos * 0.35);
  float grain = fract(sin(dot(grainCell, vec2(12.9898, 78.233))) * 43758.5453);
  diffuseColor.rgb *= 0.94 + grain * 0.1;
`;

export function buildTerrainMesh(THREE: typeof ThreeNamespace): ThreeNamespace.Mesh {
  const land = boundsForPoints(windhavenMapModel.landmass);
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((land.maxX - land.minX) / UNITS_PER_PIXEL);
  canvas.height = Math.ceil((land.maxY - land.minY) / UNITS_PER_PIXEL);
  paintGroundTexture(canvas);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = 4;

  const shape = new THREE.Shape(windhavenMapModel.landmass.map(p => new THREE.Vector2(p.x, p.y)));
  // LEGAL: The lake is a hole, not ground drawn under the water: two stacked surfaces z-fight.
  shape.holes.push(new THREE.Path(windhavenMapModel.lake.map(p => new THREE.Vector2(p.x, p.y))));
  const geometry = new THREE.ShapeGeometry(shape, 24);
  // LEGAL: UVs straight from world position, so pixel (0,0) is the land's north-west corner.
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for(let i = 0; i < position.count; i++){
    uv.setXY(i, (position.getX(i) - land.minX) / (land.maxX - land.minX), (position.getY(i) - land.minY) / (land.maxY - land.minY));
  }
  uv.needsUpdate = true;
  const material = new THREE.MeshStandardMaterial({ map:texture, roughness:1, side:THREE.DoubleSide });
  material.onBeforeCompile = function(shader){
    shader.vertexShader = 'varying vec2 vTerrainPos;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vTerrainPos = (modelMatrix * vec4(transformed, 1.0)).xz;');
    shader.fragmentShader = 'varying vec2 vTerrainPos;\n' + shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n' + GRAIN_CHUNK);
  };
  material.customProgramCacheKey = function(){ return 'terrain-grain'; };
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'terrain:ground';
  // LEGAL: Same mapping as the old ground shapes: shape (x, y) becomes world (x, 0, y).
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = 0.02;
  mesh.receiveShadow = true;
  return mesh;
}
