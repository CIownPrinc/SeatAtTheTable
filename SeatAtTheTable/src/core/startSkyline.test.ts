import { describe, expect, it } from 'vitest';
import { SKYLINE_HEIGHT, SKYLINE_WIDTH, skylineLayout } from './startSkyline';

describe('skylineLayout', function () {
  it('draws the same city every visit', function () {
    expect(skylineLayout()).toEqual(skylineLayout());
  });

  it('fills the full width on every layer, with no gaps to the sky', function () {
    skylineLayout().layers.forEach(function (layer) {
      const sorted = [...layer.buildings].sort((a, b) => a.x - b.x);
      expect(sorted[0].x).toBeLessThanOrEqual(0);
      const end = sorted.reduce((reach, b) => (b.x <= reach ? Math.max(reach, b.x + b.width) : reach), sorted[0].x + sorted[0].width);
      expect(end).toBeGreaterThanOrEqual(SKYLINE_WIDTH);
    });
  });

  it('keeps every building and window inside the picture', function () {
    skylineLayout().layers.forEach(function (layer) {
      layer.buildings.forEach(function (b) {
        expect(b.height).toBeGreaterThan(0);
        expect(b.height).toBeLessThanOrEqual(SKYLINE_HEIGHT);
        b.windows.forEach(function (w) {
          expect(w.x).toBeGreaterThanOrEqual(b.x);
          expect(w.x + w.size).toBeLessThanOrEqual(b.x + b.width);
          expect(w.y).toBeGreaterThanOrEqual(SKYLINE_HEIGHT - b.height);
        });
      });
    });
  });

  it('lights some windows and animates only a few of them', function () {
    const windows = skylineLayout().layers.flatMap(layer => layer.buildings.flatMap(b => b.windows));
    const flickering = windows.filter(w => w.flicker);
    expect(windows.length).toBeGreaterThan(80);
    expect(flickering.length).toBeGreaterThan(0);
    expect(flickering.length).toBeLessThan(windows.length * 0.15);
  });
});
