import { describe, expect, it } from "vitest";
import { apply } from "../../engine/math/mat2d";
import { locate, type Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { drawGun, FRONT_BARREL, holdPoses, SUPPORT_IN_HOOK, toHook } from "./gun";
import { buildFront, buildSide } from "./xbot";

const point = (root: GroupNode, hook: string, pose: Pose, local: Pt): Pt => {
  const m = locate(root, hook, pose);
  if (!m) throw new Error(`missing hook ${hook}`);
  return apply(m, local);
};

const barrelWidth = (barrel?: number): number => {
  const widths: number[] = [];
  const ctx = {
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    fillRect: (_x: number, y: number, w: number) => {
      if (y === -62) widths.push(w);
    },
    strokeRect: () => {},
  } as unknown as CanvasRenderingContext2D;
  drawGun(ctx, barrel === undefined ? {} : { barrel });
  return Math.max(...widths);
};

const gap = ([x, y]: Pt, [tx, ty]: Pt): number => Math.hypot(x - tx, y - ty);

describe("gun", () => {
  const side = buildSide({ farLimbs: true, propBehindArm: true });
  const front = buildFront({ rightArmFirst: true, propBehindArm: true });
  const poses = holdPoses(side, front);

  it("front barrel matches the spike silhouette result", () => expect(FRONT_BARREL).toBeCloseTo(226, 0));

  it("draws a 196 barrel by default", () => expect(barrelWidth()).toBe(196));

  it("draws the requested barrel length", () => expect(barrelWidth(FRONT_BARREL)).toBe(FRONT_BARREL));

  it("rotates points into the hand hook frame", () => {
    expect(toHook([1, 2])).toEqual([-2, 1]);
  });

  it("side far hand reaches the support grip", () => {
    const gapFor = (pose: Pose): number => gap(point(side, "handFar", pose, [0, 0]), point(side, "hand", pose, SUPPORT_IN_HOOK));
    const solved = gapFor({ ...poses.CARRY, ...poses.CARRY_FAR });
    expect(solved).toBeLessThan(gapFor(poses.CARRY));
    expect(solved).toBeLessThan(1);
  });

  it("front right hand reaches the support grip", () => {
    const pose = { ...poses.FRONT_CARRY, ...poses.FRONT_CARRY_R };
    expect(gap(point(front, "handR", pose, [0, 0]), point(front, "handL", pose, SUPPORT_IN_HOOK))).toBeLessThan(1);
  });
});
