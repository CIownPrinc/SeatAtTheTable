import type { Business, Corner, LocalBusiness, MapAmenity, ServiceBuilding } from '../config/types';
import type * as ThreeNamespace from 'three';
import type { MapBuilding } from './markers';
import type { MapObject } from './objects';
import type { VentureFootprint } from './objectFactory';

export interface BuildingVisualState {
  color: string;
  h: number;
}

export interface BuildingSilhouette {
  w: number;
  h: number;
  d: number;
  color: string;
  zoneType: string;
}

export interface MapPlaceRenderHelpers {
  buildingColorFor: (business: Business) => BuildingVisualState;
  ventureFootprint: (building: MapBuilding) => VentureFootprint;
  buildDetailedBuilding: (w: number, h: number, d: number, color: number | string, zoneType: string, variant: number) => ThreeNamespace.Group;
  buildAmenityModel: (amenity: MapAmenity) => ThreeNamespace.Group;
  buildPedestrianModel: (color: number | string, identity?: string) => ThreeNamespace.Group;
  addVentureDetail: (building: MapBuilding, base: ThreeNamespace.Group) => void;
  addServiceDetail: (building: ServiceBuilding, base: ThreeNamespace.Group) => void;
  addLocalBusinessDetail: (business: LocalBusiness, base: ThreeNamespace.Group) => void;
  addCategoryMarker: (base: ThreeNamespace.Group, icon: MapObject['minimapIcon'], color: string, y: number) => void;
  addSign: (parent: ThreeNamespace.Object3D, text: string, w: number, h: number, y: number, color: string) => void;
  variantForId: (id: string) => number;
}

export interface MapPlaceRenderOptions {
  THREE: typeof ThreeNamespace;
  worldGroup: ThreeNamespace.Group;
  mapObjects: MapObject[];
  helpers: MapPlaceRenderHelpers;
}

export function renderMapPlaces(options: MapPlaceRenderOptions): void {
  renderVentureBuildings(options);
  renderServiceBuildings(options);
  renderLocalBusinesses(options);
  renderAmenities(options);
  renderCorners(options);
}

function renderVentureBuildings(options: MapPlaceRenderOptions): void {
  const { worldGroup, mapObjects, helpers } = options;
  mapObjects.filter(object => object.kind === 'building').forEach(function(object){
    const building = object.ref as MapBuilding;
    const info = helpers.buildingColorFor(building.biz);
    const footprint = helpers.ventureFootprint(building);
    const height = Math.max(info.h, footprint.h);
    const color = building.zone === 'corporate' ? '#46516d' : (building.zone === 'entertainment' ? '#5a345e' : info.color);
    const mesh = helpers.buildDetailedBuilding(footprint.w, height, footprint.d, color, footprint.zoneType, helpers.variantForId(building.id));
    helpers.addVentureDetail(building, mesh);
    helpers.addCategoryMarker(mesh, object.minimapIcon, building.biz.category === 'legit' ? '#8fd0e0' : '#f0a0ae', height / 2 + 12);
    mesh.position.set(object.x, height / 2, object.y);
    worldGroup.add(mesh);
    helpers.addSign(mesh, building.biz.name, 34, 9, height / 2 + 10, building.biz.category === 'legit' ? '#8fd0e0' : '#f0a0ae');
  });
}

function renderServiceBuildings(options: MapPlaceRenderOptions): void {
  const { worldGroup, mapObjects, helpers } = options;
  mapObjects.filter(object => object.kind === 'service').forEach(function(object){
    const building = object.ref as ServiceBuilding;
    const silhouette = serviceBuildingSilhouette(building);
    const mesh = helpers.buildDetailedBuilding(silhouette.w, silhouette.h, silhouette.d, silhouette.color, silhouette.zoneType, helpers.variantForId(building.id));
    helpers.addServiceDetail(building, mesh);
    helpers.addCategoryMarker(mesh, object.minimapIcon, '#ffe6a0', silhouette.h - 3);
    mesh.position.set(object.x, silhouette.h / 2, object.y);
    worldGroup.add(mesh);
    helpers.addSign(mesh, building.name, Math.min(54, silhouette.w * 0.72), 9, silhouette.h - 8, '#ffe6a0');
  });
}

function renderLocalBusinesses(options: MapPlaceRenderOptions): void {
  const { worldGroup, mapObjects, helpers } = options;
  mapObjects.filter(object => object.kind === 'local').forEach(function(object){
    const business = object.ref as LocalBusiness;
    const silhouette = localBusinessSilhouette(business);
    const mesh = helpers.buildDetailedBuilding(silhouette.w, silhouette.h, silhouette.d, silhouette.color, silhouette.zoneType, helpers.variantForId(business.id));
    helpers.addLocalBusinessDetail(business, mesh);
    helpers.addCategoryMarker(mesh, object.minimapIcon, business.extorted ? '#ffd77a' : '#b8aee0', silhouette.h + 4);
    mesh.position.set(object.x, silhouette.h / 2, object.y);
    worldGroup.add(mesh);
    helpers.addSign(mesh, business.name, Math.min(42, silhouette.w * 0.82), 8, silhouette.h - 2, business.extorted ? '#ffd77a' : '#b8aee0');
  });
}

export function serviceBuildingSilhouette(building: ServiceBuilding): BuildingSilhouette {
  if(building.kind === 'bankHome') return { w:70, h:42, d:56, color:'#7a5f1a', zoneType:'service' };
  if(building.kind === 'garage') return { w:84, h:28, d:62, color:'#3e6b78', zoneType:'industrial' };
  if(building.kind === 'realty') return { w:62, h:32, d:48, color:'#456f78', zoneType:'commercial' };
  if(building.kind === 'cityhall') return { w:88, h:48, d:64, color:'#74623c', zoneType:'service' };
  if(building.kind === 'heist') return { w:72, h:34, d:58, color:'#5a2a33', zoneType:'industrial' };
  return { w:58, h:34, d:50, color:'#3e6b78', zoneType:'service' };
}

export function localBusinessSilhouette(business: LocalBusiness): BuildingSilhouette {
  const color = business.extorted ? '#8a6a1a' : '#4a4360';
  if(business.id === 'bar' || business.id === 'marlowe') return { w:50, h:26, d:42, color:'#4c335a', zoneType:'commercial' };
  if(business.id === 'chopshop') return { w:64, h:25, d:48, color:'#3e464a', zoneType:'industrial' };
  if(business.id === 'jewelers') return { w:46, h:30, d:38, color:'#5b5268', zoneType:'shop' };
  if(business.id === 'liquor') return { w:48, h:24, d:40, color, zoneType:'shop' };
  return { w:42, h:20, d:36, color, zoneType:'shop' };
}

function renderAmenities(options: MapPlaceRenderOptions): void {
  const { worldGroup, mapObjects, helpers } = options;
  mapObjects.filter(object => object.kind === 'amenity').forEach(function(object){
    const amenity = object.ref as MapAmenity;
    const mesh = helpers.buildAmenityModel(amenity);
    const y = amenity.kind === 'petstore' || amenity.kind === 'shop' ? 10 : 0;
    mesh.position.set(object.x, y, object.y);
    worldGroup.add(mesh);
  });
}

function renderCorners(options: MapPlaceRenderOptions): void {
  const { THREE, worldGroup, mapObjects, helpers } = options;
  const poleGeometry = new THREE.CylinderGeometry(1.4, 1.4, 26, 6);
  const orbGeometry = new THREE.SphereGeometry(7, 10, 10);
  const poleMaterial = new THREE.MeshStandardMaterial({ color:'#2a2c33' });
  const orbMaterials = new Map<string, ThreeNamespace.MeshStandardMaterial>();
  mapObjects.filter(object => object.kind === 'corner').forEach(function(object){
    const corner = object.ref as Corner;
    const staffed = corner.dealer && !corner.busted;
    const color = corner.busted ? '#5f6275' : (staffed ? '#d4a017' : '#a8394a');
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(object.x, 13, object.y);
    pole.castShadow = true;
    worldGroup.add(pole);
    let orbMaterial = orbMaterials.get(color);
    if(!orbMaterial){
      orbMaterial = new THREE.MeshStandardMaterial({ color, emissive:color, emissiveIntensity:0.4 });
      orbMaterials.set(color, orbMaterial);
    }
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.set(object.x, 28, object.y);
    worldGroup.add(orb);
    helpers.addSign(pole, corner.name, 30, 8, 22, '#f0efe8');
    if(staffed){
      const dealer = helpers.buildPedestrianModel('#d4a017', `dealer-${corner.id}`);
      dealer.position.set(object.x + 12, 0, object.y + 9);
      dealer.rotation.y = Math.PI;
      worldGroup.add(dealer);
    }
  });
}
