import type { Business, Corner, LocalBusiness, MapAmenity, ServiceBuilding } from '../config/types';
import type * as ThreeNamespace from 'three';
import type { MapBuilding } from './markers';
import type { MapObject } from './objects';
import type { VentureFootprint } from './objectFactory';
import type { PropertyPlace } from './propertyPlaces';

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
  renderPropertyBuildings(options);
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
    mesh.name = `venture:${building.id}:${building.biz.name}`;
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
    mesh.name = `service:${building.id}:${building.name}`;
    worldGroup.add(mesh);
    helpers.addSign(mesh, building.name, Math.min(54, silhouette.w * 0.72), 9, silhouette.h - 8, '#ffe6a0');
  });
}

// LEGAL: Stage 7 — real estate exists in the world whether or not you hold the deed, so
// LEGAL: these always render. Ownership is shown on the minimap and by the marker colour,
// LEGAL: not by the building appearing out of nowhere when you buy it.
function renderPropertyBuildings(options: MapPlaceRenderOptions): void {
  const { worldGroup, mapObjects, helpers } = options;
  mapObjects.filter(object => object.kind === 'property').forEach(function(object){
    const place = object.ref as PropertyPlace;
    const silhouette = propertySilhouette(place);
    const mesh = helpers.buildDetailedBuilding(silhouette.w, silhouette.h, silhouette.d, silhouette.color, silhouette.zoneType, helpers.variantForId(place.id));
    helpers.addCategoryMarker(mesh, object.minimapIcon, '#5fbf8f', silhouette.h - 2);
    mesh.position.set(object.x, silhouette.h / 2, object.y);
    mesh.name = `property:${place.id}:${place.name}`;
    worldGroup.add(mesh);
    helpers.addSign(mesh, place.name, Math.min(46, silhouette.w * 0.8), 8, silhouette.h - 6, '#9fe0c0');
  });
}

// LEGAL: Footprint by the brand category the property belongs to — a vacant walk-up should
// LEGAL: not look like a waterfront tower.
export function propertySilhouette(place: PropertyPlace): BuildingSilhouette {
  const income = place.property.incomePerSec;
  if(income >= 700) return { w:56, h:96, d:48, color:'#4a5a6d', zoneType:'skyscraper' };
  if(income >= 150) return { w:54, h:62, d:46, color:'#54566a', zoneType:'residential' };
  if(income >= 30) return { w:60, h:32, d:44, color:'#6a5a48', zoneType:'commercial' };
  return { w:46, h:30, d:38, color:'#5d4a46', zoneType:'residential' };
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
    mesh.name = `local:${business.id}:${business.name}`;
    worldGroup.add(mesh);
    helpers.addSign(mesh, business.name, Math.min(42, silhouette.w * 0.82), 8, silhouette.h - 2, business.extorted ? '#ffd77a' : '#b8aee0');
  });
}

export function serviceBuildingSilhouette(building: ServiceBuilding): BuildingSilhouette {
  if(building.kind === 'bankHome') return { w:70, h:42, d:56, color:'#7a5f1a', zoneType:'service' };
  if(building.kind === 'garage') return { w:84, h:28, d:62, color:'#3e6b78', zoneType:'industrial' };
  // LEGAL: Your garage: a plain low workshop, deliberately unlike the glass dealerships.
  if(building.kind === 'playerGarage') return { w:76, h:24, d:58, color:'#5a4a3e', zoneType:'industrial' };
  // LEGAL: Stage 5 — branded shops finally get their own footprints instead of falling
  // LEGAL: through to the generic service silhouette. This was written and reverted during
  // LEGAL: Phase 4 because the bigger footprints walled off the shoreline near spawn and
  // LEGAL: tripped the water/land guard. Two things changed since: the world is far larger
  // LEGAL: with the stage-1c outskirts, and buildings are now placed by the lot allocator
  // LEGAL: with proper setback rather than hand-picked coordinates on the waterfront.
  // LEGAL: A dealership reads as a wide, low glass showroom; a brokerage as a narrow office.
  if(building.kind === 'dealership') return { w:92, h:26, d:64, color:'#3e6b78', zoneType:'commercial' };
  if(building.kind === 'brokerage') return { w:58, h:46, d:48, color:'#456f78', zoneType:'commercial' };
  // LEGAL: Branded shops were falling through to the generic default silhouette, which made
  // LEGAL: them smaller and blander than the generic buildings they replaced. Give
  // LEGAL: dealerships a wide showroom footprint and brokerages an office one.
  if(building.kind === 'realty') return { w:62, h:32, d:48, color:'#456f78', zoneType:'commercial' };
  if(building.kind === 'cityhall') return { w:88, h:48, d:64, color:'#74623c', zoneType:'service' };
  if(building.kind === 'heist') return { w:72, h:34, d:58, color:'#5a2a33', zoneType:'industrial' };
  return { w:72, h:38, d:58, color:'#3e6b78', zoneType:'service' };
}

export function localBusinessSilhouette(business: LocalBusiness): BuildingSilhouette {
  const color = business.extorted ? '#8a6a1a' : '#4a4360';
  // LEGAL: Enterable places were reading as smaller than the scenery around them.
  if(business.id === 'bar' || business.id === 'marlowe') return { w:62, h:30, d:52, color:'#4c335a', zoneType:'commercial' };
  if(business.id === 'chopshop') return { w:64, h:25, d:48, color:'#3e464a', zoneType:'industrial' };
  if(business.id === 'jewelers') return { w:58, h:34, d:48, color:'#5b5268', zoneType:'shop' };
  if(business.id === 'liquor') return { w:60, h:28, d:50, color, zoneType:'shop' };
  return { w:56, h:26, d:46, color, zoneType:'shop' };
}

function renderAmenities(options: MapPlaceRenderOptions): void {
  const { worldGroup, mapObjects, helpers } = options;
  mapObjects.filter(object => object.kind === 'amenity').forEach(function(object){
    const amenity = object.ref as MapAmenity;
    const mesh = helpers.buildAmenityModel(amenity);
    const y = amenity.kind === 'petstore' || amenity.kind === 'shop' ? 10 : 0;
    mesh.position.set(object.x, y, object.y);
    mesh.name = `amenity:${amenity.kind}:${amenity.id}`;
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
    // LEGAL: Pole, orb and dealer used to be three loose children of the world. The orb sat
    // LEGAL: at y=21 with nothing under it as far as any measurement was concerned, which is
    // LEGAL: exactly the "random floating block" read. A corner is one object; model it as one.
    const group = new THREE.Group();
    group.name = `corner:${corner.id}:${corner.name}`;
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(0, 13, 0);
    pole.castShadow = true;
    group.add(pole);
    let orbMaterial = orbMaterials.get(color);
    if(!orbMaterial){
      orbMaterial = new THREE.MeshStandardMaterial({ color, emissive:color, emissiveIntensity:0.4 });
      orbMaterials.set(color, orbMaterial);
    }
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.set(0, 28, 0);
    group.add(orb);
    helpers.addSign(pole, corner.name, 30, 8, 22, '#f0efe8');
    if(staffed){
      const dealer = helpers.buildPedestrianModel('#d4a017', `dealer-${corner.id}`);
      dealer.position.set(12, 0, 9);
      dealer.rotation.y = Math.PI;
      group.add(dealer);
    }
    group.position.set(object.x, 0, object.y);
    worldGroup.add(group);
  });
}
