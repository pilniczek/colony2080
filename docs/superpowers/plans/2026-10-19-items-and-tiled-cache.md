# Items And Tiled Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The inventory handles any level 1 item, not only the crowbar, and the static environment cache uses memory bounded by the screen instead of the map.

**Architecture:** A game-wide `config/items.json` describes each item (display name, Czech name, HUD icon). Item props name their item; `world.inventory` holds picked items and the shown one. The environment cache moves from two full-world canvases to a tile cache keyed by tile coordinates, kept only for tiles near the view.

**Tech Stack:** TypeScript, Vite, Vitest, Playwright visual check, Canvas 2D.

**Spec:** approved in chat on 2026-10-19 (design summary below).

- Items: `config/items.json` lists every level 1 item from `config/levels/mesto/tasks.json` `items` with `name` (English, shown in the HUD), `cs` (Czech) and `icon` `{ asset, tilt, scale }` (env asset id or `null` for a placeholder icon; tilt in degrees; scale on the hand box). Item props carry `"item": "<id>"`. The hero's inventory is a list; a newly picked item becomes the shown one. Cycling with the `I` key comes later. HUD icons and labels come from the config only. A second item (`craneKey`) is placed in the sandbox. Death reset empties the inventory and restores the props.
- Cache: static layers are cut into 512 x 512 device-px tiles; only tiles that touch the view plus a one-tile margin are drawn and kept; others are dropped. Tiles snap to whole device px as today. Memory follows the screen, not the map.

## Global Constraints

- No code comments. `src/engine/**` may not import React, Zustand, `game/` or `sandbox/`. Tuning values in `config/`.
- Record / replay stays deterministic.
- `git add` explicit paths only, never `git commit -a`; commit messages plain, no co-author line.
- Docs plain short English, no em dash, each idea once.

## Review Focus

- Picking a second item while one is shown: the new one shows, the old one stays in the list. Pinned in Task 1.
- Item without an env asset: HUD shows a placeholder icon and its name, never breaks. Pinned in Task 1.
- Camera at a tile seam: no gap or double-drawn line between tiles. Pinned by the visual check and screenshots in Task 2.
- Fast scroll across many tiles: no tile drawn more than once per key; evicted tiles redraw identically. Pinned in Task 2.
- Resize or dpr change: old tiles drop, new tiles match. Pinned in Task 2.

---

### Task 1: Items beyond the crowbar

**Files:**
- Create: `config/items.json`; create `src/game/items.ts` (loader + types), `src/game/items.test.ts`
- Modify: `config/levels/sandbox.json` (item props get `"item"`, add a `craneKey` prop on free floor reachable from spawn, clear of lifts and enemies' line of fire at spawn)
- Modify: `src/game/level/sandboxLevel.ts` (`Prop.item`, `world.inventory`, `resetWorld` clears it; remove `heldItems` or make it read the inventory), `src/game/hero/hero.ts` (pick-up adds to the inventory and shows it)
- Modify: `src/game/render/environment.ts` (draw an item prop with its item's icon asset, hide when taken)
- Modify: `src/game/hud/svg.ts`, `src/game/hud/icons.ts`, tests (icons and names from items config; placeholder icon for `asset: null`; remove `ITEM_NAMES`, `CROWBAR_SCALE`, `CROWBAR_TILT` in favour of per-item config)
- Modify: `src/sandbox/main.tsx`, `src/sandbox/store.ts`, `src/sandbox/ui/Hud.tsx` (store the shown item id)
- Modify: `spikes/hud-design/index.html` (item picker instead of the crowbar checkbox) and `config/levels/mesto/tasks.json` only if its `items` block duplicates `items.json` and nothing else reads it (check `spikes/shared/build-config.mjs` users first; regenerate `spikes/shared/config.js` if config changes)

**Interfaces:**
- `type ItemId = string`; `interface ItemIcon { asset: AssetId | null; tilt: number; scale: number }`; `interface Item { name: string; cs: string; icon: ItemIcon }`; `loadItems(json: unknown): Record<ItemId, Item>` throws on an unknown asset id.
- `world.inventory: { items: ItemId[]; shown: ItemId | null }`; `pickUp(world, id)` appends and shows.
- `HudState.items` becomes `item: ItemId | null` (the shown one); `HudIcons.items: Record<ItemId, HudIcon>` built for every configured item.

- [ ] **Step 1: Failing tests**: loader rejects an unknown asset; picking crowbar then craneKey gives `items ["crowbar", "craneKey"]`, `shown "craneKey"`; death reset gives `items []`, `shown null`, both props back; HUD with `item: "craneKey"` shows the craneKey icon and name; HUD with an item whose `asset` is null shows a placeholder icon and its name; HUD with `item: null` shows the hand and `nothing`.
- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement**
- [ ] **Step 4: `npm test && npm run lint && npm run typecheck && npm run test:visual`, expect pass**
- [ ] **Step 5: Screenshots (spike: each item; sandbox: after taking both items)**
- [ ] **Step 6: Docs: `CLAUDE.md` items line, `docs/requirements.md` "HUD inventory" row (one idea once)**
- [ ] **Step 7: Commit `Support any configured item in the inventory`**

---

### Task 2: Tiled static cache

**Files:**
- Create: `src/game/render/tiles.ts` (tile math and cache), `src/game/render/tiles.test.ts`
- Modify: `src/game/render/environment.ts` (`cached` uses the tile cache for the `below` and `above` layers)
- Modify: `CLAUDE.md` environment line

**Interfaces:**
- `TILE_PX = 512` device px (named constant).
- `visibleTiles(view: { x: number; y: number; w: number; h: number }, tile: number, margin: number, limits: { w: number; h: number }): [number, number][]` - tile coords that touch the view rect expanded by `margin` tiles, clamped to the layer size.
- Tile cache per world and layer: `Map<string, HTMLCanvasElement>` keyed `col,row`, plus the scale key (`scale|lines|cell|unit` as today); a key change drops all tiles; tiles not in the visible set this frame are dropped.
- Each tile renders the layer's paint with a translate of `-col * TILE_PX, -row * TILE_PX` in device px and the same scale; drawn at the rounded camera offset plus `col * TILE_PX`, `row * TILE_PX`.

- [ ] **Step 1: Failing tests** for `visibleTiles`: view inside one tile gives that tile plus the margin ring clamped to the layer; view on a seam gives both neighbours; margin 0 at the layer corner gives one tile; and a cache test with a fake paint counter: scrolling right by one tile paints only the new column once and drops the far column; a scale key change repaints all visible tiles.
- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement**
- [ ] **Step 4: `npm test && npm run lint && npm run typecheck && npm run test:visual`, expect pass**
- [ ] **Step 5: Screenshots at tile seams while scrolling (dpr 1 and 2): no seams, no shimmer. Performance trace walking and scrolling: report median frame script time against 3.3-4.3 ms and peak tile count. Report estimated cache memory at 3840 x 2160 (tiles kept x 1 MB)**
- [ ] **Step 6: Commit `Cache static environment layers in screen-sized tiles`**
