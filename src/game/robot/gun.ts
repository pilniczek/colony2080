import { apply } from "../../engine/math/mat2d";
import { drawRig } from "../../engine/rig/draw";
import { locate, solve, type Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { BARREL, createWeaponModel, MUZZLE, MUZZLE_IN_HOOK, SUPPORT, SUPPORT_IN_HOOK, toHook, type WeaponPart } from "./weaponModel";
import { ROBOT } from "./xbot";

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
export const gunSlung = model.slung;

export const CARRY = { arm: 0, fore: -72 };
export const FRONT_CARRY = { armL: -24, foreL: -66 };

interface HoldPoses {
  CARRY: typeof CARRY;
  CARRY_FAR: { armFar: number; foreFar: number };
  FRONT_CARRY: typeof FRONT_CARRY;
  FRONT_CARRY_R: { armR: number; foreR: number };
}

const gripTarget = (root: GroupNode, hook: string, pose: Pose): Pt => {
  const m = locate(root, hook, pose);
  if (!m) throw new Error(`missing hook ${hook}`);
  return apply(m, SUPPORT_IN_HOOK);
};

export const holdPoses = (side: GroupNode, front: GroupNode): HoldPoses => {
  const far = solve(side, "handFar", CARRY, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], gripTarget(side, "hand", CARRY));
  const right = solve(front, "handR", FRONT_CARRY, ["armR", "foreR"], [[-40, 120], [-60, 150]], gripTarget(front, "handL", FRONT_CARRY));
  return {
    CARRY,
    CARRY_FAR: { armFar: far.armFar as number, foreFar: far.foreFar as number },
    FRONT_CARRY,
    FRONT_CARRY_R: { armR: right.armR as number, foreR: right.foreR as number },
  };
};

export const FRONT_BARREL = 226;

const BAND = GUN_PARTS.find((p) => p.name === "barrelBack") as WeaponPart;
const SCAN = { x: -600, w: 1600 };

const silhouetteEdge = (robot: GroupNode, pose: Pose, hook: string): number => {
  const m = locate(robot, hook, pose);
  if (!m) throw new Error(`missing hook ${hook}`);
  const canvas = document.createElement("canvas");
  canvas.width = SCAN.w;
  canvas.height = BAND.h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("no 2d context");
  const toGun = new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]).multiply(new DOMMatrix([0, 1, -1, 0, 0, 0])).inverse();
  ctx.setTransform(new DOMMatrix().translate(-SCAN.x, -BAND.y).multiply(toGun));
  drawRig(ctx, robot, { palette: ROBOT.palette, pose, lineW: 0 });
  const { data } = ctx.getImageData(0, 0, SCAN.w, BAND.h);
  let edge = -Infinity;
  for (let i = 3; i < data.length; i += 4) if (data[i]) edge = Math.max(edge, (i >> 2) % SCAN.w);
  return edge + SCAN.x;
};

export const barrelFor = (robot: GroupNode, pose: Pose, hook: string): number => {
  const clear = silhouetteEdge(robot, pose, hook) + BAND.h;
  return Math.max(BARREL.length, Math.ceil(BARREL.length + clear - MUZZLE[0]));
};
