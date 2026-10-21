// LEGAL: Using something in a room: instead of a bare text popup, the camera moves in to look at the
// LEGAL: thing itself (the desk's screen, the notice board, the workbench), and the popup is drawn as
// LEGAL: that thing, a screen, a cork board, a clipboard. Talking to a person keeps the usual popup.
// LEGAL: Distances are in room units (map/interiorLayout), measured from where you stand: the thing
// LEGAL: sits `depth` toward the back wall, its face `height` up; the camera stands `back` from it,
// LEGAL: `eye` up.
export type CloseUpSkin = 'screen' | 'board' | 'clipboard' | 'paper' | 'blueprint' | 'steel' | 'felt' | 'slot' | 'menu' | 'map';

export interface CloseUp { skin: CloseUpSkin; depth: number; height: number; back: number; eye: number }

const VIEWS: Record<CloseUpSkin, Omit<CloseUp, 'skin'>> = {
  screen:   { depth:30, height:38, back:26, eye:42 },
  board:    { depth:26, height:46, back:42, eye:48 },
  clipboard:{ depth:24, height:32, back:30, eye:52 },
  paper:    { depth:26, height:28, back:32, eye:44 },
  blueprint:{ depth:24, height:28, back:26, eye:54 },
  steel:    { depth:22, height:18, back:30, eye:32 },
  felt:     { depth:40, height:26, back:36, eye:50 },
  slot:     { depth:26, height:33, back:24, eye:36 },
  menu:     { depth:26, height:32, back:32, eye:40 },
  map:      { depth:30, height:28, back:30, eye:58 },
};

// LEGAL: Skins printed light (paper, a clipboard, a map): the popup's text turns dark on them.
export const LIGHT_SKINS: ReadonlySet<CloseUpSkin> = new Set(['board', 'clipboard', 'paper', 'map']);

function skinFor(spotId: string, kind: string): CloseUpSkin | null {
  if(spotId.startsWith('shop:')) return 'paper';
  switch(spotId){
    case 'backoffice': case 'security-desk': return 'screen';
    case 'board': case 'notices': case 'manifest': return 'board';
    case 'floor': return kind === 'brokerage' ? 'board' : null;
    case 'bench': case 'bay': case 'trailhead': return 'clipboard';
    case 'teller': case 'clerk': case 'frontdesk': case 'register': case 'counter': case 'fleet': return 'paper';
    case 'vault': return kind === 'heist' ? 'blueprint' : 'steel';
    case 'tables': return 'felt';
    case 'slots': return 'slot';
    case 'bar': return 'menu';
    case 'wartable': return 'map';
    default: return null;
  }
}

export function closeUpFor(spotId: string, kind: string): CloseUp | null {
  const skin = skinFor(spotId, kind);
  return skin ? { skin, ...VIEWS[skin] } : null;
}
