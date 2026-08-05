import { describe, it, expect } from 'vitest';
import { fireRoadPayout, isFireRoadBest, shotOutcome, CHESS_PUZZLES } from './minigames';

// LEGAL: Guards the pure scoring helpers that decide minigame rewards. These carry the
// LEGAL: game-affecting logic; the DOM overlay/input code is exercised by hand.

describe('shotOutcome', () => {
  const half = 0.075, center = 0.5;
  it('dead-centre and within the sweet zone is a swish', () => {
    expect(shotOutcome(center, center, half)).toBe('swish');
    expect(shotOutcome(center + half * 0.99, center, half)).toBe('swish');
    expect(shotOutcome(center - half * 0.99, center, half)).toBe('swish');
  });
  it('just outside the zone but inside the rim band is a rim', () => {
    expect(shotOutcome(center + half * 1.5, center, half)).toBe('rim');
    expect(shotOutcome(center + half * 2.0, center, half)).toBe('rim');
  });
  it('beyond the rim band is a miss', () => {
    expect(shotOutcome(center + half * 2.2, center, half)).toBe('miss');
    expect(shotOutcome(0, center, half)).toBe('miss');
    expect(shotOutcome(1, center, half)).toBe('miss');
  });
});

describe('CHESS_PUZZLES', () => {
  it('every puzzle has an answer index that points at a real move', () => {
    expect(CHESS_PUZZLES.length).toBeGreaterThan(0);
    for(const p of CHESS_PUZZLES){
      expect(p.moves.length).toBeGreaterThan(0);
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.answer).toBeLessThan(p.moves.length);
    }
  });
  it('every FEN describes eight ranks', () => {
    for(const p of CHESS_PUZZLES){
      expect(p.fen.split('/')).toHaveLength(8);
    }
  });
});

describe('fireRoadPayout', () => {
  it('pays only for a completed run and reserves the top purse for a clean course', () => {
    expect(fireRoadPayout(0, 6)).toBe(0);
    expect(fireRoadPayout(2, 6)).toBe(0);
    expect(fireRoadPayout(3, 6)).toBe(350);
    expect(fireRoadPayout(5, 6)).toBe(700);
    expect(fireRoadPayout(6, 6)).toBe(1100);
  });
});

describe('isFireRoadBest', () => {
  it('only replaces a saved time when the paid run is faster', () => {
    expect(isFireRoadBest(0, 41.2)).toBe(true);
    expect(isFireRoadBest(46.5, 41.2)).toBe(true);
    expect(isFireRoadBest(38.1, 41.2)).toBe(false);
  });
});
