import { describe, expect, it } from "vitest";
import { apply } from "../math/mat2d";
import { createBuilder, mirrorPts, type Pt } from "./tree";
import { jointMatrix, locate, solve, type Pose } from "./pose";

const close = (p: Pt, x: number, y: number, digits = 9) => {
  expect(p[0]).toBeCloseTo(x, digits);
  expect(p[1]).toBeCloseTo(y, digits);
};

const armWithHand = () => {
  const b = createBuilder(null);
  const root = b.root();
  const arm = b.G(root, null, "arm", [0, 0]);
  b.hook(b.G(arm, "translate(0 10)"), "hand");
  return root;
};

const twoSegmentArm = () => {
  const b = createBuilder(null);
  const root = b.root();
  const arm = b.G(root, null, "arm", [0, 0]);
  const fore = b.G(arm, "translate(0 10)", "fore", [0, 0]);
  b.hook(b.G(fore, "translate(0 10)"), "hand");
  return root;
};

const handAt = (pose: Pose): Pt => {
  const m = locate(armWithHand(), "hand", pose);
  if (!m) throw new Error("hand not found");
  return apply(m, [0, 0]);
};

describe("locate", () => {
  it("rotates a joint about its pivot", () => close(handAt({ arm: 90 }), -10, 0));
  it("offsets a joint", () => close(handAt({ arm: { dy: -5 } }), 0, 5));
  it("scales a joint", () => close(handAt({ arm: { sy: 0.5 } }), 0, 5));
  it("returns null for a missing hook", () => expect(locate(armWithHand(), "foot", {})).toBeNull());
});

describe("jointMatrix", () => {
  it("is null without a pose value", () => {
    const b = createBuilder(null);
    expect(jointMatrix(b.G(b.root(), null, "arm", [0, 0]), undefined)).toBeNull();
  });
});

describe("solve", () => {
  const ranges: [[number, number], [number, number]] = [[-180, 180], [-180, 180]];
  const reach = (seed?: Record<string, number> | null) => {
    const root = twoSegmentArm();
    const pose = solve(root, "hand", {}, ["arm", "fore"], ranges, [0, 14], seed);
    const m = locate(root, "hand", pose);
    if (!m) throw new Error("hand not found");
    const [x, y] = apply(m, [0, 0]);
    return Math.hypot(x, y - 14);
  };
  it("reaches a target with a two-segment arm", () => expect(reach()).toBeLessThan(0.5));
  it("reaches a target from a seed", () => expect(reach({ arm: 40, fore: -80 })).toBeLessThan(0.5));
});

describe("tiny", () => {
  it("drops thin or small shapes under LOD", () => {
    const b = createBuilder({ minThickness: 8, minArea: 400 });
    expect(b.tiny([[0, 0], [7, 100]])).toBe(true);
    expect(b.tiny([[0, 0], [30, 30]])).toBe(false);
  });
  it("never drops without LOD", () => expect(createBuilder(null).tiny([[0, 0], [1, 1]])).toBe(false));
  it("keeps visor flats under LOD", () => {
    const b = createBuilder({ minThickness: 8, minArea: 400 });
    const root = b.root();
    b.F(root, [[0, 0], [2, 0], [2, 2]], "visor");
    b.F(root, [[0, 0], [2, 0], [2, 2]], "a0");
    expect(root.kids).toHaveLength(1);
  });
});

it("mirrors points about an axis in reverse order", () => {
  expect(mirrorPts([[1, 0], [3, 2]], 10)).toEqual([[17, 2], [19, 0]]);
});
