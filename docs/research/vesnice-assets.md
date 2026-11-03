# Vesnice (mission 2) asset list

Every kind of feature in the original map `docs/research/gamedata/png/maps/map_M21.png` (24 px per cell), cropped region by region with `tools/map/crop.mjs`, with the asset of the design sheet that draws it. Cells are `col, row` (rows are map rows; floors are rows 23, 32, 41, 50, 59, 68). Role is the role of `docs/blueprints/map-composition.md`. The demo footage in `docs/research/video/` covers mesto and jungle only; no vesnice frame was found, so the sky follows `LEV2.GRA` frame 0 (`docs/research/gamedata/png/lev2/f000.png`).

Review the sheet at `spikes/env-design/index.html?mission=vesnice&scope=own`.

## Layout features

| Feature kind | Original cells | Asset | Role | States |
|---|---|---|---|---|
| Sky, far jungle with palms and ruined walls | `LEV2.GRA` frame 0 | `villageBackdrop` | sky | static |
| Far layer between floors (none in the original: black) | open cells between floors | `farPalms`, `farRuins` | far | palms, palms over a wall; ruined block, water tower |
| Crate block masses (olive steel panels, brace, yellow seam) | 50-60 r15-24, 6-14 r34-49, 69-76 r52-68, 88-95 r12-31, 140-145 r50-58 | `crateWall` | filler (terrain wall) | static, sized w h |
| Floor-end riveted blocks (stand-row walls) | 76 r22, 93-99 r58, 109 r32, 152 r32 | `rivetWall` | wall | edge post, plain |
| Timber walls (village) | none as a wall; timber of 63-76 r34-40 | `plankWall` | wall | planks, burnt |
| Ammo depot: dark block walls with sprayed red and pale graffiti letters, AMMO plates with a yellow edge, tiny ammo boxes | 23-28 r38-40, 30-38 r29-31 | left out (user) | | |
| Mesh fence with posts, sign plate, rusty tears | 58-66 r20-22, 62-75 r38-40, 80-85 r56-58, 101-110 r20-22, 104-112 r65-67 | `chainFence` (shared, mesh states) | fence | chain-link, mesh with sign, mesh torn |
| Grassy floor rows (grass over grey curb stones) | every floor row, e.g. 58-66 r23 | `grassyWalkway` | floor (terrain ledge) | grass, trampled |
| Riveted steel plates in floors | 93-100 r59, 63-67 r32 | `steelDeckPlate` | floor | static, sized w |
| Lift stop landings | every lift stop | `liftLanding` (shared lift machine) | floor | shared |
| Free-standing floor runs | short runs at lift shafts, e.g. 123-124 r23 | `trussWalkway` | girder (terrain girder) | static, sized w |
| Pale concrete houses, window grids, ruined roofs | 38-49 r43-49, 91-100 r61-68, 96-110 r46-49 | `villageHouse` | building | concrete house, ruined arch hall |
| Timber building on stilts, window rows | 89-98 r50-58, 63-76 r34-40, 80-87 r43-49 | `stiltBuilding` | building | timber block, burnt |
| Concrete power houses: barred vents, green bolt panel, sparks on the roof | 105-112 r35-40, 76-80 r19-22, 121-128 r55-58 | `powerHouse` | building | intact, damaged roof |
| X-braced lattice columns with amber lamp tiles | 130, 136, 141, 148 r12-30; 118, 122 r27-31; 85 r24-32 | `latticeMast` | support | with lamps, plain |
| Wooden watchtower | 36-40 r34-40 | `watchtower` | support | static |
| Bronze pipe columns | 60 r33-41, 85 r24-32, 89 r60-68, 118 r33-41 | `pipeColumn` (shared, bronze state) | pipe | concrete, bronze, sized h |
| Overhead pipeline with orange clamps and housings | 118-150 r24-26 | `overheadPipeline` | pipe (hangs) | static, sized w |
| Transformer with coils | 121-127 r34-40 | `transformer` | machine | static |
| Horizontal bronze tanks | 128-133 r37-40, 138-143 r28-31 | `storageTank` (horizontal state), `fuelTank` (shared) | machine | storageTank: upright pair, horizontal |
| Squat riveted storage tanks, pipe stack | 124-130 r27-31 | `storageTank` | machine | upright pair, horizontal |
| Power plant: lattice gantry, insulators, coils, dome tank | 126-141 r12-22 | `powerPlant` | machine | static |
| Rock cliffs of boulders on the crate masses | 50-60 r14-24, 9-14 r34-49, 104-113 r51-58, 135-141 r50-58, 124-127 r60-67 | `rockCliff` | rubble | static, sized w h, flip |
| Loose rock fragments | 124-126 r61-67, 105-106 r58 | `rubbleHeap` | rubble | stone heap, concrete slabs |
| Amber lamp boxes (dark plate, orange dome) | on the lattice columns, 130-148 r12-30 | `warningLamp` | mounted, sign | lit, dead |
| Green high-voltage boxes with a bolt | 79 r21, 107 r39 | `junctionBox` (mesto `wireBox` on a pole) | mounted | closed, open |
| Vehicles (none in the original) | - | `militaryWreck` | bigClutter | army truck, burnt jeep, tracked carrier |
| Barrels, sandbags (none in the original) | - | `fuelDrum`, `sandbags` | smallClutter | 3 and 2 |
| Shells lying at the depot | 31-38 r31, 24-28 r40 | `shellCrate` | smallClutter | stacked, broken |
| Sign plates (grey plate, red bars) | on the fences, 63 r20, 70 r39, 93 r57 | fence plate in `chainFence` mesh state | sign | - |
| Lift shafts, decks and panels (panel with red arrow) | 9 lifts, e.g. 115-117 r32-41 | `lift`, `liftPanel` (shared lift machine) | panel | shared |

## Interactive objects and items (kept assets)

Master drawings with rot wear added (grain, rust drips, pooled dirt, chipped edges, scorched rims on holes): `sourceTeleport`, `targetTeleport`, `teleportPad`, `brokenTeleport`, `fuseBox`, `electricCabinet`, `energyBarrier`, `fireBarricade`, `dynamiteWall`, `powerBridge`, `smoulderingRemains` (ground scorch only), `overheadPipeline`, `transformer`, `storageTank`. `cannon`: master gun, wheels and firing, with the wider body, blue-grey steel, rust drips and hazard band of the design set. `bridgeGuardPost`: design set. Items and pickups stay clean master art: `smallKey` (draws the mesto `craneKey`), `walkieTalkie`, `detonator`, `projectileCrate` (hazard block and AMMO label), `projectile`, `fuse`, `dynamite`, `navCircuit`, `toaster`, `energyPickup`, `ammoPickup`, `shieldPickup`. The `bridgeGuard` is a person and stays clean.

## Skipped

- Black void around the map: the original has no sky behind its tiles; `villageBackdrop` and the far layer replace it.
- Tile seams and the half-drawn tile rows of the decoded map (e.g. 61-76 r33-34 broken window tiles): decoding artefacts of the converter, drawn as whole buildings instead.
