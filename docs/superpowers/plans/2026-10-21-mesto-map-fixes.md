# Mesto Map Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the mission 1 visual flaws listed in the spec: art short of the ceiling, broken pipe columns, floating girders, sky poles, sealed rooms, invisible edge walls, toxic sign over a pipe.

**Architecture:** Three kinds of change. Assets gain height options (spike first, then the TypeScript port, checked by `npm run test:visual`). `docs/research/tools/levelmap.py` mesto config fills sealed pockets and clears unreached sky, then regenerates `config/levels/mesto/map.json`. `config/levels/mesto/world.json` places towers, girders and props.

**Tech Stack:** TypeScript, Canvas 2D, Vitest, Playwright visual compare, Python 3 converter.

**Spec:** `docs/superpowers/specs/2026-10-21-mesto-map-fixes-design.md`

## Global Constraints

- Change an asset in `spikes/shared/env-*.js` first, then port it to `src/game/env/`; `npm run test:visual` must pass.
- Never hand-edit `config/levels/mesto/map.json`; regenerate it: `python3 docs/research/tools/levelmap.py 1 docs/research/gamedata/raw/C28/MAPY/M11.MAP docs/research/gamedata/disasm/level1_layout.json config/levels/mesto/enemies.json config/levels/mesto/map.json` (today it reproduces the committed file byte for byte).
- Gameplay stays the same: same reachable floors, tasks, enemy patrols. `reach.test.ts` may only rename run ids a filled pocket moves and drop `never` runs that disappear.
- Dressing draws above the hero: keep every dressing rect off cells the hero can stand in.
- No code comments; docs in caveman lite; no original game names in shipped files.
- The original map is the reference: dev `game.html`, key `o`.

## Review Focus

- A filled pocket that the hero could actually enter: check in game before filling (Task 3 step 1).
- A tower dressing rect that overlaps a reachable cell would draw over the hero: Task 4 test pins it.
- An asset `size.top` / `size.h` left undefined must draw exactly as before (default art unchanged): visual compare without size covers it.
- Enemy patrols crossing a newly solid cell: all patrols end by col 140 today; Task 3 step 4 checks `mesto.test.ts` still passes.
- Lift shafts: no fill or dressing may cover a lift shaft (`world.lifts`).

---

### Task 1: Prop art reaches the ceiling (switchboard, plasma barrier, card door)

**Files:**
- Modify: `spikes/shared/env-machines.js` (`switchboard` line ~95, `plasmaBarrier` ~348, `cardDoor` ~513)
- Modify: `src/game/env/machines.ts` (`switchboard` ~100, `plasmaBarrier` ~404, `cardDoor` ~570)
- Modify: `config/levels/mesto/world.json` props `switchboard`, `plasmaBarrier`, `cardDoor`
- Modify: `tools/visual/compare.ts` `envSizes`
- Test: `src/game/level/mesto.test.ts`

**Interfaces:**
- Produces: these three assets read `size.top` (negative px, as the `crane` asset does; `prop` in `render/environment.ts` passes `art.top` cells as `{ top: -px }`). Undefined `size.top` keeps today's art.

- [ ] **Step 1: Write the failing test** in `mesto.test.ts`:

```ts
it("draws gate and pillar art up to the ceiling", () => {
  const ceiling = (col: number, floor: number): number => {
    let r = floor - 1;
    while (r >= 0 && map.rows[r]![col] !== "#") r--;
    return r + 1;
  };
  for (const id of ["switchboard", "plasmaBarrier", "cardDoor"]) {
    const p = world.props.find((q) => q.id === id)!;
    expect(p.y - p.art!.top!).toBe(ceiling(Math.floor(p.x), p.y));
  }
});
```

(map rows, not `grid`, since gate blockers are in `grid` once `applyBlocks` runs).

- [ ] **Step 2: Run** `npx vitest run src/game/level/mesto.test.ts` - Expected: FAIL (`art` undefined).
- [ ] **Step 3: Spike assets.**
  - `switchboard`: the concrete pillar (body, top cap, k0 lines) runs from the floor to `size.top` (default -80); panel and lamp stay where they are.
  - `plasmaBarrier`: with `size.top` set, draw a top emitter (the floor `steel` strip mirrored) at the top of a wall, the two flame rows mirrored (hanging down from the emitter), and a wall (`concrete` box, vertical) from the emitter up to `size.top`. Emitter at 54 px above the floor (6 cells - 54 px = 90 px of wall). Burnt-out state 1 keeps both emitters, no flames.
  - `cardDoor`: with `size.top` set, a `concrete` wall (vertical box, same width as the door frame) fills from the frame top (-76) up to `size.top`.
- [ ] **Step 4: Port** the same changes to `src/game/env/machines.ts`; add `["switchboard", { top: -96 }]`, `["plasmaBarrier", { top: -144 }]`, `["cardDoor", { top: -144 }]` to `envSizes` in `tools/visual/compare.ts` (the spike reads the same `size` option through `ENV.draw`).
- [ ] **Step 5: world.json:** `"art": { "top": 4 }` on `switchboard` (floor 70, metro ceiling row 66); `"art": { "top": 6 }` on `plasmaBarrier` (blocker rows 38-43); merge `"top": 6` into `cardDoor`'s existing `art` (`{ "dx": -0.4, "top": 6 }`).
- [ ] **Step 6: Run** `npx vitest run src/game/level/mesto.test.ts && npm run test:visual` - Expected: PASS.
- [ ] **Step 7: Screenshot** in game with fog off (`c2080isdebugging`, then `moveto(68,70)`, `moveto(100,44)`, `moveto(47,23)`): art meets the ceiling, no gap.
- [ ] **Step 8: Commit** `Draw switchboard, plasma barrier and card door up to the ceiling`.

### Task 2: Continuous pipe columns through the roof

**Files:**
- Modify: `spikes/shared/env-structures.js` `pipeColumn` (~212)
- Modify: `src/game/env/structures.ts` `pipeColumn` (~215)
- Modify: `config/levels/mesto/world.json` backdrop
- Modify: `tools/visual/compare.ts` `envSizes`

**Interfaces:**
- Produces: `pipeColumn` reads `size.h` (px, default 168, as `facadeTower` does); scenery `"h"` in cells sets it. Its `box` stays `[-4, -168, 28, 0]`; `sceneryBox` takes the height from `h`.

- [ ] **Step 1: Spike:** body and top from `-h`; one ring every 72 px from 18 px under the top (default h 168 keeps rings at -150 and -78); base ring unchanged.
- [ ] **Step 2: Port** to `structures.ts`; add `["pipeColumn", { h: 312 }]` to `envSizes`.
- [ ] **Step 3: world.json backdrop:** delete the four `pipeColumn` entries at y 10 (x 95.2, 99.7, 111.7, 116.7); give the four at y 16 (x 94.4, 98.9, 111.9, 116.9) `"h": 13` (floor 16 up to row 3).
- [ ] **Step 4: Run** `npm run test:visual && npm test` - Expected: PASS.
- [ ] **Step 5: Screenshot** `moveto(97,10)`: each column runs unbroken from floor 16 behind the roof plank to row 3, no base block on the roof.
- [ ] **Step 6: Commit** `Run mesto roof pipe columns through the roof`.

### Task 3: Fill sealed pockets, clear unreached sky (levelmap)

**Files:**
- Modify: `docs/research/tools/levelmap.py` mesto config (`sky`, `borderFills` or `patches`, `source` text)
- Regenerate: `config/levels/mesto/map.json`
- Modify: `src/game/level/reach.test.ts` `GATED.mesto`

**Interfaces:**
- Produces for Task 4: solid cells at the pocket rects below, open sky at cols 136-159 rows 0-15 and at col 6 rows 11-29.

- [ ] **Step 1: Confirm unreachable** in game (fog off, immortal): for each pocket, stand beside it (`moveto` from the spec), jump at it and ride nearby lifts; the hero never gets inside. Stop and report any pocket he enters.
- [ ] **Step 2: Config** (rect = col, row, col, row, inclusive): solid `#` patches `(24,24,27,29)`, `(24,31,27,36)`, `(69,24,73,29)`, `(72,38,76,43)`, `(72,45,76,50)`, `(93,17,99,22)`, `(128,17,140,22)`, `(128,24,140,29)`, `(141,45,159,58)`, `(133,52,159,58)`; sky (open `.`) `(136,0,159,15)` and `(6,11,6,29)`. Apply patches after the clamp `|` cells are placed so the solid rects replace col 158 blockers. Add one clause to the mesto `source` naming the pockets (original towers) and the east floors ending at col 140.
- [ ] **Step 3: Regenerate** `map.json` (command in Global Constraints). Check: col 158 rows 45-50 and 53-58 are `#`, rows 0-15 cols 136-159 are `.`, row 10 col 135 and west are unchanged.
- [ ] **Step 4: Run** `npx vitest run src/game/level/` - Expected: FAIL only in `reach.test.ts` on moved run ids. Rename them in `GATED.mesto` (`30,24` becomes the run's new first cell, likewise `44,72`; drop `never` entries such as `10,128`, `16,128`, `23,128`, `30,128`, `59,133` that no longer exist), rerun - Expected: PASS.
- [ ] **Step 5: Commit** `Fill mesto sealed pockets and clear unreached east sky`.

### Task 4: Towers, west wall stub, girders and toxic sign (world.json)

**Files:**
- Modify: `config/levels/mesto/world.json` backdrop, dressing
- Test: `src/game/level/mesto.test.ts`

**Interfaces:**
- Consumes: Task 3 map; `facadeTower` (`w`, `h` cells), `brickWall` (`w`, `h`), `girderBridge` (`w`), scenery `flip`.

- [ ] **Step 1: Write the failing test** in `mesto.test.ts`: every dressing `facadeTower` and `brickWall` rect (x to x + w, y - h to y) covers only cells that are solid or that no floor run in `reachOf(world, cfg).runs` stands under (hero body rows: the 2 rows above a reached run). Name: `"keeps tower dressing off reachable cells"`. Also assert the dressing list holds a `facadeTower` at x 127 (fails today).
- [ ] **Step 2: Run** - Expected: FAIL on the missing x 127 tower.
- [ ] **Step 3: Towers** (x, y floor row, w, h in cells; dressing unless noted):
  - `(127, 30, 9, 27)` skyscraper; `(140, 30, 8, 11)`; `(132, 59, 8, 7)`.
  - `(23, 37, 6, 13)`; `(68, 30, 7, 6)`; `(71, 51, 7, 13)`.
  - Backdrop: `(8, 23, 10, 12)` under the west roof; `(56, 10, 9, 10)` above the roof left of col 65; the existing backdrop `facadeTower` at 65,16 gets `"h": 16`.
  - Pocket cols 93-99 keeps the user's brick look (image 3): dressing `brickWall` `(92, 23, 9, 6)` instead of a tower.
- [ ] **Step 4: West clamp:** dressing `brickWall` `(6, 10, 1, 6)` (col 6, rows 4-9, the roof end).
- [ ] **Step 5: Girders:** `77.5,41` gets `"w": 10.5` so it ends in the colonnade at 88,44; `32,13` moves to `y 12` (hung under the ceiling like 94 and 100). For `79,20`, `100,12` and `122,35` follow the overlay: extend, move or add a `pipeColumn` / `latticePylon` so no end floats.
- [ ] **Step 6: Toxic sign:** replace dressing `chainFence` at 107,23 with `{ "asset": "chainFence", "x": 115, "y": 23, "flip": true }` so its sign plate sits over cols 108-111, clear of the acid tank pipe.
- [ ] **Step 7: Run** `npm test` - Expected: PASS.
- [ ] **Step 8: Screenshot** each spec `moveto` spot of fixes 6-11 with fog off, compare with `o`; adjust sizes until each matches the original layout.
- [ ] **Step 9: Commit** `Draw mesto towers, girder supports and edge walls`.

### Task 5: Docs and final check

**Files:**
- Modify: `CLAUDE.md` (map.json bullet: pockets, east edge; world.json bullet: `art.top` on switchboard, plasma barrier, card door; `pipeColumn` `h`)
- Modify: `docs/requirements.md` decision log (one line: mesto map fixes, spec path)

- [ ] **Step 1: Edit** the two docs, one statement per fact.
- [ ] **Step 2: Run** `npm run lint && npm run typecheck && npm test && npm run test:visual && npx vite build` - Expected: all pass, build has no original game names.
- [ ] **Step 3: Commit** `Document mesto map fixes`.
