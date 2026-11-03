import type { Palette } from "../../engine/rig/draw";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { PALETTE } from "../env/paint";
import { CARRY, holdPoses, type HoldPoses } from "./gun";
import { createWeaponModel, toHook, type HookOptions, type MatKeys, type WeaponOptions, type WeaponPart } from "./weaponModel";

const tones = (k: string, from: string, line: string): Palette =>
  Object.fromEntries([...[0, 1, 2, 3].map((i) => [k + i, PALETTE[from + i] as string]), [k + "Line", PALETTE[line] as string]]);

const HEAT = { h0: PALETTE.hole, h1: PALETTE.hole, h2: PALETTE.hole, h3: PALETTE.hole, hLine: PALETTE.hole } as Palette;

const COLORS: Palette = {
  ...HEAT,
  ...tones("s", "m", "mLine"),
  ...tones("k", "c", "mLine"),
  ...tones("o", "a", "aLine"),
  y0: PALETTE.y0 as string,
  y1: PALETTE.y1 as string,
  y2: PALETTE.y2 as string,
  y3: PALETTE.y3 as string,
  yLine: PALETTE.yLine as string,
};

const MAT: Record<string, MatKeys> = {
  s: ["s0", "s1", "s2", "s3", "sLine"],
  k: ["k0", "k1", "k2", "k3", "kLine"],
  o: ["o0", "o1", "o2", "o3", "oLine"],
  h: ["h0", "h1", "h2", "h3", "hLine"],
  y: ["y0", "y1", "y2", "y3", "yLine"],
};

export const TOASTER_BARREL = { x: 74, length: 153 };
export const TOASTER_CYCLE = 7;
const CAP = 21;
const COIL = { first: 16, step: 19.8, w: 8 };

const buildParts = (length: number): WeaponPart[] => [
  { name: "grip", x: -18, y: -13, w: 34, h: 45, mat: "s", tone: 0 },
  { name: "body", x: -50, y: -73, w: 124, h: 63, mat: "k", tone: 1 },
  { name: "bodyTop", x: -50, y: -73, w: 124, h: 13, mat: "k", tone: 2 },
  { name: "heatSlot", x: -23, y: -81, w: 60, h: 12, mat: "h", tone: 0 },
  { name: "filament", x: -18, y: -79, w: 50, h: 5, mat: "o", tone: 2 },
  { name: "hazard", x: -37, y: -47, w: 45, h: 16, mat: "y", tone: 2 },
  { name: "barrel", x: TOASTER_BARREL.x, y: -60, w: length, h: 37, mat: "s", tone: 1 },
  ...Array.from({ length: Math.max(0, Math.floor((length - COIL.first - COIL.w) / COIL.step) + 1) }, (_, i): WeaponPart => ({
    name: "coil" + i,
    x: TOASTER_BARREL.x + COIL.first + i * COIL.step,
    y: -60,
    w: COIL.w,
    h: 37,
    mat: "o",
    tone: 1,
  })),
  { name: "cap", x: TOASTER_BARREL.x + length, y: -68, w: CAP, h: 53, mat: "k", tone: 2 },
];

const heat = (ctx: CanvasRenderingContext2D, _length: number, simple: boolean): void => {
  if (simple) return;
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = PALETTE.a2 as string;
  ctx.beginPath();
  ctx.ellipse(7, -80, 30, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const model = createWeaponModel({ buildParts, mat: MAT, colors: COLORS, after: heat });

export const TOASTER_MUZZLE: Pt = [TOASTER_BARREL.x + TOASTER_BARREL.length + CAP, -41];
const SUPPORT: Pt = [TOASTER_BARREL.x + 14, -23];
export const TOASTER_MUZZLE_IN_HOOK = toHook(TOASTER_MUZZLE);

const sized = <O extends WeaponOptions | HookOptions>(o: O = {} as O): O => ({ ...o, barrel: o.barrel ?? TOASTER_BARREL.length });

export const TOASTER_PARTS = buildParts(TOASTER_BARREL.length);
export const drawToaster = (ctx: CanvasRenderingContext2D, opts?: WeaponOptions): void => model.draw(ctx, sized(opts));
export const toasterHook = (ctx: CanvasRenderingContext2D, palette?: Palette, opts?: HookOptions): void => model.hook(ctx, palette, sized(opts));
export const toasterSlung = (ctx: CanvasRenderingContext2D, palette?: Palette, opts?: HookOptions): void => model.slung(ctx, palette, sized(opts));

export const toasterHolds = (side: GroupNode, front: GroupNode): HoldPoses => holdPoses(side, front, CARRY, toHook(SUPPORT), toHook(SUPPORT));

export const TOASTER_FRONT_BARREL = 222;
