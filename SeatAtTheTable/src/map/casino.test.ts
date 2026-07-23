import { describe, expect, it } from 'vitest';
import {
  blackjackReturn,
  drawReplacements,
  freshDeck,
  handValue,
  isBlackjack,
  playDealerHand,
  pokerReturn,
  rankPokerHand,
  rouletteColor,
  rouletteReturn,
  settleBlackjack,
  shuffle,
  spinRoulette,
  type Card,
} from './casino';

function cards(spec: string): Card[] {
  // LEGAL: "AS 10H 3D" — rank then suit letter.
  return spec.split(' ').map(function(token){
    const suit = token.slice(-1) as Card['suit'];
    const face = token.slice(0, -1);
    const rank = face === 'A' ? 1 : face === 'J' ? 11 : face === 'Q' ? 12 : face === 'K' ? 13 : Number(face);
    return { rank, suit };
  });
}

// LEGAL: Deterministic source so a round can be replayed exactly.
function sequence(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('casino — cards and blackjack', function () {
  it('builds a full 52-card deck with no duplicates', function () {
    const deck = freshDeck();

    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(card => `${card.rank}${card.suit}`)).size).toBe(52);
  });

  it('shuffles without losing or duplicating a card', function () {
    const shuffled = shuffle(freshDeck(), sequence([0.9, 0.12, 0.45, 0.77, 0.03, 0.61]));

    expect(shuffled).toHaveLength(52);
    expect(new Set(shuffled.map(card => `${card.rank}${card.suit}`)).size).toBe(52);
  });

  // LEGAL: The one rule everyone gets wrong. An ace is 11 until that would bust.
  it('counts aces as 11 until doing so would bust, then as 1', function () {
    expect(handValue(cards('AS KH'))).toBe(21);
    expect(handValue(cards('AS 9H 5D'))).toBe(15);
    expect(handValue(cards('AS AH 9D'))).toBe(21);
    expect(handValue(cards('AS AH AD 8C'))).toBe(21);
    expect(handValue(cards('KS QH 3D'))).toBe(23);
  });

  it('only calls 21 a blackjack on the opening two cards', function () {
    expect(isBlackjack(cards('AS KH'))).toBe(true);
    expect(isBlackjack(cards('7S 7H 7D'))).toBe(false);
  });

  it('stands the dealer on all 17s, soft ones included', function () {
    // LEGAL: Soft 17 (ace + six) — stands, so the 5 is never dealt.
    const soft = playDealerHand(cards('AS 6H'), cards('5D'));
    expect(handValue(soft.hand)).toBe(17);
    expect(soft.hand).toHaveLength(2);
    expect(soft.shoe).toHaveLength(1);
    // LEGAL: Hard 11 draws once to 20 and stops.
    expect(playDealerHand(cards('5S 6H'), cards('9C 4D')).hand).toHaveLength(3);
    // LEGAL: ...and keeps drawing while still under 17.
    expect(playDealerHand(cards('5S 6H'), cards('4D 9C')).hand).toHaveLength(4);
  });

  it('settles every blackjack outcome', function () {
    expect(settleBlackjack(cards('KS QH 5D'), cards('9S 8H'))).toBe('bust');
    expect(settleBlackjack(cards('AS KH'), cards('9S 8H'))).toBe('blackjack');
    expect(settleBlackjack(cards('AS KH'), cards('AD KC'))).toBe('push');
    expect(settleBlackjack(cards('10S 9H'), cards('KS QH 5D'))).toBe('win');
    expect(settleBlackjack(cards('10S 7H'), cards('KS 9H'))).toBe('lose');
  });

  it('pays a natural 3:2 and an ordinary win even money', function () {
    expect(blackjackReturn('blackjack', 100)).toBe(250);
    expect(blackjackReturn('win', 100)).toBe(200);
    expect(blackjackReturn('push', 100)).toBe(100);
    expect(blackjackReturn('lose', 100)).toBe(0);
    expect(blackjackReturn('bust', 100)).toBe(0);
  });
});

describe('casino — roulette', function () {
  it('colours a single-zero wheel correctly', function () {
    expect(rouletteColor(0)).toBe('green');
    expect(rouletteColor(1)).toBe('red');
    expect(rouletteColor(2)).toBe('black');
    expect(rouletteColor(36)).toBe('red');
  });

  it('only ever lands in a real pocket', function () {
    const spins = [0, 0.5, 0.999999, 0.027].map(v => spinRoulette(() => v));

    spins.forEach(function(pocket){
      expect(pocket).toBeGreaterThanOrEqual(0);
      expect(pocket).toBeLessThanOrEqual(36);
      expect(Number.isInteger(pocket)).toBe(true);
    });
  });

  // LEGAL: Zero taking every outside bet IS the house edge on this wheel. If this ever
  // LEGAL: passes for zero, the game has no edge at all.
  it('gives zero every outside bet', function () {
    expect(rouletteReturn({ kind:'color', color:'red' }, 0, 100)).toBe(0);
    expect(rouletteReturn({ kind:'parity', even:true }, 0, 100)).toBe(0);
    expect(rouletteReturn({ kind:'half', high:false }, 0, 100)).toBe(0);
  });

  it('pays outside bets even money and a straight-up 35:1', function () {
    expect(rouletteReturn({ kind:'color', color:'red' }, 1, 100)).toBe(200);
    expect(rouletteReturn({ kind:'color', color:'red' }, 2, 100)).toBe(0);
    expect(rouletteReturn({ kind:'parity', even:true }, 4, 100)).toBe(200);
    expect(rouletteReturn({ kind:'half', high:true }, 19, 100)).toBe(200);
    expect(rouletteReturn({ kind:'half', high:true }, 18, 100)).toBe(0);
    expect(rouletteReturn({ kind:'straight', pocket:17 }, 17, 10)).toBe(360);
  });
});

describe('casino — poker', function () {
  it('ranks every paying hand', function () {
    expect(rankPokerHand(cards('AS KS QS JS 10S'))).toBe('royal flush');
    expect(rankPokerHand(cards('9H 8H 7H 6H 5H'))).toBe('straight flush');
    expect(rankPokerHand(cards('7S 7H 7D 7C 2S'))).toBe('four of a kind');
    expect(rankPokerHand(cards('7S 7H 7D 4C 4S'))).toBe('full house');
    expect(rankPokerHand(cards('2S 5S 9S JS KS'))).toBe('flush');
    expect(rankPokerHand(cards('5S 6H 7D 8C 9S'))).toBe('straight');
    expect(rankPokerHand(cards('7S 7H 7D 4C 2S'))).toBe('three of a kind');
    expect(rankPokerHand(cards('7S 7H 4D 4C 2S'))).toBe('two pair');
    expect(rankPokerHand(cards('JS JH 4D 6C 2S'))).toBe('jacks or better');
  });

  // LEGAL: The pay table's whole shape depends on low pairs NOT paying.
  it('does not pay a pair below jacks', function () {
    expect(rankPokerHand(cards('10S 10H 4D 6C 2S'))).toBe('nothing');
    expect(rankPokerHand(cards('2S 2H 4D 6C 9S'))).toBe('nothing');
    expect(rankPokerHand(cards('AS AH 4D 6C 2S'))).toBe('jacks or better');
  });

  it('reads the ace low in A-2-3-4-5 and high in A-K-Q-J-10', function () {
    expect(rankPokerHand(cards('AS 2H 3D 4C 5S'))).toBe('straight');
    expect(rankPokerHand(cards('AS KH QD JC 10S'))).toBe('straight');
    // LEGAL: ...but not wrapping round the top.
    expect(rankPokerHand(cards('QS KH AD 2C 3S'))).toBe('nothing');
  });

  it('pays out by the table, scaled to the stake', function () {
    expect(pokerReturn('royal flush', 20)).toBe(5000);
    expect(pokerReturn('jacks or better', 20)).toBe(20);
    expect(pokerReturn('nothing', 20)).toBe(0);
  });

  it('replaces only the cards not held, in order, from the shoe', function () {
    const hand = cards('AS KH QD JC 10S');
    const shoe = cards('2H 3H 4H');

    const result = drawReplacements(hand, [0, 4], shoe);

    expect(result.hand.map(c => c.rank)).toEqual([1, 2, 3, 4, 10]);
    expect(result.hand[0].suit).toBe('S');
    expect(result.shoe).toHaveLength(0);
  });
});
