# Sandbox Environment Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sandbox draws every environment element from ported spike env assets, same playground, bag and target dropped.

**Architecture:** Spike assets gain size parameters and a `ladder` asset first. Then `spikes/shared/env*.js` primitives and the used assets are ported 1:1 to `src/game/env/`, checked pixel-exact against the spike in `npm run test:visual`. A pure `terrain()` classifier turns the tile grid into wall rects, ledge runs and girder runs; `src/game/render/environment.ts` draws them with assets and replaces the flat environment code in `render/scene.ts`.

**Tech Stack:** TypeScript, Vite, Vitest (node), Playwright visual check, Canvas 2D.

**Spec:** `docs/superpowers/specs/2026-10-19-sandbox-env-reskin-design.md`

## Global Constraints

- No code comments, docstrings, banners or TODOs. Only exception: workaround for an environment bug, stating the limitation.
- `src/engine/**` gets nothing from this plan.
- Port is 1:1: same canvas calls in the same order as the spike, so the visual check diff is 0 pixels.
- Spike default output does not change: `spikes/env-design/` renders the same pixels before and after Task 1, except the new `ladder` section.
- After editing `config/levels/mesto/objects.json` run `node spikes/shared/build-config.mjs`.
- Env units: 1 env px = 1 world px at `cellPx` 24 (`TILE` 24). Draw assets under `scale(cellPx / TILE)`.
- Game draws assets with `lod: true`, `t: 0`, and `lines` = canvas px per CSS px (`devicePixelRatio`), matching the sheet's `lines: dpr`.
- Docs and commit messages in plain short English, no em dash.

## Review Focus

- Ladder rungs must sit where the climb pose puts hands and feet (`RUNG` spike px apart from the ladder bottom). Pinned by `ladderRungs` test in Task 2.
- Unknown asset id in `config/levels/sandbox.json` must fail at load, not draw nothing. Pinned by loader test in Task 5.
- Every solid cell is drawn exactly once as wall or girder; no gaps, no overlaps. Pinned by `terrain` coverage test in Task 5.
- Record / replay stays deterministic: no env draw reads wall-clock time. Pinned by `t: 0` in Task 6 and the existing replay tests.
- Frame time: full-detail backdrop every frame may be slow on high-dpr screens. Measured in Task 6 Step 7.

---

### Task 1: Spike size parameters and ladder asset

**Files:**
- Modify: `spikes/shared/env.js` (`draw`)
- Modify: `spikes/shared/env-structures.js` (`streetWalkway`, `girderBridge`, new `ladder`)
- Modify: `spikes/shared/env-buildings.js` (`brickWall`)
- Modify: `spikes/shared/env-machines.js` (`LIFT`, `shaft`, `platform`, `liftAt`, `lift`)
- Modify: `config/levels/mesto/objects.json` (new `ladder` entry), regenerate `spikes/shared/config.js`

**Interfaces:**
- Produces: `ENV.draw(ctx, asset, { state, t, palette, lines, lod, size })`; `asset.draw(ctx, state, t, size = {})`.
- Size keys per asset (defaults = current output):
  - `streetWalkway`: `{ w = 120 }`
  - `girderBridge`: `{ w = 144 }`. Gussets at `0` and `w - 24`, truss loop `x = 24 .. w - 24`, rivets over `w - 48`.
  - `brickWall`: `{ w = 72, h = 168 }`. Bricks `0 .. w - 14`, pipe strip `w - 14 .. w`, height `h`.
  - `lift`: `{ w = 50, top = -104, py }`. `rack = w / 2`, `railA = rack - 14`, `railB = rack + 14`. With `py` given the platform sits at `py` and `state` / `t` are ignored.
  - `ladder` (new, `sheet: "structures"`, non-interactive, no states, no refs): `{ h = 168, w = 17.2, rung = 6.76 }`. Origin left rail outer edge, floor `y = 0`, drawn `-h .. 0`. Rungs at `y = -rung * k` for `k = 1 ..` while `> -h`, matching `render/scene.ts` `ladders()`. Look is Claude's call in the 4-tone style: steel rails, chrome rungs, rail bolts skipped when `simple`.

- [ ] **Step 1: Capture the sheet before changes**

Write a throwaway Playwright script in the scratchpad that opens `spikes/env-design/index.html` over `file://`, toggles each of `lines` / `lod` combinations, and saves a full-page PNG per combination plus a per-section PNG for `streetWalkway`, `girderBridge`, `brickWall`, `lift`.

- [ ] **Step 2: Add `size` to `ENV.draw` and the four assets, add `ladder`**

- [ ] **Step 3: Add the `ladder` entry to `objects.json` and run `node spikes/shared/build-config.mjs`**

- [ ] **Step 4: Verify defaults unchanged**

Run the Step 1 script again. Expected: the four section PNGs are byte-identical per combination; the full page differs only by the added ladder section. Open the sheet and check the ladder section renders with and without Game LOD.

- [ ] **Step 5: Commit**

```bash
git add spikes/shared config/levels/mesto/objects.json
git commit -m "Add size parameters and a ladder to the spike env assets"
```

---

### Task 2: Port env primitives and structures

**Files:**
- Create: `src/game/env/paint.ts` (port of `env.js`)
- Create: `src/game/env/structures.ts` (shared helpers of `env-structures.js` that the used assets need, plus `streetWalkway`, `girderBridge`, `ladder`, `pipeColumn`, `chainFence`, `stripLight`)
- Create: `src/game/env/structures.test.ts`
- Modify: `tools/visual/compare.html` (load `/spikes/shared/env.js`, `env-props.js`, `env-structures.js`, `env-buildings.js`, `env-machines.js` after `config.js` and `xbot.js`)
- Modify: `tools/visual/compare.ts` (env cases)

**Interfaces:**
- Produces from `paint.ts`:
  - `TILE = 24`, `PALETTE: EnvPalette` (`Record<string, string>`), `MAT: Record<Material, [string, string, string, string, string]>`, `type Material = "rust" | "concrete" | "brick" | "steel" | "chrome" | "green" | "armor" | "yellow"`
  - `interface Size { w?: number; h?: number; top?: number; py?: number; rung?: number }`
  - `interface EnvAsset { id: string; box: [number, number, number, number]; anim?: boolean; draw(ctx: CanvasRenderingContext2D, state: number, t: number, size: Size): void }`
  - `interface DrawOptions { state?: number; t?: number; palette?: EnvPalette; lines?: number; lod?: boolean; size?: Size }`
  - `drawAsset(ctx, asset: EnvAsset, opts?: DrawOptions): void` (same save / state / restore as spike `draw`)
  - `P` with the spike primitive names (`rng, path, color, box, flat, poly, cylV, cylH, disc, rivets, hazard, mesh, truss, trefoil, glow, text, stroke, tones, lw`), plus `simple(): boolean`, `pal(): EnvPalette`
- Produces from `structures.ts`: one exported `EnvAsset` const per asset, named as the id (`streetWalkway`, ...), and `ladderRungs(h: number, rung: number): number[]`.

- [ ] **Step 1: Write the failing test**

```ts
describe("ladderRungs", () => {
  it("steps up from the floor by rung while above the top", () => {
    expect(ladderRungs(20, 6)).toEqual([-6, -12, -18]);
  });
  it("is empty below one rung", () => {
    expect(ladderRungs(5, 6)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run `npx vitest run src/game/env/structures.test.ts`. Expected: FAIL, module not found**

- [ ] **Step 3: Port `paint.ts` and `structures.ts`**

Module-level `pal`, `lineW`, `simple` state, as in the spike. Keep every literal and call order. The spike `ladder` uses the same rung loop as `ladderRungs`.

- [ ] **Step 4: Run `npx vitest run src/game/env/structures.test.ts`. Expected: PASS**

- [ ] **Step 5: Add env cases to the visual check**

In `compare.ts`: an `envCase(id, state, lod, size?)` that draws spike `window.ENV.draw` and port `drawAsset` onto two canvases sized to the asset box at scale 2, `lines: 1`, `t: 0`, same `size`, and reports `diff`; pass only when `diff === 0`. Cases: every structure asset at each lod, default size, plus `streetWalkway { w: 96 }`, `girderBridge { w: 96 }`, `ladder { h: 240, w: 17.2, rung: 6.76 }`. Declare `window.ENV` in the global block.

- [ ] **Step 6: Run `npm run test:visual`. Expected: all `ok`, env cases `diff 0`**

- [ ] **Step 7: Run `npm run lint && npm run typecheck`. Expected: clean**

- [ ] **Step 8: Commit**

```bash
git add src/game/env tools/visual
git commit -m "Port env primitives and structure assets"
```

---

### Task 3: Port building assets

**Files:**
- Create: `src/game/env/buildings.ts` (helpers needed plus `skyBackground`, `midgroundRuins`, `windowBuilding`, `ruinedBuilding`, `colonnadeBuilding`, `facadeTower`, `brickWall`)
- Modify: `tools/visual/compare.ts`

**Interfaces:**
- Consumes: `paint.ts` (Task 2).
- Produces: one `EnvAsset` const per id.

- [ ] **Step 1: Add env cases for each building asset, both lods, default size, `skyBackground` state 0 and 1, `brickWall { w: 24, h: 384 }` and `{ w: 960, h: 48 }`**
- [ ] **Step 2: Run `npm run test:visual`. Expected: FAIL, import missing**
- [ ] **Step 3: Port the assets. Precomputed tables (`CLOUDS`, `FAR`, `TOWERS`, ...) keep the same seeds**
- [ ] **Step 4: Run `npm run test:visual`. Expected: all `ok`, `diff 0`**
- [ ] **Step 5: Run `npm run lint && npm run typecheck`. Expected: clean**
- [ ] **Step 6: Commit `Port env building assets`**

---

### Task 4: Port machine and prop assets

**Files:**
- Create: `src/game/env/machines.ts` (`lift`, `switchboard` and their helpers)
- Create: `src/game/env/props.ts` (`crate`, `barrel`, `crowbar`, `rubblePile`, `signPost`, `floorVent` and helpers)
- Create: `src/game/env/assets.ts`
- Modify: `tools/visual/compare.ts`

**Interfaces:**
- Consumes: `paint.ts`.
- Produces from `assets.ts`: `ASSETS: Record<AssetId, EnvAsset>` over every asset of Tasks 2-4, `type AssetId`, `isAssetId(id: string): id is AssetId`.
- `crate` and `barrel` port state 0 only; `barrel` state 2 and the `hidingHero` path are not ported. `crowbar` ports states 0 and 1.

- [ ] **Step 1: Add env cases: `lift` default states 0-2 and `{ w: 72, top: -272, py: -120 }`; `switchboard` states 0 and 1; `crowbar` 0 and 1; `crate`, `barrel` state 0; the three dressing props; both lods**
- [ ] **Step 2: Run `npm run test:visual`. Expected: FAIL, import missing**
- [ ] **Step 3: Port the assets and `assets.ts`**
- [ ] **Step 4: Run `npm run test:visual`. Expected: all `ok`, `diff 0`**
- [ ] **Step 5: Run `npm run lint && npm run typecheck`. Expected: clean**
- [ ] **Step 6: Commit `Port env machine and prop assets`**

---

### Task 5: Terrain classifier and sandbox config

**Files:**
- Create: `src/game/level/terrain.ts`, `src/game/level/terrain.test.ts`
- Modify: `src/game/level/sandboxLevel.ts`, `src/game/level/sandboxLevel.test.ts`
- Modify: `config/levels/sandbox.json`
- Modify: `src/game/shots.test.ts` (target tests)

**Interfaces:**
- Produces from `terrain.ts`:
  - `interface Run { row: number; col: number; w: number }`, `interface Rect { row: number; col: number; w: number; h: number }`
  - `terrain(grid: TileGrid): { walls: Rect[]; ledges: Run[]; girders: Run[] }`
  - Surface run: maximal horizontal run of `#` cells in row `> 0` whose cells above are not `#`. Girder: surface run with no `#` below any of its cells and no `#` left of its first or right of its last cell; its cells are not walls. Ledges: every other surface run. Walls: remaining `#` cells as row runs, merged downward while the next row has the identical run.
- Produces from `sandboxLevel.ts`:
  - `interface Scenery { asset: AssetId; x: number; y?: number; state?: number }` (`x` = asset origin in cells, `y` = floor row, default `spawn[1]`)
  - `SandboxWorld` gains `sky: AssetId`, `backdrop: Scenery[]`, `dressing: Scenery[]`, `terrain: ReturnType<typeof terrain>`
  - `loadSandbox` throws `Error("unknown asset: <id>")` for an id `isAssetId` rejects.
  - `ceilingAbove` removed.
- `sandbox.json`: remove `bag` and `target`; drop `width` / `height` from `crate` and `barrel`; `panel` `y` 12 to 14 (switchboard stands on the floor; `actions.test.ts` already uses the hero at `y: 14`); add `"sky": "skyBackground"`, `backdrop` (buildings standing on row 14, Claude's layout, e.g. `facadeTower`, `windowBuilding`, `ruinedBuilding`, `colonnadeBuilding`, `midgroundRuins`), `dressing` (Claude's layout, 4-6 items from `rubblePile`, `signPost`, `floorVent`, `pipeColumn`, `chainFence`, `stripLight`, kept clear of cols 2-4 (ladder), 16-21 (lift and switchboard), x 4-6 (crate), 9-10 (crowbar), 23-25 (barrel)). Update `source` text.

- [ ] **Step 1: Write the failing tests**

```ts
const grid = new TileGrid(loadJson().rows);
const t = terrain(grid);

it("finds the two free-standing platforms as girders", () => {
  expect(t.girders).toEqual([{ row: 4, col: 20, w: 4 }, { row: 11, col: 12, w: 4 }]);
});

it("treats wall-backed runs as ledges", () => {
  expect(t.ledges).toEqual(expect.arrayContaining([
    { row: 4, col: 1, w: 2 }, { row: 4, col: 4, w: 7 }, { row: 13, col: 26, w: 1 }, { row: 14, col: 1, w: 25 },
  ]));
});

it("covers every solid cell once as wall or girder", () => {
  const cells = [...t.walls.flatMap(cellsOfRect), ...t.girders.flatMap(cellsOfRun)];
  expect(new Set(cells).size).toBe(cells.length);
  expect(new Set(cells)).toEqual(new Set(solidCells(grid)));
});
```

And in `sandboxLevel.test.ts`: `loadSandbox({ ...json, dressing: [{ asset: "nope", x: 1 }] })` throws `"unknown asset: nope"`; loaded world has no `bag` or `target` prop.

- [ ] **Step 2: Run `npx vitest run src/game/level`. Expected: FAIL**
- [ ] **Step 3: Implement `terrain.ts`, loader changes, `sandbox.json` edits**
- [ ] **Step 4: Rewrite the `target` muzzle test with the old line as a constant: `const TARGET_TOP = 14 - 1.51;` and the same `below` bounds 12..16**
- [ ] **Step 5: Run `npm test`. Expected: PASS**
- [ ] **Step 6: Commit `Classify sandbox terrain and drop bag and target`**

---

### Task 6: Draw the sandbox from assets

**Files:**
- Create: `src/game/render/environment.ts`
- Modify: `src/game/render/scene.ts` (remove `backdrop`, `tiles`, `ladders`, `lift`, `box`, `crate`, `target`, `barrel`, `item`, `panel`, `bag`, `PROPS`, `PILLAR_EVERY`, `BAG` and env-only `COLORS` keys; `drawScene` gets a final `lines = 1` parameter)
- Modify: `src/sandbox/main.tsx` (pass `dpr` as `lines`)
- Modify: `src/game/render/scene.test.ts` if it references removed code

**Interfaces:**
- Consumes: `ASSETS`, `drawAsset` (Tasks 2-4), `SandboxWorld.terrain`, `sky`, `backdrop`, `dressing` (Task 5), `RUNG`, `spikeUnit` (`hero/look.ts`).
- Produces: `drawEnvironment(ctx, world, cfg: MovementConfig, alpha: number, lines: number): void`, called from `drawScene` where `backdrop` .. `PROPS` ran before.

Draw order and placement (all `lod: true`, `t: 0`, under `scale(cellPx / TILE)` from the placement origin):
1. Sky: `skyBackground` state 0 scaled to world height (`k = world height px / 170`), repeated every `320 k` across the world width.
2. Backdrop scenery, origin `(x * cell, (y ?? spawn[1]) * cell)`.
3. Walls: `brickWall` `{ w: rect.w * cell, h: rect.h * cell }`, origin at the rect's bottom-left.
4. Ledges: `streetWalkway` `{ w: run.w * cell }`, origin at the run's top-left.
5. Girders: `girderBridge` `{ w: run.w * cell }`, origin at the run's bottom-left.
6. Lift: `lift` `{ w: l.w * cell, top: (l.top - l.bottom) * cell - 32, py: yInterp - l.bottom * cell }`, origin `(l.x * cell, l.bottom * cell)`; `yInterp` uses the current `l.y - l.vy * (1 - alpha) * FIXED_STEP` formula.
7. Ladders: per `ladderTop` run, `ladder` `{ h, w: 56 * unit, rung: RUNG * unit }` with `unit = spikeUnit(cfg)`, origin `(cx - 28 * unit, bottom)`.
8. Dressing scenery.
9. Props, origin `p.x * cell - (box[0] + box[2]) / 2` on the prop floor: `crate` and `barrel` state 0, `item` as `crowbar` (skip when `taken`), `panel` as `switchboard` (`on` = state 1).

- [ ] **Step 1: Implement `environment.ts` and the `scene.ts` / `main.tsx` changes**
- [ ] **Step 2: Run `npm test && npm run lint && npm run typecheck && npm run test:visual`. Expected: all pass**
- [ ] **Step 3: Run `npm run dev` and screenshot the sandbox with the chrome-devtools MCP: spawn, ladder climb, lift up and down, switchboard on and off, crowbar pick-up, fog on and off**
- [ ] **Step 4: Check the screenshots: hero, enemy, bullets and ladders readable; girders read as see-through, ledges as solid; no dressing over interactive props. Adjust `sandbox.json` layout and repeat Step 3 until clean**
- [ ] **Step 5: Check climb lock: on the ladder, hands and feet sit on drawn rungs at the bottom, middle and top**
- [ ] **Step 6: Run `npm run build`. Expected: success**
- [ ] **Step 7: Record a 5 s performance trace while walking. If the median frame script time is over 4 ms, draw sky and backdrop once into an offscreen canvas per view size and blit it; re-run Step 2 and the trace**
- [ ] **Step 8: Commit `Draw the sandbox from env assets`**

---

### Task 7: Docs

**Files:**
- Modify: `CLAUDE.md` (code layout: `src/game/env/`, `render/environment.ts`, `level/terrain.ts`; `test:visual` now covers env assets; spikes: `ENV.draw` `size` option, `ladder` asset)
- Modify: `docs/requirements.md` (decision log row: sandbox reskinned from env assets, ladder asset, bag and target dropped, hiding-beside state unused in game; date 2026-10-19; update the environment sheet status line)

- [ ] **Step 1: Edit both files**
- [ ] **Step 2: Commit `Document the sandbox env reskin`**
