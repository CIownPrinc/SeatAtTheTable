import type { GangRecruit } from './types';

export const gangRecruits: GangRecruit[] = [
  { id:'chino', name:'Chino', trait:'Fast and reckless', reqRespect:100, cost:1500, bonus:"Corners are 15% less likely to get busted.", inducted:false, dialogueKey:'initChino', district:'westside', x:250, y:480 },
  { id:'nadia', name:'Nadia Volkov', trait:'Knows every cop by name', reqRespect:150, cost:3000, bonus:'-10% **Heat** generation, citywide.', inducted:false, dialogueKey:'initNadia', district:'westside', x:900, y:460 },
  { id:'bird', name:'Bird', trait:'Watches the corners', reqRespect:200, cost:4500, bonus:'+15% **Income** from every corner.', inducted:false, dialogueKey:'initBird', district:'westside', x:1300, y:520 },
  { id:'les', name:'Les "Lockjaw" Tavares', trait:"Doesn't talk, doesn't run", reqRespect:300, cost:8000, bonus:'+8% Gang Strength in territory wars.', inducted:false, dialogueKey:'initLes', district:'westside', x:650, y:850 },
];
