import { P, TILE, type EnvAsset, type Size } from "./paint";

const { box, flat, poly, cylV, disc, rivets, mesh, glow, text, stroke } = P;

type Pt = [number, number];

export const dots = (ctx: CanvasRenderingContext2D, pts: Pt[], color: string): void => {
  if (P.simple()) return;
  for (const [x, y] of pts) flat(ctx, x - 0.75, y - 0.75, 1.5, 1.5, color);
};

export const column = (x: number, y0: number, y1: number, step: number): Pt[] => {
  const pts: Pt[] = [];
  for (let y = y0 + step / 2; y < y1; y += step) pts.push([x, y]);
  return pts;
};

export const bar = (ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, w: number, mat: string, tone = 1): void => {
  const len = Math.hypot(bx - ax, by - ay);
  const nx = ((-(by - ay) / len) * w) / 2;
  const ny = (((bx - ax) / len) * w) / 2;
  poly(ctx, [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]], mat, tone, { dir: [1, 0] });
};

const chamfer = (x: number, y: number, w: number, h: number, c: number): Pt[] => [
  [x + c, y], [x + w - c, y], [x + w, y + c], [x + w, y + h - c], [x + w - c, y + h], [x + c, y + h], [x, y + h - c], [x, y + c],
];

export const wire = (ctx: CanvasRenderingContext2D, pts: Pt[], color: string, k = 1.4): void => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.lineCap = "round";
  stroke(ctx, "rLine", k + 1.4);
  stroke(ctx, color, k);
};

const walkway = (ctx: CanvasRenderingContext2D, x: number, w: number): void => {
  box(ctx, x, 0, w, 24, "rust", 1);
  for (let i = x; i < x + w; i += TILE / 2) poly(ctx, chamfer(i + 1, 4, 10, 10, 2.5), "olive", 2);
  box(ctx, x, 0, w, 3, "concrete", 1);
  box(ctx, x, 15.5, w, 2.5, "rust", 2);
  rivets(ctx, x, 16.75, w, 6);
  for (let i = x; i < x + w; i += TILE) flat(ctx, i + 6, 19, 1, 4, "r0");
  if (!P.simple()) for (let i = x + TILE; i < x + w; i += TILE) wire(ctx, [[i, 3], [i, 9], [i + 0.6, 10.6], [i + 2.2, 10.6], [i + 2.6, 9]], "r3", 0.9);
  flat(ctx, x, 22, w, 2, "r0");
};

export const streetWalkway: EnvAsset = {
  id: "streetWalkway",
  box: [0, -2, 120, 25],
  draw(ctx, _state, _t, { w = 120 }: Size) {
    walkway(ctx, 0, w);
  },
};

const fencePanel = (ctx: CanvasRenderingContext2D, x: number, w: number, hole?: Pt[]): void => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, -46, w, 46);
  if (hole) hole.forEach(([hx, hy], i) => (i ? ctx.lineTo(x + hx, hy) : ctx.moveTo(x + hx, hy)));
  ctx.clip("evenodd");
  mesh(ctx, x, -46, w, 46, "c1", 3);
  flat(ctx, x, -46, w, 0.8, "c0");
  ctx.restore();
  flat(ctx, x, -2, w, 2, "k0");
};

const signPlate = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mat = "chrome"): void => {
  wire(ctx, [[x + 2, y], [x + 4, y - 4]], "c1", 0.5);
  wire(ctx, [[x + w - 2, y], [x + w - 4, y - 4]], "c1", 0.5);
  box(ctx, x, y, w, h, mat, 1);
};

const TEAR: Pt[] = [[0, -46], [30, -46], [26, -40], [31, -36], [22, -31], [25, -24], [14, -20], [16, -12], [6, -9], [0, -4]];

export const chainFence: EnvAsset = {
  id: "chainFence",
  box: [-2, -52, 194, 0],
  draw(ctx) {
    fencePanel(ctx, 0, 96, TEAR);
    fencePanel(ctx, 96, 96);
    signPlate(ctx, 62, -40, 18, 8);
    if (!P.simple()) for (const y of [-38, -36, -34]) flat(ctx, 64, y, 12, 0.8, "c0");
    signPlate(ctx, 102, -42, 60, 13);
    disc(ctx, 109, -35.5, 3.6, "a1", "aLine");
    text(ctx, "TOXIC!!", 136, -35.5, 7, "a1");
    signPlate(ctx, 168, -40, 16, 7);
    if (!P.simple()) for (const y of [-38, -35.5]) flat(ctx, 170, y, 12, 1, "neon");
    for (const x of [0, 96, 192]) {
      cylV(ctx, x - 1.75, -50, 3.5, 50, "chrome", 1);
      cylV(ctx, x - 2.25, -51, 4.5, 2, "chrome", 0);
    }
  },
};

const gusset = (ctx: CanvasRenderingContext2D, x: number): void => {
  box(ctx, x, -24, 24, 24, "concrete", 2);
  flat(ctx, x + 2, -22, 20, 1, "k3");
  dots(ctx, [[x + 3, -21], [x + 21, -21], [x + 3, -3], [x + 21, -3]], "k3");
};

export const girderBridge: EnvAsset = {
  id: "girderBridge",
  box: [0, -25, 144, 1],
  draw(ctx, _state, _t, { w = 144 }: Size) {
    for (let x = 24; x < w - 24; x += TILE) {
      bar(ctx, x + 1, -19, x + TILE - 1, -5, 3, "concrete", 1);
      bar(ctx, x + 1, -5, x + TILE - 1, -19, 3, "concrete", 2);
    }
    box(ctx, 0, -24, w, 5, "concrete", 2);
    box(ctx, 0, -5, w, 5, "concrete", 1);
    rivets(ctx, 24, -21.5, w - 48, 8, "k3");
    rivets(ctx, 24, -2.5, w - 48, 8, "k3");
    gusset(ctx, 0);
    gusset(ctx, w - 24);
  },
};

export const ladderRungs = (h: number, rung: number): number[] => {
  const ys: number[] = [];
  for (let k = 1; -rung * k > -h; k++) ys.push(-rung * k);
  return ys;
};

export const ladder: EnvAsset = {
  id: "ladder",
  box: [0, -168, 17.2, 0],
  draw(ctx, _state, _t, { h = 168, w = 17.2, rung = 6.76 }: Size) {
    box(ctx, 0, -h, 2.4, h, "steel", 2, { vertical: true });
    box(ctx, w - 2.4, -h, 2.4, h, "steel", 2, { vertical: true });
    const ys = ladderRungs(h, rung);
    for (const y of ys) box(ctx, 2.4, y - 0.7, w - 4.8, 1.4, "chrome", 2);
    if (!P.simple()) for (let k = 0; k < ys.length; k += 4) for (const x of [0.6, w - 1.8]) flat(ctx, x, (ys[k] as number) - 0.6, 1.2, 1.2, "m3");
  },
};

export const pipeColumn: EnvAsset = {
  id: "pipeColumn",
  box: [-4, -168, 28, 0],
  draw(ctx) {
    cylV(ctx, 0, -168, 24, 168, "concrete", 2);
    for (const y of [-150, -78]) {
      cylV(ctx, -1.5, y, 27, 4, "concrete", 1);
      flat(ctx, -1.5, y + 1.5, 27, 0.8, "k3");
    }
    cylV(ctx, -3, -6, 30, 6, "concrete", 1);
  },
};

const stripBar = (ctx: CanvasRenderingContext2D, x: number, y: number, lit: boolean): void => {
  if (lit) {
    ctx.save();
    for (const [spread, alpha, end] of [[6, 0.07, -8], [1, 0.08, -24]] as [number, number, number][]) {
      ctx.globalAlpha = alpha;
      poly(ctx, [[x, y + 4], [x + 36, y + 4], [x + 36 + spread, end], [x - spread, end]], "c3", 2, { line: false });
    }
    ctx.restore();
    glow(ctx, x + 18, y + 2, 22, "c3", 0.3);
  }
  box(ctx, x, y, 36, 4, "chrome", lit ? 3 : 0);
  if (lit) flat(ctx, x + 1.5, y + 2.5, 33, 1.5, "c3");
};

export const stripLight: EnvAsset = {
  id: "stripLight",
  box: [-14, -72, 50, 0],
  draw(ctx, state) {
    stripBar(ctx, 0, -70, state === 0);
  },
};

export const structureAssets: EnvAsset[] = [streetWalkway, girderBridge, ladder, pipeColumn, chainFence, stripLight];
