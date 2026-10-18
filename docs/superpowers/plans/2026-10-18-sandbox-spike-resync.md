# Sandbox spike re-sync implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the phase 1b sandbox in line with the spikes and spec as they stand after the arcade-style and gait-engine changes on `master` (rebased onto `phase-1b`).

**Architecture:** Same split as phase 1b: `src/engine/` (game-agnostic), `src/game/` (robot, gun, hero, level, render), `src/sandbox/` (React debug shell). Robot and gun follow `spikes/shared/xbot.js` and `spikes/shared/gun.js`; hero timing follows the spec's arcade rules; walk and run poses come from a TypeScript port of the spike gait engine instead of keyframes.

**Tech Stack:** TypeScript (strict), Vite, Vitest, Playwright (visual check), Canvas 2D, React, Zustand.

**Spec:** `docs/superpowers/specs/2026-10-17-colony2080-design.md` (section "Move details", "Gun"). Look reference: `spikes/movement/moves.js`, `spikes/shared/xbot.js`, `spikes/shared/gun.js` as committed on this branch. Previous plan: `docs/superpowers/plans/2026-10-17-engine-core-movement-sandbox.md` (its Global Constraints still bind).

## Global Constraints

- Every constraint of the phase 1b plan still holds (engine boundary, Canvas 2D, 60 Hz fixed step, cells as units, tuning in `config/` with `status` and `source`, no code comments, spikes frozen).
- Response is arcade style: input acts on the press frame, no wind-up (spec "Response").
- Robot and gun at rest must pass `npm run test:visual` against the current spikes (three-part gate: tree compare 0 mismatches, spike-matrix render diff 0, own-matrix diff at most `MAX_OWN_DIFF` with `matrixDelta` at most `MAX_MATRIX_DELTA`).
- Walk and run poses must equal the spike gait engine (`gaitPose`, `gaitBob`, `gaitLean` in `spikes/movement/moves.js`) within 1e-6 degrees and 1e-6 px at the same phase.

## Review Focus

1. Opposite arrow pressed many times mid-air - each press flips and reverses speed once, arc height and air time unchanged (Task 2 test).
2. Hit while the hero is in a committed action (punch, shot, jump, ladder, kneel) - action continues unchanged, only energy and hit effect change (Task 2 test).
3. Press Up on the frame the hero lands - jump fires at once with no lost frame (Task 2 test).
4. Gun carried through walk and run - gun stays level (forearm world angle constant within 0.5 degrees over a cycle) (Task 3 test).
5. Turn pressed during walk or run - instant flip, gait phase keeps going, no front-view frame (Task 3 test).

---

## File structure

```
src/engine/rig/tree.ts        LodLimits gains minRadius (Task 1)
src/engine/rig/draw.ts        draw-cost changes from spike 0828cca; per-group tint (Task 1, Task 3)
src/game/robot/xbot.ts        robot shapes and joints re-ported (Task 1)
src/game/robot/gun.ts         barrel length option, barrelFor, FRONT_BARREL (Task 1)
tools/visual/compare.ts       cases updated for barrel and new options (Task 1)
src/game/hero/config.ts       states and clip fields for arcade timing (Task 2)
config/hero/clips.json        clip timing and poses (Task 2 timing, Task 3 poses)
config/hero/movement.json     walk jump values (Task 2)
src/game/hero/hero.ts         arcade state machine (Task 2)
src/game/hero/gait.ts         gait engine port (Task 3, new)
src/game/hero/look.ts         gait, leap, hit effect, new views (Task 3)
src/game/render/scene.ts      hit star and part flash (Task 3)
```

---

### Task 1: Robot and gun re-port

**Files:**
- Modify: `src/engine/rig/tree.ts`, `src/engine/rig/draw.ts`, `src/game/robot/xbot.ts`, `src/game/robot/gun.ts`, `tools/visual/compare.ts`, matching tests
- Read: `git diff 86bae00 HEAD -- spikes/shared config/robots` for exactly what changed in the spikes

**Interfaces:**
- Produces (`tree.ts`): `interface LodLimits { minThickness: number; minArea: number; minRadius: number }`, `tiny()` drop rules as in the spike (`minRadius` from `config/robots/xbot.json` `gameLod`).
- Produces (`gun.ts`): `drawGun(ctx, opts?: { palette?; lineW?; simple?; barrel?: number })` (default 196); `gunHook(ctx, palette?, opts?: { lineW?; simple?; barrel?: number })`; `barrelFor(robot: GroupNode, pose: Pose, hook: string): number` and `FRONT_BARREL: number` (front view, spike result 270) as `barrelFor` / `FRONT_BARREL` in `spikes/shared/gun.js`.
- Produces (`xbot.ts`): same builders and options as before plus any joint or option the spike added (for example `head`, `chest` groups used by the hit flash); names copied from the spike.

- [ ] **Step 1:** Run `npm run test:visual`. Expected: FAIL on robot and gun cases (spikes moved on).
- [ ] **Step 2: Failing tests:** `tree` test - `createBuilder({ minThickness: 8, minArea: 400, minRadius: 8 })` drops an ellipse of radius 7 and keeps radius 9 (or the spike's exact rule); `gun.test.ts` - `FRONT_BARREL` equals the spike value 270 within 1, `drawGun` default barrel 196.
- [ ] **Step 3:** Port the spike changes into `tree.ts`, `draw.ts`, `xbot.ts`, `gun.ts` (draw-cost changes must keep the canvas call sequence identical to the spike).
- [ ] **Step 4:** Update `tools/visual/compare.ts`: front held gun cases pass `barrel: FRONT_BARREL` to both spike and port, plus any new builder option as a case.
- [ ] **Step 5:** Run `npm test && npm run lint && npm run typecheck && npm run test:visual`. Expected: all pass, every visual case `ok`.
- [ ] **Step 6:** Commit.

---

### Task 2: Arcade hero state machine

**Files:**
- Modify: `src/game/hero/config.ts`, `src/game/hero/hero.ts`, `config/hero/clips.json` (timing fields only), `config/hero/movement.json`, `src/game/hero/locomotion.test.ts`, `src/game/hero/actions.test.ts`, `src/game/hero/config.test.ts`, `src/sandbox/store.ts` if config shape changes

**Interfaces:**
- Consumes: phase 1b `stepWorld`, `moveBox`, `Input` contracts (unchanged).
- Produces (`config.ts`): `HeroState` drops `turn`, `land` and `hit`, adds `walkJump` and `duckJump`. `MovementConfig.jump` gains `walkHeight: number` and `walkSpeed: number`.
- Produces (`hero.ts`): `Hero` gains `hitAt: number | null` (hero time of the last hit, for the effect) and keeps every other field. `damage(h, cfg)` lowers energy and sets `hitAt`; it never changes state except to `death` at 0 energy. `kill(h)` unchanged.
- Transitions (spec "Move details"):
  - Turn: opposite `dir` flips `facing` on the press frame, state unchanged (idle stays idle, walk stays walk with its phase).
  - Jumps launch on the press frame: idle `up` -> `standJump`, walk `up` -> `walkJump` (speed `jump.walkSpeed`, height `jump.walkHeight`), run `up` -> `runJump`, duck `up` -> `duckJump` (standJump height and speed, starts from the duck pose). No `launch` events; remove them from `clips.json`.
  - Landing goes straight to `idle`, or to `walk` / `run` when `dir` is held; no `land` state.
  - Air control: opposite `dir` press while airborne flips `facing` and negates `vx`; vertical motion untouched.
  - Hide: `hidden` true on the press frame, false on release; hide clip has no ramp.
  - Walk off an edge keeps walk speed during the fall (spec "Fall and land"); drop of more than `fallDeathCells` still kills.
  - Hits never interrupt: punch, shot, jump, ladder, kneel and use continue unchanged after `damage`.
- `movement.json`: `jump.walkHeight` 0.47 and `jump.walkSpeed` 1.43 (spec: 36 px high, 58 px gap at walk pace; 1 robot height = 1.9 cells = about 147 spike px); first guesses, tuned in the sandbox. Air time follows from `gravity`; note in `source` that the spec's 0.55 s air time needs a lower gravity or a higher hop and is a tuning call.

- [ ] **Step 1: Failing tests** (update the existing suites): Up in idle leaves the floor on the same frame (`vy < 0` after one tick); Up held as the hero lands jumps again on the landing frame; Left while walking right flips `facing` in one tick and keeps `walk`; opposite arrow mid-air negates `vx` and the peak height equals the no-flip peak within 0.01; three flips mid-air leave `vx` negated an odd number of times; duck then Up gives `duckJump` with standJump peak 1.0 within 0.05; walk then Up gives `walkJump` with peak `walkHeight` within 0.05; landing with `dir` held returns to `walk`; `damage` during punch, gun fire, jump, ladder and kneel keeps the state and its clip time; hide sets `hidden` on the press frame; walking off the left platform keeps `vx` equal to walk speed while falling; the old 7-cell walk-off and run-jump-down tests still land; Review Focus 1-3 pinned here.
- [ ] **Step 2:** Run `npm test -- locomotion actions config`. Expected: FAIL.
- [ ] **Step 3:** Implement the transitions and config changes; fix every test that encoded the old wind-up timing.
- [ ] **Step 4:** Run `npm test && npm run lint && npm run typecheck`. Expected: PASS.
- [ ] **Step 5:** Commit.

---

### Task 3: Gait engine, poses and hit effect

**Files:**
- Create: `src/game/hero/gait.ts`, `src/game/hero/gait.test.ts`, `src/game/hero/gait.fixture.json`
- Modify: `src/game/hero/look.ts`, `src/game/hero/look.test.ts`, `config/hero/clips.json` (poses), `src/engine/rig/draw.ts`, `src/game/render/scene.ts`, `docs/superpowers/specs/2026-10-17-colony2080-design.md` (1b status line), `CLAUDE.md` if commands or files changed

**Interfaces:**
- Consumes: Task 1 rigs and `FRONT_BARREL`, Task 2 `HeroState`, `Hero.hitAt`.
- Produces (`gait.ts`): `interface Gait` (fields of `WALK` / `RUN` in the spike), `LEG`, `WALK`, `RUN`; `gaitPose(g: Gait, phase: number): Pose`; `gaitBob(g: Gait, phase: number): number`; `gaitLean(g: Gait, u: number): number`. Phase in radians as in the spike.
- Produces (`look.ts`): walk and run poses from `gaitPose` at phase `TAU * time / duration`; body height from `gaitBob` (spike px converted to model units); gun carry compensated for lean so the gun stays level; `LEAP` pose for standJump, duckJump and walkJump, the long variant for runJump, blended from the gait pose after takeoff as the spike does; turn has no front view; hide snaps to front view with tint 1; `HeroLook` gains `hit: { star: Pt; flash: number; headSnap: number } | null` from `hitAt` (spike `hitLook` / `hitFx`: head joint snap about 10 degrees settling in 0.35 s, flash on `chest` and `head` only).
- Produces (`draw.ts`): `drawRig` opts gain `groupTint?: Record<string, { brightness?: number; saturate?: number }>` applied with `shade` to the named group subtree.
- `clips.json`: walk and run keep `duration` and `travel` (travel = speed x duration from the spec table converted to cells) and drop pose keys; jump clips use the leap poses; death in a running jump uses `JUMP_DEATH` timing (hit 0.62, land 0.98, slide 0.45).

- [ ] **Step 1:** Generate `gait.fixture.json` from the spike in a browser (scratchpad script, not committed): `gaitPose`, `gaitBob`, `gaitLean` for WALK and RUN at 24 even phases. `source` names the spike commit.
- [ ] **Step 2: Failing tests:** `gait.test.ts` - port equals the fixture within 1e-6 at every sample; `look.test.ts` - gun walk and run keep the forearm world angle within 0.5 degrees of its cycle mean (Review Focus 4); turning during walk has view `side` on every frame and the gait phase continues (Review Focus 5); hide has view `front` and tint 1 on the press frame; a hit sets `hit.flash` 1 at `hitAt` and `headSnap` back under 1 degree after 0.35 s; standJump look at 0.1 s uses `LEAP` legs.
- [ ] **Step 3:** Run `npm test -- gait look`. Expected: FAIL.
- [ ] **Step 4:** Implement `gait.ts`, the look changes, `groupTint`, and the star and part flash in `scene.ts` (star at the impact point moving with the robot, as `hitFx`).
- [ ] **Step 5:** Run `npm test && npm run lint && npm run typecheck && npm run build && npm run test:visual`. Expected: PASS.
- [ ] **Step 6:** Headless check (scratchpad script, Playwright as in phase 1b): walk, run, each jump kind, mid-air flip, hide, hit while shooting, death in a running jump; compare screenshots with `spikes/movement/*.html` at the same moments. Expected: poses match the spike, no console errors.
- [ ] **Step 7:** Update the spec 1b status line to note the re-sync, then commit.
