import { test, expect, type Page } from '@playwright/test';

// LEGAL: Walks into every enterable building and presses every hotspot inside it. A hotspot must
// LEGAL: do SOMETHING a player can see (open a popup, the phone, a minigame, leave the room, change
// LEGAL: state or write to the street log) and must never throw. This is the in-browser check for
// LEGAL: the venture / crew / exploit modals that were only ever verified by reading the code.

interface SweepHook {
  state: Record<string, unknown> & { currentInterior: unknown; nextEventAt: number; cash: number; respect: number; influence: number };
  mapObjects: { kind: string; id: string; ref: { kind?: string; name?: string; biz?: { name: string } } }[];
  enterBuilding: (kind: string, refId: string, name: string) => void;
  hotspots: () => { label: string; action: () => void }[];
}

interface Visit { kind: string; refId: string; name: string }
interface Finding { place: string; hotspot: string; problem: string }

async function boot(page: Page): Promise<void> {
  // LEGAL: The game saves on beforeunload, so a re-boot mid-sweep would find a save and show
  // LEGAL: "Start New Game" instead of "Start". Confirm it and wait for the reload it triggers.
  await page.goto('/');
  const start = page.locator('#start-game-btn');
  const label = await start.textContent();
  await start.click();
  if(label?.includes('New Game')) await Promise.all([page.waitForEvent('load'), page.locator('#confirm-new-game-btn').click()]);
  await expect(page.locator('#start-screen')).toHaveClass(/hidden/);
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: SweepHook }).__seat; });
}

async function visitsFor(page: Page, objectKind: string): Promise<Visit[]> {
  return page.evaluate(function(kind){
    const seat = (window as unknown as { __seat: SweepHook }).__seat;
    return seat.mapObjects.filter(function(o){ return o.kind === kind; }).map(function(o){
      if(kind === 'building') return { kind:'venture', refId:o.id, name:o.ref.biz?.name ?? o.id };
      if(kind === 'local') return { kind:'local', refId:o.id, name:o.ref.name ?? o.id };
      return { kind:o.ref.kind ?? 'service', refId:o.id, name:o.ref.name ?? o.id };
    });
  }, objectKind);
}

async function pressHotspot(page: Page, visit: Visit, index: number): Promise<{ label: string; outcome: string } | null> {
  return page.evaluate(function(args){
    const seat = (window as unknown as { __seat: SweepHook }).__seat;
    Object.assign(seat.state, { cash:50000, respect:500, influence:200, nextEventAt:Number.MAX_SAFE_INTEGER });
    document.getElementById('modal-overlay')!.classList.add('hidden');
    // LEGAL: Close a wardrobe left open by the previous press the way a player would.
    document.querySelector<HTMLButtonElement>('#wardrobe-overlay .wardrobe-cancel')?.click();
    seat.enterBuilding(args.visit.kind, args.visit.refId, args.visit.name);
    const spots = seat.hotspots();
    const spot = spots[args.index];
    if(!spot) return null;
    const visible = function(): string {
      return [
        document.getElementById('modal-overlay')!.classList.contains('hidden') ? '' : 'modal',
        document.getElementById('device-overlay')!.classList.contains('hidden') ? '' : 'device',
        document.querySelector('.mg-overlay') ? 'minigame' : '',
        document.getElementById('wardrobe-overlay') ? 'wardrobe' : '',
      ].join('');
    };
    const stateKey = function(): string { return JSON.stringify(seat.state, function(_k, v){ return v instanceof Set ? [...v] : v; }); };
    const logCount = function(): number { return document.querySelectorAll('#street-log *, #log *, .log-entry').length; };
    const before = { overlay:visible(), state:stateKey(), log:logCount(), interior:JSON.stringify(seat.state.currentInterior) };
    try { spot.action(); } catch(error){ return { label:spot.label, outcome:'THREW ' + String(error) }; }
    const opened = visible();
    if(opened && opened !== before.overlay) return { label:spot.label, outcome:opened };
    if(JSON.stringify(seat.state.currentInterior) !== before.interior) return { label:spot.label, outcome:'moved' };
    if(logCount() !== before.log) return { label:spot.label, outcome:'logged' };
    if(stateKey() !== before.state) return { label:spot.label, outcome:'state' };
    return { label:spot.label, outcome:'NOTHING' };
  }, { visit, index });
}

interface SweepReport { findings: Finding[]; places: number; pressed: number; outcomes: Record<string, number> }

async function sweep(page: Page, objectKind: string): Promise<SweepReport> {
  const pageErrors: string[] = [];
  page.on('pageerror', function(error){ pageErrors.push(error.message); });
  await boot(page);
  const findings: Finding[] = [];
  const visits = await visitsFor(page, objectKind);
  const outcomes: Record<string, number> = {};
  let pressed = 0;
  for(const visit of visits){
    for(let index = 0; index < 12; index += 1){
      const errorsBefore = pageErrors.length;
      const result = await pressHotspot(page, visit, index);
      if(!result) break;
      pressed += 1;
      outcomes[result.outcome] = (outcomes[result.outcome] ?? 0) + 1;
      if(result.outcome.startsWith('THREW') || result.outcome === 'NOTHING') findings.push({ place:visit.name, hotspot:result.label, problem:result.outcome });
      await page.waitForTimeout(60);
      if(pageErrors.length > errorsBefore) findings.push({ place:visit.name, hotspot:result.label, problem:'page error: ' + pageErrors.slice(errorsBefore).join(' | ') });
      if(result.outcome.includes('minigame') || result.outcome.includes('device')){
        await boot(page);
        continue;
      }
      if(result.outcome !== 'modal') continue;
      const buttonCount = await page.locator('#modal-footer button').count();
      for(let choice = 0; choice < buttonCount; choice += 1){
        const choiceErrorsBefore = pageErrors.length;
        await pressHotspot(page, visit, index);
        const choiceLabel = await page.evaluate(function(n){
          const button = document.querySelectorAll<HTMLButtonElement>('#modal-footer button')[n];
          if(!button) return null;
          const label = button.textContent ?? '';
          try { button.click(); } catch(error){ return 'THREW ' + String(error); }
          return label;
        }, choice);
        pressed += 1;
        await page.waitForTimeout(60);
        if(choiceLabel?.startsWith('THREW')) findings.push({ place:visit.name, hotspot:`${result.label} → button ${choice}`, problem:choiceLabel });
        if(pageErrors.length > choiceErrorsBefore) findings.push({ place:visit.name, hotspot:`${result.label} → "${choiceLabel}"`, problem:'page error: ' + pageErrors.slice(choiceErrorsBefore).join(' | ') });
        if(await page.locator('.mg-overlay').count() || await page.locator('#device-overlay:not(.hidden)').count()) await boot(page);
      }
    }
  }
  return { findings, places:visits.length, pressed, outcomes };
}

test.describe('every hotspot in every building does something and never throws', function () {
  for(const kind of ['building', 'service', 'local']){
    test(`${kind} interiors`, async ({ page }) => {
      test.setTimeout(600_000);
      const { findings, places, pressed, outcomes } = await sweep(page, kind);
      expect(places, `${kind}: places found`).toBeGreaterThan(0);
      expect(pressed, `${kind}: hotspots pressed`).toBeGreaterThanOrEqual(places);
      console.log(`SWEEP ${kind}: ${places} places, ${pressed} hotspots ${JSON.stringify(outcomes)}, ${findings.length} problem(s)\n` + findings.map(function(f){ return `  ${f.place} → "${f.hotspot}": ${f.problem}`; }).join('\n'));
      expect(findings).toEqual([]);
    });
  }
});
