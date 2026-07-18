import { ICONS } from '../config/icons';
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
import type { GameState, Business, ModalOptions, ModalButton, Solid, District, LocalBusiness, Corner, Politician, InteriorState, Point, ServiceBuilding, GangRecruit, Car, DialogueTree } from '../config/types';
import type { MapAssetKey, MapAssetLibrary } from '../map/assets';
import { loadMapAssetLibrary } from '../map/assets';
import { amenityHasSolidFootprint, createAmenityModal, mapAmenities } from '../map/amenities';
import { buildAmenityModel as buildMapAmenityModel } from '../map/amenityRendering';
import { createFillerLayoutProvider, seededRandom } from '../map/filler';
import { distancePointToSegment } from '../map/layout';
import { applyNamedBuildingLots, createMapBuildings, mapNpcs } from '../map/markers';
import { canMoveTo } from '../map/movement';
import { drawMinimap as drawMapMinimap, MINIMAP_SCALE } from '../map/minimap';
import type { MapObject } from '../map/objects';
import { createBounds, nearestMapObject, solidsFromObjects } from '../map/objects';
import { actorDisplayName, createRoamingActors, updateRoamingActors } from '../map/roaming';
import { buildBaseGround, buildCanalBridges, buildCanalWater, buildFillerCity, buildLandmarks, buildRailAndRiver, buildRoadNetwork, buildStreetTrees } from '../map/sceneBuilding';
import { buildIntersectionFurniture as buildMapIntersectionFurniture } from '../map/streetFurniture';
import { DISTRICT_OFFSETS, VIEW_H, VIEW_W, WORLD_H, WORLD_W, landmarks, roadNetwork, spawnPoints } from '../map/world';
import { renderZoneType } from '../map/zoning';
import type * as ThreeNamespace from 'three';

  const eventPool = [
    { id:'rival', title:'A RIVAL CREW EYES YOUR CORNER', neg:true, body:"<p class='flavor'>Word is a West Side crew thinks your runners are working streets that belong to them.</p>", choices:[
      {label:'Pay them off', sub:'-8% cash', run:function(){ state.cash *= 0.92; log('<i class="ph-duotone ph-envelope-simple"></i> You paid the rival crew to walk away quietly.'); } },
      {label:'Stand your ground', sub:'+**Respect**, +**Heat**', run:function(){ state.respect += 15; state.heat = Math.min(100, state.heat+18); log('<i class="ph-duotone ph-star"></i> You held the corner. Word travels — **Respect** earned, **Heat** too.'); } },
    ]},
    { id:'inspector', title:'A HEALTH INSPECTOR VISITS', neg:true, body:"<p class='flavor'>He's got a clipboard and a look that says he already knows the price of looking away.</p>", choices:[
      {label:'Slip an envelope', sub:'-$400 flat', run:function(){ state.cash = Math.max(0, state.cash-400); log('<i class="ph-duotone ph-envelope-simple"></i> An envelope changes hands. The clipboard closes.'); } },
      {label:'Do it by the book', sub:'legit income -15% for 45s', run:function(){ applyTempMult('legit', 0.85, 45); log('<i class="ph-duotone ph-scales"></i> You do it clean. Business slows while the paperwork clears.'); } },
    ]},
    { id:'tribune', title:'THE TRIBUNE WANTS AN INTERVIEW', neg:false, body:"<p class='flavor'>A reporter's been asking around Devlin Street about the man building an empire out of a folding cart.</p>", choices:[
      {label:'Give the interview', sub:'legit income +25% for 60s', run:function(){ applyTempMult('legit', 1.25, 60); log('<i class="ph-duotone ph-microphone-stage"></i> The story runs. Foot traffic spikes across every storefront.'); } },
      {label:'Stay quiet', sub:'+Respect', run:function(){ state.respect += 10; log('<i class="ph-duotone ph-star"></i> You decline. Some people respect a man who doesn\'t need the attention.'); } },
    ]},
    { id:'cousin', title:'A COUSIN FROM DELHI CALLS', neg:false, body:"<p class='flavor'>He needs help. It's the kind of call you don't get to think about for very long.</p>", choices:[
      {label:'Send the money', sub:'-$600 flat', run:function(){ state.cash = Math.max(0, state.cash-600); log('<i class="ph-duotone ph-users"></i> You wire the money home. Family first.'); } },
      {label:"Can't spare it", sub:'-5 Respect', run:function(){ state.respect = Math.max(0, state.respect-5); log('<i class="ph-duotone ph-users"></i> You explain you can\'t, not right now. It sits with you.'); } },
    ]},
    { id:'cops', title:'COPS ARE ASKING QUESTIONS', neg:true, body:"<p class='flavor'>Nothing official yet. Just questions, in the way that always precedes something official.</p>", choices:[
      {label:'Have your network handle it', sub:'-$900, -30 Heat', run:function(){ state.cash=Math.max(0,state.cash-900); state.heat=Math.max(0,state.heat-30); log('<i class="ph-duotone ph-warning"></i> Your underground network pulls strings. The questions stop.'); } },
      {label:'Lay low', sub:'all income -20% for 40s', run:function(){ applyTempMult('all', 0.8, 40); log('<i class="ph-duotone ph-warning"></i> You lay low for a while. Everything slows down.'); } },
    ]},
    { id:'hustler', title:'A TALENTED HUSTLER WANTS IN', neg:false, body:"<p class='flavor'>Sharp, hungry, reminds you a little of yourself six months ago.</p>", choices:[
      {label:'Hire them on', sub:'free crew member, random venture', run:function(){ hireFreeCrew(); } },
      {label:"Not worth the risk", sub:'+$500 flat', run:function(){ state.cash += 500; log('<i class="ph-duotone ph-users-three"></i> You pass, but they leave you something for your trouble.'); } },
    ]},
    { id:'investor', title:'A SILENT INVESTOR MAKES AN OFFER', neg:false, body:"<p class='flavor'>Cash up front, no questions, in exchange for a slice of everything going forward.</p>", choices:[
      {label:'Take the deal', sub:'+$3000, income -5% forever', run:function(){ state.cash += 3000; state.investorPenalty = Math.min(0.5, (state.investorPenalty||0) + 0.05); log('<i class="ph-duotone ph-chart-line-up"></i> Cash in hand. A little less of everything is yours now.'); } },
      {label:'Stay independent', sub:'+Respect', run:function(){ state.respect += 8; log('<i class="ph-duotone ph-star"></i> You show him the door. Independence has its own price.'); } },
    ]},
    { id:'fire', title:'A GREASE FIRE AT THE CART', neg:true, body:"<p class='flavor'>Where it all started nearly goes up in smoke.</p>", choices:[
      {label:'Pay for a fast fix', sub:'-$250 flat', run:function(){ state.cash=Math.max(0,state.cash-250); log('<i class="ph-duotone ph-warning-circle"></i> A quick repair keeps the cart running.'); } },
      {label:'Rebuild slowly', sub:'legit income -30% for 30s', run:function(){ applyTempMult('legit', 0.7, 30); log('<i class="ph-duotone ph-warning-circle"></i> No cash lost, but business limps for a while.'); } },
    ]},
  ];

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
  function devlinIncomeBonus(){ const s=districtStatus('devlin'); return s==='yours'?1.15:(s==='rival'?0.9:1); }
  function westsideHeatMult(){ const s=districtStatus('westside'); return s==='yours'?0.75:(s==='rival'?1.25:1); }
  function westsideRateBonus(){ const s=districtStatus('westside'); return s==='yours'?1.15:(s==='rival'?0.85:1); }
  function hubInterestMult(){ return districtStatus('hub')==='yours' ? 1.5 : 1; }
  function hubHeistBonus(){ return districtStatus('hub')==='yours' ? 0.10 : 0; }
  function pushCost(d: District){ return Math.ceil(20 * Math.pow(1.6, d.pushCount)); }
  function pushDistrict(id: string){
    const d = districts.find(x=>x.id===id);
    if(!d) return;
    if(state.playSeconds < d.nextPushAt) return;
    const cost = pushCost(d);
    if(state.respect < cost) return;
    state.respect -= cost;
    d.control = Math.min(100, d.control + 12);
    d.pushCount += 1;
    d.nextPushAt = state.playSeconds + 90;
    log(`<i class="ph-duotone ph-map-pin"></i> You put weight behind your claim on ${d.name}. Turf control now ${Math.round(d.control)}%.`);
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
    if(car) s += car.heistBonus*10;
    if(gangRecruits.find(g=>g.id==='les')!.inducted) s *= 1.08;
    return s;
  }
  function rivalStrength(){
    const ws = districts.find(d=>d.id==='westside')!;
    return 20 + (100-ws.control)*0.3;
  }

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
            { label:'Full assault — bigger swing, more heat', next:'result', effect:function(){ resolveWar('assault'); } },
            { label:'Targeted hits — smaller swing, safer', next:'result', effect:function(){ resolveWar('targeted'); } },
            { label:'Not tonight', next:null },
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
      npcName: 'First Windhaven Trust — After Hours',
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
      body:`<p>${npc.disposition} energy. Could be nothing, could be something.</p><p class="flavor">(New faces will show up as your territory grows — this one's just passing through for now.)</p>`,
      buttons:[
        { label:'Make conversation', onClick:function(){
          if(Math.random()<0.5){ state.respect += 3; log(`<i class="ph-duotone ph-info"></i> ${npc.name} respects the hustle. +3 respect.`); }
          else { const tip = Math.ceil(20+Math.random()*60); state.cash += tip; log(`<i class="ph-duotone ph-info"></i> Small talk with ${npc.name} turns into a $${tip} tip.`); }
          renderAll();
        }},
        { label:'Walk away', onClick:function(){} },
      ]
    });
  }

  // LEGAL: ================= STOCK MARKET =================

  // LEGAL: ================= STATE =================
  const state: GameState = {
    cash: 47, respect: 0, heat: 0,
    territoryTier: 0, negotiateTier: 0,
    muscleCount: 0, ratCount: 0, bribeOn: false,
    prestigeCount: 0, seenMilestones: new Set<string>(),
    started: false, lastTick: Date.now(), nextEventAt: 110 + Math.random()*60,
    playSeconds: 0, investorPenalty: 0,
    procNpc: generateNPC(),
    bank: 0, nextHeistAt: 0,
    ownedCars: [], equippedCar: null, ownedProperties: [],
    currentDistrict: 'devlin', product: 0, productLevel: 0, currentInterior: null,
    inVehicle: false,
    waypoints: { devlin:null, westside:null, hub:null },
    parkedCarPos: { devlin:{x:700,y:660}, westside:{x:2700,y:660}, hub:{x:4700,y:660} },
    influence: 0, influenceBuys: 0, electedOffice: false, nextCampaignAt: 0, nextWarAt: 0,
    campaignActive: false, campaignEndAt: 0, campaignStyle: '',
    portfolio: {}, marketPrices: {}, marketHistory: {}, nextMarketTickAt: 0,
    financeView: 'vault', activeStock: null,
    currentNews: [], newsQueue: [], nextNewsAt: 0,
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
  function fmt(n: number){
    const sign = n<0?'-':''; n=Math.abs(n);
    if(n < 1000) return sign+'$' + Math.floor(n);
    const units=['','K','M','B','T']; let u=0; let v=n;
    while(v>=1000 && u<units.length-1){ v/=1000; u++; }
    return sign+'$' + v.toFixed(v<10?2:1) + units[u];
  }
  function fmtR(n: number){ return Math.floor(n).toLocaleString(); }
  function hasFamilyTier(index: number){ return state.prestigeCount > index; }
  function brotherActive(){ return hasFamilyTier(0); }
  function motherActive(){ return hasFamilyTier(1); }
  function sisterActive(){ return hasFamilyTier(2); }
  function deepakActive(){ return hasFamilyTier(3); }
  function grandmotherActive(){ return hasFamilyTier(4); }
  function discountMult(){ return Math.pow(0.93, state.negotiateTier); }
  function globalIncomeMult(){ return Math.max(0.1, (brotherActive()?1.5:1) * (1 - (state.investorPenalty||0))); }
  function nadiaInducted(){ return gangRecruits.find(g=>g.id==='nadia')!.inducted; }
  function chinoInducted(){ return gangRecruits.find(g=>g.id==='chino')!.inducted; }
  function birdInducted(){ return gangRecruits.find(g=>g.id==='bird')!.inducted; }
  function whitmoreMult(){ return whitmoreActive() ? 0.7 : 1; }
  function researchCostFor(b: Business){ return Math.ceil(b.researchCost * discountMult() * (coleActive()?0.9:1)); }
  function heatMult(){ return Math.max(0.3, (state.bribeOn?0.4:1) * (motherActive()?0.65:1) * (boyleActive()?0.8:1) * (nadiaInducted()?0.9:1)); }
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
  function hireFreeCrew(){
    const eligible = businesses.filter(b=> b.researched && !b.manager && b.level>0 && b.crew < crewNeeded(b)+2 && crewUsedGlobal() < crewCapGlobal());
    if(eligible.length===0){ state.cash += 400; log(`<i class="ph-duotone ph-handshake"></i> No open spot for them — they take a cash finder\'s fee instead.`); return; }
    const b = eligible[Math.floor(Math.random()*eligible.length)];
    b.crew += 1;
    log(`<i class="ph-duotone ph-handshake"></i> They join the crew at ${b.name}, no questions asked.`);
  }
  function incomeFor(b: Business){ return b.level * b.baseIncome * efficiency(b) * tempMultActive(b); }
  function getEquippedCar(){ return cars.find(c=>c.id===state.equippedCar) || null; }
  function propertiesIncome(){ return state.ownedProperties.reduce((s,id)=>{ const p=properties.find(x=>x.id===id); return s+(p?p.incomePerSec:0); }, 0); }
  function localBizIncome(){ return localBusinesses.filter(b=>b.extorted).reduce((s,b)=> s+b.extortIncome, 0); }
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
  function rawTotalIncome(){ return (businesses.reduce((s,b)=> s+incomeFor(b), 0)*devlinIncomeBonus() + propertiesIncome() + localBizIncome() + cornerIncomePerSec() + electedOfficeIncome()) * globalIncomeMult(); }
  function bribeUpkeep(){ return state.bribeOn ? rawTotalIncome()*0.12 : 0; }
  function netIncome(){ return rawTotalIncome() - bribeUpkeep(); }
  function respectPerSec(){ const car=getEquippedCar(); return (state.muscleCount*0.6 + (car?car.respectPerSec:0)) * (grandmotherActive()?1.25:1); }
  function heatGenPerSec(){
    const streetHeat = businesses.filter(b=>b.category==='street').reduce((s,b)=> s+(b.heatPerLevel||0)*b.level, 0);
    const extortHeat = localBusinesses.filter(b=>b.extorted).reduce((s,b)=> s+b.extortHeat, 0);
    return (state.muscleCount*0.5 + streetHeat + extortHeat + cornerHeatPerSec()) * heatMult() * (state.campaignActive ? 2.5 : 1);
  }
  function currentRank(){ let r=ranks[0]; for(const rk of ranks){ if(state.respect>=rk.respect) r=rk; } return r.title; }
  function isUnlocked(b: Business){
    if(b.unlock.type==='start') return true;
    if(b.unlock.type==='cash') return state.cash>=b.unlock.value || b.level>0 || b.researched;
    if(b.unlock.type==='respect') return state.respect>=b.unlock.value || b.level>0 || b.researched;
    if(b.unlock.type==='family') return hasFamilyTier(b.unlock.value) || b.level>0 || b.researched;
    return false;
  }
  function log(msg: string){
    const wrap = byId('ticker');
    const item = document.createElement('div');
    item.className = 'ticker-item';
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    item.innerHTML = `<span class="t-time">${time}</span><span>${msg}</span>`;
    wrap.prepend(item);
    while(wrap.children.length > 45 && wrap.lastChild) wrap.removeChild(wrap.lastChild);
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
    (buttons || [{label:"Continue"}]).forEach((btnDef, idx)=>{
      const btn = document.createElement('button');
      btn.className = 'modal-btn' + (btnDef.secondary ? ' secondary' : '');
      btn.innerHTML = `` + btnDef.label;
      btn.onclick = function(){
        byId('modal-overlay').classList.add('hidden');
        if(btnDef.onClick) btnDef.onClick();
      };
      footer.appendChild(btn);
    });
    byId('modal-overlay').classList.remove('hidden');
  }

  function triggerMilestone(id: string){
    if(state.seenMilestones.has(id)) return;
    const m = milestones.find(x => x.id === id);
    if(!m) return;
    state.seenMilestones.add(id);
    showModal({ eyebrow:'Windhaven Herald — West Side Edition', title:m.title, body:m.body, buttons:[{label:'Keep Going'}] });
    log(`<i class="ph-duotone ph-newspaper"></i> Headline: "${m.title.charAt(0)}${m.title.slice(1).toLowerCase()}"`);
    if(id === 'chaat_house') byId('delhi-theme-row').style.display = 'flex';
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
    state.nextEventAt = state.playSeconds + 100 + Math.random()*70;
    const ratWeight = Math.max(0.35, 1 - state.ratCount*0.09);
    const pool = eventPool.filter(e=> !e.neg || Math.random() < ratWeight || Math.random() < 0.4);
    const ev = (pool.length?pool:eventPool)[Math.floor(Math.random()*(pool.length?pool.length:eventPool.length))];
    showModal({
      eyebrow:'A Decision Has to Be Made', title: ev.title, body: ev.body,
      buttons: ev.choices.map(c=> ({ label: `${c.label} (${c.sub})`, onClick: function(){ c.run(); renderAll(); } })),
    });
  }

  // LEGAL: ================= VENTURE QUICK PANEL (used by the map) =================
  function openVentureQuickPanel(b: Business){
    const unlocked = isUnlocked(b);
    let bodyHtml = `<p>${b.flavor}</p>`;
    const buttons: ModalButton[] = [];
    if(!unlocked){
      bodyHtml += `<p class="flavor">${b.unlock.type==='cash' ? ('Unlocks at '+fmt(b.unlock.value)+' cash') : ('value' in b.unlock ? ('Unlocks at '+b.unlock.value+' respect') : '')}</p>`;
    } else if(!b.researched){
      const rc = researchCostFor(b);
      buttons.push({ label:`Research (${fmt(rc)})`, onClick:function(){ if(state.cash>=rc){ state.cash-=rc; b.researched=true; log(`<i class="ph-duotone ph-flask"></i> You research ${b.name}.`);} renderAll(); }});
    } else {
      bodyHtml += `<p class="flavor">Level ${b.level} · ${incomeFor(b).toFixed(1)}/s · Efficiency ${Math.round(efficiency(b)*100)}%</p>`;
      const cost = costForLevel(b);
      buttons.push({ label:`${b.level===0?'Open':'Expand'} (${fmt(cost)})`, onClick:function(){ if(state.cash>=cost){ state.cash-=cost; b.level+=1; if(b.category==='street') state.respect+=1; if(b.level===1){ triggerMilestone('first_venture'); if(b.id==='restaurant') triggerMilestone('chaat_house'); if(b.id==='syndicate_logistics') triggerMilestone('docks'); } } renderAll(); }});
      if(!b.manager){
        const cc = crewCostFor(b);
        buttons.push({ label:`+ Crew (${fmt(cc)})`, onClick:function(){ if(state.cash>=cc && crewUsedGlobal()<crewCapGlobal()){ state.cash-=cc; b.crew+=1; } renderAll(); }});
      }
    }
    buttons.push({ label:'Close', secondary:true });
    showModal({ eyebrow: b.category==='street'?'The Other Ledger':'Ventures', title:b.name, body:bodyHtml, buttons });
  }

  // LEGAL: ================= BANK =================
  function depositAmount(rawAmt: string | undefined){
    const amt = Math.floor(Number(rawAmt));
    if(!isFinite(amt) || amt<=0){ log('<i class="ph-duotone ph-bank"></i> Enter a valid amount to deposit.'); return; }
    if(amt > state.cash){ log(`<i class="ph-duotone ph-vault"></i> You don't have ${fmt(amt)} on hand to deposit.`); return; }
    state.cash -= amt; state.bank += amt;
    log(`<i class="ph-duotone ph-vault"></i> You deposit ${fmt(amt)}. Safe from raids in there.`);
    renderAll();
  }
  function withdrawAmount(rawAmt: string | undefined){
    const amt = Math.floor(Number(rawAmt));
    if(!isFinite(amt) || amt<=0){ log('<i class="ph-duotone ph-bank"></i> Enter a valid amount to withdraw.'); return; }
    if(amt > state.bank){ log(`<i class="ph-duotone ph-vault"></i> There's only ${fmt(state.bank)} banked.`); return; }
    state.bank -= amt; state.cash += amt;
    log(`<i class="ph-duotone ph-vault"></i> You withdraw ${fmt(amt)}.`);
    renderAll();
  }
  function resolveHeist(approach: string){
    const car = getEquippedCar();
    const carBonus = car ? car.heistBonus : 0;
    let chance, reward, failLossPct, heatOnAttempt, heatOnFail, respectOnFail;
    if(approach==='smash'){
      chance = Math.min(0.7, 0.40 + state.ratCount*0.03 + carBonus + hubHeistBonus());
      reward = Math.round(Math.max(500, rawTotalIncome()*18) * (0.8+Math.random()*0.5));
      failLossPct = 0.15; heatOnAttempt = 10; heatOnFail = 15; respectOnFail = 3;
    } else {
      chance = Math.min(0.78, 0.30 + state.muscleCount*0.04 + state.ratCount*0.03 + carBonus + hubHeistBonus());
      reward = Math.round(Math.max(1800, rawTotalIncome()*50) * (0.8+Math.random()*0.5));
      failLossPct = 0.22; heatOnAttempt = 20; heatOnFail = 25; respectOnFail = 10;
    }
    state.heat = Math.min(100, state.heat + heatOnAttempt);
    state.nextHeistAt = state.playSeconds + 420;
    const win = Math.random() < chance;
    if(win){
      state.cash += reward;
      state.respect += Math.ceil(reward/400);
      triggerMilestone('heist');
      log(`<i class="ph-duotone ph-money"></i> The job on First Windhaven Trust pays out ${fmt(reward)}.`);
      dialogues.bankheist.nodes.result.text = `Clean. You're out before the second patrol even swings back. <strong>${fmt(reward)}</strong> heavier, and word will get around.`;
    } else {
      const loss = Math.round(state.cash*failLossPct);
      state.cash = Math.max(0, state.cash-loss);
      state.heat = Math.min(100, state.heat+heatOnFail);
      state.respect = Math.max(0, state.respect-respectOnFail);
      log(`<i class="ph-duotone ph-siren"></i> The job on First Windhaven Trust goes sideways. Down ${fmt(loss)}, heat's up.`);
      dialogues.bankheist.nodes.result.text = `It goes sideways fast. You get out, but not clean — <strong>${fmt(loss)}</strong> lost on the way, and there's heat on you now that wasn't there this morning.`;
    }
    renderAll();
  }

  // LEGAL: ================= LOCAL BUSINESSES (map-only, rob/extort) =================
  function robLocalBiz(biz: LocalBusiness){
    const car = getEquippedCar();
    const carBonus = car ? car.heistBonus : 0;
    let chance = 0.55 + state.ratCount*0.03 + carBonus - (state.heat>60 ? 0.15 : 0);
    chance = Math.max(0.15, Math.min(0.85, chance));
    biz.nextRobAt = state.playSeconds + 240;
    if(Math.random() < chance){
      const reward = Math.round(biz.robBase * (0.8+Math.random()*0.6));
      state.cash += reward; state.respect += 2; state.heat = Math.min(100, state.heat+8);
      log(`<i class="ph-duotone ph-currency-dollar"></i> You hit the till at ${biz.name} for ${fmt(reward)}.`);
    } else {
      const loss = Math.round(biz.robBase * 0.3);
      state.cash = Math.max(0, state.cash-loss); state.respect = Math.max(0, state.respect-3); state.heat = Math.min(100, state.heat+15);
      log(`<i class="ph-duotone ph-warning"></i> ${biz.owner} isn't an easy mark. You're out ${fmt(loss)} and it's hotter out there now.`);
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
  function openOwnerPanel(biz: LocalBusiness){
    let body = `<p>${biz.owner} runs this place. Not part of your operation — yet.</p>`;
    if(biz.extorted) body += `<p class="flavor">${biz.owner} pays tribute: +${biz.extortIncome.toFixed(1)}/s, +${biz.extortHeat.toFixed(2)} heat/s, ongoing.</p>`;
    const buttons = [];
    if(!biz.extorted){
      buttons.push({ label:'Extort (needs 30 respect)', onClick:function(){
        if(state.respect<30){ log(`<i class="ph-duotone ph-x-circle"></i> ${biz.owner} laughs you off. You don't have the reputation for this yet.`); renderAll(); return; }
        biz.extorted = true;
        triggerMilestone('extortion');
        log(`<i class="ph-duotone ph-handshake"></i> ${biz.owner} agrees to pay, one way or another.`);
        renderAll();
      }});
    } else {
      buttons.push({ label:'Let it go', onClick:function(){ biz.extorted=false; log(`<i class="ph-duotone ph-handshake"></i> You cut ${biz.owner} loose.`); renderAll(); } });
    }
    buttons.push({ label:'Walk away', secondary:true });
    showModal({ eyebrow:'Business Owner', title:biz.owner, body, buttons });
  }

  // LEGAL: ================= ASSETS: CARS & PROPERTIES =================
  function renderAssetsPanel(){
    const carsWrap = byId('assets-cars');
    const propWrap = byId('assets-buildings');
    if(!carsWrap || !propWrap) return;

    carsWrap.innerHTML = cars.map(c=>{
      const owned = state.ownedCars.includes(c.id);
      const equipped = state.equippedCar === c.id;
      let btns;
      if(!owned){
        btns = `<div class="btn-row"><button class="mini-btn" ${state.cash>=c.cost?'':'disabled'} data-car-buy="${c.id}">BUY <span class="cost">${fmt(c.cost)}</span></button></div>`;
      } else {
        btns = `<div class="btn-row">
          ${equipped ? `<span class="managed-badge" style="flex:1;text-align:center;">[DRIVING]</span>` : `<button class="mini-btn" data-car-equip="${c.id}">DRIVE</button>`}
          <button class="mini-btn fire" data-car-sell="${c.id}">SELL <span class="cost">${fmt(Math.round(c.cost*0.55))}</span></button>
        </div>`;
      }
      return `<div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.car}</div>
          <div class="col-name">${c.name}</div>
          <div class="col-status">${equipped?'EQUIPPED':(owned?'GARAGED':'SHOP')}</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">+${Math.round((c.speedMult-1)*100)}% map speed · +${Math.round(c.heistBonus*100)}% heist odds${c.respectPerSec?` · +${c.respectPerSec}/s respect`:''}</div>
          ${btns}
        </div>
      </div>`;
    }).join('');

    propWrap.innerHTML = properties.map(p=>{
      const owned = state.ownedProperties.includes(p.id);
      const btns = owned
        ? `<div class="btn-row"><button class="mini-btn fire" data-prop-sell="${p.id}">SELL <span class="cost">${fmt(Math.round(p.cost*0.6))}</span></button></div>`
        : `<div class="btn-row"><button class="mini-btn" ${state.cash>=p.cost?'':'disabled'} data-prop-buy="${p.id}">BUY <span class="cost">${fmt(p.cost)}</span></button></div>`;
      return `<div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.bld2}</div>
          <div class="col-name">${p.name}</div>
          <div class="col-inc">+${p.incomePerSec}/s</div>
          <div class="col-status">${owned?'ACTIVE':'SALE'}</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">${owned ? `Owned — earning ${p.incomePerSec}/s, no crew needed` : `Passive rental income: ${p.incomePerSec}/s, no crew needed`}</div>
          ${btns}
        </div>
      </div>`;
    }).join('');

  }

  function renderBankPanel(){
    const wrap = byId('bank-panel');
    if(!wrap) return;
    
    if(state.financeView === 'vault') {
      const canHeist = state.playSeconds >= state.nextHeistAt;
      const cooldownLeft = Math.max(0, Math.ceil(state.nextHeistAt - state.playSeconds));
      wrap.innerHTML = `
        <div class="data-table">
          <div class="data-row vault-card">
            <div class="data-main">
              <div class="col-id"><i class="ph-duotone ph-bank"></i> ${ICONS.bank}</div>
              <div class="col-name">Vault Balance</div>
              <div class="col-status">ACTIVE</div>
            </div>
            <div class="data-expanded">
              <div class="flavor-note">Cash in the bank is safe from raids and earns slow interest. Cash on hand is what actually buys things.</div>
              <div class="bank-balances-row" style="display:flex; gap:24px; margin-bottom:12px; font-family:var(--font-mono); font-size:14px; flex-wrap:wrap;">
                <div><span style="color:var(--text-faint);">BANKED:</span> <strong id="bank-banked-value" style="color:var(--green); font-size:16px;">${fmt(state.bank)}</strong></div>
                <div><span style="color:var(--text-faint);">ON HAND:</span> <strong id="bank-onhand-value" style="color:var(--text); font-size:16px;">${fmt(state.cash)}</strong></div>
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
            </div>
          </div>
          <div class="data-row">
            <div class="data-main">
              <div class="col-id">${ICONS.store}</div>
              <div class="col-name">RCN Exchange</div>
              <div class="col-status">TERMINAL</div>
            </div>
            <div class="data-expanded">
              <div class="flavor-note">The Rentport City National Exchange. Buy, sell, and short your way to the top. Just remember: the house always wins.</div>
              <div class="btn-row"><button class="mini-btn" id="go-lcn">ACCESS TERMINAL</button></div>
            </div>
          </div>
          <div class="data-row">
            <div class="data-main">
              <div class="col-id">${ICONS.box}</div>
              <div class="col-name">First Windhaven Trust</div>
              <div class="col-status" id="heist-status-value">${canHeist ? 'READY' : 'COOLDOWN'}</div>
            </div>
            <div class="data-expanded">
              <div class="flavor-note">A rival bank across town. A bigger score, and a bigger risk, than shaking down a corner shop.</div>
              <div class="btn-row"><button class="mini-btn" ${canHeist?'':'disabled'} id="start-heist">CASE THE VAULT ${canHeist?'':`(${cooldownLeft}s)`}</button></div>
            </div>
          </div>
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
        
        <div class="data-table" style="grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));">
          <div class="data-row">
            <div class="data-main">
              <div class="col-id">${ICONS.store}</div>
              <div class="col-name">Holdings</div>
              <div class="col-stat">PORTFOLIO: ${fmt(totalPortfolio)}</div>
              <div class="col-stat">LIQUID: ${fmt(state.cash)}</div>
              <div class="col-status">ACTIVE</div>
            </div>
            <div class="data-expanded">
              <div class="flavor-note">Active positions in the market.</div>
              ${stockMarket.filter(s => state.portfolio[s.symbol]?.shares > 0).map(s => {
                const pos = state.portfolio[s.symbol];
                const val = pos.shares * state.marketPrices[s.symbol];
                return `<div class="row" style="font-family:'Courier New', monospace; font-size:12px; margin-top:4px;"><span>${s.symbol} (${pos.shares} sh)</span><span>${fmt(val)}</span></div>`;
              }).join('') || '<div class="flavor-note">No active positions.</div>'}
            </div>
          </div>
          
          <div class="data-row">
            <div class="data-main">
              <div class="col-id"><i class="ph-duotone ph-newspaper"></i> ${ICONS.music}</div>
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
                <div style="background:var(--bg-row); color:var(--gold); font-family:var(--font-mono); font-weight:700; width:44px; height:44px; border-radius:6px; display:flex; align-items:center; justify-content:center; border:1px solid var(--line); font-size:16px;">
                  ${s.symbol.substring(0, 2)}
                </div>
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
            <button class="mini-btn" id="go-lcn-home" style="padding: 6px 12px; font-size:12px;"><i class="ph-duotone ph-arrow-left"></i> BACK</button>
            <span>${s.symbol} — ${s.name}</span>
          </h3>
        </div>
        <div class="flavor-note" style="margin-bottom:15px;">${s.fullDesc}</div>
        <div style="margin:20px 0;">
          <canvas id="stock-chart" width="400" height="150" style="width:100%; max-width:100%; height:150px; background:#07090c; border:1px solid var(--line); box-sizing:border-box; image-rendering:pixelated; border-radius:6px;"></canvas>
        </div>
        <div class="data-table" style="grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));">
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
                  <span style="color:var(--text); font-weight:700;">${fmt(val)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:13px; border-bottom:1px solid var(--line); padding-bottom:4px;">
                  <span style="color:var(--text-faint);">Total Return</span>
                  <span style="color:${plColor}; font-weight:700;">${pl >= 0 ? '+' : ''}${fmt(pl)}</span>
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
      
      const newsCard = byId('market-news-card');
      if(newsCard) {
        newsCard.innerHTML = state.currentNews.map(n => `<div class="flavor-note" style="margin-top:4px;">>> ${n}</div>`).join('');
      }
    }
    
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'bank') {
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
    log(`<i class="ph-duotone ph-briefcase"></i> The Lab steps up to level ${state.productLevel}. More product, more room to store it.`);
    renderAll();
  }
  function assignDealer(corner: Corner){
    if(corner.dealer || corner.busted) return;
    if(state.cash < corner.dealerCost) return;
    state.cash -= corner.dealerCost; corner.dealer = true;
    log(`<i class="ph-duotone ph-briefcase"></i> A dealer's posted at ${corner.name}.`);
    renderAll();
  }
  function fireDealer(corner: Corner){
    if(!corner.dealer) return;
    corner.dealer = false;
    log(`<i class="ph-duotone ph-briefcase"></i> You pull the dealer off ${corner.name}.`);
    renderAll();
  }
  function openCornerPanel(corner: Corner){
    const d = districts.find(x=>x.id===corner.district)!;
    let body = `<p>Tier ${corner.tier} corner in ${d.name}. ${corner.dealer ? `Staffed — moving ${corner.rate}/s when there's product to sell.` : 'No one working it right now.'}</p>`;
    if(corner.busted){
      const left = Math.max(0, Math.ceil(corner.bustCooldownAt - state.playSeconds));
      body += `<p class="flavor">Busted. Cooling off for ${left}s before anyone will work it again.</p>`;
    }
    const buttons = [];
    if(corner.busted){
      buttons.push({ label:'Too hot right now', secondary:true });
    } else if(corner.dealer){
      buttons.push({ label:'Pull the dealer', onClick:function(){ fireDealer(corner); } });
    } else {
      buttons.push({ label:`Post a dealer (${fmt(corner.dealerCost)})`, onClick:function(){ assignDealer(corner); } });
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
    log(`<i class="ph-duotone ph-bank"></i> Another envelope, another favor owed. Influence is at ${state.influence}.`);
    renderAll();
  }
  function favorCost(p: Politician){ return Math.ceil(200 * Math.pow(1.25, Math.floor(p.favor/15))); }
  function bribePolitician(id: string){
    const p = politicians.find(x=>x.id===id);
    if(!p) return;
    const cost = favorCost(p);
    if(state.cash < cost || p.favor>=100) return;
    state.cash -= cost; p.favor = Math.min(100, p.favor+15);
    log(`<i class="ph-duotone ph-envelope-simple"></i> ${p.name} takes the envelope without much of a fight. Favor: ${p.favor}.`);
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
    log('<i class="ph-duotone ph-megaphone"></i> The campaign has begun. Heat generation is doubled while the press investigates you.');
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
    log(`<i class="ph-duotone ph-handshake"></i> ${g.name} joins the crew for real. ${g.bonus}`);
    renderAll();
  }
  function resolveWar(style: string){
    const ws = districts.find(d=>d.id==='westside')!;
    const cost = style==='assault' ? 4000 : 1800;
    if(state.cash < cost){
      dialogues.gangwar.nodes.result.text = "You don't have the cash to back this up tonight. Come back when you do.";
      renderAll(); return;
    }
    state.cash -= cost;
    state.nextWarAt = state.playSeconds + 300;
    const gs = gangStrength(), rs = rivalStrength();
    const chance = Math.min(0.85, Math.max(0.15, gs/(gs+rs)));
    const win = Math.random() < chance;
    const swing = style==='assault' ? 30 : 15;
    const heatAdd = style==='assault' ? 22 : 10;
    state.heat = Math.min(100, state.heat + heatAdd);
    if(win){
      ws.control = Math.min(100, ws.control + swing);
      state.respect += style==='assault' ? 40 : 20;
      dialogues.gangwar.nodes.result.text = `It goes your way. West Side control climbs to ${Math.round(ws.control)}%. Dice's people fall back — for now.`;
      log(`<i class="ph-duotone ph-swords"></i> You push West Side control to ${Math.round(ws.control)}% after tonight.`);
    } else {
      ws.control = Math.max(0, ws.control - Math.round(swing/2));
      state.respect = Math.max(0, state.respect - 15);
      dialogues.gangwar.nodes.result.text = `It doesn't go your way. You pull back before it gets worse — West Side control drops to ${Math.round(ws.control)}%.`;
      log(`<i class="ph-duotone ph-swords"></i> The push on West Side fails. Control slips to ${Math.round(ws.control)}%.`);
    }
    renderAll();
  }

  function renderDistrictBar(){
    const wrap = byId('district-bar');
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

  type DistrictLocation = {
    id: string;
    label: string;
    kind: string;
    x: number;
    y: number;
    distance: number;
    interactable: boolean;
    status: string;
  };
  function locationKindLabel(kind: string): string {
    if(kind === 'building') return 'Venture';
    if(kind === 'service') return 'Service';
    if(kind === 'local') return 'Local Business';
    if(kind === 'corner') return 'Corner';
    if(kind === 'npc') return 'Named NPC';
    return 'Gang Recruit';
  }
  function locationName(object: MapObject): string {
    if(object.kind === 'building') return (object as MapObject<'building', typeof mapBuildings[number]>).ref.biz.name;
    return (object as MapObject<'service' | 'local' | 'amenity' | 'corner' | 'npc' | 'gangnpc', ServiceBuilding | LocalBusiness | Corner | typeof mapNpcs[number] | GangRecruit>).ref.name;
  }
  function locationStatus(object: MapObject): string {
    if(object.kind === 'building') return (object as MapObject<'building', typeof mapBuildings[number]>).ref.biz.level > 0 ? 'Open' : 'Not opened';
    if(object.kind === 'local') return (object as MapObject<'local', LocalBusiness>).ref.extorted ? 'Paying' : 'Independent';
    if(object.kind === 'corner') {
      const corner = (object as MapObject<'corner', Corner>).ref;
      return corner.busted ? 'Busted' : (corner.dealer ? 'Staffed' : 'Open');
    }
    if(object.kind === 'gangnpc') return (object as MapObject<'gangnpc', GangRecruit>).ref.inducted ? 'In crew' : 'Available';
    if(object.kind === 'npc') return (object as MapObject<'npc', typeof mapNpcs[number]>).ref.type === 'named' ? 'Named' : 'Local';
    return (object as MapObject<'service', ServiceBuilding>).ref.kind;
  }
  function districtLocations(): DistrictLocation[] {
    return mapObjects
      .filter(function(object){
        if(object.district !== state.currentDistrict) return false;
        if(object.kind === 'amenity') return false;
        if(object.kind === 'npc' && (object as MapObject<'npc', typeof mapNpcs[number]>).ref.type !== 'named') return false;
        return true;
      })
      .map(function(object){
        const distance = Math.hypot(player.x - object.x, player.y - object.y);
        return {
          id: `${object.kind}:${object.id}`,
          label: locationName(object),
          kind: locationKindLabel(object.kind),
          x: object.x,
          y: object.y,
          distance,
          interactable: !state.currentInterior && !state.inVehicle && distance <= object.interactRadius,
          status: locationStatus(object),
        };
      })
      .sort(function(a, b){ return a.distance - b.distance; });
  }
  function renderDistrictLocationsPanel(){
    const wrap = byId('district-locations-panel');
    if(!wrap) return;
    const district = districts.find(function(d){ return d.id === state.currentDistrict; });
    const locations = districtLocations();
    wrap.innerHTML = `
      <div class="district-locations-head">
        <div>
          <div class="district-locations-title">${district ? district.name : 'Current District'}</div>
          <div class="district-locations-sub">${locations.length} important locations nearby</div>
        </div>
        <div class="district-locations-key"><span class="status-pill active">Interactable</span><span class="status-pill">Waypoint</span></div>
      </div>
      <div class="district-locations-list">
        ${locations.map(function(location){
          return `<div class="district-location-row ${location.interactable ? 'is-interactable' : ''}">
            <div class="district-location-main">
              <div class="district-location-name">${location.label}</div>
              <div class="district-location-meta">${location.kind} · ${Math.round(location.distance)}m · ${location.status}</div>
            </div>
            <div class="district-location-actions">
              <span class="status-pill ${location.interactable ? 'active' : ''}">${location.interactable ? 'Interactable' : 'Out of range'}</span>
              <button class="mini-btn" data-location-waypoint="${location.id}">Waypoint</button>
            </div>
          </div>`;
        }).join('')}
      </div>
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
          <div class="btn-row"><button class="mini-btn" ${state.cash>=influenceCost()?'':'disabled'} id="buy-influence">FUND <span class="cost">${fmt(influenceCost())}</span></button></div>
        </div>
      </div>
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
          <div class="btn-row"><button class="mini-btn" ${(state.cash>=favorCost(p) && p.favor<100)?'':'disabled'} data-bribe="${p.id}">BRIBE <span class="cost">${fmt(favorCost(p))}</span></button></div>
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
          <div class="flavor-note">Muscle headcount plus every inducted member, weighed against West Side's defense.</div>
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
                  ? `<button class="mini-btn" ${state.cash>=g.cost?'':'disabled'} data-initiate="${g.id}">INITIATE <span class="cost">${fmt(g.cost)}</span></button>`
                  : `<div class="lock-note">Needs ${g.reqRespect} respect (currently ${Math.round(state.respect)})</div>`
              }
            </div>
          </div>
        </div>`;
      }).join('')}
      <div class="data-row">
        <div class="data-main">
          <div class="col-id"><i class="ph-duotone ph-swords"></i> ${ICONS.fist}</div>
          <div class="col-name">West Side War</div>
          <div class="col-stat">CONTROL: ${Math.round(districts.find(d=>d.id==='westside')!.control)}%</div>
          <div class="col-status">ACTIVE</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Declare on Dice's people directly — a bigger, faster swing on control than pushing alone, backed by your actual Gang Strength.</div>
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
    let main = `<div class="data-main" onclick="if(${unlocked}) this.parentElement.classList.toggle('open')">
      <div class="col-id">${b.icon}</div>
      <div class="col-name">${b.name}<div class="col-name-sub">${b.category==='legit'?'Corporate Front':'Illicit Operation'}</div></div>`;
      
    if(!unlocked){
      let note = b.unlock.type==='cash' ? `Requires ${fmt(b.unlock.value)} cash` : ('value' in b.unlock ? `Requires ${b.unlock.value} **Respect**` : '');
      main += `<div class="col-lvl">-</div><div class="col-inc">-</div><div class="col-crew">-</div><div class="col-status">${note}</div></div>`;
      el.innerHTML = main;
      return el;
    }

    if(!b.researched){
      main += `<div class="col-lvl">-</div><div class="col-inc">-</div><div class="col-crew">-</div><div class="col-status">UNRESEARCHED</div></div>`;
      const rc = researchCostFor(b);
      const exp = `<div class="data-expanded">
        <div class="flavor-note">${b.flavor}</div>
        <div class="btn-row"><button class="mini-btn" ${state.cash>=rc?'':'disabled'} data-action="research" data-id="${b.id}">RESEARCH <span class="cost">${fmt(rc)}</span></button></div>
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
        <button class="mini-btn" ${state.cash>=cost?'':'disabled'} data-action="expand" data-id="${b.id}">${b.level===0?'OPEN':'EXPAND'} <span class="cost">${fmt(cost)}</span></button>
      </div>`;

    if(b.manager){
      exp += `<div class="lock-note" style="margin-top:6px;">Manager ${b.managerName} installed. Operations optimal.</div>`;
    } else {
      exp += `<div class="btn-row" style="margin-top:6px;">
        <button class="mini-btn" ${canHireCrew?'':'disabled'} data-action="hirecrew" data-id="${b.id}">ASSIGN CREW <span class="cost">${fmt(crewCost)}</span></button>
        <button class="mini-btn fire" ${canFireCrew?'':'disabled'} data-action="firecrew" data-id="${b.id}">FIRE CREW <span class="cost">RND 50%</span></button>
      </div>`;
      if(b.level >= b.managerLevelReq){
        const mc = managerCostFor(b);
        exp += `<div class="btn-row" style="margin-top:6px;">
          <button class="mini-btn manager" ${state.cash>=mc?'':'disabled'} data-action="hiremanager" data-id="${b.id}">HIRE MGR <span class="cost">${fmt(mc)}</span></button>
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
      log(`<i class="ph-duotone ph-flask"></i> You research ${b.name}. It's ready to open.`);
    } else if(action==='expand'){
      const cost = costForLevel(b);
      if(state.cash<cost) return;
      state.cash -= cost; b.level += 1;
      if(b.category==='street') state.respect += 1;
      if(b.level===1) {
        log(`<i class="ph-duotone ph-briefcase"></i> ${b.name} opens its doors.`);
        triggerMilestone('first_venture');
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
      log(`<i class="ph-duotone ph-user-tie"></i> ${b.managerName} now runs ${b.name} full-time.`);
    }
    renderAll();
  }

  function handleAssetAction(e: Event){
    const btn = (e.target as HTMLElement).closest('[data-car-buy],[data-car-equip],[data-car-sell],[data-prop-buy],[data-prop-sell]');
    if(!btn) return;
    if(btn.hasAttribute('data-car-buy')){
      const id = btn.getAttribute('data-car-buy')!; const c = cars.find(x=>x.id===id);
      if(!c || state.cash<c.cost) return;
      state.cash -= c.cost; state.ownedCars.push(id);
      if(!state.equippedCar) state.equippedCar = id;
      if(id === 'bentley') triggerMilestone('bentley');
      log(`<i class="ph-duotone ph-car"></i> You pick up a ${c.name}.`); updateParkedCarMesh(); refreshPlayerModel(); renderAll();
    } else if(btn.hasAttribute('data-car-equip')){
      state.equippedCar = btn.getAttribute('data-car-equip'); updateParkedCarMesh(); refreshPlayerModel(); renderAll();
    } else if(btn.hasAttribute('data-car-sell')){
      const id = btn.getAttribute('data-car-sell')!; const c = cars.find(x=>x.id===id);
      if(!c) return;
      state.ownedCars = state.ownedCars.filter(x=>x!==id);
      if(state.equippedCar===id) state.equippedCar = state.ownedCars[0] || null;
      state.cash += Math.round(c.cost*0.55);
      log(`<i class="ph-duotone ph-car"></i> You sell the ${c.name}.`); updateParkedCarMesh(); refreshPlayerModel(); renderAll();
    } else if(btn.hasAttribute('data-prop-buy')){
      const id = btn.getAttribute('data-prop-buy')!; const p = properties.find(x=>x.id===id);
      if(!p || state.cash<p.cost) return;
      state.cash -= p.cost; state.ownedProperties.push(id);
      if(state.ownedProperties.length === 1) triggerMilestone('first_property');
      log(`🏢 You close on ${p.name}.`); renderAll();
    } else if(btn.hasAttribute('data-prop-sell')){
      const id = btn.getAttribute('data-prop-sell')!; const p = properties.find(x=>x.id===id);
      if(!p) return;
      state.ownedProperties = state.ownedProperties.filter(x=>x!==id);
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
    else if(btn.id === 'hire-rat'){ if(state.cash<ratsCashCost() || state.respect<ratsRespectCost()) return; state.cash -= ratsCashCost(); state.respect -= ratsRespectCost(); state.ratCount += 1; renderAll(); }
    else if(btn.id === 'buy-territory'){ if(state.respect<territoryCost()) return; state.respect -= territoryCost(); state.territoryTier += 1; log(`🗺️ New blocks fall under your control. Crew capacity is now ${crewCapGlobal()}.`); renderAll(); }
    else if(btn.id === 'buy-negotiate'){ if(state.respect<negotiateCost()) return; state.respect -= negotiateCost(); state.negotiateTier += 1; log(`<i class="ph-duotone ph-handshake"></i> You've got leverage now. Everyone's prices just got friendlier.`); renderAll(); }
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
      if(inp) inp.value = String(Math.floor(state.bank * Number(quickWithdraw.getAttribute('data-withdraw-quick'))));
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
      depositAmount(inp?.value);
    } else if(btn.id === 'withdraw-go'){
      const inp = byId('withdraw-input') as HTMLInputElement;
      withdrawAmount(inp?.value);
    } else if(btn.id === 'start-heist'){
      if(state.playSeconds < state.nextHeistAt) return;
      playDialogue('bankheist', 'start');
    }
  }
  function handleBankKeydown(e: KeyboardEvent){
    if((e as KeyboardEvent).key !== 'Enter') return;
    const target = e.target as HTMLInputElement;
    if(target.id === 'deposit-input') depositAmount(target.value);
    else if(target.id === 'withdraw-input') withdrawAmount(target.value);
  }


  function handleDistrictLocationsAction(e: Event){
    const btn = (e.target as HTMLElement).closest('[data-location-waypoint]');
    if(!btn) return;
    const id = btn.getAttribute('data-location-waypoint')!;
    const location = districtLocations().find(function(item){ return item.id === id; });
    if(!location) return;
    state.waypoints[state.currentDistrict] = { x:location.x, y:location.y };
    rebuildWaypointBeacon();
    byId('minimap-clear').classList.add('show');
    log(`<i class="ph-duotone ph-map-pin"></i> Waypoint set to ${location.label}.`);
    scheduleSave();
    renderDistrictLocationsPanel();
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
    if(btn.id === 'declare-war'){ if(state.playSeconds < state.nextWarAt) return; playDialogue('gangwar', 'start'); }
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
    if(dest) state.waypoints[state.currentDistrict] = { x:dest.x, y:dest.y };
    rebuildWaypointBeacon();
    log(`<i class="ph-duotone ph-path"></i> Head over to ${d?d.name:'the district'} yourself — follow the marker across the bridges.`);
  }

  // LEGAL: Wire all delegation listeners exactly once at boot. Stable containers
  // LEGAL: never get destroyed so each handler accumulates at exactly 1 per container.
  function wireDelegation(){
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
    byId('district-bar').addEventListener('click', handleDistrictAction);
    byId('district-locations-panel').addEventListener('click', handleDistrictLocationsAction);
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
          <div class="col-status">ACTIVE</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Earns respect passively. Draws heat while active.</div>
          <div class="btn-row"><button class="mini-btn" ${state.cash>=mc?'':'disabled'} id="hire-muscle">HIRE <span class="cost">${fmt(mc)}</span></button></div>
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
          <div class="col-id">${ICONS.person}</div>
          <div class="col-name">Informants</div>
          <div class="col-stat">Informants: ${state.ratCount}</div>
          <div class="col-stat" style="color:var(--green);">-RISK</div>
          <div class="col-status">ACTIVE</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Cuts the odds of bad news finding you, and softens any raid that does land.</div>
          <div class="btn-row"><button class="mini-btn" ${(state.cash>=rcCash && state.respect>=rcResp)?'':'disabled'} id="hire-rat">HIRE <span class="cost">${fmt(rcCash)} + ${rcResp} resp</span></button></div>
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
          <div class="col-status">ACTIVE</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Produces product for your dealers to sell. No product in stock, corners just idle.</div>
          <div class="btn-row"><button class="mini-btn" ${state.cash>=labCost()?'':'disabled'} id="upgrade-lab">UPGRADE <span class="cost">${fmt(labCost())}</span></button></div>
        </div>
      </div>
      <div class="data-row">
        <div class="data-main">
          <div class="col-id">${ICONS.diamond}</div>
          <div class="col-name">The Trade</div>
          <div class="col-stat">DEALERS: ${activeCorners().length}/${corners.length}</div>
          <div class="col-stat">INCOME: +${cornerIncomePerSec().toFixed(1)}/s</div>
          <div class="col-status">ACTIVE</div>
        </div>
        <div class="data-expanded">
          <div class="flavor-note">Dealers are managed from the map — walk up to a corner and press E. This is just the read-out.</div>
        </div>
      </div>
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
    renderDistrictLocationsPanel();
    renderTerritoryPanel();
    renderPoliticsPanel();
    renderGangPanel();

    byId('hud-cash').textContent = fmt(state.cash);
    byId('hud-income').textContent = (netIncome()>=0?'+':'') + fmt(netIncome()) + '/s';
    byId('hud-rank').textContent = currentRank();
    byId('hud-respect').textContent = `${fmtR(state.respect)} respect`;
    byId('heat-fill').style.width = Math.min(100, state.heat) + '%';
    byId('hud-crew').textContent = `${crewUsedGlobal()} / ${crewCapGlobal()}`;

    const prestigeBtn = byId<HTMLButtonElement>('prestige-btn');
    const threshold = 50000 * Math.pow(4, state.prestigeCount);
    const nextFamily = familyTiers[state.prestigeCount];
    if(!nextFamily){ prestigeBtn.style.display = 'none'; return; }
    if(state.cash >= threshold*0.2 || state.prestigeCount>0){
      prestigeBtn.style.display = 'inline-block';
      prestigeBtn.disabled = state.cash < threshold;
      prestigeBtn.textContent = state.cash >= threshold ? `Bring in ${nextFamily.name}` : `Bring in ${nextFamily.name} (Requires ${fmt(threshold)})`;
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
    byId('hud-cash').textContent = fmt(state.cash);
    byId('hud-income').textContent = (netIncome()>=0?'+':'') + fmt(netIncome()) + '/s';
    byId('hud-rank').textContent = rank;
    byId('hud-respect').textContent = `${fmtR(state.respect)} respect`;
    byId('heat-fill').style.width = Math.min(100, state.heat) + '%';
    byId('hud-crew').textContent = `${crewUsedGlobal()} / ${crewCapGlobal()}`;

    if(rank === 'Local Boss') triggerMilestone('local_boss');
    if(rank === 'West Side Kingpin') triggerMilestone('kingpin');

    const prestigeBtn = byId<HTMLButtonElement>('prestige-btn');
    const threshold = 50000 * Math.pow(4, state.prestigeCount);
    const nextFamily = familyTiers[state.prestigeCount];
    if(!nextFamily){ prestigeBtn.style.display = 'none'; return; }
    if(state.cash >= threshold*0.2 || state.prestigeCount>0){
      prestigeBtn.style.display = 'inline-block';
      prestigeBtn.disabled = state.cash < threshold;
      prestigeBtn.textContent = state.cash >= threshold ? `Bring in ${nextFamily.name}` : `Bring in ${nextFamily.name} (Requires ${fmt(threshold)})`;
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
    const heistBtn=byId<HTMLButtonElement>('start-heist'); if(heistBtn) heistBtn.disabled = state.playSeconds<state.nextHeistAt;
    const bankedEl=byId('bank-banked-value'); if(bankedEl) bankedEl.textContent=fmt(state.bank);
    const onhandEl=byId('bank-onhand-value'); if(onhandEl) onhandEl.textContent=fmt(state.cash);
    const heistStatusEl=byId('heist-status-value');
    if(heistStatusEl){
      const canHeist = state.playSeconds >= state.nextHeistAt;
      heistStatusEl.textContent = canHeist ? 'Ready' : `Cooling off (${Math.max(0,Math.ceil(state.nextHeistAt-state.playSeconds))}s)`;
    }
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
    const tradeEl = byId('trade-summary');
    if(tradeEl){
      const active = activeCorners().length;
      tradeEl.textContent = `${state.product.toFixed(0)}/${productCap()} product · ${active}/${corners.length} corners staffed · ${cornerIncomePerSec().toFixed(1)}/s`;
    }
  }

  // LEGAL: ================= PRESTIGE =================
  byId('prestige-btn').addEventListener('click', function(){
    if(state.prestigeCount >= familyTiers.length) return;
    const threshold = 50000 * Math.pow(4, state.prestigeCount);
    if(state.cash < threshold) return;
    const tier = familyTiers[state.prestigeCount];
    showModal({
      eyebrow:"O'Hare Terminal 5", title:"FAMILY INBOUND", stamp:'Arrived',
      body:`<p><strong>${tier.name}</strong> is cleared at customs. ${tier.desc}</p><p class="flavor">Setting them up in Chicago requires transferring almost every dollar on hand to clear their debts and secure their paper trail. Your active fronts will close down temporarily, and muscle on the street will scatter until the dust settles. Hired managers and research dossiers remain yours.</p>`,
      buttons:[
        {label:"Make the transfer", onClick:function(){
          state.cash = 47; state.heat = 0; state.muscleCount = 0; state.ratCount = 0;
          businesses.forEach(b=>{ b.level=0; b.crew=0; b.reinvestedIncome=0; });
          state.prestigeCount += 1;
          log(`✈️ ${tier.name} lands in Chicago. ${tier.desc}`);
          renderAll(); scheduleSave();
        }},
        {label:"Go back", secondary:true}
      ]
    });
  });

  // LEGAL: ================= TABS =================
  let mapActive = false;
  let mapHubRunning = false;
  let mapSceneReady = false;
  let mapScenePromise: Promise<void> | null = null;
  let mapAssets: MapAssetLibrary | null = null;
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', function(){ setTab(btn.getAttribute('data-tab')!); });
  });
  function setTab(tab: string){
    document.querySelectorAll('.tab-btn').forEach(b=> b.classList.toggle('active', b.getAttribute('data-tab')===tab));
    document.querySelectorAll('.tab-panel').forEach(p=> p.classList.toggle('active', p.getAttribute('data-tab')===tab));
    mapActive = (tab==='map');
    if(mapActive){
      void startMapLoop();
    }
  }
  async function startMapLoop(): Promise<void> {
    await ensureMapScene();
    if(!mapActive || mapHubRunning) return;
    mapHubRunning = true;
    lastFrame2 = Date.now();
    requestAnimationFrame(mapHub);
  }
  async function ensureMapScene(): Promise<void> {
    if(mapSceneReady) return;
    if(!mapScenePromise){
      mapScenePromise = (async function(){
        THREE = await import('three');
        mapAssets = await loadMapAssetLibrary(THREE);
        mapSceneReady = true;
        initScene();
      })();
    }
    await mapScenePromise;
  }

  // LEGAL: ================= MAP: 3D WORLD + MINIMAP + INTERIORS =================
  // LEGAL: Unified city — 3 districts side by side, canals between them
  const player = { x:700, y:600, facing:Math.PI/2, vx:0, vy:0 };
  const keys: Record<string, boolean> = {};
  let lastFrame2 = Date.now();

  // LEGAL: Apply district offsets to all relative coordinates dynamically
  localBusinesses.forEach(b => {
    if (b.x < 1500 && DISTRICT_OFFSETS[b.district]) {
      b.x += DISTRICT_OFFSETS[b.district];
    }
  });
  serviceBuildings.forEach(b => {
    if (b.x < 1500 && DISTRICT_OFFSETS[b.district]) {
      b.x += DISTRICT_OFFSETS[b.district];
    }
  });
  corners.forEach(b => {
    if (b.x < 1500 && DISTRICT_OFFSETS[b.district]) {
      b.x += DISTRICT_OFFSETS[b.district];
    }
  });
  gangRecruits.forEach(b => {
    if (b.x < 1500 && DISTRICT_OFFSETS[b.district]) {
      b.x += DISTRICT_OFFSETS[b.district];
    }
  });

  applyNamedBuildingLots(serviceBuildings);
  applyNamedBuildingLots(localBusinesses);

  // LEGAL: Businesses spread proportionally across all 3 districts
  // LEGAL: Building lots sit strictly between the road strips. Vertical roads are at
  // LEGAL: rel-x 270/700/1130 (±37) and horizontal roads at y 300/600/900 (±37), so
  // LEGAL: these column/row centers keep every venture fully clear of the streets.
  const mapBuildings = createMapBuildings(businesses);
  function ventureFootprint(m: typeof mapBuildings[number]): { w: number; d: number; h: number; zoneType: string } {
    if(m.id==='cart') return { w:30, d:22, h:14, zoneType:'shop' };
    if(m.zone==='corporate') return { w:72, d:58, h:m.id==='family_office'?96:82, zoneType:'skyscraper' };
    if(m.zone==='logistics') return { w:82, d:58, h:32, zoneType:'industrial' };
    if(m.zone==='industrial') return { w:76, d:54, h:28, zoneType:'industrial' };
    if(m.zone==='entertainment') return { w:70, d:54, h:42, zoneType:'commercial' };
    if(m.zone==='street') return { w:56, d:44, h:26, zoneType:'industrial' };
    return { w:m.biz.baseCost<1000?46:58, d:m.biz.baseCost<1000?34:46, h:m.biz.baseCost>=18000?38:24, zoneType:'shop' };
  }
  function ventureBounds(m: typeof mapBuildings[number]): Solid {
    const footprint = ventureFootprint(m);
    return createBounds(m.x, m.y, footprint.w/2+6, footprint.d/2+6);
  }
  function buildMapObjects(): MapObject[] {
    return [
      ...mapBuildings.map(function(m): MapObject<'building', typeof m> {
        return { kind:'building', id:m.id, district:m.district, x:m.x, y:m.y, bounds:ventureBounds(m), interactRadius:46, minimapColor:m.biz.category==='legit'?'#3e7c8c':'#a8394a', minimapSize:3, ref:m };
      }),
      ...serviceBuildings.map(function(m): MapObject<'service', ServiceBuilding> {
        return { kind:'service', id:m.id, district:m.district, x:m.x, y:m.y, bounds:createBounds(m.x,m.y,35,31), interactRadius:46, minimapColor:'#d4a017', minimapSize:3, ref:m };
      }),
      ...localBusinesses.map(function(m): MapObject<'local', LocalBusiness> {
        return { kind:'local', id:m.id, district:m.district, x:m.x, y:m.y, bounds:createBounds(m.x,m.y,27,24), interactRadius:46, minimapColor:'#7a6fb0', minimapSize:2.5, ref:m };
      }),
      ...mapAmenities.map(function(m): MapObject<'amenity', typeof m> {
        const bounds = amenityHasSolidFootprint(m.kind) ? createBounds(m.x,m.y,27,24) : undefined;
        return { kind:'amenity', id:m.id, district:m.district, x:m.x, y:m.y, bounds, interactRadius:52, minimapColor:m.kind==='basketball'?'#d47a2a':'#5fbf8f', minimapSize:2.5, ref:m };
      }),
      ...corners.map(function(m): MapObject<'corner', Corner> {
        return { kind:'corner', id:m.id, district:m.district, x:m.x, y:m.y, interactRadius:46, minimapColor:m.busted?'#5f6275':(m.dealer?'#d4a017':'#a8394a'), minimapSize:2, ref:m };
      }),
      ...mapNpcs.map(function(m): MapObject<'npc', typeof m> {
        return { kind:'npc', id:m.id, district:m.district, x:m.x, y:m.y, interactRadius:46, minimapColor:'#f0efe8', minimapSize:2, ref:m };
      }),
      ...gangRecruits.map(function(m): MapObject<'gangnpc', GangRecruit> {
        return { kind:'gangnpc', id:m.id, district:m.district, x:m.x, y:m.y, interactRadius:46, minimapColor:'#f0efe8', minimapSize:2, ref:m };
      }),
    ];
  }
  const mapObjects = buildMapObjects();
  const roamingActors = createRoamingActors(mapObjects);
  // LEGAL: District landmarks — unique, recognisable "spots" so each area reads as a
  // LEGAL: place rather than interchangeable blocks. Coords are world-space, sited on
  // LEGAL: each district's park/plaza and clear of the fixed anchors. (The Hub already
  // LEGAL: has The Potato, built with the park.)
  // LEGAL: Returns which district the player is in based on X position
  function playerDistrict(){
    if(player.x < 1500) return 'devlin';
    if(player.x < 2000) return null;
    if(player.x < 3500) return 'westside';
    if(player.x < 4000) return null;
    return 'hub';
  }
  function currentRoadLabel(): string {
    const vertical = roadNetwork.vertical.reduce(function(best,r){ return Math.abs(player.x-r.x)<Math.abs(player.x-best.x)?r:best; }, roadNetwork.vertical[0]);
    const horizontal = roadNetwork.horizontal.reduce(function(best,r){ return Math.abs(player.y-r.y)<Math.abs(player.y-best.y)?r:best; }, roadNetwork.horizontal[0]);
    let road = Math.abs(player.x-vertical.x) < Math.abs(player.y-horizontal.y) ? { name:vertical.name, distance:Math.abs(player.x-vertical.x) } : { name:horizontal.name, distance:Math.abs(player.y-horizontal.y) };
    roadNetwork.diagonal.forEach(function(r){
      const distance = distancePointToSegment(player.x, player.y, r.x1, r.y1, r.x2, r.y2);
      if(distance < road.distance) road = { name:r.name, distance };
    });
    const district = districts.find(function(d){return d.id===state.currentDistrict;})?.name ?? 'Windhaven';
    return `${road.name}, ${district}`;
  }
  // LEGAL: Unified world — all markers always in scene
  function inDistrict(){ return true; }

  const fillerLayout = createFillerLayoutProvider(mapObjects);
  function fillerFor(districtId: string){
    return fillerLayout.fillerFor(districtId);
  }
  function buildAllSolids(){
    const list: Solid[] = solidsFromObjects(mapObjects);
    list.push(...fillerLayout.fillerSolids());
    return list;
  }
  function buildingSolids(districtId: string){
    return buildAllSolids();
  }
  let currentSolids: Solid[] = [];

  // LEGAL: ---- interiors: a small generic room per building, with 1-2 physical hotspots ----
  const ROOM_W = 480, ROOM_H = 280, ROOM_OX = (VIEW_W-ROOM_W)/2, ROOM_OY = (VIEW_H-ROOM_H)/2 - 10;
  const DOOR_LOCAL = { x: ROOM_W/2, y: ROOM_H-6 };

  function hotspotsFor(interior: InteriorState | null){
    if(!interior) return [];
    if(interior.kind==='venture'){
      const b = businesses.find(x=>x.id===interior.refId);
      if(!b) return [];
      return [{ id:'counter', x:ROOM_W/2, y:80, label:'Counter', icon:'🧾', action:()=> openVentureQuickPanel(b) }];
    }
    if(interior.kind==='local'){
      const biz = localBusinesses.find(x=>x.id===interior.refId);
      if(!biz) return [];
      return [
        { id:'register', x:ROOM_W*0.32, y:80, label:'Register', icon:'💵', action:()=> openTillPanel(biz) },
        { id:'owner', x:ROOM_W*0.68, y:80, label:biz.owner, icon:'🙂', action:()=> openOwnerPanel(biz) },
      ];
    }
    if(interior.kind==='bankHome') return [{ id:'teller', x:ROOM_W/2, y:80, label:'Teller Window', icon:'🏦', action:()=> setTab('bank') }];
    if(interior.kind==='heist') return [{ id:'vault', x:ROOM_W/2, y:75, label:'Vault Door', icon:'🔐', action:function(){
      if(state.playSeconds < state.nextHeistAt){ log("🔒 The vault's not worth trying yet. Give it time."); return; }
      playDialogue('bankheist','start');
    } }];
    if(interior.kind==='garage') return [{ id:'dealer', x:ROOM_W/2, y:80, label:'Sales Desk', icon:'🔑', action:()=> setTab('assets') }];
    if(interior.kind==='realty') return [{ id:'agent', x:ROOM_W/2, y:80, label:"Agent's Desk", icon:'📋', action:()=> setTab('assets') }];
    if(interior.kind==='cityhall') return [{ id:'clerk', x:ROOM_W/2, y:80, label:"Clerk's Window", icon:'🏛️', action:()=> setTab('politics') }];
    return [];
  }

  function enterBuilding(kind: string, refId: string, name: string){
    if(state.inVehicle) exitVehicle();
    state.currentInterior = { kind, refId, name, returnX:player.x, returnY:player.y, returnDistrict:state.currentDistrict };
    player.x = DOOR_LOCAL.x; player.y = DOOR_LOCAL.y - 40; player.facing = -Math.PI/2; player.vx=0; player.vy=0;
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
    if(!getEquippedCar()) return;
    state.inVehicle = true;
    player.vx=0; player.vy=0;
    refreshPlayerModel(); updateParkedCarMesh();
    log('You get in.');
    renderAll();
  }
  function exitVehicle(){
    if(!state.inVehicle) return;
    state.inVehicle = false;
    player.vx=0; player.vy=0;
    state.parkedCarPos[state.currentDistrict] = { x:player.x, y:player.y };
    refreshPlayerModel(); updateParkedCarMesh();
    log('You park up and get out.');
    renderAll();
  }

  function travelTo(id: string){
    if(state.currentDistrict === id) return;
    state.currentInterior = null;
    state.currentDistrict = id;
    const spawn = spawnPoints[id] || {x:700,y:600};
    player.x = spawn.x; player.y = spawn.y; player.facing = Math.PI/2; player.vx=0; player.vy=0;
    Object.keys(keys).forEach(k=> keys[k]=false);
    lastFrame2 = Date.now();
    // LEGAL: City is built once — travelTo just repositions the player
    updateParkedCarMesh();
    rebuildWaypointBeacon();
    refreshPlayerModel();
    const d = districts.find(x=>x.id===id)!;
    log(`<i class="ph-duotone ph-car"></i> You head over to ${d.name}.`);
    renderAll();
  }
  function openAmenityPanel(amenity: typeof mapAmenities[number]){
    showModal(createAmenityModal(amenity, {
      addRespect:function(amount){ state.respect += amount; },
      spendCash:function(amount){ if(state.cash < amount) return false; state.cash -= amount; return true; },
      log,
      renderAll,
    }));
  }

  window.addEventListener('keydown', function(e){
    const k = e.key.toLowerCase();
    keys[k] = true;
    if(k==='e') tryInteract();
  });
  window.addEventListener('keyup', function(e){ keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', function(){ Object.keys(keys).forEach(k=> keys[k]=false); });
  byId('btn-interact').addEventListener('click', tryInteract);

  byId('fullscreen-btn').addEventListener('click', function(){
    const container = byId('scene3d-container');
    const isFs = container.classList.toggle('fullscreen');
    const btn = byId('fullscreen-btn');
    btn.innerHTML = isFs ? '<i class="ph-duotone ph-arrows-in"></i>' : '<i class="ph-duotone ph-arrows-out"></i>';
    if(renderer){
      const w = isFs ? window.innerWidth : VIEW_W;
      const h = isFs ? window.innerHeight : VIEW_H;
      renderer.setSize(w, h);
      if(camera3d){ camera3d.aspect = w/h; camera3d.updateProjectionMatrix(); }
    }
  });
  window.addEventListener('resize', function(){
    const container = byId('scene3d-container');
    if(container.classList.contains('fullscreen') && renderer){
      renderer.setSize(window.innerWidth, window.innerHeight);
      if(camera3d){ camera3d.aspect = window.innerWidth/window.innerHeight; camera3d.updateProjectionMatrix(); }
    }
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
    | { type: 'corner'; ref: Corner };
  function nearestMarker(): MapMarker | null {
    if(state.currentInterior){
      let best: MapMarker | null = null, bestDist=46;
      const dDoor = Math.hypot(player.x-DOOR_LOCAL.x, player.y-DOOR_LOCAL.y);
      if(dDoor<bestDist){ bestDist=dDoor; best={type:'door', ref:{label:'Exit'}}; }
      hotspotsFor(state.currentInterior).forEach(h=>{
        const d = Math.hypot(player.x-h.x, player.y-h.y);
        if(d<bestDist){ bestDist=d; best={type:'hotspot', ref:h}; }
      });
      return best;
    }
    if(state.inVehicle) return null;
    let best: MapMarker | null = null, bestDist=46;
    const car = getEquippedCar();
    if(car){
      // LEGAL: Enter-hitbox must match the rendered car mesh, which falls back to
      // LEGAL: carSpawnPos() before the car has ever been parked. Using the same
      // LEGAL: source here fixes the "car you can see but can never enter" deadlock.
      const parked = state.parkedCarPos[state.currentDistrict] || carSpawnPos();
      const d = Math.hypot(player.x-parked.x, player.y-parked.y);
      if(d<bestDist){ bestDist=d; best={type:'car', ref:parked}; }
    }
    const object = nearestMapObject(mapObjects, player.x, player.y, bestDist);
    if(object) best = { type:object.kind, ref:object.ref } as MapMarker;
    return best;
  }
  function tryInteract(){
    if(!mapActive) return;
    if(state.currentInterior){
      const m = nearestMarker();
      if(!m) return;
      if(m.type==='door') exitBuilding(); else if(m.type==='hotspot') m.ref.action();
      return;
    }
    if(state.inVehicle){ exitVehicle(); return; }
    const m = nearestMarker();
    if(!m) return;
    if(m.type==='car') enterVehicle();
    else if(m.type==='building') enterBuilding('venture', m.ref.id, m.ref.biz.name);
    else if(m.type==='service') enterBuilding(m.ref.kind, m.ref.id, m.ref.name);
    else if(m.type==='local') enterBuilding('local', m.ref.id, m.ref.name);
    else if(m.type==='amenity') openAmenityPanel(m.ref);
    else if(m.type==='corner') openCornerPanel(m.ref);
    else if(m.type==='gangnpc') playDialogue(m.ref.dialogueKey, m.ref.inducted ? 'checkin' : 'start');
    else if(m.type==='npc' && m.ref.type==='named') playDialogue(m.ref.id, npcOpeningNode(m.ref.id));
    else proceduralInteract();
  }

  function currentSpeed(){
    if(state.currentInterior) return 150;
    if(state.inVehicle){ const car=getEquippedCar(); return 210*(car?car.speedMult:1); }
    return 150;
  }
  function tryMove(nx: number, ny: number, solids: Solid[]){
    return canMoveTo(nx, ny, solids, state.inVehicle);
  }

  // LEGAL: ================= THREE.JS SCENE =================
  type ThreeModule = typeof ThreeNamespace;
  type DisposableMaterial = ThreeNamespace.Material & { map?: ThreeNamespace.Texture };
  let THREE: ThreeModule;
  let scene: ThreeNamespace.Scene, camera3d: ThreeNamespace.PerspectiveCamera, renderer: ThreeNamespace.WebGLRenderer, worldGroup: ThreeNamespace.Group, playerGroup: ThreeNamespace.Group, ambientLight: ThreeNamespace.AmbientLight, sunLight: ThreeNamespace.DirectionalLight, moonLight: ThreeNamespace.DirectionalLight, waypointBeacon: ThreeNamespace.Group | null = null, parkedCarMesh: ThreeNamespace.Group | null = null;
  let streetLights: ThreeNamespace.PointLight[] = [];
  let weatherPoints: ThreeNamespace.Points | null = null;
  let activeWeather: 'clear' | 'rain' | 'snow' = 'clear';
  const MAP_DAY_SECONDS = 240;
  const MAP_START_HOUR = 10;

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
    cctx.fillStyle=color; cctx.font='bold 120px sans-serif'; cctx.textAlign='center'; cctx.textBaseline='middle';
    cctx.fillText(text.slice(0,32), 1024, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, depthTest:false}));
    sprite.scale.set(w * 4, h * 2, 1); sprite.position.y = y;
    parent.add(sprite);
  }
  function appearanceForPerson(id: string, baseColor: number | string): { coat: string | number; shirt: string; skin: string; hair: string; pants: string; scaleY: number; scaleX: number } {
    const variant = variantForId(id);
    const skin = ['#d9b48f','#b98663','#8f5f43','#e0c0a0','#c79870'][Math.floor(variant * 5) % 5];
    const hair = ['#24211f','#3a2618','#111217','#5a4637','#d0c0a0'][Math.floor(variant * 17) % 5];
    const shirt = ['#232734','#35445a','#3f2f45','#2f4a3a','#5a3f2f','#4a3240'][Math.floor(variant * 23) % 6];
    const pants = ['#1d2028','#202c35','#2e2b28','#273126','#2a2635'][Math.floor(variant * 29) % 5];
    return { coat:baseColor || '#e8e6de', shirt, skin, hair, pants, scaleY:0.92 + variant * 0.18, scaleX:0.9 + ((variant * 7) % 1) * 0.16 };
  }
  function buildPedestrianModel(color: number | string, identity = 'person'){
    const look = appearanceForPerson(identity, color);
    const g = new THREE.Group();
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(5.5*look.scaleX,7.5*look.scaleX,18*look.scaleY,8), new THREE.MeshStandardMaterial({color: look.coat, roughness:0.72}));
    coat.position.y = 16; coat.castShadow=true; g.add(coat);
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(8*look.scaleX,9,4), new THREE.MeshStandardMaterial({color:look.shirt, roughness:0.8}));
    shirt.position.set(0,18,3.8); shirt.castShadow=true; g.add(shirt);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.6,3,8), new THREE.MeshStandardMaterial({color:look.skin}));
    neck.position.y = 27; neck.castShadow=true; g.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(6.2*look.scaleX,12,10), new THREE.MeshStandardMaterial({color:look.skin, roughness:0.65}));
    head.position.y = 32; head.castShadow=true; g.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(6.4*look.scaleX,12,8,0,Math.PI*2,0,Math.PI*0.48), new THREE.MeshStandardMaterial({color:look.hair, roughness:0.9}));
    hair.rotation.x = Math.PI; hair.position.y = 35.2; hair.castShadow=true; g.add(hair);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.8,4.5,6), new THREE.MeshStandardMaterial({color:look.skin}));
    nose.rotation.x = Math.PI/2; nose.position.set(0,31.4,6.2); g.add(nose);
    const armMat = new THREE.MeshStandardMaterial({color: look.coat, roughness:0.76});
    [-1,1].forEach(function(side){
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(1.8,13,4,6), armMat);
      arm.position.set(side*7.1,17,0.5); arm.rotation.z = side*0.2; arm.castShadow=true; g.add(arm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(2.1,8,6), new THREE.MeshStandardMaterial({color:look.skin}));
      hand.position.set(side*7.7,9.5,0.9); hand.castShadow=true; g.add(hand);
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(2.1,12,4,6), new THREE.MeshStandardMaterial({color:look.pants, roughness:0.82}));
      leg.position.set(side*2.8,5.5,0); leg.castShadow=true; g.add(leg);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(5,2,8), new THREE.MeshStandardMaterial({color:'#111217', roughness:0.8}));
      shoe.position.set(side*2.8,1.1,2.2); shoe.castShadow=true; g.add(shoe);
    });
    return g;
  }
  function buildCarModel(car: Car){
    const g = new THREE.Group();
    const bodyH = car.id==='escalade'?18:(car.id==='bentley'?16:14);
    const body = box(car.len, bodyH, car.wid, car.color);
    body.position.y = bodyH/2+1; g.add(body);
    const hood = box(car.len*0.32, bodyH*0.55, car.wid*0.94, car.color);
    hood.position.set(car.len*0.31, bodyH+1, 0); g.add(hood);
    const trunk = box(car.len*0.25, bodyH*0.48, car.wid*0.9, car.color);
    trunk.position.set(-car.len*0.35, bodyH+0.3, 0); g.add(trunk);
    const cabinW = car.id==='escalade'?car.len*0.55:car.len*0.42;
    const cabin = box(cabinW, car.id==='escalade'?13:10, car.wid*0.82, '#1c1e24');
    cabin.position.set(car.len*0.04, bodyH+6, 0); g.add(cabin);
    const glassMat = new THREE.MeshStandardMaterial({color:'#78a9c8', emissive:'#1b3342', emissiveIntensity:0.1, transparent:true, opacity:0.72, roughness:0.2, metalness:0.1});
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(car.wid*0.68, 8), glassMat);
    windshield.rotation.y = Math.PI/2; windshield.rotation.x = -0.24; windshield.position.set(car.len*0.25, bodyH+10.5, 0); g.add(windshield);
    const rearWindow = new THREE.Mesh(new THREE.PlaneGeometry(car.wid*0.62, 7), glassMat);
    rearWindow.rotation.y = -Math.PI/2; rearWindow.rotation.x = 0.2; rearWindow.position.set(-car.len*0.18, bodyH+10, 0); g.add(rearWindow);
    [-1,1].forEach(function(side){
      const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(cabinW*0.58, 7), glassMat);
      sideGlass.position.set(car.len*0.03, bodyH+10.4, side*car.wid*0.414); sideGlass.rotation.y = side>0 ? 0 : Math.PI; g.add(sideGlass);
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(3,2,5), new THREE.MeshStandardMaterial({color:'#17191f', roughness:0.35}));
      mirror.position.set(car.len*0.25, bodyH+7, side*(car.wid/2+3)); g.add(mirror);
    });
    const wheelMat = new THREE.MeshStandardMaterial({color:'#151515'});
    const rimColor = car.id==='bentley'?'#c9a227':'#888888';
    const wheelR = (car.id==='escalade'||car.id==='bentley')?7:5;
    [[car.len*0.34,car.wid/2+1],[car.len*0.34,-car.wid/2-1],[-car.len*0.34,car.wid/2+1],[-car.len*0.34,-car.wid/2-1]].forEach(function(pair){
      const wx=pair[0], wz=pair[1];
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(wheelR,wheelR,5,12), wheelMat);
      wheel.rotation.x=Math.PI/2; wheel.position.set(wx,wheelR,wz); wheel.castShadow=true; g.add(wheel);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(wheelR*0.5,wheelR*0.5,5.2,8), new THREE.MeshStandardMaterial({color:rimColor, metalness:0.9, roughness:0.1}));
      rim.rotation.x=Math.PI/2; rim.position.set(wx,wheelR,wz); g.add(rim);
    });
    const bumperMat = new THREE.MeshStandardMaterial({color:'#202229', metalness:0.4, roughness:0.4});
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(4,5,car.wid*0.95), bumperMat);
    frontBumper.position.set(car.len/2+2,5,0); g.add(frontBumper);
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(4,5,car.wid*0.95), bumperMat);
    rearBumper.position.set(-car.len/2-2,5,0); g.add(rearBumper);
    const headlightMat = new THREE.MeshStandardMaterial({color:'#fffbcc', emissive:'#fffbcc', emissiveIntensity:0.8});
    [-car.wid*0.3,car.wid*0.3].forEach(function(wz){
      const hl = new THREE.Mesh(new THREE.PlaneGeometry(6,4), headlightMat);
      hl.position.set(car.len/2+0.1, bodyH/2+1, wz); hl.rotation.y=Math.PI/2; g.add(hl);
    });
    const taillightMat = new THREE.MeshStandardMaterial({color:'#cc2200', emissive:'#cc2200', emissiveIntensity:0.6});
    [-car.wid*0.3,car.wid*0.3].forEach(function(wz){
      const tl = new THREE.Mesh(new THREE.PlaneGeometry(5,3), taillightMat);
      tl.position.set(-car.len/2-0.1, bodyH/2+1, wz); tl.rotation.y=-Math.PI/2; g.add(tl);
    });
    if(car.id==='bentley'){
      const grille = new THREE.Mesh(new THREE.BoxGeometry(4,10,car.wid*0.6), new THREE.MeshStandardMaterial({color:'#c9a227', metalness:1, roughness:0.1}));
      grille.position.set(car.len/2+2, bodyH/2+1, 0); g.add(grille);
    }
    if(car.id==='impala'){
      const spoiler = new THREE.Mesh(new THREE.BoxGeometry(5,5,car.wid), new THREE.MeshStandardMaterial({color:'#282c38', roughness:0.6}));
      spoiler.position.set(-car.len/2+2, bodyH+8, 0); g.add(spoiler);
    }
    if(car.id==='escalade'){
      const rack = new THREE.Mesh(new THREE.BoxGeometry(car.len*0.7,2,car.wid*0.8), new THREE.MeshStandardMaterial({color:'#555555', metalness:0.7}));
      rack.position.set(0, bodyH+11, 0); g.add(rack);
    }
    g.castShadow=true;
    // LEGAL: The body is modeled facing +x; wrap and rotate so its forward becomes
    // LEGAL: +z, matching the pedestrian model and the shared heading convention
    // LEGAL: (rotation.y = -facing + PI/2). Also scale the whole car up so it reads
    // LEGAL: at city scale next to the buildings and roads.
    g.rotation.y = -Math.PI/2;
    const outer = new THREE.Group();
    outer.add(g);
    outer.scale.setScalar(1.6);
    return outer;
  }
  function buildTrafficCarModel(id: string, color: string): ThreeNamespace.Group {
    return buildCarModel({ id, name:id, icon:'', cost:0, speedMult:1, heistBonus:0, respectPerSec:0, color, len:id.includes('cab')?30:34, wid:id.includes('cruiser')?17:15 });
  }
  function buildAmenityModel(amenity: typeof mapAmenities[number]): ThreeNamespace.Group {
    return buildMapAmenityModel(THREE, amenity, { box, addSign, buildDetailedBuilding, variantForId });
  }
  function updateDayNightLighting(){
    if(!scene || !sunLight || !moonLight || !ambientLight) return;
    const dayFraction = ((state.playSeconds / MAP_DAY_SECONDS) + MAP_START_HOUR / 24) % 1;
    const phase = dayFraction * Math.PI * 2;
    const sun = Math.max(0, Math.sin(phase - Math.PI / 2));
    const dusk = Math.max(0, 1 - Math.abs(sun * 2 - 1));
    const night = 1 - sun;
    ambientLight.intensity = 0.5 + sun * 0.5 + dusk * 0.1;
    sunLight.intensity = 0.25 + sun * 1.15;
    sunLight.color.set(sun < 0.18 ? '#9fb4ff' : (dusk > 0.45 ? '#ffc37a' : '#fff2d0'));
    sunLight.position.set(WORLD_W*0.5 + Math.cos(phase) * 900, 130 + sun * 520, WORLD_H*0.35 + Math.sin(phase) * 260);
    sunLight.target.position.set(WORLD_W/2,0,WORLD_H/2);
    sunLight.target.updateMatrixWorld();
    moonLight.intensity = Math.max(0, night - 0.18) * 0.5;
    moonLight.position.set(WORLD_W*0.5 - Math.cos(phase) * 700, 430, WORLD_H*0.55 - Math.sin(phase) * 220);
    moonLight.target.position.set(WORLD_W/2,0,WORLD_H/2);
    moonLight.target.updateMatrixWorld();
    scene.background = new THREE.Color(sun < 0.18 ? '#111827' : (dusk > 0.45 ? '#241b20' : '#0a0b10'));
    scene.fog = new THREE.Fog(sun < 0.18 ? 0x111827 : 0x0a0b10, 520 + night * 80, 1150 + sun * 180);
    streetLights.forEach(function(light){
      light.intensity = Math.max(0, night - 0.2) * 2.35;
    });
  }
  function mapClockLabel(): string {
    const totalMinutes = Math.floor((((state.playSeconds / MAP_DAY_SECONDS) + MAP_START_HOUR / 24) % 1) * 24 * 60);
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
      const counter = box(28,7,14,'#7b4a2c'); counter.position.set(0,4,7); base.add(counter);
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


  // LEGAL: ---- procedural building with windows, door, and zone-specific roof ----
  function buildDetailedBuilding(w: number, h: number, d: number, color: number | string, zoneType: string, variant = 0){
    const assetKey = assetKeyForBuilding(zoneType, variant, h);
    const assetModel = assetKey ? mapAssets?.createFittedModel(assetKey, w, h, d) : null;
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
  function buildIntersectionFurniture(x: number, z: number, index: number): void {
    buildMapIntersectionFurniture({ THREE, worldGroup, streetLights }, x, z, index);
  }  function weatherKindAtTime(): 'clear' | 'rain' | 'snow' {
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
  function updateWeather(dt: number){
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


  // LEGAL: ---- unified city — builds the entire world once; no per-district teardown ----
  function buildCityScene(){
    clearGroup(worldGroup);
    streetLights = [];

    const baseScene = { THREE, worldGroup, worldWidth:WORLD_W, worldHeight:WORLD_H };
    buildBaseGround(baseScene);
    buildCanalWater(baseScene);
    buildRoadNetwork({ ...baseScene, roadNetwork, buildIntersectionFurniture });
    buildStreetTrees({ ...baseScene, roadNetwork, districtOffsets:DISTRICT_OFFSETS, seededRandom });
    buildCanalBridges(baseScene);
    // LEGAL: Venture buildings — all districts
    mapObjects.filter(o=>o.kind==='building').forEach(function(object){
      const m = object.ref as typeof mapBuildings[number];
      const info = buildingColorFor(m.biz);
      const footprint = ventureFootprint(m);
      const color = m.zone==='corporate' ? '#46516d' : (m.zone==='entertainment' ? '#5a345e' : info.color);
      const mesh = buildDetailedBuilding(footprint.w, Math.max(info.h, footprint.h), footprint.d, color, footprint.zoneType, variantForId(m.id));
      addVentureDetail(m, mesh);
      mesh.position.set(object.x, Math.max(info.h, footprint.h)/2, object.y); worldGroup.add(mesh);
      addSign(mesh, m.biz.name, 34, 9, Math.max(info.h, footprint.h)/2+10, m.biz.category==='legit'?'#8fd0e0':'#f0a0ae');
    });

    // LEGAL: Service buildings — all districts
    const svcPalette: Record<string, string> = { bankHome:'#7a5f1a', garage:'#3e6b78', realty:'#3e6b78', cityhall:'#7a5f1a', heist:'#5a2a33' };
    mapObjects.filter(o=>o.kind==='service').forEach(function(object){
      const m = object.ref as ServiceBuilding;
      const mesh = buildDetailedBuilding(58,34,50,svcPalette[m.kind],'service', variantForId(m.id));
      mesh.position.set(object.x,17,object.y); worldGroup.add(mesh);
      addSign(mesh, m.name, 40, 9, 26, '#ffe6a0');
    });

    // LEGAL: Extortable local businesses — all districts
    mapObjects.filter(o=>o.kind==='local').forEach(function(object){
      const m = object.ref as LocalBusiness;
      const color = m.extorted?'#8a6a1a':'#4a4360';
      const mesh = buildDetailedBuilding(42,20,36,color,'shop', variantForId(m.id));
      mesh.position.set(object.x,10,object.y); worldGroup.add(mesh);
      addSign(mesh, m.name, 32, 8, 18, m.extorted?'#ffd77a':'#b8aee0');
    });

    mapObjects.filter(o=>o.kind==='amenity').forEach(function(object){
      const amenity = object.ref as typeof mapAmenities[number];
      const mesh = buildAmenityModel(amenity);
      const y = amenity.kind === 'petstore' || amenity.kind === 'shop' ? 10 : 0;
      mesh.position.set(object.x,y,object.y);
      worldGroup.add(mesh);
    });

    // LEGAL: Corners — all districts
    mapObjects.filter(o=>o.kind==='corner').forEach(function(object){
      const m = object.ref as Corner;
      const staffed=m.dealer&&!m.busted;
      const color=m.busted?'#5f6275':(staffed?'#d4a017':'#a8394a');
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,26,6), new THREE.MeshStandardMaterial({color:'#2a2c33'}));
      pole.position.set(object.x,13,object.y); pole.castShadow=true; worldGroup.add(pole);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(7,10,10), new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:0.4}));
      orb.position.set(object.x,28,object.y); worldGroup.add(orb);
      addSign(pole, m.name, 30, 8, 22, '#f0efe8');
    });

    roamingActors.forEach(function(actor){
      if(actor.kind === 'car'){
        const car = buildTrafficCarModel(actor.id, actor.color);
        car.position.set(actor.x,0,actor.y);
        car.rotation.y = -actor.facing + Math.PI / 2;
        worldGroup.add(car);
        actor.group = car;
        return;
      }
      const g = buildPedestrianModel(actor.object?.kind === 'gangnpc' && (actor.object.ref as GangRecruit).inducted ? '#d4a017' : actor.color, actor.id);
      g.position.set(actor.x,0,actor.y);
      g.rotation.y = -actor.facing + Math.PI / 2;
      worldGroup.add(g);
      actor.group = g;
      addSign(g, actorDisplayName(actor), 28, 7, 38, '#f0efe8');
    });

    buildFillerCity({ THREE, worldGroup, worldWidth:WORLD_W, worldHeight:WORLD_H, districtOffsets:DISTRICT_OFFSETS, fillerFor, helpers:{ box, addSign, buildDetailedBuilding, renderZoneType, seededRandom } });
    buildLandmarks({ THREE, worldGroup, worldWidth:WORLD_W, worldHeight:WORLD_H, landmarks, helpers:{ box, addSign } });
    buildRailAndRiver(baseScene);
    currentSolids = buildAllSolids();
    // LEGAL: Block the landmark footprints so you can't walk through them.
    currentSolids.push({x:125,y:820,hw:44,hd:44}, {x:2125,y:850,hw:26,hd:26});
    updateParkedCarMesh();
    rebuildWaypointBeacon();

    updateDayNightLighting();
  }

  // LEGAL: Historical entry point kept for saved-game boot; the city is unified now.
  function buildDistrictScene(_districtId: string){
    buildCityScene();
  }

  function refreshPlayerModel(){
    if(!mapSceneReady) return;
    clearGroup(playerGroup);
    if(state.inVehicle){ const car=getEquippedCar(); if(car) playerGroup.add(buildCarModel(car)); }
    else playerGroup.add(buildPedestrianModel('#f0efe8', 'arjun'));
  }
  // LEGAL: Where a freshly-bought (never-parked) car sits — just off the district
  // LEGAL: spawn so the player has to step over to it rather than start on top of it.
  function carSpawnPos(): Point {
    const s = spawnPoints[state.currentDistrict] || { x:700, y:600 };
    return { x: s.x + 70, y: s.y };
  }
  function updateParkedCarMesh(){
    if(!mapSceneReady) return;
    if(parkedCarMesh){ worldGroup.remove(parkedCarMesh); parkedCarMesh.traverse(disposeObj); parkedCarMesh=null; }
    const car = getEquippedCar();
    if(car && !state.inVehicle){
      const pos = state.parkedCarPos[state.currentDistrict] || carSpawnPos();
      parkedCarMesh = buildCarModel(car);
      parkedCarMesh.position.set(pos.x,0,pos.y);
      worldGroup.add(parkedCarMesh);
    }
  }
  function computeRoadGuide(px: number, py: number, wx: number, wy: number){
    // LEGAL: Simple road-snapped guide: approach nearest horizontal road, traverse to WP X, then descend to WP
    const nearestRoad = roadNetwork.horizontal.reduce(function(best,r){ return Math.abs(r.y-py)<Math.abs(best.y-py)?r:best; }, roadNetwork.horizontal[0]);
    const ry = nearestRoad.y;
    const step = 55;
    const dots = [];
    const signY = ry>py?1:-1;
    for(let y=py+signY*step; signY*(y-ry)<0; y+=signY*step) dots.push({x:px,y});
    dots.push({x:px,y:ry});
    const signX = wx>px?1:-1;
    for(let x=px+signX*step; signX*(x-wx)<0; x+=signX*step) dots.push({x,y:ry});
    dots.push({x:wx,y:ry});
    const signY2 = wy>ry?1:-1;
    for(let y=ry+signY2*step; signY2*(y-wy)<0; y+=signY2*step) dots.push({x:wx,y});
    return dots.slice(0,40);
  }
  function rebuildWaypointBeacon(){
    if(!mapSceneReady) return;
    if(waypointBeacon){ worldGroup.remove(waypointBeacon); waypointBeacon.traverse(disposeObj); waypointBeacon=null; }
    const wp = state.waypoints[state.currentDistrict];
    if(!wp) return;
    const g = new THREE.Group();
    // LEGAL: Flat cross marker on the ground — no floating tower
    const markerMat = new THREE.MeshStandardMaterial({color:'#d4a017', emissive:'#d4a017', emissiveIntensity:0.7});
    const arm1 = new THREE.Mesh(new THREE.PlaneGeometry(30,6), markerMat);
    arm1.rotation.x=-Math.PI/2; arm1.position.set(0,0.2,0); g.add(arm1);
    const arm2 = new THREE.Mesh(new THREE.PlaneGeometry(6,30), markerMat);
    arm2.rotation.x=-Math.PI/2; arm2.position.set(0,0.2,0); g.add(arm2);
    const ring = new THREE.Mesh(new THREE.RingGeometry(18,22,20), new THREE.MeshBasicMaterial({color:'#d4a017', transparent:true, opacity:0.38, side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2; ring.position.y=0.3; g.add(ring);
    // LEGAL: Flat road-guide dots from player position to waypoint
    const dots = computeRoadGuide(player.x, player.y, wp.x, wp.y);
    const dotMat = new THREE.MeshBasicMaterial({color:'#d4a017'});
    dots.forEach(function(pt){
      const dot = new THREE.Mesh(new THREE.CircleGeometry(4,8), dotMat);
      dot.rotation.x=-Math.PI/2; dot.position.set(pt.x-wp.x,0.15,pt.y-wp.y); g.add(dot);
    });
    g.position.set(wp.x,0,wp.y);
    worldGroup.add(g); waypointBeacon=g;
  }

  function initScene(){
    const container = byId('scene3d-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0b10');
    scene.fog = new THREE.Fog(0x0a0b10, 480, 1050);

    camera3d = new THREE.PerspectiveCamera(50, VIEW_W/VIEW_H, 1, 3000);
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(VIEW_W, VIEW_H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.classList.add('webgl-canvas');
    container.insertBefore(renderer.domElement, container.firstChild);

    ambientLight = new THREE.AmbientLight(0x8891a8, 0.65);
    scene.add(ambientLight);
    sunLight = new THREE.DirectionalLight(0xfff2d0, 0.9);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024,1024);
    sunLight.shadow.camera.left=-500; sunLight.shadow.camera.right=500;
    sunLight.shadow.camera.top=500; sunLight.shadow.camera.bottom=-500;
    sunLight.shadow.camera.near=10; sunLight.shadow.camera.far=1200;
    scene.add(sunLight); scene.add(sunLight.target);
    moonLight = new THREE.DirectionalLight(0xb9c8ff, 0);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(512,512);
    moonLight.shadow.camera.left=-500; moonLight.shadow.camera.right=500;
    moonLight.shadow.camera.top=500; moonLight.shadow.camera.bottom=-500;
    moonLight.shadow.camera.near=10; moonLight.shadow.camera.far=1200;
    scene.add(moonLight); scene.add(moonLight.target);

    worldGroup = new THREE.Group(); scene.add(worldGroup);
    playerGroup = new THREE.Group(); scene.add(playerGroup);

    buildCityScene();
    refreshPlayerModel();
  }

  // LEGAL: ================= MINIMAP (simple 2D, pannable, waypoints) =================
  const minimapCanvas = byId<HTMLCanvasElement>('minimap-canvas');
  const mctx = minimapCanvas.getContext('2d')!;
  const minimapPan = { x:0, y:0 };
  let minimapDragging=false, minimapDragStart: { clientX: number; clientY: number; panX: number; panY: number } | null =null, minimapDragMoved=false;

  minimapCanvas.addEventListener('mousedown', function(e){
    minimapDragging = true; minimapDragMoved = false;
    minimapDragStart = { clientX:e.clientX, clientY:e.clientY, panX:minimapPan.x, panY:minimapPan.y };
  });
  window.addEventListener('mousemove', function(e){
    if(!minimapDragging || !minimapDragStart) return;
    const ddx = e.clientX - minimapDragStart.clientX, ddy = e.clientY - minimapDragStart.clientY;
    if(Math.abs(ddx)>3 || Math.abs(ddy)>3) minimapDragMoved = true;
    minimapPan.x = minimapDragStart.panX - ddx/MINIMAP_SCALE;
    minimapPan.y = minimapDragStart.panY - ddy/MINIMAP_SCALE;
  });
  window.addEventListener('mouseup', function(e){
    if(!minimapDragging) return;
    minimapDragging = false;
    if(!minimapDragMoved && !state.currentInterior){
      const rect = minimapCanvas.getBoundingClientRect();
      const px = e.clientX-rect.left, py = e.clientY-rect.top;
      const wx = player.x + minimapPan.x + (px-75)/MINIMAP_SCALE;
      const wy = player.y + minimapPan.y + (py-75)/MINIMAP_SCALE;
      state.waypoints[state.currentDistrict] = { x:Math.max(0,Math.min(WORLD_W,wx)), y:Math.max(0,Math.min(WORLD_H,wy)) };
      rebuildWaypointBeacon();
      byId('minimap-clear').classList.add('show');
      scheduleSave();
    }
  });
  byId('minimap-clear').addEventListener('click', function(){
    state.waypoints[state.currentDistrict] = null;
    rebuildWaypointBeacon();
    this.classList.remove('show');
    scheduleSave();
  });

  function drawMinimap(){
    drawMapMinimap({
      ctx:mctx,
      indoors:!!state.currentInterior,
      dragging:minimapDragging,
      pan:minimapPan,
      player,
      mapObjects,
      districtOffsets:DISTRICT_OFFSETS,
      fillerFor,
      roadNetwork,
      worldWidth:WORLD_W,
      worldHeight:WORLD_H,
      landmarks,
      waypoint:state.waypoints[state.currentDistrict],
    });
  }
  // LEGAL: ================= INTERIOR (lightweight 2D scene) =================
  const interiorCanvas = byId<HTMLCanvasElement>('interior-canvas');
  const ictx = interiorCanvas.getContext('2d')!;
  function syncInteriorCanvasSize(): void {
    const rect = interiorCanvas.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(rect.width || VIEW_W));
    const cssH = Math.max(1, Math.round(rect.height || VIEW_H));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if(interiorCanvas.width !== targetW || interiorCanvas.height !== targetH){
      interiorCanvas.width = targetW;
      interiorCanvas.height = targetH;
    }
    ictx.setTransform(targetW / VIEW_W, 0, 0, targetH / VIEW_H, 0, 0);
  }
  function iRoundRect(x: number, y: number, w: number, h: number, r: number){
    ictx.beginPath(); ictx.moveTo(x+r,y);
    ictx.arcTo(x+w,y,x+w,y+h,r); ictx.arcTo(x+w,y+h,x,y+h,r);
    ictx.arcTo(x,y+h,x,y,r); ictx.arcTo(x,y,x+w,y,r); ictx.closePath();
  }
  function iLabelChip(text: string, x: number, y: number){
    ictx.font='9px IBM Plex Mono, monospace';
    const w = ictx.measureText(text).width+8;
    ictx.fillStyle='rgba(10,11,16,0.6)'; iRoundRect(x-w/2,y-8,w,14,4); ictx.fill();
    ictx.fillStyle='#c8cad8'; ictx.textAlign='center'; ictx.textBaseline='middle'; ictx.fillText(text,x,y-1);
  }
  function drawInteriorScene(){
    syncInteriorCanvasSize();
    ictx.clearRect(0,0,VIEW_W,VIEW_H);
    ictx.fillStyle='#101116'; ictx.fillRect(0,0,VIEW_W,VIEW_H);
    const ox=ROOM_OX, oy=ROOM_OY;
    ictx.fillStyle='#232734'; ictx.fillRect(ox,oy,ROOM_W,ROOM_H);
    ictx.strokeStyle='rgba(255,255,255,0.04)'; ictx.lineWidth=1;
    for(let fx=0; fx<ROOM_W; fx+=28){ ictx.beginPath(); ictx.moveTo(ox+fx,oy); ictx.lineTo(ox+fx,oy+ROOM_H); ictx.stroke(); }
    ictx.strokeStyle='#454a5c'; ictx.lineWidth=6; ictx.strokeRect(ox,oy,ROOM_W,ROOM_H);
    ictx.fillStyle='#101116'; ictx.fillRect(ox+DOOR_LOCAL.x-26, oy+ROOM_H-4, 52, 10);
    ictx.fillStyle='rgba(212,160,23,0.7)'; ictx.font='9px IBM Plex Mono, monospace'; ictx.textAlign='center'; ictx.textBaseline='middle';
    ictx.fillText('EXIT', ox+DOOR_LOCAL.x, oy+ROOM_H+14);
    hotspotsFor(state.currentInterior).forEach(function(h){
      const sx=ox+h.x, sy=oy+h.y;
      iRoundRect(sx-28,sy-18,56,36,5); ictx.fillStyle='rgba(212,160,23,0.14)'; ictx.fill();
      ictx.strokeStyle='#d4a017'; ictx.lineWidth=1.4; ictx.stroke();
      ictx.font='16px sans-serif'; ictx.textAlign='center'; ictx.textBaseline='middle'; ictx.fillStyle='#f0efe8';
      ictx.fillText(h.icon, sx, sy-2);
      iLabelChip(h.label, sx, sy+26);
    });
    const px=ox+player.x, py=oy+player.y;
    ictx.save(); ictx.translate(px,py); ictx.rotate(player.facing);
    ictx.beginPath(); ictx.arc(0,0,9,0,Math.PI*2); ictx.fillStyle='#f0efe8'; ictx.fill();
    ictx.strokeStyle='#d4a017'; ictx.lineWidth=2; ictx.stroke();
    ictx.beginPath(); ictx.moveTo(6,0); ictx.lineTo(12,-4.5); ictx.lineTo(12,4.5); ictx.closePath();
    ictx.fillStyle='#d4a017'; ictx.fill(); ictx.restore();
  }

  // LEGAL: ================= MAIN LOOP =================
  function mapHub(){
    if(!mapActive){ mapHubRunning = false; return; }
    const now = Date.now();
    const dt = Math.min(0.05, Math.max(0, (now-lastFrame2)/1000));
    lastFrame2 = now;

    let dx=0, dy=0;
    if(keys['arrowup']||keys['w']) dy -= 1;
    if(keys['arrowdown']||keys['s']) dy += 1;
    if(keys['arrowleft']||keys['a']) dx -= 1;
    if(keys['arrowright']||keys['d']) dx += 1;
    // LEGAL: Target velocity from input, then ease the actual velocity toward it so
    // LEGAL: movement accelerates and coasts instead of snapping on/off. Cars are
    // LEGAL: heavier (slower to respond and to turn) than the player on foot.
    const spd = currentSpeed();
    let tvx=0, tvy=0;
    if(dx||dy){ const len = Math.hypot(dx,dy); tvx=(dx/len)*spd; tvy=(dy/len)*spd; }
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
        player.x = Math.max(20, Math.min(ROOM_W-20, player.x+stepX));
        player.y = Math.max(20, Math.min(ROOM_H-14, player.y+stepY));
      } else {
        const tryX = player.x+stepX, tryY = player.y+stepY;
        if(tryMove(tryX,tryY,currentSolids)){ player.x=tryX; player.y=tryY; }
        else if(tryMove(tryX,player.y,currentSolids)){ player.x=tryX; player.vy=0; }
        else if(tryMove(player.x,tryY,currentSolids)){ player.y=tryY; player.vx=0; }
        else { player.vx=0; player.vy=0; }
      }
    } else { player.vx=0; player.vy=0; }
    // LEGAL: Seamless district detection — update HUD when crossing a bridge
    if(!state.currentInterior){
      const detectedDist = playerDistrict();
      if(detectedDist && detectedDist !== state.currentDistrict){
        state.currentDistrict = detectedDist;
        renderAll();
      }
    }

    if(state.currentInterior){
      renderer.domElement.style.display = 'none';
      interiorCanvas.style.display = 'block';
      drawInteriorScene();
    } else {
      interiorCanvas.style.display = 'none';
      renderer.domElement.style.display = 'block';
      updateDayNightLighting();
      updateWeather(dt);
      updateRoamingActors(roamingActors, { dt, playSeconds:state.playSeconds, indoors:!!state.currentInterior, canMove:function(x,y){ return tryMove(x,y,currentSolids); } });
      playerGroup.position.set(player.x, 0, player.y);
      playerGroup.rotation.y = -player.facing + Math.PI/2;
      camera3d.position.set(player.x, 260, player.y+72);
      camera3d.lookAt(player.x, 0, player.y);
      renderer.render(scene, camera3d);
    }
    drawMinimap();

    const near = nearestMarker();
    const hintEl = byId('map-hint');
    const outdoorStatus = (state.inVehicle ? 'Driving on ' : 'Walking on ') + currentRoadLabel() + ' | ' + mapClockLabel();
    const wp = state.waypoints[state.currentDistrict];
    if(wp && !state.currentInterior && Math.hypot(player.x-wp.x, player.y-wp.y) < (state.inVehicle ? 42 : 28)){
      state.waypoints[state.currentDistrict] = null;
      rebuildWaypointBeacon();
      byId('minimap-clear').classList.remove('show');
      scheduleSave();
    }
    renderDistrictLocationsPanel();
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
  const storageAdapter = {
    async set(key: string, value: string){
      if(window.storage && typeof window.storage.set === 'function'){
        try { await window.storage.set(key, value, false); return; } catch(e){}
      }
      try { window.localStorage.setItem(key, value); } catch(e){}
    },
    async get(key: string){
      if(window.storage && typeof window.storage.get === 'function'){
        try {
          const res = await window.storage.get(key, false);
          if(res && res.value) return res.value;
        } catch(e){}
      }
      try { return window.localStorage.getItem(key); } catch(e){ return null; }
    },
    async delete(key: string){
      if(window.storage && typeof window.storage.delete === 'function'){
        try { await window.storage.delete(key, false); return; } catch(e){}
      }
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
      muscleCount: state.muscleCount, ratCount: state.ratCount, bribeOn: state.bribeOn,
      prestigeCount: state.prestigeCount, seenMilestones: Array.from(state.seenMilestones),
      playSeconds: state.playSeconds, investorPenalty: state.investorPenalty,
      started: state.started, procNpc: state.procNpc, lastTick: state.lastTick,
      quiet: document.body.classList.contains('quiet'),
      light: document.body.classList.contains('theme-light'),
      delhi: document.body.classList.contains('theme-delhi'),
      businesses: businesses.map(b=> ({ id:b.id, level:b.level, crew:b.crew, manager:b.manager, researched:b.researched, reinvestedIncome:b.reinvestedIncome })),
      bank: state.bank, nextHeistAt: state.nextHeistAt,
      ownedCars: state.ownedCars, equippedCar: state.equippedCar, ownedProperties: state.ownedProperties,
      localBusinesses: localBusinesses.map(b=> ({ id:b.id, extorted:b.extorted, nextRobAt:b.nextRobAt })),
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
      currentNews: state.currentNews, newsQueue: state.newsQueue, nextNewsAt: state.nextNewsAt
    };
  }
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSaveTime = 0;
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
        state.muscleCount=d.muscleCount; state.ratCount=d.ratCount; state.bribeOn=d.bribeOn;
        state.prestigeCount=Math.max(0, Math.min(familyTiers.length, Number(d.prestigeCount)||0)); state.seenMilestones = new Set((d.seenMilestones||[]).map((x: any)=>String(x)));
        state.playSeconds=d.playSeconds||0; state.investorPenalty=Math.min(0.5, d.investorPenalty||0);
        state.started = d.started; if(d.procNpc) state.procNpc = d.procNpc;
        if(d.lastTick) state.lastTick = d.lastTick;
        (d.businesses||[]).forEach((sb: any)=>{ const b=businesses.find(x=>x.id===sb.id); if(b){ b.level=sb.level; b.crew=sb.crew; b.manager=sb.manager; b.researched=sb.researched; b.reinvestedIncome=Math.max(0, Number(sb.reinvestedIncome)||0); } });
        if(d.quiet){ document.body.classList.add('quiet'); byId<HTMLInputElement>('quiet-toggle').checked = true; }
        if(d.light){ document.body.classList.add('theme-light'); byId<HTMLInputElement>('theme-toggle').checked = true; }
        if(d.delhi){ document.body.classList.add('theme-delhi'); byId<HTMLInputElement>('delhi-theme-toggle').checked = true; }
        if(state.seenMilestones.has('chaat_house')) byId('delhi-theme-row').style.display = 'flex';
        state.bank = d.bank||0; state.nextHeistAt = d.nextHeistAt||0;
        state.ownedCars = d.ownedCars||[]; state.equippedCar = d.equippedCar||null; state.ownedProperties = d.ownedProperties||[];
        (d.localBusinesses||[]).forEach((sb: any)=>{ const b=localBusinesses.find(x=>x.id===sb.id); if(b){ b.extorted=sb.extorted; b.nextRobAt=sb.nextRobAt; } });
        state.currentDistrict = d.currentDistrict || 'devlin'; state.product = d.product||0; state.productLevel = d.productLevel||0;
        (d.districts||[]).forEach((sd: any)=>{ const dist=districts.find(x=>x.id===sd.id); if(dist){ dist.control=sd.control; dist.pushCount=sd.pushCount; dist.nextPushAt=sd.nextPushAt; } });
        (d.corners||[]).forEach((sc: any)=>{ const c=corners.find(x=>x.id===sc.id); if(c){ c.dealer=sc.dealer; c.busted=sc.busted; c.bustCooldownAt=sc.bustCooldownAt; } });
        state.influence=d.influence||0; state.influenceBuys=d.influenceBuys||0; state.electedOffice=d.electedOffice||false;
        state.campaignActive=d.campaignActive||false; state.campaignStyle=d.campaignStyle||''; state.campaignEndAt=d.campaignEndAt||0;
        state.nextCampaignAt=d.nextCampaignAt||0; state.nextWarAt=d.nextWarAt||0;
        (d.politicians||[]).forEach((sp: any)=>{ const p=politicians.find(x=>x.id===sp.id); if(p){ p.favor=sp.favor; p.pocketed=sp.pocketed||false; } });
        (d.gangRecruits||[]).forEach((sg: any)=>{ const g=gangRecruits.find(x=>x.id===sg.id); if(g) g.inducted=sg.inducted; });
        state.inVehicle = d.inVehicle||false;
        state.waypoints = Object.assign({devlin:null,westside:null,hub:null}, d.waypoints||{});
        state.parkedCarPos = Object.assign({devlin:{x:700,y:660},westside:{x:2700,y:660},hub:{x:4700,y:660}}, d.parkedCarPos||{});
        state.marketPrices = d.marketPrices || {};
        state.portfolio = d.portfolio || {};
        state.marketHistory = d.marketHistory || {};
        state.financeView = d.financeView || 'vault';
        state.activeStock = d.activeStock || null;
        state.currentNews = d.currentNews || [];
        state.newsQueue = d.newsQueue || [];
        state.nextNewsAt = d.nextNewsAt || 0;
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
    state.playSeconds += dt;

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
    state.bank += state.bank * 0.00035 * hubInterestMult() * dt;
    checkMilestones();

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

    // LEGAL: Corners can get busted independently of the big citywide raid once heat
    // LEGAL: runs hot — an earlier, smaller warning that the street layer is exposed.
    if(state.heat >= 70){
      const bustRoll = (state.heat-70)/30 * 0.02 * dt * (chinoInducted() ? 0.85 : 1);
      corners.forEach(c=>{
        if(c.dealer && !c.busted && Math.random() < bustRoll){
          c.busted = true; c.dealer = false; c.bustCooldownAt = state.playSeconds + 180;
          state.product = Math.max(0, state.product - state.product*0.3*whitmoreMult());
          state.cash = Math.max(0, state.cash - 200*c.tier*whitmoreMult());
          log(`<i class="ph-duotone ph-siren"></i> ${c.name} gets hit. Dealer's gone, some product's gone with it.`);
        }
      });
    }
    corners.forEach(c=>{ if(c.busted && state.playSeconds >= c.bustCooldownAt) c.busted = false; });

    // LEGAL: Territory drifts toward whoever's actually maintaining a presence there.
    districts.forEach(d=>{
      const cornerPresence = corners.filter(c=>c.district===d.id && c.dealer && !c.busted).length * 1.2;
      const venturePresence = d.id==='devlin' ? businesses.filter(b=>b.researched && b.level>0).length*0.3 : 0;
      const presence = state.muscleCount*0.15 + cornerPresence + venturePresence;
      const pressure = d.homeTurf ? 0.15 : 0.35;
      d.control = Math.max(0, Math.min(100, d.control + (presence-pressure)*dt));
    });

    const gen = heatGenPerSec();
    state.heat += (gen - 0.5) * dt;
    if(state.heat < 0) state.heat = 0;

    if(state.heat >= 100){
      const lossPct = Math.max(0.05, 0.15 - state.ratCount*0.01) * whitmoreMult();
      const loss = state.cash * lossPct;
      state.cash -= loss; state.respect = Math.max(0, state.respect-5); state.heat = 30;
      triggerMilestone('raid');
      
      let campaignNote = '';
      if(state.campaignActive) {
        state.campaignActive = false; // LEGAL: Campaign instantly dies if raided
        state.nextCampaignAt = state.playSeconds + 900;
        campaignNote = ' The scandal of the raid completely kills your political campaign.';
      }
      
      log(`<i class="ph-duotone ph-warning"></i> Someone official-looking cleans out ${fmt(loss)} "in fines."${campaignNote}`);
      const extortedList = localBusinesses.filter(b=>b.extorted);
      if(extortedList.length && Math.random()<0.4){
        const victim = extortedList[Math.floor(Math.random()*extortedList.length)];
        victim.extorted = false;
        log(`🐀 ${victim.owner} stops paying after the heat. Word is they went to the cops.`);
      }
    }


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
      body:`<p>Managers and crew kept things running. In the <strong>${mins} minute${mins===1?'':'s'}</strong> you were gone, the operation cleared <strong>${fmt(earned)}</strong>.</p>`,
      buttons:[{label:'Good'}] });
    log(`Business Report: ${fmt(earned)} earned while you were away.`);
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

  // LEGAL: ================= BOOT =================
  (async function boot(){
    wireDelegation();
    const loaded = await loadGame();
    if(loaded && state.started){
      applyOfflineProgress(state.lastTick);
      state.lastTick = Date.now();

      const spawn = spawnPoints[state.currentDistrict] || {x:700,y:460};
      player.x = spawn.x; player.y = spawn.y;
      buildDistrictScene(state.currentDistrict);
      refreshPlayerModel();
      renderAll();
      log('Picked up right where you left off.');
      return;
    }
    showModal({
      eyebrow:'Case File — A. Malhotra', title:'FROM DELHI, RUNNING', stamp:'New Arrival',
      body:`
        <p>Six months ago, <strong>Arjun Malhotra</strong> watched two men burn down his uncle's shop in Karol Bagh over a debt that was never really about money. He left Delhi with a duffel bag, four hundred dollars sewn into a jacket lining, and a phone number for a cousin in Windhaven he'd met exactly once, at a wedding, years ago.</p>
        <p class="flavor">The cousin's couch lasted three weeks. The four hundred dollars lasted six. Now he's got a folding cart, a griddle he doesn't fully own yet, and a corner of Devlin Street nobody wanted badly enough to fight him for.</p>
        <p><strong>Cash buys property. Crew runs the property. Respect takes territory.</strong> Everything else you'll figure out on the street.</p>
      `,
      buttons:[{label:'Open the Cart', onClick:function(){
        state.started = true; state.lastTick = Date.now(); lastFrame = Date.now();
        renderAll();
        log('Day one. Forty-seven dollars and a folding table on Devlin Street.');
        scheduleSave();
      }}]
    });
    renderAll();
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

    // LEGAL: Tab switching (1-6)
    const tabs = ['empire', 'map', 'bank', 'politics', 'gang', 'settings'];
    const key = parseInt(e.key);
    if (!isNaN(key) && key >= 1 && key <= 6) {
      e.preventDefault();
      const targetTab = tabs[key - 1];
      const tabBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`) as HTMLElement;
      if (tabBtn) tabBtn.click();
    }
  });
