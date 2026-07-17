import { ICONS } from './icons';
import type { Business, BusinessConfig, Rank } from './types';

const ventureDefs: BusinessConfig[] = [
  { id:'cart', name:"Kailash's Cart", flavor:"Chaat masala on a cheap bun. The regulars start lining up before sunrise.", category:'legit', icon:ICONS.cart, baseCost:10, researchCost:0, baseIncome:0.25, unlock:{type:'start'}, crewBaseCost:6, managerLevelReq:12, managerName:'Nikhil, the Cart Foreman' },
  { id:'store', name:"Corner Store", flavor:"Cigarettes, scratch tickets, and a register that never balances.", category:'legit', icon:ICONS.store, baseCost:150, researchCost:90, baseIncome:1.5, unlock:{type:'cash', value:120}, crewBaseCost:42, managerLevelReq:12, managerName:'Priya, Store Manager' },
  { id:'laundromat', name:"Sudsy Laundromat", flavor:"Quarters in, cash out. Nobody asks questions about the back room.", category:'legit', icon:ICONS.laundry, baseCost:600, researchCost:350, baseIncome:5, unlock:{type:'cash', value:500}, crewBaseCost:154, managerLevelReq:14, managerName:'Big Tomasz' },
  { id:'backroom_cards', name:"Backroom Card Games", flavor:"High-stakes poker runs after hours. The house takes 5% of every pot.", category:'street', icon:ICONS.cards, baseCost:3500, researchCost:1800, baseIncome:20, heatPerLevel:0.3, unlock:{type:'respect', value:25}, crewBaseCost:840, managerLevelReq:14, managerName:'Dealer Vik' },
  { id:'garage', name:"Ashok's Auto Garage", flavor:"Honest repairs by day. A generous re-painting service by night.", category:'legit', icon:ICONS.garage, baseCost:2500, researchCost:1500, baseIncome:15, unlock:{type:'cash', value:2000}, crewBaseCost:630, managerLevelReq:15, managerName:'Ashok Himself' },
  { id:'cab', name:"Windy City Cab Co.", flavor:"A fleet of gypsy cabs. They know every alley shortcut in the city.", category:'legit', icon:ICONS.cab, baseCost:6000, researchCost:3600, baseIncome:32, unlock:{type:'cash', value:5000}, crewBaseCost:1540, managerLevelReq:15, managerName:'Dispatcher Rosa' },
  { id:'chop_ring', name:"Stolen Vehicle Export Ring", flavor:"Cars lifted from the Hub, re-VINed at Ashok's, and shipped out on midnight freighters.", category:'street', icon:ICONS.car, baseCost:24000, researchCost:14000, baseIncome:110, heatPerLevel:0.7, unlock:{type:'respect', value:100}, crewBaseCost:5950, managerLevelReq:16, managerName:'Chop Foreman Deke' },
  { id:'restaurant', name:"Windhaven Chaat House", flavor:"The flagship. A line out the door and a write-up in the Herald.", category:'legit', icon:ICONS.food, baseCost:18000, researchCost:11000, baseIncome:85, unlock:{type:'cash', value:15000}, crewBaseCost:4760, managerLevelReq:16, managerName:'Head Chef Meera' },
  { id:'lounge', name:"Marigold Lounge", flavor:"A nightclub named for the flowers Arjun's mother strung on the door in Delhi.", category:'legit', icon:ICONS.lounge, baseCost:70000, researchCost:42000, baseIncome:280, unlock:{type:'cash', value:60000}, crewBaseCost:18900, managerLevelReq:17, managerName:'Lena, House Manager' },
  { id:'wire_network', name:"Underground Bookmaking & Wire Ops", flavor:"High-volume sports betting and offshore wire transfers, handled quietly in the Marigold VIP booths.", category:'street', icon:ICONS.phone, baseCost:120000, researchCost:75000, baseIncome:450, heatPerLevel:1.2, unlock:{type:'respect', value:300}, crewBaseCost:29400, managerLevelReq:17, managerName:'Bookie Sal' },
  { id:'realestate', name:"West Side Holdings", flavor:"Buildings with Arjun's name on the paperwork and nobody else's.", category:'legit', icon:ICONS.bld2, baseCost:260000, researchCost:150000, baseIncome:850, unlock:{type:'cash', value:220000}, crewBaseCost:66500, managerLevelReq:18, managerName:'Counsel Whitfield' },
  { id:'syndicate_logistics', name:"Syndicate Freight & Contraband", flavor:"Controlling the docks. Everything that moves through the West Side pays a tariff before hitting the street.", category:'street', icon:ICONS.box, baseCost:550000, researchCost:320000, baseIncome:1600, heatPerLevel:2.0, unlock:{type:'respect', value:800}, crewBaseCost:126000, managerLevelReq:18, managerName:'Dockmaster Chen' },
  { id:'family_office', name:"Kavita Family Office", flavor:"Grandmother presides over a private office where the family's legitimate holdings and quiet obligations become one enduring institution.", category:'legit', icon:ICONS.diamond, baseCost:1800000, researchCost:1000000, baseIncome:5200, unlock:{type:'family', value:4}, crewBaseCost:420000, managerLevelReq:20, managerName:'Family Steward Leela' },
];

export const businesses: Business[] = ventureDefs.map((v) => ({
  ...v,
  level: 0,
  crew: 0,
  manager: false,
  researched: v.unlock.type === 'start',
  tempMult: 1,
  tempMultExpire: 0,
  reinvestedIncome: 0,
}));

export const ranks: Rank[] = [
  {respect:0, title:'Unknown'},{respect:5, title:'Devlin Street Vendor'},{respect:25, title:'Neighborhood Operator'},
  {respect:60, title:'Local Boss'},{respect:150, title:'Connected Figure'},{respect:400, title:'Syndicate Partner'},
  {respect:900, title:'West Side Kingpin'},{respect:2000, title:'Windhaven Power Broker'},{respect:5000, title:"The City's Shadow Boss"},
];
