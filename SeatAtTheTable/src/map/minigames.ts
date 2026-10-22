// LEGAL: Interactive amenity minigames. Each amenity kind maps to a small, self
// LEGAL: contained skill game that runs in its own modal overlay and resolves a
// LEGAL: MinigameResult (score + suggested reward). This module owns only presentation
// LEGAL: and input; header.ts applies the reward to game state and shows the summary.
// LEGAL: Nothing here reaches into GameState, so the pure scoring helpers stay unit
// LEGAL: testable and the games can't corrupt a save.

// LEGAL: Only interactions that are genuinely a game of skill live here (a court, a
// LEGAL: chess board). Shops (pet store, newsstand) are plain buy/sell modals built in
// LEGAL: map/amenities.ts — a memory match or a haggle bar would be a game bolted onto
// LEGAL: something that isn't one.
import type * as ThreeNamespace from 'three';
import { createChessScene, createCourtScene, type ShotResult } from './minigameScenes';

export type MinigameKind = 'basketball' | 'parkgame';

export interface MinigameReward { cash: number; respect: number; }
export interface MinigameResult {
  kind: MinigameKind;
  success: boolean;
  score: number;
  max: number;
  reward: MinigameReward;
  message: string;
  elapsedSeconds?: number;
}

// LEGAL: ---------- pure scoring logic (unit tested) ----------

// LEGAL: Basketball: marker and sweet-zone centre are both 0..1 across the power bar.
export function shotOutcome(marker: number, center: number, half: number): 'swish' | 'rim' | 'miss' {
  const d = Math.abs(marker - center);
  if(d <= half) return 'swish';
  if(d <= half * 2.1) return 'rim';
  return 'miss';
}

// LEGAL: Hard-coded "pick the winning move" tactics. answer indexes the winning option.
// LEGAL: Positions are authored (not rules-checked) so they are always correct.
export interface ChessPuzzle { fen: string; prompt: string; moves: string[]; answer: number; }
export const CHESS_PUZZLES: ChessPuzzle[] = [
  { fen:'r....rk./ppp..ppp/......../...q..../......../.....Q../PPP..PPP/R....RK.',
    prompt:'Queens face off on the open file. Best move?',
    moves:['Trade queens — Qxd5', 'Retreat — Qf1', 'Ignore it — a4'], answer:0 },
  { fen:'......../....k.../...r..../..N...../......../......../....K.../........',
    prompt:'Your knight can fork. Where to?', moves:['Ne6+ (forks nothing)', 'Nd6+ forking king & rook via e-file', 'Nb6 (passive)'], answer:1 },
  { fen:'......k./.....ppp/......../......../......q./......../.....PPP/....R.K.',
    prompt:'Back rank is thin. Find the shot.', moves:['h3 — luft', 'Re8+ then mate', 'Qxe1?? blunder'], answer:1 },
  { fen:'.....rk./ppp..ppp/..n...../......../...P..../..N...../PPP..PPP/....R.K.',
    prompt:'A pawn push wins material. Which?', moves:['d5 forking the knight', 'a3 (slow)', 'Rxe7?? nothing there'], answer:0 },
];

// LEGAL: Reward tables — modest, since these build standing rather than exploit anyone.
function basketballReward(makes: number): MinigameReward { return { cash: makes * 45, respect: makes }; }
function chessReward(solved: number): MinigameReward { return { cash: 0, respect: solved * 2 }; }

export function isFireRoadBest(previousSeconds: number, elapsedSeconds: number): boolean {
  return previousSeconds <= 0 || elapsedSeconds < previousSeconds;
}

// LEGAL: ---------- overlay shell + input ----------

let styleInjected = false;
let activeOverlay: HTMLElement | null = null;

// LEGAL: The overlay sits above the full-screen map (z-index 9999) and the phone (10000); below
// LEGAL: that it opened hidden behind the map. The panel grows with the screen but keeps the court
// LEGAL: view and its buttons inside the window on short screens.
function injectStyles(): void {
  if(styleInjected) return;
  styleInjected = true;
  const css = `
  .mg-overlay{position:fixed;inset:0;z-index:10020;display:flex;align-items:center;justify-content:center;background:rgba(6,7,10,0.72);backdrop-filter:blur(2px);font-family:var(--font-mono,'IBM Plex Mono',monospace);}
  .mg-panel{width:min(860px,94vw,calc((92dvh - 210px) * 1.765 + 36px));min-width:min(320px,94vw);max-height:96dvh;overflow:auto;background:#171922;border:1px solid var(--gold,#d4a017);border-radius:10px;padding:18px 18px 16px;box-shadow:0 24px 60px rgba(0,0,0,0.55);}
  .mg-eyebrow{font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--gold,#d4a017);opacity:0.85;}
  .mg-title{font-family:var(--font-display,inherit);font-size:19px;font-weight:600;color:#f0efe8;margin:2px 0 2px;}
  .mg-prompt{font-size:12px;color:#aab0c0;line-height:1.5;min-height:32px;}
  .mg-progress{font-size:11px;color:#c8cad8;margin:8px 0 4px;display:flex;justify-content:space-between;}
  .mg-stage{margin:8px 0 10px;}
  .mg-canvas{width:100%;display:block;border-radius:6px;background:#0e1016;border:1px solid rgba(255,255,255,0.06);cursor:pointer;}
  .mg-foot{display:flex;gap:8px;flex-wrap:wrap;}
  .mg-btn{flex:1 1 auto;font-family:var(--font-mono,monospace);font-size:12px;padding:10px 12px;border-radius:5px;border:1px solid var(--gold,#d4a017);background:var(--gold-soft,rgba(212,160,23,0.14));color:#f0efe8;cursor:pointer;transition:background .12s,border-color .12s;}
  .mg-btn:hover{background:rgba(212,160,23,0.24);}
  .mg-btn.secondary{border-color:rgba(255,255,255,0.18);background:transparent;color:#aab0c0;}
  .mg-hint{font-size:11px;color:#8a90a0;text-align:center;margin-top:2px;}
  .mg-view{position:relative;}
  .mg-3d{width:100%;display:block;border-radius:6px;aspect-ratio:600/340;}
  .mg-flash{position:absolute;left:0;right:0;top:38%;text-align:center;font:700 30px var(--font-display,sans-serif);letter-spacing:0.08em;text-shadow:0 2px 10px rgba(0,0,0,0.6);pointer-events:none;}
  .mg-meter{margin-top:8px;height:34px;}
  `;
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
}

interface Shell {
  overlay: HTMLElement;
  setPrompt: (html: string) => void;
  setProgress: (left: string, right: string) => void;
  stage: HTMLElement;
  foot: HTMLElement;
  // LEGAL: Runs when the game closes, to free its 3D view.
  onClose: (fn: () => void) => void;
  close: () => void;
}

function buildShell(eyebrow: string, title: string): Shell {
  injectStyles();
  const overlay = document.createElement('div');
  overlay.className = 'mg-overlay';
  overlay.innerHTML = `<div class="mg-panel">
    <div class="mg-eyebrow">${eyebrow}</div>
    <div class="mg-title">${title}</div>
    <div class="mg-prompt"></div>
    <div class="mg-progress"><span class="mg-prog-l"></span><span class="mg-prog-r"></span></div>
    <div class="mg-stage"></div>
    <div class="mg-foot"></div>
  </div>`;
  document.body.appendChild(overlay);
  activeOverlay = overlay;
  const cleanups: Array<() => void> = [];
  return {
    overlay,
    setPrompt: (html) => { overlay.querySelector<HTMLElement>('.mg-prompt')!.innerHTML = html; },
    setProgress: (l, r) => {
      overlay.querySelector<HTMLElement>('.mg-prog-l')!.textContent = l;
      overlay.querySelector<HTMLElement>('.mg-prog-r')!.textContent = r;
    },
    stage: overlay.querySelector<HTMLElement>('.mg-stage')!,
    foot: overlay.querySelector<HTMLElement>('.mg-foot')!,
    onClose: (fn) => { cleanups.push(fn); },
    close: () => { cleanups.forEach(fn => fn()); overlay.remove(); if(activeOverlay === overlay) activeOverlay = null; },
  };
}

// LEGAL: ---------- games ----------

// LEGAL: One canvas for every minigame, kept between games so its WebGL renderer is too
// LEGAL: (minigameScenes createView): making a new renderer each time froze the game as it opened.
let sharedCanvas: HTMLCanvasElement | null = null;
function view3d(shell: Shell): { canvas: HTMLCanvasElement; flash: HTMLElement } {
  const wrap = document.createElement('div');
  wrap.className = 'mg-view';
  sharedCanvas ??= Object.assign(document.createElement('canvas'), { className:'mg-3d', width:600, height:340 });
  const canvas = sharedCanvas;
  const flash = document.createElement('div');
  flash.className = 'mg-flash';
  wrap.append(canvas, flash);
  shell.stage.appendChild(wrap);
  return { canvas, flash };
}

// LEGAL: At the free-throw line of a real court. The timing bar sets the shot; the ball then flies
// LEGAL: on its arc: through the net, off the rim, short, or off the backboard.
function playBasketball(THREE: typeof ThreeNamespace, shell: Shell, done: (r: MinigameResult) => void): void {
  const SHOTS = 5;
  let shot = 0, makes = 0, running = true, raf = 0, inFlight = false;
  let pos = 0, dir = 1, speed = 0.9;
  const half = 0.075, center = 0.5;
  const { canvas: view, flash } = view3d(shell);
  const court = createCourtScene(THREE, view);
  shell.onClose(() => court.dispose());
  const canvas = document.createElement('canvas');
  canvas.className = 'mg-canvas mg-meter'; canvas.width = 600; canvas.height = 34;
  shell.stage.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  shell.setPrompt('Tap <strong>Shoot</strong> (or press <strong>Space</strong>) when the marker hits the gold zone. Best of 5.');

  function frame(){
    if(!running) return;
    if(!inFlight){
      pos += dir * speed * 0.016;
      if(pos > 1){ pos = 1; dir = -1; } else if(pos < 0){ pos = 0; dir = 1; }
    }
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#0e1016'; ctx.fillRect(0,0,w,h);
    const barY = 8, barH = 18, pad = 12, barW = w - pad*2;
    ctx.fillStyle = '#22252e'; ctx.fillRect(pad, barY, barW, barH);
    ctx.fillStyle = 'rgba(212,160,23,0.30)'; ctx.fillRect(pad + (center-half)*barW, barY, half*2*barW, barH);
    ctx.fillStyle = 'rgba(212,160,23,0.55)'; ctx.fillRect(pad + (center-half*2.1)*barW, barY, 2, barH);
    ctx.fillStyle = 'rgba(212,160,23,0.55)'; ctx.fillRect(pad + (center+half*2.1)*barW, barY, 2, barH);
    ctx.fillStyle = '#f0efe8'; ctx.fillRect(pad + pos*barW - 2, barY-5, 4, barH+10);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function showFlash(text: string, color: string){
    flash.textContent = text; flash.style.color = color;
    window.setTimeout(() => { if(flash.textContent === text) flash.textContent = ''; }, 700);
  }

  function shoot(){
    if(!running || inFlight) return;
    const res = shotOutcome(pos, center, half);
    let flight: ShotResult;
    if(res === 'swish') flight = 'swish';
    else if(res === 'rim') flight = Math.random() < 0.5 ? 'in-off-rim' : 'rim-out';
    else flight = pos < center ? 'short' : 'long';
    const made = flight === 'swish' || flight === 'in-off-rim';
    inFlight = true;
    shot++;
    court.shoot(flight, function(){
      inFlight = false;
      if(made) makes++;
      showFlash(flight === 'swish' ? 'SWISH' : made ? 'IN OFF THE RIM' : flight === 'rim-out' ? 'RIMMED OUT' : 'MISS', made ? '#5ad18a' : (flight === 'rim-out' ? '#d4a017' : '#e85a5a'));
      speed += 0.28; // LEGAL: each shot gets faster
      shell.setProgress(`Shot ${Math.min(shot+1, SHOTS)} of ${SHOTS}`, `Made ${makes}`);
      if(shot >= SHOTS && running){
        running = false;
        cancelAnimationFrame(raf);
        const perfect = makes === SHOTS;
        window.setTimeout(function(){
          done({ kind:'basketball', success: makes >= 3, score: makes, max: SHOTS,
            reward: basketballReward(makes),
            message: perfect ? `You drain all five at the court. The block is talking.`
              : (makes >= 3 ? `You hold your own on the court — ${makes} of ${SHOTS}.`
              : `Cold day at the court — ${makes} of ${SHOTS}. Still, you showed face.`) });
        }, 600);
      }
    });
  }
  shell.setProgress(`Shot 1 of ${SHOTS}`, `Made 0`);
  addButton(shell.foot, 'Shoot', shoot);
  addButton(shell.foot, 'Walk off', () => { running = false; cancelAnimationFrame(raf);
    done({ kind:'basketball', success:false, score:makes, max:SHOTS, reward:basketballReward(makes), message:'You head out before the game finishes.' }); }, true);
  onKey(shell.overlay, ' ', shoot);
}

// LEGAL: A stone table in the park with a real board on it; you sit on the white side.
function playChess(THREE: typeof ThreeNamespace, shell: Shell, done: (r: MinigameResult) => void): void {
  const puzzles = shuffle(CHESS_PUZZLES.slice()).slice(0, 3);
  let idx = 0, solved = 0;
  const { canvas } = view3d(shell);
  const board = createChessScene(THREE, canvas);
  shell.onClose(() => board.dispose());

  function render(){
    const p = puzzles[idx];
    board.setPosition(p.fen);
    shell.setPrompt(p.prompt);
    shell.setProgress(`Puzzle ${idx+1} of ${puzzles.length}`, `Solved ${solved}`);
    shell.foot.innerHTML = '';
    p.moves.forEach((mv, i) => addButton(shell.foot, mv, () => choose(i)));
    addButton(shell.foot, 'Concede', () => end('You tip your king and shake hands.'), true);
  }
  function choose(i: number){
    const p = puzzles[idx];
    if(i === p.answer) solved++;
    idx++;
    if(idx >= puzzles.length) end(solved === puzzles.length ? 'You run the table — the old-timers nod in respect.'
      : (solved > 0 ? `You take ${solved} of ${puzzles.length}. Not bad for a hustler.` : 'The park sharks school you today.'));
    else render();
  }
  function end(msg: string){
    done({ kind:'parkgame', success: solved > 0, score: solved, max: puzzles.length, reward: chessReward(solved), message: msg });
  }
  render();
}

// LEGAL: ---------- shared helpers ----------

function addButton(foot: HTMLElement, label: string, onClick: () => void, secondary = false): void {
  const b = document.createElement('button');
  b.className = 'mg-btn' + (secondary ? ' secondary' : '');
  b.textContent = label;
  b.onclick = onClick;
  foot.appendChild(b);
}

// LEGAL: Capture-phase key handler bound to the overlay's lifetime so the map's global
// LEGAL: movement/interact keys never fire while a minigame is up.
function onKey(overlay: HTMLElement, key: string, fn: () => void): void {
  const handler = (e: KeyboardEvent) => {
    if(e.key === key || (key === ' ' && e.code === 'Space')){ e.preventDefault(); e.stopPropagation(); fn(); }
  };
  window.addEventListener('keydown', handler, true);
  (overlay as HTMLElement & { _mgKey?: () => void })._mgKey = () => window.removeEventListener('keydown', handler, true);
}

function shuffle<T>(arr: T[]): T[] {
  for(let i = arr.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

const RUNNERS: Record<MinigameKind, (THREE: typeof ThreeNamespace, shell: Shell, done: (r: MinigameResult) => void) => void> = {
  basketball: playBasketball,
  parkgame: playChess,
};

const EYEBROWS: Record<MinigameKind, string> = {
  basketball: 'Neighborhood Court', parkgame: 'Park Tables',
};

// LEGAL: True while any minigame overlay is on screen — header gates map input on this.
export function minigameOpen(): boolean { return activeOverlay !== null; }

// LEGAL: Opens the minigame for `kind` and resolves once it ends. Reward is a suggestion;
// LEGAL: the caller decides whether/how to apply it.
export function playMinigame(THREE: typeof ThreeNamespace, kind: MinigameKind, title: string): Promise<MinigameResult> {
  return new Promise((resolve) => {
    if(activeOverlay){ resolve({ kind, success:false, score:0, max:0, reward:{cash:0,respect:0}, message:'' }); return; }
    const shell = buildShell(EYEBROWS[kind], title);
    const finish = (r: MinigameResult) => {
      const rm = (shell.overlay as HTMLElement & { _mgKey?: () => void })._mgKey;
      if(rm) rm();
      shell.close();
      resolve(r);
    };
    // LEGAL: A game that throws closes cleanly and reports it, rather than leaving its overlay up and
    // LEGAL: the map frozen behind it.
    try {
      RUNNERS[kind](THREE, shell, finish);
    } catch(error) {
      console.error('[minigame]', error);
      finish({ kind, success:false, score:0, max:0, reward:{ cash:0, respect:0 }, message:'The game fell apart. Try again in a moment.' });
    }
  });
}
