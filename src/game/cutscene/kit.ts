import { sampleTrack, type TrackKey } from "../../engine/anim/keyed";
import { apply, identity, multiply, rotate, scale, translate, type Mat2D } from "../../engine/math/mat2d";
import { drawRig, type DrawOptions } from "../../engine/rig/draw";
import { joint, locate, type Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt, RigNode } from "../../engine/rig/tree";
import { drawAsset, PALETTE, type EnvAsset, type EnvPalette } from "../env/paint";
import { ROBOT } from "../robot/xbot";
import type { Cutscene, CutsceneId } from "./index";

export interface FilmConfig {
  camera: string;
  duration: number;
}

type Ctx = CanvasRenderingContext2D;

export const LINE_W = 1.4;
const FULL_LINE_PX = 500;
export const RAD = Math.PI / 180;
export const ORIGIN: Pt = [0, 0];
export const STAND: Record<string, number> = { hipNear: 0, kneeNear: 2, ankleNear: -1.4, hipFar: 0, kneeFar: 2, ankleFar: -1.4 };

export const placeholder = (id: CutsceneId, config: FilmConfig): Cutscene => ({
  id,
  duration: config.duration,
  camera: config.camera,
  render(ctx, w, h) {
    ctx.fillStyle = "#101418";
    ctx.fillRect(0, 0, w, h);
  },
});

export const tracks = (keys: unknown) => {
  const all = keys as Record<string, TrackKey[]>;
  return {
    num: (name: string, t: number): number => sampleTrack(all[name]!, t) as number,
    text: (name: string, t: number): string => String(sampleTrack(all[name]!, t)),
  };
};

export const unitScale = (c: Ctx): number => {
  const m = c.getTransform();
  return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
};

export const lineFor = (c: Ctx, k: number, len = ROBOT.FOOT_Y): number => {
  const robotPx = unitScale(c) * k * len;
  return Math.min(LINE_W, Math.max(ROBOT.gameLine, (LINE_W * robotPx) / FULL_LINE_PX));
};

export function rect(c: Ctx, x: number, y: number, w: number, h: number, color: string | CanvasGradient): void {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

function trace(c: Ctx, pts: readonly Pt[]): void {
  c.beginPath();
  c.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i]![0], pts[i]![1]);
}

export function poly(c: Ctx, pts: readonly Pt[], color: string): void {
  c.fillStyle = color;
  trace(c, pts);
  c.closePath();
  c.fill();
}

export function stroke(c: Ctx, pts: readonly Pt[], color: string, width: number): void {
  c.strokeStyle = color;
  c.lineWidth = width;
  trace(c, pts);
  c.stroke();
}

export function oval(c: Ctx, x: number, y: number, rx: number, ry: number, color: string, rot = 0): void {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  c.fill();
}

export function shadow(c: Ctx, x: number, y: number, rx: number, ry: number, alpha: number, color: string, rot = 0): void {
  c.globalAlpha = alpha;
  oval(c, x, y, rx, ry, color, rot);
  c.globalAlpha = 1;
}

export function cloud(c: Ctx, x: number, y: number, w: number, h: number, alpha: number, lit: string, color: string): void {
  c.globalAlpha = alpha;
  oval(c, x + w * 0.08, y + h * 0.35, w * 0.5, h * 0.6, lit);
  c.globalAlpha = 1;
  oval(c, x, y, w * 0.5, h * 0.5, color);
  oval(c, x - w * 0.22, y - h * 0.3, w * 0.28, h * 0.45, color);
}

export function pool(c: Ctx, x: number, y: number, rx: number, ry: number, color: string, alpha: number): void {
  c.save();
  c.translate(x, y);
  c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.globalAlpha = alpha;
  c.fillStyle = g;
  c.fillRect(-rx, -rx, 2 * rx, 2 * rx);
  c.restore();
}

export const random = (seed: number): (() => number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

export type Spot = [number, number, number, number];

export function scatter(r: () => number, n: number, x0: number, y0: number, w: number, h: number): Spot[] {
  const pts: Spot[] = [];
  for (let i = 0; i < n; i++) pts.push([x0 + r() * w, y0 + r() * h, r(), r()]);
  return pts;
}

export function bank(seed: number, n: number, x0: number, span: number, top: number, depth: number, w0: number, wSpan: number, h0: number, hSpan: number): Spot[] {
  let s = seed;
  const rnd = (): number => (s = (s * 16807) % 2147483647) / 2147483647;
  const list: Spot[] = [];
  for (let i = 0; i < n; i++) list.push([x0 + rnd() * span, top + rnd() * depth, w0 + rnd() * wSpan, h0 + rnd() * hSpan]);
  return list;
}

export function fitStage(c: Ctx, w: number, h: number, W: number, H: number): number {
  c.fillStyle = "#000";
  c.fillRect(0, 0, w, h);
  const s = Math.min(w / W, h / H);
  c.translate((w - W * s) / 2, (h - H * s) / 2);
  c.scale(s, s);
  c.beginPath();
  c.rect(0, 0, W, H);
  c.clip();
  return s;
}

export function camera(c: Ctx, W: number, H: number, x: number, y: number, z: number): void {
  c.translate(W / 2 - x * z, H / 2 - y * z);
  c.scale(z, z);
}

export function feet(c: Ctx, x: number, y: number, sx: number, sy: number, ax: number, rot = 0): void {
  c.translate(x, y);
  if (rot) c.rotate(rot);
  c.scale(sx, sy);
  c.translate(-ax, -ROBOT.FOOT_Y);
}

export function placeRobot(c: Ctx, root: GroupNode, m: DOMMatrix, opts: Omit<DrawOptions, "palette"> & Partial<Pick<DrawOptions, "palette">>): void {
  c.save();
  c.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  drawRig(c, root, { palette: ROBOT.palette, ...opts });
  c.restore();
}

const scene = (draw: (c: Ctx) => void): EnvAsset => ({ id: "scene", box: [0, 0, 0, 0], draw: (c) => draw(c) });

export function layer(c: Ctx, t: number, draw: (c: Ctx) => void, lines: number, palette: EnvPalette = PALETTE): void {
  drawAsset(c, scene(draw), { t, lines, palette });
}

export const recolor = (color: string): EnvPalette => Object.fromEntries(Object.keys(PALETTE).map((k) => [k, color]));

export const fromDom = ({ a, b, c, d, e, f }: DOMMatrix): Mat2D => ({ a, b, c, d, e, f });

export const hookAt = (root: GroupNode, hook: string, pose: Pose, base?: Mat2D): Mat2D => {
  const m = locate(root, hook, pose, base);
  if (!m) throw new Error(`no ${hook} hook`);
  return m;
};

export const toModel = (m: DOMMatrix, [x, y]: Pt): Pt => {
  const p = m.inverse().transformPoint(new DOMPoint(x, y));
  return [p.x, p.y];
};

export interface ArmChain {
  h: Pt;
  s: Pt;
  e: Pt;
}

const circleCenter = (a: Pt, b: Pt, c: Pt): Pt => {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const q = (p: Pt): number => p[0] * p[0] + p[1] * p[1];
  return [
    (q(a) * (b[1] - c[1]) + q(b) * (c[1] - a[1]) + q(c) * (a[1] - b[1])) / d,
    (q(a) * (c[0] - b[0]) + q(b) * (a[0] - c[0]) + q(c) * (b[0] - a[0])) / d,
  ];
};

const chains = new Map<GroupNode, Record<string, ArmChain>>();

export function armChain(root: GroupNode, hook: string, keys: [string, string], stand: Pose = STAND): ArmChain {
  const key = `${keys[0]} ${hook}`;
  const known = chains.get(root)?.[key];
  if (known) return known;
  const hand = (a: number, b: number): Pt => apply(hookAt(root, hook, { ...stand, [keys[0]]: a, [keys[1]]: b }), ORIGIN);
  const h = hand(0, 0);
  const chain = { h, s: circleCenter(h, hand(60, 0), hand(-60, 0)), e: circleCenter(h, hand(0, 60), hand(0, -60)) };
  chains.set(root, { ...chains.get(root), [key]: chain });
  return chain;
}

const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

export function reach(root: GroupNode, hook: string, keys: [string, string], target: Pt, bend: number, stand: Pose = STAND): Record<string, number> {
  const { h, s, e } = armChain(root, hook, keys, stand);
  const l1 = Math.hypot(e[0] - s[0], e[1] - s[1]);
  const l2 = Math.hypot(h[0] - e[0], h[1] - e[1]);
  const d = Math.min(l1 + l2 - 1, Math.max(Math.abs(l1 - l2) + 1, Math.hypot(target[0] - s[0], target[1] - s[1])));
  const rest = Math.atan2(e[1] - s[1], e[0] - s[0]);
  const bent = Math.atan2(h[1] - e[1], h[0] - e[0]) - rest;
  const upper = Math.atan2(target[1] - s[1], target[0] - s[0]) + bend * Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const elbow: Pt = [s[0] + l1 * Math.cos(upper), s[1] + l1 * Math.sin(upper)];
  const lower = Math.atan2(target[1] - elbow[1], target[0] - elbow[0]);
  return { [keys[0]]: wrap(upper - rest) / RAD, [keys[1]]: wrap(lower - upper - bent) / RAD };
}

export type StillLayer = (c: Ctx, parts: readonly (number | string)[], draw: (c: Ctx) => void) => void;

export function stillLayer(): StillLayer {
  const held: { key: string; canvas: HTMLCanvasElement | null } = { key: "", canvas: null };
  return (c, parts, draw) => {
    const m = c.getTransform();
    const key = [c.canvas.width, c.canvas.height, m.a, m.b, m.c, m.d, m.e, m.f, ...parts].join(" ");
    if (held.key !== key) {
      held.key = key;
      held.canvas = null;
      draw(c);
      return;
    }
    if (!held.canvas) {
      const canvas = document.createElement("canvas");
      canvas.width = c.canvas.width;
      canvas.height = c.canvas.height;
      const cc = canvas.getContext("2d")!;
      cc.setTransform(m);
      draw(cc);
      held.canvas = canvas;
    }
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(held.canvas, 0, 0);
    c.restore();
  };
}

const solvePaths = new Map<GroupNode, Record<string, GroupNode[]>>();

function hookPath(root: GroupNode, hook: string): GroupNode[] {
  const known = solvePaths.get(root)?.[hook];
  if (known) return known;
  const walk = (node: RigNode, path: GroupNode[]): GroupNode[] | null => {
    if (node.k === "hook") return node.name === hook ? path : null;
    if (node.k !== "g") return null;
    for (const kid of node.kids) {
      const found = walk(kid, [...path, node]);
      if (found) return found;
    }
    return null;
  };
  const path = walk(root, []);
  if (!path) throw new Error(`no ${hook} hook`);
  solvePaths.set(root, { ...solvePaths.get(root), [hook]: path });
  return path;
}

const SOLVE_SEEDED: [number, number][] = [[12, 3], [3, 1], [1, 0.25]];
const SOLVE_FULL: [number, number][] = [[4, 1], [1, 0.25]];

type Best = [number, number, number];

export function fastSolve(
  root: GroupNode,
  hook: string,
  pose: Pose,
  keys: [string, string],
  ranges: [[number, number], [number, number]],
  target: Pt,
  seed: Record<string, number> | null = null,
): Record<string, number> {
  const links: Record<string, Mat2D> = {};
  let m = identity();
  for (const node of hookPath(root, hook)) {
    if (node.m) m = multiply(m, node.m);
    const pivot = node.pivot ?? ORIGIN;
    if (node.name === keys[0] || node.name === keys[1]) {
      links[node.name] = translate(m, pivot[0], pivot[1]);
      m = translate(identity(), -pivot[0], -pivot[1]);
      continue;
    }
    const j = joint(node, pose);
    if (j) m = translate(scale(rotate(translate(m, j.dx + pivot[0], j.dy + pivot[1]), j.rot), j.sx, j.sy), -pivot[0], -pivot[1]);
  }
  const outer = links[keys[0]]!;
  const inner = links[keys[1]]!;
  const [tx, ty] = apply(m, ORIGIN);
  const hit = (a: number, b: number): number => {
    const cb = Math.cos(b * RAD), sb = Math.sin(b * RAD), ca = Math.cos(a * RAD), sa = Math.sin(a * RAD);
    const x1 = tx * cb - ty * sb, y1 = tx * sb + ty * cb;
    const x2 = inner.a * x1 + inner.c * y1 + inner.e, y2 = inner.b * x1 + inner.d * y1 + inner.f;
    const x3 = x2 * ca - y2 * sa, y3 = x2 * sa + y2 * ca;
    return Math.hypot(outer.a * x3 + outer.c * y3 + outer.e - target[0], outer.b * x3 + outer.d * y3 + outer.f - target[1]);
  };
  const refine = (start: Best, passes: [number, number][]): Best => {
    let best = start;
    for (const [range, step] of passes) {
      const [, a0, b0] = best;
      for (let a = a0 - range; a <= a0 + range; a += step)
        for (let b = b0 - range; b <= b0 + range; b += step) {
          const d = hit(a, b);
          if (d < best[0]) best = [d, a, b];
        }
    }
    return best;
  };
  const full = (): Best => {
    let best: Best = [Infinity, 0, 0];
    for (let a = ranges[0][0]; a <= ranges[0][1]; a += 4)
      for (let b = ranges[1][0]; b <= ranges[1][1]; b += 4) {
        const d = hit(a, b);
        if (d < best[0]) best = [d, a, b];
      }
    return refine(best, SOLVE_FULL);
  };
  const a0 = seed?.[keys[0]] ?? 0;
  const b0 = seed?.[keys[1]] ?? 0;
  let best = seed ? refine([hit(a0, b0), a0, b0], SOLVE_SEEDED) : null;
  if (!best || best[0] > 0.5) best = full();
  return { [keys[0]]: best[1], [keys[1]]: best[2] };
}

const rowStrip: { canvas: HTMLCanvasElement | null } = { canvas: null };

export function rowFill(c: Ctx, draw: (c: Ctx) => void): void {
  const m = c.getTransform();
  const w = c.canvas.width;
  const h = c.canvas.height;
  rowStrip.canvas ??= document.createElement("canvas");
  const strip = rowStrip.canvas;
  strip.width = 1;
  strip.height = h;
  const g = strip.getContext("2d")!;
  g.setTransform(m.a, 0, 0, m.d, m.e - Math.floor(w / 2), m.f);
  draw(g);
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(strip, 0, 0, w, h);
  c.restore();
}

const sheets = new Map<string, HTMLCanvasElement>();

export function sheetDraw(c: Ctx, slot: string, draw: (c: Ctx) => void): HTMLCanvasElement {
  let canvas = sheets.get(slot);
  if (!canvas) {
    canvas = document.createElement("canvas");
    sheets.set(slot, canvas);
  }
  if (canvas.width !== c.canvas.width || canvas.height !== c.canvas.height) {
    canvas.width = c.canvas.width;
    canvas.height = c.canvas.height;
  }
  const s = canvas.getContext("2d")!;
  s.clearRect(0, 0, canvas.width, canvas.height);
  s.save();
  s.setTransform(c.getTransform());
  draw(s);
  s.restore();
  return canvas;
}

export function sheetBlit(c: Ctx, canvas: HTMLCanvasElement): void {
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(canvas, 0, 0);
  c.restore();
}
