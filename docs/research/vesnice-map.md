# Vesnice map inventory

Step 2 of `docs/blueprints/map-composition.md` for vesnice: every feature of the original map `map_M21.png` (24 px per cell), cropped region by region with `tools/map/crop.mjs`, mapped to its asset in `config/levels/vesnice/world.json` or a stated skip. Cells are `col,row`; floors are the plank rows 23, 32, 41, 50, 59, 68.

Every region also has: crate block masses (terrain `wall`, `crateWall`), grassy floor runs (terrain `ledge`, `grassyWalkway`), far palms and ruins in the sky between floors (`farPalms`, `farRuins`), a lift panel beside every lift stop and ground clutter (`militaryWreck`, `fuelDrum`, `sandbags`, `shellCrate`).

## East, floors 23 and 32 (cols 107-159)

| Feature | Cells | Asset |
|---|---|---|
| Rock slope west of floor 23 | 117-125, 13-22 | `rockCliff` |
| Rock slope east of floor 23 | 147-156, 13-23 | `rockCliff` (flip) |
| Lattice towers with lamps and gantry | 131-141, 12-22 | `powerPlant` |
| Coils and pipe stack on floor 23 | 128-141, 18-22 | `powerPlant` |
| Source teleport | 128-129, 20-22 | prop `sourceTeleport` |
| Overhead pipe under floor 23 | 107-141, 25-26 | `overheadPipeline` (2) |
| Two upright tanks and pipe stack | 121-130, 27-31 | `storageTank` |
| Mesh fence behind the tanks | 120-135, 29-31 | `chainFence` |
| Horizontal tank | 136-142, 28-31 | `storageTank` (horizontal) |
| Lattice masts with lamps | 132, 139, 142, 27-31 | `latticeMast` (2) |
| Fuse box hut | 146-151, 28-31 | `rivetWall`, `warningLamp`, prop `fuseBox` |
| Smouldering remains, fence | 110-113, 29-31 | `smoulderingRemains` dressing (searched state), `smallKey` item by its hand (picked on touch, user), `chainFence` |
| Riveted floor-end wall | 109, 28-31 | `rivetWall` |
| East edge rock | 152-159, 24-41 | `rockCliff` (flip, 2) |

## East, floor 41 (cols 100-155)

| Feature | Cells | Asset |
|---|---|---|
| House with green panel | 102-112, 36-40 | `villageHouse` |
| Bronze pipe column | 120, 30-41 | `pipeColumn` (bronze) |
| Ruined building | 121-128, 34-40 | `villageHouse` (ruined), `junctionBox` |
| Horizontal fuel tanks | 128-133, 143-148, 37-40 | `fuelTank` (2) |
| Ruined machine house | 136-141, 35-40 | `transformer` |
| Mesh fences | 133-136, 150-152, 38-40 | `chainFence` (2) |
| Lattice mast | 144, 34-40 | `latticeMast` |
| Overhead pipe | 141-152, 35 | `overheadPipeline` |
| Ammo bonus | 129, 41 | skipped: no bonus pickup kind in the engine yet |

## Middle, floors 23 to 41 (cols 46-99)

| Feature | Cells | Asset |
|---|---|---|
| Rock mass between floors 23 and 32 | 46-63, 14-31 | `rockCliff` (2) |
| Crate mass with rock face | 85-96, 12-31 | terrain, `rockCliff` (flip) |
| Mesh fence, guard, walkie-talkie | 59-69, 21-22 | `chainFence`, prop `bridgeGuard`, item `walkieTalkie` |
| Utility house with green panel | 76-80, 18-22 | `powerHouse`, `junctionBox` |
| Energy bonus | 83, 23 | skipped: no bonus pickup kind |
| Target teleport, pad 13 top | 65, 42, rows 29-31 | props `targetTeleport`, `padDown` |
| Timber block on stilts, fence | 63-77, 33-40 | `stiltBuilding`, `chainFence` |
| Bronze pipe columns | 60, 85, 33-40 | `pipeColumn` (bronze, 2) |
| Lattice column | 87, 23-31 | `latticeMast` |
| Mesh fence, barrier | 93-99, 37-40 | `chainFence`, prop `energyBarrier` |
| Toaster | 61, 41 | `weapon` prop, `toaster` asset |

## West, floors 32 to 50 (cols 7-62)

| Feature | Cells | Asset |
|---|---|---|
| Wall 14 and its depot run | 29-38, 27-31 | prop `dynamiteWall` |
| Barricade and its depot run | 22-29, 36-40 | prop `fireBarricade` |
| Power bridge, guard posts | 43-59, 41 | props `powerBridge`, `bridgeGuardPost` (east bank, code wall col 58), `westGuardPost` (west bank, mirrored) |
| Cannon and watchtower | 31-43, 34-40 | prop `cannon`, `watchtower` |
| Ruin by the bridge | 40-44, 36-40 | `villageHouse` (ruined) |
| West rock | 10-15, 33-50 | `rockCliff` (2) |
| Mesh fences | 25-34, 55-58, 47-49 | `chainFence` (2) |
| House and pillar | 34-48, 44-49 | `villageHouse` (ruined), `latticeMast` |
| Pad 13 bottom | 50-54, 49 | prop `padUp` |
| Rock mound | 58-74, 42-50 | `rockCliff` (2) |
| Shield bonus | 41, 41 | skipped: no bonus pickup kind |
| Floor 32 west of wall 14 | 7-28, 32 | skipped: never reached, the dynamite ends the level there |

## Lower floors 50 to 68 (cols 68-146)

| Feature | Cells | Asset |
|---|---|---|
| Timber block on stilts | 80-88, 42-49 | `stiltBuilding` (burnt) |
| Detonator | 79, 50 | item `detonator` |
| Two village houses | 95-112, 44-49 | `villageHouse` (2) |
| Crate with projectile | 115, 50 | prop `projectileCrate` |
| Mesh fence | 120-122, 47-49 | `chainFence` |
| Lattice masts | 126, 135, 42-49 | `latticeMast` (2) |
| East rock slope | 137-146, 41-50 | `rockCliff` (flip) |
| Timber block on stilts | 90-99, 50-57 | `stiltBuilding` |
| Broken teleport | 94-96, 57-58 | prop `brokenTeleport` |
| Rock mound | 102-116, 51-58 | `rockCliff` (2) |
| Cabinet house | 122-128, 54-58 | `powerHouse`, prop `electricCabinet` |
| Lattice mast, rock | 135-140, 50-58 | `latticeMast`, `rockCliff` (flip) |
| Mesh fence | 80-84, 56-58 | `chainFence` |
| West rock | 70-80, 51-68 | `rockCliff` (2) |
| Bronze pipe column | 89, 59-68 | `pipeColumn` (bronze) |
| Ruined house | 92-104, 61-67 | `villageHouse` (ruined) |
| Dynamite | 99, 68 | item `dynamite` |
| Mesh fence | 105-113, 66-68 | `chainFence` |
| East rock | 123-130, 60-68 | `rockCliff` (flip) |

## Counts

| Region | Features | Placed | Skipped |
|---|---|---|---|
| East, floors 23 and 32 | 14 | 14 | 0 |
| East, floor 41 | 9 | 8 | 1 |
| Middle, floors 23 to 41 | 11 | 10 | 1 |
| West, floors 32 to 50 | 12 | 10 | 2 |
| Lower floors 50 to 68 | 19 | 19 | 0 |
