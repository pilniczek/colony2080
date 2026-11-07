# Jungle (mission 3) asset list

Every kind of feature in the original map `docs/research/gamedata/png/maps/map_M31.png` (24 px per cell) and its variants M32-M34, cropped region by region with `tools/map/crop.mjs`, with the asset of the design sheet that draws it. Cells are `col, row` (map rows, the same as `config/levels/jungle/map.json` rows; main floors are rows 11, 20, 25, 32, 37, 41, 48). Role is the role of `docs/blueprints/map-composition.md`.

Sources: map crops of M31-M34, `LEV3.GRA` frame 0 (`docs/research/gamedata/png/LEV3_f0.png`, the sky), the demo footage (`docs/research/video/frames-best/DEMO_jungle_rock_ledges_turret.png`, `docs/research/video/sheets/98GhruztJP0_01..05.png`: the demo covers the whole jungle), `docs/research/reports/15-level3-layout.md`, `config/levels/jungle/objects.json` and `map.json`. Hex colours are sampled from the map and frame 0 (rounded to steps of 12).

The jungle has no lifts: `map.json` `lifts` is empty. The tower lift is two teleport pads (`towerLiftUp` col 140-143 row 41, `towerLiftDown` col 116-119 row 25).

Review the sheet at `spikes/env-design/index.html?mission=jungle&scope=own`.

## Layout features

| Feature kind | Original cells | Asset | Role | States |
|---|---|---|---|---|
| Sky: misty teal forest, dark green band, fern silhouettes | `LEV3.GRA` frame 0, demo | `jungleSky` (new) | sky | static |
| Far layer between floors (none in the original: black; the demo shows the sky there) | open cells between floors | `farTrees` (new), `farTowerRuin` (new) | far | trunks, trunks with vines; lattice tower, bunker ruin |
| Green cobble mass (rounded stones in courses, dark green grout) | 63-100 r33-37, 76-100 r37-79, 90-151 r42-79 | `cobbleFill` (new) | filler (terrain wall) | plain, mossy; sized w h |
| Stacked X-plate girder columns as floor-end walls | 22 r15-37, 107 r1-20, 148 r27-41, 46 r20-25 | `girderColumn` (new) | wall, support | wall stack, short post; sized h |
| Broken brick wall by the helicopter | 74-79 r27-31 | `brickRuin` (new) | wall | stepped break, low stub |
| Cobble pillar at a floor end | 66 r33-37, 81-85 r38-47 | `cobbleFill` edge | wall | - |
| Chain-link fence with grey sign plate and rust tear | 45-48 r18-20, 63-71 r17-20, 43-46 r29-31, 84-92 r9-11, 109-120 r38-41, 130-136 r38-41 | `chainFence` (shared mesh states, add overgrown state) | fence | mesh, mesh with sign, mesh torn, mesh overgrown (new) |
| Brass handrails on the spawn deck | 123-130 r24, 141-145 r40 | `deckRailing` (new) | fence | rail, bent; sized w |
| Stone ledge floors: X-plate and stone blocks, beaded orange trim, boulder row under | rows 11, 20, 32, 37 everywhere (e.g. 48-62 r20-21) | `jungleWalkway` (new) | floor (terrain ledge) | boulder underside, cave underside (dark green, teal lines), plain |
| Floor over the cave cobble | 63-100 r32, 86-151 r41 | `caveWalkway` (new, drawn by world `ledgeArt`) | floor | - |
| Plank bridges: riveted olive top band, two brown planks | 30-38 r25, 24-29 r28, 36-44 r13, 50-62 r26, 65-73 r28, 84-100 r28, 86-90 r30, 98-104 r29, 104-112 r27, 136-143 r24 | `plankBridge` (new) | girder (terrain girder) | static, sized w |
| Brass and teal industrial deck (spawn ledge) | 106-145 r25-26 | `brassDeck` (new) | girder | static, sized w |
| Concrete bunkers, barred windows, brown roof edge | 37-44 r15-20, 49-57 r27-32, 71-81 r16-20, 120-131 r35-41 | `jungleBuilding` | building | plain, door and roof vent, shell hole, two storeys (new) |
| Door bunker with red lamp | 119-124 r38-41 | `flamethrowerDoor` | building (prop) | locked, opened |
| Rusted lattice towers, one riveted post with X bracing | 116-117 r15-24, 138-139 r12-24, 138-139 r31-41 | `jungleTower` | support | static, sized h |
| Balanced stone stack | 125-126 r36-40, 103 r14-16 | `stoneStack` (new) | support | 3 stones, 5 stones; sized h |
| Wooden stair rails inside the west rock | 31-36 r26-31 | part of `rockLedges` | support | - |
| Teal conduit rail with posts (cave), thin teal pipe on the floor | 89-99 r44, 93-97 r46, 93-96 r31 | `coolantPipe` (new) | pipe | horizontal, L bend; sized w |
| Thin silver pipes on the spawn deck | 121 r23-24, 140 r39-40 | `coolantPipe` vertical state | pipe | vertical, sized h |
| Chrome horizontal tanks with dome ends, orange valve bands, trefoil (demo) | 58-72 r27-31 (stacked pair), 85-90 r17-19 | `chemTank` (new, replaces `fuelTank`) | machine | single, stacked pair |
| Red mining excavator on the spawn deck | 131-136 r22-24 | `excavator` | machine | static |
| Ribbed silver capsule in the cave | 86-87 r45-47 | `caveCapsule` | machine | static |
| Rock ledge masses (grey-tan boulders, slab ledges, moss) | 30-44 r22-36, 80-93 r11-14, 100-106 r14-20, 84-89 r41-48, 40-48 r33-37 (boulder piers) | `rockLedges` | rubble | mass, overhang, cave (dark moss); sized w h, flip |
| Stepped rock slope | 92-100 r33-40 | `rockSlope` | rubble | static, flip |
| Loose rocks and trunk bits | 69-80 r5-9, M33 rubble on the spikes 54-59 r20 | `rockDebris` (new) | rubble | stones, stones with wood |
| Big cracked boulder (variant M32 and the demo) | 49-52 r15-19 | `boulder` | rubble (prop) | standing, blown |
| Round slatted vent in the rock | 31-33 r32 | `rockVent` (new) | mounted | closed, rusted open |
| Green box with a yellow bolt on a pole, under floor 32 | 94 r32-33 | `junctionBox` (vesnice, shared) | mounted | closed, open |
| Yellow octagon E sign on a column (demo) | 33 r26 | `energySign` (new) | sign, mounted | lit, faded |
| Grey sign plates on the fences | 66 r18, 47 r18, 87 r9, 114 r39, 134 r39 | fence plate in `chainFence` mesh state | sign | - |
| Helicopter wreck under foliage | 79-85 r25-31 | `helicopterWreck` | bigClutter | static |
| Orange car wreck (ferns on the roof in the demo) | 101-106 r39-41 | `overgrownWreck` (new, replaces mesto `carWreck`) | bigClutter | sedan, pickup, jeep shell |
| Plants: bush with red berries, ferns (demo shows them on every floor) | 54-55 r35-36 | `fernBush` (new) | smallClutter | fern, berry bush, broad leaf |
| Logs and drums (none in the original) | - | `logPile` (new), `oilDrum` (new) | smallClutter | logPile: stack, single; oilDrum: upright, tipped leaking |
| Lift panels (none: no lifts) | - | `liftPanel` (shared lift machine, not placed) | panel | shared |
| Tower lift stations: blue-grey pole with brass chevron plates, hazard-striped cage deck | 117-121 r21-25, 141-145 r26-41 | `towerLift` | panel (its own call panel), machine | at bottom, at top |

## Interactive objects and items

Per object of `config/levels/jungle/objects.json`. "Exists" means a drawing in `spikes/shared/env-jungle.js` unless named.

| Object | Status | Change to match the original (compared to) |
|---|---|---|
| `distributionCabinet` | exists | Original: a wall panel on the cave wall at 97-98 r46 with teal L conduits running into it; shot: a black hole with a brown plate (M32). Draw a flush cave-wall box in conduit teal (`#303c3c`, `#18483c`) with conduit stubs and the demo yellow E sign above; shot state a scorched black hole, a hanging plate and torn conduit. Crops `z14`, `z15`. |
| `cannonTurret` | exists | Original: teal-green dome (`#184830`, `#0c3024`, chrome highlight `#485454`) on a squat pedestal with a yellow hazard band, gun right with a red lamp, on a grey base plate. Make the dome teal steel with a chrome rim and the base plate wider, keep the off state scorch. Crops `z01`, `v05`, demo frame. |
| `smallKey` | exists (vesnice, draws mesto `craneKey`) | Keep. Lies in grass at 54 r32: add a grass tuft at the prop spot through `fernBush`, not in the item. |
| `tripwire` | exists | Original posts: a small cracked stone block (53 r35) and a brown board (52 r36) with the berry bush at 54-55. Make the left post a stone block, the right a short board, keep the wire and the grenade. Crop `z13`. |
| `boulder` | missing | New. A round cracked grey-tan boulder (`#786c60`, `#84786c`, light `#909078`, shade `#303024`), about 4 cells wide and 4 high, moss on top; blown state: a low stump of broken stones (the rubble on the spikes is the `spikes` state). Crops `v01`, `v02`, demo sheet 04. |
| `spikes` | exists | Original: thin pale steel spikes (`#a8b4b4`, teal tint `#54786c`) under a grey cap row, dark band below. Drop the blood, add state 1 (M33): boulder rubble over cols 56-58 that reads as a walkable heap. Crops `r02`, `v02`. |
| `stonePuzzle` | exists | Original map: a square carved stone panel with a diamond relief (105 r16) on the rock ledge; demo close-up: angular slate stones, a pressed one gold (`#9c846c`). Draw a carved square panel with four angular stone faces, state 1 lights them gold. Crop `z05`, demo sheet 04. |
| `waterfall` | exists | Original: flat grey-blue stripes (`#6c6c6c`, `#788478`, `#a8a8a8`, `#546060`), cols 94-99 rows 3-21, no rim stones. Make it greyer. State 1 today draws only the flow layer: give it the two stone blocks of M34 (96 r12, 98 r13, rough stone with a pale lit lip), keep the flow as `anim`. Crops `r04`, `v03`. |
| `flamethrowerDoor` | exists | Original: greenish concrete (`#545448`, `#606054`, `#3c483c`), brown roof edge, a teal-grey steel door (119-122 r38-41) with the red X lamp on the door top, hazard stripe at the door foot, a stone stack between two wings (125-126). Retint `BUNKER` to the greenish concrete, move the lamp onto the door, add the second wing and the stone stack. Crop `z10`, demo sheet 03. |
| `flamethrower` | exists | Keep (item, clean). |
| `crate` | exists (mesto `crate`) | Keep. Sits under the helicopter wreck. |
| `cutters` | exists | Keep. |
| `grenade` | exists | Keep. |
| `canister` | exists | Keep (red jerrycan, clean). |
| `jeep` | exists | Original: teal-green military jeep (`#487854`, `#244830`, light `#3c6c48`) with a winch A-frame on the back, rust-red stains; demo: open jeep, spare wheel. Retint from olive to the teal-green, add the A-frame boom and the cable hook. Crop `z06`, demo sheet 05. |
| `fallenTree` | exists | Original: a long straight brown trunk (`#604824`, `#483018`, dark `#18180c`) from 69 r6 down to 81 r10, rocks around its foot. Keep the shape, retint bark from the `rust` palette to brown wood, add bark lines and broken branch stubs. Crop `z06`, demo sheet 05. |
| `towerLift` | exists | Original: a blue-grey steel pole (`#243030`, `#3c4848`) with brass chevron plates every cell (142 r26-39, 118 r21-24), a cage deck with hazard stripes, thin rails and a silver pipe at each stop. Today a rust mesh cage: rework to the blue-grey pole and the cage station; the station carries the call panel. Crops `z02`, `z03`, `z16`. |
| `jungleTower` | missing | New, see Drawing groups. |
| `mine` | exists | Original picture unknown (report 15). Keep. |
| `bonusPickup` | exists | The game draws bonus props with `ammoBox`, `energyCell`, `shieldCell`. Keep for the sheet only, or drop it. |
| `caveChasm` | exists | Original: the pit shaft cols 89-92 r49-79 cut in green cobble. Keep the dark bands, add broken cobble edges at both sides. Crop `v04`. |
| `caveCapsule` | missing | New. |
| `rockLedges` | missing | New. |
| `rockSlope` | missing | New. |
| `girderColumn` | missing | New. |
| `helicopterWreck` | missing | New. |
| `carWreck` | exists (mesto) | Replace with `overgrownWreck` (jungle's own). |
| `excavator` | missing | New. |
| `fuelTank` | exists (mesto) | Replace with `chemTank` (jungle's own). |
| `jungleBuilding` | missing (`bunkerBody` helpers exist) | New, built on the reworked `bunkerBody`. |
| `chainFence` | exists (mesto, vesnice mesh states) | Add a mesh overgrown state (vines and leaves on the mesh). |
| `jungleSky` | missing | New. |

## Skipped

- Black void around the map: the original has no sky behind its tiles; `jungleSky` and the far layer replace it.
- Tile seams and half-drawn tile rows of the decoded map (e.g. the floating debris fragments 80-85 r25-26, the cut rock rows 90-93 r12-14): converter artefacts, drawn as whole assets instead.
- M32 stale design cells: the stone stair mass 62-70 r3-11, the erased jeep and tree, the column 74 r39-50 (report 15: stale design, never seen in play order).
- Bottom orange strip of `LEV3.GRA` frame 0: not part of the sky picture.
- `f25` dome turret sprite: unused in level 3.
- Enemies (`rocketDroid`, `crawler`): in `spikes/shared/enemies-jungle.js`, not env assets.
- The flamethrower weapon and its flame: weapon code, not env assets. The held model, flame particle and HUD icon are in `spikes/shared/flamethrower.js` (gun design sheet, Flamethrower), ported to `src/game/robot/flamethrower.ts`, `render/flameShot.ts` and `hud/flamethrowerIcon.ts`; the `flamethrower` env asset stays the ground pickup. The original particle bank is not decoded, so the flame follows the demo footage (report 15 Flamethrower).

## Drawing groups

Four groups for parallel agents, in `spikes/shared/env-jungle.js`. Every asset of a structure or building role calls the `ENV.G` grime helpers; items stay clean. Use the existing helpers (`stone`, `slab`, `mossCap`, `leafBlob`, `frond`, `fern`, `grass`, `vine`, `barredWindow`, `bunkerBody`, `bunkerGrime`) and the 4-tone palettes (`STONE`, `MOSS`, `LEAF`, `BUNKER`, `RED`, `WATER`); add a palette where a new material needs one. 1 cell = 24 units, floor at y 0. Crops are in `/tmp/claude-1000/-home-pilniczek--Projects-ubuntu-personal-colony2080/ece97089-56a2-4629-908a-81176e010701/scratchpad/jungle-crops/` (local only); file names below are in that folder.

### Group A: sky, far, filler, terrain

| Id | New or rework | Box (units) | States | Look | Crops |
|---|---|---|---|---|---|
| `jungleSky` | new | full view, tiles horizontally | static | Misty teal forest of `LEV3.GRA` frame 0: light mist patches `#306054`, mist `#245448`, canopy `#184830`, trunks `#0c3024`; a dark green band `#00240c` over the lower third with fern silhouettes `#304824`, `#243018`. | `LEV3_f0.png`, demo frame |
| `farTrees` | new | 96 x 240, sized w h | trunks, trunks with vines | Flat dark trunk silhouettes `#0c3024` with canopy blobs `#184830`, under the haze; tall enough to pass behind the floor above. | `LEV3_f0.png` |
| `farTowerRuin` | new | 72 x 288, sized w h | lattice tower, bunker ruin | Flat dark silhouettes `#0c3018` of an overgrown lattice tower and a broken bunker with vines. | `r08`, demo sheets 02-03 |
| `cobbleFill` | new | 48 x 48, sized w h | plain, mossy | Rounded stones in staggered courses, two per cell: `#3c3c30`, `#3c483c`, `#303c3c`, light `#545448`, dark green grout `#182418`; mossy state adds moss tufts. World-anchored pattern like vesnice `stoneWall`. | `r05`, `z04`, `v04` |
| `jungleWalkway` | new | 24 x 24 per cell, sized w | boulder, cave, plain | Top half: alternating olive X-plate (`#484830`, `#303024`) and grey stone blocks (`#606054`, `#786c60`), a beaded orange-yellow trim strip under it; boulder state hangs a row of pale boulders (`#84786c`, light `#909078`, shade `#303024`); cave state a dark green band `#182418` with thin teal lines `#18483c`. | `r02`, `z13`, `z03` |
| `plankBridge` | new | 24 x 24 per cell, sized w | static | Riveted olive-brown top band `#483c24` with bolts and box insets, two brown planks `#604824`, `#6c3c18` under it, dark lower edge; ends rest on `girderColumn` posts. | `z12`, `z08`, demo frame |
| `brassDeck` | new | 24 x 48 per cell, sized w | static | Two rows: brass L-brackets `#6c6030` with bright edges `#e4c048`, teal-grey panels `#243030`, `#3c483c`, small white lamp slots, dark legs. | `z02`, `z16` |
| `girderColumn` | new | 24 wide, sized h | wall stack, short post | Olive X-plate column `#484830`, `#303024`, dark `#182418`, a pale steel collar `#909078` at each cell top, a pale foot block with a brass grille at the base. | `z16`, `z12`, `r04` |
| `brickRuin` | new | 120 x 120, sized w h | stepped break, low stub | Dark brown bricks `#483024`, `#60543c`, `#6c603c` with a stepped broken top falling to one side, scorch and dirt. | `z01` |
| `caveWalkway` | new (added in the port) | 24 x 24 per cell, sized w | static | The cave underside of `jungleWalkway` as its own asset: the walkway top half over a dark green band `#182418` with thin teal lines `#18483c`, no grass. | `z04` |
| `stoneParapet` | new (added in the layout) | 144 x 48 wall, 24 x 96 pillar, sized w h | low wall, pillar | Grey stone courses with the beaded orange trim of `jungleWalkway` under each, moss on top; a stacked `jungleWalkway` read as a floor. Low wall 79-84 r18-19, pillar 77-78 r16-19. | map 1848,384 |
| `caveChasm` | rework | 96 x 240 | deadly | Keep the dark bands, add broken cobble edges from `cobbleFill` at both sides. | `v04`, `z04` |

### Group B: buildings, supports, pipes, rubble, rock

| Id | New or rework | Box (units) | States | Look | Crops |
|---|---|---|---|---|---|
| `jungleBuilding` | new | 192 x 120, sized w h | plain, door and roof vent, shell hole, two storeys | Greenish concrete `#545448`, `#606054`, shade `#3c483c`, a brown roof edge `#483024`, barred windows (dark glass `#000c0c`, white bars), solid piers at both ends; two-storey state stacks a narrower upper block (120-131 r35-41). | `z12`, `z10`, `r02`, demo sheets 02-03 |
| `jungleTower` | new | 48 x 312, sized h | static | Rusted riveted steel post `#6c6030`, `#604824`, dark `#483c24` with rivets, X bracing on one side `#6c3c18`, rust drips. | `r07`, `r08`, `z02` |
| `stoneStack` | new | 48 x 120, sized h | 3 stones, 5 stones | Flat grey-tan boulders stacked and balanced, each slightly offset, moss on the top stone (`STONE` palette). | `z10`, demo sheet 04 |
| `coolantPipe` | new | 24 x 24 per cell, sized w or h | horizontal, vertical, L bend | Teal pipe `#18483c` with a light stripe `#3c8478`, steel posts `#546060` every cell, a brown lower plate `#3c3018`; vertical state a thin silver pipe. | `z04`, `z14`, `v05`, `z02` |
| `rockLedges` | new | 240 x 336, sized w h, flip | mass, overhang, cave | Grey-tan boulders `#786c60`, `#84786c`, light `#909078`, shade `#303024`, dark gaps `#242424` stacked as overhanging slabs with moss caps and the beaded trim on ledge tops, wooden stair rails inside; cave state in dark moss tones. | `z07`, `z05`, `r03`, `z04` |
| `rockSlope` | new | 216 x 192, flip | static | Slab steps falling down-left from floor 32 to floor 41, each slab lit on top, dark under. | `r05` |
| `rockDebris` | new | 120 x 72, sized w | stones, stones with wood | Loose stones and short broken trunk pieces `#604824` on a ledge. | `z06`, `v02` |
| `deckRailing` | new | 24 x 24 per cell, sized w | rail, bent | Brass handrail `#9c6c3c` with highlights `#e4c048`, dark girder posts, two rails. | `z02` |
| `chainFence` | rework (add state) | as today | add mesh overgrown | The vesnice mesh with vines and leaf clumps from `vine` and `leafBlob` climbing from the posts. | `r02`, `r06`, `z06` |
| `fallenTree` | rework | 254 x 184 | blocking | Retint bark to brown wood `#604824`, `#483018`, dark `#18180c`, add bark lines and branch stubs; keep the root ball and rocks. | `z06`, demo sheet 05 |

### Group C: machines, vehicles, clutter, mounted, signs

| Id | New or rework | Box (units) | States | Look | Crops |
|---|---|---|---|---|---|
| `chemTank` | new | 144 x 48 single, 144 x 96 pair | single, stacked pair | Chrome teal-grey horizontal tank `#303c3c`, `#3c4848`, `#546060` with white highlight bands and dome ends, orange valve bands `#6c3c18` on the saddles, a yellow trefoil sign (demo). | `z08`, `z11`, demo sheets 02-04 |
| `excavator` | new | 144 x 72 | static | Red mining excavator `#90240c`, `#78240c`, dark `#542400` with a grey curved boom and bucket on the left, tracks, rust. | `r08`, `z02` |
| `rustBoiler` | new (added in the layout) | 66 x 84 | static | Rust-brown riveted boiler block, red-brown top plate, fire door, gauge and stack, a chrome drum at its base, short pipe stubs into the cobble behind. Cells 58-59 r34-36, floor 37. | map 1392,816 |
| `caveCapsule` | new | 30 x 48 | static | Ribbed silver dome capsule `#546060`, `#303c3c` with a white highlight strip, bolted base ring. | `z04`, demo sheet 01 |
| `helicopterWreck` | new | 168 x 144 | static | Bronze-rust fuselage `#603018`, `#483018`, `#544830` tilted nose up, bent rotor blades, tail boom up to the right, overgrown with green foliage `#303c18`, `#243018`; the crate prop stands under it. | `z01`, demo sheet 02 |
| `overgrownWreck` | new | 144 x 48 | sedan, pickup, jeep shell | State 0 is the original orange-rust crushed sedan `#784824`, `#9c6c18`, dark `#483018`, one wheel showing, ferns on the roof; the others are a pickup and a military jeep shell in the same rot. Mesto density needs 13 big clutter, so vary states. | `z09`, demo sheet 01 |
| `fernBush` | new | 48 x 36 | fern, berry bush, broad leaf | The berry bush at 54 r35 (`#304818`, `#3c6018`, `#243c18`, red berries) and the demo ferns, from `fern`, `frond`, `leafBlob`. Never reads like a pickup. | `z13`, demo frame |
| `logPile` | new | 60 x 30 | stack, single | Cut logs, bark `#604824`, pale cut faces `#9c846c` with rings, moss. | none in the original |
| `oilDrum` | new | 20 x 30 | upright, tipped leaking | Rust-brown drum `#604824` with moss `#3c6018`, a dark leak pool when tipped. Not light brown, so it never reads as the crate. | none in the original |
| `rockVent` | new | 48 x 36 | closed, rusted open | Oval steel rim `#546060` with horizontal slats in a rock face, rust drips; open state a dark hole with a bent slat. | `z07`, demo sheet 03 |
| `energySign` | new | 24 x 30 | lit, faded | Yellow octagon `#e4c048` with a black E on a short bracket, rust at the edge. | `z07`, demo sheet 03 |

### Group D: interactive objects and items rework

Changes as in Interactive objects. Box is the current box.

| Id | New or rework | Box (units) | States | Look | Crops |
|---|---|---|---|---|---|
| `boulder` | new | 100 x 100 | standing, blown | Round cracked grey-tan boulder, moss cap; blown a low stump. | `v01`, `v02`, demo sheet 04 |
| `spikes` | rework | 192 x 22 | open, rubble | Pale steel spikes, teal tint, no blood; rubble state heap over cols 56-58. | `r02`, `v02` |
| `waterfall` | rework | 154 x 451 | plain, with stone steps | Greyer stripes; state 1 adds the two stone blocks. | `r04`, `v03` |
| `flamethrowerDoor` | rework | 243 x 102 | locked, opened | Greenish concrete, teal-grey door with the red X lamp on it, second wing and stone stack. | `z10`, demo sheet 03 |
| `towerLift` | rework | 100 x 385 | at bottom, at top | Blue-grey chevron pole, hazard-striped cage station with the call panel, rails and silver pipe. | `z02`, `z03`, `z16` |
| `cannonTurret` | rework | 62 x 47 | live, off | Teal-green dome with chrome rim, hazard band, wider base plate. | `z01`, `v05`, demo frame |
| `distributionCabinet` | rework | 46 x 43 | intact, shot | Flush cave-wall box in conduit teal with the E sign; shot a black scorched hole. | `z14`, `z15` |
| `jeep` | rework | 104 x 51 | empty tank, fueled, winching | The jeep wreck body intact, teal-green camo, winch A-frame of tubes with drum and hook at the back. | `z06`, demo sheet 05 |
| `stonePuzzle` | rework | 54 x 33 | unsolved, solved | Carved square panel with four angular stones, gold when solved. | `z05`, demo sheet 04 |
| `tripwire` | rework | 100 x 32 | armed, cut | Stone block and board posts, the wire and grenade kept. | `z13` |
| `canister`, `cutters`, `grenade`, `flamethrower`, `mine`, `bonusPickup`, `crate`, `smallKey` | keep | as today | as today | Items stay clean; check sizes against the sheet hero only. | - |

Counts: 35 layout feature kinds, 20 assets exist (17 in `env-jungle.js`, plus shared `chainFence`, `crate`, `smallKey`), 28 new assets (A 9, B 8, C 10, D 1), 12 reworks (9 interactive objects, `caveChasm`, `fallenTree`, `chainFence`).
