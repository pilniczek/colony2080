# Mission 1 (mesto) design

## Intent

First playable level of the clone. The player walks the whole level 1 map, picks up items and uses every task object, as in the original, and finishes the level at the crane. Layout matches the original as closely as the decoded data allows: map geometry, lifts, object and item positions, enemy spawns and patrol ranges.

## Goals

- Level 1 map at original size and layout: 160 x 80 cells, 24 px cells, floors 7 rows apart (rows 10, 16, 23, 30, 37, 44, 51, 59) plus metro band (rows 60-75), from `MAPY/M11.MAP`.
- Lifts at original columns and travel. First plan task decodes the `KLEV1.EXE` lift table (research note); lift shafts in the floor rows check it.
- Every task object and item at its original cell (marker table in `docs/research/reports/10-level1-enemies.md`, item table in `KLEV1.EXE`).
- Task web from `config/levels/mesto/tasks.json` works end to end: pick items, use them on objects, object states change, blocked areas open.
- Chrome droids at original spawn cells with original patrol ranges.
- Yellow subtitles for actions, pickups and blocks.
- Level end at the crane: subtitle "level complete" and a link back to the home page.
- Home page mission select links mission 1 to the level.

## Non-goals

- Cutscenes, the crowbar-door scene included. Uses change state at once.
- Flyers, the acid guard (marker 14) and the shoot guard (marker 15).
- Intro and dying-rebel story scenes.
- Saves, automap, inventory screen.
- Pixel-accurate original tiles: art stays our vector env assets.

## Decisions

User:

- Scope: walk the map, pick items, interact with every task object (wire box, switchboard, train door, valve, corpse, bar, ship, code lock, controller, damaged lift, acid tank, card door, crane).
- No cutscenes. Object use only changes state, inventory and blocked areas.
- Text appears as movie subtitles in yellow.
- Enemies: only chrome droids (silver humanoid, the existing sandbox enemy variant). No flyers, no guards.
- Acid tank: usable with the tap handle, state changes, kills nothing (no acid guard). Shoot guard gone, so the crane key lies free at its original cell.
- E-blaster pickup at its original cell (column 40, floor 75), the sandbox weapon pickup (2026-10-19 revisit).
- Crane repair: subtitle "level complete" plus a link to the home page.
- Any held item is usable once shown on the inventory screen (2026-10-19 revisit; was newest only).
- Ship part (marker 10): shoot the hull cover off as in the original; the part then lies on the pad under the hole (item prop with `shownBy: flag:hullOpen`) and is picked up like any item, no ship plan needed (footage picks it up before the bar visit). Showing the holo plan at the bar gives the ship plan and `flag:partWanted`, which the part trade needs, so the bar keeps its order. New engine work: hero bullets hit shootable props.
- Card door stays where the original has it, even if it no longer gates anything with the guards gone. Accepted flaw.

Claude's call:

- Map grid: a script (`scripts/` or `docs/research/tools/`) reads `M11.MAP` locally and writes the committed level grid in our own cell legend (wall, floor, lift shaft, empty) to `config/levels/mesto/`. The original file stays local only; the committed grid is derived layout, not an original asset.
- Collision rules come from the original engine where decoded (floors are the 7-row floor bands, walls and doors that block the player in `KLEV1.EXE`), else from the tile classes in `M11.MAP` checked against footage. The builder records the rules found in a short research note.
- Progress state variants `M12`-`M16` give the cells that change per task (train door, valve, card door, plasma, acid guard wreck). Those cells become object states in our config, not separate maps.
- Blocked areas from the original: dark metro tunnel until the switchboard is wired, running water until the valve is closed, plasma fire until the decoder is used on the code lock, upper floors (24, 17, 10) until the damaged lift is repaired, card door until the card is used. Each is a blocking state on its object.
- Spawn at the original player start (engine x 56, y 53, so map column 62 on floor 59).
- Enemies: the 27 chrome droids from `config/levels/mesto/enemies.json` with `type: chromeDroid`, same behaviour and tuning as the sandbox enemy, never respawn (`respawnMs: null`, original enemies stay dead).
- Death keeps the existing rule: the whole map resets on respawn (lifts, props, enemies, fog, inventory, task state). Ammo carries over.
- Subtitles: our own short English wording per task and block. No original game text, translated or not (no original game online rule). Bottom of the game window, yellow, fade after a few seconds, newest replaces the current one.
- Inventory: every picked item stays; the newest picked is shown, the inventory screen shows any other. Used items stay, as in the original, except the ship part the bar man trades for the decoder (2026-10-19 revisit; was a stack where every use consumed its item).
- Lifts may have more than two stops if the decoded table says so; the lift model and the reach rule widen to N stops. The repaired damaged lift (marker 13) gets its stops from the shafts in the map rows above it.
- `tasks.json` rewritten: `acidGuard` becomes `useAcidTank` (gives a flag, kills nothing), `shootGuard` and `takeEBlaster` go (the E-Blaster is a weapon pickup), new `takeCraneKey` pickup at the original key cell; `getShipPart` went in the 2026-10-19 revisit (the part is a ground pickup).
- Dying rebel (marker 1) placed and usable: ENTER gives `flag:rebelTalked` and a subtitle, then it lies as a corpse.
- After "level complete" the game freezes (no input, enemies stop) under the subtitle and the home page link.
- Shootable props: a prop with a `shootable` hit box stops hero bullets with a spark and counts hits; at its hit count it switches state (hull cover falls, ship part drops as a pickup). All other props stay transparent to bullets.
- Interaction: ENTER uses the shown item on the object in reach, or uses the object when it needs no item. Pickup works as the sandbox crowbar does. An object used without the needed item shows a hint subtitle.
- Scenery: non-interactive objects (`buildings`, `structures`, sky, ruins) placed from the original map regions with the closest env asset, tall non-blocking scenery in the backdrop under the haze, as in the sandbox.
- Ladders and staircases only where the original map has them. The reach rule ("a lift's two stop floors connect only through it") and no-jump-on-moving-lift stay; where our jumps would bypass an original lift, the builder adds the smallest blocking obstacle.
- Page: new entry `game.html` (or a `?level=mesto` route), HUD as in the sandbox, no debug panel, fog of war on. The sandbox stays as is.
- Performance: the mesto map is about 8 times the sandbox area. The static cache tiles must not loop over all terrain and scenery per tile; add the spatial index noted in `docs/requirements.md` Known issues.

## Constraints

- `src/engine/**` keeps its import rules.
- No code comments.
- Published site never names the original game: committed config keeps `source` citations only in fields the production build strips; subtitles and item names are our own.
- Tests: task web reachability (the pickup and use order completes the level, showing each needed item first), reach rule per lift, map grid loads at 160 x 80.

## Accepted flaws (fix in a later session)

Also listed in `docs/requirements.md` under Known issues.

- Card door (marker 17) may gate nothing now that the guards are gone.
- Acid tank (marker 14) use kills nothing; the task has no effect on the route.
- Crane key lies free; the shoot guard that guarded it is missing.
- Flyers missing: 17 of the 44 original regular enemies.
- No cutscenes: every use, pickup and the level end change state at once.
- Death resets the whole 160 x 80 map, including all task progress, since saves are not built.

## Left to the builder

- Exact cell legend and how the converter classifies original tile ids.
- Subtitle wording and timing.
- Scenery placement details.
- Which env asset state stands for each blocked or open state.
