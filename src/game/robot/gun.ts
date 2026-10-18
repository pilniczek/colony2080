import { apply } from "../../engine/math/mat2d";
import type { Palette } from "../../engine/rig/draw";
import { locate, solve, type Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { ROBOT } from "./xbot";

type MatKey = "m" | "c" | "a";

interface GunPart {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  mat: MatKey;
  tone: number;
}

export interface GunOptions {
  palette?: Palette;
  lineW?: number;
  simple?: boolean;
}

type HookOptions = Omit<GunOptions, "palette">;

const BARREL = { x: 70, length: 196 };

export const GUN_PARTS: GunPart[] = [
  { name: "grip", x: -14, y: -14, w: 26, h: 56, mat: "m", tone: 1 },
  { name: "stock", x: -82, y: -64, w: 22, h: 50, mat: "m", tone: 0 },
  { name: "handle", x: -36, y: -96, w: 72, h: 18, mat: "m", tone: 1 },
  { name: "handlePost", x: -36, y: -82, w: 14, h: 16, mat: "m", tone: 1 },
  { name: "handlePostFront", x: 22, y: -82, w: 14, h: 16, mat: "m", tone: 1 },
  { name: "receiver", x: -60, y: -70, w: 130, h: 60, mat: "m", tone: 2 },
  { name: "stripe", x: -14, y: -70, w: 14, h: 60, mat: "a", tone: 1 },
  { name: "feed", x: 14, y: -12, w: 48, h: 40, mat: "m", tone: 0 },
  { name: "barrelBack", x: BARREL.x, y: -62, w: BARREL.length - 6, h: 44, mat: "m", tone: 0 },
  { name: "barrelTop", x: BARREL.x, y: -62, w: BARREL.length, h: 12, mat: "c", tone: 1 },
  { name: "barrelMid", x: BARREL.x, y: -46, w: BARREL.length, h: 12, mat: "c", tone: 2 },
  { name: "barrelLow", x: BARREL.x, y: -30, w: BARREL.length, h: 12, mat: "c", tone: 1 },
  { name: "ringRear", x: BARREL.x + 18, y: -70, w: 18, h: 60, mat: "m", tone: 0 },
  { name: "ringFront", x: BARREL.x + BARREL.length - 34, y: -68, w: 16, h: 56, mat: "m", tone: 0 },
];

const MAT: Record<MatKey, [string, string, string, string]> = {
  m: ["m0", "m1", "m2", "m3"],
  c: ["c0", "c1", "c2", "c3"],
  a: ["a0", "a1", "a2", "a3"],
};

export const MUZZLE: Pt = [BARREL.x + BARREL.length + 2, -40];
export const SUPPORT: Pt = [BARREL.x + 40, -2];

export const toHook = ([x, y]: Pt): Pt => [-y, x];

export const MUZZLE_IN_HOOK = toHook(MUZZLE);
export const SUPPORT_IN_HOOK = toHook(SUPPORT);

const drawPart = (ctx: CanvasRenderingContext2D, p: GunPart, pal: Palette, lineW: number, simple: boolean): void => {
  const tones = MAT[p.mat].map((k) => pal[k] as string);
  const tone = (i: number): string => tones[i] as string;
  ctx.fillStyle = tone(p.tone);
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = tone(Math.min(3, p.tone + 1));
  ctx.fillRect(p.x, p.y, p.w, p.h * 0.28);
  if (!simple) {
    ctx.fillStyle = tone(3);
    ctx.fillRect(p.x, p.y + p.h * 0.1, p.w, Math.max(1, p.h * 0.08));
  }
  ctx.fillStyle = tone(Math.max(0, p.tone - 1));
  ctx.fillRect(p.x, p.y + p.h * 0.74, p.w, p.h * 0.26);
  if (lineW) {
    const t = ctx.getTransform();
    ctx.strokeStyle = pal.mLine as string;
    ctx.lineWidth = lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }
};

export const drawGun = (ctx: CanvasRenderingContext2D, { palette = ROBOT.palette, lineW = 2, simple = false }: GunOptions = {}): void => {
  for (const p of GUN_PARTS) drawPart(ctx, p, palette, lineW, simple);
};

export const gunHook = (ctx: CanvasRenderingContext2D, palette: Palette = ROBOT.palette, opts: HookOptions = {}): void => {
  ctx.save();
  ctx.transform(0, 1, -1, 0, 0, 0);
  drawGun(ctx, { ...opts, palette });
  ctx.restore();
};

export const gunSlung = (ctx: CanvasRenderingContext2D, palette: Palette = ROBOT.palette, opts: HookOptions = {}): void => {
  ctx.save();
  ctx.translate(330, 236);
  ctx.rotate(-0.95);
  ctx.translate(-40, -60);
  gunHook(ctx, palette, opts);
  ctx.restore();
};

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
