# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Phase 1b: engine core and movement sandbox built, awaiting feel sign-off, for a browser clone of Colony 28 (1996/97 Czech DOS cinematic side-scroller).

- `docs/requirements.md` - decision log and open questions. Source of truth for what is decided. Design spec: `docs/superpowers/specs/2026-10-17-colony2080-design.md` (phases, movement set). Phase 1b plan: `docs/superpowers/plans/2026-10-17-engine-core-movement-sandbox.md` (built).
- `WORK-REPORT.md` - local session handoff (gitignored): open follow-ups and abandoned approaches.
- `docs/research/README.md` - research summary (mechanics, level 1 task graph, data formats, open gaps). Read before answering questions about the original game.
- `config/` - draft JSON configs (`"status": "draft"`). Each cites its research or decision `source`.
- `spikes/` - throwaway prototypes.

## Commands

- `npm run dev` - Vite dev server, opens `/sandbox.html`.
- `npm run build` - production build of `sandbox.html` into `dist/`.
- `npm test` - Vitest (node environment) over `src/**/*.test.ts`.
- `npm run lint` - ESLint; `src/engine/**` may not import React, Zustand, `game/` or `sandbox/`.
- `npm run typecheck` - `tsc --noEmit`.
- `npm run test:visual` - Playwright runs `tools/visual/compare.html`: spike vs port robot trees and renders. The own-matrix render may differ by a few edge pixels because Chromium stores scale/translate DOMMatrix values as float32.

## Stack and architecture

Decided in `docs/requirements.md`:

- TypeScript + Vite. React only for the UI shell. Zustand bridges engine state to UI.
- Custom engine in plain TypeScript on Canvas 2D. Engine must not depend on React. No Next.js, no three.js, no DOS emulator.
- Art is vector, drawn as code. Not pixel art, not original assets. View scales to device (no fixed 320x200 canvas).
- Cutscenes (item use, story) are in-engine animated vector scenes, not video files.
- Level logic is a task dependency web: each task has `requires` / `consumes` / `gives` over `item:*`, `flag:*`, `weapon:*` tokens (see `config/levels/mesto/tasks.json`).

Code layout:

- `src/engine/` - game-agnostic core: fixed-step loop, input (bindings, buffer, record / replay), tiles and collision, projectiles, view fit, rig tree, pose and draw. No React, Zustand, `game/` or `sandbox/` imports.
- `src/game/` - Colony 28 specifics: hero state machine (`hero/`), clip and movement config loaders, robot and gun models, sandbox level, scene and debug overlay renderers. `hero/look.ts` turns hero state into a pose: walk and run (and the blend into walking and running jumps) come from `hero/gait.ts`, a port of the spike gait engine checked against `gait.fixture.json` (regenerate from `spikes/movement/moves.js` in a browser when the spike gait changes); clips with `gait` in `config/hero/clips.json` have no pose keys. The hit effect is pose data: joint pose `tint` flashes the `chest` and `head` subtrees, plus a head snap and a star drawn by `render/scene.ts`.
- `src/sandbox/` - `sandbox.html` entry: `main.tsx` runs the loop, `store.ts` (Zustand) holds UI state and live tuning, `ui/` holds the React debug panel (time controls, overlays, record / replay, hero buttons, tuning with JSON export for `config/hero/`). The engine pushes into the store once per rendered frame and reads tuning from it each step.

Build order: movement overview page, engine core and movement sandbox, cutscene framework, Colony 28 clone systems, then mission 1 (`mesto`).

## Spikes

Throwaway prototypes. They read `config/` through generated `spikes/shared/config.js` (`window.C28_CONFIG`); after editing `config/robots/*.json` or `config/cutscenes/*.json` run `node spikes/shared/build-config.mjs`. No server needed: open in a browser via `file://` or with the VS Code "Live Preview" extension (`ms-vscode.live-server`). Plain HTML previews in VS Code webviews block the relative script and image loads.

- `spikes/shared/xbot.js` - hero robot model (front, side, back) as a Canvas 2D part tree with named rig joints (`hip*`, `knee*`, `ankle*`, `arm*`, `fore*`, `body`, `head` and `chest` (side view); back legs `leg*`, `thigh*`, `shin*`) and hand, back (side and back view) and foot (`heel*`, `toe*`; back view `foot*`) hooks. `L` / `R` suffixes name the screen side, not the robot's side: front `armL` is the robot's right arm, back `armL` its left. A pose value is an angle or `{ rot, dx, dy, sx, sy, tint }` (`tint` shades that joint's subtree, e.g. `{ brightness, saturate }`). Hand hooks render before the hand parts, so a held prop sits inside the grip. `locate(root, hook, pose)` returns a hook's matrix; `solve(...)` fits two arm joints to a target. Builder options: `lod` (game LOD, use with `render(..., { simple: true })`), `farLimbs`, `badge` (side), `propBehindArm` (side, front), `rightArmFirst` (front), `leftArmBehind`, `rightForeBehind`, `thumbsBehind`, `forearmsUnder` (back), `enemy` (all views: no antennas, head crest, trefoil badge, horizontal leg stripes, shin slots or back panel lines; knees in leg armour). Classic script exposing `window.XBOT`, not an ES module, so pages work from `file://`.
- `spikes/shared/gun.js` - rotary gun model (`GUN.draw`, `GUN.hook` for hand and `back` hooks, `GUN.slung` draws it at the rest-pose back hook) and `GUN.holdPoses(side, front)` carry poses plus `FRONT_BARREL` (pass as `barrel` to `draw` / `hook`). Barrel keeps its true length unless the robot silhouette covers the muzzle in a view; then it stretches until the muzzle clears the silhouette by one barrel thickness. Needs `xbot.js` first.
- `spikes/robot-design/index.html` - design sheet rendering `xbot.js`, with palette editor, level guides, a game-size row of the simplified robot and original reference frames.
- `spikes/gun-design/index.html` - gun design sheet: side, held side and front, slung back, game size, original references.
- `spikes/enemy-design/index.html` - enemy design sheet: hero rig built with `enemy: true`, recoloured by `XBOT.shade` keeping the red visor (brightness, saturation sliders, per-colour overrides, JSON export), full and game size, face-off with the hero, original references. Sandbox uses the tint in `src/game/render/scene.ts` (`ENEMY_TINT`).
- `spikes/crowbar-scene/index.html` - vector cutscene (crowbar opens train door, agreed version) using `xbot.js`, with a two-handed grip. Tracks, clip window (`clip.start..clip.end` on the original `METROPAC.ANM` timeline), robot x (same in both shots), crowbar size (same in both views) and pry swing (`pullArmDeg` / `pullForeDeg`) come from `config/cutscenes/crowbar-door.json`; stance is the `moves.js` `STAND` pose; scrubber, speed, palette editor, side-by-side view of original `METROPAC.ANM` frames from `docs/research/gamedata/png/METROPAC/`.
- `spikes/movement/movement.html`, `interaction.html`, `fight.html` - movement overview by category, sharing `moves.js` and `style.css`: one non-interactive cell per move looping forever, game-LOD robot, Fists / Gun switch at the top.

## Research tools

`docs/research/tools/*.py` - Python decoders for original game data (numpy, Pillow). Positional CLI args, no `--help`.

- `fli.py` - Autodesk FLI decoder (all `.GRA` / `.ANM` files are FLI).
- `dumpframes.py <file.anm|gra> <outdir>` - dump frames as PNG + `.npy` plus `pal.npy`.
- `rendermap.py <Mxy.MAP> <frames dir> <out.png> [width] [scale] [frame offset] [index base]` - render a 160x80 map from dumped tileset frames.
- `tiles.py`, `stream.py`, `rewidth.py`, `width.py`, `localwidth.py` - inspect raw frame data at guessed widths.
- `pstrings.py <exe> [minlen]` - dump Pascal strings (cp852) from executables.

Binary and media research folders are local only (copyrighted, large); the list lives in `.gitignore`. A fresh clone lacks them, so spike reference panels stay empty. Original game files live in `docs/research/gamedata/raw/C28/`. `docs/research/video/` holds gameplay footage and picked reference frames (`frames-best/`, named by timestamp and content).
