import { G } from "./grime";
import { P, TILE, type EnvAsset, type Size } from "./paint";

const { rng, path, color, flat, box, cylV, disc, rivets, glow, stroke, shape, line, curve, mesh, hazard } = P;
const { PI, sin, cos, min, max, abs, round, floor, ceil } = Math;

type Pt = [number, number];
type Pt3 = [number, number, number];

const simple = (): boolean => P.simple();

export const ellipse = (ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, fill: string, edge: string | null = null): void => {
  ctx.fillStyle = color(fill);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
  ctx.fill();
  if (edge) stroke(ctx, edge);
};

export const shadow = (ctx: CanvasRenderingContext2D, cx: number, w: number, alpha = 0.4): void => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ellipse(ctx, cx, -0.4, w / 2, 0.9, "hole");
  ctx.restore();
};

export const smoke = (ctx: CanvasRenderingContext2D, x: number, y: number, t: number, n = 3, h = 22): void => {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const k = (t * 0.35 + i / n) % 1;
    ctx.globalAlpha = 0.22 * (1 - k);
    ellipse(ctx, x + sin(t * 1.3 + i * 2) * 2 + k * 5, y - k * h, 2 + k * 5, 1.6 + k * 3.5, k < 0.3 ? "k1" : "k2");
  }
  ctx.restore();
};

export const spark = (ctx: CanvasRenderingContext2D, x: number, y: number, t: number, seed = 0): void => {
  if (floor(t * 7 + seed) % 4) return;
  const r = rng(floor(t * 7) + seed * 13);
  if (!simple()) glow(ctx, x, y, 5, "y3", 0.8);
  for (let i = 0; i < 4; i++) {
    const a = r() * PI * 2;
    const l = 2 + r() * 3;
    line(ctx, [[x, y], [x + cos(a) * l, y + sin(a) * l]], "y3", 0.5);
  }
};

export const flame = (ctx: CanvasRenderingContext2D, x: number, base: number, w: number, h: number, t: number, seed = 0): void => {
  const f = 0.85 + sin(t * 11 + seed * 2.3) * 0.08 + sin(t * 17.3 + seed) * 0.07;
  const tip = h * f;
  const lean = sin(t * 6 + seed) * w * 0.12;
  const pts = (k: number, s: number): Pt[] => [
    [x + w * (0.5 - s / 2), base],
    [x + w * (0.5 - s / 2) + w * 0.05, base - tip * k * 0.45],
    [x + w / 2 + lean * k - w * s * 0.18, base - tip * k * 0.75],
    [x + w / 2 + lean * k, base - tip * k],
    [x + w / 2 + lean * k + w * s * 0.2, base - tip * k * 0.7],
    [x + w * (0.5 + s / 2) - w * 0.04, base - tip * k * 0.4],
    [x + w * (0.5 + s / 2), base],
  ];
  if (!simple()) glow(ctx, x + w / 2, base - tip * 0.4, w * 1.3, "a1", 0.35);
  shape(ctx, pts(1, 1), "fire0");
  shape(ctx, pts(0.75, 0.7), "fire1");
  shape(ctx, pts(0.45, 0.42), "fire2");
};

export const viewSpan = (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): [number, number, number, number] => {
  const { a, b, c, d, e, f } = ctx.getTransform();
  const det = a * d - b * c;
  const cw = Number(ctx.canvas.width);
  const ch = Number(ctx.canvas.height);
  if (!det || !cw || !ch) return [x0, y0, x0, y0];
  const xs: number[] = [];
  const ys: number[] = [];
  for (const [X, Y] of [[0, 0], [cw, 0], [0, ch], [cw, ch]] as Pt[]) {
    xs.push((d * (X - e) - c * (Y - f)) / det);
    ys.push((-b * (X - e) + a * (Y - f)) / det);
  }
  return [max(x0, min(...xs)), max(y0, min(...ys)), min(x1, max(...xs)), min(y1, max(...ys))];
};

const cells = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): [number, number, number, number] => {
  const [vx0, vy0, vx1, vy1] = viewSpan(ctx, x, y, x + w, y + h);
  return [max(0, floor((vx0 - x) / TILE)), min(ceil(w / TILE), ceil((vx1 - x) / TILE)), max(0, floor((vy0 - y) / TILE)), min(ceil(h / TILE), ceil((vy1 - y) / TILE))];
};

export const hash = (a: number, b: number): number => {
  const s = sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - floor(s);
};

export const CRATE = ["#1e261c", "#2c3828", "#3c4a36", "#5a6a50", "#0e120c"] as const;
const CRATE_ALT = ["#222a22", "#30382e", "#424c3e", "#626e58"] as const;
const STRIPE = "#b08a30";
const STRIPE_DARK = "#5a3e14";

const crate = (ctx: CanvasRenderingContext2D, x: number, y: number, seed: number): void => {
  const k = hash(seed, 3);
  const t = k < 0.3 ? CRATE_ALT : CRATE;
  flat(ctx, x, y, 24, 18, t[1]);
  flat(ctx, x, y, 24, 1.2, t[3]);
  flat(ctx, x, y, 1.2, 18, t[2]);
  flat(ctx, x + 22.8, y, 1.2, 18, t[0]);
  flat(ctx, x + 2.5, y + 2, 3, 14, t[2]);
  flat(ctx, x + 18.5, y + 2, 3, 14, t[0]);
  const flipped = hash(seed, 7) < 0.5;
  const diag: Pt[] = flipped ? [[x + 18.5, y + 2], [x + 21.5, y + 2], [x + 8.5, y + 16], [x + 5.5, y + 16]] : [[x + 5.5, y + 2], [x + 8.5, y + 2], [x + 21.5, y + 16], [x + 18.5, y + 16]];
  shape(ctx, diag, t[2]);
  line(ctx, [diag[1] as Pt, diag[2] as Pt], t[0], 0.7);
  flat(ctx, x + 11.4, y + 8.4, 1.4, 1.4, t[3]);
  flat(ctx, x + 3.4, y + 3, 1.2, 1.2, t[3]);
  flat(ctx, x, y + 18, 24, 6, CRATE[4]);
  flat(ctx, x, y + 19.6, 24, 1.3, k > 0.85 ? STRIPE_DARK : STRIPE);
  flat(ctx, x, y + 20.9, 24, 0.7, STRIPE_DARK);
};

export const crateWall: EnvAsset = {
  id: "crateWall",
  box: [0, -168, 72, 0],
  draw(ctx, _state, _t, { w = 72, h = 168 }: Size = {}) {
    const seed = round(w * 3 + h * 7);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -h, w, h);
    ctx.clip();
    flat(ctx, 0, -h, w, h, CRATE[4]);
    const [c0, c1, r0, r1] = cells(ctx, 0, -h, w, h);
    for (let j = r0; j < r1; j++) for (let i = c0; i < c1; i++) crate(ctx, i * TILE, -h + j * TILE, seed + i * 31 + j * 17);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 0.9);
    for (let j = r0; j < r1; j++) {
      for (let i = c0; i < c1; i++) {
        const s = hash(seed + i, j);
        if (s < 0.22) G.drips(ctx, i * TILE, -h + j * TILE + 20, TILE, 14, seed + i * 7 + j * 13, 1);
        if (s > 0.96) G.rustPatch(ctx, i * TILE + 12, -h + j * TILE + 12, 2.6, 1.4, seed + i * 5 + j);
      }
    }
    G.dirt(ctx, 0, -h, w, h, seed + 2, min(0.25, 36 / h));
    ctx.restore();
  },
};

export const SOIL = ["#2a1e10", "#4a3420", "#6a4c2c", "#8a6a40"] as const;
export const GRASS = ["#2e3a14", "#4c5a1e", "#6e7a2a", "#9a9440", "#b8a858"] as const;
const STONE = ["#26262a", "#3e3e3c", "#5a5a54", "#7e7c72", "#121210"] as const;

export const tufts = (ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, seed: number, step = 3.2): void => {
  const r = rng(seed);
  for (let x = x0 + r() * step; x < x1; x += step * (0.6 + r() * 0.8)) {
    const h = 2 + r() * 4.5;
    const c = GRASS[1 + floor(r() * 4)] as string;
    const lean = (r() - 0.5) * 2.4;
    line(ctx, [[x, y + 1], [x + lean, y - h]], c, 0.9);
    if (r() < 0.6) line(ctx, [[x + 0.8, y + 1], [x + 0.8 + lean * 1.6, y - h * 0.7]], GRASS[2], 0.7);
  }
};

const walkway = (ctx: CanvasRenderingContext2D, w: number): void => {
  const seed = 400 + round(w) * 3;
  const [vx0, , vx1] = viewSpan(ctx, -6, -8, w + 6, 26);
  const x0 = max(0, floor(vx0 / TILE) * TILE);
  const x1 = min(w, ceil(vx1 / TILE) * TILE);
  if (x1 <= x0) return;
  flat(ctx, x0, 6, x1 - x0, 18, STONE[1]);
  for (let x = x0; x < x1; x += TILE) {
    const k = floor(x / TILE);
    const bw = min(TILE, w - x);
    flat(ctx, x + 0.6, 7.2, bw - 1.2, 15.6, hash(k, 2) < 0.35 ? STONE[2] : STONE[1]);
    flat(ctx, x + 0.6, 7.2, bw - 1.2, 1.2, STONE[3]);
    if (bw > 12) {
      const n: Pt[] = hash(k, 5) < 0.5 ? [[x + 4, 21], [x + 4, 9], [x + bw - 4, 21], [x + bw - 4, 9]] : [[x + 4, 9], [x + 4, 21], [x + bw - 4, 9], [x + bw - 4, 21]];
      line(ctx, n, STONE[0], 2.2);
      line(ctx, n, STONE[3], 0.6);
    }
    flat(ctx, x, 22.6, bw, 1.4, STONE[4]);
  }
  flat(ctx, x0, 0, x1 - x0, 7, SOIL[1]);
  const r = rng(seed + floor(x0 / TILE));
  for (let x = x0; x < x1; x += 5 + r() * 9) flat(ctx, x, 2 + r() * 3, 2 + r() * 5, 1 + r() * 1.5, r() < 0.5 ? SOIL[0] : SOIL[2]);
  flat(ctx, x0, 0, x1 - x0, 1.4, SOIL[3]);
  flat(ctx, x0, 6.4, x1 - x0, 0.8, SOIL[0]);
  G.grain(ctx, G.rectRegion(ctx, x0, 0, x1 - x0, 24), seed + 1);
  for (let x = x0; x < x1; x += TILE) {
    const k = floor(x / TILE);
    if (hash(k, 9) < 0.4) G.drips(ctx, x, 7, TILE, 10, seed + k, 1);
    if (hash(k, 11) < 0.3) {
      const mx = x + hash(k, 12) * 16;
      shape(ctx, [[mx, 7], [mx + 6, 7], [mx + 4.5, 11], [mx + 1.5, 12]], GRASS[0]);
    }
  }
  tufts(ctx, x0, x1, 0, seed + 3 + floor(x0 / TILE), simple() ? 4.4 : 3.2);
};

export const grassyWalkway: EnvAsset = {
  id: "grassyWalkway",
  box: [0, -6, 120, 25],
  draw(ctx, _state, _t, { w = 120 }: Size = {}) {
    walkway(ctx, w);
  },
};

export const walkwayGirder: EnvAsset = {
  id: "walkwayGirder",
  box: [0, -30, 120, 1],
  draw(ctx, _state, _t, { w = 120 }: Size = {}) {
    ctx.translate(0, -TILE);
    walkway(ctx, w);
  },
};

const SKY: [number, string][] = [[0, "#04070a"], [0.35, "#08100e"], [0.6, "#0e1a14"], [0.8, "#142016"], [1, "#0a0e0a"]];
const STARS: Pt3[] = Array.from({ length: 70 }, (_, i) => [hash(i, 1) * 320, -170 + hash(i, 2) * 60, 0.25 + hash(i, 3) * 0.45]);

const ridge = (x0: number, x1: number, base: number, amp: number, step: number, seed: number): Pt[] => {
  const r = rng(seed);
  const pts: Pt[] = [[x0, 0]];
  for (let x = x0; x <= x1; x += step) pts.push([x, base - r() * amp]);
  pts.push([x1, base - r() * amp], [x1, 0]);
  return pts;
};

const palmTop = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, c: string, seed: number): void => {
  const r = rng(seed);
  for (let i = 0; i < 7; i++) {
    const a = -PI / 2 + (i - 3) * 0.48 + (r() - 0.5) * 0.25;
    const l = s * (0.8 + r() * 0.4);
    const ex = x + cos(a) * l;
    const ey = y + sin(a) * l * 0.55 + l * 0.35;
    const mx = x + cos(a) * l * 0.5;
    const my = y + sin(a) * l * 0.6;
    shape(ctx, [[x, y], [mx, my - s * 0.12], [ex, ey], [mx, my + s * 0.1]], c);
  }
};

export const palm = (ctx: CanvasRenderingContext2D, x: number, base: number, h: number, lean: number, c: string, seed: number): void => {
  const top: Pt = [x + lean, base - h];
  curve(ctx, [[x, base], [x + lean * 0.2, base - h * 0.5], top], c, max(1.2, h * 0.05));
  palmTop(ctx, top[0], top[1], h * 0.42, c, seed);
};

export const villageBackdrop: EnvAsset = {
  id: "villageBackdrop",
  box: [0, -170, 320, 0],
  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -170, 320, 170);
    ctx.clip();
    const g = ctx.createLinearGradient(0, -170, 0, 0);
    for (const [at, c] of SKY) g.addColorStop(at, c);
    ctx.fillStyle = g;
    ctx.fillRect(0, -170, 320, 170);
    for (const [x, y, s] of STARS) flat(ctx, x, y, s, s, "#8a9a90");
    glow(ctx, 244, -152, 22, "#4a5a4a", 0.35);
    disc(ctx, 244, -152, 4.2, "#b8bca0");
    disc(ctx, 245.4, -152.8, 3.6, "#8a8e78");
    shape(ctx, ridge(0, 320, -118, 16, 9, 11), "#0c1612");
    shape(ctx, ridge(0, 320, -100, 12, 6, 12), "#0a130f");
    for (let i = 0; i < 16; i++) palm(ctx, hash(i, 4) * 330 - 5, -92 + hash(i, 5) * 8, 14 + hash(i, 6) * 12, (hash(i, 7) - 0.5) * 8, "#08100c", 30 + i);
    shape(ctx, ridge(0, 320, -84, 8, 5, 13), "#08100c");
    flat(ctx, 0, -84, 320, 84, "#070c09");
    ctx.restore();
  },
};

export const JUNGLE = ["#0c1610", "#14221a", "#1e3024", "#2c4232", "#3e5640"] as const;

export const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, n = 12): Pt[] => {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * PI * 2;
    const k = 0.75 + r() * 0.35;
    return [cx + cos(a) * rx * k, cy + sin(a) * ry * k] as Pt;
  });
};

export const fern = (ctx: CanvasRenderingContext2D, x: number, fh: number, c: string): void => {
  for (let k = -2; k <= 2; k++) curve(ctx, [[x, 0], [x + k * fh * 0.25, -fh * 0.6], [x + k * fh * 0.55, -fh * (0.7 - abs(k) * 0.12)]], c, 1);
};

export const jungleCanopy: EnvAsset = {
  id: "jungleCanopy",
  box: [-30, -150, 270, 0],
  draw(ctx, _state, _t, { w = 240, h = 144 }: Size = {}) {
    const seed = round(w * 5 + h * 3);
    const r = rng(seed);
    for (let x = -10; x < w + 10; x += 22 + r() * 18) shape(ctx, blob(x, -h * (0.55 + r() * 0.2), 26 + r() * 14, 18 + r() * 10, seed + round(x)), JUNGLE[0]);
    flat(ctx, 0, -h * 0.55, w, h * 0.55, JUNGLE[0]);
    for (let x = 8; x < w; x += 30 + r() * 30) palm(ctx, x, 0, h * (0.7 + r() * 0.3), (r() - 0.5) * 30, JUNGLE[1], seed + round(x) * 3);
    for (let x = 0; x < w + 10; x += 16 + r() * 12) shape(ctx, blob(x, -h * (0.18 + r() * 0.12), 14 + r() * 8, 10 + r() * 6, seed + 7 + round(x)), JUNGLE[r() < 0.5 ? 1 : 2]);
    for (let x = 4; x < w; x += 9 + r() * 10) fern(ctx, x, 8 + r() * 10, JUNGLE[3]);
    flat(ctx, 0, -6, w, 6, JUNGLE[0]);
  },
};

export const RUIN = ["#4a4840", "#6e6a5c", "#8e8a78", "#aca692", "#1c1a16"] as const;

const jagged = (x0: number, x1: number, y: number, amp: number, step: number, seed: number): Pt[] => {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let x = x0; x < x1; x += step * (0.5 + r())) pts.push([x, y + r() * amp]);
  pts.push([x1, y + r() * amp]);
  return pts;
};

export const ruinWall: EnvAsset = {
  id: "ruinWall",
  box: [0, -72, 144, 0],
  draw(ctx, _state, _t, { w = 144, h = 72 }: Size = {}) {
    const seed = round(w * 11 + h);
    const outline: Pt[] = [[0, 0], ...jagged(0, w, -h, h * 0.35, 10, seed), [w, 0]];
    shape(ctx, outline, RUIN[1], RUIN[4]);
    G.grain(ctx, G.polyRegion(ctx, outline), seed + 1);
    const r = rng(seed + 2);
    ctx.save();
    path(ctx, outline);
    ctx.clip();
    for (let y = -h + 10; y < -4; y += 12) flat(ctx, 0, y, w, 1, RUIN[0]);
    for (let x = 6 + r() * 20; x < w - 20; x += 34 + r() * 30) {
      flat(ctx, x, -h * 0.62, 14, h * 0.3, RUIN[4]);
      flat(ctx, x - 1.5, -h * 0.62 - 2, 17, 2, RUIN[2]);
    }
    G.drips(ctx, 0, -h, w, h * 0.6, seed + 3, round(w / 16), false);
    G.dirt(ctx, 0, -h, w, h, seed + 4, 0.35);
    ctx.restore();
    for (let x = 4; x < w; x += 7 + r() * 9) fern(ctx, x, 5 + r() * 9, r() < 0.5 ? "#2a3a24" : "#3a4c2e");
  },
};

const BOULDER = ["#2a2620", "#4c463a", "#6e6654", "#968c74", "#b4aa8e"] as const;

export const boulder = (ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, seed: number): void => {
  shape(ctx, blob(cx, cy, rx, ry, seed, 10), BOULDER[1], BOULDER[0]);
  shape(ctx, blob(cx - rx * 0.18, cy - ry * 0.22, rx * 0.72, ry * 0.6, seed + 1, 9), BOULDER[2]);
  shape(ctx, blob(cx - rx * 0.32, cy - ry * 0.4, rx * 0.36, ry * 0.26, seed + 2, 8), BOULDER[3]);
  flat(ctx, cx - rx * 0.4, cy - ry * 0.55, rx * 0.25, 0.8, BOULDER[4]);
  line(ctx, [[cx - rx * 0.6, cy + ry * 0.5], [cx + rx * 0.5, cy + ry * 0.62]], BOULDER[0], 0.8);
};

export const rockCliff: EnvAsset = {
  id: "rockCliff",
  box: [-18, -84, 84, 8],
  draw(ctx, _state, _t, { w = 72, h = 72 }: Size = {}) {
    const seed = round(w * 13 + h * 5);
    const r = rng(seed);
    const rows = max(1, round(h / 17));
    const band = min(w + 6, 38);
    const back: Pt[] = [[-10, 4], [band, 4], [w + 4, -h + 6], [w + 4, -h - 4], [w - 8, -h - 6]];
    shape(ctx, back, BOULDER[0]);
    for (let j = 0; j < rows; j++) {
      const y = -(j + 0.5) * (h / rows);
      const edge = (w * (j + 0.5)) / rows;
      for (let x = edge - 6 + r() * 6; x < min(w + 6, edge + band); x += 15 + r() * 9) boulder(ctx, x, y + (r() - 0.5) * 4, 10 + r() * 6, 7 + r() * 3.5, seed + j * 31 + round(x));
    }
    for (let j = 0; j < rows; j++) {
      const y = -(j + 0.5) * (h / rows);
      boulder(ctx, (w * (j + 0.5)) / rows - 6, y + 3, 11 + r() * 4, 7.5 + r() * 2, seed + 500 + j);
    }
    G.grain(ctx, G.polyRegion(ctx, back), seed + 7, 0.6);
  },
};

export const bronzePipe: EnvAsset = {
  id: "bronzePipe",
  box: [-3, -168, 19, 0],
  draw(ctx, _state, _t, { h = 168 }: Size = {}) {
    const seed = 600 + round(h) * 3;
    cylV(ctx, 0, -h, 16, h, "rust", 2);
    if (!simple()) {
      flat(ctx, 4, -h, 2.4, h, "#c89a60");
      flat(ctx, 11, -h, 1.4, h, "r1");
    }
    for (let y = -h + 10; y < -8; y += 48) {
      box(ctx, -2, y, 20, 5, "rust", 3);
      rivets(ctx, -2, y + 2.5, 20, 5, "r0");
    }
    box(ctx, -2, -6, 20, 6, "steel", 1);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, 16, h), seed);
    G.drips(ctx, 0, -h, 16, min(60, h * 0.4), seed + 1, 2);
    G.dirt(ctx, 0, -h, 16, h, seed + 2, min(0.3, 30 / h));
  },
};

export const latticeMast: EnvAsset = {
  id: "latticeMast",
  box: [-2, -168, 26, 0],
  draw(ctx, _state, _t, { h = 168 }: Size = {}) {
    const seed = 620 + round(h) * 3;
    const n = max(1, round(h / TILE));
    const s = h / n;
    for (let i = 0; i < n; i++) {
      const y = -h + i * s;
      for (const c of [CRATE[0], CRATE[2]]) {
        const wd = c === CRATE[0] ? 3 : 1.8;
        line(ctx, [[3, y + 2], [21, y + s - 2]], c, wd);
        line(ctx, [[21, y + 2], [3, y + s - 2]], c, wd);
      }
      flat(ctx, 0, y, 24, 2.4, CRATE[1]);
      if (!simple()) flat(ctx, 0, y, 24, 0.8, CRATE[3]);
    }
    flat(ctx, 0, -h, 3.4, h, CRATE[2], CRATE[4]);
    flat(ctx, 20.6, -h, 3.4, h, CRATE[1], CRATE[4]);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, 24, h), seed);
    G.drips(ctx, 0, -h, 24, min(40, h * 0.3), seed + 1, 2);
  },
};

export const overheadPipeline: EnvAsset = {
  id: "overheadPipeline",
  box: [0, -16, 240, 6],
  draw(ctx, _state, _t, { w = 240 }: Size = {}) {
    const seed = 640 + round(w);
    flat(ctx, 0, -9, w, 2.6, "c0", "mLine");
    flat(ctx, 0, -9, w, 0.8, "c1");
    flat(ctx, 0, -4.6, w, 2, "m2", "mLine");
    for (let x = 18; x < w - 12; x += 72) {
      box(ctx, x, -14, 18, 13, "concrete", 2);
      hazard(ctx, x + 2, -11, 14, 3.4, 3, { fill: "a1", dark: "hazardDark", line: "aLine" });
      G.grain(ctx, G.rectRegion(ctx, x, -14, 18, 13), seed + x);
      G.drips(ctx, x, -1, 18, 6, seed + x + 1, 1);
    }
    for (let x = 54; x < w - 12; x += 72) {
      box(ctx, x, -11, 6, 9, "steel", 2);
      if (!simple()) flat(ctx, x + 1, -10, 1, 7, "m3");
    }
  },
};

export const PLANK = ["#24160c", "#3e2814", "#5a3c1e", "#7a5430", "#0e0804"] as const;

export const planks = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, vertical = false): void => {
  const r = rng(seed);
  flat(ctx, x, y, w, h, PLANK[1]);
  if (vertical) {
    for (let px = x; px < x + w; px += 6) {
      flat(ctx, px, y, min(5.4, x + w - px), h, r() < 0.3 ? PLANK[2] : PLANK[1]);
      flat(ctx, px + 5.4, y, 0.6, h, PLANK[4]);
    }
  } else {
    for (let py = y; py < y + h; py += 5) {
      flat(ctx, x, py, w, min(4.4, y + h - py), r() < 0.3 ? PLANK[2] : PLANK[1]);
      flat(ctx, x, py + 4.4, w, 0.6, PLANK[4]);
    }
  }
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed + 1);
  G.dirt(ctx, x, y, w, h, seed + 2, 0.3);
};

const post = (ctx: CanvasRenderingContext2D, x: number, top: number, w: number): void => {
  box(ctx, x, top, w, -top, "rust", 1, { vertical: true });
  if (!simple()) flat(ctx, x + 1, top, 1, -top, "r2");
};

const windowRow = (ctx: CanvasRenderingContext2D, x: number, y: number, n: number, ww: number, wh: number, gap: number, seed: number): void => {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const wx = x + i * (ww + gap);
    flat(ctx, wx - 1.5, y - 1.5, ww + 3, wh + 3, PLANK[3], PLANK[4]);
    const lit = r() < 0.18;
    flat(ctx, wx, y, ww, wh, lit ? "#5a4418" : "#0e0a06");
    if (lit && !simple()) glow(ctx, wx + ww / 2, y + wh / 2, ww, "#c08a30", 0.25);
    flat(ctx, wx + ww / 2 - 0.5, y, 1, wh, PLANK[1]);
    if (!simple()) flat(ctx, wx, y, ww, 1.4, "#00000066");
  }
};

export const stiltBuilding: EnvAsset = {
  id: "stiltBuilding",
  box: [-6, -200, 246, 0],
  draw(ctx, state, _t, { w = 240 }: Size = {}) {
    const seed = 700 + round(w) * 3 + state * 101;
    if (state === 1) {
      for (const x of [w * 0.12, w * 0.5, w * 0.84]) post(ctx, x, -72, 10);
      line(ctx, [[w * 0.12 + 10, -66], [w * 0.5, -12]], PLANK[4], 3);
      line(ctx, [[w * 0.12 + 10, -66], [w * 0.5, -12]], PLANK[2], 1.6);
      flat(ctx, 0, -80, w, 8, PLANK[2], PLANK[4]);
      planks(ctx, 6, -136, w - 12, 56, seed);
      windowRow(ctx, 18, -122, max(1, floor((w - 30) / 26)), 16, 20, 10, seed + 1);
      box(ctx, -2, -142, w + 4, 6, "rust", 2);
      const r = rng(seed + 3);
      for (let x = 4; x < w - 4; x += 14 + r() * 10) {
        const lh = 10 + r() * 22;
        const lean = (r() - 0.5) * 8;
        line(ctx, [[x, -142], [x + lean, -142 - lh]], PLANK[4], 2.6);
        line(ctx, [[x, -142], [x + lean, -142 - lh]], PLANK[2], 1.4);
      }
      for (const x of [0, w - 5]) box(ctx, x, -142, 5, 62, "rust", 1, { vertical: true });
      G.drips(ctx, 6, -80, w - 12, 20, seed + 4, round(w / 20));
      return;
    }
    for (const x of [w * 0.18, w * 0.74]) post(ctx, x, -76, 18);
    if (!simple()) {
      line(ctx, [[w * 0.18 + 18, -70], [w * 0.74, -10]], PLANK[4], 3);
      line(ctx, [[w * 0.18 + 18, -70], [w * 0.74, -10]], PLANK[1], 1.6);
    }
    flat(ctx, 0, -84, w, 8, PLANK[2], PLANK[4]);
    planks(ctx, 4, -186, w - 8, 102, seed);
    for (const y of [-176, -128]) {
      flat(ctx, 4, y - 6, w - 8, 4, PLANK[3], PLANK[4]);
      windowRow(ctx, 16, y, max(1, floor((w - 26) / 24)), 15, 24, 9, seed + y);
    }
    box(ctx, -4, -192, w + 8, 7, "rust", 2);
    for (const x of [0, w - 6]) box(ctx, x, -192, 6, 108, "rust", 1, { vertical: true });
    G.drips(ctx, 4, -186, w - 8, 50, seed + 5, round(w / 16));
  },
};

export const concreteBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number): void => {
  flat(ctx, x, y, w, h, RUIN[2], RUIN[4]);
  flat(ctx, x, y, w, 1.6, RUIN[3]);
  flat(ctx, x + w - 2, y, 2, h, RUIN[1]);
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed);
};

export const villageHouse: EnvAsset = {
  id: "villageHouse",
  box: [-4, -156, 244, 0],
  draw(ctx, state, _t, { w = 240 }: Size = {}) {
    const seed = 760 + round(w) * 5 + state * 77;
    if (state === 1) {
      const outline: Pt[] = [[0, 0], [0, -144], [w * 0.2, -144], [w * 0.24, -128], [w * 0.36, -136], [w * 0.42, -120], [w * 0.58, -124], [w * 0.64, -144], [w, -144], [w, 0]];
      shape(ctx, outline, RUIN[1], RUIN[4]);
      G.grain(ctx, G.polyRegion(ctx, outline), seed);
      for (const x of [0, w - 36]) concreteBlock(ctx, x, -144, 36, 144, seed + x);
      flat(ctx, 36, -104, w - 72, 10, RUIN[3], RUIN[4]);
      const arches = max(1, round((w - 72) / 60));
      const aw = (w - 72) / arches;
      for (let i = 0; i < arches; i++) {
        const ax = 36 + i * aw + aw * 0.18;
        const pts: Pt[] = [[ax, 0], [ax, -60], [ax + aw * 0.32, -82], [ax + aw * 0.64, -60], [ax + aw * 0.64, 0]];
        shape(ctx, pts, "#0e0c0a");
        G.rim(ctx, pts, seed + i, RUIN[3], RUIN[4]);
      }
      const r = rng(seed + 1);
      for (let i = 0; i < 6; i++) flat(ctx, 40 + r() * (w - 90), -140 + r() * 30, 8 + r() * 10, 5 + r() * 6, r() < 0.5 ? RUIN[0] : "#2a4a2a");
      for (const x of [w * 0.24, w * 0.6]) {
        const hole: Pt[] = [[x, -128], [x + 14, -132], [x + 20, -118], [x + 8, -112]];
        G.scorch(ctx, hole, seed + round(x));
        shape(ctx, hole, "#0e0c0a");
        G.rim(ctx, hole, seed + round(x) + 1, RUIN[3], RUIN[4]);
      }
      G.drips(ctx, 0, -144, w, 70, seed + 2, round(w / 14), false);
      G.dirt(ctx, 0, -144, w, 144, seed + 3, 0.25);
      return;
    }
    concreteBlock(ctx, 0, -96, w, 96, seed);
    flat(ctx, -4, -102, w + 8, 7, RUIN[3], RUIN[4]);
    const r = rng(seed + 4);
    for (let x = 14; x < w - 30; x += 40) {
      const kind = r();
      flat(ctx, x, -80, 26, 30, "#121410", RUIN[4]);
      if (kind < 0.4) {
        for (let k = 1; k < 4; k++) flat(ctx, x + k * 6.5, -80, 1.2, 30, RUIN[1]);
        flat(ctx, x, -66, 26, 1.2, RUIN[1]);
      } else if (kind < 0.55) {
        flat(ctx, x + 3, -77, 20, 24, "#2e4e44");
        if (!simple()) flat(ctx, x + 4, -76, 6, 22, "#4e6e60");
      }
      flat(ctx, x - 2, -48, 30, 3, RUIN[3], RUIN[4]);
    }
    for (const x of [0, w - 10]) flat(ctx, x, -96, 10, 96, RUIN[1], RUIN[4]);
    flat(ctx, w * 0.44, -40, 20, 40, "#0c0a08", RUIN[4]);
    G.drips(ctx, 0, -95, w, 40, seed + 5, round(w / 12), false);
    G.dirt(ctx, 0, -96, w, 96, seed + 6, 0.3);
  },
};

export const watchtower: EnvAsset = {
  id: "watchtower",
  box: [-30, -172, 34, 0],
  draw(ctx) {
    for (const [a, b] of [[[-24, 0], [-10, -120]], [[22, 0], [8, -120]], [[-20, -30], [18, -60]], [[18, -30], [-18, -60]], [[-15, -70], [13, -100]]] as [Pt, Pt][]) {
      line(ctx, [a, b], PLANK[4], 3.4);
      line(ctx, [a, b], PLANK[2], 2);
    }
    flat(ctx, -22, -62, 42, 3, PLANK[2], PLANK[4]);
    flat(ctx, -16, -96, 30, 3, PLANK[2], PLANK[4]);
    flat(ctx, -20, -124, 40, 5, PLANK[3], PLANK[4]);
    planks(ctx, -18, -156, 36, 32, 811, true);
    flat(ctx, -12, -150, 24, 10, "#0a0806", PLANK[4]);
    shape(ctx, [[-24, -156], [0, -170], [24, -156]], PLANK[2], PLANK[4]);
    G.drips(ctx, -18, -124, 36, 10, 812, 3);
  },
};

export const storageTank: EnvAsset = {
  id: "storageTank",
  box: [-2, -96, 62, 0],
  draw(ctx) {
    cylV(ctx, 2, -64, 56, 60, "rust", 2);
    ctx.fillStyle = color("r2");
    ctx.beginPath();
    ctx.ellipse(30, -64, 28, 14, 0, PI, 0);
    ctx.fill();
    stroke(ctx, "rust");
    if (!simple()) ellipse(ctx, 22, -70, 10, 4, "r3");
    for (const y of [-52, -34, -16]) {
      flat(ctx, 2, y, 56, 1.4, "r0");
      rivets(ctx, 2, y + 2.4, 56, 5, "r3");
    }
    box(ctx, 24, -82, 12, 6, "steel", 2);
    for (let y = -60; y < -6; y += 6) flat(ctx, 48, y, 6, 1.2, "m3");
    flat(ctx, 48, -62, 1.2, 58, "m2");
    flat(ctx, 53, -62, 1.2, 58, "m2");
    box(ctx, -2, -6, 64, 6, "concrete", 1);
    G.grain(ctx, G.rectRegion(ctx, 2, -64, 56, 60), 820);
    G.rustPatch(ctx, 14, -40, 6, 3, 821);
    G.drips(ctx, 2, -60, 56, 40, 822, 5);
    G.dirt(ctx, 2, -64, 56, 60, 823, 0.3);
  },
};

export const horizontalTank: EnvAsset = {
  id: "horizontalTank",
  box: [-6, -64, 126, 0],
  draw(ctx) {
    for (const x of [22, 86]) {
      box(ctx, x, -18, 12, 18, "steel", 1);
      shape(ctx, [[x - 6, -16], [x + 18, -16], [x + 14, -22], [x - 2, -22]], "m2", "mLine");
    }
    box(ctx, 14, -54, 92, 34, "rust", 2);
    for (const [cx, dir] of [[14, -1], [106, 1]] as Pt[]) {
      ctx.fillStyle = color("r1");
      ctx.beginPath();
      ctx.ellipse(cx, -37, 10, 17, 0, dir < 0 ? PI / 2 : -PI / 2, dir < 0 ? (PI * 3) / 2 : PI / 2);
      ctx.fill();
      stroke(ctx, "rust");
      flat(ctx, cx - 1.5, -56, 3, 38, "r3", "rLine");
    }
    if (!simple()) flat(ctx, 14, -50, 92, 3, "r3");
    for (const x of [30, 56, 82]) flat(ctx, x, -54, 1.4, 34, "r0");
    rivets(ctx, 14, -52, 92, 6, "r3");
    curve(ctx, [[6, -40], [-2, -40], [-2, -30], [6, -26]], "rLine", 4);
    curve(ctx, [[6, -40], [-2, -40], [-2, -30], [6, -26]], "r2", 2.4);
    box(ctx, 52, -62, 14, 8, "steel", 2);
    G.grain(ctx, G.rectRegion(ctx, 14, -54, 92, 34), 830);
    G.rustPatch(ctx, 40, -30, 7, 3, 831);
    G.drips(ctx, 14, -40, 92, 20, 832, 5);
  },
};

export const coil = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, n: number): void => {
  for (let i = 0; i < n; i++) {
    box(ctx, x, y + i * 6, w, 5, "chrome", 1);
    if (!simple()) flat(ctx, x + 2, y + i * 6 + 1, w - 4, 1, "c2");
  }
};

export const transformer: EnvAsset = {
  id: "transformer",
  box: [-4, -148, 220, 0],
  draw(ctx) {
    box(ctx, 0, -100, 120, 100, "olive", 1);
    for (let x = 6; x < 114; x += 22) {
      box(ctx, x, -92, 16, 60, "steel", 2);
      coil(ctx, x + 2, -88, 12, 8);
    }
    flat(ctx, 6, -26, 108, 18, "#141410", "kLine");
    for (let x = 10; x < 110; x += 8) flat(ctx, x, -24, 4, 14, "m2");
    box(ctx, 120, -64, 92, 64, "olive", 2);
    cylV(ctx, 130, -132, 26, 68, "chrome", 1);
    cylV(ctx, 168, -120, 30, 56, "rust", 2);
    for (const y of [-124, -112, -100, -88]) flat(ctx, 130, y, 26, 2, "c0");
    for (let i = 0; i < 4; i++) {
      disc(ctx, 140 + i * 18, -40, 5, "m1", "mLine");
      if (!simple()) disc(ctx, 140 + i * 18, -40, 2, i === 1 ? "screen" : "k3");
    }
    box(ctx, 196, -60, 10, 60, "steel", 1);
    curve(ctx, [[143, -132], [143, -144], [183, -144], [183, -120]], "mLine", 4.5);
    curve(ctx, [[143, -132], [143, -144], [183, -144], [183, -120]], "m2", 3);
    hazard(ctx, 124, -12, 84, 5, 4);
    G.surface(ctx, 0, -100, 120, 100, 840, { drip: 6 });
    G.surface(ctx, 120, -64, 92, 64, 841, { drip: 4 });
    G.grain(ctx, G.rectRegion(ctx, 130, -132, 26, 68), 842);
    G.grain(ctx, G.rectRegion(ctx, 168, -120, 30, 56), 843);
  },
};

const insulator = (ctx: CanvasRenderingContext2D, x: number, y: number, n: number): void => {
  for (let i = 0; i < n; i++) ellipse(ctx, x, y - i * 4, 5, 1.8, i % 2 ? "c1" : "c0", "mLine");
};

export const powerPlant: EnvAsset = {
  id: "powerPlant",
  box: [-2, -270, 290, 0],
  draw(ctx) {
    const pipe = (x: number, top: number, bottom: number): void => {
      cylV(ctx, x, top, 14, bottom - top, "steel", 2);
      for (let y = top + 12; y < bottom - 12; y += 24) box(ctx, x - 2, y, 18, 5, "olive", 2);
      G.grain(ctx, G.rectRegion(ctx, x, top, 14, bottom - top), 851 + x, 0.7);
    };
    for (const x of [24, 120, 216]) pipe(x, -264, -132);
    box(ctx, 18, -144, 218, 16, "steel", 1);
    if (!simple()) flat(ctx, 20, -142, 214, 2, "m3");
    G.grain(ctx, G.rectRegion(ctx, 18, -144, 218, 16), 855);
    G.drips(ctx, 18, -128, 218, 14, 852, 5);
    pipe(120, -128, -60);
    box(ctx, 0, -60, 288, 60, "olive", 1);
    for (let x = 4; x < 96; x += 18) {
      box(ctx, x, -96, 14, 40, "chrome", 1);
      coil(ctx, x + 1, -92, 12, 5);
    }
    box(ctx, 140, -96, 46, 40, "olive", 2);
    for (let i = 0; i < 4; i++) disc(ctx, 150 + i * 9, -70, 1.8, i % 2 ? "neon" : "k0", "mLine");
    for (let i = 0; i < 3; i++) {
      const x = 196 + i * 14;
      insulator(ctx, x, -60, 7);
      if (!simple()) glow(ctx, x, -92, 8, "plasma", 0.35);
      disc(ctx, x, -90, 2.2, "plasma");
    }
    cylV(ctx, 244, -120, 40, 60, "chrome", 1);
    ctx.fillStyle = color("c1");
    ctx.beginPath();
    ctx.ellipse(264, -120, 20, 8, 0, PI, 0);
    ctx.fill();
    stroke(ctx, "chrome");
    G.grain(ctx, G.rectRegion(ctx, 244, -120, 40, 60), 856);
    for (let i = 0; i < 5; i++) {
      flat(ctx, 8 + i * 56, -40, 40, 22, "#121410", "kLine");
      for (let k = 0; k < 5; k++) flat(ctx, 12 + i * 56 + k * 7, -38, 3, 18, "m2");
    }
    hazard(ctx, 4, -8, 280, 5, 4);
    G.surface(ctx, 0, -60, 288, 60, 850, { drip: 8 });
  },
};

export const villageFence: EnvAsset = {
  id: "villageFence",
  box: [-3, -52, 147, 1],
  draw(ctx, _state, _t, { w = 144 }: Size = {}) {
    const seed = 860 + round(w);
    flat(ctx, 0, -46, w, 44, "#00000033");
    mesh(ctx, 0, -46, w, 44, "c0", 3);
    flat(ctx, 0, -47, w, 1.4, "m2", "mLine");
    const n = max(1, round(w / 48));
    for (let i = 0; i <= n; i++) box(ctx, (w * i) / n - 1.5, -50, 3, 50, "steel", 2, { vertical: true });
    if (w >= 48) {
      const sx = w * 0.3;
      flat(ctx, sx, -38, 14, 8, "k2", "kLine");
      if (!simple()) for (const y of [-36, -34]) flat(ctx, sx + 2, y, 10, 0.8, "k0");
    }
    G.drips(ctx, 0, -47, w, 12, seed, round(w / 24));
    G.dirt(ctx, 0, -46, w, 46, seed + 1, 0.3);
  },
};

export const woodPile: EnvAsset = {
  id: "woodPile",
  box: [-2, -28, 58, 0],
  draw(ctx) {
    for (const [x, y, l] of [[0, -6, 52], [3, -12, 46], [6, -18, 40], [12, -24, 26]] as Pt3[]) {
      flat(ctx, x, y, l, 6, PLANK[1], PLANK[4]);
      disc(ctx, x + l, y + 3, 3, PLANK[3], PLANK[4]);
      if (!simple()) disc(ctx, x + l, y + 3, 1.2, PLANK[2]);
    }
    G.grain(ctx, G.rectRegion(ctx, 0, -24, 56, 24), 870);
    G.dirt(ctx, 0, -24, 56, 24, 871, 0.4);
  },
};

export const sackPile: EnvAsset = {
  id: "sackPile",
  box: [-2, -24, 46, 0],
  draw(ctx) {
    const sack = (cx: number, cy: number, rx: number, seed: number): void => {
      shape(ctx, blob(cx, cy, rx, 5.5, seed, 10), "#4a4232", "#14100a");
      if (!simple()) {
        shape(ctx, blob(cx - 1, cy - 1.5, rx * 0.7, 3, seed + 1, 8), "#5e5440");
        line(ctx, [[cx - rx * 0.6, cy + 1], [cx + rx * 0.6, cy + 1.5]], "#2a2418", 0.7);
      }
    };
    sack(10, -5.5, 10, 880);
    sack(30, -5.5, 11, 881);
    sack(20, -15, 10, 882);
    G.grain(ctx, G.rectRegion(ctx, 0, -22, 44, 22), 883);
  },
};

export const massTop: EnvAsset = {
  id: "massTop",
  box: [0, -9, 120, 4],
  draw(ctx, _state, _t, { w = 120 }: Size = {}) {
    const [vx0, , vx1] = viewSpan(ctx, -6, -10, w + 6, 4);
    const x0 = max(0, floor(vx0 / TILE) * TILE);
    const x1 = min(w, ceil(vx1 / TILE) * TILE);
    if (x1 <= x0) return;
    const r = rng(1100 + floor(x0 / TILE) * 7 + round(w));
    const crust: Pt[] = [[x0, 3]];
    for (let x = x0; x < x1; x += 3 + r() * 4) crust.push([x, -0.5 - r() * 1.8]);
    crust.push([x1, -0.8], [x1, 3]);
    shape(ctx, crust, SOIL[0]);
    for (let x = x0 + r() * 6; x < x1 - 2; x += 5 + r() * 9) {
      const rx = 1.6 + r() * 2.6;
      boulder(ctx, x, -0.6 - rx * 0.4, rx, rx * 0.7, 1101 + round(x));
    }
    for (let x = x0; x < x1; x += TILE) if (hash(floor(x / TILE), 21) < 0.45) tufts(ctx, x + 4, x + 4 + hash(floor(x / TILE), 22) * 14, 0, 1102 + round(x), 2.6);
    G.chips(ctx, x0, 0.4, x1 - x0, 1103 + round(x0));
  },
};

export const VESNICE_IDS = [
  "massTop", "crateWall", "grassyWalkway", "walkwayGirder", "villageBackdrop", "jungleCanopy", "ruinWall", "rockCliff", "bronzePipe", "latticeMast", "overheadPipeline",
  "stiltBuilding", "villageHouse", "watchtower", "storageTank", "horizontalTank", "transformer", "powerPlant", "villageFence", "woodPile", "sackPile",
  "sourceTeleport", "targetTeleport", "teleportPad", "brokenTeleport", "fuseBox", "electricCabinet", "cannon", "ammoDepot", "fireBarricade", "dynamiteWall", "energyBarrier",
  "powerBridge", "bridgeGuardPost", "smoulderingRemains", "smallKey", "walkieTalkie", "detonator", "projectileCrate", "projectile", "fuse", "dynamite", "navCircuit", "toaster",
  "energyPickup", "ammoPickup", "shieldPickup",
] as const;

export const vesniceAssets: EnvAsset[] = [
  massTop, crateWall, grassyWalkway, walkwayGirder, villageBackdrop, jungleCanopy, ruinWall, rockCliff, bronzePipe, latticeMast, overheadPipeline,
  stiltBuilding, villageHouse, watchtower, storageTank, horizontalTank, transformer, powerPlant, villageFence, woodPile, sackPile,
];
