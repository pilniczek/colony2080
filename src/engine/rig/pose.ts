import { apply, identity, multiply, rotate, scale, translate, type Mat2D } from "../math/mat2d";
import type { GroupNode, Pt, RigNode } from "./tree";

export interface Tint {
  brightness?: number;
  saturate?: number;
}

export type JointValue = number | { rot?: number; dx?: number; dy?: number; sx?: number; sy?: number; tint?: Tint };
export type Pose = Record<string, JointValue>;

export interface Joint {
  dx: number;
  dy: number;
  rot: number;
  sx: number;
  sy: number;
  tint?: Tint;
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

export const locate = (root: RigNode, hook: string, pose: Pose, base: Mat2D = identity()): Mat2D | null => locateFrom(root, hook, pose, base);

type Best = [number, number, number];
type Link = { m: Mat2D; key: 0 | 1 };

const SEEDED_PASSES: [number, number][] = [[12, 3], [3, 1], [1, 0.25]];
const FULL_PASSES: [number, number][] = [[4, 1], [1, 0.25]];
const FULL_STEP = 4;
const SEED_TOLERANCE = 0.5;

const hookPaths = new WeakMap<RigNode, Map<string, GroupNode[] | null>>();

const findPath = (node: RigNode, hook: string, path: GroupNode[]): GroupNode[] | null => {
  if (node.k === "hook") return node.name === hook ? path : null;
  if (node.k !== "g") return null;
  for (const kid of node.kids) {
    const found = findPath(kid, hook, [...path, node]);
    if (found) return found;
  }
  return null;
};

const hookPath = (root: RigNode, hook: string): GroupNode[] | null => {
  let paths = hookPaths.get(root);
  if (!paths) hookPaths.set(root, (paths = new Map()));
  if (!paths.has(hook)) paths.set(hook, findPath(root, hook, []));
  return paths.get(hook) ?? null;
};

const armReach = (root: RigNode, hook: string, pose: Pose, keys: [string, string]): ((a: number, b: number) => Pt) | null => {
  const path = hookPath(root, hook);
  if (!path) return null;
  const links: Link[] = [];
  let m = identity();
  for (const node of path) {
    if (node.m) m = multiply(m, node.m);
    const key = keys.indexOf(node.name ?? "");
    const pivot = node.pivot ?? [0, 0];
    if (key >= 0) {
      links.push({ m: translate(m, pivot[0], pivot[1]), key: key as 0 | 1 });
      m = translate(identity(), -pivot[0], -pivot[1]);
      continue;
    }
    const j = joint(node, pose);
    if (j) m = jointOnto(m, j);
  }
  const [tx, ty] = apply(m, [0, 0]);
  return (a, b) => {
    const ra = (a * Math.PI) / 180;
    const rb = (b * Math.PI) / 180;
    const cos = [Math.cos(ra), Math.cos(rb)];
    const sin = [Math.sin(ra), Math.sin(rb)];
    let x = tx;
    let y = ty;
    for (let i = links.length - 1; i >= 0; i--) {
      const { m: l, key } = links[i] as Link;
      const c = cos[key] as number;
      const s = sin[key] as number;
      const rx = c * x - s * y;
      const ry = s * x + c * y;
      x = l.a * rx + l.c * ry + l.e;
      y = l.b * rx + l.d * ry + l.f;
    }
    return [x, y];
  };
};

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
  const reach = armReach(root, hook, pose, keys);
  const hit = (a: number, b: number): number => {
    if (!reach) return Infinity;
    const [x, y] = reach(a, b);
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
