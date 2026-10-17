# Engine core and movement sandbox implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 1b: a TypeScript engine core and one playable sandbox screen where every hero move from the spec can be played, watched, tuned and replayed.

**Architecture:** `src/engine/` is game-agnostic plain TypeScript (math, keyframe animation, rig tree, fixed-step loop, input, tile world, renderer). `src/game/` holds the Colony 28 robot, gun and hero state machine built on the engine. `src/sandbox/` is the React debug shell; Zustand bridges engine state to React. All tuning lives in `config/`.

**Tech Stack:** TypeScript (strict), Vite, Vitest, ESLint, React, Zustand, Playwright (visual check only), Canvas 2D.

**Spec:** `docs/superpowers/specs/2026-10-17-colony2080-design.md` (section "1b: engine core and movement sandbox"). Look reference: `spikes/shared/xbot.js`, `spikes/shared/gun.js`, `spikes/movement/moves.js`.

## Global Constraints

- TypeScript + Vite. React only for the UI shell and debug panels. Zustand bridges engine state to UI.
- `src/engine/**` must not import React, Zustand or anything under `src/game/` or `src/sandbox/` (enforced by ESLint).
- Canvas 2D only. No Next.js, no three.js, no DOS emulator.
- Fixed timestep 60 Hz; render interpolates.
- World units are cells (24 original px). Floor height is 7 cells; hero height 1.9 cells (original sprite 45 px of a 168 px floor).
- Tuning values, clip keyframes and the sandbox level live in `config/` as JSON with `"status": "draft"` and a `"source"`.
- Controls follow `config/controls.json` (original layout, inventory on `KeyI`); bindings are data, so they can change later.
- Robot look at rest pose must match `spikes/robot-design/` pixel for pixel (full and game LOD), and the gun must match `spikes/gun-design/`.
- No code comments of any kind (user rule); the only exception is a workaround for an environment bug, stating the limitation only.
- The spikes stay frozen; this plan does not edit `spikes/`.

## Review Focus

1. Window loses focus while a key is held - every held action releases, the hero stops instead of walking forever (Task 7).
2. Tab hidden or a long frame (dt of seconds) - the loop clamps steps, the hero never tunnels through floors (Task 7, Task 8).
3. Bound keys that the browser also uses (Alt, Tab, Ctrl+arrows, Enter) - `preventDefault` on bound keys so the page never navigates or moves focus (Task 7).
4. Window resize or devicePixelRatio change - canvas stays crisp and the whole sandbox screen stays visible with the same aspect (Task 12).
5. Left and Right held together - the last pressed direction wins, no jitter between facings (Task 7).

---

## File structure

```
package.json, tsconfig.json, vite.config.ts, vitest.config.ts, eslint.config.js
sandbox.html                         sandbox page (Vite input)
tools/visual/compare.html            visual check page (Vite input, dev only)
scripts/visual-check.mjs             starts Vite, runs compare page in Playwright
config/hero/movement.json            hero tuning numbers
config/hero/clips.json               hero animation clips
config/levels/sandbox.json           sandbox screen grid and objects
src/engine/math/mat2d.ts             2D affine matrix
src/engine/anim/keyed.ts             easing and keyframe sampling
src/engine/rig/tree.ts               rig node types and builder (with LOD filter)
src/engine/rig/pose.ts               joint values, locate(), solve()
src/engine/rig/draw.ts               rig renderer (full and simple shading)
src/engine/loop.ts                   fixed-step loop
src/engine/input.ts                  key bindings, held and buffered actions, record and replay
src/engine/world/tiles.ts            tile grid
src/engine/world/collide.ts          box movement against tiles and platforms
src/engine/render/view.ts            device-scaled view transform
src/game/robot/xbot.ts               robot part tree (port of spikes/shared/xbot.js shapes)
src/game/robot/gun.ts                gun model and hold poses (port of spikes/shared/gun.js)
src/game/hero/config.ts              typed loaders for movement.json and clips.json
src/game/hero/hero.ts                hero data, state machine, physics
src/game/hero/look.ts                hero state to drawable pose (clips, gun, climb IK, grounding)
src/game/level/sandboxLevel.ts       sandbox world (grid, lift, props)
src/game/render/scene.ts             draws level, props and hero
src/sandbox/main.tsx                 boot: loop, input, render, React root
src/sandbox/store.ts                 Zustand store
src/sandbox/ui/*.tsx                 debug panels
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `sandbox.html`, `src/sandbox/main.tsx`, `src/engine/smoke.test.ts`
- Modify: `.gitignore` (add `node_modules/`, `dist/`)

**Interfaces:**
- Produces: scripts `npm run dev` (Vite, opens `/sandbox.html`), `npm run build`, `npm test` (Vitest, node environment), `npm run lint`, `npm run typecheck` (`tsc --noEmit`), `npm run test:visual` (placeholder until Task 4).
- Produces: JSON imports from `config/` (`resolveJsonModule`), path alias `@config/*` to `config/*`.

- [ ] **Step 1:** Install `vite typescript vitest eslint typescript-eslint @vitejs/plugin-react react react-dom zustand @types/react @types/react-dom playwright` (latest) as devDependencies or dependencies (React, ReactDOM, Zustand as dependencies).
- [ ] **Step 2:** `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `module: ESNext`, `moduleResolution: bundler`, `jsx: react-jsx`, `resolveJsonModule`, `lib: [ES2022, DOM]`.
- [ ] **Step 3:** `vite.config.ts`: React plugin, multi-page `build.rollupOptions.input` with `sandbox.html` and `tools/visual/compare.html`, `server.open: "/sandbox.html"`, alias `@config`.
- [ ] **Step 4:** `eslint.config.js`: typescript-eslint recommended; for `src/engine/**` add `no-restricted-imports` patterns `react`, `react-dom`, `zustand`, `**/game/**`, `**/sandbox/**`.
- [ ] **Step 5:** Write `src/engine/smoke.test.ts` importing `config/controls.json` and asserting `controls.keyboard.inventory` equals `["KeyI"]`.
- [ ] **Step 6:** `sandbox.html` with a full-viewport `<canvas id="game">` and `<div id="ui">`; `src/sandbox/main.tsx` renders an empty React root into `#ui`.
- [ ] **Step 7:** Run `npm test && npm run lint && npm run typecheck && npm run build`. Expected: all pass, `dist/sandbox.html` exists.
- [ ] **Step 8:** Add a "Commands" section to `CLAUDE.md` listing the npm scripts and replace "Pre-code" in "Project state" with "Phase 1b: engine core and movement sandbox". Commit.

---

### Task 2: Matrix and keyframe math

**Files:**
- Create: `src/engine/math/mat2d.ts`, `src/engine/math/mat2d.test.ts`, `src/engine/anim/keyed.ts`, `src/engine/anim/keyed.test.ts`

**Interfaces:**
- Produces: `type Mat2D = { a: number; b: number; c: number; d: number; e: number; f: number }`; `identity(): Mat2D`; `multiply(m: Mat2D, n: Mat2D): Mat2D`; `translate(m, x, y)`, `rotate(m, deg)`, `scale(m, sx, sy)` (each returns new `Mat2D`, same semantics as `DOMMatrix.translate/rotate/scale`); `apply(m, [x, y]): [number, number]`; `determinant(m): number`; `parseTransform(s: string | null): Mat2D` (accepts `translate(x y)`, `scale(sx sy)` or `scale(s)`, `rotate(deg cx cy)`, space or comma separated, chained left to right, as `parseTf` in `spikes/shared/xbot.js`).
- Produces: `clamp(v, a = 0, b = 1)`, `ease(k)` (smoothstep), `easeIn(k)`, `easeOut(k)`, `span(t, a, b)`; `type Keys = [number, Record<string, number>][]`; `keyed(keys: Keys, t: number, fn = ease): Record<string, number>` (missing names count as 0, clamps outside the range); `num(keys: [number, number][], t, fn = ease): number`; `mix(a, b, k): Record<string, number>`.

- [ ] **Step 1: Failing tests.** `mat2d.test.ts`: `apply(rotate(identity(), 90), [1, 0])` is `[0, 1]` within 1e-9; `parseTransform("translate(10 0) rotate(90 0 0)")` maps `[1, 0]` to `[10, 1]`; `parseTransform("scale(2)")` maps `[1, 1]` to `[2, 2]`; `determinant(scale(identity(), 2, 3))` is 6. `keyed.test.ts`: `keyed([[0, { a: 0 }], [1, { a: 10, b: 4 }]], 0.5)` is `{ a: 5, b: 2 }`; values clamp before the first and after the last key; `num([[0, 0], [2, 8]], 1, k => k)` is 4; `span(5, 0, 10)` is 0.5.
- [ ] **Step 2:** Run `npm test -- mat2d keyed`. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement both modules (port `keyed`, `num`, `mix`, easing from `spikes/movement/moves.js`).
- [ ] **Step 4:** Run `npm test -- mat2d keyed`. Expected: PASS.
- [ ] **Step 5:** Commit.

---

### Task 3: Rig tree, pose, locate, solve and renderer

**Files:**
- Create: `src/engine/rig/tree.ts`, `src/engine/rig/pose.ts`, `src/engine/rig/draw.ts`, `src/engine/rig/rig.test.ts`

**Interfaces:**
- Consumes: Task 2 `Mat2D`, `parseTransform`, `multiply`, `translate`, `rotate`, `scale`, `apply`.
- Produces (`tree.ts`): `type Pt = [number, number]`; `type Material = "armor" | "metal" | "chrome"`; `type Shade = "box" | "dome" | "cyl" | "hcyl" | "none"`; `interface PartSpec { pts: Pt[]; r?: number; mat?: Material; shade?: Shade; line?: boolean }`; `type RigNode = GroupNode | PartNode | FlatNode | EllipseNode | TrefoilNode | HookNode` with `GroupNode { k: "g"; m: Mat2D | null; name?: string; pivot?: Pt; filter?: string; kids: RigNode[] }`; `interface LodLimits { minThickness: number; minArea: number }`; `createBuilder(lod: LodLimits | null)` returning `{ root(): GroupNode; G(parent, tf: string | null, name?, pivot?, extra?): GroupNode; P(parent, spec): void; F(parent, pts, fill, r?): void; E(parent, cx, cy, rx, ry, fill, opacity?): void; hook(parent, name): void; trefoil(parent, x, y, r, sx?, outer?): void; tiny(pts): boolean }` with the drop rules of `tiny()` in `spikes/shared/xbot.js` (flats with fill `visor` never drop). `mirrorPts(pts, ax)`.
- Produces (`pose.ts`): `type JointValue = number | { rot?: number; dx?: number; dy?: number; sx?: number; sy?: number }`; `type Pose = Record<string, JointValue>`; `jointMatrix(node: GroupNode, v: JointValue | undefined): Mat2D | null`; `locate(root: RigNode, hook: string, pose: Pose): Mat2D | null`; `solve(root, hook, pose, keys: [string, string], ranges: [[number, number], [number, number]], target: Pt): Record<string, number>` (grid step 4, refine 1 then 0.25, as `solve` in `spikes/shared/xbot.js`).
- Produces (`draw.ts`): `type Palette = Record<string, string>`; `type HookDraw = (ctx: CanvasRenderingContext2D) => void`; `drawRig(ctx, root, opts: { palette: Palette; pose?: Pose; hooks?: Record<string, HookDraw | undefined>; lineW?: number; simple?: boolean }): void` reproducing `render`/`drawPart`/`drawTrefoil` of `spikes/shared/xbot.js` exactly (same draw order, same shading polygons, `Path2D` built lazily and cached on the node).

- [ ] **Step 1: Failing tests** in `rig.test.ts` (node environment, no canvas): a tree with group `arm` (pivot `[0, 0]`) holding a hook `hand` under `translate(0 10)`; `locate(root, "hand", { arm: 90 })` maps `[0, 0]` to `[-10, 0]` within 1e-9; `{ arm: { dy: -5 } }` maps it to `[0, 5]`; `{ arm: { sy: 0.5 } }` maps it to `[0, 5]`; `solve` on a two-segment arm (lengths 10 and 10) reaches target `[0, 14]` within 0.5; `createBuilder({ minThickness: 8, minArea: 400 }).tiny([[0, 0], [7, 100]])` is true and `tiny([[0, 0], [30, 30]])` is false; `createBuilder(null).tiny(...)` is always false.
- [ ] **Step 2:** Run `npm test -- rig`. Expected: FAIL.
- [ ] **Step 3:** Implement `tree.ts`, `pose.ts`, `draw.ts` as specified. `drawRig` takes the joint pivot math from `jointMatrix` so render and `locate` share one code path.
- [ ] **Step 4:** Run `npm test -- rig`. Expected: PASS.
- [ ] **Step 5:** Commit.

---

### Task 4: Robot model port and visual check

**Files:**
- Create: `src/game/robot/xbot.ts`, `src/game/robot/xbot.test.ts`, `tools/visual/compare.html`, `tools/visual/compare.ts`, `scripts/visual-check.mjs`
- Modify: `package.json` (`test:visual` runs `node scripts/visual-check.mjs`)

**Interfaces:**
- Consumes: Task 3 builder, `drawRig`, `Palette`; `config/robots/xbot.json` (`palette`, `frame`, `proportions`, `levels`, `joints`, `hooks`, `gameLod`).
- Produces: `ROBOT = { AX: number; SIDE_AX: number; FOOT_Y: number; palette: Palette }`; `buildFront(opts?: { lod?: boolean; rightArmFirst?: boolean; propBehindArm?: boolean }): GroupNode`; `buildSide(opts?: { farLimbs?: boolean; badge?: boolean; propBehindArm?: boolean; lod?: boolean }): GroupNode`; `buildBack(opts?: { leftArmBehind?: boolean; rightForeBehind?: boolean; thumbsBehind?: boolean; forearmsUnder?: boolean; lod?: boolean }): GroupNode`. Shapes, joint names, hook names and option behaviour copied from `spikes/shared/xbot.js` at commit `ae7d64a`.
- Produces: `window.__visual: { name: string; diff: number }[]` on the compare page; `scripts/visual-check.mjs` exits 1 when any `diff` is above 0.

- [ ] **Step 1: Failing test** `xbot.test.ts`: every joint name in `config.joints.side` is a named group in `buildSide({ farLimbs: true })`; same for front and back; every hook in `config.hooks.<view>` is found by `locate` with an empty pose (side built with `farLimbs: true`); `buildSide({ lod: true })` has fewer part nodes than `buildSide()`.
- [ ] **Step 2:** Run `npm test -- xbot`. Expected: FAIL.
- [ ] **Step 3:** Port the builders into `src/game/robot/xbot.ts` (tree builder per call with `lod ? config.gameLod : null`).
- [ ] **Step 4:** Run `npm test -- xbot`. Expected: PASS.
- [ ] **Step 5:** Build the compare page: loads `/spikes/shared/config.js` and `/spikes/shared/xbot.js` as classic scripts plus `compare.ts` as a module; for each case renders the spike tree with `window.XBOT.render` and the port with `drawRig` onto two 640x780 canvases (identity transform, `lineW` 2.2, same palette) and counts pixels whose RGBA differs. Cases: front, side, side `{ badge: true }`, side `{ farLimbs: true }`, back, back `{ leftArmBehind: true, rightForeBehind: true }`, back `{ thumbsBehind: true, forearmsUnder: true }`, each with and without `lod` (LOD cases render with `simple: true`).
- [ ] **Step 6:** `scripts/visual-check.mjs`: start Vite with `createServer` on a free port, launch Playwright Chromium, open `/tools/visual/compare.html`, wait for `window.__visual`, print each case, exit 1 on any diff above 0.
- [ ] **Step 7:** Run `npx playwright install chromium && npm run test:visual`. Expected: every case prints `diff 0`.
- [ ] **Step 8:** Commit.

---

### Task 5: Gun port

**Files:**
- Create: `src/game/robot/gun.ts`, `src/game/robot/gun.test.ts`
- Modify: `tools/visual/compare.ts` (gun cases)

**Interfaces:**
- Consumes: Task 3 `locate`, `solve`, `Palette`; Task 4 `ROBOT.palette`.
- Produces: `GUN_PARTS`, `MUZZLE: Pt`, `SUPPORT: Pt`, `toHook(p: Pt): Pt`, `MUZZLE_IN_HOOK`, `SUPPORT_IN_HOOK`; `drawGun(ctx, opts?: { palette?: Palette; lineW?: number; simple?: boolean })`; `gunHook(ctx, opts?)` (draws in hand-hook frame); `gunSlung(ctx, opts?)` (back view robot frame); `CARRY = { arm: 0, fore: -72 }`, `FRONT_CARRY = { armL: -24, foreL: -66 }`; `holdPoses(side: GroupNode, front: GroupNode): { CARRY; CARRY_FAR: { armFar: number; foreFar: number }; FRONT_CARRY; FRONT_CARRY_R: { armR: number; foreR: number } }`. Values and shapes from `spikes/shared/gun.js` at `ae7d64a`.

- [ ] **Step 1: Failing test** `gun.test.ts`: with `buildSide({ farLimbs: true, propBehindArm: true })`, the `handFar` hook under `{ ...CARRY, ...CARRY_FAR }` lands within 1 unit of the `hand` hook point `SUPPORT_IN_HOOK`; same for front `handR` against `handL`; `toHook([1, 2])` is `[-2, 1]`.
- [ ] **Step 2:** Run `npm test -- gun`. Expected: FAIL.
- [ ] **Step 3:** Implement `gun.ts`.
- [ ] **Step 4:** Run `npm test -- gun`. Expected: PASS.
- [ ] **Step 5:** Add compare cases (spike `window.GUN` loaded from `/spikes/shared/gun.js`): gun alone, side held (`propBehindArm`), front held (`rightArmFirst`, `propBehindArm`), back slung; full and LOD. Run `npm run test:visual`. Expected: every case `diff 0`.
- [ ] **Step 6:** Commit.

---

### Task 6: Hero tuning, clips and level config

**Files:**
- Create: `config/hero/movement.json`, `config/hero/clips.json`, `config/levels/sandbox.json`, `src/game/hero/config.ts`, `src/game/hero/config.test.ts`

**Interfaces:**
- Produces types in `config.ts`: `type HeroState = "idle" | "turn" | "walk" | "run" | "standJump" | "runJump" | "fall" | "land" | "fallDeath" | "duck" | "duckAttack" | "kneel" | "use" | "hide" | "attack" | "weaponSwitch" | "ladder" | "hit" | "death"`; `type Weapon = "fists" | "gun"`; `type View = "side" | "front" | "back"`; `interface Clip { duration: number; loop: boolean; travel?: number; cancelAt?: number; pose: Keys; view?: [number, View][]; rot?: [number, number][]; tint?: [number, number][]; gun?: [number, "hand" | "none" | "dropped"][] }`; `type ClipSet = Record<string, Clip>`; `interface MovementConfig` mirroring `movement.json`; `loadMovement(json: unknown): MovementConfig` and `loadClips(json: unknown): ClipSet` (throw `Error` naming the bad field on missing or non-finite numbers, unsorted keys or durations not above 0); `clipFor(state: HeroState, weapon: Weapon): string`.
- `movement.json` (first guesses, tuned in the sandbox later):

```json
{
  "status": "draft",
  "source": "docs/superpowers/specs/2026-10-17-colony2080-design.md",
  "cellPx": 24,
  "heroHeightCells": 1.9,
  "floorHeightCells": 7,
  "box": { "width": 0.7, "height": 1.9, "duckHeight": 1.2 },
  "gravity": 30,
  "maxFallSpeed": 18,
  "jump": { "standHeight": 1.0, "runHeight": 1.2, "runSpeed": 6.5 },
  "fallDeathCells": 7,
  "ladderSpeed": 2.0,
  "liftSpeed": 2.5,
  "inputBufferMs": 150,
  "fireRate": 12,
  "energy": { "max": 100, "hit": 25 },
  "respawnMs": 2000
}
```

- `clips.json` clip names and sources (values ported from `spikes/movement/moves.js` at `ae7d64a`; durations equal the spike periods unless stated):
  - `idle` static `STAND`; `turn` 0.24 s, `view` front 0 to 0.12, then side (hero facing flips at 0.12); `walk` loop 1.1 s, `travel` 2.0, keys = `walkPose(p)` sampled at 8 even phases plus the closing key; `run` loop 0.66 s, `travel` 2.6, keys from `RUN_LEG` through `runPose`.
  - `standJump` keys from the standing jump cell (crouch, launch, tuck, extend) without the vertical offset (physics owns height); `runJump` the `leap` pose; `fall` the falling pose; `land` 0.5 s from `CROUCH` to `STAND`.
  - `fallDeath` and `death` keys from the spike cells ending in `FLAT_BACK`, `rot` to `LIE` (-89), `gun` dropped at the spike's drop times.
  - `duck` hold pose; `kneel` 1.6 s with item pickup event at 0.8; `use` 1.6 s reach (fists) and `useGun` with the far arm reach; `hide` 0.6 s with `view` front from 0.15 and `tint` 0 to 1; `punch` 1.2 s loop with `cancelAt` 0.35; `duckPunch` 1.0 s; `shoot` and `duckShoot` static stance; `weaponSwitch` 1.0 s draw (hip to carry) with `gun` hand from 0.15; `hit` 0.6 s recoil; `ladder` loop with `travel` 0.88 (two rungs).
- `sandbox.json`: 40 x 16 cells, `#` solid, `H` ladder, `.` empty, cell `(col, row)` top-left, y down, floor surface at y 14:

```json
{
  "status": "draft",
  "source": "docs/superpowers/specs/2026-10-17-colony2080-design.md",
  "rows": [
    "########################################",
    "#......................................#",
    "#......................................#",
    "#......................................#",
    "###H#######.........####...............#",
    "#..H...................................#",
    "#..H...................................#",
    "#..H...................................#",
    "#..H...................................#",
    "#..H...................................#",
    "#..H...................................#",
    "#..H........####.......................#",
    "#..H...................................#",
    "#..H......................#............#",
    "############################...###....##",
    "############################...###....##"
  ],
  "spawn": [7.5, 14],
  "lift": { "x": 17, "width": 3, "top": 4, "bottom": 14 },
  "props": [
    { "kind": "crate", "x": 5, "width": 1, "height": 1, "hide": true },
    { "kind": "barrel", "x": 24, "width": 1, "height": 1.3, "hide": true },
    { "kind": "item", "x": 9.5 },
    { "kind": "panel", "x": 21.5, "y": 12 },
    { "kind": "bag", "x": 13.5 },
    { "kind": "target", "x": 15.5 }
  ]
}
```

  Features: ladder col 3 up to the left platform (y 4), right platform reached by lift, walk off the left platform edge (x 11, 10 cells) = fall death, low ledge (cols 12-15, y 11, 3 cells) = safe fall, step at col 26, 3-cell gap (cols 28-30, clearable by running jump), 4-cell gap (cols 34-37, not clearable), both gaps open to the bottom (pit death).

- [ ] **Step 1: Failing test** `config.test.ts`: `loadMovement(movement.json)` returns `gravity` 30; `loadMovement` throws naming `gravity` when it is `"x"`; `loadClips(clips.json)` has a clip for every `clipFor(state, weapon)` result over all states and both weapons; every clip's keys are sorted by time and within `[0, duration]`; `loadClips` throws on a clip with `duration: 0`.
- [ ] **Step 2:** Run `npm test -- config`. Expected: FAIL.
- [ ] **Step 3:** Write the three JSON files and `config.ts`. `clipFor`: `attack` maps to `punch` or `shoot`, `duckAttack` to `duckPunch` or `duckShoot`, `use` to `use` or `useGun`, other states to their own name.
- [ ] **Step 4:** Run `npm test -- config`. Expected: PASS.
- [ ] **Step 5:** Commit.

---

### Task 7: Fixed-step loop and input

**Files:**
- Create: `src/engine/loop.ts`, `src/engine/loop.test.ts`, `src/engine/input.ts`, `src/engine/input.test.ts`

**Interfaces:**
- Produces (`loop.ts`): `class FixedLoop { constructor(opts: { step: number; maxSteps: number; update(dt: number): void; render(alpha: number): void }); timeScale: number; paused: boolean; advance(realDtSeconds: number): void; stepOnce(): void; start(raf?: (cb: FrameRequestCallback) => number): void; stop(): void }` with `step` 1/60 and `maxSteps` 5; leftover time beyond `maxSteps` is dropped.
- Produces (`input.ts`): `type Bindings = Record<string, string[]>` (action to `KeyboardEvent.code` list, shape of `config/controls.json` `keyboard`); `interface InputFrame { held: Set<string>; pressed: Set<string>; dir: -1 | 0 | 1 }`; `class Input { constructor(bindings: Bindings, now: () => number, bufferMs: number); keyDown(code: string, time?: number): boolean; keyUp(code: string): boolean; releaseAll(): void; frame(): InputFrame; consume(action: string): boolean; startRecording(): void; stopRecording(): InputRecord; play(record: InputRecord): void; attach(target: Window): () => void }`; `type InputRecord = { frame: number; type: "down" | "up"; code: string }[]`. `keyDown`/`keyUp` return true when the code is bound (caller then calls `preventDefault`). `dir` follows the last pressed of `moveLeft` / `moveRight` still held. `pressed` keeps an action until consumed or older than `bufferMs`. Recording and playback are indexed by frame count (one `frame()` call per fixed step).

- [ ] **Step 1: Failing tests.** `loop.test.ts`: `advance(0.05)` runs `update` 3 times with dt 1/60 and calls `render` with alpha near 0; `advance(10)` runs at most 5 updates; `paused` runs 0 updates; `stepOnce` while paused runs exactly 1; `timeScale` 0.5 with `advance(1/30)` runs 1 update. `input.test.ts`: binding `{ moveLeft: ["ArrowLeft"], moveRight: ["ArrowRight"], shoot: ["ControlLeft"] }`; down Right then down Left gives `dir` -1, up Left gives `dir` 1; `keyDown("KeyQ")` returns false; `releaseAll` empties `held`; a `shoot` press at t 0 is consumable at t 100 with buffer 150 and gone at t 200; recording two frames and playing them back reproduces the same `held` sets frame by frame; `attach` handles `blur` by calling `releaseAll`.
- [ ] **Step 2:** Run `npm test -- loop input`. Expected: FAIL.
- [ ] **Step 3:** Implement both modules (`attach` wires `keydown`/`keyup` with `preventDefault` for bound codes and ignores `event.repeat`, plus `blur` and `visibilitychange`).
- [ ] **Step 4:** Run `npm test -- loop input`. Expected: PASS.
- [ ] **Step 5:** Commit.

---

### Task 8: Tile world, collision and lift

**Files:**
- Create: `src/engine/world/tiles.ts`, `src/engine/world/collide.ts`, `src/engine/world/world.test.ts`, `src/game/level/sandboxLevel.ts`

**Interfaces:**
- Produces (`tiles.ts`): `class TileGrid { constructor(rows: string[]); width: number; height: number; at(col: number, row: number): string; solid(col, row): boolean; ladderAt(x: number, y: number): boolean }` (outside the grid: solid on the sides and top, empty below).
- Produces (`collide.ts`): `interface Box { x: number; y: number; w: number; h: number }` (x center, y feet); `interface Platform { x: number; y: number; w: number; vy: number }` (top surface); `interface MoveResult { x: number; y: number; hitX: boolean; hitY: boolean; onGround: boolean; platform: Platform | null }`; `moveBox(box: Box, dx: number, dy: number, grid: TileGrid, platforms: Platform[]): MoveResult` (axis-separated, substeps no longer than 0.25 cells so dt spikes never tunnel; platforms are one-way from above).
- Produces (`sandboxLevel.ts`): `interface Prop { kind: string; x: number; y?: number; width?: number; height?: number; hide?: boolean; taken?: boolean; on?: boolean }`; `interface Lift extends Platform { top: number; bottom: number }`; `interface SandboxWorld { grid: TileGrid; lift: Lift; props: Prop[]; spawn: [number, number] }`; `loadSandbox(json: unknown): SandboxWorld`; `moveLift(lift: Lift, dir: -1 | 0 | 1, speed: number, dt: number): void` (clamps between `top` and `bottom`, sets `vy`).

- [ ] **Step 1: Failing tests** with the sandbox grid: a box (w 0.7, h 1.9) at `(7.5, 13)` moved `dy` 2 stops at `y` 14 with `onGround`; moved right from `(25, 14)` by 1 hits the step at col 26 (`hitX`); `(27.9, 14)` moved right 0.5 with `dy` 0.1 is no longer on ground (gap); `moveBox` with `dy` 40 from `(7.5, 1)` still stops on the floor (no tunnel); a box standing on the lift moves up with it after `moveLift(lift, -1, 2.5, 1)`; `moveLift` never passes `top` 4; `ladderAt(3.5, 10)` is true and `ladderAt(5.5, 10)` false; falling below row 16 is reported by `y > grid.height`.
- [ ] **Step 2:** Run `npm test -- world`. Expected: FAIL.
- [ ] **Step 3:** Implement the three modules.
- [ ] **Step 4:** Run `npm test -- world`. Expected: PASS.
- [ ] **Step 5:** Commit.

---

### Task 9: Hero locomotion state machine

**Files:**
- Create: `src/game/hero/hero.ts`, `src/game/hero/locomotion.test.ts`

**Interfaces:**
- Consumes: Task 6 types and configs, Task 7 `InputFrame`, Task 8 `moveBox`, `SandboxWorld`, `moveLift`.
- Produces: `interface Hero { x: number; y: number; vx: number; vy: number; facing: 1 | -1; state: HeroState; time: number; weapon: Weapon; energy: number; fallFrom: number; onGround: boolean; hidden: boolean; climb: number }`; `type HeroEvent = { kind: "pickup" | "use" | "shot" | "punch" | "died"; x: number; y: number }`; `createHero(spawn: [number, number], weapon: Weapon): Hero`; `updateHero(h: Hero, input: InputFrame, world: SandboxWorld, cfg: MovementConfig, clips: ClipSet, dt: number, consume: (action: string) => boolean): HeroEvent[]`.
- Transitions owned here (action names from `config/controls.json`):
  - `idle`: `dir` equal to `facing` goes to `walk`, or `run` with `runModifier` held; `dir` opposite to `facing` goes to `turn`; `up` pressed at a ladder goes to `ladder`, otherwise `standJump`; `down` at a ladder top goes to `ladder`.
  - `turn`: committed for its clip duration, flips `facing` at the clip's view switch, then `idle`.
  - `walk` / `run`: speed = clip `travel / duration` in `facing`; `dir` 0 goes to `idle`; opposite `dir` goes to `turn`; toggling `runModifier` swaps walk and run; `up` pressed in `run` goes to `runJump`.
  - `standJump` / `runJump`: committed; launch velocity `sqrt(2 * gravity * height)`, `runJump` horizontal speed `jump.runSpeed`; back to `land` on ground.
  - Leaving the ground without a jump goes to `fall`, recording `fallFrom`.
  - On landing from `fall` or a jump: drop above `fallDeathCells` goes to `fallDeath`, otherwise `land` (committed, then `idle`).
  - `y` above `grid.height + 2` (pit) goes to `fallDeath` and emits `died`.
  - `ladder`: x snaps to the ladder column center, no gravity, `up`/`down` move at `ladderSpeed`, `climb` accumulates distance for the clip phase; leaving the ladder top onto solid ground or reaching the floor goes to `idle`.
  - On the lift with no ladder: held `up`/`down` call `moveLift` at `liftSpeed`; the hero rides via `moveBox` platform carry.
  - `fallDeath` and `death`: no input; after `respawnMs` the hero respawns at `spawn` with full energy.

- [ ] **Step 1: Failing tests** (helpers run `updateHero` at 1/60 for a number of frames with a scripted `InputFrame`): holding Right for 1 s from spawn moves `x` by about `2.0 / 1.1` cells (within 0.05) in `walk`; with `runModifier` about `2.6 / 0.66`; pressing Left while facing right enters `turn` and ends `idle` facing -1 after 0.24 s; standing jump peaks at 1.0 cells (within 0.05); a running jump from x 27.6 lands beyond col 31 (gap 3 cleared); a running jump at the 4-cell gap ends in `fallDeath`; walking off the left platform edge ends in `fallDeath`, off the low ledge in `land`; `up` at x 3.5 on the floor enters `ladder` and holding `up` reaches the platform at y 4 and returns to `idle`; standing on the lift and holding `up` for 5 s raises hero `y` to 4; after `fallDeath` and 2 s the hero is back at spawn.
- [ ] **Step 2:** Run `npm test -- locomotion`. Expected: FAIL.
- [ ] **Step 3:** Implement `createHero` and `updateHero` with a transition table keyed by state.
- [ ] **Step 4:** Run `npm test -- locomotion`. Expected: PASS.
- [ ] **Step 5:** Commit.

---

### Task 10: Hero actions

**Files:**
- Modify: `src/game/hero/hero.ts`
- Create: `src/game/hero/actions.test.ts`

**Interfaces:**
- Consumes: Task 9 `Hero`, `updateHero`.
- Transitions added:
  - `down` held in `idle`: `kneel` when overlapping an untaken `item` prop (emits `pickup` at 0.8 s and marks it `taken`), otherwise `duck`; releasing `down` leaves `duck`.
  - `useItem` pressed overlapping a `panel` prop: `use` (emits `use`, toggles `panel.on`).
  - `hide` held in `idle`: `hide`, sets `hidden` after the clip's front switch; releasing `hide` turns back (reverse of the clip) to `idle`. Hold to hide is Claude's call (original may toggle; revisit in the sandbox).
  - `shoot` pressed (`consume`, so presses within `inputBufferMs` before an action can start still count): with fists `attack` (punch, committed until `cancelAt`, emits `punch` at the jab peak); with gun `attack` while held (emits `shot` at `fireRate`, legs and body still); in `duck` the same as `duckAttack`.
  - `weapon1` / `weapon2` pressed in `idle`: `weaponSwitch`, sets `weapon` at the clip's gun switch time; `weapon3` is ignored in phase 1.
  - `damage(h: Hero, cfg: MovementConfig): HeroEvent[]` exported: lowers `energy` by `energy.hit`, enters `hit` (committed) or `death` at 0; ignored while `hidden`.
- Produces: `damage(h, cfg)`.

- [ ] **Step 1: Failing tests:** `down` at the item kneels and emits one `pickup`, a second `down` there ducks; `useItem` at the panel emits `use` and flips `on`; holding `hide` sets `hidden` after the switch and releasing clears it; `damage` while hidden keeps energy at 100; four `damage` calls end in `death` and emit `died`; `shoot` with gun held 1 s emits 12 `shot` events and the hero `x` does not change; a `shoot` press 100 ms before `land` ends starts `attack` right after landing (input buffer); punching ignores `dir` until `cancelAt`; `weapon1` from fists ends with `weapon` gun after the clip.
- [ ] **Step 2:** Run `npm test -- actions`. Expected: FAIL.
- [ ] **Step 3:** Implement the transitions in `hero.ts`.
- [ ] **Step 4:** Run `npm test -- actions locomotion`. Expected: PASS.
- [ ] **Step 5:** Commit.

---

### Task 11: Hero look

**Files:**
- Create: `src/game/hero/look.ts`, `src/game/hero/look.test.ts`

**Interfaces:**
- Consumes: Task 3 `locate`, `solve`, `Pose`; Task 4 builders; Task 5 `holdPoses`, `CARRY`; Task 6 clips; Task 9 `Hero`.
- Produces: `interface HeroLook { view: View; flip: boolean; pose: Pose; gun: "hand" | "slung" | "dropped" | "none"; rot: number; tint: number; lift: number }`; `createRigs(lod: boolean): { side: GroupNode; front: GroupNode; back: GroupNode; climber: GroupNode }` (side `farLimbs` + `propBehindArm`, front `rightArmFirst` + `propBehindArm`, climber `thumbsBehind` + `forearmsUnder`); `heroLook(h: Hero, clips: ClipSet, rigs, hold: ReturnType<typeof holdPoses>): HeroLook`. Rules ported from `spikes/movement/moves.js`: gun mode applies `carry()` to side poses and `FRONT_CARRY` to front poses unless the clip has a `gun` track; ladder pose from `climbPose` with the IK reach table (`CLIMB_REACH`, 11 steps) and gun `slung`; `lift` = grounding offset from the heel and toe hooks (`lift()` in the spike) for grounded states, 0 in the air; death `lift` uses the measured lying bottom (`bottom()` in the spike, cached per pose and weapon).

- [ ] **Step 1: Failing tests:** idle look is `STAND` with `lift` 0 (within 0.01); gun-mode walk keeps the forearm world angle (`body + arm + fore - 18`) at -90 within 0.5 at 8 sample times; ladder look uses view `back` and `gun` `slung` with gun; `heroLook` for `death` at its clip end has `rot` -89; turning hero at clip time 0.05 has view `front`.
- [ ] **Step 2:** Run `npm test -- look`. Expected: FAIL.
- [ ] **Step 3:** Implement `look.ts`.
- [ ] **Step 4:** Run `npm test -- look`. Expected: PASS.
- [ ] **Step 5:** Commit.

---

### Task 12: Renderer and playable sandbox

**Files:**
- Create: `src/engine/render/view.ts`, `src/engine/render/view.test.ts`, `src/game/render/scene.ts`
- Modify: `src/sandbox/main.tsx`

**Interfaces:**
- Consumes: Tasks 3 to 11.
- Produces (`view.ts`): `interface ViewTransform { scale: number; offsetX: number; offsetY: number }`; `fitView(canvasW: number, canvasH: number, worldW: number, worldH: number): ViewTransform` (letterboxed, whole world visible, centered); `resizeCanvas(canvas: HTMLCanvasElement, dpr: number): void`.
- Produces (`scene.ts`): `drawScene(ctx, world: SandboxWorld, hero: Hero, look: HeroLook, rigs, cfg: MovementConfig, view: ViewTransform, alpha: number): void` (tiles as flat slabs in the spike backdrop colours, ladder, lift, props, hero with `drawRig` and `simple: true`, tint as `brightness/saturate` filter like the spike hide cell, gun hooks via Task 5). Hero render scale = `heroHeightCells * cellPx / (FOOT_Y - levels.head)` model units.
- `main.tsx`: boots `FixedLoop`, `Input` attached to `window`, sandbox world, hero (weapon gun), render at device pixel ratio, re-fit on `resize` and when `devicePixelRatio` changes (`matchMedia` listener).

- [ ] **Step 1: Failing test** `view.test.ts`: `fitView(1920, 1080, 960, 384)` gives scale 2 and offsetY 156; `fitView(800, 800, 960, 384)` gives scale 800/960 and offsetX 0.
- [ ] **Step 2:** Run `npm test -- view`. Expected: FAIL.
- [ ] **Step 3:** Implement `view.ts`, `scene.ts`, `main.tsx`.
- [ ] **Step 4:** Run `npm test -- view`. Expected: PASS.
- [ ] **Step 5:** Run `npm run dev`; in the browser walk, run, both jumps, climb the ladder, ride the lift, fall off both ledges, jump both gaps, hide by the crate, kneel at the item, use the panel, punch the bag, switch to the gun and shoot; resize the window and toggle browser zoom. Expected: every move plays with the agreed look, no console errors, whole screen visible after resize.
- [ ] **Step 6:** Commit.

---

### Task 13: Debug shell

**Files:**
- Create: `src/sandbox/store.ts`, `src/sandbox/store.test.ts`, `src/sandbox/ui/Panel.tsx`, `src/sandbox/ui/TimeControls.tsx`, `src/sandbox/ui/Overlays.tsx`, `src/sandbox/ui/Tuning.tsx`, `src/sandbox/ui/Recorder.tsx`, `src/game/render/overlays.ts`
- Modify: `src/sandbox/main.tsx`

**Interfaces:**
- Consumes: Task 7 `FixedLoop`, `Input` record and play; Task 9 and 10 hero; Task 12 scene.
- Produces (`store.ts`): `useSandbox` Zustand store with `{ state: HeroState; time: number; vx: number; vy: number; energy: number; weapon: Weapon; fps: number; inputLog: string[]; overlays: { hitbox: boolean; tiles: boolean; joints: boolean; info: boolean }; paused: boolean; timeScale: number; movement: MovementConfig; clips: ClipSet; recording: boolean; record: InputRecord | null }` and actions `toggleOverlay(name)`, `setPaused(v)`, `setTimeScale(v)`, `setMovementValue(path: string, value: number)` (rejects non-finite values and negatives for speeds, gravity and durations, keeps the old value), `setClipValue(clip: string, field: "duration" | "travel", value: number)`, `resetTuning()`, `exportTuning(): { movement: string; clips: string }` (pretty JSON matching the files in `config/hero/`).
- Produces (`overlays.ts`): `drawOverlays(ctx, world, hero, look, rigs, view, flags)` (hero box, solid and ladder tiles, rig joint pivots via `locate`-style traversal, text block with state, clip time, velocity).
- UI: right-side panel over the canvas; buttons Pause, Step (one fixed step), speed 0.25 / 0.5 / 1; overlay checkboxes; tuning fields for every number in `movement.json` plus `duration` and `travel` per clip, Reset, Copy JSON; Record, Stop, Replay (respawns the hero and plays the record); Fists / Gun switch; Hit and Kill buttons calling `damage`. Engine pushes to the store once per rendered frame; React never runs inside the fixed step.

- [ ] **Step 1: Failing tests** `store.test.ts`: `setMovementValue("gravity", 20)` sets 20; `setMovementValue("gravity", -1)` and `NaN` keep 30; `exportTuning().movement` parses back with `loadMovement` and equals the edited config; `resetTuning` restores the file values; a replay test runs the hero for 120 frames from spawn with a recorded input and then again from spawn with `play(record)` and gets the same final `x`, `y` and `state`.
- [ ] **Step 2:** Run `npm test -- store`. Expected: FAIL.
- [ ] **Step 3:** Implement the store, overlays and panels; wire them in `main.tsx`.
- [ ] **Step 4:** Run `npm test && npm run lint && npm run typecheck && npm run test:visual`. Expected: all pass.
- [ ] **Step 5:** Run `npm run dev`; check Pause, Step, slow motion, each overlay, editing gravity changes the jump at once, Copy JSON output pasted into `config/hero/movement.json` keeps `npm test` green, Record then Replay repeats the same run, Hit four times kills the hero. Expected: all behave as listed, no console errors.
- [ ] **Step 6:** Update `docs/superpowers/specs/2026-10-17-colony2080-design.md` 1b section status to "built, awaiting feel sign-off" and the `CLAUDE.md` architecture notes with the `src/engine` / `src/game` / `src/sandbox` split. Commit.
