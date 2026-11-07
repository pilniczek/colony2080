import { describe, expect, it } from "vitest";
import { followView } from "./view";

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
  it("shows the whole world unshifted when it fits the view", () => {
    expect(followView(W, H, 400, 160, 400, 160, 0, 0)).toEqual({ scale: 1, offsetX: 0, offsetY: 0 });
  });
});
