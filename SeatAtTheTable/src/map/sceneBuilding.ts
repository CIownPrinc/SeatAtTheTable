import type { DiagonalRoad, HorizontalRoad, Landmark, VerticalRoad } from './world';
import { windhavenMapModel } from './mapModel';
import { mapTerrainTheme, mapTransportTheme, terrainForDistrict } from './renderTheme';
import type { FillerItem, MapZoneType } from '../config/types';
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
}

export interface RoadSceneOptions extends BaseSceneOptions {
  roadNetwork: RoadNetworkRenderData;
  buildIntersectionFurniture: (x: number, z: number, index: number) => void;
}

export interface SceneRenderHelpers {
  box: (w: number, h: number, d: number, color: number | string) => ThreeNamespace.Mesh;
  addSign: (parent: ThreeNamespace.Object3D, text: string, w: number, h: number, y: number, color: string) => void;
}

export interface FillerSceneHelpers extends SceneRenderHelpers {
  buildDetailedBuilding: (w: number, h: number, d: number, color: number | string, zoneType: string, variant: number) => ThreeNamespace.Group;
  renderZoneType: (zone: MapZoneType) => string;
  seededRandom: (seed: number) => () => number;
}

export interface FillerSceneOptions extends BaseSceneOptions {
  districtOffsets: Record<string, number>;
  fillerFor: (districtId: string) => FillerItem[];
  helpers: FillerSceneHelpers;
}

export interface TreeSceneOptions extends BaseSceneOptions {
  roadNetwork: RoadNetworkRenderData;
  districtOffsets: Record<string, number>;
  seededRandom: (seed: number) => () => number;
}

export interface LandmarkSceneOptions extends BaseSceneOptions {
  landmarks: Landmark[];
  helpers: SceneRenderHelpers;
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

function addGroundShape(options: BaseSceneOptions, points: Array<{ x: number; y: number }>, color: string, height: number, roughness: number): ThreeNamespace.Mesh {
  const { THREE, worldGroup } = options;
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shapeFromPoints(THREE, points)), new THREE.MeshStandardMaterial({color, roughness, metalness:0.08}));
  mesh.rotation.x=-Math.PI/2;
  mesh.position.y=height;
  mesh.receiveShadow=true;
  worldGroup.add(mesh);
  return mesh;
}

function addGroundLine(options: BaseSceneOptions, points: Array<{ x: number; y: number }>, color: string, opacity: number, height: number): void {
  const { THREE, worldGroup } = options;
  const material = new THREE.LineBasicMaterial({ color, transparent:true, opacity });
  const vectors = points.map(point => new THREE.Vector3(point.x, height, point.y));
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(vectors), material);
  worldGroup.add(line);
}

function addPathPlane(options: BaseSceneOptions, points: Array<{ x: number; y: number }>, width: number, color: string, height: number, roughness: number): void {
  if(points.length < 2) return;
  const { THREE, worldGroup } = options;
  const material = new THREE.MeshStandardMaterial({ color, roughness });
  for(let i=0; i<points.length-1; i++){
    const start = points[i];
    const end = points[i+1];
    const dx = end.x-start.x;
    const dy = end.y-start.y;
    const length = Math.hypot(dx, dy);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(length, width), material);
    mesh.rotation.x = -Math.PI/2;
    mesh.rotation.z = -Math.atan2(dy, dx);
    mesh.position.set((start.x+end.x)/2, height, (start.y+end.y)/2);
    mesh.receiveShadow = true;
    worldGroup.add(mesh);
  }
}

export function buildBaseGround(options: BaseSceneOptions): void {
  const { THREE, worldGroup, worldWidth, worldHeight } = options;
  const waterBase = new THREE.Mesh(new THREE.PlaneGeometry(worldWidth + 920, worldHeight + 620), new THREE.MeshStandardMaterial({color:mapTerrainTheme.openWater, roughness:0.24, metalness:0.26}));
  waterBase.rotation.x=-Math.PI/2; waterBase.position.set(worldWidth/2, -0.04, worldHeight/2); waterBase.receiveShadow=true; worldGroup.add(waterBase);
  addGroundShape(options, windhavenMapModel.landmass, mapTerrainTheme.baseLand, 0, 1);
  windhavenMapModel.districts.forEach(function(district){
    const terrain = terrainForDistrict(district.id);
    const material = new THREE.MeshStandardMaterial({
      color: terrain.land,
      roughness: 1,
    });
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shapeFromPoints(THREE, district.landArea)), material);
    mesh.rotation.x = -Math.PI/2;
    mesh.position.y = 0.03;
    mesh.receiveShadow = true;
    worldGroup.add(mesh);
    addGroundLine(options, district.landArea, mapTerrainTheme.districtStroke, 0.18, 0.16);
  });
  addGroundLine(options, windhavenMapModel.landmass, mapTerrainTheme.coastline, 0.46, 0.13);
  addGroundLine(options, windhavenMapModel.landmass.filter(function(_point, index){ return index % 2 === 0; }), mapTerrainTheme.coastlineSecondary, 0.24, 0.14);
  [
    [{x:-220,y:118},{x:520,y:84},{x:1220,y:112},{x:2060,y:84},{x:2760,y:112},{x:3580,y:88},{x:4420,y:118},{x:5360,y:92}],
    [{x:-180,y:142},{x:680,y:116},{x:1540,y:136},{x:2380,y:112},{x:3320,y:142},{x:4210,y:118},{x:5480,y:148}],
  ].forEach(function(points, index){
    addGroundLine(options, points, index === 0 ? '#8fb6c2' : '#e4efe8', index === 0 ? 0.2 : 0.12, 0.12 + index*0.01);
  });
}

export function buildCanalWater(options: BaseSceneOptions): void {
  const { THREE, worldGroup, worldHeight } = options;
  const canalMat = new THREE.MeshStandardMaterial({color:mapTerrainTheme.canalWater, roughness:0.18, metalness:0.46});
  const bankMat = new THREE.MeshStandardMaterial({color:mapTransportTheme.seawall, roughness:0.85});
  windhavenMapModel.canals.forEach(function(channel){
    const canal = new THREE.Mesh(new THREE.PlaneGeometry(channel.width,worldHeight + 180), canalMat);
    canal.rotation.x=-Math.PI/2; canal.position.set(channel.x+channel.width/2,0.04,worldHeight/2); worldGroup.add(canal);
    [channel.x+8, channel.x+channel.width-8].forEach(function(x){
      const bank = new THREE.Mesh(new THREE.BoxGeometry(12,4,worldHeight+90), bankMat);
      bank.position.set(x,2,worldHeight/2);
      bank.receiveShadow = true;
      worldGroup.add(bank);
    });
    addGroundLine(options, [{x:channel.x+18,y:0},{x:channel.x+34,y:260},{x:channel.x+12,y:620},{x:channel.x+30,y:980},{x:channel.x+18,y:worldHeight}], '#c7d7d0', 0.2, 0.13);
    addGroundLine(options, [{x:channel.x+channel.width-18,y:0},{x:channel.x+channel.width-34,y:320},{x:channel.x+channel.width-12,y:680},{x:channel.x+channel.width-30,y:1030},{x:channel.x+channel.width-18,y:worldHeight}], '#c7d7d0', 0.2, 0.13);
  });
}

export function buildRoadNetwork(options: RoadSceneOptions): void {
  const { THREE, worldGroup, roadNetwork } = options;
  const laneMat = new THREE.MeshStandardMaterial({color:mapTransportTheme.lane, roughness:0.6, emissive:'#4a4020', emissiveIntensity:0.15});
  const crosswalkMat = new THREE.MeshStandardMaterial({color:mapTransportTheme.crosswalk, roughness:0.76});
  windhavenMapModel.roadPaths.forEach(function(road){
    const start = road.path[0];
    const end = road.path[1];
    const dx = end.x-start.x;
    const dy = end.y-start.y;
    const length = Math.hypot(dx,dy);
    addPathPlane(options, road.path, road.width + (road.roadClass === 'arterial' ? 34 : 22), mapTransportTheme.sidewalk, 0.04, 0.92);
    addPathPlane(options, road.path, road.width, road.roadClass === 'arterial' ? mapTransportTheme.arterialSurface : mapTransportTheme.roadSurface, 0.06, 0.9);
    for(let t=40; t<length-20; t+=94){
      const local = t - length/2;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(48,3), laneMat);
      dash.rotation.x=-Math.PI/2;
      dash.rotation.z=-Math.atan2(dy,dx);
      dash.position.set((start.x+end.x)/2 + Math.cos(Math.atan2(dy,dx))*local,0.075,(start.y+end.y)/2 + Math.sin(Math.atan2(dy,dx))*local);
      worldGroup.add(dash);
    }
  });
  roadNetwork.vertical.forEach(function(v, vi){
    roadNetwork.horizontal.forEach(function(h, hi){
      for(let offset=-18; offset<=18; offset+=12){
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(46,4), crosswalkMat);
        stripe.rotation.x = -Math.PI/2;
        stripe.position.set(v.x + offset, 0.09, h.y - v.w/2 - 10);
        worldGroup.add(stripe);
        const stripeSouth = new THREE.Mesh(new THREE.PlaneGeometry(46,4), crosswalkMat);
        stripeSouth.rotation.x = -Math.PI/2;
        stripeSouth.position.set(v.x + offset, 0.09, h.y + v.w/2 + 10);
        worldGroup.add(stripeSouth);
      }
      for(let offset=-18; offset<=18; offset+=12){
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(4,46), crosswalkMat);
        stripe.rotation.x = -Math.PI/2;
        stripe.position.set(v.x - h.w/2 - 10, 0.091, h.y + offset);
        worldGroup.add(stripe);
        const stripeEast = new THREE.Mesh(new THREE.PlaneGeometry(4,46), crosswalkMat);
        stripeEast.rotation.x = -Math.PI/2;
        stripeEast.position.set(v.x + h.w/2 + 10, 0.091, h.y + offset);
        worldGroup.add(stripeEast);
      }
      options.buildIntersectionFurniture(v.x, h.y, vi * roadNetwork.horizontal.length + hi);
    });
  });
}

export function buildCanalBridges(options: BaseSceneOptions): void {
  const { THREE, worldGroup } = options;
  const deckMat = new THREE.MeshStandardMaterial({color:mapTransportTheme.bridgeDeck, roughness:0.7});
  const railMat = new THREE.MeshStandardMaterial({color:mapTransportTheme.bridgeRail, roughness:0.58, metalness:0.18});
  windhavenMapModel.bridges.forEach(function(bridge){
    const start = bridge.path[0];
    const end = bridge.path[1];
    const length = Math.hypot(end.x-start.x, end.y-start.y);
    const ry = start.y;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(length,4,bridge.width), deckMat);
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
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.2*size,2.8*size,15*size,7), new THREE.MeshStandardMaterial({color:'#4a3624', roughness:0.9}));
  trunk.position.set(0,7.5*size,0); trunk.castShadow=true; group.add(trunk);
  const crownMat = new THREE.MeshStandardMaterial({color:size > 1.08 ? '#2f6a3d' : '#365c34', roughness:0.95});
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
        buildStreetTree(options, x + (rand()-0.5)*18, r.y + side*58 + (rand()-0.5)*14, 0.78 + rand()*0.45);
      }
    });
    options.roadNetwork.vertical.filter(v=>v.x>off && v.x<off+1500).forEach(function(v){
      for(let y=95; y<options.worldHeight-95; y+=155){
        if(options.roadNetwork.horizontal.some(r=>Math.abs(y-r.y)<82)) continue;
        const side = rand() > 0.5 ? -1 : 1;
        buildStreetTree(options, v.x + side*50 + (rand()-0.5)*12, y + (rand()-0.5)*18, 0.72 + rand()*0.38);
      }
    });
  });
}

export function buildFillerCity(options: FillerSceneOptions): void {
  const { THREE, worldGroup, districtOffsets, fillerFor, helpers } = options;
  ['devlin','westside','hub'].forEach(function(distId){
    const off = districtOffsets[distId];
    fillerFor(distId).forEach(function(f){
      if(f.kind==='building'){
        const zoneType = helpers.renderZoneType(f.zone);
        const palette = f.style==='apartment'
          ? ['#6a4b3f','#705848','#61564d','#7a6254','#5d4a46']
          : (f.zone==='corporate'
            ? ['#283247','#33405c','#4d445f','#2f5360','#57515a']
            : (f.zone==='industrial' || f.zone==='logistics' ? ['#463f34','#55443c','#3f4542','#5c4638','#3d3946'] : (f.zone==='entertainment' ? ['#5a345e','#4a3f68','#6a3d4a','#3c5264'] : ['#394452','#4f463b','#365344','#58414a','#4f5159'])));
        const color = palette[Math.floor(f.hue * palette.length) % palette.length];
        const mesh = helpers.buildDetailedBuilding(f.w,f.h,f.d,color,zoneType,f.hue);
        if(f.style==='apartment'){
          const stoop = helpers.box(Math.min(22,f.w*0.45),3,8,'#4b423d');
          stoop.position.set(0,-f.h/2+2,f.d/2+4); mesh.add(stoop);
          const awning = helpers.box(Math.min(26,f.w*0.55),3,7,'#2f5360');
          awning.position.set(0,-f.h/2+16,f.d/2+3); mesh.add(awning);
        }
        mesh.position.set(f.x+off,f.h/2,f.y); mesh.rotation.y = f.rot; worldGroup.add(mesh);
      } else if(f.kind==='park'){
        const cx=(f.x0+f.x1)/2+off, cy=(f.y0+f.y1)/2, w=f.x1-f.x0, d=f.y1-f.y0;
        const grass = new THREE.Mesh(new THREE.PlaneGeometry(w,d), new THREE.MeshStandardMaterial({color:'#2c4a30', roughness:1}));
        grass.rotation.x=-Math.PI/2; grass.position.set(cx,0.08,cy); grass.receiveShadow=true; worldGroup.add(grass);
        const rand = helpers.seededRandom(Math.floor(cx*7+cy*13));
        for(let i=0;i<8;i++){
          const tx=f.x0+off+20+rand()*(w-40), ty=f.y0+20+rand()*(d-40);
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2,2.5,10,6), new THREE.MeshStandardMaterial({color:'#4a3624'}));
          trunk.position.set(tx,5,ty); trunk.castShadow=true; worldGroup.add(trunk);
          const leaves = new THREE.Mesh(new THREE.ConeGeometry(9,20,7), new THREE.MeshStandardMaterial({color:'#2f5c38'}));
          leaves.position.set(tx,18,ty); leaves.castShadow=true; worldGroup.add(leaves);
        }
        if(f.name==='MILLENNIUM PARK'){
          const potato = new THREE.Mesh(new THREE.SphereGeometry(20,24,18), new THREE.MeshStandardMaterial({color:'#c9c9d4', metalness:1, roughness:0.08}));
          potato.scale.set(1.6,0.85,1); potato.position.set(cx,22,cy); potato.castShadow=true; potato.receiveShadow=true; worldGroup.add(potato);
          helpers.addSign(potato,'THE POTATO',44,10,34,'#e8e6de');
        } else {
          helpers.addSign(grass,f.name,44,9,4,'#a8d0a8');
        }
      } else if(f.kind==='lot'){
        const cx=(f.x0+f.x1)/2+off, cy=(f.y0+f.y1)/2, w=f.x1-f.x0, d=f.y1-f.y0;
        const lot = new THREE.Mesh(new THREE.PlaneGeometry(w,d), new THREE.MeshStandardMaterial({color:'#26282e', roughness:1}));
        lot.rotation.x=-Math.PI/2; lot.position.set(cx,0.08,cy); lot.receiveShadow=true; worldGroup.add(lot);
        const stripeMat = new THREE.MeshBasicMaterial({color:'#d9d2b8', transparent:true, opacity:0.5});
        for(let sx=f.x0+off+18; sx<f.x1+off-18; sx+=24){
          const stripe = new THREE.Mesh(new THREE.PlaneGeometry(2,d-24), stripeMat);
          stripe.rotation.x=-Math.PI/2; stripe.position.set(sx,0.11,cy); worldGroup.add(stripe);
        }
        const curb = helpers.box(w,2,3,'#565a63'); curb.position.set(cx,1,f.y0+8); worldGroup.add(curb);
        const rand = helpers.seededRandom(Math.floor(cx*11+cy*17));
        const carColors=['#556070','#704040','#405560','#606050'];
        for(let i=0;i<10;i++){
          const px=f.x0+off+18+rand()*(w-36), py=f.y0+18+rand()*(d-36);
          const c=helpers.box(20,9,11,carColors[Math.floor(rand()*carColors.length)]);
          c.position.set(px,4.5,py); c.rotation.y=Math.round(rand()*1)*Math.PI/2; worldGroup.add(c);
        }
      }
    });
  });
}

export function buildLandmarks(options: LandmarkSceneOptions): void {
  const { THREE, worldGroup, landmarks, helpers } = options;
  landmarks.forEach(function(lm){
    if(lm.id==='devlinHall'){
      const base = helpers.box(70,26,70,'#6a5b3e'); base.position.set(lm.x,13,lm.y); worldGroup.add(base);
      const steps = helpers.box(84,6,84,'#565049'); steps.position.set(lm.x,3,lm.y); worldGroup.add(steps);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(30,20,14,0,Math.PI*2,0,Math.PI/2), new THREE.MeshStandardMaterial({color:'#c9a227', metalness:0.6, roughness:0.3}));
      dome.position.set(lm.x,26,lm.y); dome.castShadow=true; worldGroup.add(dome);
      const finial = new THREE.Mesh(new THREE.ConeGeometry(3,14,8), new THREE.MeshStandardMaterial({color:'#e0c860', metalness:0.7, roughness:0.2}));
      finial.position.set(lm.x,52,lm.y); worldGroup.add(finial);
      helpers.addSign(base,lm.name,44,9,36,'#ffe6a0');
    } else if(lm.id==='ciceroWorks'){
      const legMat = new THREE.MeshStandardMaterial({color:'#3a3d47', roughness:0.7});
      const tankMat = new THREE.MeshStandardMaterial({color:'#7a3b32', roughness:0.8});
      [[-16,-16],[16,-16],[-16,16],[16,16]].forEach(function(p){
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,60,6), legMat);
        leg.position.set(lm.x+p[0],30,lm.y+p[1]); leg.castShadow=true; worldGroup.add(leg);
      });
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(24,24,30,14), tankMat);
      tank.position.set(lm.x,74,lm.y); tank.castShadow=true; worldGroup.add(tank);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(26,14,14), tankMat);
      cap.position.set(lm.x,95,lm.y); worldGroup.add(cap);
      helpers.addSign(tank,lm.name,44,9,28,'#f0c0a0');
    }
  });
}

export function buildRailAndRiver(options: BaseSceneOptions): void {
  const { THREE, worldGroup, worldHeight } = options;
  windhavenMapModel.railLines.forEach(function(line){
    const start = line.path[0];
    const end = line.path[1];
    const length = Math.hypot(end.x-start.x, end.y-start.y);
    const rail = new THREE.Mesh(new THREE.PlaneGeometry(line.width, length), new THREE.MeshStandardMaterial({color:'#2a2a2e', roughness:1}));
    rail.rotation.x=-Math.PI/2; rail.position.set(start.x,0.06,(start.y+end.y)/2); rail.receiveShadow=true; worldGroup.add(rail);
    for(let ty=20;ty<worldHeight;ty+=26){
      const tie = new THREE.Mesh(new THREE.BoxGeometry(line.width-4,2,4), new THREE.MeshStandardMaterial({color:'#3a3530', roughness:0.85, metalness:0.05}));
      tie.castShadow=true; tie.receiveShadow=true; tie.position.set(start.x,1,ty); worldGroup.add(tie);
    }
  });
  addGroundShape(options, windhavenMapModel.northRiver, mapTerrainTheme.canalWater, 0.06, 0.24);
  addGroundShape(options, windhavenMapModel.lakefrontBeach, '#b9a777', 0.09, 1);
  addGroundLine(options, windhavenMapModel.northRiver.slice(2), '#e4efe8', 0.18, 0.14);
  addGroundLine(options, windhavenMapModel.lakefrontBeach, '#d9d2b8', 0.22, 0.15);
  const pierMat = new THREE.MeshStandardMaterial({color:'#736d5c', roughness:0.86});
  [4380, 4920, 5360].forEach(function(x, index){
    const pier = new THREE.Mesh(new THREE.BoxGeometry(130 + index*28, 5, 24), pierMat);
    pier.position.set(x, 2.5, 104 + index*12);
    pier.rotation.y = index === 1 ? -0.08 : 0.05;
    pier.castShadow = true;
    pier.receiveShadow = true;
    worldGroup.add(pier);
    const light = new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,18,7), new THREE.MeshStandardMaterial({color:'#343840', roughness:0.55}));
    light.position.set(x + 44, 12, 104 + index*12);
    worldGroup.add(light);
  });
  const seawallMat = new THREE.MeshStandardMaterial({color:mapTransportTheme.seawall, roughness:0.9});
  [
    { x: 4300, y: 96, w: 340, d: 8, rot: 0.03 },
    { x: 4820, y: 96, w: 360, d: 8, rot: -0.04 },
    { x: 5320, y: 118, w: 300, d: 8, rot: 0.08 },
  ].forEach(function(wall){
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.w,4,wall.d), seawallMat);
    mesh.position.set(wall.x,2,wall.y);
    mesh.rotation.y = wall.rot;
    mesh.receiveShadow = true;
    worldGroup.add(mesh);
  });
}
