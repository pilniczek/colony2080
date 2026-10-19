# 12 - E-Blaster (level 1 bonus weapon)

How the E-Blaster looks and works in the original level 1. Sources: static analysis of `KLEV1.EXE` (addresses are `segment:offset` in `docs/research/gamedata/disasm/verify/a*.asm`), decoded `GRAFIKA/*.GRA`, footage A (5r7Yie502C0, 320x200) and B (KkPeKkoohvk, 640x360). Tags: **[code]** read in the disassembly, **[footage]** seen in video, **[inferred]** not checked.

Tick rate is CPU-bound, about 32 ticks/s in footage A (see `10-level1-enemies.md`). Times in ticks below.

## Summary

| Item | Value | Tag |
|---|---|---|
| Type | Continuous hit-scan beam, drawn and tested every tick while fire is held | code |
| Range | About 6 cells (144 px) in front of the hero, same floor row only | code |
| Damage | 0.35 hp per tick to every enemy in range (droid / flyer hp 2.0) | code |
| Kill | 5 ticks per droid or flyer (2.0 - 5 x 0.35 = 0.25, dies below 0.25) | code |
| Pierce | Yes, all enemies in range take damage on the same tick | code |
| Ammo | 1 per tick, 400 on pickup, no refills in level 1 | code |
| Guard (marker 15) | Only weapon that hurts it: 4 of 80 hp per tick, about 20 ticks | code |
| Sound | `laser3.snd` every tick while firing | code |

## 1. Look

### Held weapon

- The hero keeps the normal rotary-gun sprite. No E-Blaster-specific hero sprite exists. **[footage]** B 13:04, 14:38, 14:55: the yellow hero aims the same gun, the beam starts at its muzzle.
- Standing fire with weapon 3 skips the gun firing animation (states 0x25-0x42). The hero stays in the stand (0x19) or duck (0x60) pose (`7:0x836F` jumps past the fire-state setup, `7:0x873C` / `7:0x8780` skip the duck-fire state for weapon 3). **[code]**
- Walk-and-fire sprites are used only for weapon 1. With weapon 3 the walk frames stay the plain walk (`7:0x5BDF-0x5BF4`). **[code]**

### Beam sprite

- Graphics: `LEV1.GRA` frame 8, read as packed 24 x 24 tiles. Six animation frames, each six tiles in a row (144 x 24 px strip, art fills x 0-136). Source offset `0x320 + frame x 0x1E00 + tile x 0x240` (`7:0x23E-0x503`). **[code]** Crop: `GRA_LEV1_f008_eblaster_beam_6frames.png`.
- Shape: a jagged lightning zigzag, a white core with blue edges, small loops and a bright crossed knot at the gun end. Band about 6-10 px tall in a 24 px strip. **[code]** (art) **[footage]**
- Colours (palette of LEV1.GRA): deep blue `#202488` glow, steel blue `#6084A4`, light grey `#C4CCCC` / `#98A8A8`, white `#E4ECE0` / `#F4F4F4` core. **[code]**
- Animation: frame index `[0xE3D4]` steps 0-5, one frame per tick, while fire is held (`7:0x1A9-0x1C5`). Each tick adds a random vertical jitter of 0-2 px (`Random(3)`, `7:0xBD`). **[code]**
- Timing: the beam exists only on ticks where fire is held and ammo is above 0. It appears at full length at once, with no travel time. **[code]** **[footage]**
- Placement (screen px, hero sprite at x `124 + [0xDB52]`, row 122): facing left, tiles cover x `[0xDB52] - 14` to `+130`; facing right, the strip is mirrored (`3:0x2EFE` mirror blit, tiles in reverse order) at x `[0xDB52] + 166` to `+310`. The beam starts at the gun on either side of the 48 px hero sprite. **[code]**
- Ducking (states 0x5D-0x60, mirrored 0x445-0x448) lowers the beam 5-8 px. Walking (states 1-0x18) shifts it 5 px forward (`7:0xD4-0x1A4`, `7:0x940-0x956`). **[code]**
- Footage: the beam is about 120-125 game px long, at gun height, and passes through the target and its explosion. **[footage]** B 13:04, 14:24, 14:38, 14:55.

### Impact

- Each tick an enemy in range is hit, the game adds a spark to the shared effect table `ds:0x4E70`, the same spark type (0x0D) the gun uses, at a random 12-23 / 0-11 px offset on the enemy cell (`7:0x7BB-0x837`). Continuous fire gives a stream of sparks. **[code]** An orange spark star near the flyer at B 14:38. **[footage]**
- Death plays the normal enemy explosion (state 100, or 1100 for the other facing) (`7:0x8B8-0x912`). **[code]** **[footage]**

### HUD

- Before pickup the third top-bar slot is an empty grid. **[footage]** A 7:47.
- Pickup reloads the frame from `DESKA3.GRA` (`4:0xA721`), whose slot 3 is a silver gun with a blue-white arc. **[code]** Crop: `GRA_DESKA3_hud_top_with_eblaster_slot3.png`. (`DESKA2.GRA` is the level 3 flamethrower variant, an orange flame.)
- Counter: `n:` plus 3 digits zero-padded, at screen x 160, row 10 (over the right part of the icon). Drawn only once `[0x5486]` (picked) is set, redrawn when the value changes (`6:0x9C96-0x9E3F`). **[code]** `n:400` right after pickup (A 7:53), `n:387` at B 13:04. **[footage]**
- Selected weapon: a 10 px strip under the slot icon on row 21 (x 48 / 99 / 150 for slots 1 / 2 / 3), drawn by `6:0x99CC`, `6:0x9A0D`, `6:0x9A4E`. **[code]**
- The inventory screen lists E-Blaster ammo as `EXTRA` (B 15:01 `EXTRA x324`). **[footage]**

### Sound

- Sound id 6 = `Zvuky\laser3.snd` (handle `ds:0xDF72`, load at `5:0xAD07`), played every firing tick at volume 63, 8000 Hz (`7:0x1C8-0x1D6`, `7:0x97A`). **[code]**
- Weapon switch plays id 4 = `Zvuky\ikona.snd`, volume 45, 20000 Hz (`1:0x436F`). **[code]**

## 2. Behaviour

- **Gates** (`7:0x8A-0xB3`): level 1 (`[0xDC78]`), weapon 3 (`[0x5487]`), fire flag `[0xDC6E]`, ammo `[0xDB38]` > 0. Then ammo goes down by 1 (`7:0xB6`). **[code]**
- **Fire flag** (`3:0x8F-0x1BE`): set while the fire key is held and the current weapon has ammo. It is cleared in the hide states 0x78-0x7C (mirrored 0x460-0x464) and while input 0x0D is held, the key that holds the hide pose (`7:0x8C3F-0x8C9A`). So no firing while hidden. **[code]** Input 0x0D = SHIFT (hide) per the manual. **[inferred]**
- **Hit test, regular enemies** (table `ds:0x6AD8`, 50 slots, `7:0x695-0x918`): `d = ex*24 + epx - (px*24 + [0xDB44] + [0xDB52])`. Facing left: `-144 <= d <= 0`. Facing right: `0 <= d <= 168` (`7:0xD1C-0xD29`). Also enemy row == player row (`[0xDB25]`) and hp != 0. The loop has no break, so every enemy in range is hit. **[code]**
- **Damage**: `hp -= 0.35` (Real80 at `cs:0x3E`). If hp < 0.25 (`cs:0x48`), hp is set to 0 and the death state starts. 5 ticks kill a 2.0 hp droid or flyer (Real48 rounding leaves 0.2499999). **[code]** B 13:04: a droid dies within about 0.5 s, ammo 400 to 376 as fire stays held. **[footage]**
- **Compared with the gun**: the gun does 0.15 per hit, 1 shot per 2 ticks, nearest target only, 7 hits (14 ticks, 7 ammo) per kill. The E-Blaster kills in 5 ticks for 5 ammo and hits everything in range, but only out to 6 cells (gun window ±12 cells). **[code]**
- **Flyers**: they are hit only on ticks when their row equals the player row. Flyers move between engine y-4 and y toward the player's row (`10-level1-enemies.md`). **[code]** B 14:38 and 14:55 show low flyers on the hero's row shot down with the beam. **[footage]**
- **Shoot-only guard** (table `ds:0x39B9`, 6 slots): `-144 <= d <= 0`, same row, hp byte != 0, then 4 hp off and a spark (`7:0x50F-0x68C`). The facing-right branch has no guard loop, so the guard is hit only while the hero faces left. **[code]**
- **Ducking**: allowed. Fire with weapon 3 keeps duck state 0x60 (no duck-punch state), and the beam is drawn lower. The hit test does not change. **[code]**
- **Walking**: allowed, the beam follows the hero. **[code]**
- **Jumping, ladders**: the beam routine has no state check, so it should fire mid-jump. **[inferred]**
- **Charge**: none. **[code]**

## 3. Ammo and selection

- Level start sets `[0xDB38]` = 0 (`4:0x1C33`, `4:0x2AA5` and others). The bonus weapon does not carry over. **[code]** Matches `07-manual-magazines.md`.
- Pickup sets `[0x5486]` = 1 and `[0xDB38]` = 400 (`4:0xA73E-0xA743`). **[code]** HUD `n:400` at A 7:53. **[footage]**
- No other write adds to `[0xDB38]` in level 1. The other sets are other levels' bonus weapons (`3:0x970B` = 500, the level 3 flamethrower; `5:0x4B7B` = 250). **[code]**
- Key 3 (input 0x0C) selects weapon 3 only if `[0x5486]` != 0, with no ammo check, then waits for key release (`1:0x4352-0x4389`). Key 1 is input 0x0A, fists (key 2) input 0x0B. **[code]**
- Automatic switches, every tick (`1:0x40A4-0x41B7`): weapon 3 with 0 ammo goes to weapon 1. Weapon 1 with 0 ammo goes to weapon 3. If both are 0 (and the weapon is not fists), the hero switches to fists. Each switch plays `ikona.snd`. **[code]**

## 4. Pickup

- Item table entry at engine (34, 69) = map cell (40, 74), metro tunnel floor, marker 8 (`10-level1-enemies.md`). **[code]**
- Near the spot a yellow `E-BLASTER` label with a small icon shows at the top right of the playfield. **[footage]** A 7:49.
- Picked like other items (down arrow / ENTER). The generic item code compares the item name with `E-BLASTER` (`4:0xA63F`) and checks level 1 (`4:0xA64E`). **[code]** The keys come from the walkthroughs. **[inferred]**
- It plays `grafika\eblast.anm` (`4:0xA6A2`), a pre-rendered 3D clip of the robot bending down for the weapon (A 7:50-7:52), then reloads the palette and the HUD (`DESKA3.GRA`). `EBLAST.ANM` is missing from the local `GRAFIKA/` copy. **[code]** **[footage]**
- Message (timer 250): `NAŠEL JSI E-BLASTER!` / English `YOU FOUND AN E-BLASTER!YEAH!` (strings at `4:0x8AD0`, `4:0x8AE5`). **[code]** Shown top left at A 7:53. **[footage]**
- No ground sprite is seen at the spot. **[footage]** No draw code for it was found. **[inferred]**

## Corrections to earlier reports

- `10-level1-enemies.md` and the `config/levels/mesto/enemies.json` behaviour texts say the E-Blaster "drains 0.03 per particle per tick". The 40-particle table `ds:0x4996` gets entries only in levels 3 and 4 (`7:0x28D7-0x28E8`). That is the level 3 flamethrower (PLAMENOMET). The level 1 E-Blaster is the beam above.
- `10-level1-enemies.md` says the pickup is at `3:0x9706` with 500 ammo. That block is the flamethrower pickup (`ZA DVEŘMI JSI OBJEVIL PLAMENOMET!`, `DESKA2.GRA`). The E-Blaster pickup is `4:0xA64E-0xA78F` with 400 ammo.

## Crops (local only, `docs/research/video/` is gitignored)

`docs/research/video/frames-best/`:

- `GRA_LEV1_f008_eblaster_beam_6frames.png` - the 6 beam frames from game data, 3x.
- `GRA_DESKA3_hud_top_with_eblaster_slot3.png` - HUD top bar with the slot 3 icon, 3x.
- `L1_KkPeK_t1304_eblaster_beam_hits_droid.png` - beam facing left, droid hit.
- `L1_KkPeK_t1438_eblaster_beam_hits_low_flyer.png` - beam through a low flyer, spark star.
- `L1_KkPeK_t1304_hud_slot3_eblaster_icon_n387.png` - slot 3 icon and `n:387` counter.
- `L1_t0749_eblaster_pickup_label_near_spot.png` - `E-BLASTER` label near the spot.
- `L1_t0753_hud_slot3_n400_found_eblaster_message.png` - HUD right after pickup, `n:400`, message.

## Open

- Jump and ladder firing are not checked in code or footage.
- The exact hero-relative x of `[0xDB52]` and the camera row `[0xDB50]` are not traced. Placement is relative to the hero sprite draw at `7:0x5C06`.
