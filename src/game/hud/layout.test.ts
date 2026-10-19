import { describe, expect, it } from "vitest";
import { ITEMS } from "../items";
import { hudFit, READOUT_SIZE, SLOT, topBar, viewRect, WEAPON_W } from "./layout";

const OLD_INV_W = 46.5;


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
    expect(viewRect({ W: 320, H: 250, unit: 2 })).toEqual({ x: 22, y: 40.8, w: 596, h: 443.2 });
  });
});

describe("topBar", () => {
  it("has 4 plates and 5 rod gaps at 320", () => {
    const bar = topBar(320);
    expect(bar.plates).toHaveLength(4);
    expect(bar.gaps).toHaveLength(5);
    expect(bar.gridW).toBeCloseTo(WEAPON_W.reduce((a, b) => a + b, 0) + 4 * 12, 9);
  });

  it("fits every item name in the inventory plate with equal side padding", () => {
    const { invW } = topBar(320);
    const longest = Math.max(...Object.values(ITEMS).map((item) => item.name.length));
    const textArea = invW - 2 * SLOT.pad - SLOT.iconW - SLOT.gap;
    expect(textArea).toBeCloseTo(longest * READOUT_SIZE * 0.54, 9);
    expect(invW).toBeGreaterThan(OLD_INV_W);
  });

  it("gives the run plate and the inventory plate equal 3.5 margins around their grids", () => {
    const bar = topBar(320);
    const [, , run, inventory] = bar.plates;
    expect(run).toEqual([bar.run - 3.5, bar.run + bar.runW + 3.5]);
    expect(inventory![0]).toBeCloseTo(bar.inv - 3.5, 9);
    expect(inventory![1]).toBeCloseTo(bar.inv + bar.invW + 3.5, 9);
  });

  it("has 4 plates and no empty plate on a wide screen, the badge plate takes the leftover width", () => {
    const narrow = topBar(320);
    const wide = topBar(467);
    expect(wide.plates).toHaveLength(4);
    expect(wide.gaps).toHaveLength(5);
    expect(wide.plates[0]).toEqual(narrow.plates[0]);
    const width = (bar: ReturnType<typeof topBar>): number => bar.plates[1]![1] - bar.plates[1]![0];
    expect(width(wide) - width(narrow)).toBeCloseTo(467 - 320, 9);
  });

  it("centres the badge window in its plate", () => {
    for (const W of [320, 467]) {
      const { badge, plates } = topBar(W);
      expect(badge + 24).toBeCloseTo((plates[1]![0] + plates[1]![1]) / 2, 9);
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
