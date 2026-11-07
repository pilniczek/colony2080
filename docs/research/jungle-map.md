# Jungle map inventory

Step 2 of `docs/blueprints/map-composition.md` for jungle: every feature of the original map `map_M31.png` (24 px per cell) and its variants M32-M34, cropped region by region with `tools/map/crop.mjs`, mapped to its planned asset of the design set (`docs/research/jungle-assets.md`, `spikes/shared/env-jungle.js`), MISSING, or a stated skip. Cells are `col,row` (map rows, as in `config/levels/jungle/map.json`); main floors are rows 11, 20, 25, 32, 37, 41, 48. Crops (local only) sit in the session scratchpad `jungle-crops/` (`r*` region, `z*` zoom, `v*` variant).

Every region also has: green cobble masses (terrain `wall` and `deep`, `cobbleFill`), stone ledge floors (terrain `ledge`, `jungleWalkway`), free plank runs (terrain `girder`, `plankBridge`), far trees and tower ruins in the open sky between floors (`farTrees`, `farTowerRuin`, none in the original: black), ferns and clutter (`fernBush`, `logPile`, `oilDrum`, `overgrownWreck`). No lifts: no lift panels.

## West rock, floors 20 to 37 (cols 21-48)

| Feature | Cells | Asset |
|---|---|---|
| Girder column, west edge | 22, 14-36 | `girderColumn` (wall stack) over the col 22 wall |
| Plank roof on two girder posts | 37-44, 13; posts 38, 43, 13-19 | `plankBridge`, `girderColumn` (2) |
| Bunker with barred window | 37-44, 15-19 | `jungleBuilding` (plain) |
| Fence with sign plate | 45-48, 18-19 | `chainFence` (mesh with sign) |
| Rock ledge masses with stair rails | 29-41, 21-36 | `rockLedges` (mass, overhang) |
| Round vent in the rock | 31-32, 32 | `rockVent` (closed) |
| Yellow E sign on a column | 33, 26 | `energySign` (lit) |
| Plank bridge row 25 | 27-40, 25 | terrain girder (`plankBridge`) |
| Girder posts under the planks | 24, 29-36; 28, 26-36 | `girderColumn` (short post, 2) |
| Girder posts by the bunker | 46 and 48, 21-27 | `girderColumn` (short post, 2) |
| Boulder piers under floor 32 | 40-48, 33-36 | `rockLedges` in `backdrop` (hero walks in front) |
| Fence before the bunker | 43-45, 29-31 | `chainFence` (mesh torn) |
| Shield bonus | 29, 25 | prop `bonus` `shield` (tasks) |
| Energy bonus | 25, 31 | prop `bonus` `energy` (tasks) |

## Middle, floors 20 to 37 (cols 48-78)

| Feature | Cells | Asset |
|---|---|---|
| Spike pit | 53-60, 20 | prop `spikes` (tasks) |
| Boulder (M32), rubble on the spikes (M33) | 49-52, 15-19; 54-59, 20 | props `boulder`, `spikes` state 1 (tasks) |
| Plank row 25 on posts | 49-62, 25; posts 49, 21-25 and 61, 26-31 | `plankBridge` (no floor: never reached), `girderColumn` (short post, 2) |
| Bunker with two windows | 48-57, 28-31 | `jungleBuilding` (plain), its roof row 28 is walkable |
| Stacked chrome tanks | 57-62, 28-31 | `chemTank` (stacked pair) |
| Single chrome tank | 66-71, 30-31 | `chemTank` (single) |
| Plank row 28 on posts | 65-73, 28; posts 66, 71, 29-31 | `plankBridge` (no floor: never reached), `girderColumn` (short post, 2) |
| Fence with sign and rust tear | 63-71, 17-19 | `chainFence` (mesh with sign) |
| Bunker with three windows | 70-77, 16-19 | `jungleBuilding` (plain) |
| Stone block pillar and low stone wall | 77-78, 16-19; 79-84, 18-19 | MISSING `stoneParapet` |
| Rusted boiler with chrome drum | 58-61, 34-36 | MISSING `rustBoiler` |
| Tripwire posts and berry bush | 52-55, 35-36 | prop `tripwire` (tasks), `fernBush` (berry bush) |
| Small key in the grass | 54, 32 | item `smallKey` (tasks), `fernBush` (fern) |
| Cobble mass under floor 32 | 61-85, 33-36 | terrain wall (`cobbleFill`); cols 66-85 solid now, 61-65 open |
| Ammo bonus | 65, 37 | prop `bonus` `ammo` (tasks) |

## Top, floors 11 and 20 east (cols 68-108)

| Feature | Cells | Asset |
|---|---|---|
| Fallen tree, loose rocks at its foot | 69-81, 5-10 | prop `fallenTree` (tasks); rocks skipped: part of the tree art, no floor under them |
| Jeep with winch | 79-82, 9-10 | prop `jeep` (tasks) |
| Fence with sign plate | 84-92, 9-10 | `chainFence` (mesh with sign) |
| Rock mass under floor 11 | 80-93, 12-14 | `rockLedges` (overhang), hung under floor 11 |
| Chrome tank | 85-90, 17-19 | `chemTank` (single) |
| Waterfall | 94-99, 3-21 | prop `waterfall` (tasks) |
| Plank bridge over the waterfall | 92-101, 20 | `plankBridge` over `bare` cells of the floor 20 ledge |
| Two stone steps (M34) | 96, 12; 98, 13 | prop `waterfall` state 1 (tasks) |
| Puzzle rock ledge stair | 100-106, 14-19 | `rockLedges` (mass) |
| Stone puzzle panel | 104-105, 17 | prop `stonePuzzle` (tasks) |
| Balanced stones | 103, 14-16 | `stoneStack` (3 stones) |
| Girder pillar east of the waterfall | 107, 0-19 | `girderColumn` (wall stack) over the col 107 wall |
| Rock fragments around the tank | 80-93, 14-19 | skipped: tile fragments of the decoded map |

## Spawn deck and towers (cols 103-151, rows 10-27)

| Feature | Cells | Asset |
|---|---|---|
| Brass and teal deck | 104-143, 25-26 | `brassDeck` over `bare` cells of the row 25 ledge |
| Lattice tower, west | 114-116, 15-24 | `jungleTower` (covers the col 116 wall) |
| Tower lift top station | 117-121, 21-24 | prop `towerLift` (tasks), teleport `towerLiftDown` |
| Thin silver pipe | 121, 23-24 | `coolantPipe` (vertical) |
| Brass handrails | 123-130, 24 | `deckRailing` (rail) |
| Mine | 126, 25 | prop `mineDeck` (tasks) |
| Red excavator | 131-136, 22-24 | `excavator` (covers the col 131 wall) |
| Plank on the deck | 136-141, 24 | `plankBridge` (scenery on the deck) |
| Lattice tower, east | 138-140, 12-24 | `jungleTower` |
| Planks west of the deck | 100-103, 30; 104-111, 28 | `plankBridge` (2, no floor: never reached) |
| Girder column, east edge | 148, 27-40 | `girderColumn` (wall stack) over the east border wall |

## Floor 41 east (cols 86-151, rows 33-41)

| Feature | Cells | Asset |
|---|---|---|
| Cave-roof floor | 87-147, 41 | terrain ledge, `caveWalkway` look |
| Orange car wreck | 101-106, 39-40 | `overgrownWreck` (sedan) |
| Canister | 100, 40 | item `canister` (tasks) |
| Mine | 108, 41 | prop `mineWreck` (tasks) |
| Fence with sign plate | 109-119, 38-40 | `chainFence` (mesh with sign) |
| Door bunker with red lamp | 119-124, 38-40 | prop `flamethrowerDoor` (tasks) |
| Two-storey bunker | 120-129, 36-40 | `jungleBuilding` (two storeys) |
| Balanced stones between the wings | 125-126, 36-40 | `stoneStack` (5 stones) |
| Fence with sign plate | 130-135, 38-40 | `chainFence` (mesh with sign) |
| Lattice tower | 138-140, 31-40 | `jungleTower` |
| Tower lift pole and bottom station | 140-145, 26-40 | prop `towerLift` (tasks), teleport `towerLiftUp` |
| Thin silver pipe, handrail | 140, 39-40; 141-145, 40 | `coolantPipe` (vertical), `deckRailing` (rail) |

## Cave and helicopter (cols 74-102, rows 24-50)

| Feature | Cells | Asset |
|---|---|---|
| Broken brick wall | 75-78, 28-31 | `brickRuin` (stepped break) |
| Helicopter wreck under foliage | 79-85, 26-31 | `helicopterWreck` |
| Crate under the wreck | 83, 32 | object `crate` (tasks) |
| Plank row 28 on posts | 84-100, 28; posts 85, 29-31; 95, 29-32; 98, 29-39 | `plankBridge` (no floor: never reached), `girderColumn` (short post, 3) |
| Turret plank and turret | 86-89, 31; 90-91, 30-31 | terrain girder; prop `cannonTurret` (tasks) |
| Green box with yellow bolt | 94, 33-34 | `junctionBox` (closed) |
| Stepped rock slope | 91-100, 33-40 | `rockSlope` |
| Mine | 97, 35 | prop `mineSlope` (tasks) |
| Rock west of the cave stair | 82-90, 33-40 | terrain wall (`cobbleFill`), solid now |
| Cave stair rock | 83-88, 41-47 | `rockLedges` (cave) |
| Teal conduit rail | 89-99, 44 | `coolantPipe` (horizontal) |
| Thin teal L conduits | 93-97, 46 | `coolantPipe` (L bend) |
| Ribbed capsule | 87-88, 46-47 | `caveCapsule` |
| Orange car piece in the rock | 87, 45 | skipped: tile fragment of the car wreck |
| Distribution cabinet | 97-98, 46 | prop `distributionCabinet` (tasks) |
| Chasm | 89-92, 49-79 | `caveChasm` (hangs from the cave floor) |

## Counts

| Region | Features | Mapped | Missing | Skipped |
|---|---|---|---|---|
| West rock | 14 | 14 | 0 | 0 |
| Middle | 15 | 13 | 2 | 0 |
| Top | 13 | 11 | 0 | 2 |
| Spawn deck and towers | 11 | 11 | 0 | 0 |
| Floor 41 east | 12 | 12 | 0 | 0 |
| Cave and helicopter | 16 | 15 | 0 | 1 |
| Total | 81 | 76 | 2 | 3 |

## Missing assets

| Id | Role | Look | Original cells | Crop |
|---|---|---|---|---|
| `rustBoiler` | machine | Rust-brown boiler block (`#6c3c18`, `#604824`, dark `#483018`) about 4 cells wide and 3 high, a red-brown top plate, riveted side panels, a chrome drum (`#a8b4b4`, `#54786c`) at its base, short pipe stubs into the cobble behind; rot grime | 58-61, 34-36, on floor 37 | `jungle-crops/z13_f37_48-70_r32-38.png`, `r02` |
| `stoneParapet` | wall | Grey stone blocks (`#606054`, `#786c60`) with the beaded orange trim strip of `jungleWalkway` on each course; states low wall (2 rows, sized w) and pillar (1 cell wide, sized h); rot grime, moss on top | wall 79-84, 18-19; pillar 77-78, 16-19, both on floor 20 | `jungle-crops/r03_top_68-100_r0-24.png`, `z11` |

Before drawing `stoneParapet`, try `jungleWalkway` (plain state) stacked two rows as dressing; draw it only if that reads as a floor.

## Placement plan

`world.json` cells: `x` the left column of the asset origin, `y` the floor row it stands on (base on the top edge of that row), `w` and `h` in cells, `h` rows above `y`. Buildings over floors the hero walks go in `backdrop` (the hero walks in front of them in the original), like vesnice.

Terrain look: `terrainArt` `wall` `cobbleFill`, `deep` `cobbleFill` (mossy), `ledge` `jungleWalkway`, `girder` `plankBridge`. Sky `jungleSky`. `bare` cells: row 20 cols 92-101 (plank over the waterfall), row 25 cols 104-143 (brass deck).

### Backdrop (in this order)

| Asset | x | y | w | h | state | flip | Note |
|---|---|---|---|---|---|---|---|
| `farTrees` | 23 | 20 | 5 | 8 | 1 | | sky over floor 20 west |
| `farTowerRuin` | 52 | 20 | 3 | 10 | 0 | | sky over the spike pit, behind the boulder |
| `farTrees` | 60 | 11 | 6 | 9 | 0 | true | sky west of the jeep ledge |
| `farTrees` | 108 | 41 | 4 | 7 | 0 | | sky over floor 41 |
| `farTowerRuin` | 143 | 41 | 3 | 7 | 1 | | sky beside the tower lift |
| `overgrownWreck` | 101 | 41 | | | 0 | | original car |
| `helicopterWreck` | 79 | 32 | | | 0 | | original helicopter, crate prop under it |
| `rockLedges` | 40 | 37 | 9 | 4 | 0 | | boulder piers under floor 32 |
| `jungleBuilding` | 37 | 20 | 8 | 5 | 0 | | bunker on floor 20 west |
| `jungleBuilding` | 48 | 32 | 10 | 4 | 0 | | bunker; its roof (row 28) is a reached floor, keep h 4 |
| `jungleBuilding` | 70 | 20 | 8 | 4 | 0 | | three-window bunker |
| `jungleBuilding` | 120 | 41 | 10 | 5 | 3 | | two-storey bunker behind the door prop |

### Dressing (in this order)

| Asset | x | y | w | h | state | flip | Note |
|---|---|---|---|---|---|---|---|
| `girderColumn` | 22 | 37 | | 23 | 0 | | west edge, over the col 22 wall |
| `girderColumn` | 38 | 20 | | 7 | 1 | | roof post |
| `girderColumn` | 43 | 20 | | 7 | 1 | | roof post |
| `plankBridge` | 37 | 14 | 8 | | 0 | | roof plank row 13 |
| `rockLedges` | 29 | 37 | 12 | 11 | 0 | | west rock mass |
| `rockLedges` | 34 | 25 | 6 | 4 | 1 | | stair under floor 20 |
| `girderColumn` | 24 | 37 | | 8 | 1 | | post under rows 28 and 31 |
| `girderColumn` | 28 | 37 | | 11 | 1 | | post under row 25 |
| `girderColumn` | 46 | 28 | | 7 | 1 | | post on the (46,27) step |
| `girderColumn` | 48 | 28 | | 7 | 1 | | post on the (48,27) step |
| `plankBridge` | 49 | 26 | 14 | | 0 | | dropped row 25 plank |
| `girderColumn` | 49 | 26 | | 5 | 1 | | post under it |
| `plankBridge` | 65 | 29 | 9 | | 0 | | dropped row 28 plank |
| `girderColumn` | 66 | 32 | | 3 | 1 | | |
| `girderColumn` | 71 | 32 | | 3 | 1 | | |
| `chemTank` | 57 | 32 | | | 1 | | stacked pair; the original post at col 61 overlaps it, leave the post out |
| `chemTank` | 66 | 32 | | | 0 | | under the row 28 plank |
| `rustBoiler` | 58 | 37 | | | 0 | | MISSING |
| `stoneParapet` | 77 | 20 | | 4 | 1 | | MISSING, pillar |
| `stoneParapet` | 79 | 20 | 6 | | 0 | | MISSING, low wall |
| `chemTank` | 85 | 20 | | | 0 | | |
| `rockLedges` | 80 | 15 | 14 | 3 | 1 | | under floor 11, add to `hangs` |
| `plankBridge` | 92 | 21 | 10 | | 0 | | over the waterfall, `bare` under it |
| `rockLedges` | 100 | 20 | 7 | 6 | 0 | | puzzle ledge |
| `stoneStack` | 103 | 17 | | 3 | 0 | | |
| `girderColumn` | 107 | 20 | | 20 | 0 | | pillar, over the col 107 wall |
| `brassDeck` | 104 | 26 | 40 | | 0 | | spawn deck, `bare` under it |
| `jungleTower` | 114 | 25 | | 10 | 0 | | covers the col 116 wall |
| `coolantPipe` | 121 | 25 | | 2 | 1 | | vertical |
| `deckRailing` | 123 | 25 | 8 | | 0 | | |
| `excavator` | 131 | 25 | | | 0 | | covers the col 131 wall |
| `plankBridge` | 136 | 25 | 6 | | 0 | | plank on the deck |
| `jungleTower` | 138 | 25 | | 13 | 0 | | |
| `plankBridge` | 97 | 31 | 7 | | 0 | | dropped row 30 plank |
| `plankBridge` | 104 | 29 | 8 | | 0 | | dropped row 28 plank |
| `girderColumn` | 148 | 41 | | 14 | 0 | | east edge, over the border wall |
| `brickRuin` | 75 | 32 | 4 | 4 | 0 | | |
| `plankBridge` | 84 | 29 | 17 | | 0 | | dropped row 28 plank over the turret |
| `girderColumn` | 85 | 32 | | 3 | 1 | | |
| `girderColumn` | 95 | 33 | | 5 | 1 | | stands on the (95,33) step |
| `girderColumn` | 98 | 40 | | 11 | 1 | | stands on floor 40 |
| `rockSlope` | 92 | 41 | | | 0 | | |
| `rockLedges` | 83 | 48 | 6 | 7 | 2 | true | cave stair rock |
| `coolantPipe` | 89 | 45 | 11 | | 0 | | conduit rail |
| `coolantPipe` | 93 | 47 | 5 | | 2 | | L conduits |
| `caveCapsule` | 87 | 48 | | | 0 | | |
| `caveChasm` | 89 | 59 | | | 0 | | add to `hangs` (no floor under the pit) |
| `chainFence` | 45 | 20 | 4 | | sign | | |
| `chainFence` | 43 | 32 | 3 | | torn | | |
| `chainFence` | 63 | 20 | 9 | | sign | | |
| `chainFence` | 84 | 11 | 9 | | sign | | |
| `chainFence` | 109 | 41 | 11 | | sign | | |
| `chainFence` | 130 | 41 | 6 | | sign | | |
| `stoneStack` | 125 | 41 | | 5 | 1 | | between the bunker wings |
| `jungleTower` | 138 | 41 | | 11 | 0 | | |
| `coolantPipe` | 140 | 41 | | 2 | 1 | | vertical |
| `deckRailing` | 141 | 41 | 4 | | 0 | | bottom station rail |
| `rockVent` | 31 | 33 | | | 0 | | on the west rock |
| `energySign` | 33 | 27 | | | 0 | | on the girder post |
| `junctionBox` | 94 | 35 | | | 0 | | on its pole, step row 35 |
| `fernBush` | 54 | 37 | | | 1 | | berry bush by the tripwire |
| `fernBush` | 54 | 32 | | | 0 | | grass at the key |

`chainFence` states are the shared mesh states (`sign` = mesh with sign plate, `torn` = mesh torn); use the overgrown state for added fences. Clutter (at least 14 small, 13 big on reached floors) goes at building edges: floor 20 cols 35-36 and 45 (bunker 37-44), 69 and 78 (bunker 70-77); floor 32 col 47 (bunker 48-57); floor 41 cols 107-108 and 136-137; the spawn deck 117-122; floor 11 cols 76-78 and 93.

## Map passes (step 3)

`docs/research/tools/levelmap.py` level 3 config, regenerated output in `config/levels/jungle/map.json`:

- No `|` blocker left. No lifts; the tower lift is the teleport pair, unchanged.
- Dropped the never reached planks and roofs (rows 13, 16, 25, 28, 30, 37, 38); they are scenery now (placement plan).
- Border fills reach the map top on both edges (cols 0-21 and 148-151); the west girder column (col 22) and the waterfall pillar (col 107) run up to the map top.
- Solid rock where the original shows rock and no hero stands, jumps or falls: west rock, puzzle ledge, west of the cave stair (82-90, 33-40), the cave slope, col 103 under floor 20, the pocket over the bunker (50-65, 21-24).
- `unseen` adds the never seen cells under floor 11, floor 20 east, the spawn deck and the floor 37 pocket east of the col 66 wall (only the generous graph entered it).
- The chasm edge cells (89 and 92, row 49) are solid, so the floor row 48 and the bedrock below form separate wall rectangles.

Floor ends left open are the original jump traversal (report 15: walk, jump and fall over floor runs): the west rock ledge stairs, the plank and step ends on floor 32, the puzzle ledge stair, the cave stair and slope, the spawn deck ends, the tree and spawn ledge wall tops. They need named `openEnds` exemptions when the mission joins `BUILT`.
