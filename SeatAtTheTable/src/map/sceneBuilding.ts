import { TREE_SCALE } from './scale';
import type { DiagonalRoad, HorizontalRoad, Landmark, VerticalRoad } from './world';
import { createOutskirtSceneryLayout } from './outskirtScenery';
import { buildCountryBuilding } from './countryBuildings';
import type { PlaceArchetype } from './archetypes';
import { ribbonGeometry } from './ribbon';
import { TRAILS, TRAIL_WIDTH } from './trails';
import { applyShoreFoam, applyWaterWaves } from './waterShader';
import { buildTerrainMesh } from '../world/render/terrain';

import { districtIdAtPlayablePoint, roadDeadEnds, roadLandSegments, windhavenMapModel, type RoadPath } from './mapModel';
import { boundsForPoints, isPointInWater } from './geometry';
import { mapTerrainTheme, mapTransportTheme } from './renderTheme';
import { addInstancedMesh, createMapSceneMaterials, type MapSceneMaterialCache, type SceneInstance } from './scenePerformance';
import type { Point } from '../config/types';
import type * as ThreeNamespace from 'three';

export interface RoadNetworkRenderData {
  vertical: VerticalRoad[];
  horizontal: HorizontalRoad[];
  diagonal: DiagonalRoad[];
}

export interface BaseSceneOptions {
  THREE: typeof ThreeNamespace;
  worldGroup: ThreeNamespace.Group;
  worldWidth: number;
  worldHeight: number;
  materials?: MapSceneMaterialCache;
}

export interface RoadSceneOptions extends BaseSceneOptions {
  roadNetwork: RoadNetworkRenderData;
  buildIntersectionFurniture: (x: number, z: number) => void;
}

export interface SceneRenderHelpers {
  box: (w: number, h: number, d: number, color: number | string) => ThreeNamespace.Mesh;
  addSign: (parent: ThreeNamespace.Object3D, text: string, w: number, h: number, y: number, color: string) => void;
}

export interface TreeSceneOptions extends BaseSceneOptions {
  roadNetwork: RoadNetworkRenderData;
  districtOffsets: Record<string, number>;
  seededRandom: (seed: number) => () => number;
  // LEGAL: Filled with every tree's position, so collision can make the trunks solid.
  treeSpots: Point[];
}

export interface LandmarkSceneOptions extends BaseSceneOptions {
  landmarks: Landmark[];
  helpers: SceneRenderHelpers;
  // LEGAL: The Blender model for an archetype, or null when the models didn't load.
  buildPlaceModel?: (archetype: PlaceArchetype, color: string, w: number, h: number, d: number) => ThreeNamespace.Group | null;
  // LEGAL: A landmark's Blender model by name (art/blender/landmarks.py), or null when it didn't load.
  landmarkModel?: (name: string) => ThreeNamespace.Group | null;
}

function shapeFromPoints(THREE: typeof ThreeNamespace, points: Array<{ x: number; y: number }>): ThreeNamespace.Shape {
  const shape = new THREE.Shape();
  points.forEach(function(point, index){
    if(index === 0) shape.moveTo(point.x, point.y);
    else shape.lineTo(point.x, point.y);
  });
  shape.closePath();
  return shape;
}

function materialsFor(options: BaseSceneOptions): MapSceneMaterialCache {
  return options.materials ?? createMapSceneMaterials(options.THREE);
}

function addGroundShape(options: BaseSceneOptions, points: Array<{ x: number; y: number }>, color: string, height: number, roughness: number): ThreeNamespace.Mesh {
  const { THREE, worldGroup } = options;
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shapeFromPoints(THREE, points)), materialsFor(options).standard(`ground:${color}:${roughness}`, {color, roughness, metalness:0.08, side:THREE.DoubleSide}));
  mesh.rotation.x=Math.PI/2;
  mesh.position.y=height;
  mesh.receiveShadow=true;
  worldGroup.add(mesh);
  return mesh;
}

function addWaterShape(options: BaseSceneOptions, points: Array<{ x: number; y: number }>, height: number): ThreeNamespace.Mesh {
  const { THREE, worldGroup } = options;
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shapeFromPoints(THREE, points)), applyWaterWaves(materialsFor(options).standard('terrain:river-water', {
    color:mapTerrainTheme.canalWater,
    emissive:mapTerrainTheme.waterEmissive,
    emissiveIntensity:0.32,
    roughness:0.16,
    metalness:0.2,
    side:THREE.DoubleSide,
  })));
  mesh.rotation.x = Math.PI/2;
  mesh.position.y = height;
  mesh.receiveShadow = true;
  mesh.renderOrder = 2;
  worldGroup.add(mesh);
  return mesh;
}

function addPathLineDashes(points: Point[], spacing: number, inset: number, callback: (x: number, y: number, angle: number) => void): void {
  points.slice(0, -1).forEach(function(start, index){
    const end = points[index + 1];
    const dx = end.x-start.x;
    const dy = end.y-start.y;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    for(let t=inset; t<length-inset; t+=spacing){
      callback(start.x + Math.cos(angle)*t, start.y + Math.sin(angle)*t, angle);
    }
  });
}

export function buildBaseGround(options: BaseSceneOptions): void {
  const { THREE, worldGroup } = options;
  const materials = materialsFor(options);
  // LEGAL: Sized from the landmass rather than from worldWidth/worldHeight. Those describe
  // LEGAL: the CITY, and the land now runs a long way north of it around the lake — a plane
  // LEGAL: centred on the city left the northern outskirts hanging over nothing.
  const land = boundsForPoints(windhavenMapModel.landmass);
  const oceanW = (land.maxX - land.minX) + 1400;
  const oceanD = (land.maxY - land.minY) + 1400;
  const waterBase = new THREE.Mesh(new THREE.PlaneGeometry(oceanW, oceanD), applyWaterWaves(materials.standard('terrain:open-water', {color:mapTerrainTheme.openWater, emissive:mapTerrainTheme.waterEmissive, emissiveIntensity:0.26, roughness:0.18, metalness:0.18})));
  waterBase.rotation.x=-Math.PI/2; waterBase.position.set((land.minX+land.maxX)/2, -0.04, (land.minY+land.maxY)/2); waterBase.receiveShadow=true; waterBase.renderOrder = 0; worldGroup.add(waterBase);
  // LEGAL: One terrain mesh cut to the coast, coloured by the zoning field (world/render/terrain).
  worldGroup.add(buildTerrainMesh(THREE));
  // LEGAL: No hairline coastline or outline strokes: 1-pixel lines alias and flicker at any
  // LEGAL: distance, and the outlines drew across the canal mouths and out over the water. The
  // LEGAL: surf is a strip with real width instead (buildShoreFoam).
  buildShoreFoam(options);
}

// LEGAL: Foam breaking along the coast and the lake shore. Each strip is pushed half its width out
// LEGAL: over the water (asked of the map's own water test, so it can't land on the beach) and laid
// LEGAL: just above that water's surface: the sea at -0.04, the lake at 0.06.
const FOAM_WIDTH = 14;
export function shoreFoamPath(shore: Point[], width = FOAM_WIDTH): Point[] {
  const closed = [...shore, shore[0]];
  return closed.map(function(point, i){
    const prev = closed[Math.max(0, i - 1)], next = closed[Math.min(closed.length - 1, i + 1)];
    const len = Math.hypot(next.x - prev.x, next.y - prev.y) || 1;
    const nx = -(next.y - prev.y) / len, ny = (next.x - prev.x) / len;
    const toWater = isPointInWater({ x:point.x + nx * width, y:point.y + ny * width }, 0) ? 1 : -1;
    return { x:point.x + nx * toWater * width / 2, y:point.y + ny * toWater * width / 2 };
  });
}

function buildShoreFoam(options: BaseSceneOptions): void {
  const { THREE, worldGroup } = options;
  const material = applyShoreFoam(new THREE.MeshBasicMaterial({ color:'#eef7fa', transparent:true, opacity:0.55, depthWrite:false }));
  [[windhavenMapModel.landmass, -0.03], [windhavenMapModel.lake, 0.07]].forEach(function([shore, height]){
    const foam = new THREE.Mesh(ribbonGeometry(THREE, shoreFoamPath(shore as Point[]), FOAM_WIDTH, height as number), material);
    foam.name = 'water:foam';
    foam.renderOrder = 3;
    worldGroup.add(foam);
  });
}

// LEGAL: Where the canal walls start: just past the beach, so they don't run out into the lake.
const CANAL_WALL_START = 190;

export function buildCanalWater(options: BaseSceneOptions): void {
  const { THREE, worldGroup } = options;
  const materials = materialsFor(options);
  const canalMat = applyWaterWaves(materials.standard('terrain:canal-water', {color:mapTerrainTheme.canalWater, emissive:mapTerrainTheme.waterEmissive, emissiveIntensity:0.32, roughness:0.16, metalness:0.2}));
  const bankMat = materials.standard('transport:canal-bank', {color:mapTransportTheme.seawall, roughness:0.85});
  windhavenMapModel.canals.forEach(function(channel){
    // LEGAL: The water reaches a little into the lake so the mouth has no seam, and stops at the
    // LEGAL: canal's real southern end instead of running the whole height of the world.
    const top = channel.top - 80;
    const length = channel.bottom - top;
    const canal = new THREE.Mesh(new THREE.PlaneGeometry(channel.width, length), canalMat);
    // LEGAL: Above the beach sand (0.09), not below it: the resort strip crosses both canal mouths.
    canal.rotation.x=-Math.PI/2; canal.position.set(channel.x+channel.width/2, 0.12, top + length/2); canal.renderOrder = 3; worldGroup.add(canal);
    // LEGAL: Walls along both banks, broken where each bridge lands so the deck has nothing
    // LEGAL: poking through it, plus a wall across the southern end.
    const gaps = windhavenMapModel.bridges
      .filter(bridge => Math.abs(bridge.path[0].x - channel.x) < 1)
      .map(bridge => ({ from:bridge.path[0].y - bridge.width/2 - 4, to:bridge.path[0].y + bridge.width/2 + 4 }))
      .sort((a, b) => a.from - b.from);
    const runs: Array<{ from: number; to: number }> = [];
    let cursor = channel.top + CANAL_WALL_START;
    gaps.forEach(function(gap){ if(gap.from > cursor) runs.push({ from:cursor, to:gap.from }); cursor = Math.max(cursor, gap.to); });
    runs.push({ from:cursor, to:channel.bottom });
    [channel.x+8, channel.x+channel.width-8].forEach(function(x){
      runs.forEach(function(run){
        const wall = new THREE.Mesh(new THREE.BoxGeometry(12, 4, run.to - run.from), bankMat);
        wall.position.set(x, 2, (run.from + run.to) / 2);
        wall.receiveShadow = true;
        wall.name = `canal-wall:${channel.name}`;
        worldGroup.add(wall);
      });
    });
    const endWall = new THREE.Mesh(new THREE.BoxGeometry(channel.width, 4, 12), bankMat);
    endWall.position.set(channel.x + channel.width/2, 2, channel.bottom + 6);
    endWall.name = `canal-wall:${channel.name}`;
    worldGroup.add(endWall);
  });
}

// LEGAL: Joins a road's consecutive pieces (each piece ends where the next begins) into one path.
function joinRoadRuns(segments: Array<{ road: RoadPath; path: Point[] }>): Array<{ road: RoadPath; path: Point[] }> {
  const runs: Array<{ road: RoadPath; path: Point[] }> = [];
  segments.forEach(function(segment){
    const last = runs[runs.length - 1];
    const tail = last?.path[last.path.length - 1];
    if(last && last.road === segment.road && tail && Math.hypot(tail.x - segment.path[0].x, tail.y - segment.path[0].y) < 0.5){
      last.path.push(...segment.path.slice(1));
    } else {
      runs.push({ road:segment.road, path:[...segment.path] });
    }
  });
  return runs;
}

// LEGAL: Country lanes that run through somewhere built up are paved like a street: Lakeridge Lane
// LEGAL: is the suburb's main street (map/suburb). They stay country lanes for the GPS and traffic.
const PAVED_LANES = new Set(['road-country-lakeridge']);

export function buildRoadNetwork(options: RoadSceneOptions): void {
  const { THREE, worldGroup, roadNetwork } = options;
  const materials = materialsFor(options);
  const laneMat = materials.standard('transport:lane', {color:mapTransportTheme.lane, roughness:0.6, emissive:'#4a4020', emissiveIntensity:0.15});
  const crosswalkMat = materials.standard('transport:crosswalk', {color:mapTransportTheme.crosswalk, roughness:0.76});
  const laneDashes: SceneInstance[] = [];
  const crosswalkLong: SceneInstance[] = [];
  const crosswalkWide: SceneInstance[] = [];
  joinRoadRuns(roadLandSegments()).forEach(function(segment){
    const road = segment.road;
    if(road.roadClass === 'country' && !PAVED_LANES.has(road.id)){
      // LEGAL: Dirt lanes: a worn verge either side and packed earth down the middle. No kerbs,
      // LEGAL: no lane paint. One ribbon each, so the curves have no seams.
      const verge = new THREE.Mesh(ribbonGeometry(THREE, segment.path, road.width + 18, 0.045), materials.standard('transport:lane-verge', { color:'#6f6a42', roughness:1 }));
      const dirt = new THREE.Mesh(ribbonGeometry(THREE, segment.path, road.width, 0.06), materials.standard('transport:dirt', { color:'#8a6f4b', roughness:1 }));
      [verge, dirt].forEach(function(mesh){ mesh.receiveShadow = true; mesh.name = `road:${road.id}`; worldGroup.add(mesh); });
      return;
    }
    // LEGAL: One ribbon per run of road, so a curved street is a smooth strip rather than a row of
    // LEGAL: rectangles with wedge gaps at every bend.
    const sidewalk = new THREE.Mesh(ribbonGeometry(THREE, segment.path, road.width + (road.roadClass === 'arterial' ? 34 : 22), 0.04), materials.standard(`path:${mapTransportTheme.sidewalk}:0.92`, { color:mapTransportTheme.sidewalk, roughness:0.92 }));
    const surfaceColor = road.roadClass === 'arterial' ? mapTransportTheme.arterialSurface : mapTransportTheme.roadSurface;
    const surface = new THREE.Mesh(ribbonGeometry(THREE, segment.path, road.width, 0.06), materials.standard(`path:${surfaceColor}:0.9`, { color:surfaceColor, roughness:0.9 }));
    [sidewalk, surface].forEach(function(mesh){ mesh.receiveShadow = true; mesh.name = `road:${road.id}`; worldGroup.add(mesh); });
    addPathLineDashes(segment.path, 94, 40, function(x, y, angle){
      laneDashes.push({
        x,
        y:0.075,
        z:y,
        rotationX:-Math.PI/2,
        rotationZ:-angle,
      });
    });
  });
  roadNetwork.vertical.forEach(function(v, vi){
    roadNetwork.horizontal.forEach(function(h, hi){
      for(let offset=-18; offset<=18; offset+=12){
        crosswalkLong.push({ x:v.x + offset, y:0.09, z:h.y - v.w/2 - 10, rotationX:-Math.PI/2 });
        crosswalkLong.push({ x:v.x + offset, y:0.09, z:h.y + v.w/2 + 10, rotationX:-Math.PI/2 });
      }
      for(let offset=-18; offset<=18; offset+=12){
        crosswalkWide.push({ x:v.x - h.w/2 - 10, y:0.091, z:h.y + offset, rotationX:-Math.PI/2 });
        crosswalkWide.push({ x:v.x + h.w/2 + 10, y:0.091, z:h.y + offset, rotationX:-Math.PI/2 });
      }
      options.buildIntersectionFurniture(v.x, h.y);
    });
  });
  // LEGAL: Streets that join nothing end in a turning circle with a dead-end sign, instead of a
  // LEGAL: flat cut into the grass.
  const signPostMat = materials.standard('transport:sign-post', { color:'#8d939c', roughness:0.5, metalness:0.6 });
  const signFaceMat = materials.standard('transport:sign-dead-end', { color:'#f2c230', roughness:0.55 });
  roadDeadEnds().forEach(function(end){
    const radius = end.road.width * 0.82;
    const kerb = new THREE.Mesh(new THREE.CircleGeometry(radius + 11, 28), materials.standard(`path:${mapTransportTheme.sidewalk}:0.92`, { color:mapTransportTheme.sidewalk, roughness:0.92 }));
    const tarmac = new THREE.Mesh(new THREE.CircleGeometry(radius, 28), materials.standard(`path:${mapTransportTheme.roadSurface}:0.9`, { color:mapTransportTheme.roadSurface, roughness:0.9 }));
    kerb.rotation.x = tarmac.rotation.x = -Math.PI/2;
    kerb.position.set(end.point.x, 0.04, end.point.y);
    tarmac.position.set(end.point.x, 0.06, end.point.y);
    [kerb, tarmac].forEach(function(mesh){ mesh.receiveShadow = true; mesh.name = `road:dead-end:${end.road.id}`; worldGroup.add(mesh); });
    // LEGAL: The sign stands at the kerb on the driver's right as they enter the turning circle.
    const side = { x:-end.direction.y, y:end.direction.x };
    const at = { x:end.point.x - end.direction.x * radius * 1.1 + side.x * (end.road.width / 2 + 8), y:end.point.y - end.direction.y * radius * 1.1 + side.y * (end.road.width / 2 + 8) };
    const sign = new THREE.Group();
    sign.name = 'sign:dead-end';
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 26, 8), signPostMat);
    post.position.y = 13; post.castShadow = true; sign.add(post);
    const face = new THREE.Mesh(new THREE.BoxGeometry(11, 11, 0.8), signFaceMat);
    face.position.y = 26; face.rotation.z = Math.PI / 4; face.castShadow = true; sign.add(face);
    sign.position.set(at.x, 0, at.y);
    sign.rotation.y = Math.atan2(-end.direction.x, -end.direction.y);
    worldGroup.add(sign);
  });
  addInstancedMesh(THREE, worldGroup, new THREE.PlaneGeometry(48,3), laneMat, laneDashes);
  addInstancedMesh(THREE, worldGroup, new THREE.PlaneGeometry(46,4), crosswalkMat, crosswalkLong);
  addInstancedMesh(THREE, worldGroup, new THREE.PlaneGeometry(4,46), crosswalkMat, crosswalkWide);
}

export function buildCanalBridges(options: BaseSceneOptions): void {
  const { THREE, worldGroup } = options;
  const materials = materialsFor(options);
  const deckMat = materials.standard('transport:bridge-deck', {color:mapTransportTheme.bridgeDeck, roughness:0.7});
  const railMat = materials.standard('transport:bridge-rail', {color:mapTransportTheme.bridgeRail, roughness:0.58, metalness:0.18});
  windhavenMapModel.bridges.forEach(function(bridge){
    const start = bridge.path[0];
    const end = bridge.path[1];
    const length = Math.hypot(end.x-start.x, end.y-start.y);
    const ry = start.y;
    // LEGAL: The deck overhangs each bank a little so the road runs onto it without a seam.
    const deck = new THREE.Mesh(new THREE.BoxGeometry(length + 24,4,bridge.width), deckMat);
    deck.position.set((start.x+end.x)/2,2,ry); worldGroup.add(deck);
    [-bridge.width/2+6, bridge.width/2-6].forEach(function(zOffset){
      const rail = new THREE.Mesh(new THREE.BoxGeometry(length,4,4), railMat);
      rail.position.set((start.x+end.x)/2,14,ry+zOffset);
      worldGroup.add(rail);
    });
    for(let rx=start.x+30; rx<end.x-20; rx+=60){
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(4,18,4), railMat);
      p1.position.set(rx,10,ry-bridge.width/2+4); worldGroup.add(p1);
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(4,18,4), railMat);
      p2.position.set(rx,10,ry+bridge.width/2-4); worldGroup.add(p2);
    }
  });
}

function buildStreetTree(options: BaseSceneOptions, x: number, z: number, size: number): void {
  const { THREE, worldGroup } = options;
  const materials = materialsFor(options);
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.2*size,2.8*size,15*size,7), materials.standard('prop:tree-trunk', {color:'#4a3624', roughness:0.9}));
  trunk.position.set(0,7.5*size,0); trunk.castShadow=true; group.add(trunk);
  const crownKey = size > 1.08 ? 'prop:tree-crown-large' : 'prop:tree-crown-small';
  const crownMat = materials.standard(crownKey, {color:size > 1.08 ? '#2f6a3d' : '#365c34', roughness:0.95});
  const crown = new THREE.Mesh(new THREE.SphereGeometry(12*size,12,9), crownMat);
  crown.scale.set(1.05,0.9,1); crown.position.set(0,22*size,0); crown.castShadow=true; group.add(crown);
  const lower = new THREE.Mesh(new THREE.SphereGeometry(8*size,10,8), crownMat);
  lower.position.set(5*size,17*size,-4*size); lower.castShadow=true; group.add(lower);
  group.position.set(x,0,z);
  worldGroup.add(group);
}

export function buildStreetTrees(options: TreeSceneOptions): void {
  ['devlin','westside','hub'].forEach(function(distId){
    const off = options.districtOffsets[distId];
    const rand = options.seededRandom(off + 4307);
    options.roadNetwork.horizontal.forEach(function(r){
      for(let x=off+95; x<off+1405; x+=125){
        if(options.roadNetwork.vertical.some(v=>Math.abs(x-v.x)<72)) continue;
        const side = rand() > 0.5 ? -1 : 1;
        const treeX = x + (rand()-0.5)*18;
        const treeY = r.y + side*58 + (rand()-0.5)*14;
        if(districtIdAtPlayablePoint({ x:treeX, y:treeY }, 8) === distId){ buildStreetTree(options, treeX, treeY, (0.78 + rand()*0.45) * TREE_SCALE); options.treeSpots.push({ x:treeX, y:treeY }); }
      }
    });
    options.roadNetwork.vertical.filter(v=>v.x>off && v.x<off+1500).forEach(function(v){
      for(let y=95; y<options.worldHeight-95; y+=155){
        if(options.roadNetwork.horizontal.some(r=>Math.abs(y-r.y)<82)) continue;
        const side = rand() > 0.5 ? -1 : 1;
        const treeX = v.x + side*50 + (rand()-0.5)*12;
        const treeY = y + (rand()-0.5)*18;
        if(districtIdAtPlayablePoint({ x:treeX, y:treeY }, 8) === distId){ buildStreetTree(options, treeX, treeY, (0.72 + rand()*0.38) * TREE_SCALE); options.treeSpots.push({ x:treeX, y:treeY }); }
      }
    });
  });
}

export function buildOutskirtScenery(options: BaseSceneOptions): void {
  const { THREE, worldGroup } = options;
  const materials = materialsFor(options);
  // LEGAL: Footpaths (map/trails): one worn ribbon each, lighter at the middle where feet go.
  TRAILS.forEach(function(trail){
    const edge = new THREE.Mesh(ribbonGeometry(THREE, trail.path, TRAIL_WIDTH + 6, 0.05), materials.standard('transport:trail-edge', { color:'#6a5a3e', roughness:1 }));
    const worn = new THREE.Mesh(ribbonGeometry(THREE, trail.path, TRAIL_WIDTH - 4, 0.055), materials.standard('transport:trail', { color:'#8a7452', roughness:1 }));
    [edge, worn].forEach(function(mesh){ mesh.receiveShadow = true; mesh.name = `trail:${trail.id}`; worldGroup.add(mesh); });
  });
  const trees: SceneInstance[] = [];
  const trunks: SceneInstance[] = [];
  const regions = new Map<string, ThreeNamespace.Group>();
  let variant = 0;
  createOutskirtSceneryLayout().forEach(function(item){
    if(item.kind === 'tree'){
      trunks.push({ x:item.x, y:6, z:item.y, rotationY:item.rotation });
      trees.push({ x:item.x, y:20, z:item.y, rotationY:item.rotation });
      return;
    }
    // LEGAL: Built to look like what it is (map/countryBuildings), and gathered into one group per
    // LEGAL: region so the whole region merges into a handful of draw calls.
    const building = buildCountryBuilding(THREE, materials, item.kind, variant++);
    building.position.set(item.x, 0, item.y);
    building.rotation.y = item.rotation;
    let region = regions.get(item.regionId);
    if(!region){
      region = new THREE.Group();
      region.name = `outskirt:${item.regionId}:buildings`;
      regions.set(item.regionId, region);
      worldGroup.add(region);
    }
    region.add(building);
  });
  addInstancedMesh(THREE, worldGroup, new THREE.CylinderGeometry(2, 2.5, 12, 6), materials.standard('outskirt:tree-trunk', { color:'#5c4930', roughness:1 }), trunks, { cast:true });
  addInstancedMesh(THREE, worldGroup, new THREE.ConeGeometry(12, 27, 7), materials.standard('outskirt:tree-canopy', { color:'#325f38', roughness:0.94 }), trees, { cast:true });
}

export function buildLandmarks(options: LandmarkSceneOptions): void {
  const { THREE, landmarks, helpers } = options;
  const materials = materialsFor(options);
  landmarks.forEach(function(lm){
    // LEGAL: A landmark is ONE object. These used to be loose meshes in the world, so a dome
    // LEGAL: read as a block hanging in the air above an unrelated base and a water tank read
    // LEGAL: as floating above its own legs. Grouped, each landmark measures as the whole
    // LEGAL: silhouette it actually is.
    const worldGroup = new THREE.Group();
    worldGroup.name = `landmark:${lm.id}`;
    options.worldGroup.add(worldGroup);
    if(lm.id==='devlinHall'){
      // LEGAL: A civic hall under its dome: the same model as City Hall when the models are loaded.
      const base = options.buildPlaceModel?.('civic', '#8a7a5a', 70, 26, 70) ?? helpers.box(70,26,70,'#6a5b3e'); base.position.set(lm.x,13,lm.y); worldGroup.add(base);
      const steps = helpers.box(84,6,84,'#565049'); steps.position.set(lm.x,3,lm.y); worldGroup.add(steps);
      const modelled = options.landmarkModel?.('dome');
      if(modelled){ modelled.position.set(lm.x,26,lm.y); worldGroup.add(modelled); }
      else {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(30,20,14,0,Math.PI*2,0,Math.PI/2), materials.standard('landmark:civic-dome', {color:'#c9a227', metalness:0.6, roughness:0.3}));
        dome.position.set(lm.x,26,lm.y); dome.castShadow=true; worldGroup.add(dome);
        const finial = new THREE.Mesh(new THREE.ConeGeometry(3,14,8), materials.standard('landmark:civic-finial', {color:'#e0c860', metalness:0.7, roughness:0.2}));
        finial.position.set(lm.x,52,lm.y); worldGroup.add(finial);
      }
      helpers.addSign(base,lm.name,44,9,36,'#ffe6a0');
    } else if(lm.id==='ciceroWorks' && options.landmarkModel?.('water-tower')){
      const tower = options.landmarkModel('water-tower')!;
      tower.position.set(lm.x,0,lm.y); worldGroup.add(tower);
      helpers.addSign(tower,lm.name,44,9,106,'#f0c0a0');
    } else if(lm.id==='ciceroWorks'){
      const legMat = materials.standard('landmark:water-tower-leg', {color:'#3a3d47', roughness:0.7});
      const tankMat = materials.standard('landmark:water-tower-tank', {color:'#7a3b32', roughness:0.8});
      [[-16,-16],[16,-16],[-16,16],[16,16]].forEach(function(p){
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,60,6), legMat);
        leg.position.set(lm.x+p[0],30,lm.y+p[1]); leg.castShadow=true; worldGroup.add(leg);
      });
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(24,24,30,14), tankMat);
      tank.position.set(lm.x,74,lm.y); tank.castShadow=true; worldGroup.add(tank);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(26,14,14), tankMat);
      cap.position.set(lm.x,95,lm.y); worldGroup.add(cap);
      helpers.addSign(tank,lm.name,44,9,28,'#f0c0a0');
    } else if(lm.id==='thePotato' && options.landmarkModel?.('potato')){
      const potato = options.landmarkModel('potato')!;
      potato.position.set(lm.x,0,lm.y); worldGroup.add(potato);
      helpers.addSign(potato,lm.name,44,9,48,'#dfe7ef');
    } else if(lm.id==='thePotato'){
      // LEGAL: The Potato — a squashed mirror-polished blob on a low plaza. High metalness
      // LEGAL: and near-zero roughness so it picks up the skyline the way the real thing does.
      const plaza = helpers.box(120,3,100,'#5b5a55');
      plaza.position.set(lm.x,1.5,lm.y); worldGroup.add(plaza);
      const chromeMat = materials.standard('landmark:potato-chrome', {color:'#cfd6dd', metalness:1, roughness:0.06});
      const blob = new THREE.Mesh(new THREE.SphereGeometry(26,28,20), chromeMat);
      // LEGAL: Squashed vertically and stretched along x — a potato, not a sphere.
      blob.scale.set(1.35,0.62,0.95);
      blob.position.set(lm.x,17,lm.y); blob.castShadow=true; worldGroup.add(blob);
      // LEGAL: The underside arch you can walk beneath.
      const arch = new THREE.Mesh(new THREE.TorusGeometry(11,4.2,10,18,Math.PI), chromeMat);
      arch.position.set(lm.x,6,lm.y); arch.rotation.x = -Math.PI/2; arch.rotation.z = Math.PI; worldGroup.add(arch);
      helpers.addSign(blob,lm.name,44,9,30,'#dfe7ef');
    }
  });
}

// LEGAL: ---- Beach paradise on the lake's south shore ----
// LEGAL: The water north of the city was called a lake while being wide open to the ocean
// LEGAL: that surrounds the whole map, which makes it a bay, not a lake. It is enclosed now,
// LEGAL: so the shore is a resort strip: palms, loungers, parasols and a couple of jetties.
// LEGAL: Placed along the SAME shoreline points the sand is cut from, so the furniture can
// LEGAL: never end up floating on the water or stranded inland the way the old hard-coded
// LEGAL: piers did once the coast moved.
function buildBeachResort(options: BaseSceneOptions): void {
  const { THREE, worldGroup } = options;
  const materials = materialsFor(options);
  const shore = windhavenMapModel.lakefrontBeach;
  // LEGAL: First half of the ring is the waterline; the return leg is the inland edge.
  const waterline = shore.slice(0, Math.floor(shore.length / 2));

  const trunkMat = materials.standard('resort:palm-trunk', { color:'#8a6f4a', roughness:0.9 });
  const frondMat = materials.standard('resort:palm-frond', { color:'#3f8a4a', roughness:0.8 });
  const loungerMat = materials.standard('resort:lounger', { color:'#e8e2d2', roughness:0.7 });
  const parasolMats = [
    materials.standard('resort:parasol-a', { color:'#d9524a', roughness:0.65 }),
    materials.standard('resort:parasol-b', { color:'#2f8fa8', roughness:0.65 }),
    materials.standard('resort:parasol-c', { color:'#e6b23c', roughness:0.65 }),
  ];

  waterline.slice(0, -1).forEach(function(start, index){
    const end = waterline[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const angle = Math.atan2(dy, dx);
    // LEGAL: Inland normal, so everything sits BEHIND the waterline rather than in the lake.
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);

    for(let t = 40; t < length - 40; t += 96){
      const bx = start.x + Math.cos(angle) * t;
      const by = start.y + Math.sin(angle) * t;
      const wave = Math.sin(index * 5.4 + t * 0.05);
      // LEGAL: The shore ring runs straight across both canal mouths, so a naive walk down it
      // LEGAL: plants palms and loungers in the canal. Asked of the world's own water rule
      // LEGAL: rather than a hand-picked x range, so new canals cannot reintroduce this.
      if(isPointInWater({ x: bx + nx * 16, y: by + ny * 16 }, 14)) continue;
      if(isPointInWater({ x: bx + nx * 40, y: by + ny * 40 }, 14)) continue;

      // LEGAL: Palm. The fronds were cones radiating from the crown, which read as a sea
      // LEGAL: urchin on a stick. A frond is a long flat blade that ARCHES: it leaves the
      // LEGAL: crown rising and its tip falls below where it started. Built as a segmented
      // LEGAL: strip so the arch is a curve rather than one tilted spike.
      const palm = new THREE.Group();
      const lean = wave * 0.12;
      const trunkH = 30 + Math.abs(wave) * 8;
      // LEGAL: Stacked segments so the trunk curves with the lean instead of shearing.
      const segments = 5;
      for(let t = 0; t < segments; t += 1){
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(1.5 + (segments - t) * 0.22, 1.7 + (segments - t) * 0.26, trunkH / segments + 0.6, 7), trunkMat);
        const frac = t / segments;
        seg.position.set(Math.sin(lean) * frac * trunkH * 0.5, trunkH * (frac + 0.5 / segments), 0);
        seg.rotation.z = lean;
        seg.castShadow = true;
        palm.add(seg);
      }
      const crownX = Math.sin(lean) * trunkH * 0.5;
      const crownY = trunkH;
      for(let f = 0; f < 7; f += 1){
        const spin = (f / 7) * Math.PI * 2 + wave;
        const frond = new THREE.Group();
        const blades = 4;
        for(let b = 0; b < blades; b += 1){
          const along = b / blades;
          // LEGAL: Rises then falls — the arch. Width tapers to the tip.
          const drop = -14 * along * along + 5 * along;
          const width = 3.4 * (1 - along * 0.72);
          const blade = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.5, width), frondMat);
          blade.position.set(4 + along * 20, drop, 0);
          blade.rotation.z = -0.5 * along - 0.12;
          blade.castShadow = true;
          frond.add(blade);
        }
        frond.rotation.y = spin;
        frond.position.set(crownX, crownY, 0);
        palm.add(frond);
      }
      // LEGAL: A couple of coconuts tucked under the crown.
      [0.6, 2.4].forEach(function(angle){
        const nut = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), trunkMat);
        nut.position.set(crownX + Math.cos(angle + wave) * 3, crownY - 2.2, Math.sin(angle + wave) * 3);
        palm.add(nut);
      });
      palm.position.set(bx + nx * 40, 0, by + ny * 40);
      palm.name = 'resort:palm';
      worldGroup.add(palm);

      // LEGAL: A pair of loungers under a parasol, closer to the water than the palms.
      const set = new THREE.Group();
      [-7, 7].forEach(function(offset){
        const lounger = new THREE.Mesh(new THREE.BoxGeometry(13, 2, 5), loungerMat);
        lounger.position.set(offset, 3, 0);
        lounger.rotation.y = wave * 0.2;
        lounger.castShadow = true;
        set.add(lounger);
        const back = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 5), loungerMat);
        back.position.set(offset - 5, 5.4, 0);
        back.rotation.z = -0.6;
        set.add(back);
      });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 17, 5), trunkMat);
      pole.position.y = 8.5;
      set.add(pole);
      // LEGAL: Was a 13-radius, 6-deep cone — a mushroom cap twice the size of the loungers
      // LEGAL: under it. A parasol is wide and SHALLOW, and it is open underneath.
      const parasol = new THREE.Mesh(new THREE.ConeGeometry(8.5, 2.6, 10, 1, true), parasolMats[index % parasolMats.length]);
      parasol.material.side = THREE.DoubleSide;
      parasol.position.y = 18;
      parasol.castShadow = true;
      set.add(parasol);
      set.position.set(bx + nx * 16, 0, by + ny * 16);
      set.rotation.y = -angle;
      set.name = 'resort:loungers';
      worldGroup.add(set);
    }
  });
}

export function buildRailAndRiver(options: BaseSceneOptions): void {
  const { THREE, worldGroup, worldHeight } = options;
  const materials = materialsFor(options);
  windhavenMapModel.railLines.forEach(function(line){
    const start = line.path[0];
    const end = line.path[1];
    const length = Math.hypot(end.x-start.x, end.y-start.y);
    const rail = new THREE.Mesh(new THREE.PlaneGeometry(line.width, length), materials.standard('transport:rail-bed', {color:'#2a2a2e', roughness:1}));
    rail.rotation.x=-Math.PI/2; rail.position.set(start.x,0.06,(start.y+end.y)/2); rail.receiveShadow=true; worldGroup.add(rail);
    [-9,9].forEach(function(offset){
      const steel = new THREE.Mesh(new THREE.BoxGeometry(3,3,length), materials.standard('transport:rail-steel', {color:'#a6a99e', roughness:0.38, metalness:0.55}));
      steel.position.set(start.x + offset, 2.1, (start.y + end.y) / 2);
      steel.castShadow = true;
      worldGroup.add(steel);
    });
    const ties: SceneInstance[] = [];
    for(let ty=20;ty<worldHeight;ty+=26){
      ties.push({ x:start.x, y:1, z:ty });
    }
    addInstancedMesh(THREE, worldGroup, new THREE.BoxGeometry(line.width-4,2,4), materials.standard('transport:rail-tie', {color:'#3a3530', roughness:0.85, metalness:0.05}), ties, { cast:true, receive:true });
  });
  addWaterShape(options, windhavenMapModel.lake, 0.06);
  addGroundShape(options, windhavenMapModel.lakefrontBeach, '#d8c489', 0.09, 1);
  buildBeachResort(options);
  const pierMat = materials.standard('waterfront:pier', {color:'#736d5c', roughness:0.86});
  const pierLightMat = materials.standard('waterfront:pier-light', {color:'#343840', roughness:0.55});
  [4380, 4920, 5360].forEach(function(x, index){
    const pier = new THREE.Mesh(new THREE.BoxGeometry(130 + index*28, 5, 24), pierMat);
    pier.position.set(x, 2.5, 104 + index*12);
    pier.rotation.y = index === 1 ? -0.08 : 0.05;
    pier.castShadow = true;
    pier.receiveShadow = true;
    worldGroup.add(pier);
    const light = new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,18,7), pierLightMat);
    light.position.set(x + 44, 12, 104 + index*12);
    worldGroup.add(light);
  });
  // LEGAL: The concrete seawall that used to run along here belonged to a working
  // LEGAL: waterfront. This shore is a resort beach now — sand meets water directly.

}
