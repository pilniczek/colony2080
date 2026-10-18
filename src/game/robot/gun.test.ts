import { describe, expect, it } from "vitest";
import { apply } from "../../engine/math/mat2d";
import { locate, type Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { holdPoses, SUPPORT_IN_HOOK, toHook } from "./gun";
import { buildFront, buildSide } from "./xbot";

const point = (root: GroupNode, hook: string, pose: Pose, local: Pt): Pt => {
  const m = locate(root, hook, pose);
  if (!m) throw new Error(`missing hook ${hook}`);
  return apply(m, local);
};

const gap = ([x, y]: Pt, [tx, ty]: Pt): number => Math.hypot(x - tx, y - ty);

describe("gun", () => {
  const side = buildSide({ farLimbs: true, propBehindArm: true });
  const front = buildFront({ rightArmFirst: true, propBehindArm: true });
  const poses = holdPoses(side, front);

  it("rotates points into the hand hook frame", () => {
    expect(toHook([1, 2])).toEqual([-2, 1]);
  });

  it("side far hand is solved as close to the support grip as the arm reaches", () => {
    const gapFor = (pose: Pose): number => gap(point(side, "handFar", pose, [0, 0]), point(side, "hand", pose, SUPPORT_IN_HOOK));
    const solved = gapFor({ ...poses.CARRY, ...poses.CARRY_FAR });
    expect(solved).toBeLessThan(gapFor(poses.CARRY));
    expect(solved).toBeCloseTo(31.06, 1);
  });

  it("front right hand reaches the support grip", () => {
    const pose = { ...poses.FRONT_CARRY, ...poses.FRONT_CARRY_R };
    expect(gap(point(front, "handR", pose, [0, 0]), point(front, "handL", pose, SUPPORT_IN_HOOK))).toBeLessThan(1);
  });
});
