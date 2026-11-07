# Jeskyne (mission 4) asset list

Every kind of feature in the original map `docs/research/gamedata/png/maps/map_M41.png` (24 px per cell) and its variants M42-M43, cropped region by region with `tools/map/crop.mjs`, with the asset of the design sheet that draws it. Cells are `col, row` (map rows, the same as `config/levels/jeskyne/map.json` rows; floors sit at any row, for example 15, 20, 28, 29, 36, 37, 44, 48, 55, 63, 74). Role is the role of `docs/blueprints/map-composition.md`.

Sources: map crops of M41-M43, `LEV4.GRA` frame 0 (`docs/research/gamedata/png/lev4/f000.png`, the backdrop), the item preview sheets `PRETYC`, `PRKLIC41`-`PRKLIC44`, `docs/research/reports/16-level4-layout.md`, `config/levels/jeskyne/objects.json` and `map.json`. No demo footage of mission 4 exists. The film clips of mission 4 (`krapnik1`, `barelbum`, `xtyc`, `vkart1-3`, `zabvozik`, `propast`, `lava`) are not decoded. Hex colours are sampled from the map and frame 0 (rounded to steps of 12).

The open cells of the map are plain near-black brown (`#13100c`): the backdrop shows there in the game. Rows 0-5 and the cells east of col 145 are outside the map (black).

Review the sheet at `spikes/env-design/index.html?mission=jeskyne&scope=own`.

## Layout features

| Feature kind | Original cells | Asset | Role | States |
|---|---|---|---|---|
| Backdrop: mossy olive rock ceiling (`#484830`, `#483c24`), dark band, pale ground (`#6c603c`) with tan stalagmites (`#846c54`, `#a87854`), orange lava stripe (`#e48418`, `#f0b430`) | `LEV4.GRA` frame 0 | `caveBackdrop` | sky | static |
| Far layer between floors (none in the original: plain dark brown) | open cells between floors | `farStalagmites` (new) | far | stalagmites; dripstone curtain with lava glow; sized w h |
| Shale rock: horizontal rust flakes (`#30180c`, `#483018`) with orange highlights, the wall tiles (9,61)-(9,69) | never reached cells and every terrain wall | `caveRock` | filler (terrain wall, deep) | static, sized w h |
| Shale pillars 2-4 cells wide at floor ends | 15-19 r20-25, 33-36 r7-15, 104-107 r24-36, 75-78 r40-48, 79-82 r51-61, 86-89 r55-58, 109-112 r55-58, 116-119 r44-47, 136-139 r17-20 | `caveRock` | filler (terrain wall) | - |
| Curved rock rib bands, 3-5 rows above a floor: rust and orange crescents (`#6c3c18`) with grey-green edges | 47-56 r16-19, 20-35 r23-27, 27-38 r30-35, 54-79 r25-28, 85-104 r25-28, 96-110 r10-14, 101-108 r16-20, 58-75 r32-36, 116-127 r27-31, 91-102 r47-51, 97-108 r53-57, 123-148 r43-47, 37-56 r50-54, 19-50 r58-62, 64-75 r59-63, 16-35 r66-73, 45-120 r69-73 | `rockRibs` | wall | ribs; ribs with dark hollow; sized w h |
| Dark hollows: black ovals framed by the ribs | 27-31 r31-35, 59-71 r25-28, 47-52 r60-63, 19-24 r67-73, 117-123 r70-73 | `rockRibs` hollow state | wall | - |
| Grey-brown diagonal scree slabs at the foot of every rib band | e.g. 27-34 r34-35, 85-104 r28 | `screeHeap` (also drawn in `rockRibs`) | rubble | slab scree; shale and crystal chips; sized w |
| Pebble floor strip, a third of a cell thick (`#303024`, `#30240c`, `#3c3018`), ragged underside | every floor row, e.g. 19-39 r20, 131-150 r48, 21-133 r74 | `caveFloor` | floor (terrain ledge) | pebble strip; end cap; sized w |
| Floor end caps (tiles (7,22) (7,23) (7,103) (7,104)) | run ends, e.g. 150-151 r48 | `caveFloor` end cap state | floor | - |
| Lower pebble strip under the bottom corridor | 20-133 r76 | `caveFloor` | floor | - |
| Lift stop decks (tiles (7,61)-(7,63)) | upper stops of the 6 lifts | `liftLanding` (shared lift machine) | floor | shared |
| Free-standing rock ledges with a dark teal slab (`#243024`) on the left end, zigzag stairs | 126-136 r16-31, 133-138 r21-29, 116-121 r31-38, 116-121 r48-55, 89-95 r52-58, 86-90 r60-65, 108-114 r60-64 | `rockLedge` | girder (terrain girder) | with teal slab; plain; sized w |
| Knobbly vertical rock or root strands, dark brown with orange and grey nodules | 13 r16-28, 43 r20-40, 47 r20-40, 52 r29-44, 65 r20-24, 76 r30-38, 82 r43-60, 102 r29-38, 107 r24-36, 113 r42-65, 123 r31-38, 132 r20-29, 137 r15-29, 151 r43-46 | `ropeColumn` | support | knobbly strand; twisted cable; sized h |
| Thick twisted cable of rounded grey-green strands | 62-63 r52-58 | `ropeColumn` twisted state | support | - |
| Riveted machine-room fronts: dark green-grey steel bays (`#303c24`, `#3c3c30`), I-beam posts, rivets | 100-103 and 108-122 r10-14, 110-121 r16-20, 49-53 r15-19, 65-71 r32-36, 28-36 r39-42, 41-50 r50-54, 69-73 r60-63, 58-62 r70-73 | `metalPillars` | building | panel bays; with curved hull; broken strut; sized w h |
| Curved green-grey hull plate in a front | 113-114 r11-14, 21-23 r58-61 | `metalPillars` hull state | building | - |
| Bent riveted strut hanging askew | 115-116 r10-13, 19-20 r59-62 | `metalPillars` broken state | building | - |
| Thin pipes along the top rail of a front | 30-35 r39 | `minePipe` | pipe | horizontal run; riser with elbow; sized w or h |
| Steel pressure cylinder (`#546060`, `#3c4848`) with an olive checker cap ring (`#786c3c`), a lamp glare and a slim curved strap beside it | 20-21 r23-27, 96-97 r11-14, 57-58 and 61-62 r40-43, 70-71 and 86-87 r70-73 | `pressureTank` | machine | static, sized h |
| White lamp glare with a horizontal lens streak over a green-grey glass dome | 24 and 26 r24-26, 91, 94, 96, 98 r25-27, 64-68 r40-43, 77-80 r70-72 | `caveLamp` | mounted, sign | lit; dead |
| EXPLOSIVE stencil plate (olive on grey) | 28-30 r39 | `explosiveSign` | sign | grey stencil; red hazard |
| Lava curtain: six one-row dark red bands (`#78240c`, `#542400`) with fine vertical yellow streaks | 37-42 r68-73 | `lavaFall` | wall | flowing, sized w h |
| Lava strips in the floor gaps of the bottom corridor | row 74, e.g. 43-56, 81-82, 84-86, 91-93, 105-108, 109-110, 119-123 | `lavaPit` (interactive hazard) | - | - |
| Mine cart conveyor: two stacked rows of boxy olive containers (`#484818`, `#545418`) | 97-130 r38-39 | `mineCarts` (interactive conveyor) | - | - |
| Grey X-truss rail stub at the west end of the carts | 95-97 r39 | `mineCarts` (add to its west end) | - | - |
| Lift shafts: twin grey guide rails, white chain links, green-grey head with a grey stone counterweight at the top | 44-46 r15-44, 49-54 r15-55, 72-74 r29-37, 82-88 r21-29, 97-99 r60-74, 127-129 r50-74 | `lift` (shared lift machine) | - | shared |
| Lift panel tile (10,36) on each stop | every lift stop | `liftPanel` (shared lift machine) | panel | shared |
| Fence (none in the original) | - | `safetyRail` (new) | fence | intact; broken; sized w |
| Vehicles (none in the original) | - | `mineWreck` (new) | bigClutter | tipped ore cart; abandoned rock drill |
| Ground clutter (none in the original) | - | `powderKeg` (new), `toolCrate` (new) | smallClutter | single, stack of three, burst; tools, ore, smashed |

Every role has a jeskyne asset: sky `caveBackdrop`; far `farStalagmites`; filler `caveRock`; wall `rockRibs`, `lavaFall`; fence `safetyRail`; floor `caveFloor`, `liftLanding`; girder `rockLedge`; building `metalPillars`; support `ropeColumn`; pipe `minePipe`; machine `pressureTank`; rubble `screeHeap`; mounted `caveLamp`; bigClutter `mineWreck`; smallClutter `powderKeg`, `toolCrate`; sign `explosiveSign`, `caveLamp`; panel `liftPanel`. The cave has no ceiling-hung asset in the original; `ropeColumn` hangs between floors.

None of these layout assets is drawn yet: the old draft art was dropped, so `caveBackdrop`, `caveRock`, `caveFloor`, `rockLedge`, `ropeColumn`, `metalPillars` and `lavaFall` are original objects without a drawing.

## Interactive objects and items

Drawn in `spikes/shared/env-jeskyne.js`. Doors, levers, stone blocks, the key slots and the lift lock are sprites in the original, not map tiles, so no map crop shows them; for those, match the level's metal: the dark green-grey riveted steel of the machine-room fronts. None of the drawn assets uses worn edge chips (`G.chips`).

| Asset | Mismatch with the original | Rot wear missing |
|---|---|---|
| `stalactite` | Original: pale grey-white faceted crystal shards (`#a8a8a8`, `#c0c0b4`, dark grey facets `#242424`) hanging from a dark green-grey rock lip, 2 cols x 3 rows (62-63 r16-18). Ours: a brown rock cone 6 rows long. Make it pale faceted shards, 3 rows long. | rock: chips, drips at the lip |
| `crystal` | Original: white-grey faceted cluster 3 cols x 2 rows (64-66 r27-28), no blue. Ours: blue ice prisms 5 rows tall with a blue glow. Recolour pale grey-white like the stalactite and cut to 2 rows (48 units). | none (crystal stays clean), base rock: grain |
| `explosiveTank` | Original (M42 only): a polished chrome cylinder 1 col wide (104 r19-20) with a bright vertical highlight, a mossy grey stone block at 103 r20 and three thin grey posts at 103 r19. Ours: an orange barrel 2 cols wide with a hazard band. Make it a chrome cylinder with a small hazard mark and the block beside it. | chips |
| `mineCarts` | Original: two stacked rows of boxy olive containers with dark brown side panels (`#30240c`), an orange top rim and rust streaks, packed edge to edge, the lower row offset by half a box; no wheels show; 2 rows tall (48 units). Ours: one row of trapezoid tubs with wheels and gaps, 17 units tall. Add the grey X-truss rail stub at the west end (95-97 r39). | drips, chips |
| `leverBank` | Sprite. Our blue-grey steel box: recolour to the green-grey riveted steel. | drips, chips |
| `leverDoor`, `keyDoors`, `caveCardDoor`, `airlock` | Sprites. Our slabs are rust brown with blue-grey jambs: make the jambs and frame green-grey riveted steel; the slab may stay rust. | chips |
| `liftLock` | Sprite; its spot (34-36 r55) sits among green-grey machine-room fronts (41-50 r50-54). Recolour the blue-grey box to that steel. | chips |
| `keySlots` | Sprite. Recolour to green-grey steel. | drips, chips |
| `stoneBlocks` | Sprite; grey stone blocks fit. | chips |
| `cartCrusher` (new) | Blue-grey steel: recolour to green-grey riveted steel. | dirt, chips |
| `lavaPit` | Original strips are dark red (`#78240c`, `#542400`) with fine vertical orange-yellow streaks, one row tall, in the floor gaps of row 74. Ours is a bright yellow-to-orange gradient with dark crust: darken it and add the vertical streaks. | none (hazard) |
| `chasm` | The original shows plain void; our faint red haze is fine. | none |
| `rod` | Original (`PRETYC`): a long thin brown metal rod. Ours: steel grey with a rust block end. Make it brown. | none (item) |
| `yellowKey`, `orangeKey`, `blueKey` | Original key cards (`PRKLIC41`): a white card with a coloured stripe along one end and a red arrow logo. Ours: a solid coloured card with a white chip. Make a white card with the key colour as the stripe. | none (item) |
| `entryCard` | `PRKLIC44` shows a grey-blue printed card with an orange edge band; ours is white with a black stripe and a gold chip. | none (item) |

The shared `lift`, `liftPanel` and `liftLanding` stay as they are; the original shaft head with its grey stone counterweight (45-46 r15-17, 49-50 r24-26) is optional detail.

## Skipped

- Black cells inside the map (for example 12-15 r60-75, 59-71 r20-24, single black tiles in rib bands and shafts): tiles the converter does not decode. The black ovals framed by ribs are drawn as the `rockRibs` hollow state.
- Marker columns in the two death drops: 11-12 r60-75 and 61-62 r20-24 repeat every 5 rows an AMMO plate, an olive cylinder over white rubble and a brown crate on black, and small grey boxes with an orange `E` sit at 15 r62, 15 r72, 66 r16 and 66 r20. They sit only in the death zones, so they look like editor or zone marker tiles, not scenery.
- M43 cells 16-17 r61-62 (two thin pale brown posts) and 102 r72: a data quirk of the variant (report 16).
- The plain dark brown of the open cells: the backdrop and the far layer replace it.
