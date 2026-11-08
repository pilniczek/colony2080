# Item Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every inventory item gets top and front views, and the item sheet shows original, bare views and views on the robot palm per item.

**Architecture:** `ENV.draw` gains a `view` option that picks an asset's optional `views.top` / `views.front` drawing. `XBOT.buildHand` gains a `rest` option: the carry pose draws an empty palm with a `rest` hook (unit frame on the palm surface) in the `palm`, `thumb` and `tips` views. The item sheet draws each view bare and on the hand at true robot scale.

**Tech Stack:** classic browser scripts (spikes), Canvas 2D, Playwright for screenshots.

**Spec:** `docs/superpowers/specs/2026-11-08-item-views-design.md`

## Global Constraints

- Hand scale: true robot scale `K = (XBOT.FOOT_Y - 2) / 45.6` rig units per env unit (user, "build that" on the true scale question).
- Side views unchanged: `asset.box` and the side `draw` of every item stay as they are; `npm run test:visual` stays green.
- No game port: `src/game/**` untouched.
- Spikes stay classic scripts, `file://` safe; no original game name or file name in visible page text outside `<!-- originals -->` blocks; `npx vite build` passes.
- Items stay clean (no grime), as CLAUDE.md says for items.
- No code comments (AGENTS.md).
- Spike drawing has no unit tests; each task verifies with sheet screenshots (Playwright, Vite dev server on port 5199) read back and checked by eye, plus the commands named in the task.

## Review Focus

- Item with no `views`: rows 2-4 show "not drawn yet" boxes in the top and front slots, side still drawn. Checked in Task 2 before any view exists.
- Views disagree in size: top x extent must equal side x extent, front height must equal side height. Task 2 draws a dashed guide box per view from the side box, so a mismatch shows.
- Robot design sheet carry row unchanged: `rest` defaults off. Task 1 screenshots the Hands section before and after.
- Item bigger than the hand: the canvas grows to the item, nothing clipped. Task 2 checks the crowbar.
- Animated item views (`anim` assets): the sheet repaints them each frame like today. Task 2 keeps the anim loop for all views.

---

### Task 1: View option in ENV.draw, rest hook in XBOT.buildHand

**Files:**
- Modify: `spikes/shared/env.js:366-373` (`draw`)
- Modify: `spikes/shared/xbot.js:1031-1039` (`carry`), `:1243-1248` (`buildHand`)

**Interfaces:**
- Produces: `ENV.draw(ctx, asset, { view })` where `view` is `"side"` (default), `"top"` or `"front"`; asset field `views?: { top?: { box: [x0, y0, x1, y1], draw(ctx, state, t, size) }, front?: { same } }`; `ENV.viewBox(asset, view)` returns that view's box or `asset.box` for side, `null` when the view is missing.
- Produces: `XBOT.buildHand({ view, pose: "carry", rest: true })`: carry pose without slab or `item` hook, with a `rest` hook in the `palm`, `thumb` and `tips` views. Hook frame: origin on the palm surface at the palm centre, +x toward the fingertips as drawn on screen, -y away from the palm (up), 1 unit = 1 rig unit, no scale. In the `palm` view the whole hand is turned 180° about the palm centre against `PALM_UP`, so the fingertips point the same screen way as in the `thumb` view.

- [ ] **Step 1:** Screenshot `spikes/robot-design/index.html` Hands section (before).
- [ ] **Step 2:** Implement `view` in `draw` and `viewBox`; `ENV.draw` with no `view` behaves exactly as today.
- [ ] **Step 3:** Implement `rest` in `buildHand` and `carry`. Counter-rotate the hook against the view's `PALM_UP` rotation so the frame is screen-aligned. Front view (`tips`): +x of the frame is screen right, depth axis; the item front view is drawn into it unrotated.
- [ ] **Step 4:** Screenshot the Hands section again; must match step 1. Run `npm run test:visual`; expected all pass.
- [ ] **Step 5:** Commit `spikes/shared/env.js spikes/shared/xbot.js` ("Add item views to ENV.draw and a palm rest hook to the carry hand").

### Task 2: Item sheet rows

**Files:**
- Modify: `spikes/items-design/index.html`

**Interfaces:**
- Consumes: Task 1 `ENV.draw({ view })`, `ENV.viewBox`, `XBOT.buildHand({ rest: true })`.
- Produces: `EXTRA_STATES` sheet constant, item id to state indexes (the spec's row 4 list; `smallKey` and the jeskyne keys keyed per mission as `"<mission>:<id>"`).

- [ ] **Step 1:** Rebuild `section` with the spec rows. Row 1: preview spin, `refs` crops, one HUD icon. Row 2: top, front, side, each at full detail then game LOD (6 canvases), one scale per block (largest view fits 560 px wide, game LOD at `GAME` 2). Row 3: top, front, side on the hand (`palm`, `tips`, `thumb`), full detail, `rest` hook drawing the item view at scale `K` centred on its view box x (and depth for top), floor on the palm. Row 4: each `EXTRA_STATES` state in the row 2 format, captioned with the state label. Drop the "taken" and other-state figures.
- [ ] **Step 2:** Missing view: "not drawn yet" box at the size the side view would take. Dashed guide in each view canvas: top x span and front height taken from the side box.
- [ ] **Step 3:** Keep the anim repaint for every canvas whose asset has `anim`.
- [ ] **Step 4:** Screenshot all 6 missions (`?mission=<id>`), read back; check the crowbar row 3 shows the whole crowbar, placeholders show for top and front, no console errors. Run `npx vite build`; expected success.
- [ ] **Step 5:** Commit ("Lay out the item sheet in original, bare view and hand rows").

### Tasks 3-8: Top and front views per mission

One task per mission, in order: mesto (Task 3, `env-props.js`), vesnice (Task 4, `env-vesnice.js`), jungle (Task 5, `env-jungle.js`), jeskyne (Task 6, `env-jeskyne*.js`), vezeni (Task 7, `env-vezeni-items.js`), sklad (Task 8, `env-sklad-items.js`). Shared items (`holoPlan`) are drawn once, where the asset lives.

**Interfaces:**
- Consumes: Task 1 asset `views` field; Task 2 sheet.

- [ ] **Step 1:** For each item of the mission add `views.top` and `views.front` next to its asset: same palette, parts and game LOD branch as the side draw; top x span equals side x span, front height equals side height; drawing per state where the state changes the look (row 4 states).
- [ ] **Step 2:** Screenshot the mission on the item sheet, read back; fix views that disagree with the guides.
- [ ] **Step 3:** Run `npm run test:visual` and `npx vite build`; expected pass.
- [ ] **Step 4:** Commit ("Draw top and front views of the <mission> items").
- [ ] **Step 5:** Report the items that overhang palm plus fingers in row 3, for the user to decide per item.

### Task 9: Docs

**Files:**
- Modify: `CLAUDE.md` (Spikes: `items-design` and `env.js` entries, `xbot.js` hands note), `docs/requirements.md:222`

- [ ] **Step 1:** Describe the item sheet rows, `views` / `view`, `rest` hook and true scale, each once.
- [ ] **Step 2:** Commit ("Document item views").
