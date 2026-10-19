import { describe, expect, it } from 'vitest';
import { BUILDING_MODELS, buildingModelFor } from './buildingModels';

describe('building models', function () {
  it('has a model for every archetype that is a building', function () {
    (['tenement', 'storefront', 'showroom', 'office', 'tower', 'civic', 'works'] as const).forEach(function(archetype){
      expect(BUILDING_MODELS).toContain(buildingModelFor(archetype));
    });
  });

  it('has none for places that are not buildings', function () {
    (['cart', 'alley', 'lot', 'bay'] as const).forEach(archetype => expect(buildingModelFor(archetype)).toBeNull());
  });
});
