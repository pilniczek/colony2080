# Mission 1 (mesto) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Playable level 1 (mesto) at original layout: walk the 160 x 80 map, ride lifts, pick items, use every task object, fight chrome droids, finish at the crane.

**Architecture:** The level loads into the existing `SandboxWorld` shape (`src/game/level/sandboxLevel.ts`), so hero, lifts, enemies, shots, fog and rendering stay shared. New pieces: a map converter (original map to our cell grid, local tool, committed output), level objects with states and blocking cells, a task runner over `tasks.json`, a stack inventory, shootable props, subtitles and a level-end overlay. Sandbox `main.tsx` splits into a shared runner used by `sandbox.html` and a new `game.html`.

**Tech Stack:** TypeScript, Vite, React (UI shell), Zustand, Vitest, Python 3 stdlib (research tools).

**Spec:** `docs/superpowers/specs/2026-10-19-mission-1-mesto-design.md`

## Global Constraints

- `src/engine/**` may not import React, Zustand, `game/` or `sandbox/`.
- No code comments of any kind (repo rule).
- Published site never names the original game: no original texts (translated or not), file names or images in `dist/`. Citations only in `source` / `note` fields (stripped by `scripts/production.ts`). `npm run build` must pass the leak check.
- Dev-only references to original files sit under `if (import.meta.env.DEV)` so they are dropped from the build.
- Map 160 x 80 cells, 24 px cells (`cellPx` 24), floors 7 rows apart; map column = original engine x + 6.
- Enemies: only the 27 `chromeDroid` entries of `config/levels/mesto/enemies.json`, `respawnMs: null`. No flyers, no guards. No E-blaster.
- No cutscenes. Uses change state at once.
- Subtitles: our own English wording, yellow, bottom of the game window.
- Inventory: every picked item stays, only the newest (top of stack) is shown and usable, every use consumes the used item.
- Docs and commit messages in plain short English, no em dash.

## Review Focus

- Hero dies mid-chain: whole map resets (props, object states, flags, inventory, lifts, enemies), no stale blocking cells left in the grid. Test in Task 4.
- ENTER with two objects in reach: the nearest object to the hero wins, deterministic. Test in Task 4.
- ENTER on an object with the wrong (or no) shown item: hint subtitle, nothing consumed. Test in Task 4.
- Shooting a shootable prop through fog or from another floor: bullets only hit props on the bullet row, and fog-dropped bullets never count. Test in Task 5.
- Level end while an enemy burst is in flight: once complete, no more damage and no input acts. Test in Task 7.

---

### Task 1: Research - level 1 layout (lifts, items, blocking)

**Files:**
- Create: `docs/research/reports/13-level1-layout.md`
- Create (local only, gitignored folder): `docs/research/gamedata/disasm/level1_layout.json`
- Modify: `docs/research/README.md` (contents table, one row)

**Interfaces:**
- Produces: `level1_layout.json` with `{ "lifts": [{ "x": col, "width": cells, "stops": [row, ...], "start": row, "enabledBy": "flag:..." | null }], "items": [{ "marker": n, "cell": [col, row] }], "blocking": { "solidTiles": [[sheet, tile], ...], "ladderTiles": [...], "rules": "..." }, "spawn": [col, row] }`. Rows are the floor row the hero stands on (the plank row, e.g. 59 for the street).

- [ ] **Step 1:** In `docs/research/gamedata/disasm/` (`l1init.asm`, `seg3.asm`-`seg7.asm`, `notes.txt`) find the lift table (report 10 says "lift columns"; marker 13 lift at engine x 50) and the item table (crowbar engine (19, 38), corpse (10, 64), controller (106, 45), crane key (15, 10)). Decode every lift column, stop rows and start stop, and every item cell. Check the two unidentified tables `ds:0x52EF` and `ds:0x515F` (report 10 Unknowns) against lift columns.
- [ ] **Step 2:** Find how the player is blocked horizontally (walls, map edges, doors). Use the player-block code (`seg 3 0x614D-0x6356` blocks on guards; look for the same pattern on tiles) and the floor rows of `M11.MAP` (non-empty cells in rows 10, 16, 23, 30, 37, 44, 51, 59 and the metro band 60-75). Record which `(sheet, tile)` pairs block, which are floor, which are lift shaft (sheet 9 in floor rows), and any staircases or ladders. Where code gives no answer, classify from tile art (`docs/research/gamedata/png/lev1/`) and footage, and mark confidence.
- [ ] **Step 3:** Diff `M11` against `M12`-`M16` and list changed cell ranges per task object (train door, valve, card door, plasma, acid guard).
- [ ] **Step 4:** Write `level1_layout.json` and report 13 (method, tables, confidence per fact, Mermaid map of floors and lifts). Add the README row.
- [ ] **Step 5:** Commit report and README (`git add docs/research/reports/13-level1-layout.md docs/research/README.md`), message "Decode level 1 lifts, items and blocking rules".

### Task 2: Map converter and level grid

**Files:**
- Create: `docs/research/tools/mestomap.py`
- Create: `config/levels/mesto/map.json` (generated, committed)
- Create: `src/game/level/mesto.ts`, `src/game/level/mesto.test.ts`

**Interfaces:**
- Consumes: `level1_layout.json` (Task 1).
- Produces: `map.json` = `{ "status": "draft", "source": "...", "rows": string[80] (160 chars, legend "#" solid, "." empty, "H" ladder), "lifts": [{ "x", "width", "top", "bottom", "start"?: "top" | "bottom" }], "spawn": [x, y] }`. `loadMesto(): SandboxWorld` in `src/game/level/mesto.ts` builds a `SandboxJson` from `map.json` + `config/levels/mesto/world.json` (Task 8) + chrome droids and passes it to `loadSandbox`. Export `mestoJson(): unknown` (the merged json) for tests.

- [ ] **Step 1:** `python3 -I docs/research/tools/mestomap.py <M11.MAP> <level1_layout.json> config/levels/mesto/map.json`: positional args, stdlib only, writes rows from the tile classes, lifts from the layout (two stops each as `top` / `bottom`; if Task 1 finds a lift with more stops, split it into stacked two-stop lifts sharing the column and note that in report 13), spawn from the layout. Shaft cells in floor rows stay "." where a lift deck covers them.
- [ ] **Step 2: Failing test** `mesto.test.ts`:
  - `it("loads 160 x 80")`: `expect(world.grid.width).toBe(160); expect(world.grid.height).toBe(80)`.
  - `it("spawns on a floor")`: `grid.solid(Math.floor(spawn[0]), spawn[1])` true and `grid.solid(Math.floor(spawn[0]), spawn[1] - 1)` false; `spawn` is `[62.5, 59]` unless report 13 says otherwise.
  - `it("has floors every 7 rows")`: rows 16, 23, 30, 37, 44, 51, 59 each contain solid cells.
  - `it("keeps every lift deck inside the map")`.
  - `world.json` starts as a stub `{ "sky": "skyBackground", "backdrop": [], "dressing": [], "props": [] }` until Task 8; spawn comes from `map.json`.
- [ ] **Step 3:** Run `npx vitest run src/game/level/mesto.test.ts`, expect FAIL (no module).
- [ ] **Step 4:** Implement `loadMesto` / `mestoJson`.
- [ ] **Step 5:** Run the test, expect PASS. Run `npm run typecheck`.
- [ ] **Step 6:** Commit tool, `map.json`, `mesto.ts`, stub `world.json`, test: "Convert the level 1 map into our cell grid".

### Task 3: Chrome droids at original spawns and patrols

**Files:**
- Modify: `src/game/level/enemy.ts` (`EnemyJson.patrol?: [number, number]`, used by `createEnemy` instead of `patrolOf` when set, clamped to `patrolOf`)
- Modify: `src/game/level/mesto.ts`, `src/game/level/enemy.test.ts`, `src/game/level/mesto.test.ts`

**Interfaces:**
- Produces: `droidsOf(json: unknown, tuning: Omit<EnemyJson, "x" | "y" | "facing" | "patrol">): EnemyJson[]` in `mesto.ts`: every `type === "chromeDroid"` entry, `x = cell[0] + 0.5`, `y = cell[1] + 1` (the floor row under the stand cell), `patrol = [patrol[0], patrol[1] + 1]` in cells, `facing: 1`, tuning from the sandbox enemy (`hits` 7, `reactMs` 250, `burst` 9 / 280, `pauseMs` 400), `respawnMs: null`.

- [ ] **Step 1: Failing tests:** `enemy.test.ts` `it("keeps a configured patrol inside the walkable floor")`; `mesto.test.ts` `it("places 27 droids, no flyers")` (`world.enemies.length === 27`, every `respawnMs === null`), `it("stands every droid on a floor")`.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Implement `patrol` support and `droidsOf`; wire into `loadMesto`.
- [ ] **Step 4:** Run `npm test`, expect PASS.
- [ ] **Step 5:** Commit: "Place level 1 chrome droids at original spawns".

### Task 4: Level objects, stack inventory and task runner

**Files:**
- Create: `src/game/level/tasks.ts`, `src/game/level/tasks.test.ts`
- Modify: `src/engine/world/tiles.ts` (+ test): `TileGrid.block(col, row, on: boolean)` overlay, `solid` honours it, `clearBlocks()`
- Modify: `src/game/level/sandboxLevel.ts`: `Prop` gains `id?: string`, `asset?: AssetId`, `state?: number`, `solidStates?: number[]`, `cells?: { col: number; row: number; w: number; h: number }`; `SandboxWorld` gains `flags: Set<string>`, `tasks: Task[]`, `subtitle: Subtitle | null`, `complete: boolean`; `pickUp` unchanged; new `useTop(world): ItemId | null` pops the top item and sets `shown` to the new top
- Modify: `src/game/hero/hero.ts`: `use` and `press` act on the nearest `kind === "object"` prop (and keep `panel`), `press` calls `runUse(world, prop)`
- Rewrite: `config/levels/mesto/tasks.json`

**Interfaces:**
- Produces: `interface Task { id: string; object: string; requires: string[]; consumes: string[]; gives: string[]; state?: number; subtitle: string }`, `interface Subtitle { text: string; age: number }`, `loadTasks(json: unknown): Task[]`, `runUse(world: SandboxWorld, prop: Prop): void`, `applyBlocks(world: SandboxWorld): void` (sets grid blocks for every prop whose `state` is in `solidStates`), `say(world, text: string): void`, `hintFor(prop: Prop, world): string`.
- `runUse` picks the first task of that object whose `requires` are all met, where an `item:*` requirement means the shown item (only the top counts) and `flag:*` means `world.flags`. On success: consume (`useTop` for each `consumes` item), add `gives` (`item:*` via `pickUp` in listed order, `flag:*` into flags), set `prop.state` if `state`, `applyBlocks`, `say(subtitle)`, and `flag:levelComplete` sets `world.complete`. No match: `say(hintFor(...))`, nothing changes.
- New `tasks.json` (each with `object` = prop id): `talkRebel`, `takeCrowbar` / `takeCraneKey` stay item pickups (no task row needed, prop `kind: "item"`), `pullWires` (wireBox gives `item:wires`), `wireSwitchboard`, `openTrainDoor` (consumes `item:crowbar`), `takeTapHandle` (valve, gives `item:tapHandle`, `flag:waterOff`), `searchCorpse`, `tradeHoloPlan`, `getShipPart` (consumes `item:shipPlan`, needs `flag:hullOpen` from Task 5), `tradeShipPart`, `unlockPlasma`, `takeController`, `repairLift`, `openDoor` (consumes `item:card`), `useAcidTank` (consumes `item:tapHandle`, gives `flag:acidPoured`), `repairCrane` (consumes `item:craneKey`, gives `flag:levelComplete`). Drop `acidGuard`, `shootGuard`, `takeEBlaster`. `source` cites spec and walkthrough; `subtitle` is our wording.
- Item pickup says `Picked up <item name>` (name from `config/items.json`).
- `resetWorld` already reloads from `source`; make it also `clearBlocks()` then `applyBlocks`.

- [ ] **Step 1: Failing tests** in `tasks.test.ts` with a small hand-made world (rows of 20 x 10, two objects):
  - `it("uses the shown item and shows the one picked before")`: pick `wires` then `crowbar`, use switchboard: hint, inventory unchanged; use train door with flag: `crowbar` consumed, `shown === "wires"`.
  - `it("gives items and flags and changes state")`.
  - `it("hints and changes nothing without the needed item")`.
  - `it("blocks cells while the object is in a solid state")` and opens them after the task.
  - `it("picks the nearest object in reach")` (hero test in `actions.test.ts`).
  - `it("reset restores objects, flags, inventory and blocks")`.
  - `it("completes the level")`: `repairCrane` sets `world.complete`.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Implement `TileGrid.block`, tasks module, hero hookup, `tasks.json` rewrite.
- [ ] **Step 4:** Run `npm test && npm run lint && npm run typecheck`, expect PASS.
- [ ] **Step 5:** Commit: "Add level objects, stack inventory and task runner".

### Task 5: Shootable props

**Files:**
- Modify: `src/game/level/sandboxLevel.ts` (`Prop.shootable?: { hits: number; state: number; gives?: string[] }`, `Prop.hitsTaken?: number`)
- Modify: `src/game/shots.ts` (`stepShots`: hero bullets that cross a shootable prop box on their row stop with a spark and add a hit; at `hits` the prop takes `state`, adds `gives` flags, `applyBlocks`), `src/game/shots.test.ts`

**Interfaces:**
- Consumes: `applyBlocks`, `say` (Task 4).
- Produces: crashed ship hull prop with `shootable: { hits: 7, state: 1, gives: ["flag:hullOpen"] }`; the ship part then becomes pickable through the `getShipPart` task.

- [ ] **Step 1: Failing tests:** `it("stops a hero bullet at a shootable prop and counts the hit")`, `it("switches the prop state at its hit count")`, `it("lets bullets pass other props")`, `it("ignores enemy bullets and bullets on another row")`, `it("does not count a bullet dropped by fog")`.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`, expect PASS.
- [ ] **Step 5:** Commit: "Let hero bullets hit shootable props".

### Task 6: Lift enable and blocked lifts

**Files:**
- Modify: `src/game/level/sandboxLevel.ts` (`Lift.enabledBy?: string`; `callLift(lift, dir, flags?: Set<string>): boolean` returns false and does nothing while the flag is missing), `src/game/hero/hero.ts` (a refused call says the lift hint), tests in `sandboxLevel.test.ts`

**Interfaces:**
- Produces: damaged lift (marker 13) with `enabledBy: "flag:upperFloorsOpen"` from `map.json` lifts.

- [ ] **Step 1: Failing test** `it("refuses a call until its flag is set")`.
- [ ] **Step 2:** Run, expect FAIL. **Step 3:** Implement. **Step 4:** `npm test` PASS.
- [ ] **Step 5:** Commit: "Keep the damaged lift idle until repaired".

### Task 7: Shared runner, game page, subtitles and level end

**Files:**
- Create: `src/game/run.ts` (canvas fit, camera view, fixed loop, render, store push, moved from `src/sandbox/main.tsx`)
- Modify: `src/sandbox/main.tsx` (calls `startRun({ world: loadSandbox(sandboxJson), ui: <><Hud /><Panel commands={commands} /></> })`, keeps panel commands)
- Create: `game.html`, `src/play/main.tsx`, `src/play/Subtitle.tsx`, `src/play/LevelEnd.tsx`
- Modify: `src/sandbox/store.ts` (`subtitle: string | null`, `complete: boolean`), `src/game/stepWorld.ts` (subtitle ageing, freeze when `world.complete`), `vite.config.ts` (`input.game`, `optimizeDeps.entries`), `index.html` (mission 1 link to `game.html`, label "City"), `src/game/stepWorld.test.ts`

**Interfaces:**
- Consumes: `world.subtitle`, `world.complete` (Task 4).
- Produces: `startRun(opts: { world: SandboxWorld; ui: ReactNode }): void`. `SUBTITLE_MS = 3500`; newest subtitle replaces the current one. Subtitle: yellow `#ffd84a`, Share Tech Mono, centred near the bottom of the game window, dark text shadow. LevelEnd: subtitle "Level complete" stays, plus a link "Back to mission select" to `index.html`.

- [ ] **Step 1: Failing tests** in `stepWorld.test.ts`: `it("ages out the subtitle after 3.5 s")`, `it("freezes the world once complete")` (no hero move, enemies stop, in-flight bullets deal no damage).
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Implement and split `main.tsx` without behaviour change for the sandbox.
- [ ] **Step 4:** `npm test && npm run lint && npm run typecheck && npm run build` PASS; start `npx vite --port 5199 --strictPort`, open `/sandbox.html` and `/game.html` with Chrome DevTools MCP, no console errors, sandbox behaves as before.
- [ ] **Step 5:** Commit: "Add the mission 1 game page with subtitles and level end".

### Task 8: Place objects, items and scenery at original cells

**Files:**
- Modify: `config/levels/mesto/world.json` (sky, backdrop, dressing, props)
- Create: `src/play/originalOverlay.ts` (dev only: draws `docs/research/gamedata/png/maps/map_M11.png` at 50 % under the level when the `o` key toggles; loaded only under `import.meta.env.DEV`)
- Modify: `src/game/level/mesto.test.ts`

**Interfaces:**
- Consumes: markers in report 10, item cells from Task 1, object states from `config/levels/mesto/objects.json`, env asset ids from `src/game/env/assets.ts`.
- Produces: one prop per interactive object (ids from `objects.json`: `dyingRebel`, `wireBox`, `switchboard`, `trainDoor`, `tapValveWheel`, `waterPipe` (solid while running), `corpse`, `barDoor`, `crashedShip` (shootable), `plasmaBarrier` (solid until `unlockPlasma`), `codeLock`, `damagedLift`, `acidTank`, `cardDoor` (solid until `openDoor`), `crane`), item props for `crowbar` and `craneKey` at their original cells, the dark metro tunnel entrance solid until `wireSwitchboard`. No `eBlaster` prop. Scenery at the original building regions, tall non-blocking scenery in `backdrop`.

- [ ] **Step 1: Failing tests:** `it("places every interactive object once")`, `it("has no E-blaster")`, `it("stands every prop on a floor")`.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Fill `world.json`; check each placement over the original overlay in the dev server, floor by floor, with screenshots.
- [ ] **Step 4:** `npm test` PASS; `npm run build` PASS (overlay dropped, no leak).
- [ ] **Step 5:** Commit: "Place level 1 objects, items and scenery".

### Task 9: Route tests (task web and lift reach rule)

**Files:**
- Create: `src/game/level/route.test.ts`
- Modify: `src/game/level/reach.test.ts` (run its lift rule over sandbox and mesto), `config/levels/mesto/world.json` (blocking obstacles where needed)

**Interfaces:**
- Consumes: `loadMesto`, `runUse`, `pickUp`, reach graph helpers in `reach.test.ts`.

- [ ] **Step 1: Failing test** `it("completes mesto in one pickup and use order")`: a scripted order (rebel, crowbar, wires, switchboard, train door, valve, corpse, bar, ship shot 7 times, ship part, bar, code lock, controller, damaged lift, card door, acid tank, crane key, crane) run against the world with `runUse` / item pickups, each object reachable from the previous through floors and lifts in the reach graph; ends with `world.complete`.
- [ ] **Step 2:** Run the lift reach rule on mesto; for each failure add the smallest blocking prop or wall cell in `world.json` and note it in report 13.
- [ ] **Step 3:** `npm test` PASS.
- [ ] **Step 4:** Commit: "Check the mesto route and lift reach rule".

### Task 10: Static cache spatial index

**Files:**
- Modify: `src/game/render/environment.ts`, `src/game/render/environment.test.ts`

**Interfaces:**
- Produces: `bucketByTile(items, cellOf, tilePx)` lookup so a cache tile paints only terrain runs, scenery and assets within one cell of it, without looping over the whole world.

- [ ] **Step 1: Failing test** `it("paints a tile from its bucket only")` (spy on `drawAsset` count for one tile in mesto stays below 1/20 of all assets).
- [ ] **Step 2:** Run, expect FAIL. **Step 3:** Implement. **Step 4:** `npm test` PASS; measure worst frame on `/game.html` at 1920 x 1080 with a DevTools trace, record in `docs/requirements.md` Known issues.
- [ ] **Step 5:** Commit: "Index static scenery per cache tile".

### Task 11: Docs

**Files:**
- Modify: `CLAUDE.md` (project state, commands, `game.html`, `src/play/`, mesto loader, tasks, subtitles, shootable props), `docs/requirements.md` (decided rows: mission 1 scope, subtitles, stack inventory, shootable props; config drafts rows for `map.json`, `world.json`)

- [ ] **Step 1:** Update both files, each fact once.
- [ ] **Step 2:** `npm test && npm run lint && npm run typecheck && npm run build` PASS.
- [ ] **Step 3:** Commit: "Document mission 1".
