import { P, type EnvAsset } from "./paint";

const { rng, path, color, flat, box, poly, cylV, disc, stroke } = P;
const { PI, sin, cos, hypot } = Math;

type Pt = [number, number];
type Tones = [string, string, string, string];

const ROCK: Tones = ["k0", "k2", "c1", "c2"];
const LIGHT: Pt = [-0.6, -0.8];

const facets = (ctx: CanvasRenderingContext2D, pts: Pt[], cx: number, cy: number, tones: Tones, line: string): void => {
  const t = tones.map(color) as Tones;
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length] as Pt;
    const nx = b[1] - a[1];
    const ny = a[0] - b[0];
    const n = hypot(nx, ny) || 1;
    const d = (nx * LIGHT[0] + ny * LIGHT[1]) / n;
    ctx.fillStyle = d > 0.6 ? t[3] : d > 0.05 ? t[2] : d > -0.55 ? t[1] : t[0];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = P.lw(ctx, 0.6);
    ctx.stroke();
  });
  path(ctx, pts);
  stroke(ctx, line);
};

const rock = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, seed: number): void => {
  const rnd = rng(seed);
  const n = 5 + Math.floor(rnd() * 3);
  const a0 = rnd() * PI;
  const pts: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = a0 + (i * 2 * PI) / n + (rnd() - 0.5) * 0.5;
    const k = r * (0.75 + rnd() * 0.3);
    return [cx + cos(a) * k, cy + sin(a) * k * 0.82];
  });
  facets(ctx, pts, cx + r * 0.22, cy + r * 0.16, ROCK, "kLine");
};

const scuff = (ctx: CanvasRenderingContext2D, x: number, w: number): void => {
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = color("hole");
  ctx.beginPath();
  ctx.ellipse(x + w / 2, -0.5, w / 2, 0.9, 0, 0, PI * 2);
  ctx.fill();
  ctx.restore();
  if (P.simple()) return;
  for (const [dx, s] of [[0.15, 1], [0.55, 0.8], [0.8, 1.2]] as Pt[]) flat(ctx, x + w * dx, -1.4 * s, s, s * 0.8, "k2");
};

const drum = (ctx: CanvasRenderingContext2D, x: number, w: number, h: number): void => {
  const simple = P.simple();
  cylV(ctx, x, -h, w, h, "chrome", 1);
  const step = simple ? h / 4 : h / 8;
  for (let y = -h + step; y < -1; y += step) flat(ctx, x + 0.4, y - 0.6, w - 0.8, 1.2, "c0");
  for (const y of [-h + 1, -h * 0.5, -2]) cylV(ctx, x - 0.6, y - 1.2, w + 1.2, 2.4, "chrome", 2);
  poly(ctx, [[x, -h], [x + w, -h], [x + w - 1, -h - 2], [x + 1, -h - 2]], "chrome", 2);
};

export const barrel: EnvAsset = {
  id: "barrel",
  box: [-4, -34, 34, 0],
  draw(ctx) {
    drum(ctx, 3, 22, 29);
  },
};

export const crowbar: EnvAsset = {
  id: "crowbar",
  box: [-2, -8, 28, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 2, 22);
    poly(ctx, [[0, -2.6], [2, -3.6], [3, -2.4], [21, -1.2], [23.5, -5.5], [25.5, -6.6], [26, -5.2], [24, -0.2], [21, 0], [2, -1]], "chrome", 1);
    if (!P.simple()) flat(ctx, 3, -2.3, 17, 0.4, "c3");
  },
};

export const craneKey: EnvAsset = {
  id: "craneKey",
  box: [-2, -6, 12, 0],
  draw(ctx, state) {
    if (state === 2) return scuff(ctx, 0, 10);
    ctx.save();
    ctx.translate(0, -1.4);
    ctx.beginPath();
    ctx.arc(2.2, -1.2, 2, 0, PI * 2);
    ctx.arc(2.2, -1.2, 0.9, 0, PI * 2, true);
    ctx.fillStyle = color("y1");
    ctx.fill("evenodd");
    stroke(ctx, "yLine");
    box(ctx, 4, -1.9, 5.6, 1.4, "yellow", 2);
    poly(ctx, [[7, -0.5], [7.8, -0.5], [7.8, 1], [7, 1]], "yellow", 1);
    poly(ctx, [[8.6, -0.5], [9.6, -0.5], [9.6, 1.4], [8.6, 1.4]], "yellow", 1);
    ctx.restore();
  },
};

export const crate: EnvAsset = {
  id: "crate",
  box: [-2, -30, 34, 0],
  draw(ctx) {
    box(ctx, 1, -25, 26, 25, "brick", 1);
    box(ctx, 0, -27, 28, 2.6, "brick", 3);
    const cols = P.simple() ? 5 : 7;
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const w = 20 / cols;
        flat(ctx, 4 + c * w + w * 0.2, -21.5 + r * 5, w * 0.6, 3.4, "hole");
      }
    }
    flat(ctx, 1, -2, 26, 2, "b0", "bLine");
  },
};

export const signPost: EnvAsset = {
  id: "signPost",
  box: [-8, -60, 12, 0],
  draw(ctx) {
    poly(ctx, [[-4, 0], [-3, -2], [5, -2], [6, 0]], "steel", 2);
    cylV(ctx, -0.5, -40, 3, 38, "chrome", 1);
    box(ctx, -1, -42, 4, 2.5, "chrome", 0);
    box(ctx, -4.5, -59, 11, 18, "chrome", 1, { vertical: true });
    flat(ctx, -3.5, -57, 5, 14, "screenOff", "gLine");
    if (P.simple()) return;
    for (let y = -55; y < -45; y += 2.6) flat(ctx, -2.8, y, 3.4, 0.8, "screen");
    disc(ctx, 3.5, -55, 0.8, "neon");
  },
};

export const floorVent: EnvAsset = {
  id: "floorVent",
  box: [-2, -10, 24, 0],
  draw(ctx) {
    box(ctx, 0, -8, 22, 7, "chrome", 1);
    flat(ctx, 1.6, -6.6, 18.8, 4.6, "hole");
    const n = P.simple() ? 4 : 6;
    for (let i = 0; i < n; i++) box(ctx, 2.6 + i * (17 / n), -6.6, 1.2, 4.6, "chrome", 2, { vertical: true, line: false });
  },
};

const BOULDERS: [number, number, number][] = [
  [10, -10, 12], [33, -11, 13], [58, -10, 12], [82, -11, 12],
  [21, -31, 11], [45, -32, 12], [70, -30, 11], [90, -26, 7],
  [36, -51, 10], [60, -52, 11], [80, -46, 8],
  [48, -69, 10], [68, -70, 9],
  [57, -85, 9], [72, -90, 7],
  [2, -4, 5], [94, -6, 5], [27, -48, 5], [86, -60, 5],
];

export const rubblePile: EnvAsset = {
  id: "rubblePile",
  box: [-6, -100, 102, 0],
  draw(ctx) {
    path(ctx, [[-2, 0], [6, -22], [22, -46], [36, -66], [48, -86], [60, -96], [76, -96], [82, -74], [92, -48], [100, -16], [102, 0]]);
    ctx.fillStyle = color("hole");
    ctx.fill();
    const list = P.simple() ? BOULDERS.filter((b) => b[2] > 6) : BOULDERS;
    list
      .map((b, i): [number, number, number, number] => [b[0], b[1], b[2], i])
      .sort((a, b) => a[1] - b[1])
      .forEach(([x, y, r, i]) => rock(ctx, x, y, r * 1.3, i + 3));
  },
};

export const propAssets: EnvAsset[] = [barrel, crowbar, craneKey, crate, signPost, floorVent, rubblePile];
