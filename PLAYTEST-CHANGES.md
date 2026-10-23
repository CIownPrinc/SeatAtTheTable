# What's changed since the last play-through

Covers everything since the full play-through on 2026-10-18, when every note went into TODO §10.
The newest items are first.

## New on 2026-10-21 and 22

- **Your properties:** an owned property's panel has "Go inside". Each has its own room (a walk-up's
  hallway with tenants, shop units, an apartment lobby with a doorman, a warehouse, or a home). Rent
  now fills each building's rent book, up to 15 minutes' worth, for you to collect in person, or hand
  the building to the agent for a 15% cut. What you already owned starts under the agent.
- **Homes:** the penthouse, lofts and brownstones have a kitchen, a fire, a sofa, a bed and a wardrobe.
- **Sleep to save:** the bed upstairs at the garage (and in the homes) moves the clock to 7 AM and saves.
- **Real proportions:** people are 1.8 m, cars a little smaller and lower, and the suburb houses and
  farm buildings full size (a house about 8 by 6 m, two storeys). Lakeridge Lane has six real houses.
- **Hair, hats and accessories rebuilt in Blender:** eight sculpted hairstyles, five hats, glasses, a
  chain of real links, a watch. The wardrobe preview is bigger and zooms in on the head.
- **Your car:** it stays where you parked it (it used to vanish when you crossed into another
  district), has an orange marker on the minimap and City Map, and the phone's Contacts has a tow
  truck to bring it home.
- **Traffic stops for your car** instead of driving through it. On foot you can still be run over.
- **Stairs down** upstairs are a railed opening going down, and the mall has its escalator down.
- **The "camera follows Arjun" setting** is a chase camera: behind him, closer, looking ahead.
- **GPS:** the minimap draws the route and points at a waypoint off its edge, with the distance;
  flying routes go straight. The City Map's categories are fixed (Yours, Out of town, real labels).
- **Fixes:** amenity games work in full screen; the garage shows the cars you aren't driving;
  missions no longer repeat or stack (one at a time); the income on the cards, the header and your
  cash now agree; the rail crosses the lake on a bridge; the floating plank by the canal is gone;
  regulars no longer stand inside wooden posts.

## New today, from your notes this session

- **Cars are full size.** Traffic was a bug, not just the scale: merging each car to save draw
  calls crushed it to a speck about 4 units long. That's fixed, and every car, van and truck is now
  drawn bigger than life, the way driving games do it. Your car's hit size, the gap traffic keeps
  and where it stops at lights all grew with them. Bikes stayed the same so Arjun still fits the seat.
- **Wheels have their spokes back.** A bug in the Blender toolkit had scattered every turned part
  (spokes, lapels) around the model's origin. Fixed, and every model rebuilt.
- **Slimmer streetlights:** a thin pole with a flat LED head, drawn 20% smaller.
- **City Hall's stray rectangle is gone.** It was old box-building detail floating across the
  columns. The same fix cleared stray neon bars and awnings off other places. The dome is gilt
  now (it was rendering black).
- **Walking plants its feet.** Steps now match how far the legs reach, the hips dip as the legs
  spread so the front foot stays on the ground, and running springs off each foot. No more gliding.
- **Blender furniture in every room:** counters, notice boards, safes, the vault door, slot machines,
  the card table, desks, lockers, shelving, plants and columns, plus the mall's fountain, kiosks,
  food court, climbing frame and ball pit, and the basketball hoop and chess table.
- **More Blender models:** the suburb houses (each in its own colours), the farmhouse, barn, silo,
  shed and tank, the building-site cabin, toilet and a lattice tower crane, the mall and its parking
  garage, and the airfield, docks, railyard, drive-in, lodge and motel.

## The map

- **A new map engine**, now the only one (the old map and the beta toggle are gone). Ground blends
  smoothly between zones, the coast and lake shore are rounded, and surf breaks along them.
- **The city is laid out in lots** along every street, each building facing its road, its type and
  height from the block's character. A few lots are building sites with tower cranes.
- **New places:** Central Park on the south edge, a suburban street of family houses on Lakeridge
  Lane, Lakeridge Mall with a three-deck parking garage, and footpaths and thicker forests in the country.
- **The one-off places are built as themselves:** the airfield has a runway, hangar and crop-duster,
  the docks a gantry crane and containers, the railyard tracks and wagons.
- **Snow** settles on the ground, roofs, trees and roads, and a plow comes out to clear them.
- **Blender models across the map:** buildings, landmarks, trees, benches, bins, hydrants, bus
  shelters, streetlights and traffic-light frames.

## Streets and traffic

- Traffic drives in lane on the road network, with more civilian cars than police.
- **Working traffic lights** at every junction, and cars stop for red.
- Traffic, the train and trees are solid, and a car that hits you knocks you down.
- Pavements are full of background people.

## Getting around

- A redesigned minimap and territory view, and a clearer way to clear the GPS.
- Pulling out of the garage works, and the garage is wider with an office door.
- A touch thumbstick for phones.

## Arjun and the wardrobe

- Arjun's skin stays his own brown. More hair, shoes and accessories, and the clothes, hands and
  shoes are sculpted in Blender.
- He rides the motorbikes properly, dressed in whatever he's wearing.
- **A flat above the garage** with the wardrobe and a vault.

## Inside buildings

- Every interior is a 3D room you walk around, with first person on V. Counters have clerks behind
  them, boards have notices on them, and furniture blocks you.
- **Lakeridge Mall:** accessory shops that stock the wardrobe, a fountain, a perfume seller who comes
  out to spray you, an ice cream cart, a food court and a play area.

## Things to do

- **Street races** against real rival cars through checkpoints on the Fire Road.
- The basketball court and park chess are now played in 3D.
- A pulled dealer walks off down the street instead of vanishing.
- More cheat codes, with a list of them.

## Under the hood

- The map opens in about a second and runs about twice as fast on phones as before.
- The layout fits phones, landscape phones and big monitors.
- Saves: Reset, Start New Game and import actually replace the save now.
- 460 unit tests pass, and so do the browser tests for driving, the map, interiors and the mall.

