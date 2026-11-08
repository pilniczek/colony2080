import type { Palette } from "../../engine/rig/draw";
import type { Pt } from "../../engine/rig/tree";
import { PALETTE } from "../env/paint";
import { createWeaponModel, grip, toHook, type HookOptions, type MatKeys, type WeaponOptions, type WeaponPart } from "./weaponModel";

const tones = (k: string, from: string, line: string): Palette =>
  Object.fromEntries([...[0, 1, 2, 3].map((i) => [k + i, PALETTE[from + i] as string]), [k + "Line", PALETTE[line] as string]]);

const COLORS: Palette = {
  ...tones("s", "m", "mLine"),
  ...tones("k", "c", "mLine"),
  ...tones("r", "b", "bLine"),
  ...tones("o", "a", "aLine"),
  pilotOuter: "#c8401a",
  pilotCore: "#fff1c4",
  pilotBlue: "#3f7cff",
};

const MAT: Record<string, MatKeys> = {
  s: ["s0", "s1", "s2", "s3", "sLine"],
  k: ["k0", "k1", "k2", "k3", "kLine"],
  r: ["r0", "r1", "r2", "r3", "rLine"],
  o: ["o0", "o1", "o2", "o3", "oLine"],
};

export const FLAMETHROWER_BARREL = { x: 84, length: 120 };
const NOZZLE = 30;

const buildParts = (length: number): WeaponPart[] => [
  { name: "stock", x: -100, y: -58, w: 44, h: 26, mat: "s", tone: 0 },
  grip("s", 0),
  { name: "body", x: -58, y: -62, w: 142, h: 44, mat: "s", tone: 1 },
  { name: "bodyTop", x: -58, y: -62, w: 142, h: 10, mat: "s", tone: 2 },
  { name: "tank", x: -44, y: -116, w: 112, h: 54, mat: "r", tone: 2 },
  { name: "tankBack", x: -52, y: -110, w: 10, h: 42, mat: "s", tone: 2 },
  { name: "tankFront", x: 66, y: -110, w: 10, h: 42, mat: "s", tone: 2 },
  { name: "tankBand", x: 6, y: -118, w: 10, h: 58, mat: "s", tone: 1 },
  { name: "valve", x: 74, y: -84, w: 12, h: 24, mat: "k", tone: 2 },
  { name: "barrel", x: FLAMETHROWER_BARREL.x, y: -42, w: length, h: 24, mat: "s", tone: 2 },
  { name: "nozzle", x: FLAMETHROWER_BARREL.x + length, y: -52, w: NOZZLE, h: 44, mat: "k", tone: 2 },
  { name: "igniter", x: FLAMETHROWER_BARREL.x + length + 14, y: -9, w: 20, h: 7, mat: "k", tone: 1 },
];

const PILOT: Record<"outer" | "mid" | "core" | "blue", Pt[]> = {
  outer: [[0, 3.5], [0, -3.5], [5, -8], [8, -15], [7, -23], [11, -34], [14, -25], [19, -31], [21, -19], [18, -7], [11, 3]],
  mid: [[0, 2.8], [0, -2.8], [4, -6.5], [7, -12], [7, -18], [11, -24], [13, -17], [16, -19], [16, -10], [13, -3], [8, 2.5]],
  core: [[0.5, 2], [0.5, -2], [4, -4.5], [7, -9], [10, -13], [11, -7], [9, -1], [5, 2]],
  blue: [[0, 3], [0, -3], [3.5, -4], [6.5, -2.5], [6.5, 1.5], [3.5, 3]],
};
const PILOT_TOP = -34;

const rgba = (hex: string, a: number): string => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

const pilotLayer = (ctx: CanvasRenderingContext2D, pts: Pt[], hex: string, alpha: number, fade: number): void => {
  const g = ctx.createLinearGradient(0, 4, 0, PILOT_TOP * fade);
  g.addColorStop(0, rgba(hex, alpha));
  g.addColorStop(0.55, rgba(hex, alpha * 0.85));
  g.addColorStop(1, rgba(hex, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(...pts[0]!);
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i]!;
    const [nx, ny] = pts[i + 1]!;
    ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
  }
  ctx.lineTo(...pts[pts.length - 1]!);
  ctx.closePath();
  ctx.fill();
};

const pilotFlame = (ctx: CanvasRenderingContext2D, length: number, simple: boolean, color: (key: string) => string): void => {
  ctx.save();
  ctx.translate(FLAMETHROWER_BARREL.x + length + NOZZLE + 4, -5.5);
  if (!simple) {
    const g = ctx.createRadialGradient(9, -10, 0, 9, -10, 28);
    g.addColorStop(0, rgba(color("o2"), 0.35));
    g.addColorStop(1, rgba(color("o2"), 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(9, -10, 28, 0, Math.PI * 2);
    ctx.fill();
  }
  pilotLayer(ctx, PILOT.outer, color("pilotOuter"), 0.95, 1);
  if (!simple) pilotLayer(ctx, PILOT.mid, color("o2"), 0.95, 0.75);
  pilotLayer(ctx, PILOT.core, color("pilotCore"), 1, 0.45);
  if (!simple) pilotLayer(ctx, PILOT.blue, color("pilotBlue"), 0.9, 0.15);
  ctx.restore();
};

const model = createWeaponModel({ buildParts, mat: MAT, colors: COLORS, after: pilotFlame });

const MUZZLE: Pt = [FLAMETHROWER_BARREL.x + FLAMETHROWER_BARREL.length + NOZZLE, -30];
export const FLAMETHROWER_MUZZLE_IN_HOOK = toHook(MUZZLE);

const sized = <O extends WeaponOptions | HookOptions>(o: O = {} as O): O => ({ ...o, barrel: o.barrel ?? FLAMETHROWER_BARREL.length });

export const FLAMETHROWER_COLORS = model.colors;
export const drawFlamethrower = (ctx: CanvasRenderingContext2D, opts?: WeaponOptions): void => model.draw(ctx, sized(opts));
export const flamethrowerHook = (ctx: CanvasRenderingContext2D, palette?: Palette, opts?: HookOptions): void => model.hook(ctx, palette, sized(opts));


export const FLAME_STEPS = [2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 2, 2, 2];
export const FLAME_LIFE = FLAME_STEPS.length;
