import { apply, type Mat2D } from "../../engine/math/mat2d";
import { locate, solve, type Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { BARREL, createWeaponModel, MUZZLE, MUZZLE_IN_HOOK, SUPPORT, SUPPORT_IN_HOOK, toHook, type WeaponPart } from "./weaponModel";
import { SIDE_FORE_TURN } from "./xbot";

export type { WeaponOptions as GunOptions } from "./weaponModel";

const buildParts = (length: number): WeaponPart[] => [
  { name: "grip", x: -14, y: -14, w: 26, h: 56, mat: "m", tone: 1 },
  { name: "stock", x: -82, y: -64, w: 22, h: 50, mat: "m", tone: 0 },
  { name: "handle", x: -36, y: -96, w: 72, h: 18, mat: "m", tone: 1 },
  { name: "handlePost", x: -36, y: -82, w: 14, h: 16, mat: "m", tone: 1 },
  { name: "handlePostFront", x: 22, y: -82, w: 14, h: 16, mat: "m", tone: 1 },
  { name: "receiver", x: -60, y: -70, w: 130, h: 60, mat: "m", tone: 2 },
  { name: "stripe", x: -14, y: -70, w: 14, h: 60, mat: "a", tone: 1 },
  { name: "feed", x: 14, y: -12, w: 48, h: 40, mat: "m", tone: 0 },
  { name: "barrelBack", x: BARREL.x, y: -62, w: length - 6, h: 44, mat: "m", tone: 0 },
  { name: "barrelTop", x: BARREL.x, y: -62, w: length, h: 12, mat: "c", tone: 1 },
  { name: "barrelMid", x: BARREL.x, y: -46, w: length, h: 12, mat: "c", tone: 2 },
  { name: "barrelLow", x: BARREL.x, y: -30, w: length, h: 12, mat: "c", tone: 1 },
  { name: "ringRear", x: BARREL.x + 18, y: -70, w: 18, h: 60, mat: "m", tone: 0 },
  { name: "ringFront", x: BARREL.x + length - 34, y: -68, w: 16, h: 56, mat: "m", tone: 0 },
];

const MAT = {
  m: ["m0", "m1", "m2", "m3", "mLine"],
  c: ["c0", "c1", "c2", "c3", "mLine"],
  a: ["a0", "a1", "a2", "a3", "aLine"],
} as const;

const model = createWeaponModel({ buildParts, mat: MAT });

export const GUN_PARTS = model.parts;
export { MUZZLE, MUZZLE_IN_HOOK, SUPPORT, SUPPORT_IN_HOOK, toHook };
export const drawGun = model.draw;
export const gunHook = model.hook;

export const CARRY = { arm: 22, fore: -94 };
export const FRONT_CARRY = { armL: 0, foreL: -90 };
const FRONT_REACH = [40, 140] as const;
const FRONT_SUPPORT: Pt = [164, -20];
const BOTH_ARMS = { grip: [0, 60], support: [0, 90] } as const;

export interface HoldPoses {
  CARRY: typeof CARRY;
  CARRY_FAR: { armFar: number; foreFar: number; supportFar: number };
  FRONT_CARRY: { armL: number; foreL: number };
  FRONT_CARRY_R: { armR: number; foreR: number; supportR?: number };
}

const gripTarget = (root: GroupNode, hook: string, pose: Pose, support: Pt): Pt => {
  const m = locate(root, hook, pose);
  if (!m) throw new Error(`missing hook ${hook}`);
  return apply(m, support);
};

const frontGrip = (front: GroupNode, gripX: number): { armR: number; foreR: number } => {
  const m = locate(front, "handL", FRONT_CARRY);
  if (!m) throw new Error("missing hook handL");
  const det = m.a * m.d - m.b * m.c;
  const miss = (fore: number): number => {
    const h = locate(front, "handR", { ...FRONT_CARRY, armR: 0, foreR: fore });
    if (!h) throw new Error("missing hook handR");
    return Math.abs((m.d * (h.e - m.e) - m.c * (h.f - m.f)) / det - gripX);
  };
  let coarse: number = FRONT_REACH[0];
  for (let f = FRONT_REACH[0]; f <= FRONT_REACH[1]; f++) if (miss(f) < miss(coarse)) coarse = f;
  let best = coarse;
  for (let i = -20; i <= 20; i++) if (miss(coarse + i / 20) < miss(best)) best = coarse + i / 20;
  return { armR: 0, foreR: best };
};

const hookAt = (root: GroupNode, hook: string, pose: Pose): Mat2D => {
  const m = locate(root, hook, pose);
  if (!m) throw new Error(`missing hook ${hook}`);
  return m;
};

const bothArms = (front: GroupNode): Pick<HoldPoses, "FRONT_CARRY" | "FRONT_CARRY_R"> => {
  const poseOf = (a: number, t: number): Record<string, number> => ({ armL: -a, foreL: -90 + a, armR: t, supportR: -t });
  const fit = (a: number): { t: number; miss: number } => {
    const [px, py] = apply(hookAt(front, "handL", poseOf(a, 0)), toHook(FRONT_SUPPORT));
    const at = (t: number): Mat2D => hookAt(front, "support", poseOf(a, t));
    let lo: number = BOTH_ARMS.support[0];
    let hi: number = BOTH_ARMS.support[1];
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (at(mid).e > px) lo = mid;
      else hi = mid;
    }
    const m = at(lo);
    return { t: lo, miss: Math.hypot(m.e - px, m.f - py) };
  };
  const scan = (from: number, to: number, step: number): { a: number; t: number; miss: number } => {
    let best = { a: from, ...fit(from) };
    for (let a = from + step; a <= to; a += step) {
      const f = fit(a);
      if (f.miss < best.miss) best = { a, ...f };
    }
    return best;
  };
  const coarse = scan(BOTH_ARMS.grip[0], BOTH_ARMS.grip[1], 1);
  const best = scan(coarse.a - 1, coarse.a + 1, 0.05);
  return { FRONT_CARRY: { armL: -best.a, foreL: -90 + best.a }, FRONT_CARRY_R: { armR: best.t, foreR: 0, supportR: -best.t } };
};

export const holdPoses = (side: GroupNode, front: GroupNode, carry = CARRY, support = SUPPORT_IN_HOOK, frontSupport = SUPPORT_IN_HOOK): HoldPoses => {
  const far = solve(side, "handFar", carry, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], gripTarget(side, "hand", carry, support));
  const armFar = far.armFar as number;
  const foreFar = far.foreFar as number;
  return {
    CARRY: carry,
    CARRY_FAR: { armFar, foreFar, supportFar: SIDE_FORE_TURN - armFar - foreFar },
    ...(locate(front, "support", {}) ? bothArms(front) : { FRONT_CARRY, FRONT_CARRY_R: frontGrip(front, frontSupport[0]) }),
  };
};
