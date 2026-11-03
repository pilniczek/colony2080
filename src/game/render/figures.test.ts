import { describe, expect, it } from "vitest";
import { drawFigure, figureKey, poseKey } from "./figures";

describe("poseKey", () => {
  it("gives poses within half a degree the same key", () => {
    expect(poseKey({ arm: 10.1, fore: { rot: -20, dx: 1 } })).toBe(poseKey({ arm: 9.9, fore: { rot: -20.2, dx: 1.1 } }));
  });

  it("tells apart poses that differ by a degree, a tint or a joint", () => {
    const base = poseKey({ arm: 10 });
    expect(poseKey({ arm: 11 })).not.toBe(base);
    expect(poseKey({ arm: 10, head: 0 })).not.toBe(base);
    expect(poseKey({ head: { tint: { brightness: 2 } } })).not.toBe(poseKey({ head: { tint: { brightness: 1.5 } } }));
  });
});

describe("figureKey", () => {
  it("separates owners and extras", () => {
    const [a, b] = [{}, {}];
    expect(figureKey([a], {}, "hand")).toBe(figureKey([a], {}, "hand"));
    expect(figureKey([a], {}, "hand")).not.toBe(figureKey([b], {}, "hand"));
    expect(figureKey([a], {}, "hand")).not.toBe(figureKey([a], {}, "slung"));
  });
});

describe("drawFigure", () => {
  it("draws straight onto the context without a key", () => {
    const ctx = {} as CanvasRenderingContext2D;
    const drawn: CanvasRenderingContext2D[] = [];
    drawFigure(ctx, null, (c) => drawn.push(c));
    expect(drawn).toEqual([ctx]);
  });
});
