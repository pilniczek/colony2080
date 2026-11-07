import type { Palette } from "../../engine/rig/draw";
import type { Pt } from "../../engine/rig/tree";
import { PALETTE } from "../env/paint";
import type { HeroWeapon } from "./gun";
import { createWeaponModel, toHook, type HookOptions, type MatKeys, type WeaponOptions, type WeaponPart } from "./weaponModel";

const tones = (k: string, from: string, line: string): Palette =>
  Object.fromEntries([...[0, 1, 2, 3].map((i) => [k + i, PALETTE[from + i] as string]), [k + "Line", PALETTE[line] as string]]);

const COLORS: Palette = { ...tones("s", "m", "mLine"), ...tones("k", "c", "mLine"), ...tones("r", "b", "bLine"), ...tones("o", "a", "aLine") };

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
  { name: "grip", x: -16, y: -14, w: 30, h: 46, mat: "s", tone: 0 },
  { name: "body", x: -58, y: -62, w: 142, h: 44, mat: "s", tone: 1 },
  { name: "bodyTop", x: -58, y: -62, w: 142, h: 10, mat: "s", tone: 2 },
  { name: "tank", x: -44, y: -116, w: 112, h: 54, mat: "r", tone: 2 },
  { name: "tankBack", x: -52, y: -110, w: 10, h: 42, mat: "s", tone: 2 },
  { name: "tankFront", x: 66, y: -110, w: 10, h: 42, mat: "s", tone: 2 },
  { name: "tankBand", x: 6, y: -118, w: 10, h: 58, mat: "s", tone: 1 },
  { name: "valve", x: 74, y: -84, w: 12, h: 24, mat: "k", tone: 2 },
  { name: "barrel", x: FLAMETHROWER_BARREL.x, y: -52, w: length, h: 24, mat: "s", tone: 2 },
  { name: "nozzle", x: FLAMETHROWER_BARREL.x + length, y: -62, w: NOZZLE, h: 44, mat: "k", tone: 2 },
  { name: "pilot", x: FLAMETHROWER_BARREL.x + length + 4, y: -18, w: 20, h: 8, mat: "o", tone: 2 },
];

const pilotFlame = (ctx: CanvasRenderingContext2D, length: number, simple: boolean, color: (key: string) => string): void => {
  if (simple) return;
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = color("o2");
  ctx.beginPath();
  ctx.ellipse(FLAMETHROWER_BARREL.x + length + NOZZLE + 4, -14, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const model = createWeaponModel({ buildParts, mat: MAT, colors: COLORS, after: pilotFlame });

const MUZZLE: Pt = [FLAMETHROWER_BARREL.x + FLAMETHROWER_BARREL.length + NOZZLE, -40];
export const FLAMETHROWER_WEAPON: HeroWeapon = { barrel: FLAMETHROWER_BARREL, muzzle: MUZZLE, band: { y: -62, h: 44 } };
export const FLAMETHROWER_MUZZLE_IN_HOOK = toHook(MUZZLE);

const sized = <O extends WeaponOptions | HookOptions>(o: O = {} as O): O => ({ ...o, barrel: o.barrel ?? FLAMETHROWER_BARREL.length });

export const FLAMETHROWER_COLORS = model.colors;
export const drawFlamethrower = (ctx: CanvasRenderingContext2D, opts?: WeaponOptions): void => model.draw(ctx, sized(opts));
export const flamethrowerHook = (ctx: CanvasRenderingContext2D, palette?: Palette, opts?: HookOptions): void => model.hook(ctx, palette, sized(opts));
export const flamethrowerSlung = (ctx: CanvasRenderingContext2D, palette?: Palette, opts?: HookOptions): void => model.slung(ctx, palette, sized(opts));


export const FLAME_STEPS = [2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 2, 2, 2];
export const FLAME_LIFE = FLAME_STEPS.length;
