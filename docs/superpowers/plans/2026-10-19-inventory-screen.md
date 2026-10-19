# Inventory Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inventory screen on `I`: list held items, pick one, it becomes the HUD item. Preview in the HUD design spike.

**Architecture:** Inventory rule moves from stack pop to "use the shown item". Screen is an SVG string built in `src/game/hud/inventory.ts` (like `hudSvg`), with robot and item drawn to canvas data URLs (like `hudIcons`). `startRun` opens it on the `inventory` action, pauses the loop and handles keys while it is open; a React overlay renders the SVG. The spike gets the same layout first (design source).

**Tech Stack:** TypeScript, Vite, React, Zustand, Vitest, Canvas 2D, inline SVG.

**Spec:** `docs/superpowers/specs/2026-10-19-inventory-screen-design.md`

## Global Constraints

- English labels only: `INVENTORY`, `X-BOT`, `STATISTICS`, `ENERGY`, `SHIELDS:`, `EXTRA`. No Czech text, no original game image or name in anything the build publishes.
- Item preview is static, no rotation, no open animation, no mouse control.
- Fixed 320 x 200 layout, scaled to fit and centred; room background fills the whole screen (no bars).
- Gaps between boxes are equal, 2 units. No box overlaps another; body diagram stays inside its box.
- Energy % = `Math.round(energy / max * 100)`.
- No code comments (repo rule). Spike and `src/game/hud/` share the layout; change both together.
- Never edit `config/levels/mesto/map.json` by hand.

## Review Focus

1. ENTER that picks an item must not also use or pick up an item in the world after the screen closes (paused loop keeps buffered presses). Test in Task 4.
2. `I` while dead or dying (`death`, `jumpDeath`, `fallDeath`) does nothing. Test in Task 4.
3. Using an item that is not the newest removes that one, not the top. Test in Task 1.
4. Empty inventory: screen opens, list empty, no item picture, ENTER closes. Tests in Task 3 and Task 4.
5. Cursor stops at list ends (no wrap) and starts on the shown item. Test in Task 4.

---

### Task 1: Inventory rule - use the shown item

**Files:**
- Modify: `src/game/level/sandboxLevel.ts:182-192` (`pickUp`, `useTop`)
- Modify: `src/game/level/tasks.ts` (`runUse` calls the new function)
- Test: `src/game/level/tasks.test.ts` (`stack inventory` describe)
- Modify: `docs/requirements.md` (rows `Stack inventory` line ~118, `HUD inventory` ~109, Known issues ~141, open question ~162)

**Interfaces:**
- Produces: `useShown(world: SandboxWorld): ItemId | null` (replaces `useTop`), `showItem(world: SandboxWorld, id: ItemId): void`.

- [ ] **Step 1: Write failing tests** in `tasks.test.ts`, rename describe to `inventory`:

```ts
it("uses the shown item, wherever it sits", () => {
  pickUp(w, "wires"); pickUp(w, "crowbar"); pickUp(w, "card");
  showItem(w, "wires");
  expect(useShown(w)).toBe("wires");
  expect(w.inventory).toEqual({ items: ["crowbar", "card"], shown: "card" });
});
it("shows any held item without reordering", () => {
  pickUp(w, "wires"); pickUp(w, "crowbar");
  showItem(w, "wires");
  expect(w.inventory).toEqual({ items: ["wires", "crowbar"], shown: "wires" });
});
it("ignores an item it does not hold", () => {
  pickUp(w, "wires");
  showItem(w, "card");
  expect(w.inventory.shown).toBe("wires");
});
it("uses nothing when empty", () => expect(useShown(w)).toBeNull());
```

Keep the existing pop-order test, switched to `useShown`. Add a `runUse` test: hold `wires` and `crowbar`, show `crowbar`, use the train door object (the crowbar task in `config/levels/mesto/tasks.json`), expect `items` `["wires"]`.

- [ ] **Step 2: Run** `npx vitest run src/game/level/tasks.test.ts` - Expected: FAIL, `showItem` / `useShown` not exported.
- [ ] **Step 3: Implement** in `sandboxLevel.ts`: `useShown` removes `shown` from `items` (splice at its index), then `shown = items.at(-1) ?? null`. `showItem` sets `shown` only when `items` has it. Delete `useTop`; `tasks.ts` calls `useShown`.
- [ ] **Step 4: Run** `npm test` - Expected: all PASS (`route.test.ts` included).
- [ ] **Step 5: Docs.** `docs/requirements.md`: stack row becomes "every picked item stays; the newest picked is shown; the inventory screen on `I` shows any held item; a use consumes the shown item, then the newest remaining is shown (2026-10-19)". Drop the soft-lock flaw from Known issues and the "I does nothing" open question; add a decision row `Inventory screen` pointing to the spec. In `CLAUDE.md` `tasks.ts` bullet: "the shown item is the one picked last or chosen on the inventory screen; every `consumes` item use removes it".
- [ ] **Step 6: Commit** `git commit -m "Use the shown item instead of the newest"`

### Task 2: Spike - inventory screen in the HUD design sheet

**Files:**
- Modify: `spikes/hud-design/index.html`

**Interfaces:**
- Produces: spike functions `inventoryScreen(s, inv)` returning an SVG string, and layout constants the port copies: `INV_BOXES` = `{ list, item, title, stats, ammo, robot }` rects in 320 x 200 units.

- [ ] **Step 1: Controls.** Header gets `Held` (multi-select of every `C28_CONFIG.items` id, default `crowbar`, `holoPlan`, `shipPlan`, `card`), `Cursor` (number, clamped to held count), and reuses `Life`, `Shields`, `Ammo`, `Bonus owned`, `Bonus ammo`. Labels use the item `name`, never `cs`.
- [ ] **Step 2: Layout.** New full-width figure `Inventory screen` above `Side by side`. Boxes from the spec layout, 2-unit gaps, no overlap:
  - left column: `list` (item names newest first, selected row highlighted, `INVENTORY` label at bottom), `item` (selected item drawn big from `ENV`, static) under it;
  - middle column: `title` (`X-BOT` / `STATISTICS`), `stats` (`ENERGY n%`, `SHIELDS:` 5-segment bar, static pulse line and level bars, body diagram = front robot outline in yellow over a grid), `ammo` (gun icon row `xN`; `EXTRA xN` row only when bonus owned);
  - right: big `XBOT` front view, rest pose, image from canvas;
  - background: dark room, bright lamp, floor grid, filling the SVG.
  Teal frames, dark grid backing, pale yellow names, fonts `Share Tech Mono` / `Orbitron` as in the HUD.
- [ ] **Step 3: Originals.** Add the two original frames (`docs/research/video/frames-best/L1_KkPeK_t0901_inventory_energy10pct_ammo501_extra324.png`, `L1_t0585_inventory_xbot_statistika_screen.png`) as side-by-side references inside an `<!-- originals -->` block.
- [ ] **Step 4: Check.** Open the sheet in the browser (chrome-devtools MCP), screenshot, compare with the originals. Assert in the console that no two `INV_BOXES` rects intersect and every neighbour gap is 2. Run `npm run build` - Expected: passes the `ORIGINAL_GAME` check.
- [ ] **Step 5: Commit** `git commit -m "Add the inventory screen to the HUD design sheet"`

### Task 3: Port - inventory screen SVG

**Files:**
- Create: `src/game/hud/inventory.ts`, `src/game/hud/inventory.test.ts`
- Modify: `src/game/hud/icons.ts` (art for the screen)

**Interfaces:**
- Consumes: `HudIcons` / `icon()` pattern in `icons.ts`; `buildFront` from `src/game/robot/xbot.ts`; `ASSETS`, `drawAsset`; `ITEMS`.
- Produces:
  - `INVENTORY_BOXES: Record<"list" | "item" | "title" | "stats" | "ammo" | "robot", Rect>` (values copied from spike `INV_BOXES`)
  - `interface InventoryState { items: ItemId[]; cursor: number; energy: number; shields: number; ammo: number; blaster: number | null }` (`energy` in %)
  - `interface InventoryArt { robot: HudIcon; items: Record<ItemId, HudIcon> }`
  - `inventorySvg(W: number, H: number, s: InventoryState, art: InventoryArt): string` - 320 x 200 layout centred in a `W` x `H` viewBox, background spans all of it.
  - `inventoryArt(): InventoryArt` in `icons.ts` (big robot front view, big item pictures).

- [ ] **Step 1: Write failing tests** in `inventory.test.ts`:

```ts
const art = { robot: { url: "r", w: 1, h: 1 }, items: Object.fromEntries(Object.keys(ITEMS).map((id) => [id, { url: id, w: 1, h: 1 }])) };
const base = { items: ["wires", "crowbar"], cursor: 0, energy: 40, shields: 2, ammo: 501, blaster: null };

it("keeps every box apart with 2-unit gaps", ...) // no pair of INVENTORY_BOXES intersects; boxes in one column are 2 apart
it("lists names newest first", ...)               // index of "crowbar" < index of "wires" in the svg
it("highlights the row under the cursor", ...)    // cursor 0 marks "crowbar" row
it("draws the item under the cursor", ...)        // svg contains href "crowbar", not "wires"
it("shows energy and ammo", ...)                   // "ENERGY", "40%", "x501"
it("shows EXTRA only with the E-Blaster", ...)    // blaster null: no "EXTRA"; blaster 324: "EXTRA x324"
it("draws no item picture when empty", ...)        // items []: no item href
it("uses no Czech labels", ...)                     // no ITEMS[id].cs value in the svg
```

- [ ] **Step 2: Run** `npx vitest run src/game/hud/inventory.test.ts` - Expected: FAIL, module missing.
- [ ] **Step 3: Implement** `inventory.ts` as a port of the spike `inventoryScreen`. Reuse `MONO` / `BOLD` / `READOUT` style values from `svg.ts` (export them there if needed). `inventoryArt` draws the robot with `drawRig(buildFront(), { palette: ROBOT.palette })` and items with the `assetIcon` helper at the `item` box size.
- [ ] **Step 4: Run** `npx vitest run src/game/hud` - Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Port the inventory screen"`

### Task 4: Game - open on I, pick, close

**Files:**
- Create: `src/game/hud/inventoryKeys.ts`, `src/game/hud/inventoryKeys.test.ts`
- Create: `src/sandbox/ui/InventoryScreen.tsx`
- Modify: `src/sandbox/store.ts` (state), `src/game/run.ts` (open, pause, keys), `src/play/main.tsx` and `src/sandbox/main.tsx` (mount `<InventoryScreen />`)
- Test: `src/game/stepWorld.test.ts` or a new `src/game/run.test.ts` only if `run.ts` logic is extracted; keep `run.ts` thin.

**Interfaces:**
- Consumes: `showItem` (Task 1), `inventorySvg`, `inventoryArt`, `InventoryState` (Task 3).
- Produces:
  - store: `inventory: { open: boolean; cursor: number }`
  - `openCursor(items: ItemId[], shown: ItemId | null): number` - cursor index in the newest-first list of the shown item, 0 when none.
  - `inventoryKey(code: string, cursor: number, count: number, keys: Bindings): { cursor: number; pick: boolean; close: boolean }` - `up` / `down` move with clamp, `useItem` picks and closes, `inventory` / `menu` close without pick, anything else no change.
  - `canOpenInventory(state: HeroState): boolean` - false for `death`, `jumpDeath`, `fallDeath`.

- [ ] **Step 1: Write failing tests** in `inventoryKeys.test.ts` (bindings from `config/controls.json`):

```ts
expect(openCursor(["wires", "crowbar"], "wires")).toBe(1);
expect(openCursor([], null)).toBe(0);
expect(inventoryKey("ArrowDown", 1, 2, keys)).toEqual({ cursor: 1, pick: false, close: false });
expect(inventoryKey("ArrowUp", 0, 2, keys)).toEqual({ cursor: 0, pick: false, close: false });
expect(inventoryKey("ArrowDown", 0, 2, keys).cursor).toBe(1);
expect(inventoryKey("Enter", 1, 2, keys)).toEqual({ cursor: 1, pick: true, close: true });
expect(inventoryKey("Enter", 0, 0, keys)).toEqual({ cursor: 0, pick: false, close: true });
expect(inventoryKey("KeyI", 1, 2, keys)).toMatchObject({ pick: false, close: true });
expect(inventoryKey("Escape", 1, 2, keys)).toMatchObject({ pick: false, close: true });
expect(canOpenInventory("death")).toBe(false);
expect(canOpenInventory("ladder")).toBe(true);
```

- [ ] **Step 2: Run** `npx vitest run src/game/hud/inventoryKeys.test.ts` - Expected: FAIL.
- [ ] **Step 3: Implement** `inventoryKeys.ts`.
- [ ] **Step 4: Wire `run.ts`.**
  - In `update`, before `stepWorld`: if `input.consume("inventory")` and `canOpenInventory(hero.state)`, set store `inventory` to `{ open: true, cursor: openCursor(...) }`.
  - `applyTime`: `loop.paused = s.paused || s.inventory.open`.
  - A `keydown` listener (capture, on `window`) acts only while open: `preventDefault`, `stopPropagation`, apply `inventoryKey`; on `pick` call `showItem(world, newestFirst[cursor])`; on `close` set `open: false` and call `input.releaseAll()` so held or buffered ENTER / Down does not reach the hero.
  - Push `world.inventory.items` to the store each frame next to `item`.
- [ ] **Step 5: `InventoryScreen.tsx`.** Renders nothing when closed; else a full-screen `div` (`pointerEvents: none`, `inset: 0`) with `inventorySvg(W, H, state, art)` via `dangerouslySetInnerHTML`, `art` memoised from `inventoryArt()`, `W` / `H` from the window size in 320 x 200 units (like `hudFit`). Mount after `<Hud />` in both entries.
- [ ] **Step 6: Run** `npm test && npm run lint && npm run typecheck` - Expected: all pass.
- [ ] **Step 7: Browser check.** `npx vite --port 5199 --strictPort`, open `game.html` (chrome-devtools MCP). Pick up two items (`window.__teleport`), press `I`, screenshot, Down, Enter: HUD shows the chosen item, hero did not move or use anything. `I` on an empty inventory opens an empty list; Esc closes. Compare the screenshot with the spike.
- [ ] **Step 8: Docs.** `CLAUDE.md`: `src/game/hud/` bullet gets `inventory.ts` / `inventoryKeys.ts`; `src/play/` bullet mentions the screen on `I` (pauses the game).
- [ ] **Step 9: Commit** `git commit -m "Open the inventory screen on I"`
