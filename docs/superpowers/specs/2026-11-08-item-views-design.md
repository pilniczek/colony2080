# Item views design

## Intent

Every inventory item (`"item": true` in `config/levels/<id>/objects.json`, 40 items over 6 missions) gets three orthographic views: top, front and side. The item sheet (`spikes/items-design/index.html`) shows them bare and lying on the robot palm, so the user can see how the views fit together and tune item sizes against the hand.

## Goals

- Two new drawings per item: top and front. Today's drawing is the side view.
- Item sheet block per item with fixed rows (below).
- Item and hand drawn at one true scale, so a wrong item size shows at a glance.

## Non-goals

- No game port. The game, ground pickups, HUD icons and cutscenes keep drawing the side view. `src/game/env/*.ts` stays untouched.
- No resizing of items in this project. Items that do not fit the palm are listed for the user; the fix is agreed per item (user).
- No item without an asset gets one here; missing views show a placeholder.

## Anti-goals

- Views that disagree: a top view whose length differs from the side view length, or a front view whose height differs from the side view height.
- Changing the side view look or box of any item (it would break `npm run test:visual` and the game).

## Sheet layout

One block per item, in mission order (mission select stays):

1. **Original and HUD icon.** Spinning original preview and the original crops of `refs`, then one HUD icon image (user).
2. **Bare views.** Top, front, side, each at full detail and at game LOD: 6 images, one scale per block (user).
3. **On the hand.** Top, front, side lying on the palm, full detail only, since the game never shows it (user).
4. **Other states (optional).** Only for items with a state worth seeing besides the inventory one, such as floppy "virus disk" or ship part "inside hull" (user). Each such state in the row 2 format: 3 views, full detail and game LOD (Claude's call).

The "taken" picture is dropped (user). The header, mission select and preview spin toggle stay.

## Views and coordinates

Env units as today (1 tile = 24, up is negative). Third-angle layout sharing axes (Claude's call):

- **side**: today's drawing. x = item length, y = height, floor at y 0. Box = `asset.box`.
- **top**: seen from above. x = item length (same x as side), y = depth, centred on 0. Its x extent equals the side x extent.
- **front**: seen along the length from the end that faces the fingertips in the hand (builder confirms which x end that is). x = depth (same as top y), y = height (same as side y), floor at y 0.

Asset API (Claude's call): an asset may carry `views: { top: { box, draw(ctx, state, t) }, front: { box, draw(ctx, state, t) } }`. `ENV.draw(ctx, asset, { view })` draws `asset.views[view]` when `view` is `top` or `front`, else the side draw as today. Missing view: the sheet shows a "not drawn yet" box in its slot. New drawings live next to the item's asset in its env script (`env-props.js`, `env-vesnice.js`, `env-jungle.js`, `env-jeskyne*.js`, `env-vezeni-items.js`, `env-sklad-items.js`), share its palette, grime rules (items stay clean, CLAUDE.md) and game LOD branch.

## Hand

Robot hand carry pose (`XBOT.buildHand({ view, pose: "carry" })`), palm up, item on the `item` hook. View map (Claude's call, from the existing palm-up rotations):

| Item view | Hand view |
|---|---|
| top | `palm` |
| front | `tips` |
| side | `thumb` |

Item length runs along the fingers. The `item` hook must sit on the palm surface in each of the three views, with the item centred on the palm across its width (top, front).

- The item rests on the palm in its ground pose: what stands on the ground stands on the palm (Claude's call).
- `PALM_UP` points the fingertips opposite ways in the `palm` and `thumb` views. The item sheet turns the `palm` view hand 180° so the fingers point the same way in both, and row 3 lines up with row 2. The hand stays a right hand, turned, never mirrored (Claude's call).
- Today only the carry `palm` and `back` views have an `item` hook; `thumb` and `tips` draw a flat slab stand-in. The item hook in those two views is new work.

Scale: one constant for every item, true robot scale: rig units per env unit = `(XBOT.FOOT_Y - 2) / 45.6` (hero height 45.6 units, as the env sheet uses), about 16. Today's `CARRY_TF` uses `scale(6)`, picked by eye. The item sheet uses the true scale. The robot design sheet carry and cup rows keep their own look unless the change there is free (builder's call, report it).

## Row 4 state list

Sheet constant, Claude's call, built from this draft; the user corrects it on the sheet: states that draw the item differently, other than the inventory one (`icon.state` in `config/items.json`, else 0) and other than removal states (taken, in inventory, hidden, used, thrown).

- `shipPart`: inside hull
- `craneKey`: guarded (if it differs from on ground)
- `fuse`, `navCircuit`: fitted
- `dynamite`: placed at wall
- `jungle smallKey`: used on door
- `jeskyne` keys: inserted
- `floppyDisk`: virus disk
- `timeBomb`: armed, counting
- `chestPlate`: on ground (inventory state "in inventory" may draw nothing; builder checks)

A state whose drawing is empty or a scuff mark is left out.

## Work order

1. Sheet frame: rows 1-4, view option in `ENV.draw`, hand at true scale, placeholders for missing views.
2. Views mission by mission: mesto, vesnice, jungle, jeskyne, vezeni, sklad. Each batch ends with sheet screenshots and a list of items that overhang the palm plus fingers (Claude's call); the user decides each fix.

## Constraints

- Spikes are classic scripts, `file://` safe, no modules.
- No original game name or file name in page text outside `<!-- originals -->` blocks; `npx vite build` must pass (`ORIGINAL_GAME` check).
- After editing `config/` run `node spikes/shared/build-config.mjs`.
- `npm run test:visual` must stay green (side views unchanged).

## Left to the builder

Exact image sizes, gaps and captions; hook placement maths per hand view; how to group the row 4 states visually.
