import type { Palette } from "../../engine/rig/draw";
import type { Pt } from "../../engine/rig/tree";
import { ROBOT } from "./xbot";

export interface WeaponPart {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  mat: string;
  tone: number;
  pts?: readonly Pt[];
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
export const SUPPORT: Pt = [BARREL.x + 14, -10];

export const WEAPON_GRIP: readonly Pt[] = [[14, -14], [-16, -14], [-34, 52], [-6, 52]];

export const grip = (mat: string, tone: number): WeaponPart => {
  const xs = WEAPON_GRIP.map(([x]) => x);
  const ys = WEAPON_GRIP.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { name: "grip", x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y, pts: WEAPON_GRIP, mat, tone };
};

export const toHook = ([x, y]: Pt): Pt => [-y, x];

export const MUZZLE_IN_HOOK = toHook(MUZZLE);
export const SUPPORT_IN_HOOK = toHook(SUPPORT);

const FILLS_KEPT = 8;

const fills = new WeakMap<WeaponPart, Map<string, CanvasGradient>>();

const bandFill = (ctx: CanvasRenderingContext2D, p: WeaponPart, tones: string[], simple: boolean): CanvasGradient => {
  const key = tones.join() + simple;
  let held = fills.get(p);
  if (!held) fills.set(p, (held = new Map()));
  const hit = held.get(key);
  if (hit) return hit;
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
  if (held.size >= FILLS_KEPT) held.clear();
  held.set(key, fill);
  return fill;
};

interface ModelSpec {
  buildParts: (length: number) => WeaponPart[];
  mat: Record<string, MatKeys>;
  colors?: Palette;
  after?: (ctx: CanvasRenderingContext2D, length: number, simple: boolean, color: (key: string) => string) => void;
}

export interface WeaponModel {
  parts: WeaponPart[];
  colors: Palette;
  draw: (ctx: CanvasRenderingContext2D, opts?: WeaponOptions) => void;
  hook: (ctx: CanvasRenderingContext2D, palette?: Palette, opts?: HookOptions) => void;
}

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
    if (p.pts) {
      ctx.beginPath();
      p.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
    } else ctx.fillRect(p.x, p.y, p.w, p.h);
    if (lineW) {
      const t = ctx.getTransform();
      ctx.strokeStyle = line;
      ctx.lineWidth = lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
      if (p.pts) ctx.stroke();
      else ctx.strokeRect(p.x, p.y, p.w, p.h);
    }
  };

  const draw: WeaponModel["draw"] = (ctx, { palette = ROBOT.palette, lineW = 1.4, simple = false, barrel = BARREL.length } = {}) => {
    for (const p of partsFor(barrel)) drawPart(ctx, p, palette, lineW, simple);
    after?.(ctx, barrel, simple, (k) => (palette[k] ?? colors[k]) as string);
  };

  const hook: WeaponModel["hook"] = (ctx, palette = ROBOT.palette, opts = {}) => {
    ctx.save();
    ctx.transform(0, 1, -1, 0, 0, 0);
    draw(ctx, { ...opts, palette });
    ctx.restore();
  };

  return { parts: partsFor(BARREL.length), colors, draw, hook };
};
