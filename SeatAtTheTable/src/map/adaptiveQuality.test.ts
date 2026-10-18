import { describe, expect, it } from 'vitest';
import { createQualityGovernor } from './adaptiveQuality';

function feed(governor: ReturnType<typeof createQualityGovernor>, frameMs: number, frames: number): boolean {
  let downgraded = false;
  for(let i = 0; i < frames; i++) if(governor.recordFrame(frameMs)) downgraded = true;
  return downgraded;
}

describe('createQualityGovernor', function () {
  it('asks for lower quality once a slow device has been measured for long enough', function () {
    const governor = createQualityGovernor({ minFps: 40, warmupFrames: 10, sampleSeconds: 2 });
    expect(feed(governor, 1000 / 22, 80)).toBe(true);
  });

  it('leaves a fast device alone', function () {
    const governor = createQualityGovernor({ minFps: 40, warmupFrames: 10, sampleSeconds: 2 });
    expect(feed(governor, 1000 / 60, 400)).toBe(false);
  });

  it('ignores the slow first frames while shaders compile', function () {
    const governor = createQualityGovernor({ minFps: 40, warmupFrames: 10, sampleSeconds: 2 });
    expect(feed(governor, 900, 10)).toBe(false);
    expect(feed(governor, 1000 / 60, 400)).toBe(false);
  });

  it('decides only once', function () {
    const governor = createQualityGovernor({ minFps: 40, warmupFrames: 10, sampleSeconds: 2 });
    expect(feed(governor, 1000 / 20, 80)).toBe(true);
    expect(feed(governor, 1000 / 20, 80)).toBe(false);
  });
});
