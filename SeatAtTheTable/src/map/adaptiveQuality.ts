// LEGAL: Watches real frame times on the map and says, once, when this device can't hold a
// LEGAL: playable frame rate, so the scene can drop its most expensive effect (shadows).
export interface QualityGovernorOptions {
  minFps: number;
  // LEGAL: Frames to skip first: shader compilation and asset upload make them slow everywhere.
  warmupFrames: number;
  sampleSeconds: number;
}

export interface QualityGovernor {
  // LEGAL: Returns true exactly once: on the frame the measurement decides to downgrade.
  recordFrame(frameMs: number): boolean;
}

export function createQualityGovernor(options: QualityGovernorOptions): QualityGovernor {
  let seen = 0;
  let sampledMs = 0;
  let sampledFrames = 0;
  let decided = false;
  return {
    recordFrame(frameMs: number): boolean {
      if(decided) return false;
      seen += 1;
      if(seen <= options.warmupFrames) return false;
      sampledMs += frameMs;
      sampledFrames += 1;
      if(sampledMs < options.sampleSeconds * 1000) return false;
      decided = true;
      return sampledFrames / (sampledMs / 1000) < options.minFps;
    },
  };
}
