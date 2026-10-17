import type { Milestone, FamilyTier } from './types';

export const milestones: Milestone[] = [
  { id:'first_venture', title:"CHAAT CART TURNS A REAL PROFIT", body:"<p class='flavor'><strong>Two hundred dollars.</strong> He landed at Windhaven International with a duffel bag and a cousin's phone number. This is the first cash that is entirely his.</p>" },
  { id:'local_boss', title:"DEVON STREET TAKES NOTICE", body:"<p class='flavor'>People who ignored him six months ago nod when he walks past. A local merchant offers him a free coffee. He throws it out. Nothing on Devlin Street is free.</p>" },
  { id:'first_property', title:"A NAME ON THE LEASE", body:"<p class='flavor'>He signs a commercial lease under his own name for the first time. No cousin co-signing, no favor owed. He sits in his car for ten minutes afterward, doors locked, just staring at the keys.</p>" },
  { id:'chaat_house', title:"THE TRIBUNE WRITES HIM UP", body:"<p class='flavor'>A critic calls the Chaat House the best thing to happen to Devlin Street in a decade. His mother has the clipping read to her three times over the phone. He sleeps with a gun under the mattress for a week.</p>" },
  { id:'kingpin', title:"THEY ASK HIM TO SIT DOWN", body:"<p class='flavor'>The kind of men who used to make people disappear for a living now pull out a chair for him. He used to run from rooms like this. Now, they pour him a drink and ask for his thoughts.</p>" },
  { id:'heist', title:"WEST SIDE, EAST DELHI", body:"<p class='flavor'>His name is on buildings, a restaurant with a two-hour wait, and a ledger only four people have ever seen. The men he ran from in Delhi wouldn't recognize him.</p>" },
  { id:'extortion', title:"THE PRICE OF DOING BUSINESS", body:"<p class='flavor'>He walks into a neighborhood shop and demands a cut of their register. He remembers when men did this to his uncle. The register clicks open anyway. The money feels different this time.</p>" },
  { id:'raid', title:"KICKING IN THE DOORS", body:"<p class='flavor'>Sirens in the alley, flashing lights in the front window. The police take the cash, the product, and a chunk of his street reputation. He stands on the sidewalk watching it happen. Next time, he'll pay the right people.</p>" },
  { id:'crew_induct', title:"A SEAT AT THE TABLE", body:"<p class='flavor'>He brings someone into the inner circle. They aren't just runners on a corner anymore—they're family. He pours them a drink, but keeps an eye on the door. Trust is expensive.</p>" },
  { id:'bentley', title:"THE STATUS SYMBOL", body:"<p class='flavor'>He buys an Electron S with cash — six figures of silent, self-satisfied luxury. No engine note, no smoke, just the soft hum of a man who wants you to know exactly what he can afford. That's the whole point. He wants everyone to see him coming.</p>" },
  { id:'docks', title:"CONTROLLING THE DOCKS", body:"<p class='flavor'>Nothing moves through the West Side without his say-so. The cargo ships, the trucks, the longshoremen—they all pay a tariff. The city's arteries belong to him now.</p>" },
];

export const familyTiers: FamilyTier[] = [
  { name:'Brother Ravi', desc:'Permanent +50% income, every venture.' },
  { name:'Mother Kavita', desc:'Permanent -35% **Heat** generation, everywhere.' },
  { name:"Sister's family", desc:'+6 permanent crew capacity. Crew costs -20% forever.' },
  { name:'Deepak, childhood friend', desc:'Managed ventures now auto-reinvest 10% of their income into leveling themselves.' },
  { name:'Grandmother', desc:'Unlocks a capstone venture, and +25% **Respect** gain forever.' },
];
