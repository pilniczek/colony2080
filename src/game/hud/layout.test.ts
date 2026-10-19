import { describe, expect, it } from "vitest";
import { hudFit, topBar, viewRect } from "./layout";

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
    expect(bar.empty).toBeNull();
    expect(bar.gridW).toBeCloseTo(174.3, 9);
  });

  it("gives the run plate and the inventory plate equal 3.5 margins around their grids", () => {
    const bar = topBar(320);
    const [, , run, inventory] = bar.plates;
    expect(run).toEqual([bar.run - 3.5, bar.run + bar.runW + 3.5]);
    expect(inventory![0]).toBeCloseTo(bar.inv - 3.5, 9);
    expect(inventory![1]).toBeCloseTo(bar.inv + bar.invW + 3.5, 9);
  });

  it("lets the weapons plate absorb a few extra units", () => {
    const bar = topBar(325);
    expect(bar.empty).toBeNull();
    expect(bar.gridW).toBeCloseTo(179.3, 9);
  });

  it("puts an empty plate between the weapons and badge plates on wide screens", () => {
    const bar = topBar(467);
    expect(bar.plates).toHaveLength(5);
    expect(bar.gaps).toHaveLength(6);
    expect(bar.gridW).toBeCloseTo(174.3, 9);
    const [a, b] = bar.empty ?? [0, 0];
    expect(b - a).toBeCloseTo(467 - 320 - 2, 9);
    expect(bar.plates[1]).toEqual(bar.empty);
  });
});
