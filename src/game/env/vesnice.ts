import { G } from "./grime";
import { wireBox } from "./machines";
import { P, type EnvAsset } from "./paint";

const { rng, color, flat, glow, stroke, shape, line, curve, disc, rivets, hazard, text, path, box, poly, cylV, cylH, slab, tones } = P;
const { PI, sin, cos, min, max, floor, ceil, round, abs } = Math;

type Pt = [number, number];
type Ctx = CanvasRenderingContext2D;
type Tones = readonly [string, string, string, string, string];

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

export const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, n = 12): Pt[] => {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * PI * 2;
    const k = 0.75 + r() * 0.35;
    return [cx + cos(a) * rx * k, cy + sin(a) * ry * k] as Pt;
  });
};

export const RUIN = ["#4a4840", "#6e6a5c", "#8e8a78", "#aca692", "#1c1a16"] as const;

const BOULDER = ["#2a2620", "#4c463a", "#6e6654", "#968c74", "#b4aa8e"] as const;

export const boulder = (ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, seed: number): void => {
  shape(ctx, blob(cx, cy, rx, ry, seed, 10), BOULDER[1], BOULDER[0]);
  shape(ctx, blob(cx - rx * 0.18, cy - ry * 0.22, rx * 0.72, ry * 0.6, seed + 1, 9), BOULDER[2]);
  shape(ctx, blob(cx - rx * 0.32, cy - ry * 0.4, rx * 0.36, ry * 0.26, seed + 2, 8), BOULDER[3]);
  flat(ctx, cx - rx * 0.4, cy - ry * 0.55, rx * 0.25, 0.8, BOULDER[4]);
  line(ctx, [[cx - rx * 0.6, cy + ry * 0.5], [cx + rx * 0.5, cy + ry * 0.62]], BOULDER[0], 0.8);
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

export const concreteBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number): void => {
  flat(ctx, x, y, w, h, RUIN[2], RUIN[4]);
  flat(ctx, x, y, w, 1.6, RUIN[3]);
  flat(ctx, x + w - 2, y, 2, h, RUIN[1]);
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed);
};

const CRATE: Tones = ["#161a12", "#262c20", "#384030", "#525c46", "#0a0c08"];
const SEAM: Tones = ["#4a3810", "#a07e28", "#c8a040", "#e8cc78", "#0c0a04"];
const STONE: Tones = ["#2e2e28", "#4c4c44", "#6c6a60", "#908c7e", "#121210"];
const GRASS: Tones = ["#2a2810", "#4a4420", "#6e6230", "#9a8644", "#141206"];
const LEAF: Tones = ["#1a2410", "#2a3a18", "#40542a", "#5e7238", "#0a0e06"];
const CONC: Tones = ["#4e4a3e", "#706a58", "#948c76", "#b4ac92", "#1a1812"];
const BRONZE: Tones = ["#2e1e0c", "#5a3e1e", "#8a6436", "#b88c54", "#120a04"];
const PLATE: Tones = ["#20262a", "#343c40", "#4c565a", "#6e787a", "#0a0e10"];
const TUBE: Tones = ["#3c4442", "#68706c", "#9aa29c", "#c8ceca", "#141816"];
const OLIVE: Tones = ["#24281a", "#3a4028", "#545c3a", "#727a50", "#0c0e08"];
const BURNT: Tones = ["#141210", "#262220", "#3a3430", "#56504a", "#080706"];
const SACK: Tones = ["#2c281a", "#4a4430", "#686046", "#867c5c", "#121008"];
const NIGHT = ["#0a1210", "#0f1b18", "#152520", "#1c3029", "#253c33"] as const;
const SIL = ["#0a100d", "#101a15", "#16231c", "#1e2e24", "#283a2e"] as const;
const AMBER = ["#5a2a08", "#c86a14", "#f0a030", "#ffe0a0"] as const;
const PORCELAIN = ["#5a5448", "#8a8474", "#bab4a2", "#e0dccc"] as const;
const SPARK = ["#3a6ad8", "#7ab4ff", "#e8f4ff"] as const;
const HOLE = "#0a0c0a";
const RUSTY = "#7a3a14";
const MARGIN = 24;

const shown = (ctx: Ctx): [number, number, number, number] => {
  const m = ctx.getTransform();
  if (m.b || m.c || !m.a || !m.d) return [-Infinity, -Infinity, Infinity, Infinity];
  const xa = -m.e / m.a;
  const xb = (ctx.canvas.width - m.e) / m.a;
  const ya = -m.f / m.d;
  const yb = (ctx.canvas.height - m.f) / m.d;
  return [min(xa, xb) - MARGIN, min(ya, yb) - MARGIN, max(xa, xb) + MARGIN, max(ya, yb) + MARGIN];
};

const eachCell = (ctx: Ctx, x: number, y: number, w: number, h: number, cw: number, ch: number, draw: (cx: number, cy: number, i: number, j: number) => void): void => {
  const [vx0, vy0, vx1, vy1] = shown(ctx);
  const i0 = max(0, floor((vx0 - x) / cw));
  const i1 = min(ceil(w / cw - 0.001), ceil((vx1 - x) / cw));
  const j0 = max(0, floor((vy0 - y) / ch));
  const j1 = min(ceil(h / ch - 0.001), ceil((vy1 - y) / ch));
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) draw(x + i * cw, y + j * ch, i, j);
};

const cellSeed = (seed: number, i: number, j: number): number => seed + i * 131 + j * 977;

const outline = (ctx: Ctx, x: number, y: number, w: number, h: number, c: string): void => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, c);
};

const band = (ctx: Ctx, x: number, y: number, w: number, h: number, t: Tones, edge = true): void => {
  const e = min(2, h / 4);
  const s = min(3, h / 4);
  flat(ctx, x, y, w, h, t[2]);
  flat(ctx, x, y, w, e, t[3]);
  flat(ctx, x, y + h - s, w, s, t[1]);
  if (edge) outline(ctx, x, y, w, h, t[4]);
};

const pier = (ctx: Ctx, x: number, y: number, w: number, h: number, t: Tones, edge = true): void => {
  flat(ctx, x, y, w, h, t[2]);
  flat(ctx, x, y, w * 0.25, h, t[3]);
  flat(ctx, x + w * 0.7, y, w * 0.3, h, t[1]);
  if (edge) outline(ctx, x, y, w, h, t[4]);
};

const tube = (ctx: Ctx, x: number, y: number, w: number, h: number, t: Tones): void => {
  flat(ctx, x, y, w, h, t[1]);
  flat(ctx, x, y + h * 0.15, w, h * 0.3, t[2]);
  flat(ctx, x, y + h * 0.2, w, h * 0.12, t[3]);
  flat(ctx, x, y + h * 0.75, w, h * 0.25, t[0]);
  outline(ctx, x, y, w, h, t[4]);
};

const strut = (ctx: Ctx, ax: number, ay: number, bx: number, by: number, w: number, t: Tones): void => {
  line(ctx, [[ax, ay], [bx, by]], t[4], w + 1, "butt");
  line(ctx, [[ax, ay], [bx, by]], t[1], w, "butt");
  line(ctx, [[ax, ay], [bx, by]], t[2], w * 0.4, "butt");
};

const jag = (x0: number, x1: number, y: number, amp: number, step: number, seed: number): Pt[] => {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let x = x0; x < x1; x += step * (0.5 + r())) pts.push([x, y - r() * amp]);
  pts.push([x1, y - r() * amp]);
  return pts;
};

const breach = (ctx: Ctx, pts: Pt[], seed: number, light: string, dark: string, fill = HOLE): void => {
  G.scorch(ctx, pts, seed);
  shape(ctx, pts, fill);
  G.rim(ctx, pts, seed + 1, light, dark);
  if (simple()) return;
  const r = rng(seed + 2);
  pts.forEach(([x, y], i) => {
    if (i % 3) return;
    line(ctx, [[x, y], [x + (r() - 0.5) * 6, y - 2 - r() * 4]], RUSTY, 0.6);
  });
};

const bulletHoles = (ctx: Ctx, x: number, y: number, w: number, h: number, n: number, seed: number, light: string): void => {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const cx = x + r() * w;
    const cy = y + r() * h;
    const pts = blob(cx, cy, 1.4 + r(), 1.2 + r(), seed + i, 7);
    shape(ctx, pts, HOLE);
    G.rim(ctx, pts, seed + 10 + i, light, HOLE);
  }
};

const soot = (ctx: Ctx, x: number, y: number, w: number, h: number): void => {
  ctx.save();
  ctx.globalAlpha = 0.35;
  shape(ctx, [[x, y], [x + w, y], [x + w * 0.8, y - h], [x + w * 0.2, y - h]], G.DIRT);
  ctx.restore();
};


const net = (ctx: Ctx, x: number, y: number, w: number, h: number, c: string, step: number): void => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = c;
  ctx.globalAlpha = simple() ? 0.35 : 0.6;
  ctx.lineWidth = simple() ? 0.5 : 0.55;
  ctx.beginPath();
  for (let i = -h; i < w + h; i += step) {
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + h, y + h);
    ctx.moveTo(x + i + h, y);
    ctx.lineTo(x + i, y + h);
  }
  ctx.stroke();
  ctx.restore();
};

const tufts = (ctx: Ctx, x: number, w: number, y: number, seed: number, density: number, tall = 5): void => {
  eachCell(ctx, x, y - tall, w, tall + 1, 4, tall + 1, (cx, _cy, i) => {
    const r = rng(seed + i * 37);
    if (r() > density) return;
    const n = 2 + floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const bx = cx + r() * 4;
      const len = tall * (0.4 + r() * 0.6);
      const c = r() < 0.4 ? LEAF[2] : r() < 0.5 ? GRASS[3] : GRASS[2];
      line(ctx, [[bx, y + 0.5], [bx + (r() - 0.5) * 3, y - len]], c, 0.8);
    }
  });
};

const palm = (ctx: Ctx, x: number, h: number, lean: number, size: number, tone: string, seed: number): void => {
  const r = rng(seed);
  const top: Pt = [x + lean, -h];
  curve(ctx, [[x, 0], [x + lean * 0.2, -h * 0.5], top], tone, max(2, size * 0.12));
  const n = 8;
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const len = size * (0.6 + r() * 0.5);
    const lift = size * (0.1 + r() * 0.25);
    const droop = size * (0.35 + r() * 0.45) * (i < 2 ? 0.4 : 1);
    const upper: Pt[] = [];
    const lower: Pt[] = [];
    const k = 8;
    for (let j = 0; j <= k; j++) {
      const u = j / k;
      const x = top[0] + side * len * u * (0.6 + 0.4 * ((i + 1) / n));
      const y = top[1] - lift * sin(u * PI * 0.8) + droop * u * u;
      const wd = size * 0.08 * (1 - u) + 0.5;
      upper.push([x, y - wd]);
      lower.push([x + side * (j % 2 ? 1.5 : 0), y + wd * (j % 2 ? 3.2 : 1)]);
    }
    shape(ctx, [...upper, ...lower.reverse()], tone);
  }
  disc(ctx, top[0], top[1], size * 0.08, tone);
};

const bush = (ctx: Ctx, cx: number, w: number, h: number, tone: string, seed: number): void => {
  shape(ctx, [[cx - w / 2, 0], ...jag(cx - w / 2, cx + w / 2, -h * 0.6, h * 0.5, 5, seed), [cx + w / 2, 0]], tone);
};

export const villageBackdrop: EnvAsset = {
  id: "villageBackdrop",
  box: [0, -170, 320, 0],
  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -170, 320, 170);
    ctx.clip();
    for (const [y, h, c] of [[-170, 50, NIGHT[0]], [-120, 32, NIGHT[1]], [-88, 28, NIGHT[2]], [-60, 26, NIGHT[3]], [-34, 34, NIGHT[4]]] as [number, number, string][]) flat(ctx, 0, y, 320, h, c);
    const r = rng(41);
    for (let i = 0; i < 9; i++) palm(ctx, 8 + i * 36 + r() * 14, 120 + r() * 40, (r() - 0.5) * 30, 34 + r() * 14, SIL[2], 50 + i);
    for (let i = 0; i < 7; i++) palm(ctx, 20 + i * 48 + r() * 16, 80 + r() * 30, (r() - 0.5) * 24, 26 + r() * 10, SIL[1], 70 + i);
    const ruins: [number, number, number][] = [[0, 34, 30], [64, 44, 22], [150, 38, 34], [236, 46, 26], [300, 30, 20]];
    for (const [x, w, h] of ruins) {
      const top = jag(x, x + w, -h, 7, 4, x + 3);
      const wall: Pt[] = [[x, 0], ...top, [x + w, 0]];
      shape(ctx, wall, SIL[4]);
      G.grain(ctx, G.polyRegion(ctx, wall), x + 5, 0.5);
      flat(ctx, x, -h + 3, w, 1.2, NIGHT[4]);
      for (let k = x + 5; k < x + w - 6; k += 11) flat(ctx, k, -h * 0.6, 5, 7, SIL[0]);
    }
    for (let x = -6; x < 330; x += 18 + r() * 16) bush(ctx, x, 26 + r() * 20, 12 + r() * 12, r() < 0.5 ? SIL[1] : SIL[0], round(x) + 90);
    flat(ctx, 0, -4, 320, 4, SIL[0]);
    ctx.restore();
  },
};

export const farPalms: EnvAsset = {
  id: "farPalms",
  box: [0, -192, 96, 0],
  draw(ctx, state, _t, { w = 96, h = 192 } = {}) {
    const seed = round(w * 7 + h * 3) + state * 11;
    const r = rng(seed);
    const n = max(1, round(w / 44));
    for (let i = 0; i < n; i++) palm(ctx, ((i + 0.5) * w) / n + (r() - 0.5) * 10, h * (0.6 + r() * 0.3), (r() - 0.5) * 20, 26 + r() * 10, i % 2 ? SIL[2] : SIL[3], seed + i);
    if (state === 1) {
      const wh = min(h * 0.4, 72);
      const wall: Pt[] = [[0, 0], ...jag(0, w, -wh, 10, 5, seed + 20), [w, 0]];
      shape(ctx, wall, SIL[3]);
      G.grain(ctx, G.polyRegion(ctx, wall), seed + 21, 0.5);
      G.drips(ctx, 0, -wh, w, wh * 0.5, seed + 22, round(w / 16), false);
      for (let x = 6; x < w - 10; x += 16) flat(ctx, x, -wh * 0.6, 7, 10, SIL[0]);
      const hole = blob(w * 0.55, -wh * 0.35, 9, 7, seed + 23, 10);
      G.scorch(ctx, hole, seed + 24);
      shape(ctx, hole, SIL[0]);
      G.rim(ctx, hole, seed + 25, SIL[4], SIL[0]);
    }
    for (let x = 4; x < w; x += 14 + r() * 10) bush(ctx, x, 18 + r() * 14, 10 + r() * 10, SIL[1], seed + round(x));
    G.dirt(ctx, 0, -24, w, 24, seed + 30, 0.6);
    flat(ctx, 0, -3, w, 3, SIL[0]);
  },
};

export const farRuins: EnvAsset = {
  id: "farRuins",
  box: [0, -192, 96, 0],
  draw(ctx, state, _t, { w = 96, h = 192 } = {}) {
    const seed = round(w * 5 + h * 7) + state * 13;
    const r = rng(seed);
    if (state === 1) {
      const top = h * 0.9;
      const legs = top * 0.55;
      for (const [a, b] of [[w * 0.2, w * 0.3], [w * 0.8, w * 0.7]] as Pt[]) line(ctx, [[a, 0], [b, -legs]], SIL[3], 3);
      for (let k = 1; k < 4; k++) {
        const y = (-legs * k) / 4;
        const dx = (w * 0.1 * k) / 4;
        line(ctx, [[w * 0.2 + dx, y], [w * 0.8 - dx, y - legs / 4]], SIL[2], 1.4);
        line(ctx, [[w * 0.8 - dx, y], [w * 0.2 + dx, y - legs / 4]], SIL[2], 1.4);
      }
      const tank: Pt[] = [[w * 0.18, -legs], [w * 0.18, -top * 0.88], [w * 0.5, -top], [w * 0.82, -top * 0.88], [w * 0.82, -legs]];
      shape(ctx, tank, SIL[3]);
      G.grain(ctx, G.polyRegion(ctx, tank), seed + 1, 0.5);
      G.drips(ctx, w * 0.18, -top * 0.86, w * 0.64, top * 0.3, seed + 2, 4, false);
      for (let k = 0; k < 3; k++) flat(ctx, w * 0.18, -legs - 8 - k * 12, w * 0.64, 1.2, SIL[4]);
      const hole = blob(w * 0.62, -legs - 18, 6, 5, seed + 3, 9);
      shape(ctx, hole, SIL[0]);
      G.rim(ctx, hole, seed + 4, SIL[4], SIL[0]);
    } else {
      const body = h * (0.55 + r() * 0.25);
      const roof: Pt[] = [[0, -body * 0.8], ...jag(0, w * 0.4, -body, 10, 5, seed + 5), [w * 0.5, -body * 0.86], ...jag(w * 0.5, w, -body * 0.7, 8, 5, seed + 6)];
      const out: Pt[] = [[0, 0], ...roof, [w, 0]];
      shape(ctx, out, SIL[3]);
      ctx.save();
      path(ctx, out);
      ctx.clip();
      flat(ctx, 0, -body, 4, body, SIL[4]);
      flat(ctx, w - 5, -body, 5, body, SIL[1]);
      for (let y = -24; y > -body + 14; y -= 30) {
        flat(ctx, 0, y, w, 2, SIL[4]);
        for (let x = 8; x < w - 10; x += 16) if (r() > 0.15) flat(ctx, x, y - 18, 8, 12, r() < 0.08 ? "#3a3420" : SIL[0]);
      }
      G.grain(ctx, G.polyRegion(ctx, out), seed + 7, 0.5);
      G.drips(ctx, 0, -body * 0.8, w, body * 0.3, seed + 8, round(w / 14), false);
      G.dirt(ctx, 0, -body, w, body, seed + 9, min(0.3, 40 / body));
      ctx.restore();
      const hole = blob(w * (0.3 + r() * 0.4), -body * 0.55, w * 0.14, 10, seed + 10, 11);
      G.scorch(ctx, hole, seed + 11);
      shape(ctx, hole, SIL[0]);
      G.rim(ctx, hole, seed + 12, SIL[4], SIL[0]);
    }
    for (let x = 0; x < w; x += 16 + r() * 12) bush(ctx, x, 16 + r() * 12, 8 + r() * 8, SIL[1], seed + 40 + round(x));
  },
};

const crateCell = (ctx: Ctx, x: number, y: number, s: number): void => {
  const r = rng(s);
  const t = CRATE;
  flat(ctx, x, y, 24, 24, t[1]);
  flat(ctx, x + 1.2, y + 1.2, 21.6, 17.6, r() < 0.2 ? t[0] : t[1]);
  flat(ctx, x, y, 24, 1.2, t[3]);
  flat(ctx, x, y, 1.2, 19, t[2]);
  flat(ctx, x + 22.8, y, 1.2, 19, t[0]);
  shape(ctx, [[x + 2, y + 15], [x + 17, y + 2], [x + 22, y + 2], [x + 22, y + 5], [x + 7, y + 18], [x + 2, y + 18]], t[2], t[4]);
  if (!simple()) line(ctx, [[x + 3, y + 15], [x + 17.5, y + 2.6]], t[3], 0.6);
  flat(ctx, x + 15.5, y + 1.2, 2.6, 17.6, t[2]);
  flat(ctx, x + 15.5, y + 1.2, 0.8, 17.6, t[3]);
  if (!simple()) for (const [px, py] of [[3, 3], [21, 3], [3, 17], [21, 17]] as Pt[]) flat(ctx, x + px - 0.7, y + py - 0.7, 1.4, 1.4, t[3]);
  flat(ctx, x, y + 19, 24, 5, t[4]);
  flat(ctx, x + 0.6, y + 20.4, 22.8, 1.6, r() < 0.15 ? SEAM[0] : SEAM[1]);
  if (!simple()) flat(ctx, x + 0.6, y + 20.4, 22.8, 0.5, SEAM[3]);
  if (r() < 0.3) G.rustPatch(ctx, x + 4 + r() * 14, y + 6 + r() * 8, 2 + r() * 2, 1.2 + r(), s + 1);
  if (r() < 0.5) G.drips(ctx, x + 2, y + 22, 20, 10, s + 2, 1);
  if (r() < 0.12) {
    const dent = blob(x + 8 + r() * 8, y + 8 + r() * 6, 3 + r() * 2, 2.4, s + 3, 8);
    shape(ctx, dent, t[0]);
    G.rim(ctx, dent, s + 4, t[3], t[4]);
  }
};

export const crateWall: EnvAsset = {
  id: "crateWall",
  box: [0, -96, 96, 0],
  draw(ctx, _state, _t, { w = 96, h = 96 } = {}) {
    const seed = 3100;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -h, w, h);
    ctx.clip();
    eachCell(ctx, 0, -h, w, h, 24, 24, (x, y, i, j) => crateCell(ctx, x, y, cellSeed(seed, i, j)));
    G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 0.8);
    G.dirt(ctx, 0, -h, w, h, seed + 2, min(0.3, 48 / h));
    ctx.restore();
  },
};

const plateCell = (ctx: Ctx, x: number, y: number, s: number): void => {
  const r = rng(s);
  const t = PLATE;
  flat(ctx, x, y, 24, 24, t[1]);
  flat(ctx, x + 1, y + 1, 22, 22, r() < 0.25 ? t[1] : t[2]);
  flat(ctx, x + 1, y + 1, 22, 1, t[3]);
  flat(ctx, x + 1, y + 1, 1, 22, t[3]);
  flat(ctx, x + 22, y + 1, 1, 22, t[0]);
  flat(ctx, x + 1, y + 22, 22, 1, t[0]);
  outline(ctx, x, y, 24, 24, t[4]);
  rivets(ctx, x + 1, y + 3, 22, 4, t[3]);
  rivets(ctx, x + 1, y + 21, 22, 4, t[3]);
  G.drips(ctx, x + 1, y + 4, 22, 14, s + 1, r() < 0.5 ? 2 : 1);
  if (r() < 0.35) G.rustPatch(ctx, x + 4 + r() * 16, y + 8 + r() * 10, 2 + r() * 3, 1.4 + r(), s + 2);
  if (r() < 0.2) bulletHoles(ctx, x + 3, y + 5, 18, 14, 1 + floor(r() * 3), s + 3, t[3]);
};

export const rivetWall: EnvAsset = {
  id: "rivetWall",
  box: [0, -192, 72, 0],
  draw(ctx, state, _t, { w = 72, h = 192 } = {}) {
    const seed = 3200 + state;
    const post = state === 0 ? 10 : 0;
    const pw = w - post;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -h, pw, h);
    ctx.clip();
    eachCell(ctx, 0, -h, pw, h, 24, 24, (x, y, i, j) => {
      const off = j % 2 ? -12 : 0;
      plateCell(ctx, x + off, y, cellSeed(seed, i, j));
      if (off && x + 24 >= pw - 0.001) plateCell(ctx, x + 12, y, cellSeed(seed, i + 1, j));
    });
    G.grain(ctx, G.rectRegion(ctx, 0, -h, pw, h), seed + 1);
    G.dirt(ctx, 0, -h, pw, h, seed + 2, min(0.3, 40 / h));
    ctx.restore();
    if (state !== 0) return;
    pier(ctx, pw, -h, post, h, PLATE);
    flat(ctx, pw + 1, -h, 1.6, h, PLATE[3]);
    flat(ctx, pw + post - 2.6, -h, 1.6, h, PLATE[0]);
    for (let y = -h + 12; y < 0; y += 24) {
      flat(ctx, pw - 1, y, post + 2, 3, PLATE[3], PLATE[4]);
      G.drips(ctx, pw, y + 3, post, 10, seed + 10 - y, 1);
    }
    G.surface(ctx, pw, -h, post, h, seed + 3, { rise: min(0.3, 40 / h), drip: 1, dripLen: 30, edge: false });
  },
};

export const plankWall: EnvAsset = {
  id: "plankWall",
  box: [0, -192, 72, 0],
  draw(ctx, state, _t, { w = 72, h = 192 } = {}) {
    const seed = 3300 + state;
    const r = rng(seed);
    planks(ctx, 0, -h, w, h, seed, true);
    eachCell(ctx, 0, -h, w, h, 6, 24, (x, y, i, j) => {
      const k = rng(cellSeed(seed, i, j))();
      if (k < 0.06) flat(ctx, x + 0.4, y, 5, 24, HOLE);
      else if (k < 0.12) flat(ctx, x + 0.4, y, 5, 24, PLANK[0]);
    });
    for (const x of [0, w - 8]) {
      pier(ctx, x, -h, 8, h, PLANK);
      G.surface(ctx, x, -h, 8, h, seed + x + 1, { rise: 0.2, edge: false });
    }
    for (let y = -h + 30; y < -10; y += 60) {
      band(ctx, 0, y, w, 6, PLANK);
      if (!simple()) for (let x = 4; x < w; x += 6) flat(ctx, x, y + 2.5, 1, 1, "#9a948a");
      G.drips(ctx, 0, y + 6, w, 12, seed + 5 - y, round(w / 18));
    }
    G.chips(ctx, 0, -h, w, seed + 6, G.DIRT);
    if (state === 1) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      shape(ctx, [[0, 0], ...jag(0, w, -h * 0.45, h * 0.15, 6, seed + 7), [w, 0]], BURNT[0]);
      ctx.restore();
      for (let k = 0; k < 2; k++) {
        const hole = blob(w * (0.3 + k * 0.4), -h * (0.3 + r() * 0.3), 8 + r() * 4, 10 + r() * 6, seed + 8 + k, 11);
        breach(ctx, hole, seed + 10 + k * 3, "#c87a3a", BURNT[0]);
      }
      G.chips(ctx, 0, -h * 0.45, w, seed + 20, "#d0702a");
    }
    tufts(ctx, 0, w, 0, seed + 30, 0.6, 4);
  },
};

const DEPOT_BAY = 72;
const DEPOT_WALL = 48;
const GRAFFITI = ["4R", "AR", "KR", "4X"];
const SCRAWL = ["atcB", "zBt", "ocB", "tcR"];

const sprayed = (ctx: Ctx, str: string, x: number, y: number, size: number, c: string, alpha: number): void => {
  ctx.save();
  ctx.globalAlpha = alpha * 0.35;
  text(ctx, str, x + 0.6, y + 0.5, size * 1.08, c);
  ctx.globalAlpha = alpha;
  text(ctx, str, x, y, size, c);
  ctx.restore();
};

const depotWall = (ctx: Ctx, x: number, seed: number): void => {
  const w = DEPOT_WALL;
  flat(ctx, x, -48, w, 30, "#2a1c12", "#0e0804");
  G.grain(ctx, G.rectRegion(ctx, x, -48, w, 30), seed);
  G.grain(ctx, G.rectRegion(ctx, x, -48, w, 30), seed + 1, 0.6);
  for (let k = 0; k < 2; k++) {
    const cx = x + 12 + k * 24;
    const word = GRAFFITI[(seed + k) % GRAFFITI.length] as string;
    sprayed(ctx, word, cx, -40, 11, "#e06a1c", 0.9);
    sprayed(ctx, word, cx - 0.8, -40.6, 10, "#b8281a", 0.95);
    sprayed(ctx, SCRAWL[(seed + k * 3) % SCRAWL.length] as string, cx, -25, 5.4, "#b8ae94", 0.6);
  }
  G.drips(ctx, x, -48, w, 16, seed + 2, 4);
  G.chips(ctx, x, -48, w, seed + 3);
  flat(ctx, x, -18, w, 4, OLIVE[2], OLIVE[4]);
  if (!simple()) for (let k = 0; k < 6; k++) flat(ctx, x + 3 + k * 8, -17, 3, 1.2, CONC[3]);
  band(ctx, x, -14, w, 14, CONC);
  G.surface(ctx, x, -14, w, 14, seed + 4, { rise: 0.5, drip: 2, dripLen: 8 });
};

const depotBay = (ctx: Ctx, x: number, seed: number): void => {
  const w = DEPOT_BAY - DEPOT_WALL;
  flat(ctx, x - 1, -34, w, 10, "#3a3834", "#0e0e0c");
  text(ctx, "AMMO", x + w / 2 - 2, -29, 5, "#b4b0a4");
  flat(ctx, x + w - 3, -35, 3, 12, SEAM[2], SEAM[4]);
  G.grain(ctx, G.rectRegion(ctx, x - 1, -34, w, 10), seed, 0.6);
  G.drips(ctx, x - 1, -24, w, 6, seed + 1, 2);
  flat(ctx, x, -24, w, 5, OLIVE[1], OLIVE[4]);
  flat(ctx, x + 2, -6, 11, 6, OLIVE[2], OLIVE[4]);
  flat(ctx, x + 2, -6, 11, 1.2, OLIVE[3]);
  flat(ctx, x + 13, -6, 2, 6, SEAM[2], SEAM[4]);
  flat(ctx, x + 16, -4.5, 6, 4.5, CONC[3], CONC[4]);
  if (!simple()) flat(ctx, x + 17, -3, 4, 0.8, OLIVE[1]);
  G.dirt(ctx, x, -6, w, 6, seed + 2, 0.6);
};

export const ammoDepot: EnvAsset = {
  id: "ammoDepot",
  box: [-4, -52, 220, 0],
  draw(ctx, _state, _t, { w = 216 } = {}) {
    const seed = 3400;
    for (let x = 0, b = 0; x < w; x += DEPOT_BAY, b++) {
      depotWall(ctx, x, seed + b * 11);
      if (x + DEPOT_BAY <= w) depotBay(ctx, x + DEPOT_WALL, seed + b * 11 + 5);
    }
  },
};

const FENCE_POST = 72;

export const meshFence = (ctx: Ctx, state: number, w: number): void => {
  const seed = 3500 + state;
  const r = rng(seed);
  const tear = blob(w * 0.42, -24, 13, 15, seed + 1, 13);
  ctx.save();
  if (state === 1) {
    path(ctx, tear);
    ctx.rect(0, -52, w, 52);
    ctx.clip("evenodd");
  }
  flat(ctx, 0, -50, w, 48, "#00000022");
  net(ctx, 0, -50, w, 48, "#8a9488", 4);
  ctx.restore();
  if (state === 1) {
    G.rim(ctx, tear, seed + 2, "#b0b8ae", RUSTY);
    if (!simple())
      tear.forEach(([x, y], i) => {
        if (i % 2 === 0) line(ctx, [[x, y], [x + (r() - 0.5) * 5, y + (r() - 0.3) * 5]], "#8a9488", 0.5);
      });
    G.rustPatch(ctx, w * 0.42 + 10, -14, 5, 3, seed + 3);
  }
  tube(ctx, 0, -52, w, 2.6, TUBE);
  tube(ctx, 0, -3, w, 2, TUBE);
  G.drips(ctx, 0, -49.4, w, 18, seed + 4, round(w / 14));
  for (let x = 0; x < w; x += FENCE_POST) {
    const px = min(x, w - 3);
    pier(ctx, px, -56, 3, 56, TUBE);
    flat(ctx, px - 0.6, -57, 4.2, 1.6, TUBE[1], TUBE[4]);
    G.drips(ctx, px, -54, 3, 30, seed + 10 + x, 1);
    if (state === 0 && (x / FENCE_POST) % 2 === 0 && x + 30 < w) {
      flat(ctx, px + 12, -44, 16, 9, "#9a9a92", "#1e1e1a");
      flat(ctx, px + 14, -41.5, 12, 1.4, "#a8281c");
      flat(ctx, px + 14, -38.5, 8, 1.4, "#a8281c");
      G.chips(ctx, px + 12, -44, 16, seed + 20 + x, G.DIRT);
      G.drips(ctx, px + 12, -35, 16, 8, seed + 21 + x, 2);
    }
  }
  if (w > 6) G.grain(ctx, G.rectRegion(ctx, 0, -12, w, 12), seed + 5, 0.6);
  G.dirt(ctx, 0, -16, w, 16, seed + 6, 0.6);
  tufts(ctx, 0, w, 0, seed + 7, 0.7, 7);
};

const curb = (ctx: Ctx, x: number, w: number, seed: number, trampled: boolean): void => {
  flat(ctx, x, 0, w, 24, STONE[0]);
  flat(ctx, x, 0, w, 6, trampled ? "#3a3220" : GRASS[1]);
  flat(ctx, x, 0, w, 1.6, trampled ? "#5a4a2a" : GRASS[2]);
  eachCell(ctx, x, 5, w, 15, 12, 15, (cx, _cy, i) => {
    const r = rng(seed + i * 53);
    const sx = cx + 0.6 + r();
    const sw = 10.4 - r() * 1.6;
    const sy = 6.5 + r() * 1.2;
    const sh = 11.5 - r() * 1.2;
    const stone: Pt[] = [[sx + 1.5, sy], [sx + sw - 1.5, sy], [sx + sw, sy + 2], [sx + sw, sy + sh - 1.5], [sx + sw - 2, sy + sh], [sx + 2, sy + sh], [sx, sy + sh - 2], [sx, sy + 1.5]];
    shape(ctx, stone, r() < 0.3 ? STONE[1] : STONE[2], STONE[4]);
    if (!simple()) {
      flat(ctx, sx + 1.5, sy + 0.6, sw - 3, 1.2, STONE[3]);
      if (r() < 0.4) line(ctx, [[sx + 2 + r() * 4, sy + 2], [sx + 3 + r() * 5, sy + sh - 2]], STONE[4], 0.5);
    }
    if (r() < 0.35) G.drips(ctx, sx + 1, sy + sh - 1, sw - 2, 6, seed + i * 7 + 1, 1, false);
    if (!trampled && r() < 0.3) flat(ctx, sx, sy, sw * (0.3 + r() * 0.4), 1.6, LEAF[1]);
  });
  flat(ctx, x, 19.5, w, 4.5, STONE[4]);
  G.grain(ctx, G.rectRegion(ctx, x, 0, w, 24), seed + 1);
  G.chips(ctx, x, 0.4, w, seed + 2, G.DIRT);
  G.dirt(ctx, x, 12, w, 12, seed + 3, 0.6);
  tufts(ctx, x, w, 1, seed + 4, trampled ? 0.25 : 0.85, trampled ? 3 : 6);
};

export const grassyWalkway: EnvAsset = {
  id: "grassyWalkway",
  box: [0, -6, 120, 25],
  draw(ctx, state, _t, { w = 120 } = {}) {
    curb(ctx, 0, w, 3600 + state * 7, state === 1);
  },
};

export const steelDeckPlate: EnvAsset = {
  id: "steelDeckPlate",
  box: [0, -6, 72, 25],
  draw(ctx, _state, _t, { w = 72 } = {}) {
    const seed = 3700;
    eachCell(ctx, 0, 0, w, 24, 24, 24, (x, _y, i) => {
      const r = rng(seed + i * 31);
      band(ctx, x, 0, 24, 19, PLATE);
      if (!simple()) for (let k = 0; k < 4; k++) line(ctx, [[x + 3 + k * 5, 6], [x + 5 + k * 5, 4]], PLATE[3], 0.7);
      rivets(ctx, x, 2.5, 24, 6, PLATE[3]);
      rivets(ctx, x, 16, 24, 6, PLATE[3]);
      G.drips(ctx, x + 1, 3, 22, 14, seed + i * 31 + 1, 2);
      if (r() < 0.5) G.rustPatch(ctx, x + 4 + r() * 16, 10, 2.5 + r() * 2, 1.4, seed + i * 31 + 2);
      if (r() < 0.25) bulletHoles(ctx, x + 3, 6, 18, 8, 1, seed + i * 31 + 3, PLATE[3]);
    });
    flat(ctx, 0, 19, w, 5, PLATE[4]);
    flat(ctx, 0, 20.5, w, 1, SEAM[1]);
    G.grain(ctx, G.rectRegion(ctx, 0, 0, w, 24), seed + 4);
    G.chips(ctx, 0, 0.4, w, seed + 5);
    tufts(ctx, 0, w, 1, seed + 6, 0.3, 4);
  },
};

export const trussWalkway: EnvAsset = {
  id: "trussWalkway",
  box: [0, -30, 144, 1],
  draw(ctx, _state, _t, { w = 144 } = {}) {
    const seed = 3800 + round(w);
    eachCell(ctx, 14, -17, w - 28, 13, 24, 13, (x) => {
      strut(ctx, x + 1, -16, x + 23, -4, 2.6, BRONZE);
      strut(ctx, x + 1, -4, x + 23, -16, 2.6, BRONZE);
    });
    band(ctx, 0, -5, w, 5, BRONZE);
    rivets(ctx, 0, -2.5, w, 8, BRONZE[3]);
    flat(ctx, 0, -24, w, 8, STONE[1], STONE[4]);
    flat(ctx, 0, -24, w, 3, GRASS[1]);
    flat(ctx, 0, -24, w, 1, GRASS[2]);
    eachCell(ctx, 0, -21, w, 5, 12, 5, (x, _y, i) => {
      flat(ctx, x + 11, -21, 1, 5, STONE[4]);
      if (rng(seed + i)() < 0.4) flat(ctx, x + 1, -20.4, 9, 1, STONE[3]);
    });
    flat(ctx, 0, -16.5, w, 1.4, STONE[4]);
    G.grain(ctx, G.rectRegion(ctx, 0, -24, w, 24), seed + 1);
    eachCell(ctx, 0, -24, w, 24, 96, 24, (x, _y, i) => {
      const cw = min(96, w - x);
      const r = rng(seed + 10 + i);
      G.drips(ctx, x, -16, cw, 12, seed + 11 + i * 3, 3, false);
      G.drips(ctx, x, -5, cw, 6, seed + 12 + i * 3, 2);
      if (r() < 0.6) G.rustPatch(ctx, x + r() * cw, -3, 3, 1.2, seed + 13 + i * 3);
      G.chips(ctx, x, -23.6, cw, seed + 14 + i * 3, G.DIRT);
    });
    for (const x of [0, w - 14]) {
      pier(ctx, x, -24, 14, 24, STONE);
      if (!simple()) for (let y = -20; y < 0; y += 6) flat(ctx, x + 1, y, 12, 0.8, STONE[4]);
      G.surface(ctx, x, -24, 14, 24, seed + 20 + x, { rise: 0.4, drip: 1, dripLen: 10 });
    }
    tufts(ctx, 0, w, -23, seed + 30, 0.8, 5);
  },
};

const STOREY = 72;

const windowPane = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number): void => {
  const r = rng(seed);
  flat(ctx, x - 2, y - 2, w + 4, h + 4, CONC[1], CONC[4]);
  flat(ctx, x, y, w, h, HOLE);
  const kind = r();
  if (kind < 0.3) {
    for (let k = 0; k < 3; k++) {
      ctx.save();
      ctx.translate(x + w / 2, y + 3 + (k * (h - 6)) / 2);
      ctx.rotate((r() - 0.5) * 0.3);
      flat(ctx, -w / 2 - 1, -1.8, w + 2, 3.6, k % 2 ? PLANK[2] : PLANK[1], PLANK[4]);
      ctx.restore();
    }
  } else if (!simple()) {
    flat(ctx, x + w / 2 - 0.6, y, 1.2, h, CONC[0]);
    flat(ctx, x, y + h / 2 - 0.6, w, 1.2, CONC[0]);
    if (kind > 0.6) shape(ctx, [[x, y + h], [x + w * 0.3, y + h * 0.4], [x + w * 0.45, y + h]], "#1c2a2c");
  }
  band(ctx, x - 3, y + h + 1, w + 6, 2.6, CONC);
  G.drips(ctx, x - 2, y + h + 3.6, w + 4, 14, seed + 1, 2);
  if (r() < 0.35) soot(ctx, x, y, w, 10);
};

export const villageHouse: EnvAsset = {
  id: "villageHouse",
  box: [-4, -160, 196, 2],
  draw(ctx, state, _t, { w = 192, h = 144 } = {}) {
    const seed = 3900 + state * 17 + round(w);
    const r = rng(seed);
    const storeys = max(1, round(h / STOREY));
    const sh = h / storeys;
    const ruined = state === 1;
    const roof: Pt[] = ruined ? [[0, -h * 0.72], ...jag(0, w * 0.35, -h, 10, 6, seed + 1), [w * 0.45, -h * 0.8], ...jag(w * 0.5, w, -h * 0.9, 12, 6, seed + 2), [w, -h * 0.7]] : [[0, -h], [w, -h]];
    const body: Pt[] = [[0, 0], ...roof, [w, 0]];
    shape(ctx, body, CONC[2], CONC[4]);
    G.grain(ctx, G.polyRegion(ctx, body), seed + 3);
    G.dirt(ctx, 0, -h, w, h, seed + 4, min(0.3, 48 / h));
    ctx.save();
    path(ctx, body);
    ctx.clip();
    const bays = max(1, round((w - 28) / 44));
    const bw = (w - 28) / bays;
    for (let s = 0; s < storeys; s++) {
      const y0 = -(s + 1) * sh;
      for (let b = 0; b < bays; b++) {
        const x = 14 + b * bw;
        if (s === 0 && b === floor(bays / 2)) {
          if (ruined) {
            const arch: Pt[] = [[x + 4, 0], [x + 4, -sh * 0.55], ...Array.from({ length: 9 }, (_, k) => [x + bw / 2 - cos((k / 8) * PI) * (bw / 2 - 4), -sh * 0.55 - sin((k / 8) * PI) * (bw / 2 - 4) * 0.7] as Pt), [x + bw - 4, -sh * 0.55], [x + bw - 4, 0]];
            shape(ctx, arch, HOLE, CONC[4]);
            G.rim(ctx, arch, seed + 5, CONC[3], CONC[4]);
          } else {
            flat(ctx, x + bw / 2 - 9, -sh * 0.7, 18, sh * 0.7, HOLE, CONC[4]);
            shape(ctx, [[x + bw / 2 - 9, 0], [x + bw / 2 - 9, -sh * 0.7], [x + bw / 2 - 2, -sh * 0.66], [x + bw / 2 - 2, -2]], PLANK[2], PLANK[4]);
            band(ctx, x + bw / 2 - 12, -sh * 0.7 - 4, 24, 4, CONC);
          }
          continue;
        }
        windowPane(ctx, x + 6, y0 + sh * 0.22, bw - 12, sh * 0.42, seed + 10 + s * 31 + b);
      }
      if (s > 0) {
        band(ctx, -2, y0 + sh - 5, w + 4, 5, CONC);
        G.chips(ctx, -2, y0 + sh - 5, w + 4, seed + 40 + s, G.DIRT);
        G.drips(ctx, 0, y0 + sh, w, sh * 0.4, seed + 41 + s, round(w / 24));
      }
      G.rustPatch(ctx, 20 + r() * (w - 40), y0 + sh * 0.8, 4 + r() * 3, 2, seed + 50 + s);
    }
    for (let b = 0; b <= bays; b++) {
      const x = b === 0 ? 0 : b === bays ? w - 14 : 14 + b * bw - 3;
      const pw = b === 0 || b === bays ? 14 : 6;
      pier(ctx, x, -h, pw, h, CONC, false);
      G.surface(ctx, x, -h, pw, h, seed + 60 + b, { rise: min(0.3, 40 / h), drip: 1, dripLen: 30, edge: false });
    }
    ctx.restore();
    if (ruined) {
      const hole = blob(w * 0.7, -h * 0.55, w * 0.12, sh * 0.32, seed + 70, 14);
      breach(ctx, hole, seed + 71, CONC[3], CONC[4], "#0c1412");
      line(ctx, roof, CONC[4], 1);
      for (const [x, cw, ch] of [[w * 0.2, 10, 6], [w * 0.62, 14, 8], [w * 0.85, 8, 5]] as Pt3[]) shape(ctx, [[x, 0], [x + cw * 0.3, -ch], [x + cw * 0.8, -ch * 0.7], [x + cw, 0]], CONC[1], CONC[4]);
    } else {
      band(ctx, -3, -h - 6, w + 6, 6, CONC);
      G.chips(ctx, -3, -h - 6, w + 6, seed + 72, G.DIRT);
      G.drips(ctx, -3, -h, w + 6, 24, seed + 73, round(w / 20));
      if (!simple()) for (let x = 6; x < w; x += 30 + r() * 20) line(ctx, [[x, -h - 6], [x + 1, -h - 10]], RUSTY, 0.7);
    }
    flat(ctx, 0, -4, w, 4, CONC[1], CONC[4]);
  },
};

type Pt3 = [number, number, number];

export const stiltBuilding: EnvAsset = {
  id: "stiltBuilding",
  box: [-8, -204, 248, 2],
  draw(ctx, state, _t, { w = 240, h = 192 } = {}) {
    const seed = 4000 + state * 19 + round(w);
    const r = rng(seed);
    const burnt = state === 1;
    const stilt = max(24, round((h * 0.38) / 24) * 24);
    const top = -h + 10;
    const legs = [10, w / 2 - 8, w - 26];
    for (const x of legs) {
      pier(ctx, x, -stilt, 16, stilt, CONC);
      G.surface(ctx, x, -stilt, 16, stilt, seed + round(x), { rise: 0.4, drip: 2, dripLen: 24, edge: false });
      flat(ctx, x - 3, -6, 22, 6, CONC[1], CONC[4]);
    }
    strut(ctx, legs[0]! + 16, -stilt + 8, legs[1]!, -12, 2.4, BRONZE);
    strut(ctx, legs[2]!, -stilt + 8, legs[1]! + 16, -12, 2.4, BRONZE);
    const bodyH = -stilt - top;
    planks(ctx, 0, top, w, bodyH, seed + 1);
    band(ctx, -4, -stilt - 8, w + 8, 8, PLANK);
    G.drips(ctx, -4, -stilt, w + 8, 18, seed + 2, round(w / 20));
    const rows = max(1, round(bodyH / 60));
    const rh = bodyH / rows;
    const cols = max(1, round((w - 24) / 26));
    const cw = (w - 24) / cols;
    for (let k = 0; k < rows; k++) {
      const y = top + k * rh + rh * 0.2;
      for (let c = 0; c < cols; c++) {
        const x = 12 + c * cw + 3;
        flat(ctx, x - 1.5, y - 1.5, cw - 3, rh * 0.55 + 3, PLANK[3], PLANK[4]);
        flat(ctx, x, y, cw - 6, rh * 0.55, HOLE);
        if (!simple() && r() < 0.4) flat(ctx, x, y, cw - 6, rh * 0.2, "#24302c");
        if (r() < 0.25) {
          ctx.save();
          ctx.translate(x + (cw - 6) / 2, y + rh * 0.3);
          ctx.rotate((r() - 0.5) * 0.5);
          flat(ctx, -cw / 2, -2, cw, 4, PLANK[2], PLANK[4]);
          ctx.restore();
        }
      }
      if (k > 0) band(ctx, 0, top + k * rh - 3, w, 4, PLANK);
    }
    for (const x of [0, w / 2 - 5, w - 10]) {
      pier(ctx, x, top, 10, bodyH, PLANK);
      G.surface(ctx, x, top, 10, bodyH, seed + 30 + round(x), { rise: 0.2, edge: false });
    }
    const eave: Pt[] = burnt
      ? [[-8, top], [-6, top - 6], ...jag(0, w * 0.4, top - 10, 6, 6, seed + 40), [w * 0.5, top - 2], ...jag(w * 0.6, w, top - 8, 6, 6, seed + 41), [w + 6, top - 4], [w + 8, top]]
      : [[-8, top], [-4, top - 10], [w + 4, top - 10], [w + 8, top]];
    shape(ctx, eave, BRONZE[1], BRONZE[4]);
    if (!simple()) for (let x = -4; x < w + 4; x += 5) line(ctx, [[x, top - 9.5], [x + 1, top - 0.5]], BRONZE[0], 0.6);
    G.drips(ctx, -8, top, w + 16, 16, seed + 42, round(w / 16));
    G.rustPatch(ctx, w * 0.3, top - 5, 6, 2, seed + 43);
    if (burnt) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      shape(ctx, [[0, -stilt - 8], ...jag(0, w, top + bodyH * 0.35, bodyH * 0.3, 8, seed + 50), [w, -stilt - 8]], BURNT[0]);
      ctx.restore();
      for (let k = 0; k < 3; k++) {
        const hole = blob(w * (0.2 + k * 0.3), top + bodyH * (0.35 + r() * 0.3), 12 + r() * 6, 10 + r() * 6, seed + 51 + k, 12);
        breach(ctx, hole, seed + 55 + k * 3, "#c87a3a", BURNT[0]);
      }
      for (let k = 0; k < 4; k++) {
        const x = w * (0.15 + k * 0.22);
        shape(ctx, [[x, top - 6], [x + 2, top - 24 - r() * 12], [x + 5, top - 6]], BURNT[2], BURNT[4]);
      }
    }
    G.dirt(ctx, 0, top, w, bodyH, seed + 60, 0.25);
  },
};

const insulator = (ctx: Ctx, x: number, y: number, n: number): void => {
  flat(ctx, x - 0.8, y - n * 3, 1.6, n * 3, PORCELAIN[0]);
  for (let k = 0; k < n; k++) {
    flat(ctx, x - 3, y - k * 3 - 2.4, 6, 2, PORCELAIN[2], PORCELAIN[0]);
    if (!simple()) flat(ctx, x - 3, y - k * 3 - 2.4, 6, 0.6, PORCELAIN[3]);
  }
};

const arc = (ctx: Ctx, ax: number, ay: number, bx: number, by: number, seed: number): void => {
  const r = rng(seed);
  const n = 6;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push([ax + ((bx - ax) * i) / n + (i % n ? (r() - 0.5) * 5 : 0), ay + ((by - ay) * i) / n + (i % n ? (r() - 0.5) * 5 : 0)]);
  if (!simple()) glow(ctx, (ax + bx) / 2, (ay + by) / 2, 12, SPARK[1], 0.35);
  line(ctx, pts, SPARK[0], 2);
  line(ctx, pts, SPARK[2], 0.7);
};

const boltSign = (ctx: Ctx, cx: number, cy: number, s: number): void => {
  shape(ctx, [[cx + 0.1 * s, cy - 0.5 * s], [cx - 0.3 * s, cy + 0.05 * s], [cx, cy + 0.05 * s], [cx - 0.15 * s, cy + 0.5 * s], [cx + 0.3 * s, cy - 0.1 * s], [cx, cy - 0.1 * s], [cx + 0.2 * s, cy - 0.5 * s]], SEAM[2], SEAM[4]);
};

const hvPanel = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number): void => {
  flat(ctx, x, y, w, h, "#16402e", "#06120c");
  flat(ctx, x + 2, y + 2, w - 4, h - 4, "#1e5a3e");
  flat(ctx, x + 2, y + 2, w - 4, 1, "#3a8a62");
  boltSign(ctx, x + w / 2, y + h / 2, min(w, h) * 0.7);
  G.drips(ctx, x, y + h, w, 10, seed, 2);
  G.chips(ctx, x, y + 1, w, seed + 1, G.DIRT);
};

const grille = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number): void => {
  flat(ctx, x - 1.5, y - 1.5, w + 3, h + 3, CONC[1], CONC[4]);
  flat(ctx, x, y, w, h, HOLE);
  for (let k = x + 2; k < x + w - 1; k += 4) pier(ctx, k, y, 2.4, h, TUBE, false);
  G.drips(ctx, x, y + h + 1.5, w, 16, seed, 2);
};

export const powerHouse: EnvAsset = {
  id: "powerHouse",
  box: [-4, -150, 172, 2],
  draw(ctx, state, _t, { w = 168, h = 120 } = {}) {
    const seed = 4100 + state * 23 + round(w);
    const r = rng(seed);
    const broken = state === 1;
    const roof: Pt[] = broken ? [[0, -h], ...jag(4, w * 0.45, -h, 4, 5, seed + 1), [w * 0.5, -h + 14], [w * 0.62, -h + 10], ...jag(w * 0.66, w, -h, 4, 5, seed + 2)] : [[0, -h], [w, -h]];
    const body: Pt[] = [[0, 0], ...roof, [w, 0]];
    shape(ctx, body, CONC[2], CONC[4]);
    G.grain(ctx, G.polyRegion(ctx, body), seed + 3);
    G.drips(ctx, 0, -h, w, h * 0.5, seed + 4, round(w / 14));
    G.dirt(ctx, 0, -h, w, h, seed + 5, 0.3);
    band(ctx, 0, -h * 0.55, w, 4, CONC);
    G.chips(ctx, 0, -h * 0.55, w, seed + 6, G.DIRT);
    const bays = max(2, round(w / 40));
    const bw = w / bays;
    for (let b = 0; b < bays; b++) {
      const x = b * bw;
      if (b === floor(bays / 2)) {
        flat(ctx, x + bw / 2 - 10, -h * 0.5, 20, h * 0.5, "#3a4440", PLATE[4]);
        flat(ctx, x + bw / 2 - 8, -h * 0.48, 16, h * 0.46, "#4c5852");
        hvPanel(ctx, x + bw / 2 - 7, -h * 0.85, 14, 16, seed + 7);
        G.rustPatch(ctx, x + bw / 2, -h * 0.2, 4, 2, seed + 8);
        continue;
      }
      grille(ctx, x + 8, -h * 0.9, bw - 16, h * 0.28, seed + 10 + b);
      grille(ctx, x + 8, -h * 0.45, bw - 16, h * 0.2, seed + 20 + b);
    }
    line(ctx, [[4, -h * 0.6], [w - 4, -h * 0.6]], "#20201c", 1.6);
    for (let x = 10; x < w; x += 24) flat(ctx, x, -h * 0.6 - 1.5, 2, 3, TUBE[2]);
    for (const x of [0, w - 12]) {
      pier(ctx, x, -h, 12, h, CONC, false);
      G.surface(ctx, x, -h, 12, h, seed + 30 + round(x), { rise: 0.3, drip: 1, dripLen: 30, edge: false });
    }
    if (broken) {
      for (let k = 0; k < 3; k++) {
        const x = w * (0.48 + k * 0.08);
        line(ctx, [[x, -h + 12], [x + (r() - 0.5) * 10, -h - 6 - r() * 8]], RUSTY, 1);
      }
      arc(ctx, w * 0.5, -h + 8, w * 0.6, -h - 10, seed + 40);
      const hole = blob(w * 0.25, -h * 0.75, 9, 7, seed + 41, 10);
      breach(ctx, hole, seed + 42, CONC[3], CONC[4]);
    } else {
      band(ctx, -2, -h - 4, w + 4, 4, CONC);
      for (let x = 16; x < w - 10; x += 28) insulator(ctx, x, -h - 4, 3);
      if (!simple()) curve(ctx, [[16, -h - 13], [w / 2, -h - 8], [w - 12, -h - 13]], "#141410", 0.7);
    }
    flat(ctx, 0, -4, w, 4, CONC[1], CONC[4]);
  },
};

const lampBox = (ctx: Ctx, x: number, y: number, lit: boolean, seed: number): void => {
  flat(ctx, x, y, 22, 20, "#2a1e14", "#0a0604");
  flat(ctx, x + 1, y + 1, 20, 1, "#4a3828");
  ctx.fillStyle = color(lit ? AMBER[1] : "#2a2018");
  ctx.beginPath();
  ctx.arc(x + 11, y + 9, 6, PI, 0);
  ctx.fill();
  stroke(ctx, "#0a0604");
  if (lit) {
    if (!simple()) glow(ctx, x + 11, y + 6, 16, AMBER[2], 0.4);
    flat(ctx, x + 8, y + 5, 3, 1.6, AMBER[3]);
  } else line(ctx, [[x + 7, y + 4], [x + 11, y + 8], [x + 14, y + 5]], "#5a4a3a", 0.5);
  if (!simple()) for (let k = 0; k < 3; k++) line(ctx, [[x + 6 + k * 5, y + 3], [x + 6 + k * 5, y + 9]], "#140c06", 0.6);
  flat(ctx, x + 4, y + 12, 9, 1.2, AMBER[1]);
  flat(ctx, x + 4, y + 15, 14, 0.9, "#6a5a40");
  flat(ctx, x + 4, y + 17, 11, 0.9, "#6a5a40");
  G.drips(ctx, x + 1, y + 20, 20, 10, seed, 2);
  G.chips(ctx, x, y + 0.4, 22, seed + 1, G.DIRT);
};

export const latticeMast: EnvAsset = {
  id: "latticeMast",
  box: [-6, -216, 30, 0],
  draw(ctx, state, _t, { h = 216 } = {}) {
    const seed = 4200 + state;
    eachCell(ctx, 0, -h, 24, h, 24, 24, (x, y, _i, j) => {
      flat(ctx, x + 3, y, 18, 24, CRATE[0]);
      strut(ctx, x + 4, y + 1, x + 20, y + 23, 2.6, CRATE);
      strut(ctx, x + 20, y + 1, x + 4, y + 23, 2.6, CRATE);
      flat(ctx, x + 2, y + 22, 20, 2, CRATE[2], CRATE[4]);
      const r = rng(seed + j * 17);
      if (r() < 0.4) G.rustPatch(ctx, x + 12, y + 12, 2.5, 2, seed + j * 17 + 1);
    });
    for (const x of [0, 20]) {
      pier(ctx, x, -h, 4, h, CRATE);
      rivets(ctx, x, -h, 4, 4, CRATE[3]);
      G.grain(ctx, G.rectRegion(ctx, x, -h, 4, h), seed + x);
      G.drips(ctx, x, -h, 4, h * 0.6, seed + x + 1, max(1, round(h / 60)), false);
      G.rustPatch(ctx, x + 2, -h * 0.4, 1.6, 3, seed + x + 2);
    }
    if (state === 0) for (let y = -48; y > -h + 24; y -= 72) lampBox(ctx, 1, y - 20, true, seed + y);
    band(ctx, -4, -6, 32, 6, CRATE);
    G.dirt(ctx, -4, -24, 32, 24, seed + 9, 0.6);
  },
};

export const warningLamp: EnvAsset = {
  id: "warningLamp",
  box: [-2, -82, 26, -38],
  draw(ctx, state) {
    lampBox(ctx, 1, -62, state === 0, 4300 + state);
    if (state === 1 && !simple()) bulletHoles(ctx, 4, -60, 14, 6, 2, 4301, "#6a5a40");
  },
};

export const junctionBox: EnvAsset = {
  id: "junctionBox",
  box: [-4, -68, 28, 0],
  draw(ctx, state, t, size) {
    const seed = 4400;
    box(ctx, 9, -44, 4, 42, "steel", 1, { vertical: true });
    G.grain(ctx, G.rectRegion(ctx, 9, -44, 4, 42), seed, 0.6);
    G.drips(ctx, 9, -44, 4, 18, seed + 1, 1);
    G.rustPatch(ctx, 11, -10, 1.6, 2.5, seed + 2);
    box(ctx, 4, -3, 14, 3, "steel", 2);
    G.dirt(ctx, 4, -3, 14, 3, seed + 3, 0.8);
    ctx.save();
    ctx.translate(0, -24);
    wireBox.draw(ctx, state, t, size);
    ctx.restore();
  },
};

export const watchtower: EnvAsset = {
  id: "watchtower",
  box: [-6, -184, 94, 0],
  draw(ctx) {
    const seed = 4500;
    const base = -112;
    for (const [a, b] of [[4, 18], [80, 66]] as Pt[]) {
      strut(ctx, a, 0, b, base, 4, PLANK);
      G.drips(ctx, min(a, b), base, 14, 40, seed + a, 1, false);
    }
    for (let k = 0; k < 3; k++) {
      const y0 = -k * 37;
      const y1 = y0 - 37;
      const d0 = 14 * (k / 3);
      const d1 = 14 * ((k + 1) / 3);
      strut(ctx, 4 + d0, y0, 80 - d1, y1, 2, PLANK);
      strut(ctx, 80 - d0, y0, 4 + d1, y1, 2, PLANK);
      flat(ctx, 4 + d1, y1 - 1, 76 - d1 * 2, 3, PLANK[2], PLANK[4]);
    }
    for (const x of [36, 48]) flat(ctx, x, base, 2, -base, PLANK[3], PLANK[4]);
    for (let y = -8; y > base; y -= 7) flat(ctx, 36, y, 14, 1.6, PLANK[2], PLANK[4]);
    planks(ctx, 14, base - 38, 58, 38, seed + 1, true);
    flat(ctx, 22, base - 30, 42, 10, HOLE, PLANK[4]);
    if (!simple()) for (let x = 26; x < 62; x += 8) flat(ctx, x, base - 30, 1.4, 10, PLANK[1]);
    band(ctx, 8, base - 2, 70, 6, PLANK);
    for (let x = 8; x <= 76; x += 17) flat(ctx, x, base - 18, 2, 16, PLANK[3], PLANK[4]);
    flat(ctx, 8, base - 18, 70, 2, PLANK[3], PLANK[4]);
    const roof: Pt[] = [[4, base - 38], [43, base - 62], [82, base - 38], [78, base - 36], [43, base - 56], [8, base - 36]];
    shape(ctx, roof, BRONZE[1], BRONZE[4]);
    shape(ctx, [[8, base - 36], [43, base - 56], [78, base - 36]], BRONZE[2]);
    if (!simple()) for (let x = 14; x < 74; x += 6) line(ctx, [[x, base - 36 - (20 * (1 - abs(x - 43) / 35))], [x, base - 36]], BRONZE[0], 0.5);
    G.grain(ctx, G.polyRegion(ctx, roof), seed + 2);
    G.drips(ctx, 8, base - 36, 70, 20, seed + 3, 5);
    G.rustPatch(ctx, 60, base - 42, 5, 2, seed + 4);
    G.dirt(ctx, 14, base - 38, 58, 38, seed + 5, 0.35);
    disc(ctx, 70, base - 26, 2.2, AMBER[1], "#0a0604");
    if (!simple()) glow(ctx, 70, base - 26, 8, AMBER[2], 0.35);
  },
};

export const bronzeColumn = (ctx: Ctx, h: number): void => {
  const seed = 4600;
  pier(ctx, 4, -h, 16, h, BRONZE);
  flat(ctx, 7, -h, 2, h, BRONZE[3]);
  G.grain(ctx, G.rectRegion(ctx, 4, -h, 16, h), seed);
  eachCell(ctx, 4, -h, 16, h, 16, 48, (_x, y, _i, j) => {
    const r = rng(seed + j * 13);
    pier(ctx, 1, y + 20, 22, 6, BRONZE);
    if (!simple()) for (const bx of [3, 11, 19]) flat(ctx, bx, y + 22, 1.6, 1.6, BRONZE[3]);
    G.drips(ctx, 2, y + 26, 20, 26, seed + j * 13 + 1, 2);
    if (r() < 0.6) {
      const patch = blob(8 + r() * 8, y + 8 + r() * 10, 3 + r() * 2, 4 + r() * 3, seed + j * 13 + 2, 9);
      ctx.save();
      ctx.globalAlpha = 0.6;
      shape(ctx, patch, "#3a6a4a");
      ctx.restore();
    }
    if (r() < 0.4) G.rustPatch(ctx, 12, y + 36, 3, 2, seed + j * 13 + 3);
  });
  G.dirt(ctx, 4, -24, 16, 24, seed + 5, 0.6);
};

export const overheadPipeline: EnvAsset = {
  id: "overheadPipeline",
  box: [-4, -22, 292, 4],
  draw(ctx, _state, _t, { w = 288 } = {}) {
    const seed = 4700;
    for (let x = 24; x < w; x += 96) {
      slab(ctx, x, -20, 24, 10, "concrete", 2);
      G.surface(ctx, x, -20, 24, 10, seed + x, { rise: 0.4, drip: 1, dripLen: 8 });
      for (const dx of [8, 16]) line(ctx, [[x + dx, -10], [x + dx, -3]], "m2", 1.6);
    }
    cylH(ctx, 0, -8, w, 2.4, "chrome", 1);
    cylH(ctx, 0, -4, w, 2.4, "chrome", 1);
    G.grain(ctx, G.rectRegion(ctx, 0, -8, w, 6.4), seed + 1, 0.5);
    G.drips(ctx, 0, -1.6, w, 8, seed + 2, round(w / 24));
    for (let x = 6; x < w; x += 48) {
      hazard(ctx, x, -9.4, 14, 2, 2.4, { fill: "a1", line: "aLine" });
      hazard(ctx, x, -5.4, 14, 2, 2.4, { fill: "a1", line: "aLine" });
      for (const dx of [0, 13]) disc(ctx, x + dx, -6.8, 0.8, "c2", "mLine");
      G.chips(ctx, x, -9.4, 14, seed + 3 + x, G.DIRT);
      if (rng(seed + x)() < 0.5) G.rustPatch(ctx, x + 30, -5, 3, 1.2, seed + 4 + x);
    }
  },
};

const coilStack = (ctx: Ctx, x: number, y: number, w: number, n: number): void => {
  cylV(ctx, x + w * 0.3, y - 4, w * 0.4, n * 7 + 8, "steel", 0);
  for (let i = 0; i < n; i++) cylV(ctx, x, y + i * 7, w, 5, "chrome", 2);
  for (let i = 0; i < 3; i++) {
    const cy = y - 6 - i * 4;
    poly(ctx, [[x + w * 0.2, cy], [x + w * 0.8, cy], [x + w * 0.7, cy - 3], [x + w * 0.3, cy - 3]], "c1", 2);
  }
};

const lamp = (ctx: Ctx, x: number, y: number, c: string, lit = true): void => {
  if (lit && !simple()) glow(ctx, x, y, 4, c, 0.6);
  disc(ctx, x, y, 1.2, lit ? c : "k0", "mLine");
};

export const transformer: EnvAsset = {
  id: "transformer",
  box: [-4, -170, 172, 0],
  anim: true,
  draw(ctx, _state, t) {
    const seed = 4800;
    slab(ctx, 0, -120, 168, 120, "concrete", 1);
    G.surface(ctx, 0, -119, 168, 119, seed, { rise: 0.3, drip: 6, dripLen: 40 });
    flat(ctx, -2, -124, 172, 5, "k3", "kLine");
    G.chips(ctx, -2, -124, 172, seed + 1);
    for (const [x, w] of [[8, 46], [62, 46], [116, 44]] as Pt[]) {
      box(ctx, x, -110, w, 56, "green", 1);
      box(ctx, x + 4, -106, w - 8, 48, "green", 0);
      if (!simple()) for (let y = -100; y < -60; y += 6) flat(ctx, x + 6, y, w - 12, 1, "g2");
      G.grain(ctx, G.rectRegion(ctx, x, -110, w, 56), seed + 2 + x, 0.6);
      G.drips(ctx, x, -110, w, 24, seed + 3 + x, 3);
      G.rustPatch(ctx, x + w * 0.7, -60, 3, 1.6, seed + 4 + x);
    }
    coilStack(ctx, 16, -160, 26, 5);
    coilStack(ctx, 70, -160, 26, 5);
    for (const x of [124, 140, 156]) {
      cylV(ctx, x - 3, -138, 6, 14, "chrome", 1);
      for (let i = 0; i < 3; i++) cylV(ctx, x - 4.4, -138 + i * 4.4, 8.8, 2.2, "chrome", 2);
    }
    line(ctx, [[124, -138], [104, -150], [83, -162]], "mLine", 1.2);
    line(ctx, [[140, -138], [124, -158], [83, -164]], "mLine", 1.2);
    box(ctx, 8, -48, 152, 6, "steel", 1);
    G.grain(ctx, G.rectRegion(ctx, 8, -48, 152, 6), seed + 5, 0.6);
    for (const x of [14, 46, 80, 114, 148]) {
      cylV(ctx, x, -42, 6, 42, "chrome", 1);
      G.drips(ctx, x, -42, 6, 20, seed + 6 + x, 1);
    }
    hazard(ctx, 0, -8, 168, 4, 5);
    G.dirt(ctx, 0, -20, 168, 20, seed + 7, 0.6);
    box(ctx, 120, -40, 34, 26, "steel", 0);
    flat(ctx, 124, -36, 26, 8, "screenOff", "gLine");
    if (!simple()) for (let i = 0; i < 4; i++) flat(ctx, 126 + i * 6, -33 - abs(sin(t * 3 + i)) * 3, 3, 1 + abs(sin(t * 3 + i)) * 3, "screen");
    G.grain(ctx, G.rectRegion(ctx, 120, -40, 34, 26), seed + 8, 0.5);
    lamp(ctx, 128, -20, "screen", floor(t * 2) % 2 === 0);
    lamp(ctx, 136, -20, "a1");
  },
};

const tank = (ctx: Ctx, x: number, w: number, h: number, seed: number): void => {
  cylV(ctx, x, -h, w, h, "rust", 1);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x + w / 2, -h, w / 2, 8, 0, PI, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  const [r0, , r2, r3] = tones("rust") as [string, string, string, string];
  g.addColorStop(0, r3);
  g.addColorStop(0.4, r2);
  g.addColorStop(1, r0);
  ctx.fillStyle = g;
  ctx.fill();
  stroke(ctx, "rust");
  ctx.restore();
  G.grain(ctx, G.rectRegion(ctx, x, -h - 8, w, h + 8), seed, 0.6);
  for (const y of [-h + 6, -h / 2, -6]) {
    flat(ctx, x, y - 1, w, 2, "r0", "rLine");
    rivets(ctx, x, y - 3, w, 4, "r3");
    G.drips(ctx, x, y + 1, w, 18, seed + 1 + y, 3);
  }
  G.rustPatch(ctx, x + w * 0.7, -h * 0.3, 4, 2.5, seed + 2);
  G.dirt(ctx, x, -h, w, h, seed + 3, 0.3);
  box(ctx, x + w / 2 - 6, -h - 11, 12, 4, "steel", 1);
  box(ctx, x + w / 2 - 4, -h - 14, 8, 3, "steel", 2);
  G.chips(ctx, x + w / 2 - 6, -h - 11, 12, seed + 4);
  flat(ctx, x + 6, -h + 14, 12, 8, "y2", "yLine");
  if (!simple()) text(ctx, "T", x + 12, -h + 18, 6, "hazardDark");
  G.chips(ctx, x + 6, -h + 14, 12, seed + 5, G.DIRT);
};

const horizontalTank = (ctx: Ctx): void => {
  const seed = 4900;
  for (const x of [16, 76]) {
    pier(ctx, x, -18, 8, 18, PLATE);
    flat(ctx, x - 3, -4, 14, 4, PLATE[1], PLATE[4]);
  }
  const body = (): void => {
    ctx.beginPath();
    ctx.moveTo(12, -66);
    ctx.lineTo(88, -66);
    ctx.ellipse(88, -42, 12, 24, 0, -PI / 2, PI / 2);
    ctx.lineTo(12, -18);
    ctx.ellipse(12, -42, 12, 24, 0, PI / 2, PI * 1.5);
    ctx.closePath();
  };
  body();
  ctx.fillStyle = color(BRONZE[2]);
  ctx.fill();
  stroke(ctx, BRONZE[4]);
  ctx.save();
  body();
  ctx.clip();
  flat(ctx, 0, -66, 100, 8, BRONZE[3]);
  flat(ctx, 0, -58, 100, 3, "#d8b07a");
  flat(ctx, 0, -30, 100, 12, BRONZE[1]);
  flat(ctx, 0, -22, 100, 4, BRONZE[0]);
  for (const x of [22, 50, 78]) flat(ctx, x, -66, 2, 48, BRONZE[1]);
  G.grain(ctx, G.rectRegion(ctx, 0, -66, 100, 48), seed);
  G.drips(ctx, 0, -50, 100, 30, seed + 1, 6);
  G.rustPatch(ctx, 36, -34, 7, 3, seed + 2);
  G.rustPatch(ctx, 70, -56, 4, 2, seed + 3);
  G.dirt(ctx, 0, -66, 100, 48, seed + 4, 0.35);
  ctx.restore();
  flat(ctx, 44, -72, 12, 6, BRONZE[1], BRONZE[4]);
  disc(ctx, 64, -40, 4, TUBE[3], TUBE[4]);
  if (!simple()) line(ctx, [[64, -40], [66.5, -42]], "#a8281c", 0.7);
};

export const storageTank: EnvAsset = {
  id: "storageTank",
  box: [-2, -88, 126, 0],
  anim: true,
  draw(ctx, state, t) {
    if (state === 1) return horizontalTank(ctx);
    const seed = 5000;
    tank(ctx, 0, 48, 64, seed);
    for (const [x, w] of [[52, 6], [62, 6]] as Pt[]) {
      cylV(ctx, x, -84, w, 84, "steel", 1);
      G.grain(ctx, G.rectRegion(ctx, x, -84, w, 84), seed + 10 + x, 0.6);
    }
    for (const y of [-70, -40]) {
      box(ctx, 50, y, 20, 4, "steel", 2);
      hazard(ctx, 51, y + 5, 18, 2.4, 3);
      G.drips(ctx, 50, y + 7.4, 20, 14, seed + 20 - y, 2);
    }
    lamp(ctx, 60, -76, "a1", sin(t * 3) > 0);
    lamp(ctx, 60, -46, "screen", sin(t * 3 + 1.5) > 0);
    tank(ctx, 74, 48, 64, seed + 40);
  },
};

export const powerPlant: EnvAsset = {
  id: "powerPlant",
  box: [-4, -272, 388, 0],
  draw(ctx) {
    const seed = 5100;
    band(ctx, 0, -18, 384, 18, CONC);
    G.surface(ctx, 0, -18, 384, 18, seed, { rise: 0.5, drip: 6, dripLen: 10 });
    const towers = [40, 172, 304];
    for (const x of towers) {
      eachCell(ctx, x, -264, 24, 246, 24, 24, (cx, cy, _i, j) => {
        strut(ctx, cx + 3, cy + 1, cx + 21, cy + 23, 2.2, CRATE);
        strut(ctx, cx + 21, cy + 1, cx + 3, cy + 23, 2.2, CRATE);
        if (rng(seed + x + j)() < 0.3) G.rustPatch(ctx, cx + 12, cy + 12, 2.5, 2, seed + x + j);
      });
      for (const px of [x, x + 20]) {
        pier(ctx, px, -264, 4, 246, CRATE);
        G.grain(ctx, G.rectRegion(ctx, px, -264, 4, 246), seed + px);
        G.drips(ctx, px, -264, 4, 60, seed + px, 2, false);
      }
      if (x !== towers[1]) lampBox(ctx, x + 1, -150, true, seed + x + 3);
    }
    for (const y of [-232, -200]) {
      band(ctx, 30, y, 324, 8, CRATE);
      rivets(ctx, 30, y + 4, 324, 10, CRATE[3]);
      G.drips(ctx, 30, y + 8, 324, 14, seed + 10 - y, 14);
    }
    for (let x = 56; x < 340; x += 36) insulator(ctx, x, -232, 4);
    for (let x = 56; x < 340; x += 72) arc(ctx, x, -246, x + 36, -246, seed + x);
    for (let x = 60; x < 340; x += 48) if (!simple()) curve(ctx, [[x, -200], [x + 24, -186], [x + 48, -200]], "#141410", 0.8);
    for (let b = 0; b < 2; b++) {
      const x = 78 + b * 40;
      for (let k = 0; k < 6; k++) tube(ctx, x, -114 + k * 15, 30, 12, TUBE);
      pier(ctx, x + 12, -130, 6, 112, TUBE);
      insulator(ctx, x + 15, -130, 4);
    }
    arc(ctx, 93, -148, 133, -148, seed + 30);
    pier(ctx, 210, -100, 54, 82, PLATE);
    for (let k = 0; k < 2; k++) grille(ctx, 216, -92 + k * 34, 42, 22, seed + 40 + k);
    hvPanel(ctx, 230, -128, 14, 18, seed + 44);
    G.grain(ctx, G.rectRegion(ctx, 210, -100, 54, 82), seed + 45);
    const dome = (): void => {
      ctx.beginPath();
      ctx.moveTo(322, -18);
      ctx.lineTo(322, -96);
      ctx.ellipse(350, -96, 28, 22, 0, PI, 0);
      ctx.lineTo(378, -18);
      ctx.closePath();
    };
    dome();
    ctx.fillStyle = color(TUBE[1]);
    ctx.fill();
    stroke(ctx, TUBE[4]);
    ctx.save();
    dome();
    ctx.clip();
    flat(ctx, 322, -118, 10, 100, TUBE[2]);
    flat(ctx, 326, -118, 3, 100, TUBE[3]);
    flat(ctx, 366, -118, 12, 100, TUBE[0]);
    for (let y = -90; y < -18; y += 18) flat(ctx, 322, y, 56, 1.2, TUBE[4]);
    G.grain(ctx, G.rectRegion(ctx, 322, -118, 56, 100), seed + 50);
    G.drips(ctx, 322, -100, 56, 50, seed + 51, 6);
    G.rustPatch(ctx, 340, -60, 7, 4, seed + 52);
    G.dirt(ctx, 322, -118, 56, 100, seed + 53, 0.3);
    ctx.restore();
    tube(ctx, 140, -146, 200, 7, BRONZE);
    for (const x of [150, 290]) pier(ctx, x, -139, 6, 121, BRONZE);
    G.drips(ctx, 140, -139, 200, 20, seed + 60, 8);
    G.rustPatch(ctx, 250, -142, 5, 2, seed + 61);
  },
};

export const rockCliff: EnvAsset = {
  id: "rockCliff",
  box: [0, -200, 144, 0],
  draw(ctx, _state, _t, { w = 144, h = 192 } = {}) {
    const seed = 5200 + round(w + h * 3);
    const slope: Pt[] = [[0, 0], [0, -h], [w * 0.25, -h + 8], [w, -6], [w, 0]];
    eachCell(ctx, 0, -h, w, h, 26, 20, (x, y, i, j) => {
      const r = rng(cellSeed(seed, i, j));
      const cx = x + 13 + (r() - 0.5) * 8;
      const cy = y + 10 + (r() - 0.5) * 6;
      const u = cx / w;
      const edge = u < 0.25 ? -h + 8 * (u / 0.25) : -h + 8 + (h - 14) * ((u - 0.25) / 0.75);
      if (cy < edge - 4) return;
      boulder(ctx, cx, cy, 13 + r() * 5, 9 + r() * 4, cellSeed(seed, i, j) + 1);
      if (!simple() && r() < 0.35) flat(ctx, cx - 6, cy - 9, 8 + r() * 6, 1.8, LEAF[2]);
      if (r() < 0.3) G.drips(ctx, cx - 6, cy + 4, 12, 10, cellSeed(seed, i, j) + 2, 1, false);
    });
    G.grain(ctx, G.polyRegion(ctx, slope), seed + 1, 0.7);
    G.dirt(ctx, 0, -h, w, h, seed + 2, min(0.3, 50 / h));
    tufts(ctx, 0, w, 0, seed + 3, 0.6, 6);
  },
};

export const rubbleHeap: EnvAsset = {
  id: "rubbleHeap",
  box: [-4, -48, 100, 2],
  draw(ctx, state) {
    const seed = 5300 + state * 11;
    const r = rng(seed);
    const heap: Pt[] = [[-2, 0], [6, -10], [20, -20], [36, -30], [52, -34], [66, -26], [80, -14], [94, 0]];
    G.scorch(ctx, heap, seed + 1);
    shape(ctx, heap, state === 1 ? CONC[1] : STONE[1], STONE[4]);
    G.grain(ctx, G.polyRegion(ctx, heap), seed + 2);
    if (state === 1) {
      for (let k = 0; k < 5; k++) {
        const x = 8 + k * 16 + r() * 4;
        const y = -6 - sin((x / 92) * PI) * 22 * (0.5 + r() * 0.5);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((r() - 0.5) * 1.2);
        band(ctx, -9, -4, 18 + r() * 6, 7, CONC);
        G.chips(ctx, -9, -4, 18, seed + 10 + k, G.DIRT);
        ctx.restore();
      }
      if (!simple()) for (let k = 0; k < 6; k++) {
        const x = 14 + r() * 66;
        line(ctx, [[x, -10 - r() * 10], [x + (r() - 0.5) * 14, -24 - r() * 14]], RUSTY, 0.8);
      }
    } else {
      for (let k = 0; k < 9; k++) {
        const x = 8 + r() * 78;
        const y = -4 - sin((x / 92) * PI) * 26 * r();
        boulder(ctx, x, y, 5 + r() * 6, 4 + r() * 4, seed + 20 + k);
      }
    }
    G.dirt(ctx, -2, -34, 96, 34, seed + 3, 0.5);
    tufts(ctx, 0, 92, 0, seed + 4, 0.4, 4);
  },
};

const clipped = (ctx: Ctx, pts: Pt[], draw: () => void): void => {
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  draw();
  ctx.restore();
};

const tyre = (ctx: Ctx, cx: number, cy: number, rad: number, flatK: number): void => {
  ctx.fillStyle = color("#141412");
  ctx.beginPath();
  ctx.ellipse(cx, cy + rad * flatK * 0.15, rad, rad * (1 - flatK * 0.15), 0, 0, PI * 2);
  ctx.fill();
  stroke(ctx, "#060604");
  disc(ctx, cx, cy, rad * 0.5, OLIVE[1], OLIVE[4]);
  disc(ctx, cx, cy, rad * 0.18, OLIVE[3]);
};

const glassHole = (ctx: Ctx, pts: Pt[], seed: number): void => {
  shape(ctx, pts, "#101818");
  if (!simple()) shape(ctx, [pts[0]!, pts[1]!, [(pts[1]![0] + pts[2]![0]) / 2, (pts[1]![1] + pts[2]![1]) / 2]], "#2c3c3e");
  G.rim(ctx, pts, seed, "#8aa0a0", "#060808");
};

const wreckSkin = (ctx: Ctx, pts: Pt[], x: number, y: number, w: number, h: number, seed: number): void => {
  clipped(ctx, pts, () => {
    G.grain(ctx, G.polyRegion(ctx, pts), seed, 0.6);
    G.rustPatch(ctx, x + w * 0.3, y + h * 0.65, w * 0.08, h * 0.15, seed + 1);
    G.rustPatch(ctx, x + w * 0.72, y + h * 0.45, w * 0.06, h * 0.12, seed + 2);
    G.drips(ctx, x, y + h * 0.3, w, h * 0.5, seed + 3, round(w / 16));
    G.dirt(ctx, x, y, w, h, seed + 4, 0.35);
  });
};

const armyTruck = (ctx: Ctx, seed: number): void => {
  flat(ctx, 4, -12, 128, 4, OLIVE[0], OLIVE[4]);
  const bed: Pt[] = [[0, -8], [0, -18], [98, -18], [98, -8]];
  shape(ctx, bed, OLIVE[2], OLIVE[4]);
  flat(ctx, 0, -18, 98, 2, OLIVE[3]);
  wreckSkin(ctx, bed, 0, -18, 98, 10, seed);
  const tarp: Pt[] = [[2, -18], [2, -44], [10, -54], [40, -56], [62, -52], [70, -60], [92, -54], [96, -46], [96, -18]];
  shape(ctx, tarp, "#5c5a36", OLIVE[4]);
  for (const x of [12, 34, 56, 80]) line(ctx, [[x, -18], [x, -54]], "#46442a", 1.2);
  if (!simple()) flat(ctx, 4, -44, 90, 1.6, "#6e6c44");
  wreckSkin(ctx, tarp, 2, -60, 94, 42, seed + 10);
  const rip: Pt[] = [[44, -50], [62, -48], [68, -34], [50, -28], [40, -38]];
  shape(ctx, rip, HOLE);
  for (const x of [48, 58]) line(ctx, [[x, -50], [x, -28]], "#5a3a1a", 1.2);
  G.rim(ctx, rip, seed + 1, "#8a8858", HOLE);
  const cab: Pt[] = [[98, -8], [98, -50], [116, -50], [126, -34], [136, -32], [136, -8]];
  shape(ctx, cab, OLIVE[3], OLIVE[4]);
  flat(ctx, 98, -50, 18, 2, "#8a9064");
  flat(ctx, 126, -32, 10, 2, "#8a9064");
  wreckSkin(ctx, cab, 98, -50, 38, 42, seed + 20);
  glassHole(ctx, [[104, -46], [115, -46], [122, -35], [104, -35]], seed + 2);
  line(ctx, [[104, -32], [104, -12]], OLIVE[4], 0.8);
  flat(ctx, 106, -28, 5, 1.4, OLIVE[4]);
  for (let y = -29; y < -16; y += 3) flat(ctx, 131, y, 5, 1.2, OLIVE[1]);
  disc(ctx, 133.5, -14, 1.6, "#c8c0a0", OLIVE[4]);
  flat(ctx, 134, -12, 4, 4, OLIVE[1], OLIVE[4]);
  for (const [x, f] of [[22, 0.6], [40, 0.4], [116, 0.2]] as Pt[]) tyre(ctx, x, -9, 9, f);
};

const burntJeep = (ctx: Ctx, seed: number): void => {
  for (const x of [24, 72]) flat(ctx, x - 6, -5, 12, 5, STONE[2], STONE[4]);
  const body: Pt[] = [[10, -10], [10, -26], [24, -28], [30, -36], [58, -36], [66, -28], [86, -26], [88, -10]];
  shape(ctx, body, "#6a3e22", "#1a0c06");
  flat(ctx, 10, -26, 78, 3, "#8a5634");
  flat(ctx, 30, -36, 28, 2, "#8a5634");
  wreckSkin(ctx, body, 10, -36, 78, 26, seed);
  clipped(ctx, body, () => G.scorch(ctx, [[30, -30], [60, -32], [64, -18], [34, -16]], seed + 1));
  ctx.save();
  ctx.globalAlpha = 0.5;
  shape(ctx, [[34, -36], [56, -36], [62, -26], [40, -22]], HOLE);
  ctx.restore();
  line(ctx, [[30, -36], [34, -50], [40, -50]], "r3", 1.6);
  line(ctx, [[30, -36], [34, -50], [40, -50]], "rLine", 0.5);
  for (const x of [36, 48]) line(ctx, [[x, -36], [x + 4, -44]], "r1", 2);
  flat(ctx, 12, -16, 74, 2, "r0");
  line(ctx, [[46, -26], [46, -12]], "rLine", 0.8);
  for (const x of [24, 72]) {
    const arch: Pt[] = [[x - 8, -10], [x - 7, -16], [x, -19], [x + 7, -16], [x + 8, -10]];
    shape(ctx, arch, HOLE);
    disc(ctx, x, -9, 4.5, "r1", "rLine");
    disc(ctx, x, -9, 1.6, "r0", "rLine");
  }
};

const halfTrack = (ctx: Ctx, seed: number): void => {
  const hull: Pt[] = [[4, -14], [10, -34], [36, -40], [104, -40], [122, -26], [126, -14]];
  shape(ctx, hull, OLIVE[3], OLIVE[4]);
  flat(ctx, 36, -40, 68, 2, "#8a9064");
  wreckSkin(ctx, hull, 4, -40, 122, 26, seed + 3);
  flat(ctx, 48, -48, 30, 8, OLIVE[2], OLIVE[4]);
  line(ctx, [[78, -45], [104, -52]], "#1a1a14", 2.6);
  line(ctx, [[104, -52], [112, -60]], "#1a1a14", 2.6);
  for (let y = -34; y < -20; y += 4) flat(ctx, 112, y, 8, 1.2, OLIVE[1]);
  const hole: Pt[] = [[58, -34], [70, -36], [74, -24], [62, -18], [54, -24]];
  breach(ctx, hole, seed, OLIVE[3], OLIVE[4]);
  const track: Pt[] = [[4, -14], [86, -14], [90, -8], [84, -1], [10, -1], [2, -8]];
  shape(ctx, track, "#22221a", "#060604");
  if (!simple()) for (let x = 6; x < 88; x += 3) line(ctx, [[x, -14], [x, -12.6]], "#4a4a3a", 0.8);
  for (let x = 14; x < 84; x += 12) {
    disc(ctx, x, -7.5, 5, OLIVE[2], OLIVE[4]);
    disc(ctx, x, -7.5, 1.6, OLIVE[3]);
  }
  tyre(ctx, 110, -7, 7, 0.4);
};

export const militaryWreck: EnvAsset = {
  id: "militaryWreck",
  box: [-4, -64, 140, 2],
  draw(ctx, state) {
    const seed = 5400 + state * 9;
    ctx.save();
    ctx.globalAlpha = 0.4;
    flat(ctx, 0, -2, 136, 3, HOLE);
    ctx.restore();
    if (state === 1) burntJeep(ctx, seed);
    else if (state === 2) halfTrack(ctx, seed);
    else armyTruck(ctx, seed);
  },
};

const drum = (ctx: Ctx, x: number, y: number, seed: number, burst = false): void => {
  pier(ctx, x, y, 14, 20, OLIVE);
  for (const k of [4, 10, 16]) flat(ctx, x, y + k, 14, 1.2, OLIVE[4]);
  flat(ctx, x - 0.6, y - 1, 15.2, 2, OLIVE[3], OLIVE[4]);
  flat(ctx, x + 4, y + 7, 6, 4, SEAM[1]);
  G.grain(ctx, G.rectRegion(ctx, x, y, 14, 20), seed, 0.5);
  G.drips(ctx, x, y + 1, 14, 14, seed + 1, 2);
  G.rustPatch(ctx, x + 4 + rng(seed)() * 6, y + 15, 3, 1.6, seed + 2);
  if (burst) {
    const tear: Pt[] = [[x + 2, y - 1], [x + 6, y + 5], [x + 9, y + 2], [x + 12, y + 6], [x + 13, y - 1]];
    shape(ctx, tear, HOLE);
    G.rim(ctx, tear, seed + 3, OLIVE[3], HOLE);
    ctx.save();
    ctx.globalAlpha = 0.6;
    shape(ctx, blob(x + 18, y + 19.5, 10, 1.4, seed + 4, 9), "#0a0806");
    ctx.restore();
  }
};

const lyingDrum = (ctx: Ctx, x: number, seed: number): void => {
  const h = 14;
  flat(ctx, x, -h, 20, h, OLIVE[2], OLIVE[4]);
  flat(ctx, x, -h, 20, 3, OLIVE[3]);
  flat(ctx, x, -h + 3, 20, 1.2, "#8a9064");
  flat(ctx, x, -4, 20, 4, OLIVE[1]);
  for (const k of [5, 14]) flat(ctx, x + k, -h, 1.2, h, OLIVE[4]);
  G.grain(ctx, G.rectRegion(ctx, x, -h, 20, h), seed, 0.5);
  G.rustPatch(ctx, x + 9, -3, 3, 1.4, seed + 1);
  ellipse(ctx, x + 20, -h / 2, 3.6, h / 2, OLIVE[3], OLIVE[4]);
  ellipse(ctx, x + 20.4, -h / 2, 2.4, h / 2 - 1.6, OLIVE[2]);
  disc(ctx, x + 20.6, -h / 2 - 3, 0.9, OLIVE[4]);
};

export const fuelDrum: EnvAsset = {
  id: "fuelDrum",
  box: [-4, -30, 58, 2],
  draw(ctx, state) {
    const seed = 5500 + state * 7;
    if (state === 1) {
      drum(ctx, 0, -20, seed);
      drum(ctx, 15, -20, seed + 10);
      lyingDrum(ctx, 30, seed + 20);
    } else drum(ctx, 6, -20, seed, state === 2);
    G.dirt(ctx, -2, -8, state === 1 ? 58 : 30, 8, seed + 30, 0.7);
  },
};

const sack = (ctx: Ctx, x: number, y: number, w: number, seed: number): void => {
  const r = rng(seed);
  const pts: Pt[] = [[x + 2, y], [x + w - 2, y - 0.6], [x + w, y + 3], [x + w - 1, y + 7], [x + 1, y + 7.4], [x, y + 3]];
  shape(ctx, pts, r() < 0.4 ? SACK[1] : SACK[2], SACK[4]);
  if (!simple()) {
    flat(ctx, x + 2, y + 1, w - 4, 1, SACK[3]);
    line(ctx, [[x + w * 0.5, y + 0.5], [x + w * 0.5, y + 7]], SACK[0], 0.5);
  }
  G.grain(ctx, G.polyRegion(ctx, pts), seed + 1);
};

export const sandbags: EnvAsset = {
  id: "sandbags",
  box: [-4, -28, 60, 2],
  draw(ctx, state) {
    const seed = 5600 + state * 5;
    const rows = state === 1 ? [5, 5] : [3, 2, 1];
    rows.forEach((n, j) => {
      const off = ((rows[0]! - n) * 11) / 2;
      for (let i = 0; i < n; i++) sack(ctx, off + i * 11, -7.4 - j * 7, 12, seed + j * 10 + i);
    });
    const spill = blob(state === 1 ? 50 : 30, -1, 7, 1.6, seed + 40, 9);
    shape(ctx, spill, SACK[2]);
    G.dirt(ctx, -2, -20, 60, 20, seed + 41, 0.5);
  },
};

const shell = (ctx: Ctx, x: number, y: number, len: number): void => {
  tube(ctx, x, y, len, 4.4, OLIVE);
  shape(ctx, [[x + len, y], [x + len + 4, y + 2.2], [x + len, y + 4.4]], "#8a8a80", "#1a1a16");
  flat(ctx, x, y, 2.4, 4.4, SEAM[1]);
};

export const shellCrate: EnvAsset = {
  id: "shellCrate",
  box: [-4, -32, 54, 2],
  draw(ctx, state) {
    const seed = 5700 + state * 3;
    const lid = (x: number, y: number, w: number, h: number, s: number): void => {
      band(ctx, x, y, w, h, CRATE);
      for (const k of [3, w - 5]) flat(ctx, x + k, y, 2, h, CRATE[4]);
      if (!simple()) {
        flat(ctx, x + w * 0.35, y + h * 0.35, w * 0.3, 1, SEAM[1]);
        flat(ctx, x + w * 0.35, y + h * 0.55, w * 0.2, 1, SEAM[1]);
      }
      G.grain(ctx, G.rectRegion(ctx, x, y, w, h), s);
      G.chips(ctx, x, y + 0.4, w, s + 1, G.DIRT);
    };
    if (state === 1) {
      lid(0, -10, 40, 10, seed);
      flat(ctx, 2, -10, 36, 3, HOLE);
      ctx.save();
      ctx.translate(30, -12);
      ctx.rotate(-0.5);
      lid(0, -2, 20, 3, seed + 5);
      ctx.restore();
      for (let k = 0; k < 3; k++) shell(ctx, 4 + k * 13, -15, 8);
      shell(ctx, 40, -4.4, 8);
    } else {
      lid(0, -10, 44, 10, seed);
      lid(4, -20, 38, 10, seed + 5);
      shell(ctx, 30, -24.4, 12);
      G.drips(ctx, 0, -10, 44, 8, seed + 9, 3, false);
    }
    G.dirt(ctx, -2, -10, 50, 10, seed + 10, 0.6);
  },
};

export const vesniceSceneryAssets: EnvAsset[] = [
  villageBackdrop, farPalms, farRuins, crateWall, rivetWall, plankWall, ammoDepot, grassyWalkway, steelDeckPlate, trussWalkway, villageHouse, stiltBuilding, powerHouse,
  latticeMast, warningLamp, junctionBox, watchtower, overheadPipeline, transformer, storageTank, powerPlant, rockCliff, rubbleHeap, militaryWreck, fuelDrum,
  sandbags, shellCrate,
];

export const VESNICE_IDS = [
  "villageBackdrop", "farPalms", "farRuins", "crateWall", "rivetWall", "plankWall", "ammoDepot", "grassyWalkway", "steelDeckPlate", "trussWalkway", "villageHouse", "stiltBuilding", "powerHouse", "latticeMast", "warningLamp", "junctionBox", "watchtower", "overheadPipeline", "transformer", "storageTank", "powerPlant", "rockCliff", "rubbleHeap", "militaryWreck", "fuelDrum", "sandbags", "shellCrate",
  "sourceTeleport", "targetTeleport", "teleportPad", "brokenTeleport", "fuseBox", "electricCabinet", "cannon", "fireBarricade", "dynamiteWall", "energyBarrier", "powerBridge",
  "bridgeGuardPost", "smoulderingRemains", "smallKey", "walkieTalkie", "detonator", "projectileCrate", "projectile", "fuse", "dynamite", "navCircuit", "toaster", "energyPickup",
  "ammoPickup", "shieldPickup",
] as const;
