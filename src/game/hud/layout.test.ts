import { describe, expect, it } from "vitest";
import { itemName, tr } from "../i18n";
import { ITEMS } from "../items";
import { BADGE_W, BAR_H, GRID_CELL, hudFit, ITEM_PLATE_W, ITEM_SLOT_MAX, MONO_ADVANCE, PANEL_EDGE, READOUT_SIZE, SLOT, slotW, HIDE_W, MAP_W, MENU_W, SPEAKER_W, TOGGLE_W, topBar, viewRect, VIEW_BOX, WEAPON_GAP, WEAPON_W } from "./layout";

describe("hudFit", () => {
  it("uses the original 320 x 200 frame on a 16:10 screen", () => {
    expect(hudFit(1280, 800)).toEqual({ W: 320, H: 200, unit: 4 });
  });

  it("widens the frame on a wide screen", () => {
    const fit = hudFit(1920, 1080);
    expect(fit.W).toBeCloseTo(355.56, 2);
    expect(fit.H).toBe(200);
    expect(fit.unit).toBeCloseTo(5.4, 12);
  });

  it("heightens the frame on a narrow screen", () => {
    expect(hudFit(640, 800)).toEqual({ W: 320, H: 400, unit: 2 });
  });
});

describe("viewRect", () => {
  it("is the frame window in screen pixels", () => {
    const rect = viewRect({ W: 320, H: 250, unit: 2 });
    expect(rect.x).toBeCloseTo(2 * 11 * (2 / 3), 9);
    expect(rect.w).toBeCloseTo(2 * (320 - 2 * 11 * (2 / 3)), 9);
    expect(rect.y).toBeCloseTo(2 * BAR_H, 9);
    expect(rect.h).toBeCloseTo(2 * (250 - BAR_H - VIEW_BOX.bottom), 9);
  });

  it("starts the window at 72% of the old 20.4 top bar", () => {
    expect(BAR_H).toBeCloseTo(0.72 * 20.4, 9);
  });
});

describe("topBar", () => {
  it("has 5 plates and 6 rod gaps at 320", () => {
    const bar = topBar(320);
    expect(bar.plates).toHaveLength(5);
    expect(bar.gaps).toHaveLength(6);
    expect(bar.gridW).toBeCloseTo(WEAPON_W.reduce((a, b) => a + b, 0) + 4 * WEAPON_GAP, 9);
  });

  it("makes the menu and weapons plates as wide together as the toggles and item plates", () => {
    for (const W of [320, 467]) {
      const { plates } = topBar(W);
      expect(plates[1]![1] - plates[0]![0]).toBeCloseTo(plates[4]![1] - plates[3]![0], 9);
    }
  });

  it("keeps the item slot two grid cells in from each item plate side", () => {
    expect(ITEM_SLOT_MAX).toBeCloseTo(ITEM_PLATE_W - 4 * GRID_CELL, 9);
    expect(slotW(6, "controller")).toBeCloseTo(6 + SLOT.gap + 10 * READOUT_SIZE * MONO_ADVANCE, 9);
  });

  it("fits every item name and the empty hand in the item slot in both languages", () => {
    const widestIcon = 7.7;
    for (const lang of ["en", "cs"] as const) {
      for (const label of [tr("nothing", lang), ...Object.keys(ITEMS).map((id) => itemName(id, lang))]) {
        expect(slotW(widestIcon, label), label).toBeLessThanOrEqual(ITEM_SLOT_MAX);
      }
    }
  });

  it("frames every grid panel with the panel edge on its sides, like on top", () => {
    const bar = topBar(320);
    const [menu, weapons, , toggles, inventory] = bar.plates;
    const side = PANEL_EDGE - 0.4;
    expect(menu![0]).toBeCloseTo(bar.menuX - side, 9);
    expect(menu![1]).toBeCloseTo(bar.menuX + bar.menuW + side, 9);
    expect(weapons![0]).toBeCloseTo(bar.gridX - side, 9);
    expect(weapons![1]).toBeCloseTo(bar.gridX + bar.gridW + side, 9);
    expect(toggles![0]).toBeCloseTo(bar.togglesX - side, 9);
    expect(toggles![1]).toBeCloseTo(bar.togglesX + bar.togglesW + side, 9);
    expect(inventory![0]).toBeCloseTo(bar.inv - side, 9);
    expect(inventory![1]).toBeCloseTo(bar.inv + bar.invW + side, 9);
  });

  it("holds the sound, run, hide and map slots in that order in one toggles grid with equal gaps and ends", () => {
    for (const W of [320, 520]) {
      const { togglesX, togglesW, sound, run, hide, map } = topBar(W);
      const gaps = [sound - togglesX, run - (sound + SPEAKER_W), hide - (run + TOGGLE_W), map - (hide + HIDE_W), togglesX + togglesW - (map + MAP_W)];
      for (const g of gaps) expect(g).toBeCloseTo(gaps[0]!, 9);
      expect(gaps[0]).toBeGreaterThan(0);
    }
  });

  it("centres the menu slot alone in its own grid left of the weapons grid, with half the toggle gap at both ends", () => {
    for (const W of [320, 520]) {
      const { menuX, menuW, menu, gridX } = topBar(W);
      expect(menu - menuX).toBeCloseTo(menuX + menuW - (menu + MENU_W), 9);
      expect(menu - menuX).toBeCloseTo(WEAPON_GAP / 2, 9);
      expect(menuX + menuW).toBeLessThan(gridX);
    }
  });

  it("keeps every plate apart and the badge window inside its plate at 320 and 520", () => {
    for (const W of [320, 520]) {
      const { plates, badge } = topBar(W);
      expect(badge).toBeGreaterThanOrEqual(plates[2]![0]);
      expect(badge + BADGE_W).toBeLessThanOrEqual(plates[2]![1]);
      plates.forEach(([a, b], i) => {
        expect(b).toBeGreaterThan(a);
        if (i > 0) expect(a).toBeGreaterThan(plates[i - 1]![1]);
      });
    }
  });

  it("has 5 plates and no empty plate on a wide screen, the badge plate takes the leftover width", () => {
    const narrow = topBar(320);
    const wide = topBar(467);
    expect(wide.plates).toHaveLength(5);
    expect(wide.gaps).toHaveLength(6);
    expect(wide.plates.slice(0, 2)).toEqual(narrow.plates.slice(0, 2));
    const width = (bar: ReturnType<typeof topBar>): number => bar.plates[2]![1] - bar.plates[2]![0];
    expect(width(wide) - width(narrow)).toBeCloseTo(467 - 320, 9);
  });

  it("centres the badge window in its plate", () => {
    for (const W of [320, 467]) {
      const { badge, plates } = topBar(W);
      expect(badge + BADGE_W / 2).toBeCloseTo((plates[2]![0] + plates[2]![1]) / 2, 9);
    }
  });

  it("keeps plates and rod gaps contiguous from edge to edge at every width", () => {
    for (const W of [320, 325, 400, 467, 640]) {
      const { gaps, plates } = topBar(W);
      expect(gaps[0]![0]).toBe(0);
      expect(gaps.at(-1)![1]).toBe(W);
      plates.forEach(([a, b], i) => {
        expect(a).toBe(gaps[i]![1]);
        expect(b).toBe(gaps[i + 1]![0]);
      });
    }
  });

  it("spaces the three weapon slots with equal gaps and equal ends in the weapons grid", () => {
    for (const W of [320, 325, 467]) {
      const { gridX, gridW, weapons } = topBar(W);
      const gaps = [weapons[0]! - gridX, weapons[1]! - (weapons[0]! + WEAPON_W[0]!), weapons[2]! - (weapons[1]! + WEAPON_W[1]!), gridX + gridW - (weapons[2]! + WEAPON_W[2]!)];
      for (const g of gaps) expect(g).toBeCloseTo(gaps[0]!, 9);
      expect(gaps[0]).toBeGreaterThan(0);
    }
  });
});
