import type { Business, Corner, LocalBusiness, MapAmenity, ServiceBuilding } from '../config/types';
import type * as ThreeNamespace from 'three';
import { storeys } from './scale';
import { GARAGE_OFFICE, garageOfficeCenter } from './driveIn';
import type { MapBuilding } from './markers';
import type { MapObject } from './objects';
import type { VentureFootprint } from './objectFactory';
import type { PropertyPlace } from './propertyPlaces';
import {
  archetypeSilhouette,
  archetypeZoneType,
  localArchetype,
  propertyArchetype,
  serviceArchetype,
  ventureArchetype,
  type PlaceArchetype,
} from './archetypes';
import { buildArchetypeShell } from './placeShells';

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

// LEGAL: Applies the archetype's own footprint when it has one — an alley is a long narrow
// LEGAL: gap and a yard is wide and low, neither of which a building silhouette can express.
// LEGAL: Archetypes with a building shell keep the footprint their config gave them.
function withArchetype(archetype: PlaceArchetype | null, base: BuildingSilhouette): BuildingSilhouette {
  if(!archetype) return base;
  const shape = archetypeSilhouette(archetype);
  if(!shape) return { ...base, zoneType: archetypeZoneType(archetype) };
  return { ...shape, zoneType: archetypeZoneType(archetype) };
}

// LEGAL: Draws a place with the shell its archetype demands. Stalls and open ground sit with
// LEGAL: their origin ON the ground; buildings are centred on their mass, hence the two
// LEGAL: different y values. Returns the group so callers can hang signage and markers on it.
function buildPlaceShell(
  options: MapPlaceRenderOptions,
  archetype: PlaceArchetype | null,
  silhouette: BuildingSilhouette,
  variant: number,
): { mesh: ThreeNamespace.Group; y: number; hasBuilding: boolean } {
  const shell = archetype ? buildArchetypeShell(options.THREE, archetype, silhouette.w, silhouette.d, silhouette.h, silhouette.color) : null;
  if(shell) return { mesh: shell, y: 0, hasBuilding: false };
  const model = archetype ? options.helpers.buildPlaceModel(archetype, String(silhouette.color), silhouette.w, silhouette.h, silhouette.d) : null;
  if(model) return { mesh: model, y: silhouette.h / 2, hasBuilding: true };
  const mesh = options.helpers.buildDetailedBuilding(silhouette.w, silhouette.h, silhouette.d, silhouette.color, silhouette.zoneType, variant);
  return { mesh, y: silhouette.h / 2, hasBuilding: true };
}

export interface MapPlaceRenderHelpers {
  buildingColorFor: (business: Business) => BuildingVisualState;
  ventureFootprint: (building: MapBuilding) => VentureFootprint;
  buildDetailedBuilding: (w: number, h: number, d: number, color: number | string, zoneType: string, variant: number) => ThreeNamespace.Group;
  // LEGAL: The Blender model for this archetype, or null to fall back to buildDetailedBuilding.
  buildPlaceModel: (archetype: PlaceArchetype, color: string, w: number, h: number, d: number) => ThreeNamespace.Group | null;
  buildAmenityModel: (amenity: MapAmenity) => ThreeNamespace.Group;
  buildPedestrianModel: (color: number | string, identity?: string) => ThreeNamespace.Group;
  addVentureDetail: (building: MapBuilding, base: ThreeNamespace.Group) => void;
  addServiceDetail: (building: ServiceBuilding, base: ThreeNamespace.Group) => void;
  addLocalBusinessDetail: (business: LocalBusiness, base: ThreeNamespace.Group) => void;
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
    const height = storeys(Math.max(info.h, footprint.h));
    const color = building.zone === 'corporate' ? '#46516d' : (building.zone === 'entertainment' ? '#5a345e' : info.color);
    const archetype = ventureArchetype(building);
    const silhouette = withArchetype(archetype, { w:footprint.w, h:height, d:footprint.d, color, zoneType:footprint.zoneType });
    const built = buildPlaceShell(options, archetype, silhouette, helpers.variantForId(building.id));
    const mesh = built.mesh;
    // LEGAL: Facade detailing only makes sense on something with a facade.
    if(built.hasBuilding) helpers.addVentureDetail(building, mesh);
    mesh.position.set(object.x, built.y, object.y);
    mesh.name = `venture:${building.id}:${building.biz.name}`;
    worldGroup.add(mesh);
    helpers.addSign(mesh, building.biz.name, 34, 9, built.hasBuilding ? silhouette.h / 2 + 10 : silhouette.h + 12, building.biz.category === 'legit' ? '#8fd0e0' : '#f0a0ae');
  });
}

function renderServiceBuildings(options: MapPlaceRenderOptions): void {
  const { worldGroup, mapObjects, helpers } = options;
  mapObjects.filter(object => object.kind === 'service').forEach(function(object){
    const building = object.ref as ServiceBuilding;
    const archetype = serviceArchetype(building);
    const silhouette = serviceBuildingSilhouette(building);
    const built = buildPlaceShell(options, archetype, silhouette, helpers.variantForId(building.id));
    const mesh = built.mesh;
    if(built.hasBuilding) helpers.addServiceDetail(building, mesh);
    mesh.position.set(object.x, built.y, object.y);
    mesh.name = `service:${building.id}:${building.name}`;
    if(building.kind === 'playerGarage') addGarageOffice(options.THREE, mesh, silhouette.w, silhouette.d);
    worldGroup.add(mesh);
    // LEGAL: The mall carries its name on its own facade (map/mall).
    if(building.kind !== 'mall') helpers.addSign(mesh, building.name, Math.min(54, silhouette.w * 0.72), 9, built.hasBuilding ? silhouette.h - 8 : silhouette.h + 12, '#ffe6a0');
  });
}

// LEGAL: The garage's office annex: a small block on its east side with a door and a window onto
// LEGAL: the street. Its door is where you interact with the garage (map/driveIn garageOfficeDoor).
function addGarageOffice(THREE: typeof ThreeNamespace, garage: ThreeNamespace.Group, w: number, d: number): void {
  const office = garageOfficeCenter({ x:0, y:0 }, w, d);
  const wall = new THREE.MeshStandardMaterial({ color:'#8a7560', roughness:0.85 });
  const block = new THREE.Mesh(new THREE.BoxGeometry(GARAGE_OFFICE.w, 24, GARAGE_OFFICE.d), wall);
  block.position.set(office.x, 12, office.y);
  block.castShadow = true; block.receiveShadow = true;
  garage.add(block);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(GARAGE_OFFICE.w + 2, 1.6, GARAGE_OFFICE.d + 2), new THREE.MeshStandardMaterial({ color:'#3a3d44', roughness:0.9 }));
  roof.position.set(office.x, 24.8, office.y);
  garage.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(8, 13, 0.8), new THREE.MeshStandardMaterial({ color:'#3b2a20', roughness:0.6 }));
  door.position.set(office.x - 5, 6.5, office.y + GARAGE_OFFICE.d / 2 + 0.3);
  garage.add(door);
  const window = new THREE.Mesh(new THREE.BoxGeometry(9, 6, 0.6), new THREE.MeshStandardMaterial({ color:'#ffd98a', emissive:'#ffcf70', emissiveIntensity:0.5 }));
  window.position.set(office.x + 7, 11, office.y + GARAGE_OFFICE.d / 2 + 0.3);
  garage.add(window);
}

// LEGAL: Stage 7 — real estate exists in the world whether or not you hold the deed, so
// LEGAL: these always render. Ownership is shown on the minimap and by the marker colour,
// LEGAL: not by the building appearing out of nowhere when you buy it.
function renderPropertyBuildings(options: MapPlaceRenderOptions): void {
  const { worldGroup, mapObjects, helpers } = options;
  mapObjects.filter(object => object.kind === 'property').forEach(function(object){
    const place = object.ref as PropertyPlace;
    const silhouette = propertySilhouette(place);
    const built = buildPlaceShell(options, propertyArchetype(place), silhouette, helpers.variantForId(place.id));
    const mesh = built.mesh;
    mesh.position.set(object.x, built.y, object.y);
    mesh.name = `property:${place.id}:${place.name}`;
    worldGroup.add(mesh);
    helpers.addSign(mesh, place.name, Math.min(46, silhouette.w * 0.8), 8, silhouette.h - 6, '#9fe0c0');
  });
}

// LEGAL: Footprint by the brand category the property belongs to — a vacant walk-up should
// LEGAL: not look like a waterfront tower.
export function propertySilhouette(place: PropertyPlace): BuildingSilhouette {
  return withArchetype(propertyArchetype(place), basePropertySilhouette(place));
}

function basePropertySilhouette(place: PropertyPlace): BuildingSilhouette {
  const income = place.property.incomePerSec;
  if(income >= 700) return { w:56, h:storeys(96), d:48, color:'#4a5a6d', zoneType:'skyscraper' };
  if(income >= 150) return { w:54, h:storeys(62), d:46, color:'#54566a', zoneType:'residential' };
  if(income >= 30) return { w:60, h:storeys(32), d:44, color:'#6a5a48', zoneType:'commercial' };
  return { w:46, h:storeys(30), d:38, color:'#5d4a46', zoneType:'residential' };
}

function renderLocalBusinesses(options: MapPlaceRenderOptions): void {
  const { worldGroup, mapObjects, helpers } = options;
  mapObjects.filter(object => object.kind === 'local').forEach(function(object){
    const business = object.ref as LocalBusiness;
    const silhouette = localBusinessSilhouette(business);
    const built = buildPlaceShell(options, localArchetype(business), silhouette, helpers.variantForId(business.id));
    const mesh = built.mesh;
    if(built.hasBuilding) helpers.addLocalBusinessDetail(business, mesh);
    mesh.position.set(object.x, built.y, object.y);
    mesh.name = `local:${business.id}:${business.name}`;
    worldGroup.add(mesh);
    helpers.addSign(mesh, business.name, Math.min(42, silhouette.w * 0.82), 8, silhouette.h - 2, business.extorted ? '#ffd77a' : '#b8aee0');
  });
}

export function serviceBuildingSilhouette(building: ServiceBuilding): BuildingSilhouette {
  return withArchetype(serviceArchetype(building), baseServiceSilhouette(building));
}

function baseServiceSilhouette(building: ServiceBuilding): BuildingSilhouette {
  if(building.kind === 'bankHome') return { w:70, h:storeys(42), d:56, color:'#7a5f1a', zoneType:'service' };
  if(building.kind === 'garage') return { w:84, h:storeys(28), d:62, color:'#3e6b78', zoneType:'industrial' };
  // LEGAL: Your garage: a plain low workshop, deliberately unlike the glass dealerships, and
  // LEGAL: sized so a CAR FITS INSIDE IT — you drive in rather than pressing a button at the
  // LEGAL: kerb. 84x70 is inside the lot allocator's own 80x72 footprint on depth and only 2
  // LEGAL: over on each side, comfortably within the 16-unit gap the allocator keeps; the
  // LEGAL: dealerships are 92 wide already. Any narrower and a car (radius 24) cannot pass
  // LEGAL: the walls — see BAY_WALL. Depth is 68 and not 70 because the allocator keeps lot
  // LEGAL: centres 72 from a road centre and the roads are 74 wide: at 70 deep the back of
  // LEGAL: the garage would land exactly on the kerb line.
  // LEGAL: Wide enough to park two cars side by side; the office annex sits beside it.
  if(building.kind === 'playerGarage') return { w:140, h:storeys(28), d:76, color:'#7d6a54', zoneType:'industrial' };
  // LEGAL: Stage 5 — branded shops finally get their own footprints instead of falling
  // LEGAL: through to the generic service silhouette. This was written and reverted during
  // LEGAL: Phase 4 because the bigger footprints walled off the shoreline near spawn and
  // LEGAL: tripped the water/land guard. Two things changed since: the world is far larger
  // LEGAL: with the stage-1c outskirts, and buildings are now placed by the lot allocator
  // LEGAL: with proper setback rather than hand-picked coordinates on the waterfront.
  // LEGAL: A dealership reads as a wide, low glass showroom; a brokerage as a narrow office.
  if(building.kind === 'dealership') return { w:92, h:storeys(26), d:64, color:'#3e6b78', zoneType:'commercial' };
  if(building.kind === 'brokerage') return { w:58, h:storeys(46), d:48, color:'#456f78', zoneType:'commercial' };
  // LEGAL: Branded shops were falling through to the generic default silhouette, which made
  // LEGAL: them smaller and blander than the generic buildings they replaced. Give
  // LEGAL: dealerships a wide showroom footprint and brokerages an office one.
  if(building.kind === 'realty') return { w:62, h:storeys(32), d:48, color:'#456f78', zoneType:'commercial' };
  if(building.kind === 'cityhall') return { w:88, h:storeys(48), d:64, color:'#74623c', zoneType:'service' };
  if(building.kind === 'heist') return { w:72, h:storeys(34), d:58, color:'#5a2a33', zoneType:'industrial' };
  return { w:72, h:storeys(38), d:58, color:'#3e6b78', zoneType:'service' };
}

export function localBusinessSilhouette(business: LocalBusiness): BuildingSilhouette {
  return withArchetype(localArchetype(business), baseLocalBusinessSilhouette(business));
}

function baseLocalBusinessSilhouette(business: LocalBusiness): BuildingSilhouette {
  const color = business.extorted ? '#8a6a1a' : '#4a4360';
  // LEGAL: Enterable places were reading as smaller than the scenery around them.
  if(business.id === 'bar' || business.id === 'marlowe') return { w:62, h:storeys(30), d:52, color:'#4c335a', zoneType:'commercial' };
  if(business.id === 'chopshop') return { w:64, h:storeys(25), d:48, color:'#3e464a', zoneType:'industrial' };
  if(business.id === 'jewelers') return { w:58, h:storeys(34), d:48, color:'#5b5268', zoneType:'shop' };
  if(business.id === 'liquor') return { w:60, h:storeys(28), d:50, color, zoneType:'shop' };
  return { w:56, h:storeys(26), d:46, color, zoneType:'shop' };
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
      dealer.name = `dealer:${corner.id}`;
      dealer.position.set(12, 0, 9);
      dealer.rotation.y = Math.PI;
      group.add(dealer);
    }
    group.position.set(object.x, 0, object.y);
    worldGroup.add(group);
  });
}
