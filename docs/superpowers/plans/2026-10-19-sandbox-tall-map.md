# Sandbox Tall Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sandbox map grows to 48 x 32 cells with more platforms and elevators, the camera follows the hero, the taken crowbar shows in the HUD, and docs catch up with the env reskin.

**Architecture:** A pure `followView` in the engine replaces `fitView` for the game window. `world.lift` becomes `world.lifts`; the hero picks the lift it stands on or in. The map grows down and right in `config/levels/sandbox.json`, drawn by the existing env renderer. The HUD inventory slot draws item icons from env assets next to the hand.

**Tech Stack:** TypeScript, Vite, Vitest (node), Playwright visual check, Canvas 2D, React (HUD only).

**Spec:** `docs/superpowers/specs/2026-10-19-sandbox-tall-map-design.md` (and `docs/superpowers/specs/2026-10-19-sandbox-env-reskin-design.md` for Task 5 docs)

## Global Constraints

- No code comments, docstrings, banners or TODOs.
- `src/engine/**` may not import React, Zustand, `game/` or `sandbox/`.
- Rows 0-15 and cols 0-38 of the current map keep their content; growth is down (rows 16-31) and right (cols 40-47, right wall to col 47).
- The widened strip (cols 40-47) holds no interactive elements: no lifts, ladders, props or enemies.
- View shows 40 x 16 cells (`config/camera.json` `view: { widthCells: 40, heightCells: 16 }`).
- Commit messages plain, no co-author line. Docs in plain short English, no em dash.

## Review Focus

- Camera at map corners: view must never show outside the map; hero walks to the edge. Pinned by `followView` clamp tests in Task 1.
- Window aspect wider or taller than 40:16: the extra space shows more map, still clamped. Pinned in Task 1.
- Two lifts moving at once: the hero rides only the one it stands on; calling one lift never moves another. Pinned in Task 2.
- Environment cache with a moving view: cached layers must line up with live content while the camera scrolls. Checked by screenshots in Task 3.
- Crowbar after death: the map resets, so the crowbar is back on the ground and the HUD icon clears. Pinned in Task 4 (run after Task 6).

---

### Task 1: Camera follows the hero

**Files:**
- Modify: `src/engine/render/view.ts`, `src/engine/render/view.test.ts` (create if missing)
- Modify: `config/camera.json` (add `view`, update `source`)
- Modify: `src/sandbox/main.tsx` (compute the view each render from the interpolated hero)

**Interfaces:**
- Produces: `followView(canvasW: number, canvasH: number, worldW: number, worldH: number, viewW: number, viewH: number, focusX: number, focusY: number): ViewTransform` (all world sizes and focus in world px).
  - `scale = min(canvasW / min(viewW, worldW), canvasH / min(viewH, worldH))`.
  - Per axis: if `world * scale <= canvas`, center the world (as `fitView`); else `offset = -clamp(focus * scale - canvas / 2, 0, world * scale - canvas)`.
- Focus is the hero box center: `(hero.x * cellPx, (hero.y - box.height / 2) * cellPx)` of the interpolated hero. `fit()` keeps the window rect; the render step computes `view` and adds the game window offset.

- [ ] **Step 1: Write the failing tests**

```ts
describe("followView", () => {
  const W = 400, H = 160;
  it("centers the focus away from the borders", () => {
    const v = followView(W, H, 960, 768, 400, 160, 480, 400);
    expect(v.scale).toBe(1);
    expect(v.offsetX).toBe(-(480 - 200));
    expect(v.offsetY).toBe(-(400 - 80));
  });
  it("stops at the top-left corner", () => {
    const v = followView(W, H, 960, 768, 400, 160, 10, 10);
    expect([v.offsetX, v.offsetY]).toEqual([0, 0]);
  });
  it("stops at the bottom-right corner", () => {
    const v = followView(W, H, 960, 768, 400, 160, 950, 760);
    expect([v.offsetX, v.offsetY]).toEqual([-(960 - 400), -(768 - 160)]);
  });
  it("centers an axis the world does not fill", () => {
    const v = followView(800, 160, 400, 768, 400, 160, 200, 400);
    expect(v.scale).toBe(1);
    expect(v.offsetX).toBe(200);
  });
  it("matches fitView when the world fits the view", () => {
    expect(followView(W, H, 400, 160, 400, 160, 0, 0)).toEqual(fitView(W, H, 400, 160));
  });
});
```

- [ ] **Step 2: Run `npx vitest run src/engine/render/view.test.ts`. Expected: FAIL, `followView` not exported**
- [ ] **Step 3: Implement `followView`, `camera.json` `view`, and the `main.tsx` change**
- [ ] **Step 4: Run `npm test && npm run lint && npm run typecheck`. Expected: pass**
- [ ] **Step 5: Run `npm run dev`; with the current 40 x 16 map the view must look unchanged (world fills the view). Screenshot to confirm**
- [ ] **Step 6: Commit `Follow the hero with the sandbox camera`**

---

### Task 2: Several lifts

**Files:**
- Modify: `src/game/level/sandboxLevel.ts`, `src/game/level/sandboxLevel.test.ts`
- Modify: `src/game/hero/hero.ts`, `src/game/stepWorld.ts`, `src/game/render/environment.ts`, `src/game/render/overlays.ts`
- Modify: `config/levels/sandbox.json` (`lift` to `lifts: [ { same values } ]`)
- Modify: tests using `world.lift` (`src/game/hero/locomotion.test.ts`, `actions.test.ts`, others found by `grep -rn "world.lift" src`)

**Interfaces:**
- Produces: `SandboxWorld.lifts: Lift[]`; `liftAt(world: SandboxWorld, h: Hero, cfg: MovementConfig): Lift | null` in `sandboxLevel.ts` (the lift whose x span contains the hero center and whose shaft `top - 1 .. bottom` contains the hero feet). `callLift`, `updateLift` unchanged. `stepWorld` updates every lift. Collision passes `world.lifts` as platforms. `h.onLift` stays boolean; `hero.ts` uses the lift under the hero where it used `world.lift`.

- [ ] **Step 1: Write the failing tests** (`sandboxLevel.test.ts` with a two-lift world built from the sandbox JSON plus a second lift `{ x: 30, width: 3, top: 4, bottom: 14 }`)

```ts
it("rides only the lift it stands on", () => {
  const g = gameOn(twoLifts, { x: 18.5, y: 14 });
  tick(g, [], ["up"]);
  run(g, 0.5);
  expect(g.world.lifts[0]!.target).toBe(4);
  expect(g.world.lifts[1]!.target).toBeNull();
  expect(g.world.lifts[1]!.y).toBe(14);
});
it("calls the second lift from its own shaft", () => {
  const g = gameOn(twoLifts, { x: 31.5, y: 14 });
  tick(g, [], ["up"]);
  run(g, 0.5);
  expect(g.world.lifts[1]!.target).toBe(4);
  expect(g.world.lifts[0]!.target).toBeNull();
});
```

Use the existing test world helpers (`src/game/hero/testWorld.ts`) and the same inputs the current single-lift tests in `locomotion.test.ts` use to ride and call the lift.

- [ ] **Step 2: Run `npx vitest run src/game`. Expected: FAIL**
- [ ] **Step 3: Implement; migrate every `world.lift` use to `lifts`**
- [ ] **Step 4: Run `npm test && npm run lint && npm run typecheck && npm run test:visual`. Expected: pass**
- [ ] **Step 5: Commit `Support several lifts in the sandbox`**

---

### Task 3: Tall, wide map

**Files:**
- Modify: `config/levels/sandbox.json` (rows 48 x 32, `lifts`, `backdrop`, `dressing`, `source`)
- Modify: `src/game/shots.test.ts:151` (right wall `x === 39` to the new wall `x === 47`) and any other test that legitimately changes
- Modify: `src/game/level/terrain.test.ts` only where the new rows change expectations (top-half expectations stay)
- Modify: `src/game/render/environment.ts` only if the sky / backdrop does not cover 48 x 32

**Interfaces:**
- Consumes: `lifts` (Task 2), `followView` (Task 1).
- Layout rules (spec): rows 0-15 cols 0-38 unchanged; cols 40-47 extend floors and walls only; lower half floors 7 cells apart, ground at row 31; at least 2 new lifts, 3 new platforms (ledges and girders), 1 new ladder, all in cols 1-38; every floor reachable from spawn and back up; pits at rows 14-15 cols 28-30 and 34-37 open into the lower half; tall non-blocking scenery in `backdrop`, `dressing` only low items.

- [ ] **Step 1: Edit `sandbox.json`**
- [ ] **Step 2: Add a reachability test in `src/game/level/terrain.test.ts` or a new `src/game/level/reach.test.ts`**: from the spawn floor, every floor run (ledge or girder top) is reachable through walking, ladders (`H` runs), lifts (`top` / `bottom` stops) or a drop of at most `fallDeathCells - 1` rows; and the spawn floor is reachable back from each. Keep it a graph search over floor runs; no physics.
- [ ] **Step 3: Run `npm test && npm run lint && npm run typecheck && npm run test:visual`. Expected: pass**
- [ ] **Step 4: Run `npm run dev`; screenshot fog off: spawn, scrolled to each corner, riding each new lift, a new ladder, the right strip. Check camera centering and edge stops, cache alignment while scrolling, blocking vs background readability. Iterate on the layout**
- [ ] **Step 5: Record a 5 s performance trace while walking and scrolling; report median frame script time against Task 6's 4.1-4.3 ms**
- [ ] **Step 6: Commit `Grow the sandbox map to 48 x 32 with more lifts and platforms`**

---

### Task 4: Crowbar in the HUD

**Files:**
- Modify: `src/game/hud/svg.ts`, `src/game/hud/svg.test.ts`, `src/game/hud/icons.ts`
- Modify: `src/sandbox/store.ts`, `src/sandbox/main.tsx` (`push`), `src/sandbox/ui/Hud.tsx`
- Modify: `spikes/hud-design/index.html` (same layout as `src/game/hud/`, per CLAUDE.md; add the item icon next to the hand)

**Interfaces:**
- `HudState.item: string` becomes `items: string[]` (env asset ids of held items). `HudIcons` gains `items: Partial<Record<string, HudIcon>>`.
- Inventory slot: the hand always draws; each held item draws to the right of the hand, inside the slot, as its icon image, vertically centered with the hand. Text label removed.
- `hudIcons()` renders the `crowbar` env asset (state 0, `lod: false`, `lines: 1`) into a canvas icon via the existing `icon()` helper, fit to the slot height.
- Store gets `items: string[]`; `push()` sets it from `world.props` with `kind === "item" && taken` mapped to `"crowbar"`.

- [ ] **Step 1: Write the failing tests** in `svg.test.ts`: with `items: ["crowbar"]` and an icon present, the SVG contains the hand and an `<image` whose x is right of the hand's x; with `items: []`, the SVG contains the hand and no item image.
- [ ] **Step 2: Run `npx vitest run src/game/hud`. Expected: FAIL**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Add a store test: after the hero picks up the crowbar, `items` is `["crowbar"]`; after the hero dies and respawns, `items` is `[]`** (`src/sandbox/store.test.ts` or the place the existing store tests drive the world)
- [ ] **Step 5: Run `npm test && npm run lint && npm run typecheck`. Expected: pass**
- [ ] **Step 6: Screenshot the HUD before and after picking up the crowbar**
- [ ] **Step 7: Commit `Show the taken crowbar next to the HUD hand`**

---

### Task 5: Docs

**Files:**
- Modify: `CLAUDE.md` (code layout: `src/game/env/`, `render/environment.ts` with depth haze and static-layer cache, `level/terrain.ts`, `lifts`, `followView` camera, HUD item icons; `test:visual` covers env assets; spikes: `ENV.draw` `size` option, `ladder` asset)
- Modify: `docs/requirements.md` (decision log rows dated 2026-10-19: sandbox reskinned from env assets, ladder asset, bag and target dropped, hiding-beside state unused in game, depth haze for non-blocking scenery, open sky; tall 48 x 32 map with several lifts; camera follows the hero with edge stops; lifts stay at the hero level (map rule and reach test); map resets when the hero dies; crowbar icon next to the HUD hand. Update the environment sheet status line)

- [ ] **Step 1: Edit both files; each idea once**
- [ ] **Step 2: Commit `Document the env reskin, tall map and camera`**

---

### Task 6: Reset the map when the hero dies

**Files:**
- Modify: `src/game/level/sandboxLevel.ts` (keep the source JSON on the world, add `resetWorld`)
- Modify: `src/game/stepWorld.ts` (reset when the hero respawns), `src/game/hero/hero.ts` only if the respawn moment needs an event
- Modify: `src/game/fog.ts` if fog needs a reset helper
- Modify: `src/sandbox/main.tsx` (manual respawn / record reset uses the same `resetWorld`)
- Test: `src/game/stepWorld.test.ts`

**Interfaces:**
- Produces: `resetWorld(world: SandboxWorld): void` restores everything `loadSandbox` builds (grid, lifts at `bottom`, props, enemy, projectiles, sparks, terrain, scenery) from the kept source, and resets `world.fog` to a fresh fog with the same config when fog is on (stays `null` when off).
- The reset runs on the step where the hero respawns after a death (`death`, `fallDeath`, `jumpDeath` end). Hero ammo carries over unchanged.

- [ ] **Step 1: Write the failing tests** in `stepWorld.test.ts`: take the crowbar, flip the switchboard on, call a lift to its top, uncover fog cells, damage the enemy, then kill the hero and run past `respawnMs`. Expect: crowbar `taken` false, switchboard `on` false, every lift at `bottom` with `target` null, enemy hits back to full, no projectiles or sparks, fog revealed cells equal a fresh fog after the first step at spawn, hero ammo unchanged.
- [ ] **Step 2: Run `npx vitest run src/game/stepWorld.test.ts`. Expected: FAIL**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run `npm test && npm run lint && npm run typecheck`. Expected: pass (hud-only typecheck errors from another session excepted)**
- [ ] **Step 5: Commit `Reset the sandbox map when the hero dies`**
