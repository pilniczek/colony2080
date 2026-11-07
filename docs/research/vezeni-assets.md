# Vezeni (mission 5) asset list

Every kind of feature in the original map `docs/research/gamedata/png/maps/map_M51.png` (24 px per cell, 160 x 80 cells) and its variants M52-M56, cropped region by region with `tools/map/crop.mjs`, with the asset of the design sheet that draws it. Cells are `col, row` (map rows; floors sit at rows 19, 22-36 (one plank per row), 37, 45, 50, 55, 60, 65 and 71). Role is the role of `docs/blueprints/map-composition.md`.

Sources: map crops of M51-M56, `LEV5.GRA` frame 0 (`docs/research/gamedata/png/lev5/f000.png`, the backdrop), `docs/research/reports/06-cz-walkthroughs.md` LEVEL 5, `docs/research/reports/09-gamedata.md`. No demo footage of mission 5 exists. No `config/levels/vezeni/` exists yet. Hex colours are sampled from the map and frame 0 (rounded to steps of 12).

The open cells of the map are plain near-black (`#0c0c0c`, `#18180c`): the backdrop shows there in the game. The map content spans cols 18-134, rows 8-74; the rest is outside the map (black).

Layout, top to bottom: two prison wall towers (cols 23-27 and 109-113) hold a wall-top walkway with a chain fence (row 19); under it a stack of rusty catwalk planks fills the big hall (rows 22-36); a pillared hall with lamps (floor 37, cols 30-62) and a wider one (floor 45, cols 48-123); four cell-block corridors (floors 50, 55, 60, 65, cols 33-123); a blue-grey ventilation machine hall at the bottom (floor 71); a ventilation room in the south-east (cols 111-124, rows 59-73). Lift shafts with green stone walls join them.

Review the sheet at `spikes/env-design/index.html?mission=vezeni`.

## Layout features

| Feature kind | Original cells | Asset | Role | States |
|---|---|---|---|---|
| Backdrop: dark rust-brown storm clouds (`#603018`, `#483018`, `#303024`) over black, a thin burning horizon band (`#e48418`, `#f0b430`, `#c04818`) at the bottom | `LEV5.GRA` frame 0 | `prisonSky` | sky | static |
| Far layer between floors (none in the original: plain near-black) | open cells between floors | `farPrisonBlocks` (new) | far | cell blocks with lit slit windows; searchlight tower; sized w h |
| Dark rust brick with olive stone quoins (`#30180c`, `#18180c`, `#483c24`) | tower brick 23-24 r9-35, 114-115 r8-21; vent room 116-123 r61-62, r69-70 | `prisonBrick` | filler (terrain wall, deep) | static, sized w h |
| Green-grey stone block masonry (`#303c3c`, `#3c483c`, `#243030`) with a chrome pipe on one edge: every lift shaft wall | 29-30 r20-38, 33 r20-74, 85-88 r43-58, 98-101 r66-72, 111-114 r59-74, 122-124 r34-74 | `shaftMasonry` | wall | masonry with chrome pipe; plain; sized w h |
| Cell-block back wall: rusty plate bays (`#844824`, `#784830`), dark green-grey steel panels (`#303c3c`, `#3c3c30`), dark sooty bays (`#000c0c`, `#18180c`), olive cross rails | rows 46-49, 51-54, 56-59, 61-64 of cols 33-123 | `cellBlockWall` | wall | rust plate bay; steel panel bay; sooty bay; sized w h |
| Barred cell window: 9 grey rods (`#606054`) over black, an orange rail (`#844824`) across the middle | 63-69 r46-47, 50-55 r61-62, 63-68 r61-62, 93-98 r61-62 | `cellBlockWall` barred state | wall | - |
| Teal steel mesh grating (`#243024`, `#243030`, `#3c483c`) on a green rail (`#3c4830`, `#304824`), a third of a cell thick | corridor floors r45, r50, r55, r60, r65 of cols 33-123; hall floor r37 of cols 30-62 | `meshFloor` | floor (terrain ledge) | grating; end cap; sized w |
| Wall-top walkway: riveted girder with dark square bays (`#483024`, `#3c3018`, `#606054`) | 28-108 r19-20 | `wallWalk` | floor | walkway; with grate hole (M55 106 r19); sized w |
| Lift stop decks (green rail and grating at each stop) | every lift stop | `liftLanding` (shared lift machine) | floor | shared |
| Rusty catwalk planks, one per row, a thin brown rail (`#3c3018`, `#30240c`) over a zigzag truss | 44-131 r22-36 (densest 46-102 r22-28, 102-131 r22-24 and r32-35, a U at 129-134 r22-29) | `scrapCatwalk` | girder (terrain girder) | intact; bent; sized w |
| Prison wall tower: tan concrete pier (`#60543c`, `#6c603c`) with a vertical groove beside the brick, a row of steel spikes (`#545448`) down the yard side and a chrome edge rail | 23-27 r9-35 (spikes face east), 109-113 r8-21 (spikes face west) | `prisonTower` | building | spiked; spikes broken; sized h |
| Pillared hall bays: brown concrete posts (`#483024`) with a white lamp glare and a teal lamp hood, a heavy beam over them | 30-62 r33-37, 48-123 r41-45 | `pillarHall` | building | bay with lamp; bay dark; sized w h |
| Tan concrete gate pillars, 2-3 cols wide, hanging under the walkway | 67-79 r20-29, 85-92 r24-25 | `concretePillar` | support | static, sized h |
| Same tan pillars in the ventilation room | 116-117, 120-121 r63-68 | `concretePillar` | support | - |
| Copper-orange horizontal pipes (`#a87830`, `#906c30`, `#784824`) along the bottom of each corridor wall | rows 48, 53, 58, 63 of cols 33-123 | `corridorPipe` | pipe | horizontal run; thin vertical copper riser (`#604824`, e.g. 58 r46-49); sized w or h |
| Brass ventilation pipe with rusty flanged valve heads | 113-124 r65-66 | `ventPipe` | pipe | run; run with valve head; sized w |
| Blue-grey steel ventilation machinery (`#303c3c`, `#243030`, `#3c4848`): box frames, diagonal braces, vertical screw rods, olive rails (`#484830`), a fan behind a grille | 33-110 r66-71 (fan 51-52 r67-68) | `ventMachinery` | machine | frame; frame with fan; sized w |
| Scrap dump: twisted khaki plates (`#6c603c`, `#483c24`) and grey-green pipe ends (`#243024`, `#3c483c`) | 36-41 r46-50 | `prisonDump` | rubble | heap; low heap; sized w |
| White ceiling strip light (`#fcfcfc` tube in a dark housing) | every corridor ceiling, e.g. 50-51 r46, 61 r51, 102 r46 | `ceilingStrip` | mounted, sign | lit; dead |
| Small wall grille box (dark steel, three slats) beside each SUB plate | e.g. 33 r20, 53 r44, 32 r37 | `wallGrille` | mounted | static |
| Red warning lamp box on the walkway top, steel post with a green cap | 69 r18, 75 r18, 79 r18 (lamps); 73 r18-19, 82 r18-19 (posts) | `wallBeacon` | sign, mounted | lit; dark |
| Stencil plate `SUB 4` (`#9c6c18` letters on `#844824` rust) at each lift stop, `SUB 1`, `SUB 2`, `SUB 3` big wall stencils in the corridors | `SUB 4` e.g. 30-32 r20 and r37, 50-52 r44, 90-92 r44 and r49, 116-118 r60 and r72; `SUB 1` 38-40 r53, 120-122 r53; `SUB 2` 38-40 r58, 93-95 r58; `SUB 3` 93-95 r63 | `subSign` | sign | SUB 1; SUB 2; SUB 3; SUB 4 |
| Chain fence on the walkway: grey mesh (`#546060`, `#78786c`) on thin posts every 5 cols, a dark red stain | 28-48 r17-18, 88-108 r17-18 | `prisonFence` | fence | intact; torn; sized w |
| Lift shafts: a strip of tan and black chain blobs between green stone walls, `SUB 4` plates at both stops | 31 r20-37, 51 r38-44, 92 r44-49, 81 r49-54, 102 r54-60, 121 r49-54, 91 r61-71, 117 r60-72 | `lift` (shared lift machine) | - | shared |
| Lift panel at each stop | every lift stop | `liftPanel` (shared lift machine) | panel | shared |
| Transporter: grey tracked vehicle (M53-M56) at the dump, the gate it smashes at 113 r46-50 | 44-50 r46-50 | interactive (object decode) | - | - |
| Keyboard on the dump (M51, gone in M52), crushed guard robot (M53, M56) | 41-44 r49-50; 43-44 r56-60 | interactive (object decode) | - | - |
| Vehicles (none in the original) | - | `cellBunk` (new) | bigClutter | steel double bunk; collapsed bunk |
| Ground clutter (none in the original) | - | `cellLocker` (new), `slopBin` (new) | smallClutter | closed, open, dented; bin, tipped bin |

Every role has a vezeni asset: sky `prisonSky`; far `farPrisonBlocks`; filler `prisonBrick`; wall `shaftMasonry`, `cellBlockWall`; fence `prisonFence`; floor `meshFloor`, `wallWalk`, `liftLanding`; girder `scrapCatwalk`; building `prisonTower`, `pillarHall`; support `concretePillar`; pipe `corridorPipe`, `ventPipe`; machine `ventMachinery`; rubble `prisonDump`; mounted `ceilingStrip`, `wallGrille`, `wallBeacon`; bigClutter `cellBunk`; smallClutter `cellLocker`, `slopBin`; sign `subSign`, `wallBeacon`, `ceilingStrip`; panel `liftPanel`. Underground rule: corridors and the machine hall have low ceilings with `ceilingStrip` tubes on the ceiling.

Drawn in `spikes/shared/env-vezeni-terrain.js` (sky, far, filler, wall, floor, girder), `env-vezeni-structures.js` (building, support, pipe, machine, fence) and `env-vezeni-clutter.js` (mounted, sign, clutter). `prisonDump` is in `env-vezeni-items.js`.

## Interactive objects and items

Decoded in `docs/research/reports/18-level5-layout.md`. Machines and doors in `spikes/shared/env-vezeni.js`; the dump and items in `env-vezeni-items.js`. Cells are `col, floor`.

| Asset | Original | States | Gaps |
|---|---|---|---|
| `prisonDump` | scrap heap 36-41 r46-50, search spot col 40 floor 50 | full; searched; low heap (scenery) | map tiles garbled, layout read from the crop |
| `keyboard` | inventory only, `PRKLAV` | in inventory | - |
| `coverPanel` | 41-44 r49-50 (open in M52) | closed; open; logged in | tile mosaic, reconstructed |
| `cellBars` | col 45 r46-50 (gone in M53) | closed; broken | - |
| `scrapper` | 45-48 r47-50 with the crushed guard at 41-44 (M53 on) | away (nothing); crashed | arm pose is ours |
| `chestPlate` | col 42 floor 50 after the login, `PRPLAT` | hidden; on ground; in inventory | engraved number unread, drawn as marks |
| `idLockDoor` | door 43-44 r56-60, lock 40-43 floor 60 | closed; open | no film, designed |
| `gateKey` | col 59 floor 55, `PRKLIC` | on ground; in inventory | - |
| `mgx800` | col 50 floor 60, HUD plate `DESKA5` | on ground; taken | no HUD icon or held model yet |
| `jack` | col 103 floor 71, `PRZVED` | on ground; in inventory | post jack from the `ZVEDVRAT` film |
| `paperScrap` | col 122 floor 72, reads 56133 | on ground; in inventory | - |
| `gateDoor` | 111-113 r46-50 (M53 closed, M54 jammed, M55 open) | closed; jammed; open | shape from `ROZDVERE` and `ZVEDVRAT` |
| `ventControl` | 104-108 floor 20, a sprite | locked; fan stopped | no original art, designed |
| `ventShaft` | shafts at 67-69, 72-74, 77-79, 85-87 under floor 20 | spinning (animated); stopped | duct drawn cut open to show the fan |

The lifts (`lift`) and the bonus pickups (`energyPickup`, `ammoPickup`, `shieldPickup`) reuse the shared assets.

## Skipped

- Black cells inside the map: tiles the converter does not decode. They show in the pillared hall bays (e.g. 46-50 r35-36, 53-57 r35-36), the chain strips of the shafts, the catwalk stack (e.g. 49 r25, 52-53 r26-28, 84-92 r27-30) and the machine hall (53 r67-71, 83 r69-71). The hall bays draw as `pillarHall`, the shafts as `lift`.
- Open near-black cells west of the left tower and the shafts (18-22 r9-38, 18-32 r38-73) and east of col 124 (124-134 r33-73): no floor reaches them, so they look unreached; filler `prisonBrick` or the backdrop covers them.
- The towers rise above any floor (23-27 r9-18, 109-113 r8-18): kept as tall building art, not reached.
- M52-M56 variants change only interactive spots: M52 drops the keyboard (41-44 r49-50); M53-M56 add the transporter (44-50 r46-50) and break the gate at col 113 r46-50; M53 and M56 add the crushed guard (43-44 r56-60); M55 opens a grate hole in the walkway at 106 r19. These belong to the object decode.
