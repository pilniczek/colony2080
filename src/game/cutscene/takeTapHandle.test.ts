import { describe, expect, it } from "vitest";
import { apply } from "../../engine/math/mat2d";
import { locate } from "../../engine/rig/pose";
import type { Pt } from "../../engine/rig/tree";
import { buildSide } from "../robot/xbot";
import { reach } from "./takeTapHandle";

const STAND = { hipNear: 0, kneeNear: 2, ankleNear: -1.4 };

describe("reach", () => {
  const root = buildSide({ farLimbs: true });
  const targets: Pt[] = [[450, 250], [360, 330], [200, 300]];

  for (const target of targets)
    for (const bend of [1, -1])
      it(`puts the hand on ${target.join(", ")} with bend ${bend}`, () => {
        const pose = { ...STAND, ...reach(root, "hand", ["arm", "fore"], STAND, target, bend) };
        const [x, y] = apply(locate(root, "hand", pose)!, [0, 0]);
        expect(Math.hypot(x - target[0], y - target[1])).toBeLessThan(0.5);
      });
});
