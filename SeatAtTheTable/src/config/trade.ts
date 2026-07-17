import type { Corner } from './types';

export const corners: Corner[] = [
  { id:'devlinCorner', name:'Devlin & Rockwell', district:'devlin', tier:1, rate:3, consumption:1.4, dealerCost:250, x:700, y:800, dealer:false, busted:false, bustCooldownAt:0 },
  { id:'ws1', name:'Cicero & 16th', district:'westside', tier:2, rate:9, consumption:4, dealerCost:900, x:320, y:260, dealer:false, busted:false, bustCooldownAt:0 },
  { id:'ws2', name:'Pulaski Underpass', district:'westside', tier:2, rate:11, consumption:5, dealerCost:1200, x:1120, y:280, dealer:false, busted:false, bustCooldownAt:0 },
  { id:'ws3', name:'Roosevelt Yard', district:'westside', tier:3, rate:22, consumption:9, dealerCost:3200, x:500, y:800, dealer:false, busted:false, bustCooldownAt:0 },
  { id:'ws4', name:'The Warehouse Block', district:'westside', tier:3, rate:28, consumption:11, dealerCost:4200, x:1200, y:750, dealer:false, busted:false, bustCooldownAt:0 },
];
