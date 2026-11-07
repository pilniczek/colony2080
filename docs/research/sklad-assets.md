# Sklad (mission 6) asset list

Every kind of feature in the original map `docs/research/gamedata/png/maps/map_M61.png` (24 px per cell, 160 x 80 cells) and its variants M62-M64, cropped region by region with `tools/map/crop.mjs`, with the planned asset that draws it. Cells are `col, row` (map rows; floors sit on rows 18, 26, 34, 42, 50, 58, 66 and 74, plus a short plank pair on rows 29-30). Role is the role of `docs/blueprints/map-composition.md`.

Sources: map crops of M61-M64 and the raw maps `docs/research/gamedata/raw/C28/MAPY/M61.MAP`-`M64.MAP` (2 bytes per cell), `LEV6.GRA` frame 0 (`docs/research/gamedata/png/LEV6_f0.png`, the backdrop) and frame 1 (`lev6/f001.png`, a transport plane on the airfield), `LEV6_sheet.png`, the in-game map `MAPA6_f0.png`, the walkthrough marker map `docs/research/sources/cz-walkthroughs/img/6.jpg` with `docs/research/reports/06-cz-walkthroughs.md` LEVEL 6, and `docs/research/reports/09-gamedata.md` (level 6 = sklad, warehouse / depot, "barred building, burning sky; airplane on airfield"). No demo footage of mission 6 exists. Hex colours are sampled from the map and the frames (rounded to steps of 12).

The open cells of the map are plain black (`#000000`, tile value 0): the backdrop shows there in the game. Indoor cells carry wall art, so open black means outdoors: the west yard (33-53 r27-42 and the catwalk sky 25-62 r9-30), the north-east sky (117-159 r9-38) and the east yard sky (121-133 r39-46). Rows 0-8 and 76-79, cols 0-24 and the cells east of col 147 are outside the map (black, never reached). `MAPA6` draws the outdoors pale and the building dark, which matches.

## Layout features

| Feature kind | Original cells | Asset | Role | States |
|---|---|---|---|---|
| Backdrop: black and orange burning cloud sky (`#0c0c0c`, `#30180c`, `#603018`, `#d86c24`), dark olive barracks block with barred windows (`#303c24`, `#242424`), fire strip at the bottom (`#e48418`, `#f0b430`, `#c04818`) | `LEV6.GRA` frame 0 | `depotBackdrop` | sky | barracks; airfield (frame 1: grey-olive transport plane, `#484830`, `#6c3c18`, under fire clouds `#a83c18`, `#f09024`, grey concrete runway `#545448`, `#60543c`) |
| Far layer between floors (none in the original: black) | open outdoor cells | `farAirfield` (new) | far | hangar row; control tower with radar mast; parked transport plane; sized w h |
| Sandstone blocks in rows with deep black mortar gaps (`#544830`, `#483c24`, `#6c603c` on `#0c0c0c`) | every never reached and wall cell, e.g. 54-120 r9-13, 85-101 r27-41, 25-31 r41-75, 134-147 r39-75 | `depotBlockWall` | filler (terrain wall, deep) | static, sized w h |
| Dark brown brick strip at a block edge (`#30240c`, `#483c24`) | 62 r9-17, 70 r19-26, 89 r19-42, 32 r31-42, 98 r43-50, 90 r48-57, 86 r67-74, 117 r66-74, 131 r43-49, 138 r59-74 | `brickPier` | wall | edge strip; sized h |
| Olive concrete inner walls (`#483c24`, `#3c3018`, `#604824`) with yellow-black hazard bands at the top and foot, conduit runs, mossy green patches (`#182418`, `#3c483c`) | every indoor storey, e.g. 63-108 r14-17, 99-106 r29-33 and r37-41, 33-57 r44-49 and r54-57, 59-90 r53-57, 33-57 r62-65, 95-116 r62-65 | `depotInnerWall` | wall | plain; conduit; mossy; sized w h |
| Window grids of 2 x 2 black panes in a grey steel frame (`#606060`, `#a8a884`) | 74-76 r15-16, 100-102 r15-16, 50-52 r47-48, 78-80 r47-48, 71-73 r55-56, 121-123 r62-64 | `depotInnerWall` window state | wall | - |
| Roller shutter doors: ribbed brown slats in a riveted angled steel frame (`#483024`, `#484830`, `#60543c`) | 63-67 r14-17, 88-93 r14-17, 37-41 r60-65 (pair), 55-59 r54-57 (pair), 81-84 r54-57, 105-108 r44-49, 102-106 r62-65 | `rollerShutter` | wall | closed; half open; sized w |
| Concrete portal frames: pale slab lintels (`#6c603c`), heavy posts and steel pipe stubs around dark storage openings | 61-75 r44-49, 44-50 r53-57, 76-86 r60-65, 110-116 r43-46 | `loadingBay` | wall | open bay; sized w h |
| Brown plank doors with a teal band (`#483018`, `#603018`, `#244848`) | 79 r15-17, 85 r15-17, 77 r71-73, 128 r62-65 | `plankDoor` | wall | static |
| Steel I-beam floor: grey top rail (`#84786c`, `#484830`) over a dark web (`#182418`) with hanging bolts | every floor row: 30-80, 84-101, 105-111 r18; 62-80, 93-113 r26; 93-114 r34; 33-73, 92-111 r42; 33-133 r50; 33-90 r58; 33-137 r66; 33-85, 118-137 r74 | `depotFloor` | floor (terrain ledge) | static, sized w |
| Lift stop decks | every stop of the 6 lifts | `liftLanding` (shared lift machine) | floor | shared |
| Steel catwalk out of the building over the west yard | 30-62 r18 | `steelCatwalk` | girder (terrain girder) | static, sized w |
| Short plank pair in the yard | 66-72 r29-30 | `steelCatwalk` | girder | - |
| X-braced lattice girder, 1 row deep (`#484830`, `#60543c`) | 46-90 r37 | `latticeGirder` | girder | static, sized w |
| Green corrugated hangar wall (`#3c483c`, `#303024`) over a silver ribbed shutter band (`#6c6054`, `#84786c`), posts above it | 25-31 r36-39 (west end), 95-128 r59-61 (long hangar roof band) | `depotHangar` | building | wall with band; band only; sized w |
| Beige concrete office block (`#60543c`, `#544830`) with teal glass windows and teal-capped pillars (`#48786c`, `#3c4854`) | 70-86 r22-26, 79-86 r14-17, 78-91 r70-73, 118-137 r70-73 | `depotOffice` | building | windows; pillar row; sized w h |
| Stack of catwalk tiles at the catwalk west end | 30-32 r9-23 | `scaffoldTower` | support | static, sized h |
| Riveted steel column blocks with a dark star mark (`#545448`, `#483c24`) | 50 r33-41, 45 r39-41 | `rivetColumn` | support | sized h |
| Concrete posts with moss | 116 r43-49, 121 r43-49 | `concretePost` | support | sized h |
| Tall steel stack pipe with X-brace (`#545448`, `#483c24`) | 46 r30-40 | `yardPipe` | pipe | vertical stack; horizontal run with flanges; elbow; sized w or h |
| Horizontal pipe with rusty broken flanges and bent elbows | 44-49 r39-41 | `yardPipe` | pipe | - |
| Conduit pipes under every indoor ceiling | e.g. 64-108 r14, 35-57 r46, 35-90 r54, 95-116 r62 | `wallConduit` (hangs) | pipe | static, sized w |
| Horizontal boiler tank with curved end caps and an orange gauge | 65-69 r39-41 | `boilerTank` | machine | static |
| Control bank: yellow-orange lamp matrix (`#c09c48`, `#9c9c48`, `#6c6030`) on grey steel stands | 128-136 r62-65 | `controlBank` | machine | lit; dead |
| Stored robots: yellow-orange mechs (`#e49018`, `#c07824`, `#f0b430`) on racks in a blue-grey machine bay (`#303c3c`, `#3c6060`) with red cables (`#78240c`, `#542400`) and white light tubes | 35-66 r70-73 | `robotBay` | machine | stored mechs; empty rack; sized w (the bomb target, task 11 of the walkthrough) |
| Lab benches with grey monitors showing a red creature, blood smears (`#786048`, `#b48460`) | 94-104 r72-73, 121-125 r72-73 | `labBench` | machine | static |
| Dark green steel lockers and cabinets (`#182418`, `#48786c` glass) | 104-106 r24-25, 99-101 r33, 105-107 r40-41, 76-77 r64-65, 95-100 r65 | `greenLocker` | machine | closed; open |
| Rusty debris wedge and loose steel bits | 47-48 r41 | `scrapHeap` | rubble | debris; bent beams |
| Grey framed wall terminal with a green text screen | 36 r72-73 | `wallTerminal` | mounted | on; off |
| Small grey louvred box (`#6c6c60`) | 71 r17, 136 r64 | `wallTerminal` box state | mounted | - |
| Ceiling hood lamp with a glare in a dark alcove | 100-101 r32-33, 106 r39 | `hoodLamp` | mounted, sign | lit; dead |
| Grey T-arm lamp post with a guard kiosk door below | 126-127 r46-49 | `yardLamp` | sign | lit; dead |
| Chain-link fence on posts, grey sign plate with red text, blood smear | 33-42 r39-41, 109-131 r47-49 | `chainFence` (shared) | fence | chain-link, mesh with sign |
| Orange wooden crates with a yellow arrow, stacked two high (`#603018`, `#6c3c18`, `#905430`) | 97 r23-25, 95 r63-65, 113 r63-65 | `cargoCrate` | smallClutter | single; stack of two; broken |
| AMMO stencil crate | 70 r17 | `ammoCrate` | smallClutter, sign | static |
| Vehicles (none in the original) | - | `depotWreck` (new) | bigClutter | burnt forklift; fuel bowser; aircraft tug |
| Lift shafts: twin guide rails with a yellow rung strip (`#604824`, `#6c6030`) | 81-83 r18-50 (stops 18, 26, 50), 102-104 r18-50 (stops 18, 26, 34, 42, 50), 55-57 r42-50, 57-59 r58-66, 36-38 r50-74 (stops 50, 58, 66, 74), 133-135 r66-74 | `lift` (shared lift machine) | - | shared |
| Lift panel tile with a red arrow beside each stop | every lift stop | `liftPanel` (shared lift machine) | panel | shared |

Every role has a sklad asset: sky `depotBackdrop`; far `farAirfield`; filler `depotBlockWall`; wall `depotInnerWall`, `brickPier`, `rollerShutter`, `loadingBay`, `plankDoor`; fence `chainFence`; floor `depotFloor`, `liftLanding`; girder `steelCatwalk`, `latticeGirder`; building `depotHangar`, `depotOffice`; support `scaffoldTower`, `rivetColumn`, `concretePost`; pipe `yardPipe`, `wallConduit`; machine `boilerTank`, `controlBank`, `robotBay`, `labBench`, `greenLocker`; rubble `scrapHeap`; mounted `wallTerminal`, `hoodLamp`; bigClutter `depotWreck`; smallClutter `cargoCrate`, `ammoCrate`; sign `yardLamp`, `hoodLamp`, `ammoCrate`; panel `liftPanel`. Hung from the ceiling: `wallConduit`, `hoodLamp`. The map has no ladder.

### Planned roles

```
sky          depotBackdrop
far          farAirfield (new)
filler       depotBlockWall
wall         depotInnerWall, brickPier, rollerShutter, loadingBay, plankDoor
fence        chainFence (shared)
floor        depotFloor, liftLanding
girder       steelCatwalk, latticeGirder
building     depotHangar, depotOffice
support      scaffoldTower, rivetColumn, concretePost
pipe         yardPipe, wallConduit
machine      boilerTank, controlBank, robotBay, labBench, greenLocker
rubble       scrapHeap
mounted      wallTerminal, hoodLamp
bigClutter   depotWreck (new)
smallClutter cargoCrate, ammoCrate
sign         yardLamp, hoodLamp, ammoCrate
panel        liftPanel
```

## Map variants

Diffed cell by cell over the raw maps. Every change sits in the hangar room east end, 119-136 r59-66, beside the lift 133-135.

| Cells | M61 | M62 | M63 | M64 |
|---|---|---|---|---|
| 122-123 r61 (2 cells, hangar band) | small grille plate with a bracket in the band | plain band, grille gone | as M62 | as M62 |
| 122-124 r63-65 (9 cells) | dark hole over a grey cone base | grey guard robot turret: head on the cone base | as M62 | as M61 |
| 129-133 r63-65 (13 cells) | control bank lamp matrix | computer desk: two grey monitors, a terminal box with a yellow keypad | as M61 | as M61 |

Read with the walkthrough (unscrew the grille, grenade the guard robot, log into the computer), the variants are the grille, guard robot and computer states; which variant is loaded when is for report 19.

## Interactive objects and items

Filled from report 19. Other research already names these mission 6 objects and items (walkthrough LEVEL 6): rocket launcher (`raketomet`), grenade, two lockers, key A and key B, screwdriver, vent grille over the guard robot, the alien (shot, then his hand), controller, lift control, damaged electric circuit (puzzle, `img/obvod.gif`), computer, lift controller, desk with the floppy disk, time bomb, stored robots, aircraft. Map tiles tied to them: guard robot and grille (variant cells above), computer (M62 129-133 r63-65), wall terminal 36 r72-73, stored robots 35-66 r70-73, lab benches 94-104 and 121-125 r72-73, lockers (`greenLocker` cells), climbable crates `cargoCrate` 95 and 113 r63-65.

## Skipped

- Single black cells inside indoor walls (e.g. 70-71 r14, 81 r14, 102-103 r14, 74 r19-20, 115 r63, 121 r61-62, 47-48 r53-57 opening interior): tiles the converter does not decode, or dark openings drawn by `loadingBay`.
- Tile seams and half-drawn rows of the decoded map: drawn as whole walls and doors instead.
- The black outdoor cells: the backdrop and the far layer replace them.
