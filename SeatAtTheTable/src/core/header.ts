import { ICONS } from '../config/icons';
import { formatCount, formatMoney, formatMoneyRate } from './format';
import { renderSkyline } from './startSkyline';
import { businesses, ranks } from '../config/ventures';
import { milestones, familyTiers } from '../config/milestones';
import { cars, properties } from '../config/assets';
import { localBusinesses } from '../config/localBusinesses';
import { serviceBuildings } from '../config/serviceBuildings';
import { districts } from '../config/districts';
import { corners } from '../config/trade';
import { politicians } from '../config/politics';
import { gangRecruits } from '../config/gang';
import { npcFirstNames, npcLastNames, npcDispositions } from '../config/npcs';
import { stockMarket } from '../config/stockMarket';
import { banks, DEFAULT_BANK_ID } from '../config/banks';
import { brandById } from '../config/brands';
import { territoryBlocks } from '../config/blocks';
import { CONTESTED_COLOR, YOURS_COLOR, rivalGangForDistrict } from '../config/rivals';
import type { BlockOwner, Brand, GameState, Business, ModalOptions, ModalButton, Solid, District, LocalBusiness, Corner, Politician, InteriorState, Point, Property, ServiceBuilding, GangRecruit, Car, DialogueTree } from '../config/types';
import { blockAtPoint, blockOwner, holdingFor, ownedBlockCount, territoryLegend } from '../map/territory';
import { askingPrice, haggleOfferFor, haggleOffers, isDealerOnly, resolveHaggle, stockForBrand, stockItemCost, stockItemId, stockItemName, turfPricing, type HagglePush, type StockItem } from '../map/storefront';
import { appreciationMult, breakdownChancePerSec, caveatEffectLabel, effectiveHeistBonus, launderingHeatMult, propertyRespectPerSec, repairCost, roughRaidChance, roughRaidLoss, vehicleHeatPerSec } from '../map/brandEffects';
import type { MapAssetKey, MapAssetLibrary } from '../map/assets';
import { loadMapAssetLibrary } from '../map/assets';
import { createCharacterLibrary, type CharacterLibrary } from '../map/characters';
import { DEFAULT_PLAYER_LOOK, WARDROBE, createPersonParts, normalizeLook, useSculptedPersonParts } from '../map/personModel';
import { BIKE_SEATS, seatedRider, type BikeClass } from '../map/bikeRider';
import { isItemOwned, itemKey, itemPrice, lookPrice, ownedWardrobe, type MallShop, type WardrobeSlot } from '../config/mallShops';
import { MALL_ROOM, MALL_SPOTS, MALL_UPPER_SPOTS } from '../map/mallInterior';
import { MALL_BODY, buildMall, mallSolids } from '../map/mall';
import { buildCentralPark, centralParkSolids } from '../map/centralPark';
import { specialPlace, specialPlaceSolids } from '../map/placeSpecials';
import { buildSuburb, suburbSolids } from '../map/suburb';
import { countryFootprint } from '../map/countryBuildings';
import { renderRoamingActors } from '../map/actorRendering';
import { createAmenityModal, mapAmenities } from '../map/amenities';
import { isFireRoadBest, minigameOpen, playMinigame, type MinigameResult } from '../map/minigames';
import { FIRE_ROAD_COURSE, advanceRacer, placings, pointAlong, progressAlong, racePrize, type RaceCourse, type Racer } from '../map/race';
import { offRoadSpeedMultiplier } from '../map/offRoad';
import { mountTouchStick } from '../map/touchControls';
import { createQualityGovernor } from '../map/adaptiveQuality';
import { createCheatListener } from './cheats';
import { depositToVault, withdrawFromVault } from './vault';
import { openWardrobe } from './wardrobe';
import { createCameraRig, SHADOW_HALF_SIZE, sunShadowFrame } from '../map/cameraRig';
import { waterClock } from '../map/waterShader';
import { auditScene, flagIssues } from '../map/sceneAudit';
import { CHEAT_VEHICLES, buildJetpack, isFlyingVehicle } from '../map/cheatVehicles';
import { circleHitsObstacle, isRunOverBy, vehicleObstacle, type Obstacle } from '../map/obstacles';
import { loadVehicleLibrary, spinWheels, trafficFootprint, vehicleClassForCar, vehicleClassForTraffic, type VehicleLibrary } from '../map/vehicleModels';
import { buildingModelFor, loadBuildingLibrary, type BuildingLibrary } from '../map/buildingModels';
import type { PlaceArchetype } from '../map/archetypes';
import { buildAmenityModel as buildMapAmenityModel } from '../map/amenityRendering';
import { seededRandom } from '../map/random';
import { applyMapWorldCoordinates, createMapBuildings, mapNpcs } from '../map/markers';
import { actorRadius, canMoveTo, collidesSolid, isWaterBlocked, nearestFreePoint, penetrationDepth } from '../map/movement';
import { drawMinimap as drawMapMinimap, MINIMAP_SCALE } from '../map/minimap';
import type { MapObject } from '../map/objects';
import { solidsFromObjects } from '../map/objects';
import { buildMapObjects, ventureFootprint } from '../map/objectFactory';
import { GARAGE_RETURN_SECONDS, PARKING_DISTRICT_IDS, carSpawnPositionForDistrict, defaultParkedCarPositions, parkedCarPositionForDistrict, secondsUntilGarageReturn, shouldReturnToGarage } from '../map/parking';
import { renderMapPlaces, serviceBuildingSilhouette } from '../map/placeRendering';
import { archetypeExtraSolids, archetypeSilhouette, localArchetype, serviceArchetype, ventureArchetype } from '../map/archetypes';
import { GARAGE_OFFICE, bayParkSpot, bayStandSpot, garageBay, garageOfficeCenter, garageOfficeDoor, isCarInBay, shouldParkInBay, type Bay } from '../map/driveIn';
import { allRegions, regionNameAt } from '../map/regions';
import { propertyPlaces, type PropertyPlace } from '../map/propertyPlaces';
import { createMapPlaceRecords, mapPlaceCategoryLabel, type MapPlaceCategory, type MapPlaceRecord } from '../map/places';
import { activeTrainSnapshot, bridgeAtPoint, mapPointContext, nearestPlaceAtPoint, placesByCategory, routeHintBetween, routeSummary, trainCrossingBlockAtPoint } from '../map/queries';
import { createOutskirtSceneryLayout } from '../map/outskirtScenery';
import { rotatedHalfExtents } from '../map/layout';
import { outskirtPlaceLabel } from '../map/outskirts';
import { allocateServiceLots } from '../map/serviceLots';
import { createRoamingActors, settleRoamingActors, updateRoamingActors } from '../map/roaming';
import {
  POKER_PAYOUTS,
  SLOT_PAYOUTS,
  slotReturn,
  spinSlots,
  blackjackReturn,
  cardLabel,
  drawReplacements,
  freshDeck,
  handValue,
  playDealerHand,
  pokerReturn,
  rankPokerHand,
  rouletteColor,
  rouletteReturn,
  settleBlackjack,
  shuffle,
  spinRoulette,
  type Card,
  type RouletteBet,
} from '../map/casino';
import { buildBaseGround, buildCanalBridges, buildCanalWater, buildLandmarks, landmarkSolids, buildOutskirtScenery, buildRailAndRiver, buildRoadNetwork, buildStreetTrees } from '../map/sceneBuilding';
import { createMapSceneMaterials, createSceneBuildTimer } from '../map/scenePerformance';
import { buildIntersectionFurniture as buildMapIntersectionFurniture, nearestLamps, showSignal, streetLampBulbs, useStreetModels, type LampHead, type SignalHeads } from '../map/streetFurniture';
import { signalState } from '../map/trafficRules';
import { plowOut, snowSurfaceFor, snowWhiteness, stepPlowed, stepSnowCover } from '../map/snow';
import { terrainSnow } from '../world/render/terrain';
import { frontageClearance, generateLots, lotSolid, type Lot } from '../world/data/lots';
import { buildCityLots } from '../world/render/lots';
import { generateStreetProps, streetPropSolids, type StreetProp } from '../world/data/streetProps';
import { loadPropLibrary, type PropLibrary } from '../world/assets/props';
import { LANDMARK_MODELS, loadModelCatalog, type ModelCatalog } from '../world/assets/catalog';
import { loadPersonGeometries } from '../world/assets/people';
import { loadTreeShapes } from '../world/assets/trees';
import { useTreeShapes } from '../map/treeModels';
import { loadStreetModels } from '../world/assets/street';
import { loadPlaceModels } from '../world/assets/places';
import { usePlaceModels } from '../map/placeModels';
import { LIGHT_SKINS, closeUpFor, type CloseUp } from '../map/closeUps';
import { interiorPlanFor, stairsLanding, type InteriorPlan } from '../map/interiorPlans';
import type { InteriorCar } from '../map/interiorPieces';
import { VEHICLE_SCALE } from '../map/scale';
import { DISTRICT_OFFSETS, OUTSKIRT_PLACE_LOTS, VIEW_H, VIEW_W, WORLD_H, WORLD_W, WINDHAVEN_LANDMASS, landmarks, roadNetwork, spawnPoints } from '../map/world';
import { districtIdAtPlayablePoint, nearestRoadAtPoint, windhavenMapModel } from '../map/mapModel';
import { clampPointToBounds, createMapViewport, screenToWorld } from '../map/viewport';
import { INTERIOR_SCALE, buildInteriorRoom3d, spotKey, type InteriorView } from '../map/interiorRoom3d';
import { activeMissionCount, advanceMissionStage, canOfferRepeatableEvent, canOfferUniqueEvent, completeMission, declineMission, delayedMissionReady, missionCompleted, missionSaveDefaults, recordEventOffer, scheduleDelayedMission, startMission } from './missions';
import { freezeStaticScenery } from '../map/staticScenery';
import { mergeLooseByPrefix, mergeMeshesWithin, type MergeGeometries } from '../map/mergeScenery';
import { choiceDelta, describeMissionLedger, foldMissionLedger, openMissionLedger, rebaseMissionLedger, reconcileResultText, type MissionLedger, type OutcomeSnapshot } from './missionLedger';
import { getOnboardingSteps, type OnboardingMissionSnapshot, type OnboardingPanelTarget } from './onboarding';
import { MISSION_CONFIG as PHASE2_MISSION_CONFIG, OUTSKIRT_VENUE_CONFIG, missionEventPool, type MissionEventDefinition } from '../config/missions';
import type * as ThreeNamespace from 'three';



  // LEGAL: ================= ASSETS: CARS & PROPERTIES =================

  // LEGAL: Independent shops — not yours. You can rob them (one-off, cooldown, risk)
  // LEGAL: or extort them (permanent small income + permanent small heat, reversible).

  // LEGAL: Service buildings — not Ventures (no level/crew), just physical doors into
  // LEGAL: existing tab systems (Bank/Assets/Politics) or a direct dialogue (the heist).

  // LEGAL: ================= TERRITORY: DISTRICTS =================
  // LEGAL: Control is 0-100. >=60 is "yours" (bonus applies), <=25 is "rival controlled"
  // LEGAL: (small penalty), in between is contested (neutral). Control drifts based on
  // LEGAL: your presence there (muscle, active corners, ventures) vs. rival pressure.
  function districtStatus(id: string){
    const c = districts.find(d=>d.id===id)!.control;
    return c>=60 ? 'yours' : (c<=25 ? 'rival' : 'contested');
  }
  // LEGAL: Block-level ownership. districtStatus answers "who holds this district"; this
  // LEGAL: answers "who holds this street", which is what a shop's pricing actually reads.
  // LEGAL: Both derive from the same district control value, so they can never disagree.
  function districtControl(id: string){ return districts.find(d=>d.id===id)?.control ?? 0; }
  function ownerAt(point: Point): BlockOwner {
    const block = blockAtPoint(territoryBlocks, point);
    if(!block) return districtStatus(state.currentDistrict) as BlockOwner;
    return blockOwner(block, districtControl(block.district));
  }
  function blockNameAt(point: Point): string {
    return blockAtPoint(territoryBlocks, point)?.name ?? 'open ground';
  }

  function devlinIncomeBonus(){ const s=districtStatus('devlin'); return s==='yours'?1.15:(s==='rival'?0.9:1); }
  function westsideHeatMult(){ const s=districtStatus('westside'); return s==='yours'?0.75:(s==='rival'?1.25:1); }
  function westsideRateBonus(){ const s=districtStatus('westside'); return s==='yours'?1.15:(s==='rival'?0.85:1); }
  function hubInterestMult(){ return districtStatus('hub')==='yours' ? 1.5 : 1; }
  function hubHeistBonus(){ return districtStatus('hub')==='yours' ? 0.10 : 0; }
  function pushCost(d: District){ return Math.ceil(20 * Math.pow(1.6, d.pushCount)); }
  function pushCashCost(d: District){ return Math.ceil(300 * Math.pow(1.5, d.pushCount) * discountMult()); }
  function pushDistrict(id: string){
    const d = districts.find(x=>x.id===id);
    if(!d) return;
    if(state.playSeconds < d.nextPushAt) return;
    const respCost = pushCost(d), cashCost = pushCashCost(d);
    if(state.respect < respCost || state.cash < cashCost) return;
    state.respect -= respCost;
    state.cash -= cashCost;
    // LEGAL: Muscle and guns behind the claim make the push land harder.
    const backing = Math.min(6, state.muscleCount*0.4 + Math.min(state.guns, 20)*0.15);
    d.control = Math.min(100, d.control + 10 + backing);
    d.pushCount += 1;
    d.nextPushAt = state.playSeconds + 90;
    state.heat = Math.min(100, state.heat + 6);
    let note = `<i aria-hidden="true" class="ph-duotone ph-map-pin"></i> You bankroll a hard push on ${d.name}. Turf control now ${Math.round(d.control)}%.`;
    // LEGAL: Pushing openly can draw a police response or cost you a corner.
    if(Math.random() < 0.18){
      state.investigation = Math.min(100, state.investigation + 6);
      const dealt = corners.filter(c=>c.district===d.id && c.dealer && !c.busted);
      if(dealt.length && Math.random() < 0.5){
        const c = dealt[Math.floor(Math.random()*dealt.length)];
        c.busted = true; c.dealer = false; c.bustCooldownAt = state.playSeconds + 180;
        note += ` Cops move on the noise — ${c.name} gets rolled up.`;
      } else {
        note += ` The open show of force puts you on the department's radar.`;
      }
    }
    log(note);
    renderAll();
  }

  // LEGAL: ================= THE TRADE: PRODUCT, CORNERS =================
  // LEGAL: Replaces the old abstract "Runners" venture. Product is produced at the
  // LEGAL: Lab (cash-funded, no crew) and consumed by dealers stationed on corners
  // LEGAL: across districts. No product in stock means a staffed corner just idles —
  // LEGAL: same production/distribution coupling Dope Slinger runs on, just spatial now.

  // LEGAL: ================= POLITICS =================
  // LEGAL: Influence is a cash-funded meter. Named politicians take individual favor
  // LEGAL: (also cash) and each unlock a distinct permanent bonus at favor>=60.
  // LEGAL: Running for office is a one-shot capstone gated behind enough influence.
  function coleActive(){ return politicians.find(p=>p.id==='cole')!.favor >= 60; }
  function boyleActive(){ return politicians.find(p=>p.id==='boyle')!.favor >= 60; }
  function whitmoreActive(){ return politicians.find(p=>p.id==='whitmore')!.favor >= 60; }

  // LEGAL: ================= GANG =================
  // LEGAL: A small, hand-authored roster (not procedural) — each recruit requires an
  // LEGAL: initiation trial through the dialogue engine and grants a distinct
  // LEGAL: permanent bonus once inducted, plus counts toward Gang Strength for wars.
  function gangStrength(){
    const car = getEquippedCar();
    let s = state.muscleCount*1 + gangRecruits.filter(g=>g.inducted).length*3;
    s += Math.min(state.guns, 40)*0.4; // LEGAL: firepower, capped so guns can't fully replace bodies
    if(car) s += car.heistBonus*10;
    if(gangRecruits.find(g=>g.id==='les')!.inducted) s *= 1.08;
    return s;
  }
  function rivalStrength(){
    const ws = districts.find(d=>d.id==='westside')!;
    return 20 + (100-ws.control)*0.3
      + (state.worldMemory.snitchOnRival === true ? PHASE2_MISSION_CONFIG.snitchRivalStrengthPenalty : 0)
      + (state.worldMemory.rejectedHustler === true ? PHASE2_MISSION_CONFIG.rejectedHustlerRivalStrengthPenalty : 0);
  }
  // LEGAL: Black-market arms. Bought in packs; price climbs as you stockpile.
  const GUN_PACK = 5;
  function gunPackCost(){ return Math.ceil(1500 * Math.pow(1.14, Math.floor(state.guns/GUN_PACK)) * discountMult()); }

  // LEGAL: ================= DIALOGUE ENGINE =================
  // LEGAL: Reusable branching conversation tree. Any future NPC/mission/politics/gang
  // LEGAL: interaction plugs into this same structure: { npcName, nodes:{ id:{text,choices:[{label,effect,next}]} } }
  const dialogues: Record<string, DialogueTree> = {
    sanjay: {
      npcName: 'Sanjay (Cousin)',
      nodes: {
        start: { text:"\"Still got the couch made up if you ever need it,\" Sanjay says, only half joking. \"Look at you, though. Didn't think you'd actually pull this off.\"",
          choices:[
            { label:'Thank him properly', next:'thanks', effect:function(){ state.respect += 2; } },
            { label:'Ask if he\'s heard from home', next:'home' },
            { label:'Keep it short', next:null },
          ]},
        thanks: { text:"He waves it off, but you can tell it lands somewhere. \"Just don't forget where you started, yeah?\"", choices:[ { label:'Leave', next:null } ] },
        home: { text:"He goes quiet for a second. \"Everyone's careful about what they say on the phone these days. But your mother asks about you. Always.\"", choices:[ { label:'Leave', next:null } ] },
        stage1: { text:"\"Ravi's still getting used to the cold,\" Sanjay says. \"Doesn't say much about Delhi. But he asks about you when you're not around.\"",
          choices:[
            { label:'Ask how you can help him settle', next:'stage1b', effect:function(){ state.respect += 3; } },
            { label:'Just say thanks for looking out for him', next:'thanks' },
            { label:'Keep it short', next:null },
          ]},
        stage1b: { text:"\"Just be around,\" Sanjay says. \"That's the whole thing, honestly. He doesn't need you to fix anything. He needs you to still be his cousin, not just — \" he gestures vaguely at everything you've built. \"This.\"", choices:[ { label:'Leave', next:null } ] },
        stage2: { text:"Half the family's here now. Sanjay barely recognizes the block anymore — or you, some days. \"You used to ask my permission before you did anything. Now I hear about half of it after the fact.\"",
          choices:[
            { label:'"You could\'ve said no, back then."', next:'stage2b' },
            { label:'"I still ask. You just don\'t remember."', next:'stage2c' },
            { label:'Keep it short', next:null },
          ]},
        stage2b: { text:"He laughs, actually laughs. \"Fair. I never was much good at saying no to you.\"", choices:[ { label:'Leave', next:null } ] },
        stage2c: { text:"\"Maybe,\" he says, not quite believing it, not quite not. \"Doesn't matter now either way.\"", choices:[ { label:'Leave', next:null } ] },
        stage3: { text:"Everyone who's coming has come. Sanjay looks around the room — his mother, his brother, people who wouldn't have crossed the street for either of you a year ago now working for you — and doesn't say anything for a while. \"I keep waiting to feel like this was a bad idea,\" he finally says. \"It hasn't happened yet.\"",
          choices:[
            { label:'"It won\'t."', next:'stage3b', effect:function(){ state.respect += 5; } },
            { label:'Say nothing, just nod', next:'stage3b' },
          ]},
        stage3b: { text:"He nods back. That's the whole conversation, and it's enough.", choices:[ { label:'Leave', next:null } ] },
      }
    },
    dice: {
      npcName: 'Dice',
      nodes: {
        start: { text:"Dice leans against the wall like he owns it, which — for now — his people mostly do. \"West Side's not exactly open for business, friend. Depends how polite you plan on being about it.\"",
          choices:[
            { label:'"I plan on owning it."', next:'bold', effect:function(){ state.respect += 3; } },
            { label:"Keep it friendly", next:'friendly' },
            { label:'Walk off', next:null },
          ]},
        bold: { text:"He laughs, short and humorless. \"Bold. We'll see how that holds up.\" Word of the exchange gets around either way.", choices:[ { label:'Leave', next:null } ] },
        friendly: { text:"\"Smart,\" he says. \"For now.\" He doesn't move from the wall, but he doesn't stop you either.", choices:[ { label:'Leave', next:null } ] },
        stage1: { text:"Dice doesn't lean against the wall this time — he's watching the street instead of you. \"You're not going away. I'll give you that much.\" He doesn't sound happy about it.",
          choices:[
            { label:'"Smart men adjust."', next:'stage1b' },
            { label:'Say nothing, let him watch', next:null },
          ]},
        stage1b: { text:"\"I've adjusted before,\" he says. \"Ask around about the last guy who didn't.\" It's not quite a threat. It's not quite not one, either.", choices:[ { label:'Leave', next:null } ] },
        stage2: { text:"There's no one at the wall anymore — or there is, but it isn't Dice's play now. He finds you anyway, hands half in his pockets, more tired than beaten. \"You won. I'm not going to pretend otherwise.\"",
          choices:[
            { label:'Offer him a way to stay useful', next:'stage2b', effect:function(){ state.respect += 8; state.cash += 600; } },
            { label:'Tell him to disappear', next:'stage2c' },
          ]},
        stage2b: { text:"He looks almost surprised. \"Didn't figure you for generous.\" He slides you something — cash, a name, information, hard to say which mattered more — and walks off before either of you has to make it weirder than it is.", choices:[ { label:'Leave', next:null } ] },
        stage2c: { text:"He nods once, like he expected that answer more than the other one. \"Didn't figure you for generous either way.\" He's gone within the week.", choices:[ { label:'Leave', next:null } ] },
      }
    },
    reyes: {
      npcName: 'Councilman Reyes',
      nodes: {
        start: { text:"Reyes shakes your hand like he's already decided you're worth knowing. \"A man builds what you've built, people downtown start asking who he is. I'd rather hear it from you first.\"",
          choices:[
            { label:'"Ask away."', next:'open' },
            { label:'Keep it vague', next:'vague' },
            { label:'Excuse yourself', next:null },
          ]},
        open: { text:"\"Appreciate the directness,\" he says, sliding you a card. \"City hall moves slow on its own. Sometimes it needs a push from outside.\" A conversation for another day, clearly.", choices:[ { label:'Leave', next:null } ] },
        vague: { text:"He smiles like he expected that. \"Fair enough. Everyone in the Hub learns to talk like that eventually.\"", choices:[ { label:'Leave', next:null } ] },
        stage1: { text:"\"You've been busy,\" Reyes says, and this time there's no small talk first. \"There's a seat opening up. The kind of seat a man with your kind of reach could actually hold, if he wanted it.\"",
          choices:[
            { label:'"I might want it."', next:'stage1b', effect:function(){ state.respect += 4; } },
            { label:'"Not my kind of thing."', next:'stage1c' },
          ]},
        stage1b: { text:"\"Then build the influence to take it seriously,\" he says. \"I'll be watching either way.\"", choices:[ { label:'Leave', next:null } ] },
        stage1c: { text:"\"Everyone says that,\" he says, \"right up until they don't.\" He doesn't push it further. He doesn't have to.", choices:[ { label:'Leave', next:null } ] },
        stage2: { text:"Reyes greets you differently now — a hand on the shoulder instead of a handshake. \"City Councilman,\" he says, testing how it sounds out loud. \"Suits you better than I expected it to.\"",
          choices:[
            { label:'"You knew before I did."', next:'stage2b' },
            { label:'"Don\'t get used to it."', next:'stage2c' },
          ]},
        stage2b: { text:"\"I know most things before people do,\" he says, not quite joking. \"It's the job.\"", choices:[ { label:'Leave', next:null } ] },
        stage2c: { text:"He laughs, genuinely this time. \"That's the first thing you've said that actually sounds like City Hall.\"", choices:[ { label:'Leave', next:null } ] },
      }
    },
    campaign: {
      npcName: 'City Hall',
      nodes: {
        start: { text:"Running for city councilman means a real campaign — money, endorsements, and three months (three minutes) of vicious media scrutiny. You've got the influence to be taken seriously. How do you want to run it?",
          choices: [
            { label:'Grassroots ($250,000) — risky', next:'result', effect:function(){ runCampaign('grassroots'); } },
            { label:'Full machine ($1,500,000) — safer', next:'result', effect:function(){ runCampaign('machine'); } },
            { label:'Not yet', next:null },
          ]},
        result: { text:'', choices:[ { label:'Leave', next:null } ] },
      }
    },
    gangwar: {
      npcName: 'West Side, After Dark',
      nodes: {
        start: { text:"Dice's people aren't going to hand West Side over. If you want it, you take it — the question is how loud you're willing to be about it.",
          choices: [
            { label:'Full assault — needs 8 guns · $4,000', next:'assault_prep', effect:function(){} },
            { label:'Targeted hits — needs 4 guns · $1,800', next:'targeted_prep', effect:function(){} },
            { label:'Not tonight', next:null },
          ]},
        assault_prep: { text:"Your guys are geared up and rolling out when a squad car swings onto the block — the shooting's already started and it's loud. There's a beat cop who can be reached, for a price.",
          choices: [
            { label:'Pay off the responding patrol (−$2,500)', next:'result', effect:function(){ resolveWar('assault', true); } },
            { label:'Push through — eat the heat', next:'result', effect:function(){ resolveWar('assault', false); } },
            { label:'Stand down', next:null },
          ]},
        targeted_prep: { text:"You keep it tight — a couple of cars, in and out. Still, a patrol is circling the area and someone's going to notice the muzzle flashes.",
          choices: [
            { label:'Grease the patrol to look away (−$1,200)', next:'result', effect:function(){ resolveWar('targeted', true); } },
            { label:'Run it clean and fast — eat the heat', next:'result', effect:function(){ resolveWar('targeted', false); } },
            { label:'Stand down', next:null },
          ]},
        result: { text:'', choices:[ { label:'Leave', next:null } ] },
      }
    },
    initChino: {
      npcName: 'Chino',
      nodes: {
        start: { text:"Chino's run corners since he was fourteen. \"You want me in, I'm in. But I do this my way, or I don't do it.\"",
          choices: [
            { label:'Let him run it his way', next:'result', effect:function(){ inductRecruit('chino', 'safe'); } },
            { label:'Test him first', next:'result', effect:function(){ inductRecruit('chino', 'test'); } },
          ]},
        result: { text:'', choices:[ { label:'Leave', next:null } ] },
        checkin: { text:"\"Corners are quiet,\" Chino says, which from him counts as a full report. \"Nobody's dumb enough to try us twice.\"", choices:[ { label:'Leave', next:null } ] },
      }
    },
    initLes: {
      npcName: 'Les "Lockjaw" Tavares',
      nodes: {
        start: { text:"Les doesn't say much. He doesn't have to — everyone on the West Side already knows what he did the one time someone talked.",
          choices: [
            { label:'Vouch for him yourself', next:'result', effect:function(){ inductRecruit('les', 'safe'); } },
            { label:'Have him prove himself', next:'result', effect:function(){ inductRecruit('les', 'test'); } },
          ]},
        result: { text:'', choices:[ { label:'Leave', next:null } ] },
        checkin: { text:"Les nods at you. That's the whole conversation. It's also, somehow, exactly enough information.", choices:[ { label:'Leave', next:null } ] },
      }
    },
    initNadia: {
      npcName: 'Nadia Volkov',
      nodes: {
        start: { text:"Nadia knows every beat cop on the West Side by first name — and what each of them owes somebody. \"Trust is expensive,\" she says. \"But cheaper than a raid.\"",
          choices: [
            { label:'Pay what she asks', next:'result', effect:function(){ inductRecruit('nadia', 'safe'); } },
            { label:'Negotiate hard', next:'result', effect:function(){ inductRecruit('nadia', 'test'); } },
          ]},
        result: { text:'', choices:[ { label:'Leave', next:null } ] },
        checkin: { text:"\"Two patrols got rerouted this week,\" Nadia says, like she's mentioning the weather. \"You're welcome.\"", choices:[ { label:'Leave', next:null } ] },
      }
    },
    initBird: {
      npcName: 'Bird',
      nodes: {
        start: { text:"Bird's been a lookout since before you got here. Doesn't say much, sees everything. \"I watch corners. That's all I do. That's all I want to do.\"",
          choices: [
            { label:'"That\'s enough."', next:'result', effect:function(){ inductRecruit('bird', 'safe'); } },
            { label:'Push him to do more', next:'result', effect:function(){ inductRecruit('bird', 'test'); } },
          ]},
        result: { text:'', choices:[ { label:'Leave', next:null } ] },
        checkin: { text:"Bird just points — at a corner, a car parked a little too long, something you wouldn't have noticed. He's already looking somewhere else by the time you turn to see it.", choices:[ { label:'Leave', next:null } ] },
      }
    },
    bankheist: {
      npcName: 'The Vault Job — After Hours',
      nodes: {
        start: { text:"The vault's on a timer, the guard rotates every twenty minutes, and you've realistically got one real shot at this before they upgrade the locks. How do you want to play it?",
          choices: [
            { label:'Smash and grab, alone', next:'result', effect:function(){ resolveHeist('smash'); } },
            { label:'Bring the crew', next:'result', effect:function(){ resolveHeist('crew'); } },
            { label:'Walk away', next:null },
          ]},
        result: { text:'', choices:[ { label:'Leave', next:null } ] },
      }
    },
  };
  // LEGAL: Recurring NPCs don't have one fixed conversation — each has a small set of
  // LEGAL: story stages gated on real progress (prestige, territory control, politics),
  // LEGAL: so revisiting them later reflects what's actually happened in the other
  // LEGAL: systems instead of repeating the same static lines forever.
  function npcOpeningNode(npcKey: string){
    if(npcKey==='sanjay'){
      if(grandmotherActive()) return 'stage3';
      if(sisterActive()) return 'stage2';
      if(brotherActive()) return 'stage1';
      return 'start';
    }
    if(npcKey==='dice'){
      const control = districts.find(d=>d.id==='westside')?.control ?? 0;
      if(control>=60) return 'stage2';
      if(control>=25) return 'stage1';
      return 'start';
    }
    if(npcKey==='reyes'){
      if(state.electedOffice) return 'stage2';
      if(state.influence>=50) return 'stage1';
      return 'start';
    }
    return 'start';
  }
  function playDialogue(npcKey: string, nodeId: string){
    const tree = dialogues[npcKey];
    const node = tree.nodes[nodeId];
    showModal({
      eyebrow: tree.npcName,
      title: tree.npcName.split(' (')[0],
      body: `<p>${node.text}</p>`,
      buttons: node.choices.map(c=> ({ label:c.label, onClick:function(){ if(c.effect) c.effect(); if(c.next){ playDialogue(npcKey, c.next); } else { renderAll(); } } }))
    });
  }

  // LEGAL: ================= NPC REGISTRY =================
  // LEGAL: Named NPCs are hand-authored and permanent (see `dialogues` above).
  // LEGAL: Procedural NPCs are generated from pools — this is the seed for a larger
  // LEGAL: rotating cast once robbery/recruitment lands in later phases.
  function generateNPC(){
    return {
      name: npcFirstNames[Math.floor(Math.random()*npcFirstNames.length)] + ' ' + npcLastNames[Math.floor(Math.random()*npcLastNames.length)],
      disposition: npcDispositions[Math.floor(Math.random()*npcDispositions.length)],
    };
  }
  function proceduralInteract(){
    const npc = state.procNpc;
    showModal({
      eyebrow:'A Stranger', title: npc.name,
      body:`<p>${npc.disposition} energy. Could be nothing, could be something.</p>`,
      buttons:[
        { label:'Make conversation', onClick:function(){
          if(Math.random()<0.5){ state.respect += 3; log(`<i aria-hidden="true" class="ph-duotone ph-info"></i> ${npc.name} respects the hustle. +3 respect.`); }
          else { const tip = Math.ceil(20+Math.random()*60); state.cash += tip; log(`<i aria-hidden="true" class="ph-duotone ph-info"></i> Small talk with ${npc.name} turns into a $${tip} tip.`); }
          renderAll();
        }},
        { label:'Walk away', onClick:function(){} },
      ]
    });
  }

  // LEGAL: A building you can own, seen from the street: whose it is, what it pays, and where to buy
  // LEGAL: it. Walking up to one used to fall through to the stranger popup with a random name.
  function openPropertyPlace(place: PropertyPlace): void {
    const property = place.property;
    const brand = brandById(property.brand);
    const owned = state.ownedProperties.includes(property.id);
    const office = serviceBuildings.find(s => s.brandId === property.brand);
    const officePlace = office ? mapObjects.find(o => o.kind === 'service' && (o.ref as ServiceBuilding).id === office.id) : null;
    const body = owned
      ? `<p class="flavor">Yours. The keys are on your ring and the rent comes in on time.</p>${briefRow('Pays', formatMoneyRate(propertyIncomeFor(property)))}`
      : `<p class="flavor">${brand ? `Listed with ${brand.name}.` : 'On the market.'} ${property.online ? 'You can close on it from the phone.' : 'You have to see the agent in person.'}</p>`
        + briefRow('Price', formatMoney(property.cost)) + briefRow('Would pay', formatMoneyRate(property.incomePerSec));
    const buttons: ModalOptions['buttons'] = [];
    if(!owned && officePlace) buttons.push({ label:`Mark ${office!.name} on the GPS`, onClick:function(){ setGlobalWaypoint({ x:officePlace.x, y:officePlace.y }); log(`<i aria-hidden="true" class="ph-duotone ph-map-pin"></i> GPS set to ${office!.name}.`); renderAll(); } });
    buttons.push({ label:'Walk on', secondary:buttons.length > 0 });
    showModal({ eyebrow:owned ? 'Your property' : 'For sale', title:place.name, body, buttons });
  }

  // LEGAL: ================= STATE =================
  function firstEventDelay(): number { return 110 + Math.random()*60; }
  const state: GameState = {
    cash: 47, respect: 0, heat: 0,
    investigation: 0, layingLow: false, crackdownUntil: 0, nextCrackdownAt: 360,
    territoryTier: 0, negotiateTier: 0,
    muscleCount: 0, guns: 0, ratCount: 0, bribeOn: false,
    prestigeCount: 0, seenMilestones: new Set<string>(),
    started: false, lastTick: Date.now(), nextEventAt: firstEventDelay(),
    playSeconds: 0, investorPenalty: 0, appearance: { ...DEFAULT_PLAYER_LOOK }, ownedWardrobe: [], vaultCash: 0,
    procNpc: generateNPC(),
    bankAccounts: {}, selectedBank: DEFAULT_BANK_ID, nextHeistAt: 0,
    ownedCars: [], equippedCar: null, ownedProperties: [],
    // LEGAL: Phase 4 caveats: when each property was bought (waterfront rent appreciates
    // LEGAL: with how long you have held it) and which used cars are currently broken down.
    propertyOwnedAt: {}, brokenCars: [], carColors: {}, carDecals: {}, carParkedAt: null,
    currentDistrict: 'devlin', product: 0, productLevel: 0, currentInterior: null,
    inVehicle: false,
    waypoints: { devlin:null, westside:null, hub:null, global:null },
    parkedCarPos: defaultParkedCarPositions(),
    influence: 0, influenceBuys: 0, electedOffice: false, nextCampaignAt: 0, nextWarAt: 0,
    campaignActive: false, campaignEndAt: 0, campaignStyle: '',
    portfolio: {}, marketPrices: {}, marketHistory: {}, nextMarketTickAt: 0,
    financeView: 'vault', activeStock: null,
    currentNews: [], newsQueue: [], nextNewsAt: 0,
    cityNews: [], nextCityNewsAt: 150,
    eventRepeats: {}, eventHistory: {}, activeMissions: {}, completedMissions: {}, worldMemory: {},
  };

  // LEGAL: ================= HELPERS =================
  // LEGAL: byId fails fast and loudly when a required element is missing, rather
  // LEGAL: than returning null and crashing later on a silent property access.
  // LEGAL: byIdOrNull is for elements that are legitimately sometimes absent.
  function byId<T extends HTMLElement = HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Required element #${id} not found`);
    return el as T;
  }
  function byIdOrNull<T extends HTMLElement = HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
  }
  // LEGAL: Each family arrival costs four times the last.
  function prestigeThreshold(){ return 50000 * Math.pow(4, state.prestigeCount); }
  function hasFamilyTier(index: number){ return state.prestigeCount > index; }
  function brotherActive(){ return hasFamilyTier(0); }
  function motherActive(){ return hasFamilyTier(1); }
  function sisterActive(){ return hasFamilyTier(2); }
  function deepakActive(){ return hasFamilyTier(3); }
  function grandmotherActive(){ return hasFamilyTier(4); }
  function discountMult(){ return Math.pow(0.93, state.negotiateTier); }
  // LEGAL: PROGRESSION_BOOST is a small global income nudge to ease pacing.
  const PROGRESSION_BOOST = 1.06;
  function globalIncomeMult(){ return Math.max(0.1, PROGRESSION_BOOST * (brotherActive()?1.5:1) * (1 - (state.investorPenalty||0))); }
  function nadiaInducted(){ return gangRecruits.find(g=>g.id==='nadia')!.inducted; }
  function chinoInducted(){ return gangRecruits.find(g=>g.id==='chino')!.inducted; }
  function birdInducted(){ return gangRecruits.find(g=>g.id==='bird')!.inducted; }
  function whitmoreMult(){ return whitmoreActive() ? 0.7 : 1; }
  function researchCostFor(b: Business){ return Math.ceil(b.researchCost * discountMult() * (coleActive()?0.9:1)); }
  function heatMult(){ return Math.max(0.3, (state.bribeOn?0.4:1) * (motherActive()?0.65:1) * (boyleActive()?0.8:1) * (nadiaInducted()?0.9:1)); }

  // LEGAL: ================= HEAT / WANTED / INVESTIGATION =================
  // LEGAL: Heat is a fast gauge that maps to a GTA-style WANTED ladder (0-4). Each
  // LEGAL: tier escalates ongoing consequences. Sustained high tiers feed the slow,
  // LEGAL: sticky INVESTIGATION gauge, and it — not heat — is what triggers the raid.
  const WANTED_TIERS = [
    { min: 0,  label: 'COLD',      color: '#4a7c59' },
    { min: 25, label: 'NOTICED',   color: '#c9a227' },
    { min: 50, label: 'WATCHED',   color: '#d98324' },
    { min: 70, label: 'HEAT',      color: '#d14e3b' },
    { min: 90, label: 'RAID RISK', color: '#e11d1d' },
  ];
  function wantedTier(){ let t = 0; for(let i=0;i<WANTED_TIERS.length;i++){ if(state.heat >= WANTED_TIERS[i].min) t = i; } return t; }
  function crackdownActive(){ return state.playSeconds < state.crackdownUntil; }
  // LEGAL: Every simultaneous illegal front (street venture, working corner, extorted
  // LEGAL: shop) adds a little conspicuousness; a sprawling operation draws
  // LEGAL: disproportionately more attention than a single quiet racket.
  function illegalFrontCount(){
    const street = businesses.filter(b=>b.category==='street' && b.level>0).length;
    const cornerFronts = corners.filter(c=>c.dealer && !c.busted).length;
    const extortFronts = localBusinesses.filter(b=>b.extorted).length;
    return street + cornerFronts + extortFronts;
  }
  function illegalIncomePerSec(){
    const streetLow = state.layingLow ? 0.4 : 1;
    const street = businesses.filter(b=>b.category==='street').reduce((s,b)=> s+incomeFor(b), 0) * streetLow;
    return (street * globalIncomeMult()) + cornerIncomePerSec() * (state.layingLow?0.4:1) + localBizIncome() * (state.layingLow?0.4:1);
  }
  function topStreetVenture(){ return businesses.filter(b=>b.category==='street' && b.level>0).sort((a,b)=>b.level-a.level)[0] || null; }
  function flagshipLegit(){ return businesses.filter(b=>b.category==='legit' && b.level>0).sort((a,b)=>incomeFor(b)-incomeFor(a))[0] || null; }
  function districtDisplayName(id: string){ const d = districts.find(x=>x.id===id); return d ? d.name : 'the city'; }
  function investigationBuildMult(){ return (state.bribeOn?0.7:1) * (motherActive()?0.85:1) * (whitmoreActive()?0.8:1); }
  function counselCost(){ return Math.ceil((900 + illegalIncomePerSec()*45) * (1 + state.investigation/35) * discountMult()); }
  function crewCapGlobal(){ return 6 + state.territoryTier*4 + (sisterActive()?6:0); }
  function crewUsedGlobal(){ return businesses.reduce((s,b)=> s + (b.manager?0:b.crew), 0); }
  function crewNeeded(b: Business){ return b.level<=0 ? 0 : Math.ceil(b.level/5); }
  function efficiency(b: Business){
    if(b.manager) return 1;
    const need = crewNeeded(b);
    if(need===0) return 1;
    return Math.max(0.35, Math.min(1, b.crew/need));
  }
  function costForLevel(b: Business){ return Math.ceil(b.baseCost * Math.pow(1.15, b.level) * discountMult()); }
  function crewCostFor(b: Business){ return Math.ceil(b.crewBaseCost * Math.pow(1.22, b.crew) * discountMult() * (sisterActive()?0.8:1)); }
  function managerCostFor(b: Business){ return Math.ceil(b.baseCost * 45 * discountMult()); }
  function territoryCost(){ return Math.ceil(40 * Math.pow(2.1, state.territoryTier)); }
  function negotiateCost(){ return Math.ceil(25 * Math.pow(1.8, state.negotiateTier)); }
  function muscleCost(){ return Math.ceil(80 * Math.pow(1.25, state.muscleCount)); }
  function ratsCashCost(){ return Math.ceil(150 * Math.pow(1.3, state.ratCount)); }
  function ratsRespectCost(){ return 5 + state.ratCount*2; }
  function tempMultActive(b: Business){ return b.tempMultExpire > Date.now() ? b.tempMult : 1; }
  function applyTempMult(filter: string, mult: number, seconds: number){
    businesses.forEach(b=>{ if(filter==='all' || b.category===filter){ b.tempMult = mult; b.tempMultExpire = Date.now() + seconds*1000; } });
  }
  function applyBusinessTempMult(businessId: string, mult: number, seconds: number): void {
    const business = businesses.find(function(entry){ return entry.id === businessId; });
    if(!business) return;
    business.tempMult = mult;
    business.tempMultExpire = Date.now() + seconds * 1000;
  }
  function tonicVisionActive(): boolean {
    return typeof state.worldMemory.tonicUntil === 'number' && state.playSeconds < state.worldMemory.tonicUntil;
  }
  function syncTonicVision(): void {
    if(!sceneInitialized) return;
    const wild = state.worldMemory.tonicVision === 'wild';
    renderer.domElement.style.filter = tonicVisionActive()
      ? (wild ? 'hue-rotate(135deg) saturate(1.45) contrast(1.1)' : 'hue-rotate(42deg) saturate(1.18)')
      : '';
  }
  function hireFreeCrew(): boolean {
    const eligible = businesses.filter(b=> b.researched && !b.manager && b.level>0 && b.crew < crewNeeded(b)+2 && crewUsedGlobal() < crewCapGlobal());
    if(eligible.length===0){ state.cash += 400; log(`<i aria-hidden="true" class="ph-duotone ph-handshake"></i> No open spot for them — they take a cash finder\'s fee instead.`); return false; }
    const b = eligible[Math.floor(Math.random()*eligible.length)];
    b.crew += 1;
    log(`<i aria-hidden="true" class="ph-duotone ph-handshake"></i> They join the crew at ${b.name}, no questions asked.`);
    return true;
  }
  function hireResultText(hired: boolean): string {
    return hired ? 'crew +1' : "no open crew spot; $400 finder's fee instead";
  }
  function incomeFor(b: Business){ return b.level * b.baseIncome * efficiency(b) * tempMultActive(b); }
  function getEquippedCar(){ return cars.find(c=>c.id===state.equippedCar) || CHEAT_VEHICLES.find(c=>c.id===state.equippedCar) || null; }
  // LEGAL: Rent, with each brand's caveat applied. Waterfront stock appreciates the longer
  // LEGAL: you hold it (config/brands "premium and appreciating"); everything else is flat.
  function propertyHeldSeconds(id: string){
    const boughtAt = state.propertyOwnedAt[id];
    return typeof boughtAt === 'number' ? Math.max(0, state.playSeconds - boughtAt) : 0;
  }
  function propertyIncomeFor(p: Property){
    return p.incomePerSec * appreciationMult(brandById(p.brand), propertyHeldSeconds(p.id));
  }
  function ownedPropertyList(){
    return state.ownedProperties.map(id => properties.find(x=>x.id===id)).filter((p): p is Property => !!p);
  }
  function propertiesIncome(){ return ownedPropertyList().reduce((s,p)=> s + propertyIncomeFor(p), 0); }
  // LEGAL: Ironpoint's warehouses are fronts: they wash money (less heat) but are invisible
  // LEGAL: on the street, so they pay no respect where a penthouse does.
  function commercialPropertyCount(){
    return ownedPropertyList().filter(p => brandById(p.brand)?.category === 'commercial').length;
  }
  function propertyRespect(){
    return ownedPropertyList().reduce((s,p)=> s + propertyRespectPerSec(brandById(p.brand)), 0);
  }
  // LEGAL: Squeeze level 0-3; income/heat scale up with how hard you lean on the owner.
  const EXTORT_MULT = [0, 1, 2, 3.2];
  function extortLevel(b: LocalBusiness){ return b.extorted ? Math.max(1, Math.min(3, b.extortTier ?? 1)) : 0; }
  function extortMult(b: LocalBusiness){ return EXTORT_MULT[extortLevel(b)]; }
  function localBizIncome(){ return localBusinesses.filter(b=>b.extorted).reduce((s,b)=> s + b.extortIncome*extortMult(b), 0); }
  function blackMarketTradeIncome(){ return state.worldMemory.blackMarketTrade ? PHASE2_MISSION_CONFIG.blackMarketIncome : 0; }
  function blackMarketTradeHeat(){ return state.worldMemory.blackMarketTrade ? PHASE2_MISSION_CONFIG.blackMarketHeat : 0; }
  function activeCorners(){ return corners.filter(c=> c.dealer && !c.busted); }
  function cornerDemandPerSec(){ return activeCorners().reduce((s,c)=> s+c.consumption, 0); }
  function cornerIncomePerSec(){
    if(state.product <= 0) return 0;
    const birdMult = birdInducted() ? 1.15 : 1;
    return activeCorners().reduce((s,c)=>{
      const districtMult = c.district==='westside' ? westsideRateBonus() : 1;
      return s + c.rate*districtMult*birdMult;
    }, 0);
  }
  function cornerHeatPerSec(){
    return corners.filter(c=> c.dealer && !c.busted).reduce((s,c)=>{
      const districtMult = c.district==='westside' ? westsideHeatMult() : 1;
      return s + c.tier*0.4*districtMult;
    }, 0);
  }
  function labCost(){ return Math.ceil(400 * Math.pow(1.22, state.productLevel) * discountMult()); }
  function productCap(){ return 200 + state.productLevel*20; }
  function electedOfficeIncome(){ return state.electedOffice ? (5 + Math.min(state.prestigeCount, familyTiers.length)*2) : 0; }
  function rawTotalIncome(){
    // LEGAL: While laying low, the illegal side (street ventures, corners, extortion)
    // LEGAL: runs at a fraction; the legit empire and rents are unaffected.
    const low = state.layingLow ? 0.4 : 1;
    const venturesIncome = businesses.reduce((s,b)=> s + incomeFor(b) * (b.category==='street' ? low : 1), 0) * devlinIncomeBonus();
    return (venturesIncome + propertiesIncome() + localBizIncome()*low + cornerIncomePerSec()*low + blackMarketTradeIncome()*low + electedOfficeIncome()) * globalIncomeMult();
  }
  function bribeUpkeep(){ return state.bribeOn ? rawTotalIncome()*0.12 : 0; }
  function netIncome(){ return rawTotalIncome() - bribeUpkeep(); }
  function respectPerSec(){ const car=getEquippedCar(); return (state.muscleCount*0.6 + (car?car.respectPerSec:0) + propertyRespect()) * (grandmotherActive()?1.25:1); }
  // LEGAL: Full heat accounting — the single source of truth for both generation and
  // LEGAL: the HUD "Details" breakdown. Sources are summed, then scaled by the shared
  // LEGAL: modifier (bribe/family/politics, campaign x2.5, crackdown x2.2, lay-low x0.2).
  // LEGAL: `cool` is the quadratic cooldown; net > 0 means heat is climbing to its plateau.
  function heatBreakdown(){
    const streetVentureHeat = businesses.filter(b=>b.category==='street').reduce((s,b)=> s+(b.heatPerLevel||0)*b.level, 0);
    const extortionHeat = localBusinesses.filter(b=>b.extorted).reduce((s,b)=> s + b.extortHeat*extortMult(b), 0);
    const muscleHeat = state.muscleCount*0.5;
    const cornerHeat = cornerHeatPerSec();
    const blackMarketHeat = blackMarketTradeHeat();
    // LEGAL: Beyond a few fronts, sprawl draws superlinear attention.
    const conspicuousHeat = Math.max(0, illegalFrontCount()-3) * 0.35;
    // LEGAL: Phase 4 caveats. Riding an Outlaw Riders bike is loud and exposed, so it adds
    // LEGAL: heat outright; Ironpoint warehouses wash money, scaling the whole total down.
    const bikeHeat = vehicleHeatPerSec(brandById(getEquippedCar()?.brand), state.inVehicle);
    const launderMult = launderingHeatMult(commercialPropertyCount());
    const modifier = heatMult() * (state.campaignActive ? 2.5 : 1) * (crackdownActive() ? 2.2 : 1) * (state.layingLow ? 0.2 : 1) * launderMult;
    const gen = (muscleHeat + streetVentureHeat + extortionHeat + cornerHeat + blackMarketHeat + conspicuousHeat + bikeHeat) * modifier;
    const cool = 0.25 + state.heat*state.heat*0.001 + (state.layingLow ? 4 : 0);
    return { muscleHeat, streetVentureHeat, extortionHeat, cornerHeat, conspicuousHeat, bikeHeat, launderMult, modifier, gen, cool, net: gen - cool };
  }
  function districtDriftBreakdown(d: District){
    const musclePresence = state.muscleCount*0.15;
    const cornerPresence = corners.filter(c=>c.district===d.id && c.dealer && !c.busted).length * 1.2;
    const venturePresence = d.id==='devlin' ? businesses.filter(b=>b.researched && b.level>0).length*0.3 : 0;
    const rivalPressure = d.homeTurf ? 0.15 : 0.35;
    return { musclePresence, cornerPresence, venturePresence, rivalPressure, netDrift: musclePresence + cornerPresence + venturePresence - rivalPressure };
  }
  function currentRank(){ let r=ranks[0]; for(const rk of ranks){ if(state.respect>=rk.respect) r=rk; } return r.title; }
  function isUnlocked(b: Business){
    if(b.unlock.type==='start') return true;
    if(b.unlock.type==='cash') return state.cash>=b.unlock.value || b.level>0 || b.researched;
    if(b.unlock.type==='respect') return state.respect>=b.unlock.value || b.level>0 || b.researched;
    if(b.unlock.type==='family') return hasFamilyTier(b.unlock.value) || b.level>0 || b.researched;
    return false;
  }
  function unlockRequirement(b: Business): string {
    const unlock = b.unlock;
    if(unlock.type==='cash') return `Requires ${formatMoney(unlock.value)} cash`;
    if(unlock.type==='respect') return `Requires ${unlock.value} respect`;
    if(unlock.type==='family') return `Requires ${familyTiers[unlock.value]?.name ?? 'more family'} in Windhaven`;
    return '';
  }

  function onboardingTargetFor(target: OnboardingPanelTarget): void {
    if(target === 'bank') openDeviceApp('bank');
    else if(target === 'assets') openDeviceApp('automart');
    else if(target === 'missions') openDeviceApp('missions');
    else setTab(target);
  }

  function renderAdvisorPanel(): void {
    const cart = businesses.find(b=>b.id==='cart');
    const cornerStore = businesses.find(b=>b.id==='store');
    const openedVentures = businesses.filter(b=>b.researched && b.level>0);
    const understaffed = openedVentures.find(b=>!b.manager && crewNeeded(b)>0 && b.crew<crewNeeded(b));
    const openedCorners = activeCorners();
    const unopenedVenture = businesses.find(b=>isUnlocked(b) && b.researched && b.level===0);
    const wrap = byId('advisor-list');
    const title = byId('advisor-title');
    const copy = byId('advisor-copy');
    const badge = byId('advisor-badge');
    const steps = getOnboardingSteps({
      cash:state.cash,
      heat:state.heat,
      bankedCash:bankedTotal(),
      cartLevel:cart?.level ?? 0,
      cartCrew:cart?.crew ?? 0,
      cartCrewNeeded:cart ? crewNeeded(cart) : 0,
      productLevel:state.productLevel,
      canUpgradeLab:state.cash>=labCost(),
      canPostFirstCorner:state.cash>=(corners.find(c=>!c.busted)?.dealerCost ?? Infinity),
      hasActiveCorner:openedCorners.length>0,
      missionLessons:missionEventPool.flatMap(function(event): OnboardingMissionSnapshot[] {
        if(event.onboarding.mode === 'none') return [];
        const activeMission = state.activeMissions[event.id];
        if(activeMission){
          return [{ id:event.id, title:event.title, mode:event.onboarding.mode, status:'active' as const, stageId:activeMission.stageId, objectiveLabel:activeMission.objective?.label }];
        }
        if(state.eventHistory[event.id] === 'offered'){
          return [{ id:event.id, title:event.title, mode:event.onboarding.mode, status:'offered' as const }];
        }
        return [];
      }),
      eventHistory:state.eventHistory,
      activeMissions:Object.keys(state.activeMissions),
      completedMissions:Object.keys(state.completedMissions),
      worldMemory:state.worldMemory,
      canResearchCornerStore:!!cornerStore && isUnlocked(cornerStore) && !cornerStore.researched && state.cash>=researchCostFor(cornerStore),
      hasUnlockedUnopenedVenture:!!unopenedVenture,
      unopenedVentureName:unopenedVenture?.name,
      hasUnderstaffedCart:!!cart && cart.level>0 && !cart.manager && cart.crew<crewNeeded(cart),
      hasUnderstaffedVenture:!!understaffed,
      understaffedVentureName:understaffed?.name,
      product:state.product,
      productCap:productCap(),
      activeCornerCount:openedCorners.length,
      availableCornerCount:corners.filter(c=>!c.busted).length,
    });

    title.textContent = 'Street Lessons';
    copy.textContent = 'What to do next, as it comes up.';
    badge.textContent = 'Just in time';
    wrap.innerHTML = steps.map(function(step){
      return `
      <div class="advisor-item ${step.tone}">
        <div class="advisor-item-header">
          <div class="advisor-item-title">${step.title}</div>
          <div class="advisor-item-badge">${step.badge}</div>
        </div>
        <div class="advisor-message">${step.body}</div>
        <button
          class="advisor-action"
          data-onboarding-kind="${step.action.kind}"
          data-onboarding-target="${step.action.target}"
          ${step.action.section ? `data-onboarding-section="${step.action.section}"` : ''}
          ${step.action.missionId ? `data-onboarding-mission="${step.action.missionId}"` : ''}
        >${step.action.label}</button>
      </div>
    `;
    }).join('');
  }
  type StreetLogPriority = 'major' | 'standard' | 'minor';
  const suppressedStreetLogPhrases = [
    'you step into ',
    'you get in.',
    'you park up and get out.',
    'waypoint set to ',
    'gps set to ',
    'head over to ',
    'not enough cash to sponsor',
    'small talk with ',
    'respects the hustle',
  ];
  let lastStreetLogKey = '';
  let lastStreetLogAt = 0;
  function plainStreetLogText(message: string): string {
    return message.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }
  function streetLogPriority(message: string): StreetLogPriority {
    const text = plainStreetLogText(message).toLowerCase();
    if(suppressedStreetLogPhrases.some(function(phrase){ return text.includes(phrase); })) return 'minor';
    if(text.includes('raid') || text.includes('crackdown') || text.includes('heist') || text.includes('mission started') || text.includes('new message') || text.includes('black market') || text.includes('political favor') || text.includes('campaign') || text.includes('war') || text.includes('busted') || text.includes('seized') || text.includes('unlocked')) return 'major';
    if(text.includes('heat') || text.includes('case') || text.includes('respect') || text.includes('deposit') || text.includes('withdraw') || text.includes('earned') || text.includes('income') || text.includes('cash') || text.includes('pays out') || text.includes('goes sideways')) return 'standard';
    return 'minor';
  }
  function log(msg: string){
    const priority = streetLogPriority(msg);
    const plain = plainStreetLogText(msg);
    const now = Date.now();
    const repeatKey = plain.toLowerCase();
    if(priority === 'minor') return;
    if(repeatKey === lastStreetLogKey && now - lastStreetLogAt < 30000) return;
    lastStreetLogKey = repeatKey;
    lastStreetLogAt = now;
    const wrap = byId('ticker');
    const item = document.createElement('div');
    item.className = `ticker-item ${priority}`;
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    item.innerHTML = `<span class="t-time">${time}</span><span class="t-msg">${msg}</span>`;
    wrap.prepend(item);
    while(wrap.children.length > 24 && wrap.lastChild) wrap.removeChild(wrap.lastChild);
  }

  // LEGAL: ================= MODAL =================
  function showModal({eyebrow, title, body, stamp, buttons}: ModalOptions){
    byId('modal-eyebrow').textContent = eyebrow || '';
    byId('modal-title').textContent = title || '';
    byId('modal-body').innerHTML = body || '';
    const stampEl = byId('modal-stamp');
    if(stamp){ stampEl.style.display='block'; stampEl.textContent = stamp; } else { stampEl.style.display='none'; }
    const footer = byId('modal-footer');
    footer.innerHTML = '';
    const sceneMissionId = ledgerMissionInScene;
    (buttons || [{label:"Continue"}]).forEach((btnDef, idx)=>{
      const btn = document.createElement('button');
      btn.className = 'modal-btn' + (btnDef.secondary ? ' secondary' : '');
      btn.innerHTML = `` + btnDef.label;
      const unaffordable = btnDef.cost !== undefined && state.cash < btnDef.cost;
      if(unaffordable) btn.title = `You need ${formatMoney(btnDef.cost ?? 0)} for this.`;
      btn.disabled = unaffordable || btnDef.disabled === true;
      btn.onclick = function(){
        if(btn.disabled || (btnDef.cost !== undefined && state.cash < btnDef.cost)) return;
        byId('modal-overlay').classList.add('hidden');
        const choice = btnDef.onClick;
        if(choice) runInMissionScene(sceneMissionId, choice);
        if(milestoneCanShowNow()) showNextMilestone();
      };
      footer.appendChild(btn);
    });
    // LEGAL: Drawn as the thing being used, when a hotspot's close-up is on (map/closeUps).
    byId('modal-overlay').className = `modal-overlay${closeUpSkinClasses()}`;
    byId('modal-overlay').classList.remove('hidden');
  }

  function showStartScreen(hasSavedGame: boolean): void {
    byId<HTMLButtonElement>('continue-game-btn').disabled = !hasSavedGame;
    byId('start-game-btn').innerHTML = `<i aria-hidden="true" class="ph-duotone ph-plus-circle"></i>${hasSavedGame ? 'Start New Game' : 'Start'}`;
    // LEGAL: The gold primary style goes to whichever button is the way in.
    byId('continue-game-btn').classList.toggle('secondary', !hasSavedGame);
    byId('start-game-btn').classList.toggle('secondary', hasSavedGame);
    byId('start-settings-panel').classList.add('hidden');
    byId('start-credits-panel').classList.add('hidden');
    byId('start-new-warning').classList.add('hidden');
    byId('start-screen').classList.remove('hidden');
  }

  function hideStartScreen(): void {
    byId('start-screen').classList.add('hidden');
  }

  const pendingMilestones: string[] = [];
  let missionResultPending = false;
  function modalOnScreen(): boolean {
    return !byId('modal-overlay').classList.contains('hidden');
  }
  function milestoneCanShowNow(): boolean {
    return !modalOnScreen() && !missionResultPending && activeMissionCount(missionSaveState()) === 0;
  }
  function showNextMilestone(): void {
    const id = pendingMilestones.shift();
    if(!id) return;
    const milestone = milestones.find(function(entry){ return entry.id === id; });
    if(!milestone) return;
    showModal({ eyebrow:'Windhaven Herald — West Side Edition', title:milestone.title, body:milestone.body, buttons:[{label:'Keep Going', onClick:showNextMilestone}] });
  }
  function triggerMilestone(id: string){
    if(state.seenMilestones.has(id)) return;
    const m = milestones.find(x => x.id === id);
    if(!m) return;
    state.seenMilestones.add(id);
    if(!milestoneCanShowNow()) pendingMilestones.push(id);
    else showModal({ eyebrow:'Windhaven Herald — West Side Edition', title:m.title, body:m.body, buttons:[{label:'Keep Going', onClick:showNextMilestone}] });
    log(`<i aria-hidden="true" class="ph-duotone ph-newspaper"></i> Headline: "${m.title.charAt(0)}${m.title.slice(1).toLowerCase()}"`);
    if(id === 'chaat_house') byId('delhi-theme-row').style.display = 'flex';
    scheduleSave();
  }

  function missionSaveState(){
    return {
      eventRepeats: state.eventRepeats,
      eventHistory: state.eventHistory,
      activeMissions: state.activeMissions,
      completedMissions: state.completedMissions,
      worldMemory: state.worldMemory,
    };
  }
  const missionLedgers = new Map<string, MissionLedger>();
  let ledgerMissionInScene: string | null = null;
  function currentOutcomeSnapshot(): OutcomeSnapshot {
    return {
      cash: state.cash,
      product: state.product,
      respect: state.respect,
      heat: state.heat,
      investigation: state.investigation,
      influence: state.influence,
      muscle: state.muscleCount,
      crew: businesses.reduce(function(total, business){ return total + business.crew; }, 0),
      investorPenalty: state.investorPenalty ?? 0,
    };
  }
  function foldLedgerFor(id: string): void {
    const ledger = missionLedgers.get(id);
    if(ledger) missionLedgers.set(id, foldMissionLedger(ledger, currentOutcomeSnapshot()));
  }
  function runInMissionScene(id: string | null, scene: () => void): void {
    const ledger = id ? missionLedgers.get(id) : undefined;
    if(!id || !ledger){ scene(); return; }
    const now = currentOutcomeSnapshot();
    missionLedgers.set(id, rebaseMissionLedger(foldMissionLedger(ledger, now), now));
    const outerScene = ledgerMissionInScene;
    ledgerMissionInScene = id;
    try { scene(); }
    finally {
      ledgerMissionInScene = outerScene;
      foldLedgerFor(id);
    }
  }
  function truthfulResultText(id: string, text: string): string {
    const ledger = missionLedgers.get(id);
    return ledger ? reconcileResultText(text, choiceDelta(ledger, currentOutcomeSnapshot())) : text;
  }
  function exactMissionChanges(id: string): string[] {
    const ledger = missionLedgers.get(id);
    missionLedgers.delete(id);
    return ledger ? describeMissionLedger(ledger, currentOutcomeSnapshot()) : [];
  }
  function missionDefinition(id: string): MissionEventDefinition | null {
    return missionEventPool.find(function(event){ return event.id === id; }) ?? null;
  }
  function missionPlaceByService(serviceId: string): MapPlaceRecord | null {
    return mapPlaces.find(function(place){ return place.sourceObject?.kind === 'service' && place.sourceObject.id === serviceId; }) ?? null;
  }
  function missionPlaceByObjectId(objectId: string): MapPlaceRecord | null {
    return mapPlaces.find(function(place){ return place.sourceObject?.id === objectId || place.id === objectId; }) ?? null;
  }
  function missionObjectiveFromPlace(place: MapPlaceRecord | null, label?: string) {
    if(!place) return null;
    return { label:label ?? place.name, district:place.district, placeId:place.id, x:place.x, y:place.y };
  }
  function objectiveForMission(id: string) {
    if(id === 'tribune') return missionObjectiveFromPlace(missionPlaceByService('heraldHq'), 'Windhaven Herald studio');
    if(id === 'cousin') return missionObjectiveFromPlace(missionPlaceByService('hubBusStation'), 'Meet Amit at the bus station');
    if(id === 'cops') return missionObjectiveFromPlace(missionPlaceByService('devlinAlley'), 'Meet Detective Miller in the alley');
    // LEGAL: The generic realty office is gone; the investor now meets you at Horizon,
    // LEGAL: the luxury brokerage, which suits a silent money man better anyway.
    if(id === 'investor') return missionObjectiveFromPlace(missionPlaceByService('brand-horizon'), 'Meet the silent investor');
    if(id === 'hustler') return missionObjectiveFromPlace(missionPlaceByObjectId('bar'), "Hear the pitch at O'Malley's");
    if(id === 'hustler_score') return missionObjectiveFromPlace(missionPlaceByObjectId('bar'), "Hear the score result at O'Malley's");
    if(id === 'fire') return missionObjectiveFromPlace(missionPlaceByObjectId('cart'), "Check Kailash's Cart");
    if(id === 'inspector') {
      const venture = flagshipLegit() ?? businesses.find(function(b){ return b.id === 'cart'; }) ?? businesses[0];
      return missionObjectiveFromPlace(missionPlaceByObjectId(venture.id), `Meet Inspector Kowalski at ${venture.name}`);
    }
    if(id === 'rival') {
      const corner = activeCorners()[0] ?? corners.find(function(c){ return !c.busted; }) ?? corners[0];
      return missionObjectiveFromPlace(missionPlaceByObjectId(corner.id), `Meet the rival capo at ${corner.name}`);
    }
    if(id === 'home_safe_robbery') return missionObjectiveFromPlace(missionPlaceByService('bankHome'), 'Visit a bank branch');
    if(id === 'stolen_shipment') return missionObjectiveFromPlace(missionPlaceByService('docksDockmaster'), 'Question Dockmaster Bell');
    if(id === 'alderman_fixer') return missionObjectiveFromPlace(missionPlaceByService('cityhall'), 'Meet the City Hall bagman');
    if(id === 'turf_war') {
      const corner = corners.find(function(c){ return c.district === 'devlin' && !c.busted; }) ?? corners[0];
      return missionObjectiveFromPlace(missionPlaceByObjectId(corner.id), `Defend ${corner.name}`);
    }
    if(id === 'first_heist') return missionObjectiveFromPlace(missionPlaceByService('heistTarget'), 'Case First Windhaven Trust');
    if(id === 'amit_mistake') return missionObjectiveFromPlace(missionPlaceByService('hubBusStation'), 'Meet Amit at the bus station');
    if(id === 'hostile_press') return missionObjectiveFromPlace(missionPlaceByService('heraldHq'), 'Return to the Windhaven Herald');
    if(id === 'press_followup') return missionObjectiveFromPlace(missionPlaceByService('heraldHq'), 'Meet the Herald profile visitor');
    if(id === 'black_market_investigation') return missionObjectiveFromPlace(missionPlaceByService('docksDockmaster'), 'Meet Dockmaster Bell at the docks');
    if(id === 'arsonist_revenge') return missionObjectiveFromPlace(missionPlaceByService('devlinAlley'), 'Find the arsonist in Devlin Back Alley');
    if(id === 'tax_audit') return missionObjectiveFromPlace(missionPlaceByService('cityhall'), 'Meet the City Hall auditor');
    if(id === 'mystery_tonic') return missionObjectiveFromPlace(missionPlaceByObjectId('herbalist'), 'Visit Golden Lotus Herbalist');
    if(id === 'pigeon_summit') return missionObjectiveFromPlace(missionPlaceByService('cityhall'), 'Hear City Hall’s pigeon emergency');
    if(id === 'mayors_parrot') return missionObjectiveFromPlace(missionPlaceByService('cityhall'), "Hear City Hall's parrot emergency");
    if(id === 'goose_permit') return missionObjectiveFromPlace(missionPlaceByService('cityhall'), 'Review the goose permit at City Hall');
    if(id === 'raccoon_keycard') return missionObjectiveFromPlace(missionPlaceByService('cityhall'), 'Meet the City Hall clerk about the raccoon');
    return null;
  }
  function advanceMissionToObjective(id: string, stageId: string, serviceOrObjectId: string, label: string): void {
    const place = missionPlaceByService(serviceOrObjectId) ?? missionPlaceByObjectId(serviceOrObjectId);
    const objective = missionObjectiveFromPlace(place, label);
    advanceMissionStage(missionSaveState(), id, stageId, state.playSeconds, objective);
    setMissionGps(id);
    if(objective) log(`<i aria-hidden="true" class="ph-duotone ph-map-pin"></i> Objective updated: ${objective.label}.`);
    renderAll();
    scheduleSave();
  }
  function setMissionGps(missionId: string): void {
    const mission = state.activeMissions[missionId];
    if(!mission?.objective) return;
    setGlobalWaypoint({ x:mission.objective.x, y:mission.objective.y });
    rebuildWaypointBeacon();
    byId('minimap-clear').classList.add('show');
  }
  function startMissionFromOffer(id: string): void {
    const definition = missionDefinition(id);
    const objective = objectiveForMission(id);
    if(!definition || !objective) return;
    missionLedgers.set(id, openMissionLedger(currentOutcomeSnapshot()));
    if(id === 'home_safe_robbery'){
      const loss = Math.round(state.cash * PHASE2_MISSION_CONFIG.homeSafeRobberyLossPct);
      state.cash = Math.max(0, state.cash - loss);
      state.worldMemory.homeSafeRobbed = true;
      log(`<i aria-hidden="true" class="ph-duotone ph-vault"></i> The safe is already empty. You lost ${formatMoney(loss)} in exposed cash; get the rest to a bank.`);
    }
    if(id === 'inspector'){
      const venture = flagshipLegit() ?? businesses.find(function(business){ return business.id === 'cart'; }) ?? businesses[0];
      state.worldMemory.inspectionVentureId = venture?.id;
    }
    startMission(missionSaveState(), { id, stageId:'travel', status:'active', startedAt:state.playSeconds, updatedAt:state.playSeconds, objective });
    setMissionGps(id);
    foldLedgerFor(id);
    log(`<i aria-hidden="true" class="ph-duotone ph-map-pin"></i> Mission started: ${definition.title}. GPS set to ${objective.label}.`);
    renderAll();
    scheduleSave();
  }
  function declineMissionOffer(id: string): void {
    missionLedgers.set(id, openMissionLedger(currentOutcomeSnapshot()));
    declineMission(missionSaveState(), id);
    let outcome = 'You let the opportunity pass for now.';
    if(id === 'tribune'){ state.respect += 10; state.worldMemory.pressTone = 'quiet'; outcome = 'You decline Lana Vance and stay quiet.'; log('<i aria-hidden="true" class="ph-duotone ph-star"></i> You decline Lana Vance. Some people respect a man who does not need the attention.'); }
    else if(id === 'cousin'){ state.respect = Math.max(0, state.respect - 5); state.worldMemory.amitTurnedAway = true; state.worldMemory.familyLoyalty = -2; outcome = 'You turn Amit away; family loyalty -2 and the family will remember it.'; log('<i aria-hidden="true" class="ph-duotone ph-users"></i> Amit gets the message. Family loyalty falls.'); }
    else if(id === 'hustler'){ state.cash += 500; state.worldMemory.rejectedHustler = true; outcome = 'You take the finder fee and leave the hustler to the rivals.'; log('<i aria-hidden="true" class="ph-duotone ph-users-three"></i> You pass. They leave a finder fee, then start talking to rivals.'); }
    else if(id === 'investor'){ state.respect += 8; state.worldMemory.investorRejected = true; outcome = 'You reject the investor and keep the operation independent.'; log('<i aria-hidden="true" class="ph-duotone ph-star"></i> You show the investor the door. Independence has its own price.'); }
    else if(id === 'fire'){ const cart = businesses.find(function(business){ return business.id === 'cart'; }); if(cart){ cart.tempMult = 0.7; cart.tempMultExpire = Date.now() + 30_000; } state.worldMemory.cartRebuiltQuietly = true; outcome = 'Kailash’s Cart income is -30% for 30 seconds.'; log('<i aria-hidden="true" class="ph-duotone ph-warning-circle"></i> You rebuild quietly. Kailash’s Cart limps while the smoke clears.'); }
    else if(id === 'home_safe_robbery'){ state.worldMemory.ignoredBankLesson = true; outcome = 'You keep carrying exposed cash.'; log('<i aria-hidden="true" class="ph-duotone ph-vault"></i> You keep cash close. Convenient, and exposed.'); }
    else if(id === 'stolen_shipment'){ state.product = Math.max(0, state.product - 30); state.worldMemory.shipmentWrittenOff = true; outcome = 'You write off the missing cargo.'; log('<i aria-hidden="true" class="ph-duotone ph-package"></i> You write off the missing cargo. Supply tightens.'); }
    else if(id === 'alderman_fixer'){ state.worldMemory.avoidedBagman = true; state.worldMemory.taxAuditPending = true; scheduleFollowUp('tax_audit'); outcome = 'You avoid the bagman; Political Favors stay locked and a City Hall audit arrives in 2 minutes.'; log('<i aria-hidden="true" class="ph-duotone ph-courthouse"></i> You avoid the bagman. The next call from City Hall is an audit notice.'); }
    else if(id === 'turf_war'){ state.heat = Math.max(0, state.heat - 5); state.worldMemory.avoidedTurfWar = true; outcome = 'You let the pressure cool instead of answering it.'; log('<i aria-hidden="true" class="ph-duotone ph-map-pin"></i> You let the pressure cool instead of answering it.'); }
    else if(id === 'first_heist'){ state.worldMemory.firstHeistDelayed = true; outcome = 'You leave the vault job on the board.'; log('<i aria-hidden="true" class="ph-duotone ph-lock"></i> You leave the vault job on the board.'); }
    else { log('<i aria-hidden="true" class="ph-duotone ph-info"></i> You let the opportunity pass for now.'); }
    renderAll();
    scheduleSave();
    const changes = exactMissionChanges(id);
    const changesMarkup = changes.length ? `<p><strong>Exact changes:</strong> ${escapeHtml(changes.join('; '))}</p>` : '';
    showModal({
      eyebrow:'Mission Offer Declined',
      title:missionDefinition(id)?.title ?? id,
      body:`<p class="flavor">${escapeHtml(outcome)}</p>${changesMarkup}`,
      buttons:[{ label:'Continue' }],
    });
  }
  function activeMissionEntries() {
    return Object.values(state.activeMissions).filter(function(mission){ return mission.status === 'active'; });
  }
  function activeMissionForPlace(placeId: string): string | null {
    const mission = activeMissionEntries().find(function(entry){ return entry.objective?.placeId === placeId; });
    return mission?.id ?? null;
  }
  function activeMissionForObjectId(objectId: string): string | null {
    const place = missionPlaceByObjectId(objectId);
    return place ? activeMissionForPlace(place.id) : null;
  }
  function activeMissionForServiceId(serviceId: string): string | null {
    const place = missionPlaceByService(serviceId);
    return place ? activeMissionForPlace(place.id) : null;
  }
  function finishMission(id: string, claimedResult: string): void {
    const result = truthfulResultText(id, claimedResult);
    missionResultPending = true;
    completeMission(missionSaveState(), id, result, state.playSeconds);
    setGlobalWaypoint(null);
    rebuildWaypointBeacon();
    byId('minimap-clear').classList.remove('show');
    renderAll();
    scheduleSave();
    const definition = missionDefinition(id);
    const changes = exactMissionChanges(id);
    const changesMarkup = changes.length ? `<p><strong>Exact changes:</strong> ${escapeHtml(changes.join('; '))}</p>` : '';
    showModal({
      eyebrow:'Mission Result',
      title:definition?.title ?? id,
      stamp:'Completed',
      body:`<p class="flavor">${escapeHtml(result)}</p>${changesMarkup}<p>Your decision is saved and its effects are now reflected in your cash, heat, respect, territory, case, and unlocks where applicable.</p>`,
      buttons:[{ label:'Continue', onClick:function(){ missionResultPending = false; showNextMilestone(); } }],
    });
  }
  function scheduleFollowUp(missionId: string): void {
    scheduleDelayedMission(missionSaveState(), `${missionId}DueAt`, state.playSeconds, PHASE2_MISSION_CONFIG.followUpDelaySeconds);
    const followUpLine: Record<string, string> = {
      amit_mistake:'Amit says the lender will circle back in about two minutes.',
      hostile_press:'Lana says the Herald will decide whether to keep the story alive in about two minutes.',
      press_followup:'Lana says the person who read the profile will arrive in about two minutes.',
      black_market_investigation:'Bell warns that questions about the manifests will arrive in about two minutes.',
      arsonist_revenge:'Kailash says a name should reach you in about two minutes.',
      tax_audit:'City Hall says its audit notice will be ready in about two minutes.',
      cops:'Kowalski says the detective will want a word in about two minutes.',
      hustler_score:"O'Malley's says the hustler will report back in about two minutes.",
    };
    const line = followUpLine[missionId];
    if(line) log(`<i aria-hidden="true" class="ph-duotone ph-clock"></i> ${line}`);
  }
  function delayedFollowUpReady(missionId: string): boolean {
    if(missionId === 'amit_mistake') return delayedMissionReady(missionSaveState(), 'amit_mistakeDueAt', state.playSeconds, state.worldMemory.amitHired === true && missionCompleted(missionSaveState(), 'cousin'));
    if(missionId === 'hostile_press') return delayedMissionReady(missionSaveState(), 'hostile_pressDueAt', state.playSeconds, state.worldMemory.pressTone === 'hostile');
    if(missionId === 'press_followup') return delayedMissionReady(missionSaveState(), 'press_followupDueAt', state.playSeconds, ['professional', 'guarded', 'warm', 'scandal'].includes(String(state.worldMemory.pressTone)) && missionCompleted(missionSaveState(), 'tribune'));
    if(missionId === 'black_market_investigation') return delayedMissionReady(missionSaveState(), 'black_market_investigationDueAt', state.playSeconds, state.worldMemory.blackMarketTrade === true);
    if(missionId === 'arsonist_revenge') return delayedMissionReady(missionSaveState(), 'arsonist_revengeDueAt', state.playSeconds, state.worldMemory.arsonistHunted === true);
    if(missionId === 'tax_audit') return delayedMissionReady(missionSaveState(), 'tax_auditDueAt', state.playSeconds, state.worldMemory.taxAuditPending === true);
    if(missionId === 'cops') return delayedMissionReady(missionSaveState(), 'copsDueAt', state.playSeconds, state.worldMemory.kowalskiIntimidated === true);
    if(missionId === 'hustler_score') return delayedMissionReady(missionSaveState(), 'hustler_scoreDueAt', state.playSeconds, state.worldMemory.hustlerScoreApproved === true);
    return true;
  }
  function removeCrewMember(): boolean {
    const staffed = businesses.find(function(business){ return business.crew > 0; });
    if(!staffed) return false;
    staffed.crew -= 1;
    return true;
  }
  const INTERVIEW_PRESS_TONES: Record<string, string> = { professional:'professional', evasive:'guarded', humorous:'warm', controversial:'scandal' };
  function resolveTribuneInterview(tone: string): void {
    const opening = String(state.worldMemory.interviewOpening || 'builder');
    const pressTone = INTERVIEW_PRESS_TONES[tone] ?? 'hostile';
    const article = opening === 'builder'
      ? pressTone === 'professional' ? 'The Builder of Devlin' : pressTone === 'guarded' ? 'The Quiet Builder' : pressTone === 'warm' ? 'The Block Has a Joke for Him' : pressTone === 'scandal' ? 'Growth at Any Cost?' : 'A Warning From Devlin'
      : opening === 'family'
        ? pressTone === 'professional' ? 'A Family Business With Ambition' : pressTone === 'guarded' ? 'The Family Keeps Its Counsel' : pressTone === 'warm' ? 'A Cousin, a Cart, and a Crowd' : pressTone === 'scandal' ? 'What the Family Will Not Say' : 'A Family Dares the City'
        : pressTone === 'professional' ? 'The Challenger Makes His Case' : pressTone === 'guarded' ? 'A Challenger Behind Closed Doors' : pressTone === 'warm' ? 'The City Gets the Last Laugh' : pressTone === 'scandal' ? 'City Hall Faces a New Critic' : 'A Threat Printed in Full';
    state.worldMemory.pressArticle = article;
    let result: string;
    if(tone === 'professional'){ applyTempMult('legit', 1.25, 75); state.prestigeCount = Math.max(state.prestigeCount, 1); state.worldMemory.pressTone = 'professional'; scheduleFollowUp('press_followup'); result = `legit income +25% for 75 seconds; prestige tier unlocked; “${article}” follow-up in 2 minutes`; log('<i aria-hidden="true" class="ph-duotone ph-microphone-stage"></i> Lana runs a clean profile. Legit traffic rises and a reader asks to meet.'); }
    else if(tone === 'evasive'){ state.respect += 8; state.heat = Math.max(0, state.heat - 8); state.worldMemory.pressTone = 'guarded'; scheduleFollowUp('press_followup'); result = `respect +8; heat -8; “${article}” source follow-up in 2 minutes`; log('<i aria-hidden="true" class="ph-duotone ph-newspaper"></i> The piece says less than Lana wanted. A careful reader asks to meet.'); }
    else if(tone === 'humorous'){ state.respect += 14; applyTempMult('legit', 1.12, 60); state.worldMemory.pressTone = 'warm'; scheduleFollowUp('press_followup'); result = `respect +14; legit income +12% for 60 seconds; “${article}” community follow-up in 2 minutes`; log('<i aria-hidden="true" class="ph-duotone ph-smiley"></i> You make Windhaven laugh without giving much away. A neighborhood organizer asks to meet.'); }
    else if(tone === 'controversial'){ state.respect += 22; state.heat = Math.min(100, state.heat + 16); state.investigation = Math.min(100, state.investigation + 4); state.worldMemory.pressTone = 'scandal'; scheduleFollowUp('press_followup'); result = `respect +22; heat +16; investigation +4; “${article}” response in 2 minutes`; log('<i aria-hidden="true" class="ph-duotone ph-warning"></i> The quotes travel fast. An activist asks to meet at the Herald.'); }
    else { state.respect += 12; state.heat = Math.min(100, state.heat + 24); state.worldMemory.pressTone = 'hostile'; scheduleFollowUp('hostile_press'); result = `respect +12; heat +24; “${article}” hostile press follow-up in 2 minutes`; log('<i aria-hidden="true" class="ph-duotone ph-warning"></i> You turn the interview into a threat. The street likes it. City Hall does not.'); }
    finishMission('tribune', result);
  }
  function openHomeSafeTellerLesson(): void {
    showModal({
      eyebrow:'Rentport City National',
      title:'The Teller Has Seen This Before',
      body:"<p class='flavor'>The teller does not ask where the missing money went. She only points to the deposit slip. \"Cash in your pocket is cash somebody can take. Money in an account stays there when the street gets loud.\"</p>",
      buttons:[
        { label:'Use the teller after this', onClick:function(){
          state.worldMemory.homeSafeBankingChoice = 'use-teller';
          log('<i aria-hidden="true" class="ph-duotone ph-bank"></i> The teller leaves a deposit slip on the counter. Banking is available here whenever you need it.');
          finishMission('home_safe_robbery', 'Banking lesson completed; deposit protection explained; teller banking available in this room');
        } },
        { label:'Keep the remaining cash close', onClick:function(){
          state.worldMemory.homeSafeBankingChoice = 'carry-cash';
          log('<i aria-hidden="true" class="ph-duotone ph-vault"></i> You leave the deposit slip blank. The cash stays exposed.');
          finishMission('home_safe_robbery', 'Banking lesson completed; remaining cash deliberately kept exposed');
        } },
      ],
    });
  }
  function openTribuneInterview(): void {
    advanceMissionStage(missionSaveState(), 'tribune', 'interview', state.playSeconds, null);
    showModal({
      eyebrow:'Windhaven Herald Studio',
      title:'Lana Vance',
      body:"<p class='flavor'>Lana checks the recorder, then looks up. \"We can do this as a profile, a warning, or a spectacle. First: what do you want Windhaven to think you are building?\"</p>",
      buttons:[
        { label:'A business that belongs to the neighborhood', onClick:function(){ openTribuneFollowUp('builder'); } },
        { label:'A family operation that keeps its own counsel', onClick:function(){ openTribuneFollowUp('family'); } },
        { label:'A city that finally answers to somebody', onClick:function(){ openTribuneFollowUp('challenger'); } },
      ],
    });
    renderAll();
    scheduleSave();
  }
  function openTribuneFollowUp(opening: string): void {
    state.worldMemory.interviewOpening = opening;
    advanceMissionStage(missionSaveState(), 'tribune', 'followup', state.playSeconds, null);
    const prompt = opening === 'builder'
      ? 'Lana asks who pays when growth changes the block.'
      : opening === 'family'
        ? 'Lana asks what your family refuses to put on the record.'
        : 'Lana asks whether City Hall should be afraid of you.';
    const answers = opening === 'builder'
      ? ['Give her the hiring and neighborhood plan', 'Keep the books and names private', 'Tell her growth needs a better punchline', 'Name the officials blocking the block', 'Tell the competitors to get out of the way']
      : opening === 'family'
        ? ['Explain the family rules and responsibilities', 'Protect the people who did not ask for a headline', 'Tell the story with a family joke', 'Name the institutions that made the family wait', 'Say nobody gets to test your family']
        : ['Lay out a public plan for City Hall', 'Keep the leverage off the record', 'Make the room laugh at City Hall', 'Call out the people running the city', 'Tell City Hall to test you'];
    showModal({
      eyebrow:'Windhaven Herald Studio',
      title:'Lana Vance',
      body:"<p class='flavor'>" + prompt + " She leaves the recorder running and waits for a real answer.</p>",
      buttons:[
        { label:answers[0], onClick:function(){ resolveTribuneInterview('professional'); } },
        { label:answers[1], onClick:function(){ resolveTribuneInterview('evasive'); } },
        { label:answers[2], onClick:function(){ resolveTribuneInterview('humorous'); } },
        { label:answers[3], onClick:function(){ resolveTribuneInterview('controversial'); } },
        { label:answers[4], onClick:function(){ resolveTribuneInterview('aggressive'); } },
      ],
    });
  }
  function resolveMissionAtObjective(id: string): void {
    runInMissionScene(id, function(){ openMissionScene(id); });
  }
  function openMissionScene(id: string): void {
    if(id === 'tribune'){ openTribuneInterview(); return; }
    if(id === 'amit_mistake'){
      showModal({ eyebrow:'Hub Bus Station', title:"Amit's Mistake", body:"<p class='flavor'>Amit took a shortcut with the books. The lender wants money, or someone from your operation to carry the blame.</p>", buttons:[
        { label:'Contain it ($2,500, +Heat)', cost:2500, onClick:function(){ state.cash = Math.max(0, state.cash - 2500); state.heat = Math.min(100, state.heat + 12); state.worldMemory.amitMistakeContained = true; state.worldMemory.familyLoyalty = Number(state.worldMemory.familyLoyalty || 0) + 2; log('<i aria-hidden="true" class="ph-duotone ph-envelope-simple"></i> You bury Amit\'s debt before it names anyone else. Family remembers who covered it.'); finishMission('amit_mistake', '$2,500 spent; heat +12; family loyalty +2'); } },
        { label:'Let a crew member take the fall', onClick:function(){ const lostCrew = removeCrewMember(); state.respect = Math.max(0, state.respect - 10); state.worldMemory.amitMistakeCrewLost = lostCrew; state.worldMemory.familyLoyalty = Number(state.worldMemory.familyLoyalty || 0) - 3; log(lostCrew ? '<i aria-hidden="true" class="ph-duotone ph-users-three"></i> One crew member disappears to settle Amit\'s mistake. Family will not forget the price.' : '<i aria-hidden="true" class="ph-duotone ph-users-three"></i> Amit takes the fall; there was no crew left to lose.'); finishMission('amit_mistake', lostCrew ? 'one crew member permanently lost; respect -10; family loyalty -3' : 'Amit took the fall; respect -10; family loyalty -3'); } },
      ]}); return;
    }
    if(id === 'hostile_press'){
      showModal({ eyebrow:'Windhaven Herald', title:'Damage Control', body:"<p class='flavor'>Lana cannot retract the story, but she can decide how long it stays on the front page. Your legitimate fronts have to weather the backlash.</p>", buttons:[
        { label:'Buy a response ($1,800)', cost:1800, onClick:function(){ state.cash = Math.max(0, state.cash - 1800); applyTempMult('legit', 0.75, 120); state.worldMemory.pressRecovery = 'paid'; log('<i aria-hidden="true" class="ph-duotone ph-newspaper"></i> Your response shortens the bad press: legit income -25% for two minutes.'); finishMission('hostile_press', '$1,800 spent; legit income -25% for 2 minutes'); } },
        { label:'Ride out the backlash', onClick:function(){ applyTempMult('legit', 0.55, 240); state.worldMemory.pressRecovery = 'endured'; log('<i aria-hidden="true" class="ph-duotone ph-warning"></i> The story bites hard: legit income -45% for four minutes.'); finishMission('hostile_press', 'legit income -45% for 4 minutes'); } },
      ]}); return;
    }
    if(id === 'press_followup'){
      const tone = String(state.worldMemory.pressTone || 'guarded');
      const article = String(state.worldMemory.pressArticle || 'the profile');
      if(tone === 'professional'){
        showModal({ eyebrow:'Windhaven Herald Studio', title:'A Sponsor Who Read the Profile', body:`<p class='flavor'>A local trade group read “${escapeHtml(article)}” and wants its name next to yours. Lana makes clear that they are buying access to your legitimate story, not your silence.</p>`, buttons:[
          { label:'Take the clean sponsorship (+$1,200)', onClick:function(){ state.cash += 1200; applyTempMult('legit', 1.1, 90); state.worldMemory.pressFollowup = 'sponsor'; finishMission('press_followup', '$1,200 gained; legit income +10% for 90 seconds; trade-group sponsor contact recorded'); } },
          { label:'Keep the profile independent (+8 respect)', onClick:function(){ state.respect += 8; state.worldMemory.pressFollowup = 'independent'; finishMission('press_followup', 'respect +8; independent Herald relationship recorded'); } },
        ]}); return;
      }
      if(tone === 'warm'){
        showModal({ eyebrow:'Windhaven Herald Studio', title:'The Neighborhood Organizer', body:`<p class='flavor'>A block organizer brings a stack of clippings from “${escapeHtml(article)}.” They want a public fundraiser or a quiet introduction to shop owners who trust the story.</p>`, buttons:[
          { label:'Fund the block night ($350, +18 respect)', cost:350, onClick:function(){ state.cash = Math.max(0, state.cash - 350); state.respect += 18; state.worldMemory.pressFollowup = 'block-night'; finishMission('press_followup', '$350 spent; respect +18; neighborhood supporter network recorded'); } },
          { label:'Take the quiet introductions (+10 respect, heat -4)', onClick:function(){ state.respect += 10; state.heat = Math.max(0, state.heat - 4); state.worldMemory.pressFollowup = 'shop-intros'; finishMission('press_followup', 'respect +10; heat -4; shop-owner introductions recorded'); } },
        ]}); return;
      }
      if(tone === 'scandal'){
        showModal({ eyebrow:'Windhaven Herald Studio', title:'A Public Challenge', body:`<p class='flavor'>A neighborhood advocate arrives with the clipping “${escapeHtml(article)}.” They want you to back the accusations publicly, or give them documents quietly and let the story keep moving.</p>`, buttons:[
          { label:'Back the challenge (+16 respect, +8 heat)', onClick:function(){ state.respect += 16; state.heat = Math.min(100, state.heat + 8); state.worldMemory.pressFollowup = 'public-challenge'; finishMission('press_followup', 'respect +16; heat +8; City Hall challenge relationship recorded'); } },
          { label:'Give a quiet lead (investigation -6)', onClick:function(){ state.investigation = Math.max(0, state.investigation - 6); state.worldMemory.pressFollowup = 'quiet-lead'; finishMission('press_followup', 'investigation -6; confidential Herald source relationship recorded'); } },
        ]}); return;
      }
      showModal({ eyebrow:'Windhaven Herald Studio', title:'A Careful Source', body:`<p class='flavor'>A source who liked “${escapeHtml(article)}” wants to trade a quiet lead for your promise not to turn every private fact into a public war.</p>`, buttons:[
        { label:'Protect the source (heat -6)', onClick:function(){ state.heat = Math.max(0, state.heat - 6); state.worldMemory.pressFollowup = 'protected-source'; finishMission('press_followup', 'heat -6; protected Herald source recorded'); } },
        { label:'Ask for the full lead (+10 respect, +4 heat)', onClick:function(){ state.respect += 10; state.heat = Math.min(100, state.heat + 4); state.worldMemory.pressFollowup = 'full-lead'; finishMission('press_followup', 'respect +10; heat +4; aggressive Herald source relationship recorded'); } },
      ]}); return;
    }
    if(id === 'black_market_investigation'){
      showModal({ eyebrow:'Docks', title:'The Case File', body:"<p class='flavor'>Bell has copied manifests and one unhappy detective. You can buy silence, or burn the records before they become a case.</p>", buttons:[
        { label:'Pay to close it ($2,200)', cost:2200, onClick:function(){ state.cash = Math.max(0, state.cash - 2200); state.investigation = Math.max(0, state.investigation - 16); state.worldMemory.blackMarketCaseClosed = true; log('<i aria-hidden="true" class="ph-duotone ph-envelope-simple"></i> The file closes: $2,200 spent and case -16.'); finishMission('black_market_investigation', '$2,200 spent; investigation -16'); } },
        { label:'Burn the records (-50 product)', onClick:function(){ state.product = Math.max(0, state.product - 50); state.investigation = Math.max(0, state.investigation - 8); state.worldMemory.blackMarketRecordsBurned = true; log('<i aria-hidden="true" class="ph-duotone ph-fire"></i> The manifests burn: 50 product lost and case -8.'); finishMission('black_market_investigation', '50 product lost; investigation -8'); } },
      ]}); return;
    }
    if(id === 'arsonist_revenge'){
      const mission = state.activeMissions.arsonist_revenge;
      if(mission?.stageId !== 'lounge'){
        showModal({ eyebrow:'Devlin Back Alley', title:'The Arsonist', body:"<p class='flavor'>The name leads to a scared runner with a lighter and a thin envelope. Kailash is waiting to hear what you do. The runner says the person who paid him is drinking at Marigold Lounge.</p>", buttons:[
          { label:'Take the payoff ($900)', onClick:function(){ state.cash += 900; state.worldMemory.arsonistPaid = true; log('<i aria-hidden="true" class="ph-duotone ph-handshake"></i> The arsonist pays: $900 gained.'); finishMission('arsonist_revenge', '$900 gained; the fire ends quietly'); } },
          { label:'Follow the money to Marigold Lounge', onClick:function(){ state.worldMemory.arsonistTrail = 'marigold'; advanceMissionToObjective('arsonist_revenge', 'lounge', 'marigoldLounge', 'Confront the arsonist’s employer at Marigold Lounge'); } },
        ]}); return;
      }
      showModal({ eyebrow:'Marigold Lounge', title:'The One Who Ordered It', body:"<p class='flavor'>The employer expected the runner to disappear, not for you to walk into the lounge. He offers a bigger envelope, then realizes you did not come for money alone.</p>", buttons:[
        { label:'Take the larger payoff ($1,500)', onClick:function(){ state.cash += 1500; state.worldMemory.arsonistPaid = true; finishMission('arsonist_revenge', '$1,500 gained; arson employer bought peace'); } },
        { label:'Make an example (+18 respect, +16 heat)', onClick:function(){ state.respect += 18; state.heat = Math.min(100, state.heat + 16); state.worldMemory.arsonistPunished = true; finishMission('arsonist_revenge', 'respect +18; heat +16; arson employer punished'); } },
      ]}); return;
    }
    if(id === 'mystery_tonic'){
      showModal({ eyebrow:'Golden Lotus Herbalist', title:'The Tonic', body:"<p class='flavor'>Mrs. Lin puts a bright green bottle on the counter. \"One sip, then tell me whether the pigeons are giving advice again.\"</p>", buttons:[
        { label:'Take one careful sip', onClick:function(){ state.respect += 6; state.worldMemory.tonicVision = 'careful'; state.worldMemory.tonicUntil = state.playSeconds + PHASE2_MISSION_CONFIG.tonicCarefulDuration; syncTonicVision(); log('<i aria-hidden="true" class="ph-duotone ph-eye"></i> The street becomes extremely sincere. Respect +6; surreal vision for 45 seconds.'); finishMission('mystery_tonic', 'respect +6; surreal map vision for 45 seconds'); } },
        { label:'Take the whole bottle', onClick:function(){ state.cash += 300; state.heat = Math.max(0, state.heat - 8); state.worldMemory.tonicVision = 'wild'; state.worldMemory.tonicUntil = state.playSeconds + PHASE2_MISSION_CONFIG.tonicWildDuration; syncTonicVision(); log('<i aria-hidden="true" class="ph-duotone ph-sparkle"></i> You argue with a parking meter and somehow win: $300 gained, heat -8; surreal vision for 75 seconds.'); finishMission('mystery_tonic', '$300 gained; heat -8; surreal map vision for 75 seconds'); } },
      ]}); return;
    }
    if(id === 'pigeon_summit'){
      const mission = state.activeMissions.pigeon_summit;
      if(mission?.stageId === 'travel'){
        showModal({ eyebrow:'City Hall Annex', title:'Emergency Pigeon Summit', body:"<p class='flavor'>A clerk slides over a folder marked URGENT. The city’s pigeons have occupied the Wabash Newsstand, rejected a reasonable eviction notice, and started taking pastries in shifts.</p>", buttons:[
          { label:'Sign the official bird liaison waiver', onClick:function(){ state.worldMemory.pigeonApproach = 'liaison'; advanceMissionToObjective('pigeon_summit', 'newsstand', 'wicker-news', 'Meet the pigeon delegation at Wabash Newsstand'); } },
          { label:'Bill City Hall $300 for “consulting”', onClick:function(){ state.cash += 300; state.worldMemory.pigeonApproach = 'consulting'; advanceMissionToObjective('pigeon_summit', 'newsstand', 'wicker-news', 'Meet the pigeon delegation at Wabash Newsstand'); } },
        ]}); return;
      }
      showModal({ eyebrow:'Wabash Newsstand', title:'The Delegation', body:"<p class='flavor'>The flock watches from the awning. One pigeon has a pastry wrapper tucked under its wing. The newsstand owner insists it is the negotiator.</p>", buttons:[
        { label:'Offer seed decoys ($120)', cost:120, onClick:function(){ state.cash = Math.max(0, state.cash - 120); state.respect += 8; state.worldMemory.pigeonSummit = 'seed'; log('<i aria-hidden="true" class="ph-duotone ph-bird"></i> The delegation accepts seed, leaves the pastries, and awards you a respectful nod.'); finishMission('pigeon_summit', '$120 spent; respect +8; pigeon truce recorded'); } },
        { label:'Give the flock a public apology (+12 respect, up to -4 heat)', onClick:function(){ const heatRemoved = Math.min(4, state.heat); state.respect += 12; state.heat -= heatRemoved; state.worldMemory.pigeonSummit = 'apology'; log('<i aria-hidden="true" class="ph-duotone ph-megaphone"></i> The pigeons accept your apology. The crowd loves it more than they should.'); finishMission('pigeon_summit', Math.round(heatRemoved) ? `respect +12; heat -${Math.round(heatRemoved)}; pigeon truce recorded` : 'respect +12; pigeon truce recorded'); } },
      ]}); return;
    }
    if(id === 'mayors_parrot'){
      const mission = state.activeMissions.mayors_parrot;
      if(mission?.stageId === 'travel'){
        showModal({ eyebrow:'City Hall Annex', title:"The Mayor's Parrot", body:"<p class='flavor'>A clerk points at an empty brass perch. The mayor's parrot escaped with a budget notebook, learned the phrase “expedite my permit,” and has been directing traffic toward Rockwell Pet Supply.</p>", buttons:[
          { label:'Give the city an official statement', onClick:function(){ state.worldMemory.parrotApproach = 'official'; advanceMissionToObjective('mayors_parrot', 'petstore', 'rockwell-pets', 'Find the parrot at Rockwell Pet Supply'); } },
          { label:'Invoice City Hall $250 for bird consulting', onClick:function(){ state.cash += 250; state.worldMemory.parrotApproach = 'consulting'; advanceMissionToObjective('mayors_parrot', 'petstore', 'rockwell-pets', 'Find the parrot at Rockwell Pet Supply'); } },
        ]}); return;
      }
      showModal({ eyebrow:'Rockwell Pet Supply', title:'A Bird with a Platform', body:"<p class='flavor'>The parrot is on the highest cage, notebook under one claw. It is repeating “no comment” with enough confidence that three reporters are taking notes.</p>", buttons:[
        { label:'Buy sunflower seeds ($75)', cost:75, onClick:function(){ state.cash = Math.max(0, state.cash - 75); state.respect += 10; state.worldMemory.parrotResolution = 'seeds'; log('<i aria-hidden="true" class="ph-duotone ph-bird"></i> The parrot accepts the seeds, returns the notebook, and receives a tiny civic commendation.'); finishMission('mayors_parrot', '$75 spent; respect +10; parrot returned to City Hall'); } },
        { label:'Let it give one press conference', onClick:function(){ state.respect += 16; state.heat = Math.min(100, state.heat + 6); state.worldMemory.parrotResolution = 'press'; log('<i aria-hidden="true" class="ph-duotone ph-microphone-stage"></i> The parrot denounces parking meters, then voluntarily returns to its perch.'); finishMission('mayors_parrot', 'respect +16; heat +6; parrot press conference recorded'); } },
      ]}); return;
    }
    if(id === 'goose_permit'){
      const mission = state.activeMissions.goose_permit;
      if(mission?.stageId === 'travel'){
        showModal({ eyebrow:'City Hall Annex', title:'The Goose Has a Permit', body:"<p class='flavor'>The clerk lays a laminated card beside a parking map. The seal is upside down, but the goose is standing on it with enough confidence to make three officials nervous.</p>", buttons:[
          { label:'Recognize the permit for one night', onClick:function(){ state.worldMemory.gooseApproach = 'official'; advanceMissionToObjective('goose_permit', 'drivein', 'driveInBoundary', 'Meet the permit holder at Boundary Meadows Drive-In'); } },
          { label:'Invoice City Hall $180 for permit review', onClick:function(){ state.cash += 180; state.worldMemory.gooseApproach = 'consulting'; advanceMissionToObjective('goose_permit', 'drivein', 'driveInBoundary', 'Meet the permit holder at Boundary Meadows Drive-In'); } },
        ]}); return;
      }
      showModal({ eyebrow:'Boundary Meadows Drive-In', title:'A Bird in the Best Space', body:"<p class='flavor'>The goose blocks the center parking spot with the permit under one webbed foot. A line of cars has formed behind it. Nobody wants to be the first person defeated by municipal poultry.</p>", buttons:[
        { label:'Buy popcorn for the goose ($60)', cost:60, onClick:function(){ state.cash = Math.max(0, state.cash - 60); state.respect += 8; state.heat = Math.max(0, state.heat - 2); state.worldMemory.goosePermit = 'popcorn'; log('<i aria-hidden=\"true\" class=\"ph-duotone ph-bird\"></i> The goose accepts popcorn, folds the permit, and waddles toward the screen.'); finishMission('goose_permit', '$60 spent; respect +8; heat -2; goose permit retired'); } },
        { label:'Offer it a better parking space', onClick:function(){ state.respect += 12; state.heat = Math.min(100, state.heat + 3); state.worldMemory.goosePermit = 'relocated'; log('<i aria-hidden=\"true\" class=\"ph-duotone ph-bird\"></i> The goose accepts a VIP space near the snack bar. The crowd applauds a bird.'); finishMission('goose_permit', 'respect +12; heat +3; goose given VIP parking'); } },
      ]}); return;
    }
    if(id === 'raccoon_keycard'){
      const mission = state.activeMissions.raccoon_keycard;
      if(mission?.stageId === 'travel'){
        showModal({ eyebrow:'City Hall Annex', title:'The Raccoon Has a Keycard', body:"<p class='flavor'>The clerk points at a tiny paw-print approval on a snack-vendor contract. The raccoon has learned the elevator, the keycard beep, and just enough municipal procedure to be dangerous.</p><p>It has retreated into the records floor. Mrs. Lin at Golden Lotus can make a humane lure if you tell her what kind of public story this is.</p>", buttons:[
          { label:'Keep it quiet and pay for the lure ($90)', cost:90, onClick:function(){ state.cash = Math.max(0, state.cash - 90); state.worldMemory.raccoonApproach = 'quiet'; advanceMissionToObjective('raccoon_keycard', 'herbalist', 'herbalist', 'Collect the quiet lure from Golden Lotus'); } },
          { label:'Call it a civic wildlife initiative', onClick:function(){ state.respect += 5; state.worldMemory.raccoonApproach = 'public'; advanceMissionToObjective('raccoon_keycard', 'herbalist', 'herbalist', 'Collect the public lure from Golden Lotus'); } },
        ]}); return;
      }
      showModal({ eyebrow:'Golden Lotus Herbalist', title:'A Proper Raccoon Lure', body:"<p class='flavor'>Mrs. Lin puts two jars on the counter. One smells like fruit and quiet dignity. The other smells like a county fair and would attract the raccoon, three dogs, and possibly a councilman.</p>", buttons:[
        { label:'Take the quiet fruit lure (+8 respect)', onClick:function(){ state.respect += 8; state.worldMemory.raccoonResolution = 'quiet-lure'; log('<i aria-hidden="true" class="ph-duotone ph-paw-print"></i> The raccoon accepts the fruit, returns the keycard, and leaves City Hall with a dignified escort.'); finishMission('raccoon_keycard', 'respect +8; raccoon returned keycard; quiet resolution recorded'); } },
        { label:'Use the fairground lure (up to -5 heat, +$140)', onClick:function(){ const heatRemoved = Math.min(5, state.heat); state.heat -= heatRemoved; state.cash += 140; state.worldMemory.raccoonResolution = 'fairground-lure'; log('<i aria-hidden="true" class="ph-duotone ph-paw-print"></i> The raccoon follows the fairground lure through the plaza. A food truck buys the leftover recipe.'); finishMission('raccoon_keycard', Math.round(heatRemoved) ? `$140 gained; heat -${Math.round(heatRemoved)}; raccoon wildlife initiative recorded` : '$140 gained; raccoon wildlife initiative recorded'); } },
      ]}); return;
    }
    if(id === 'rival'){
      const canIntimidate = state.respect >= PHASE2_MISSION_CONFIG.rivalIntimidationRespectRequirement || state.muscleCount >= PHASE2_MISSION_CONFIG.rivalIntimidationMuscleRequirement;
      showModal({ eyebrow:'West Side Corner', title:'Rival Capo', body:"<p class='flavor'>The capo waits with two people behind him. \"This corner pays somebody tonight. You choose who.\"</p>", buttons:[
        { label:'Pay them off (-8% cash)', onClick:function(){ state.cash *= 0.92; state.worldMemory.rivalSettlement = 'paid'; log('<i aria-hidden="true" class="ph-duotone ph-envelope-simple"></i> You pay the rival crew to walk away quietly.'); finishMission('rival', 'paid'); } },
        { label:canIntimidate ? 'Intimidate them (+15 respect, +18 heat)' : `Bring leverage (needs ${PHASE2_MISSION_CONFIG.rivalIntimidationRespectRequirement} respect or ${PHASE2_MISSION_CONFIG.rivalIntimidationMuscleRequirement} muscle)`, disabled:!canIntimidate, onClick:function(){ state.respect += 15; state.heat = Math.min(100, state.heat + 18); state.worldMemory.rivalSettlement = 'intimidated'; log('<i aria-hidden="true" class="ph-duotone ph-star"></i> You hold the corner. Word travels, and so does heat.'); finishMission('rival', 'respect +15; heat +18; rival capo intimidated'); } },
        { label:'Negotiate a split (-Heat, income cut)', onClick:function(){ applyTempMult('all', 0.92, 90); state.heat = Math.max(0, state.heat - 10); state.worldMemory.rivalSettlement = 'split'; log('<i aria-hidden="true" class="ph-duotone ph-handshake"></i> You split the corner take for quieter streets.'); finishMission('rival', 'split'); } },
        { label:'Attack (starts turf war)', onClick:function(){ state.respect += 25; state.heat = Math.min(100, state.heat + 28); state.nextWarAt = Math.min(state.nextWarAt || Infinity, state.playSeconds + 30); state.worldMemory.gangWarSparked = true; log('<i aria-hidden="true" class="ph-duotone ph-crosshair"></i> The capo leaves bleeding. West Side answers immediately: hold Devlin before the line moves.'); finishMission('rival', 'respect +25; heat +28; Turf War started'); startMissionFromOffer('turf_war'); } },
      ]}); return;
    }
    if(id === 'inspector'){
      const count = state.eventRepeats.inspector ?? 1;
      const bribe = count > 1 ? 750 : 400;
      const ventureId = typeof state.worldMemory.inspectionVentureId === 'string' ? state.worldMemory.inspectionVentureId : (flagshipLegit() ?? businesses[0])?.id;
      const venture = businesses.find(function(business){ return business.id === ventureId; });
      const ventureName = venture?.name ?? 'the inspected venture';
      showModal({ eyebrow:'Health Department', title:'Inspector Kowalski', body:`<p class='flavor'>Kowalski taps the clipboard. ${count > 1 ? '"We both know the second visit costs more."' : '"Clean kitchens are expensive. Dirty ones are worse."'}</p>`, buttons:[
        { label:`Pay the bribe (${formatMoney(bribe)})`, cost:bribe, onClick:function(){ state.cash = Math.max(0, state.cash - bribe); state.worldMemory.kowalskiPaid = count; log('<i aria-hidden="true" class="ph-duotone ph-envelope-simple"></i> The envelope disappears and the inspection passes.'); finishMission('inspector', 'bribed'); } },
        { label:`Comply: close ${ventureName} for ${PHASE2_MISSION_CONFIG.inspectorComplianceSeconds}s`, onClick:function(){ if(ventureId) applyBusinessTempMult(ventureId, PHASE2_MISSION_CONFIG.inspectorComplianceMultiplier, PHASE2_MISSION_CONFIG.inspectorComplianceSeconds); state.worldMemory.kowalskiComplied = count; state.worldMemory.inspectionClosureVenture = ventureId; log(`<i aria-hidden="true" class="ph-duotone ph-scales"></i> ${ventureName} closes its doors while the paperwork clears.`); finishMission('inspector', `${ventureName} income -30% for ${PHASE2_MISSION_CONFIG.inspectorComplianceSeconds} seconds; other ventures unaffected`); } },
        { label:'Blackmail him', onClick:function(){ if(state.respect >= 120 || state.influence >= 80){ state.worldMemory.kowalskiBlackmailed = true; state.worldMemory.kowalskiProtection = true; state.heat = Math.max(0, state.heat - 12); log('<i aria-hidden="true" class="ph-duotone ph-folder-lock"></i> Kowalski sees the file, deletes the address, and flags your ventures out of future inspection rotations.'); finishMission('inspector', 'heat -12; permanent inspection protection recorded; future Kowalski visits blocked'); } else { state.heat = Math.min(100, state.heat + 10); log('<i aria-hidden="true" class="ph-duotone ph-warning"></i> You reach for leverage you do not have. Kowalski leaves angry.'); finishMission('inspector', 'blackmail failed; heat +10'); } } },
        { label:'Intimidate him', onClick:function(){ state.respect += 8; state.heat = Math.min(100, state.heat + 12); state.worldMemory.kowalskiIntimidated = true; scheduleFollowUp('cops'); log('<i aria-hidden="true" class="ph-duotone ph-hand-fist"></i> Kowalski backs off for now. He will remember the tone, and Detective Miller will hear about it.'); finishMission('inspector', 'respect +8; heat +12; Detective Miller follow-up scheduled'); } },
      ]}); return;
    }
    if(id === 'cousin'){
      showModal({ eyebrow:'Hub Bus Station', title:'Cousin Amit', body:"<p class='flavor'>Amit has one suitcase, two apologies, and a debt that apparently found the same bus route.</p>", buttons:[
        { label:'Pay the debt ($600)', cost:600, onClick:function(){ state.cash = Math.max(0, state.cash - 600); state.respect += 4; state.worldMemory.amitHelped = true; state.worldMemory.familyLoyalty = 3; log('<i aria-hidden="true" class="ph-duotone ph-users"></i> You settle Amit\'s debt. Family first.'); finishMission('cousin', '$600 spent; respect +4; family loyalty +3'); } },
        { label:'Hire him into legit work', onClick:function(){ const hired = hireFreeCrew(); state.worldMemory.amitHired = true; state.worldMemory.familyLoyalty = 1; scheduleFollowUp('amit_mistake'); log('<i aria-hidden="true" class="ph-duotone ph-users"></i> Amit gets work and a warning not to embarrass the family.'); finishMission('cousin', `${hireResultText(hired)}; family loyalty +1; Amit mistake follow-up in 2 minutes`); } },
        { label:'Turn him away', onClick:function(){ state.respect = Math.max(0, state.respect - 5); state.worldMemory.amitTurnedAway = true; state.worldMemory.familyLoyalty = -2; log('<i aria-hidden="true" class="ph-duotone ph-users"></i> You send Amit away. The call home will be short.'); finishMission('cousin', 'respect -5; family loyalty -2; Amit turned away'); } },
      ]}); return;
    }
    if(id === 'cops'){
      showModal({ eyebrow:'Devlin Back Alley', title:'Detective Miller', body:"<p class='flavor'>Miller keeps his hands visible. \"You can pay, you can point me at someone worse, or you can make this official.\"</p>", buttons:[
        { label:'Pay Miller ($900, -Heat)', cost:900, onClick:function(){ state.cash = Math.max(0, state.cash - 900); state.heat = Math.max(0, state.heat - 30); state.worldMemory.millerPaid = true; log('<i aria-hidden="true" class="ph-duotone ph-warning"></i> Miller pockets the money. The questions stop.'); finishMission('cops', 'paid'); } },
        { label:'Snitch on a rival (-Case, -Respect, stronger rivals)', onClick:function(){ state.investigation = Math.max(0, state.investigation - 18); state.respect = Math.max(0, state.respect - 12); state.worldMemory.snitchOnRival = true; log('<i aria-hidden="true" class="ph-duotone ph-shield-star"></i> Miller gets a name. The street gets a rumor, and West Side crews start moving more carefully against you.'); finishMission('cops', 'investigation -18; respect -12; future rival strength +6'); } },
        { label:'Tell him to walk (+25 heat, raid risk)', onClick:function(){ const raided = Math.random() < PHASE2_MISSION_CONFIG.copsRefusalRaidChance; state.heat = Math.min(100, state.heat + PHASE2_MISSION_CONFIG.copsRefusalHeat); if(raided) triggerRaid(); log(raided ? '<i aria-hidden="true" class="ph-duotone ph-siren"></i> Miller leaves, then a warrant team hits one of your operations.' : '<i aria-hidden="true" class="ph-duotone ph-warning"></i> Miller leaves with nothing but patience. The street gets much hotter.'); finishMission('cops', raided ? `heat +${PHASE2_MISSION_CONFIG.copsRefusalHeat}; immediate raid triggered` : `heat +${PHASE2_MISSION_CONFIG.copsRefusalHeat}; raid narrowly avoided`); } },
        { label:'Risk immediate enforcement', onClick:function(){ state.investigation = Math.min(100, state.investigation + 15); if(Math.random() < 0.35) triggerRaid(); else state.heat = Math.min(100, state.heat + 25); finishMission('cops', 'risked enforcement'); } },
      ]}); return;
    }
    if(id === 'hustler_score'){
      showModal({ eyebrow:"O'Malley's Bar", title:'Score Result', body:"<p class='flavor'>The hustler is waiting in the back booth. Their grin is either expensive or nervous. You finally get to find out which.</p>", buttons:[
        { label:'Take the payout', onClick:function(){ const won = Math.random() < 0.62; if(won){ state.cash += 1800; state.respect += 8; const hired = hireFreeCrew(); state.worldMemory.hustlerScoreResult = 'won'; finishMission('hustler_score', `$1,800 gained; respect +8; ${hireResultText(hired)}`); } else { state.heat = Math.min(100, state.heat + 20); state.worldMemory.hustlerScoreResult = 'failed'; finishMission('hustler_score', 'score failed; heat +20'); } } },
      ]}); return;
    }
    if(id === 'hustler'){
      showModal({ eyebrow:"O'Malley's Bar", title:'Recruit Pitch', body:"<p class='flavor'>The hustler has a plan, a grin, and no proof the plan survives first contact with daylight.</p>", buttons:[
        { label:'Approve the risky score', onClick:function(){ state.worldMemory.hustlerScoreApproved = true; scheduleFollowUp('hustler_score'); log('<i aria-hidden="true" class="ph-duotone ph-clock"></i> The hustler takes the job. You will not know whether it worked until they call back.'); finishMission('hustler', 'risky score approved; result pending'); } },
        { label:'Hire for legit work', onClick:function(){ const hired = hireFreeCrew(); state.worldMemory.hustlerLegit = true; finishMission('hustler', hired ? 'hired legit; crew +1' : hireResultText(false)); } },
        { label:'Reject the pitch', onClick:function(){ state.worldMemory.rejectedHustler = true; districts.find(function(d){ return d.id === 'westside'; })!.control = Math.max(0, districts.find(function(d){ return d.id === 'westside'; })!.control - 4); log('<i aria-hidden="true" class="ph-duotone ph-users-three"></i> They take the pitch to your rivals, who gain a capable new operator.'); finishMission('hustler', 'West Side control -4; future rival strength +4'); } },
      ]}); return;
    }
    if(id === 'investor'){
      showModal({ eyebrow:'Whitfield Realty', title:'Silent Investor', body:"<p class='flavor'>The offer is simple because the strings are not. Cash now, a cut forever.</p>", buttons:[
        { label:`Accept (+${formatMoney(PHASE2_MISSION_CONFIG.investorStandardCash)}, permanent income -${Math.round(PHASE2_MISSION_CONFIG.investorStandardIncomePenalty * 100)}%)`, onClick:function(){ state.cash += PHASE2_MISSION_CONFIG.investorStandardCash; state.investorPenalty = Math.min(0.5, (state.investorPenalty || 0) + PHASE2_MISSION_CONFIG.investorStandardIncomePenalty); state.worldMemory.investorAccepted = true; log('<i aria-hidden="true" class="ph-duotone ph-chart-line-up"></i> Cash in hand. A little less of everything is yours now.'); finishMission('investor', `$${PHASE2_MISSION_CONFIG.investorStandardCash.toLocaleString()} gained; permanent income -${Math.round(PHASE2_MISSION_CONFIG.investorStandardIncomePenalty * 100)}%`); } },
        { label:`Negotiate (${PHASE2_MISSION_CONFIG.investorPrestigeRequirement} prestige or ${PHASE2_MISSION_CONFIG.investorRespectRequirement} respect)`, onClick:function(){ if(state.prestigeCount >= PHASE2_MISSION_CONFIG.investorPrestigeRequirement || state.respect >= PHASE2_MISSION_CONFIG.investorRespectRequirement){ state.cash += PHASE2_MISSION_CONFIG.investorNegotiatedCash; state.investorPenalty = Math.min(0.5, (state.investorPenalty || 0) + PHASE2_MISSION_CONFIG.investorNegotiatedIncomePenalty); state.respect += 5; state.worldMemory.investorSponsorAvailable = true; log('<i aria-hidden="true" class="ph-duotone ph-handshake"></i> You cut the investor down to a smaller piece and gain a sponsor lead.'); finishMission('investor', `$${PHASE2_MISSION_CONFIG.investorNegotiatedCash.toLocaleString()} gained; respect +5; permanent income -${Math.round(PHASE2_MISSION_CONFIG.investorNegotiatedIncomePenalty * 100)}%; sponsor lead recorded`); } else { state.cash += PHASE2_MISSION_CONFIG.investorStandardCash; state.investorPenalty = Math.min(0.5, (state.investorPenalty || 0) + PHASE2_MISSION_CONFIG.investorWeakNegotiationIncomePenalty); log('<i aria-hidden="true" class="ph-duotone ph-chart-line-up"></i> You try to negotiate without leverage and pay for it later.'); finishMission('investor', `$${PHASE2_MISSION_CONFIG.investorStandardCash.toLocaleString()} gained; permanent income -${Math.round(PHASE2_MISSION_CONFIG.investorWeakNegotiationIncomePenalty * 100)}% (insufficient leverage)`); } } },
        { label:'Reject', onClick:function(){ state.respect += 8; state.worldMemory.investorRejected = true; log('<i aria-hidden="true" class="ph-duotone ph-star"></i> You stay independent.'); finishMission('investor', 'rejected'); } },
        { label:'Threaten', onClick:function(){ state.respect += 12; state.heat = Math.min(100, state.heat + 14); state.worldMemory.cityHallAttention = true; log('<i aria-hidden="true" class="ph-duotone ph-warning"></i> The investor leaves with a smile that says City Hall will hear about this.'); finishMission('investor', 'threatened'); } },
      ]}); return;
    }
    if(id === 'home_safe_robbery'){
      showModal({ eyebrow:'Rentport City National', title:'Keep What Is Left', body:"<p class='flavor'>The loss already happened because the cash was exposed. The guard nods toward the teller window: banked cash cannot be taken from your pocket by raids or street thieves.</p>", buttons:[
        { label:'Hear the teller out', onClick:function(){ advanceMissionStage(missionSaveState(), 'home_safe_robbery', 'teller', state.playSeconds, null); log('<i aria-hidden="true" class="ph-duotone ph-bank"></i> The teller waves you toward the counter.'); renderAll(); scheduleSave(); } },
        { label:'Walk away from the bank', secondary:true, onClick:function(){ state.worldMemory.homeSafeBankingChoice = 'walked-away'; finishMission('home_safe_robbery', 'Banking lesson declined at the counter; remaining cash stays exposed'); } },
      ]}); return;
    }
    if(id === 'stolen_shipment'){
      const mission = state.activeMissions.stolen_shipment;
      if(mission?.stageId === 'travel' || mission?.stageId === 'evidence'){
        const hasManifestEvidence = state.worldMemory.dockManifestEvidence === true;
        showModal({ eyebrow:'Docks', title:'Dockmaster Bell', body:hasManifestEvidence
          ? "<p class='flavor'>You put Deke's stamped carbon copy on Bell's desk before he can start talking around it. He stops smiling. \"Fine. It went west. Chop shop first, then somebody is flying it out if Deke gets nervous.\"</p>"
          : "<p class='flavor'>Bell points at a blank slot on the manifest. \"Cargo did not vanish. Somebody hauled it west and paid cash to make the paperwork boring.\"</p>", buttons:[
          { label:'Trace it to the chop shop', onClick:function(){ state.worldMemory.dockmasterTalked = true; advanceMissionToObjective('stolen_shipment', 'chopshop', 'chopshop', 'Find the missing shipment at the West Side Chop Shop'); } },
          { label:'Drop it', secondary:true, onClick:function(){ finishMission('stolen_shipment', 'dropped at docks'); } },
        ]}); return;
      }
      if(mission?.stageId === 'airfield'){
        showModal({ eyebrow:'Kettle Flats Airfield', title:'An Unmanifested Arrival', body:"<p class='flavor'>A crop duster rolls to a stop beside a pallet wrapped in canvas. The pilot says Bell can make a shipment disappear from a ledger, but not from a runway.</p>", buttons:[
          { label:'Put it on the street ($1,100 payout)', onClick:function(){ state.cash += 1100; state.respect += 10; state.worldMemory.airfieldShipment = 'street'; log('<i aria-hidden=\"true\" class=\"ph-duotone ph-airplane-tilt\"></i> The cargo clears Kettle Flats and reaches your runners before dawn.'); finishMission('stolen_shipment', '$1,100 gained; respect +10; Kettle Flats route unlocked'); } },
          { label:'Keep it in the Black Market', onClick:function(){ state.worldMemory.blackMarketTrade = true; state.investigation = Math.min(100, state.investigation + 6); state.worldMemory.airfieldShipment = 'market'; scheduleFollowUp('black_market_investigation'); log('<i aria-hidden=\"true\" class=\"ph-duotone ph-airplane-tilt\"></i> The runway becomes a quiet link in the Black Market chain.'); finishMission('stolen_shipment', 'Black Market Trade unlocked; investigation +6; airfield route recorded'); } },
        ]}); return;
      }
      showModal({ eyebrow:'West Side Chop Shop', title:'Missing Cargo', body:"<p class='flavor'>The shipment sits behind a half-stripped delivery van. Deke smiles like he already priced every option.</p>", buttons:[
        { label:'Buy it back ($1400)', cost:1400, onClick:function(){ state.cash = Math.max(0, state.cash - 1400); state.product = Math.min(productCap(), state.product + 80); log('<i aria-hidden="true" class="ph-duotone ph-package"></i> You buy back the shipment and restock the street.'); finishMission('stolen_shipment', '$1,400 spent; product +80'); } },
        { label:'Take it by force', onClick:function(){ state.product = Math.min(productCap(), state.product + 90); state.respect += 18; state.heat = Math.min(100, state.heat + 22); log('<i aria-hidden="true" class="ph-duotone ph-hand-fist"></i> You take the shipment back loud. The West Side hears about it.'); finishMission('stolen_shipment', 'product +90; respect +18; heat +22'); } },
        { label:'Partner with Deke', onClick:function(){ state.worldMemory.dockRouteChosen = true; advanceMissionToObjective('stolen_shipment', 'airfield', 'airfieldKettle', 'Meet the cargo pilot at Kettle Flats Airfield'); } },
      ]}); return;
    }
    if(id === 'alderman_fixer'){
      const mission = state.activeMissions.alderman_fixer;
      if(mission?.stageId === 'travel'){
        showModal({ eyebrow:'City Hall Annex', title:'The Bagman', body:"<p class='flavor'>The bagman does not say the alderman's name. He just names the problem: a railyard union leader blocking permits.</p>", buttons:[
          { label:'Go to the railyard', onClick:function(){ advanceMissionToObjective('alderman_fixer', 'railyard', 'railyard', 'Handle the railyard union leader'); } },
          { label:'Walk away', secondary:true, onClick:function(){ state.worldMemory.avoidedBagman = true; state.worldMemory.taxAuditPending = true; scheduleFollowUp('tax_audit'); finishMission('alderman_fixer', 'Political Favors stay locked; City Hall audit scheduled in 2 minutes'); } },
        ]}); return;
      }
      showModal({ eyebrow:'Railyard', title:'Union Leader Calder', body:"<p class='flavor'>Calder has enough workers behind him to be brave and enough overdue bills to be practical.</p>", buttons:[
        { label:'Pay the workers ($1800)', cost:1800, onClick:function(){ state.cash = Math.max(0, state.cash - 1800); state.influence += 45; state.worldMemory.politicalFavorsUnlocked = true; log('<i aria-hidden="true" class="ph-duotone ph-courthouse"></i> The permits move. Political Favors are now available at City Hall.'); finishMission('alderman_fixer', '$1,800 spent; influence +45; Political Favors unlocked'); } },
        { label:'Pressure Calder', onClick:function(){ state.respect += 14; state.heat = Math.min(100, state.heat + 12); state.influence += 25; state.worldMemory.politicalFavorsUnlocked = true; log('<i aria-hidden="true" class="ph-duotone ph-courthouse"></i> Calder folds. City Hall owes you, and everyone saw how.'); finishMission('alderman_fixer', 'respect +14; heat +12; influence +25; Political Favors unlocked'); } },
      ]}); return;
    }
    if(id === 'tax_audit'){
      const ventureId = typeof state.worldMemory.inspectionVentureId === 'string' ? state.worldMemory.inspectionVentureId : (flagshipLegit() ?? businesses[0])?.id;
      const venture = businesses.find(function(business){ return business.id === ventureId; });
      const ventureName = venture?.name ?? 'your flagship venture';
      showModal({ eyebrow:'City Hall Annex', title:'The Audit Notice', body:`<p class='flavor'>The clerk slides over a file for ${escapeHtml(ventureName)}. The bagman is not mentioned once. Every page is perfectly legal and timed to make the point.</p>`, buttons:[
        { label:`Pay the filing settlement (${formatMoney(PHASE2_MISSION_CONFIG.taxAuditSettlementCost)})`, cost:PHASE2_MISSION_CONFIG.taxAuditSettlementCost, onClick:function(){ state.cash = Math.max(0, state.cash - PHASE2_MISSION_CONFIG.taxAuditSettlementCost); state.worldMemory.taxAuditPending = false; state.worldMemory.taxAuditResolved = 'settled'; finishMission('tax_audit', `$${PHASE2_MISSION_CONFIG.taxAuditSettlementCost} spent; audit closed; ${ventureName} stays open`); } },
        { label:`Contest it (${ventureName} income -50% for ${PHASE2_MISSION_CONFIG.taxAuditSeconds}s)`, onClick:function(){ if(ventureId) applyBusinessTempMult(ventureId, PHASE2_MISSION_CONFIG.taxAuditMultiplier, PHASE2_MISSION_CONFIG.taxAuditSeconds); state.worldMemory.taxAuditPending = false; state.worldMemory.taxAuditResolved = 'contested'; finishMission('tax_audit', `${ventureName} income -50% for ${PHASE2_MISSION_CONFIG.taxAuditSeconds} seconds; audit contested`); } },
      ]}); return;
    }
    if(id === 'turf_war'){
      const mission = state.activeMissions.turf_war;
      if(mission?.stageId === 'travel'){
        showModal({ eyebrow:'Devlin Corner', title:'Hold the Block', body:"<p class='flavor'>A lookout calls positions. You can make a clean show of force or let the first punch land.</p>", buttons:[
          { label:'Defend with crew', onClick:function(){ const devlin = districts.find(function(d){ return d.id === 'devlin'; })!; devlin.control = Math.min(100, devlin.control + 8 + state.muscleCount); state.respect += 8; state.heat = Math.min(100, state.heat + 8); advanceMissionToObjective('turf_war', 'capo', 'marigoldLounge', 'Track the rival capo to Marigold Lounge'); } },
          { label:'Pay locals to watch ($700)', cost:700, onClick:function(){ state.cash = Math.max(0, state.cash - 700); state.heat = Math.max(0, state.heat - 4); advanceMissionToObjective('turf_war', 'capo', 'marigoldLounge', 'Track the rival capo to Marigold Lounge'); } },
        ]}); return;
      }
      if(mission?.stageId === 'lodge'){
        showModal({ eyebrow:'Ridgewood Stand Lodge', title:'Neutral Ground', body:"<p class='flavor'>The capo arrives without his usual crowd. Outside, the tree line makes the city feel far away. He offers a truce, but wants you to admit the block is contested.</p>", buttons:[
          { label:'Sign a narrow truce', onClick:function(){ state.heat = Math.max(0, state.heat - 18); state.worldMemory.westsideTruce = 'ridgewood'; finishMission('turf_war', 'heat -18; Ridgewood truce recorded; West Side remains contested'); } },
          { label:'Expose his weak crew', onClick:function(){ const westside = districts.find(function(d){ return d.id === 'westside'; })!; westside.control = Math.min(100, westside.control + 12); state.respect += 16; state.heat = Math.min(100, state.heat + 16); state.worldMemory.westsideCapoExposed = true; finishMission('turf_war', 'West Side control +12; respect +16; heat +16; capo weakness recorded'); } },
        ]}); return;
      }
      showModal({ eyebrow:'Marigold Lounge', title:'The Capo', body:"<p class='flavor'>The capo offers a truce before anyone reaches for a weapon. It is either a way out or a chance to end the argument.</p>", buttons:[
        { label:'Take the truce', onClick:function(){ state.worldMemory.westsideMeet = 'lodge'; advanceMissionToObjective('turf_war', 'lodge', 'lodgeRidgewood', 'Set terms at Ridgewood Stand Lodge'); } },
        { label:'Assassinate him', onClick:function(){ const westside = districts.find(function(d){ return d.id === 'westside'; })!; const success = Math.random() < Math.min(0.8, 0.35 + gangStrength()/80); if(success){ westside.control = Math.min(100, westside.control + 18); state.respect += 28; log('<i aria-hidden="true" class="ph-duotone ph-crosshair"></i> The capo drops and a West Side block opens up.'); } else { state.cash = Math.max(0, state.cash - 1600); state.muscleCount = Math.max(0, state.muscleCount - 1); log('<i aria-hidden="true" class="ph-duotone ph-warning"></i> The hit misses. You lose money and muscle getting out.'); } state.heat = Math.min(100, state.heat + 30); finishMission('turf_war', success ? 'West Side control +18; respect +28; heat +30; capo removed' : '$1,600 spent; 1 muscle lost; heat +30; hit failed'); } },
      ]}); return;
    }
    if(id === 'first_heist'){
      const mission = state.activeMissions.first_heist;
      if(mission?.stageId === 'travel'){
        const buttons: ModalButton[] = [
          { label:'Pick the fast smash approach', onClick:function(){ state.worldMemory.firstHeistApproach = 'smash'; advanceMissionToObjective('first_heist', 'escape', 'heistTarget', 'Execute the smash-and-grab'); } },
        ];
        if(crewUsedGlobal() >= PHASE2_MISSION_CONFIG.heistPrepCrewReq) buttons.unshift({ label:'Pick the quiet crew approach', onClick:function(){ state.worldMemory.firstHeistApproach = 'crew'; advanceMissionToObjective('first_heist', 'escape', 'heistTarget', 'Execute the crew heist'); } });
        showModal({ eyebrow:'First Windhaven Trust', title:'Case the Bank', body:"<p class='flavor'>You time the guard, count exits, and mark the cameras. This is no longer a button press. It is a plan.</p>", buttons }); return;
      }
      heistTargetBankId = DEFAULT_BANK_ID;
      const approach = String(state.worldMemory.firstHeistApproach || 'smash');
      showModal({ eyebrow:'First Windhaven Trust', title:'Execution Window', body: approach === 'crew'
        ? "<p class='flavor'>Your crew has the lobby timed. The vault is still a risk, but the smaller cashier bundles are already within reach.</p>"
        : "<p class='flavor'>The guard turns toward the side door. You have one clean chance to push for the vault or leave with what is already loose.</p>", buttons:[
        { label: approach === 'crew' ? 'Push the crew toward the vault' : 'Push for the vault', onClick:function(){ const heistResult = resolveHeist(approach); finishMission('first_heist', heistResult); } },
        { label:'Leave with the cashier bundles', onClick:function(){ const bundle = approach === 'crew' ? 900 : 450; const heat = approach === 'crew' ? 8 : 5; state.cash += bundle; state.heat = Math.min(100, state.heat + heat); state.nextHeistAt = state.playSeconds + 240; state.worldMemory.firstHeistExit = 'cashier'; log(`<i aria-hidden="true" class="ph-duotone ph-money"></i> You leave before the vault turns into a headline: ${formatMoney(bundle)} gained, heat +${heat}.`); finishMission('first_heist', `${formatMoney(bundle)} gained; heat +${heat}; vault left untouched`); } },
      ]});
      return;
    }
    if(id === 'fire'){
      showModal({ eyebrow:"Kailash's Cart", title:'Smoke Under the Awning', body:"<p class='flavor'>The repair is easy. Deciding whether to chase the person who lit it is the hard part.</p>", buttons:[
        { label:'Rebuild quietly ($250, cart income -30% for 30s)', cost:250, onClick:function(){ const cart = businesses.find(function(business){ return business.id === 'cart'; }); state.cash = Math.max(0, state.cash - 250); if(cart){ cart.tempMult = 0.7; cart.tempMultExpire = Date.now() + 30_000; } state.worldMemory.cartRebuiltQuietly = true; log('<i aria-hidden="true" class="ph-duotone ph-warning-circle"></i> A quick repair keeps Kailash’s Cart running at reduced income for 30 seconds.'); finishMission('fire', '$250 spent; Kailash’s Cart income -30% for 30 seconds'); } },
        { label:'Hunt the arsonist', onClick:function(){ state.respect += 12; state.heat = Math.min(100, state.heat + 12); state.worldMemory.arsonistHunted = true; scheduleFollowUp('arsonist_revenge'); log('<i aria-hidden="true" class="ph-duotone ph-crosshair"></i> You put word out. The revenge path is open.'); finishMission('fire', 'revenge opened'); } },
      ]});
    }
  }
  function renderMissionPhoneApp(): void {
    const wrap = byIdOrNull('missions-panel');
    if(!wrap) return;
    const active = activeMissionEntries();
    const messages = missionEventPool.filter(function(event){ return state.eventHistory[event.id] === 'offered' && !state.activeMissions[event.id]; });
    const completed = Object.values(state.completedMissions).slice(-4).reverse();
    wrap.innerHTML = `
      <div class="section-eyebrow">Messages</div>
      ${messages.length ? messages.map(function(event){
        return `<div class="mission-phone-card unread"><div class="mission-phone-title">${escapeHtml(event.title)}</div><div class="mission-phone-meta">${escapeHtml(event.sender)}</div><div class="mission-phone-body">${event.body}<div class="mission-consequence">${escapeHtml(event.consequence)}</div></div><div class="btn-row"><button class="mini-btn" data-mission-start="${escapeHtml(event.id)}">${escapeHtml(event.acceptLabel)}</button><button class="mini-btn secondary" data-mission-decline="${escapeHtml(event.id)}">${escapeHtml(event.declineLabel)}</button></div></div>`;
      }).join('') : '<div class="mission-phone-empty">No unanswered messages.</div>'}
      <div class="section-eyebrow" style="margin-top:18px;">Active Missions</div>
      ${active.length ? active.map(function(mission){
        const def = missionDefinition(mission.id);
        const objective = mission.objective;
        return `<div class="mission-phone-card"><div class="mission-phone-title">${escapeHtml(def?.title ?? mission.id)}</div><div class="mission-phone-meta">${escapeHtml(objective?.label ?? 'Awaiting objective')}</div><div class="btn-row"><button class="mini-btn" ${objective ? '' : 'disabled'} data-mission-gps="${escapeHtml(mission.id)}">Set GPS</button></div></div>`;
      }).join('') : '<div class="mission-phone-empty">No active missions.</div>'}
      ${completed.length ? `<div class="section-eyebrow" style="margin-top:18px;">Completed</div>${completed.map(function(outcome){ const def = missionDefinition(outcome.id); return `<div class="mission-phone-empty">${escapeHtml(def?.title ?? outcome.id)} - ${escapeHtml(outcome.result)}</div>`; }).join('')}` : ''}
    `;
  }
  function renderContactsApp(): void {
    const wrap = byIdOrNull('contacts-panel');
    if(!wrap) return;
    const waypoint = currentWaypoint();
    const taxiBlocked = activeMissionCount(missionSaveState()) > 0 || !waypoint || state.cash < 150;
    const fare = 150;
    const missionContacts = [
      { name:'Lana Vance', unlocked:missionCompleted(missionSaveState(), 'tribune'), note:`Herald reporter — ${String(state.worldMemory.pressArticle || 'no article recorded')}`, serviceId:'heraldHq', action:'Set newsroom GPS' },
      { name:'Dockmaster Bell', unlocked:missionCompleted(missionSaveState(), 'stolen_shipment'), note:'Dockside contact', serviceId:'docksDockmaster', action:'Set docks GPS' },
      { name:'Cousin Amit', unlocked:missionCompleted(missionSaveState(), 'cousin'), note:'Family', serviceId:'hubBusStation', action:'Set bus station GPS' },
      { name:'Silent Investor', unlocked:state.worldMemory.investorSponsorAvailable === true, note:'Trade-group sponsor lead', serviceId:'brand-horizon', action:'Set Horizon GPS' },
    ].filter(function(contact){ return contact.unlocked; });
    const taxiStatus = !waypoint
      ? 'Set a waypoint on the City Map before calling a taxi.'
      : activeMissionCount(missionSaveState()) > 0
        ? 'Taxi dispatch is unavailable while a mission objective is active.'
        : state.cash < fare
          ? 'You need $150 cash for the flat fare.'
          : 'The driver will take you to your current waypoint.';
    wrap.innerHTML = '<div class="section-eyebrow">Services</div>'
      + '<div class="mission-phone-card"><div class="mission-phone-title">Windhaven Taxi</div>'
      + '<div class="mission-phone-meta">$150 flat fare</div>'
      + '<div class="mission-phone-body"><p>' + escapeHtml(taxiStatus) + '</p></div>'
      + '<div class="btn-row"><button class="mini-btn" data-taxi-dispatch ' + (taxiBlocked ? 'disabled' : '') + '>Dispatch taxi</button></div></div>'
      + '<div class="section-eyebrow" style="margin-top:18px;">People</div>'
      + (missionContacts.length
        ? missionContacts.map(function(contact){
          const dockAction = contact.serviceId === 'docksDockmaster'
            ? '<button class="mini-btn" data-contact-action="dock-status">Ask about dock activity</button>'
            : contact.name === 'Lana Vance'
              ? '<button class="mini-btn" data-contact-action="lana-status">Ask about the coverage</button>'
              : contact.name === 'Cousin Amit'
                ? '<button class="mini-btn" data-contact-action="amit-status">Call the family</button>'
                : contact.name === 'Silent Investor'
                  ? '<button class="mini-btn" data-contact-action="investor-status">Ask about sponsorship</button>'
                : '';
          return '<div class="mission-phone-card"><div class="mission-phone-title">' + escapeHtml(contact.name) + '</div><div class="mission-phone-meta">' + escapeHtml(contact.note) + '</div><div class="btn-row"><button class="mini-btn" data-contact-waypoint="' + escapeHtml(contact.serviceId) + '">' + escapeHtml(contact.action) + '</button>' + dockAction + '</div></div>';
        }).join('')
        : '<div class="mission-phone-empty">Finish missions to add people here.</div>');
  }
  function openDockContactStatus(): void {
    const tradeActive = state.worldMemory.blackMarketTrade === true;
    const caseStatus = state.investigation > 0
      ? `${Math.round(state.investigation)} investigation — detectives are still looking at the manifests.`
      : 'No active case — the manifests are quiet for now.';
    showModal({
      eyebrow:'Dockmaster Bell',
      title:'Dock Activity',
      body:`<p class='flavor'>Bell speaks low enough that the phone sounds like it is underwater. "${tradeActive ? 'Your runway route is moving. Keep the paperwork boring.' : 'Nothing with your name on it is moving through my slips right now.'}"</p><p>${caseStatus}</p>`,
      buttons:[{ label:'Got it' }],
    });
  }
  function openLanaContactStatus(): void {
    const tone = String(state.worldMemory.pressTone || 'quiet');
    const article = String(state.worldMemory.pressArticle || 'the profile that never ran');
    const status = tone === 'professional'
      ? 'The trade group is still calling. Lana says the profile made you legible to people who only trust paperwork.'
      : tone === 'guarded'
        ? 'Lana says the source is waiting because you kept your promise not to make them a headline.'
        : tone === 'warm'
          ? 'Lana says the block-night people still quote your joke when they ask who should get a seat at the table.'
          : tone === 'scandal'
            ? 'Lana says City Hall is reading every edition. The advocate wants to know whether you meant what you said.'
            : tone === 'hostile'
              ? 'Lana says the damage-control story has moved off the front page, but nobody forgot the threat.'
              : 'Lana says silence became its own story. Some people liked the restraint; others filled in the blanks.';
    showModal({
      eyebrow:'Lana Vance',
      title:article,
      body:`<p class='flavor'>${escapeHtml(status)}</p>`,
      buttons:[{ label:'Keep listening' }],
    });
  }
  function openAmitContactStatus(): void {
    const loyalty = Number(state.worldMemory.familyLoyalty || 0);
    const status = loyalty >= 4
      ? 'Amit says the family is telling people you handled things when they got hard. They trust your word more now.'
      : loyalty > 0
        ? 'Amit says the family is cautious but grateful. They are watching whether you keep making room for people.'
        : loyalty < 0
          ? 'Amit says the family has stopped asking for favors. That silence is not forgiveness.'
          : 'Amit says nobody knows what to make of the decision yet. That may be better than an argument.';
    showModal({
      eyebrow:'Cousin Amit',
      title:`Family Standing: ${loyalty >= 0 ? '+' : ''}${loyalty}`,
      body:`<p class='flavor'>${escapeHtml(status)}</p>`,
      buttons:[{ label:'I understand' }],
    });
  }
  function openInvestorContactStatus(): void {
    showModal({
      eyebrow:'Silent Investor',
      title:'Sponsor Lead',
      body:"<p class='flavor'>The investor says the trade group is interested because you negotiated like someone who understands ownership. They will watch your legitimate income before they put their name beside yours.</p><p>Your reduced permanent income cut is the price of keeping that door open.</p>",
      buttons:[{ label:'Keep the line open' }],
    });
  }
  function dispatchTaxi(): void {
    const waypoint = currentWaypoint();
    if(!waypoint || activeMissionCount(missionSaveState()) > 0 || state.cash < 150) return;
    state.cash -= 150;
    player.x = waypoint.x;
    player.y = waypoint.y;
    const districtId = districtIdAtPlayablePoint(waypoint);
    if(districtId) state.currentDistrict = districtId;
    setGlobalWaypoint(null);
    rebuildWaypointBeacon();
    byId('minimap-clear').classList.remove('show');
    closeDevice();
    buildDistrictScene(state.currentDistrict);
    refreshPlayerModel();
    log('<i aria-hidden="true" class="ph-duotone ph-taxi"></i> Taxi dispatched: $150 spent. You arrive at the waypoint.');
    renderAll();
    scheduleSave();
  }
  function unreadMissionMessageCount(): number {
    return missionEventPool.filter(function(event){ return state.eventHistory[event.id] === 'offered' && !state.activeMissions[event.id]; }).length;
  }
  function renderMissionNotificationBadges(): void {
    const count = unreadMissionMessageCount();
    const text = count > 9 ? '9+' : String(count);
    ['mission-phone-badge', 'mission-app-badge'].forEach(function(id){
      const badge = byIdOrNull(id);
      if(!badge) return;
      badge.textContent = text;
      badge.classList.toggle('show', count > 0);
    });
    const phoneBtn = byIdOrNull('phone-btn');
    if(phoneBtn) phoneBtn.classList.toggle('has-mission-alert', count > 0);
  }
  function availableMissionEvents(): MissionEventDefinition[] {
    if(activeMissionCount(missionSaveState()) >= PHASE2_MISSION_CONFIG.activeMissionCap) return [];
    return missionEventPool.filter(function(event){
      if(state.activeMissions[event.id]) return false;
      if(event.id === 'inspector' && state.worldMemory.kowalskiBlackmailed) return false;
      if(event.id === 'home_safe_robbery' && (bankedTotal() > 0 || state.cash < 300)) return false;
      if(event.id === 'stolen_shipment' && !businesses.some(function(b){ return b.id === 'syndicate_logistics' && b.level > 0; })) return false;
      if(event.id === 'alderman_fixer' && state.influence < 80) return false;
      if(event.id === 'turf_war' && !(state.worldMemory.gangWarSparked || districts.find(function(d){ return d.id === 'westside'; })!.control >= 35)) return false;
      if(event.id === 'first_heist' && (missionCompleted(missionSaveState(), 'first_heist') || state.respect < PHASE2_MISSION_CONFIG.heistPrepRespectReq)) return false;
      if(event.id === 'pigeon_summit' && state.respect < 25) return false;
      if(event.id === 'mayors_parrot' && state.respect < 40) return false;
      if(['amit_mistake', 'hostile_press', 'press_followup', 'black_market_investigation', 'arsonist_revenge', 'cops', 'hustler_score', 'tax_audit'].includes(event.id) && !delayedFollowUpReady(event.id)) return false;
      if(event.unique && !canOfferUniqueEvent(missionSaveState(), event.id)) return false;
      if(!event.unique && !canOfferRepeatableEvent(missionSaveState(), event.id, event.maxRepeats)) return false;
      return true;
    });
  }
  function showMissionOffer(event: MissionEventDefinition): void {
    recordEventOffer(missionSaveState(), event.id);
    if(event.entry === 'phone'){
      log(`<i aria-hidden="true" class="ph-duotone ph-device-mobile"></i> New message from ${event.sender}: ${event.title}.`);
      renderMissionNotificationBadges();
      renderAll();
      scheduleSave();
      return;
    }
    showModal({
      eyebrow:event.sender,
      title:event.title,
      body:event.body + `<p><strong>Possible consequences:</strong> ${escapeHtml(event.consequence)}</p>`,
      buttons:[
        { label:event.acceptLabel, onClick:function(){ startMissionFromOffer(event.id); } },
        { label:event.declineLabel, secondary:true, onClick:function(){ declineMissionOffer(event.id); } },
      ],
    });
    renderMissionNotificationBadges();
    scheduleSave();
  }

  function checkMilestones() {
    if(state.cash >= 200) triggerMilestone('first_venture');
    if(state.respect >= 60) triggerMilestone('local_boss');
    if(state.respect >= 900) triggerMilestone('kingpin');
    if(state.ownedProperties.length >= 1) triggerMilestone('first_property');
    const r = businesses.find(b => b.id === 'restaurant');
    if(r && r.level >= 1) triggerMilestone('chaat_house');
    const d = businesses.find(b => b.id === 'syndicate_logistics');
    if(d && d.level >= 1) triggerMilestone('docks');
    if(state.ownedCars.includes('bentley')) triggerMilestone('bentley');
    if(gangRecruits.some(g => g.inducted)) triggerMilestone('crew_induct');
  }

  function maybeTriggerEvent(){
    if(!state.started) return;
    if(state.playSeconds < state.nextEventAt) return;
    if(modalOnScreen()) return;
    state.nextEventAt = state.playSeconds + PHASE2_MISSION_CONFIG.missionIntervalMin + Math.random()*PHASE2_MISSION_CONFIG.missionIntervalVariance;
    const ratWeight = Math.max(0.35, 1 - state.ratCount*0.09);
    const candidates = availableMissionEvents().filter(function(event){ return !event.neg || Math.random() < ratWeight || Math.random() < 0.4; });
    const pool = candidates.length ? candidates : availableMissionEvents();
    const followUps = pool.filter(function(event){ return ['amit_mistake', 'hostile_press', 'press_followup', 'black_market_investigation', 'arsonist_revenge', 'cops', 'hustler_score', 'tax_audit'].includes(event.id); });
    const selection = followUps.length ? followUps : pool;
    const event = selection[Math.floor(Math.random()*selection.length)];
    if(event) showMissionOffer(event);
  }
  function deliverDelayedFollowUp(): void {
    if(activeMissionCount(missionSaveState()) >= PHASE2_MISSION_CONFIG.activeMissionCap) return;
    if(modalOnScreen()) return;
    const followUp = availableMissionEvents().find(function(event){
      return ['amit_mistake', 'hostile_press', 'press_followup', 'black_market_investigation', 'arsonist_revenge', 'cops', 'hustler_score', 'tax_audit'].includes(event.id)
        && typeof state.worldMemory[`${event.id}DueAt`] === 'number'
        && Number(state.worldMemory[`${event.id}DueAt`]) > 0;
    });
    if(followUp){
      state.worldMemory[`${followUp.id}DueAt`] = 0;
      showMissionOffer(followUp);
    }
  }

  // LEGAL: ================= THE RAID (investigation culmination) =================
  // LEGAL: HYBRID enforcement — hit the illegal FOOTPRINT (product, corners, top street
  // LEGAL: venture) plus a SMALL, CAPPED cash fine tied to illegal income, never net
  // LEGAL: worth. Legit ventures and banked cash are untouched, so laundering into them
  // LEGAL: is what breaks the old flat-tax wealth cap.
  function triggerRaid(){
    const w = whitmoreMult();
    state.product = 0;
    const active = corners.filter(c=>c.dealer && !c.busted);
    const bustN = Math.min(active.length, 2 + (Math.random()<0.5?1:0));
    for(let i=0;i<bustN;i++){ const c=active[i]; c.busted=true; c.dealer=false; c.bustCooldownAt=state.playSeconds+180; }
    const top = topStreetVenture();
    if(top) top.level = Math.max(0, top.level-1);
    const fine = Math.min(state.cash*0.08, illegalIncomePerSec()*35) * w;
    state.cash = Math.max(0, state.cash - fine);
    state.respect = Math.max(0, state.respect-5);
    state.heat = 20;
    state.investigation = 45; // LEGAL: sticky — you beat this case, but the file stays open
    triggerMilestone('raid');
    let campaignNote = '';
    if(state.campaignActive){ state.campaignActive = false; state.nextCampaignAt = state.playSeconds + 900; campaignNote = ' The scandal kills your political campaign.'; }
    const target = top ? top.name : (active.length ? active[0].name : 'your operation');
    pushCityNews(`FEDERAL AGENTS RAID ${target.toUpperCase()}; ASSETS SEIZED`, true);
    log(`<i aria-hidden="true" class="ph-duotone ph-warning"></i> The case lands. Agents hit ${target} — product gone, corners rolled up, ${formatMoney(fine)} in fines.${campaignNote}`);
    // LEGAL: A raid rattles everyone you're squeezing — resentment jumps (but they don't
    // LEGAL: automatically bolt anymore; that's the resentment system's job now).
    const extortedList = localBusinesses.filter(b=>b.extorted);
    extortedList.forEach(function(b){ b.resentment = Math.min(100, (b.resentment ?? 0) + 25); });
    if(extortedList.length) log(`<i aria-hidden="true" class="ph-duotone ph-warning"></i> The raid spooks the owners paying you tribute — they're getting nervous.`);
  }

  // LEGAL: ================= THE WINDHAVEN WIRE (city news broadcasts) =================
  // LEGAL: A SEPARATE feed from the RCN stock ticker. These headlines react to the
  // LEGAL: player's own operations and most carry a gameplay effect (heat, the case,
  // LEGAL: business, PR). Surfaced in a dedicated Empire-tab card and the activity log.
  interface Broadcast { id: string; alert?: boolean; when: () => boolean; headline: () => string; effect?: () => void; }
  const broadcastPool: Broadcast[] = [
    { id:'expose', alert:true,
      when:()=> wantedTier()>=3 && !!topStreetVenture(),
      headline:()=> `TRIBUNE EXPOSÉ: IS "${topStreetVenture()!.name.toUpperCase()}" A FRONT FOR THE MOB?`,
      effect:()=>{ state.investigation = Math.min(100, state.investigation+10); state.heat = Math.min(100, state.heat+5); } },
    { id:'grandjury', alert:true,
      when:()=> state.investigation>35,
      headline:()=> `GRAND JURY CONVENES OVER "A MAJOR WINDHAVEN FIGURE"`,
      effect:()=>{ state.investigation = Math.min(100, state.investigation+8); } },
    { id:'informant', alert:true,
      when:()=> wantedTier()>=2 && corners.some(c=>c.dealer && !c.busted),
      headline:()=> `POLICE TOUT NEW STREET INFORMANT PROGRAM ACROSS ${districtDisplayName(state.currentDistrict).toUpperCase()}`,
      effect:()=>{ state.heat = Math.min(100, state.heat+7); const act = corners.filter(c=>c.dealer && !c.busted); if(act.length && Math.random()<0.5){ const c=act[Math.floor(Math.random()*act.length)]; c.busted=true; c.dealer=false; c.bustCooldownAt=state.playSeconds+180; } } },
    { id:'dockcheck', alert:true,
      when:()=> { const b=businesses.find(x=>x.id==='syndicate_logistics'); return !!b && b.level>0; },
      headline:()=> `HARBOR PATROL DOUBLES CONTAINER INSPECTIONS AT THE WEST SIDE DOCKS`,
      effect:()=>{ state.heat = Math.min(100, state.heat+6); } },
    { id:'review',
      when:()=> !!flagshipLegit(),
      headline:()=> `HERALD CRITIC RAVES: "${flagshipLegit()!.name.toUpperCase()} IS THE BEST TABLE IN WINDHAVEN"`,
      effect:()=>{ applyTempMult('legit', 1.25, 60); } },
    { id:'festival',
      when:()=> businesses.some(b=>b.category==='legit' && b.level>0),
      headline:()=> `WINDHAVEN STREET FESTIVAL DRAWS RECORD CROWDS TO ${districtDisplayName(state.currentDistrict).toUpperCase()}`,
      effect:()=>{ applyTempMult('legit', 1.15, 45); } },
    { id:'charity',
      when:()=> state.respect>=60,
      headline:()=> `CITY HONORS ${currentRank().toUpperCase()} FOR "NEIGHBORHOOD REVITALIZATION"`,
      effect:()=>{ state.respect += 8; state.heat = Math.max(0, state.heat-6); } },
    { id:'propboom',
      when:()=> state.ownedProperties.length>0,
      headline:()=> `WEST SIDE PROPERTY VALUES SURGE ON REDEVELOPMENT BUZZ`,
      effect:()=>{ const windfall = Math.max(500, propertiesIncome()*40); state.cash += windfall; } },
    { id:'rival',
      when:()=> districts.some(d=>districtStatus(d.id)==='rival'),
      headline:()=> { const d=districts.find(x=>districtStatus(x.id)==='rival')!; return `RIVAL SYNDICATE FLEXES OPENLY IN ${d.name.toUpperCase()}`; },
      effect:()=>{ const d=districts.find(x=>districtStatus(x.id)==='rival'); if(d) d.control = Math.max(0, d.control-5); } },
    { id:'quiet',
      when:()=> wantedTier()<=1 && illegalFrontCount()>0,
      headline:()=> `POLICE REPORT A "HISTORIC LULL" IN ORGANIZED-CRIME ACTIVITY`,
      effect:()=>{ state.heat = Math.max(0, state.heat-3); } },
  ];
  const cityFillerPool = [
    "WINDHAVEN TRANSIT DELAYS THE BLUE LINE AGAIN.",
    "MAYOR CUTS RIBBON ON THE NEW DEVLIN STREET UNDERPASS.",
    "COLD SNAP GRIPS THE WEST SIDE; SHELTERS OVER CAPACITY.",
    "HUB HIGH TITANS WIN THE CITY BASKETBALL CHAMPIONSHIP.",
    "POTHOLE SEASON ARRIVES EARLY ACROSS THE CITY.",
    "RIVER CLEANUP VOLUNTEERS GATHER ALONG THE CANALS.",
  ];
  let lastBroadcastId = '';
  function pushCityNews(text: string, alert: boolean){
    if(!state.cityNews) state.cityNews = [];
    state.cityNews.unshift((alert?'⚠ ':'') + text);
    if(state.cityNews.length > 4) state.cityNews.pop();
    renderCityNews();
  }
  function renderCityNews(){
    const el = byIdOrNull('wire-items');
    if(!el) return;
    el.innerHTML = (state.cityNews && state.cityNews.length)
      ? state.cityNews.map((n,i)=> `<div class="wire-item${i===0?' wire-item-new':''}">${n}</div>`).join('')
      : `<div class="wire-item wire-item-empty">Quiet on the wire tonight.</div>`;
  }
  function tickCityNews(){
    const eligible = broadcastPool.filter(b=> b.id !== lastBroadcastId && b.when());
    if(eligible.length && Math.random() < 0.7){
      const b = eligible[Math.floor(Math.random()*eligible.length)];
      lastBroadcastId = b.id;
      const text = b.headline();
      if(b.effect) b.effect();
      pushCityNews(text, !!b.alert);
      log(`📺 <strong>Windhaven Wire —</strong> ${text}`);
    } else {
      lastBroadcastId = '';
      pushCityNews(cityFillerPool[Math.floor(Math.random()*cityFillerPool.length)], false);
    }
    state.nextCityNewsAt = state.playSeconds + 80 + Math.random()*70;
  }

  // LEGAL: ================= VENTURE QUICK PANEL (used by the map) =================
  function openVentureQuickPanel(b: Business){
    const unlocked = isUnlocked(b);
    let bodyHtml = `<p>${b.flavor}</p>`;
    const buttons: ModalButton[] = [];
    if(!unlocked){
      bodyHtml += `<p class="flavor">${unlockRequirement(b)}</p>`;
    } else if(!b.researched){
      const rc = researchCostFor(b);
      buttons.push({ label:`Research (${formatMoney(rc)})`, onClick:function(){ if(state.cash>=rc){ state.cash-=rc; b.researched=true; log(`<i aria-hidden="true" class="ph-duotone ph-flask"></i> You research ${b.name}.`);} renderAll(); }});
    } else {
      bodyHtml += `<p class="flavor">Level ${b.level} · ${incomeFor(b).toFixed(1)}/s · Efficiency ${Math.round(efficiency(b)*100)}%</p>`;
      const cost = costForLevel(b);
      buttons.push({ label:`${b.level===0?'Open':'Expand'} (${formatMoney(cost)})`, onClick:function(){ if(state.cash>=cost){ state.cash-=cost; b.level+=1; if(b.category==='street') state.respect+=1; if(b.level===1){ if(b.id==='restaurant') triggerMilestone('chaat_house'); if(b.id==='syndicate_logistics') triggerMilestone('docks'); } } renderAll(); }});
      if(!b.manager){
        const cc = crewCostFor(b);
        buttons.push({ label:`+ Crew (${formatMoney(cc)})`, onClick:function(){ if(state.cash>=cc && crewUsedGlobal()<crewCapGlobal()){ state.cash-=cc; b.crew+=1; } renderAll(); }});
      }
    }
    buttons.push({ label:'Close', secondary:true });
    showModal({ eyebrow: b.category==='street'?'The Other Ledger':'Ventures', title:b.name, body:bodyHtml, buttons });
  }

  // LEGAL: ================= BANK =================
  // LEGAL: Per-bank account helpers. `bankedTotal` sums every account (that's the
  // LEGAL: raid-safe pile the rest of the game reads); `bankBalance`/`addToBank` operate
  // LEGAL: on one bank by id, clamped at zero.
  function bankBalance(id: string){ return state.bankAccounts[id] ?? 0; }
  function bankedTotal(){ return Object.values(state.bankAccounts).reduce((sum, v)=> sum + (v || 0), 0); }
  function addToBank(id: string, delta: number){ state.bankAccounts[id] = Math.max(0, (state.bankAccounts[id] ?? 0) + delta); }
  function bankName(id: string){ return banks.find(b=>b.id===id)?.name ?? 'the bank'; }
  function depositAmount(bankId: string, rawAmt: string | undefined){
    const amt = Math.floor(Number(rawAmt));
    if(!isFinite(amt) || amt<=0){ log('<i aria-hidden="true" class="ph-duotone ph-bank"></i> Enter a valid amount to deposit.'); return; }
    if(amt > state.cash){ log(`<i aria-hidden="true" class="ph-duotone ph-vault"></i> You don't have ${formatMoney(amt)} on hand to deposit.`); return; }
    state.cash -= amt; addToBank(bankId, amt);
    log(`<i aria-hidden="true" class="ph-duotone ph-vault"></i> You deposit ${formatMoney(amt)} at ${bankName(bankId)}. Safe from raids in there.`);
    renderAll();
  }
  function withdrawAmount(bankId: string, rawAmt: string | undefined){
    const amt = Math.floor(Number(rawAmt));
    if(!isFinite(amt) || amt<=0){ log('<i aria-hidden="true" class="ph-duotone ph-bank"></i> Enter a valid amount to withdraw.'); return; }
    if(amt > bankBalance(bankId)){ log(`<i aria-hidden="true" class="ph-duotone ph-vault"></i> There's only ${formatMoney(bankBalance(bankId))} at ${bankName(bankId)}.`); return; }
    addToBank(bankId, -amt); state.cash += amt;
    log(`<i aria-hidden="true" class="ph-duotone ph-vault"></i> You withdraw ${formatMoney(amt)} from ${bankName(bankId)}.`);
    renderAll();
  }
  // LEGAL: In-person teller for one bank branch — quick preset moves, not typed amounts
  // LEGAL: (the phone Bank app is for precise control). Each button is a complete action,
  // LEGAL: so closing the modal after one is fine. depositAmount/withdrawAmount log + save.
  function openTellerBanking(bankId: string){
    const bank = banks.find(b=>b.id===bankId);
    if(!bank){ log('This branch is closed.'); return; }
    const bal = Math.floor(bankBalance(bankId));
    const cash = Math.floor(state.cash);
    const body = `<p>You step up to the counter at ${bank.name}.</p>`
      + `<p class="flavor">Balance here <strong>${formatMoney(bal)}</strong> · On hand <strong>${formatMoney(cash)}</strong> · Interest ${bank.rateLabel} · Vault ${bank.security}. Use the Bank app on your phone for exact amounts or your other accounts.</p>`;
    const buttons: ModalButton[] = [];
    if(cash > 0){
      buttons.push({ label:`Deposit all (${formatMoney(cash)})`, onClick:function(){ depositAmount(bankId, String(cash)); } });
      if(cash > 1) buttons.push({ label:`Deposit half (${formatMoney(Math.floor(cash/2))})`, onClick:function(){ depositAmount(bankId, String(Math.floor(cash/2))); } });
    }
    if(bal > 0) buttons.push({ label:`Withdraw all (${formatMoney(bal)})`, onClick:function(){ withdrawAmount(bankId, String(bal)); } });
    buttons.push({ label:'Leave', secondary:true });
    showModal({ eyebrow:`${bank.name} — Teller`, title: bank.name, body, buttons });
  }
  // LEGAL: ---- Brand caveats in play (Phase 4) ----
  // LEGAL: The downside printed on each shop card, actually happening. Rules live in
  // LEGAL: map/brandEffects.ts; this only rolls the dice and applies the outcome.
  let nextRoughRaidCheckAt = 0;
  const ROUGH_RAID_CHECK_INTERVAL = 90; // LEGAL: seconds between crew-raid rolls

  // LEGAL: The fleet board. Every car you own, which one you are driving, and a way to
  // LEGAL: switch — the in-person counterpart to the phone's DRIVE button, and the answer
  // LEGAL: to "where are my cars kept".
  // LEGAL: ---- Arjun's flat, above the garage ----
  function openWardrobeSpot(): void {
    openWardrobe(THREE, state.appearance, function(look){
      state.appearance = look;
      refreshPlayerModel();
      log('<i aria-hidden="true" class="ph-duotone ph-t-shirt"></i> You change, and catch yourself in the mirror on the way out.');
      scheduleSave();
    }, {
      title:'Wardrobe', subtitle:'Upstairs at your garage',
      offer:(slot: WardrobeSlot) => WARDROBE[slot].filter(value => isItemOwned(state.ownedWardrobe, slot, value)),
      footnote:'More hats, eyewear, jewellery, shoes and haircuts at Lakeridge Mall, at the end of Wabash Avenue.',
    });
  }
  // LEGAL: A mall shop is a fitting room: only what this shop sells, priced, and the save button pays.
  function openMallShop(shop: MallShop): void {
    const offer = Object.keys(shop.items);
    openWardrobe(THREE, state.appearance, function(look){
      const cost = lookPrice(state.ownedWardrobe, look);
      if(cost > state.cash) return;
      state.cash -= cost;
      (Object.keys(WARDROBE) as WardrobeSlot[]).forEach(function(slot){
        if(itemPrice(slot, look[slot]) !== null && !state.ownedWardrobe.includes(itemKey(slot, look[slot]))) state.ownedWardrobe.push(itemKey(slot, look[slot]));
      });
      state.appearance = look;
      refreshPlayerModel();
      log(cost > 0
        ? `<i aria-hidden="true" class="ph-duotone ph-shopping-bag"></i> ${shop.name}: ${formatMoney(cost)}. You wear it out of the shop. It's in your wardrobe at home now too.`
        : `<i aria-hidden="true" class="ph-duotone ph-shopping-bag"></i> You try a few things on at ${shop.name} and leave looking how you like.`);
      renderAll(); scheduleSave();
    }, {
      title:shop.name, subtitle:shop.tagline, slots:[shop.slot], colours:shop.colour ? [shop.colour] : [],
      offer:() => offer,
      note:(slot: WardrobeSlot, value: string) => {
        const price = itemPrice(slot, value);
        if(price === null) return '';
        return isItemOwned(state.ownedWardrobe, slot, value) ? 'Yours' : formatMoney(price);
      },
      price:look => lookPrice(state.ownedWardrobe, look),
      canAfford:price => state.cash >= price,
      footnote:shop.pitch,
    });
  }
  const VAULT_STEP = 1000;
  function openVault(): void {
    const move = function(next: { cash: number; vault: number }){
      state.cash = next.cash; state.vaultCash = next.vault;
      refreshHUD(); scheduleSave(); openVault();
    };
    const holdings = function(){ return { cash:state.cash, vault:state.vaultCash }; };
    showModal({
      eyebrow:'Your flat', title:'The Vault',
      body:`<p class="flavor">Bolted to the floor under the bed. What's in here isn't in your pocket, so a shakedown or a pay-off can't touch it.</p>`
        + briefRow('In the vault', formatMoney(state.vaultCash)) + briefRow('On you', formatMoney(state.cash)),
      buttons:[
        { label:'Deposit everything', disabled:state.cash < 1, onClick:function(){ move(depositToVault(holdings(), state.cash)); } },
        { label:`Deposit ${formatMoney(VAULT_STEP)}`, disabled:state.cash < 1, onClick:function(){ move(depositToVault(holdings(), VAULT_STEP)); } },
        { label:`Take ${formatMoney(VAULT_STEP)}`, disabled:state.vaultCash < 1, onClick:function(){ move(withdrawFromVault(holdings(), VAULT_STEP)); } },
        { label:'Take everything', disabled:state.vaultCash < 1, onClick:function(){ move(withdrawFromVault(holdings(), state.vaultCash)); } },
        { label:'Leave', secondary:true },
      ],
    });
  }

  function openGarageFleet(){
    const owned = state.ownedCars.map(id => cars.find(c => c.id === id)).filter((c): c is Car => !!c);
    if(!owned.length){
      showRoomBrief('Your Fleet', 'Your Garage', 'Empty bays and a spare set of keys to nothing. Buy a car at a dealership and it lives here.', '');
      return;
    }
    const buttons: ModalButton[] = owned.map(function(car){
      if(state.brokenCars.includes(car.id)){
        return { label:`${car.name} — broken (repair at ${brandById(car.brand)?.name ?? 'its lot'})`, secondary:true };
      }
      if(state.equippedCar === car.id) return { label:`${car.name} — driving`, secondary:true };
      return { label:`Take the ${car.name}`, onClick:function(){
        state.equippedCar = car.id;
        // LEGAL: Switching cars in the garage puts the new one at the door, not wherever the
        // LEGAL: old one happened to be parked across the map.
        state.parkedCarPos.devlin = garageDoorPoint();
        state.carParkedAt = null;
        log(`<i aria-hidden="true" class="ph-duotone ph-key"></i> You take the ${car.name} out of the garage.`);
        updateParkedCarMesh(); refreshPlayerModel(); renderAll();
      } };
    });
    buttons.push({ label:'Leave', secondary:true });
    showModal({ eyebrow:'Your Garage', title:'Your Fleet', body:`<p class="flavor">${owned.length} car${owned.length===1?'':'s'} in the bays. Whatever you leave in the street ends up back here.</p>`, buttons });
  }

  // LEGAL: ================= THE GILDED KETTLE =================
  // LEGAL: The rules live in map/casino.ts and are unit tested; everything here is table
  // LEGAL: dressing and the cash. One stake used by every game so the player sets it once.

  const CASINO_STAKES = [50, 250, 1000, 5000];
  let casinoStake = 250;

  function casinoCanBet(): boolean {
    if(state.cash >= casinoStake) return true;
    log(`<i aria-hidden="true" class="ph-duotone ph-spades"></i> The Kettle does not take markers. You need ${formatMoney(casinoStake)} on the table.`);
    return false;
  }

  // LEGAL: Settles a round: the stake is already gone, so `returned` is what comes back.
  function casinoSettle(returned: number, description: string): void {
    state.cash += returned;
    const net = returned - casinoStake;
    if(net > 0) log(`<i aria-hidden="true" class="ph-duotone ph-spades"></i> ${description} — up ${formatMoney(net)}.`);
    else if(net === 0) log(`<i aria-hidden="true" class="ph-duotone ph-spades"></i> ${description} — stake back.`);
    else log(`<i aria-hidden="true" class="ph-duotone ph-spades"></i> ${description} — down ${formatMoney(-net)}.`);
    renderAll();
  }

  // LEGAL: A hand as card tiles; `hidden` face-down ones first (the dealer's hole card). In draw poker
  // LEGAL: `holdable` makes each card a button you tap to hold, and `held` marks the ones held.
  function cardTile(card: Card, opts: { back?: boolean; index?: number; held?: boolean } = {}): string {
    if(opts.back) return `<span class="pcard back" aria-label="Face-down card"></span>`;
    const label = cardLabel(card);
    const pip = label.slice(-1), rank = label.slice(0, -1);
    const red = card.suit === 'H' || card.suit === 'D';
    const cls = `pcard${red ? ' red' : ''}${opts.held ? ' held' : ''}`;
    if(opts.index !== undefined) return `<button type="button" class="${cls}" data-hold="${opts.index}" aria-pressed="${opts.held ? 'true' : 'false'}" aria-label="${opts.held ? 'Release' : 'Hold'} ${label}"><span>${rank}</span><span class="pip">${pip}</span></button>`;
    return `<span class="${cls}" aria-label="${label}"><span>${rank}</span><span class="pip">${pip}</span></span>`;
  }
  function cardRow(cards: Card[], hidden = 0): string {
    return `<div class="cards">${cards.map((card, index) => cardTile(card, { back:index < hidden })).join('')}</div>`;
  }

  function openCasinoFloor(): void {
    showModal({
      eyebrow:'The Gilded Kettle',
      title:'The Floor',
      body:`<p class="flavor">Carpet loud enough to hide a stain, and no clocks anywhere. The house is polite and patient and it is going to win.</p>`
        + briefRow('Your cash', formatMoney(state.cash))
        + briefRow('Table stake', formatMoney(casinoStake)),
      buttons:[
        { label:'Blackjack', onClick:openBlackjack },
        { label:'Roulette', onClick:openRoulette },
        { label:'Five-card draw', onClick:openPoker },
        { label:'Slots', onClick:openSlots },
        { label:`Change stake (${formatMoney(casinoStake)})`, secondary:true, onClick:openStakePicker },
        { label:'Cash out', secondary:true },
      ],
    });
  }

  function openStakePicker(): void {
    showModal({
      eyebrow:'The Gilded Kettle', title:'Table Stake',
      body:`<p class="flavor">Every game on the floor plays for the same money.</p>`,
      buttons:[
        ...CASINO_STAKES.map(function(amount){
          return { label:`${formatMoney(amount)}${casinoStake === amount ? ' — current' : ''}`, secondary:casinoStake === amount, onClick:function(){
            casinoStake = amount;
            openCasinoFloor();
          } };
        }),
        { label:'Back', secondary:true, onClick:openCasinoFloor },
      ],
    });
  }

  // LEGAL: ---- Blackjack ----
  function openBlackjack(): void {
    if(!casinoCanBet()) { openCasinoFloor(); return; }
    state.cash -= casinoStake;
    let shoe = shuffle(freshDeck(), Math.random);
    const player: Card[] = [shoe.shift() as Card, shoe.shift() as Card];
    const dealer: Card[] = [shoe.shift() as Card, shoe.shift() as Card];

    function finish(): void {
      const played = playDealerHand(dealer, shoe);
      const outcome = settleBlackjack(player, played.hand);
      const returned = blackjackReturn(outcome, casinoStake);
      const wording: Record<string, string> = {
        blackjack:'Blackjack', win:'You take it', push:'Push', lose:'Dealer takes it', bust:'Bust',
      };
      showModal({
        eyebrow:'Blackjack', title:wording[outcome],
        body:`<p class="flavor">Dealer — ${handValue(played.hand)}</p>${cardRow(played.hand)}`
          + `<p class="flavor">You — ${handValue(player)}</p>${cardRow(player)}`,
        buttons:[
          { label:'Deal again', onClick:openBlackjack },
          { label:'Back to the floor', secondary:true, onClick:openCasinoFloor },
        ],
      });
      casinoSettle(returned, wording[outcome]);
    }

    function turn(): void {
      const total = handValue(player);
      if(total >= 21){ finish(); return; }
      showModal({
        eyebrow:'Blackjack', title:`You have ${total}`,
        body:`<p class="flavor">Dealer shows</p>${cardRow(dealer, 1)}`
          + `<p class="flavor">Your hand</p>${cardRow(player)}`
          + briefRow('Stake', formatMoney(casinoStake)),
        buttons:[
          { label:'Hit', onClick:function(){ player.push(shoe.shift() as Card); turn(); } },
          { label:'Stand', onClick:finish },
        ],
      });
    }
    turn();
  }

  // LEGAL: ---- Roulette ----
  function openRoulette(): void {
    if(!casinoCanBet()) { openCasinoFloor(); return; }
    const bets: Array<{ label: string; bet: RouletteBet }> = [
      { label:'Red', bet:{ kind:'color', color:'red' } },
      { label:'Black', bet:{ kind:'color', color:'black' } },
      { label:'Even', bet:{ kind:'parity', even:true } },
      { label:'19 to 36', bet:{ kind:'half', high:true } },
      // LEGAL: The only inside bet offered, and the reason anyone stays at the wheel.
      { label:'Straight up on 17 (35:1)', bet:{ kind:'straight', pocket:17 } },
    ];
    showModal({
      eyebrow:'Roulette', title:'Place Your Bet',
      body:`<p class="flavor">Single zero. The green pocket takes every outside bet, which is exactly how the room pays for the carpet.</p>`
        + briefRow('Stake', formatMoney(casinoStake)),
      buttons:[
        ...bets.map(function(entry){
          return { label:entry.label, onClick:function(){
            state.cash -= casinoStake;
            const pocket = spinRoulette(Math.random);
            const returned = rouletteReturn(entry.bet, pocket, casinoStake);
            const color = rouletteColor(pocket);
            showModal({
              eyebrow:'Roulette', title:`${pocket} ${color}`,
              body:`<p class="flavor">You were on ${entry.label.toLowerCase()}.</p>`,
              buttons:[
                { label:'Spin again', onClick:openRoulette },
                { label:'Back to the floor', secondary:true, onClick:openCasinoFloor },
              ],
            });
            casinoSettle(returned, `${pocket} ${color}`);
          } };
        }),
        { label:'Back', secondary:true, onClick:openCasinoFloor },
      ],
    });
  }

  // LEGAL: ---- Slots ----
  const SLOT_FACES: Record<string, string> = {
    cherry:'🍒', lemon:'🍋', bell:'🔔', bar:'🍫', seven:'7️⃣',
  };

  // LEGAL: The machine first, then the pull. Walking up to the slots used to take your stake and
  // LEGAL: spin before you'd chosen anything.
  function openSlots(): void {
    showModal({
      eyebrow:'Slots', title:'The Kettle Seven',
      body:`<div class="reels"><span>7️⃣</span><span>7️⃣</span><span>7️⃣</span></div>`
        + briefRow('Stake', formatMoney(casinoStake)) + briefRow('Three sevens', `${SLOT_PAYOUTS.seven}x`),
      buttons:[
        { label:`Pull (${formatMoney(casinoStake)})`, cost:casinoStake, onClick:pullSlots },
        { label:`Change stake (${formatMoney(casinoStake)})`, secondary:true, onClick:openStakePicker },
        { label:'Walk away', secondary:true },
      ],
    });
  }
  function pullSlots(): void {
    if(!casinoCanBet()) { openSlots(); return; }
    state.cash -= casinoStake;
    const spin = spinSlots(Math.random);
    const returned = slotReturn(spin, casinoStake);
    const reels = spin.reels.map(symbol => `<span>${SLOT_FACES[symbol] ?? '?'}</span>`).join('');
    showModal({
      eyebrow:'Slots', title:spin.multiplier > 0 ? spin.label : 'No line',
      body:`<div class="reels">${reels}</div>`
        + briefRow('Pays', `${spin.multiplier}x`)
        + briefRow('Three sevens', `${SLOT_PAYOUTS.seven}x`),
      buttons:[
        { label:`Pull again (${formatMoney(casinoStake)})`, cost:casinoStake, onClick:pullSlots },
        { label:'Back to the floor', secondary:true, onClick:openCasinoFloor },
      ],
    });
    casinoSettle(returned, spin.label);
  }

  // LEGAL: ---- Five-card draw against the pay table ----
  function openPoker(): void {
    if(!casinoCanBet()) { openCasinoFloor(); return; }
    state.cash -= casinoStake;
    const shoe = shuffle(freshDeck(), Math.random);
    let hand: Card[] = shoe.splice(0, 5);
    const held = new Set<number>();

    function payTable(): string {
      return (Object.keys(POKER_PAYOUTS) as Array<keyof typeof POKER_PAYOUTS>)
        .filter(key => POKER_PAYOUTS[key] > 0)
        .map(key => briefRow(key, `${POKER_PAYOUTS[key]}x`))
        .join('');
    }

    function draw(): void {
      const result = drawReplacements(hand, [...held], shoe);
      hand = result.hand;
      const ranked = rankPokerHand(hand);
      const returned = pokerReturn(ranked, casinoStake);
      showModal({
        eyebrow:'Five-card draw', title:ranked === 'nothing' ? 'Nothing' : ranked,
        body:cardRow(hand) + briefRow('Pays', `${POKER_PAYOUTS[ranked]}x`),
        buttons:[
          { label:'Deal again', onClick:openPoker },
          { label:'Back to the floor', secondary:true, onClick:openCasinoFloor },
        ],
      });
      casinoSettle(returned, ranked === 'nothing' ? 'No hand' : ranked);
    }

    // LEGAL: Tap a card to hold it. These were five "Hold" buttons stacked under a pay table, which ran
    // LEGAL: the Draw button off the bottom of the screen.
    function chooseHolds(): void {
      showModal({
        eyebrow:'Five-card draw', title:'Hold and Draw',
        body:`<p class="flavor">Tap the cards you want to keep, then draw.</p>`
          + `<div class="cards">${hand.map((card, index) => cardTile(card, { index, held:held.has(index) })).join('')}</div>`
          + `<details style="margin-top:14px;"><summary style="cursor:pointer;color:var(--text-faint);font-size:12px;">Pay table</summary>${payTable()}</details>`,
        buttons:[
          { label:held.size ? `Draw ${5 - held.size}` : 'Draw five', onClick:draw },
        ],
      });
      byId('modal-body').querySelectorAll<HTMLButtonElement>('[data-hold]').forEach(function(button){
        button.addEventListener('click', function(){
          const index = Number(button.dataset.hold);
          if(held.has(index)) held.delete(index); else held.add(index);
          chooseHolds();
        });
      });
    }
    chooseHolds();
  }

  // LEGAL: ================= RESPRAY =================
  // LEGAL: Paint is cosmetic and permanent until you change it again, so it is stored per car
  // LEGAL: rather than swapping the catalogue entry, which every other car of that model
  // LEGAL: shares.
  const RESPRAY_COLORS: Array<{ name: string; hex: string; price: number }> = [
    { name:'Factory Black', hex:'#1c1e24', price:900 },
    { name:'Oxblood', hex:'#5e1d22', price:1400 },
    { name:'Kettle Gold', hex:'#c9a227', price:3200 },
    { name:'Lakeridge Teal', hex:'#1f6f78', price:1800 },
    { name:'Bone White', hex:'#ddd8c8', price:1200 },
    { name:'Devlin Rust', hex:'#8a4b2a', price:1100 },
  ];

  function openResprayBay(): void {
    const car = getEquippedCar();
    if(!car){
      showRoomBrief('Paint Bay', 'Vega Custom', 'Compressors idling, masking tape on the bench, nothing on the ramp. Bring a car back.', '');
      return;
    }
    showModal({
      eyebrow:'Vega Custom Paint & Trim',
      title:`Respray the ${car.name}`,
      body:`<p class="flavor">Vega will shoot anything you can pay for and asks no questions about the plates.</p>`
        + briefRow('On the ramp', car.name)
        + briefRow('Current colour', state.carColors?.[car.id] ? 'Custom' : 'Factory')
        + briefRow('Your cash', formatMoney(state.cash)),
      buttons:[
        ...RESPRAY_COLORS.map(function(paint){
          return { label:`${paint.name} — ${formatMoney(paint.price)}`, onClick:function(){
            if(state.cash < paint.price){ log(`Vega wants ${formatMoney(paint.price)} up front.`); return; }
            state.cash -= paint.price;
            
            state.carColors[car.id] = paint.hex;
            log(`<i aria-hidden="true" class="ph-duotone ph-spray-bottle"></i> The ${car.name} comes out of the booth in ${paint.name}.`);
            refreshPlayerModel(); updateParkedCarMesh(); renderAll();
            openResprayBay();
          } };
        }),
        { label:'Leave it', secondary:true },
      ],
    });
  }

  // LEGAL: ---- The drive-in bay (section 0b) ----
  // LEGAL: The garage is a room with an open mouth, so putting the car away is a thing you
  // LEGAL: DO: line it up and drive in. Geometry lives in map/driveIn.ts and the walls come
  // LEGAL: from the 'bay' archetype, so the space you can drive into is the space that is
  // LEGAL: drawn. Read the garage's position live — the lot allocator chooses it.
  function garageBayRect(): Bay | null {
    const garage = serviceBuildings.find(s => s.id === 'playerGarage');
    if(!garage) return null;
    const shape = serviceBuildingSilhouette(garage);
    return garageBay({ x: garage.x, y: garage.y }, shape.w, shape.d);
  }

  // LEGAL: ---- Return to garage (stage 6) ----
  // LEGAL: A car left in the street sits there for GARAGE_RETURN_SECONDS, then goes home to
  // LEGAL: your garage in Devlin. Prevents stranding your only car across the map without
  // LEGAL: making parking meaningless. It now comes home INTO the bay, which is the same spot
  // LEGAL: driving it in yourself leaves it — there is one place a car lives, not two.
  function garageDoorPoint(): Point {
    const bay = garageBayRect();
    return bay ? bayParkSpot(bay) : carSpawnPositionForDistrict('devlin');
  }

  // LEGAL: Driving into the bay parks the car and puts you out beside it. Deliberately NOT a
  // LEGAL: prompt: the bay is only enterable by aiming a car at it, so having driven in there
  // LEGAL: is already an unambiguous statement of intent, and asking "park here? y/n" after
  // LEGAL: you have parked is the kind of confirmation that makes a game feel like a form.
  // LEGAL: Whether the car was already in the bay last frame. Getting into a car parked in the bay
  // LEGAL: starts inside it; only driving across the mouth parks it again.
  let carWasInBay = false;
  function tickDriveInGarage(): void {
    if(!state.inVehicle || state.currentInterior){ carWasInBay = !state.inVehicle ? false : carWasInBay; return; }
    const bay = garageBayRect();
    const inBay = !!bay && isCarInBay({ x: player.x, y: player.y }, bay);
    const arrived = shouldParkInBay(carWasInBay, inBay);
    carWasInBay = inBay;
    if(!bay || !arrived) return;

    const spot = bayParkSpot(bay);
    const stand = bayStandSpot(bay);
    state.inVehicle = false;
    player.vx = 0; player.vy = 0;
    player.x = stand.x; player.y = stand.y;
    player.facing = Math.PI/2;
    state.parkedCarPos.devlin = spot;
    // LEGAL: No return-to-garage clock: it is already in the garage.
    state.carParkedAt = null;
    refreshPlayerModel(); updateParkedCarMesh();
    log('<i aria-hidden="true" class="ph-duotone ph-garage"></i> You pull into the bay, kill the engine and get out. It stays here.');
    renderAll();
  }
  function tickGarageReturn(){
    if(state.inVehicle || !getEquippedCar()) return;
    if(!shouldReturnToGarage(state.carParkedAt, state.playSeconds)) return;
    state.carParkedAt = null;
    const door = garageDoorPoint();
    state.parkedCarPos.devlin = door;
    PARKING_DISTRICT_IDS.filter(id => id !== 'devlin').forEach(function(id){
      state.parkedCarPos[id] = carSpawnPositionForDistrict(id);
    });
    log('<i aria-hidden="true" class="ph-duotone ph-garage"></i> Your car has been taken back to the garage in Devlin.');
    updateParkedCarMesh();
  }

  function tickBrandCaveats(dt: number){
    // LEGAL: Used cars die on you mid-drive. Rolled per second of actual driving, so
    // LEGAL: parking the beater is a real way to avoid the problem.
    const car = getEquippedCar();
    if(car && state.inVehicle && !state.brokenCars.includes(car.id)){
      const chance = breakdownChancePerSec(car, brandById(car.brand), state.inVehicle);
      if(chance > 0 && Math.random() < chance * dt){ breakDownCar(car); }
    }

    // LEGAL: Rough blocks get turned over. Checked on an interval rather than per frame so
    // LEGAL: the odds mean something you can reason about.
    if(state.playSeconds >= nextRoughRaidCheckAt){
      nextRoughRaidCheckAt = state.playSeconds + ROUGH_RAID_CHECK_INTERVAL;
      rollRoughBlockRaid();
    }
  }

  function breakDownCar(car: Car){
    state.brokenCars.push(car.id);
    if(state.inVehicle) exitVehicle();
    log(`<i aria-hidden="true" class="ph-duotone ph-warning"></i> The ${car.name} dies in the street — steam, then nothing. Get it repaired at ${brandById(car.brand)?.name ?? 'the lot'}.`);
    // LEGAL: The log lives on another tab; while driving, the only sign used to be getting thrown out.
    showMapToast(`Your ${car.name} has broken down. Get it repaired at ${brandById(car.brand)?.name ?? 'the lot'}.`);
    pushCityNews(`A ${car.name} sits abandoned with its hood up. No problem, apparently.`, false);
    updateParkedCarMesh(); refreshPlayerModel(); renderAll();
  }

  function rollRoughBlockRaid(){
    const rough = ownedPropertyList().filter(p => brandById(p.brand)?.category === 'cheap');
    if(!rough.length) return;
    const target = rough[Math.floor(Math.random()*rough.length)];
    const onYourTurf = districtStatus(state.currentDistrict) === 'yours';
    const chance = roughRaidChance({ roughCount: rough.length, heat: state.heat, onYourTurf });
    if(Math.random() >= chance) return;

    const loss = Math.min(Math.floor(state.cash), roughRaidLoss(target.cost, Math.random()));
    state.cash = Math.max(0, state.cash - loss);
    state.heat = Math.min(100, state.heat + 3);
    log(`<i aria-hidden="true" class="ph-duotone ph-house-line"></i> A crew turned over ${target.name} — ${formatMoney(loss)} gone and the police are asking who owns it.`);
    pushCityNews(`BREAK-IN REPORTED AT ${target.name.toUpperCase()}. NEIGHBOURS SAY IT IS NOT THE FIRST.`, true);
    renderAll();
  }

  function repairCarFlow(car: Car){
    const cost = repairCost(car);
    if(state.cash < cost){ log(`Repairing the ${car.name} costs ${formatMoney(cost)} — you are short.`); return; }
    state.cash -= cost;
    state.brokenCars = state.brokenCars.filter(id => id !== car.id);
    log(`<i aria-hidden="true" class="ph-duotone ph-wrench"></i> They patch the ${car.name} back together for ${formatMoney(cost)}.`);
    updateParkedCarMesh(); refreshPlayerModel(); renderAll();
  }

  // LEGAL: ---- In-person branded shops (Phase 4) ----
  // LEGAL: Buying used to be one generic dealer that opened the phone. Now each brand is a
  // LEGAL: place you drive to, selling only its own stock, priced by who holds the block it
  // LEGAL: stands on, with haggling at the cash-only lots. Anything not marked online:true
  // LEGAL: can ONLY be bought here — that dealer-only stock is the reason to make the trip.

  // LEGAL: Haggling is per visit, not permanent: the won discount is remembered for this
  // LEGAL: brand until you leave, and a failed push locks that brand out until you return.
  const haggleDiscounts: Record<string, number> = {};
  const haggleSpent: Record<string, boolean> = {};

  function shopContext(brand: Brand){
    const svc = serviceBuildings.find(s => s.brandId === brand.id);
    const point = svc ? { x: svc.x, y: svc.y } : { x: player.x, y: player.y };
    const owner = ownerAt(point);
    return { svc, owner, blockName: blockNameAt(point), pricing: turfPricing(brand, owner) };
  }

  function shopItemPrice(brand: Brand, item: StockItem){
    const { pricing } = shopContext(brand);
    return askingPrice(stockItemCost(item), pricing.multiplier, haggleDiscounts[brand.id] ?? 0);
  }

  function openBrandShop(brandId: string){
    const brand = brandById(brandId);
    if(!brand){ log('This place is shuttered.'); return; }
    const { owner, blockName, pricing } = shopContext(brand);
    const gang = rivalGangForDistrict(brand.district);
    const stock = stockForBrand(brand, cars, properties);
    const discount = haggleDiscounts[brand.id] ?? 0;

    const turfTag = owner === 'rival'
      ? `<span style="color:${gang?.color ?? '#a8394a'};">${gang?.name ?? 'Rival'} hold ${blockName} — prices up ${Math.round((pricing.multiplier-1)*100)}%</span>`
      : (owner === 'yours'
        ? `<span style="color:var(--gold);">You hold ${blockName} — ${Math.round((1-pricing.multiplier)*100)}% off</span>`
        : `<span style="color:var(--text-faint);">${blockName} is contested — standard price</span>`);

    const body = `<p class="flavor">${brand.blurb}</p>`
      + `<p class="flavor">${pricing.note}</p>`
      + `<div style="margin-top:8px;">${turfTag}${discount ? ` · <span style="color:var(--gold);">haggled ${Math.round(discount*100)}% off</span>` : ''}</div>`
      + (brand.caveat ? `<p class="flavor" style="color:var(--text-faint);margin-top:8px;">${brand.caveat}</p>` : '')
      // LEGAL: Spell out what the caveat actually does mechanically — the downside should
      // LEGAL: never be a surprise you only discover after paying.
      + (caveatEffectLabel(brand) ? `<p class="flavor" style="color:var(--text-faint);">${caveatEffectLabel(brand)}</p>` : '');

    const buttons: ModalButton[] = stock.map(function(item){
      const owned = (item.kind === 'car' ? state.ownedCars : state.ownedProperties).includes(stockItemId(item));
      const price = shopItemPrice(brand, item);
      const dealerOnly = isDealerOnly(item);
      const name = stockItemName(item);
      // LEGAL: A broken-down used car is repaired at the lot that sold it to you.
      if(owned && item.kind === 'car' && state.brokenCars.includes(item.car.id)){
        const car = item.car;
        return { label:`Repair ${car.name} — ${formatMoney(repairCost(car))}`, onClick:function(){ repairCarFlow(car); } };
      }
      if(owned) return { label:`${name} — owned`, secondary:true };
      return {
        label:`${name} — ${formatMoney(price)}${dealerOnly ? ' (only here)' : ''}`,
        onClick: function(){ buyFromShop(brand, item); },
      };
    });

    if(pricing.canHaggle && !haggleSpent[brand.id] && !discount){
      buttons.push({ label:'Haggle', onClick:function(){ openHaggle(brand); } });
    }
    buttons.push({ label:'Leave', secondary:true });
    showModal({ eyebrow: owner === 'rival' ? 'Rival turf' : brand.name, title: brand.name, body, buttons });
  }

  function buyFromShop(brand: Brand, item: StockItem){
    const price = shopItemPrice(brand, item);
    if(state.cash < price){ log(`Not enough cash — that one is ${formatMoney(price)}.`); return; }
    state.cash -= price;
    if(item.kind === 'car'){
      state.ownedCars.push(item.car.id);
      // LEGAL: You bought it in person and are standing next to it, so it becomes the car
      // LEGAL: you are driving. Previously this only equipped when you owned nothing, so a
      // LEGAL: dealership purchase silently did not become "your car" until you opened the
      // LEGAL: phone and pressed DRIVE.
      state.equippedCar = item.car.id;
      if(item.car.id === 'bentley') triggerMilestone('bentley');
      log(`<i aria-hidden="true" class="ph-duotone ph-car"></i> You drive a ${item.car.name} off the lot at ${brand.name}. It's your ride now.`);
      updateParkedCarMesh(); refreshPlayerModel();
    } else {
      state.ownedProperties.push(item.property.id);
      state.propertyOwnedAt[item.property.id] = state.playSeconds;
      if(state.ownedProperties.length === 1) triggerMilestone('first_property');
      log(`🏢 You sign for ${item.property.name} at ${brand.name}.`);
    }
    renderAll();
  }

  function openHaggle(brand: Brand){
    const body = `<p>You let the number hang in the air a second too long.</p>`
      + `<p class="flavor">Push harder for a bigger cut, but if he walks you pay sticker for the rest of the visit. Your name on the street helps.</p>`;
    const buttons: ModalButton[] = haggleOffers.map(function(offer){
      return { label:`${offer.label} — ${Math.round(offer.discount*100)}% off`, onClick:function(){ runHaggle(brand, offer.push); } };
    });
    buttons.push({ label:'Never mind', secondary:true, onClick:function(){ openBrandShop(brand.id); } });
    showModal({ eyebrow:'Haggling', title:brand.name, body, buttons });
  }

  function runHaggle(brand: Brand, push: HagglePush){
    const result = resolveHaggle(haggleOfferFor(push), state.respect, Math.random());
    haggleSpent[brand.id] = true;
    if(result.won) haggleDiscounts[brand.id] = result.discount;
    log(result.message);
    openBrandShop(brand.id);
  }

  // LEGAL: Per-bank heist. The vault hotspot opens this "pick a target" board; the chosen
  // LEGAL: bank scales resolveHeist's payout (heistPayoutMult) and odds (security). One
  // LEGAL: global cooldown (nextHeistAt) still gates all jobs.
  let heistTargetBankId: string = DEFAULT_BANK_ID;
  function heistSecurityMod(security: string){ return security==='Hardened' ? -0.12 : (security==='Soft' ? 0.10 : 0); }
  function openHeistPlanning(){
    if(state.activeMissions.first_heist){ resolveMissionAtObjective('first_heist'); return; }
    if(!missionCompleted(missionSaveState(), 'first_heist') && state.respect >= PHASE2_MISSION_CONFIG.heistPrepRespectReq){ startMissionFromOffer('first_heist'); return; }
    if(state.playSeconds < state.nextHeistAt){ log('<i aria-hidden="true" class="ph-duotone ph-lock"></i> You just hit a vault — let the city cool off before the next job.'); return; }
    const body = `<p>You've been casing the city's banks. Which job is ready?</p>`
      + `<p class="flavor">A soft vault is the fat score but swings wide; a hardened one barely pays and rarely gives. Bring a crew and a fast car to tilt the odds.</p>`;
    const buttons: ModalButton[] = banks.map(function(bank){
      return { label:`${bank.name} — ${bank.security} vault`, onClick:function(){ heistTargetBankId = bank.id; playDialogue('bankheist','start'); } };
    });
    buttons.push({ label:'Not tonight', secondary:true });
    showModal({ eyebrow:'Casing the Banks', title:'Pick a target', body, buttons });
  }
  function openHeistSecurityDesk(): void {
    const car = getEquippedCar();
    const carBonus = effectiveHeistBonus(car, brandById(car?.brand));
    const crewBonus = Math.min(0.78, 0.30 + state.muscleCount * 0.04 + state.ratCount * 0.03 + carBonus + hubHeistBonus());
    const smashBonus = Math.min(0.7, 0.40 + state.ratCount * 0.03 + carBonus + hubHeistBonus());
    const rows = banks.map(function(bank): string {
      const securityModifier = heistSecurityMod(bank.security);
      const smashChance = Math.max(10, Math.round((smashBonus + securityModifier) * 100));
      const crewChance = Math.max(10, Math.round((crewBonus + securityModifier) * 100));
      return `<p><strong>${bank.name}</strong> — ${bank.security}: smash ${smashChance}% / crew ${crewChance}%; payout ${Math.round(bank.heistPayoutMult * 100)}% of the normal take.</p>`;
    }).join('');
    const firstHeistActive = Boolean(state.activeMissions.first_heist);
    showModal({
      eyebrow: 'Security Office',
      title: firstHeistActive ? 'Guard Schedule and Camera Log' : 'Casing Notes',
      body: `<p class="flavor">Someone left the night rota and three obsolete camera logs on the desk. It is enough to compare the jobs, not enough to make one safe.</p>${rows}`,
      buttons: [
        ...(firstHeistActive ? [{ label: 'Take the notes to the vault', onClick: function(): void { resolveMissionAtObjective('first_heist'); } }] : [{ label: 'Choose a bank job', onClick: openHeistPlanning }]),
        { label: 'Leave the desk', secondary: true },
      ],
    });
  }
  function openDockManifest(): void {
    const mission = state.activeMissions.stolen_shipment;
    if(mission?.stageId === 'travel'){
      showModal({ eyebrow:'Docks Dockmaster', title:'The Blank Manifest Slot', body:"<p class='flavor'>The pallet number has been rubbed out, but the carbon copy still shows a westbound truck, a rushed signature, and Deke's chop-shop stamp pressed through from the page beneath.</p><p>You can hand Bell the lead, or keep it in your pocket until he tells you what he wants.</p>", buttons:[
        { label:"Circle Deke's stamp and confront Bell", onClick:function(){ state.worldMemory.dockManifestEvidence = true; advanceMissionStage(missionSaveState(), 'stolen_shipment', 'evidence', state.playSeconds, mission.objective); log('<i aria-hidden="true" class="ph-duotone ph-file-magnifying-glass"></i> You pocket a copy of the manifest with Deke\'s stamp circled. Bell will have to be specific now.'); renderAll(); scheduleSave(); } },
        { label:'Leave the paper where it is', secondary:true },
      ]});
      return;
    }
    showRoomBrief('Manifest Board', 'Docks Dockmaster', 'Carbon copies, departure times, and enough crossed-out cargo codes to make a simple route look suspicious.', '');
  }
  function resolveHeist(approach: string): string {
    const car = getEquippedCar();
    // LEGAL: A bike gives half the cover of a car — nowhere to stash a crew or a haul.
    const carBonus = effectiveHeistBonus(car, brandById(car?.brand));
    // LEGAL: The target bank scales this job: security shifts the odds, heistPayoutMult
    // LEGAL: scales the take. Lakeside (Soft, 1.6x) is the fat easy score; First Windhaven
    // LEGAL: (Hardened, 0.7x) is the long shot that barely pays.
    const bank = banks.find(b=>b.id===heistTargetBankId) ?? banks[0];
    const secMod = heistSecurityMod(bank.security);
    let chance, reward, failLossPct, heatOnAttempt, heatOnFail, respectOnFail;
    if(approach==='smash'){
      chance = Math.min(0.7, 0.40 + state.ratCount*0.03 + carBonus + hubHeistBonus() + secMod);
      reward = Math.round(Math.max(500, rawTotalIncome()*18) * (0.8+Math.random()*0.5) * bank.heistPayoutMult);
      failLossPct = 0.15; heatOnAttempt = 10; heatOnFail = 15; respectOnFail = 3;
    } else {
      chance = Math.min(0.78, 0.30 + state.muscleCount*0.04 + state.ratCount*0.03 + carBonus + hubHeistBonus() + secMod);
      reward = Math.round(Math.max(1800, rawTotalIncome()*50) * (0.8+Math.random()*0.5) * bank.heistPayoutMult);
      failLossPct = 0.22; heatOnAttempt = 20; heatOnFail = 25; respectOnFail = 10;
    }
    chance = Math.max(0.1, chance);
    state.heat = Math.min(100, state.heat + heatOnAttempt);
    state.nextHeistAt = state.playSeconds + 420;
    const win = Math.random() < chance;
    if(win){
      state.cash += reward;
      const respectGain = Math.ceil(reward/400);
      state.respect += respectGain;
      triggerMilestone('heist');
      log(`<i aria-hidden="true" class="ph-duotone ph-money"></i> The job on ${bank.name} pays out ${formatMoney(reward)}.`);
      dialogues.bankheist.nodes.result.text = `Clean. You're out of ${bank.name} before the second patrol even swings back. <strong>${formatMoney(reward)}</strong> heavier, and word will get around.`;
      renderAll();
      return `${approach === 'crew' ? 'Crew heist' : 'Smash-and-grab'}: ${formatMoney(reward)} gained; respect +${respectGain}; heat +${heatOnAttempt}`;
    } else {
      const loss = Math.round(state.cash*failLossPct);
      state.cash = Math.max(0, state.cash-loss);
      state.heat = Math.min(100, state.heat+heatOnFail);
      state.respect = Math.max(0, state.respect-respectOnFail);
      log(`<i aria-hidden="true" class="ph-duotone ph-siren"></i> The job on ${bank.name} goes sideways. Down ${formatMoney(loss)}, heat's up.`);
      dialogues.bankheist.nodes.result.text = `It goes sideways fast. You get out of ${bank.name}, but not clean — <strong>${formatMoney(loss)}</strong> lost on the way, and there's heat on you now that wasn't there this morning.`;
      renderAll();
      return `${approach === 'crew' ? 'Crew heist' : 'Smash-and-grab'} failed: ${formatMoney(loss)} lost; respect -${respectOnFail}; heat +${heatOnAttempt + heatOnFail}`;
    }
  }

  // LEGAL: ================= LOCAL BUSINESSES (map-only, rob/extort) =================
  function robLocalBiz(biz: LocalBusiness){
    const car = getEquippedCar();
    // LEGAL: A bike gives half the cover of a car — nowhere to stash a crew or a haul.
    const carBonus = effectiveHeistBonus(car, brandById(car?.brand));
    let chance = 0.55 + state.ratCount*0.03 + carBonus - (state.heat>60 ? 0.15 : 0);
    chance = Math.max(0.15, Math.min(0.85, chance));
    biz.nextRobAt = state.playSeconds + 240;
    if(Math.random() < chance){
      const reward = Math.round(biz.robBase * (0.8+Math.random()*0.6));
      state.cash += reward; state.respect += 2; state.heat = Math.min(100, state.heat+8);
      log(`<i aria-hidden="true" class="ph-duotone ph-currency-dollar"></i> You hit the till at ${biz.name} for ${formatMoney(reward)}.`);
    } else {
      const loss = Math.round(biz.robBase * 0.3);
      state.cash = Math.max(0, state.cash-loss); state.respect = Math.max(0, state.respect-3); state.heat = Math.min(100, state.heat+15);
      log(`<i aria-hidden="true" class="ph-duotone ph-warning"></i> ${biz.owner} isn't an easy mark. You're out ${formatMoney(loss)} and it's hotter out there now.`);
    }
    renderAll();
  }
  function openTillPanel(biz: LocalBusiness){
    const canRob = state.playSeconds >= (biz.nextRobAt||0);
    const cooldownLeft = Math.max(0, Math.ceil((biz.nextRobAt||0) - state.playSeconds));
    const body = `<p>The register's right there. ${biz.owner} hasn't noticed you yet.</p>`;
    const buttons = [];
    buttons.push(canRob
      ? { label:'Rob the Till', onClick:function(){ robLocalBiz(biz); } }
      : { label:`Cooling Off (${cooldownLeft}s)`, secondary:true });
    buttons.push({ label:'Walk away', secondary:true });
    showModal({ eyebrow:'Cash Register', title:biz.name, body, buttons });
  }
  const EXTORT_TIER_NAME = ['', 'Protection', 'Heavy Cut', 'Total Control'];
  function openOwnerPanel(biz: LocalBusiness){
    const buttons: ModalButton[] = [];
    let body: string;
    if(!biz.extorted){
      body = `<p>${biz.owner} runs this place. Not part of your operation — yet.</p><p class="flavor">Lean on them for protection money. Push too hard, though, and resentment builds until they stop paying — or go to the cops.</p>`;
      buttons.push({ label:'Extort (needs 30 respect)', onClick:function(){
        if(state.respect<30){ log(`<i aria-hidden="true" class="ph-duotone ph-x-circle"></i> ${biz.owner} laughs you off. You don't have the reputation for this yet.`); renderAll(); return; }
        biz.extorted = true; biz.extortTier = 1; biz.resentment = 0;
        triggerMilestone('extortion');
        log(`<i aria-hidden="true" class="ph-duotone ph-handshake"></i> ${biz.owner} agrees to pay for protection.`);
        renderAll();
      }});
    } else {
      const tier = extortLevel(biz);
      const res = Math.round(biz.resentment ?? 0);
      body = `<p>${biz.owner} is on the hook — <strong>${EXTORT_TIER_NAME[tier]}</strong>.</p>`
        + `<p class="flavor">Paying +${(biz.extortIncome*extortMult(biz)).toFixed(1)}/s, +${(biz.extortHeat*extortMult(biz)).toFixed(2)} heat/s.</p>`
        + `<div class="control-track" title="Resentment"><div class="control-fill" style="width:${res}%; background:${res>66?'var(--red)':(res>33?'var(--gold)':'var(--green)')};"></div></div>`
        + `<p class="flavor">Resentment ${res}%. At 100% they stop paying and drop a dime on you.</p>`;
      if(tier < 3){
        buttons.push({ label:'Squeeze harder', onClick:function(){
          biz.extortTier = tier + 1; biz.resentment = Math.min(100, (biz.resentment ?? 0) + 30); state.heat = Math.min(100, state.heat + 5);
          log(`<i aria-hidden="true" class="ph-duotone ph-hand-fist"></i> You lean on ${biz.owner} for a bigger cut. They comply — resentfully.`);
          renderAll();
        }});
      }
      buttons.push({ label:'Ease off (calm them)', onClick:function(){
        biz.resentment = Math.max(0, (biz.resentment ?? 0) - 40);
        log(`<i aria-hidden="true" class="ph-duotone ph-handshake"></i> You dial it back with ${biz.owner}. The tension eases.`);
        renderAll();
      }});
      if(state.muscleCount > 0){
        buttons.push({ label:'Send muscle (keep them in line)', onClick:function(){
          biz.resentment = Math.max(0, (biz.resentment ?? 0) - 60); state.heat = Math.min(100, state.heat + 6);
          log(`<i aria-hidden="true" class="ph-duotone ph-boxing-glove"></i> Your crew pays ${biz.owner} a visit. They won't be any trouble for a while.`);
          renderAll();
        }});
      }
      buttons.push({ label:'Let it go', onClick:function(){ biz.extorted=false; biz.extortTier=0; biz.resentment=0; log(`<i aria-hidden="true" class="ph-duotone ph-handshake"></i> You cut ${biz.owner} loose.`); renderAll(); } });
    }
    buttons.push({ label:'Walk away', secondary:true });
    showModal({ eyebrow:'Business Owner', title:biz.owner, body, buttons });
  }

  // LEGAL: ================= ASSETS: CARS & PROPERTIES =================
  function renderAssetsPanel(){
    const carsWrap = byId('assets-cars');
    const propWrap = byId('assets-buildings');
    if(!carsWrap || !propWrap) return;

    // LEGAL: The phone is an online catalog, so it lists only online:true stock plus
    // LEGAL: anything you already own (you must still be able to sell a dealer-only car
    // LEGAL: you bought in person). Everything else is sold at the brand's shop.
    const listedCars = cars.filter(c => c.online || state.ownedCars.includes(c.id));
    const listedProperties = properties.filter(p => p.online || state.ownedProperties.includes(p.id));

    carsWrap.innerHTML = listedCars.map(c=>{
      const owned = state.ownedCars.includes(c.id);
      const equipped = state.equippedCar === c.id;
      const brand = brandById(c.brand);
      let btns;
      if(!owned){
        btns = `<div class="btn-row"><button class="mini-btn" ${state.cash>=c.cost?'':'disabled'} data-car-buy="${c.id}">BUY <span class="cost">${formatMoney(c.cost)}</span></button></div>`;
      } else {
        btns = `<div class="btn-row">
          ${equipped ? `<span class="managed-badge" style="flex:1;text-align:center;">[DRIVING]</span>` : `<button class="mini-btn" data-car-equip="${c.id}">DRIVE</button>`}
          <button class="mini-btn fire" data-car-sell="${c.id}">SELL <span class="cost">${formatMoney(Math.round(c.cost*0.55))}</span></button>
        </div>`;
      }
      return `<div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.car}</div>
          <div class="col-name">${c.name}</div>
          <div class="col-status">${owned && state.brokenCars.includes(c.id) ? 'BROKEN' : (equipped?'EQUIPPED':(owned?'GARAGED':'SHOP'))}</div>
        </div>
        <div class="data-expanded">
          ${brand ? `<div class="flavor-note" style="color:var(--gold);">${brand.name}${brand.caveat?` — <span style="color:var(--text-faint);">${brand.caveat}</span>`:''}</div>` : ''}
          <div class="flavor-note">+${Math.round((c.speedMult-1)*100)}% map speed · +${Math.round(c.heistBonus*100)}% heist odds${c.respectPerSec?` · +${c.respectPerSec}/s respect`:''}</div>
          ${btns}
        </div>
      </div>`;
    }).join('');

    propWrap.innerHTML = listedProperties.map(p=>{
      const owned = state.ownedProperties.includes(p.id);
      const brand = brandById(p.brand);
      const btns = owned
        ? `<div class="btn-row"><button class="mini-btn fire" data-prop-sell="${p.id}">SELL <span class="cost">${formatMoney(Math.round(p.cost*0.6))}</span></button></div>`
        : `<div class="btn-row"><button class="mini-btn" ${state.cash>=p.cost?'':'disabled'} data-prop-buy="${p.id}">BUY <span class="cost">${formatMoney(p.cost)}</span></button></div>`;
      return `<div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.bld2}</div>
          <div class="col-name">${p.name}</div>
          <div class="col-inc">+${(owned ? propertyIncomeFor(p) : p.incomePerSec).toFixed(1)}/s</div>
          <div class="col-status">${owned?'ACTIVE':'SALE'}</div>
        </div>
        <div class="data-expanded">
          ${brand ? `<div class="flavor-note" style="color:var(--gold);">${brand.name}${brand.caveat?` — <span style="color:var(--text-faint);">${brand.caveat}</span>`:''}</div>` : ''}
          <div class="flavor-note">${owned ? `Owned — earning ${propertyIncomeFor(p).toFixed(1)}/s, no crew needed${appreciationMult(brandById(p.brand), propertyHeldSeconds(p.id)) > 1 ? ` (appreciated from ${p.incomePerSec}/s)` : ''}` : `Passive rental income: ${p.incomePerSec}/s, no crew needed`}</div>
          ${btns}
        </div>
      </div>`;
    }).join('');

  }

  // LEGAL: Company badge for the market UI. Shows the designed logo from /public, or a
  // LEGAL: two-letter lettermark for companies without artwork (or if the image fails to load).
  function stockBadgeHtml(s: typeof stockMarket[number], size: number){
    const letters = s.symbol.substring(0, 2);
    const inner = s.logo
      ? `<img src="/${s.logo}" alt="${s.name}" width="${size}" height="${size}" style="width:100%;height:100%;object-fit:cover;display:block;" data-fallback-text="${letters}">`
      : `<span role="img" aria-label="${s.name}">${letters}</span>`;
    return `<div style="width:${size}px;height:${size}px;border-radius:8px;overflow:hidden;background:var(--bg-row);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--gold);font-family:var(--font-mono);font-weight:700;font-size:${Math.round(size*0.34)}px;flex-shrink:0;">`
      + `${inner}</div>`;
  }

  function renderBankPanel(){
    const wrap = byId('bank-panel');
    if(!wrap) return;
    
    if(state.financeView === 'vault') {
      // LEGAL: Multi-bank accounts. One row per bank; the selected one expands to show its
      // LEGAL: deposit/withdraw form (reusing the deposit-input/withdraw-input ids, which
      // LEGAL: stay unique because only the selected bank renders a form). Robbing a bank
      // LEGAL: is in person only — no heist button lives on the phone.
      if(!banks.some(b=>b.id===state.selectedBank)) state.selectedBank = DEFAULT_BANK_ID;
      const bankRows = banks.map(function(bank){
        const bal = bankBalance(bank.id);
        const isSel = bank.id === state.selectedBank;
        const form = isSel ? `
            <div class="data-expanded">
              <div class="flavor-note">${bank.blurb}</div>
              <div class="bank-balances-row" style="display:flex; gap:20px; margin:8px 0 12px; font-family:var(--font-mono); font-size:13px; flex-wrap:wrap;">
                <div><span style="color:var(--text-faint);">HERE:</span> <strong style="color:var(--green);">${formatMoney(bal)}</strong></div>
                <div><span style="color:var(--text-faint);">INTEREST:</span> <strong>${bank.rateLabel}</strong></div>
                <div><span style="color:var(--text-faint);">VAULT:</span> <strong>${bank.security}</strong></div>
              </div>
              <div style="display:flex; gap:24px; flex-wrap:wrap; border-top:1px dashed var(--line); padding-top:14px;">
                <div class="bank-form" style="flex:1; min-width:200px; border-top:none; padding-top:0; margin-top:0;">
                  <label class="bank-form-label">Deposit</label>
                  <div class="bank-input-row">
                    <input type="number" id="deposit-input" class="bank-input" min="0" step="1" placeholder="Amount">
                    <button class="mini-btn" id="deposit-go">DEPOSIT</button>
                  </div>
                  <div class="btn-row">
                    <button class="mini-btn quick" data-deposit-quick="0.25">25%</button>
                    <button class="mini-btn quick" data-deposit-quick="0.5">50%</button>
                    <button class="mini-btn quick" data-deposit-quick="1">MAX</button>
                  </div>
                </div>
                <div class="bank-form" style="flex:1; min-width:200px; border-top:none; padding-top:0; margin-top:0;">
                  <label class="bank-form-label">Withdraw</label>
                  <div class="bank-input-row">
                    <input type="number" id="withdraw-input" class="bank-input" min="0" step="1" placeholder="Amount">
                    <button class="mini-btn fire" id="withdraw-go">WITHDRAW</button>
                  </div>
                  <div class="btn-row">
                    <button class="mini-btn quick" data-withdraw-quick="0.25">25%</button>
                    <button class="mini-btn quick" data-withdraw-quick="0.5">50%</button>
                    <button class="mini-btn quick" data-withdraw-quick="1">MAX</button>
                  </div>
                </div>
              </div>
            </div>` : '';
        return `<div class="data-row">
            <div class="data-main" data-bank-select="${bank.id}" style="cursor:pointer;">
              <div class="col-id"><i aria-hidden="true" class="ph-duotone ph-bank"></i></div>
              <div class="col-name">${bank.name}</div>
              <div class="col-inc">${formatMoney(bal)}</div>
              <div class="col-status">${isSel ? 'SELECTED' : 'TAP TO OPEN'}</div>
            </div>${form}
          </div>`;
      }).join('');
      wrap.innerHTML = `
        <div class="data-table">
          <div class="data-row">
            <div class="data-main">
              <div class="col-id"><i aria-hidden="true" class="ph-duotone ph-vault"></i></div>
              <div class="col-name">Accounts</div>
              <div class="col-status">RAID-SAFE</div>
            </div>
            <div class="data-expanded">
              <div class="flavor-note">Banked cash is safe from raids and earns interest; cash on hand is what buys things. Spread it around — a bank you bank at can still be robbed by rivals, and you can rob theirs in person.</div>
              <div class="bank-balances-row" style="display:flex; gap:24px; margin-top:8px; font-family:var(--font-mono); font-size:14px; flex-wrap:wrap;">
                <div><span style="color:var(--text-faint);">TOTAL BANKED:</span> <strong id="bank-banked-value" style="color:var(--green); font-size:16px;">${formatMoney(bankedTotal())}</strong></div>
                <div><span style="color:var(--text-faint);">ON HAND:</span> <strong id="bank-onhand-value" style="color:var(--text); font-size:16px;">${formatMoney(state.cash)}</strong></div>
              </div>
            </div>
          </div>
          ${bankRows}
        </div>
      `;
    } else if(state.financeView === 'lcn-home') {
      let totalPortfolio = 0;
      stockMarket.forEach(s => {
        const pos = state.portfolio[s.symbol];
        if(pos && pos.shares > 0) totalPortfolio += pos.shares * state.marketPrices[s.symbol];
      });
      wrap.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--line); padding-bottom:10px;">
          <h3 style="font-size:20px; color:var(--text); margin:0;">RCN TERMINAL</h3>
          <button class="mini-btn fire" id="go-vault">DISCONNECT</button>
        </div>
        
        <div class="data-table" style="grid-template-columns: repeat(auto-fit, minmax(min(340px,100%),1fr));">
          <div class="data-row">
            <div class="data-main">
              <div class="col-id">${ICONS.store}</div>
              <div class="col-name">Holdings</div>
              <div class="col-stat">PORTFOLIO: ${formatMoney(totalPortfolio)}</div>
              <div class="col-stat">LIQUID: ${formatMoney(state.cash)}</div>
              <div class="col-status">ACTIVE</div>
            </div>
            <div class="data-expanded">
              <div class="flavor-note">Active positions in the market.</div>
              ${stockMarket.filter(s => state.portfolio[s.symbol]?.shares > 0).map(s => {
                const pos = state.portfolio[s.symbol];
                const val = pos.shares * state.marketPrices[s.symbol];
                return `<div class="row" style="font-family:'Courier New', monospace; font-size:12px; margin-top:4px;"><span>${s.symbol} (${pos.shares} sh)</span><span>${formatMoney(val)}</span></div>`;
              }).join('') || '<div class="flavor-note">No active positions.</div>'}
            </div>
          </div>
          
          <div class="data-row">
            <div class="data-main">
              <div class="col-id"><i aria-hidden="true" class="ph-duotone ph-newspaper"></i> ${ICONS.music}</div>
              <div class="col-name">Market News</div>
              <div class="col-status">LIVE</div>
            </div>
            <div class="data-expanded" id="market-news-card">
              ${(state.currentNews || []).map(n => `<div class="flavor-note" style="margin-top:4px;">>> ${n}</div>`).join('')}
            </div>
          </div>
        </div>
        
        <h4 style="margin-top:20px; border-bottom:1px solid var(--line); padding-bottom:5px; color:var(--text); font-family:var(--font-display); font-size:14px;">[TRADABLE ASSETS]</h4>
        <div class="rcn-stock-list" style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
          ${stockMarket.map(s => {
            const price = state.marketPrices[s.symbol] || s.basePrice;
            const history = state.marketHistory[s.symbol] || [];
            const prevPrice = history.length > 1 ? history[history.length - 2] : price;
            const pct = prevPrice ? ((price - prevPrice) / prevPrice * 100) : 0;
            const color = pct >= 0 ? 'var(--green)' : 'var(--red)';
            const sign = pct >= 0 ? '+' : '';
            return `<div class="rcn-stock-row lcn-stock-btn" data-sym="${s.symbol}" style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--bg-panel); border:1px solid var(--line); border-radius:6px; transition: all 0.15s; cursor:pointer;">
              <div style="display:flex; align-items:center; gap:16px;">
                ${stockBadgeHtml(s, 44)}
                <div>
                  <div style="font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text);">${s.symbol}</div>
                  <div style="font-family:var(--font-body); font-size:12px; color:var(--text-dim);">${s.name}</div>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-family:var(--font-mono); font-size:15px; font-weight:700; color:var(--text);" id="lcn-home-price-${s.symbol}">$${price.toFixed(2)}</div>
                <div style="font-family:var(--font-mono); font-size:12px; font-weight:700; color:${color};" id="lcn-home-pct-${s.symbol}">${sign}${pct.toFixed(2)}%</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      `;
    } else if(state.financeView === 'lcn-stock' && state.activeStock) {
      const s = stockMarket.find(x => x.symbol === state.activeStock);
      if(!s) { state.financeView = 'lcn-home'; renderBankPanel(); return; }
      
      const price = state.marketPrices[s.symbol];
      const pos = state.portfolio[s.symbol] || { shares: 0, avgCost: 0 };
      const val = pos.shares * price;
      const pl = val - (pos.shares * pos.avgCost);
      const plColor = pl >= 0 ? 'var(--green)' : 'var(--red)';
      
      wrap.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--line); padding-bottom:10px;">
          <h3 style="font-size:20px; color:var(--text); margin:0; display:flex; align-items:center; gap:12px;">
            <button class="mini-btn" id="go-lcn-home" style="padding: 6px 12px; font-size:12px;"><i aria-hidden="true" class="ph-duotone ph-arrow-left"></i> BACK</button>
            ${stockBadgeHtml(s, 36)}
            <span>${s.symbol} — ${s.name}</span>
          </h3>
        </div>
        <div class="flavor-note" style="margin-bottom:15px;">${s.fullDesc}</div>
        <div style="margin:20px 0;">
          <canvas id="stock-chart" width="400" height="150" style="width:100%; max-width:100%; height:150px; background:#07090c; border:1px solid var(--line); box-sizing:border-box; image-rendering:pixelated; border-radius:6px;"></canvas>
        </div>
        <div class="data-table" style="grid-template-columns: repeat(auto-fit, minmax(min(340px,100%),1fr));">
          <!-- Card 1: Position Summary -->
          <div class="data-row">
            <div class="data-main">
              <div class="col-id">${ICONS.person}</div>
              <div class="col-name">Your Position</div>
              <div class="col-status">${pos.shares > 0 ? 'HOLDING' : 'EMPTY'}</div>
            </div>
            <div class="data-expanded">
              <div class="flavor-note">Your equity exposure in this security.</div>
              <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:13px; border-bottom:1px solid var(--line); padding-bottom:4px;">
                  <span style="color:var(--text-faint);">Shares Owned</span>
                  <span style="color:var(--text); font-weight:700;">${pos.shares}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:13px; border-bottom:1px solid var(--line); padding-bottom:4px;">
                  <span style="color:var(--text-faint);">Average Cost</span>
                  <span style="color:var(--text); font-weight:700;">$${pos.avgCost.toFixed(2)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:13px; border-bottom:1px solid var(--line); padding-bottom:4px;">
                  <span style="color:var(--text-faint);">Current Value</span>
                  <span style="color:var(--text); font-weight:700;">${formatMoney(val)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:13px; border-bottom:1px solid var(--line); padding-bottom:4px;">
                  <span style="color:var(--text-faint);">Total Return</span>
                  <span style="color:${plColor}; font-weight:700;">${pl >= 0 ? '+' : ''}${formatMoney(pl)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 2: Market Order -->
          <div class="data-row">
            <div class="data-main">
              <div class="col-id">${ICONS.store}</div>
              <div class="col-name">Market Order</div>
              <div class="col-status" id="price-${s.symbol}">$${price.toFixed(2)}</div>
            </div>
            <div class="data-expanded">
              <div class="flavor-note">Execute instant buy or sell trades at current market rate.</div>
              <div class="bank-form" style="border-top:none; padding-top:0; margin-top:0; gap:8px;">
                <div class="btn-row">
                  <button class="mini-btn quick" data-trade="buy-10" data-sym="${s.symbol}">BUY 10</button>
                  <button class="mini-btn quick" data-trade="buy-100" data-sym="${s.symbol}">BUY 100</button>
                  <button class="mini-btn quick" data-trade="buy-max" data-sym="${s.symbol}">BUY MAX</button>
                </div>
                <div class="btn-row">
                  <button class="mini-btn quick fire" data-trade="sell-10" data-sym="${s.symbol}">SELL 10</button>
                  <button class="mini-btn quick fire" data-trade="sell-100" data-sym="${s.symbol}">SELL 100</button>
                  <button class="mini-btn quick fire" data-trade="sell-max" data-sym="${s.symbol}">SELL MAX</button>
                </div>
                <div class="bank-input-row" style="margin-top:12px;">
                  <input type="number" id="trade-input-${s.symbol}" class="bank-input" min="1" step="1" placeholder="Enter share amount">
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      drawStockChart(s.symbol);
    }
  }

  function drawStockChart(symbol: string) {
    const canvas = byId('stock-chart') as HTMLCanvasElement;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    const history = state.marketHistory[symbol] || [];
    if(history.length < 2) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const min = Math.min(...history) * 0.95;
    const max = Math.max(...history) * 1.05;
    const range = max - min;
    const stepX = canvas.width / (history.length - 1);
    
    ctx.beginPath();
    history.forEach((val, i) => {
      const x = i * stepX;
      const y = canvas.height - ((val - min) / range * canvas.height);
      if(i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const rcnNewsPool = [
    "MUDSTER RECALLS 40,000 VEHICLES OVER EXPLODING CUPHOLDERS.",
    "MEGASAVER CEO SEEN YACHT-SHOPPING AFTER MASS LAYOFFS.",
    "BEANJUICE LAUNCHES $14 'DECONSTRUCTED' AMERICANO.",
    "ELECTRON AUTOPILOT DRIVES SEDAN INTO RENTPORT HARBOR.",
    "QUICKCART WAREHOUSE WORKERS STRIKE; DRONES DEPLOYED.",
    "CLIPSTREAM BANS ASMR VIDEOS AFTER PUBLIC OUTCRY.",
    "POMELLO LOSES PROTOTYPE AT SAN PLASTICA BAR.",
    "HEARTLAND GLOBAL POSTS RECORD PROFITS AMID RENTPORT EVICTION CRISIS.",
    "FLAMINGO BAY MAYOR INDICTED ON FRAUD CHARGES.",
    "TECH STARTUP IN SAN PLASTICA VALUED AT $4 BILLION BEFORE RELEASING PRODUCT."
  ];

  function tickMarket(){
    stockMarket.forEach(s => {
      if(!state.marketPrices[s.symbol]) state.marketPrices[s.symbol] = s.basePrice;
      const p = state.marketPrices[s.symbol];
      const drift = (s.basePrice - p) * 0.02; 
      const shock = p * s.vol * (Math.random() - 0.5);
      const newPrice = Math.max(1, p + drift + shock);
      state.marketPrices[s.symbol] = newPrice;
      
      if(!state.marketHistory[s.symbol]) state.marketHistory[s.symbol] = [];
      state.marketHistory[s.symbol].push(newPrice);
      if(state.marketHistory[s.symbol].length > 30) state.marketHistory[s.symbol].shift();
    });
    
    // LEGAL: Dynamic Market News
    if(!state.currentNews) state.currentNews = [];
    if(!state.newsQueue) state.newsQueue = [];
    if(state.playSeconds >= (state.nextNewsAt || 0)) {
      if(state.newsQueue.length === 0) {
        state.newsQueue = [...rcnNewsPool].sort(() => Math.random() - 0.5);
      }
      const next = state.newsQueue.pop();
      if(next) state.currentNews.unshift(next);
      if(state.currentNews.length > 3) state.currentNews.pop();
      state.nextNewsAt = state.playSeconds + 120;
      
      const newsCard = byIdOrNull('market-news-card');
      if(newsCard) {
        newsCard.innerHTML = state.currentNews.map(n => `<div class="flavor-note" style="margin-top:4px;">>> ${n}</div>`).join('');
      }
    }
    
    // LEGAL: Live in-place price ticks only while the phone's Stocks screen is showing.
    if (deviceOpen()) {
      if(state.financeView === 'lcn-home') {
        stockMarket.forEach(s => {
          const price = state.marketPrices[s.symbol];
          const history = state.marketHistory[s.symbol];
          const prevPrice = history.length > 1 ? history[history.length - 2] : price;
          const pct = ((price - prevPrice) / prevPrice * 100);
          
          const priceEl = document.getElementById(`lcn-home-price-${s.symbol}`);
          const pctEl = document.getElementById(`lcn-home-pct-${s.symbol}`);
          if(priceEl) priceEl.textContent = `$${price.toFixed(2)}`;
          if(pctEl) {
            pctEl.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
            pctEl.style.color = pct >= 0 ? '#4caf50' : '#f44336';
          }
        });
      } else if(state.financeView === 'lcn-stock' && state.activeStock) {
        const s = stockMarket.find(x => x.symbol === state.activeStock);
        if(s) {
          const priceEl = document.getElementById(`price-${s.symbol}`);
          if(priceEl) priceEl.textContent = `$${state.marketPrices[s.symbol].toFixed(2)}`;
          drawStockChart(s.symbol);
        }
      }
    }
  }

  function tradeStock(symbol: string, amount: number, isBuy: boolean) {
    if(amount <= 0 || isNaN(amount)) return;
    const price = state.marketPrices[symbol];
    if(!price) return;
    const pos = state.portfolio[symbol];
    if(!pos) return;

    if(isBuy) {
      const cost = price * amount;
      if(state.cash < cost) return;
      state.cash -= cost;
      const totalCost = (pos.shares * pos.avgCost) + cost;
      pos.shares += amount;
      pos.avgCost = totalCost / pos.shares;
    } else {
      if(pos.shares < amount) amount = pos.shares;
      if(amount <= 0) return;
      const revenue = price * amount;
      state.cash += revenue;
      pos.shares -= amount;
      if(pos.shares === 0) pos.avgCost = 0;
    }
    renderAll();
  }

  // LEGAL: ================= THE TRADE: LAB & CORNERS =================
  function upgradeLab(){
    const cost = labCost();
    if(state.cash < cost) return;
    state.cash -= cost; state.productLevel += 1;
    log(`<i aria-hidden="true" class="ph-duotone ph-briefcase"></i> The Lab steps up to level ${state.productLevel}. More product, more room to store it.`);
    renderAll();
  }
  function assignDealer(corner: Corner){
    if(corner.dealer || corner.busted) return;
    if(state.cash < corner.dealerCost) return;
    state.cash -= corner.dealerCost; corner.dealer = true;
    spawnDealerArrival(corner);
    log(`<i aria-hidden="true" class="ph-duotone ph-briefcase"></i> A dealer pulls up and sets up shop at ${corner.name}.`);
    renderAll();
  }
  function fireDealer(corner: Corner){
    if(!corner.dealer) return;
    corner.dealer = false;
    walkDealerAway(corner);
    log(`<i aria-hidden="true" class="ph-duotone ph-briefcase"></i> You pull the dealer off ${corner.name}.`);
    renderAll();
  }
  function openCornerPanel(corner: Corner){
    const d = districts.find(x=>x.id===corner.district)!;
    let body = `<p>Tier ${corner.tier} corner in ${d.name}. ${corner.dealer ? `Staffed — moving ${corner.rate}/s when there's product to sell.` : 'No one working it right now.'}</p>`;
    if(corner.busted){
      const left = Math.max(0, Math.ceil(corner.bustCooldownAt - state.playSeconds));
      body += `<p class="flavor">Busted. Cooling off for ${left}s before anyone will work it again.</p>`;
    }
    const buttons: ModalButton[] = [];
    if(corner.busted){
      buttons.push({ label:'Too hot right now', secondary:true });
    } else if(corner.dealer){
      buttons.push({ label:'Pull the dealer', onClick:function(){ fireDealer(corner); } });
    } else {
      buttons.push({ label:`Post a dealer (${formatMoney(corner.dealerCost)})`, cost:corner.dealerCost, onClick:function(){ assignDealer(corner); } });
    }
    buttons.push({ label:'Walk away', secondary:true });
    showModal({ eyebrow:'The Trade', title:corner.name, body, buttons });
  }

  // LEGAL: ================= POLITICS: FUNCTIONS =================
  function influenceCost(){ return Math.ceil(300 * Math.pow(1.35, state.influenceBuys)); }
  function buyInfluence(){
    const cost = influenceCost();
    if(state.cash < cost) return;
    state.cash -= cost; state.influence += 8; state.influenceBuys += 1;
    log(`<i aria-hidden="true" class="ph-duotone ph-bank"></i> Another envelope, another favor owed. Influence is at ${state.influence}.`);
    renderAll();
  }
  function favorCost(p: Politician){ return Math.ceil(200 * Math.pow(1.25, Math.floor(p.favor/15))); }
  function bribePolitician(id: string){
    const p = politicians.find(x=>x.id===id);
    if(!p) return;
    const cost = favorCost(p);
    if(state.cash < cost || p.favor>=100) return;
    state.cash -= cost; p.favor = Math.min(100, p.favor+15);
    log(`<i aria-hidden="true" class="ph-duotone ph-envelope-simple"></i> ${p.name} takes the envelope without much of a fight. Favor: ${p.favor}.`);
    if(p.favor>=60 && !p.pocketed){
      p.pocketed = true;
      showModal({
        eyebrow:'City Hall', title:`${p.name.toUpperCase()} IS IN YOUR POCKET`,
        body:`<p>${p.flavor}</p><p class="flavor">${p.desc}</p>`,
        buttons:[{label:'Good to know'}]
      });
    }
    renderAll();
  }
  function openCityHallDesk(): void {
    const buttons: ModalButton[] = [];
    const influencePrice = influenceCost();
    const investorAttention = state.worldMemory.cityHallAttention === true;
    if(investorAttention && state.cash >= PHASE2_MISSION_CONFIG.investorCityHallSettlementCost){
      buttons.push({ label:`Settle the investor complaint (${formatMoney(PHASE2_MISSION_CONFIG.investorCityHallSettlementCost)}, heat -${PHASE2_MISSION_CONFIG.investorCityHallSettlementHeatReduction})`, onClick:function(){
        state.cash -= PHASE2_MISSION_CONFIG.investorCityHallSettlementCost;
        state.heat = Math.max(0, state.heat - PHASE2_MISSION_CONFIG.investorCityHallSettlementHeatReduction);
        state.worldMemory.cityHallAttention = false;
        state.worldMemory.investorComplaintSettled = true;
        log('<i aria-hidden="true" class="ph-duotone ph-file-check"></i> The investor complaint disappears into a clerk\'s drawer: cash spent, heat down, City Hall attention cleared.');
        renderAll(); scheduleSave();
      } });
    }
    if(state.cash >= influencePrice){
      buttons.push({ label:`Fund influence (${formatMoney(influencePrice)})`, onClick:function(){ buyInfluence(); } });
    }
    if(state.worldMemory.politicalFavorsUnlocked && state.cash >= PHASE2_MISSION_CONFIG.politicalFavorCost && state.influence >= 20){
      buttons.push({ label:`Call in a favor (${formatMoney(PHASE2_MISSION_CONFIG.politicalFavorCost)}, 20 influence)`, onClick:function(){
        state.cash -= PHASE2_MISSION_CONFIG.politicalFavorCost;
        state.influence -= 20;
        state.heat = Math.max(0, state.heat - PHASE2_MISSION_CONFIG.politicalFavorHeatReduction);
        state.investigation = Math.max(0, state.investigation - 8);
        log('<i aria-hidden="true" class="ph-duotone ph-courthouse"></i> A political favor moves through City Hall: heat -18; investigation -8.');
        renderAll(); scheduleSave();
      } });
    }
    politicians.filter(function(p){ return p.favor < 100 && state.cash >= favorCost(p); }).forEach(function(p){
      buttons.push({ label:`Meet ${p.name} (${formatMoney(favorCost(p))})`, onClick:function(){ bribePolitician(p.id); scheduleSave(); } });
    });
    if(state.influence >= 500 && state.playSeconds >= state.nextCampaignAt && !state.electedOffice && !state.campaignActive){
      buttons.push({ label:'Discuss your campaign', onClick:function(){ playDialogue('campaign', 'start'); } });
    }
    buttons.push({ label:'Leave City Hall', secondary:true });
    showModal({
      eyebrow:'City Hall Annex',
      title:"Clerk's Window",
      body:`<p class='flavor'>The clerk knows exactly which doors are open and which envelopes make them move. You have ${Math.round(state.influence)} influence, ${formatMoney(state.cash)} in cash, and ${state.worldMemory.politicalFavorsUnlocked ? 'Political Favors are available.' : 'Political Favors are still locked.'}</p>${investorAttention ? '<p class="flavor">A silent investor has filed a complaint. The clerk will make it disappear for the right filing fee.</p>' : ''}`,
      buttons,
    });
  }
  function openChopShopArmory(): void {
    const cost = gunPackCost();
    const buttons: ModalButton[] = state.cash >= cost
      ? [{ label:`Buy ${GUN_PACK} guns (${formatMoney(cost)})`, onClick:function(){
          state.cash -= cost;
          state.guns += GUN_PACK;
          log(`<i aria-hidden="true" class="ph-duotone ph-crosshair"></i> A crate of ${GUN_PACK} comes off the docks. Guns +${GUN_PACK}; total ${state.guns}.`);
          renderAll(); scheduleSave();
        } }]
      : [];
    buttons.push({ label:'Leave the armory', secondary:true });
    showModal({
      eyebrow:'West Side Chop Shop',
      title:'The Armory',
      body:`<p class='flavor'>Deke keeps the unregistered crates behind a welding curtain. You have ${state.guns} guns. They make pushes and wars stronger, but fighting can still cost people and equipment.</p><p>Current crate price: <strong>${formatMoney(cost)}</strong>.</p>`,
      buttons,
    });
  }
  function openMarigoldWarTable(): void {
    const availableAt = Math.max(0, Math.ceil(state.nextWarAt - state.playSeconds));
    const strength = gangStrength();
    const rival = rivalStrength();
    const odds = Math.round(Math.min(0.85, Math.max(0.15, strength / (strength + rival))) * 100);
    const ready = availableAt === 0;
    showModal({
      eyebrow:'Marigold Lounge',
      title:'The Back-Room Table',
      body: ready
        ? `<p class='flavor'>Maps, burner phones, and a glass nobody is drinking from cover the table. Your strength is ${strength.toFixed(1)} against West Side's ${rival.toFixed(1)} — roughly ${odds}% odds before the first decision. You have ${state.guns} guns.</p><p>Targeted hits need 4 guns and $1,800. A full assault needs 8 guns and $4,000. Both can cost territory, crew, guns, heat, and case pressure.</p>`
        : `<p class='flavor'>The room is quiet after the last operation. Your people need ${availableAt} more seconds before another move. Current strength: ${strength.toFixed(1)} to ${rival.toFixed(1)}.</p>`,
      buttons: ready ? [
        { label:'Set the operation in motion', onClick:function(){
          dialogues.gangwar.nodes.start.text = `Dice's people aren't handing over West Side. You're holding ${state.guns} guns; your strength reads ${strength.toFixed(1)} to their ${rival.toFixed(1)} — call it ${odds}% odds tonight. The question is how loud you're willing to be.`;
          playDialogue('gangwar', 'start');
        } },
        { label:'Leave the table', secondary:true },
      ] : [{ label:'Leave the table', secondary:true }],
    });
  }
  function runCampaign(style: string){
    let cost = style === 'grassroots' ? 250000 : 1500000;
    if(state.cash < cost){
      dialogues.campaign.nodes.result.text = "You can't even front the filing fees on this one. Come back when the cash is there.";
      renderAll(); return;
    }
    state.cash -= cost;
    state.campaignActive = true;
    state.campaignStyle = style;
    state.campaignEndAt = state.playSeconds + 180;
    dialogues.campaign.nodes.result.text = "The paperwork is filed. Now you just have to survive the scrutiny for three minutes. Expect your heat generation to more than double as the media digs into your 'business' history.";
    log('<i aria-hidden="true" class="ph-duotone ph-megaphone"></i> The campaign has begun. Heat generation is doubled while the press investigates you.');
    renderAll();
  }

  // LEGAL: ================= GANG: FUNCTIONS =================
  function inductRecruit(id: string, style: string){
    const g = gangRecruits.find(x=>x.id===id);
    if(!g) return;
    if(g.inducted) return;
    if(state.respect < g.reqRespect || state.cash < g.cost){
      dialogues[g.dialogueKey].nodes.result.text = "It doesn't happen. Not enough weight behind your name yet — come back when you're further along.";
      renderAll(); return;
    }
    state.cash -= g.cost;
    g.inducted = true;
    triggerMilestone('crew_induct');
    let extra = '';
    if(style==='test'){
      // LEGAL: Proving yourself costs a little more up front but earns real respect.
      const testCost = Math.round(g.cost*0.15);
      if(state.cash >= testCost){ state.cash -= testCost; state.respect += 10; extra = ' You made them prove it, and they did. Word gets around — +10 respect.'; }
      else { extra = " You wanted to test them, but couldn't cover it. They're in anyway."; }
    } else {
      state.respect += 4;
    }
    dialogues[g.dialogueKey].nodes.result.text = `${g.name} is in. ${g.bonus}${extra}`;
    log(`<i aria-hidden="true" class="ph-duotone ph-handshake"></i> ${g.name} joins the crew for real. ${g.bonus}`);
    renderAll();
  }
  function warReqGuns(style: string){ return style==='assault' ? 8 : 4; }
  function warCashCost(style: string){ return style==='assault' ? 4000 : 1800; }
  // LEGAL: A real operation now: it needs arms and a war chest, spends and loses guns,
  // LEGAL: takes casualties (crew, inducted members, corner dealers), and brings the
  // LEGAL: police down on you (heat + the federal case, and possibly a sweep). `payoff`
  // LEGAL: is the mid-war money-sink decision resolved in the dialogue.
  function resolveWar(style: string, payoff: boolean){
    const ws = districts.find(d=>d.id==='westside')!;
    const reqGuns = warReqGuns(style), cashCost = warCashCost(style);
    if(state.guns < reqGuns){
      dialogues.gangwar.nodes.result.text = `You can't put ${reqGuns} guns on the street tonight — you're holding ${state.guns}. Arm up first.`;
      renderAll(); return;
    }
    if(state.cash < cashCost){
      dialogues.gangwar.nodes.result.text = "You don't have the cash to back this up tonight. Come back when you do.";
      renderAll(); return;
    }
    state.cash -= cashCost;
    state.nextWarAt = state.playSeconds + 300;

    // LEGAL: The money-sink situation — pay off the patrol, or eat the police attention.
    let heatAdd = style==='assault' ? 22 : 10;
    let invAdd = style==='assault' ? 12 : 6;
    let payNote = '';
    if(payoff){
      const bribe = Math.min(state.cash, style==='assault' ? 2500 : 1200);
      state.cash -= bribe;
      heatAdd = Math.round(heatAdd*0.4); invAdd = Math.round(invAdd*0.4);
      payNote = ` You grease the responding patrol (${formatMoney(bribe)}) and the report comes out thin.`;
    } else {
      heatAdd = Math.round(heatAdd*1.4); invAdd = Math.round(invAdd*1.6);
      payNote = ` A patrol catches the muzzle flashes — nobody paid them to forget it.`;
    }
    state.heat = Math.min(100, state.heat + heatAdd);
    state.investigation = Math.min(100, state.investigation + invAdd);

    const gs = gangStrength(), rs = rivalStrength();
    const chance = Math.min(0.85, Math.max(0.15, gs/(gs+rs)));
    const win = Math.random() < chance;
    const swing = style==='assault' ? 30 : 15;

    // LEGAL: Casualties — guns are spent/lost either way; a loss also costs bodies.
    let gunsLost = (style==='assault' ? 4 : 2) + Math.floor(Math.random()*(style==='assault'?4:3));
    const casualties: string[] = [];
    let muscleLost = 0; let memberLost: string | null = null; let dealerLost = 0;
    if(win){
      ws.control = Math.min(100, ws.control + swing);
      state.respect += style==='assault' ? 40 : 20;
      applyTempMult('all', PHASE2_MISSION_CONFIG.turfWarVictoryIncomeMultiplier, PHASE2_MISSION_CONFIG.turfWarVictoryIncomeSeconds);
      state.worldMemory.westsideWarResult = 'won';
      state.worldMemory.westsideWarVictoryControl = swing;
      if(state.muscleCount>0 && Math.random() < (style==='assault'?0.5:0.3)) muscleLost = 1;
    } else {
      ws.control = Math.max(0, ws.control - Math.round(swing/2));
      state.respect = Math.max(0, state.respect - 15);
      state.worldMemory.westsideWarResult = 'lost';
      gunsLost += 2;
      if(state.muscleCount>0) muscleLost = 1 + (Math.random()<0.4?1:0);
      const inducted = gangRecruits.filter(g=>g.inducted);
      if(inducted.length && Math.random() < 0.35){ const g = inducted[Math.floor(Math.random()*inducted.length)]; g.inducted = false; memberLost = g.name; }
      const wsCorners = corners.filter(c=>c.district==='westside' && c.dealer && !c.busted);
      const hit = Math.min(wsCorners.length, 1 + (Math.random()<0.5?1:0));
      for(let i=0;i<hit;i++){ const c=wsCorners[i]; c.busted=true; c.dealer=false; c.bustCooldownAt=state.playSeconds+180; dealerLost++; }
    }
    if(muscleLost>0){ state.muscleCount = Math.max(0, state.muscleCount - muscleLost); casualties.push(`${muscleLost} of your crew`); }
    if(memberLost) casualties.push(memberLost);
    if(dealerLost>0) casualties.push(`${dealerLost} corner dealer${dealerLost>1?'s':''}`);
    state.guns = Math.max(0, state.guns - gunsLost);
    const casNote = casualties.length ? ` You lost ${casualties.join(', ')}, and ${gunsLost} guns.` : ` ${gunsLost} guns spent in the exchange.`;

    if(win){
      dialogues.gangwar.nodes.result.text = `It goes your way. West Side control climbs to ${Math.round(ws.control)}%. Dice's people fall back — for now.${payNote}${casNote}`;
      log(`<i aria-hidden="true" class="ph-duotone ph-swords"></i> You take ground on the West Side — control ${Math.round(ws.control)}%.${casualties.length?' It cost you '+casualties.join(', ')+'.':''}`);
      dialogues.gangwar.nodes.result.text = `Victory confirmed: West Side control is now ${Math.round(ws.control)}% permanently, and all operation income is +12% for two minutes.${payNote}${casNote}`;
      pushCityNews(`GANGLAND SHOOTOUT ROCKS THE WEST SIDE OVERNIGHT`, true);
    } else {
      dialogues.gangwar.nodes.result.text = `It doesn't go your way. You pull back before it gets worse — West Side control drops to ${Math.round(ws.control)}%.${payNote}${casNote}`;
      log(`<i aria-hidden="true" class="ph-duotone ph-swords"></i> The war on the West Side turns against you — control ${Math.round(ws.control)}%.${casualties.length?' You lost '+casualties.join(', ')+'.':''}`);
      dialogues.gangwar.nodes.result.text = `Loss confirmed: West Side control is now ${Math.round(ws.control)}% permanently. The ${formatMoney(cashCost)} operation cost is gone.${payNote}${casNote}`;
      pushCityNews(`POLICE FLOOD THE WEST SIDE AFTER A DEADLY GANG CLASH`, true);
      if(!payoff && state.heat > 60 && !crackdownActive()) state.crackdownUntil = state.playSeconds + 75;
    }
    renderAll();
  }

  function renderDistrictBar(){
    // LEGAL: byId THROWS when an element is missing, by design. The Travel Nodes strip has
    // LEGAL: been removed from the map tab, so this has to ask for it the optional way or the
    // LEGAL: whole game fails to boot.
    const wrap = byIdOrNull('district-bar');
    if(!wrap) return;
    wrap.innerHTML = districts.map(d=>{
      const here = state.currentDistrict===d.id;
      return `<button class="district-btn ${here?'active':''}" data-travel="${d.id}" ${here?'disabled':''}><span class="pin-dot"></span>${here?'You\'re in ':''}${d.name}</button>`;
    }).join('');
  }
  function renderLegend(){
    const wrap = byId('map-legend');
    if(!wrap) return;
    wrap.innerHTML = `
      <span class="legend-item"><span class="legend-swatch" style="background:#3e6b78;border:1px solid #6fa6b5;"></span>Your Ventures</span>
      <span class="legend-item"><span class="legend-swatch" style="background:#7c3540;border:1px solid #b85c6b;"></span>Street Ventures</span>
      <span class="legend-item"><span class="legend-swatch" style="background:#7a5f1a;border:1px solid #c9a227;"></span>Bank / Garage / City Hall</span>
      <span class="legend-item"><span class="legend-swatch" style="border:1px dashed #7a6fb0;"></span>Local Business</span>
      <span class="legend-item"><span class="legend-swatch pin" style="background:#d4a017;"></span>Corner (staffed)</span>
      <span class="legend-item"><span class="legend-swatch pin" style="background:transparent;border:2px solid #a8394a;"></span>Corner (open)</span>
      <span class="legend-item"><span class="legend-swatch" style="background:#d4a017;border-radius:50%;"></span>Person</span>
      <span class="legend-item"><span class="legend-swatch" style="background:#e8e6de;border-radius:50%;border:2px solid #d4a017;"></span>You</span>
      <span class="legend-item">Walk into any building's door to go inside</span>
    `;
  }


  function renderTerritoryPanel(){
    const wrap = byId('territory-panel');
    if(!wrap) return;
    const bonusText: Record<string, string> = { devlin:'+15% income to every venture when yours', westside:'-25% corner heat, +15% corner income when yours', hub:'+50% bank interest, +10% heist odds when yours' };
    wrap.innerHTML = districts.map(d=>{
      const status = districtStatus(d.id);
      const canPush = state.playSeconds>=d.nextPushAt && state.respect>=pushCost(d);
      return `<div class="data-row">
        <div class="data-main">
          <div class="col-id">${d.homeTurf?ICONS.person:ICONS.badge}</div>
          <div class="col-name">${d.name}</div>
          <div class="col-status" data-control-label="${d.id}">${Math.round(d.control)}% — ${status==='yours'?'YOURS':(status==='rival'?'RIVAL':'CONTESTED')}</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">${bonusText[d.id]}</div>
          <div class="drift-breakdown">
            ${(()=>{ const drift = districtDriftBreakdown(d); return `
              <div class="drift-breakdown-row"><span>Muscle presence</span><strong>+${drift.musclePresence.toFixed(2)}/s</strong></div>
              <div class="drift-breakdown-row"><span>Corner presence</span><strong>+${drift.cornerPresence.toFixed(2)}/s</strong></div>
              <div class="drift-breakdown-row"><span>Venture presence</span><strong>+${drift.venturePresence.toFixed(2)}/s</strong></div>
              <div class="drift-breakdown-row"><span>Rival pressure</span><strong>-${drift.rivalPressure.toFixed(2)}/s</strong></div>
              <div class="drift-breakdown-row"><span>Current drift</span><strong>${drift.netDrift>=0?'+':''}${drift.netDrift.toFixed(2)}/s</strong></div>
            `; })()}
          </div>
          <div class="control-track"><div class="control-fill" data-control-bar="${d.id}" style="width:${Math.round(d.control)}%"></div></div>
          <div class="btn-row"><button class="mini-btn" ${canPush?'':'disabled'} data-push="${d.id}">PUSH <span class="cost">${pushCost(d)} resp</span></button></div>
        </div>
      </div>`;
    }).join('');
  }

  function renderPoliticsPanel(){
    const wrap = byId('politics-panel');
    if(!wrap) return;
    const canOffice = state.influence >= 500;
    const canCampaign = canOffice && state.playSeconds >= state.nextCampaignAt && !state.electedOffice;
    wrap.innerHTML = `
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.gov}</div>
          <div class="col-name">Influence</div>
          <div class="col-stat">INFLUENCE: ${Math.round(state.influence)}</div>
          <div class="col-status">ACTIVE</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Cash spent building pull downtown. Enough of it opens the door to running for office yourself.</div>
          <div class="btn-row"><button class="mini-btn" ${state.cash>=influenceCost()?'':'disabled'} id="buy-influence">FUND <span class="cost">${formatMoney(influenceCost())}</span></button></div>
        </div>
      </div>
      ${state.worldMemory.politicalFavorsUnlocked ? `
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.phone}</div>
          <div class="col-name">Political Favors</div>
          <div class="col-stat">COST: ${formatMoney(PHASE2_MISSION_CONFIG.politicalFavorCost)} + 20 influence</div>
          <div class="col-status">UNLOCKED</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Spend cash and influence to make paperwork move, soften heat, and slow the case.</div>
          <div class="btn-row"><button class="mini-btn" ${(state.cash>=PHASE2_MISSION_CONFIG.politicalFavorCost && state.influence>=20)?'':'disabled'} id="call-political-favor">CALL IN FAVOR</button></div>
        </div>
      </div>` : ''}
      ${politicians.map(p=>`
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.person}</div>
          <div class="col-name">${p.name}</div>
          <div class="col-stat">FAVOR: ${p.favor}/100</div>
          <div class="col-status">${p.favor>=60?'IN POCKET':'NEUTRAL'}</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">${p.role} · ${p.desc}</div>
          <div class="control-track"><div class="control-fill" style="width:${p.favor}%"></div></div>
          <div class="btn-row"><button class="mini-btn" ${(state.cash>=favorCost(p) && p.favor<100)?'':'disabled'} data-bribe="${p.id}">BRIBE <span class="cost">${formatMoney(favorCost(p))}</span></button></div>
        </div>
      </div>`).join('')}
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.badge}</div>
          <div class="col-name">City Councilman</div>
          <div class="col-status">${state.electedOffice?'HELD':(state.campaignActive?'RUNNING':(canOffice?'READY':'LOCKED'))}</div>
        </div>
        <div class="data-expanded">
          ${state.campaignActive ? `
            <div class="flavor-note" style="color:var(--text)">[WARNING] Campaign in progress. Heat generation is doubled. Keep operations quiet.</div>
            <div class="control-track"><div class="control-fill" style="width:${Math.round(100 - (state.campaignEndAt - state.playSeconds)/1.8)}%"></div></div>
            <div class="btn-row"><span class="lock-note">${Math.max(0, Math.ceil(state.campaignEndAt - state.playSeconds))}s REMAINING</span></div>
          ` : `
            <div class="flavor-note">${state.electedOffice ? 'You hold the seat. It comes with its own quiet income now.' : (canOffice ? 'You have the influence to be taken seriously. This is a one-shot swing — win or lose, it costs real money.' : `Needs 500 influence (currently ${Math.round(state.influence)}).`)}</div>
            <div class="btn-row"><button class="mini-btn" ${canCampaign?'':'disabled'} id="launch-campaign">${state.electedOffice ? 'SEAT HELD' : 'LAUNCH CAMPAIGN'}</button></div>
          `}
        </div>
      </div>
    `;
  }

  function renderGangPanel(){
    const wrap = byId('gang-panel');
    if(!wrap) return;
    const gs = gangStrength(), rs = rivalStrength();
    const canWar = state.playSeconds >= state.nextWarAt;
    wrap.innerHTML = `
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.fist}</div>
          <div class="col-name">Gang Strength</div>
          <div class="col-stat">YOURS: ${gs.toFixed(1)}</div>
          <div class="col-stat">RIVAL: ${rs.toFixed(1)}</div>
          <div class="col-status">INFO</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Muscle headcount plus every inducted member and your firepower, weighed against West Side's defense.</div>
        </div>
      </div>
      <div class="data-row">
        <div class="data-main">
          <div class="col-id"><i aria-hidden="true" class="ph-duotone ph-crosshair"></i> ${ICONS.badge}</div>
          <div class="col-name">The Armory</div>
          <div class="col-stat">GUNS: ${state.guns}</div>
          <div class="col-status">BLACK MARKET</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Crates off a West Side freighter, no serial numbers. Guns arm your crew for pushes and wars — and they get spent and lost in the fighting.</div>
          <div class="btn-row"><button class="mini-btn" ${state.cash>=gunPackCost()?'':'disabled'} id="buy-guns">BUY ${GUN_PACK} GUNS <span class="cost">${formatMoney(gunPackCost())}</span></button></div>
        </div>
      </div>
      ${gangRecruits.map(g=>{
        const eligible = state.respect>=g.reqRespect;
        return `<div class="data-row">
          <div class="data-main">
            <div class="col-id">${ICONS.person}</div>
            <div class="col-name">${g.name}</div>
            <div class="col-status">${g.inducted?'INDUCTED':(eligible?'READY':'LOCKED')}</div>
          </div>
          <div class="data-expanded">
            <div class="flavor-note">${g.trait} · ${g.bonus}</div>
            <div class="btn-row">
              ${g.inducted
                ? `<button class="mini-btn manager" data-checkin="${g.id}">CHECK IN</button>`
                : eligible
                  ? `<button class="mini-btn" ${state.cash>=g.cost?'':'disabled'} data-initiate="${g.id}">INITIATE <span class="cost">${formatMoney(g.cost)}</span></button>`
                  : `<div class="lock-note">Needs ${g.reqRespect} respect (currently ${Math.round(state.respect)})</div>`
              }
            </div>
          </div>
        </div>`;
      }).join('')}
      <div class="data-row">
        <div class="data-main">
          <div class="col-id"><i aria-hidden="true" class="ph-duotone ph-swords"></i> ${ICONS.fist}</div>
          <div class="col-name">West Side War</div>
          <div class="col-stat">CONTROL: ${Math.round(districts.find(d=>d.id==='westside')!.control)}%</div>
          <div class="col-status">${canWar?(state.guns>=4?'READY':'UNARMED'):'COOLING'}</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Declare on Dice's people directly — a bigger, faster swing on control than pushing alone, but it burns cash and guns and gets people hurt. Needs at least 4 guns (8 for a full assault).${canWar?'':` Regrouping — ${Math.max(0,Math.ceil(state.nextWarAt-state.playSeconds))}s.`}</div>
          <div class="btn-row"><button class="mini-btn" ${canWar?'':'disabled'} id="declare-war">DECLARE WAR</button></div>
        </div>
      </div>
    `;
  }

  // LEGAL: ================= RENDER: VENTURE CARDS =================
  function renderCard(b: Business){
    const unlocked = isUnlocked(b);
    const el = document.createElement('div');
    el.className = `data-row ${unlocked ? '' : 'locked'}`;
    let main = `<div class="data-main">
      <div class="col-id">${b.icon}</div>
      <div class="col-name">${b.name}<div class="col-name-sub">${b.category==='legit'?'Corporate Front':'Illicit Operation'}</div></div>`;
      
    if(!unlocked){
      main += `<div class="col-lvl">-</div><div class="col-inc">-</div><div class="col-crew">-</div><div class="col-status">${unlockRequirement(b)}</div></div>`;
      el.innerHTML = main;
      return el;
    }

    if(!b.researched){
      main += `<div class="col-lvl">-</div><div class="col-inc">-</div><div class="col-crew">-</div><div class="col-status">UNRESEARCHED</div></div>`;
      const rc = researchCostFor(b);
      const exp = `<div class="data-expanded">
        <div class="flavor-note">${b.flavor}</div>
        <div class="btn-row"><button class="mini-btn" ${state.cash>=rc?'':'disabled'} data-action="research" data-id="${b.id}">RESEARCH <span class="cost">${formatMoney(rc)}</span></button></div>
      </div>`;
      el.innerHTML = main + exp;
      return el;
    }

    const cost = costForLevel(b);
    const eff = efficiency(b);
    const need = crewNeeded(b);
    const crewCost = crewCostFor(b);
    const crewFull = b.crew >= need+2;
    const globalFull = crewUsedGlobal() >= crewCapGlobal();
    const canHireCrew = !b.manager && !crewFull && !globalFull && state.cash >= crewCost;
    const canFireCrew = !b.manager && b.crew>0;

    let heatStr = b.heatPerLevel ? `<div class="col-heat">+${(b.heatPerLevel*heatMult()).toFixed(2)} HEAT</div>` : `<div class="col-eff ${eff<0.7 && !b.manager?'eff-low':''}">EFF: ${Math.round(eff*100)}%</div>`;
    
    main += `
      <div class="col-lvl">${b.level}</div>
      <div class="col-inc">${incomeFor(b).toFixed(1)}/s</div>
      <div class="col-crew">${b.crew}/${need+2}</div>
      ${heatStr}
      <div class="col-status">${b.manager ? 'MANAGED' : (b.level===0 ? 'CLOSED' : 'ACTIVE')}</div>
    </div>`;

    let exp = `<div class="data-expanded">
      <div class="flavor-note">${b.flavor}</div>
      <div class="btn-row">
        <button class="mini-btn" ${state.cash>=cost?'':'disabled'} data-action="expand" data-id="${b.id}">${b.level===0?'OPEN':'EXPAND'} <span class="cost">${formatMoney(cost)}</span></button>
      </div>`;

    if(b.manager){
      exp += `<div class="lock-note" style="margin-top:6px;">Manager ${b.managerName} installed. Operations optimal.</div>`;
    } else {
      exp += `<div class="btn-row" style="margin-top:6px;">
        <button class="mini-btn" ${canHireCrew?'':'disabled'} data-action="hirecrew" data-id="${b.id}">ASSIGN CREW <span class="cost">${formatMoney(crewCost)}</span></button>
        <button class="mini-btn fire" ${canFireCrew?'':'disabled'} data-action="firecrew" data-id="${b.id}">FIRE CREW <span class="cost">RND 50%</span></button>
      </div>`;
      if(b.level >= b.managerLevelReq){
        const mc = managerCostFor(b);
        exp += `<div class="btn-row" style="margin-top:6px;">
          <button class="mini-btn manager" ${state.cash>=mc?'':'disabled'} data-action="hiremanager" data-id="${b.id}">HIRE MGR <span class="cost">${formatMoney(mc)}</span></button>
        </div>`;
      }
    }
    exp += `</div>`;
    
    el.innerHTML = main + exp;
    return el;
  }

  function handleCardAction(e: Event){
    const btn = (e.target as HTMLElement).closest('[data-action]');
    if(!btn) return;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    const b = businesses.find(x=>x.id===id);
    if(!b) return;
    if(action==='research'){
      const rc = researchCostFor(b);
      if(state.cash<rc) return;
      state.cash -= rc; b.researched = true;
      log(`<i aria-hidden="true" class="ph-duotone ph-flask"></i> You research ${b.name}. It's ready to open.`);
    } else if(action==='expand'){
      const cost = costForLevel(b);
      if(state.cash<cost) return;
      state.cash -= cost; b.level += 1;
      if(b.category==='street') state.respect += 1;
      if(b.level===1) {
        log(`<i aria-hidden="true" class="ph-duotone ph-briefcase"></i> ${b.name} opens its doors.`);
        if(b.id==='restaurant') triggerMilestone('chaat_house');
        if(b.id==='syndicate_logistics') triggerMilestone('docks');
      }
    } else if(action==='hirecrew'){
      const cc = crewCostFor(b);
      if(state.cash<cc || crewUsedGlobal()>=crewCapGlobal()) return;
      state.cash -= cc; b.crew += 1;
    } else if(action==='firecrew'){
      if(b.crew<=0) return;
      const refund = Math.ceil(crewCostFor({...b, crew:b.crew-1}) * 0.5);
      b.crew -= 1; state.cash += refund;
    } else if(action==='hiremanager'){
      const mc = managerCostFor(b);
      if(state.cash<mc) return;
      state.cash -= mc; b.manager = true; b.crew = 0;
      log(`<i aria-hidden="true" class="ph-duotone ph-user-tie"></i> ${b.managerName} now runs ${b.name} full-time.`);
    }
    renderAll();
  }

  function handleAssetAction(e: Event){
    const btn = (e.target as HTMLElement).closest('[data-car-buy],[data-car-equip],[data-car-sell],[data-prop-buy],[data-prop-sell]');
    if(!btn) return;
    if(btn.hasAttribute('data-car-buy')){
      const id = btn.getAttribute('data-car-buy')!; const c = cars.find(x=>x.id===id);
      if(!c || state.cash<c.cost) return;
      // LEGAL: Dealer-only stock is never orderable from the phone, even if a stale row
      // LEGAL: survives a re-render — the shop is the only place that can sell it.
      if(!c.online){ log(`${c.name} is not sold online. You have to go to the lot.`); return; }
      state.cash -= c.cost; state.ownedCars.push(id);
      if(!state.equippedCar) state.equippedCar = id;
      if(id === 'bentley') triggerMilestone('bentley');
      log(`<i aria-hidden="true" class="ph-duotone ph-car"></i> You pick up a ${c.name}.`); updateParkedCarMesh(); refreshPlayerModel(); renderAll();
    } else if(btn.hasAttribute('data-car-equip')){
      state.equippedCar = btn.getAttribute('data-car-equip'); updateParkedCarMesh(); refreshPlayerModel(); renderAll();
    } else if(btn.hasAttribute('data-car-sell')){
      const id = btn.getAttribute('data-car-sell')!; const c = cars.find(x=>x.id===id);
      if(!c) return;
      state.ownedCars = state.ownedCars.filter(x=>x!==id);
      state.brokenCars = state.brokenCars.filter(x=>x!==id);
      if(state.equippedCar===id) state.equippedCar = state.ownedCars[0] || null;
      state.cash += Math.round(c.cost*0.55);
      log(`<i aria-hidden="true" class="ph-duotone ph-car"></i> You sell the ${c.name}.`); updateParkedCarMesh(); refreshPlayerModel(); renderAll();
    } else if(btn.hasAttribute('data-prop-buy')){
      const id = btn.getAttribute('data-prop-buy')!; const p = properties.find(x=>x.id===id);
      if(!p || state.cash<p.cost) return;
      if(!p.online){ log(`${p.name} is not listed online. You have to see the broker.`); return; }
      state.cash -= p.cost; state.ownedProperties.push(id);
      state.propertyOwnedAt[id] = state.playSeconds;
      if(state.ownedProperties.length === 1) triggerMilestone('first_property');
      log(`🏢 You close on ${p.name}.`); renderAll();
    } else if(btn.hasAttribute('data-prop-sell')){
      const id = btn.getAttribute('data-prop-sell')!; const p = properties.find(x=>x.id===id);
      if(!p) return;
      state.ownedProperties = state.ownedProperties.filter(x=>x!==id);
      // LEGAL: Selling resets the appreciation clock — buying back does not restore it.
      delete state.propertyOwnedAt[id];
      state.cash += Math.round(p.cost*0.6);
      log(`🏢 You sell ${p.name}.`); renderAll();
    }
  }

  function handleStreetAction(e: Event){
    const btn = (e.target as HTMLElement).closest('button');
    if(!btn) return;
    if(btn.id === 'upgrade-lab'){ upgradeLab(); }
    else if(btn.id === 'hire-muscle'){ if(state.cash<muscleCost()) return; state.cash -= muscleCost(); state.muscleCount += 1; renderAll(); }
    else if(btn.id === 'toggle-bribe'){ state.bribeOn = !state.bribeOn; log(state.bribeOn ? '👮 You put the beat cops on the payroll.' : '👮 You cut the cops off. Heat will build faster.'); renderAll(); }
    else if(btn.id === 'toggle-laylow'){ state.layingLow = !state.layingLow; log(state.layingLow ? '🤫 Word goes out — everything goes quiet. Income drops while the heat bleeds off.' : '💼 Back to business. The operation spins up again.'); renderAll(); }
    else if(btn.id === 'retain-counsel'){ const cost = counselCost(); if(state.investigation<=5 || state.cash<cost) return; state.cash -= cost; state.investigation = Math.max(0, state.investigation-45); log(`⚖️ Your lawyer goes to work. The case cools — for now. (${formatMoney(cost)})`); renderAll(); }
    else if(btn.id === 'hire-rat'){ if(state.cash<ratsCashCost() || state.respect<ratsRespectCost()) return; state.cash -= ratsCashCost(); state.respect -= ratsRespectCost(); state.ratCount += 1; renderAll(); }
    else if(btn.id === 'buy-territory'){ if(state.respect<territoryCost()) return; state.respect -= territoryCost(); state.territoryTier += 1; log(`🗺️ New blocks fall under your control. Crew capacity is now ${crewCapGlobal()}.`); renderAll(); }
    else if(btn.id === 'buy-negotiate'){ if(state.respect<negotiateCost()) return; state.respect -= negotiateCost(); state.negotiateTier += 1; log(`<i aria-hidden="true" class="ph-duotone ph-handshake"></i> You've got leverage now. Everyone's prices just got friendlier.`); renderAll(); }
  }

  function handleBankAction(e: Event){
    const target = e.target as HTMLElement;
    const quickDeposit = target.closest('[data-deposit-quick]');
    if(quickDeposit){
      const inp = byId('deposit-input') as HTMLInputElement;
      if(inp) inp.value = String(Math.floor(state.cash * Number(quickDeposit.getAttribute('data-deposit-quick'))));
      return;
    }
    const quickWithdraw = target.closest('[data-withdraw-quick]');
    if(quickWithdraw){
      const inp = byId('withdraw-input') as HTMLInputElement;
      if(inp) inp.value = String(Math.floor(bankBalance(state.selectedBank) * Number(quickWithdraw.getAttribute('data-withdraw-quick'))));
      return;
    }
    const bankSelect = target.closest('[data-bank-select]');
    if(bankSelect){
      state.selectedBank = bankSelect.getAttribute('data-bank-select')!;
      renderBankPanel();
      return;
    }
    const stockRow = target.closest('.lcn-stock-btn');
    if(stockRow) {
      state.financeView = 'lcn-stock';
      state.activeStock = stockRow.getAttribute('data-sym');
      renderBankPanel();
      return;
    }
    const tradeBtn = target.closest('[data-trade]');
    if(tradeBtn) {
      const action = tradeBtn.getAttribute('data-trade')!;
      const sym = tradeBtn.getAttribute('data-sym')!;
      const price = state.marketPrices[sym];
      const pos = state.portfolio[sym];
      if(!price || !pos) return;
      
      let amount = 0;
      let isBuy = action.startsWith('buy');
      const suffix = action.split('-')[1];

      if(suffix === '10') amount = 10;
      else if(suffix === '100') amount = 100;
      else if(suffix === 'max') {
        if(isBuy) amount = Math.floor(state.cash / price);
        else amount = pos.shares;
      }
      else if(suffix === 'custom') {
        const inp = document.getElementById(`trade-input-${sym}`) as HTMLInputElement;
        amount = parseInt(inp?.value, 10);
      }
      
      tradeStock(sym, amount, isBuy);
      return;
    }
    const btn = target.closest('button');
    if(!btn) return;
    if(btn.id === 'go-lcn'){
      state.financeView = 'lcn-home'; renderBankPanel();
    } else if(btn.id === 'go-vault'){
      state.financeView = 'vault'; renderBankPanel();
    } else if(btn.id === 'go-lcn-home'){
      state.financeView = 'lcn-home'; renderBankPanel();
    } else if(btn.id === 'deposit-go'){
      const inp = byId('deposit-input') as HTMLInputElement;
      depositAmount(state.selectedBank, inp?.value);
    } else if(btn.id === 'withdraw-go'){
      const inp = byId('withdraw-input') as HTMLInputElement;
      withdrawAmount(state.selectedBank, inp?.value);
    }
  }
  function handleBankKeydown(e: KeyboardEvent){
    if((e as KeyboardEvent).key !== 'Enter') return;
    const target = e.target as HTMLInputElement;
    if(target.id === 'deposit-input') depositAmount(state.selectedBank, target.value);
    else if(target.id === 'withdraw-input') withdrawAmount(state.selectedBank, target.value);
  }



  function handleTerritoryAction(e: Event){
    const btn = (e.target as HTMLElement).closest('[data-push]');
    if(!btn) return;
    pushDistrict(btn.getAttribute('data-push')!);
  }

  function handlePoliticsAction(e: Event){
    const target = e.target as HTMLElement;
    const bribeBtn = target.closest('[data-bribe]');
    if(bribeBtn){ bribePolitician(bribeBtn.getAttribute('data-bribe')!); return; }
    const btn = target.closest('button');
    if(!btn) return;
    if(btn.id === 'buy-influence'){ buyInfluence(); }
    else if(btn.id === 'call-political-favor'){
      if(state.cash < PHASE2_MISSION_CONFIG.politicalFavorCost || state.influence < 20) return;
      state.cash -= PHASE2_MISSION_CONFIG.politicalFavorCost;
      state.influence -= 20;
      state.heat = Math.max(0, state.heat - PHASE2_MISSION_CONFIG.politicalFavorHeatReduction);
      state.investigation = Math.max(0, state.investigation - 8);
      log('<i aria-hidden="true" class="ph-duotone ph-courthouse"></i> A political favor moves through City Hall. Heat drops and the case file thins.');
      renderAll();
    }
    else if(btn.id === 'launch-campaign'){
      if(state.electedOffice || state.campaignActive) return;
      if(!(state.influence >= 500 && state.playSeconds >= state.nextCampaignAt)) return;
      playDialogue('campaign', 'start');
    }
  }

  function handleGangAction(e: Event){
    const target = e.target as HTMLElement;
    const checkinBtn = target.closest('[data-checkin]');
    if(checkinBtn){ const g = gangRecruits.find(x=>x.id===checkinBtn.getAttribute('data-checkin')); if(g) playDialogue(g.dialogueKey, 'checkin'); return; }
    const initiateBtn = target.closest('[data-initiate]');
    if(initiateBtn){ const g = gangRecruits.find(x=>x.id===initiateBtn.getAttribute('data-initiate')); if(g) playDialogue(g.dialogueKey, 'start'); return; }
    const btn = target.closest('button');
    if(!btn) return;
    if(btn.id === 'buy-guns'){ const c = gunPackCost(); if(state.cash < c) return; state.cash -= c; state.guns += GUN_PACK; log(`<i aria-hidden="true" class="ph-duotone ph-crosshair"></i> A crate of ${GUN_PACK} comes off the docks. You're holding ${state.guns} guns now.`); renderAll(); }
    else if(btn.id === 'declare-war'){
      if(state.playSeconds < state.nextWarAt) return;
      const gs = gangStrength(), rs = rivalStrength();
      const odds = Math.round(Math.min(0.85, Math.max(0.15, gs/(gs+rs)))*100);
      dialogues.gangwar.nodes.start.text = `Dice's people aren't handing over West Side. You're holding ${state.guns} guns; your strength reads ${gs.toFixed(1)} to their ${rs.toFixed(1)} — call it ${odds}% odds tonight. The question is how loud you're willing to be.`;
      playDialogue('gangwar', 'start');
    }
  }

  function handleMissionPhoneAction(e: Event): void {
    const target = e.target as HTMLElement;
    const startBtn = target.closest('[data-mission-start]');
    if(startBtn){ startMissionFromOffer(startBtn.getAttribute('data-mission-start')!); return; }
    const declineBtn = target.closest('[data-mission-decline]');
    if(declineBtn){ declineMissionOffer(declineBtn.getAttribute('data-mission-decline')!); return; }
    const gpsBtn = target.closest('[data-mission-gps]');
    if(gpsBtn){
      const id = gpsBtn.getAttribute('data-mission-gps')!;
      setMissionGps(id);
      const mission = state.activeMissions[id];
      if(mission?.objective) log(`<i aria-hidden="true" class="ph-duotone ph-map-pin"></i> GPS set to ${mission.objective.label}.`);
      renderMissionPhoneApp();
      scheduleSave();
    }
  }

  function handleDistrictAction(e: Event){
    const btn = (e.target as HTMLElement).closest('[data-travel]');
    if(!btn) return;
    const id = btn.getAttribute('data-travel')!;
    if(id === state.currentDistrict) return;
    // LEGAL: No fast-travel — the district bar is a "you are here" indicator only.
    // LEGAL: Set a waypoint toward the target and make the player cross on foot/by car.
    const d = districts.find(x=>x.id===id);
    const dest = spawnPoints[id];
    if(dest) setGlobalWaypoint({ x:dest.x, y:dest.y });
    rebuildWaypointBeacon();
    log(`<i aria-hidden="true" class="ph-duotone ph-path"></i> Head over to ${d?d.name:'the district'} yourself — follow the marker across the bridges.`);
  }

  // LEGAL: Wire all delegation listeners exactly once at boot. Stable containers
  // LEGAL: never get destroyed so each handler accumulates at exactly 1 per container.
  function handleAdvisorAction(e: Event): void {
    const btn = (e.target as HTMLElement).closest('[data-onboarding-target]');
    if(!btn) return;
    const actionKind = btn.getAttribute('data-onboarding-kind');
    const target = btn.getAttribute('data-onboarding-target') as OnboardingPanelTarget;
    const missionId = btn.getAttribute('data-onboarding-mission');
    if(actionKind === 'missionGps' && missionId){
      setMissionGps(missionId);
      const mission = state.activeMissions[missionId];
      if(mission?.objective) log(`<i aria-hidden="true" class="ph-duotone ph-map-pin"></i> GPS set to ${mission.objective.label}.`);
      renderMissionPhoneApp();
      scheduleSave();
      return;
    }
    onboardingTargetFor(target);
    const section = btn.getAttribute('data-onboarding-section');
    if(section) byId(section === 'street' ? 'street-panel' : 'grid-legit').scrollIntoView({ behavior:'smooth', block:'center' });
  }

  function wireDelegation(){
    // LEGAL: A missing stock logo falls back to its lettermark. Load errors don't bubble,
    // LEGAL: so this listens in the capture phase.
    document.addEventListener('error', function(e){
      const img = e.target;
      if(img instanceof HTMLImageElement && img.dataset.fallbackText && img.parentElement) img.parentElement.textContent = img.dataset.fallbackText;
    }, true);
    byId('advisor-list').addEventListener('click', handleAdvisorAction);
    byId('grid-legit').addEventListener('click', handleCardAction);
    byId('grid-street').addEventListener('click', handleCardAction);
    byId('assets-cars').addEventListener('click', handleAssetAction);
    byId('assets-buildings').addEventListener('click', handleAssetAction);
    byId('street-panel').addEventListener('click', handleStreetAction);
    const bankPanel = byId('bank-panel');
    if(bankPanel){ bankPanel.addEventListener('click', handleBankAction); bankPanel.addEventListener('keydown', handleBankKeydown); }
    byId('territory-panel').addEventListener('click', handleTerritoryAction);
    byId('politics-panel').addEventListener('click', handlePoliticsAction);
    byId('gang-panel').addEventListener('click', handleGangAction);
    byId('missions-panel').addEventListener('click', handleMissionPhoneAction);
    // LEGAL: The Travel Nodes strip is gone — you walk or drive between districts, which is
    // LEGAL: the whole point of having a city. The handler is kept because the same
    // LEGAL: data-travel action is used by the territory panel.
    byIdOrNull('district-bar')?.addEventListener('click', handleDistrictAction);
  }

  // LEGAL: ================= RENDER: STREET PANEL =================
  function renderStreetPanel(){
    const wrap = byId('street-panel');
    const mc = muscleCost();
    const rcCash = ratsCashCost(), rcResp = ratsRespectCost();
    wrap.innerHTML = `
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.fist}</div>
          <div class="col-name">Muscle</div>
          <div class="col-stat">Muscle: ${state.muscleCount}</div>
          <div class="col-stat">Respect: +${respectPerSec().toFixed(1)}/s</div>
          <div class="col-stat">Heat: +${(state.muscleCount*0.5*heatMult()).toFixed(1)}/s</div>
          <div class="col-status">${state.muscleCount>0?'ACTIVE':'NONE'}</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Earns respect passively. Draws heat while active.</div>
          <div class="btn-row"><button class="mini-btn" ${state.cash>=mc?'':'disabled'} id="hire-muscle">HIRE <span class="cost">${formatMoney(mc)}</span></button></div>
        </div>
      </div>
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.badge}</div>
          <div class="col-name">Bribe the Cops</div>
          <div class="col-stat" style="color:var(--green);">-HEAT</div>
          <div class="col-status">${state.bribeOn?'PAYING':'IDLE'}</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Pay 12% of total income continuously to cut heat generation sharply.</div>
          <div class="btn-row"><button class="mini-btn" id="toggle-bribe">${state.bribeOn?'STOP PAYING':'START PAYING'}</button></div>
        </div>
      </div>
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.badge}</div>
          <div class="col-name">Lay Low</div>
          <div class="col-stat">Wanted: ${WANTED_TIERS[wantedTier()].label}</div>
          <div class="col-stat" style="color:var(--green);">-HEAT · -CASE</div>
          <div class="col-status">${state.layingLow?'QUIET':'ACTIVE OPS'}</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Go to ground: heat and the federal case bleed off fast — but your illegal income (street ventures, corners, extortion) runs at 40% until you resume.</div>
          <div class="btn-row"><button class="mini-btn" id="toggle-laylow">${state.layingLow?'RESUME OPERATIONS':'LAY LOW'}</button></div>
        </div>
      </div>
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.badge}</div>
          <div class="col-name">Retain Counsel</div>
          <div class="col-stat">Case: ${Math.round(state.investigation)}%</div>
          <div class="col-stat" style="color:var(--green);">-CASE</div>
          <div class="col-status">${state.investigation>5?'AVAILABLE':'NO CASE'}</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Buy the right lawyer and bury the investigation before it culminates in a raid. Cost scales with how deep the case has dug.</div>
          <div class="btn-row"><button class="mini-btn" ${state.investigation>5 && state.cash>=counselCost()?'':'disabled'} id="retain-counsel">RETAIN <span class="cost">${formatMoney(counselCost())}</span></button></div>
        </div>
      </div>
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.person}</div>
          <div class="col-name">Informants</div>
          <div class="col-stat">Informants: ${state.ratCount}</div>
          <div class="col-stat" style="color:var(--green);">-RISK</div>
          <div class="col-status">${state.ratCount>0?'ACTIVE':'NONE'}</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Cuts the odds of bad news finding you, and softens any raid that does land.</div>
          <div class="btn-row"><button class="mini-btn" ${(state.cash>=rcCash && state.respect>=rcResp)?'':'disabled'} id="hire-rat">HIRE <span class="cost">${formatMoney(rcCash)} + ${rcResp} resp</span></button></div>
        </div>
      </div>
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.music}</div>
          <div class="col-name">Expand Territory</div>
          <div class="col-stat">CAPACITY: ${crewCapGlobal()}</div>
          <div class="col-status">UPGRADE</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Raises your citywide crew capacity, letting every venture run at full strength.</div>
          <div class="btn-row"><button class="mini-btn" ${state.respect>=territoryCost()?'':'disabled'} id="buy-territory">EXPAND <span class="cost">${territoryCost()} resp</span></button></div>
        </div>
      </div>
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.person}</div>
          <div class="col-name">Negotiate</div>
          <div class="col-stat" style="color:var(--green);">DISCOUNT: ${Math.round((1-discountMult())*100)}%</div>
          <div class="col-status">UPGRADE</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Permanent discount on every venture, crew, and research cost, citywide.</div>
          <div class="btn-row"><button class="mini-btn" ${state.respect>=negotiateCost()?'':'disabled'} id="buy-negotiate">NEGOTIATE <span class="cost">${negotiateCost()} resp</span></button></div>
        </div>
      </div>
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.box}</div>
          <div class="col-name">The Lab</div>
          <div class="col-stat">LEVEL ${state.productLevel}</div>
          <div class="col-stat">STOCK: ${state.product.toFixed(0)}/${productCap()}</div>
          <div class="col-status">${state.productLevel>0?'ACTIVE':'NOT BUILT'}</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Produces product for your dealers to sell. No product in stock, corners just idle.</div>
          <div class="btn-row"><button class="mini-btn" ${state.cash>=labCost()?'':'disabled'} id="upgrade-lab">UPGRADE <span class="cost">${formatMoney(labCost())}</span></button></div>
        </div>
      </div>
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.diamond}</div>
          <div class="col-name">The Trade</div>
          <div class="col-stat">DEALERS: ${activeCorners().length}/${corners.length}</div>
          <div class="col-stat">INCOME: +${cornerIncomePerSec().toFixed(1)}/s</div>
          <div class="col-status">${corners.some(c=>c.dealer && !c.busted)?'ACTIVE':'NO DEALERS'}</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Dealers are managed from the map — walk up to a corner and press E. This is just the read-out.</div>
        </div>
      </div>
      ${state.worldMemory.blackMarketTrade ? `
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.box}</div>
          <div class="col-name">Black Market Trade</div>
          <div class="col-stat">INCOME: +${formatMoney(blackMarketTradeIncome())}/s</div>
          <div class="col-stat">HEAT: +${blackMarketTradeHeat().toFixed(2)}/s</div>
          <div class="col-status">ACTIVE</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">A chop-shop cargo partnership. It pays quietly enough, but federal attention builds while it runs.</div>
        </div>
      </div>` : ''}
    `;
  }

  // LEGAL: ================= RENDER: ALL =================
  function renderAll(){
    const legitGrid = byId('grid-legit');
    const streetGrid = byId('grid-street');
    legitGrid.innerHTML=''; streetGrid.innerHTML='';
    businesses.forEach(b=>{ const card = renderCard(b); (b.category==='legit' ? legitGrid : streetGrid).appendChild(card); });
    renderStreetPanel();
    renderBankPanel();
    renderAssetsPanel();
    renderDistrictBar();
    renderLegend();
    renderTerritoryPanel();
    renderPoliticsPanel();
    renderGangPanel();
    renderCityNews();
    renderAdvisorPanel();
    renderMissionPhoneApp();
    renderMissionNotificationBadges();

    refreshHUD();
  }

  // LEGAL: Paints the Heat gauge in its current WANTED-tier colour, the tier label,
  // LEGAL: and the Investigation sub-bar (hidden until a case actually opens).
  function updateHeatHud(){
    const t = wantedTier();
    const info = WANTED_TIERS[t];
    const fill = byIdOrNull('heat-fill');
    if(fill){
      fill.style.width = Math.min(100, state.heat) + '%';
      fill.style.background = info.color;
      fill.classList.toggle('critical', t >= 4);
    }
    const label = byIdOrNull('wanted-label');
    if(label){ label.textContent = `${info.label} · ${Math.round(state.heat)}%` + (crackdownActive() ? ' · SWEEP' : ''); label.style.color = info.color; }
    const invRow = byIdOrNull('inv-row');
    if(invRow) invRow.style.display = state.investigation > 2 ? 'flex' : 'none';
    const invFill = byIdOrNull('inv-fill');
    if(invFill) invFill.style.width = Math.min(100, state.investigation) + '%';
    const invTag = byIdOrNull('inv-tag');
    if(invTag) invTag.textContent = `FED. CASE ${Math.round(state.investigation)}%`;
    const panel = byIdOrNull('heat-breakdown');
    // LEGAL: The breakdown lives in a collapsed <details>. Rebuilding its innerHTML
    // LEGAL: every 250ms tick (11 rows re-parsed) is wasted work while it's closed,
    // LEGAL: so skip it unless the panel is actually open. A one-time toggle listener
    // LEGAL: forces an immediate repaint the moment the user expands it.
    const details = panel ? panel.closest('details') : null;
    if(details && !details.dataset.heatToggleWired){
      details.dataset.heatToggleWired = '1';
      details.addEventListener('toggle', ()=>{ if(details.open) updateHeatHud(); });
    }
    if(panel && (!details || details.open)){
      const hb = heatBreakdown();
      const rows: string[] = [];
      const push = function(lbl: string, val: string){ rows.push(`<div class="heat-breakdown-row"><span>${lbl}</span><strong>${val}</strong></div>`); };
      push('Muscle', `+${hb.muscleHeat.toFixed(2)}/s`);
      push('Street ventures', `+${hb.streetVentureHeat.toFixed(2)}/s`);
      push('Extortion', `+${hb.extortionHeat.toFixed(2)}/s`);
      push('Corners', `+${hb.cornerHeat.toFixed(2)}/s`);
      if(hb.conspicuousHeat > 0) push('Sprawl (conspicuous)', `+${hb.conspicuousHeat.toFixed(2)}/s`);
      if(hb.bikeHeat > 0) push('Riding a bike (exposed)', `+${hb.bikeHeat.toFixed(2)}/s`);
      if(hb.launderMult < 1) push('Commercial fronts (laundering)', `×${hb.launderMult.toFixed(2)}`);
      push(`Modifiers${state.layingLow?' · LAYING LOW':''}${crackdownActive()?' · SWEEP':''}`, `×${hb.modifier.toFixed(2)}`);
      push('Gross heat', `+${hb.gen.toFixed(2)}/s`);
      push('Cooling off', `−${hb.cool.toFixed(2)}/s`);
      push('Net change', `${hb.net>=0?'+':''}${hb.net.toFixed(2)}/s ${hb.net>0.02?'▲':(hb.net<-0.02?'▼':'—')}`);
      push('Wanted level', info.label);
      push('Federal case', `${Math.round(state.investigation)}%`);
      panel.innerHTML = rows.join('');
    }
  }

  // LEGAL: Cheap per-tick refresh: updates numbers and enabled/disabled state on the
  // LEGAL: EXISTING dom nodes without rebuilding them. renderAll() (above) tears down
  // LEGAL: and rebuilds every card/button, which is only safe to call right after a
  // LEGAL: user action — never on a timer, or a click can land mid-rebuild and get
  // LEGAL: silently swallowed by the browser. This function is what the game hub
  // LEGAL: calls every 250ms instead.
  function refreshHUD(){
    const rank = currentRank();
    byId('hud-cash').textContent = formatMoney(state.cash);
    byId('hud-income').textContent = (netIncome()>=0?'+':'') + formatMoneyRate(netIncome()) + '/s';
    byId('hud-rank').textContent = rank;
    byId('hud-respect').textContent = `${formatCount(state.respect)} respect`;
    updateHeatHud();
    byId('hud-crew').textContent = `${crewUsedGlobal()} / ${crewCapGlobal()}`;

    if(rank === 'Local Boss') triggerMilestone('local_boss');
    if(rank === 'West Side Kingpin') triggerMilestone('kingpin');

    const prestigeBtn = byId<HTMLButtonElement>('prestige-btn');
    const threshold = prestigeThreshold();
    const nextFamily = familyTiers[state.prestigeCount];
    if(!nextFamily){ prestigeBtn.style.display = 'none'; return; }
    if(state.cash >= threshold*0.2 || state.prestigeCount>0){
      prestigeBtn.style.display = 'inline-block';
      prestigeBtn.disabled = state.cash < threshold;
      prestigeBtn.textContent = state.cash >= threshold ? `Bring in ${nextFamily.name}` : `Bring in ${nextFamily.name} (Requires ${formatMoney(threshold)})`;
    }
  }
  function refreshAffordability(){
    document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(btn=>{
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      const b = businesses.find(x=>x.id===id);
      if(!b) return;
      if(action==='research') btn.disabled = state.cash < researchCostFor(b);
      else if(action==='expand') btn.disabled = state.cash < costForLevel(b);
      else if(action==='hirecrew'){
        const need = crewNeeded(b);
        btn.disabled = b.manager || b.crew>=need+2 || crewUsedGlobal()>=crewCapGlobal() || state.cash < crewCostFor(b);
      } else if(action==='firecrew') btn.disabled = b.manager || b.crew<=0;
      else if(action==='hiremanager') btn.disabled = state.cash < managerCostFor(b);
    });
    const hm=byId<HTMLButtonElement>('hire-muscle'); if(hm) hm.disabled = state.cash<muscleCost();
    const hr=byId<HTMLButtonElement>('hire-rat'); if(hr) hr.disabled = !(state.cash>=ratsCashCost() && state.respect>=ratsRespectCost());
    const bt=byId<HTMLButtonElement>('buy-territory'); if(bt) bt.disabled = state.respect<territoryCost();
    const bn=byId<HTMLButtonElement>('buy-negotiate'); if(bn) bn.disabled = state.respect<negotiateCost();
    document.querySelectorAll<HTMLButtonElement>('[data-car-buy]').forEach(btn=>{ const c=cars.find(x=>x.id===btn.getAttribute('data-car-buy')); if(c) btn.disabled = state.cash<c.cost; });
    document.querySelectorAll<HTMLButtonElement>('[data-prop-buy]').forEach(btn=>{ const p=properties.find(x=>x.id===btn.getAttribute('data-prop-buy')); if(p) btn.disabled = state.cash<p.cost; });
    // LEGAL: The bank balance/on-hand chips only exist while the phone's vault view is
    // LEGAL: rendered (absent in the Stocks view), so look them up null-safely. The old
    // LEGAL: start-heist / heist-status-value HUD elements are gone — robbing is in person.
    const bankedEl=byIdOrNull('bank-banked-value'); if(bankedEl) bankedEl.textContent=formatMoney(bankedTotal());
    const onhandEl=byIdOrNull('bank-onhand-value'); if(onhandEl) onhandEl.textContent=formatMoney(state.cash);
    const labBtn=byId<HTMLButtonElement>('upgrade-lab'); if(labBtn) labBtn.disabled = state.cash<labCost();
    document.querySelectorAll<HTMLButtonElement>('[data-push]').forEach(btn=>{
      const d = districts.find(x=>x.id===btn.getAttribute('data-push'));
      if(d) btn.disabled = state.playSeconds<d.nextPushAt || state.respect<pushCost(d);
    });
    const buyInfluenceBtn=byId<HTMLButtonElement>('buy-influence'); if(buyInfluenceBtn) buyInfluenceBtn.disabled = state.cash<influenceCost();
    document.querySelectorAll<HTMLButtonElement>('[data-bribe]').forEach(btn=>{
      const p = politicians.find(x=>x.id===btn.getAttribute('data-bribe'));
      if(p) btn.disabled = state.cash<favorCost(p) || p.favor>=100;
    });
    const campaignBtn=byId<HTMLButtonElement>('launch-campaign');
    if(campaignBtn && !state.electedOffice) campaignBtn.disabled = !(state.influence>=100 && state.playSeconds>=state.nextCampaignAt);
    document.querySelectorAll<HTMLButtonElement>('[data-initiate]').forEach(btn=>{
      const g = gangRecruits.find(x=>x.id===btn.getAttribute('data-initiate'));
      if(g) btn.disabled = state.cash<g.cost;
    });
    const warBtn=byId<HTMLButtonElement>('declare-war'); if(warBtn) warBtn.disabled = state.playSeconds<state.nextWarAt;
    refreshTerritory();
  }
  function refreshTerritory(){
    districts.forEach(d=>{
      const bar = document.querySelector<HTMLElement>(`[data-control-bar="${d.id}"]`);
      if(bar) bar.style.width = Math.round(d.control) + '%';
      const label = document.querySelector(`[data-control-label="${d.id}"]`);
      if(label) label.textContent = `${Math.round(d.control)}% — ${districtStatus(d.id)==='yours'?'Yours':(districtStatus(d.id)==='rival'?'Rival Controlled':'Contested')}`;
    });
    const tradeEl = byIdOrNull('trade-summary');
    if(tradeEl){
      const active = activeCorners().length;
      tradeEl.textContent = `${state.product.toFixed(0)}/${productCap()} product · ${active}/${corners.length} corners staffed · ${cornerIncomePerSec().toFixed(1)}/s`;
    }
  }

  // LEGAL: ================= PRESTIGE =================
  byId('prestige-btn').addEventListener('click', function(){
    if(state.prestigeCount >= familyTiers.length) return;
    const threshold = prestigeThreshold();
    if(state.cash < threshold) return;
    const tier = familyTiers[state.prestigeCount];
    showModal({
      eyebrow:"Windhaven International, Terminal 5", title:"FAMILY INBOUND", stamp:'Arrived',
      body:`<p><strong>${tier.name}</strong> is cleared at customs. ${tier.desc}</p><p class="flavor">Setting them up in Windhaven takes almost every dollar you have, on hand, in the bank and in the market, to clear their debts and secure their paper trail. Your active fronts will close down temporarily, and muscle on the street will scatter until the dust settles. Hired managers and research dossiers remain yours.</p>`,
      buttons:[
        {label:"Make the transfer", onClick:function(){
          state.cash = 47; state.heat = 0; state.muscleCount = 0; state.guns = 0; state.ratCount = 0;
          state.bankAccounts = {};
          state.vaultCash = 0;
          Object.values(state.portfolio).forEach(function(position){ position.shares = 0; position.avgCost = 0; });
          state.investigation = 0; state.layingLow = false; state.crackdownUntil = 0; state.nextCrackdownAt = state.playSeconds + 360;
          businesses.forEach(b=>{ b.level=0; b.crew=0; b.reinvestedIncome=0; });
          state.prestigeCount += 1;
          log(`✈️ ${tier.name} lands in Windhaven. ${tier.desc}`);
          renderAll(); scheduleSave();
        }},
        {label:"Go back", secondary:true}
      ]
    });
  });

  // LEGAL: ================= TABS =================
  let mapActive = false;
  let mapHubRunning = false;
  let sceneInitialized = false;
  let mapScenePromise: Promise<void> | null = null;
  let mapAssets: MapAssetLibrary | null = null;
  let characterLibrary: CharacterLibrary | null = null;
  let vehicleLibrary: VehicleLibrary | null = null;
  let buildingLibrary: BuildingLibrary | null = null;
  let propLibrary: PropLibrary | null = null;
  let landmarkCatalog: ModelCatalog | null = null;
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', function(){ setTab(btn.getAttribute('data-tab')!); });
  });
  function setTab(tab: string){
    if(tab === 'politics' || tab === 'gang') tab = 'map';
    // LEGAL: A new tab starts at its top. Keeping the old scroll left the map off-screen above.
    const switching = !document.querySelector(`.tab-panel.active[data-tab="${tab}"]`);
    if(switching) window.scrollTo({ top:0 });
    // LEGAL: On a phone held sideways the header alone is a third of the height, so opening the
    // LEGAL: map scrolls it up to sit right under the tab bar.
    if(switching && tab === 'map' && window.matchMedia('(max-height:500px) and (orientation:landscape)').matches){
      requestAnimationFrame(function(){ byId('scene3d-container').scrollIntoView({ block:'start' }); });
    }
    document.querySelectorAll('.tab-btn').forEach(b=> b.classList.toggle('active', b.getAttribute('data-tab')===tab));
    document.querySelectorAll('.tab-panel').forEach(p=> p.classList.toggle('active', p.getAttribute('data-tab')===tab));
    mapActive = (tab==='map');
    if(mapActive){
      void startMapLoop();
    }
  }

  // LEGAL: ---- the phone: online-only services (Bank / Stocks / AutoMart) in a device
  // LEGAL: overlay you can open anywhere. Freezes map input while up (see deviceOpen()).
  // LEGAL: Bank and Stocks share the one #bank-panel (relocated here from the old Finance
  // LEGAL: tab); the icons just preset state.financeView. AutoMart hosts the old Assets
  // LEGAL: containers. All three are refreshed every tick by renderAll(), untouched.
  function deviceOpen(){ return !byId('device-overlay').classList.contains('hidden'); }
  function showDeviceHome(){
    byId('device-home').classList.remove('hidden');
    document.querySelectorAll<HTMLElement>('.device-screen').forEach(s=> s.classList.add('hidden'));
  }
  function openDevice(){
    byId('device-overlay').classList.remove('hidden');
    showDeviceHome();
    Object.keys(keys).forEach(k=> keys[k]=false); // LEGAL: drop held movement keys
  }
  function closeDevice(){
    byId('device-overlay').classList.add('hidden');
    lastFrame2 = Date.now(); // LEGAL: avoid a dt spike when the map loop resumes
  }
  function openDeviceApp(app: string){
    byId('device-overlay').classList.remove('hidden');
    byId('device-home').classList.add('hidden');
    document.querySelectorAll<HTMLElement>('.device-screen').forEach(s=> s.classList.add('hidden'));
    Object.keys(keys).forEach(k=> keys[k]=false);
    if(app==='automart' || app==='realty'){
      // LEGAL: renderAssetsPanel fills both #assets-cars and #assets-buildings (each now
      // LEGAL: on its own screen); we just reveal the one the tapped app owns.
      document.querySelector<HTMLElement>(`.device-screen[data-screen="${app}"]`)!.classList.remove('hidden');
      renderAssetsPanel();
    } else if(app==='missions'){
      document.querySelector<HTMLElement>('.device-screen[data-screen="missions"]')!.classList.remove('hidden');
      renderMissionPhoneApp();
    } else if(app==='contacts'){
      document.querySelector<HTMLElement>('.device-screen[data-screen="contacts"]')!.classList.remove('hidden');
      renderContactsApp();
    } else {
      state.financeView = app==='stocks' ? 'lcn-home' : 'vault';
      byId('finance-appbar-title').textContent = app==='stocks' ? 'Stocks' : 'Bank';
      document.querySelector<HTMLElement>('.device-screen[data-screen="finance"]')!.classList.remove('hidden');
      renderBankPanel();
    }
  }
  byId('phone-btn').addEventListener('click', openDevice);
  byId('device-close').addEventListener('click', closeDevice);
  byId('device-home-btn').addEventListener('click', showDeviceHome); // LEGAL: home button → app grid
  byId('device-overlay').addEventListener('click', function(e){
    const target = e.target as HTMLElement;
    if(target.id === 'device-overlay'){ closeDevice(); return; } // LEGAL: click backdrop to close
    const app = target.closest<HTMLElement>('[data-app]');
    if(app){ openDeviceApp(app.getAttribute('data-app')!); return; }
    if(target.closest('[data-back]')) showDeviceHome();
  });
  byId('contacts-panel').addEventListener('click', function(e){
    const target = e.target as HTMLElement;
    if(target.closest('[data-taxi-dispatch]')) dispatchTaxi();
    if(target.closest('[data-contact-action="dock-status"]')){
      openDockContactStatus();
      return;
    }
    if(target.closest('[data-contact-action="lana-status"]')){
      openLanaContactStatus();
      return;
    }
    if(target.closest('[data-contact-action="amit-status"]')){
      openAmitContactStatus();
      return;
    }
    if(target.closest('[data-contact-action="investor-status"]')){
      openInvestorContactStatus();
      return;
    }
    const waypointButton = target.closest('[data-contact-waypoint]');
    if(waypointButton){
      const place = missionPlaceByService(waypointButton.getAttribute('data-contact-waypoint')!);
      if(!place) return;
      setGlobalWaypoint({ x:place.x, y:place.y });
      rebuildWaypointBeacon();
      byId('minimap-clear').classList.add('show');
      log('<i aria-hidden="true" class="ph-duotone ph-map-pin"></i> Contact route set: ' + place.name + '.');
      renderContactsApp();
      scheduleSave();
    }
  });

  // LEGAL: Low quality drops the sun's shadow: on a 4x-throttled phone profile that alone
  // LEGAL: took the city from 22 to 32 fps. Remembered, so the next visit compiles once.
  const LOW_QUALITY_KEY = 'seat-quality-low';
  const qualityGovernor = createQualityGovernor({ minFps:40, warmupFrames:30, sampleSeconds:3 });
  const cameraRig = createCameraRig();
  function lowQualitySaved(): boolean {
    try{ return window.localStorage.getItem(LOW_QUALITY_KEY) === '1'; }catch(e){ return false; }
  }
  function useLowQuality(): void {
    if(sunLight) sunLight.castShadow = false;
    try{ window.localStorage.setItem(LOW_QUALITY_KEY, '1'); }catch(e){}
  }

  // LEGAL: Build the 3D city while the player is on the title screen, so the map is usually
  // LEGAL: ready the first time they open it (on a slow phone the build is seconds of work).
  // LEGAL: Waits until the neon title has finished, then for the browser to be idle.
  function preloadMapSceneWhenIdle(): void {
    window.setTimeout(function(){
      if('requestIdleCallback' in window) window.requestIdleCallback(function(){ void ensureMapScene(); }, { timeout:3000 });
      else void ensureMapScene();
    }, 2000);
  }

  async function startMapLoop(): Promise<void> {
    const container = byId('scene3d-container');
    if(!sceneInitialized){
      container.classList.add('loading');
      // LEGAL: Let the label paint before the (synchronous) city build starts.
      await new Promise(function(resolve){ requestAnimationFrame(function(){ requestAnimationFrame(resolve); }); });
    }
    await ensureMapScene();
    container.classList.remove('loading');
    if(!mapActive || mapHubRunning) return;
    mapHubRunning = true;
    lastFrame2 = Date.now();
    requestAnimationFrame(mapHub);
  }
  async function ensureMapScene(): Promise<void> {
    if(sceneInitialized) return;
    if(!mapScenePromise){
      mapScenePromise = (async function(){
        THREE = await import('three');
        mergeSceneryGeometries = (await import('three/examples/jsm/utils/BufferGeometryUtils.js')).mergeGeometries;
        let personParts: Awaited<ReturnType<typeof loadPersonGeometries>> = null;
        let trees: Awaited<ReturnType<typeof loadTreeShapes>> = {};
        let street: Awaited<ReturnType<typeof loadStreetModels>> = {};
        let places: Awaited<ReturnType<typeof loadPlaceModels>> = new Map();
        [mapAssets, vehicleLibrary, buildingLibrary, propLibrary, landmarkCatalog, personParts, trees, street, places] = await Promise.all([loadMapAssetLibrary(THREE), loadVehicleLibrary(THREE), loadBuildingLibrary(THREE), loadPropLibrary(THREE), loadModelCatalog(THREE, '/assets/world/landmarks/', LANDMARK_MODELS), loadPersonGeometries(THREE), loadTreeShapes(THREE), loadStreetModels(THREE), loadPlaceModels(THREE)]);
        useStreetModels(street);
        usePlaceModels(places);
        useSculptedPersonParts(personParts);
        useTreeShapes(trees);
        characterLibrary = createCharacterLibrary(THREE, function(){ return state.appearance; }, mergeSceneryGeometries ?? undefined);
        if(!sceneInitialized){
          initScene();
          sceneInitialized = true;
          refreshPlayerModel();
          updateParkedCarMesh();
          rebuildWaypointBeacon();
          // LEGAL: Shader compilation was most of the first-frame cost; doing it here means a
          // LEGAL: preloaded city is ready to draw, and the driver can compile in parallel.
          // LEGAL: compileAsync skips the shadow pass's shaders, so one real render (tiny while
          // LEGAL: the map tab is hidden) compiles the rest.
          await renderer.compileAsync(scene, camera3d);
          aimCamera(0);
          renderer.render(scene, camera3d);
          window.setTimeout(function(){ void warmInteriorShaders(); }, 1500);
        }
      })();
    }
    await mapScenePromise;
  }

  // LEGAL: ================= MAP: 3D WORLD + MINIMAP + INTERIORS =================
  // LEGAL: Unified city — 3 districts side by side, canals between them
  const player = { x:700, y:600, facing:Math.PI/2, vx:0, vy:0 };
  const keys: Record<string, boolean> = {};
  const touchStick = mountTouchStick(byId('scene3d-container'));
  let lastFrame2 = Date.now();


  // LEGAL: ---- Stage 2: allocate lots for the branded shops ----
  // LEGAL: The nine brand buildings were the ones crowding blocks, because each was given a
  // LEGAL: single authored point with no knowledge of its neighbours. They now get real
  // LEGAL: lots off the road grid, packed several to a block and rejected wherever they
  // LEGAL: would collide with an already-placed building. Everything already positioned —
  // LEGAL: ventures, local businesses, corners, banks, civic buildings — is passed in as an
  // LEGAL: obstacle so the allocator works around the authored city rather than over it.
  // LEGAL: EVERY service building goes through the allocator (see map/serviceLots.ts), not
  // LEGAL: just the branded shops. The authored lots had real collisions — cityhall sat
  // LEGAL: exactly on top of the realestate venture, and hubBusStation stood in the middle
  // LEGAL: of Cermak Road — which is precisely the overlapping-buildings and
  // LEGAL: buildings-in-streets problem. Ventures and local businesses keep their authored
  // LEGAL: spots and are passed in as obstacles.
  const serviceLots = allocateServiceLots();
  if(serviceLots.unplaced.length) console.warn('[lots] no free lot for', serviceLots.unplaced.join(', '));
  applyMapWorldCoordinates(serviceBuildings, serviceLots.placed);
  applyMapWorldCoordinates(localBusinesses, serviceLots.placed);
  // LEGAL: Blocks use the same district-local x convention as the buildings that sit on
  // LEGAL: them, so they must be converted before any ownership hit test runs.
  applyMapWorldCoordinates(territoryBlocks);
  applyMapWorldCoordinates(corners);
  applyMapWorldCoordinates(gangRecruits);

  // LEGAL: Businesses spread proportionally across all 3 districts
  // LEGAL: Building lots sit strictly between the road strips. Vertical roads are at
  // LEGAL: rel-x 270/700/1130 (±37) and horizontal roads at y 300/600/900 (±37), so
  // LEGAL: these column/row centers keep every venture fully clear of the streets.
  const mapBuildings = createMapBuildings(businesses);
  // LEGAL: Stage 7 — every property has a real lot, so owned real estate is findable.
  const mapPropertyPlaces = propertyPlaces();
  const mapObjects = buildMapObjects({ mapBuildings, serviceBuildings, propertyPlaces:mapPropertyPlaces, localBusinesses, amenities:mapAmenities, corners, npcs:mapNpcs, gangRecruits });
  const mapPlaces = createMapPlaceRecords(mapObjects, landmarks);
  // LEGAL: You use the garage at its office door, not in the bay where your car is parked.
  (function(){
    const garage = serviceBuildings.find(s => s.id === 'playerGarage');
    const record = mapPlaces.find(place => place.id === 'playerGarage');
    if(!garage || !record) return;
    const shape = serviceBuildingSilhouette(garage);
    const door = garageOfficeDoor({ x:garage.x, y:garage.y }, shape.w, shape.d);
    record.x = door.x; record.y = door.y;
  })();
  const roamingActors = createRoamingActors(mapObjects);
  // LEGAL: District landmarks — unique, recognisable "spots" so each area reads as a
  // LEGAL: place rather than interchangeable blocks. Coords are world-space, sited on
  // LEGAL: each district's park/plaza and clear of the fixed anchors. (The Hub already
  // LEGAL: has The Potato, built with the park.)
  // LEGAL: Returns which district the player is in from shared land/water map data.
  function playerDistrict(){
    return districtIdAtPlayablePoint({ x: player.x, y: player.y }, actorRadius(state.inVehicle));
  }
  function currentRoadLabel(): string {
    const road = nearestRoadAtPoint({ x: player.x, y: player.y });
    // LEGAL: Ask where you ARE, not which district you were last in. state.currentDistrict
    // LEGAL: only ever holds one of the three city districts, so out in the belts the HUD
    // LEGAL: used to keep announcing the district you had driven out of — half the landmass
    // LEGAL: reporting somewhere you could see you were not.
    const region = regionNameAt({ x: player.x, y: player.y })
      ?? districts.find(function(d){return d.id===state.currentDistrict;})?.name
      ?? 'Windhaven';
    return `${road.road.name}, ${region}`;
  }
  // LEGAL: The minimap and City Map draw every lot's footprint.
  let lotFootprints: Solid[] | null = null;
  function cityLotFootprints(): Solid[] {
    lotFootprints ??= cityLots().map(lotSolid);
    return lotFootprints;
  }
  // LEGAL: Everything already standing that the lots must keep clear of: the named places and their
  // LEGAL: annexes, landmarks, and every spot something stands on (dealers' corners, amenities, people).
  let cityLotsCache: Lot[] | null = null;
  function cityLots(): Lot[] {
    if(cityLotsCache) return cityLotsCache;
    // LEGAL: Open places (the garage's bay, yards, alleys) have no collision bounds, so they're
    // LEGAL: kept clear by the footprint they're drawn at.
    const places: Solid[] = mapObjects.flatMap(function(object): Solid[] {
      if(object.bounds) return [object.bounds];
      if(object.kind === 'service'){ const shape = serviceBuildingSilhouette(object.ref as ServiceBuilding); return [{ x:object.x, y:object.y, hw:shape.w / 2, hd:shape.d / 2 }]; }
      return [];
    });
    const taken: Solid[] = [...places, ...places.map(frontageClearance), ...placeExtraSolids()];
    mapObjects.filter(object => !object.bounds).forEach(object => taken.push({ x:object.x, y:object.y, hw:28, hd:28 }));
    // LEGAL: The garage's bay opens south: its apron, from the mouth to the street, stays open to drive in.
    const garage = serviceBuildings.find(s => s.id === 'playerGarage');
    if(garage){
      const shape = serviceBuildingSilhouette(garage);
      const street = roadNetwork.horizontal.find(h => h.y > garage.y) ?? roadNetwork.horizontal[roadNetwork.horizontal.length - 1];
      taken.push({ x:garage.x, y:(garage.y + street.y) / 2, hw:shape.w / 2 + 10, hd:Math.abs(street.y - garage.y) / 2 });
    }
    landmarks.forEach(lm => taken.push({ x:lm.x, y:lm.y, hw:72, hd:72 }));
    Object.values(spawnPoints).forEach(p => taken.push({ x:p.x, y:p.y, hw:40, hd:40 }));
    cityLotsCache = generateLots(taken);
    return cityLotsCache;
  }
  // LEGAL: Benches, bins, hydrants and shelters in front of the lots (world/data/streetProps).
  let cityPropsCache: StreetProp[] | null = null;
  function cityProps(): StreetProp[] {
    cityPropsCache ??= generateStreetProps(cityLots(), streetTreeSpots, solidsFromObjects(mapObjects));
    return cityPropsCache;
  }
  // LEGAL: The solid parts of open places, whichever list the place is in: an alley's two flanking
  // LEGAL: buildings, a yard's hut and cargo, a garage's walls. Ventures and local businesses were
  // LEGAL: left out, so you could walk through the walls of Backroom Card Games' alley. A one-off
  // LEGAL: place (map/placeSpecials) brings its own solids instead.
  function archetypeSolidsForPlaces(): Solid[] {
    const list: Solid[] = [];
    mapObjects.forEach(function(object){
      let archetype: PlaceArchetype | null = null;
      let shape: { w: number; d: number } | null = null;
      if(object.kind === 'service'){
        const building = object.ref as ServiceBuilding;
        if(specialPlace(building.id)) return;
        archetype = serviceArchetype(building);
        shape = serviceBuildingSilhouette(building);
      } else if(object.kind === 'building'){
        archetype = ventureArchetype(object.ref as typeof mapBuildings[number]);
        shape = archetype ? archetypeSilhouette(archetype) : null;
      } else if(object.kind === 'local'){
        archetype = localArchetype(object.ref as LocalBusiness);
        shape = archetype ? archetypeSilhouette(archetype) : null;
      }
      if(archetype && shape) list.push(...archetypeExtraSolids(archetype, object.x, object.y, shape.w, shape.d));
    });
    return list;
  }
  function placeExtraSolids(): Solid[] {
    const list: Solid[] = archetypeSolidsForPlaces();
    const garage = serviceBuildings.find(s => s.id === 'playerGarage');
    if(garage){
      const shape = serviceBuildingSilhouette(garage);
      const office = garageOfficeCenter({ x:garage.x, y:garage.y }, shape.w, shape.d);
      list.push({ x:office.x, y:office.y, hw:GARAGE_OFFICE.w / 2, hd:GARAGE_OFFICE.d / 2 });
    }
    return list;
  }
  function buildAllSolids(){
    const list: Solid[] = solidsFromObjects(mapObjects);
    list.push(...streetPropSolids(cityProps()), ...cityLots().filter(lot => !lot.site).map(lotSolid), ...cityLots().filter(lot => lot.site).map(lot => { const s = lotSolid(lot); return { ...s, hw:s.hw + 2, hd:s.hd + 2 }; }));
    // LEGAL: An alley is the gap BETWEEN two buildings: the gap is walkable and the buildings
    // LEGAL: forming it are not. A single bounds box cannot say "blocked, open, blocked", so
    // LEGAL: the flanks are added here, sized from the same constant the shell is drawn with.
    list.push(...archetypeSolidsForPlaces());
    mapObjects.filter(object => object.kind === 'service').forEach(function(object){
      const building = object.ref as ServiceBuilding;
      list.push(...specialPlaceSolids(building.id, object.x, object.y));
    });
    // LEGAL: Trees, barns and silos used to be walk-through. Trunks are small boxes; countryside
    // LEGAL: buildings take most of their drawn footprint.
    streetTreeSpots.forEach(spot => list.push({ x:spot.x, y:spot.y, hw:5, hd:5 }));
    list.push(...mallSolids(), ...centralParkSolids(), ...suburbSolids());
    const garage = serviceBuildings.find(s => s.id === 'playerGarage');
    if(garage){
      const shape = serviceBuildingSilhouette(garage);
      const office = garageOfficeCenter({ x:garage.x, y:garage.y }, shape.w, shape.d);
      list.push({ x:office.x, y:office.y, hw:GARAGE_OFFICE.w / 2, hd:GARAGE_OFFICE.d / 2 });
    }
    createOutskirtSceneryLayout().forEach(function(item){
      if(item.kind === 'tree'){ list.push({ x:item.x, y:item.y, hw:4, hd:4 }); return; }
      const size = countryFootprint(item.kind);
      const ext = rotatedHalfExtents(size.w, size.d, item.rotation);
      list.push({ x:item.x, y:item.y, hw:ext.hw, hd:ext.hd });
    });
    return list;
  }
  const streetTreeSpots: Point[] = [];
  let currentSolids: Solid[] = [];

  // LEGAL: Nearest standable point, shared by the player's vehicle-entry nudge and by the
  // LEGAL: pedestrians, so a stuck actor is freed by the same rule the player is. Falls back
  // LEGAL: to the point itself when nothing is free, which keeps callers total.
  function rescuePoint(x: number, y: number): { x: number; y: number } {
    return nearestFreePoint(x, y, currentSolids, false) ?? { x, y };
  }

  // LEGAL: ---- interiors: a room per building, with its hotspots (drawn by renderInteriorView) ----
  const ROOM_W = 480, ROOM_H = 280;
  // LEGAL: Every room is ROOM_W x ROOM_H except the mall, which is a hall (map/mallInterior MALL_ROOM).
  // LEGAL: Each building's room is its own size (map/interiorPlans), set from the building's outside.
  function planFor(interior: InteriorState): InteriorPlan {
    const svc = serviceBuildings.find(sv => sv.id === interior.refId);
    return interiorPlanFor(interior.kind, interior.refId, brandById(svc?.brandId)?.category);
  }
  function roomSizeFor(interior: InteriorState): { w: number; h: number } {
    if(interior.kind === 'mall') return MALL_ROOM;
    const plan = planFor(interior);
    return { w:plan.w, h:plan.h };
  }
  function roomSize(): { w: number; h: number } { return state.currentInterior ? roomSizeFor(state.currentInterior) : { w:ROOM_W, h:ROOM_H }; }
  function doorLocal(): { x: number; y: number } { const room = roomSize(); return { x:room.w / 2, y:room.h - 6 }; }

  type HotSpot = { id: string; x: number; y: number; label: string; icon: string; action: () => void };

  // LEGAL: A single status row for the "read the room" briefs below.
  function briefRow(label: string, value: string, color?: string){
    return `<div style="display:flex;justify-content:space-between;gap:12px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;">`
      + `<span style="color:var(--text-faint,#8a90a0);">${label}</span>`
      + `<strong${color?` style="color:${color};"`:''}>${value}</strong></div>`;
  }
  // LEGAL: Opens a small in-world brief: a line of flavour, then only what is specific to
  // LEGAL: the place. The HUD already shows wanted level, case and turf, so briefs don't.
  // LEGAL: Defaults to the lie-low buttons.
  function showRoomBrief(eyebrow: string, title: string, lead: string, extraRows: string, buttons?: ModalOptions['buttons']){
    showModal({ eyebrow, title,
      body:`<p class="flavor">${lead}</p><div style="margin-top:10px;">${extraRows}</div>`,
      buttons: buttons ?? lieLowButtons() });
  }

  // LEGAL: Being indoors is the one thing an interior can offer that the street cannot, so
  // LEGAL: that is what the ambient hotspots do now. Heat decays while you wait it out; the
  // LEGAL: cost is the clock, which matters because income and rivals run on it.
  const LIE_LOW_SECONDS = 45;
  function lieLowButtons(): ModalOptions['buttons'] {
    if(state.heat < 5) return [{ label:'Step back' }];
    return [
      { label:`Lie low for a while (-${Math.min(30, Math.round(state.heat))} heat)`, onClick:function(){
        const shed = Math.min(30, state.heat);
        state.heat = Math.max(0, state.heat - shed);
        state.playSeconds += LIE_LOW_SECONDS;
        log(`<i aria-hidden="true" class="ph-duotone ph-hourglass"></i> You sit it out. The street cools off — heat down ${Math.round(shed)}.`);
        renderAll();
      } },
      { label:'Step back', secondary:true },
    ];
  }
  // LEGAL: The secondary "ambient" hotspot sits right of centre (AMBIENT_X, AMBIENT_Y in groundSpotsFor) so
  // LEGAL: it never collides with the primary counter (top-centre) or the door (bottom-centre).

  function groundSpotsFor(interior: InteriorState): HotSpot[] {
    const { w:ROOM_W, h:ROOM_H } = roomSizeFor(interior);
    const AMBIENT_X = ROOM_W*0.85, AMBIENT_Y = ROOM_H*0.55;
    const missionId = activeMissionForServiceId(interior.refId) ?? activeMissionForObjectId(interior.refId);
    const spots: HotSpot[] = [];
    const kind = interior.kind;
    if(kind==='venture'){
      const b = businesses.find(x=>x.id===interior.refId);
      if(!b) return [];
      spots.push({ id:'counter', x:ROOM_W/2, y:80, label:'Counter', icon:'🧾', action:()=> openVentureQuickPanel(b) });
      spots.push({ id:'backoffice', x:AMBIENT_X, y:AMBIENT_Y, label:'Back Office', icon:'🗄️', action:()=>
        showRoomBrief('Back Office', b.name, 'You slip into the back and take stock of how much attention the operation is pulling.', '') });
    } else if(kind==='local'){
      const biz = localBusinesses.find(x=>x.id===interior.refId);
      if(!biz) return [];
      spots.push({ id:'register', x:ROOM_W*0.32, y:80, label:'Register', icon:'💵', action:()=> openTillPanel(biz) });
      spots.push({ id:'owner', x:ROOM_W*0.68, y:80, label:biz.owner, icon:'🙂', action:()=> openOwnerPanel(biz) });
      spots.push({ id:'board', x:AMBIENT_X, y:AMBIENT_Y, label:'Community Board', icon:'📌', action:()=>
        showRoomBrief('Community Board', biz.name, 'Flyers for lost cats, a rent notice, a block party nobody has funded yet.',
          briefRow('Your respect', formatCount(state.respect)),
          [{ label:'Sponsor the block party ($200)', onClick:function(){
              if(state.cash>=200){ state.cash-=200; state.respect+=3; log(`<i aria-hidden="true" class="ph-duotone ph-confetti"></i> You quietly cover the block party at ${biz.name}. The neighborhood notices.`); renderAll(); }
              else { log('Not enough cash to sponsor the block party.'); }
            } },
           { label:'Step back', secondary:true }]) });
      if(biz.id==='chopshop') spots.push({ id:'armory', x:ROOM_W*0.50, y:148, label:'The Armory', icon:'🎯', action:openChopShopArmory });
    } else if(kind==='bankHome'){
      spots.push({ id:'teller', x:ROOM_W/2, y:80, label:'Teller Window', icon:'🏦', action:function(){
        if(state.activeMissions.home_safe_robbery?.stageId === 'teller'){
          openHomeSafeTellerLesson();
          return;
        }
        const svc = serviceBuildings.find(s=>s.id===interior.refId);
        openTellerBanking(svc?.bankId ?? DEFAULT_BANK_ID);
      } });
      spots.push({ id:'notices', x:AMBIENT_X, y:AMBIENT_Y, label:'Notices', icon:'📄', action:()=>
        showRoomBrief('Lobby Notices', 'First Windhaven', 'Rate sheets and fine print. Whatever is banked here stays out of reach when the feds come knocking.',
          briefRow('Banked (raid-safe)', formatMoney(bankedTotal()))) });
    } else if(kind==='heist'){
      spots.push({ id:'vault', x:ROOM_W/2, y:75, label:'Case the Banks', icon:'🔐', action:openHeistPlanning });
      spots.push({ id:'security-desk', x:ROOM_W*0.2, y:ROOM_H*0.76, label:'Security Office', icon:'🗂️', action:openHeistSecurityDesk });
    } else if(kind==='playerGarage'){
      // LEGAL: Your own garage: the fleet lives here. Pick which car to drive, and repair
      // LEGAL: anything that broke down. Nothing is for sale — that is what dealerships are.
      spots.push({ id:'fleet', x:ROOM_W/2, y:80, label:'Your Fleet', icon:'🔑', action:openGarageFleet });
      // LEGAL: Arjun lives in the flat upstairs (upperSpotsFor): his clothes and his vault are up there.
      spots.push({ id:'bench', x:AMBIENT_X, y:AMBIENT_Y, label:'Work Bench', icon:'🔧', action:function(){
        const parked = state.carParkedAt;
        const left = secondsUntilGarageReturn(parked, state.playSeconds);
        showRoomBrief('Work Bench', 'Your Garage', 'Oil, tools, and a radio nobody has retuned in years.',
          briefRow('Cars owned', String(state.ownedCars.length))
          + briefRow('Needing repair', String(state.brokenCars.length))
          + briefRow('Car in the street', left === null ? 'No — it is here' : `Yes, returns in ${Math.ceil(left)}s`));
      } });
    } else if(kind==='casino'){
      spots.push({ id:'tables', x:ROOM_W/2, y:78, label:'The Floor', icon:'🂡', action:openCasinoFloor });
      spots.push({ id:'slots', x:ROOM_W/2 - 90, y:110, label:'Slots', icon:'🎰', action:openSlots });
      spots.push({ id:'bar', x:AMBIENT_X, y:AMBIENT_Y, label:'Bar', icon:'🥃', action:()=>
        showRoomBrief('The Bar', 'The Gilded Kettle', 'Free while you are losing. The moment you stop, so does the service.',
          briefRow('Table stake', formatMoney(casinoStake)) + briefRow('Your cash', formatMoney(state.cash))) });
    } else if(kind==='respray'){
      spots.push({ id:'bay', x:ROOM_W/2, y:80, label:'Paint Bay', icon:'🎨', action:openResprayBay });
    } else if(kind==='dealership' || kind==='brokerage'){
      // LEGAL: Branded shop. The counter sells only this brand's stock at this block's
      // LEGAL: price — no generic catalog, no jump to a tab.
      const svc = serviceBuildings.find(s=>s.id===interior.refId);
      const brand = brandById(svc?.brandId);
      if(!brand) return [];
      const vehicles = kind==='dealership';
      spots.push({ id:'counter', x:ROOM_W/2, y:80, label: vehicles ? 'Sales Desk' : "Agent's Desk", icon: vehicles ? '🔑' : '📋',
        action:()=> openBrandShop(brand.id) });
      spots.push({ id:'floor', x:AMBIENT_X, y:AMBIENT_Y, label: vehicles ? 'Showroom Floor' : 'Listings Wall', icon: vehicles ? '🚗' : '🏠',
        action:function(){
          const { owner, blockName } = shopContext(brand);
          const gang = rivalGangForDistrict(brand.district);
          const turf = owner==='yours' ? 'Your blocks.' : (owner==='rival' ? `${gang?.name ?? 'A rival crew'} run this street.` : 'Nobody has this street locked down.');
          showRoomBrief(vehicles ? 'Showroom Floor' : 'Listings Wall', brand.name,
            vehicles
              ? 'Chrome under the lights. You walk the floor and look over what you keep in the garage.'
              : 'Framed listings and SOLD stickers. You scan the wall and tally what you already hold.',
            briefRow(vehicles ? 'Cars owned' : 'Properties owned', String(vehicles ? state.ownedCars.length : state.ownedProperties.length))
            + briefRow('Block', `${blockName} — ${turf}`));
        } });
    } else if(kind==='cityhall'){
      spots.push({ id:'clerk', x:ROOM_W/2, y:80, label:"Clerk's Window", icon:'🏛️', action:openCityHallDesk });
      spots.push({ id:'notices', x:AMBIENT_X, y:AMBIENT_Y, label:'Public Notices', icon:'📢', action:()=>
        showRoomBrief('Public Notices', 'City Hall', 'Permit hearings, zoning appeals, a re-election banner. The civic temperature, if you know how to read it.', '') });
    } else if(interior.refId==='motelSunset'){
      spots.push({ id:'frontdesk', x:ROOM_W/2, y:80, label:'Night Clerk', icon:'🛎️', action:function(){
        const reduction = Math.ceil(state.investigation * OUTSKIRT_VENUE_CONFIG.motelInvestigationReductionPct);
        const eligible = state.investigation >= OUTSKIRT_VENUE_CONFIG.motelMinimumInvestigation;
        showModal({ eyebrow:'Sunset Shore Motel', title:'A Room Away from the Case', body: eligible
          ? `<p class='flavor'>The clerk does not ask for a name. One quiet night removes ${OUTSKIRT_VENUE_CONFIG.motelInvestigationReductionPct * 100}% of your current case: ${reduction} investigation right now.</p>`
          : `<p class='flavor'>The clerk keeps a room open for people who need distance, but your case is not hot enough to justify the trip. Return at ${OUTSKIRT_VENUE_CONFIG.motelMinimumInvestigation} investigation or more.</p>`, buttons: eligible ? [
          { label:`Stay the night ($${OUTSKIRT_VENUE_CONFIG.motelStayCost})`, onClick:function(){ if(state.cash < OUTSKIRT_VENUE_CONFIG.motelStayCost) return; state.cash -= OUTSKIRT_VENUE_CONFIG.motelStayCost; state.investigation = Math.max(0, state.investigation - reduction); state.heat = Math.max(0, state.heat - OUTSKIRT_VENUE_CONFIG.motelHeatReduction); state.playSeconds += OUTSKIRT_VENUE_CONFIG.motelStaySeconds; state.worldMemory.motelStay = 'sunset'; log(`<i aria-hidden=\"true\" class=\"ph-duotone ph-bed\"></i> Sunset Shore buys you distance: $${OUTSKIRT_VENUE_CONFIG.motelStayCost} spent; investigation -${reduction} (${OUTSKIRT_VENUE_CONFIG.motelInvestigationReductionPct * 100}%); heat -${OUTSKIRT_VENUE_CONFIG.motelHeatReduction}; ${OUTSKIRT_VENUE_CONFIG.motelStaySeconds} seconds passed.`); renderAll(); scheduleSave(); } },
          { label:'Keep driving', secondary:true },
        ] : [{ label:'Keep driving' }] });
      } });
    } else if(interior.refId==='fireRoadKestrel'){
      spots.push({ id:'trailhead', x:ROOM_W/2, y:80, label:'Street Race', icon:'🏁', action:function(){
        const car = getEquippedCar();
        const bestSeconds = typeof state.worldMemory.fireRoadBestSeconds === 'number' ? state.worldMemory.fireRoadBestSeconds : 0;
        showModal({ eyebrow:'Kestrel Woods Fire Road', title:'The Kestrel Run', body:`<p class='flavor'>Three locals and their cars, idling at the trailhead. ${FIRE_ROAD_COURSE.checkpoints.length} checkpoints west along the north-shore lane to the far side of the lake. ${car ? `You'll race the ${car.name}.` : "No car? They'll lend you a Chevalier, and want it back."}</p><p>First pays ${formatMoney(racePrize(1, 4).cash)} and the Fire Road stripe; second ${formatMoney(racePrize(2, 4).cash)}; third ${formatMoney(racePrize(3, 4).cash)}.</p><p>Best time: <strong>${bestSeconds ? `${bestSeconds.toFixed(1)} seconds` : 'none yet'}</strong>.</p>`, buttons:[
          { label:'Line up', onClick:startRace },
          { label:'Walk the trail', secondary:true },
        ]});
      } });
    } else if(interior.refId==='driveInBoundary'){
      if(missionId) spots.push({ id:'mission', x:ROOM_W*0.18, y:80, label:'Mission Contact', icon:'📋', action:function(){ resolveMissionAtObjective(missionId); } });
      spots.push({ id:'screen', x:ROOM_W/2, y:80, label:'Projection Screen', icon:'🎬', action:function(){
        showModal({ eyebrow:'Boundary Meadows Drive-In', title:'One Picture, No Errands', body:"<p class='flavor'>You park beneath the big screen and let a ridiculous crime melodrama run until the city feels far away. The snack bar only takes cash.</p>", buttons:[
          { label:'Stay for the double feature ($120)', cost:120, onClick:function(){ state.cash = Math.max(0, state.cash - 120); state.respect += 6; state.playSeconds += 90; state.worldMemory.driveInNight = 'double-feature'; log('<i aria-hidden=\"true\" class=\"ph-duotone ph-film-strip\"></i> Two pictures, cold fries, and a quieter night: $120 spent; respect +6; 90 seconds passed.'); renderAll(); scheduleSave(); } },
          { label:'Watch from the tailgate', onClick:function(){ state.respect += 3; state.playSeconds += 45; state.worldMemory.driveInNight = 'tailgate'; log('<i aria-hidden=\"true\" class=\"ph-duotone ph-film-strip\"></i> You stay for the second act and leave before the credits: respect +3; 45 seconds passed.'); renderAll(); scheduleSave(); } },
        ]});
      } });
    } else if(interior.refId==='docksDockmaster'){
      if(missionId) spots.push({ id:'mission', x:ROOM_W*0.32, y:80, label:'Mission Contact', icon:'📋', action:function(){ resolveMissionAtObjective(missionId); } });
      spots.push({ id:'manifest', x:ROOM_W*0.68, y:80, label:'Manifest Board', icon:'🗃️', action:openDockManifest });
    } else if(interior.refId==='marigoldLounge' && !missionId){
      spots.push({ id:'wartable', x:ROOM_W/2, y:80, label:'The Back-Room Table', icon:'🗺️', action:openMarigoldWarTable });
    } else if(kind==='mall'){
      MALL_SPOTS.shops.forEach(function(entry){
        spots.push({ id:`shop:${entry.shop.id}`, x:entry.x, y:entry.y, label:entry.shop.name, icon:'🛍️', action:()=> openMallShop(entry.shop) });
      });
      spots.push({ id:'perfume', ...MALL_SPOTS.perfume, label:'Perfume Kiosk', icon:'🌸', action:openPerfumeKiosk });
      spots.push({ id:'icecream', ...MALL_SPOTS.icecream, label:'Ice Cream', icon:'🍦', action:openIceCreamCart });
      spots.push({ id:'foodcourt', ...MALL_SPOTS.foodcourt, label:'Food Court', icon:'🍜', action:openFoodCourt });
      spots.push({ id:'playground', ...MALL_SPOTS.playground, label:'Play Area', icon:'🛝', action:openPlayArea });
    } else if(kind==='missionOffice'){
      const missionId = activeMissionForServiceId(interior.refId);
      spots.push({ id:'mission', x:ROOM_W/2, y:80, label:missionId ? 'Mission Contact' : 'Front Desk', icon:'📋', action:function(){
        if(missionId) resolveMissionAtObjective(missionId);
        else showRoomBrief('Front Desk', interior.name, 'The place is open, but nobody here is waiting on you right now.', '');
      } });
    }
    if(missionId && kind !== 'missionOffice'){
      const at = kind === 'mall' ? { x:150, y:560 } : { x:ROOM_W*0.18, y:80 };
      spots.push({ id:'mission', ...at, label:'Mission Contact', icon:'📋', action:function(){ resolveMissionAtObjective(missionId); } });
    }
    return spots;
  }

  // LEGAL: Every floor's hotspots: the ground floor's own, the stairs between floors, and the regulars
  // LEGAL: (map/interiorPlans) you can stop and talk to.
  function hotspotsFor(interior: InteriorState | null): HotSpot[] {
    if(!interior) return [];
    const plan = planFor(interior);
    const floor = interior.floor ?? 0;
    const spots = floor === 0 ? groundSpotsFor(interior) : upperSpotsFor(interior, plan, floor);
    if(plan.stairs){
      const { kind } = plan.stairs;
      const stand = stairsLanding(plan)!;
      const up = floor < plan.floors.length - 1;
      const label = kind === 'lift' ? 'Lift' : `${kind === 'escalator' ? 'Escalator' : 'Stairs'} ${up ? 'up' : 'down'}`;
      spots.push({ id:up ? 'stairs-up' : 'stairs-down', ...stand, label, icon:'🪜', action:function(){ changeFloor(up ? floor + 1 : floor - 1); } });
    }
    plan.regulars.filter(r => r.floor === floor).forEach(function(regular){
      spots.push({ id:`talk:${regular.id}`, x:regular.x, y:regular.z + 20, label:regular.name, icon:'💬', action:function(){
        const line = regular.lines[Math.floor(state.playSeconds / 45) % regular.lines.length];
        showModal({ eyebrow:regular.role, title:regular.name, body:`<p class="flavor">"${line}"</p>`, buttons:[{ label:'Nod and move on' }] });
      } });
    });
    return spots;
  }
  // LEGAL: What's on the upper floors.
  function upperSpotsFor(interior: InteriorState, plan: InteriorPlan, floor: number): HotSpot[] {
    const { w:W, h:H } = roomSizeFor(interior);
    const room = plan.floors[floor]?.name ?? '';
    switch(plan.theme){
      case 'garageHome': return [
        { id:'wardrobe', x:W*0.3, y:H*0.45, label:'Wardrobe', icon:'👔', action:openWardrobeSpot },
        { id:'vault', x:W*0.62, y:H*0.45, label:'Vault', icon:'🔒', action:openVault },
      ];
      case 'civic': return [{ id:'council', x:W/2, y:H*0.44 + 34, label:'Council Table', icon:'🏛️', action:()=>
        showRoomBrief(room, interior.name, 'Twelve chairs, one gavel, and a seating plan that tells you who owes whom.', briefRow('Your influence', formatCount(state.influence)) + briefRow('Elected office', state.electedOffice ? 'Yours' : 'Not yet')) }];
      case 'casino': return [{ id:'vip-table', x:W/2, y:H*0.38 + 40, label:'High-Roller Table', icon:'🂡', action:function(){
        showModal({ eyebrow:room, title:'Five Thousand a Hand', body:"<p class='flavor'>The cards are the same upstairs. The stakes aren't.</p>" + briefRow('Your cash', formatMoney(state.cash)), buttons:[
          { label:'Play at $5,000', cost:5000, onClick:function(){ casinoStake = 5000; openCasinoFloor(); } },
          { label:'Watch a hand', secondary:true },
        ] });
      } }];
      case 'newsroom': return [{ id:'editor', x:W/2, y:80, label:"Editor's Desk", icon:'📰', action:()=>
        showRoomBrief(room, interior.name, "Proofs, a cold coffee and tomorrow's front page, face down.", briefRow('Your respect', formatCount(state.respect))) }];
      case 'executive': return [{ id:'boardroom', x:W/2, y:H*0.44 + 34, label:'Boardroom', icon:'📈', action:()=>
        showRoomBrief(room, interior.name, 'A long table, a long view, and nobody in the chairs but you.', briefRow('Income', formatMoneyRate(netIncome()))) }];
      case 'mall': return mallUpperSpots();
      default: return [];
    }
  }
  function changeFloor(floor: number): void {
    const interior = state.currentInterior;
    if(!interior) return;
    const plan = planFor(interior);
    interior.floor = Math.max(0, Math.min(plan.floors.length - 1, floor));
    const stairs = plan.stairs;
    const landing = stairsLanding(plan);
    if(stairs && landing){ player.x = landing.x + 30; player.y = landing.y; }
    player.vx = 0; player.vy = 0;
    log(`<i aria-hidden="true" class="ph-duotone ph-stairs"></i> ${plan.floors[interior.floor].name}.`);
    renderAll();
  }

  // LEGAL: ---- The mall's hall: the kiosks, the food court and the play area ----
  // LEGAL: Up the escalator: an arcade and a cinema.
  function mallUpperSpots(): HotSpot[] {
    return [
      { id:'arcade', ...MALL_UPPER_SPOTS.arcade, label:'Arcade', icon:'🕹️', action:function(){
        showModal({ eyebrow:'Lakeridge Mall', title:'The Arcade', body:"<p class='flavor'>A row of cabinets older than the kids playing them, and one claw machine nobody has ever beaten.</p>", buttons:[
          { label:'Feed the claw machine ($5)', cost:5, onClick:function(){ state.cash -= 5; const won = Math.random() < 0.12; log(won ? '<i aria-hidden="true" class="ph-duotone ph-game-controller"></i> The claw holds. A plush raccoon in a tiny suit is yours.' : '<i aria-hidden="true" class="ph-duotone ph-game-controller"></i> The claw drops it at the last second. Of course it does.'); if(won) state.worldMemory.arcadePrize = 'raccoon'; renderAll(); } },
          { label:'Walk on', secondary:true },
        ] });
      } },
      { id:'cinema', ...MALL_UPPER_SPOTS.cinema, label:'Cinema', icon:'🎬', action:function(){
        showModal({ eyebrow:'Lakeridge Mall', title:'Lakeridge Six', body:"<p class='flavor'>Six screens. Five of them are showing the same car chase.</p>", buttons:[
          { label:'Catch a film ($12)', cost:12, onClick:function(){ state.cash -= 12; state.playSeconds += 60; state.heat = Math.max(0, state.heat - 2); log('<i aria-hidden="true" class="ph-duotone ph-film-strip"></i> Two hours in the dark. Nobody looks for you at a matinee: heat -2.'); renderAll(); } },
          { label:'Not today', secondary:true },
        ] });
      } },
    ];
  }
  function openPerfumeKiosk(): void {
    showModal({ eyebrow:'Lakeridge Mall', title:'The Perfume Kiosk', body:"<p class='flavor'>She's out from behind the counter before you can change course, tester raised. \"Just one spray. It's called <em>Ambition</em>. It suits you, I can tell.\"</p>", buttons:[
      { label:'Buy a bottle ($85)', cost:85, onClick:function(){ state.cash -= 85; state.respect += 2; state.worldMemory.cologne = 'ambition'; log('<i aria-hidden="true" class="ph-duotone ph-drop"></i> You walk off smelling of Ambition. People lean in a little when you talk: respect +2.'); renderAll(); scheduleSave(); } },
      { label:'Let her spray you', onClick:function(){ log('<i aria-hidden="true" class="ph-duotone ph-drop"></i> One spray, then three more "so you get the full effect". You smell expensive for about an hour.'); } },
      { label:'Keep walking', secondary:true },
    ] });
  }
  function openIceCreamCart(): void {
    showModal({ eyebrow:'Lakeridge Mall', title:'Ice Cream', body:"<p class='flavor'>Three tubs under a pink umbrella: vanilla, mango, and chocolate. The man behind the cart has opinions about mango.</p>", buttons:[
      { label:'A mango cone ($6)', cost:6, onClick:function(){ state.cash -= 6; state.playSeconds += 15; log('<i aria-hidden="true" class="ph-duotone ph-ice-cream"></i> You eat a mango cone by the fountain. He was right about the mango.'); renderAll(); } },
      { label:'Not today', secondary:true },
    ] });
  }
  function openFoodCourt(): void {
    showModal({ eyebrow:'Lakeridge Mall', title:'The Food Court', body:"<p class='flavor'>Noodles on one side, pizza by the slice on the other, and a lunchtime crowd nobody looks twice at.</p>", buttons:[
      { label:'Sit down with a plate ($14)', cost:14, onClick:function(){ state.cash -= 14; state.playSeconds += 30; state.heat = Math.max(0, state.heat - 3); log('<i aria-hidden="true" class="ph-duotone ph-bowl-food"></i> Half an hour in the lunch crowd. Nobody is looking for you here: heat -3.'); renderAll(); } },
      { label:'Keep walking', secondary:true },
    ] });
  }
  function openPlayArea(): void {
    showModal({ eyebrow:'Lakeridge Mall', title:'The Play Area', body:"<p class='flavor'>Kids going down the slide head first, a ball pit that is mostly socks, and parents on the bench pretending to read. One of them nods at you like you're somebody's dad.</p>", buttons:[
      { label:'Sit on the bench a while', onClick:function(){ state.playSeconds += 20; state.heat = Math.max(0, state.heat - 1); log('<i aria-hidden="true" class="ph-duotone ph-baby"></i> You sit with the parents for a bit. It is the calmest twenty seconds of your week.'); renderAll(); } },
      { label:'Move on', secondary:true },
    ] });
  }

  function enterBuilding(kind: string, refId: string, name: string){
    if(state.inVehicle) exitVehicle();
    state.currentInterior = { kind, refId, name, returnX:player.x, returnY:player.y, returnDistrict:state.currentDistrict, floor:0 };
    const door = doorLocal();
    player.x = door.x; player.y = door.y - 40; player.facing = -Math.PI/2; player.vx=0; player.vy=0;
    Object.keys(keys).forEach(k=> keys[k]=false);
    lastFrame2 = Date.now();
    log(`🚪 You step into ${name}.`);
    renderAll();
  }
  function exitBuilding(){
    const ret = state.currentInterior;
    if(!ret) return;
    state.currentInterior = null;
    player.x = ret.returnX; player.y = ret.returnY; player.facing = Math.PI/2; player.vx=0; player.vy=0;
    Object.keys(keys).forEach(k=> keys[k]=false);
    lastFrame2 = Date.now();
    renderAll();
  }

  // LEGAL: ---- vehicle: explicit enter/exit, matches the "Enter Vehicle" prompt pattern ----
  function enterVehicle(){
    const car = getEquippedCar();
    if(!car) return;
    // LEGAL: A broken-down used car will not start until it is repaired at its lot.
    if(state.brokenCars.includes(car.id)){
      const message = `The ${car.name} is broken down. Get it repaired at ${brandById(car.brand)?.name ?? 'the lot'}.`;
      log(`<i aria-hidden="true" class="ph-duotone ph-wrench"></i> ${message}`);
      showMapToast(message);
      return;
    }
    state.inVehicle = true;
    flyingUntil = 0; // LEGAL: the rocketman jetpack doesn't come with you into a car.
    const bayNow = garageBayRect();
    carWasInBay = !!bayNow && isCarInBay({ x: player.x, y: player.y }, bayNow);
    state.carParkedAt = null; // LEGAL: you are driving it; the garage clock stops.
    player.vx=0; player.vy=0;
    // LEGAL: A car is much wider than a pedestrian (radius 8 -> 24), so the spot you walked
    // LEGAL: to may sit inside a building's bounds once you're driving. Nudge clear on entry
    // LEGAL: rather than spawning the car already wedged.
    const free = nearestFreePoint(player.x, player.y, currentSolids, true);
    if(free){ player.x = free.x; player.y = free.y; }
    refreshPlayerModel(); updateParkedCarMesh();
    log('You get in.');
    renderAll();
  }
  function exitVehicle(){
    if(!state.inVehicle) return;
    state.inVehicle = false;
    player.vx=0; player.vy=0;
    state.parkedCarPos[state.currentDistrict] = { x:player.x, y:player.y };
    // LEGAL: Start the return-to-garage clock. The car stays exactly here for a few
    // LEGAL: minutes, then goes home so you can never strand your only car.
    state.carParkedAt = state.playSeconds;
    refreshPlayerModel(); updateParkedCarMesh();
    log(`You park up and get out. It'll head back to the garage in about ${Math.round(GARAGE_RETURN_SECONDS/60)} minutes.`);
    renderAll();
  }

  // LEGAL: Launches the amenity's skill minigame overlay and, once it resolves, applies
  // LEGAL: the suggested reward to game state. The minigame module owns presentation and
  // LEGAL: input only; all cash/respect mutation and persistence stays here.
  function runAmenityMinigame(amenity: typeof mapAmenities[number]){
    // LEGAL: Only the court and the chess tables are skill games; shops wire their own
    // LEGAL: buy modals and never call playGame. Narrows amenity.kind to a MinigameKind.
    if(amenity.kind !== 'basketball' && amenity.kind !== 'parkgame') return;
    void playMinigame(THREE, amenity.kind, amenity.name).then(function(res: MinigameResult){
      if(res.reward.cash) state.cash += res.reward.cash;
      if(res.reward.respect) state.respect += res.reward.respect;
      if(res.message) log(res.message);
      renderAll();
      scheduleSave();
      // LEGAL: How it went, on screen. The game used to just vanish (its line was too minor for the
      // LEGAL: street log), which read as the game crashing.
      if(!res.max) return;
      const gains = [res.reward.cash ? `+${formatMoney(res.reward.cash)}` : '', res.reward.respect ? `respect +${res.reward.respect}` : ''].filter(Boolean).join(' · ');
      showModal({ eyebrow:amenity.name, title:`${res.score} of ${res.max}`, body:`<p class="flavor">${res.message}</p>${gains ? briefRow('You get', gains) : ''}`, buttons:[
        { label:'Again', onClick:function(){ runAmenityMinigame(amenity); } },
        { label:'Done', secondary:true },
      ] });
    });
  }
  function openAmenityPanel(amenity: typeof mapAmenities[number]){
    showModal(createAmenityModal(amenity, {
      addRespect:function(amount){ state.respect += amount; },
      spendCash:function(amount){ if(state.cash < amount) return false; state.cash -= amount; return true; },
      log,
      renderAll,
      playGame:runAmenityMinigame,
    }));
  }

  const CHEAT_CASH = 1_000_000_000;
  const CHEAT_WEATHER_SECONDS = 90;
  const CHEAT_FLIGHT_SECONDS = 60;
  const CHEAT_DRUNK_SECONDS = 45;
  const FLIGHT_ALTITUDE = 80;
  let flyingUntil = 0;
  let drunkUntil = 0;
  let flightHeight = 0;
  let wasFlying = false;
  // LEGAL: How tall the buildings are, for flying. Flying ignored every building on the idea that you
  // LEGAL: were over the roofs, but the towers stand up to 450 tall against a flight height of 80,
  // LEGAL: so you flew straight through them. Now you climb over what's ahead, and can't fly into a
  // LEGAL: building taller than you are yet.
  let tallSolidsCache: Array<Solid & { h: number }> | null = null;
  function tallSolids(): Array<Solid & { h: number }> {
    tallSolidsCache ??= [
      ...cityLots().map(lot => ({ ...lotSolid(lot), h:lot.h })),
      ...mallSolids().map(solid => ({ ...solid, h:MALL_BODY.h + 25 })),
    ].filter(solid => solid.h > FLIGHT_ALTITUDE - 20);
    return tallSolidsCache;
  }
  function roofHeightNear(x: number, y: number, margin: number): number {
    let top = 0;
    for(const solid of tallSolids()) if(Math.abs(x - solid.x) < solid.hw + margin && Math.abs(y - solid.y) < solid.hd + margin) top = Math.max(top, solid.h);
    return top;
  }
  let bigHeads = false;
  function isFlying(): boolean {
    if(state.currentInterior) return false;
    return state.playSeconds < flyingUntil || (state.inVehicle && isFlyingVehicle(state.equippedCar));
  }
  function isDrunk(): boolean { return state.playSeconds < drunkUntil; }
  function updateCheatEffects(dt: number): void {
    const flying = isFlying();
    // LEGAL: Climb over the roofs about a second ahead of where you're heading.
    const ahead = flying ? roofHeightNear(player.x + player.vx * 1.1, player.y + player.vy * 1.1, 30) : 0;
    const target = flying ? Math.max(FLIGHT_ALTITUDE, ahead + 30) : 0;
    flightHeight += (target - flightHeight) * (1 - Math.exp(-(target > flightHeight ? 4 : 3) * dt));
    // LEGAL: Coming down over a roof or the lake sets you down on the nearest open ground.
    if(wasFlying && !flying){
      const free = nearestFreePoint(player.x, player.y, currentSolids, state.inVehicle, 600);
      if(free){ player.x = free.x; player.y = free.y; }
    }
    wasFlying = flying;
    const rotor = playerGroup.getObjectByName('rotor');
    if(rotor) rotor.rotation.y += dt * 28;
    const wantJetpack = flying && !state.inVehicle;
    let jetpack = playerGroup.getObjectByName('jetpack');
    if(wantJetpack && !jetpack){ jetpack = buildJetpack(THREE); (playerGroup.getObjectByName('person-body') ?? playerGroup.children[0])?.add(jetpack); }
    if(!wantJetpack && jetpack) jetpack.parent?.remove(jetpack);
    if(wantJetpack && jetpack) jetpack.traverse(function(node){ if(node.name === 'jetpack-flame') node.scale.y = 0.75 + Math.random() * 0.6; });
    byId('scene3d-container').classList.toggle('drunk', isDrunk());
  }
  // LEGAL: Waypoint first; with none set, a random countryside place, dropped at its gate.
  function teleportCheat(): void {
    if(state.currentInterior) exitBuilding();
    const wp = currentWaypoint();
    const lots = Object.values(OUTSKIRT_PLACE_LOTS);
    const target = wp || (function(){ const lot = lots[Math.floor(Math.random() * lots.length)]; return { x:lot.x, y:lot.y + 130 }; })();
    const free = nearestFreePoint(target.x, target.y, currentSolids, state.inVehicle, 400) || target;
    player.x = free.x; player.y = free.y; player.vx = 0; player.vy = 0;
  }
  function giveCheatVehicle(id: string): void {
    if(state.currentInterior) exitBuilding();
    state.equippedCar = id;
    state.inVehicle = true;
    flyingUntil = 0;
    state.carParkedAt = null;
    refreshPlayerModel(); updateParkedCarMesh();
  }
  // LEGAL: Seconds to add to the clock so it lands on a given hour.
  function secondsUntilHour(hour: number): number {
    return ((((hour / 24) - mapDayFraction()) % 1) + 1) % 1 * MAP_DAY_SECONDS;
  }
  function setCheatWeather(kind: 'clear' | 'rain' | 'snow'): void {
    weatherOverride = { kind, until:state.playSeconds + CHEAT_WEATHER_SECONDS };
  }
  // LEGAL: Every cheat, in the order the `cheatcode` list shows them.
  const CHEATS: Array<{ codes: string[]; effect: string; apply: () => void }> = [
    { codes:['moneymoneymoney', 'cash4ever'], effect:`${formatMoney(CHEAT_CASH)} in your pocket`, apply:function(){ state.cash += CHEAT_CASH; } },
    { codes:['cleanrecord'], effect:'Heat and investigation wiped to zero', apply:function(){ state.heat = 0; state.investigation = 0; } },
    { codes:['respectme'], effect:'+5,000 respect', apply:function(){ state.respect += 5000; } },
    { codes:['daylight'], effect:'Skip to noon', apply:function(){ clockOffsetSeconds += secondsUntilHour(12); } },
    { codes:['nightowl'], effect:'Skip to midnight', apply:function(){ clockOffsetSeconds += secondsUntilHour(0); } },
    { codes:['letitrain'], effect:'Rain for a while', apply:function(){ setCheatWeather('rain'); } },
    { codes:['letitsnow'], effect:'Snow for a while', apply:function(){ setCheatWeather('snow'); } },
    { codes:['clearskies'], effect:'Clear skies for a while', apply:function(){ setCheatWeather('clear'); } },
    { codes:['beammeup'], effect:'Teleport to your waypoint (or somewhere out of town)', apply:teleportCheat },
    { codes:['rocketman'], effect:'Fly over everything for a minute', apply:function(){ flyingUntil = state.playSeconds + CHEAT_FLIGHT_SECONDS; } },
    { codes:['getdachoppa'], effect:'A helicopter, and you are already flying it', apply:function(){ giveCheatVehicle('cheat-helicopter'); } },
    { codes:['bigdumper'], effect:'A dump truck. Why not', apply:function(){ giveCheatVehicle('cheat-dumptruck'); } },
    { codes:['liquidcourage'], effect:'Drunk: wobbly legs, wavy vision', apply:function(){ drunkUntil = state.playSeconds + CHEAT_DRUNK_SECONDS; } },
    { codes:['bigheadmode'], effect:'Everyone gets a giant head (type again to undo)', apply:function(){ bigHeads = !bigHeads; characterLibrary?.animator.setHeadScale(bigHeads ? 2.1 : 1); } },
  ];
  function showCheatList(): void {
    const rows = CHEATS.map(cheat => `<div class="row"><span><strong>${cheat.codes.join('</strong> or <strong>')}</strong></span><span>${cheat.effect}</span></div>`).join('');
    showModal({ eyebrow:'Cheat codes', title:'Type one anywhere in the game', body:rows, buttons:[{ label:'Got it' }] });
  }
  const cheats = createCheatListener(['cheatcode', ...CHEATS.flatMap(cheat => cheat.codes)]);
  function runCheat(code: string): void {
    if(code === 'cheatcode'){ showCheatList(); return; }
    const cheat = CHEATS.find(c => c.codes.includes(code));
    if(!cheat) return;
    cheat.apply();
    log(`<i aria-hidden="true" class="ph-duotone ph-magic-wand"></i> Cheat activated: ${cheat.effect}.`);
    refreshHUD();
    scheduleSave();
  }
  window.addEventListener('keydown', function(e){
    const k = e.key.toLowerCase();
    const typingInField = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    const code = typingInField ? null : cheats.feed(e.key);
    if(code) runCheat(code);
    if(k==='escape' && deviceOpen()){ closeDevice(); return; }
    keys[k] = true;
    if(k==='e') tryInteract();
  });
  window.addEventListener('keyup', function(e){ keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', function(){ Object.keys(keys).forEach(k=> keys[k]=false); touchStick.release(); });
  byId('btn-interact').addEventListener('click', tryInteract);
  byId('touch-interact').addEventListener('click', tryInteract);

  function setMapFullscreenLayout(container: HTMLElement, active: boolean): void {
    if(active){
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.right = '0';
      container.style.bottom = '0';
      container.style.width = '100vw';
      container.style.height = '100vh';
      document.body.style.overflow = 'hidden';
    } else {
      container.style.position = '';
      container.style.top = '';
      container.style.left = '';
      container.style.right = '';
      container.style.bottom = '';
      container.style.width = '';
      container.style.height = '';
      document.body.style.overflow = '';
    }
  }
  function syncMapFullscreenUi(active: boolean): void {
    const container = byId<HTMLElement>('scene3d-container');
    container.classList.toggle('fullscreen', active);
    setMapFullscreenLayout(container, active);
    const btn = byId('fullscreen-btn');
    btn.innerHTML = active ? '<i aria-hidden="true" class="ph-duotone ph-arrows-in"></i>' : '<i aria-hidden="true" class="ph-duotone ph-arrows-out"></i>';
    requestAnimationFrame(syncRendererSize);
  }
  byId('fullscreen-btn').addEventListener('click', function(){
    const container = byId<HTMLElement>('scene3d-container');
    syncMapFullscreenUi(!container.classList.contains('fullscreen'));
  });
  window.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    const cityOverlay = byIdOrNull('citymap-overlay');
    if(cityMapOpen || (cityOverlay && !cityOverlay.classList.contains('hidden'))){
      closeCityMap();
      e.preventDefault();
      return;
    }
    const container = byId<HTMLElement>('scene3d-container');
    if(container.classList.contains('fullscreen')) syncMapFullscreenUi(false);
  });
  window.addEventListener('resize', function(){
    const container = byId<HTMLElement>('scene3d-container');
    if(container.classList.contains('fullscreen')) setMapFullscreenLayout(container, true);
    syncRendererSize();
  });
  window.visualViewport?.addEventListener('resize', function(){
    const container = byId<HTMLElement>('scene3d-container');
    if(container.classList.contains('fullscreen')) setMapFullscreenLayout(container, true);
    syncRendererSize();
  });

  type MapMarker =
    | { type: 'door'; ref: { label: string } }
    | { type: 'hotspot'; ref: ReturnType<typeof hotspotsFor>[number] }
    | { type: 'car'; ref: Point }
    | { type: 'building'; ref: typeof mapBuildings[number] }
    | { type: 'service'; ref: ServiceBuilding }
    | { type: 'npc'; ref: typeof mapNpcs[number] }
    | { type: 'gangnpc'; ref: GangRecruit }
    | { type: 'local'; ref: LocalBusiness }
    | { type: 'amenity'; ref: typeof mapAmenities[number] }
    | { type: 'corner'; ref: Corner }
    | { type: 'property'; ref: PropertyPlace };
  function nearestMarker(): MapMarker | null {
    if(state.currentInterior){
      let best: MapMarker | null = null, bestDist=46;
      const door = doorLocal();
      const dDoor = Math.hypot(player.x-door.x, player.y-door.y);
      // LEGAL: The way out is on the ground floor.
      if(dDoor<bestDist && !(state.currentInterior.floor ?? 0)){ bestDist=dDoor; best={type:'door', ref:{label:'Exit'}}; }
      hotspotsFor(state.currentInterior).forEach(h=>{
        const d = Math.hypot(player.x-h.x, player.y-h.y);
        if(d<bestDist){ bestDist=d; best={type:'hotspot', ref:h}; }
      });
      return best;
    }
    if(state.inVehicle) return null;
    // LEGAL: Doors beat the parked car on a contested press. The car used to be tested first
    // LEGAL: and won every tie, so standing at your own garage door — where the car is parked
    // LEGAL: by design — pressing interact got you INTO the car instead of into the garage.
    // LEGAL: You can always reach the car by walking to it; you cannot reach a door any other
    // LEGAL: way, so the door is the safer thing to resolve a tie towards.
    const REACH = 46;
    let best: MapMarker | null = null;
    let bestDist = REACH;
    const place = nearestPlaceAtPoint(mapPlaces, { x: player.x, y: player.y }, REACH);
    if(place?.sourceObject){
      best = { type:place.sourceObject.kind, ref:place.sourceObject.ref } as MapMarker;
      bestDist = Math.hypot(player.x - place.x, player.y - place.y);
    }
    const car = getEquippedCar();
    if(car){
      const parked = parkedCarPositionForDistrict(state.parkedCarPos, state.currentDistrict);
      const d = Math.hypot(player.x-parked.x, player.y-parked.y);
      // LEGAL: The car takes a contested press only when it is CLEARLY the nearer thing. With no
      // LEGAL: door in reach there is no contest, and the margin used to leave the car unreachable.
      if(d < (best ? bestDist - 14 : REACH)) best = { type:'car', ref:parked };
    }
    return best;
  }
  function tryInteract(){
    if(!mapActive) return;
    // LEGAL: A minigame or the phone owns all input while it's up — don't trigger the
    // LEGAL: door/hotspot/amenity behind it (the overlay also stops Space at capture).
    if(minigameOpen() || deviceOpen()) return;
    if(state.currentInterior){
      const m = nearestMarker();
      if(!m) return;
      if(m.type==='door') exitBuilding(); else if(m.type==='hotspot'){ beginCloseUp(m.ref); m.ref.action(); }
      return;
    }
    if(state.inVehicle){ exitVehicle(); return; }
    const m = nearestMarker();
    if(!m) return;
    if(m.type==='corner' || m.type==='amenity'){
      const missionId = activeMissionForObjectId(m.ref.id);
      if(missionId){ resolveMissionAtObjective(missionId); return; }
    }
    if(m.type==='car') enterVehicle();
    else if(m.type==='building') enterBuilding('venture', m.ref.id, m.ref.biz.name);
    else if(m.type==='service') enterBuilding(m.ref.kind, m.ref.id, m.ref.name);
    else if(m.type==='local') enterBuilding('local', m.ref.id, m.ref.name);
    else if(m.type==='amenity') openAmenityPanel(m.ref);
    else if(m.type==='corner') openCornerPanel(m.ref);
    else if(m.type==='gangnpc') playDialogue(m.ref.dialogueKey, m.ref.inducted ? 'checkin' : 'start');
    else if(m.type==='npc' && m.ref.type==='named') playDialogue(m.ref.id, npcOpeningNode(m.ref.id));
    else if(m.type==='npc') proceduralInteract();
    else if(m.type==='property') openPropertyPlace(m.ref);
  }

  function currentSpeed(){
    if(state.currentInterior) return 150;
    // LEGAL: The rocketman cheat: a jetpack is a lot faster than legs.
    if(!state.inVehicle && isFlying()) return 150 * 2.6;
    if(state.inVehicle){
      const car = getEquippedCar();
      return 210 * (car ? car.speedMult : 1) * offRoadSpeedMultiplier({ x:player.x, y:player.y }, car?.brand);
    }
    return 150;
  }
  function tryMove(nx: number, ny: number, solids: Solid[]){
    // LEGAL: Flying (the rocketman cheat or the helicopter) clears every building and the water;
    // LEGAL: only the edge of the world still stops you.
    if(isFlying()){
      const b = windhavenMapModel.landBounds;
      if(roofHeightNear(nx, ny, 6) > flightHeight - 4) return false;
      return nx > b.minX - 300 && nx < b.maxX + 300 && ny > b.minY - 300 && ny < b.maxY + 300;
    }
    // LEGAL: The crossing used to be checked only while driving, so on foot you walked
    // LEGAL: straight through a moving train. Four cars of rolling stock stop a pedestrian
    // LEGAL: rather more decisively than they stop a car; radius follows the actor.
    const trainBlock = trainCrossingBlockAtPoint({ x:nx, y:ny }, Date.now(), actorRadius(state.inVehicle));
    if(trainBlock){
      const now = Date.now();
      if(now - lastTrainWarningAt > 3500){
        lastTrainWarningAt = now;
        log(`<i aria-hidden="true" class="ph-duotone ph-train"></i> Train crossing blocked at ${trainBlock.road.name}. Wait for it to clear.`);
      }
      return false;
    }
    return canMoveTo(nx, ny, solids, state.inVehicle);
  }

  // LEGAL: ================= THREE.JS SCENE =================
  type ThreeModule = typeof ThreeNamespace;
  type DisposableMaterial = ThreeNamespace.Material & { map?: ThreeNamespace.Texture };
  let THREE: ThreeModule;
  let mergeSceneryGeometries: MergeGeometries | null = null;
  // LEGAL: Only the resort: it was ~1,900 of ~5,000 scene objects (measured 2026-10-17; merging
  // LEGAL: it took idle fps from ~44 to ~56). Trees, outskirts, filler and landmarks were tried too
  // LEGAL: and saved nothing measurable, so they stay as authored.
  // LEGAL: Static pieces built as hundreds of separate meshes, merged into one group each.
  const LOOSE_SCENERY_PREFIXES = ['road:', 'bridge:', 'sign:', 'tree:street', 'trail:'];
  const MERGEABLE_SCENERY_PREFIXES = ['resort:', 'filler:construction:', 'crane:', 'suburb:', 'outskirt:'];
  let scene: ThreeNamespace.Scene, camera3d: ThreeNamespace.PerspectiveCamera, renderer: ThreeNamespace.WebGLRenderer, worldGroup: ThreeNamespace.Group, playerGroup: ThreeNamespace.Group, ambientLight: ThreeNamespace.HemisphereLight, sunLight: ThreeNamespace.DirectionalLight, moonLight: ThreeNamespace.DirectionalLight, waypointBeacon: ThreeNamespace.Group | null = null, missionObjectiveMarker: ThreeNamespace.Group | null = null, parkedCarMesh: ThreeNamespace.Group | null = null, trainGroup: ThreeNamespace.Group | null = null;
  let missionObjectiveMarkerKey = '';
  let streetLamps: LampHead[] = [];
  // LEGAL: See nearestLamps: a fixed pool, so the shader light count never changes at runtime.
  const LAMP_LIGHT_POOL_SIZE = 6;
  let lampLightPool: ThreeNamespace.PointLight[] = [];
  let weatherPoints: ThreeNamespace.Points | null = null;
  let activeWeather: 'clear' | 'rain' | 'snow' = 'clear';
  let lastTrainWarningAt = 0;
  const MAP_DAY_SECONDS = 240;
  const MAP_START_HOUR = 10;
  // LEGAL: Shifted by the time cheats. A separate offset, because event timers also run off
  // LEGAL: playSeconds and jumping that forward would fire them early.
  let clockOffsetSeconds = 0;
  function mapDayFraction(): number {
    return (((state.playSeconds + clockOffsetSeconds) / MAP_DAY_SECONDS) + MAP_START_HOUR / 24) % 1;
  }

  function syncRendererSize(): void {
    if(!renderer || !camera3d) return;
    const container = byId('scene3d-container');
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera3d.aspect = width / height;
    camera3d.updateProjectionMatrix();
  }

  function disposeObj(o: ThreeNamespace.Object3D){
    const mesh = o as ThreeNamespace.Mesh;
    if(mesh.geometry) mesh.geometry.dispose();
    if(mesh.material){
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m: DisposableMaterial)=>{ if(m.map) m.map.dispose(); m.dispose(); });
    }
  }
  function clearGroup(g: ThreeNamespace.Group){ while(g.children.length){ const c=g.children.pop(); if(c) c.traverse(disposeObj); } }

  function box(w: number, h: number, d: number, color: number | string){
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({color, roughness:0.85, metalness:0.05}));
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function addSign(parent: ThreeNamespace.Object3D, text: string, w: number, h: number, y: number, color: string){
    const c = document.createElement('canvas'); c.width=2048; c.height=256;
    const cctx = c.getContext('2d')!;
    cctx.fillStyle='rgba(10,11,16,0.85)'; cctx.fillRect(0,0,2048,256);
    cctx.fillStyle=color; cctx.textAlign='center'; cctx.textBaseline='middle';
    // LEGAL: Fit the name to the canvas instead of trusting a fixed size. At the old flat
    // LEGAL: 120px, anything past ~31 characters overflowed 2048px and was clipped at both
    // LEGAL: ends, which is why long names ("Rentport City National — Devlin Branch") read
    // LEGAL: as having no sign at all. Shrink to fit, and only then truncate.
    const label = text.slice(0, 42);
    let fontSize = 120;
    cctx.font = `bold ${fontSize}px sans-serif`;
    while(fontSize > 54 && cctx.measureText(label).width > 1960){
      fontSize -= 4;
      cctx.font = `bold ${fontSize}px sans-serif`;
    }
    cctx.fillText(label, 1024, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, depthTest:false}));
    sprite.scale.set(w * 4, h * 2, 1); sprite.position.y = y;
    parent.add(sprite);
  }
  function buildPedestrianModel(color: number | string, identity = 'person'){
    return characterLibrary!.create(identity, String(color));
  }
  // LEGAL: Bikes were being built by buildCarModel, so a chopper rendered as a small
  // LEGAL: saloon complete with windscreen and four wheels. Anything sold by a `bike`
  // LEGAL: brand gets a real two-wheeler instead.
  function isBikeCar(car: Car){ return brandById(car.brand)?.category === 'bike'; }

  // LEGAL: The Blender bikes (art/blender/vehicles.py) with the real, dressed Arjun on them; the
  // LEGAL: procedural bike below is the fallback if the models fail to load.
  let riderParts: ReturnType<typeof createPersonParts> | null = null;
  function buildBikeModel(car: Car, withRider: boolean){
    const cls = vehicleClassForCar(car.id);
    if(vehicleLibrary && cls && cls in BIKE_SEATS){
      const outer = new THREE.Group();
      outer.add(vehicleLibrary.create(cls, car.color, car.len, car.wid));
      if(withRider){
        riderParts ??= createPersonParts(THREE);
        outer.add(seatedRider(THREE, riderParts, state.appearance, cls as BikeClass));
      }
      return outer;
    }
    const g = new THREE.Group();
    const wheelR = 6.5;
    const wheelMat = new THREE.MeshStandardMaterial({color:'#141414', roughness:0.85});
    const chromeMat = new THREE.MeshStandardMaterial({color:'#b9bcc4', metalness:0.85, roughness:0.22});
    const bodyMat = new THREE.MeshStandardMaterial({color:car.color, metalness:0.35, roughness:0.42});

    // LEGAL: Two wheels in line along the length axis (+X is forward, matching the car
    // LEGAL: models). A TorusGeometry already lies in the XY plane with its normal along
    // LEGAL: Z — which IS a wheel seen from the side — so it must NOT be rotated. Rotating
    // LEGAL: it put both wheels across the bike and made it read as facing sideways.
    const frontX = car.len*0.42, rearX = -car.len*0.42;
    [frontX, rearX].forEach(function(wx){
      const tyre = new THREE.Mesh(new THREE.TorusGeometry(wheelR, 2.1, 10, 20), wheelMat);
      tyre.position.set(wx, wheelR, 0); tyre.castShadow = true; g.add(tyre);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(wheelR*0.36, wheelR*0.36, 1.6, 12), chromeMat);
      hub.position.set(wx, wheelR, 0); hub.rotation.x = Math.PI/2; g.add(hub);
      // LEGAL: A few spokes so the wheel reads as a wheel at map zoom.
      for(let i = 0; i < 4; i += 1){
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(wheelR*1.7, 0.7, 0.7), chromeMat);
        spoke.position.set(wx, wheelR, 0); spoke.rotation.z = (i/4) * Math.PI; g.add(spoke);
      }
    });

    // LEGAL: Low frame spine linking the two wheels, engine slung underneath it.
    const spine = new THREE.Mesh(new THREE.BoxGeometry(car.len*0.66, 2.2, 2.2), chromeMat);
    spine.position.set(0, wheelR + 5.5, 0); g.add(spine);
    const engine = new THREE.Mesh(new THREE.BoxGeometry(car.len*0.26, 7.5, car.wid*0.62), new THREE.MeshStandardMaterial({color:'#23272e', roughness:0.55, metalness:0.4}));
    engine.position.set(-car.len*0.02, wheelR + 1.5, 0); g.add(engine);

    // LEGAL: Teardrop tank over the engine, seat stepping down behind it.
    const tank = new THREE.Mesh(new THREE.SphereGeometry(4.4, 14, 12), bodyMat);
    tank.scale.set(1.7, 0.82, 1.0); tank.position.set(car.len*0.10, wheelR + 8, 0); g.add(tank);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(car.len*0.30, 2.6, car.wid*0.62), new THREE.MeshStandardMaterial({color:'#15161a', roughness:0.95}));
    seat.position.set(-car.len*0.20, wheelR + 7.2, 0); g.add(seat);
    const tailRise = new THREE.Mesh(new THREE.BoxGeometry(car.len*0.10, 4, car.wid*0.58), bodyMat);
    tailRise.position.set(-car.len*0.36, wheelR + 8, 0); g.add(tailRise);

    // LEGAL: Raked front forks running down to the front axle, bars across the top, and a
    // LEGAL: headlamp at the very front so the direction of travel is unmistakable.
    [-1, 1].forEach(function(side){
      const fork = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 17, 6), chromeMat);
      fork.position.set(frontX - 2.2, wheelR + 6, side * 2.2);
      fork.rotation.z = 0.42; g.add(fork);
    });
    const bars = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, car.wid*1.7, 6), chromeMat);
    bars.position.set(frontX - 4.5, wheelR + 13, 0); bars.rotation.x = Math.PI/2; g.add(bars);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 10), new THREE.MeshStandardMaterial({color:'#ffe9b0', emissive:'#ffd97a', emissiveIntensity:0.7}));
    lamp.name = 'lamp:head';
    lamp.position.set(frontX + 1.4, wheelR + 10, 0); g.add(lamp);
    const guard = new THREE.Mesh(new THREE.TorusGeometry(wheelR + 2.4, 1.1, 6, 12, Math.PI*0.55), bodyMat);
    guard.position.set(frontX, wheelR, 0); guard.rotation.z = Math.PI*0.22; g.add(guard);

    // LEGAL: Exhaust down the right flank, and a red tail lamp.
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.0, car.len*0.55, 8), chromeMat);
    pipe.position.set(-car.len*0.12, 5.5, car.wid*0.40); pipe.rotation.z = Math.PI/2; g.add(pipe);
    const tailLamp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 3), new THREE.MeshStandardMaterial({color:'#b02a3a', emissive:'#8a1020', emissiveIntensity:0.6}));
    tailLamp.position.set(rearX - 1.5, wheelR + 8, 0); g.add(tailLamp);

    // LEGAL: A rider, because a bike has no cabin to hide you in — an empty motorcycle
    // LEGAL: driving itself is the giveaway. Modelled facing +x like the bike, seated:
    // LEGAL: hips on the seat, torso pitched forward toward the bars, arms reaching them,
    // LEGAL: legs folded down to the pegs. Uses the player's own palette so the rider
    // LEGAL: matches the pedestrian you were a moment ago.
    // LEGAL: Built from the SAME palette and features as buildPedestrianModel with the
    // LEGAL: same identity ('arjun'), so the rider is visibly the person who was walking a
    // LEGAL: moment ago: cream coat body and arms, skin head with hair, dark shoes. The
    // LEGAL: first attempt invented a black jacket and a helmet and used look.shirt (a dark
    // LEGAL: accent) for the torso, which read as a different, much darker character.
    const worn = state.appearance;
    const look = { coat:worn.topColor, shirt:worn.shirtColor, skin:worn.skin, hair:worn.hairColor, pants:worn.pantsColor, scaleX:1, scaleY:1 };
    const coatMat = new THREE.MeshStandardMaterial({color: look.coat, roughness:0.74});
    const skinMat = new THREE.MeshStandardMaterial({color: look.skin, roughness:0.65});
    const pantsMat = new THREE.MeshStandardMaterial({color: look.pants, roughness:0.82});
    const rider = new THREE.Group();
    if(!withRider) rider.visible = false;

    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.2, 6, 8), pantsMat);
    pelvis.position.set(0, 6, 0); rider.add(pelvis);

    // LEGAL: Torso pitched forward toward the bars — rotation about z tips the +x-facing body.
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(5.2*look.scaleX, 6.6*look.scaleX, 15*look.scaleY, 8), coatMat);
    torso.position.set(3.2, 14, 0); torso.rotation.z = -0.46; rider.add(torso);
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(7*look.scaleX, 7, 3.4), new THREE.MeshStandardMaterial({color: look.shirt, roughness:0.8}));
    shirt.position.set(6.2, 16.5, 0); shirt.rotation.z = -0.46; rider.add(shirt);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 2.6, 8), skinMat);
    neck.position.set(7.4, 21.4, 0); rider.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(5.6*look.scaleX, 12, 10), skinMat);
    head.position.set(8.4, 25.4, 0); rider.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(5.8*look.scaleX, 12, 8, 0, Math.PI*2, 0, Math.PI*0.48), new THREE.MeshStandardMaterial({color: look.hair, roughness:0.9}));
    hair.rotation.x = Math.PI; hair.position.set(8.0, 28.2, 0); rider.add(hair);
    // LEGAL: Nose, same as the pedestrian, so the head reads as facing forward from above.
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4, 6), skinMat);
    nose.rotation.z = -Math.PI/2; nose.position.set(13.4, 25.0, 0); rider.add(nose);

    [-1, 1].forEach(function(side){
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(1.7, 11, 4, 6), coatMat);
      arm.position.set(9.4, 16.6, side * 4.4);
      arm.rotation.z = Math.PI/2 - 0.42; rider.add(arm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(1.9, 8, 6), skinMat);
      hand.position.set(15.2, 14.6, side * 4.6); rider.add(hand);

      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(2.0, 7, 4, 6), pantsMat);
      thigh.position.set(3.6, 4.6, side * 4.4);
      thigh.rotation.z = Math.PI/2 - 0.3; rider.add(thigh);
      const shin = new THREE.Mesh(new THREE.CapsuleGeometry(1.7, 6, 4, 6), pantsMat);
      shin.position.set(7.2, -1.4, side * 4.4);
      shin.rotation.z = 0.26; rider.add(shin);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 3.4), new THREE.MeshStandardMaterial({color:'#111217', roughness:0.8}));
      shoe.position.set(9.4, -5.2, side * 4.4); rider.add(shoe);
    });

    // LEGAL: The bike group is scaled up by 1.45 on the way out, so shrink the rider by the
    // LEGAL: same factor — otherwise he is noticeably bigger riding than walking.
    rider.scale.setScalar(1 / 1.45);
    rider.position.set(-car.len*0.14, wheelR + 6.5, 0);
    rider.traverse(function(part){ part.castShadow = true; });
    g.add(rider);

    g.castShadow = true;
    // LEGAL: Same convention as buildCarModel — the bike is modelled facing +x, so it must
    // LEGAL: be rotated to face +z to match the shared heading convention
    // LEGAL: (playerGroup.rotation.y = -facing + PI/2). Without this it rides 90 degrees
    // LEGAL: off its direction of travel. The outer wrapper scales it up to city scale;
    // LEGAL: bikes are smaller than cars, so they take a slightly smaller scale.
    g.rotation.y = -Math.PI/2;
    const outer = new THREE.Group();
    outer.add(g);
    outer.scale.setScalar(1.45);
    return outer;
  }

  // LEGAL: `withRider` only matters for bikes — a car hides you inside it, a bike does not,
  // LEGAL: so a parked bike must not have a rider still sitting on it.
  // LEGAL: ---- Car bodywork ----
  // LEGAL: Cars used to be a stack of boxes: body, hood, boot and cabin, every edge square.
  // LEGAL: A real car is ONE shell with a continuous profile, so the body is now a side
  // LEGAL: silhouette — bonnet rise, raked windscreen, roof, sloped rear — extruded across
  // LEGAL: the width with a bevel, which is what rounds every edge at once. Same approach
  // LEGAL: that made the bike read: build the shape the thing actually has, then let three's
  // LEGAL: own geometry tools do the smoothing.
  function carBodyProfile(car: Car, bodyH: number): ThreeNamespace.Shape {
    const length = car.len;
    const nose = length * 0.5;
    const tail = -length * 0.5;
    const isTall = car.id === 'escalade';
    const sillY = 3.5;
    const beltY = bodyH + 1;
    const roofY = beltY + (isTall ? 15 : 11);
    const screenBase = length * (isTall ? 0.16 : 0.1);
    const roofFront = length * (isTall ? 0.05 : -0.02);
    const roofBack = -length * (isTall ? 0.3 : 0.24);
    const backlightBase = -length * (isTall ? 0.4 : 0.36);

    const shape = new THREE.Shape();
    shape.moveTo(tail, sillY);
    shape.lineTo(nose - 2, sillY);
    // LEGAL: Rounded nose rather than a cut-off block.
    shape.quadraticCurveTo(nose + 2.5, sillY, nose + 2.5, sillY + 4);
    shape.quadraticCurveTo(nose + 2.5, bodyH * 0.72, nose - 1, bodyH * 0.86);
    // LEGAL: Bonnet rising gently towards the screen.
    shape.lineTo(screenBase + length * 0.12, beltY - 1);
    // LEGAL: Raked windscreen into the roof.
    shape.quadraticCurveTo(screenBase, beltY + 4, roofFront, roofY);
    shape.lineTo(roofBack, roofY);
    // LEGAL: Rear screen dropping onto the boot.
    shape.quadraticCurveTo(backlightBase, roofY - 4, backlightBase - length * 0.04, beltY);
    shape.lineTo(tail + 2, beltY - 2);
    shape.quadraticCurveTo(tail - 2.5, beltY - 3, tail - 2.5, bodyH * 0.5);
    shape.quadraticCurveTo(tail - 2.5, sillY, tail, sillY);
    shape.closePath();
    return shape;
  }

  // LEGAL: The respray colour wins over the catalogue colour, for this car only.
  function carPaint(car: Car): Car {
    const custom = state.carColors?.[car.id];
    return custom ? { ...car, color: custom } : car;
  }

  function buildCarModel(base: Car, withRider = true){
    const car = carPaint(base);
    if(isBikeCar(car)) return buildBikeModel(car, withRider);
    // LEGAL: The Blender catalog (map/vehicleModels.ts) when it has this car; the procedural body
    // LEGAL: below stays as the fallback if the models fail to load.
    const cls = vehicleClassForCar(car.id);
    if(vehicleLibrary && cls) return vehicleLibrary.create(cls, car.color, car.len, car.wid);
    const g = new THREE.Group();
    const bodyH = car.id==='escalade'?18:(car.id==='bentley'?16:14);
    const halfW = car.wid/2;
    const isTall = car.id === 'escalade';

    // LEGAL: The bevel is what actually rounds the edges — without it this is still a box,
    // LEGAL: just a car-shaped one. Extrusion depth is reduced by twice the bevel so the
    // LEGAL: finished width is the car's real width rather than the width plus the bevel.
    const bevel = 1.6;
    const bodyGeo = new THREE.ExtrudeGeometry(carBodyProfile(car, bodyH), {
      depth: car.wid - bevel*2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 10,
    });
    // LEGAL: Extrusion runs along +z from the profile plane; recentre it on the car's axis.
    bodyGeo.translate(0, 0, -(car.wid - bevel*2)/2);
    const paint = new THREE.MeshStandardMaterial({ color:car.color, metalness:0.45, roughness:0.34 });
    const body = new THREE.Mesh(bodyGeo, paint);
    body.castShadow = true; body.receiveShadow = true;
    g.add(body);

    // LEGAL: Greenhouse — a dark inset band at the window line, so the glass reads as glass
    // LEGAL: instead of the body colour carrying on over the roof.
    const glassMat = new THREE.MeshStandardMaterial({color:'#7fb0cf', emissive:'#16303f', emissiveIntensity:0.18, transparent:true, opacity:0.62, roughness:0.12, metalness:0.35});
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(car.len * (isTall ? 0.44 : 0.38), isTall ? 12 : 9, car.wid + 0.6), glassMat);
    cabin.position.set(-car.len * (isTall ? 0.05 : 0.08), bodyH + (isTall ? 7.5 : 6), 0);
    g.add(cabin);

    if(state.carDecals?.[car.id] === 'fire-road'){
      const stripeMat = new THREE.MeshStandardMaterial({ color:'#e8b343', metalness:0.3, roughness:0.42 });
      const roofStripe = new THREE.Mesh(new THREE.BoxGeometry(car.len * (isTall ? 0.46 : 0.40), 0.35, car.wid * 0.18), stripeMat);
      roofStripe.position.set(-car.len * (isTall ? 0.05 : 0.08), bodyH + (isTall ? 13.65 : 10.7), 0);
      g.add(roofStripe);
      [-1, 1].forEach(function(side){
        const sideStripe = new THREE.Mesh(new THREE.BoxGeometry(car.len * 0.58, 2.1, 0.28), stripeMat);
        sideStripe.position.set(-car.len * 0.02, bodyH * 0.55, side * (halfW + 0.18));
        g.add(sideStripe);
      });
    }

    [-1,1].forEach(function(side){
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(3,2,5), new THREE.MeshStandardMaterial({color:'#17191f', roughness:0.35}));
      mirror.position.set(car.len*0.16, bodyH+4, side*(halfW+2)); g.add(mirror);
    });

    // LEGAL: Wheels sit in dark arches with a dished rim, and carry enough radial segments to
    // LEGAL: still read as round at city zoom — the old 12 showed their corners.
    const wheelMat = new THREE.MeshStandardMaterial({color:'#131315', roughness:0.9});
    const archMat = new THREE.MeshStandardMaterial({color:'#101114', roughness:0.9});
    const rimColor = car.id==='bentley'?'#c9a227':'#9aa0a8';
    const wheelR = (car.id==='escalade'||car.id==='bentley')?7:5.6;
    [[car.len*0.32,halfW+0.6],[car.len*0.32,-halfW-0.6],[-car.len*0.32,halfW+0.6],[-car.len*0.32,-halfW-0.6]].forEach(function(pair){
      const wx=pair[0], wz=pair[1];
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(wheelR,wheelR,5.4,20), wheelMat);
      wheel.rotation.x=Math.PI/2; wheel.position.set(wx,wheelR,wz); wheel.castShadow=true; g.add(wheel);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(wheelR*0.62,wheelR*0.62,5.6,14), new THREE.MeshStandardMaterial({color:rimColor, metalness:0.95, roughness:0.12}));
      rim.rotation.x=Math.PI/2; rim.position.set(wx,wheelR,wz); g.add(rim);
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(wheelR+1.6,wheelR+1.6,2,16,1,false,0,Math.PI), archMat);
      arch.rotation.x=Math.PI/2; arch.position.set(wx, wheelR, wz > 0 ? halfW-0.4 : -halfW+0.4); g.add(arch);
    });

    const chrome = new THREE.MeshStandardMaterial({color:'#262a31', metalness:0.55, roughness:0.35});
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(3.5,4.5,car.wid*0.98), chrome);
    frontBumper.position.set(car.len/2+0.8,4.6,0); g.add(frontBumper);
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(3.5,4.5,car.wid*0.98), chrome);
    rearBumper.position.set(-car.len/2-0.8,4.6,0); g.add(rearBumper);

    // LEGAL: Lamps are lozenges set into the nose and tail, not flat squares stuck on them.
    const headlightMat = new THREE.MeshStandardMaterial({color:'#fffbe0', emissive:'#fff3c0', emissiveIntensity:1.1});
    [-car.wid*0.32,car.wid*0.32].forEach(function(wz){
      const hl = new THREE.Mesh(new THREE.SphereGeometry(2.5,10,8), headlightMat.clone());
      hl.scale.set(0.55,0.72,1.25);
      hl.name = 'lamp:head';
      hl.position.set(car.len/2+0.4, bodyH*0.72, wz); g.add(hl);
    });
    const taillightMat = new THREE.MeshStandardMaterial({color:'#e02616', emissive:'#c81c0e', emissiveIntensity:0.85});
    [-car.wid*0.32,car.wid*0.32].forEach(function(wz){
      const tl = new THREE.Mesh(new THREE.SphereGeometry(2.2,10,8), taillightMat);
      tl.scale.set(0.5,0.62,1.15);
      tl.position.set(-car.len/2-0.3, bodyH*0.74, wz); g.add(tl);
    });

    if(car.id==='bentley'){
      const grille = new THREE.Mesh(new THREE.BoxGeometry(2.5,8,car.wid*0.5), new THREE.MeshStandardMaterial({color:'#c9a227', metalness:1, roughness:0.1}));
      grille.position.set(car.len/2+0.9, bodyH*0.66, 0); g.add(grille);
    }
    if(car.id==='impala'){
      const spoiler = new THREE.Mesh(new THREE.BoxGeometry(4,2,car.wid*0.92), new THREE.MeshStandardMaterial({color:'#282c38', roughness:0.6}));
      spoiler.position.set(-car.len*0.44, bodyH+3, 0); g.add(spoiler);
    }
    if(car.id==='escalade'){
      const rack = new THREE.Mesh(new THREE.BoxGeometry(car.len*0.6,1.6,car.wid*0.72), new THREE.MeshStandardMaterial({color:'#4c5058', metalness:0.7, roughness:0.4}));
      rack.position.set(-car.len*0.04, bodyH+14.2, 0); g.add(rack);
    }
    g.castShadow=true;
    // LEGAL: The body is modeled facing +x; wrap and rotate so its forward becomes
    // LEGAL: +z, matching the pedestrian model and the shared heading convention
    // LEGAL: (rotation.y = -facing + PI/2). Also scale the whole car up so it reads
    // LEGAL: at city scale next to the buildings and roads.
    g.rotation.y = -Math.PI/2;
    const outer = new THREE.Group();
    outer.add(g);
    outer.scale.setScalar(VEHICLE_SCALE);
    return outer;
  }
  function buildPlaceModel(archetype: PlaceArchetype, color: string, w: number, h: number, d: number): ThreeNamespace.Group | null {
    const model = buildingModelFor(archetype);
    return model && buildingLibrary ? buildingLibrary.create(model, color, w, h, d) : null;
  }
  // LEGAL: The plow's blade across the front and an amber beacon on the roof.
  function addPlowBlade(model: ThreeNamespace.Group): void {
    // LEGAL: Measured in the model's own space: the catalog sizes a model by scaling its root.
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model).applyMatrix4(model.matrixWorld.clone().invert());
    const width = box.max.x - box.min.x;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(width * 1.35, 9, 3), new THREE.MeshStandardMaterial({ color:'#d4691a', roughness:0.6, metalness:0.3 }));
    blade.position.set(0, 5, box.max.z + 4);
    blade.rotation.x = -0.25;
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 6), new THREE.MeshStandardMaterial({ color:'#ffb000', emissive:'#ff9a00', emissiveIntensity:1.4 }));
    beacon.position.set(0, box.max.y + 2, (box.min.z + box.max.z) / 2);
    model.add(blade, beacon);
  }
  function buildTrafficCarModel(id: string, color: string): ThreeNamespace.Group {
    const size = trafficFootprint(id);
    if(vehicleLibrary){
      const model = vehicleLibrary.create(vehicleClassForTraffic(id), color, size.length, size.width);
      if(id.startsWith('snowplow')) addPlowBlade(model);
      // LEGAL: Nobody watches a passing car's wheels, so traffic is merged back into one mesh per
      // LEGAL: material; only the player's car and the race rivals keep spinning wheels.
      if(mergeSceneryGeometries) mergeMeshesWithin(THREE, model, mergeSceneryGeometries);
      return model;
    }
    return buildCarModel({ id, name:id, icon:'', cost:0, speedMult:1, heistBonus:0, respectPerSec:0, color, len:id.includes('cab')?30:34, wid:id.includes('cruiser')?17:15 });
  }
  function buildAmenityModel(amenity: typeof mapAmenities[number]): ThreeNamespace.Group {
    return buildMapAmenityModel(THREE, amenity, { box, addSign, buildDetailedBuilding, buildPlaceModel, variantForId });
  }
  let SKY_DAY: ThreeNamespace.Color, SKY_DUSK: ThreeNamespace.Color, SKY_NIGHT: ThreeNamespace.Color;
  function updateDayNightLighting(){
    SKY_DAY ??= new THREE.Color('#9ec4e2'); SKY_DUSK ??= new THREE.Color('#d0906a'); SKY_NIGHT ??= new THREE.Color('#0e1424');
    if(!scene || !sunLight || !moonLight || !ambientLight) return;
    const dayFraction = mapDayFraction();
    const phase = dayFraction * Math.PI * 2;
    const sun = Math.max(0, Math.sin(phase - Math.PI / 2));
    const dusk = Math.max(0, 1 - Math.abs(sun * 2 - 1));
    const night = 1 - sun;
    nightLevel = night;
    updateHeadlight();
    // LEGAL: Night ambient was 0.5, which lit the whole city evenly and left nothing for
    // LEGAL: the street lights or headlights to contribute. Dropped so lamps actually read,
    // LEGAL: but not to black — you still have to be able to play.
    ambientLight.intensity = 0.3 + sun * 0.9 + dusk * 0.1;
    sunLight.intensity = 0.25 + sun * 1.15;
    sunLight.color.set(sun < 0.18 ? '#9fb4ff' : (dusk > 0.45 ? '#ffc37a' : '#fff2d0'));
    const shadowFrame = sunShadowFrame({ x:player.x, z:player.y }, sun, SHADOW_HALF_SIZE * 2 / sunLight.shadow.mapSize.x);
    sunLight.position.set(shadowFrame.position.x, shadowFrame.position.y, shadowFrame.position.z);
    sunLight.target.position.set(shadowFrame.target.x, shadowFrame.target.y, shadowFrame.target.z);
    sunLight.target.updateMatrixWorld();
    moonLight.intensity = Math.max(0, night - 0.18) * 0.5;
    // LEGAL: Street lamps: off by day, warming up through dusk, full at night.
    streetLampBulbs(THREE).emissiveIntensity = Math.max(0, night - 0.4) / 0.6 * 1.6;
    moonLight.position.set(WORLD_W*0.5 - Math.cos(phase) * 700, 430, WORLD_H*0.55 - Math.sin(phase) * 220);
    moonLight.target.position.set(WORLD_W/2,0,WORLD_H/2);
    moonLight.target.updateMatrixWorld();
    // LEGAL: Runs every frame, so recolour the existing sky and fog rather than allocating. The sky
    // LEGAL: used to be near-black at every hour, and the fog with it, so anything a few hundred
    // LEGAL: units off faded to black and the city looked grey at noon. Now it's blue by day, warm
    // LEGAL: at dusk and navy at night, and the fog takes the sky's colour so distance reads as haze.
    const sky = scene.background as ThreeNamespace.Color;
    sky.copy(SKY_NIGHT).lerp(SKY_DAY, sun).lerp(SKY_DUSK, dusk * 0.55);
    const fog = scene.fog as ThreeNamespace.Fog;
    fog.color.copy(sky);
    fog.near = 520 + night * 80;
    fog.far = 1150 + sun * 180;
    // LEGAL: three's lights are physically based (candela, decay 2). A lamp head sits ~32
    // LEGAL: units above the road, so the ground under it gets intensity/1024; ~2600 puts a
    // LEGAL: readable pool of light on the pavement.
    const lampIntensity = Math.max(0, night - 0.2) * 2600;
    const lit = nearestLamps(streetLamps, player.x, player.y, LAMP_LIGHT_POOL_SIZE);
    lampLightPool.forEach(function(light, index){
      const lamp = lit[index];
      light.intensity = lamp ? lampIntensity : 0;
      if(lamp) light.position.set(lamp.x, lamp.y, lamp.z);
    });
  }
  function mapClockLabel(): string {
    const totalMinutes = Math.floor(mapDayFraction() * 24 * 60);
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const suffix = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2,'0')} ${suffix}`;
  }
  function buildingColorFor(b: Business){
    const unlocked = isUnlocked(b);
    const opened = unlocked && b.researched && b.level>0;
    const legit = b.category==='legit';
    if(!opened) return { color:'#33353d', h:26 };
    return { color: legit ? '#3e6b78' : '#7c3540', h: 24+Math.min(70,b.level*3) };
  }
  function variantForId(id: string): number {
    let seed = 0;
    for(let i=0;i<id.length;i++) seed += id.charCodeAt(i) * (i + 1);
    return (seed % 997) / 997;
  }
  function assetKeyForBuilding(zoneType: string, variant: number, height: number): MapAssetKey | null {
    if(zoneType==='skyscraper' || height > 78) return variant > 0.5 ? 'towerC' : 'towerA';
    if(zoneType==='commercial' || zoneType==='shop') return variant > 0.5 ? 'commercialAwning' : 'commercialWide';
    if(zoneType==='residential') return variant > 0.5 ? 'houseB' : 'houseA';
    return null;
  }
  function addVentureDetail(m: typeof mapBuildings[number], base: ThreeNamespace.Group){
    if(m.id==='cart'){
      const canopy = box(34,4,26,'#d4a017'); canopy.position.set(0,13,0); base.add(canopy);
      const counter = box(24,5,10,'#2f3438'); counter.position.set(0,4,8); base.add(counter);
    } else if(m.id==='garage'){
      const bay = box(34,16,3,'#15171c'); bay.position.set(0,-2,28); base.add(bay);
      const lift = box(26,2,18,'#555a68'); lift.position.set(0,-12,36); base.add(lift);
    } else if(m.id==='cab'){
      [-24,0,24].forEach(function(x){
        const cab = box(18,8,11,'#d4a017'); cab.position.set(x,-8,36); base.add(cab);
      });
    } else if(m.id==='restaurant'){
      const awning = box(54,4,9,'#b13f35'); awning.position.set(0,2,27); base.add(awning);
    } else if(m.id==='lounge'){
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(50,12), new THREE.MeshBasicMaterial({color:'#d44d96', transparent:true, opacity:0.62}));
      glow.position.set(0,12,27.5); base.add(glow);
    } else if(m.id==='syndicate_logistics' || m.id==='chop_ring'){
      [-18,0,18].forEach(function(x){
        const crate = box(14,12,14,m.id==='chop_ring'?'#444a52':'#6a5132'); crate.position.set(x,-10,35); base.add(crate);
      });
    } else if(m.id==='family_office'){
      const crown = box(52,8,42,'#8b7a42'); crown.position.set(0,52,0); base.add(crown);
    }
  }

  function addServiceDetail(m: ServiceBuilding, base: ThreeNamespace.Group): void {
    if(m.kind === 'bankHome'){
      [-18, 0, 18].forEach(function(x){
        const column = box(5,24,5,'#d7c47a');
        column.position.set(x,-5,28);
        base.add(column);
      });
      const pediment = box(48,7,8,'#8b7a42');
      pediment.position.set(0,10,29);
      base.add(pediment);
    } else if(m.kind === 'garage' || m.kind === 'dealership'){
      [-15, 15].forEach(function(x){
        const bay = box(18,18,3,'#11141a');
        bay.position.set(x,-5,26);
        base.add(bay);
      });
      const sign = box(48,5,4,'#3e6b78');
      sign.position.set(0,11,28);
      base.add(sign);
    } else if(m.kind === 'cityhall'){
      const steps = box(62,5,18,'#797267');
      steps.position.set(0,-14,34);
      base.add(steps);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(16,18,10,0,Math.PI*2,0,Math.PI/2), new THREE.MeshStandardMaterial({color:'#c9a227', metalness:0.45, roughness:0.35}));
      dome.position.set(0,22,0);
      base.add(dome);
    } else if(m.kind === 'realty' || m.kind === 'brokerage'){
      const roof = box(56,5,42,'#2f5360');
      roof.position.set(0,18,0);
      base.add(roof);
      const placard = box(18,16,3,'#d9d2b8');
      placard.position.set(20,-6,28);
      base.add(placard);
    } else if(m.kind === 'heist'){
      const vault = new THREE.Mesh(new THREE.CylinderGeometry(13,13,6,18), new THREE.MeshStandardMaterial({color:'#7d8594', metalness:0.7, roughness:0.22}));
      vault.rotation.x = Math.PI/2;
      vault.position.set(0,-4,28);
      base.add(vault);
    }
  }

  function addLocalBusinessDetail(m: LocalBusiness, base: ThreeNamespace.Group): void {
    if(m.id === 'bar' || m.id === 'marlowe'){
      const neon = box(34,4,4,'#d44d96');
      neon.position.set(0,9,22);
      base.add(neon);
    } else if(m.id === 'chopshop'){
      const bay = box(26,16,3,'#15171c');
      bay.position.set(0,-4,22);
      base.add(bay);
    } else if(m.id === 'jewelers'){
      const display = box(28,12,3,'#b9ffe8');
      display.position.set(0,-2,22);
      base.add(display);
    } else {
      const awning = box(34,4,6,'#7a6fb0');
      awning.position.set(0,7,22);
      base.add(awning);
    }
  }



  // LEGAL: ---- procedural building with windows, door, and zone-specific roof ----
  function buildDetailedBuilding(w: number, h: number, d: number, color: number | string, zoneType: string, variant = 0){
    const assetKey = assetKeyForBuilding(zoneType, variant, h);
    const assetModel = assetKey ? mapAssets?.createFittedModel(assetKey, w, h, d, String(color)) : null;
    if(assetModel) return assetModel;

    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({color, roughness:0.85, metalness:0.05}));
    body.castShadow=true; body.receiveShadow=true; g.add(body);
    const glassColor = variant > 0.66 ? '#b9ffe8' : (variant > 0.33 ? '#ffe4a8' : '#c8d8ff');
    const winMat = new THREE.MeshStandardMaterial({color:glassColor, emissive:glassColor, emissiveIntensity:0.28 + variant*0.25, roughness:0.2});
    const winRows = Math.max(1, Math.floor(h/18));
    const winCols = Math.max(1, Math.floor(w/22));
    for(let wr=0; wr<winRows; wr++){
      for(let wc=0; wc<winCols; wc++){
        const win = new THREE.Mesh(new THREE.PlaneGeometry(7,9), winMat);
        const wx = -w/2 + 12 + wc*(w/winCols);
        const wy = -h/2 + 12 + wr*(h/winRows);
        win.position.set(wx, wy, d/2+0.1); g.add(win);
        const win2 = new THREE.Mesh(new THREE.PlaneGeometry(7,9), winMat);
        win2.rotation.y=Math.PI; win2.position.set(wx, wy, -d/2-0.1); g.add(win2);
      }
    }
    const doorMat = new THREE.MeshStandardMaterial({color:'#101216', roughness:0.5});
    const door = new THREE.Mesh(new THREE.PlaneGeometry(11,16), doorMat);
    door.position.set(0, -h/2+8, d/2+0.11); g.add(door);
    const canUseMachinery = zoneType==='commercial' || zoneType==='service' || zoneType==='skyscraper' || zoneType==='industrial';
    const canUseWaterTank = zoneType==='industrial';
    if(variant < 0.22){
      const upper = box(w*0.68, h*0.32, d*0.68, color);
      upper.position.y = h/2 + h*0.16; g.add(upper);
      const cap = box(w*0.76, 3, d*0.76, '#242833');
      cap.position.y = h/2 + h*0.32 + 1.5; g.add(cap);
    } else if(variant < 0.44){
      const cornice = box(w*1.02, 4, d*1.02, '#272a31');
      cornice.position.y = h/2 + 2; g.add(cornice);
      const awning = box(Math.min(w*0.7, 38), 3, 8, zoneType==='shop'?'#9b2f3f':'#2f5c68');
      awning.position.set(0, -h/2+20, d/2+4); g.add(awning);
    } else if(variant < 0.66 && canUseMachinery){
      const rooftop = box(w*0.34, 9, d*0.32, '#3b3f49');
      rooftop.position.set(w*0.18, h/2+4.5, -d*0.12); g.add(rooftop);
      const vent = new THREE.Mesh(new THREE.CylinderGeometry(3,3,10,8), new THREE.MeshStandardMaterial({color:'#565c68', roughness:0.65, metalness:0.4}));
      vent.position.set(-w*0.22, h/2+5, d*0.12); vent.castShadow=true; g.add(vent);
    } else if(variant > 0.84 && canUseWaterTank){
      const tankMat = new THREE.MeshStandardMaterial({color:'#8a6a42', roughness:0.75});
      [[-5,-5],[5,-5],[-5,5],[5,5]].forEach(function(p){
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.8,18,5), new THREE.MeshStandardMaterial({color:'#3f4248', roughness:0.7}));
        leg.position.set(p[0], h/2+9, p[1]); leg.castShadow=true; g.add(leg);
      });
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(8,8,10,12), tankMat);
      tank.position.set(0, h/2+22, 0); tank.castShadow=true; g.add(tank);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(8.5,5,12), tankMat);
      cap.position.set(0, h/2+29, 0); cap.castShadow=true; g.add(cap);
    }
    if(zoneType==='skyscraper' && h>60){
      const spire = new THREE.Mesh(new THREE.ConeGeometry(4,h*0.22,6), new THREE.MeshStandardMaterial({color:'#8090b0', metalness:0.8, roughness:0.1}));
      spire.position.y = h/2 + h*0.11; g.add(spire);
    } else if(zoneType==='residential'){
      // LEGAL: Flat roof sized to the footprint (never overhangs, even when the
      // LEGAL: building is rotated) plus a small rooftop unit for silhouette variety.
      const roof = box(w*0.96, 3, d*0.96, '#2e2a26');
      roof.position.y = h/2+1.5; g.add(roof);
      const unit = box(Math.min(w,d)*0.3, 6, Math.min(w,d)*0.3, '#39342d');
      unit.position.set(w*0.14, h/2+5, -d*0.14); g.add(unit);
    } else if(zoneType==='industrial'){
      const vent = new THREE.Mesh(new THREE.CylinderGeometry(4,5,14,8), new THREE.MeshStandardMaterial({color:'#404450', roughness:0.8}));
      vent.position.set(w*0.25, h/2+7, 0); g.add(vent);
    }
    return g;
  }
  // LEGAL: The traffic lights the cars obey (map/trafficRules), updated as their phases change.
  const signalHeads: SignalHeads[] = [];
  function buildIntersectionFurniture(x: number, z: number): void {
    signalHeads.push(buildMapIntersectionFurniture({ THREE, worldGroup, streetLamps }, x, z));
  }
  function updateSignalHeads(): void {
    signalHeads.forEach(function(heads){
      showSignal(heads, 'ns', signalState('ns', heads.junction, state.playSeconds));
      showSignal(heads, 'ew', signalState('ew', heads.junction, state.playSeconds));
    });
  }  // LEGAL: Set by the weather cheats; the normal cycle takes back over after it expires.
  let sceneMaterials: ReturnType<typeof createMapSceneMaterials> | null = null;
  let weatherOverride: { kind: 'clear' | 'rain' | 'snow'; until: number } | null = null;
  function weatherKindAtTime(): 'clear' | 'rain' | 'snow' {
    if(weatherOverride && state.playSeconds < weatherOverride.until) return weatherOverride.kind;
    const t = state.playSeconds % 360;
    if(t > 72 && t < 118) return 'rain';
    if(t > 226 && t < 258) return 'snow';
    return 'clear';
  }
  function rebuildWeather(kind: 'clear' | 'rain' | 'snow'){
    if(weatherPoints){ scene.remove(weatherPoints); weatherPoints.geometry.dispose(); const material = weatherPoints.material; if(Array.isArray(material)) material.forEach(m=>m.dispose()); else material.dispose(); weatherPoints = null; }
    activeWeather = kind;
    if(kind === 'clear') return;
    const count = kind === 'rain' ? 520 : 260;
    const positions = new Float32Array(count * 3);
    const rand = seededRandom(kind === 'rain' ? 8811 : 9913);
    for(let i=0; i<count; i++){
      positions[i*3] = (rand()-0.5) * 760;
      positions[i*3+1] = rand() * 300 + 40;
      positions[i*3+2] = (rand()-0.5) * 520;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({color:kind==='rain'?'#8ab7ff':'#f2f5ff', size:kind==='rain'?2.2:4.2, transparent:true, opacity:kind==='rain'?0.58:0.82, depthWrite:false});
    weatherPoints = new THREE.Points(geometry, material);
    scene.add(weatherPoints);
  }
  // LEGAL: ---- Settling snow (map/snow) ----
  let snowCover = 0, snowPlowed = 0, snowShown = -1;
  let snowSurfaces: Array<{ material: ThreeNamespace.MeshStandardMaterial; base: ThreeNamespace.Color; surface: 'ground' | 'tree' | 'road' }> = [];
  const SNOW_WHITE = '#f4f6fa';
  function updateSnow(dt: number): void {
    snowCover = stepSnowCover(snowCover, weatherKindAtTime() === 'snow', dt);
    snowPlowed = stepPlowed(snowPlowed, snowCover, dt);
    const plow = roamingActors.find(actor => actor.id.startsWith('snowplow'));
    if(plow) plow.dormant = !plowOut(snowCover, snowPlowed);
    if(Math.abs(snowCover - snowShown) < 0.01 && !(snowCover === 0 && snowShown > 0)) return;
    if(!snowSurfaces.length && sceneMaterials){
      snowSurfaces = sceneMaterials.entries().flatMap(function([key, material]){
        const surface = snowSurfaceFor(key);
        return surface ? [{ material, base:material.color.clone(), surface }] : [];
      });
    }
    snowShown = snowCover;
    terrainSnow.value = snowWhiteness('ground', snowCover, snowPlowed);
    snowSurfaces.forEach(function(entry){
      entry.material.color.copy(entry.base).lerp(new THREE.Color(SNOW_WHITE), snowWhiteness(entry.surface, snowCover, snowPlowed));
    });
  }
  function updateWeather(dt: number){
    updateSnow(dt);
    const kind = weatherKindAtTime();
    if(kind !== activeWeather) rebuildWeather(kind);
    if(!weatherPoints) return;
    weatherPoints.position.set(player.x,0,player.y);
    const attr = weatherPoints.geometry.getAttribute('position') as ThreeNamespace.BufferAttribute;
    const fall = kind === 'rain' ? 520 * dt : 95 * dt;
    const drift = kind === 'rain' ? -85 * dt : 24 * Math.sin(state.playSeconds*0.7) * dt;
    for(let i=0; i<attr.count; i++){
      let y = attr.getY(i) - fall;
      let x = attr.getX(i) + drift;
      if(y < 8){ y += 300; x = ((x + 380) % 760) - 380; }
      attr.setY(i, y);
      attr.setX(i, x);
    }
    attr.needsUpdate = true;
  }

  function updateWaterMotion(): void {
    // LEGAL: Waves are drawn by the water shader (map/waterShader.ts); this just advances its clock.
    waterClock.value = state.playSeconds;
  }

  // LEGAL: Names everything a builder just added to the world, so the scene audit can say
  // LEGAL: WHICH object is standing in a road instead of "Mesh". Objects that named
  // LEGAL: themselves keep that name; this only fills the gaps.
  function tagWorld(label: string, build: () => void): void {
    const start = worldGroup.children.length;
    build();
    for(let i=start; i<worldGroup.children.length; i++){
      const child = worldGroup.children[i];
      if(!child.name) child.name = label;
    }
  }

  // LEGAL: ---- unified city — builds the entire world once; no per-district teardown ----
  function buildCityScene(){
    clearGroup(worldGroup);
    streetLamps = [];
    dealerArrivals.length = 0; // LEGAL: transient dealer walk-ins are re-added as standing figures below

    const timer = createSceneBuildTimer();
    const materials = createMapSceneMaterials(THREE);
    sceneMaterials = materials;
    snowSurfaces = []; snowShown = -1;
    const baseScene = { THREE, worldGroup, worldWidth:WORLD_W, worldHeight:WORLD_H, materials };
    timer.measure('terrain', function(): void {
      tagWorld('terrain:ground', function(){ buildBaseGround(baseScene); });
      tagWorld('terrain:canal', function(){ buildCanalWater(baseScene); });
      tagWorld('road:surface', function(){ buildRoadNetwork({ ...baseScene, roadNetwork, buildIntersectionFurniture }); });
      tagWorld('bridge:canal', function(){ buildCanalBridges(baseScene); });
    });
    timer.measure('street-trees', function(): void {
      streetTreeSpots.length = 0;
      tagWorld('tree:street', function(){ buildStreetTrees({ ...baseScene, roadNetwork, districtOffsets:DISTRICT_OFFSETS, seededRandom, treeSpots:streetTreeSpots }); });
      tagWorld('outskirt:scenery', function(){ buildOutskirtScenery(baseScene); });
      // LEGAL: Street furniture in front of the lots, laid out once the street trees are known.
      cityPropsCache = null;
      if(propLibrary && cityProps().length) worldGroup.add(propLibrary.instanced(cityProps()));
    });
    // LEGAL: Venture buildings — all districts
    timer.measure('places', function(): void {
      tagWorld('place', function(){
        renderMapPlaces({ THREE, worldGroup, mapObjects, helpers:{ buildingColorFor, ventureFootprint, buildDetailedBuilding, buildPlaceModel, buildAmenityModel, buildPedestrianModel, addVentureDetail, addServiceDetail, addLocalBusinessDetail, addSign, variantForId } });
      });
    });

    // LEGAL: Service buildings — all districts

    // LEGAL: Extortable local businesses — all districts


    // LEGAL: Corners — all districts

    timer.measure('actors', function(): void {
      tagWorld('actor:roaming', function(){
        renderRoamingActors({ worldGroup, actors:roamingActors, helpers:{ buildTrafficCarModel, buildPedestrianModel, addSign } });
      });
    });

    timer.measure('fill-and-landmarks', function(): void {
      tagWorld('filler', function(){
        buildCityLots(THREE, cityLots(), buildingLibrary, materials, function(lot){
          const mesh = buildDetailedBuilding(lot.w, lot.h, lot.d, lot.color, 'residential', 0);
          mesh.position.set(lot.x, lot.h / 2, lot.y); mesh.rotation.y = lot.rot;
          mesh.name = `filler:lot@${Math.round(lot.x)},${Math.round(lot.y)}`;
          return mesh;
        }).forEach(part => worldGroup.add(part));
      });
      tagWorld('landmark', function(){
        buildLandmarks({ THREE, worldGroup, worldWidth:WORLD_W, worldHeight:WORLD_H, landmarks, helpers:{ box, addSign }, buildPlaceModel, landmarkModel:name => landmarkCatalog?.create(name) ?? null });
        worldGroup.add(buildMall(THREE, mergeSceneryGeometries ?? undefined));
        worldGroup.add(buildCentralPark(THREE, materials, addSign));
        worldGroup.add(buildSuburb(THREE, materials));
      });
      tagWorld('rail-and-river', function(){ buildRailAndRiver(baseScene); });
    });
    timer.measure('gameplay-overlays', function(): void {
      buildTrain();
      currentSolids = buildAllSolids();
      // LEGAL: Block the landmark footprints so you can't walk through them.
      currentSolids.push(...landmarkSolids(landmarks));
      // LEGAL: Must run AFTER the solids exist: an NPC authored inside a building is stuck
      // LEGAL: there forever otherwise, because the point it retreats to when blocked is the
      // LEGAL: same point it is trapped in.
      settleRoamingActors(roamingActors, function(x, y){ return tryMove(x, y, currentSolids); }, rescuePoint);
      updateParkedCarMesh();
      rebuildWaypointBeacon();
      const merge = mergeSceneryGeometries;
      if(merge) worldGroup.children.filter(function(child){ return MERGEABLE_SCENERY_PREFIXES.some(function(prefix){ return child.name.startsWith(prefix); }); }).forEach(function(group){ mergeMeshesWithin(THREE, group, merge); });
      if(merge) LOOSE_SCENERY_PREFIXES.forEach(prefix => mergeLooseByPrefix(THREE, worldGroup, prefix, merge));
      freezeStaticScenery(worldGroup);
    });
    if(isLocalDevBuild()){
      console.info('[map-build]', timer.entries().map(entry => `${entry.name}:${entry.ms.toFixed(1)}ms`).join(' '), `total:${timer.totalMs().toFixed(1)}ms`);
      // LEGAL: The world audit, on what was just drawn. Every problem is logged and marked on
      // LEGAL: the map with a red beacon, so a mistake is visible the moment it's made.
      const issues = auditScene(THREE, worldGroup);
      if(issues.length){
        console.warn(`[world-audit] ${issues.length} problem(s):`, issues.map(issue => issue.message));
        flagIssues(THREE, worldGroup, issues);
      }
    }

    updateDayNightLighting();
  }

  function isLocalDevBuild(): boolean {
    return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  }

  // LEGAL: Historical entry point kept for saved-game boot; the city is unified now.
  function buildDistrictScene(_districtId: string){
    if(!sceneInitialized || !worldGroup) return;
    buildCityScene();
  }

  // LEGAL: Transient "dealer pulling up" animation — a figure walks in from the street
  // LEGAL: to the corner over ~1.5s when you post a dealer. It is cleared on the next
  // LEGAL: scene rebuild, which re-adds the dealer as a permanent standing figure.
  function buildTrain(): void {
    if(!worldGroup) return;
    if(trainGroup){ worldGroup.remove(trainGroup); trainGroup.traverse(disposeObj); }
    trainGroup = new THREE.Group();
    trainGroup.name = 'train:el';
    const bodyMat = new THREE.MeshStandardMaterial({color:'#9b2f2f', roughness:0.62, metalness:0.12});
    const roofMat = new THREE.MeshStandardMaterial({color:'#d8c078', roughness:0.45, metalness:0.18});
    for(let i=0;i<4;i++){
      const car = new THREE.Mesh(new THREE.BoxGeometry(28,18,58), bodyMat);
      car.position.set(0,10,-96+i*64);
      car.castShadow=true; car.receiveShadow=true; trainGroup.add(car);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(24,4,48), roofMat);
      roof.position.set(0,21,-96+i*64);
      roof.castShadow=true; trainGroup.add(roof);
    }
    const rail = windhavenMapModel.railLines[0];
    trainGroup.position.set(rail.path[0].x,0,-260);
    worldGroup.add(trainGroup);
  }

  function updateTrain(): void {
    if(!trainGroup) return;
    // LEGAL: Drawn where the crossing check and collision think it is. They used two different
    // LEGAL: formulas, so the train you saw and the train that blocked you weren't in the same place.
    const snapshot = activeTrainSnapshot(Date.now(), windhavenMapModel.railLines[0]);
    trainGroup.visible = !!snapshot;
    if(!snapshot) return;
    trainGroup.position.x = snapshot.point.x;
    trainGroup.position.z = snapshot.point.y;
  }

  // LEGAL: Dealers walking onto or off a corner. Each walk goes from (sx, sy) to (tx, ty); a dealer
  // LEGAL: who's been pulled is removed when they reach the street.
  const dealerArrivals: Array<{ group: ThreeNamespace.Object3D; corner: Corner; sx: number; sy: number; tx: number; ty: number; t: number; seconds: number; leaving: boolean }> = [];
  function spawnDealerArrival(corner: Corner){
    if(!sceneInitialized || !worldGroup) return;
    const sx = corner.x + (Math.random()<0.5 ? -44 : 44);
    const sy = corner.y + 52;
    const g = buildPedestrianModel('#d4a017', 'dealer-'+corner.id);
    g.name = 'dealer:'+corner.id;
    g.position.set(sx, 0, sy);
    worldGroup.add(g);
    dealerArrivals.push({ group:g, corner, sx, sy, tx:corner.x + 12, ty:corner.y + 9, t:0, seconds:1.5, leaving:false });
  }
  // LEGAL: Pulling a dealer used to make them vanish on the next rebuild; now they pack up and walk
  // LEGAL: off down the street. A dealer drawn as part of the corner is lifted into the world first,
  // LEGAL: keeping exactly where they stand.
  function walkDealerAway(corner: Corner){
    if(!sceneInitialized || !worldGroup) return;
    const figure = worldGroup.getObjectByName('dealer:'+corner.id);
    if(!figure) return;
    for(let i = dealerArrivals.length - 1; i >= 0; i--) if(dealerArrivals[i].group === figure) dealerArrivals.splice(i, 1);
    worldGroup.attach(figure);
    figure.name = 'dealer:leaving';
    const side = Math.random() < 0.5 ? -1 : 1;
    dealerArrivals.push({ group:figure, corner, sx:figure.position.x, sy:figure.position.z, tx:corner.x + side * 150, ty:corner.y + 60, t:0, seconds:3, leaving:true });
  }
  function updateDealerArrivals(dt: number){
    for(let i=dealerArrivals.length-1; i>=0; i--){
      const a = dealerArrivals[i];
      a.t = Math.min(1, a.t + dt/a.seconds);
      const x = a.sx + (a.tx - a.sx) * a.t;
      const y = a.sy + (a.ty - a.sy) * a.t;
      a.group.position.set(x, 0, y);
      a.group.rotation.y = -Math.atan2(a.ty - a.sy, a.tx - a.sx) + Math.PI/2;
      if(a.t >= 1){
        dealerArrivals.splice(i, 1);
        // LEGAL: Removed, not disposed: people share geometry and materials with everyone else.
        if(a.leaving) worldGroup.remove(a.group);
      }
    }
  }

  // LEGAL: ---- Working headlight ----
  // LEGAL: The lamp on the front of the bike was an emissive sphere: it LOOKED lit but threw
  // LEGAL: no light, so riding at night lit nothing. This is a real SpotLight parented to the
  // LEGAL: player, aimed down the direction of travel, so it sweeps the road as you turn.
  // LEGAL: One light reused rather than one per model — spot lights are not free, and the
  // LEGAL: renderer has to recompile materials when their count changes.
  let headlightBeam: ThreeNamespace.SpotLight | null = null;
  // LEGAL: Lamp lenses on whichever vehicle model is currently built, so they can be driven
  // LEGAL: by the clock. Rebuilt with the model.
  let lampLenses: ThreeNamespace.Mesh[] = [];
  function ensureHeadlight(){
    if(headlightBeam || !playerGroup) return;
    // LEGAL: Also candela. Decay 1.4 over a ~420 unit throw, so the beam still reaches the
    // LEGAL: far kerb; the peak intensity is applied in updateHeadlight.
    const beam = new THREE.SpotLight('#fff3cf', 0, 420, Math.PI / 5.2, 0.45, 1.4);
    beam.position.set(0, 12, 6);
    // LEGAL: The player group's forward is +z (see the model rotation convention), so the
    // LEGAL: target sits ahead on +z and inherits every turn for free.
    beam.target.position.set(0, -2, 90);
    playerGroup.add(beam);
    playerGroup.add(beam.target);
    headlightBeam = beam;
  }
  // LEGAL: 0 at midday, 1 at midnight. Written by updateDayNightLighting.
  let nightLevel = 0;
  function updateHeadlight(){
    if(!headlightBeam) return;
    const lit = state.inVehicle && !state.currentInterior;
    // LEGAL: The lamp lenses on the model are separate from the beam — they are what makes
    // LEGAL: the vehicle look lit from the outside, the beam is what lights the road.
    lampLenses.forEach(function(lens){
      const mat = lens.material as ThreeNamespace.MeshStandardMaterial;
      mat.emissiveIntensity = lit ? 0.6 + nightLevel * 2.2 : 0.5;
    });
    // LEGAL: Comes up through dusk rather than snapping on, and stays off in daylight.
    headlightBeam.intensity = lit ? Math.max(0, nightLevel - 0.35) / 0.65 * 2200 : 0;
    headlightBeam.visible = headlightBeam.intensity > 0.01;
  }

  function refreshPlayerModel(){
    if(!sceneInitialized || !playerGroup) return;
    clearGroup(playerGroup);
    if(state.inVehicle){ const car=getEquippedCar(); if(car) playerGroup.add(buildCarModel(car)); }
    else playerGroup.add(buildPedestrianModel('#f0efe8', 'arjun'));
    // LEGAL: clearGroup strips the beam with the model, so it is re-attached every rebuild.
    headlightBeam = null;
    lampLenses = [];
    playerGroup.traverse(function(node){
      const mesh = node as ThreeNamespace.Mesh;
      if((mesh as { isMesh?: boolean }).isMesh && mesh.name === 'lamp:head') lampLenses.push(mesh);
    });
    ensureHeadlight();
    updateHeadlight();
  }
  function updateParkedCarMesh(){
    if(!sceneInitialized || !worldGroup) return;
    if(parkedCarMesh){ worldGroup.remove(parkedCarMesh); parkedCarMesh.traverse(disposeObj); parkedCarMesh=null; }
    const car = getEquippedCar();
    if(car && !state.inVehicle){
      const pos = parkedCarPositionForDistrict(state.parkedCarPos, state.currentDistrict);
      parkedCarMesh = buildCarModel(car, false);
      parkedCarMesh.position.set(pos.x,0,pos.y);
      parkedCarMesh.name = 'vehicle:parked';
      if(state.brokenCars.includes(car.id)) parkedCarMesh.add(buildSmokePlume());
    worldGroup.add(parkedCarMesh);
    }
  }
  // LEGAL: Grey puffs rising off a broken-down car's bonnet, looping. Animated in updateSmokePlumes.
  const SMOKE_PUFFS = 7;
  function buildSmokePlume(): ThreeNamespace.Group {
    const plume = new THREE.Group();
    plume.name = 'smoke-plume';
    for(let i = 0; i < SMOKE_PUFFS; i++){
      const puff = new THREE.Mesh(new THREE.SphereGeometry(5, 10, 8), new THREE.MeshStandardMaterial({ color:'#9a9da3', transparent:true, opacity:0.5, depthWrite:false, roughness:1 }));
      puff.userData.phase = i / SMOKE_PUFFS;
      plume.add(puff);
    }
    plume.position.set(0, 14, 14);
    return plume;
  }
  function updateSmokePlumes(): void {
    const plume = parkedCarMesh?.getObjectByName('smoke-plume');
    if(!plume) return;
    plume.children.forEach(function(puff, i){
      const t = (state.playSeconds * 0.45 + (puff.userData.phase as number)) % 1;
      puff.position.set(Math.sin(i * 2.1 + t * 3) * 4 * t, t * 46, Math.cos(i * 1.7) * 3 * t);
      puff.scale.setScalar(0.5 + t * 1.6);
      ((puff as ThreeNamespace.Mesh).material as ThreeNamespace.MeshStandardMaterial).opacity = 0.55 * (1 - t);
    });
  }

  // LEGAL: A short message over the map itself, for things the player must notice while driving.
  let mapToastTimer = 0;
  function showMapToast(text: string): void {
    const container = byId('scene3d-container');
    let toast = container.querySelector<HTMLDivElement>('.map-toast');
    if(!toast){ toast = document.createElement('div'); toast.className = 'map-toast'; toast.setAttribute('role', 'status'); container.appendChild(toast); }
    toast.textContent = text;
    toast.classList.add('show');
    window.clearTimeout(mapToastTimer);
    mapToastTimer = window.setTimeout(function(){ toast!.classList.remove('show'); }, 4500);
  }

  function sampleRouteGuide(points: Point[], step: number): Point[] {
    const dots: Point[] = [];
    points.slice(1).forEach(function(point, index){
      const previous = points[index];
      const dx = point.x - previous.x;
      const dy = point.y - previous.y;
      const distance = Math.hypot(dx, dy);
      const count = Math.max(1, Math.floor(distance / step));
      for(let i = 1; i <= count; i += 1){
        const t = i / count;
        dots.push({ x:previous.x + dx*t, y:previous.y + dy*t });
      }
    });
    return dots.slice(0, 48);
  }
  // LEGAL: Deliberately NOT the road-marking yellow — see rebuildWaypointBeacon.
  const WAYPOINT_COLOR = '#35e0ff';

  // LEGAL: Height of the walking surface at a point, so route dots sit ON it. Only bridges
  // LEGAL: raise the surface today; everything else is ground level.
  const BRIDGE_DECK_TOP = 4.35;
  function guideHeightAt(point: Point): number {
    return bridgeAtPoint(point, 6) ? BRIDGE_DECK_TOP : 0.15;
  }
  function computeRoadGuide(px: number, py: number, wx: number, wy: number): Point[] {
    return sampleRouteGuide(routeHintBetween({ x:px, y:py }, { x:wx, y:wy }).waypoints, 55);
  }
  // LEGAL: The guide dots are computed from the player's position, so a beacon built once
  // LEGAL: at set-time goes stale the moment you drive off — the trail pointed back at
  // LEGAL: where you were standing. Rebuild it as you move, throttled by distance travelled
  // LEGAL: (and a floor on elapsed time) so this never runs per frame.
  let lastGuideFrom = { x: 0, y: 0 };
  let lastGuideAt = 0;
  const GUIDE_REFRESH_DISTANCE = 90;
  const GUIDE_REFRESH_SECONDS = 0.75;
  function refreshWaypointGuide(){
    if(!currentWaypoint() || !sceneInitialized) return;
    const now = Date.now() / 1000;
    if(now - lastGuideAt < GUIDE_REFRESH_SECONDS) return;
    if(Math.hypot(player.x - lastGuideFrom.x, player.y - lastGuideFrom.y) < GUIDE_REFRESH_DISTANCE) return;
    rebuildWaypointBeacon();
  }
  function rebuildMissionObjectiveMarker(): void {
    if(!sceneInitialized || !worldGroup) return;
    const mission = activeMissionEntries()[0];
    const objective = mission?.objective;
    const key = mission && objective ? `${mission.id}:${objective.x}:${objective.y}` : '';
    if(key === missionObjectiveMarkerKey) return;
    if(missionObjectiveMarker){ worldGroup.remove(missionObjectiveMarker); missionObjectiveMarker.traverse(disposeObj); missionObjectiveMarker=null; }
    missionObjectiveMarkerKey = key;
    if(!mission || !objective) return;
    const marker = new THREE.Group();
    const color = '#ff4fd8';
    const ring = new THREE.Mesh(new THREE.RingGeometry(23,28,24), new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.85, side:THREE.DoubleSide}));
    ring.rotation.x = -Math.PI/2;
    ring.position.y = 0.6;
    marker.add(ring);
    const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(9,0), new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:0.85, roughness:0.35}));
    diamond.position.y = 38;
    marker.add(diamond);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,28,8), new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.75}));
    stem.position.y = 18;
    marker.add(stem);
    marker.position.set(objective.x,0,objective.y);
    marker.name = `mission:${mission.id}`;
    worldGroup.add(marker);
    missionObjectiveMarker = marker;
  }
  function rebuildWaypointBeacon(){
    lastGuideFrom = { x: player.x, y: player.y };
    lastGuideAt = Date.now() / 1000;
    if(!sceneInitialized || !worldGroup) return;
    if(waypointBeacon){ worldGroup.remove(waypointBeacon); waypointBeacon.traverse(disposeObj); waypointBeacon=null; }
    rebuildMissionObjectiveMarker();
    const wp = currentWaypoint();
    if(!wp) return;
    const g = new THREE.Group();
    // LEGAL: Flat cross marker on the ground — no floating tower.
    // LEGAL: Cyan, not gold. The old #d4a017 was the same yellow as the road lane markings,
    // LEGAL: so the route trail disappeared into the centre line of the road it was drawn on.
    const markerMat = new THREE.MeshStandardMaterial({color:WAYPOINT_COLOR, emissive:WAYPOINT_COLOR, emissiveIntensity:0.7});
    const arm1 = new THREE.Mesh(new THREE.PlaneGeometry(30,6), markerMat);
    arm1.rotation.x=-Math.PI/2; arm1.position.set(0,0.2,0); g.add(arm1);
    const arm2 = new THREE.Mesh(new THREE.PlaneGeometry(6,30), markerMat);
    arm2.rotation.x=-Math.PI/2; arm2.position.set(0,0.2,0); g.add(arm2);
    const ring = new THREE.Mesh(new THREE.RingGeometry(18,22,20), new THREE.MeshBasicMaterial({color:WAYPOINT_COLOR, transparent:true, opacity:0.38, side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2; ring.position.y=0.3; g.add(ring);
    // LEGAL: Flat road-guide dots from player position to waypoint
    const dots = computeRoadGuide(player.x, player.y, wp.x, wp.y);
    const dotMat = new THREE.MeshBasicMaterial({color:WAYPOINT_COLOR});
    dots.forEach(function(pt){
      const dot = new THREE.Mesh(new THREE.CircleGeometry(4,8), dotMat);
      // LEGAL: Every dot used to be pinned to y=0.15, which is UNDER a bridge: the deck sits
      // LEGAL: at y=2 and is 4 thick, so the whole trail was hidden inside the deck exactly
      // LEGAL: where you most need directions. Dots ride the surface they are actually on.
      dot.rotation.x=-Math.PI/2;
      dot.position.set(pt.x-wp.x, guideHeightAt(pt), pt.y-wp.y);
      g.add(dot);
    });
    g.position.set(wp.x,0,wp.y);
    g.name = 'waypoint:beacon';
    worldGroup.add(g); waypointBeacon=g;
  }

  function initScene(){
    const container = byId('scene3d-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0b10');
    scene.fog = new THREE.Fog(0x0a0b10, 480, 1050);

    // LEGAL: Near plane at 40, not 1. Depth precision scales with near/distance, and the road,
    // LEGAL: sidewalk, lane paint and canal lines are stacked 0.01-0.05 apart; at near=1 the
    // LEGAL: buffer could not separate them past ~400 units and they strobed. The camera never
    // LEGAL: comes within 200 units of anything, so nothing visible is clipped.
    camera3d = new THREE.PerspectiveCamera(50, VIEW_W/VIEW_H, 40, 3000);
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.classList.add('webgl-canvas');
    container.insertBefore(renderer.domElement, container.firstChild);
    syncRendererSize();
    // LEGAL: Tracks every layout change (tab shown, phone rotated, HUD wrapping, fullscreen),
    // LEGAL: not just window resizes, so the picture is never stretched to a stale aspect.
    new ResizeObserver(syncRendererSize).observe(container);

    // LEGAL: Sky light from above and a warm bounce off the ground, instead of a flat blue-grey ambient
    // LEGAL: that tinted every surface the same and left the city looking grey.
    ambientLight = new THREE.HemisphereLight(0xdcebff, 0x6a5a44, 0.65);
    scene.add(ambientLight);
    sunLight = new THREE.DirectionalLight(0xfff2d0, 0.9);
    sunLight.castShadow = !lowQualitySaved();
    sunLight.shadow.mapSize.set(2048,2048);
    sunLight.shadow.camera.left=-SHADOW_HALF_SIZE; sunLight.shadow.camera.right=SHADOW_HALF_SIZE;
    sunLight.shadow.camera.top=SHADOW_HALF_SIZE; sunLight.shadow.camera.bottom=-SHADOW_HALF_SIZE;
    sunLight.shadow.camera.near=100; sunLight.shadow.camera.far=1800;
    // LEGAL: Without a bias every lit surface shadows itself in stripes ("shadow acne").
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 1.2;
    scene.add(sunLight); scene.add(sunLight.target);
    // LEGAL: The moon casts no shadow. A second shadow light re-renders every caster (~1,400
    // LEGAL: meshes) each frame, even by day at zero intensity, for shadows too faint to see.
    moonLight = new THREE.DirectionalLight(0xb9c8ff, 0);
    scene.add(moonLight); scene.add(moonLight.target);
    lampLightPool = Array.from({ length: LAMP_LIGHT_POOL_SIZE }, function(){
      const light = new THREE.PointLight(0xffcc7a, 0, 300, 2);
      scene.add(light);
      return light;
    });

    worldGroup = new THREE.Group(); scene.add(worldGroup);
    // LEGAL: Dev-only inspection hook. The unit tests check placement DATA, which is why a
    // LEGAL: world that passed all of them still rendered buildings on top of roads — the
    // LEGAL: data was self-consistent, it just no longer agreed with the scene. This exposes
    // LEGAL: the real three.js scene so e2e can audit what is actually drawn. Stripped from
    // LEGAL: production by the import.meta.env.DEV guard.
    // LEGAL: import.meta.env is not in this project's lib types, so read it defensively.
    if((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV){
      (window as unknown as { __seat?: unknown }).__seat = {
        THREE, scene, worldGroup, player, state, mapObjects, mapPlaces, renderer,
        characters: characterLibrary,
        audit: function(){ return auditScene(THREE, worldGroup); },
        breakDownCar: function(){ const car = getEquippedCar(); if(car) breakDownCar(car); },
        corners, assignDealer, fireDealer,
        startMission: startMissionFromOffer,
        resolveMission: resolveMissionAtObjective,
        declineMission: declineMissionOffer,
        enterBuilding,
        hotspots: function(){ return hotspotsFor(state.currentInterior); },
        interiorRoom: function(){ return interiorView?.root ?? null; },
        interiorCamera: function(){ return interiorCamera; },
        roadNetwork, districtOffsets: DISTRICT_OFFSETS,
        snow: function(){ return { cover:snowCover, plowed:snowPlowed }; },
        lots: function(){ return cityLots(); },
        roamingActors,
        // LEGAL: The world's own walkability rule, so the audit asks the game where an actor
        // LEGAL: may stand instead of re-deriving collision and grading its own homework.
        canWalk: function(x: number, y: number){ return tryMove(x, y, currentSolids); },
        // LEGAL: The world's own water rule, so the audit can ask whether a thing is standing
        // LEGAL: in the lake or the ocean rather than re-deriving the coastline.
        isWater: function(x: number, y: number){ return isWaterBlocked(x, y, 0); },
      };
    }
    playerGroup = new THREE.Group(); scene.add(playerGroup);

    buildCityScene();
  }

  // LEGAL: ================= MINIMAP (simple 2D, pannable, waypoints) =================
  const minimapCanvas = byId<HTMLCanvasElement>('minimap-canvas');
  const mctx = minimapCanvas.getContext('2d')!;
  const minimapPan = { x:0, y:0 };
  let minimapDragging=false, minimapDragStart: { clientX: number; clientY: number; panX: number; panY: number } | null =null, minimapDragMoved=false;
  // LEGAL: Real estate is in the world whether or not you own it, but the minimap should
  // LEGAL: only flag YOUR holdings — otherwise every buyable building clutters the map with
  // LEGAL: markers for things that are not yours.
  function ownsPropertyPlace(object: MapObject): boolean {
    if(object.kind !== 'property') return true;
    return state.ownedProperties.includes((object.ref as PropertyPlace).property.id);
  }
  function minimapObjects(): MapObject[] {
    return mapObjects.filter(ownsPropertyPlace);
  }

  function currentWaypoint(): Point | null {
    return state.waypoints.global || null;
  }
  function setGlobalWaypoint(point: Point | null): void {
    state.waypoints = { devlin:null, westside:null, hub:null, global:point };
  }
  function waypointRouteLabel(point: Point): string {
    return routeSummary(routeHintBetween({ x:player.x, y:player.y }, point)).label;
  }

  // LEGAL: Wheel to zoom the minimap in and out, remembered in this browser.
  const MINIMAP_ZOOM_KEY = 'seat-minimap-zoom';
  let minimapZoom = (function(){ try{ const saved = Number(window.localStorage.getItem(MINIMAP_ZOOM_KEY)); return saved >= 0.5 && saved <= 4 ? saved : 1; }catch(e){ return 1; } })();
  minimapCanvas.addEventListener('wheel', function(e){
    e.preventDefault();
    minimapZoom = Math.max(0.5, Math.min(4, minimapZoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    try{ window.localStorage.setItem(MINIMAP_ZOOM_KEY, String(minimapZoom)); }catch(err){}
  }, { passive:false });
  minimapCanvas.addEventListener('pointerdown', function(e){
    minimapDragging = true; minimapDragMoved = false;
    minimapDragStart = { clientX:e.clientX, clientY:e.clientY, panX:minimapPan.x, panY:minimapPan.y };
  });
  window.addEventListener('pointermove', function(e){
    if(!minimapDragging || !minimapDragStart) return;
    const ddx = e.clientX - minimapDragStart.clientX, ddy = e.clientY - minimapDragStart.clientY;
    if(Math.abs(ddx)>3 || Math.abs(ddy)>3) minimapDragMoved = true;
    minimapPan.x = minimapDragStart.panX - ddx/(MINIMAP_SCALE * minimapZoom);
    minimapPan.y = minimapDragStart.panY - ddy/(MINIMAP_SCALE * minimapZoom);
  });
  window.addEventListener('pointerup', function(){
    if(!minimapDragging) return;
    minimapDragging = false;
    if(!minimapDragMoved && !state.currentInterior){
      openCityMap();
    }
  });
  function clearWaypoint(): void {
    setGlobalWaypoint(null);
    rebuildWaypointBeacon();
    byId('minimap-clear').classList.remove('show');
    scheduleSave();
  }
  byId('minimap-clear').addEventListener('click', clearWaypoint);

  function drawMinimap(){
    drawMapMinimap({
      ctx:mctx,
      indoors:!!state.currentInterior,
      dragging:minimapDragging,
      pan:minimapPan,
      player,
      mapObjects: minimapObjects(),
      districtOffsets:DISTRICT_OFFSETS,
      buildings:cityLotFootprints(),
      worldWidth:WORLD_W,
      worldHeight:WORLD_H,
      landmass:WINDHAVEN_LANDMASS,
      landmarks,
      waypoint:currentWaypoint(),
      scale:MINIMAP_SCALE * minimapZoom,
    });
    updateMinimapTurf();
    refreshWaypointGuide();
    if(cityMapOpen) drawCityMap();
  }

  // LEGAL: ---- Turf under your feet (minimap) ----
  // LEGAL: The minimap used to carry a territory toggle that tinted it and dropped a panel of small
  // LEGAL: text over the game. Now its rim takes the colour of whoever holds the block you're on,
  // LEGAL: and one line underneath names it; the full picture lives on the City Map's layer.
  function currentHoldings(){
    return territoryBlocks.map(function(block){ return holdingFor(block, districtControl(block.district)); });
  }
  // LEGAL: Only branded shops are ringed — those are the places where turf actually
  // LEGAL: changes what you pay.
  function rivalTurfShopIds(){
    const ids = new Set<string>();
    serviceBuildings.forEach(function(svc){
      if(!svc.brandId) return;
      if(ownerAt({ x:svc.x, y:svc.y }) === 'rival') ids.add(svc.id);
    });
    return ids;
  }
  let turfKey = '';
  function updateMinimapTurf(): void {
    const block = blockAtPoint(territoryBlocks, { x:player.x, y:player.y });
    const holding = block ? holdingFor(block, districtControl(block.district)) : null;
    const owned = block ? ownedBlockCount(districtControl(block.district)) : 0;
    const key = holding ? `${block!.id}:${holding.owner}:${owned}` : 'none';
    if(key === turfKey) return;
    turfKey = key;
    const label = byId('minimap-turf');
    const canvas = byId('minimap-canvas');
    if(!block || !holding){
      label.textContent = 'Open ground';
      canvas.style.borderColor = '';
      return;
    }
    const whose = holding.owner === 'yours' ? 'Your turf' : holding.owner === 'contested' ? 'Contested' : `${holding.gang?.name ?? 'Rival'} turf`;
    label.innerHTML = `<strong>${block.name}</strong> · ${whose}`;
    label.title = `You hold ${owned} of 8 blocks in this district`;
    canvas.style.borderColor = holding.color;
  }

  // LEGAL: The City Map legend only changes when district control does, so it is rebuilt on a
  // LEGAL: signature rather than every frame — the same discipline as the heat breakdown.
  function territoryLegendSignature(){
    return districts.map(d=>`${d.id}:${ownedBlockCount(d.control)}`).join('|');
  }

  // LEGAL: One markup builder for both the minimap legend and the City Map side rail, so
  // LEGAL: the two can never drift apart.
  function territoryLegendHtml(){
    const controls: Record<string, number> = {};
    districts.forEach(function(d){ controls[d.id] = d.control; });
    const rows = territoryLegend(territoryBlocks, controls).map(function(row){
      const district = districts.find(d=>d.id===row.district);
      const gang = row.gang;
      const seg = function(count: number, color: string){
        return count ? `<span style="flex:${count};background:${color};"></span>` : '';
      };
      return `<div class="territory-row">
        <div class="t-name"><span class="territory-swatch" style="background:${gang?.color ?? '#7d8a99'};"></span>${district?.name ?? row.district}</div>
        <div class="territory-bar">
          ${seg(row.yours, YOURS_COLOR)}${seg(row.contested, CONTESTED_COLOR)}${seg(row.rival, gang?.color ?? '#7d8a99')}
        </div>
        <div class="t-sub">You ${row.yours}/${row.yours+row.contested+row.rival} blocks · ${gang?.name ?? 'Rivals'} ${row.rival}</div>
      </div>`;
    }).join('');
    return `<h4>Territory</h4>${rows}`
      + `<div class="t-sub" style="margin-top:8px;">○ ringed shops sit on rival turf and charge more.</div>`;
  }

  // LEGAL: The City Map carries the same layer, tracked separately so toggling the big
  // LEGAL: map does not change what the follow-cam minimap shows.
  let cityTerritoryShown = false;
  let cityTerritoryLegendKey = '';
  function renderCityTerritoryLegend(force = false){
    const panel = byIdOrNull('citymap-territory-legend');
    if(!panel || !cityTerritoryShown) return;
    const key = territoryLegendSignature();
    if(!force && key === cityTerritoryLegendKey) return;
    cityTerritoryLegendKey = key;
    panel.innerHTML = territoryLegendHtml();
  }
  function setCityTerritoryShown(on: boolean){
    cityTerritoryShown = on;
    byId('citymap-territory').classList.toggle('active', on);
    byId('citymap-territory-legend').classList.toggle('hidden', !on);
    if(on) renderCityTerritoryLegend(true);
    if(cityMapOpen) drawCityMap();
  }
  byId('citymap-territory').addEventListener('click', function(){ setCityTerritoryShown(!cityTerritoryShown); });

  // LEGAL: ---- District overlay (City Map) ----
  // LEGAL: The map had a large part of itself that officially did not exist: stand in the
  // LEGAL: outskirts and the HUD kept naming whichever district you were last in. The three
  // LEGAL: outskirt districts in map/regions.ts fix the naming; this layer makes the seams
  // LEGAL: visible, which is the thing you actually want when you are looking at a map.
  // LEGAL: A view over map data only — it changes no game state, like the territory layer.
  let cityDistrictsShown = false;
  const mapRegions = allRegions();

  function districtLegendHtml(){
    const rows = mapRegions.map(function(region){
      const detail = region.kind === 'city'
        ? 'City district — turf, control, the war'
        : 'Outskirts — open country, no turf';
      return `<div class="territory-row">
        <div class="t-name"><span class="territory-swatch" style="background:${region.color};"></span>${escapeHtml(region.name)}</div>
        <div class="t-sub">${detail}</div>
      </div>`;
    }).join('');
    return `<h4>Districts</h4>${rows}`;
  }

  function setCityDistrictsShown(on: boolean){
    cityDistrictsShown = on;
    byId('citymap-districts').classList.toggle('active', on);
    const legend = byId('citymap-districts-legend');
    legend.classList.toggle('hidden', !on);
    // LEGAL: The legend never changes — regions are static map data — so it is built once
    // LEGAL: on first show rather than rebuilt on every toggle.
    if(on && !legend.innerHTML) legend.innerHTML = districtLegendHtml();
    if(cityMapOpen) drawCityMap();
  }
  byId('citymap-districts').addEventListener('click', function(){ setCityDistrictsShown(!cityDistrictsShown); });

  // LEGAL: ================= CITY MAP (full-world overlay, GTA-style) =================
  const cityMapCanvas = byId<HTMLCanvasElement>('citymap-canvas');
  const cityCtx = cityMapCanvas.getContext('2d')!;
  const cityMapHint = byId('citymap-hint');
  const cityMapSearch = byId<HTMLInputElement>('citymap-search');
  const cityMapFilters = byId('citymap-filters');
  const cityMapResults = byId('citymap-results');
  const CITY_W = cityMapCanvas.width, CITY_H = cityMapCanvas.height;
  // LEGAL: Framed on the whole landmass, not just the three districts — otherwise the
  // LEGAL: outskirts added in stage 1c are cropped straight off the City Map.
  const cityViewport = createMapViewport(CITY_W, CITY_H, windhavenMapModel.landmass);
  let cityMapOpen = false;
  let cityMapHoverPlace: MapPlaceRecord | null = null;
  let cityMapFilter: MapPlaceCategory | 'all' = 'all';
  let cityMapSearchTerm = '';
  function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, function(char): string {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char] ?? char;
    });
  }

  const cityLegend: Array<{ icon: string; label: string; color: string; ph?: string }> = [
    { icon:'legal',    label:'Owned business',          color:'#3e7c8c', ph:'ph-storefront' },
    { icon:'illegal',  label:'Underground business',    color:'#a8394a', ph:'ph-mask-happy' },
    { icon:'bank',     label:'Bank',                    color:'#d4a017', ph:'ph-bank' },
    // LEGAL: These are shops that SELL you things, not anywhere you keep things. Labelled
    // LEGAL: "Garage" they read as the player's own garage, which does not exist yet.
    { icon:'garage',   label:'Car dealership',          color:'#2a87ff', ph:'ph-car-profile' },
    { icon:'realty',   label:'Realty office',           color:'#7a6fb0', ph:'ph-house-line' },
    { icon:'cityhall', label:'City Hall',               color:'#f0efe8', ph:'ph-buildings' },
    { icon:'heist',    label:'Heist target',            color:'#f04848', ph:'ph-lock-key' },
    { icon:'shop',     label:'Local shop',              color:'#7a6fb0', ph:'ph-t-shirt' },
    { icon:'bar',      label:'Bar / club',              color:'#a385ff', ph:'ph-martini' },
    { icon:'corner',   label:'Street corner',           color:'#d4a017', ph:'ph-map-pin' },
    { icon:'amenity',  label:'Amenity',                 color:'#5fbf8f', ph:'ph-basketball' },
    { icon:'person',   label:'Person',                  color:'#f0efe8', ph:'ph-user' },
    { icon:'gang',     label:'Gang recruit',            color:'#f0efe8', ph:'ph-users-three' },
    { icon:'estate',   label:'Real estate you own',      color:'#5fbf8f', ph:'ph-house' },
    { icon:'landmark', label:'Landmark — incl. The Potato', color:'#e0c860', ph:'ph-star' },
    { icon:'you',      label:'You',                     color:'#e8e6de', ph:'ph-navigation-arrow' },
    { icon:'waypoint', label:'Waypoint',                color:'#d4a017', ph:'ph-crosshair' },
  ];
  const cityMapFiltersList: Array<{ id: MapPlaceCategory | 'all'; label: string }> = [
    { id:'all', label:'All' },
    { id:'service', label:'Services' },
    { id:'local', label:'Shops' },
    { id:'business', label:'Businesses' },
    { id:'corner', label:'Corners' },
    { id:'person', label:'People' },
    { id:'gang', label:'Gang' },
    { id:'amenity', label:'Amenities' },
    { id:'landmark', label:'Landmarks' },
  ];
  // LEGAL: Search and the results list only offer real estate you actually own, matching
  // LEGAL: what the map shows — otherwise searching "lofts" finds a building that is not
  // LEGAL: yours and drops a waypoint on it.
  function cityFilteredPlaces(): MapPlaceRecord[] {
    return cityFilteredPlacesAll().filter(place => !place.sourceObject || ownsPropertyPlace(place.sourceObject));
  }
  function cityFilteredPlacesAll(): MapPlaceRecord[] {
    const filteredByCategory = cityMapFilter === 'all' ? mapPlaces : placesByCategory(mapPlaces, cityMapFilter);
    const search = cityMapSearchTerm.trim().toLowerCase();
    if(!search) return filteredByCategory;
    return filteredByCategory.filter(function(place){
      return place.name.toLowerCase().includes(search) || mapPlaceCategoryLabel(place).toLowerCase().includes(search) || place.district.toLowerCase().includes(search);
    });
  }
  function cityVisibleMapObjects(): MapObject[] {
    if(cityMapFilter === 'all' && !cityMapSearchTerm.trim()) return minimapObjects();
    const ids = new Set(cityFilteredPlaces().map(place => place.sourceObject?.id).filter((id): id is string => !!id));
    return minimapObjects().filter(object => ids.has(object.id));
  }
  function renderCityMapSearch(): void {
    cityMapFilters.innerHTML = cityMapFiltersList.map(function(filter){
      const active = filter.id === cityMapFilter ? ' active' : '';
      return `<button class="citymap-filter-btn${active}" data-citymap-filter="${escapeHtml(filter.id)}" type="button">${escapeHtml(filter.label)}</button>`;
    }).join('');

    const results = cityFilteredPlaces().slice(0, 18);
    cityMapResults.innerHTML = results.length ? results.map(function(place){
      const active = place.id === cityMapHoverPlace?.id ? ' active' : '';
      const icon = place.icon && place.icon !== 'landmark' ? place.icon : 'landmark';
      const category = mapPlaceCategoryLabel(place);
      return `<button class="citymap-result${active}" data-citymap-place="${escapeHtml(place.id)}" type="button"><span class="lg-ico lg-${escapeHtml(icon)}" style="--c:#d4a017"></span><span><span class="citymap-result-name">${escapeHtml(place.name)}</span><span class="citymap-result-meta">${escapeHtml(category)} - ${escapeHtml(districtDisplayName(place.district))}</span></span><span class="citymap-result-waypoint" data-citymap-waypoint="${escapeHtml(place.id)}" title="Set waypoint"><i aria-hidden="true" class="ph-duotone ph-crosshair"></i></span></button>`;
    }).join('') : '<div class="citymap-result-empty">No places match that search.</div>';
  }
  function drawCityMap(){
    drawMapMinimap({
      ctx:cityCtx, indoors:false, dragging:false, pan:{x:0,y:0},
      player, mapObjects:cityVisibleMapObjects(), districtOffsets:DISTRICT_OFFSETS, buildings:cityLotFootprints(),
      worldWidth:WORLD_W, worldHeight:WORLD_H, landmass:WINDHAVEN_LANDMASS, landmarks,
      waypoint:currentWaypoint(),
      // LEGAL: Same territory data as the minimap, but the full map has room for block
      // LEGAL: names, so it turns labels on.
      territory: cityTerritoryShown ? currentHoldings() : null,
      warnObjectIds: cityTerritoryShown ? rivalTurfShopIds() : undefined,
      // LEGAL: District names only; a label on every block crowded the whole map.
      territoryLabels: false,
      regions: cityDistrictsShown ? mapRegions : null,
      viewW:CITY_W, viewH:CITY_H, scale:cityViewport.scale, center:cityViewport.center, glyphScale:1.9,
      districtNames:windhavenMapModel.districts.map(function(district){ return { x: district.labelPoint.x, y: district.labelPoint.y, name: district.name }; }),
      highlightPoint:cityMapHoverPlace,
      highlightLabel:cityMapHoverPlace?.name,
    });
    if(cityTerritoryShown) renderCityTerritoryLegend();
  }
  function openCityMap(){
    cityMapOpen = true;
    const overlay = byId('citymap-overlay');
    const el = byIdOrNull('citymap-legend');
    if(el) el.innerHTML = `<div class="citymap-legend-title">Legend</div>` + cityLegend.map(function(item){
      const iconHtml = item.ph ? `<i aria-hidden="true" class="ph-duotone ${item.ph} lg-ph" style="color:${item.color}"></i>` : `<span class="lg-ico lg-${item.icon}" style="--c:${item.color}"></span>`;
      return `<div class="citymap-legend-row">${iconHtml}${escapeHtml(item.label)}</div>`;
    }).join('');
    cityMapSearch.value = cityMapSearchTerm;
    renderCityMapSearch();
    overlay.classList.remove('hidden');
    drawCityMap();
  }
  function closeCityMap(){
    cityMapOpen = false;
    const overlay = byId('citymap-overlay');
    overlay.classList.add('hidden');
  }
  byId('citymap-open').addEventListener('click', openCityMap);
  byId('minimap-expand').addEventListener('click', openCityMap);
  byId('citymap-close').addEventListener('click', closeCityMap);
  byId('citymap-overlay').addEventListener('click', function(e){ if(e.target === this) closeCityMap(); });
  cityMapSearch.addEventListener('input', function(){
    cityMapSearchTerm = cityMapSearch.value;
    cityMapHoverPlace = cityFilteredPlaces()[0] ?? null;
    renderCityMapSearch();
    drawCityMap();
  });
  cityMapFilters.addEventListener('click', function(e){
    const btn = (e.target as HTMLElement).closest('[data-citymap-filter]');
    if(!btn) return;
    cityMapFilter = btn.getAttribute('data-citymap-filter') as MapPlaceCategory | 'all';
    cityMapHoverPlace = cityFilteredPlaces()[0] ?? null;
    renderCityMapSearch();
    drawCityMap();
  });
  cityMapResults.addEventListener('click', function(e){
    const waypoint = (e.target as HTMLElement).closest('[data-citymap-waypoint]');
    const row = (e.target as HTMLElement).closest('[data-citymap-place]');
    const id = (waypoint || row)?.getAttribute(waypoint ? 'data-citymap-waypoint' : 'data-citymap-place');
    const place = id ? mapPlaces.find(candidate => candidate.id === id) : null;
    if(!place) return;
    cityMapHoverPlace = place;
    if(waypoint){
      setGlobalWaypoint({ x:place.x, y:place.y });
      rebuildWaypointBeacon();
      byId('minimap-clear').classList.add('show');
      cityMapHint.textContent = `${districtDisplayName(place.district)} - ${place.name} - ${mapPlaceCategoryLabel(place)} - ${waypointRouteLabel(place)}`;
      scheduleSave();
    } else {
      cityMapHint.textContent = `${districtDisplayName(place.district)} - ${place.name} - ${mapPlaceCategoryLabel(place)}`;
    }
    renderCityMapSearch();
    drawCityMap();
  });
  function cityMapWorldPoint(e: MouseEvent): Point {
    const rect = cityMapCanvas.getBoundingClientRect();
    const px = (e.clientX-rect.left) * (CITY_W/rect.width);
    const py = (e.clientY-rect.top) * (CITY_H/rect.height);
    return clampPointToBounds(screenToWorld(cityViewport, { x:px, y:py }), cityViewport.bounds);
  }
  cityMapCanvas.addEventListener('mousemove', function(e){
    const point = cityMapWorldPoint(e);
    const context = mapPointContext(point, mapPlaces, { placeMaxDistance:42 });
    const dist = districts.find(function(d){ return d.id === context.districtId; });
    const place = context.nearestPlace;
    cityMapHoverPlace = place;
    if(!dist){
      // LEGAL: The outskirts are drivable land outside every district. They used to be
      // LEGAL: rejected the same as water, which meant you could drive somewhere you could
      // LEGAL: not navigate to. Name the belt and allow the waypoint.
      cityMapHint.textContent = context.isWater
        ? 'Water - waypoints must be placed on land'
        : `${outskirtPlaceLabel(point)} - Click to set waypoint`;
      renderCityMapSearch();
      drawCityMap();
      return;
    }
    cityMapHint.textContent = place ? `${dist.name} - ${place.name} - ${mapPlaceCategoryLabel(place)}` : `${dist.name} - Click to set waypoint`;
    renderCityMapSearch();
    drawCityMap();
  });
  cityMapCanvas.addEventListener('mouseleave', function(){
    cityMapHoverPlace = null;
    cityMapHint.textContent = 'Click land to drop a waypoint · click it again to clear it · hover places to inspect them';
    renderCityMapSearch();
    drawCityMap();
  });
  cityMapCanvas.addEventListener('click', function(e){
    if(state.currentInterior) return;
    const point = cityMapWorldPoint(e);
    // LEGAL: Clicking your waypoint again clears it, the same as GTA's map.
    const existing = currentWaypoint();
    if(existing && Math.hypot(existing.x - point.x, existing.y - point.y) < 90){
      clearWaypoint();
      cityMapHint.textContent = 'Waypoint cleared';
      drawCityMap();
      return;
    }
    const context = mapPointContext(point, mapPlaces);
    const dist = context.districtId;
    // LEGAL: Water is still rejected; outskirt land is not. Anywhere you can drive to, you
    // LEGAL: can now navigate to.
    if(context.isWater){
      cityMapHint.textContent = 'Water - waypoints must be placed on land';
      drawCityMap();
      return;
    }
    const placeName = dist ? districtDisplayName(dist) : outskirtPlaceLabel(point);
    setGlobalWaypoint(point);
    rebuildWaypointBeacon();
    byId('minimap-clear').classList.add('show');
    cityMapHint.textContent = `${placeName} waypoint - ${waypointRouteLabel(point)}`;
    if(dist !== state.currentDistrict) log(`📍 Waypoint set in ${placeName} — head there to follow it.`);
    drawCityMap();
    scheduleSave();
  });

  // LEGAL: ================= INTERIOR (a 3D room you walk around) =================
  // LEGAL: The room is built when you walk in and whenever its hotspots change (a mission contact
  // LEGAL: turning up), and thrown away when you leave. The player's figure moves into it.
  let interiorView: InteriorView | null = null;
  let interiorViewKey = '';
  let interiorScene3d: ThreeNamespace.Scene | null = null;
  let interiorCamera: ThreeNamespace.PerspectiveCamera | null = null;
  function interiorSolids(): Solid[] { return interiorView?.solids ?? []; }
  // LEGAL: Using a thing in a room moves the camera in to it and draws the popup as the thing
  // LEGAL: (map/closeUps): a desk's screen, the notice board. This replaced a first-person view, which
  // LEGAL: wasn't what was wanted (user, 2026-10-20). Set when a hotspot is used, cleared when its
  // LEGAL: popup is closed; a popup that follows on from it (the next step of a game) keeps it.
  let activeCloseUp: { spot: { x: number; y: number }; view: CloseUp } | null = null;
  const interiorEye = { pos:{ x:0, y:0, z:0 }, look:{ x:0, y:0, z:0 }, ready:false };
  function beginCloseUp(spot: { id: string; x: number; y: number }): void {
    const view = state.currentInterior ? closeUpFor(spot.id, state.currentInterior.kind) : null;
    activeCloseUp = view ? { spot:{ x:spot.x, y:spot.y }, view } : null;
  }
  function closeUpSkinClasses(): string {
    if(!activeCloseUp || !state.currentInterior) return '';
    const skin = activeCloseUp.view.skin;
    return ` closeup skin-${skin}${LIGHT_SKINS.has(skin) ? ' skin-light' : ''}`;
  }
  function leaveInteriorView(): void {
    if(interiorView){ interiorScene3d?.remove(interiorView.root); interiorView.dispose(); interiorView = null; interiorViewKey = ''; }
    if(playerGroup && playerGroup.parent !== scene) scene.add(playerGroup);
    if(playerGroup) playerGroup.visible = true;
    byId('scene3d-container').classList.remove('indoors');
  }
  // LEGAL: Your own car stands in your garage; a showroom or paint bay shows one in the room's colour.
  function interiorCarModel(spec: InteriorCar): ThreeNamespace.Object3D | null {
    if(spec.use === 'garage'){ const car = getEquippedCar(); return car && !isFlyingVehicle(car.id) ? buildCarModel(car, false) : null; }
    return vehicleLibrary ? vehicleLibrary.create(spec.cls ?? (spec.use === 'showroom' ? 'supercar' : 'sedan'), spec.color, 29, 15) : null;
  }
  // LEGAL: The first room you walked into stalled for a couple of hundred milliseconds on a fast GPU
  // LEGAL: (seconds on a slow one) while its shaders compiled. So once the city is up, a few
  // LEGAL: representative rooms are built offscreen and compiled in the background
  // LEGAL: (compileAsync doesn't block a frame), then thrown away; the programs stay cached.
  async function warmInteriorShaders(): Promise<void> {
    if(!characterLibrary || state.currentInterior) return;
    const library = characterLibrary;
    const warmScene = new THREE.Scene();
    const warmCamera = new THREE.PerspectiveCamera(50, camera3d.aspect, 1, 3000);
    warmCamera.position.set(240, 150, 300); warmCamera.lookAt(240, 0, 140);
    for(const [kind, refId] of [['bankHome', 'bankHome'], ['casino', 'casinoLakeridge'], ['mall', 'mallLakeridge'], ['local', 'patel']] as const){
      if(state.currentInterior) return;
      const interior = { kind, refId, name:'', returnX:0, returnY:0, returnDistrict:'' };
      const room = roomSizeFor(interior);
      const view = buildInteriorRoom3d(THREE, {
        kind, refId, room:{ ...room, door:{ x:room.w / 2 } }, door:{ x:room.w / 2, y:room.h - 6 }, spots:hotspotsFor(interior), plan:planFor(interior), floor:0,
        makePerson:(identity, coat) => library.create(identity, coat), makeCar:interiorCarModel, merge:mergeSceneryGeometries ?? undefined,
      });
      warmScene.add(view.root);
      try{ await renderer.compileAsync(warmScene, warmCamera); }catch(e){}
      warmScene.remove(view.root);
      view.dispose();
      await new Promise(function(resolve){ window.setTimeout(resolve, 200); });
    }
  }
  function renderInteriorView(dt: number): void {
    const interior = state.currentInterior;
    if(!interior || !characterLibrary) return;
    const spots = hotspotsFor(interior);
    const key = `${interior.kind}|${interior.refId}|${interior.floor ?? 0}|${spots.map(h => `${h.id}@${h.x},${h.y}`).join(';')}`;
    if(!interiorScene3d){
      interiorScene3d = new THREE.Scene();
      interiorScene3d.background = new THREE.Color('#0d0e13');
      interiorCamera = new THREE.PerspectiveCamera(50, camera3d.aspect, 1, 3000);
    }
    if(key !== interiorViewKey){
      if(interiorView){ interiorScene3d.remove(interiorView.root); interiorView.dispose(); }
      const library = characterLibrary;
      const floor = interior.floor ?? 0;
      interiorView = buildInteriorRoom3d(THREE, {
        kind:interior.kind, refId:interior.refId, room:{ ...roomSize(), door:doorLocal() }, door:floor ? null : doorLocal(), spots,
        plan:planFor(interior), floor,
        makePerson:(identity, coat) => library.create(identity, coat),
        makeCar:interiorCarModel,
        merge:mergeSceneryGeometries ?? undefined,
      });
      interiorViewKey = key;
      interiorScene3d.add(interiorView.root);
    }
    if(playerGroup.parent !== interiorScene3d){ interiorScene3d.add(playerGroup); byId('scene3d-container').classList.add('indoors'); }
    const s = INTERIOR_SCALE;
    playerGroup.position.set(player.x * s, 0, player.y * s);
    playerGroup.rotation.y = -player.facing + Math.PI/2;
    const near = nearestMarker();
    const index = near?.type === 'hotspot' ? spots.findIndex(h => h.id === near.ref.id && h.x === near.ref.x && h.y === near.ref.y) : -1;
    interiorView?.setHighlight(near?.type === 'door' ? 'door' : index >= 0 ? spotKey(index) : null, state.playSeconds);
    interiorView?.tick(dt);
    characterLibrary.animator.tick(dt, state.playSeconds);
    // LEGAL: A raised camera in front of the room, drifting with you so the far corners stay in view.
    const camera = interiorCamera!;
    if(camera.aspect !== camera3d.aspect){ camera.aspect = camera3d.aspect; camera.updateProjectionMatrix(); }
    if(activeCloseUp && !modalOnScreen()) activeCloseUp = null;
    // LEGAL: Overhead: a raised camera in front of the room, drifting with you. The mall is too big
    // LEGAL: to keep in view, so there it follows you closely. A close-up moves in to the thing used.
    const room = roomSize();
    const follow = room.w > ROOM_W ? 0.92 : 0.55;
    const lookX = (room.w / 2 + (player.x - room.w / 2) * follow) * s;
    const lookZ = (room.h * 0.42 + (player.y - room.h * 0.42) * (room.w > ROOM_W ? 0.85 : 0.4)) * s;
    let want = { pos:{ x:lookX, y:150, z:lookZ + 150 }, look:{ x:lookX, y:6, z:lookZ } };
    if(activeCloseUp){
      const { spot, view } = activeCloseUp;
      const thingZ = spot.y - view.depth;
      want = { pos:{ x:spot.x * s, y:view.eye * s, z:(thingZ + view.back) * s }, look:{ x:spot.x * s, y:view.height * s, z:thingZ * s } };
    }
    const glide = interiorEye.ready ? 1 - Math.exp(-6 * dt) : 1;
    (['pos', 'look'] as const).forEach(function(key){
      (['x', 'y', 'z'] as const).forEach(function(axis){ interiorEye[key][axis] += (want[key][axis] - interiorEye[key][axis]) * glide; });
    });
    interiorEye.ready = true;
    playerGroup.visible = !activeCloseUp;
    camera.position.set(interiorEye.pos.x, interiorEye.pos.y, interiorEye.pos.z);
    camera.lookAt(interiorEye.look.x, interiorEye.look.y, interiorEye.look.z);
    renderer.render(interiorScene3d, camera);
  }

  // LEGAL: ---- Moving solids: traffic and the train ----
  // LEGAL: Rebuilt once a frame. Each traffic car's velocity is measured from how far it moved,
  // LEGAL: so being run over depends on what the car actually did, not what it meant to do.
  const TRAIN_HALF_LENGTH = 125;
  const TRAIN_HALF_WIDTH = 15;
  let movingObstacles: Array<{ obstacle: Obstacle; velocity: { x: number; y: number } }> = [];
  const lastTrafficPosition = new Map<string, { x: number; y: number }>();
  function updateMovingObstacles(dt: number): void {
    movingObstacles = [];
    roamingActors.forEach(function(actor){
      if(actor.kind !== 'car' || actor.dormant) return;
      const last = lastTrafficPosition.get(actor.id) ?? { x:actor.x, y:actor.y };
      const velocity = dt > 0 ? { x:(actor.x - last.x) / dt, y:(actor.y - last.y) / dt } : { x:0, y:0 };
      lastTrafficPosition.set(actor.id, { x:actor.x, y:actor.y });
      // LEGAL: The same footprint the traffic model is drawn at (see buildTrafficCarModel).
      const size = trafficFootprint(actor.id);
      const length = size.length * VEHICLE_SCALE, width = size.width * VEHICLE_SCALE;
      movingObstacles.push({ obstacle:vehicleObstacle(actor.x, actor.y, actor.facing, length, width), velocity });
    });
    race?.rivals.forEach(function(rival){ movingObstacles.push({ obstacle:vehicleObstacle(rival.x, rival.y, rival.heading, 29 * VEHICLE_SCALE, 15 * VEHICLE_SCALE), velocity:rival.velocity }); });
    const train = activeTrainSnapshot(Date.now(), windhavenMapModel.railLines[0]);
    if(train) movingObstacles.push({ obstacle:{ x:train.point.x, y:train.point.y, halfLength:TRAIN_HALF_LENGTH, halfWidth:TRAIN_HALF_WIDTH, angle:Math.PI / 2 }, velocity:{ x:0, y:0 } });
  }
  function playerCanMove(x: number, y: number): boolean {
    if(!tryMove(x, y, currentSolids)) return false;
    if(isFlying()) return true;
    const radius = actorRadius(state.inVehicle);
    return !movingObstacles.some(moving => circleHitsObstacle(x, y, radius, moving.obstacle));
  }

  // LEGAL: ---- Getting run over ----
  const KNOCKDOWN_SECONDS = 2.2;
  let knockedDownUntil = 0;
  function isKnockedDown(): boolean { return state.playSeconds < knockedDownUntil; }
  function checkRunOver(): void {
    if(state.inVehicle || state.currentInterior || isFlying() || isKnockedDown()) return;
    const hit = movingObstacles.find(moving => isRunOverBy(player.x, player.y, actorRadius(false), moving.obstacle, moving.velocity));
    if(!hit) return;
    knockedDownUntil = state.playSeconds + KNOCKDOWN_SECONDS;
    player.vx = 0; player.vy = 0;
    // LEGAL: Thrown sideways off the car's line, towards the side you were already on, and a little
    // LEGAL: forward. Thrown straight ahead, the car just drove over you again.
    const speed = Math.hypot(hit.velocity.x, hit.velocity.y) || 1;
    const fx = hit.velocity.x / speed, fy = hit.velocity.y / speed;
    const side = Math.sign((player.x - hit.obstacle.x) * -fy + (player.y - hit.obstacle.y) * fx) || 1;
    const landing = nearestFreePoint(player.x - fy * side * 52 + fx * 16, player.y + fx * side * 52 + fy * 16, currentSolids, false, 200);
    if(landing){ player.x = landing.x; player.y = landing.y; }
    showMapToast('Splat! A car ran you over.');
  }
  // LEGAL: Flat on your back and a little squashed, then back on your feet for the last half second.
  function updateKnockdown(dt: number): void {
    const body = state.inVehicle ? null : playerGroup.children[0];
    if(!body) return;
    const down = isKnockedDown() && knockedDownUntil - state.playSeconds > 0.45;
    const ease = 1 - Math.exp(-12 * dt);
    body.rotation.x += ((down ? -Math.PI / 2 : 0) - body.rotation.x) * ease;
    body.position.y += ((down ? 4 : 0) - body.position.y) * ease;
    const squash = down ? 0.82 : 1;
    body.scale.y += (squash - body.scale.y) * ease;
  }

  // LEGAL: ---- Street racing (map/race.ts has the rules) ----
  // LEGAL: A countdown on the start line, three rivals driving the course for real, checkpoints you
  // LEGAL: have to pass in order (the GPS always points at the next), and a prize by placing.
  const RACE_COUNTDOWN = 3.2;
  const RACE_TIME_LIMIT = 180;
  const RIVALS = [
    { id:'rival-muscle', cls:'muscle' as const, color:'#7a1f2a', pace:0.93, lane:-10 },
    { id:'rival-supercar', cls:'supercar' as const, color:'#d4a017', pace:0.99, lane:10 },
    { id:'rival-roadster', cls:'roadster' as const, color:'#1f4f6b', pace:1.03, lane:-10 },
  ];
  interface RaceRival extends Racer { group: ThreeNamespace.Object3D; lane: number; x: number; y: number; heading: number; velocity: { x: number; y: number } }
  interface ActiveRace {
    course: RaceCourse;
    rivals: RaceRival[];
    playerAlong: number;
    nextCheckpoint: number;
    startsAt: number;
    playerFinishedAt: number | null;
    marker: ThreeNamespace.Object3D;
    previousCar: string | null;
    previousInVehicle: boolean;
    loaner: boolean;
  }
  let race: ActiveRace | null = null;
  function raceFrozen(): boolean { return !!race && state.playSeconds < race.startsAt; }
  // LEGAL: A point on the course, `lateral` units to the right; negative `along` is behind the line.
  function racePoint(course: RaceCourse, along: number, lateral: number): { x: number; y: number; heading: number } {
    const at = pointAlong(course, Math.max(0, along));
    const dx = Math.cos(at.heading), dy = Math.sin(at.heading);
    const back = Math.min(0, along);
    return { x:at.point.x + dx * back - dy * lateral, y:at.point.y + dy * back + dx * lateral, heading:at.heading };
  }
  function raceHud(): HTMLElement {
    let hud = byIdOrNull('race-hud');
    if(!hud){ hud = document.createElement('div'); hud.id = 'race-hud'; hud.className = 'race-hud'; byId('scene3d-container').appendChild(hud); }
    return hud;
  }
  function startRace(): void {
    if(race || !sceneInitialized) return;
    if(state.currentInterior) exitBuilding();
    const course = FIRE_ROAD_COURSE;
    const previousCar = state.equippedCar, previousInVehicle = state.inVehicle;
    const loaner = !getEquippedCar() || state.brokenCars.includes(state.equippedCar ?? '') || isFlyingVehicle(state.equippedCar);
    if(loaner) state.equippedCar = 'race-loaner';
    state.inVehicle = true;
    flyingUntil = 0;
    // LEGAL: A two-by-two grid: you and the roadster on the front row, the other two behind.
    const start = racePoint(course, -26, 10);
    player.x = start.x; player.y = start.y; player.vx = 0; player.vy = 0;
    player.facing = start.heading;
    cameraRig.snap();
    refreshPlayerModel(); updateParkedCarMesh();
    const top = currentSpeed();
    const rivals: RaceRival[] = RIVALS.map(function(spec, i){
      const group = vehicleLibrary ? vehicleLibrary.create(spec.cls, spec.color, 29, 15) : buildTrafficCarModel(spec.id, spec.color);
      group.name = `race:${spec.id}`;
      worldGroup.add(group);
      return { id:spec.id, along:-26 - (i === 2 ? 0 : 54), speed:top * spec.pace, finishedAt:null, group, lane:spec.lane, x:0, y:0, heading:0, velocity:{ x:0, y:0 } };
    });
    // LEGAL: The checkpoint gate: a ring standing across the road, turned to face the racers.
    const marker = new THREE.Mesh(new THREE.TorusGeometry(46, 3.4, 10, 36), new THREE.MeshStandardMaterial({ color:'#ffd23a', emissive:'#ffb800', emissiveIntensity:1.2, transparent:true, opacity:0.75 }));
    marker.name = 'race:checkpoint';
    worldGroup.add(marker);
    race = { course, rivals, playerAlong:0, nextCheckpoint:0, startsAt:state.playSeconds + RACE_COUNTDOWN, playerFinishedAt:null, marker, previousCar, previousInVehicle, loaner };
    placeRaceMarker();
    log('<i aria-hidden="true" class="ph-duotone ph-flag-checkered"></i> You pull up to the line at the Kestrel trailhead. Engines rev.');
  }
  function placeRaceMarker(): void {
    if(!race) return;
    const checkpoint = race.course.checkpoints[race.nextCheckpoint];
    if(!checkpoint) return;
    const at = pointAlong(race.course, checkpoint.along);
    race.marker.position.set(checkpoint.x, 34, checkpoint.y);
    race.marker.rotation.y = -at.heading;
    setGlobalWaypoint({ x:checkpoint.x, y:checkpoint.y });
    rebuildWaypointBeacon();
  }
  function updateRace(dt: number): void {
    if(!race) return;
    const r = race;
    const elapsed = state.playSeconds - r.startsAt;
    const hud = raceHud();
    if(elapsed < 0){
      hud.innerHTML = `<div class="race-count">${Math.ceil(-elapsed)}</div>`;
    }
    // LEGAL: Getting out of the car is giving up.
    if(!state.inVehicle){ endRace('abandoned'); return; }
    if(elapsed >= 0){
      r.playerAlong = progressAlong(r.course, { x:player.x, y:player.y }, r.playerAlong);
      const checkpoint = r.course.checkpoints[r.nextCheckpoint];
      if(checkpoint && Math.hypot(player.x - checkpoint.x, player.y - checkpoint.y) < 80){
        r.nextCheckpoint++;
        if(r.nextCheckpoint >= r.course.checkpoints.length) r.playerFinishedAt = elapsed;
        else placeRaceMarker();
      }
    }
    // LEGAL: You can't rank ahead of a checkpoint you haven't passed.
    const rankAlong = r.playerFinishedAt !== null ? r.course.length : Math.min(r.playerAlong, r.course.checkpoints[r.nextCheckpoint]?.along ?? r.course.length);
    r.rivals.forEach(function(rival){
      const before = rival.along;
      if(elapsed >= 0) advanceRacer(rival, r.course, dt, rankAlong, elapsed);
      spinWheels(THREE, rival.group, rival.along - before);
      const at = racePoint(r.course, rival.along, rival.lane);
      rival.velocity = dt > 0 ? { x:(at.x - rival.x) / dt, y:(at.y - rival.y) / dt } : { x:0, y:0 };
      rival.x = at.x; rival.y = at.y; rival.heading = at.heading;
      rival.group.position.set(at.x, 0, at.y);
      rival.group.rotation.y = -at.heading + Math.PI / 2;
    });
    const order = placings([{ id:'you', along:rankAlong, finishedAt:r.playerFinishedAt }, ...r.rivals]);
    const place = order.indexOf('you') + 1;
    if(elapsed >= 0){
      const clock = Math.max(0, elapsed);
      hud.innerHTML = `${elapsed < 1 ? '<div class="race-count go">GO</div>' : ''}<div class="race-line"><strong>${place}</strong>/${order.length} · Checkpoint ${Math.min(r.nextCheckpoint + 1, r.course.checkpoints.length)}/${r.course.checkpoints.length} · ${Math.floor(clock / 60)}:${String(Math.floor(clock % 60)).padStart(2, '0')}</div>`;
    }
    if(r.playerFinishedAt !== null) endRace('finished', place, order.length);
    else if(elapsed > RACE_TIME_LIMIT) endRace('timeout', order.length, order.length);
  }
  function endRace(reason: 'finished' | 'timeout' | 'abandoned', place = 4, field = 4): void {
    const r = race;
    if(!r) return;
    race = null;
    r.rivals.forEach(rival => worldGroup.remove(rival.group));
    worldGroup.remove(r.marker);
    byIdOrNull('race-hud')?.remove();
    setGlobalWaypoint(null); rebuildWaypointBeacon(); byId('minimap-clear').classList.remove('show');
    const racedCar = getEquippedCar();
    if(reason === 'finished'){
      const prize = racePrize(place, field);
      state.cash += prize.cash; state.respect += prize.respect;
      const seconds = r.playerFinishedAt ?? 0;
      const best = typeof state.worldMemory.fireRoadBestSeconds === 'number' ? state.worldMemory.fireRoadBestSeconds : 0;
      if(isFireRoadBest(best, seconds)) state.worldMemory.fireRoadBestSeconds = seconds;
      if(place === 1 && racedCar && !r.loaner) state.carDecals[racedCar.id] = 'fire-road';
      const ordinal = ['1st', '2nd', '3rd', '4th'][place - 1] ?? `${place}th`;
      const message = `${ordinal} in ${seconds.toFixed(1)}s${prize.cash ? ` · +${formatMoney(prize.cash)}` : ''}${place === 1 && !r.loaner ? ' · Fire Road stripe' : ''}`;
      showMapToast(`Kestrel Run: ${message}`);
      log(`<i aria-hidden="true" class="ph-duotone ph-flag-checkered"></i> Kestrel Run: ${message}.`);
    } else {
      showMapToast(reason === 'timeout' ? 'The race clock ran out.' : 'You pulled out of the race.');
    }
    // LEGAL: A borrowed car goes back; you're left standing where you stopped.
    if(r.loaner){
      state.equippedCar = r.previousCar;
      state.inVehicle = false;
    }
    refreshPlayerModel(); updateParkedCarMesh(); renderAll(); scheduleSave();
  }

  // LEGAL: The experimental setting: the camera turns to follow Arjun (map/cameraRig), off by default.
  const CAMERA_FOLLOW_KEY = 'seat-camera-follow';
  let cameraFollows = (function(){ try{ return window.localStorage.getItem(CAMERA_FOLLOW_KEY) === '1'; }catch(e){ return false; } })();
  let cameraHeading = -Math.PI / 2;
  byId<HTMLInputElement>('camera-follow-toggle').checked = cameraFollows;
  byId<HTMLInputElement>('camera-follow-toggle').addEventListener('change', function(e){
    cameraFollows = (e.target as HTMLInputElement).checked;
    try{ window.localStorage.setItem(CAMERA_FOLLOW_KEY, cameraFollows ? '1' : '0'); }catch(err){}
  });
  function aimCamera(dt: number): void {
    const view = cameraRig.update({ x:player.x, y:player.y, vx:player.vx, vy:player.vy, inVehicle:state.inVehicle, dt, followHeading:cameraFollows && !state.currentInterior });
    cameraHeading = view.heading;
    camera3d.position.set(view.eye.x, view.eye.y, view.eye.z);
    camera3d.lookAt(view.target.x, view.target.y, view.target.z);
  }

  // LEGAL: ================= MAIN LOOP =================
  function mapHub(){
    if(!mapActive){ mapHubRunning = false; return; }
    const now = Date.now();
    const frameMs = now - lastFrame2;
    const dt = Math.min(0.05, Math.max(0, frameMs/1000));
    lastFrame2 = now;

    let dx=0, dy=0;
    // LEGAL: Freeze movement input while a minigame or the phone overlay is up so the
    // LEGAL: player token doesn't drift under it; the loop keeps running to hold the scene.
    // LEGAL: The expanded City Map is a full-screen overlay you read, not play through —
    // LEGAL: moving underneath it meant you walked blind and came back somewhere else.
    if(!minigameOpen() && !deviceOpen() && !cityMapOpen && !isKnockedDown() && !raceFrozen() && !document.getElementById('wardrobe-overlay')){
      if(keys['arrowup']||keys['w']) dy -= 1;
      if(keys['arrowdown']||keys['s']) dy += 1;
      if(keys['arrowleft']||keys['a']) dx -= 1;
      if(keys['arrowright']||keys['d']) dx += 1;
      const stick = touchStick.vector();
      if(stick.x || stick.y){ dx = stick.x; dy = stick.y; }
      // LEGAL: With the camera following Arjun, up on the keys is the way the camera looks.
      if(cameraFollows && !state.currentInterior && (dx || dy)){
        const fx = Math.cos(cameraHeading), fy = Math.sin(cameraHeading);
        const turnedX = fx * -dy + -fy * dx, turnedY = fy * -dy + fx * dx;
        dx = turnedX; dy = turnedY;
      }
      // LEGAL: The drunk cheat: your feet don't quite go where you point them.
      if(isDrunk() && (dx || dy)){ dx += Math.sin(state.playSeconds * 1.9) * 0.55; dy += Math.cos(state.playSeconds * 1.3) * 0.45; }
    }
    // LEGAL: Target velocity from input, then ease the actual velocity toward it so
    // LEGAL: movement accelerates and coasts instead of snapping on/off. Cars are
    // LEGAL: heavier (slower to respond and to turn) than the player on foot.
    const spd = currentSpeed();
    let tvx=0, tvy=0;
    // LEGAL: Keys give a unit direction (diagonals normalised); a thumbstick pushed part-way
    // LEGAL: has magnitude under 1 and moves that much slower.
    if(dx||dy){ const len = Math.hypot(dx,dy); const scale = Math.min(1, len)/len; tvx=dx*scale*spd; tvy=dy*scale*spd; }
    const respond = state.inVehicle ? 6 : 11;
    const ease = 1 - Math.exp(-respond*dt);
    player.vx += (tvx - player.vx)*ease;
    player.vy += (tvy - player.vy)*ease;
    const speed = Math.hypot(player.vx, player.vy);
    if(speed > 2){
      // LEGAL: Steer the heading toward the travel direction at a capped rate — the
      // LEGAL: old code snapped facing instantly, which made the car spin on a dime.
      const targetFacing = Math.atan2(player.vy, player.vx);
      let af = targetFacing - player.facing;
      while(af > Math.PI) af -= Math.PI*2;
      while(af < -Math.PI) af += Math.PI*2;
      const maxTurn = (state.inVehicle ? 7 : 14) * dt;
      player.facing += Math.max(-maxTurn, Math.min(maxTurn, af));
      const stepX = player.vx*dt, stepY = player.vy*dt;
      if(state.currentInterior){
        const room = roomSize();
        const tryX = Math.max(20, Math.min(room.w-20, player.x+stepX));
        const tryY = Math.max(20, Math.min(room.h-14, player.y+stepY));
        const solids = interiorSolids();
        const clear = (x: number, y: number) => !collidesSolid(x, y, solids, actorRadius(false));
        if(clear(tryX, tryY)){ player.x = tryX; player.y = tryY; }
        else if(clear(tryX, player.y)){ player.x = tryX; player.vy = 0; }
        else if(clear(player.x, tryY)){ player.y = tryY; player.vx = 0; }
        else { player.vx = 0; player.vy = 0; }
      } else {
        const tryX = player.x+stepX, tryY = player.y+stepY;
        if(playerCanMove(tryX,tryY)){ player.x=tryX; player.y=tryY; }
        else if(playerCanMove(tryX,player.y)){ player.x=tryX; player.vy=0; }
        else if(playerCanMove(player.x,tryY)){ player.y=tryY; player.vx=0; }
        // LEGAL: Escape hatch. If we are already inside a solid every branch above fails
        // LEGAL: and the actor is trapped for good. Allow any step that reduces how deep we
        // LEGAL: are wedged, so you can always drive back out of a building you got stuck on.
        else if(!canMoveTo(player.x, player.y, currentSolids, state.inVehicle)){
          const radius = actorRadius(state.inVehicle);
          const here = penetrationDepth(player.x, player.y, currentSolids, radius);
          if(penetrationDepth(tryX, tryY, currentSolids, radius) < here){ player.x=tryX; player.y=tryY; }
          else if(penetrationDepth(tryX, player.y, currentSolids, radius) < here){ player.x=tryX; }
          else if(penetrationDepth(player.x, tryY, currentSolids, radius) < here){ player.y=tryY; }
        }
        else { player.vx=0; player.vy=0; }
      }
    } else { player.vx=0; player.vy=0; }
    // LEGAL: Checked right after the move, on the frame loop rather than the slower game
    // LEGAL: tick, so the car stops where you drove it rather than a fraction of a second
    // LEGAL: further into the workbench.
    tickDriveInGarage();
    // LEGAL: Seamless district detection — update HUD when crossing a bridge
    if(!state.currentInterior){
      const detectedDist = playerDistrict();
      if(detectedDist && detectedDist !== state.currentDistrict){
        state.currentDistrict = detectedDist;
        renderAll();
      }
    }

    if(state.currentInterior){
      renderInteriorView(dt);
    } else {
      if(interiorView || playerGroup.parent !== scene) leaveInteriorView();
      updateDayNightLighting();
      updateWeather(dt);
      updateWaterMotion();
      updateSignalHeads();
      updateRoamingActors(roamingActors, { dt, playSeconds:state.playSeconds, indoors:!!state.currentInterior, canMove:function(x,y){ return tryMove(x,y,currentSolids); }, rescue:rescuePoint });
      characterLibrary?.animator.tick(dt, state.playSeconds, { x:player.x, z:player.y });
      updateDealerArrivals(dt);
      updateTrain();
      updateCheatEffects(dt);
      updateSmokePlumes();
      updateRace(dt);
      updateMovingObstacles(dt);
      checkRunOver();
      updateKnockdown(dt);
      if(state.inVehicle) spinWheels(THREE, playerGroup, Math.hypot(player.vx, player.vy) * dt);
      playerGroup.position.set(player.x, flightHeight, player.y);
      playerGroup.rotation.y = -player.facing + Math.PI/2;
      aimCamera(dt);
      renderer.render(scene, camera3d);
      if(document.visibilityState === 'visible' && qualityGovernor.recordFrame(frameMs)) useLowQuality();
    }
    drawMinimap();

    const near = nearestMarker();
    const hintEl = byId('map-hint');
    const outdoorStatus = (state.inVehicle ? 'Driving on ' : 'Walking on ') + currentRoadLabel() + ' | ' + mapClockLabel();
    const wp = currentWaypoint();
    if(wp && !state.currentInterior && Math.hypot(player.x-wp.x, player.y-wp.y) < (state.inVehicle ? 42 : 28)){
      setGlobalWaypoint(null);
      rebuildWaypointBeacon();
      byId('minimap-clear').classList.remove('show');
      scheduleSave();
    }
    if(near){
      let label = '';
      if(near.type==='door') label='Exit';
      else if(near.type==='hotspot') label=near.ref.label;
      else if(near.type==='car'){ const eq=getEquippedCar(); label='Enter ' + (eq?eq.name:'car'); }
      else if(near.type==='building') label=near.ref.biz.name;
      else if(near.type==='service') label=near.ref.name;
      else if(near.type==='local') label=near.ref.name;
      else if(near.type==='amenity') label=near.ref.name;
      else if(near.type==='corner') label=near.ref.name;
      else if(near.type==='gangnpc') label=near.ref.name;
      else if(near.type==='property') label=near.ref.name;
      else label = (near.ref.type==='named' ? near.ref.name : state.procNpc.name);
      hintEl.textContent = state.currentInterior ? 'Press E to interact — ' + label : 'Press E to interact — ' + label + ' | ' + outdoorStatus;
    } else if(state.inVehicle){
      hintEl.textContent = 'Press E to park | ' + outdoorStatus;
    } else {
      hintEl.textContent = state.currentInterior ? ('Inside ' + state.currentInterior.name) : outdoorStatus;
    }

    requestAnimationFrame(mapHub);
  }

  // LEGAL: ================= SETTINGS =================
  byId('quiet-toggle').addEventListener('change', function(e){
    const t = e.target as HTMLInputElement;
    document.body.classList.toggle('quiet', t.checked);
    scheduleSave();
  });
  byId('theme-toggle').addEventListener('change', function(e){
    const t = e.target as HTMLInputElement;
    if(t.checked) document.body.classList.remove('theme-delhi');
    document.body.classList.toggle('theme-light', t.checked);
    byId<HTMLInputElement>('delhi-theme-toggle').checked = false;
    scheduleSave();
  });
  byId('delhi-theme-toggle').addEventListener('change', function(e){
    const t = e.target as HTMLInputElement;
    if(t.checked) document.body.classList.remove('theme-light');
    document.body.classList.toggle('theme-delhi', t.checked);
    byId<HTMLInputElement>('theme-toggle').checked = false;
    scheduleSave();
  });
  // LEGAL: Saving is best-effort: private windows and full quotas throw, and the game stays playable.
  const storageAdapter = {
    async set(key: string, value: string){
      try { window.localStorage.setItem(key, value); } catch(e){}
    },
    async get(key: string){
      try { return window.localStorage.getItem(key); } catch(e){ return null; }
    },
    async delete(key: string){
      try { window.localStorage.removeItem(key); } catch(e){}
    }
  };

  byId('save-now-btn').addEventListener('click', function(){ saveGame(true); });
  byId('export-save-btn').addEventListener('click', function(){
    const data = JSON.stringify(serializeState(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `seat-at-the-table-save-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log('Game save exported to JSON file.');
  });
  const importSaveInput = byId<HTMLInputElement>('import-save-input');
  byId('import-save-btn').addEventListener('click', function(){
    if(importSaveInput) importSaveInput.click();
  });
  if(importSaveInput){
    importSaveInput.addEventListener('change', function(e){
      const t = e.target as HTMLInputElement;
      const file = (t && t.files) ? t.files[0] : null;
      if(!file) return;
      const reader = new FileReader();
      reader.onload = async function(evt){
        try {
          const content = evt.target ? evt.target.result : null;
          if(typeof content !== 'string') return;
          const parsed = JSON.parse(content);
          if(typeof parsed.cash === 'number' && Array.isArray(parsed.businesses)){
            stopSaving();
            await storageAdapter.set('seat-save-v1', JSON.stringify(parsed));
            showModal({
              eyebrow: 'Save File Loaded', title: 'IMPORT SUCCESSFUL', stamp: 'Restored',
              body: `<p>Save file <strong>${file.name}</strong> has been successfully verified and stored.</p><p class="flavor">Your Windhaven empire will now reload with the imported ledger.</p>`,
              buttons: [{ label: 'Enter Windhaven', onClick: function(){ location.reload(); } }]
            });
          } else {
            alert('Invalid save file structure.');
          }
        } catch(err){
          alert('Failed to parse save file. Please check that it is valid JSON.');
        }
        importSaveInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  byId('reset-btn').addEventListener('click', function(){
    showModal({
      eyebrow:'Are You Sure', title:'RESET ALL PROGRESS',
      body:`<p>This clears everything — cash, ventures, respect, territory — and starts the story over from Devlin Street, day one. There's no undoing this.</p>`,
      buttons:[
        { label:'Cancel', secondary:true },
        { label:'Reset Everything', onClick:async function(){
          stopSaving();
          try{ await storageAdapter.delete('seat-save-v1'); }catch(e){}
          location.reload();
        }},
      ]
    });
  });

  // LEGAL: ================= PERSISTENT SAVE =================
  function serializeState(){
    return {
      cash: state.cash, respect: state.respect, heat: state.heat,
      territoryTier: state.territoryTier, negotiateTier: state.negotiateTier,
      muscleCount: state.muscleCount, guns: state.guns, ratCount: state.ratCount, bribeOn: state.bribeOn,
      prestigeCount: state.prestigeCount, seenMilestones: Array.from(state.seenMilestones),
      playSeconds: state.playSeconds, investorPenalty: state.investorPenalty, appearance: state.appearance, ownedWardrobe: state.ownedWardrobe, vaultCash: state.vaultCash,
      started: state.started, procNpc: state.procNpc, lastTick: state.lastTick,
      quiet: document.body.classList.contains('quiet'),
      light: document.body.classList.contains('theme-light'),
      delhi: document.body.classList.contains('theme-delhi'),
      businesses: businesses.map(b=> ({ id:b.id, level:b.level, crew:b.crew, manager:b.manager, researched:b.researched, reinvestedIncome:b.reinvestedIncome })),
      bankAccounts: state.bankAccounts, selectedBank: state.selectedBank, nextHeistAt: state.nextHeistAt,
      ownedCars: state.ownedCars, equippedCar: state.equippedCar, ownedProperties: state.ownedProperties,
      propertyOwnedAt: state.propertyOwnedAt, brokenCars: state.brokenCars, carColors: state.carColors, carDecals: state.carDecals, carParkedAt: state.carParkedAt,
      localBusinesses: localBusinesses.map(b=> ({ id:b.id, extorted:b.extorted, extortTier:b.extortTier??0, resentment:b.resentment??0, nextRobAt:b.nextRobAt })),
      currentDistrict: state.currentDistrict, product: state.product, productLevel: state.productLevel,
      districts: districts.map(d=> ({ id:d.id, control:d.control, pushCount:d.pushCount, nextPushAt:d.nextPushAt })),
      corners: corners.map(c=> ({ id:c.id, dealer:c.dealer, busted:c.busted, bustCooldownAt:c.bustCooldownAt })),
      influence: state.influence, influenceBuys: state.influenceBuys, electedOffice: state.electedOffice,
      campaignActive: state.campaignActive, campaignStyle: state.campaignStyle, campaignEndAt: state.campaignEndAt,
      nextCampaignAt: state.nextCampaignAt, nextWarAt: state.nextWarAt,
      politicians: politicians.map(p=> ({ id:p.id, favor:p.favor, pocketed:p.pocketed })),
      gangRecruits: gangRecruits.map(g=> ({ id:g.id, inducted:g.inducted })),
      inVehicle: state.inVehicle, waypoints: state.waypoints, parkedCarPos: state.parkedCarPos,
      marketPrices: state.marketPrices, portfolio: state.portfolio, marketHistory: state.marketHistory,
      financeView: state.financeView, activeStock: state.activeStock,
      currentNews: state.currentNews, newsQueue: state.newsQueue, nextNewsAt: state.nextNewsAt,
      cityNews: state.cityNews, nextCityNewsAt: state.nextCityNewsAt,
      investigation: state.investigation, layingLow: state.layingLow,
      crackdownUntil: state.crackdownUntil, nextCrackdownAt: state.nextCrackdownAt,
      eventRepeats: state.eventRepeats, eventHistory: state.eventHistory, nextEventAt: state.nextEventAt,
      activeMissions: state.activeMissions, completedMissions: state.completedMissions,
      worldMemory: state.worldMemory
    };
  }
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSaveTime = 0;
  // LEGAL: Reset, Start New Game and import replace the save and then reload. The game also
  // LEGAL: saves on a timer and when the page closes, so it must stop saving first, or that
  // LEGAL: last save writes the old game straight back over the replacement.
  let savingStopped = false;
  function stopSaving(): void { savingStopped = true; }
  function scheduleSave(){
    const now = Date.now();
    if(saveTimer) return;
    const delay = Math.max(1000, 5000 - (now - lastSaveTime));
    saveTimer = setTimeout(function(){
      saveTimer = null;
      lastSaveTime = Date.now();
      saveGame(false);
    }, delay);
  }
  async function saveGame(manual: boolean){
    if(savingStopped) return;
    try{
      await storageAdapter.set('seat-save-v1', JSON.stringify(serializeState()));
      const stamp = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
      const statusEl = byId('save-status');
      if(statusEl) statusEl.textContent = (manual?'Saved just now — ':'Last saved ') + stamp;
    }catch(e){
      const statusEl = byId('save-status');
      if(statusEl) statusEl.textContent = 'Save failed — check storage settings';
    }
  }
  async function loadGame(){
    try{
      const res = await storageAdapter.get('seat-save-v1');
      if(res){
        const d = JSON.parse(res);
        state.cash=d.cash; state.respect=d.respect; state.heat=d.heat;
        state.territoryTier=d.territoryTier; state.negotiateTier=d.negotiateTier;
        state.muscleCount=d.muscleCount; state.guns=Math.max(0, Number(d.guns)||0); state.ratCount=d.ratCount; state.bribeOn=d.bribeOn;
        state.prestigeCount=Math.max(0, Math.min(familyTiers.length, Number(d.prestigeCount)||0)); state.seenMilestones = new Set((d.seenMilestones||[]).map((x: any)=>String(x)));
        state.playSeconds=d.playSeconds||0; state.investorPenalty=Math.min(0.5, d.investorPenalty||0);
        state.appearance = normalizeLook(d.appearance);
        state.ownedWardrobe = ownedWardrobe(d.ownedWardrobe, state.appearance);
        state.vaultCash = Math.max(0, Number(d.vaultCash) || 0);
        state.started = d.started; if(d.procNpc) state.procNpc = d.procNpc;
        if(d.lastTick) state.lastTick = d.lastTick;
        (d.businesses||[]).forEach((sb: any)=>{ const b=businesses.find(x=>x.id===sb.id); if(b){ b.level=sb.level; b.crew=sb.crew; b.manager=sb.manager; b.researched=sb.researched; b.reinvestedIncome=Math.max(0, Number(sb.reinvestedIncome)||0); } });
        if(d.quiet){ document.body.classList.add('quiet'); byId<HTMLInputElement>('quiet-toggle').checked = true; }
        if(d.light){ document.body.classList.add('theme-light'); byId<HTMLInputElement>('theme-toggle').checked = true; }
        if(d.delhi){ document.body.classList.add('theme-delhi'); byId<HTMLInputElement>('delhi-theme-toggle').checked = true; }
        if(state.seenMilestones.has('chaat_house')) byId('delhi-theme-row').style.display = 'flex';
        // LEGAL: Multi-bank accounts, migrating an old single `bank` balance (pre-Phase-2
        // LEGAL: saves) into the default bank. Guard selectedBank against a stale id.
        state.bankAccounts = (d.bankAccounts && typeof d.bankAccounts === 'object') ? d.bankAccounts : {};
        if(!d.bankAccounts && d.bank) state.bankAccounts[DEFAULT_BANK_ID] = Number(d.bank) || 0;
        state.selectedBank = banks.some(b=>b.id===d.selectedBank) ? d.selectedBank : DEFAULT_BANK_ID;
        state.nextHeistAt = d.nextHeistAt||0;
        state.ownedCars = d.ownedCars||[]; state.equippedCar = d.equippedCar||null; state.ownedProperties = d.ownedProperties||[];
        // LEGAL: Saves from before the brand caveats have neither field. Properties owned
        // LEGAL: back then start their appreciation clock now rather than claiming credit
        // LEGAL: for time held before the mechanic existed, and no car starts broken.
        state.brokenCars = Array.isArray(d.brokenCars) ? d.brokenCars.filter((id: unknown)=> typeof id === 'string') : [];
        // LEGAL: Older saves predate respray, so an absent map is normal, not corrupt.
        state.carColors = (d.carColors && typeof d.carColors === 'object') ? d.carColors as Record<string,string> : {};
        state.carDecals = (d.carDecals && typeof d.carDecals === 'object') ? d.carDecals as Record<string,string> : {};
        state.carParkedAt = typeof d.carParkedAt === 'number' ? d.carParkedAt : null;
        state.propertyOwnedAt = (d.propertyOwnedAt && typeof d.propertyOwnedAt === 'object') ? { ...d.propertyOwnedAt } : {};
        state.ownedProperties.forEach(function(id){
          if(typeof state.propertyOwnedAt[id] !== 'number') state.propertyOwnedAt[id] = state.playSeconds;
        });
        (d.localBusinesses||[]).forEach((sb: any)=>{ const b=localBusinesses.find(x=>x.id===sb.id); if(b){ b.extorted=sb.extorted; b.extortTier=Number(sb.extortTier)||0; b.resentment=Number(sb.resentment)||0; b.nextRobAt=sb.nextRobAt; } });
        state.currentDistrict = d.currentDistrict || 'devlin'; state.product = d.product||0; state.productLevel = d.productLevel||0;
        (d.districts||[]).forEach((sd: any)=>{ const dist=districts.find(x=>x.id===sd.id); if(dist){ dist.control=sd.control; dist.pushCount=sd.pushCount; dist.nextPushAt=sd.nextPushAt; } });
        (d.corners||[]).forEach((sc: any)=>{ const c=corners.find(x=>x.id===sc.id); if(c){ c.dealer=sc.dealer; c.busted=sc.busted; c.bustCooldownAt=sc.bustCooldownAt; } });
        state.influence=d.influence||0; state.influenceBuys=d.influenceBuys||0; state.electedOffice=d.electedOffice||false;
        state.campaignActive=d.campaignActive||false; state.campaignStyle=d.campaignStyle||''; state.campaignEndAt=d.campaignEndAt||0;
        state.nextCampaignAt=d.nextCampaignAt||0; state.nextWarAt=d.nextWarAt||0;
        (d.politicians||[]).forEach((sp: any)=>{ const p=politicians.find(x=>x.id===sp.id); if(p){ p.favor=sp.favor; p.pocketed=sp.pocketed||false; } });
        (d.gangRecruits||[]).forEach((sg: any)=>{ const g=gangRecruits.find(x=>x.id===sg.id); if(g) g.inducted=sg.inducted; });
        state.inVehicle = d.inVehicle||false;
        state.waypoints = Object.assign({devlin:null,westside:null,hub:null,global:null}, d.waypoints||{});
        state.parkedCarPos = Object.assign(defaultParkedCarPositions(), d.parkedCarPos||{});
        state.marketPrices = d.marketPrices || {};
        state.portfolio = d.portfolio || {};
        state.marketHistory = d.marketHistory || {};
        state.financeView = d.financeView || 'vault';
        state.activeStock = d.activeStock || null;
        state.currentNews = d.currentNews || [];
        state.newsQueue = d.newsQueue || [];
        state.nextNewsAt = d.nextNewsAt || 0;
        state.cityNews = d.cityNews || [];
        state.nextCityNewsAt = d.nextCityNewsAt || (state.playSeconds + 90);
        state.investigation = Math.max(0, Math.min(100, Number(d.investigation)||0));
        state.layingLow = !!d.layingLow;
        state.crackdownUntil = Number(d.crackdownUntil)||0;
        state.nextCrackdownAt = Number(d.nextCrackdownAt) || (state.playSeconds + 360);
        // LEGAL: Saves from before the event timer was saved would otherwise fire an event on load.
        state.nextEventAt = Number(d.nextEventAt) || (state.playSeconds + firstEventDelay());
        const missionSave = missionSaveDefaults(d);
        state.eventRepeats = missionSave.eventRepeats;
        state.eventHistory = missionSave.eventHistory;
        state.activeMissions = missionSave.activeMissions;
        state.completedMissions = missionSave.completedMissions;
        state.worldMemory = missionSave.worldMemory;
        // LEGAL: Initialize any missing stocks in the market
        stockMarket.forEach(s => {
          if(!state.marketPrices[s.symbol]) state.marketPrices[s.symbol] = s.basePrice;
          if(!state.portfolio[s.symbol]) state.portfolio[s.symbol] = { shares: 0, avgCost: 0 };
          if(!state.marketHistory[s.symbol]) state.marketHistory[s.symbol] = [];
        });
        return true;
      }
    }catch(e){ /* no save yet */ }
    return false;
  }

  // LEGAL: ================= GAME LOOP =================
  let lastFrame = Date.now();
  setInterval(function(){
    if(!state.started) return;
    const now = Date.now();
    const dt = Math.min(2, (now-lastFrame)/1000);
    lastFrame = now;
    // LEGAL: Browsers keep a hidden tab's timers running, only slower. Time away is paid by
    // LEGAL: the business report on return; ticking here as well would pay it twice.
    if(document.visibilityState !== 'visible') return;
    state.playSeconds += dt;
    syncTonicVision();
    deliverDelayedFollowUp();

    state.cash += netIncome()*dt;
    if(deepakActive()){
      businesses.forEach(b=>{
        if(!b.manager || b.level<=0) return;
        const reinvestment = incomeFor(b) * globalIncomeMult() * 0.1 * dt;
        state.cash = Math.max(0, state.cash-reinvestment);
        b.reinvestedIncome += reinvestment;
        let levelsAdded = 0;
        while(levelsAdded < 25 && b.reinvestedIncome >= costForLevel(b)){
          b.reinvestedIncome -= costForLevel(b);
          b.level += 1;
          levelsAdded += 1;
        }
      });
    }
    state.respect += respectPerSec()*dt;
    // LEGAL: Interest accrues per account at that bank's own rate (hub bonus still global).
    const interestMult = hubInterestMult();
    banks.forEach(function(b){
      const bal = state.bankAccounts[b.id] ?? 0;
      if(bal > 0) state.bankAccounts[b.id] = bal + bal * b.interestRate * interestMult * dt;
    });
    checkMilestones();
    tickBrandCaveats(dt);
    tickGarageReturn();

    if (state.playSeconds > state.nextMarketTickAt) {
      tickMarket();
      state.nextMarketTickAt = state.playSeconds + 3; // LEGAL: Tick market every 3 seconds
    }

    // LEGAL: The Lab produces Product; active corners consume it to generate the
    // LEGAL: income already counted in netIncome() above via cornerIncomePerSec().
    if(state.productLevel > 0){
      state.product = Math.min(productCap(), state.product + state.productLevel*1.1*dt);
    }
    if(state.product > 0){
      state.product = Math.max(0, state.product - cornerDemandPerSec()*dt);
    }

    // LEGAL: Escalating WANTED-tier consequences. WATCHED+ (tier 2) starts busting
    // LEGAL: corners; HEAT+ (tier 3) risks stash-house seizures. Crackdowns worsen both.
    const tier = wantedTier();
    if(tier >= 2){
      const bustRoll = (tier-1) * 0.009 * dt * (chinoInducted() ? 0.85 : 1) * (crackdownActive() ? 1.8 : 1);
      corners.forEach(c=>{
        if(c.dealer && !c.busted && Math.random() < bustRoll){
          c.busted = true; c.dealer = false; c.bustCooldownAt = state.playSeconds + 180;
          state.product = Math.max(0, state.product - state.product*0.3*whitmoreMult());
          state.cash = Math.max(0, state.cash - 200*c.tier*whitmoreMult());
          log(`<i aria-hidden="true" class="ph-duotone ph-siren"></i> ${c.name} gets hit. Dealer's gone, some product's gone with it.`);
        }
      });
    }
    if(tier >= 3 && state.product > 0 && Math.random() < 0.02*dt){
      const seized = state.product * 0.25 * whitmoreMult();
      state.product = Math.max(0, state.product - seized);
      log(`<i aria-hidden="true" class="ph-duotone ph-package"></i> A stash house gets tossed — ${Math.round(seized)} product seized.`);
    }
    corners.forEach(c=>{ if(c.busted && state.playSeconds >= c.bustCooldownAt) c.busted = false; });

    // LEGAL: Territory drifts toward whoever's actually maintaining a presence there.
    districts.forEach(d=>{
      const drift = districtDriftBreakdown(d);
      d.control = Math.max(0, Math.min(100, d.control + drift.netDrift*dt));
    });

    // LEGAL: Extortion upkeep — resentment climbs (faster the harder you squeeze, slower
    // LEGAL: with muscle on the street); at 100% the owner quits paying and rats you out.
    localBusinesses.forEach(function(b){
      if(!b.extorted) return;
      const rate = 0.22 * extortLevel(b) * (state.muscleCount>0 ? 0.6 : 1);
      b.resentment = Math.min(100, (b.resentment ?? 0) + rate*dt);
      if((b.resentment ?? 0) >= 100){
        b.extorted = false; b.extortTier = 0; b.resentment = 0;
        state.heat = Math.min(100, state.heat + 12);
        state.investigation = Math.min(100, state.investigation + 6);
        log(`🐀 ${b.owner} has had enough — they stop paying and go to the cops. Heat spikes.`);
      }
    });

    // LEGAL: Heat settles toward a level set by current activity. The cooldown grows
    // LEGAL: with the SQUARE of current heat, giving a concave curve: even light rackets
    // LEGAL: register (Noticed), moderate operations climb into HEAT, and only a heavy,
    // LEGAL: sprawling operation pins the top — instead of marching uniformly to a cliff.
    const hb = heatBreakdown();
    state.heat = Math.max(0, Math.min(100, state.heat + hb.net * dt));

    // LEGAL: Sustained HEAT/RAID tiers build the federal case; backing off cools it,
    // LEGAL: but far slower than it built (hysteresis — the walls close in).
    const tierNow = wantedTier();
    let invDelta;
    if(tierNow >= 4)       invDelta = 1.4;
    else if(tierNow === 3) invDelta = 0.7;
    else if(tierNow === 2) invDelta = 0.15;
    else                   invDelta = -(state.layingLow ? 1.2 : 0.35);
    if(invDelta > 0){ invDelta *= investigationBuildMult(); if(crackdownActive()) invDelta *= 1.8; }
    state.investigation = Math.max(0, Math.min(100, state.investigation + invDelta * dt));

    // LEGAL: Crackdown waves — periodic citywide sweeps that spike heat and busts.
    if(state.playSeconds >= state.nextCrackdownAt){
      if(illegalFrontCount() > 0 && !crackdownActive()){
        state.crackdownUntil = state.playSeconds + 75;
        pushCityNews(`POLICE COMMISSIONER ORDERS CITYWIDE SWEEP OF ${districtDisplayName(state.currentDistrict).toUpperCase()}`, true);
        log(`🚨 <strong>Citywide crackdown.</strong> Heat runs hot and busts spike for a while — consider laying low.`);
      }
      state.nextCrackdownAt = state.playSeconds + 300 + Math.random()*300;
    }

    if(state.investigation >= 100) triggerRaid();


    if(state.playSeconds >= state.nextCityNewsAt) tickCityNews();
    maybeTriggerEvent();
    refreshHUD();
    refreshAffordability();
    scheduleSave();
    if(document.visibilityState === 'visible') state.lastTick = now;
  }, 250);

  function applyOfflineProgress(fromTime: number): boolean {
    const away = (Date.now() - fromTime)/1000;
    if(away <= 25) return false;
    const capped = Math.min(away, 7200);
    const earned = netIncome() * capped;
    state.cash += earned;
    const mins = Math.max(1, Math.round(capped/60));
    showModal({ eyebrow:'Business Report', title:"WHILE YOU WERE OUT",
      body:`<p>Managers and crew kept things running. In the <strong>${mins} minute${mins===1?'':'s'}</strong> you were gone, the operation cleared <strong>${formatMoney(earned)}</strong>.</p>`,
      buttons:[{label:'Good'}] });
    log(`Business Report: ${formatMoney(earned)} earned while you were away.`);
    return true;
  }

  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState==='visible' && state.started){
      if(applyOfflineProgress(state.lastTick)) renderAll();
      state.lastTick = Date.now();
    }
    if(document.visibilityState==='hidden'){
      state.lastTick = Date.now();
      saveGame(false);
    }
  });
  window.addEventListener('beforeunload', function(){ saveGame(true); });
  function enterLoadedGame(): void {
    hideStartScreen();
    applyOfflineProgress(state.lastTick);
    state.lastTick = Date.now();
    const spawn = spawnPoints[state.currentDistrict] || {x:700,y:460};
    player.x = spawn.x; player.y = spawn.y;
    buildDistrictScene(state.currentDistrict);
    refreshPlayerModel();
    renderAll();
    log('Picked up right where you left off.');
  }

  function startNewGame(): void {
    hideStartScreen();
    state.started = true; state.lastTick = Date.now(); lastFrame = Date.now();
    renderAll();
    log('Day one. Forty-seven dollars and a folding table on Devlin Street.');
    scheduleSave();
  }
  function toggleStartPanel(panelId: string): void {
    ['start-settings-panel','start-credits-panel','start-new-warning'].forEach(function(id){
      const panel = byId(id);
      if(id === panelId) panel.classList.toggle('hidden');
      else panel.classList.add('hidden');
    });
  }
  byId('continue-game-btn').addEventListener('click', enterLoadedGame);
  byId('start-game-btn').addEventListener('click', function(){
    if(state.started) toggleStartPanel('start-new-warning');
    else startNewGame();
  });
  byId('start-settings-btn').addEventListener('click', function(){ toggleStartPanel('start-settings-panel'); });
  byId('start-credits-btn').addEventListener('click', function(){ toggleStartPanel('start-credits-panel'); });
  byId('cancel-new-game-btn').addEventListener('click', function(){ byId('start-new-warning').classList.add('hidden'); });
  byId('confirm-new-game-btn').addEventListener('click', async function(){
    stopSaving();
    try{ await storageAdapter.delete('seat-save-v1'); }catch(e){}
    try{ window.sessionStorage.setItem('seat-start-new-after-reload', '1'); }catch(e){}
    location.reload();
  });
  byId<HTMLInputElement>('start-quiet-toggle').addEventListener('change', function(e){
    const checked = (e.target as HTMLInputElement).checked;
    byId<HTMLInputElement>('quiet-toggle').checked = checked;
    document.body.classList.toggle('quiet', checked);
    scheduleSave();
  });
  byId<HTMLInputElement>('start-light-toggle').addEventListener('change', function(e){
    const checked = (e.target as HTMLInputElement).checked;
    byId<HTMLInputElement>('theme-toggle').checked = checked;
    byId<HTMLInputElement>('delhi-theme-toggle').checked = false;
    if(checked) document.body.classList.remove('theme-delhi');
    document.body.classList.toggle('theme-light', checked);
    scheduleSave();
  });

  // LEGAL: ================= BOOT =================

  // LEGAL: The tab bar sticks just under the HUD, whose height changes as it wraps on phones
  // LEGAL: or goes compact on short screens; a fixed offset hid the tabs behind it.
  function trackHudHeight(): void {
    const hud = document.querySelector<HTMLElement>('.hud')!;
    const update = function(){
      const sticky = getComputedStyle(hud).position === 'sticky';
      document.documentElement.style.setProperty('--hud-h', sticky ? `${hud.offsetHeight}px` : '0px');
    };
    new ResizeObserver(update).observe(hud);
    update();
  }

  (async function boot(){
    wireDelegation();
    trackHudHeight();
    renderSkyline(document.querySelector<HTMLElement>('.start-skyline')!);
    const loaded = await loadGame();
    preloadMapSceneWhenIdle();
    byId<HTMLInputElement>('start-quiet-toggle').checked = document.body.classList.contains('quiet');
    byId<HTMLInputElement>('start-light-toggle').checked = document.body.classList.contains('theme-light');
    try{
      if(window.sessionStorage.getItem('seat-start-new-after-reload') === '1'){
        window.sessionStorage.removeItem('seat-start-new-after-reload');
        startNewGame();
        return;
      }
    }catch(e){}
    if(loaded && state.started){
      renderAll();
      showStartScreen(true);
      return;
    }
    renderAll();
    showStartScreen(false);
  })();

  // LEGAL: ================= TOOLTIPS =================
  const globalTooltip = byId('global-tooltip');
  document.addEventListener('mouseover', (e) => {
    const target = (e.target as HTMLElement).closest('[data-tooltip]');
    if (target && globalTooltip) {
      globalTooltip.textContent = target.getAttribute('data-tooltip') || '';
      globalTooltip.classList.add('visible');
      
      const rect = target.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - globalTooltip.offsetWidth / 2;
      let top = rect.top - globalTooltip.offsetHeight - 8;
      
      if (left < 10) left = 10;
      if (left + globalTooltip.offsetWidth > window.innerWidth - 10) {
        left = window.innerWidth - globalTooltip.offsetWidth - 10;
      }
      if (top < 10) {
        top = rect.bottom + 8;
      }
      
      globalTooltip.style.left = left + 'px';
      globalTooltip.style.top = top + 'px';
    }
  });
  document.addEventListener('mouseout', (e) => {
    if ((e.target as HTMLElement).closest('[data-tooltip]')) {
      if (globalTooltip) globalTooltip.classList.remove('visible');
    }
  });

  // LEGAL: ================= KEYBOARD SHORTCUTS =================
  document.addEventListener('keydown', (e) => {
    if (!state.started) return;
    // LEGAL: Don't trigger shortcuts if user is typing in an input
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

    // LEGAL: Save shortcut: Ctrl+S or Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      const saveBtn = byId('save-now-btn');
      if(saveBtn) saveBtn.click();
      return;
    }

    // LEGAL: Tab switching (1-5) — Finance/Assets moved to the phone, no longer tabs.
    const tabs = ['empire', 'map', 'politics', 'gang', 'settings'];
    const key = parseInt(e.key);
    if (!isNaN(key) && key >= 1 && key <= tabs.length) {
      e.preventDefault();
      const targetTab = tabs[key - 1];
      const tabBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`) as HTMLElement;
      if (tabBtn) tabBtn.click();
    }
  });
