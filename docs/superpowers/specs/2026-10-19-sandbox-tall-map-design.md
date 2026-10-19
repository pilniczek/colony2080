# Sandbox tall map design

## Intent

The sandbox playground gets twice the height, more platforms and more elevators, so movement can be tried across several floors. A taller map no longer fits the screen at the current size, so the view starts following the hero.

## Goals

- Map 48 x 32 cells (was 40 x 16).
- More platforms and two or more extra elevators in the new part.
- Camera follows the hero on both axes.

## Non-goals

- New interactive elements in the widened strip.
- Multi-stop elevators. Each elevator still runs between one top and one bottom stop.
- Camera smoothing or look-ahead.
- Crowbar HUD icon (separate follow-up).

## Decisions

User:

- Twice the height, more platforms and elevators.
- Camera: the hero stays in the middle of the view. At a map border the view stops and the hero keeps moving toward the edge. Same rule horizontally and vertically.
- The invisible ceiling above row 0 stays.
- An elevator is always at the hero's level when the hero reaches its shaft; the hero never stands beside an empty shaft. The map guarantees it: a lift's two stop floors connect only through that lift (no walk, ladder, other lift, jump or drop between them in either direction, deadly drops included, since the hero respawns while the lift stays). Each lift starts at the stop on the spawn side. Where a floor edge would allow such a path, solid obstacles (railings, parapets, walls) block it. A reachability test enforces the rule for every lift.
- Widen the map slightly so horizontal camera movement shows. The extra width adds no interactive elements: no elevators, ladders, props or enemies there, only floor, walls and scenery.

Claude's call:

- The current 16 rows stay as they are, as the top half. New rows 16-31 go below. Every existing coordinate (spawn, props, lift, enemy) and the tests that use them keep working.
- Width: 8 new columns on the right (cols 40-47); the right outer wall moves from col 39 to col 47. Floors and the lower half continue into the strip. Tests that hit the old right wall at x 39 move to the new wall. The two pits in rows 14-15 open into the new lower half; whatever lies under them is part of the new layout.
- View size: the view shows 40 x 16 cells, the area the whole map filled before (`config/camera.json`, new `view: { widthCells: 40, heightCells: 16 }`). Scale fits that area into the game window, as `fitView` does today for the whole map.
- Camera rule: view center = hero center, then clamped so the view never shows outside the map. If the map is smaller than the view on an axis, the map is centered on that axis, as today. The clamp math is a pure function in `src/engine/render/view.ts` with unit tests. Fog, overlays and the environment cache use the same view transform, so they follow with no change of their own.
- Elevators: `lift` becomes `lifts: Lift[]` in `config/levels/sandbox.json` and `SandboxWorld`. The hero uses the elevator it stands on or calls the one whose shaft it stands in, same rules as today's single elevator. The current elevator stays first in the list with the same values.
- New lower half layout: floors 7 cells apart (`floorHeightCells` 7), ground at row 31 (rows 30-31 solid, or a thicker base). At least 2 new elevators, at least 3 new platforms (mix of wall-backed ledges and free-standing girders), at least 1 new ladder, so every floor is reachable from the spawn and back up. Built only from the ported env assets and the terrain classifier, same art rules as now (tall non-blocking scenery in the backdrop under the haze).
- Sky and backdrop cover the full 32-row height.

## Constraints

- `src/engine/**` keeps its rules: no React, Zustand, `game/` or `sandbox/` imports.
- No code comments.
- Performance: the cached static layers grow to 48 x 32 cells; frame time stays near today's (about 4 ms on the test machine).

## Left to the builder

- Exact lower-half layout, elevator positions and travel.
- Whether pits drop to a lower floor or into a closed shaft.
- Backdrop placement for the lower half.
