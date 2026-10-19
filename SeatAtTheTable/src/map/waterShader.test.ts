import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { applyWaterWaves, waterClock } from './waterShader';

function compile(material: THREE.MeshStandardMaterial) {
  const shader = {
    uniforms: THREE.UniformsUtils.clone(THREE.ShaderLib.standard.uniforms),
    vertexShader: THREE.ShaderLib.standard.vertexShader,
    fragmentShader: THREE.ShaderLib.standard.fragmentShader,
  };
  material.onBeforeCompile(shader as unknown as THREE.WebGLProgramParametersWithUniforms, undefined as unknown as THREE.WebGLRenderer);
  return shader;
}

describe('applyWaterWaves', function () {
  it('animates every water surface from one shared clock', function () {
    const shader = compile(applyWaterWaves(new THREE.MeshStandardMaterial()));
    expect((shader.uniforms as Record<string, unknown>).uWaterTime).toBe(waterClock);
  });

  it('works out wave height from world position, so waves can only appear on water', function () {
    const shader = compile(applyWaterWaves(new THREE.MeshStandardMaterial()));
    expect(shader.vertexShader).toContain('vWaterPos');
    expect(shader.fragmentShader).toContain('vWaterPos');
    expect(shader.fragmentShader).toContain('uWaterTime');
  });

  it('patches each material once, however many times it is applied', function () {
    const material = new THREE.MeshStandardMaterial();
    applyWaterWaves(material);
    const first = material.onBeforeCompile;
    applyWaterWaves(material);
    expect(material.onBeforeCompile).toBe(first);
    expect(material.customProgramCacheKey()).toContain('water');
  });
});
