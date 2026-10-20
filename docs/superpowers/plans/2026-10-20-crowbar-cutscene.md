# Crowbar Cutscene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Using the crowbar on a train door plays the polished crowbar cutscene as a whole-screen security camera film while the game is frozen, in the sandbox and in mission 1.

**Architecture:** The spike (`spikes/shared/cutscenes.js`) gets the polish and a security camera overlay first and is reviewed by the user. Then the scene, the overlay and a track sampler are ported to `src/game/cutscene/` and checked frame by frame against the spike in `npm run test:visual`. A task with a `cutscene` id makes the hero use start `world.cutscene` instead of the use clip; `startRun` stops stepping the world while it plays, draws the film over the whole game area, hides the React layers and applies the task when the film ends or is skipped.

**Tech Stack:** TypeScript, Vite, Canvas 2D, Vitest, Playwright (`test:visual`), classic-script spikes.

**Spec:** `docs/superpowers/specs/2026-10-20-crowbar-cutscene-design.md`

## Global Constraints

- Spikes are the design source: change the spike first, then port; port must match the spike in `test:visual`.
- Track data stays in `config/cutscenes/crowbar-door.json`; run `node spikes/shared/build-config.mjs` after editing it.
- Cutscene time advances only in fixed loop steps (`FIXED_STEP`), so a recorded sandbox run replays the same.
- `src/engine/` stays game-agnostic: no `game/`, React or Zustand imports there.
- Published build never names the original game; spike `ref` frames stay behind `spikes/shared/originals.js`.
- No code comments. Docs, commits in caveman lite. Never add an agent co-author line. Use dash, not em dash.
- After each task: `npm test`, `npm run lint`, `npm run typecheck` pass.

## Review Focus

- Use pressed with the crowbar shown but a missing flag (mission 1 needs `flag:metroPowered`): no cutscene, the normal hint plays (Task 5 test).
- Enter held from the use press into the film: the film does not skip at once (Task 6 test).
- Hero standing in an enemy burst when the film starts: no damage, no bullet moves during the film (Task 6 Step 5 browser check: energy and bullet positions equal before and after).
- Second use of the opened door: no cutscene again, "Nothing more to do here." (Task 5 test).
- Inventory or map key during the film: nothing opens (Task 6 Step 5 browser check).

---

## Phase A: spike (stop for user review after Task 2)

### Task 1: Crowbar polish in the spike

**Files:**
- Modify: `spikes/shared/cutscenes.js`
- Modify: `config/cutscenes/crowbar-door.json`
- Regenerate: `spikes/shared/config.js`

Polish per spec (user decisions):
- Shot B arm raise comes down so the hands meet the shot C hip-level grip height at the 2.95 s cut (tracks `armB`, `foreB`).
- Shot B grip widens to the shot C two-handed spacing (about 367 model units; `farGripOffset` 78 now), same hand order in both shots.
- Larger shot C pry pull (`pullForeDeg`, maybe `pullArmDeg`) so the door gap visibly follows the pull.
- Crowbar stays inside the shot B frame for the whole shot (pokes out at the top around 2.7 s now).

- [ ] **Step 1:** Open `spikes/movement/interaction.html`, click the "Use crowbar" cell, scrub to 0.9-1.2 s (cut) and 0.85 s; screenshot shot B end and shot C start side by side to record the current mismatch.
- [ ] **Step 2:** Change the tracks and robot values in `crowbar-door.json` (and `drawProfile` in `cutscenes.js` only if the grip cannot follow from config). Run `node spikes/shared/build-config.mjs`.
- [ ] **Step 3:** Verify in the player: hand height and grip spacing match across the cut within a few model units (log `locate(...)` hand points at both sides of the cut in the console), the crowbar tip stays inside the frame for every 0.05 s of shot B, and the door gap moves with each pull.
- [ ] **Step 4:** Commit `spikes/shared/cutscenes.js config/cutscenes/crowbar-door.json spikes/shared/config.js` - "Polish the crowbar cutscene across the cut".

### Task 2: Security camera overlay in the spike

**Files:**
- Modify: `spikes/shared/cutscenes.js`
- Modify: `spikes/movement/player.js`, `spikes/movement/moves.js` (cutscene part of the crowbar cell)

**Produces:** `window.CUTSCENES.securityCam(ctx, w, h, t, label)` drawing over an already rendered frame of size `w` x `h`; `CUTSCENES.crowbarDoor.camera` = the label string.

Look (spec, values tuned here):
- Letterbox: `crowbarDoor.render` already fits 1600 x 900 with black bars; the overlay covers only the film rect (export `filmRect(w, h)` from the spike for that).
- Washed-out green-grey tint (multiply plus desaturate, e.g. `saturation` composite or a translucent fill), scanlines every few device px, animated noise seeded by `Math.floor(t * 24)` (deterministic per frame, no `Math.random`), soft vignette.
- Blinking red `REC` dot (1 Hz) and timestamp `2080-03-14 23:41:07` advancing with `t`, top left; camera label `CAM 03 METRO` top right; `Share Tech Mono` font.

- [ ] **Step 1:** Implement `securityCam` and `filmRect`; call the overlay after `scene.render` in `player.js` and in the cutscene part of the crowbar cell.
- [ ] **Step 2:** Verify in the browser (player and cell): overlay inside the film rect only, noise changes per frame and is equal for equal `t` (render twice, compare `getImageData`), no console errors; check the "Pause animations" checkbox still freezes the cell.
- [ ] **Step 3:** Commit - "Add the security camera look to the crowbar cutscene".
- [ ] **Step 4: STOP.** Ask the user to review the polish and the look in `spikes/movement/interaction.html`. Iterate Tasks 1-2 on feedback. Continue only after approval.

## Phase B: port

### Task 3: Track sampler and crowbar scene port

**Files:**
- Create: `src/engine/anim/tracks.ts`, `src/engine/anim/tracks.test.ts`
- Create: `src/game/cutscene/crowbarDoor.ts`, `src/game/cutscene/crowbarDoor.test.ts`
- Modify: `tools/visual/compare.html` (load `/spikes/shared/originals.js`, `/spikes/shared/cutscenes.js`), `tools/visual/compare.ts`

**Interfaces:**
- Produces: `type Key = [number, number | string, Easing?]`, `type Easing = "linear" | "in" | "out" | "inOut"`, `sampleTrack(keys: Key[], t: number): number | string` in `tracks.ts` (same rules as spike `sample`: string tracks switch, equal-time keys jump, clamp at ends).
- Produces: `interface Cutscene { id: CutsceneId; duration: number; camera: string; render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void }`, `crowbarDoor: Cutscene` built from `@config/cutscenes/crowbar-door.json` with `buildSide` / `buildBack`, `drawRig`, `locate`, `solve` from the existing ports. `t` is clip time (0..duration).

- [ ] **Step 1: Failing tests** in `tracks.test.ts`: string track `[[1.85,"B"],[2.95,"C"]]` gives `"B"` at 2.0 and `"C"` at 2.95; numeric `[[0,0],[1,10,"in"]]` gives 2.5 at 0.5; equal-time keys `[[1,0],[1,5],[2,5]]` give 5 at 1; before first key gives first value; after last gives last. In `crowbarDoor.test.ts`: `duration` equals `clip.end - clip.start` from config.
- [ ] **Step 2:** Run `npx vitest run src/engine/anim/tracks.test.ts src/game/cutscene` - FAIL (missing modules).
- [ ] **Step 3:** Implement `sampleTrack` and `crowbarDoor` (a 1:1 port of the spike scene: world, door halves, shadow, profile and back shots, camera and shake).
- [ ] **Step 4:** Add `cutsceneCases` to `compare.ts`: render spike `CUTSCENES.crowbarDoor.render` and port at 480 x 270 for `t` in `[0, 0.5, 1.0, 1.1, 1.8, 2.6, 3.2, duration]`; diff must be 0 like the env cases.
- [ ] **Step 5:** Run unit tests, then `npm run test:visual` - all cases pass.
- [ ] **Step 6:** Commit - "Port the crowbar cutscene".

### Task 4: Security camera overlay port

**Files:**
- Create: `src/game/cutscene/securityCam.ts`, `src/game/cutscene/securityCam.test.ts`
- Modify: `tools/visual/compare.ts`

**Interfaces:**
- Produces: `filmRect(w: number, h: number): Rect`, `drawSecurityCam(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, label: string): void`, `camClock(t: number): string` (timestamp text).

- [ ] **Step 1: Failing tests:** `filmRect(1920, 1080)` is the full rect; `filmRect(1000, 1000)` is `{ x: 0, y: 218.75, w: 1000, h: 562.5 }`; `camClock(0)` is `"2080-03-14 23:41:07"` (or the start value the spike settled on) and `camClock(61.5)` is one minute and one second later.
- [ ] **Step 2:** Run - FAIL.
- [ ] **Step 3:** Implement as a port of the spike overlay.
- [ ] **Step 4:** Add overlay cases to `compare.ts` (scene plus overlay, same `t` list, 480 x 270 and 300 x 300 for the bars); `npm run test:visual` passes with diff 0.
- [ ] **Step 5:** Commit - "Port the security camera overlay".

### Task 5: Cutscene trigger on use

**Files:**
- Modify: `src/game/level/tasks.ts` (+ `tasks.test.ts`)
- Modify: `src/game/level/sandboxLevel.ts` (`SandboxWorld.cutscene`)
- Modify: `src/game/hero/hero.ts` (`use`)
- Create: `src/game/cutscene/index.ts`
- Test: `src/game/hero/hero.test.ts` or a new `src/game/cutscene/trigger.test.ts`

**Interfaces:**
- Produces: `Task.cutscene?: CutsceneId` (loader accepts only ids in `CUTSCENES`, throws `task <id>: unknown cutscene: <x>` otherwise).
- Produces: `openTask(world: SandboxWorld, prop: Prop): Task | undefined` (the task `runUse` would run; `runUse` uses it).
- Produces: `SandboxWorld.cutscene: { id: CutsceneId; prop: Prop; t: number } | null` (null on load and after `resetWorld`).
- Produces: `CUTSCENES: Record<CutsceneId, Cutscene>`, `type CutsceneId = "crowbarDoor"` in `cutscene/index.ts`.

- [ ] **Step 1: Failing tests:**
  - Loader keeps `cutscene: "crowbarDoor"` and throws on `cutscene: "nope"`.
  - Hero touching a door whose open task has `cutscene` and all `requires` met: one step after a use press sets `world.cutscene` (`t` 0, that prop), hero state stays out of `use`, task not applied yet (prop state unchanged, no `task:` flag).
  - Same door with a `requires` flag missing: no cutscene, hero enters `use`, subtitle "Something is missing here." after the use event.
  - Door whose task is done: no cutscene, subtitle "Nothing more to do here.".
- [ ] **Step 2:** Run - FAIL.
- [ ] **Step 3:** Implement: `use` in `hero.ts` checks `openTask(...)?.cutscene` before `enter(s.h, "use")` and sets `s.world.cutscene` instead; `resetWorld` clears it.
- [ ] **Step 4:** Run tests - PASS. Commit - "Start a cutscene from a use task".

### Task 6: Playback in the runner

**Files:**
- Modify: `src/game/run.ts`
- Create: `src/game/cutscene/play.ts`, `src/game/cutscene/play.test.ts`
- Modify: `src/sandbox/store.ts` (`cutscene: boolean`), `src/sandbox/ui/Hud.tsx`, `src/sandbox/ui/InventoryScreen.tsx`, `src/play/Subtitle.tsx`, `src/play/LevelEnd.tsx` (render nothing while `cutscene`)

**Interfaces:**
- Consumes: `world.cutscene`, `CUTSCENES`, `runUse`, `drawSecurityCam`.
- Produces: `stepCutscene(world: SandboxWorld, dt: number, skip: boolean): boolean` in `play.ts` - advances `t`, on `t >= duration` or `skip` calls `runUse(world, prop)`, sets `world.cutscene = null`, returns true while still playing.

- [ ] **Step 1: Failing tests** in `play.test.ts`: stepping `duration / FIXED_STEP` steps ends it and applies the task (prop state, flags, subtitle); `skip` on the first step ends it at once and applies the task; while playing, no task flag is set.
- [ ] **Step 2:** Run - FAIL.
- [ ] **Step 3:** Implement `stepCutscene`. In `run.ts` `update`: when `world.cutscene` is set, run only `stepCutscene(world, dt, input.consume("menu") || input.consume("useItem"))` and return before the inventory, map and `stepWorld` code; call `input.clearPresses()` on the step the cutscene starts so a held or buffered Enter does not skip. In `render`: while playing, draw the scene and overlay into `{0, 0, freeWidth, canvas.height}` instead of the game, and push `cutscene: true` to the store (false otherwise).
- [ ] **Step 4:** Add a run-level test if `run.ts` has one; otherwise verify in the browser (Step 5).
- [ ] **Step 5:** Browser check on `sandbox.html` after Task 7 data exists (dev server `npx vite --port 5199 --strictPort`): HUD hidden during the film, enemy and flyer frozen (screenshot before and after, same positions), Esc skips, film ends with the door open and its subtitle, recorded run with the cutscene replays identically.
- [ ] **Step 6:** Commit - "Play cutscenes over a frozen game".

### Task 7: Doors and docs

**Files:**
- Modify: `config/levels/sandbox.json` (`object` prop `trainDoor`, asset `trainDoor`, `x` 15.5, floor 14, `width` 2, `state` 0; `tasks` with `{ "id": "openTrainDoor", "object": "trainDoor", "requires": ["item:crowbar"], "gives": [], "state": 2, "cutscene": "crowbarDoor", "subtitle": "The train door gives way." }`)
- Modify: `config/levels/mesto/tasks.json` (`openTrainDoor` gets `"cutscene": "crowbarDoor"`)
- Modify: `src/sandbox/main.tsx` (mount `Subtitle` so the sandbox shows task subtitles)
- Modify: `CLAUDE.md`, `docs/requirements.md` (Open: crowbar polish done; Mission 1 accepted flaws: cutscenes started), `docs/superpowers/specs/2026-10-17-colony2080-design.md` phase 2 note if needed
- Test: `src/game/level/reach.test.ts`, `src/game/level/route.test.ts`, sandbox level tests

- [ ] **Step 1:** Add the configs; run `npm test` - reach and route tests still pass; the door does not block (no `solidStates`).
- [ ] **Step 2:** Browser check (both pages): pick the crowbar, use the door, film plays, door art in state 2 afterwards, second use says "Nothing more to do here.". In mission 1 teleport to the train door with the power flag set (`window.__teleport`).
- [ ] **Step 3:** Update docs (CLAUDE.md: `src/game/cutscene/` and the `cutscene` task field, `securityCam` in the spike entry).
- [ ] **Step 4:** Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:visual` - all pass.
- [ ] **Step 5:** Commit - "Play the crowbar cutscene at the train doors".
