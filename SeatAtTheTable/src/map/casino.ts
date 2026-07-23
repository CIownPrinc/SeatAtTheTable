// LEGAL: ---- Casino games ----
// LEGAL: Pure rules only: no DOM, no three.js, no game state. Everything takes an explicit
// LEGAL: random source so a round can be replayed exactly in a test, which is the only
// LEGAL: honest way to check a payout table — a house edge you cannot measure is a house
// LEGAL: edge you are guessing at. The UI in header.ts owns presentation and the cash.

export type Suit = 'S' | 'H' | 'D' | 'C';

export interface Card {
  // LEGAL: 1 = ace, 11/12/13 = jack/queen/king.
  rank: number;
  suit: Suit;
}

export type Random = () => number;

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

export function freshDeck(): Card[] {
  const deck: Card[] = [];
  SUITS.forEach(function(suit){
    for(let rank = 1; rank <= 13; rank += 1) deck.push({ rank, suit });
  });
  return deck;
}

// LEGAL: Fisher-Yates. Unbiased, unlike the sort(() => rand() - 0.5) trick, which is not.
export function shuffle<T>(items: T[], rand: Random): T[] {
  const out = items.slice();
  for(let i = out.length - 1; i > 0; i -= 1){
    const j = Math.floor(rand() * (i + 1));
    const swap = out[i];
    out[i] = out[j];
    out[j] = swap;
  }
  return out;
}

export function cardLabel(card: Card): string {
  const face: Record<number, string> = { 1:'A', 11:'J', 12:'Q', 13:'K' };
  const suit: Record<Suit, string> = { S:'♠', H:'♥', D:'♦', C:'♣' };
  return `${face[card.rank] ?? String(card.rank)}${suit[card.suit]}`;
}

// LEGAL: ---- Blackjack ----

// LEGAL: Aces count 11 until that would bust, then 1. Counting every ace as 11 first and
// LEGAL: demoting one at a time is the whole rule; there is no need for a special case.
export function handValue(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  cards.forEach(function(card){
    if(card.rank === 1){ aces += 1; total += 11; }
    else total += Math.min(10, card.rank);
  });
  while(total > 21 && aces > 0){ total -= 10; aces -= 1; }
  return total;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards) === 21;
}

// LEGAL: The house stands on all 17s, including soft ones. Stated here rather than left
// LEGAL: implicit, because it is the single biggest lever on the edge.
export function playDealerHand(dealer: Card[], shoe: Card[]): { hand: Card[]; shoe: Card[] } {
  const hand = dealer.slice();
  const rest = shoe.slice();
  while(handValue(hand) < 17 && rest.length > 0) hand.push(rest.shift() as Card);
  return { hand, shoe: rest };
}

export type BlackjackOutcome = 'blackjack' | 'win' | 'push' | 'lose' | 'bust';

export function settleBlackjack(player: Card[], dealer: Card[]): BlackjackOutcome {
  const playerTotal = handValue(player);
  if(playerTotal > 21) return 'bust';
  if(isBlackjack(player) && !isBlackjack(dealer)) return 'blackjack';
  const dealerTotal = handValue(dealer);
  if(dealerTotal > 21) return 'win';
  if(playerTotal > dealerTotal) return 'win';
  if(playerTotal === dealerTotal) return 'push';
  return 'lose';
}

// LEGAL: Returned as a MULTIPLIER on the stake, so the caller never has to know that a
// LEGAL: natural pays 3:2 while an ordinary win pays even money.
export function blackjackReturn(outcome: BlackjackOutcome, stake: number): number {
  if(outcome === 'blackjack') return Math.round(stake * 2.5);
  if(outcome === 'win') return stake * 2;
  if(outcome === 'push') return stake;
  return 0;
}

// LEGAL: ---- Roulette ----
// LEGAL: European single-zero wheel. Double-zero would nearly double the house edge, and
// LEGAL: Arjun is being fleeced quite enough already.

const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

export type RouletteColor = 'red' | 'black' | 'green';

export function rouletteColor(pocket: number): RouletteColor {
  if(pocket === 0) return 'green';
  return RED_NUMBERS.has(pocket) ? 'red' : 'black';
}

export function spinRoulette(rand: Random): number {
  return Math.floor(rand() * 37);
}

export type RouletteBet =
  | { kind: 'color'; color: 'red' | 'black' }
  | { kind: 'parity'; even: boolean }
  | { kind: 'half'; high: boolean }
  | { kind: 'straight'; pocket: number };

// LEGAL: Total returned to the player including their stake, so 0 means "lost it".
export function rouletteReturn(bet: RouletteBet, pocket: number, stake: number): number {
  // LEGAL: Zero takes every outside bet. That IS the house edge on this wheel.
  if(bet.kind === 'straight') return bet.pocket === pocket ? stake * 36 : 0;
  if(pocket === 0) return 0;
  if(bet.kind === 'color') return rouletteColor(pocket) === bet.color ? stake * 2 : 0;
  if(bet.kind === 'parity') return (pocket % 2 === 0) === bet.even ? stake * 2 : 0;
  return (pocket >= 19) === bet.high ? stake * 2 : 0;
}

// LEGAL: ---- Poker (five-card draw against a pay table) ----
// LEGAL: Played against the table rather than against a dealer's hand, so a round needs no
// LEGAL: bluffing model to be a fair game — you are paid for what you build.

export type PokerHand =
  | 'royal flush'
  | 'straight flush'
  | 'four of a kind'
  | 'full house'
  | 'flush'
  | 'straight'
  | 'three of a kind'
  | 'two pair'
  | 'jacks or better'
  | 'nothing';

export const POKER_PAYOUTS: Record<PokerHand, number> = {
  'royal flush': 250,
  'straight flush': 50,
  'four of a kind': 25,
  'full house': 9,
  'flush': 6,
  'straight': 4,
  'three of a kind': 3,
  'two pair': 2,
  'jacks or better': 1,
  'nothing': 0,
};

function rankCounts(cards: Card[]): number[] {
  const counts = new Map<number, number>();
  cards.forEach(card => counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1));
  return [...counts.values()].sort((a, b) => b - a);
}

function isStraight(cards: Card[]): { straight: boolean; high: number } {
  const ranks = [...new Set(cards.map(card => card.rank))].sort((a, b) => a - b);
  if(ranks.length !== 5) return { straight: false, high: 0 };
  // LEGAL: The ace is high in A-K-Q-J-10 and low in A-2-3-4-5, so both are checked.
  if(ranks[4] - ranks[0] === 4) return { straight: true, high: ranks[4] };
  const wheel = ranks[0] === 1 && ranks[1] === 10 && ranks[4] === 13;
  return wheel ? { straight: true, high: 14 } : { straight: false, high: 0 };
}

export function rankPokerHand(cards: Card[]): PokerHand {
  if(cards.length !== 5) return 'nothing';
  const flush = cards.every(card => card.suit === cards[0].suit);
  const { straight, high } = isStraight(cards);
  if(flush && straight) return high === 14 ? 'royal flush' : 'straight flush';
  const counts = rankCounts(cards);
  if(counts[0] === 4) return 'four of a kind';
  if(counts[0] === 3 && counts[1] === 2) return 'full house';
  if(flush) return 'flush';
  if(straight) return 'straight';
  if(counts[0] === 3) return 'three of a kind';
  if(counts[0] === 2 && counts[1] === 2) return 'two pair';
  if(counts[0] === 2){
    // LEGAL: Only a pair of jacks or better pays; anything lower is a losing hand.
    const paying = cards.filter(function(card){
      return cards.filter(other => other.rank === card.rank).length === 2;
    });
    const rank = paying[0]?.rank ?? 0;
    if(rank === 1 || rank >= 11) return 'jacks or better';
  }
  return 'nothing';
}

export function pokerReturn(hand: PokerHand, stake: number): number {
  return POKER_PAYOUTS[hand] * stake;
}

// LEGAL: Replaces the cards at the given indices from the top of the shoe. Draw poker's one
// LEGAL: real decision, kept here so the UI does not invent its own dealing rules.
export function drawReplacements(hand: Card[], holdIndexes: number[], shoe: Card[]): { hand: Card[]; shoe: Card[] } {
  const held = new Set(holdIndexes);
  const rest = shoe.slice();
  const next = hand.map(function(card, index){
    if(held.has(index)) return card;
    return rest.shift() ?? card;
  });
  return { hand: next, shoe: rest };
}
