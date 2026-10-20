import { seededRandom } from '../map/random';

// LEGAL: The title screen's night skyline, drawn as one SVG in this coordinate space and
// LEGAL: scaled to the screen. Seeded, so Windhaven looks the same on every visit.
export const SKYLINE_WIDTH = 1600;
export const SKYLINE_HEIGHT = 320;
const SKYLINE_SEED = 1947;
const SVG_NS = 'http://www.w3.org/2000/svg';

export type RoofDetail = 'flat' | 'antenna' | 'tank';

export interface SkylineWindow { x: number; y: number; size: number; flicker: boolean; delay: number }
export interface SkylineBuilding { x: number; width: number; height: number; roof: RoofDetail; windows: SkylineWindow[] }
export interface SkylineLayer { depth: 'far' | 'mid' | 'near'; buildings: SkylineBuilding[] }
export interface SkylineStar { x: number; y: number; radius: number; twinkle: boolean; delay: number }
export interface Skyline { layers: SkylineLayer[]; stars: SkylineStar[] }

interface LayerSpec { depth: SkylineLayer['depth']; minWidth: number; maxWidth: number; minHeight: number; maxHeight: number; litChance: number; windowSize: number }

const LAYERS: LayerSpec[] = [
  { depth: 'far', minWidth: 46, maxWidth: 96, minHeight: 120, maxHeight: 250, litChance: 0.10, windowSize: 3 },
  { depth: 'mid', minWidth: 60, maxWidth: 130, minHeight: 90, maxHeight: 210, litChance: 0.16, windowSize: 4 },
  { depth: 'near', minWidth: 80, maxWidth: 170, minHeight: 50, maxHeight: 140, litChance: 0.22, windowSize: 6 },
];
const FLICKER_CHANCE = 0.08;

function buildLayer(spec: LayerSpec, random: () => number): SkylineLayer {
  const buildings: SkylineBuilding[] = [];
  const between = (min: number, max: number) => min + random() * (max - min);
  let x = -between(0, spec.minWidth);
  while(x < SKYLINE_WIDTH){
    const width = Math.round(between(spec.minWidth, spec.maxWidth));
    const height = Math.round(between(spec.minHeight, spec.maxHeight));
    const roll = random();
    const roof: RoofDetail = roll < 0.18 ? 'antenna' : roll < 0.3 ? 'tank' : 'flat';
    const windows: SkylineWindow[] = [];
    const step = spec.windowSize * 2.6;
    const top = SKYLINE_HEIGHT - height;
    for(let wy = top + step; wy + spec.windowSize < SKYLINE_HEIGHT - 4; wy += step){
      for(let wx = x + step * 0.7; wx + spec.windowSize <= x + width - step * 0.5; wx += step){
        if(random() >= spec.litChance) continue;
        windows.push({ x: Math.round(wx), y: Math.round(wy), size: spec.windowSize, flicker: random() < FLICKER_CHANCE, delay: Math.round(random() * 140) / 10 });
      }
    }
    buildings.push({ x: Math.round(x), width, height, roof, windows });
    x += width - Math.round(between(0, 6));
  }
  return { depth: spec.depth, buildings };
}

export function skylineLayout(): Skyline {
  const random = seededRandom(SKYLINE_SEED);
  const layers = LAYERS.map(spec => buildLayer(spec, random));
  const stars: SkylineStar[] = Array.from({ length: 45 }, function(){
    return { x: Math.round(random() * SKYLINE_WIDTH), y: Math.round(random() * 150), radius: 0.6 + random() * 1.1, twinkle: random() < 0.25, delay: Math.round(random() * 60) / 10 };
  });
  return { layers, stars };
}

function svgElement(tag: string, attributes: Record<string, string | number>): SVGElement {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function roofDetail(building: SkylineBuilding): SVGElement | null {
  const top = SKYLINE_HEIGHT - building.height;
  const centre = building.x + building.width / 2;
  if(building.roof === 'antenna') return svgElement('rect', { x: centre - 1, y: top - 26, width: 2, height: 26 });
  if(building.roof === 'tank') return svgElement('rect', { x: centre - 9, y: top - 14, width: 18, height: 14, rx: 3 });
  return null;
}

export function renderSkyline(container: HTMLElement): void {
  const { layers, stars } = skylineLayout();
  const svg = svgElement('svg', { viewBox: `0 0 ${SKYLINE_WIDTH} ${SKYLINE_HEIGHT}`, preserveAspectRatio: 'xMidYMax meet', class: 'skyline-svg' });
  const sky = svgElement('g', { class: 'skyline-stars' });
  stars.forEach(function(star){
    const dot = svgElement('circle', { cx: star.x, cy: star.y, r: star.radius.toFixed(2), class: star.twinkle ? 'star twinkle' : 'star' });
    if(star.twinkle) dot.style.animationDelay = `${star.delay}s`;
    sky.appendChild(dot);
  });
  svg.appendChild(sky);
  svg.appendChild(svgElement('circle', { cx: 1270, cy: 70, r: 26, class: 'skyline-moon' }));
  layers.forEach(function(layer){
    const group = svgElement('g', { class: `skyline-layer ${layer.depth}` });
    layer.buildings.forEach(function(building){
      group.appendChild(svgElement('rect', { x: building.x, y: SKYLINE_HEIGHT - building.height, width: building.width, height: building.height + 2 }));
      const roof = roofDetail(building);
      if(roof) group.appendChild(roof);
      building.windows.forEach(function(w){
        const light = svgElement('rect', { x: w.x, y: w.y, width: w.size, height: w.size, class: w.flicker ? 'window flicker' : 'window' });
        if(w.flicker) light.style.animationDelay = `${w.delay}s`;
        group.appendChild(light);
      });
    });
    svg.appendChild(group);
  });
  container.replaceChildren(svg);
}
