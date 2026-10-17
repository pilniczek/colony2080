# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Pre-code. Brainstorming phase for a browser clone of Colony 28 (1996/97 Czech DOS cinematic side-scroller). No build, lint or test setup exists yet.

- `docs/requirements.md` - decision log and open questions. Source of truth for what is decided. Design spec: `docs/superpowers/specs/2026-10-17-colony2080-design.md` (phases, movement set).
- `docs/research/README.md` - research summary (mechanics, level 1 task graph, data formats, open gaps). Read before answering questions about the original game.
- `config/` - draft JSON configs (`"status": "draft"`). Each cites its research or decision `source`.
- `spikes/` - throwaway prototypes.

## Planned stack and architecture

Decided in `docs/requirements.md`:

- TypeScript + Vite. React only for the UI shell. Zustand bridges engine state to UI.
- Custom engine in plain TypeScript on Canvas 2D. Engine must not depend on React. No Next.js, no three.js, no DOS emulator.
- Art is vector, drawn as code. Not pixel art, not original assets. View scales to device (no fixed 320x200 canvas).
- Cutscenes (item use, story) are in-engine animated vector scenes, not video files.
- Level logic is a task dependency web: each task has `requires` / `consumes` / `gives` over `item:*`, `flag:*`, `weapon:*` tokens (see `config/levels/mesto/tasks.json`).

Build order: movement overview page, engine core and movement sandbox, cutscene framework, Colony 28 clone systems, then mission 1 (`mesto`).

## Spikes

Throwaway prototypes. They read `config/` through generated `spikes/shared/config.js` (`window.C28_CONFIG`); after editing `config/robots/*.json` or `config/cutscenes/*.json` run `node spikes/shared/build-config.mjs`. No server needed: open in a browser via `file://` or with the VS Code "Live Preview" extension (`ms-vscode.live-server`). Plain HTML previews in VS Code webviews block the relative script and image loads.

- `spikes/shared/xbot.js` - hero robot model (front, side, back) as a Canvas 2D part tree with named rig joints (`hip*`, `knee*`, `arm*`, `fore*`, `body`) and hand/back hooks. Hand hooks render before the hand parts, so a held prop sits inside the grip. `locate(root, hook, pose)` returns a hook's matrix for aiming arms; `buildBack({ leftArmBehind })` draws the left arm behind the torso. Classic script exposing `window.XBOT`, not an ES module, so pages work from `file://`.
- `spikes/robot-design/index.html` - design sheet rendering `xbot.js`, with palette editor, level guides and original reference frames.
- `spikes/crowbar-scene/index.html` - vector cutscene (crowbar opens train door, agreed version) using `xbot.js`, with a two-handed grip. Tracks, clip window (`clip.start` trims the unused walk) and pry swing (`pullArmDeg` / `pullForeDeg`) come from `config/cutscenes/crowbar-door.json`; scrubber, speed, palette editor, side-by-side view of original `METROPAC.ANM` frames from `docs/research/gamedata/png/METROPAC/`.
- `spikes/movement/index.html` - movement overview: one non-interactive cell per move, each looping forever, keyframed on `xbot.js` (side rig has `ankle*` joints and `heel*` / `toe*` foot hooks used to plant feet).
- `spikes/crowbar-scene/previews/pry.gif` - GIF of the clip, regenerate with `docs/research/tools/robot/seq.mjs` (frames, needs `playwright-core`) and `gif.py`.

## Research tools

`docs/research/tools/*.py` - Python decoders for original game data (numpy, Pillow). Positional CLI args, no `--help`.

- `fli.py` - Autodesk FLI decoder (all `.GRA` / `.ANM` files are FLI).
- `dumpframes.py <file.anm|gra> <outdir>` - dump frames as PNG + `.npy` plus `pal.npy`.
- `rendermap.py <Mxy.MAP> <frames dir> <out.png> [width] [scale] [frame offset] [index base]` - render a 160x80 map from dumped tileset frames.
- `tiles.py`, `stream.py`, `rewidth.py`, `width.py`, `localwidth.py` - inspect raw frame data at guessed widths.
- `pstrings.py <exe> [minlen]` - dump Pascal strings (cp852) from executables.

Binary and media research folders are local only (copyrighted, large); the list lives in `.gitignore`. A fresh clone lacks them, so spike reference panels stay empty. Original game files live in `docs/research/gamedata/raw/C28/`. `docs/research/video/` holds gameplay footage and picked reference frames (`frames-best/`, named by timestamp and content).
