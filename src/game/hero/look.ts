import { easeIn, keyed, mix, num } from "../../engine/anim/keyed";
import { apply, multiply, type Mat2D } from "../../engine/math/mat2d";
import { jointMatrix, locate, solve, type Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt, RigNode } from "../../engine/rig/tree";
import type { holdPoses } from "../robot/gun";
import { buildBack, buildFront, buildSide, ROBOT } from "../robot/xbot";
import { clipFor, type Clip, type ClipSet, type View } from "./config";
import type { Hero } from "./hero";

export type GunLook = "hand" | "slung" | "dropped" | "none";

export interface HeroLook {
  view: View;
  flip: boolean;
  pose: Pose;
  gun: GunLook;
  rot: number;
  tint: number;
  lift: number;
}

export interface Rigs {
  side: GroupNode;
  front: GroupNode;
  back: GroupNode;
  climber: GroupNode;
}

type Hold = ReturnType<typeof holdPoses>;
type Angles = Record<string, number>;

const FEET = ["heelNear", "toeNear", "heelFar", "toeFar"];
const REACH_STEPS = 10;
const ALPHA_VISIBLE = 40 / 255;

export const createRigs = (lod: boolean): Rigs => ({
  side: buildSide({ lod, farLimbs: true, propBehindArm: true }),
  front: buildFront({ lod, rightArmFirst: true, propBehindArm: true }),
  back: buildBack({ lod }),
  climber: buildBack({ lod, thumbsBehind: true, forearmsUnder: true }),
});

const step = <T>(track: [number, T][], t: number): T => {
  let value = track[0]![1];
  for (const [at, v] of track) if (at <= t) value = v;
  return value;
};

const footMax = (side: GroupNode, pose: Pose): number => {
  let m = -Infinity;
  for (const hook of FEET) {
    const mat = locate(side, hook, pose);
    if (mat) m = Math.max(m, apply(mat, [0, 0])[1]);
  }
  return m;
};

const lift = (side: GroupNode, pose: Pose): number => ROBOT.FOOT_Y - footMax(side, pose);

const lowest = (node: RigNode, pose: Pose, m: Mat2D): number => {
  if (node.k === "g") {
    let mm = node.m ? multiply(m, node.m) : m;
    const j = node.name != null ? jointMatrix(node, pose[node.name]) : null;
    if (j) mm = multiply(mm, j);
    return node.kids.reduce((y, kid) => Math.max(y, lowest(kid, pose, mm)), -Infinity);
  }
  const maxY = (pts: Pt[]): number => pts.reduce((y, p) => Math.max(y, apply(m, p)[1]), -Infinity);
  if (node.k === "part") return maxY(node.spec.pts);
  if (node.k === "flat") return maxY(node.pts);
  if (node.k === "ellipse") {
    if (node.opacity <= ALPHA_VISIBLE) return -Infinity;
    return m.b * node.cx + m.d * node.cy + m.f + Math.hypot(m.b * node.rx, m.d * node.ry);
  }
  if (node.k === "trefoil") return m.f + node.r * Math.hypot(m.b, m.d);
  return -Infinity;
};

const lyingBottoms = new WeakMap<GroupNode, Map<string, number>>();

const bottom = (side: GroupNode, pose: Pose, rot: number): number => {
  const cache = lyingBottoms.get(side) ?? new Map<string, number>();
  lyingBottoms.set(side, cache);
  const key = JSON.stringify([pose, rot]);
  let value = cache.get(key);
  if (value === undefined) {
    value = lowest(side, pose, rotationAbout(rot));
    cache.set(key, value);
  }
  return value;
};

const rotationAbout = (deg: number): Mat2D => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const [x, y] = [ROBOT.SIDE_AX, ROBOT.FOOT_Y];
  return { a: c, b: s, c: -s, d: c, e: -(c * x - s * y), f: -(s * x + c * y) };
};

const reaches = new WeakMap<GroupNode, Angles[]>();

const climbReach = (climber: GroupNode): Angles[] => {
  let table = reaches.get(climber);
  if (!table) {
    table = Array.from({ length: REACH_STEPS + 1 }, (_, i) =>
      solve(climber, "handL", {}, ["armL", "foreL"], [[90, 200], [0, 160]], [190, 110 - (150 * i) / REACH_STEPS]),
    );
    reaches.set(climber, table);
  }
  return table;
};

const climbArm = (table: Angles[], h: number): { arm: number; fore: number } => {
  const f = h * REACH_STEPS;
  const i = Math.min(REACH_STEPS - 1, Math.floor(f));
  const k = f - i;
  const a = table[i]!;
  const b = table[i + 1]!;
  return { arm: a.armL! + (b.armL! - a.armL!) * k, fore: a.foreL! + (b.foreL! - a.foreL!) * k };
};

const climbPose = (table: Angles[], hl: number): Pose => {
  const hr = 1 - hl;
  const legUp = (r: number): [Pose[string], Pose[string]] => [{ sy: 1 - 0.5 * r }, { dy: -85 * r }];
  const [thighL, shinL] = legUp(hr);
  const [thighR, shinR] = legUp(hl);
  const l = climbArm(table, hl);
  const r = climbArm(table, hr);
  return { armL: l.arm, foreL: l.fore, armR: -r.arm, foreR: -r.fore, thighL, shinL, thighR, shinR };
};

const carry = (pose: Angles, hold: Hold): Angles => {
  const b = pose.body ?? 0;
  return { ...pose, arm: hold.CARRY.arm - b, fore: hold.CARRY.fore, armFar: hold.CARRY_FAR.armFar - b, foreFar: hold.CARRY_FAR.foreFar };
};

const withCarryKey = (pose: Angles, hold: Hold): Angles => {
  if (pose.carry === undefined) return pose;
  const { carry: k, ...rest } = pose;
  return mix(rest, carry(rest, hold), k);
};

const clipTime = (clip: Clip, time: number): number =>
  clip.loop ? ((time % clip.duration) + clip.duration) % clip.duration : time;

const ladderLook = (h: Hero, clip: Clip, rigs: Rigs): HeroLook => {
  const hl = 0.5 + 0.5 * Math.sin((h.climb / (clip.travel ?? 1)) * Math.PI * 2);
  return {
    view: "back",
    flip: h.facing < 0,
    pose: climbPose(climbReach(rigs.climber), hl),
    gun: h.weapon === "gun" ? "slung" : "none",
    rot: 0,
    tint: 0,
    lift: 0,
  };
};

const armed = (view: View, pose: Angles, hold: Hold): { pose: Angles; gun: GunLook } => {
  if (view === "side") return { pose: carry(pose, hold), gun: "hand" };
  if (view === "front") return { pose: { ...pose, ...hold.FRONT_CARRY, ...hold.FRONT_CARRY_R }, gun: "hand" };
  return { pose, gun: "slung" };
};

const grounding = (h: Hero, clip: Clip, pose: Angles, rot: number, side: GroupNode): number => {
  const standing = h.onGround ? lift(side, pose) : 0;
  const lieRot = clip.rot?.[clip.rot.length - 1]?.[1] ?? 0;
  if (!lieRot) return standing;
  const k = rot / lieRot;
  return standing * (1 - k) - bottom(side, clip.pose[clip.pose.length - 1]![1], lieRot) * k;
};

export const heroLook = (h: Hero, clips: ClipSet, rigs: Rigs, hold: Hold): HeroLook => {
  const name = clipFor(h.state, h.weapon);
  const clip = clips[name];
  if (!clip) throw new Error(`clip ${name} is missing`);
  if (h.state === "ladder") return ladderLook(h, clip, rigs);
  const t = clipTime(clip, h.time);
  const view = clip.view ? step(clip.view, t) : "side";
  const sampled = withCarryKey(keyed(clip.pose, t), hold);
  const held =
    h.weapon !== "gun" ? { pose: sampled, gun: "none" as const } : clip.gun ? { pose: sampled, gun: step(clip.gun, t) } : armed(view, sampled, hold);
  const rot = clip.rot ? num(clip.rot, t, easeIn) : 0;
  return {
    view,
    flip: h.facing < 0,
    pose: held.pose,
    gun: held.gun,
    rot,
    tint: clip.tint ? num(clip.tint, t, (k) => k) : 0,
    lift: grounding(h, clip, held.pose, rot, rigs.side),
  };
};
