import { describe, expect, it } from "vitest";
import { fitView, followView } from "./view";

describe("fitView", () => {
  it("letterboxes a wide screen top and bottom", () => {
    const view = fitView(1920, 1080, 960, 384);
    expect(view.scale).toBe(2);
    expect(view.offsetX).toBe(0);
    expect(view.offsetY).toBe(156);
  });

  it("fits the width of a square screen and centers vertically", () => {
    const view = fitView(800, 800, 960, 384);
    expect(view.scale).toBeCloseTo(800 / 960, 12);
    expect(view.offsetX).toBe(0);
    expect(view.offsetY).toBeCloseTo((800 - 384 * (800 / 960)) / 2, 12);
  });

  it("centers horizontally when the screen is wider than the world", () => {
    const view = fitView(1000, 192, 960, 384);
    expect(view.scale).toBe(0.5);
    expect(view.offsetX).toBe(260);
    expect(view.offsetY).toBe(0);
  });
});

describe("followView", () => {
  const W = 400, H = 160;
  it("centers the focus away from the borders", () => {
    const v = followView(W, H, 960, 768, 400, 160, 480, 400);
    expect(v.scale).toBe(1);
    expect(v.offsetX).toBe(-(480 - 200));
    expect(v.offsetY).toBe(-(400 - 80));
  });
  it("stops at the top-left corner", () => {
    const v = followView(W, H, 960, 768, 400, 160, 10, 10);
    expect([v.offsetX, v.offsetY]).toEqual([0, 0]);
  });
  it("stops at the bottom-right corner", () => {
    const v = followView(W, H, 960, 768, 400, 160, 950, 760);
    expect([v.offsetX, v.offsetY]).toEqual([-(960 - 400), -(768 - 160)]);
  });
  it("centers an axis the world does not fill", () => {
    const v = followView(800, 160, 400, 768, 400, 160, 200, 400);
    expect(v.scale).toBe(1);
    expect(v.offsetX).toBe(200);
  });
  it("matches fitView when the world fits the view", () => {
    expect(followView(W, H, 400, 160, 400, 160, 0, 0)).toEqual(fitView(W, H, 400, 160));
  });
});
