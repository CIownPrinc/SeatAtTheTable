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
  function districtStatus(id){
    const c = districts.find(d=>d.id===id).control;
    return c>=60 ? 'yours' : (c<=25 ? 'rival' : 'contested');
  }
  function devlinIncomeBonus(){ const s=districtStatus('devlin'); return s==='yours'?1.15:(s==='rival'?0.9:1); }
  function westsideHeatMult(){ const s=districtStatus('westside'); return s==='yours'?0.75:(s==='rival'?1.25:1); }
  function westsideRateBonus(){ const s=districtStatus('westside'); return s==='yours'?1.15:(s==='rival'?0.85:1); }
  function hubInterestMult(){ return districtStatus('hub')==='yours' ? 1.5 : 1; }
  function hubHeistBonus(){ return districtStatus('hub')==='yours' ? 0.10 : 0; }
  function pushCost(d){ return Math.ceil(20 * Math.pow(1.6, d.pushCount)); }
  function pushDistrict(id){
    const d = districts.find(x=>x.id===id);
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
  function coleActive(){ return politicians.find(p=>p.id==='cole').favor >= 60; }
  function boyleActive(){ return politicians.find(p=>p.id==='boyle').favor >= 60; }
  function whitmoreActive(){ return politicians.find(p=>p.id==='whitmore').favor >= 60; }

  // LEGAL: ================= GANG =================
  // LEGAL: A small, hand-authored roster (not procedural) — each recruit requires an
  // LEGAL: initiation trial through the dialogue engine and grants a distinct
  // LEGAL: permanent bonus once inducted, plus counts toward Gang Strength for wars.
  function gangStrength(){
    const car = getEquippedCar();
    let s = state.muscleCount*1 + gangRecruits.filter(g=>g.inducted).length*3;
    if(car) s += car.heistBonus*10;
    if(gangRecruits.find(g=>g.id==='les').inducted) s *= 1.08;
    return s;
  }
  function rivalStrength(){
    const ws = districts.find(d=>d.id==='westside');
    return 20 + (100-ws.control)*0.3;
  }

  // LEGAL: ================= DIALOGUE ENGINE =================
  // LEGAL: Reusable branching conversation tree. Any future NPC/mission/politics/gang
  // LEGAL: interaction plugs into this same structure: { npcName, nodes:{ id:{text,choices:[{label,effect,next}]} } }
  const dialogues = {
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
  function npcOpeningNode(npcKey){
    if(npcKey==='sanjay'){
      if(state.prestigeCount>=5) return 'stage3';
      if(state.prestigeCount>=3) return 'stage2';
      if(state.prestigeCount>=1) return 'stage1';
      return 'start';
    }
    if(npcKey==='dice'){
      const control = districts.find(d=>d.id==='westside').control;
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
  function playDialogue(npcKey, nodeId){
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
  const state = {
    cash: 47, respect: 0, heat: 0,
    territoryTier: 0, negotiateTier: 0,
    muscleCount: 0, ratCount: 0, bribeOn: false,
    prestigeCount: 0, seenMilestones: new Set(),
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
  };

  // LEGAL: ================= HELPERS =================
  function fmt(n){
    const sign = n<0?'-':''; n=Math.abs(n);
    if(n < 1000) return sign+'$' + Math.floor(n);
    const units=['','K','M','B','T']; let u=0; let v=n;
    while(v>=1000 && u<units.length-1){ v/=1000; u++; }
    return sign+'$' + v.toFixed(v<10?2:1) + units[u];
  }
  function fmtR(n){ return Math.floor(n).toLocaleString(); }
  function discountMult(){ return Math.pow(0.93, state.negotiateTier) * (state.prestigeCount>=3?0.8:1); }
  function globalIncomeMult(){ return Math.max(0.1, (1 + state.prestigeCount*0.5) * (1 - (state.investorPenalty||0))); }
  function nadiaInducted(){ return gangRecruits.find(g=>g.id==='nadia').inducted; }
  function chinoInducted(){ return gangRecruits.find(g=>g.id==='chino').inducted; }
  function birdInducted(){ return gangRecruits.find(g=>g.id==='bird').inducted; }
  function whitmoreMult(){ return whitmoreActive() ? 0.7 : 1; }
  function researchCostFor(b){ return Math.ceil(b.researchCost * discountMult() * (coleActive()?0.9:1)); }
  function heatMult(){ return Math.max(0.3, (state.bribeOn?0.4:1) * (state.prestigeCount>=2?0.65:1) * (boyleActive()?0.8:1) * (nadiaInducted()?0.9:1)); }
  function crewCapGlobal(){ return 6 + state.territoryTier*4 + (state.prestigeCount>=3?6:0); }
  function crewUsedGlobal(){ return businesses.reduce((s,b)=> s + (b.manager?0:b.crew), 0); }
  function crewNeeded(b){ return b.level<=0 ? 0 : Math.ceil(b.level/5); }
  function efficiency(b){
    if(b.manager) return 1;
    const need = crewNeeded(b);
    if(need===0) return 1;
    return Math.max(0.35, Math.min(1, b.crew/need));
  }
  function costForLevel(b){ return Math.ceil(b.baseCost * Math.pow(1.15, b.level) * discountMult()); }
  function crewCostFor(b){ return Math.ceil(b.crewBaseCost * Math.pow(1.22, b.crew) * discountMult()); }
  function managerCostFor(b){ return Math.ceil(b.baseCost * 45 * discountMult()); }
  function territoryCost(){ return Math.ceil(40 * Math.pow(2.1, state.territoryTier)); }
  function negotiateCost(){ return Math.ceil(25 * Math.pow(1.8, state.negotiateTier)); }
  function muscleCost(){ return Math.ceil(80 * Math.pow(1.25, state.muscleCount)); }
  function ratsCashCost(){ return Math.ceil(150 * Math.pow(1.3, state.ratCount)); }
  function ratsRespectCost(){ return 5 + state.ratCount*2; }
  function tempMultActive(b){ return b.tempMultExpire > Date.now() ? b.tempMult : 1; }
  function applyTempMult(filter, mult, seconds){
    businesses.forEach(b=>{ if(filter==='all' || b.category===filter){ b.tempMult = mult; b.tempMultExpire = Date.now() + seconds*1000; } });
  }
  function hireFreeCrew(){
    const eligible = businesses.filter(b=> b.researched && !b.manager && b.level>0 && b.crew < crewNeeded(b)+2 && crewUsedGlobal() < crewCapGlobal());
    if(eligible.length===0){ state.cash += 400; log(`<i class="ph-duotone ph-handshake"></i> No open spot for them — they take a cash finder\'s fee instead.`); return; }
    const b = eligible[Math.floor(Math.random()*eligible.length)];
    b.crew += 1;
    log(`<i class="ph-duotone ph-handshake"></i> They join the crew at ${b.name}, no questions asked.`);
  }
  function incomeFor(b){ return b.level * b.baseIncome * efficiency(b) * tempMultActive(b); }
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
  function electedOfficeIncome(){ return state.electedOffice ? (5 + state.prestigeCount*2) : 0; }
  function rawTotalIncome(){ return (businesses.reduce((s,b)=> s+incomeFor(b), 0)*devlinIncomeBonus() + propertiesIncome() + localBizIncome() + cornerIncomePerSec() + electedOfficeIncome()) * globalIncomeMult(); }
  function bribeUpkeep(){ return state.bribeOn ? rawTotalIncome()*0.12 : 0; }
  function netIncome(){ return rawTotalIncome() - bribeUpkeep(); }
  function respectPerSec(){ const car=getEquippedCar(); return (state.muscleCount*0.6 + (car?car.respectPerSec:0)) * (state.prestigeCount>=5?1.25:1); }
  function heatGenPerSec(){
    const streetHeat = businesses.filter(b=>b.category==='street').reduce((s,b)=> s+(b.heatPerLevel||0)*b.level, 0);
    const extortHeat = localBusinesses.filter(b=>b.extorted).reduce((s,b)=> s+b.extortHeat, 0);
    return (state.muscleCount*0.5 + streetHeat + extortHeat + cornerHeatPerSec()) * heatMult() * (state.campaignActive ? 2.5 : 1);
  }
  function currentRank(){ let r=ranks[0]; for(const rk of ranks){ if(state.respect>=rk.respect) r=rk; } return r.title; }
  function isUnlocked(b){
    if(b.unlock.type==='start') return true;
    if(b.unlock.type==='cash') return state.cash>=b.unlock.value || b.level>0 || b.researched;
    if(b.unlock.type==='respect') return state.respect>=b.unlock.value || b.level>0 || b.researched;
    return false;
  }
  function log(msg){
    const wrap = document.getElementById('ticker');
    const item = document.createElement('div');
    item.className = 'ticker-item';
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    item.innerHTML = `<span class="t-time">${time}</span><span>${msg}</span>`;
    wrap.prepend(item);
    while(wrap.children.length > 45) wrap.removeChild(wrap.lastChild);
  }

  // LEGAL: ================= MODAL =================
  function showModal({eyebrow, title, body, stamp, buttons}){
    document.getElementById('modal-eyebrow').textContent = eyebrow || '';
    document.getElementById('modal-title').textContent = title || '';
    document.getElementById('modal-body').innerHTML = body || '';
    const stampEl = document.getElementById('modal-stamp');
    if(stamp){ stampEl.style.display='block'; stampEl.textContent = stamp; } else { stampEl.style.display='none'; }
    const footer = document.getElementById('modal-footer');
    footer.innerHTML = '';
    (buttons || [{label:"Continue"}]).forEach((btnDef, idx)=>{
      const btn = document.createElement('button');
      btn.className = 'modal-btn' + (btnDef.secondary ? ' secondary' : '');
      btn.innerHTML = `` + btnDef.label;
      btn.onclick = function(){
        document.getElementById('modal-overlay').classList.add('hidden');
        if(btnDef.onClick) btnDef.onClick();
      };
      footer.appendChild(btn);
    });
    document.getElementById('modal-overlay').classList.remove('hidden');
  }

  function triggerMilestone(id: string){
    if(state.seenMilestones.has(id)) return;
    const m = milestones.find(x => x.id === id);
    if(!m) return;
    state.seenMilestones.add(id);
    showModal({ eyebrow:'Windhaven Herald — West Side Edition', title:m.title, body:m.body, buttons:[{label:'Keep Going'}] });
    log(`<i class="ph-duotone ph-newspaper"></i> Headline: "${m.title.charAt(0)}${m.title.slice(1).toLowerCase()}"`);
    if(id === 'chaat_house') document.getElementById('delhi-theme-row').style.display = 'flex';
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
    if(state.activeCar === 'bentley') triggerMilestone('bentley');
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
  function openVentureQuickPanel(b){
    const unlocked = isUnlocked(b);
    let bodyHtml = `<p>${b.flavor}</p>`;
    let buttons = [];
    if(!unlocked){
      bodyHtml += `<p class="flavor">${b.unlock.type==='cash' ? ('Unlocks at '+fmt(b.unlock.value)+' cash') : ('Unlocks at '+b.unlock.value+' respect')}</p>`;
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
  function depositAmount(rawAmt){
    const amt = Math.floor(Number(rawAmt));
    if(!isFinite(amt) || amt<=0){ log('<i class="ph-duotone ph-bank"></i> Enter a valid amount to deposit.'); return; }
    if(amt > state.cash){ log(`<i class="ph-duotone ph-vault"></i> You don't have ${fmt(amt)} on hand to deposit.`); return; }
    state.cash -= amt; state.bank += amt;
    log(`<i class="ph-duotone ph-vault"></i> You deposit ${fmt(amt)}. Safe from raids in there.`);
    renderAll();
  }
  function withdrawAmount(rawAmt){
    const amt = Math.floor(Number(rawAmt));
    if(!isFinite(amt) || amt<=0){ log('<i class="ph-duotone ph-bank"></i> Enter a valid amount to withdraw.'); return; }
    if(amt > state.bank){ log(`<i class="ph-duotone ph-vault"></i> There's only ${fmt(state.bank)} banked.`); return; }
    state.bank -= amt; state.cash += amt;
    log(`<i class="ph-duotone ph-vault"></i> You withdraw ${fmt(amt)}.`);
    renderAll();
  }
  function resolveHeist(approach){
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
  function robLocalBiz(biz){
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
  function openTillPanel(biz){
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
  function openOwnerPanel(biz){
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
    const carsWrap = document.getElementById('assets-cars');
    const propWrap = document.getElementById('assets-buildings');
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
    const wrap = document.getElementById('bank-panel');
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

  function drawStockChart(symbol) {
    const canvas = document.getElementById('stock-chart') as HTMLCanvasElement;
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
      state.currentNews.unshift(state.newsQueue.pop());
      if(state.currentNews.length > 3) state.currentNews.pop();
      state.nextNewsAt = state.playSeconds + 120;
      
      const newsCard = document.getElementById('market-news-card');
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

  function tradeStock(symbol, amount, isBuy) {
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
  function assignDealer(corner){
    if(corner.dealer || corner.busted) return;
    if(state.cash < corner.dealerCost) return;
    state.cash -= corner.dealerCost; corner.dealer = true;
    log(`<i class="ph-duotone ph-briefcase"></i> A dealer's posted at ${corner.name}.`);
    renderAll();
  }
  function fireDealer(corner){
    if(!corner.dealer) return;
    corner.dealer = false;
    log(`<i class="ph-duotone ph-briefcase"></i> You pull the dealer off ${corner.name}.`);
    renderAll();
  }
  function openCornerPanel(corner){
    const d = districts.find(x=>x.id===corner.district);
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
  function favorCost(p){ return Math.ceil(200 * Math.pow(1.25, Math.floor(p.favor/15))); }
  function bribePolitician(id){
    const p = politicians.find(x=>x.id===id);
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
  function runCampaign(style){
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
  function inductRecruit(id, style){
    const g = gangRecruits.find(x=>x.id===id);
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
  function resolveWar(style){
    const ws = districts.find(d=>d.id==='westside');
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
    const wrap = document.getElementById('district-bar');
    if(!wrap) return;
    wrap.innerHTML = districts.map(d=>{
      const here = state.currentDistrict===d.id;
      return `<button class="district-btn ${here?'active':''}" data-travel="${d.id}" ${here?'disabled':''}><span class="pin-dot"></span>${here?'You\'re in ':''}${d.name}</button>`;
    }).join('');
  }
  function renderLegend(){
    const wrap = document.getElementById('map-legend');
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
    const wrap = document.getElementById('territory-panel');
    if(!wrap) return;
    const bonusText = { devlin:'+15% income to every venture when yours', westside:'-25% corner heat, +15% corner income when yours', hub:'+50% bank interest, +10% heist odds when yours' };
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
    const wrap = document.getElementById('politics-panel');
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
    const wrap = document.getElementById('gang-panel');
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
          <div class="col-stat">CONTROL: ${Math.round(districts.find(d=>d.id==='westside').control)}%</div>
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
  function renderCard(b){
    const unlocked = isUnlocked(b);
    const el = document.createElement('div');
    el.className = `data-row ${unlocked ? '' : 'locked'}`;
    let main = `<div class="data-main" onclick="if(${unlocked}) this.parentElement.classList.toggle('open')">
      <div class="col-id">${b.icon}</div>
      <div class="col-name">${b.name}<div class="col-name-sub">${b.category==='legit'?'Corporate Front':'Illicit Operation'}</div></div>`;
      
    if(!unlocked){
      let note = b.unlock.type==='cash' ? `Requires ${fmt(b.unlock.value)} cash` : `Requires ${b.unlock.value} **Respect**`;
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

  function handleCardAction(e){
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

  function handleAssetAction(e){
    const btn = (e.target as HTMLElement).closest('[data-car-buy],[data-car-equip],[data-car-sell],[data-prop-buy],[data-prop-sell]');
    if(!btn) return;
    if(btn.hasAttribute('data-car-buy')){
      const id = btn.getAttribute('data-car-buy'); const c = cars.find(x=>x.id===id);
      if(state.cash<c.cost) return;
      state.cash -= c.cost; state.ownedCars.push(id);
      if(!state.equippedCar) state.equippedCar = id;
      if(id === 'bentley') triggerMilestone('bentley');
      log(`<i class="ph-duotone ph-car"></i> You pick up a ${c.name}.`); updateParkedCarMesh(); refreshPlayerModel(); renderAll();
    } else if(btn.hasAttribute('data-car-equip')){
      state.equippedCar = btn.getAttribute('data-car-equip'); updateParkedCarMesh(); refreshPlayerModel(); renderAll();
    } else if(btn.hasAttribute('data-car-sell')){
      const id = btn.getAttribute('data-car-sell'); const c = cars.find(x=>x.id===id);
      state.ownedCars = state.ownedCars.filter(x=>x!==id);
      if(state.equippedCar===id) state.equippedCar = state.ownedCars[0] || null;
      state.cash += Math.round(c.cost*0.55);
      log(`<i class="ph-duotone ph-car"></i> You sell the ${c.name}.`); updateParkedCarMesh(); refreshPlayerModel(); renderAll();
    } else if(btn.hasAttribute('data-prop-buy')){
      const id = btn.getAttribute('data-prop-buy'); const p = properties.find(x=>x.id===id);
      if(state.cash<p.cost) return;
      state.cash -= p.cost; state.ownedProperties.push(id);
      if(state.ownedProperties.length === 1) triggerMilestone('first_property');
      log(`🏢 You close on ${p.name}.`); renderAll();
    } else if(btn.hasAttribute('data-prop-sell')){
      const id = btn.getAttribute('data-prop-sell'); const p = properties.find(x=>x.id===id);
      state.ownedProperties = state.ownedProperties.filter(x=>x!==id);
      state.cash += Math.round(p.cost*0.6);
      log(`🏢 You sell ${p.name}.`); renderAll();
    }
  }

  function handleStreetAction(e){
    const btn = (e.target as HTMLElement).closest('button');
    if(!btn) return;
    if(btn.id === 'upgrade-lab'){ upgradeLab(); }
    else if(btn.id === 'hire-muscle'){ if(state.cash<muscleCost()) return; state.cash -= muscleCost(); state.muscleCount += 1; renderAll(); }
    else if(btn.id === 'toggle-bribe'){ state.bribeOn = !state.bribeOn; log(state.bribeOn ? '👮 You put the beat cops on the payroll.' : '👮 You cut the cops off. Heat will build faster.'); renderAll(); }
    else if(btn.id === 'hire-rat'){ if(state.cash<ratsCashCost() || state.respect<ratsRespectCost()) return; state.cash -= ratsCashCost(); state.respect -= ratsRespectCost(); state.ratCount += 1; renderAll(); }
    else if(btn.id === 'buy-territory'){ if(state.respect<territoryCost()) return; state.respect -= territoryCost(); state.territoryTier += 1; log(`🗺️ New blocks fall under your control. Crew capacity is now ${crewCapGlobal()}.`); renderAll(); }
    else if(btn.id === 'buy-negotiate'){ if(state.respect<negotiateCost()) return; state.respect -= negotiateCost(); state.negotiateTier += 1; log(`<i class="ph-duotone ph-handshake"></i> You've got leverage now. Everyone's prices just got friendlier.`); renderAll(); }
  }

  function handleBankAction(e){
    const target = e.target as HTMLElement;
    const quickDeposit = target.closest('[data-deposit-quick]');
    if(quickDeposit){
      const inp = document.getElementById('deposit-input') as HTMLInputElement;
      if(inp) inp.value = String(Math.floor(state.cash * Number(quickDeposit.getAttribute('data-deposit-quick'))));
      return;
    }
    const quickWithdraw = target.closest('[data-withdraw-quick]');
    if(quickWithdraw){
      const inp = document.getElementById('withdraw-input') as HTMLInputElement;
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
      const action = tradeBtn.getAttribute('data-trade');
      const sym = tradeBtn.getAttribute('data-sym');
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
      const inp = document.getElementById('deposit-input') as HTMLInputElement;
      depositAmount(inp?.value);
    } else if(btn.id === 'withdraw-go'){
      const inp = document.getElementById('withdraw-input') as HTMLInputElement;
      withdrawAmount(inp?.value);
    } else if(btn.id === 'start-heist'){
      if(state.playSeconds < state.nextHeistAt) return;
      playDialogue('bankheist', 'start');
    }
  }
  function handleBankKeydown(e){
    if((e as KeyboardEvent).key !== 'Enter') return;
    const target = e.target as HTMLInputElement;
    if(target.id === 'deposit-input') depositAmount(target.value);
    else if(target.id === 'withdraw-input') withdrawAmount(target.value);
  }

  function handleTerritoryAction(e){
    const btn = (e.target as HTMLElement).closest('[data-push]');
    if(!btn) return;
    pushDistrict(btn.getAttribute('data-push'));
  }

  function handlePoliticsAction(e){
    const target = e.target as HTMLElement;
    const bribeBtn = target.closest('[data-bribe]');
    if(bribeBtn){ bribePolitician(bribeBtn.getAttribute('data-bribe')); return; }
    const btn = target.closest('button');
    if(!btn) return;
    if(btn.id === 'buy-influence'){ buyInfluence(); }
    else if(btn.id === 'launch-campaign'){
      if(state.electedOffice || state.campaignActive) return;
      if(!(state.influence >= 500 && state.playSeconds >= state.nextCampaignAt)) return;
      playDialogue('campaign', 'start');
    }
  }

  function handleGangAction(e){
    const target = e.target as HTMLElement;
    const checkinBtn = target.closest('[data-checkin]');
    if(checkinBtn){ const g = gangRecruits.find(x=>x.id===checkinBtn.getAttribute('data-checkin')); if(g) playDialogue(g.dialogueKey, 'checkin'); return; }
    const initiateBtn = target.closest('[data-initiate]');
    if(initiateBtn){ const g = gangRecruits.find(x=>x.id===initiateBtn.getAttribute('data-initiate')); if(g) playDialogue(g.dialogueKey, 'start'); return; }
    const btn = target.closest('button');
    if(!btn) return;
    if(btn.id === 'declare-war'){ if(state.playSeconds < state.nextWarAt) return; playDialogue('gangwar', 'start'); }
  }

  function handleDistrictAction(e){
    const btn = (e.target as HTMLElement).closest('[data-travel]');
    if(!btn) return;
    travelTo(btn.getAttribute('data-travel'));
  }

  // LEGAL: Wire all delegation listeners exactly once at boot. Stable containers
  // LEGAL: never get destroyed so each handler accumulates at exactly 1 per container.
  function wireDelegation(){
    document.getElementById('grid-legit').addEventListener('click', handleCardAction);
    document.getElementById('grid-street').addEventListener('click', handleCardAction);
    document.getElementById('assets-cars').addEventListener('click', handleAssetAction);
    document.getElementById('assets-buildings').addEventListener('click', handleAssetAction);
    document.getElementById('street-panel').addEventListener('click', handleStreetAction);
    const bankPanel = document.getElementById('bank-panel');
    if(bankPanel){ bankPanel.addEventListener('click', handleBankAction); bankPanel.addEventListener('keydown', handleBankKeydown); }
    document.getElementById('territory-panel').addEventListener('click', handleTerritoryAction);
    document.getElementById('politics-panel').addEventListener('click', handlePoliticsAction);
    document.getElementById('gang-panel').addEventListener('click', handleGangAction);
    document.getElementById('district-bar').addEventListener('click', handleDistrictAction);
  }

  // LEGAL: ================= RENDER: STREET PANEL =================
  function renderStreetPanel(){
    const wrap = document.getElementById('street-panel');
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
    const legitGrid = document.getElementById('grid-legit');
    const streetGrid = document.getElementById('grid-street');
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

    document.getElementById('hud-cash').textContent = fmt(state.cash);
    document.getElementById('hud-income').textContent = (netIncome()>=0?'+':'') + fmt(netIncome()) + '/s';
    document.getElementById('hud-rank').textContent = currentRank();
    document.getElementById('hud-respect').textContent = `${fmtR(state.respect)} respect`;
    document.getElementById('heat-fill').style.width = Math.min(100, state.heat) + '%';
    document.getElementById('hud-crew').textContent = `${crewUsedGlobal()} / ${crewCapGlobal()}`;

    const prestigeBtn = document.getElementById('prestige-btn');
    const threshold = 50000 * Math.pow(4, state.prestigeCount);
    const nextFamily = familyTiers[Math.min(state.prestigeCount, familyTiers.length-1)];
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
    document.getElementById('hud-cash').textContent = fmt(state.cash);
    document.getElementById('hud-income').textContent = (netIncome()>=0?'+':'') + fmt(netIncome()) + '/s';
    document.getElementById('hud-rank').textContent = rank;
    document.getElementById('hud-respect').textContent = `${fmtR(state.respect)} respect`;
    document.getElementById('heat-fill').style.width = Math.min(100, state.heat) + '%';
    document.getElementById('hud-crew').textContent = `${crewUsedGlobal()} / ${crewCapGlobal()}`;

    if(rank === 'Local Boss') triggerMilestone('local_boss');
    if(rank === 'West Side Kingpin') triggerMilestone('kingpin');

    const prestigeBtn = document.getElementById('prestige-btn');
    const threshold = 50000 * Math.pow(4, state.prestigeCount);
    const nextFamily = familyTiers[Math.min(state.prestigeCount, familyTiers.length-1)];
    if(state.cash >= threshold*0.2 || state.prestigeCount>0){
      prestigeBtn.style.display = 'inline-block';
      prestigeBtn.disabled = state.cash < threshold;
      prestigeBtn.textContent = state.cash >= threshold ? `Bring in ${nextFamily.name}` : `Bring in ${nextFamily.name} (Requires ${fmt(threshold)})`;
    }
  }
  function refreshAffordability(){
    document.querySelectorAll('[data-action]').forEach(btn=>{
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
    const hm=document.getElementById('hire-muscle'); if(hm) hm.disabled = state.cash<muscleCost();
    const hr=document.getElementById('hire-rat'); if(hr) hr.disabled = !(state.cash>=ratsCashCost() && state.respect>=ratsRespectCost());
    const bt=document.getElementById('buy-territory'); if(bt) bt.disabled = state.respect<territoryCost();
    const bn=document.getElementById('buy-negotiate'); if(bn) bn.disabled = state.respect<negotiateCost();
    document.querySelectorAll('[data-car-buy]').forEach(btn=>{ const c=cars.find(x=>x.id===btn.getAttribute('data-car-buy')); if(c) btn.disabled = state.cash<c.cost; });
    document.querySelectorAll('[data-prop-buy]').forEach(btn=>{ const p=properties.find(x=>x.id===btn.getAttribute('data-prop-buy')); if(p) btn.disabled = state.cash<p.cost; });
    const heistBtn=document.getElementById('start-heist'); if(heistBtn) heistBtn.disabled = state.playSeconds<state.nextHeistAt;
    const bankedEl=document.getElementById('bank-banked-value'); if(bankedEl) bankedEl.textContent=fmt(state.bank);
    const onhandEl=document.getElementById('bank-onhand-value'); if(onhandEl) onhandEl.textContent=fmt(state.cash);
    const heistStatusEl=document.getElementById('heist-status-value');
    if(heistStatusEl){
      const canHeist = state.playSeconds >= state.nextHeistAt;
      heistStatusEl.textContent = canHeist ? 'Ready' : `Cooling off (${Math.max(0,Math.ceil(state.nextHeistAt-state.playSeconds))}s)`;
    }
    const labBtn=document.getElementById('upgrade-lab'); if(labBtn) labBtn.disabled = state.cash<labCost();
    document.querySelectorAll('[data-push]').forEach(btn=>{
      const d = districts.find(x=>x.id===btn.getAttribute('data-push'));
      if(d) btn.disabled = state.playSeconds<d.nextPushAt || state.respect<pushCost(d);
    });
    const buyInfluenceBtn=document.getElementById('buy-influence'); if(buyInfluenceBtn) buyInfluenceBtn.disabled = state.cash<influenceCost();
    document.querySelectorAll('[data-bribe]').forEach(btn=>{
      const p = politicians.find(x=>x.id===btn.getAttribute('data-bribe'));
      if(p) btn.disabled = state.cash<favorCost(p) || p.favor>=100;
    });
    const campaignBtn=document.getElementById('launch-campaign');
    if(campaignBtn && !state.electedOffice) campaignBtn.disabled = !(state.influence>=100 && state.playSeconds>=state.nextCampaignAt);
    document.querySelectorAll('[data-initiate]').forEach(btn=>{
      const g = gangRecruits.find(x=>x.id===btn.getAttribute('data-initiate'));
      if(g) btn.disabled = state.cash<g.cost;
    });
    const warBtn=document.getElementById('declare-war'); if(warBtn) warBtn.disabled = state.playSeconds<state.nextWarAt;
    refreshTerritory();
  }
  function refreshTerritory(){
    districts.forEach(d=>{
      const bar = document.querySelector(`[data-control-bar="${d.id}"]`);
      if(bar) bar.style.width = Math.round(d.control) + '%';
      const label = document.querySelector(`[data-control-label="${d.id}"]`);
      if(label) label.textContent = `${Math.round(d.control)}% — ${districtStatus(d.id)==='yours'?'Yours':(districtStatus(d.id)==='rival'?'Rival Controlled':'Contested')}`;
    });
    const tradeEl = document.getElementById('trade-summary');
    if(tradeEl){
      const active = activeCorners().length;
      tradeEl.textContent = `${state.product.toFixed(0)}/${productCap()} product · ${active}/${corners.length} corners staffed · ${cornerIncomePerSec().toFixed(1)}/s`;
    }
  }

  // LEGAL: ================= PRESTIGE =================
  document.getElementById('prestige-btn').addEventListener('click', function(){
    const threshold = 50000 * Math.pow(4, state.prestigeCount);
    if(state.cash < threshold) return;
    const tier = familyTiers[Math.min(state.prestigeCount, familyTiers.length-1)];
    showModal({
      eyebrow:"O'Hare Terminal 5", title:"FAMILY INBOUND", stamp:'Arrived',
      body:`<p><strong>${tier.name}</strong> is cleared at customs. ${tier.desc}</p><p class="flavor">Setting them up in Chicago requires transferring almost every dollar on hand to clear their debts and secure their paper trail. Your active fronts will close down temporarily, and muscle on the street will scatter until the dust settles. Hired managers and research dossiers remain yours.</p>`,
      buttons:[
        {label:"Make the transfer", onClick:function(){
          state.cash = 47; state.heat = 0; state.muscleCount = 0; state.ratCount = 0;
          businesses.forEach(b=>{ b.level=0; b.crew=0; });
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
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', function(){ setTab(btn.getAttribute('data-tab')); });
  });
  function setTab(tab){
    document.querySelectorAll('.tab-btn').forEach(b=> b.classList.toggle('active', b.getAttribute('data-tab')===tab));
    document.querySelectorAll('.tab-panel').forEach(p=> p.classList.toggle('active', p.getAttribute('data-tab')===tab));
    mapActive = (tab==='map');
    if(mapActive && !mapHubRunning){
      mapHubRunning = true;
      lastFrame2 = Date.now(); // LEGAL: avoid a huge dt spike from time spent on another tab
      requestAnimationFrame(mapHub);
    }
  }

  // LEGAL: ================= MAP: 3D WORLD + MINIMAP + INTERIORS =================
  const VIEW_W = 760, VIEW_H = 440;
  // LEGAL: Unified city — 3 districts side by side, canals between them
  const WORLD_W = 5500, WORLD_H = 1200;
  const DISTRICT_OFFSETS = { devlin:0, westside:2000, hub:4000 };
  const player = { x:700, y:600, facing:Math.PI/2 };
  const keys = {};
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

  // LEGAL: Businesses spread proportionally across all 3 districts
  const bizDistricts = ['devlin','devlin','devlin','devlin','devlin','westside','westside','westside','westside','hub','hub','hub'];
  const mapBuildings = businesses.map((b,i)=>{
    const dist = bizDistricts[i] || 'hub';
    const col = i % 4;
    const row = Math.floor(i / 4);
    const relX = [180, 480, 780, 1100][col];
    const relY = row===0 ? 260 : (row===1 ? 620 : 960);
    return { id:b.id, biz:b, district:dist, x: relX + DISTRICT_OFFSETS[dist], y: relY };
  });
  const mapNpcs = [
    { id:'sanjay', name:'Sanjay', district:'devlin', x:1300, y:960, type:'named' },
    { id:'stranger', name:'Stranger', district:'devlin', x:150, y:960, type:'procedural' },
    { id:'dice', name:'Dice', district:'westside', x:2750, y:400, type:'named' },
    { id:'reyes', name:'Councilman Reyes', district:'hub', x:4600, y:720, type:'named' },
  ];
  const spawnPoints = { devlin:{x:700,y:600}, westside:{x:2700,y:600}, hub:{x:4700,y:600} };
  const districtThemes = {
    devlin: { ground:'#232a26', parkLabel:'INDIAN BOUNDARY PARK', hasRail:false, hasRiver:false },
    westside: { ground:'#2a2222', parkLabel:'CICERO GREEN', hasRail:true, hasRiver:false },
    hub: { ground:'#211f16', parkLabel:'MILLENNIUM PARK', hasRail:false, hasRiver:true },
  };

  // LEGAL: Returns which district the player is in based on X position
  function playerDistrict(){
    if(player.x < 1500) return 'devlin';
    if(player.x < 2000) return null;
    if(player.x < 3500) return 'westside';
    if(player.x < 4000) return null;
    return 'hub';
  }
  // LEGAL: Unified world — all markers always in scene
  function inDistrict(){ return true; }

  // LEGAL: ---- road network: full unified grid spanning all 5500 units ----
  const roadNetwork = {
    // LEGAL: Vertical arteries per district
    vertical: [
      {x:270,w:74},{x:700,w:74},{x:1130,w:74},
      {x:2270,w:74},{x:2700,w:74},{x:3130,w:74},
      {x:4270,w:74},{x:4700,w:74},{x:5130,w:74}
    ],
    // LEGAL: Horizontal roads span full width — they form bridge decks over canals
    horizontal: [{y:300,w:74},{y:600,w:74},{y:900,w:74}],
  };
  function isOnRoad(x,y){
    return roadNetwork.vertical.some(r=> Math.abs(x-r.x)<=r.w/2) || roadNetwork.horizontal.some(r=> Math.abs(y-r.y)<=r.w/2);
  }

  // LEGAL: ---- deterministic filler city: same layout every time, not regenerated per load ----
  function seededRandom(seed){
    return function(){
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const districtSeeds = { devlin:1001, westside:2002, hub:3003 };
  // LEGAL: Filler band X/Y coordinates are relative to a 1500x950 grid; offset applied at render time
  function occupiedZones(districtId){
    const zones = [];
    const add = (arr,r)=> arr.filter(m=>m.district===districtId).forEach(m=> zones.push({x:m.x,y:m.y,r}));
    add(mapBuildings,70); add(serviceBuildings,70); add(localBusinesses,60);
    add(corners,50); add(mapNpcs,50); add(gangRecruits,50);
    return zones;
  }
  function generateFillerLayout(districtId){
    const rand = seededRandom(districtSeeds[districtId]);
    const occupied = occupiedZones(districtId);
    const xBands = [[15,235],[305,665],[735,1095],[1165,1485]];
    const yBands = [[15,185],[255,425],[495,695],[765,935]];
    const parkBand = { xi:0, yi: districtId==='hub' ? 1 : 3 };
    const lotBand = { xi:3, yi: districtId==='hub' ? 3 : 0 };
    const filler = [];
    for(let xi=0; xi<xBands.length; xi++){
      for(let yi=0; yi<yBands.length; yi++){
        const x0=xBands[xi][0], x1=xBands[xi][1], y0=yBands[yi][0], y1=yBands[yi][1];
        const cx=(x0+x1)/2, cy=(y0+y1)/2;
        if(occupied.some(o=> Math.abs(o.x-cx)<(x1-x0)/2+30 && Math.abs(o.y-cy)<(y1-y0)/2+30)) continue;
        if(xi===parkBand.xi && yi===parkBand.yi){ filler.push({kind:'park', x0,y0,x1,y1}); continue; }
        if(xi===lotBand.xi && yi===lotBand.yi){ filler.push({kind:'lot', x0,y0,x1,y1}); continue; }
        const count = 1 + Math.floor(rand()*2);
        for(let n=0;n<count;n++){
          const w=40+rand()*50, d=40+rand()*50, h=14+rand()*46;
          const fx = x0+20+rand()*Math.max(10,(x1-x0-w-40));
          const fy = y0+20+rand()*Math.max(10,(y1-y0-d-40));
          filler.push({kind:'building', x:fx+w/2, y:fy+d/2, w, d, h, hue:rand()});
        }
      }
    }
    return filler;
  }
  const fillerCache = {};
  function fillerFor(districtId){
    if(!fillerCache[districtId]) fillerCache[districtId] = generateFillerLayout(districtId);
    return fillerCache[districtId];
  }
    function buildAllSolids(){
    const list = [];
    mapBuildings.forEach(m=>{
      const w = m.biz.baseCost>=50000?66:(m.biz.baseCost<1000?46:56);
      list.push({x:m.x,y:m.y,hw:w/2+6,hd:(w*0.85)/2+6});
    });
    serviceBuildings.forEach(m=> list.push({x:m.x,y:m.y,hw:35,hd:31}));
    localBusinesses.forEach(m=> list.push({x:m.x,y:m.y,hw:27,hd:24}));
    ['devlin','westside','hub'].forEach(function(distId){
      const off = DISTRICT_OFFSETS[distId];
      fillerFor(distId).filter(f=>f.kind==='building').forEach(f=> list.push({x:f.x+off,y:f.y,hw:f.w/2+4,hd:f.d/2+4}));
    });
    return list;
  }
  function buildingSolids(districtId){
    return buildAllSolids();
  }
  function collidesBuilding(x,y,solids){ return solids.some(s=> Math.abs(x-s.x)<s.hw && Math.abs(y-s.y)<s.hd); }
  let currentSolids = [];

  // LEGAL: ---- interiors: a small generic room per building, with 1-2 physical hotspots ----
  const ROOM_W = 480, ROOM_H = 280, ROOM_OX = (VIEW_W-ROOM_W)/2, ROOM_OY = (VIEW_H-ROOM_H)/2 - 10;
  const DOOR_LOCAL = { x: ROOM_W/2, y: ROOM_H-6 };

  function hotspotsFor(interior){
    if(!interior) return [];
    if(interior.kind==='venture'){
      const b = businesses.find(x=>x.id===interior.refId);
      return [{ id:'counter', x:ROOM_W/2, y:80, label:'Counter', icon:'🧾', action:()=> openVentureQuickPanel(b) }];
    }
    if(interior.kind==='local'){
      const biz = localBusinesses.find(x=>x.id===interior.refId);
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

  function enterBuilding(kind, refId, name){
    if(state.inVehicle) exitVehicle();
    state.currentInterior = { kind, refId, name, returnX:player.x, returnY:player.y, returnDistrict:state.currentDistrict };
    player.x = DOOR_LOCAL.x; player.y = DOOR_LOCAL.y - 40; player.facing = -Math.PI/2;
    Object.keys(keys).forEach(k=> keys[k]=false);
    lastFrame2 = Date.now();
    log(`🚪 You step into ${name}.`);
    renderAll();
  }
  function exitBuilding(){
    const ret = state.currentInterior;
    if(!ret) return;
    state.currentInterior = null;
    player.x = ret.returnX; player.y = ret.returnY; player.facing = Math.PI/2;
    Object.keys(keys).forEach(k=> keys[k]=false);
    lastFrame2 = Date.now();
    renderAll();
  }

  // LEGAL: ---- vehicle: explicit enter/exit, matches the "Enter Vehicle" prompt pattern ----
  function enterVehicle(){
    if(!getEquippedCar()) return;
    state.inVehicle = true;
    refreshPlayerModel(); updateParkedCarMesh();
    log('You get in.');
    renderAll();
  }
  function exitVehicle(){
    if(!state.inVehicle) return;
    state.inVehicle = false;
    state.parkedCarPos[state.currentDistrict] = { x:player.x, y:player.y };
    refreshPlayerModel(); updateParkedCarMesh();
    log('You park up and get out.');
    renderAll();
  }

  function travelTo(id){
    if(state.currentDistrict === id) return;
    state.currentInterior = null;
    state.currentDistrict = id;
    const spawn = spawnPoints[id] || {x:700,y:600};
    player.x = spawn.x; player.y = spawn.y; player.facing = Math.PI/2;
    Object.keys(keys).forEach(k=> keys[k]=false);
    lastFrame2 = Date.now();
    // LEGAL: City is built once — travelTo just repositions the player
    updateParkedCarMesh();
    rebuildWaypointBeacon();
    refreshPlayerModel();
    const d = districts.find(x=>x.id===id);
    log(`<i class="ph-duotone ph-car"></i> You head over to ${d.name}.`);
    renderAll();
  }

  window.addEventListener('keydown', function(e){
    const k = e.key.toLowerCase();
    keys[k] = true;
    if(k==='e') tryInteract();
  });
  window.addEventListener('keyup', function(e){ keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', function(){ Object.keys(keys).forEach(k=> keys[k]=false); });
  document.getElementById('btn-interact').addEventListener('click', tryInteract);

  document.getElementById('fullscreen-btn').addEventListener('click', function(){
    const container = document.getElementById('scene3d-container');
    const isFs = container.classList.toggle('fullscreen');
    const btn = document.getElementById('fullscreen-btn');
    btn.innerHTML = isFs ? '<i class="ph-duotone ph-arrows-in"></i>' : '<i class="ph-duotone ph-arrows-out"></i>';
    if(renderer){
      const w = isFs ? window.innerWidth : VIEW_W;
      const h = isFs ? window.innerHeight : VIEW_H;
      renderer.setSize(w, h);
      if(camera3d){ camera3d.aspect = w/h; camera3d.updateProjectionMatrix(); }
    }
  });
  window.addEventListener('resize', function(){
    const container = document.getElementById('scene3d-container');
    if(container.classList.contains('fullscreen') && renderer){
      renderer.setSize(window.innerWidth, window.innerHeight);
      if(camera3d){ camera3d.aspect = window.innerWidth/window.innerHeight; camera3d.updateProjectionMatrix(); }
    }
  });

  document.getElementById('fullscreen-btn').addEventListener('click', function(){
    const container = document.getElementById('scene3d-container');
    const isFs = container.classList.toggle('fullscreen');
    const btn = document.getElementById('fullscreen-btn');
    btn.innerHTML = isFs ? '<i class="ph-duotone ph-arrows-in"></i>' : '<i class="ph-duotone ph-arrows-out"></i>';
    if(renderer){
      const w = isFs ? window.innerWidth : VIEW_W;
      const h = isFs ? window.innerHeight : VIEW_H;
      renderer.setSize(w, h);
      if(camera3d){ camera3d.aspect = w/h; camera3d.updateProjectionMatrix(); }
    }
  });
  window.addEventListener('resize', function(){
    const container = document.getElementById('scene3d-container');
    if(container.classList.contains('fullscreen') && renderer){
      renderer.setSize(window.innerWidth, window.innerHeight);
      if(camera3d){ camera3d.aspect = window.innerWidth/window.innerHeight; camera3d.updateProjectionMatrix(); }
    }
  });

  function nearestMarker(){
    if(state.currentInterior){
      let best=null, bestDist=46;
      const dDoor = Math.hypot(player.x-DOOR_LOCAL.x, player.y-DOOR_LOCAL.y);
      if(dDoor<bestDist){ bestDist=dDoor; best={type:'door', ref:{label:'Exit'}}; }
      hotspotsFor(state.currentInterior).forEach(h=>{
        const d = Math.hypot(player.x-h.x, player.y-h.y);
        if(d<bestDist){ bestDist=d; best={type:'hotspot', ref:h}; }
      });
      return best;
    }
    if(state.inVehicle) return null;
    let best=null, bestDist=46;
    const car = getEquippedCar();
    const parked = state.parkedCarPos[state.currentDistrict];
    if(car && parked){
      const d = Math.hypot(player.x-parked.x, player.y-parked.y);
      if(d<bestDist){ bestDist=d; best={type:'car', ref:parked}; }
    }
    mapBuildings.filter(inDistrict).forEach(m=>{ const d=Math.hypot(player.x-m.x,player.y-m.y); if(d<bestDist){ bestDist=d; best={type:'building',ref:m}; } });
    serviceBuildings.filter(inDistrict).forEach(m=>{ const d=Math.hypot(player.x-m.x,player.y-m.y); if(d<bestDist){ bestDist=d; best={type:'service',ref:m}; } });
    mapNpcs.filter(inDistrict).forEach(m=>{ const d=Math.hypot(player.x-m.x,player.y-m.y); if(d<bestDist){ bestDist=d; best={type:'npc',ref:m}; } });
    gangRecruits.filter(inDistrict).forEach(m=>{ const d=Math.hypot(player.x-m.x,player.y-m.y); if(d<bestDist){ bestDist=d; best={type:'gangnpc',ref:m}; } });
    localBusinesses.filter(inDistrict).forEach(m=>{ const d=Math.hypot(player.x-m.x,player.y-m.y); if(d<bestDist){ bestDist=d; best={type:'local',ref:m}; } });
    corners.filter(inDistrict).forEach(m=>{ const d=Math.hypot(player.x-m.x,player.y-m.y); if(d<bestDist){ bestDist=d; best={type:'corner',ref:m}; } });
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
    else if(m.type==='corner') openCornerPanel(m.ref);
    else if(m.type==='gangnpc') playDialogue(m.ref.dialogueKey, m.ref.inducted ? 'checkin' : 'start');
    else if(m.ref.type==='named') playDialogue(m.ref.id, npcOpeningNode(m.ref.id));
    else proceduralInteract();
  }

  function currentSpeed(){
    if(state.currentInterior) return 150;
    if(state.inVehicle){ const car=getEquippedCar(); return 210*(car?car.speedMult:1); }
    return 150;
  }
  function tryMove(nx, ny, solids){
    if(nx<16||nx>WORLD_W-16||ny<16||ny>WORLD_H-16) return false;
    // LEGAL: Block movement in canals except on bridge horizontal roads
    if(!state.inVehicle){
      const inCanal1 = nx > 1530 && nx < 1970;
      const inCanal2 = nx > 3530 && nx < 3970;
      if(inCanal1 || inCanal2){
        const onBridge = roadNetwork.horizontal.some(r => Math.abs(ny - r.y) <= r.w/2);
        if(!onBridge) return false;
      }
    }
    if(collidesBuilding(nx,ny,solids)) return false;
    if(state.inVehicle && !isOnRoad(nx,ny)) return false;
    return true;
  }

  // LEGAL: ================= THREE.JS SCENE =================
  let scene, camera3d, renderer, worldGroup, playerGroup, sunLight, waypointBeacon, parkedCarMesh;

  function disposeObj(o){
    if(o.geometry) o.geometry.dispose();
    if(o.material){
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m=>{ if(m.map) m.map.dispose(); m.dispose(); });
    }
  }
  function clearGroup(g){ while(g.children.length){ const c=g.children.pop(); c.traverse(disposeObj); } }

  function box(w,h,d,color){
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({color, roughness:0.85, metalness:0.05}));
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function addSign(parent, text, w, h, y, color){
    const c = document.createElement('canvas'); c.width=2048; c.height=256;
    const cctx = c.getContext('2d');
    cctx.fillStyle='rgba(10,11,16,0.85)'; cctx.fillRect(0,0,2048,256);
    cctx.fillStyle=color; cctx.font='bold 120px sans-serif'; cctx.textAlign='center'; cctx.textBaseline='middle';
    cctx.fillText(text.slice(0,32), 1024, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, depthTest:false}));
    sprite.scale.set(w * 4, h * 2, 1); sprite.position.y = y;
    parent.add(sprite);
  }
  function buildPedestrianModel(color){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(6,7,20,8), new THREE.MeshStandardMaterial({color: color||'#e8e6de'}));
    body.position.y = 14; body.castShadow=true; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(6,10,10), new THREE.MeshStandardMaterial({color:'#d9b48f'}));
    head.position.y = 28; head.castShadow=true; g.add(head);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(2.2,6,6), new THREE.MeshStandardMaterial({color:'#d4a017'}));
    nose.rotation.x = Math.PI/2; nose.position.set(0,14,8); g.add(nose);
    return g;
  }
  function buildCarModel(car){
    const g = new THREE.Group();
    const bodyH = car.id==='escalade'?18:(car.id==='bentley'?16:14);
    const body = box(car.len, bodyH, car.wid, car.color);
    body.position.y = bodyH/2+1; g.add(body);
    const cabinW = car.id==='escalade'?car.len*0.55:car.len*0.42;
    const cabin = box(cabinW, 10, car.wid*0.82, '#1c1e24');
    cabin.position.set(car.len*0.04, bodyH+6, 0); g.add(cabin);
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
    const beam = new THREE.Mesh(new THREE.ConeGeometry(9,40,10,1,true), new THREE.MeshBasicMaterial({color:'#fff6d8', transparent:true, opacity:0.12, side:THREE.DoubleSide}));
    beam.rotation.x=-Math.PI/2; beam.position.set(car.len/2+18, bodyH/2+1, 0); g.add(beam);
    g.castShadow=true;
    return g;
  }
  function buildingColorFor(b){
    const unlocked = isUnlocked(b);
    const opened = unlocked && b.researched && b.level>0;
    const legit = b.category==='legit';
    if(!opened) return { color:'#33353d', h:26 };
    return { color: legit ? '#3e6b78' : '#7c3540', h: 24+Math.min(70,b.level*3) };
  }


  // LEGAL: ---- procedural building with windows, door, and zone-specific roof ----
  function buildDetailedBuilding(w, h, d, color, zoneType){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({color, roughness:0.85, metalness:0.05}));
    body.castShadow=true; body.receiveShadow=true; g.add(body);
    const winMat = new THREE.MeshStandardMaterial({color:'#c8d8ff', emissive:'#5070c0', emissiveIntensity:0.45, roughness:0.2});
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
    if(zoneType==='skyscraper' && h>60){
      const spire = new THREE.Mesh(new THREE.ConeGeometry(4,h*0.22,6), new THREE.MeshStandardMaterial({color:'#8090b0', metalness:0.8, roughness:0.1}));
      spire.position.y = h/2 + h*0.11; g.add(spire);
    } else if(zoneType==='residential'){
      const roof = new THREE.Mesh(new THREE.ConeGeometry(w*0.58,12,4), new THREE.MeshStandardMaterial({color:'#4a3830', roughness:0.9}));
      roof.position.y = h/2+6; roof.rotation.y=Math.PI/4; g.add(roof);
    } else if(zoneType==='industrial'){
      const vent = new THREE.Mesh(new THREE.CylinderGeometry(4,5,14,8), new THREE.MeshStandardMaterial({color:'#404450', roughness:0.8}));
      vent.position.set(w*0.25, h/2+7, 0); g.add(vent);
    }
    return g;
  }


  // LEGAL: ---- unified city — builds the entire world once; no per-district teardown ----
  function buildCityScene(){
    clearGroup(worldGroup);

    // LEGAL: Base ground plane — full city footprint
    const groundBase = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_W,WORLD_H), new THREE.MeshStandardMaterial({color:'#1e2124', roughness:1}));
    groundBase.rotation.x=-Math.PI/2; groundBase.position.set(WORLD_W/2,0,WORLD_H/2); groundBase.receiveShadow=true; worldGroup.add(groundBase);

    // LEGAL: District ground tints
    [{x0:0,x1:1500,color:'#232a26'},{x0:2000,x1:3500,color:'#2a2222'},{x0:4000,x1:5500,color:'#211f16'}].forEach(function(dg){
      const w=dg.x1-dg.x0;
      const tint = new THREE.Mesh(new THREE.PlaneGeometry(w,WORLD_H), new THREE.MeshStandardMaterial({color:dg.color, roughness:1}));
      tint.rotation.x=-Math.PI/2; tint.position.set(dg.x0+w/2,0.01,WORLD_H/2); tint.receiveShadow=true; worldGroup.add(tint);
    });

    // LEGAL: Canal water strips (X:1500-2000 and X:3500-4000)
    const canalMat = new THREE.MeshStandardMaterial({color:'#1c3a52', roughness:0.2, metalness:0.4});
    [[1500,500],[3500,500]].forEach(function(pair){
      const cx=pair[0], cw=pair[1];
      const canal = new THREE.Mesh(new THREE.PlaneGeometry(cw,WORLD_H), canalMat);
      canal.rotation.x=-Math.PI/2; canal.position.set(cx+cw/2,0.04,WORLD_H/2); worldGroup.add(canal);
    });

    // LEGAL: Roads — horizontal roads span full width (also form bridge decks over canals)
    const roadMat = new THREE.MeshStandardMaterial({color:'#2b2d35', roughness:0.9});
    roadNetwork.vertical.forEach(function(r){
      const m = new THREE.Mesh(new THREE.PlaneGeometry(r.w,WORLD_H), roadMat);
      m.rotation.x=-Math.PI/2; m.position.set(r.x,0.05,WORLD_H/2); m.receiveShadow=true; worldGroup.add(m);
    });
    roadNetwork.horizontal.forEach(function(r){
      const m = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_W,r.w), roadMat);
      m.rotation.x=-Math.PI/2; m.position.set(WORLD_W/2,0.05,r.y); m.receiveShadow=true; worldGroup.add(m);
    });

    // LEGAL: Bridge railings over the two canals
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

    // LEGAL: Venture buildings — all districts
    mapBuildings.forEach(function(m){
      const info = buildingColorFor(m.biz);
      const bw=m.biz.baseCost>=50000?66:(m.biz.baseCost<1000?46:56), bd=bw*0.85;
      const zoneType = m.biz.category==='legit' ? 'commercial' : 'industrial';
      const mesh = buildDetailedBuilding(bw, info.h, bd, info.color, zoneType);
      mesh.position.set(m.x, info.h/2, m.y); worldGroup.add(mesh);
      addSign(mesh, m.biz.name, 34, 9, info.h/2+10, m.biz.category==='legit'?'#8fd0e0':'#f0a0ae');
    });

    // LEGAL: Service buildings — all districts
    const svcPalette = { bankHome:'#7a5f1a', garage:'#3e6b78', realty:'#3e6b78', cityhall:'#7a5f1a', heist:'#5a2a33' };
    serviceBuildings.forEach(function(m){
      const mesh = buildDetailedBuilding(58,34,50,svcPalette[m.kind],'service');
      mesh.position.set(m.x,17,m.y); worldGroup.add(mesh);
      addSign(mesh, m.name, 40, 9, 26, '#ffe6a0');
    });

    // LEGAL: Extortable local businesses — all districts
    localBusinesses.forEach(function(m){
      const color = m.extorted?'#8a6a1a':'#4a4360';
      const mesh = buildDetailedBuilding(42,20,36,color,'shop');
      mesh.position.set(m.x,10,m.y); worldGroup.add(mesh);
      addSign(mesh, m.name, 32, 8, 18, m.extorted?'#ffd77a':'#b8aee0');
    });

    // LEGAL: Corners — all districts
    corners.forEach(function(m){
      const staffed=m.dealer&&!m.busted;
      const color=m.busted?'#5f6275':(staffed?'#d4a017':'#a8394a');
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,26,6), new THREE.MeshStandardMaterial({color:'#2a2c33'}));
      pole.position.set(m.x,13,m.y); pole.castShadow=true; worldGroup.add(pole);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(7,10,10), new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:0.4}));
      orb.position.set(m.x,28,m.y); worldGroup.add(orb);
      addSign(pole, m.name, 30, 8, 22, '#f0efe8');
    });

    // LEGAL: NPCs and gang recruits — all districts
    function addPerson(m, color){
      const g = buildPedestrianModel(color);
      g.position.set(m.x,0,m.y); worldGroup.add(g);
      addSign(g, m.type==='named'?m.name:(m.name||'?'), 28, 7, 34, '#f0efe8');
    }
    mapNpcs.forEach(function(m){ addPerson(m, m.type==='named'?'#d4a017':'#7a6fb0'); });
    gangRecruits.forEach(function(m){ addPerson(m, m.inducted?'#d4a017':'#5f6275'); });

    // LEGAL: Filler city buildings per district with zoning-aware types
    ['devlin','westside','hub'].forEach(function(distId){
      const off = DISTRICT_OFFSETS[distId];
      fillerFor(distId).forEach(function(f){
        if(f.kind==='building'){
          const zoneType = distId==='hub'?'skyscraper':(distId==='westside'?'industrial':'residential');
          const color = distId==='hub'?(f.hue<0.5?'#2a3040':'#3a3550'):(distId==='westside'?(f.hue<0.5?'#3a3830':'#4a4038'):(f.hue<0.5?'#3a3f4a':'#4a4238'));
          const mesh = buildDetailedBuilding(f.w,f.h,f.d,color,zoneType);
          mesh.position.set(f.x+off,f.h/2,f.y); worldGroup.add(mesh);
        } else if(f.kind==='park'){
          const cx=(f.x0+f.x1)/2+off, cy=(f.y0+f.y1)/2, w=f.x1-f.x0, d=f.y1-f.y0;
          const grass = new THREE.Mesh(new THREE.PlaneGeometry(w,d), new THREE.MeshStandardMaterial({color:'#2c4a30', roughness:1}));
          grass.rotation.x=-Math.PI/2; grass.position.set(cx,0.08,cy); grass.receiveShadow=true; worldGroup.add(grass);
          const rand = seededRandom(Math.floor(cx*7+cy*13));
          for(let i=0;i<8;i++){
            const tx=f.x0+off+20+rand()*(w-40), ty=f.y0+20+rand()*(d-40);
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2,2.5,10,6), new THREE.MeshStandardMaterial({color:'#4a3624'}));
            trunk.position.set(tx,5,ty); trunk.castShadow=true; worldGroup.add(trunk);
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(9,20,7), new THREE.MeshStandardMaterial({color:'#2f5c38'}));
            leaves.position.set(tx,18,ty); leaves.castShadow=true; worldGroup.add(leaves);
          }
          if(distId==='hub'){
            const bean = new THREE.Mesh(new THREE.SphereGeometry(20,24,18), new THREE.MeshStandardMaterial({color:'#c9c9d4', metalness:1, roughness:0.08}));
            bean.scale.set(1.6,0.85,1); bean.position.set(cx,22,cy); bean.castShadow=true; bean.receiveShadow=true; worldGroup.add(bean);
            addSign(bean,'THE BEAN',44,10,34,'#e8e6de');
          } else {
            const parkLabel = {devlin:'INDIAN BOUNDARY PARK',westside:'CICERO GREEN',hub:'MILLENNIUM PARK'}[distId];
            addSign(grass,parkLabel,44,9,4,'#a8d0a8');
          }
        } else if(f.kind==='lot'){
          const cx=(f.x0+f.x1)/2+off, cy=(f.y0+f.y1)/2, w=f.x1-f.x0, d=f.y1-f.y0;
          const lot = new THREE.Mesh(new THREE.PlaneGeometry(w,d), new THREE.MeshStandardMaterial({color:'#26282e', roughness:1}));
          lot.rotation.x=-Math.PI/2; lot.position.set(cx,0.08,cy); lot.receiveShadow=true; worldGroup.add(lot);
          const rand = seededRandom(Math.floor(cx*11+cy*17));
          const carColors=['#556070','#704040','#405560','#606050'];
          for(let i=0;i<6;i++){
            const px=f.x0+off+18+rand()*(w-36), py=f.y0+18+rand()*(d-36);
            const c=box(20,9,11,carColors[Math.floor(rand()*carColors.length)]);
            c.position.set(px,4.5,py); c.rotation.y=rand()*Math.PI; worldGroup.add(c);
          }
        }
      });
    });

    // LEGAL: El-train track — west side east edge
    const rail = new THREE.Mesh(new THREE.PlaneGeometry(40,WORLD_H), new THREE.MeshStandardMaterial({color:'#2a2a2e', roughness:1}));
    rail.rotation.x=-Math.PI/2; rail.position.set(3470,0.06,WORLD_H/2); rail.receiveShadow=true; worldGroup.add(rail);
    for(let ty=20;ty<WORLD_H;ty+=26){ const tie=box(36,2,4,'#3a3530'); tie.position.set(3470,1,ty); worldGroup.add(tie); }

    // LEGAL: Chicago River — hub north edge
    const river = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_W,46), new THREE.MeshStandardMaterial({color:'#1c3a52', roughness:0.3, metalness:0.3}));
    river.rotation.x=-Math.PI/2; river.position.set(WORLD_W/2,0.06,20); river.receiveShadow=true; worldGroup.add(river);

    currentSolids = buildAllSolids();
    updateParkedCarMesh();
    rebuildWaypointBeacon();

    if(sunLight){
      sunLight.position.set(WORLD_W*0.5,500,WORLD_H*0.3);
      sunLight.target.position.set(WORLD_W/2,0,WORLD_H/2);
      sunLight.target.updateMatrixWorld();
    }
  }

  // LEGAL: Legacy alias — now delegates to buildCityScene
  function buildDistrictScene(districtId){
    buildCityScene(); return;
    clearGroup(worldGroup);
    const theme = districtThemes[districtId];

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_W,WORLD_H), new THREE.MeshStandardMaterial({color:theme.ground, roughness:1}));
    ground.rotation.x = -Math.PI/2; ground.position.set(WORLD_W/2,0,WORLD_H/2); ground.receiveShadow=true;
    worldGroup.add(ground);

    const roadMat = new THREE.MeshStandardMaterial({color:'#2b2d35', roughness:0.9});
    roadNetwork.vertical.forEach(function(r){
      const m = new THREE.Mesh(new THREE.PlaneGeometry(r.w,WORLD_H), roadMat);
      m.rotation.x=-Math.PI/2; m.position.set(r.x,0.05,WORLD_H/2); m.receiveShadow=true; worldGroup.add(m);
    });
    roadNetwork.horizontal.forEach(function(r){
      const m = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_W,r.w), roadMat);
      m.rotation.x=-Math.PI/2; m.position.set(WORLD_W/2,0.05,r.y); m.receiveShadow=true; worldGroup.add(m);
    });

    mapBuildings.filter(function(m){return m.district===districtId;}).forEach(function(m){
      const info = buildingColorFor(m.biz);
      const bw = m.biz.baseCost>=50000?66:(m.biz.baseCost<1000?46:56), bd=bw*0.85;
      const mesh = box(bw, info.h, bd, info.color);
      mesh.position.set(m.x, info.h/2, m.y);
      worldGroup.add(mesh);
      addSign(mesh, m.biz.name, 34, 9, info.h/2+10, m.biz.category==='legit'?'#8fd0e0':'#f0a0ae');
    });

    serviceBuildings.filter(function(m){return m.district===districtId;}).forEach(function(m){
      const palette = { bankHome:'#7a5f1a', garage:'#3e6b78', realty:'#3e6b78', cityhall:'#7a5f1a', heist:'#5a2a33' };
      const mesh = box(58,34,50, palette[m.kind]);
      mesh.position.set(m.x,17,m.y); worldGroup.add(mesh);
      addSign(mesh, m.name, 40, 9, 26, '#ffe6a0');
    });

    localBusinesses.filter(function(m){return m.district===districtId;}).forEach(function(m){
      const color = m.extorted ? '#8a6a1a' : '#4a4360';
      const mesh = box(42,20,36,color);
      mesh.position.set(m.x,10,m.y); worldGroup.add(mesh);
      addSign(mesh, m.name, 32, 8, 18, m.extorted?'#ffd77a':'#b8aee0');
    });

    corners.filter(function(m){return m.district===districtId;}).forEach(function(m){
      const staffed = m.dealer && !m.busted;
      const color = m.busted ? '#5f6275' : (staffed ? '#d4a017' : '#a8394a');
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,26,6), new THREE.MeshStandardMaterial({color:'#2a2c33'}));
      pole.position.set(m.x,13,m.y); pole.castShadow=true; worldGroup.add(pole);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(7,10,10), new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:0.4}));
      orb.position.set(m.x,28,m.y); worldGroup.add(orb);
      addSign(pole, m.name, 30, 8, 22, '#f0efe8');
    });

    function addPerson(m, color){
      const g = buildPedestrianModel(color);
      g.position.set(m.x,0,m.y); worldGroup.add(g);
      addSign(g, m.type==='named' ? m.name : (m.name||'?'), 28, 7, 34, '#f0efe8');
    }
    mapNpcs.filter(function(m){return m.district===districtId;}).forEach(function(m){ addPerson(m, m.type==='named'?'#d4a017':'#7a6fb0'); });
    gangRecruits.filter(function(m){return m.district===districtId;}).forEach(function(m){ addPerson(m, m.inducted?'#d4a017':'#5f6275'); });

    fillerFor(districtId).forEach(function(f){
      if(f.kind==='building'){
        const color = f.hue<0.5 ? '#3a3f4a' : '#4a4238';
        const mesh = box(f.w, f.h, f.d, color);
        mesh.position.set(f.x, f.h/2, f.y);
        worldGroup.add(mesh);
      } else if(f.kind==='park'){
        const cx=(f.x0+f.x1)/2, cy=(f.y0+f.y1)/2, w=f.x1-f.x0, d=f.y1-f.y0;
        const grass = new THREE.Mesh(new THREE.PlaneGeometry(w,d), new THREE.MeshStandardMaterial({color:'#2c4a30', roughness:1}));
        grass.rotation.x=-Math.PI/2; grass.position.set(cx,0.08,cy); grass.receiveShadow=true; worldGroup.add(grass);
        const rand = seededRandom(Math.floor(cx*7+cy*13));
        for(let i=0;i<6;i++){
          const tx=f.x0+20+rand()*(w-40), ty=f.y0+20+rand()*(d-40);
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2,2.5,10,6), new THREE.MeshStandardMaterial({color:'#4a3624'}));
          trunk.position.set(tx,5,ty); trunk.castShadow=true; worldGroup.add(trunk);
          const leaves = new THREE.Mesh(new THREE.ConeGeometry(9,20,7), new THREE.MeshStandardMaterial({color:'#2f5c38'}));
          leaves.position.set(tx,18,ty); leaves.castShadow=true; worldGroup.add(leaves);
        }
        if(districtId==='hub'){
          const bean = new THREE.Mesh(new THREE.SphereGeometry(20,24,18), new THREE.MeshStandardMaterial({color:'#c9c9d4', metalness:1, roughness:0.08}));
          bean.scale.set(1.6,0.85,1); bean.position.set(cx,22,cy); bean.castShadow=true; bean.receiveShadow=true;
          worldGroup.add(bean);
          addSign(bean, 'THE BEAN', 44, 10, 34, '#e8e6de');
        } else {
          addSign(grass, theme.parkLabel, 44, 9, 4, '#a8d0a8');
        }
      } else if(f.kind==='lot'){
        const cx=(f.x0+f.x1)/2, cy=(f.y0+f.y1)/2, w=f.x1-f.x0, d=f.y1-f.y0;
        const lot = new THREE.Mesh(new THREE.PlaneGeometry(w,d), new THREE.MeshStandardMaterial({color:'#26282e', roughness:1}));
        lot.rotation.x=-Math.PI/2; lot.position.set(cx,0.08,cy); lot.receiveShadow=true; worldGroup.add(lot);
        const rand = seededRandom(Math.floor(cx*11+cy*17));
        const carColors=['#556070','#704040','#405560','#606050'];
        for(let i=0;i<5;i++){
          const px=f.x0+18+rand()*(w-36), py=f.y0+18+rand()*(d-36);
          const c = box(20,9,11, carColors[Math.floor(rand()*carColors.length)]);
          c.position.set(px,4.5,py); c.rotation.y = rand()*Math.PI;
          worldGroup.add(c);
        }
      }
    });

    if(theme.hasRail){
      const rail = new THREE.Mesh(new THREE.PlaneGeometry(40,WORLD_H), new THREE.MeshStandardMaterial({color:'#2a2a2e', roughness:1}));
      rail.rotation.x=-Math.PI/2; rail.position.set(WORLD_W-30,0.06,WORLD_H/2); rail.receiveShadow=true; worldGroup.add(rail);
      for(let ty=20; ty<WORLD_H; ty+=26){ const tie=box(36,2,4,'#3a3530'); tie.position.set(WORLD_W-30,1,ty); worldGroup.add(tie); }
    }
    if(theme.hasRiver){
      const river = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_W,46), new THREE.MeshStandardMaterial({color:'#1c3a52', roughness:0.3, metalness:0.3}));
      river.rotation.x=-Math.PI/2; river.position.set(WORLD_W/2,0.06,20); river.receiveShadow=true; worldGroup.add(river);
    }

    currentSolids = buildingSolids(districtId);
    updateParkedCarMesh();
    rebuildWaypointBeacon();

    if(sunLight){
      sunLight.position.set(WORLD_W*0.4, 420, WORLD_H*0.25);
      sunLight.target.position.set(WORLD_W/2, 0, WORLD_H/2);
      sunLight.target.updateMatrixWorld();
    }
  }

  function refreshPlayerModel(){
    clearGroup(playerGroup);
    if(state.inVehicle){ const car=getEquippedCar(); if(car) playerGroup.add(buildCarModel(car)); }
    else playerGroup.add(buildPedestrianModel('#f0efe8'));
  }
  function updateParkedCarMesh(){
    if(parkedCarMesh){ worldGroup.remove(parkedCarMesh); parkedCarMesh.traverse(disposeObj); parkedCarMesh=null; }
    const car = getEquippedCar();
    if(car && !state.inVehicle){
      const pos = state.parkedCarPos[state.currentDistrict] || spawnPoints[state.currentDistrict];
      parkedCarMesh = buildCarModel(car);
      parkedCarMesh.position.set(pos.x,0,pos.y);
      worldGroup.add(parkedCarMesh);
    }
  }
  function computeRoadGuide(px, py, wx, wy){
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
    const container = document.getElementById('scene3d-container');
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

    scene.add(new THREE.AmbientLight(0x8891a8, 0.65));
    sunLight = new THREE.DirectionalLight(0xfff2d0, 0.9);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024,1024);
    sunLight.shadow.camera.left=-500; sunLight.shadow.camera.right=500;
    sunLight.shadow.camera.top=500; sunLight.shadow.camera.bottom=-500;
    sunLight.shadow.camera.near=10; sunLight.shadow.camera.far=1200;
    scene.add(sunLight); scene.add(sunLight.target);

    worldGroup = new THREE.Group(); scene.add(worldGroup);
    playerGroup = new THREE.Group(); scene.add(playerGroup);

    buildCityScene();
    refreshPlayerModel();
  }
  initScene();

  // LEGAL: ================= MINIMAP (simple 2D, pannable, waypoints) =================
  const minimapCanvas = document.getElementById('minimap-canvas');
  const mctx = minimapCanvas.getContext('2d');
  const minimapPan = { x:0, y:0 };
  // LEGAL: Scale tuned for 5500-wide world so minimap shows local neighbourhood
  const MINIMAP_SCALE = 150/600;
  let minimapDragging=false, minimapDragStart=null, minimapDragMoved=false;

  minimapCanvas.addEventListener('mousedown', function(e){
    minimapDragging = true; minimapDragMoved = false;
    minimapDragStart = { clientX:e.clientX, clientY:e.clientY, panX:minimapPan.x, panY:minimapPan.y };
  });
  window.addEventListener('mousemove', function(e){
    if(!minimapDragging) return;
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
      document.getElementById('minimap-clear').classList.add('show');
      scheduleSave();
    }
  });
  document.getElementById('minimap-clear').addEventListener('click', function(){
    state.waypoints[state.currentDistrict] = null;
    rebuildWaypointBeacon();
    this.classList.remove('show');
    scheduleSave();
  });

  function drawMinimap(){
    mctx.fillStyle = '#12141c'; mctx.fillRect(0,0,150,150);
    if(state.currentInterior){
      mctx.fillStyle='#6c7080'; mctx.font='10px IBM Plex Mono, monospace'; mctx.textAlign='center'; mctx.textBaseline='middle';
      mctx.fillText('Indoors', 75, 75);
      mctx.strokeStyle='rgba(212,160,23,0.5)'; mctx.strokeRect(0.5,0.5,149,149);
      return;
    }
    const centerX = player.x + minimapPan.x, centerY = player.y + minimapPan.y;
    const proj = function(wx,wy){ return { x:75+(wx-centerX)*MINIMAP_SCALE, y:75+(wy-centerY)*MINIMAP_SCALE }; };
    mctx.strokeStyle='rgba(120,120,135,0.4)'; mctx.lineWidth=3;
    roadNetwork.vertical.forEach(function(r){ const p1=proj(r.x,0), p2=proj(r.x,WORLD_H); mctx.beginPath(); mctx.moveTo(p1.x,p1.y); mctx.lineTo(p2.x,p2.y); mctx.stroke(); });
    roadNetwork.horizontal.forEach(function(r){ const p1=proj(0,r.y), p2=proj(WORLD_W,r.y); mctx.beginPath(); mctx.moveTo(p1.x,p1.y); mctx.lineTo(p2.x,p2.y); mctx.stroke(); });
    const dot = function(wx,wy,color,size){ const p=proj(wx,wy); if(p.x<-6||p.x>156||p.y<-6||p.y>156) return; mctx.beginPath(); mctx.arc(p.x,p.y,size,0,Math.PI*2); mctx.fillStyle=color; mctx.fill(); };
    mapBuildings.filter(inDistrict).forEach(function(m){ dot(m.x,m.y, m.biz.category==='legit'?'#3e7c8c':'#a8394a', 3); });
    serviceBuildings.filter(inDistrict).forEach(function(m){ dot(m.x,m.y,'#d4a017',3); });
    localBusinesses.filter(inDistrict).forEach(function(m){ dot(m.x,m.y,'#7a6fb0',2.5); });
    corners.filter(inDistrict).forEach(function(m){ dot(m.x,m.y, m.busted?'#5f6275':(m.dealer?'#d4a017':'#a8394a'), 2); });
    mapNpcs.filter(inDistrict).forEach(function(m){ dot(m.x,m.y,'#f0efe8',2); });
    gangRecruits.filter(inDistrict).forEach(function(m){ dot(m.x,m.y,'#f0efe8',2); });
    const wp = state.waypoints[state.currentDistrict];
    if(wp){
      const p = proj(wp.x,wp.y);
      mctx.strokeStyle='#d4a017'; mctx.lineWidth=2;
      mctx.beginPath(); mctx.moveTo(p.x-6,p.y); mctx.lineTo(p.x+6,p.y); mctx.moveTo(p.x,p.y-6); mctx.lineTo(p.x,p.y+6); mctx.stroke();
      mctx.beginPath(); mctx.arc(p.x,p.y,7,0,Math.PI*2); mctx.stroke();
    }
    const pp = proj(player.x,player.y);
    mctx.save(); mctx.translate(pp.x,pp.y); mctx.rotate(player.facing);
    mctx.beginPath(); mctx.moveTo(6,0); mctx.lineTo(-4,-4); mctx.lineTo(-4,4); mctx.closePath();
    mctx.fillStyle='#d4a017'; mctx.fill(); mctx.restore();
    mctx.strokeStyle='rgba(212,160,23,0.5)'; mctx.lineWidth=1; mctx.strokeRect(0.5,0.5,149,149);
  }

  // LEGAL: ================= INTERIOR (lightweight 2D scene) =================
  const interiorCanvas = document.getElementById('interior-canvas');
  const ictx = interiorCanvas.getContext('2d');
  function iRoundRect(x,y,w,h,r){
    ictx.beginPath(); ictx.moveTo(x+r,y);
    ictx.arcTo(x+w,y,x+w,y+h,r); ictx.arcTo(x+w,y+h,x,y+h,r);
    ictx.arcTo(x,y+h,x,y,r); ictx.arcTo(x,y,x+w,y,r); ictx.closePath();
  }
  function iLabelChip(text,x,y){
    ictx.font='9px IBM Plex Mono, monospace';
    const w = ictx.measureText(text).width+8;
    ictx.fillStyle='rgba(10,11,16,0.6)'; iRoundRect(x-w/2,y-8,w,14,4); ictx.fill();
    ictx.fillStyle='#c8cad8'; ictx.textAlign='center'; ictx.textBaseline='middle'; ictx.fillText(text,x,y-1);
  }
  function drawInteriorScene(){
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
    if(dx||dy){
      const len = Math.hypot(dx,dy);
      const spd = currentSpeed();
      player.facing = Math.atan2(dy,dx);
      const stepX = (dx/len)*spd*dt, stepY = (dy/len)*spd*dt;
      if(state.currentInterior){
        player.x = Math.max(20, Math.min(ROOM_W-20, player.x+stepX));
        player.y = Math.max(20, Math.min(ROOM_H-14, player.y+stepY));
      } else {
        const tryX = player.x+stepX, tryY = player.y+stepY;
        if(tryMove(tryX,tryY,currentSolids)){ player.x=tryX; player.y=tryY; }
        else if(tryMove(tryX,player.y,currentSolids)){ player.x=tryX; }
        else if(tryMove(player.x,tryY,currentSolids)){ player.y=tryY; }
      }
    }
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
      playerGroup.position.set(player.x, 0, player.y);
      playerGroup.rotation.y = -player.facing + Math.PI/2;
      camera3d.position.set(player.x, 260, player.y+72);
      camera3d.lookAt(player.x, 0, player.y);
      renderer.render(scene, camera3d);
    }
    drawMinimap();

    const near = nearestMarker();
    const hintEl = document.getElementById('map-hint');
    if(near){
      let label = '';
      if(near.type==='door') label='Exit';
      else if(near.type==='hotspot') label=near.ref.label;
      else if(near.type==='car') label='Enter ' + (getEquippedCar()?getEquippedCar().name:'car');
      else if(near.type==='building') label=near.ref.biz.name;
      else if(near.type==='service') label=near.ref.name;
      else if(near.type==='local') label=near.ref.name;
      else if(near.type==='corner') label=near.ref.name;
      else if(near.type==='gangnpc') label=near.ref.name;
      else label = (near.ref.type==='named' ? near.ref.name : state.procNpc.name);
      hintEl.textContent = 'Press E to interact — ' + label;
    } else if(state.inVehicle){
      hintEl.textContent = 'Press E to park and get out';
    } else {
      hintEl.textContent = state.currentInterior ? ('Inside ' + state.currentInterior.name) : ('Driving around ' + districts.find(function(d){return d.id===state.currentDistrict;}).name);
    }

    requestAnimationFrame(mapHub);
  }

  // LEGAL: ================= SETTINGS =================
  document.getElementById('quiet-toggle').addEventListener('change', function(e){
    document.body.classList.toggle('quiet', e.target.checked);
    scheduleSave();
  });
  document.getElementById('theme-toggle').addEventListener('change', function(e){
    if(e.target.checked) document.body.classList.remove('theme-delhi');
    document.body.classList.toggle('theme-light', e.target.checked);
    document.getElementById('delhi-theme-toggle').checked = false;
    scheduleSave();
  });
  document.getElementById('delhi-theme-toggle').addEventListener('change', function(e){
    if(e.target.checked) document.body.classList.remove('theme-light');
    document.body.classList.toggle('theme-delhi', e.target.checked);
    document.getElementById('theme-toggle').checked = false;
    scheduleSave();
  });
  const storageAdapter = {
    async set(key, value){
      if(window.storage && typeof window.storage.set === 'function'){
        try { await window.storage.set(key, value, false); return; } catch(e){}
      }
      try { window.localStorage.setItem(key, value); } catch(e){}
    },
    async get(key){
      if(window.storage && typeof window.storage.get === 'function'){
        try {
          const res = await window.storage.get(key, false);
          if(res && res.value) return res.value;
        } catch(e){}
      }
      try { return window.localStorage.getItem(key); } catch(e){ return null; }
    },
    async delete(key){
      if(window.storage && typeof window.storage.delete === 'function'){
        try { await window.storage.delete(key, false); return; } catch(e){}
      }
      try { window.localStorage.removeItem(key); } catch(e){}
    }
  };

  document.getElementById('save-now-btn').addEventListener('click', function(){ saveGame(true); });
  document.getElementById('export-save-btn').addEventListener('click', function(){
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
  const importSaveInput = document.getElementById('import-save-input');
  document.getElementById('import-save-btn').addEventListener('click', function(){
    if(importSaveInput) importSaveInput.click();
  });
  if(importSaveInput){
    importSaveInput.addEventListener('change', function(e){
      const file = (e.target && e.target.files) ? e.target.files[0] : null;
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

  document.getElementById('reset-btn').addEventListener('click', function(){
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
      businesses: businesses.map(b=> ({ id:b.id, level:b.level, crew:b.crew, manager:b.manager, researched:b.researched })),
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
  let saveTimer = null;
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
  async function saveGame(manual){
    try{
      await storageAdapter.set('seat-save-v1', JSON.stringify(serializeState()));
      const stamp = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
      const statusEl = document.getElementById('save-status');
      if(statusEl) statusEl.textContent = (manual?'Saved just now — ':'Last saved ') + stamp;
    }catch(e){
      const statusEl = document.getElementById('save-status');
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
        state.prestigeCount=d.prestigeCount; state.seenMilestones = new Set((d.seenMilestones||[]).map(x=>String(x)));
        state.playSeconds=d.playSeconds||0; state.investorPenalty=Math.min(0.5, d.investorPenalty||0);
        state.started = d.started; if(d.procNpc) state.procNpc = d.procNpc;
        if(d.lastTick) state.lastTick = d.lastTick;
        (d.businesses||[]).forEach(sb=>{ const b=businesses.find(x=>x.id===sb.id); if(b){ b.level=sb.level; b.crew=sb.crew; b.manager=sb.manager; b.researched=sb.researched; } });
        if(d.quiet){ document.body.classList.add('quiet'); document.getElementById('quiet-toggle').checked = true; }
        if(d.light){ document.body.classList.add('theme-light'); document.getElementById('theme-toggle').checked = true; }
        if(d.delhi){ document.body.classList.add('theme-delhi'); document.getElementById('delhi-theme-toggle').checked = true; }
        if(state.seenMilestones.has('chaat_house')) document.getElementById('delhi-theme-row').style.display = 'flex';
        state.bank = d.bank||0; state.nextHeistAt = d.nextHeistAt||0;
        state.ownedCars = d.ownedCars||[]; state.equippedCar = d.equippedCar||null; state.ownedProperties = d.ownedProperties||[];
        (d.localBusinesses||[]).forEach(sb=>{ const b=localBusinesses.find(x=>x.id===sb.id); if(b){ b.extorted=sb.extorted; b.nextRobAt=sb.nextRobAt; } });
        state.currentDistrict = d.currentDistrict || 'devlin'; state.product = d.product||0; state.productLevel = d.productLevel||0;
        (d.districts||[]).forEach(sd=>{ const dist=districts.find(x=>x.id===sd.id); if(dist){ dist.control=sd.control; dist.pushCount=sd.pushCount; dist.nextPushAt=sd.nextPushAt; } });
        (d.corners||[]).forEach(sc=>{ const c=corners.find(x=>x.id===sc.id); if(c){ c.dealer=sc.dealer; c.busted=sc.busted; c.bustCooldownAt=sc.bustCooldownAt; } });
        state.influence=d.influence||0; state.influenceBuys=d.influenceBuys||0; state.electedOffice=d.electedOffice||false;
        state.campaignActive=d.campaignActive||false; state.campaignStyle=d.campaignStyle||''; state.campaignEndAt=d.campaignEndAt||0;
        state.nextCampaignAt=d.nextCampaignAt||0; state.nextWarAt=d.nextWarAt||0;
        (d.politicians||[]).forEach(sp=>{ const p=politicians.find(x=>x.id===sp.id); if(p){ p.favor=sp.favor; p.pocketed=sp.pocketed||false; } });
        (d.gangRecruits||[]).forEach(sg=>{ const g=gangRecruits.find(x=>x.id===sg.id); if(g) g.inducted=sg.inducted; });
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
    state.lastTick = now;
  }, 250);

  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState==='visible' && state.started){
      const away = (Date.now() - state.lastTick)/1000;
      if(away > 25){
        const capped = Math.min(away, 7200);
        const earned = netIncome() * capped;
        state.cash += earned;
        const mins = Math.round(capped/60);
        showModal({ eyebrow:'Business Report', title:"WHILE YOU WERE OUT",
          body:`<p>Managers and crew kept things running. In the <strong>${mins} minute${mins===1?'':'s'}</strong> you were gone, the operation cleared <strong>${fmt(earned)}</strong>.</p>`,
          buttons:[{label:'Good'}] });
        log(`📒 Business Report: ${fmt(earned)} earned while you were away.`);
        renderAll();
      }
    }
    state.lastTick = Date.now();
    if(document.visibilityState==='hidden') saveGame(false);
  });
  window.addEventListener('beforeunload', function(){ saveGame(true); });

  // LEGAL: ================= BOOT =================
  (async function boot(){
    wireDelegation();
    const loaded = await loadGame();
    if(loaded && state.started){
      const away = (Date.now() - state.lastTick)/1000;
      if(away > 25){
        const capped = Math.min(away, 7200);
        const earned = netIncome() * capped;
        state.cash += earned;
        const mins = Math.round(capped/60);
        showModal({ eyebrow:'Business Report', title:"WHILE YOU WERE OUT",
          body:`<p>Managers and crew kept things running. In the <strong>${mins} minute${mins===1?'':'s'}</strong> you were gone, the operation cleared <strong>${fmt(earned)}</strong>.</p>`,
          buttons:[{label:'Good'}] });
        log(`📒 Business Report: ${fmt(earned)} earned while you were away.`);
      }

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
  const globalTooltip = document.getElementById('global-tooltip');
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
      const saveBtn = document.getElementById('save-now-btn');
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
