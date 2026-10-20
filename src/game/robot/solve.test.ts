import { describe, expect, it } from "vitest";
import { apply } from "../../engine/math/mat2d";
import { locate, solve, type Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { buildBack, buildFront, buildSide } from "./xbot";

type Ranges = [[number, number], [number, number]];
type Best = [number, number, number];

const treeSolve = (root: GroupNode, hook: string, pose: Pose, [ka, kb]: [string, string], ranges: Ranges, target: Pt, seed: Record<string, number> | null = null) => {
  const hit = (a: number, b: number): number => {
    const m = locate(root, hook, { ...pose, [ka]: a, [kb]: b });
    if (!m) return Infinity;
    const [x, y] = apply(m, [0, 0]);
    return Math.hypot(x - target[0], y - target[1]);
  };
  const refine = (start: Best, passes: [number, number][]): Best => {
    let best = start;
    for (const [range, step] of passes) {
      const [, a0, b0] = best;
      for (let a = a0 - range; a <= a0 + range; a += step)
        for (let b = b0 - range; b <= b0 + range; b += step) {
          const d = hit(a, b);
          if (d < best[0]) best = [d, a, b];
        }
    }
    return best;
  };
  const full = (): Best => {
    let best: Best = [Infinity, 0, 0];
    for (let a = ranges[0][0]; a <= ranges[0][1]; a += 4)
      for (let b = ranges[1][0]; b <= ranges[1][1]; b += 4) {
        const d = hit(a, b);
        if (d < best[0]) best = [d, a, b];
      }
    return refine(best, [[4, 1], [1, 0.25]]);
  };
  const seeded = (s: Record<string, number>): Best => {
    const a = s[ka] ?? 0;
    const b = s[kb] ?? 0;
    return refine([hit(a, b), a, b], [[12, 3], [3, 1], [1, 0.25]]);
  };
  let best = seed ? seeded(seed) : null;
  if (!best || best[0] > 0.5) best = full();
  return { [ka]: best[1], [kb]: best[2] };
};

const handAt = (root: GroupNode, hook: string, pose: Pose): Pt => {
  const m = locate(root, hook, pose);
  if (!m) throw new Error(`missing hook ${hook}`);
  return apply(m, [0, 0]);
};

interface Case {
  name: string;
  root: GroupNode;
  hook: string;
  pose: Pose;
  keys: [string, string];
  ranges: Ranges;
  targets: Pt[];
}

const side = buildSide({ farLimbs: true, propBehindArm: true });
const front = buildFront({ rightArmFirst: true, propBehindArm: true });
const back = buildBack({ thumbsBehind: true, forearmsUnder: true });
const sideLod = buildSide({ farLimbs: true, lod: true, enemy: true });

const CASES: Case[] = [
  { name: "side far arm", root: side, hook: "handFar", pose: { arm: 0, fore: -72 }, keys: ["armFar", "foreFar"], ranges: [[-160, 40], [-150, 30]], targets: [handAt(side, "hand", { arm: 0, fore: -72 }), [200, 80], [400, -300], [-50, 260]] },
  { name: "side near arm crouched", root: side, hook: "hand", pose: { thigh: -60, shin: 90, body: { dy: 40, rot: 12 } }, keys: ["arm", "fore"], ranges: [[-180, 60], [-150, 60]], targets: [[260, 300], [120, 180], [900, 900]] },
  { name: "front right arm", root: front, hook: "handR", pose: { armL: -24, foreL: -66 }, keys: ["armR", "foreR"], ranges: [[-40, 120], [-60, 150]], targets: [handAt(front, "handL", { armL: -24, foreL: -66 }), [300, 120], [-500, -500]] },
  { name: "back climber", root: back, hook: "handL", pose: {}, keys: ["armL", "foreL"], ranges: [[90, 200], [0, 160]], targets: [[190, 110], [190, 35], [190, -40], [600, 600]] },
  { name: "lod enemy side", root: sideLod, hook: "handFar", pose: { arm: 30 }, keys: ["armFar", "foreFar"], ranges: [[-150, 90], [-140, 10]], targets: [[150, 100], [250, 50]] },
  { name: "missing hook", root: side, hook: "nothing", pose: {}, keys: ["arm", "fore"], ranges: [[-20, 20], [-20, 20]], targets: [[0, 0]] },
];

describe("solve matches the tree walk", () => {
  for (const c of CASES)
    it(c.name, () => {
      for (const target of c.targets) {
        const fresh = solve(c.root, c.hook, c.pose, c.keys, c.ranges, target);
        expect(fresh).toEqual(treeSolve(c.root, c.hook, c.pose, c.keys, c.ranges, target));
        for (const seed of [fresh, { [c.keys[0]]: fresh[c.keys[0]]! + 7, [c.keys[1]]: fresh[c.keys[1]]! - 5 }, { [c.keys[0]]: 0, [c.keys[1]]: 0 }])
          expect(solve(c.root, c.hook, c.pose, c.keys, c.ranges, target, seed)).toEqual(treeSolve(c.root, c.hook, c.pose, c.keys, c.ranges, target, seed));
      }
    });
});
