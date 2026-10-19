import type { Mat2D } from "../../engine/math/mat2d";
import type { Palette } from "../../engine/rig/draw";
import { locate } from "../../engine/rig/pose";
import type { Pt } from "../../engine/rig/tree";
import { buildBack, ROBOT } from "./xbot";

export interface WeaponPart {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  mat: string;
  tone: number;
}

export interface WeaponOptions {
  palette?: Palette;
  lineW?: number;
  simple?: boolean;
  barrel?: number;
}

export type HookOptions = Omit<WeaponOptions, "palette">;

export type MatKeys = readonly [string, string, string, string, string];

export const BARREL = { x: 70, length: 196 };

export const MUZZLE: Pt = [BARREL.x + BARREL.length + 2, -40];
export const SUPPORT: Pt = [BARREL.x - 6, -10];

export const toHook = ([x, y]: Pt): Pt => [-y, x];

export const MUZZLE_IN_HOOK = toHook(MUZZLE);
export const SUPPORT_IN_HOOK = toHook(SUPPORT);

const fills = new WeakMap<WeaponPart, { key: string; fill: CanvasGradient }>();

const bandFill = (ctx: CanvasRenderingContext2D, p: WeaponPart, tones: string[], simple: boolean): CanvasGradient => {
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

interface ModelSpec {
  buildParts: (length: number) => WeaponPart[];
  mat: Record<string, MatKeys>;
  colors?: Palette;
  after?: (ctx: CanvasRenderingContext2D, length: number, simple: boolean) => void;
}

export interface WeaponModel {
  parts: WeaponPart[];
  draw: (ctx: CanvasRenderingContext2D, opts?: WeaponOptions) => void;
  hook: (ctx: CanvasRenderingContext2D, palette?: Palette, opts?: HookOptions) => void;
  slung: (ctx: CanvasRenderingContext2D, palette?: Palette, opts?: HookOptions) => void;
}

const slungAt = (): Mat2D => {
  const m = locate(buildBack(), "back", {});
  if (!m) throw new Error("missing hook back");
  return m;
};

export const createWeaponModel = ({ buildParts, mat, colors = {}, after }: ModelSpec): WeaponModel => {
  const partSets = new Map<number, WeaponPart[]>();
  const partsFor = (length: number): WeaponPart[] => {
    let parts = partSets.get(length);
    if (!parts) partSets.set(length, (parts = buildParts(length)));
    return parts;
  };

  const drawPart = (ctx: CanvasRenderingContext2D, p: WeaponPart, pal: Palette, lineW: number, simple: boolean): void => {
    const keys = mat[p.mat] as MatKeys;
    const [c0, c1, c2, c3, line] = keys.map((k) => (pal[k] ?? colors[k]) as string) as [string, string, string, string, string];
    ctx.fillStyle = bandFill(ctx, p, [c0, c1, c2, c3], simple);
    ctx.fillRect(p.x, p.y, p.w, p.h);
    if (lineW) {
      const t = ctx.getTransform();
      ctx.strokeStyle = line;
      ctx.lineWidth = lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    }
  };

  const draw: WeaponModel["draw"] = (ctx, { palette = ROBOT.palette, lineW = 1.4, simple = false, barrel = BARREL.length } = {}) => {
    for (const p of partsFor(barrel)) drawPart(ctx, p, palette, lineW, simple);
    after?.(ctx, barrel, simple);
  };

  const hook: WeaponModel["hook"] = (ctx, palette = ROBOT.palette, opts = {}) => {
    ctx.save();
    ctx.transform(0, 1, -1, 0, 0, 0);
    draw(ctx, { ...opts, palette });
    ctx.restore();
  };

  let slungMatrix: Mat2D | null = null;

  const slung: WeaponModel["slung"] = (ctx, palette = ROBOT.palette, opts = {}) => {
    const m = (slungMatrix ??= slungAt());
    ctx.save();
    ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    hook(ctx, palette, opts);
    ctx.restore();
  };

  return { parts: partsFor(BARREL.length), draw, hook, slung };
};
