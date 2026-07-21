import type { Bank } from './types';

// LEGAL: The roster of banks. The axis is interest vs. exposure: the old-money vault pays
// LEGAL: little but is the hardest, lowest-payoff score; the offshore bank pays the most
// LEGAL: but is a soft, high-payoff target — for you AND for rivals holding no love for
// LEGAL: your deposits. The old flat interest rate was 0.00035; these bracket it.
export const banks: Bank[] = [
  { id:'first-windhaven', name:'First Windhaven', short:'FWB',
    interestRate:0.00022, rateLabel:'Low',      heistPayoutMult:0.7, security:'Hardened',
    blurb:'Old money, thick walls, older money still on the board. Modest interest — and the hardest, least rewarding vault in the city to crack.' },
  { id:'rentport-national', name:'Rentport City National', short:'RCN',
    interestRate:0.00040, rateLabel:'Moderate', heistPayoutMult:1.0, security:'Standard',
    blurb:"The city's workhorse bank. Fair rates, an average vault, branches on every other corner." },
  { id:'lakeside-offshore', name:'Lakeside Offshore', short:'LKO',
    interestRate:0.00082, rateLabel:'High',     heistPayoutMult:1.6, security:'Soft',
    blurb:'No questions, no paper trail, fat interest. Also a soft target sitting on a lot of cash — a temptation to you and to anyone else with a plan.' },
];

// LEGAL: Where a saved single balance migrates to, and the default selected account.
export const DEFAULT_BANK_ID = 'first-windhaven';
