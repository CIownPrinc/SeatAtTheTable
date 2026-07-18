import type { HorizontalRoad, VerticalRoad } from './world';
import type * as ThreeNamespace from 'three';

export interface RoadNetworkRenderData {
  vertical: VerticalRoad[];
  horizontal: HorizontalRoad[];
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
