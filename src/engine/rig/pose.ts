import { apply, identity, multiply, rotate, scale, translate, type Mat2D } from "../math/mat2d";
import type { GroupNode, Pt, RigNode } from "./tree";

export type JointValue = number | { rot?: number; dx?: number; dy?: number; sx?: number; sy?: number };
export type Pose = Record<string, JointValue>;

export interface Joint {
  dx: number;
  dy: number;
  rot: number;
  sx: number;
  sy: number;
  pivot: Pt;
}

export const joint = (node: GroupNode, pose: Pose): Joint | null => {
  if (node.name == null) return null;
  const v = pose[node.name];
  if (!v) return null;
  const pivot = node.pivot ?? [0, 0];
  if (typeof v === "number") return { dx: 0, dy: 0, rot: v, sx: 1, sy: 1, pivot };
  return { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, ...v, pivot };
};

const jointOnto = (m: Mat2D, j: Joint): Mat2D =>
  translate(scale(rotate(translate(m, j.dx + j.pivot[0], j.dy + j.pivot[1]), j.rot), j.sx, j.sy), -j.pivot[0], -j.pivot[1]);

export const jointMatrix = (node: GroupNode, v: JointValue | undefined): Mat2D | null => {
  const j = node.name != null && v !== undefined ? joint(node, { [node.name]: v }) : null;
  return j ? jointOnto(identity(), j) : null;
};

const locateFrom = (node: RigNode, name: string, pose: Pose, m: Mat2D): Mat2D | null => {
  if (node.k === "hook") return node.name === name ? m : null;
  if (node.k !== "g") return null;
  let mm = node.m ? multiply(m, node.m) : m;
  const j = joint(node, pose);
  if (j) mm = jointOnto(mm, j);
  for (const kid of node.kids) {
    const r = locateFrom(kid, name, pose, mm);
    if (r) return r;
  }
  return null;
};

export const locate = (root: RigNode, hook: string, pose: Pose): Mat2D | null => locateFrom(root, hook, pose, identity());

type Best = [number, number, number];

const SEEDED_PASSES: [number, number][] = [[12, 3], [3, 1], [1, 0.25]];
const FULL_PASSES: [number, number][] = [[4, 1], [1, 0.25]];
const FULL_STEP = 4;
const SEED_TOLERANCE = 0.5;

export const solve = (
  root: RigNode,
  hook: string,
  pose: Pose,
  keys: [string, string],
  ranges: [[number, number], [number, number]],
  target: Pt,
  seed: Record<string, number> | null = null,
): Record<string, number> => {
  const [ka, kb] = keys;
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
    for (let a = ranges[0][0]; a <= ranges[0][1]; a += FULL_STEP)
      for (let b = ranges[1][0]; b <= ranges[1][1]; b += FULL_STEP) {
        const d = hit(a, b);
        if (d < best[0]) best = [d, a, b];
      }
    return refine(best, FULL_PASSES);
  };
  const seeded = (s: Record<string, number>): Best => {
    const a = s[ka] ?? 0;
    const b = s[kb] ?? 0;
    return refine([hit(a, b), a, b], SEEDED_PASSES);
  };
  let best = seed ? seeded(seed) : null;
  if (!best || best[0] > SEED_TOLERANCE) best = full();
  return { [ka]: best[1], [kb]: best[2] };
};
