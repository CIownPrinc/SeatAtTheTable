export interface OutcomeSnapshot {
  cash: number;
  product: number;
  respect: number;
  heat: number;
  investigation: number;
  influence: number;
  muscle: number;
  crew: number;
  investorPenalty: number;
}

export interface MissionLedger {
  accumulated: OutcomeSnapshot;
  baseline: OutcomeSnapshot | null;
}

const OUTCOME_KEYS: readonly (keyof OutcomeSnapshot)[] = ['cash', 'product', 'respect', 'heat', 'investigation', 'influence', 'muscle', 'crew', 'investorPenalty'];

function zeroOutcome(): OutcomeSnapshot {
  return { cash:0, product:0, respect:0, heat:0, investigation:0, influence:0, muscle:0, crew:0, investorPenalty:0 };
}

function addDifference(total: OutcomeSnapshot, before: OutcomeSnapshot, after: OutcomeSnapshot): OutcomeSnapshot {
  const sum = { ...total };
  OUTCOME_KEYS.forEach(function(key){ sum[key] += after[key] - before[key]; });
  return sum;
}

export function openMissionLedger(now: OutcomeSnapshot): MissionLedger {
  return { accumulated:zeroOutcome(), baseline:{ ...now } };
}

export function rebaseMissionLedger(ledger: MissionLedger, now: OutcomeSnapshot): MissionLedger {
  return { accumulated:ledger.accumulated, baseline:{ ...now } };
}

export function foldMissionLedger(ledger: MissionLedger, now: OutcomeSnapshot): MissionLedger {
  if(!ledger.baseline) return ledger;
  return { accumulated:addDifference(ledger.accumulated, ledger.baseline, now), baseline:null };
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

export function describeMissionLedger(ledger: MissionLedger, now: OutcomeSnapshot): string[] {
  const total = foldMissionLedger(ledger, now).accumulated;
  const rounded = (key: keyof OutcomeSnapshot): number => Math.round(total[key]);
  const changes: string[] = [];
  const cash = rounded('cash');
  if(cash) changes.push(`${cash > 0 ? '+' : '-'}$${Math.abs(cash).toLocaleString()}`);
  (['product', 'respect', 'heat', 'investigation', 'influence', 'muscle', 'crew'] as const).forEach(function(key){
    const value = rounded(key);
    if(value) changes.push(`${key} ${signed(value)}`);
  });
  const incomePenaltyPct = Math.round(total.investorPenalty * 100);
  if(incomePenaltyPct) changes.push(`permanent income ${signed(-incomePenaltyPct)}%`);
  return changes;
}
