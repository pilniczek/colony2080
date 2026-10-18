import { describe, expect, it } from "vitest";
import { fitView } from "./view";

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
