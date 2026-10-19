# Sandbox environment reskin design

## Intent

The spike asset library (`spikes/shared/env*.js`, 52 level 1 objects on `spikes/env-design/`) is done for a first pass. The sandbox still draws flat boxes and gradients from `src/game/render/scene.ts`. Reskin the sandbox so every environment pixel comes from those assets. This proves the assets work at game scale next to the hero, in motion, before mission 1 uses them.

## Goals

- Same playground: `config/levels/sandbox.json` geometry, spawn, lift, enemy, fog, HUD, hero and enemy behaviour stay as they are.
- Every environment draw (backdrop, tiles, platforms, lift, ladders, props) comes from a ported spike env asset.
- Ported assets look identical to the spike at the same scale and state.

## Non-goals

- New layout or a mission 1 slice.
- Gameplay changes, except dropping the bag and target props.
- Refining asset looks. Asset design changes go to the spike first, then get re-ported.
- Porting assets the sandbox does not use.
- Parallax scrolling. Backdrop may stay fixed to the world (builder may add parallax only if cheap and it does not break fog or the clip).

## Anti-goals

- Hand-drawn sandbox look-alikes in `scene.ts` instead of real assets.
- Port drift: a ported asset that differs from its spike sheet view.
- Environment art that hides the hero, enemy, bullets or ladders the hero can climb, or reads as solid where it is not.

## Decisions

User:

- Keep the playground, only reskin.
- Ladder: no spike asset exists. Claude designs one.
- Drop the punching bag (`bag`) and the shooting target (`target`) props.

Claude's call:

- Port, do not load spike scripts. Port `spikes/shared/env.js` primitives and the used assets to TypeScript under `src/game/env/`, the same way robot and gun were ported (`src/game/robot/`). Spikes stay the design source.
- Ladder goes into the spike library first: a `ladder` asset in `spikes/shared/env-structures.js` and a `ladder` entry in `config/levels/mesto/objects.json` (non-interactive, `sheet: "structures"`, refs to the ladder-rail frames in `docs/research/reports/03-level-design.md` s2 / `04-graphics-audio.md` s3 if crops exist, else none). It shows on `spikes/env-design/`. Rails and rungs keep `RUNG` spacing from `render/scene.ts` so the climb pose still locks hands and feet on rungs. Its draw takes a height (in tiles) so one asset covers any ladder run.
- Units match: env `TILE` 24 original px = `cellPx` 24, so one env unit = one world px at cell scale. Assets draw at `cellPx / TILE` scale.
- Game LOD: draw assets with `lod: true` (the `simple` path), same as the robot in game.
- Sizes: spike assets have fixed boxes (`lift` 50 px wide with its platform moved by `t` over 72 px, `girderBridge` 144 px, `streetWalkway` 120 px, wall fills 72x168 and 168x122). Assets the sandbox needs at other sizes gain size parameters in the spike first (`lift`: width, shaft height, platform y instead of `t`; `girderBridge`, `streetWalkway`, wall fill: width, height). Default parameters keep the current spike output, so `spikes/env-design/` does not change. The port takes the same parameters. No stretching.
- Platforms: runs that touch a wall or sit on solid tiles read as solid ledges (`streetWalkway` top on wall fill): row 4 cols 0-10 (enemy patrol), the row 13 col 26 step, the floor. Free-standing runs become `girderBridge`: row 4 cols 20-23 and row 11 cols 12-15.
- Ladder through solid: the ladder draws over the wall fill, so the ladder cell in row 4 col 3 shows rails and rungs over the ledge.
- Hiding beside: crate and barrel always draw their normal state. The spike "player hiding beside" state draws its own shaded robot for the sheet; in the sandbox the real hero already shows the hide pose, so that state would draw a second hero.
- Visual check: add env cases to `tools/visual/compare.html` (spike vs port render per used asset and state), same pattern as robot and gun.

## Mapping

| Sandbox element | Asset | State |
|---|---|---|
| Backdrop | `skyBackground`, then a strip of `midgroundRuins` and buildings (`windowBuilding`, `ruinedBuilding`, `facadeTower`, `colonnadeBuilding`) behind the playfield | `skyBackground` normal |
| Solid tile with open top (floor surface) | `streetWalkway` tiled per run | - |
| Solid tile body and outer walls | `brickWall` or `tunnelWall` fill (builder picks the one that reads best as solid at game scale) | - |
| Mid-air platforms (rows 4 and 11 runs) | `girderBridge` | - |
| Lift | `lift`; state from `lift.vy`: 0 idle, < 0 moving up, > 0 moving down | per frame |
| Ladder | new `ladder` | - |
| `crate` | `crate` | normal |
| `barrel` | `barrel` | normal |
| `item` | `crowbar` | on ground; hidden when `taken` |
| `panel` | `switchboard` | `on: false` dead, `on: true` repaired |
| Dressing (no collision, no gameplay) | a few of `rubblePile`, `signPost`, `floorVent`, `pipeColumn`, `chainFence`, `stripLight` placed on free floor | builder's layout |

Dressing goes in `config/levels/sandbox.json` as a list separate from `props` (props block nothing, but dressing has no gameplay at all, so keep them apart). Dressing must not stand in front of ladders, the lift shaft, the switchboard, crate, barrel or crowbar.

## Removals

- `bag` and `target` props from `config/levels/sandbox.json`, their draw code in `scene.ts`, and `ceilingAbove` if nothing else uses it.
- Tests that use `target` as a position (`src/game/shots.test.ts`) move to another fixed point (a wall or the crate).
- All flat environment `COLORS` and draw functions in `scene.ts` replaced by asset draws. Hero, enemy, blast, scrap, bullets, sparks, dust and fog drawing stay.

## Constraints

- `src/engine/**` gets nothing new from this; env assets are Colony 28 art and live in `src/game/env/`.
- Draw order unchanged in spirit: backdrop, tiles, lift, ladders, props, then the enemy clip, hero, bullets.
- No code comments (repo rule). Update `CLAUDE.md` code layout and `docs/requirements.md` decision log.
- After editing `config/levels/mesto/objects.json` run `node spikes/shared/build-config.mjs`.

## Left to the builder

- Exact backdrop composition and building order.
- Wall fill asset choice and how tile edges meet (inner corners, the gaps at row 14).
- Dressing selection and positions.
- Ladder look within the 4-tone env style.
- Port structure inside `src/game/env/` (one file per spike sheet is the obvious split).
- Whether animated assets (`skyBackground` lightning, `stripLight`) animate in the sandbox; if they do, drive `t` from game time so record / replay stays deterministic.
