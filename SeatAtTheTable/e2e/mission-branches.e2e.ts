import { test, expect, type Page } from '@playwright/test';

// LEGAL: One row per meaningful mission branch: set the state, click through each stage, and
// LEGAL: read the result. Rows also fail on any page error, so a branch that throws halfway
// LEGAL: through can't pass by leaving a stale modal on screen.

interface BranchHook {
  state: Record<string, unknown> & { worldMemory: Record<string, unknown> };
  startMission: (id: string) => void;
  resolveMission: (id: string) => void;
  declineMission: (id: string) => void;
}

type Step = string | RegExp | 'resolve';

interface Branch {
  name: string;
  mission: string;
  state?: Record<string, number>;
  memory?: Record<string, unknown>;
  random?: number;
  steps: Step[];
  expect: string[];
}

const BRANCHES: Branch[] = [
  { name:'Amit mistake: contain it', mission:'amit_mistake', state:{ cash:3000, heat:10 }, steps:['Contain it ($2,500, +Heat)'], expect:['$2,500 spent; heat +12; family loyalty +2'] },
  { name:'Amit mistake: crew takes the fall', mission:'amit_mistake', state:{ respect:50 }, steps:['Let a crew member take the fall'], expect:['respect -10; family loyalty -3'] },
  { name:'Hostile press: buy a response', mission:'hostile_press', state:{ cash:2000 }, steps:['Buy a response ($1,800)'], expect:['$1,800 spent; legit income -25% for 2 minutes'] },
  { name:'Hostile press: ride it out', mission:'hostile_press', steps:['Ride out the backlash'], expect:['legit income -45% for 4 minutes'] },
  { name:'Press follow-up, professional: independent', mission:'press_followup', memory:{ pressTone:'professional' }, steps:['Keep the profile independent (+8 respect)'], expect:['respect +8; independent Herald relationship recorded'] },
  { name:'Press follow-up, warm: block night', mission:'press_followup', memory:{ pressTone:'warm' }, state:{ cash:500 }, steps:['Fund the block night ($350, +18 respect)'], expect:['$350 spent; respect +18'] },
  { name:'Press follow-up, warm: introductions', mission:'press_followup', memory:{ pressTone:'warm' }, state:{ heat:30 }, steps:['Take the quiet introductions (+10 respect, heat -4)'], expect:['respect +10; heat -4'] },
  { name:'Press follow-up, scandal: back the challenge', mission:'press_followup', memory:{ pressTone:'scandal' }, state:{ heat:10 }, steps:['Back the challenge (+16 respect, +8 heat)'], expect:['respect +16; heat +8'] },
  { name:'Press follow-up, scandal: quiet lead', mission:'press_followup', memory:{ pressTone:'scandal' }, state:{ investigation:30 }, steps:['Give a quiet lead (investigation -6)'], expect:['investigation -6'] },
  { name:'Press follow-up, guarded: protect the source', mission:'press_followup', memory:{ pressTone:'guarded' }, state:{ heat:30 }, steps:['Protect the source (heat -6)'], expect:['heat -6; protected Herald source recorded'] },
  { name:'Press follow-up, guarded: full lead', mission:'press_followup', memory:{ pressTone:'guarded' }, state:{ heat:10 }, steps:['Ask for the full lead (+10 respect, +4 heat)'], expect:['respect +10; heat +4'] },
  { name:'Black Market case: pay to close', mission:'black_market_investigation', state:{ cash:3000, investigation:40 }, steps:['Pay to close it ($2,200)'], expect:['$2,200 spent; investigation -16'] },
  { name:'Black Market case: burn the records', mission:'black_market_investigation', state:{ product:80, investigation:40 }, steps:['Burn the records (-50 product)'], expect:['50 product lost; investigation -8'] },
  { name:'Arsonist: take the payoff', mission:'arsonist_revenge', steps:['Take the payoff ($900)'], expect:['$900 gained'] },
  { name:'Arsonist: larger payoff at the lounge', mission:'arsonist_revenge', steps:['Follow the money to Marigold Lounge', 'resolve', 'Take the larger payoff ($1,500)'], expect:['$1,500 gained'] },
  { name:'Arsonist: make an example', mission:'arsonist_revenge', state:{ heat:10 }, steps:['Follow the money to Marigold Lounge', 'resolve', 'Make an example (+18 respect, +16 heat)'], expect:['respect +18; heat +16'] },
  { name:'Tonic: careful sip', mission:'mystery_tonic', steps:['Take one careful sip'], expect:['respect +6'] },
  { name:'Tonic: whole bottle', mission:'mystery_tonic', state:{ heat:30 }, steps:['Take the whole bottle'], expect:['$300 gained; heat -8'] },
  { name:'Pigeons: consulting then seed', mission:'pigeon_summit', state:{ cash:500 }, steps:['Bill City Hall $300 for “consulting”', 'resolve', 'Offer seed decoys ($120)'], expect:['$120 spent; respect +8'] },
  { name:'Parrot: seeds', mission:'mayors_parrot', state:{ cash:500 }, steps:['Give the city an official statement', 'resolve', 'Buy sunflower seeds ($75)'], expect:['$75 spent; respect +10'] },
  { name:'Goose: consulting then popcorn', mission:'goose_permit', state:{ cash:500, heat:30 }, steps:['Invoice City Hall $180 for permit review', 'resolve', 'Buy popcorn for the goose ($60)'], expect:['$60 spent; respect +8; heat -2'] },
  { name:'Goose: VIP parking', mission:'goose_permit', state:{ heat:10 }, steps:['Recognize the permit for one night', 'resolve', 'Offer it a better parking space'], expect:['respect +12; heat +3'] },
  { name:'Raccoon: quiet route', mission:'raccoon_keycard', state:{ cash:500 }, steps:['Keep it quiet and pay for the lure ($90)', 'resolve', 'Take the quiet fruit lure (+8 respect)'], expect:['respect +8'] },
  { name:'Rival: pay them off', mission:'rival', state:{ cash:1000 }, steps:['Pay them off (-8% cash)'], expect:['Exact changes: -$80'] },
  { name:'Rival: intimidate with leverage', mission:'rival', state:{ respect:999, heat:10 }, steps:['Intimidate them (+15 respect, +18 heat)'], expect:['respect +15; heat +18'] },
  { name:'Rival: negotiate a split', mission:'rival', state:{ heat:30 }, steps:['Negotiate a split (-Heat, income cut)'], expect:['Exact changes: heat -10'] },
  { name:'Inspector: bribe', mission:'inspector', state:{ cash:1000 }, steps:[/^Pay the bribe/], expect:['Exact changes: -$400'] },
  { name:'Inspector: blackmail with leverage', mission:'inspector', state:{ respect:999, heat:30 }, steps:['Blackmail him'], expect:['heat -12; permanent inspection protection recorded'] },
  { name:'Inspector: blackmail without leverage', mission:'inspector', state:{ respect:0, influence:0, heat:10 }, steps:['Blackmail him'], expect:['blackmail failed; heat +10'] },
  { name:'Inspector: intimidate', mission:'inspector', state:{ heat:10 }, steps:['Intimidate him'], expect:['respect +8; heat +12; Detective Miller follow-up scheduled'] },
  { name:'Cousin: pay the debt', mission:'cousin', state:{ cash:1000 }, steps:['Pay the debt ($600)'], expect:['$600 spent; respect +4; family loyalty +3'] },
  { name:'Cousin: hire him, no open spot', mission:'cousin', steps:['Hire him into legit work'], expect:["no open crew spot; $400 finder's fee instead; family loyalty +1"] },
  { name:'Cousin: turn him away', mission:'cousin', state:{ respect:30 }, steps:['Turn him away'], expect:['respect -5; family loyalty -2'] },
  { name:'Cops: pay Miller', mission:'cops', state:{ cash:1000, heat:50 }, steps:['Pay Miller ($900, -Heat)'], expect:['Exact changes: -$900; heat -30'] },
  { name:'Cops: snitch', mission:'cops', state:{ investigation:40, respect:40 }, steps:['Snitch on a rival (-Case, -Respect, stronger rivals)'], expect:['investigation -18; respect -12'] },
  { name:'Cops: tell him to walk, no raid', mission:'cops', state:{ heat:10 }, random:0.99, steps:['Tell him to walk (+25 heat, raid risk)'], expect:['heat +25; raid narrowly avoided'] },
  { name:'Hustler score: it works', mission:'hustler_score', random:0.01, steps:['Take the payout'], expect:['$2,200 gained; respect +8; no open crew spot', 'Exact changes: +$2,200'] },
  { name:'Hustler score: it fails', mission:'hustler_score', state:{ heat:10 }, random:0.99, steps:['Take the payout'], expect:['score failed; heat +20'] },
  { name:'Hustler: approve the score', mission:'hustler', steps:['Approve the risky score'], expect:['risky score approved; result pending'] },
  { name:'Hustler: hire for legit work, no open spot', mission:'hustler', steps:['Hire for legit work'], expect:['no open crew spot', 'Exact changes: +$400'] },
  { name:'Hustler: reject the pitch', mission:'hustler', steps:['Reject the pitch'], expect:['future rival strength +4'] },
  { name:'Investor: accept', mission:'investor', steps:[/^Accept/], expect:['$3,000 gained; permanent income -'] },
  { name:'Investor: negotiate without leverage', mission:'investor', state:{ respect:0, prestigeCount:0 }, steps:[/^Negotiate/], expect:['(insufficient leverage)'] },
  { name:'Investor: threaten', mission:'investor', state:{ heat:10 }, steps:['Threaten'], expect:['Exact changes: respect +12; heat +14'] },
  { name:'Home safe: walk away from the bank', mission:'home_safe_robbery', steps:['Walk away from the bank'], expect:['Banking lesson declined at the counter'] },
  { name:'Missing Cargo: drop it', mission:'stolen_shipment', steps:['Drop it'], expect:['dropped at docks'] },
  { name:'Missing Cargo: buy it back', mission:'stolen_shipment', state:{ cash:2000, product:0 }, steps:['Trace it to the chop shop', 'resolve', 'Buy it back ($1400)'], expect:['$1,400 spent; product +80'] },
  { name:'Missing Cargo: take it by force', mission:'stolen_shipment', state:{ heat:10, product:0 }, steps:['Trace it to the chop shop', 'resolve', 'Take it by force'], expect:['product +90; respect +18; heat +22'] },
  { name:'Missing Cargo: airfield street payout', mission:'stolen_shipment', steps:['Trace it to the chop shop', 'resolve', 'Partner with Deke', 'resolve', 'Put it on the street ($1,100 payout)'], expect:['$1,100 gained; respect +10; Kettle Flats route unlocked'] },
  { name:'Alderman: pay the workers', mission:'alderman_fixer', state:{ cash:2000 }, steps:['Go to the railyard', 'resolve', 'Pay the workers ($1800)'], expect:['$1,800 spent; influence +45; Political Favors unlocked'] },
  { name:'Alderman: pressure Calder', mission:'alderman_fixer', state:{ heat:10 }, steps:['Go to the railyard', 'resolve', 'Pressure Calder'], expect:['respect +14; heat +12; influence +25; Political Favors unlocked'] },
  { name:'Tax audit: settle', mission:'tax_audit', state:{ cash:1000 }, steps:[/^Pay the filing settlement/], expect:['$650 spent; audit closed'] },
  { name:'Turf war: defend, truce, narrow truce', mission:'turf_war', state:{ heat:60 }, steps:['Defend with crew', 'resolve', 'Take the truce', 'resolve', 'Sign a narrow truce'], expect:['heat -18; Ridgewood truce recorded'] },
  { name:'Turf war: pay locals, truce, expose', mission:'turf_war', state:{ cash:1000, heat:10 }, steps:['Pay locals to watch ($700)', 'resolve', 'Take the truce', 'resolve', 'Expose his weak crew'], expect:['West Side control +12; respect +16; heat +16'] },
  { name:'Turf war: assassination lands', mission:'turf_war', state:{ heat:10 }, random:0.01, steps:['Defend with crew', 'resolve', 'Assassinate him'], expect:['West Side control +18; respect +28; heat +30; capo removed'] },
  { name:'Turf war: assassination misses', mission:'turf_war', state:{ cash:3000, heat:10, muscleCount:2 }, random:0.99, steps:['Defend with crew', 'resolve', 'Assassinate him'], expect:['$1,600 spent; 1 muscle lost; heat +30; hit failed'] },
  { name:'Fire: rebuild quietly', mission:'fire', state:{ cash:500 }, steps:['Rebuild quietly ($250, cart income -30% for 30s)'], expect:['$250 spent'] },
  { name:'Fire: hunt the arsonist', mission:'fire', state:{ heat:10 }, steps:['Hunt the arsonist'], expect:['Exact changes: respect +12; heat +12'] },
];

const DECLINES: { mission: string; state?: Record<string, number>; expect: string }[] = [
  { mission:'tribune', expect:'You decline Lana Vance and stay quiet.' },
  { mission:'cousin', state:{ respect:30 }, expect:'You turn Amit away' },
  { mission:'hustler', expect:'You take the finder fee' },
  { mission:'investor', expect:'You reject the investor' },
  { mission:'fire', expect:'income is -30% for 30 seconds' },
  { mission:'home_safe_robbery', expect:'You keep carrying exposed cash.' },
  { mission:'stolen_shipment', state:{ product:50 }, expect:'You write off the missing cargo.' },
  { mission:'alderman_fixer', expect:'a City Hall audit arrives in 2 minutes' },
  { mission:'turf_war', state:{ heat:30 }, expect:'You let the pressure cool' },
  { mission:'first_heist', expect:'You leave the vault job on the board.' },
];

async function bootForMissions(page: Page, pageErrors: string[]): Promise<void> {
  page.on('pageerror', function(error){ pageErrors.push(error.message); });
  await page.goto('/');
  await page.getByRole('button', { name:'Start', exact:true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: BranchHook }).__seat; });
  await page.evaluate(function(){
    (window as unknown as { __seat: BranchHook }).__seat.state.nextEventAt = Number.MAX_SAFE_INTEGER;
  });
}

async function applyState(page: Page, branch: Pick<Branch, 'state' | 'memory' | 'random'>): Promise<void> {
  await page.evaluate(function(setup){
    const seat = (window as unknown as { __seat: BranchHook }).__seat;
    Object.assign(seat.state, setup.state ?? {});
    Object.assign(seat.state.worldMemory, setup.memory ?? {});
    if(setup.random !== undefined){
      const fixed = setup.random;
      Math.random = function(){ return fixed; };
    }
  }, { state:branch.state, memory:branch.memory, random:branch.random });
}

test.describe('every mission branch resolves and reports its result', function () {
  for(const branch of BRANCHES){
    test(branch.name, async ({ page }) => {
      const pageErrors: string[] = [];
      await bootForMissions(page, pageErrors);
      await applyState(page, branch);
      await page.evaluate(function(id){
        const seat = (window as unknown as { __seat: BranchHook }).__seat;
        seat.startMission(id);
        seat.resolveMission(id);
      }, branch.mission);
      for(const step of branch.steps){
        if(step === 'resolve'){
          await page.evaluate(function(id){ (window as unknown as { __seat: BranchHook }).__seat.resolveMission(id); }, branch.mission);
          continue;
        }
        await applyState(page, branch);
        await page.locator('#modal-footer').getByRole('button', { name:step, exact:typeof step === 'string' }).click();
      }
      await expect(page.locator('#modal-overlay')).toContainText('Mission Result');
      for(const fragment of branch.expect) await expect(page.locator('#modal-body')).toContainText(fragment);
      expect(pageErrors).toEqual([]);
    });
  }

  for(const decline of DECLINES){
    test(`declining ${decline.mission} explains what it cost`, async ({ page }) => {
      const pageErrors: string[] = [];
      await bootForMissions(page, pageErrors);
      await applyState(page, decline);
      await page.evaluate(function(id){ (window as unknown as { __seat: BranchHook }).__seat.declineMission(id); }, decline.mission);
      await expect(page.locator('#modal-overlay')).toContainText('Mission Offer Declined');
      await expect(page.locator('#modal-body')).toContainText(decline.expect);
      expect(pageErrors).toEqual([]);
    });
  }
});
