import type * as ThreeNamespace from 'three';

// LEGAL: Waves drawn by the water's own shader. They used to be flat strips that slid back and
// LEGAL: forth along the shore, half of them over the beach or the land. Computed per pixel from
// LEGAL: world position, a crest can only ever appear where there is a water surface to draw it on.

// LEGAL: Seconds of play; the game loop advances it. One object shared by every water material.
export const waterClock = { value: 0 };

// LEGAL: Three swells of different length and heading, roughly 200, 150 and 70 units, so the
// LEGAL: pattern never visibly repeats from the map camera. Crests brighten toward foam.
const WAVE_CHUNK = `
  float waveA = sin(vWaterPos.x * 0.031 + vWaterPos.y * 0.012 + uWaterTime * 0.9);
  float waveB = sin(vWaterPos.x * -0.017 + vWaterPos.y * 0.043 - uWaterTime * 0.7);
  float waveC = sin((vWaterPos.x + vWaterPos.y) * 0.09 + uWaterTime * 1.7);
  float swell = waveA * 0.5 + waveB * 0.35 + waveC * 0.15;
  float crest = smoothstep(0.74, 0.98, swell);
  diffuseColor.rgb = mix(diffuseColor.rgb * (0.9 + 0.1 * swell), vec3(0.82, 0.92, 0.95), crest * 0.13);
`;

export function applyWaterWaves<T extends ThreeNamespace.Material>(material: T): T {
  if(material.userData.waterWaves) return material;
  material.userData.waterWaves = true;
  material.onBeforeCompile = function(shader){
    shader.uniforms.uWaterTime = waterClock;
    shader.vertexShader = 'varying vec2 vWaterPos;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n  vWaterPos = (modelMatrix * vec4(transformed, 1.0)).xz;',
    );
    shader.fragmentShader = 'uniform float uWaterTime;\nvarying vec2 vWaterPos;\n' + shader.fragmentShader.replace(
      '#include <color_fragment>',
      '#include <color_fragment>\n' + WAVE_CHUNK,
    );
  };
  material.customProgramCacheKey = function(){ return 'water-waves'; };
  material.needsUpdate = true;
  return material;
}

// LEGAL: Surf along the shore: a strip whose brightness runs along it with the waves and fades to
// LEGAL: nothing at both edges, so it reads as foam breaking rather than a painted line.
export function applyShoreFoam<T extends ThreeNamespace.Material>(material: T): T {
  material.onBeforeCompile = function(shader){
    shader.uniforms.uWaterTime = waterClock;
    shader.vertexShader = 'varying vec2 vFoamUv;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n  vFoamUv = uv;',
    );
    shader.fragmentShader = 'uniform float uWaterTime;\nvarying vec2 vFoamUv;\n' + shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
  float across = sin(vFoamUv.y * 3.14159);
  float surge = 0.5 + 0.5 * sin(vFoamUv.x * 0.9 - uWaterTime * 1.3) * sin(vFoamUv.x * 0.23 + uWaterTime * 0.4);
  diffuseColor.a *= across * (0.25 + 0.75 * surge);`,
    );
  };
  material.customProgramCacheKey = function(){ return 'shore-foam'; };
  material.needsUpdate = true;
  return material;
}
