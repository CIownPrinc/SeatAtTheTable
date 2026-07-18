import type { DiagonalRoad, HorizontalRoad, Landmark, VerticalRoad } from './world';
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

export function buildBaseGround(options: BaseSceneOptions): void {
  const { THREE, worldGroup, worldWidth, worldHeight } = options;
  const groundBase = new THREE.Mesh(new THREE.PlaneGeometry(worldWidth,worldHeight), new THREE.MeshStandardMaterial({color:'#303438', roughness:1}));
  groundBase.rotation.x=-Math.PI/2; groundBase.position.set(worldWidth/2,0,worldHeight/2); groundBase.receiveShadow=true; worldGroup.add(groundBase);
  [{x0:0,x1:1500,color:'#39453d'},{x0:2000,x1:3500,color:'#443838'},{x0:4000,x1:5500,color:'#403c2c'}].forEach(function(dg){
    const w=dg.x1-dg.x0;
    const tint = new THREE.Mesh(new THREE.PlaneGeometry(w,worldHeight), new THREE.MeshStandardMaterial({color:dg.color, roughness:1}));
    tint.rotation.x=-Math.PI/2; tint.position.set(dg.x0+w/2,0.01,worldHeight/2); tint.receiveShadow=true; worldGroup.add(tint);
  });
}

export function buildCanalWater(options: BaseSceneOptions): void {
  const { THREE, worldGroup, worldHeight } = options;
  const canalMat = new THREE.MeshStandardMaterial({color:'#1c3a52', roughness:0.2, metalness:0.4});
  [[1500,500],[3500,500]].forEach(function(pair){
    const cx=pair[0], cw=pair[1];
    const canal = new THREE.Mesh(new THREE.PlaneGeometry(cw,worldHeight), canalMat);
    canal.rotation.x=-Math.PI/2; canal.position.set(cx+cw/2,0.04,worldHeight/2); worldGroup.add(canal);
  });
}

export function buildRoadNetwork(options: RoadSceneOptions): void {
  const { THREE, worldGroup, worldWidth, worldHeight, roadNetwork } = options;
  const roadMat = new THREE.MeshStandardMaterial({color:'#454a54', roughness:0.9});
  const laneMat = new THREE.MeshStandardMaterial({color:'#c9b45a', roughness:0.6, emissive:'#4a4020', emissiveIntensity:0.15});
  roadNetwork.vertical.forEach(function(r){
    const m = new THREE.Mesh(new THREE.PlaneGeometry(62,worldHeight), roadMat);
    m.rotation.x=-Math.PI/2; m.position.set(r.x,0.05,worldHeight/2); m.receiveShadow=true; worldGroup.add(m);
  });
  roadNetwork.horizontal.forEach(function(r){
    const m = new THREE.Mesh(new THREE.PlaneGeometry(worldWidth,80), roadMat);
    m.rotation.x=-Math.PI/2; m.position.set(worldWidth/2,0.05,r.y); m.receiveShadow=true; worldGroup.add(m);
    for(let lx=40; lx<worldWidth; lx+=94){
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(48,3), laneMat);
      dash.rotation.x=-Math.PI/2; dash.position.set(lx,0.07,r.y); worldGroup.add(dash);
    }
  });
  roadNetwork.diagonal.forEach(function(r){
    const dx = r.x2-r.x1;
    const dy = r.y2-r.y1;
    const length = Math.hypot(dx,dy);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(length,r.w), roadMat);
    m.rotation.x=-Math.PI/2;
    m.rotation.z=-Math.atan2(dy,dx);
    m.position.set((r.x1+r.x2)/2,0.055,(r.y1+r.y2)/2);
    m.receiveShadow=true;
    worldGroup.add(m);
    for(let t=42; t<length-20; t+=88){
      const local = t - length/2;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(42,3), laneMat);
      dash.rotation.x=-Math.PI/2;
      dash.rotation.z=-Math.atan2(dy,dx);
      dash.position.set((r.x1+r.x2)/2 + Math.cos(Math.atan2(dy,dx))*local,0.075,(r.y1+r.y2)/2 + Math.sin(Math.atan2(dy,dx))*local);
      worldGroup.add(dash);
    }
  });
  roadNetwork.vertical.forEach(function(v, vi){
    roadNetwork.horizontal.forEach(function(h, hi){
      options.buildIntersectionFurniture(v.x, h.y, vi * roadNetwork.horizontal.length + hi);
    });
  });
}

export function buildCanalBridges(options: BaseSceneOptions): void {
  const { THREE, worldGroup } = options;
  const deckMat = new THREE.MeshStandardMaterial({color:'#3a3d47', roughness:0.7});
  const railMat = new THREE.MeshStandardMaterial({color:'#555a68', roughness:0.6});
  [[1500,500],[3500,500]].forEach(function(pair){
    const cx=pair[0], cw=pair[1];
    [300,600,900].forEach(function(ry){
      const deck = new THREE.Mesh(new THREE.BoxGeometry(cw,4,74), deckMat);
      deck.position.set(cx+cw/2,2,ry); worldGroup.add(deck);
      for(let rx=cx+30; rx<cx+cw-20; rx+=60){
        const p1 = new THREE.Mesh(new THREE.BoxGeometry(4,18,4), railMat);
        p1.position.set(rx,10,ry-33); worldGroup.add(p1);
        const p2 = new THREE.Mesh(new THREE.BoxGeometry(4,18,4), railMat);
        p2.position.set(rx,10,ry+33); worldGroup.add(p2);
      }
    });
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
      } else if(f.kind==='edge'){
        const color = distId==='hub'?(f.hue<0.5?'#22262f':'#2c2a3a'):(distId==='westside'?(f.hue<0.5?'#2c2a24':'#332c26'):(f.hue<0.5?'#2a2e36':'#332e28'));
        const mesh = helpers.box(f.w,f.h,f.d,color);
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
  const { THREE, worldGroup, worldWidth, worldHeight } = options;
  const rail = new THREE.Mesh(new THREE.PlaneGeometry(40,worldHeight), new THREE.MeshStandardMaterial({color:'#2a2a2e', roughness:1}));
  rail.rotation.x=-Math.PI/2; rail.position.set(3470,0.06,worldHeight/2); rail.receiveShadow=true; worldGroup.add(rail);
  for(let ty=20;ty<worldHeight;ty+=26){
    const tie = new THREE.Mesh(new THREE.BoxGeometry(36,2,4), new THREE.MeshStandardMaterial({color:'#3a3530', roughness:0.85, metalness:0.05}));
    tie.castShadow=true; tie.receiveShadow=true; tie.position.set(3470,1,ty); worldGroup.add(tie);
  }
  const river = new THREE.Mesh(new THREE.PlaneGeometry(worldWidth,46), new THREE.MeshStandardMaterial({color:'#1c3a52', roughness:0.3, metalness:0.3}));
  river.rotation.x=-Math.PI/2; river.position.set(worldWidth/2,0.06,20); river.receiveShadow=true; worldGroup.add(river);
  const beachShape = new THREE.Shape();
  beachShape.moveTo(4000,48);
  beachShape.bezierCurveTo(4250,88,4550,58,4820,96);
  beachShape.bezierCurveTo(5100,136,5350,96,5500,118);
  beachShape.lineTo(5500,48);
  beachShape.lineTo(4000,48);
  beachShape.closePath();
  const beach = new THREE.Mesh(new THREE.ShapeGeometry(beachShape), new THREE.MeshStandardMaterial({color:'#b9a777', roughness:1}));
  beach.rotation.x=-Math.PI/2;
  beach.position.y=0.09;
  beach.receiveShadow=true;
  worldGroup.add(beach);
}
