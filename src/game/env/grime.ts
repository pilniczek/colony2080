import { P } from "./paint";

type Pt = [number, number];

const { rng, path, shape, line } = P;

const GRAIN_PX = 128;
const GRAIN_UNIT = 0.5;
const DIRT = "#140c06";
const DUST = "#c8b48c";
const RUST = ["#3a1a0a", "#6a2c10", "#94461c", "#b8682c"] as const;

let grainCanvas: HTMLCanvasElement | null | undefined;

const makeGrain = (): HTMLCanvasElement | null => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = GRAIN_PX;
  const g = c.getContext("2d");
  if (!g) return null;
  const r = rng(71);
  const square = (n: number, min: number, max: number, tone: string, a0: number, a1: number): void => {
    g.fillStyle = tone;
    for (let i = 0; i < n; i++) {
      const s = Math.round(min + r() * (max - min));
      const x = Math.floor(r() * GRAIN_PX);
      const y = Math.floor(r() * GRAIN_PX);
      g.globalAlpha = a0 + r() * (a1 - a0);
      for (const [dx, dy] of [[0, 0], [-GRAIN_PX, 0], [0, -GRAIN_PX], [-GRAIN_PX, -GRAIN_PX]] as Pt[]) g.fillRect(x + dx, y + dy, s, s);
    }
  };
  square(60, 10, 26, DIRT, 0.05, 0.14);
  square(30, 8, 18, DUST, 0.03, 0.07);
  square(420, 1, 3, DIRT, 0.15, 0.4);
  square(220, 1, 3, DUST, 0.08, 0.22);
  return c;
};

const grainPattern = (ctx: CanvasRenderingContext2D, seed: number): CanvasPattern | null => {
  if (grainCanvas === undefined) grainCanvas = makeGrain();
  if (!grainCanvas) return null;
  const p = ctx.createPattern(grainCanvas, "repeat");
  if (!p) return null;
  const r = rng(seed);
  p.setTransform(new DOMMatrix([GRAIN_UNIT, 0, 0, GRAIN_UNIT, r() * GRAIN_PX, r() * GRAIN_PX]));
  return p;
};

const grain = (ctx: CanvasRenderingContext2D, region: () => void, seed: number, alpha = 1): void => {
  const p = grainPattern(ctx, seed);
  if (!p) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p;
  region();
  ctx.fill();
  ctx.restore();
};

const rectRegion = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => (): void => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
};

const veil = (ctx: CanvasRenderingContext2D, pts: Pt[], c: string, alpha: number): void => {
  ctx.save();
  ctx.globalAlpha = alpha;
  shape(ctx, pts, c);
  ctx.restore();
};

const ragged = (x0: number, x1: number, y: number, amp: number, step: number, seed: number): Pt[] => {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let x = x0; x < x1; x += step * (0.5 + r())) pts.push([x, y - r() * amp]);
  pts.push([x1, y - r() * amp]);
  return pts;
};

const dirt = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, rise = 0.3): void => {
  const top = y + h - h * rise;
  veil(ctx, [[x, y + h], ...ragged(x, x + w, top + h * rise * 0.5, h * rise * 0.5, 6, seed), [x + w, y + h]], DIRT, 0.32);
  veil(ctx, [[x, y + h], ...ragged(x, x + w, y + h - h * rise * 0.25, h * rise * 0.25, 4, seed + 1), [x + w, y + h]], DIRT, 0.3);
};

const streak = (ctx: CanvasRenderingContext2D, x: number, y: number, len: number, wide: number, c: string, alpha: number): void => {
  veil(ctx, [[x - wide / 2, y], [x + wide / 2, y], [x + wide * 0.15, y + len], [x - wide * 0.15, y + len]], c, alpha);
};

const drips = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, maxLen: number, seed: number, n = 4, rusty = true): void => {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const dx = x + r() * w;
    const len = maxLen * (0.35 + r() * 0.65);
    const wide = 1.5 + r() * 3;
    streak(ctx, dx, y, len, wide * 2.2, DIRT, 0.18);
    if (rusty) {
      streak(ctx, dx, y, len * 0.8, wide, RUST[1], 0.55);
      streak(ctx, dx, y, len * 0.45, wide * 0.5, RUST[2], 0.45);
    }
  }
};

const rustPatch = (ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, seed: number): void => {
  const r = rng(seed);
  const blob = (k: number, s: number): Pt[] =>
    Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * 2 * Math.PI;
      const f = k * (0.55 + r() * 0.6);
      return [cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f + s] as Pt;
    });
  veil(ctx, blob(1.25, 0), RUST[0], 0.35);
  veil(ctx, blob(1, 0), RUST[1], 0.7);
  veil(ctx, blob(0.6, -0.5), RUST[2], 0.6);
  veil(ctx, blob(0.25, -0.5), RUST[3], 0.5);
  drips(ctx, cx - rx * 0.5, cy + ry * 0.5, rx, ry * 3, seed + 3, 2);
};

const chips = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, seed: number, c = DUST): void => {
  const r = rng(seed);
  ctx.save();
  ctx.fillStyle = c;
  for (let cx = x + r() * 6; cx < x + w - 2; cx += 4 + r() * 10) {
    ctx.globalAlpha = 0.25 + r() * 0.35;
    ctx.fillRect(cx, y, 1 + r() * 3, 0.6 + r() * 1.2);
  }
  ctx.restore();
};

const centre = (pts: Pt[]): Pt => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

const scorch = (ctx: CanvasRenderingContext2D, pts: Pt[], seed: number): void => {
  const [cx, cy] = centre(pts);
  const r = rng(seed);
  const out = (k: number): Pt[] => pts.map(([x, y]) => [cx + (x - cx) * (k + r() * 0.25), Math.min(0, cy + (y - cy) * (k + r() * 0.25))]);
  veil(ctx, out(1.45), DIRT, 0.28);
  veil(ctx, out(1.22), DIRT, 0.4);
  veil(ctx, out(1.1), RUST[0], 0.5);
};

const rim = (ctx: CanvasRenderingContext2D, pts: Pt[], seed: number, light: string, dark: string): void => {
  const r = rng(seed);
  const [cx, cy] = centre(pts);
  pts.forEach(([x, y], i) => {
    const [nx, ny] = pts[(i + 1) % pts.length] as Pt;
    const lit = y >= cy;
    if (r() < (lit ? 0.5 : 0.65)) {
      const t0 = r() * 0.35;
      const t1 = 0.6 + r() * 0.4;
      const len = Math.hypot(nx - x, ny - y) || 1;
      const px = -(ny - y) / len;
      const py = (nx - x) / len;
      const frag = [t0, (t0 * 2 + t1) / 3, (t0 + t1 * 2) / 3, t1].map((t, k): Pt => {
        const j = k % 3 ? (r() - 0.5) * 1.2 : 0;
        return [x + (nx - x) * t + px * j, y + (ny - y) * t + py * j];
      });
      ctx.save();
      ctx.globalAlpha = lit ? 0.5 : 0.8;
      line(ctx, frag, lit ? light : dark, lit ? 0.55 : 0.9);
      ctx.restore();
    }
    if (r() < 0.3) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const len = 3 + r() * 7;
      line(ctx, [[x, y], [x + (dx / d) * len * 0.5 + (r() - 0.5) * 3, y + (dy / d) * len * 0.5], [x + (dx / d) * len, y + (dy / d) * len + (r() - 0.5) * 2]], DIRT, 0.6);
    }
  });
};

const surface = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, { rise = 0.3, drip = 0, dripLen = h * 0.4, edge = true } = {}): void => {
  grain(ctx, rectRegion(ctx, x, y, w, h), seed);
  if (rise) dirt(ctx, x, y, w, h, seed + 1, rise);
  if (drip) drips(ctx, x, y, w, dripLen, seed + 2, drip);
  if (edge) chips(ctx, x, y, w, seed + 3);
};

const wagon = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number): void => {
  const r = rng(seed);
  grain(ctx, rectRegion(ctx, x, y, w, h), seed, 1);
  grain(ctx, rectRegion(ctx, x, y, w, h), seed + 9, 0.8);
  for (let sx = x + r() * 8; sx < x + w; sx += 5 + r() * 14) streak(ctx, sx, y, h * (0.25 + r() * 0.5), 3 + r() * 6, DIRT, 0.12 + r() * 0.14);
  dirt(ctx, x, y, w, h, seed + 1, 0.42);
  for (let rx = x + 6 + r() * 20; rx < x + w - 6; rx += 26 + r() * 40) rustPatch(ctx, rx, y + h * (0.72 + r() * 0.2), 3 + r() * 5, 1.5 + r() * 2, seed + Math.round(rx));
  drips(ctx, x, y + h * 0.7, w, h * 0.25, seed + 4, Math.round(w / 18));
  chips(ctx, x, y + 1, w, seed + 5, DIRT);
};

export const G = {
  wagon,
  grain,
  rectRegion,
  polyRegion: (ctx: CanvasRenderingContext2D, pts: Pt[]) => (): void => path(ctx, pts),
  dirt,
  drips,
  streak,
  rustPatch,
  chips,
  scorch,
  rim,
  surface,
  DIRT,
  DUST,
  RUST,
};
