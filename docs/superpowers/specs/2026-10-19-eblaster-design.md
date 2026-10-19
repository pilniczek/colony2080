# E-Blaster design

## Intent

Mission 1 has a bonus weapon in HUD slot 3, the E-Blaster. The sandbox gets it now so the third weapon can be tried with the rest of the movement and fight set. It mirrors the original game (research: `docs/research/reports/12-eblaster.md`), mapped onto our scale rules.

## Goals

- E-Blaster views in the gun design sheet (`spikes/gun-design/`): its own held model in every view, beam, HUD slot 3 icon, ground pickup.
- HUD slot 3 shows the E-Blaster icon and ammo once picked up, in the spike and the sandbox.
- Sandbox: pick up the E-Blaster, select it with key 3, fire a continuous lightning beam that damages every enemy in range on the floor.

## Non-goals

- Sound (the project has no audio yet).
- The pickup cutscene and the found message (they wait for the cutscene framework).
- Ammo pickups or refills.
- Other bonus weapons.

## Decisions

User:

- Mirror the original E-Blaster.
- The range of every weapon matches the sight range: one value, `sightCells` in `config/hero/movement.json`. When it changes, sight, bullet range and beam range change together. Recorded in `docs/requirements.md`.
- The E-Blaster has its own held model (deviation from the original, which reuses the gun sprite), designed with views in `spikes/gun-design/` like the rotary gun: side, held side, front, back, slung, game size.
- Every spike with a Fists / Gun select (`spikes/movement/movement.html`, `interaction.html`, `fight.html`) gets a third choice, Blaster: every armed cell shows the hero holding the E-Blaster, and the shooting cells fire the beam instead of bullets.
- While hidden, every weapon switch plays the switch animation, gun and E-Blaster included. A gun to E-Blaster change animates like the fists switch: the held weapon goes to the back, the other one is drawn. Outside cover, switches stay instant as today.

From the original (report 12):

- The carry pose and clips stay those of the gun.
- Holding fire keeps a beam on: a blue-edged white zigzag drawn at full length at once, starting at the pose muzzle, mirrored for the facing, lower when ducking (it follows the muzzle). It flickers through 6 shapes, one per original tick, with 0-2 px random vertical jitter.
- Each tick the beam damages every enemy in range on the hero's floor, so it pierces. Each enemy hit gets the gun's impact spark every tick.
- Fires while standing, walking, running and ducking; never while hidden.
- Ammo: 400 on pickup, 1 per original tick of firing (about 32 per s), no refills in level 1. 0 at start; key 3 does nothing until pickup.
- Empty weapon rules: an empty E-Blaster switches to the gun, an empty gun to the E-Blaster, both empty to fists.
- HUD slot 3: empty grid before pickup; then a silver gun icon with a blue arc and its ammo counter, same style and rules as the other slots (right-aligned, no leading zeros, key tab `3`, active glow).
- Original look: no ground sprite; a yellow label marks the spot.

Claude's call:

- Beam range: `sightCells` (9 cells), per the user rule; walls end the beam like they stop bullets, and so does the first covered fog cell, like bullets.
- Damage: the original kills a droid in 5 beam ticks against 14 ticks for the gun (7 hits, 1 shot per 2 ticks). We weakened the gun to 16 bullets at `fireRate` 12 (1.33 s per kill), so the beam keeps the original ratio: a kill takes about 0.48 s of beam (5/14 of the gun time). Values in `config/hero/movement.json` (`blaster`: damage per second, ammo per second, start ammo).
- Flicker and jitter run on game time with a seeded random source, so record and replay and the pixel check stay deterministic.
- Jumping while firing works as it does for the gun (Up while firing jumps, fire keeps going in the air).
- Ground pickup: drawn with the existing `eBlaster` env asset (our design, the original has none). Picked with the pick-up key like items, but it is a weapon pickup, not an inventory item: it gives the E-Blaster and 400 ammo and does not change the selected weapon.
- Death keeps the E-Blaster and its ammo, like gun ammo today; once taken, the pickup stays taken after the map reset, so ammo cannot be farmed.
- Sandbox placement: one pickup on a floor reachable from the spawn, not in the right strip (cols 40-47), not on a lift deck, out of enemy fire at the pickup spot.
- HUD icon drawn as vector code like the gun and fist icons.
- Weapon model: `Weapon` gets a third value `blaster`. It uses the gun clips and carry pose with its own model in the hand; key 3 switches at once like `quickSwitch` today, and while hidden through the `weaponSwitch` clip (gun to E-Blaster: holster, then draw). Only the held weapon is drawn; the other owned weapon is never shown.
- Beam ticks: the beam runs on fixed 32 Hz ticks of game time. Each tick spends 1 ammo, deals one damage chunk to each enemy in range, shows one spark per enemy and advances the flicker shape.
- Same floor: an enemy is in range when it stands on the hero's floor row (feet row), like enemy sight, within `sightCells` and before the first wall or covered fog cell. The beam hits the whole enemy whatever the beam height, so a ducking hero still hits a standing enemy, as in the original.
- Damage unit: enemy health is its `hits` (7). A kill takes about 0.48 s, about 15 ticks, so `blaster.damage` per tick is 0.47 hits (15 ticks per kill).
- Hit effect: the enemy hit reaction (`reactMs` turn, tint flash, head snap, star) starts when the beam first touches it; while the beam stays on it only the per-tick sparks repeat.
- Pickup: a new prop kind `weapon` in `config/levels/sandbox.json` (`"weapon": "blaster"`), picked with the item pick-up key and reach. Ownership lives on the hero (`hero.blaster` ammo, null before pickup); `resetWorld` restores the prop but it stays hidden while the hero owns the E-Blaster.
- Blaster ammo is its own field next to gun `ammo`, kept on respawn; the debug panel gets a blaster ammo input like the gun ammo one. The slot 3 counter uses the slot 1 format.

## Design sheet

`spikes/gun-design/index.html` gets a Fists / Gun / Blaster switch like the movement pages; every view shows the selected weapon (fists: empty hands). For the Blaster:

- model views like the rotary gun: side, held side and front, back, slung on the back, game size;
- beam: the 6 flicker shapes, animated loop, both facings, standing and ducking, at full and game size;
- HUD slot 3 icon, lit and unlit, with counter;
- ground pickup asset (`eBlaster`) at full and game size, matching the held model;
- hero holding the E-Blaster firing the beam (game LOD);
- original references (beam strip, HUD slot, footage frames) only through `spikes/shared/originals.js` or `<!-- originals -->` blocks, so the production build drops them.

`spikes/hud-design/` gets slot 3 controls (picked up, ammo, selected). `spikes/movement/fight.html` gets the beam in the gun cells only if cheap; not required.

## Constraints

- Spikes stay the design source; the beam and icon are ported to TypeScript and checked by `test:visual` at 0 pixel diff like the other assets.
- `src/engine/**` keeps its import rules. No code comments. Tuning values in `config/`.
- The published site never references the original game (see `docs/requirements.md`).
- Correct report 10 and `config/levels/mesto/enemies.json`: the "0.03 per particle per tick" and "pickup `3:0x9706`, 500 ammo" texts are the level 3 flamethrower, not the E-Blaster.

## Left to the builder

- Exact beam zigzag geometry and colours within the look above.
- E-Blaster model shape (silver body with a blue arc emitter, in the style of the rotary gun and the HUD icon) and icon drawing.
- Pickup spot in the sandbox within the placement rules.
