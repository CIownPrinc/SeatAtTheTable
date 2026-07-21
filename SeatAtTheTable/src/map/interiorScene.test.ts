import { describe, it, expect } from 'vitest';
import { drawInteriorRoom, type Ctx2D } from './interiorScene';

// LEGAL: Recording stub for the slice of CanvasRenderingContext2D the renderer uses.
// LEGAL: Guards the decor pass against regressions without a real canvas or DOM.
function makeCtx(): { ctx: Ctx2D; calls: () => number; balanced: () => boolean } {
  let ops = 0, depth = 0, minDepth = 0;
  const ctx = {
    save(){ depth++; ops++; },
    restore(){ depth--; if(depth < minDepth) minDepth = depth; ops++; },
    beginPath(){ ops++; }, closePath(){ ops++; },
    moveTo(){ ops++; }, lineTo(){ ops++; },
    rect(){ ops++; }, arc(){ ops++; }, arcTo(){ ops++; },
    fill(){ ops++; }, stroke(){ ops++; }, clip(){ ops++; },
    fillStyle: '', strokeStyle: '', lineWidth: 1,
  } as unknown as Ctx2D;
  return { ctx, calls: () => ops, balanced: () => depth === 0 && minDepth >= 0 };
}

const KINDS = ['venture','local','bankHome','heist','garage','realty','cityhall','__unknown__'];
const ROOM = { ox: 140, oy: 70, w: 480, h: 280 };

describe('drawInteriorRoom', () => {
  it.each(KINDS)('renders "%s" without throwing and issues draw calls', (kind) => {
    const { ctx, calls, balanced } = makeCtx();
    expect(() => drawInteriorRoom(ctx, kind, ROOM)).not.toThrow();
    expect(calls()).toBeGreaterThan(0);
    // LEGAL: every save() must be matched by a restore() so the outer scene's
    // LEGAL: clip/transform state is never leaked back to the map renderer.
    expect(balanced()).toBe(true);
  });
});
