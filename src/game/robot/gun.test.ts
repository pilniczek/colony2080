import { describe, expect, it } from "vitest";
import { apply } from "../../engine/math/mat2d";
import { locate, type Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { drawGun, holdPoses, SUPPORT_IN_HOOK, toHook } from "./gun";
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
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fill: () => {},
    stroke: () => {},
  } as unknown as CanvasRenderingContext2D;
  drawGun(ctx, barrel === undefined ? {} : { barrel });
  return Math.max(...widths);
};

const gap = ([x, y]: Pt, [tx, ty]: Pt): number => Math.hypot(x - tx, y - ty);

describe("gun", () => {
  const side = buildSide({ farLimbs: true, propBehindArm: true });
  const front = buildFront({ rightArmFirst: true, propBehindArm: true });
  const poses = holdPoses(side, front);


  it("draws a 196 barrel by default", () => expect(barrelWidth()).toBe(196));

  it("draws the requested barrel length", () => expect(barrelWidth(226)).toBe(226));

  it("rotates points into the hand hook frame", () => {
    expect(toHook([1, 2])).toEqual([-2, 1]);
  });

  it("side far hand reaches the support grip", () => {
    const gapFor = (pose: Pose): number => gap(point(side, "handFar", pose, [0, 0]), point(side, "hand", pose, SUPPORT_IN_HOOK));
    const solved = gapFor({ ...poses.CARRY, ...poses.CARRY_FAR });
    expect(solved).toBeLessThan(gapFor(poses.CARRY));
    expect(solved).toBeLessThan(1);
  });

  it("front upper arms hang straight down", () => {
    expect(poses.FRONT_CARRY.armL).toBe(0);
    expect(poses.FRONT_CARRY_R.armR).toBe(0);
  });

  it("front right hand grips the weapon at the support height", () => {
    const pose = { ...poses.FRONT_CARRY, ...poses.FRONT_CARRY_R };
    const [ax, ay] = point(front, "handL", pose, [SUPPORT_IN_HOOK[0], 0]);
    const [bx, by] = point(front, "handL", pose, [SUPPORT_IN_HOOK[0], 100]);
    const [hx, hy] = point(front, "handR", pose, [0, 0]);
    expect(Math.abs((bx - ax) * (hy - ay) - (by - ay) * (hx - ax)) / Math.hypot(bx - ax, by - ay)).toBeLessThan(1);
  });
});
