import { expect, test } from '@playwright/test';

interface MissionTestHook {
  startMission: (id: string) => void;
  resolveMission: (id: string) => void;
  enterBuilding: (kind: string, refId: string, name: string) => void;
  hotspots: () => { id: string; x: number; y: number; label: string; action: () => void }[];
  player: { x: number; y: number };
  mapPlaces: { x: number; y: number; sourceObject?: { id: string; kind?: string } }[];
  worldGroup: { children: { name: string }[] };
  state: {
    activeMissions: Record<string, { objective: { label: string } | null }>;
    waypoints: { global: { x: number; y: number } | null };
    currentInterior: { refId: string } | null;
    cash: number;
    heat: number;
    respect: number;
    worldMemory: Record<string, unknown>;
  };
}

test.describe('mission flow', function () {
  test('a phone-started mission appears in Missions and sets a physical GPS objective', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.waitForFunction(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.worldGroup.children.length > 50; });

    await page.evaluate(function(){
      (window as unknown as { __seat: MissionTestHook }).__seat.startMission('stolen_shipment');
    });

    await expect.poll(async function(){
      return page.evaluate(function(){
        return (window as unknown as { __seat: MissionTestHook }).__seat.state.activeMissions.stolen_shipment?.objective?.label;
      });
    }).toBe('Question Dockmaster Bell');

    await page.locator('#phone-btn').click();
    await page.locator('.device-app[data-app="missions"]').click();
    await expect(page.locator('#missions-panel')).toContainText('Missing Cargo');
    await expect(page.locator('#missions-panel')).toContainText('Question Dockmaster Bell');
    await expect.poll(async function(){
      return page.evaluate(function(){
        return (window as unknown as { __seat: MissionTestHook }).__seat.state.waypoints.global;
      });
    }).not.toBeNull();
    await expect.poll(async function(){
      return page.evaluate(function(){
        return (window as unknown as { __seat: MissionTestHook }).__seat.worldGroup.children.some(function(child){ return child.name === 'mission:stolen_shipment'; });
      });
    }).toBe(true);
  });

  test('a bank mission is entered from the map and adds its contact without replacing the Teller Window', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.waitForFunction(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.worldGroup.children.length > 50; });

    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.startMission('home_safe_robbery');
      const bank = seat.mapPlaces.find(function(place){ return place.sourceObject?.id === 'bankHome'; });
      if(!bank) throw new Error('First Windhaven Trust was not placed on the map');
      seat.player.x = bank.x;
      seat.player.y = bank.y;
    });
    await page.keyboard.press('e');
    await expect.poll(async function(){
      return page.evaluate(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.state.currentInterior?.refId; });
    }).toBe('bankHome');
    const labels = await page.evaluate(function(){
      return (window as unknown as { __seat: MissionTestHook }).__seat.hotspots().map(function(hotspot){ return hotspot.label; });
    });

    expect(labels).toEqual(expect.arrayContaining(['Teller Window', 'Mission Contact']));
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      const spot = seat.hotspots().find(function(h){ return h.id === 'mission'; })!;
      seat.player.x = spot.x;
      seat.player.y = spot.y;
    });
    await page.keyboard.press('e');
    await expect(page.locator('#modal-overlay')).toContainText('Keep What Is Left');
    await page.getByRole('button', { name:'Hear the teller out', exact:true }).click();
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      const spot = seat.hotspots().find(function(h){ return ['teller', 'clerk', 'counter', 'register', 'frontdesk', 'mission', 'wartable'].includes(h.id); })!;
      seat.player.x = spot.x;
      seat.player.y = spot.y;
    });
    await page.keyboard.press('e');
    await expect(page.locator('#modal-overlay')).toContainText('The Teller Has Seen This Before');
  });

  test('the Pigeon Summit advances through City Hall and saves a comic civic outcome', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.waitForFunction(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.worldGroup.children.length > 50; });

    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.state.heat = 60;
      seat.startMission('pigeon_summit');
      seat.resolveMission('pigeon_summit');
    });
    await page.getByRole('button', { name:'Sign the official bird liaison waiver', exact:true }).click();

    await expect.poll(async function(){
      return page.evaluate(function(){
        return (window as unknown as { __seat: MissionTestHook }).__seat.state.activeMissions.pigeon_summit?.objective?.label;
      });
    }).toBe('Meet the pigeon delegation at Wabash Newsstand');

    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      const newsstand = seat.mapPlaces.find(function(place){ return place.sourceObject?.id === 'wicker-news'; });
      if(!newsstand) throw new Error('Wabash Newsstand was not placed on the map');
      seat.player.x = newsstand.x;
      seat.player.y = newsstand.y;
    });
    await page.keyboard.press('e');
    await page.getByRole('button', { name:'Give the flock a public apology (+12 respect, up to -4 heat)', exact:true }).click();
    await expect(page.locator('#modal-overlay')).toContainText('Mission Result');
    await expect(page.locator('#modal-overlay')).toContainText('respect +12; heat -4; pigeon truce recorded');
    await expect(page.locator('#modal-overlay')).toContainText('Exact changes: respect +12; heat -4');
  });

  test("the mayor's parrot creates a second physical comic mission route", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.waitForFunction(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.worldGroup.children.length > 50; });

    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.startMission('mayors_parrot');
      seat.resolveMission('mayors_parrot');
    });
    await page.getByRole('button', { name:'Invoice City Hall $250 for bird consulting', exact:true }).click();
    await expect.poll(async function(){
      return page.evaluate(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.state.activeMissions.mayors_parrot?.objective?.label; });
    }).toBe('Find the parrot at Rockwell Pet Supply');
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      const petStore = seat.mapPlaces.find(function(place){ return place.sourceObject?.id === 'rockwell-pets'; });
      if(!petStore) throw new Error('Rockwell Pet Supply was not placed on the map');
      seat.player.x = petStore.x;
      seat.player.y = petStore.y;
    });
    await page.keyboard.press('e');
    await page.getByRole('button', { name:'Let it give one press conference', exact:true }).click();
    await expect(page.locator('#modal-overlay')).toContainText('Exact changes: +$250; respect +16; heat +6');
  });

  test('the goose permit makes the Drive-In a physical comic mission destination', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.waitForFunction(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.worldGroup.children.length > 50; });
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.startMission('goose_permit');
      seat.resolveMission('goose_permit');
    });
    await page.getByRole('button', { name:'Invoice City Hall $180 for permit review', exact:true }).click();
    await expect.poll(async function(){
      return page.evaluate(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.state.activeMissions.goose_permit?.objective?.label; });
    }).toBe('Meet the permit holder at Boundary Meadows Drive-In');
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      const driveIn = seat.mapPlaces.find(function(place){ return place.sourceObject?.id === 'driveInBoundary'; });
      if(!driveIn) throw new Error('Boundary Meadows Drive-In was not placed on the map');
      seat.player.x = driveIn.x;
      seat.player.y = driveIn.y;
    });
    await page.keyboard.press('e');
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      const spot = seat.hotspots().find(function(h){ return h.id === 'mission'; })!;
      seat.player.x = spot.x;
      seat.player.y = spot.y;
    });
    await page.keyboard.press('e');
    await expect(page.locator('#modal-overlay')).toContainText('A Bird in the Best Space');
    await page.getByRole('button', { name:'Offer it a better parking space', exact:true }).click();
    await expect(page.locator('#modal-overlay')).toContainText('Exact changes: +$180; respect +12; heat +3');
  });

  test('the Herald interview is entered from its map destination and requires a follow-up answer', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.waitForFunction(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.worldGroup.children.length > 50; });

    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.startMission('tribune');
      const herald = seat.mapPlaces.find(function(place){ return place.sourceObject?.id === 'heraldHq'; });
      if(!herald) throw new Error('Windhaven Herald HQ was not placed on the map');
      seat.player.x = herald.x;
      seat.player.y = herald.y;
    });
    await page.keyboard.press('e');
    await expect.poll(async function(){
      return page.evaluate(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.state.currentInterior?.refId; });
    }).toBe('heraldHq');
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      const spot = seat.hotspots().find(function(h){ return ['teller', 'clerk', 'counter', 'register', 'frontdesk', 'mission', 'wartable'].includes(h.id); })!;
      seat.player.x = spot.x;
      seat.player.y = spot.y;
    });
    await page.keyboard.press('e');
    await page.getByRole('button', { name:'A business that belongs to the neighborhood', exact:true }).click();
    await expect(page.locator('#modal-overlay')).toContainText('Lana asks who pays when growth changes the block.');
    await page.getByRole('button', { name:'Give her the hiring and neighborhood plan', exact:true }).click();
    await expect(page.locator('#modal-overlay')).toContainText('legit income +25% for 75 seconds; prestige tier unlocked');
  });

  test('a professional Herald profile creates a physical sponsor follow-up', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.state.worldMemory.pressTone = 'professional';
      seat.state.worldMemory.pressArticle = 'The Builder of Devlin';
      seat.startMission('press_followup');
      seat.resolveMission('press_followup');
    });
    await expect(page.locator('#modal-overlay')).toContainText('A Sponsor Who Read the Profile');
    await page.getByRole('button', { name:'Take the clean sponsorship (+$1,200)', exact:true }).click();
    await expect(page.locator('#modal-overlay')).toContainText('trade-group sponsor contact recorded');
  });

  test('a high-leverage Investor negotiation saves the sponsor contact', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.state.respect = 150;
      seat.startMission('investor');
      seat.resolveMission('investor');
    });
    await page.getByRole('button', { name:'Negotiate (1 prestige or 150 respect)', exact:true }).click();
    await expect(page.locator('#modal-overlay')).toContainText('sponsor lead recorded');
    const sponsorUnlocked = await page.evaluate(function(){
      return (window as unknown as { __seat: MissionTestHook }).__seat.state.worldMemory.investorSponsorAvailable;
    });
    expect(sponsorUnlocked).toBe(true);
  });

  test('Inspector compliance closes only the named inspected venture', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.startMission('inspector');
      seat.resolveMission('inspector');
    });
    await page.getByRole('button', { name:"Comply: close Kailash's Cart for 60s", exact:true }).click();
    await expect(page.locator('#modal-overlay')).toContainText("Kailash's Cart income -30% for 60 seconds; other ventures unaffected");
  });

  test('City Hall handles political actions at its physical clerk window', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.waitForFunction(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.worldGroup.children.length > 50; });
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      const cityHall = seat.mapPlaces.find(function(place){ return place.sourceObject?.id === 'cityhall'; });
      if(!cityHall) throw new Error('City Hall was not placed on the map');
      seat.state.cash = 10_000;
      seat.player.x = cityHall.x;
      seat.player.y = cityHall.y;
    });
    await page.keyboard.press('e');
    await expect.poll(async function(){
      return page.evaluate(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.state.currentInterior?.refId; });
    }).toBe('cityhall');
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      const spot = seat.hotspots().find(function(h){ return ['teller', 'clerk', 'counter', 'register', 'frontdesk', 'mission', 'wartable'].includes(h.id); })!;
      seat.player.x = spot.x;
      seat.player.y = spot.y;
    });
    await page.keyboard.press('e');
    await expect(page.locator('#modal-overlay')).toContainText("Clerk's Window");
    await expect(page.getByRole('button', { name:/Fund influence/ })).toBeVisible();
  });

  test('refusing the bagman creates an in-person City Hall audit with a named venture penalty', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.waitForFunction(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.worldGroup.children.length > 50; });
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.state.cash = 10_000;
      seat.state.worldMemory.inspectionVentureId = 'cart';
      seat.startMission('tax_audit');
      const cityHall = seat.mapPlaces.find(function(place){ return place.sourceObject?.id === 'cityhall'; });
      if(!cityHall) throw new Error('City Hall was not placed on the map');
      seat.player.x = cityHall.x;
      seat.player.y = cityHall.y;
    });
    await page.keyboard.press('e');
    await expect.poll(async function(){
      return page.evaluate(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.state.currentInterior?.refId; });
    }).toBe('cityhall');
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      const spot = seat.hotspots().find(function(h){ return h.id === 'mission'; })!;
      seat.player.x = spot.x;
      seat.player.y = spot.y;
    });
    await page.keyboard.press('e');
    await expect(page.locator('#modal-overlay')).toContainText('The Audit Notice');
    await page.getByRole('button', { name:"Contest it (Kailash's Cart income -50% for 90s)", exact:true }).click();
    await expect(page.locator('#modal-overlay')).toContainText("Kailash's Cart income -50% for 90 seconds; audit contested");
  });

  test('the Chop Shop exposes the armory in person instead of requiring the Gang tab', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.state.cash = 10_000;
      seat.enterBuilding('local', 'chopshop', 'West Side Chop Shop');
    });
    const labels = await page.evaluate(function(){
      return (window as unknown as { __seat: MissionTestHook }).__seat.hotspots().map(function(hotspot){ return hotspot.label; });
    });
    expect(labels).toContain('The Armory');
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      const spot = seat.hotspots().find(function(h){ return h.id === 'armory'; })!;
      seat.player.x = spot.x;
      seat.player.y = spot.y;
    });
    await page.keyboard.press('e');
    await expect(page.locator('#modal-overlay')).toContainText('The Armory');
    await expect(page.getByRole('button', { name:/Buy 5 guns/ })).toBeVisible();
  });

  test('the Marigold Lounge hosts the physical gang war table', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.evaluate(function(){
      (window as unknown as { __seat: MissionTestHook }).__seat.enterBuilding('missionOffice', 'marigoldLounge', 'Marigold Lounge');
    });
    const labels = await page.evaluate(function(){
      return (window as unknown as { __seat: MissionTestHook }).__seat.hotspots().map(function(hotspot){ return hotspot.label; });
    });
    expect(labels).toContain('The Back-Room Table');
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      const spot = seat.hotspots().find(function(h){ return ['teller', 'clerk', 'counter', 'register', 'frontdesk', 'mission', 'wartable'].includes(h.id); })!;
      seat.player.x = spot.x;
      seat.player.y = spot.y;
    });
    await page.keyboard.press('e');
    await expect(page.locator('#modal-overlay')).toContainText('The Back-Room Table');
    await expect(page.getByRole('button', { name:'Set the operation in motion', exact:true })).toBeVisible();
  });

  test('Mudster Trailhead is a real country dealership on the map', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    const found = await page.evaluate(function(){
      return (window as unknown as { __seat: MissionTestHook }).__seat.mapPlaces.some(function(place){ return place.sourceObject?.id === 'mudsterTrailhead'; });
    });
    expect(found).toBe(true);
    await page.evaluate(function(){
      (window as unknown as { __seat: MissionTestHook }).__seat.enterBuilding('dealership', 'mudsterTrailhead', 'Mudster Kestrel Trailhead');
    });
    const labels = await page.evaluate(function(){
      return (window as unknown as { __seat: MissionTestHook }).__seat.hotspots().map(function(hotspot){ return hotspot.label; });
    });
    expect(labels).toEqual(expect.arrayContaining(['Sales Desk', 'Showroom Floor']));
  });

  test('the first heist makes the player choose between the vault and a safe exit', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.waitForFunction(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.worldGroup.children.length > 50; });

    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.startMission('first_heist');
      seat.resolveMission('first_heist');
    });
    await page.getByRole('button', { name:'Pick the fast smash approach', exact:true }).click();
    await page.evaluate(function(){
      (window as unknown as { __seat: MissionTestHook }).__seat.resolveMission('first_heist');
    });
    await expect(page.locator('#modal-overlay')).toContainText('Execution Window');
    await page.getByRole('button', { name:'Leave with the cashier bundles', exact:true }).click();
    await expect(page.locator('#modal-overlay')).toContainText('$450 gained; heat +5; vault left untouched');
    await expect(page.locator('#modal-overlay')).toContainText('Exact changes: +$450; heat +5');
  });

  test('the heist room has an in-world security desk with concrete bank intelligence', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.evaluate(function(){
      (window as unknown as { __seat: MissionTestHook }).__seat.enterBuilding('heist', 'heistTarget', 'First Windhaven Trust');
    });
    const labels = await page.evaluate(function(){
      return (window as unknown as { __seat: MissionTestHook }).__seat.hotspots().map(function(hotspot){ return hotspot.label; });
    });
    expect(labels).toEqual(expect.arrayContaining(['Case the Banks', 'Security Office']));
    await page.evaluate(function(){
      const hotspot = (window as unknown as { __seat: MissionTestHook }).__seat.hotspots()
        .find(function(candidate){ return candidate.label === 'Security Office'; });
      if(!hotspot) throw new Error('Security Office hotspot was not available');
      hotspot.action();
    });
    await expect(page.locator('#modal-overlay')).toContainText('Casing Notes');
    await expect(page.locator('#modal-overlay')).toContainText('Lakeside Offshore');
    await expect(page.locator('#modal-overlay')).toContainText('payout 160% of the normal take');
  });

  test('the raccoon keycard side mission moves from City Hall to the herbalist before resolving', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.state.heat = 15;
      seat.startMission('raccoon_keycard');
      seat.enterBuilding('cityhall', 'cityhall', 'City Hall Annex');
      const contact = seat.hotspots().find(function(hotspot){ return hotspot.label === 'Mission Contact'; });
      if(!contact) throw new Error('City Hall mission contact was not available');
      contact.action();
    });
    await expect(page.locator('#modal-overlay')).toContainText('The Raccoon Has a Keycard');
    await page.getByRole('button', { name:'Call it a civic wildlife initiative', exact:true }).click();
    await expect.poll(async function(){
      return page.evaluate(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.state.activeMissions.raccoon_keycard?.objective?.label; });
    }).toBe('Collect the public lure from Golden Lotus');
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.enterBuilding('local', 'herbalist', 'Golden Lotus Herbalist');
      const contact = seat.hotspots().find(function(hotspot){ return hotspot.label === 'Mission Contact'; });
      if(!contact) throw new Error('Herbalist mission contact was not available');
      contact.action();
    });
    await expect(page.locator('#modal-overlay')).toContainText('A Proper Raccoon Lure');
    await page.getByRole('button', { name:'Use the fairground lure (up to -5 heat, +$140)', exact:true }).click();
    await expect(page.locator('#modal-overlay')).toContainText('Exact changes: +$140; respect +5; heat -5');
  });

  test('paid choices you cannot afford are disabled, and capped results report what really changed', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.startMission('mayors_parrot');
      seat.resolveMission('mayors_parrot');
    });
    await page.getByRole('button', { name:'Give the city an official statement', exact:true }).click();
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.state.cash = 50;
      seat.resolveMission('mayors_parrot');
    });
    await expect(page.getByRole('button', { name:'Buy sunflower seeds ($75)', exact:true })).toBeDisabled();
    // LEGAL: Heat cools fastest near the top, so set it and choose in the same instant.
    await page.getByRole('button', { name:'Let it give one press conference', exact:true }).evaluate(function(button){
      (window as unknown as { __seat: MissionTestHook }).__seat.state.heat = 97;
      (button as HTMLButtonElement).click();
    });
    await expect(page.locator('#modal-overlay')).toContainText('respect +16; heat +3; parrot press conference recorded');
    await expect(page.locator('#modal-overlay')).toContainText('Exact changes: respect +16; heat +3');
  });

  test('Missing Cargo offers a physical dockside evidence beat before the Dockmaster conversation', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.startMission('stolen_shipment');
      seat.enterBuilding('missionOffice', 'docksDockmaster', 'Docks Dockmaster');
    });
    const labels = await page.evaluate(function(){
      return (window as unknown as { __seat: MissionTestHook }).__seat.hotspots().map(function(hotspot){ return hotspot.label; });
    });
    expect(labels).toEqual(expect.arrayContaining(['Mission Contact', 'Manifest Board']));
    await page.evaluate(function(){
      const manifest = (window as unknown as { __seat: MissionTestHook }).__seat.hotspots()
        .find(function(hotspot){ return hotspot.label === 'Manifest Board'; });
      if(!manifest) throw new Error('Manifest Board hotspot was not available');
      manifest.action();
    });
    await expect(page.locator('#modal-overlay')).toContainText('The Blank Manifest Slot');
    await page.getByRole('button', { name:"Circle Deke's stamp and confront Bell", exact:true }).click();
    await page.evaluate(function(){
      const contact = (window as unknown as { __seat: MissionTestHook }).__seat.hotspots()
        .find(function(hotspot){ return hotspot.label === 'Mission Contact'; });
      if(!contact) throw new Error('Dockmaster mission contact was not available');
      contact.action();
    });
    await expect(page.locator('#modal-overlay')).toContainText("You put Deke's stamped carbon copy on Bell's desk");
  });

  test('attacking the Rival Crew immediately creates the physical Turf War objective', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name:'Start', exact:true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: MissionTestHook }).__seat; });
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: MissionTestHook }).__seat;
      seat.startMission('rival');
      seat.resolveMission('rival');
    });
    await page.getByRole('button', { name:'Attack (starts turf war)', exact:true }).click();
    await expect.poll(async function(){
      return page.evaluate(function(){ return (window as unknown as { __seat: MissionTestHook }).__seat.state.activeMissions.turf_war?.objective?.label; });
    }).toMatch(/^Defend /);
    await expect(page.locator('#modal-overlay')).toContainText('Turf War started');
  });
});
