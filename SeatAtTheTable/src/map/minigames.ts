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
export type MinigameKind = 'basketball' | 'parkgame';

export interface MinigameReward { cash: number; respect: number; }
export interface MinigameResult {
  kind: MinigameKind;
  success: boolean;
  score: number;
  max: number;
  reward: MinigameReward;
  message: string;
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

// LEGAL: ---------- overlay shell + input ----------

let styleInjected = false;
let activeOverlay: HTMLElement | null = null;

function injectStyles(): void {
  if(styleInjected) return;
  styleInjected = true;
  const css = `
  .mg-overlay{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(6,7,10,0.72);backdrop-filter:blur(2px);font-family:var(--font-mono,'IBM Plex Mono',monospace);}
  .mg-panel{width:min(440px,92vw);background:#171922;border:1px solid var(--gold,#d4a017);border-radius:10px;padding:18px 18px 16px;box-shadow:0 24px 60px rgba(0,0,0,0.55);}
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
  .mg-board{display:grid;grid-template-columns:repeat(8,1fr);width:200px;margin:0 auto 8px;border:2px solid #3a3f4a;border-radius:4px;overflow:hidden;}
  .mg-sq{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;}
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
  return {
    overlay,
    setPrompt: (html) => { overlay.querySelector<HTMLElement>('.mg-prompt')!.innerHTML = html; },
    setProgress: (l, r) => {
      overlay.querySelector<HTMLElement>('.mg-prog-l')!.textContent = l;
      overlay.querySelector<HTMLElement>('.mg-prog-r')!.textContent = r;
    },
    stage: overlay.querySelector<HTMLElement>('.mg-stage')!,
    foot: overlay.querySelector<HTMLElement>('.mg-foot')!,
    close: () => { overlay.remove(); if(activeOverlay === overlay) activeOverlay = null; },
  };
}

// LEGAL: ---------- games ----------

function playBasketball(shell: Shell, done: (r: MinigameResult) => void): void {
  const SHOTS = 5;
  let shot = 0, makes = 0, running = true, raf = 0;
  let pos = 0, dir = 1, speed = 0.9;
  const half = 0.075, center = 0.5;
  const canvas = document.createElement('canvas');
  canvas.className = 'mg-canvas'; canvas.width = 400; canvas.height = 120;
  shell.stage.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  let flash = '';
  let flashUntil = 0;
  shell.setPrompt('Tap <strong>Shoot</strong> (or press <strong>Space</strong>) when the marker hits the gold zone. Best of 5.');

  function frame(t: number){
    if(!running) return;
    pos += dir * speed * 0.016;
    if(pos > 1){ pos = 1; dir = -1; } else if(pos < 0){ pos = 0; dir = 1; }
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#0e1016'; ctx.fillRect(0,0,w,h);
    const barY = 66, barH = 20, pad = 20, barW = w - pad*2;
    ctx.fillStyle = '#22252e'; ctx.fillRect(pad, barY, barW, barH);
    ctx.fillStyle = 'rgba(212,160,23,0.30)'; ctx.fillRect(pad + (center-half)*barW, barY, half*2*barW, barH);
    ctx.fillStyle = 'rgba(212,160,23,0.55)'; ctx.fillRect(pad + (center-half*2.1)*barW, barY, 2, barH);
    ctx.fillStyle = 'rgba(212,160,23,0.55)'; ctx.fillRect(pad + (center+half*2.1)*barW, barY, 2, barH);
    ctx.fillStyle = '#f0efe8'; ctx.fillRect(pad + pos*barW - 2, barY-6, 4, barH+12);
    // LEGAL: hoop
    ctx.strokeStyle = '#d4693a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(w/2, 26, 14, 0, Math.PI*2); ctx.stroke();
    if(flash && t < flashUntil){
      ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = flash === 'SWISH' ? '#4a9a5a' : (flash === 'RIM' ? '#d4a017' : '#c0392b');
      ctx.fillText(flash, w/2, 52);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function shoot(){
    if(!running) return;
    const res = shotOutcome(pos, center, half);
    if(res === 'swish'){ makes++; flash = 'SWISH'; }
    else if(res === 'rim'){ if(Math.random() < 0.5) makes++; flash = 'RIM'; }
    else flash = 'MISS';
    flashUntil = performance.now() + 500;
    shot++;
    speed += 0.28; // LEGAL: each shot gets faster
    shell.setProgress(`Shot ${Math.min(shot+1, SHOTS)} of ${SHOTS}`, `Made ${makes}`);
    if(shot >= SHOTS){
      running = false;
      cancelAnimationFrame(raf);
      const perfect = makes === SHOTS;
      done({ kind:'basketball', success: makes >= 3, score: makes, max: SHOTS,
        reward: basketballReward(makes),
        message: perfect ? `You drain all five at the court. The block is talking.`
          : (makes >= 3 ? `You hold your own on the court — ${makes} of ${SHOTS}.`
          : `Cold day at the court — ${makes} of ${SHOTS}. Still, you showed face.`) });
    }
  }
  shell.setProgress(`Shot 1 of ${SHOTS}`, `Made 0`);
  addButton(shell.foot, 'Shoot', shoot);
  addButton(shell.foot, 'Walk off', () => { running = false; cancelAnimationFrame(raf);
    done({ kind:'basketball', success:false, score:makes, max:SHOTS, reward:basketballReward(makes), message:'You head out before the game finishes.' }); }, true);
  onKey(shell.overlay, ' ', shoot);
}

function playChess(shell: Shell, done: (r: MinigameResult) => void): void {
  const puzzles = shuffle(CHESS_PUZZLES.slice()).slice(0, 3);
  let idx = 0, solved = 0;
  const board = document.createElement('div'); board.className = 'mg-board';
  shell.stage.appendChild(board);
  const pieces: Record<string, string> = { r:'♜', n:'♞', b:'♝', q:'♛', k:'♚', p:'♟', R:'♖', N:'♘', B:'♗', Q:'♕', K:'♔', P:'♙' };

  function render(){
    const p = puzzles[idx];
    board.innerHTML = '';
    const rows = p.fen.split('/');
    rows.forEach((row, r) => {
      for(let c = 0; c < 8; c++){
        const ch = row[c] ?? '.';
        const sq = document.createElement('div'); sq.className = 'mg-sq';
        sq.style.background = (r + c) % 2 === 0 ? '#4a4a52' : '#2f2f37';
        sq.textContent = pieces[ch] ?? '';
        sq.style.color = ch === ch.toLowerCase() ? '#181a20' : '#f4f2ea';
        board.appendChild(sq);
      }
    });
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

const RUNNERS: Record<MinigameKind, (shell: Shell, done: (r: MinigameResult) => void) => void> = {
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
export function playMinigame(kind: MinigameKind, title: string): Promise<MinigameResult> {
  return new Promise((resolve) => {
    if(activeOverlay){ resolve({ kind, success:false, score:0, max:0, reward:{cash:0,respect:0}, message:'' }); return; }
    const shell = buildShell(EYEBROWS[kind], title);
    const finish = (r: MinigameResult) => {
      const rm = (shell.overlay as HTMLElement & { _mgKey?: () => void })._mgKey;
      if(rm) rm();
      shell.close();
      resolve(r);
    };
    RUNNERS[kind](shell, finish);
  });
}
