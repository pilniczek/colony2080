import { apply } from "../../engine/math/mat2d";
import { drawRig, type Palette } from "../../engine/rig/draw";
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
  barrel?: number;
}

type HookOptions = Omit<GunOptions, "palette">;

const BARREL = { x: 70, length: 196 };

const buildParts = (length: number): GunPart[] => [
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

const partSets = new Map<number, GunPart[]>();

const partsFor = (length: number): GunPart[] => {
  let parts = partSets.get(length);
  if (!parts) partSets.set(length, (parts = buildParts(length)));
  return parts;
};

export const GUN_PARTS = partsFor(BARREL.length);

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

const fills = new WeakMap<GunPart, { key: string; fill: CanvasGradient }>();

const bandFill = (ctx: CanvasRenderingContext2D, p: GunPart, tones: string[], simple: boolean): CanvasGradient => {
  const key = tones.join() + simple;
  const hit = fills.get(p);
  if (hit && hit.key === key) return hit.fill;
  const tone = (i: number): string => tones[i] as string;
  const top = tone(Math.min(3, p.tone + 1));
  const mid = tone(p.tone);
  const low = tone(Math.max(0, p.tone - 1));
  const shine = 0.1 + Math.max(1 / p.h, 0.08);
  const stops: [number, string][] = simple
    ? [[0, top], [0.28, top], [0.28, mid], [0.74, mid], [0.74, low], [1, low]]
    : [[0, top], [0.1, top], [0.1, tone(3)], [shine, tone(3)], [shine, top], [0.28, top], [0.28, mid], [0.74, mid], [0.74, low], [1, low]];
  const fill = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
  for (const [at, color] of stops) fill.addColorStop(at, color);
  fills.set(p, { key, fill });
  return fill;
};

const drawPart = (ctx: CanvasRenderingContext2D, p: GunPart, pal: Palette, lineW: number, simple: boolean): void => {
  const tones = MAT[p.mat].map((k) => pal[k] as string);
  ctx.fillStyle = bandFill(ctx, p, tones, simple);
  ctx.fillRect(p.x, p.y, p.w, p.h);
  if (lineW) {
    const t = ctx.getTransform();
    ctx.strokeStyle = pal.mLine as string;
    ctx.lineWidth = lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }
};

export const drawGun = (ctx: CanvasRenderingContext2D, { palette = ROBOT.palette, lineW = 2, simple = false, barrel = BARREL.length }: GunOptions = {}): void => {
  for (const p of partsFor(barrel)) drawPart(ctx, p, palette, lineW, simple);
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

export const FRONT_BARREL = 270;

const BAND = GUN_PARTS.find((p) => p.name === "barrelBack") as GunPart;
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
