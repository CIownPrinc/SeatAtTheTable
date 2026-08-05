import { describe, expect, it } from 'vitest';
import type { OnboardingSnapshot } from './onboarding';
import { getOnboardingSteps } from './onboarding';

function baseSnapshot(): OnboardingSnapshot {
  return {
    cash:0,
    heat:0,
    bankedCash:0,
    cartLevel:1,
    cartCrew:1,
    cartCrewNeeded:1,
    productLevel:1,
    canUpgradeLab:false,
    canPostFirstCorner:false,
    hasActiveCorner:true,
    missionLessons:[],
    eventHistory:{},
    activeMissions:[],
    completedMissions:[],
    worldMemory:{},
    canResearchCornerStore:false,
    hasUnlockedUnopenedVenture:false,
    hasUnderstaffedCart:false,
    hasUnderstaffedVenture:false,
    product:0,
    productCap:100,
    activeCornerCount:0,
    availableCornerCount:4,
  };
}

describe('onboarding steps', function () {
  it('starts with opening the cart before other lessons', function () {
    const steps = getOnboardingSteps({
      ...baseSnapshot(),
      cartLevel:0,
      cash:900,
      heat:82,
      canUpgradeLab:true,
    });

    expect(steps[0]).toMatchObject({
      id:'early-open-cart',
      badge:'First move',
      action:{ target:'empire', label:'Open empire' },
    });
  });

  it('moves from opening the cart to staffing it', function () {
    const steps = getOnboardingSteps({
      ...baseSnapshot(),
      cartLevel:1,
      cartCrew:0,
      cash:900,
      canUpgradeLab:true,
    });

    expect(steps[0]).toMatchObject({
      id:'early-staff-cart',
      action:{ target:'empire', label:'Assign crew' },
    });
  });

  it('teaches the Lab before the first map corner once the cart is staffed', function () {
    const steps = getOnboardingSteps({
      ...baseSnapshot(),
      cartLevel:1,
      cartCrew:1,
      productLevel:0,
      cash:900,
      canUpgradeLab:true,
      canPostFirstCorner:true,
    });

    expect(steps[0]).toMatchObject({
      id:'early-upgrade-lab',
      action:{ target:'empire', label:'Upgrade Lab' },
    });
  });

  it('routes the player to the map after the Lab is producing and the first corner is affordable', function () {
    const steps = getOnboardingSteps({
      ...baseSnapshot(),
      cartLevel:1,
      cartCrew:1,
      productLevel:1,
      cash:300,
      canPostFirstCorner:true,
      hasActiveCorner:false,
    });

    expect(steps[0]).toMatchObject({
      id:'early-post-first-corner',
      action:{ target:'map', label:'Open map' },
    });
  });

  it('turns an active guided mission into a GPS lesson', function () {
    const steps = getOnboardingSteps({
      ...baseSnapshot(),
      missionLessons:[{ id:'first_heist', title:'The First Real Heist', mode:'mission', status:'active', objectiveLabel:'Windhaven Trust' }],
    });

    expect(steps[0]).toMatchObject({
      id:'mission-active-first_heist',
      badge:'Active mission',
      action:{ kind:'missionGps', target:'missions', label:'Set GPS', missionId:'first_heist' },
    });
  });

  it('turns an offered guided mission into a Missions action', function () {
    const steps = getOnboardingSteps({
      ...baseSnapshot(),
      missionLessons:[{ id:'alderman_fixer', title:'The Bagman at City Hall', mode:'mission', status:'offered' }],
    });

    expect(steps[0]).toMatchObject({
      id:'mission-offered-alderman_fixer',
      badge:'New mission',
      action:{ kind:'open', target:'missions', label:'Open Missions' },
    });
  });

  it('gives each multi-stage mission a lesson that explains its current decision', function () {
    const steps = getOnboardingSteps({
      ...baseSnapshot(),
      missionLessons:[
        { id:'stolen_shipment', title:'Missing Cargo', mode:'mission', status:'active', stageId:'chopshop', objectiveLabel:'West Side Chop Shop' },
        { id:'alderman_fixer', title:'The Bagman at City Hall', mode:'mission', status:'active', stageId:'railyard', objectiveLabel:'Railyard union leader' },
        { id:'turf_war', title:'West Side Pressure', mode:'mission', status:'active', stageId:'capo', objectiveLabel:'Marigold Lounge' },
        { id:'first_heist', title:'The First Real Heist', mode:'mission', status:'active', stageId:'escape', objectiveLabel:'First Windhaven Trust' },
      ],
    });

    expect(steps).toEqual(expect.arrayContaining([
      expect.objectContaining({ id:'mission-active-stolen_shipment', body:expect.stringContaining('Black Market Trade') }),
      expect.objectContaining({ id:'mission-active-alderman_fixer', body:expect.stringContaining('Political Favors') }),
      expect.objectContaining({ id:'mission-active-turf_war', body:expect.stringContaining('truce') }),
      expect.objectContaining({ id:'mission-active-first_heist', body:expect.stringContaining('approach') }),
    ]));
  });

  it('keeps dedicated instruction at the added airfield and lodge stages', function(){
    const steps = getOnboardingSteps({
      ...baseSnapshot(),
      missionLessons:[
        { id:'stolen_shipment', title:'Missing Cargo', mode:'mission', status:'active', stageId:'airfield', objectiveLabel:'Kettle Flats Airfield' },
        { id:'turf_war', title:'West Side Pressure', mode:'mission', status:'active', stageId:'lodge', objectiveLabel:'Ridgewood Stand Lodge' },
      ],
    });

    expect(steps).toEqual(expect.arrayContaining([
      expect.objectContaining({ id:'mission-active-stolen_shipment', body:expect.stringContaining('street payout') }),
      expect.objectContaining({ id:'mission-active-turf_war', body:expect.stringContaining('Ridgewood') }),
    ]));
  });

  it('does not turn contextual or none missions into a separate tutorial card', function () {
    const steps = getOnboardingSteps({
      ...baseSnapshot(),
      missionLessons:[
        { id:'investor', title:'Silent Investor Invitation', mode:'none', status:'offered' },
        { id:'tribune', title:'The Herald Wants an Interview', mode:'contextual', status:'active' },
      ],
    });

    expect(steps.some(function(step){ return step.id.includes('investor') || step.id.includes('tribune'); })).toBe(false);
  });

  it('prioritizes the active bank lesson with a GPS action', function () {
    const steps = getOnboardingSteps({
      ...baseSnapshot(),
      cash:1200,
      activeMissions:['home_safe_robbery'],
      eventHistory:{ home_safe_robbery:'accepted' },
      heat:82,
      hasUnderstaffedCart:true,
    });

    expect(steps[0]).toMatchObject({
      id:'bank-lesson-active',
      badge:'Active lesson',
      tone:'lesson',
      action:{ kind:'missionGps', label:'Set GPS', missionId:'home_safe_robbery' },
    });
  });

  it('shows the offered bank lesson before generic cash risk copy', function () {
    const steps = getOnboardingSteps({
      ...baseSnapshot(),
      cash:900,
      eventHistory:{ home_safe_robbery:'offered' },
    });

    expect(steps[0]).toMatchObject({
      id:'bank-lesson-offered',
      action:{ kind:'open', target:'missions', label:'Open Missions' },
    });
    expect(steps.find(function(step){ return step.id === 'bank-lesson-risk'; })).toBeUndefined();
  });

  it('suppresses the bank lesson once the player finished or declined it and falls back to the next bottleneck', function () {
    const steps = getOnboardingSteps({
      ...baseSnapshot(),
      cash:1500,
      completedMissions:['home_safe_robbery'],
      product:100,
      productCap:100,
      activeCornerCount:1,
      availableCornerCount:4,
    });

    expect(steps[0]).toMatchObject({
      id:'product-cap',
      action:{ target:'map', label:'Open map' },
    });
    expect(steps.some(function(step){ return step.id.startsWith('bank-lesson'); })).toBe(false);
  });

  it('falls back to a quiet-state card when nothing needs teaching', function () {
    const steps = getOnboardingSteps(baseSnapshot());

    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({
      id:'quiet-street',
      action:{ target:'empire', label:'Review empire' },
    });
  });
});
