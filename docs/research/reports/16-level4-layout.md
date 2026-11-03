# 16 - Level 4 (jeskyne) layout, objects and enemies

Status: draft. Machine-readable copies (local only): `gamedata/disasm/level4_layout.json`, `gamedata/disasm/level4_enemies_decoded.json`. Config: `config/levels/jeskyne/`. Addresses are `segment:offset` in `gamedata/disasm/verify/a*.asm`. Tags: **[code]** read in the disassembly, **[map]** checked against `MAPY/M41..M43.MAP`, **[inferred]** derived, not checked in the running game, **[open]** not decoded.

## TL;DR

- **One executable for all levels.** `KLEV1.EXE` reads `level4` / `-level4` from the command line and sets the level byte `[0xDC78] = 4` (`1:0x4C92`). The init dispatcher `4:0x80D6` then calls the level-4 init `4:0x0A3A-0x1836` (`m41.map`, item names right after it). Level 3 hands over at `3:0x984C`. Level 4 hands over to level 5 at `3:0xEBCF`. **[code]**
- **Floors are tiles, not bands.** Level 4 has a per-level floor tile list. The hero falls wherever no listed tile lies under his feet, and he jumps one row up onto ledges. Floors sit at any row, not on the 7-row grid of level 1. **[code] [map]**
- **6 lifts** (lift 1 locked until the rod is used), **5 items** on the map, **3 bonus pickups**, **7 lever/key/card doors**, **2 stone blocks**, **17 table enemies** (two new types) and **8 troopers** in a second actor table. **[code]**
- **Map variants** M41, then M42 (stalactite shot), then M43 (tank shot). Nothing else loads a map. **[code] [map]**
- **Dead ends.** Five scripted death zones (game over), a one-way start chain that strands a hero who skipped the rod, and a one-way lower half. Details at the end. **[code] [inferred]**

## Coordinate frame

Same frame as reports 10 and 13: map column = engine x + 6, floor (plank) row = engine y + 6, stand row = engine y + 5. Every item, enemy and trooper of the init lies on a floor tile at (x + 6, y + 6) in M41 (30 of 30). **[code] [map]**

Spawn is engine (28, 8), cell (34, 14). This is inside a vertical shaft with no floor tile until row 20, so the hero starts with a fall onto floor 20 (columns 19-39). **[code] [inferred]**

## Movement rules (new compared with level 1)

- **Floor tiles** (`7:0xC69B`, plank row under the hero), as (sheet, tile) pairs: sheet 7 tiles 1-4, 22-23, 26, 61-63, 103-104; sheet 8 tiles 97-100; sheet 2 tiles 2, 4, 6-8; sheet 1 tiles 5-7. **[code]**
- **Fall.** With no floor tile and the hero not hidden, the fall state starts (0x5B / 0x443) and the hero drops 6 px per tick (`7:0x95E5`, `7:0x9ADF`). Landing needs a floor tile at a whole row (`7:0x8B00`). There is no fall damage: nothing in `7:0x8000-0x9E00` touches energy. **[code]**
- **Jump.** States 0x43-0x5A rise 32 px (5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1, 1) and fall back the same way (`7:0x9387-0x9542`). At the top the y offset wraps into the row above (`3:0x67D0`). On the way down the offset passes 0, so a floor tile there ends the jump one row up. **[code]** Horizontal drift is 3 px per tick walking and 6 px per tick running. That gives a reach of about 3 or 6 cells, which fits the ledge stairs (ledges one row apart, offset 1-3 columns). **[inferred]**
- **Mine carts.** A floor tile (2,2), (2,4) or (2,6) under the hero carries him east 5 px per tick, plus 1 on odd ticks (`7:0x8875`). The cart strip is rows 38-39, columns 97-130. **[code] [map]**
- **Clamp.** Engine y is clamped to 71 (`1:0x4081`). **[code]**

## Lifts

Same 24-byte slots at `ds:0x4C90 + 0x18 * (n - 1)` and the same ride rules as level 1 (no remote call). **[code]** Deck tiles (7,61), (7,62), (7,63) appear at upper stops only. Bottom stops show plain floor. Every stop has tile (10,36) in the stand row of the centre column. **[map]**

| Lift | Engine x | Columns | Stops (floor rows) | Start | Notes |
|---|---|---|---|---|---|
| 1 | 44 | 49-51 | 55; after the rod 29, 44, 55 | 55 | locked, marker 3 |
| 2 | 39 | 44-46 | 20, 44 | 44 | |
| 3 | 67 | 72-74 | 29, 37 | 29 | |
| 4 | 77 | 82-84 | 21, 23, 29 | 29 | top and mid stops two rows apart |
| 5 | 92 | 97-99 | 66, 74 | 74 | |
| 6 | 122 | 127-129 | 56, 74 | 74 | exit route |

- **Lift lock.** Rod used at engine x 28-30, y 49 (columns 34-36, floor 55). The rod is consumed, `XTYC.anm` plays with TYCI JSI PREPNUL MECHANICKOU POJISTKU, and slot 1 is rewritten to top 23, mid 38, bottom 49 (`5:0xECB7`). **[code]**
- **Lift 4 snap.** While the hero is at engine x 96-118, y 30-33 (the cart stretch), lift 4's current row is set to its top every tick (`7:0x87A5`). This puts the lift at floor 21 for a hero who comes back west over chasm 8. **[code]** Purpose **[inferred]**. The routine `5:0x81DF` called after it is **[open]**.

## Items and bonuses

Same record layout and pickup rule as level 1 (`0x548A + 0x111n`, hero x X-2..X, same row). A used item gets x = y = 1. **[code]**

| Record | Item | Engine | Cell (col, floor row) | Marker | Use |
|---|---|---|---|---|---|
| 1 | rod (TYC) | 21, 22 | 27, 28 | 2 | lift lock, consumed |
| 2 | yellow key | 129, 25 | 135, 31 | 11 | key slots, consumed |
| 3 | orange key | 66, 17 | 72, 23 | 7 | key slots, consumed |
| 4 | blue key | 111, 15 | 117, 21 | 9 | key slots, consumed |
| 5 | entry card | 93, 46 | 99, 52 | 14 | card door, consumed |

No item is given by a task. Pickup clips: `sebtyc.anm`, `sebk41-44.anm` (`4:0x9D3A-0x9FB2`). **[code]**

Bonuses (`5:0x49xx-0x5Dxx`): energy at (13, 66), cell (19, 72); +350 type-1 ammo (cap 999) at (53, 57), cell (59, 63); +1 shield (cap 5) at (83, 60), cell (89, 66). **[code]**

## Blocking

### Wall tiles

Push-back list (`3:0x584E`, flag `[0xDFCD]`), stand row as in level 1: **[code]**

| Sheet | Tiles |
|---|---|
| 9 | 61-64, 66-69 (rock fill) |
| 7 | 64, 65, 77, 78 (explosive tank, M42 only), 103, 104 (floor end caps) |

A second list at `3:0x5C2D` (flag `[0xDFCE]`) drops 7/64-65 and 7/77-78. Its reader was not found. **[open]**

### Wall tables

| Table | Engine | Floor rows | Meaning | Removed by |
|---|---|---|---|---|
| west `ds:0x52EF` | 120, 12 | 16-18 | ledge stair edge near column 126 | - |
| east `ds:0x515F` | 78, 18 | 22-24 | east end of floor 23 (orange key floor) | - |
| east `ds:0x515F` | 56, 23 | 27-29 | crystal on floor 29 (columns 62-64) | stalactite shot |

### Doors and levers

Door table (`7:0x3609-0x3D21`): 49-byte records at `0x3BA9 + 0x31n`. Fields: +0 y, +4 x, +8 frame (0 closed, 12 open), +0xD open flag, +0xE..+0x1D four lever (y, x) pairs, +0x29..+0x2C states, +0x2D..+0x30 target. A reset loop (`4:0x08BB`) sets the target to [1,0,0,0] and the states to 0 before the init. A door opens when the states equal the target and closes when they differ. A closed door pushes the hero back on rows y-4..y (`3:0x5F25`). Doors and levers are sprites, not map tiles. **[code]**

| Rec | Door col, floor | Opened by | Marker |
|---|---|---|---|
| 1 | 26, 20 | levers at columns 28, 30, 38, 40 (same floor), combination [0,1,1,1]: leave the leftmost, pull the three right ones | 1 |
| 2 | 55, 44 | all three keys in the slots (`3:0xEB14`) | 12 |
| 3 | 130, 21 | one lever at column 132 | [open] |
| 4 | 125, 21 | one lever at column 123 | [open] |
| 5 | 104, 74 | entry card at engine x 93-97, y 68 | 15 |
| 6, 7 | 133 and 141, 48 | open at start, closed by the exit zone | exit |

The lever key is action code 9 (`push 9; lcall 8:14309`). Whether that is ENTER is **[open]**.

### Stone blocks

Table `ds:0x3DB7 + 0xD*n`, two entries at engine (75, 17) and (75, 18), column 81, floor rows 23-24. Only fists break them: 5 punches each, then the frame runs to 12 and the block stops blocking (`7:0x3236`, `3:0x6369`). Marker 6; the orange key lies behind them. **[code]**

### Key slots and card door

- **Key slots.** Engine x 51-53, y 31 (columns 57-59, floor 37). Each key plays `vkart1-3.anm` with POUZIL JSI ZLUTY/ORANZOVY/MODRY KLIC. **[code]**
- **Card door.** OTEVREL JSI DVERE plays on success. Without the card: NEMAS U SEBE NIC CIM BY JSI OTEVREL DVERE. **[code]**

## Shots that change the map

- **Stalactite** (marker 4) **[code] [map]**
  - Trigger: gun, facing right, hero x 50-55, y 14 (east end of floor 20), once (`5:0x7294`).
  - Effect: `krapnik1.anm` with SESTRELIL JSI KRAPNIK, M42 loads, and the crystal wall-table entry moves to (200, 200).
  - In M42 the stalactite (columns 62-63, rows 16-18) and the crystal (columns 62-64, rows 27-28) are gone.
- **Explosive tank** (marker 8) **[code] [map]**
  - Trigger: gun, facing right, map M42, hero x 92-93, y 15. This is the middle platform at column 99 (`5:0x63ED`).
  - Effect: `barelbum.anm` with ZNICIL JSI BAREL S VYBUSNINOU, then M43 loads.
  - The tank exists only in M42, at columns 103-104, rows 19-20. Its tiles are wall tiles, so it blocks floor 21 on the way to the blue key.
  - Shooting from x 94-98 is game over (`5:0x6959`).

## Zones

Checked every tick (`3:0xCA1A-0xCE37`, `3:0xEA6F-0xEBCF`): **[code]**

| Zone | Engine | Cells | Effect |
|---|---|---|---|
| chasm under the stalactite | x 54-61, y 15-17 | columns 60-67, rows 21-23 | `propast.anm`, game over |
| chasm 8 under the middle platform | x 85-98, y 16 | columns 91-104, row 22 | game over |
| cart crush | x 117-119, y 31-35 | columns 123-125, rows 37-41 | `zabvozik.anm`, game over |
| bottom lava | y above 68 | rows 75 and below | `lava.anm`, game over |
| exit airlock | x 130-133, y 41-49 | columns 136-139, floor 48 | doors 6 and 7 close; when 7 is shut, level 5 starts |

## Map variants

| Variant | Event | Changed cells (cols x rows) | Blocking effect |
|---|---|---|---|
| M42 | stalactite shot | 62-63 x 16-18, 62-64 x 27-28, 103-104 x 19-20 | crystal wall gone, tank wall appears |
| M43 | tank shot | 103-104 x 19-20, 65 x 28, 16-17 x 61-62, 102 x 72 | tank wall gone |

M43 restores the M41 stalactite art at rows 16-18 (the crystal stays gone). This looks like a data quirk. The M43 cells at 16-17 x 61-62 and 102 x 72 are **[open]**. **[map]**

## Enemies

**[code]**, sprites rebuilt from `LEV4.GRA`. Kill counts assume the level 1 hit rule **[inferred]**.

| Kind | Table | Count | Look | hp | Speed | Damage per fire tick |
|---|---|---|---|---|---|---|
| spider walker | `ds:0x6AEF`, type 1 | 7 | box body on thin legs, forward gun (f21, f22) | 5.0 | 2 px | (6 - shields)/6 x 1.2 |
| pod walker | `ds:0x6AEF`, type 2 | 10 | grey domed pod on bent green legs (f23, f24) | 3.0 | 3 px | x 1.4 or 2.4 by facing |
| trooper | `ds:0x39F6`, 23-byte records | 8 | blue humanoid soldier with a rifle (f27 walk, f28 other) | 10.0 | 2 px | (6 - shields)/6 x 3.0, 4 ticks per shot |

- **Table enemies.**
  - Turn chance 1/5 (`4:0xBDB6`), fire chance 1/10 (`4:0xC3D6`).
  - Burst start, 9-tick burst, reach and hit push follow the shared rules in report 14 (Fire rules shared by every level). **[code]**
  - **Pod walker facing rule.** The right-facing burst (states 0x19-0x21, `4:0xE09E`) loads c = 1.4 (`4:0xBACB`); the left-facing burst (states 0x401-0x409, `4:0xE857`) loads 2.4 (`4:0xBABD`, the level 2 constant). So a pod walker shooting left hits almost twice as hard. Probably a copy slip in the original. The spider walker uses 1.2 (`4:0xBA87`) both ways. **[code]**
  - At 0 shields each tick rounds to 1 (spider, pod facing right) or 2 (pod facing left): 9 or 18 per burst. Cycle about 9 + 3 + 10 = 22 ticks, so about 13 or 26 energy per s at 32 ticks per s. **[inferred]**
  - Level 4 lifts no slot by 4 rows: pod walkers stay on their floor. The hover range stays 0, and what the hover update does with it is **[open]**.
  - Kill counts: about 27 gun hits or 9 punches for a spider walker, 14 or 5 for a pod walker.
- **Troopers.** A gun hit takes the ammo type value, a punch takes 1.0 (50 px reach), and the level 3 flamethrower particle takes 0.1. No hit makes the trooper flinch: a hit only lowers hp and puts a spark (`5:0x7891-0x7D83`, `7:0x1B41`). **[code]**

### Trooper behaviour (`5:0x09A8-0x249F`)

**[code]** unless tagged. Per-tick routine over trooper slots 1-10. Record (`ds:0x39F6 + 23n`): +0 / +2 patrol x min / max (cells), +4 x (cells), +8 y, +0xC state byte, +0xD x pixel offset, +0xF y pixel offset, +0x11 hp (Real48). States below 0x64 face right; the same state + 0x64 faces left. Frames are the 48 x 48 sprites of `LEV4.GRA` f27 (walk) and f28 (others), laid out as in report 10.

- **Active** only while the hero is within 16 columns and the trooper is at most 9 rows above or 2 rows below him.
- **Walk** (states 1-0x18, f27 frames 1-24): 2 px per tick (4 in level 8), 64 px per s at 32 ticks per s. At a patrol bound the step is cancelled, so it walks in place. Turns at once (no chance roll) when the hero is more than 2 cells behind it.
- **Stop on sight.** While walking, with the hero on its row, in front and within 10 cells, not in hide state 0x78 / 0x460 and with y offset `[0xDB48] == 0`, it rolls `Random(5)` every tick: 1 → aim (0x19), else → take cover (0x3C). So on the first such tick it stops: 1/5 aim, 4/5 cover.
- **Aim loop** (0x19-0x24, f28 frames 1, 2, 3, 2 for 3 ticks each, 12-tick loop). Leaves for walk when the hero is more than 3 cells ahead and off its row or hiding.
- **Cover** (0x3C → f28 frame 17, 0x3D → frame 18, then 0x25 = frame 16, the dark front view: the trooper steps into the background like the hidden hero). In 0x25 / 0x89 every hero weapon skips it (`5:0x7991`, `7:0x1C6B`). Each tick with the fire key not held (`[0xDC6E] == 0`, set at `3:0x0101`) it leaves with chance 1/20 (`Random(20) == 2`, `5:0x134F`): 0x3E (frame 18), 0x3F (frame 17), then the aim loop. A hero who keeps fire held keeps it in cover; it also returns to walking when the hero leaves its row or hides. Level 8 also teleports it next to the hero on that exit.
- **Fire decision** (`5:0x0F2D`, `5:0x1013`): from walk or the aim loop, not in cover, `Random(9) == 2` (1/9 per tick) with the hero ahead within 6 cells (facing right) or 7 cells (facing left). No row or hiding check here.
- **Shot** (one shot, 17 ticks):
  - wind-up 0x26-0x2F, state + 2 per tick: f28 frames 4, 5, 6, 5, 4 (5 ticks);
  - fire 0x30-0x33: frames 7 (muzzle flash), 8, 9, 10 (rifle kicks up), sound 5 on the first tick (4 ticks). **Every fire tick** takes `(6 - shields) / 6 x 3.0` (`5:0x16E4`, constants 6.0 at `5:0x998`, 3.0 at `5:0x99C`; level 5 4.0, 6 5.0, 7 6.0, 8 5.0) when the hero is not hidden (`[0x3BD9]`), not in hide state 0x78 / 0x460, on its row or one row up, and has a y offset that is a multiple of 6. No x check. At 0 shields 3 per tick, 12 per shot. With 1 shield it is 2.5 per tick, rounded to even, so 2 or 3 by the energy parity;
  - recoil 0x34-0x3B: frames 11, 12, 13, 14, 2 ticks each (8 ticks);
  - then `Random(5)`: 0-3 → cover (0x3C), 4 → aim loop.
- **Hit push on the hero.** Each damaging tick sets hero hit state 0x82 / 0x46A and `[0xE3D2]` = +3 (trooper facing right, `5:0x185E`) or -3 (facing left, `5:0x1F54`): the same 3 px per tick push for 3 ticks after the last hit as the table enemies (report 14). A full shot pushes for about 7 ticks, about 21 px, under one cell. **[inferred]** for the pixel distance. It is not a special knockback: the marker 15 guard uses 9 (`5:0x2AD8`, `5:0x2D76`).
- **Death** (hp < 1.0, states 0x50-0x5A, mirror 0xB4-0xBE): f28 frame 15 (leaning back, rifle up) for 11 ticks, an explosion spark and sound 9 every tick, and the body moves 4 px per tick backwards and 2 px per tick up (44 px and 22 px in total). Then it is gone, no wreck. This is the trooper being thrown back, not the hero.
- **Average cycle** with the hero standing still 6 cells in front, not hiding and not firing: 9 waiting ticks + 17 shot ticks + 4/5 x (2 + 20 + 2) cover ticks, about 45 ticks (1.4 s): 12 energy per cycle, about 8.5 per s at 0 shields. **[inferred]**
- **No special guard.** The shoot-only guard table (`ds:0x39B9`) is empty in level 4. No map-tile guard exists.

Full list with cells and patrols: `config/levels/jeskyne/enemies.json`. By floor (map rows):

| Floor | Entries |
|---|---|
| 15 (top, above the lever doors) | e04, e05 (pods), e06 (spider) |
| 21, 28, 29, 31 | t05; e02 (on the rod); e03, t03; t04 (yellow key) |
| 36, 37, 43, 44 | t01; e07 (key slots); t02; e09 (door 12) |
| 55, 56, 58 | e08 (lift lock); t08; e17 |
| 63, 64, 66 | e11-e14; e10, t06; t07 |
| 74 (bottom corridor) | e15, e16 (pods), e18 (spider) |

## Task chain and routes

Markers from the Score 44 map (`sources/cz-walkthroughs/img/4.jpg`) match the decoded cells. Arrows are one-way drops unless marked as a lift.

```mermaid
flowchart TB
  S["spawn, floor 20: levers 1"] -->|door 1 opens| W["floor 20 west"]
  W -->|drop| R["floor 28: rod 2"]
  R -->|drop| F36["floor 36"] -->|drop| F43["floor 43"] -->|drop| L["floor 55: lift lock 3"]
  L -- "lift 1 after rod" --- H["floor 29 hub"]
  H -- "lift 2 via floor 44" --- T["floor 20 east: shoot stalactite 4"]
  T -.->|M42: crystal gone| H
  H -- lift 3 --- K["floor 37: key slots 5"]
  H -- lift 4 --- O["floor 23: stone blocks 6, orange key 7"]
  H -- lift 4 --- C["floor 21 west: chasm 8, tank"]
  C -.->|M43| B["floor 21 east: blue key 9, lever doors"]
  H -->|drop east of col 103| M["cart strip 10"]
  M -->|jump up ledges| Y["floor 31: yellow key 11"] --> B
  K -.->|three keys| D["door 12, floor 44"] -->|drop| X["floors 51, 63"] -->|exact jump 13| BC["bottom corridor, floor 74"]
  M -->|drop off west end| BC
  BC -- lift 5 --- CA["ledge stair: card 14"]
  BC -->|card door 15| E["lift 6, ledges, floor 48 exit airlock"]
```

The keys and door 12 are the long way round. Dropping off the west end of the cart floor reaches the bottom corridor, and from there the card and the exit, without any key. This matches the walkthrough's shortcut (`zkratka.gif`). **[inferred]**

## Dead ends

Score 44 warns that level 4 allows an unrecoverable mistake. The data gives these causes:

1. **Death zones.** The two chasms, the cart crush, the bottom lava and the tank shot fired from too close are all instant game over (table above). The review's "stalactite lookout where one must not fall" is the drop east of floor 20. **[code]**
2. **Marker 13** (west end of floor 63). Walking off the west end drops into the left shaft (columns 12-15). The first floor tile there is the ledge at row 75, which lies in the lava band (y 69 is above 68), so the hero dies. The safe target is the ledge at row 72 (columns 16-20, energy bonus) under the end of floor 63, and the walkthrough's curved arrow shows the jump. Floor 63 covers that ledge, so reaching it takes an exact jump. **[code]** for the lava rule, **[inferred]** for the path.
3. **Start chain without the rod.** Floor 20 west, 28, 36, 43 and 55 connect only by drops of 7 to 12 rows. Lift 1 on floor 55 is the only way out, and it needs the rod from floor 28. A hero who walks past the rod is stranded and must reload. **[inferred]**: reach model over the floor tiles, jumps of one row up and up to 6 columns across.
4. **One-way lower half.** Floors 48-74 have no lift or jump chain back up. They are entered by drops: from door 12 into floors 51/63, from the west end of the cart floor into floors 59-61 or 74, and from floors 36, 43 and 55. Everything still needed down there (card, card door, exit) is in that half, so the drop costs nothing on the shortcut. **[inferred]**
   - After door 12 (floors 51 and 63) the only way on is the marker-13 jump.
   - Drops from floors 36, 43 or 55 before the rod also land on floor 63.
5. **Lift 4 snap** is not a dead end. The cart route that triggers it also leads back to lift 4 from the east, and the cart route can be repeated. **[inferred]**

The reach model is a script over the floor runs, not the game, so items 3 and 4 need a play test.

## Notes for the port

- A generic converter can no longer derive floors from 7-row bands. It needs the per-level floor tile list, falling, jumping one row up, a death rule per zone and a lava row.
- Doors, levers and stone blocks are sprites driven by tables, not map tiles; only the tank and the crystal change the map.

## Confidence

- Lifts, items, bonuses, spawn, enemy and trooper cells: HIGH (init stores; all 30 placements sit on floor tiles).
- Floor tile list, fall, cart carry, zones, door and block logic, use and shot handlers: HIGH (code).
- Jump reach in cells and the reach-model dead ends: MEDIUM.
- Enemy names and looks: MEDIUM (sprites rebuilt, never seen in footage). Trooper speed, shot and cover logic: HIGH (code); averages per second: MEDIUM (tick rate 32 per s assumed).
