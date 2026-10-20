# What's changed since the last play-through

Covers everything since the full play-through on 2026-10-18, when every note went into TODO §10.
The newest items, from today (2026-10-20), are first.

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

## Still to come

- Interior furniture, the inside of the mall and the minigame scenes are still built in code. They
  move to Blender next.
