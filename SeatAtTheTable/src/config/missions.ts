import type { MissionOnboardingDefinition } from '../core/onboarding';

export type MissionEntry = 'popup' | 'phone';

export interface MajorMissionQuality {
  decisionBeats: number;
  savesDistinctOutcome: boolean;
  hasLaterConsequenceOrUnlock: boolean;
  hasInPersonSceneBeyondOneModal: boolean;
}

export interface MissionEventDefinition {
  id: string;
  title: string;
  sender: string;
  neg: boolean;
  unique: boolean;
  maxRepeats?: number;
  entry: MissionEntry;
  body: string;
  consequence: string;
  acceptLabel: string;
  declineLabel: string;
  onboarding: MissionOnboardingDefinition;
  quality?: MajorMissionQuality;
}

export const MISSION_CONFIG = {
  blackMarketIncome: 6,
  blackMarketHeat: 0.25,
  politicalFavorCost: 1200,
  politicalFavorHeatReduction: 18,
  homeSafeRobberyLossPct: 0.35,
  heistPrepRespectReq: 45,
  heistPrepCrewReq: 1,
  missionIntervalMin: 600,
  missionIntervalVariance: 300,
  activeMissionCap: 1,
  tonicCarefulDuration: 45,
  tonicWildDuration: 75,
  followUpDelaySeconds: 120,
  copsRefusalRaidChance: 0.35,
  copsRefusalHeat: 25,
  snitchRivalStrengthPenalty: 6,
  rejectedHustlerRivalStrengthPenalty: 4,
  investorCityHallSettlementCost: 900,
  investorCityHallSettlementHeatReduction: 8,
  inspectorComplianceMultiplier: 0.7,
  inspectorComplianceSeconds: 60,
  taxAuditSettlementCost: 650,
  taxAuditMultiplier: 0.5,
  taxAuditSeconds: 90,
  rivalIntimidationRespectRequirement: 80,
  rivalIntimidationMuscleRequirement: 2,
  turfWarVictoryIncomeMultiplier: 1.12,
  turfWarVictoryIncomeSeconds: 120,
  investorStandardCash: 3000,
  investorStandardIncomePenalty: 0.05,
  investorNegotiatedCash: 2500,
  investorNegotiatedIncomePenalty: 0.025,
  investorWeakNegotiationIncomePenalty: 0.06,
  investorPrestigeRequirement: 1,
  investorRespectRequirement: 150,
} as const;

export const OUTSKIRT_VENUE_CONFIG = {
  motelMinimumInvestigation: 20,
  motelInvestigationReductionPct: 0.3,
  motelHeatReduction: 15,
  motelStayCost: 900,
  motelStaySeconds: 120,
} as const;

export const missionEventPool: readonly MissionEventDefinition[] = [
  { id:'tribune', title:'The Herald Wants an Interview', sender:'Lana Vance', neg:false, unique:true, entry:'phone', body:"<p class='flavor'>Lana Vance from the Windhaven Herald wants a sit-down about the person building an empire out of a folding cart.</p>", consequence:'Interview tones can raise legit income, respect, heat, prestige, and future press tone.', acceptLabel:'Take the interview', declineLabel:'Stay quiet', onboarding:{mode:'contextual', teaches:'mission dialogue and consequence choices'}, quality:{decisionBeats:2, savesDistinctOutcome:true, hasLaterConsequenceOrUnlock:true, hasInPersonSceneBeyondOneModal:true} },
  { id:'rival', title:'Rival Crew Confrontation', sender:'West Side runner', neg:true, unique:true, entry:'popup', body:"<p class='flavor'>A West Side crew thinks your runners are working streets that belong to them. Their capo is waiting near one of your active corners.</p>", consequence:'Choices can cost cash, raise respect and heat, split income, or spark a gang war.', acceptLabel:'Meet the capo', declineLabel:'Avoid the meeting', onboarding:{mode:'mission', teaches:'territory pressure and gang consequences'} },
  { id:'inspector', title:'Inspector Kowalski Visits', sender:'Health Department', neg:true, unique:false, maxRepeats:2, entry:'popup', body:"<p class='flavor'>Inspector Kowalski has a clipboard and a look that says he already knows the price of looking away.</p>", consequence:'Bribes cost cash; compliance slows legit income; blackmail can block future inspections.', acceptLabel:'Meet Kowalski', declineLabel:'Keep him waiting', onboarding:{mode:'contextual', teaches:'inspection choices and compliance tradeoffs'} },
  { id:'cousin', title:'Amit Calls From the Bus Station', sender:'Cousin Amit', neg:false, unique:true, entry:'phone', body:"<p class='flavor'>Amit just arrived with a suitcase and a debt following close behind. He is waiting at the Hub Bus Station.</p>", consequence:'Paying costs $600; hiring can add crew and unlock a later family mistake; refusal costs respect.', acceptLabel:'Go get Amit', declineLabel:'Turn him away', onboarding:{mode:'contextual', teaches:'crew hiring and family consequences'} },
  { id:'cops', title:'Detective Miller Wants a Back-Alley Talk', sender:'Burner phone', neg:true, unique:true, entry:'phone', body:"<p class='flavor'>Detective Miller sends a short message: Devlin back alley, no uniforms, no second chances.</p>", consequence:'Pay cash to cut heat, snitch to reduce the case but lose respect, or risk enforcement.', acceptLabel:'Take the meeting', declineLabel:'Ignore the burner', onboarding:{mode:'contextual', teaches:'heat reduction choices'} },
  { id:'hustler', title:'A Talented Hustler Wants In', sender:"O'Malley's Bar", neg:false, unique:true, entry:'popup', body:"<p class='flavor'>Sharp, hungry, and risky. The pitch is waiting at O'Malley's Bar.</p>", consequence:'Risky scores can pay cash or add heat; legit hiring can add crew; rejection helps rivals.', acceptLabel:'Hear the pitch', declineLabel:'Pass on it', onboarding:{mode:'contextual', teaches:'crew recruitment choices'} },
  { id:'hustler_score', title:'The Hustler Calls Back', sender:"O'Malley's Bar", neg:true, unique:true, entry:'phone', body:"<p class='flavor'>The hustler's score is in motion. A short message asks you to return to O'Malley's for the result.</p>", consequence:'The score can pay cash and add a recruit, or fail with heat and a lasting rival advantage.', acceptLabel:'Hear the result', declineLabel:'Leave them to it', onboarding:{mode:'none'} },
  { id:'investor', title:'Silent Investor Invitation', sender:'Whitfield Realty', neg:false, unique:true, entry:'phone', body:"<p class='flavor'>Cash up front, no questions, in exchange for a slice of everything going forward. The meeting is at Whitfield Realty.</p>", consequence:'Accept for cash with a permanent income cut, negotiate with leverage, or gain respect by rejecting.', acceptLabel:'Take the meeting', declineLabel:'Stay independent', onboarding:{mode:'none'} },
  { id:'fire', title:"Grease Fire at Kailash's Cart", sender:'Kailash', neg:true, unique:true, entry:'popup', body:"<p class='flavor'>Where it all started nearly goes up in smoke. Kailash says this does not smell accidental.</p>", consequence:'Rebuild costs cash or time; hunting the arsonist raises respect and heat and opens revenge memory.', acceptLabel:'Go to the cart', declineLabel:'Handle it quietly', onboarding:{mode:'none'} },
  { id:'home_safe_robbery', title:'Cash on Hand Is Not Safe', sender:'First Windhaven Trust', neg:true, unique:true, entry:'phone', body:"<p class='flavor'>Word comes in after a back-room safe gets cleaned out. The bank branches are safer than a shoebox under the bed.</p>", consequence:'You can lose 35% of on-hand cash, then deposit or set GPS to a bank for safer storage.', acceptLabel:'Learn the bank route', declineLabel:'Risk the cash', onboarding:{mode:'mission', teaches:'banking and cash safety'}, quality:{decisionBeats:2, savesDistinctOutcome:true, hasLaterConsequenceOrUnlock:true, hasInPersonSceneBeyondOneModal:true} },
  { id:'stolen_shipment', title:'Missing Cargo', sender:'Dockmaster Bell', neg:true, unique:true, entry:'phone', body:"<p class='flavor'>A cargo pallet disappears between the docks and West Side. The dockmaster says somebody at a chop shop knows where it went.</p>", consequence:'Buy cargo back, take it by force, or unlock Black Market Trade passive income with case risk.', acceptLabel:'Go to the docks', declineLabel:'Write it off', onboarding:{mode:'mission', teaches:'Black Market Trade unlock'}, quality:{decisionBeats:3, savesDistinctOutcome:true, hasLaterConsequenceOrUnlock:true, hasInPersonSceneBeyondOneModal:true} },
  { id:'alderman_fixer', title:'The Bagman at City Hall', sender:'City Hall Annex', neg:false, unique:true, entry:'phone', body:"<p class='flavor'>A bagman says an alderman can become useful if a railyard union problem goes quiet.</p>", consequence:'Spend cash or pressure the union to gain influence and unlock Political Favors.', acceptLabel:'Hear the favor', declineLabel:'Avoid City Hall', onboarding:{mode:'mission', teaches:'Political Favors unlock'}, quality:{decisionBeats:2, savesDistinctOutcome:true, hasLaterConsequenceOrUnlock:true, hasInPersonSceneBeyondOneModal:true} },
  { id:'turf_war', title:'West Side Pressure', sender:'Street lookout', neg:true, unique:true, entry:'popup', body:"<p class='flavor'>West Side pressure spills toward Devlin. Defend the block before the capo moves the line.</p>", consequence:'Defend Devlin, then choose truce for lower heat or assassination for high-risk turf gain.', acceptLabel:'Defend Devlin', declineLabel:'Let it cool', onboarding:{mode:'mission', teaches:'turf defense and gang war choices'}, quality:{decisionBeats:3, savesDistinctOutcome:true, hasLaterConsequenceOrUnlock:true, hasInPersonSceneBeyondOneModal:true} },
  { id:'first_heist', title:'The First Real Heist', sender:'The Vault Job', neg:true, unique:true, entry:'phone', body:"<p class='flavor'>The old smash-and-grab board is not enough for your first real vault job. Pick a target, case it, choose an approach, then execute.</p>", consequence:'Preparation sets the target, approach, heat risk, payout odds, and escape result.', acceptLabel:'Start casing', declineLabel:'Not tonight', onboarding:{mode:'mission', teaches:'multi-stage heist preparation'}, quality:{decisionBeats:2, savesDistinctOutcome:true, hasLaterConsequenceOrUnlock:true, hasInPersonSceneBeyondOneModal:true} },
  { id:'amit_mistake', title:"Amit's Debt Comes Due", sender:'Cousin Amit', neg:true, unique:true, entry:'phone', body:"<p class='flavor'>Amit took a shortcut with the books and a lender now knows one of your crew by name. He is waiting at the Hub Bus Station.</p>", consequence:'Pay to contain the mistake or permanently lose a crew member while the street notices.', acceptLabel:'Meet Amit', declineLabel:'Leave him to it', onboarding:{mode:'none'} },
  { id:'hostile_press', title:'The Herald Turns Hostile', sender:'Lana Vance', neg:true, unique:true, entry:'phone', body:"<p class='flavor'>The Herald is running your words beside every rumor it can print. Lana asks for one more meeting at the newsroom.</p>", consequence:'A hard but temporary legitimate-income penalty, or an expensive response that shortens the damage.', acceptLabel:'Meet Lana', declineLabel:'Let it run', onboarding:{mode:'contextual', teaches:'reputation fallout and recovery'} },
  { id:'press_followup', title:'The Herald Profile Draws a Visitor', sender:'Lana Vance', neg:false, unique:true, entry:'phone', body:"<p class='flavor'>Lana says somebody read your profile closely and wants a conversation, not a phone call. Meet her in the Herald studio.</p>", consequence:'Your interview opening and tone determine whether the visitor offers sponsorship, community support, a source, or a public challenge.', acceptLabel:'Return to the studio', declineLabel:'Leave the profile alone', onboarding:{mode:'none'} },
  { id:'black_market_investigation', title:'A Case File at the Docks', sender:'Dockmaster Bell', neg:true, unique:true, entry:'phone', body:"<p class='flavor'>A detective is asking why your new dockside income does not appear on any manifest. Bell wants you at the docks.</p>", consequence:'Pay to close the file or destroy records and trade product for a lower case risk.', acceptLabel:'Meet Bell', declineLabel:'Stay clear', onboarding:{mode:'contextual', teaches:'investigation risk from Black Market Trade'} },
  { id:'arsonist_revenge', title:'A Name for the Fire', sender:'Kailash', neg:true, unique:true, entry:'phone', body:"<p class='flavor'>Kailash finally has the name behind the cart fire. The person is hiding near the back alley.</p>", consequence:'Take a quiet payoff or answer the fire loudly for respect and heat.', acceptLabel:'Follow the lead', declineLabel:'Let it go', onboarding:{mode:'none'} },
  { id:'tax_audit', title:'City Hall Opens Your Books', sender:'City Hall Annex', neg:true, unique:true, entry:'phone', body:"<p class='flavor'>The bagman never raises his voice. A day later, a clerk asks you to come to City Hall about a surprise audit of your flagship business.</p>", consequence:'Pay $650 to close the audit, or contest it and lose 50% income at the named venture for 90 seconds.', acceptLabel:'Meet the auditor', declineLabel:'Let the audit run', onboarding:{mode:'contextual', teaches:'political refusal has a concrete business consequence'} },
  { id:'mystery_tonic', title:'A Tonic with Side Effects', sender:'Golden Lotus Herbalist', neg:false, unique:true, entry:'phone', body:"<p class='flavor'>Mrs. Lin has a tonic she insists is either a breakthrough or a terrible idea. She asks you to try it in person.</p>", consequence:'An optional comic detour with temporary strange effects and a small reward.', acceptLabel:'Try the tonic', declineLabel:'Keep it sealed', onboarding:{mode:'none'} },
  { id:'pigeon_summit', title:'Emergency Pigeon Summit', sender:'City Hall Annex', neg:false, unique:true, entry:'phone', body:"<p class='flavor'>City Hall needs a respected local figure to handle a flock of pigeons that has occupied the Wabash Newsstand and learned to steal pastries.</p>", consequence:'An optional civic farce: choose a harmless approach, earn a small reward, and leave behind a funny city memory.', acceptLabel:'Hear the emergency', declineLabel:'Let the pigeons govern', onboarding:{mode:'none'} },
  { id:'mayors_parrot', title:"The Mayor's Parrot Has Notes", sender:'City Hall Annex', neg:false, unique:true, entry:'phone', body:"<p class='flavor'>City Hall's ceremonial parrot has escaped with a budget notebook and is reportedly asking strangers for zoning variances.</p>", consequence:'An optional civic detour: take the official line or charge for your help, then resolve the bird situation at Rockwell Pet Supply.', acceptLabel:'Handle the parrot', declineLabel:'Let it run the city', onboarding:{mode:'none'} },
  { id:'goose_permit', title:'The Goose Has a Permit', sender:'City Hall Annex', neg:false, unique:true, entry:'phone', body:"<p class='flavor'>A Canada goose has occupied a parking space at Boundary Meadows Drive-In and produced a laminated permit with an official-looking seal. The clerk needs someone with local standing.</p>", consequence:'An optional civic farce: choose an official response at City Hall, then settle the goose’s claim in person at the Drive-In for cash, respect, and a city memory.', acceptLabel:'Review the permit', declineLabel:'Respect the goose', onboarding:{mode:'none'} },
  { id:'raccoon_keycard', title:'The Raccoon Has a Keycard', sender:'City Hall Annex', neg:false, unique:true, entry:'phone', body:"<p class='flavor'>A raccoon has learned the clerk's keycard beep, entered the records floor, and begun approving its own snack budget. City Hall needs a discreet fix.</p>", consequence:'An optional civic farce: choose how public the response is, then collect a humane lure from Golden Lotus for cash, respect, or a small heat reduction.', acceptLabel:'Handle the raccoon', declineLabel:'Let it file paperwork', onboarding:{mode:'none'} },
];
