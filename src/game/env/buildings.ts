import { P, type EnvAsset, type Size } from "./paint";

const { rng, path, color, flat, box, cylV, rivets, glow, text, stroke, tones } = P;
const { PI, sin, cos, round, min, max } = Math;

type Pt = [number, number];

const shape = (ctx: CanvasRenderingContext2D, pts: Pt[], fill: string, line: string | null = null): void => {
  ctx.fillStyle = color(fill);
  path(ctx, pts);
  ctx.fill();
  if (line) stroke(ctx, line);
};

const line = (ctx: CanvasRenderingContext2D, pts: Pt[], c: string, w: number, cap: CanvasLineCap = "round"): void => {
  ctx.strokeStyle = color(c);
  ctx.lineWidth = w;
  ctx.lineCap = cap;
  ctx.lineJoin = "round";
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.stroke();
};

const beam = (ctx: CanvasRenderingContext2D, a: Pt, b: Pt, w: number, mat: string): void => {
  const [, c1, c2, , edge] = tones(mat) as [string, string, string, string, string];
  line(ctx, [a, b], edge, w + 1, "butt");
  line(ctx, [a, b], c1, w, "butt");
  line(ctx, [a, b], c2, w * 0.35, "butt");
};

const slab = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mat = "concrete", tone = 2): void => {
  const t = tones(mat) as string[];
  const e = min(2, h / 4);
  const s = min(3, h / 4);
  flat(ctx, x, y, w, h, t[tone] as string);
  flat(ctx, x, y, w, e, t[min(3, tone + 1)] as string);
  flat(ctx, x, y + h - s, w, s, t[max(0, tone - 1)] as string);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, mat);
};

const pillar = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mat = "concrete", tone = 2): void => {
  const t = tones(mat) as string[];
  flat(ctx, x, y, w, h, t[tone] as string);
  flat(ctx, x, y, w * 0.22, h, t[min(3, tone + 1)] as string);
  flat(ctx, x + w * 0.72, y, w * 0.28, h, t[max(0, tone - 1)] as string);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, mat);
};

const jagged = (x0: number, x1: number, y: number, amp: number, step: number, seed: number): Pt[] => {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let x = x0; x < x1; x += step * (0.5 + r())) pts.push([x, y - r() * amp]);
  pts.push([x1, y - r() * amp]);
  return pts;
};

const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, n = 14): Pt[] => {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * PI;
    const k = 0.6 + r() * 0.55;
    return [cx + cos(a) * rx * k, cy + sin(a) * ry * k] as Pt;
  });
};

const breach = (cx: number, w: number, h: number, seed: number): Pt[] => {
  const r = rng(seed);
  const pts: Pt[] = [[cx - w / 2, 0]];
  for (let i = 1; i < 12; i++) {
    const a = PI - (i / 12) * PI;
    pts.push([cx + cos(a) * (w / 2) * (0.75 + r() * 0.4), -sin(a) * h * (0.7 + r() * 0.4)]);
  }
  pts.push([cx + w / 2, 0]);
  return pts;
};

const hole = (ctx: CanvasRenderingContext2D, pts: Pt[], sky = true): void => {
  shape(ctx, pts.map(([x, y]): Pt => [x, y]), "k0", "kLine");
  ctx.save();
  ctx.translate(1, 1);
  shape(ctx, pts, sky ? "sky1" : "hole");
  ctx.restore();
  if (sky) {
    ctx.save();
    path(ctx, pts);
    ctx.clip();
    const y1 = max(...pts.map((p) => p[1]));
    flat(ctx, -500, y1 - 8, 1000, 9, "skyline");
    ctx.restore();
  }
};

const rebar = (ctx: CanvasRenderingContext2D, pts: Pt[], seed: number): void => {
  if (P.simple()) return;
  const r = rng(seed);
  pts.forEach(([x, y], i) => {
    if (i % 3) return;
    line(ctx, [[x, y], [x + (r() - 0.5) * 6, y - 2 - r() * 4]], "r2", 0.6);
  });
};

const grid = (ctx: CanvasRenderingContext2D, x: number, y: number, cols: number, rows: number, w: number, h: number, gx: number, gy: number, fill: string, frame: string | null = null): void => {
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) flat(ctx, x + i * (w + gx), y + j * (h + gy), w, h, fill, frame);
};

const BRICK_TONES = ["#3a2414", "#4a3020", "#5c3e26"];

const bricks = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, bw = 12, bh = 5): void => {
  const r = rng(seed);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  flat(ctx, x, y, w, h, "r0");
  for (let j = 0, yy = y + h - bh; yy > y - bh; j++, yy -= bh) {
    for (let xx = x - (j % 2 ? bw / 2 : 0); xx < x + w; xx += bw) {
      const k = P.simple() ? 1 : r() < 0.15 ? 2 : r() < 0.2 ? 0 : 1;
      flat(ctx, xx + 0.5, yy + 0.5, bw - 1, bh - 1, BRICK_TONES[k] as string);
      if (!P.simple()) flat(ctx, xx + 0.5, yy + 0.5, bw - 1, 0.7, k === 2 ? "#7a5634" : "#5c3e26");
    }
  }
  ctx.restore();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, "brick");
};

const pane = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cols: number, rows: number, seed: number, shot: number[] | null = null): void => {
  flat(ctx, x - 2, y - 2, w + 4, h + 4, "k1", "kLine");
  flat(ctx, x, y, w, h, "k0");
  const r = rng(seed);
  const cw = w / cols;
  const ch = h / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const px = x + i * cw + 0.6;
      const py = y + j * ch + 0.6;
      flat(ctx, px, py, cw - 1.2, ch - 1.2, r() < 0.35 ? "m1" : "c0");
      if (!P.simple()) shape(ctx, [[px, py + ch - 1.2], [px + (cw - 1.2) * 0.35, py], [px + (cw - 1.2) * 0.6, py], [px + (cw - 1.2) * 0.2, py + ch - 1.2]], "c1");
    }
  }
  flat(ctx, x, y, w, 4, "#00000066");
  if (!P.simple()) {
    for (let i = 1; i < cols; i++) {
      for (let j = 1; j < rows; j++) {
        if (r() < 0.4) line(ctx, [[x + i * cw - 1.5, y + j * ch], [x + i * cw + 1.5, y + j * ch]], "c3", 0.6);
      }
    }
  }
  if (shot) {
    const [sx, sy, sw, sh] = shot as [number, number, number, number];
    const pts = blob(sx, sy, sw, sh, seed + 7, 18);
    shape(ctx, pts, "hole");
    if (!P.simple()) {
      for (const [px, py] of pts.filter((_, i) => i % 2)) {
        shape(ctx, [[px, py], [px + (sx - px) * 0.25 + 1, py + (sy - py) * 0.25], [px + (sx - px) * 0.25 - 1, py + (sy - py) * 0.25]], "c2");
      }
    }
  }
  flat(ctx, x - 2, y + h + 1, w + 4, 2, "k3", "kLine");
};

const cloud = (x: number, y: number, w: number, h: number, seed: number): Pt[] => {
  const r = rng(seed);
  const top: Pt[] = [];
  const bot: Pt[] = [];
  const n = max(4, round(w / 9));
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const s = sin(u * PI) ** 0.6;
    top.push([x + u * w + (r() - 0.5) * 4, y - s * h * (0.5 + r() * 0.7)]);
    bot.push([x + u * w + (r() - 0.5) * 4, y + s * h * 0.25 * (0.4 + r())]);
  }
  return [...top, ...bot.reverse()];
};

interface CloudSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  tone: number;
  seed: number;
}

type Tower = [number, number, number, string?];

const SKY_N = ["sky0", "sky1", "sky2", "sky3"];
const SKY_F = ["sky2", "sky3", "#d9a95c", "#f4dc9c"];

const CLOUDS: CloudSpec[] = (() => {
  const r = rng(11);
  const list: CloudSpec[] = [];
  for (let i = 0; i < 44; i++) {
    const y = -166 + r() * 112;
    const tone = [0, 2, 0, 3, 2, 0, 2, 3][i % 8] as number;
    list.push({ x: -60 + r() * 360, y, w: 50 + r() * 150 - (y + 170) * 0.3, h: 5 + r() * 14 - (y + 170) * 0.04, tone, seed: i + 3 });
  }
  list.push({ x: -40, y: -50, w: 400, h: 18, tone: 0, seed: 99 });
  return list.sort((a, b) => Number(a.tone === 3) - Number(b.tone === 3));
})();

const FAR: Pt3[] = (() => {
  const r = rng(5);
  const list: Pt3[] = [];
  for (let x = -4; x < 320; x += 8 + r() * 18) list.push([x, 10 + r() * 16, 18 + r() * 40]);
  return list;
})();

type Pt3 = [number, number, number];

const TOWERS: Tower[] = [
  [0, 14, 62], [68, 26, 124, "ant"], [92, 12, 84], [144, 34, 114, "lattice"], [178, 10, 92],
  [232, 12, 66], [288, 22, 100, "ant"], [310, 10, 74],
];
const RUINS: Pt[] = [[0, 60], [30, 52], [100, 48], [130, 58], [196, 54], [244, 46], [300, 56], [320, 50]];
const LIT: Pt3[] = [[62, 28, 46], [282, 26, 50], [206, 20, 30], [16, 18, 24]];

const BOLTS: { pts: Pt[]; w: number }[] = (() => {
  const r = rng(29);
  const bolts: { pts: Pt[]; w: number }[] = [];
  const walk = (x: number, y: number, len: number, depth: number): void => {
    const pts: Pt[] = [[x, y]];
    for (let i = 0; i < len; i++) {
      x += (r() - 0.3) * 16 * (depth ? 1.4 : 1);
      y += 4 + r() * 6;
      pts.push([x, y]);
      if (depth < 2 && r() < 0.3) walk(x, y, round(len * 0.5), depth + 1);
    }
    bolts.push({ pts, w: depth ? 0.7 : 1.3 });
  };
  walk(120, -170, 14, 0);
  walk(190, -170, 9, 1);
  return bolts;
})();

const skyline = (ctx: CanvasRenderingContext2D, flash: boolean): void => {
  for (const [x, w, h] of FAR) flat(ctx, x, -12 - h, w, h, "skyline2");
  const ground: Pt[] = [[-2, 0]];
  RUINS.forEach(([x, h], i) => ground.push(...jagged(x, RUINS[i + 1]?.[0] ?? 322, -h, 6, 4, i + 40)));
  shape(ctx, [...ground, [322, 0]], "skyline2");
  for (const [x, w, h, kind] of TOWERS) {
    const top = jagged(x, x + w, -h, 5, 5, x + 1);
    shape(ctx, [[x, 0], ...top, [x + w, 0]], "skyline");
    if (kind === "ant") {
      line(ctx, [[x + w * 0.3, -h], [x + w * 0.3, -h - 16]], "skyline", 1.2);
      line(ctx, [[x + w * 0.7, -h], [x + w * 0.7, -h - 9]], "skyline", 1);
      flat(ctx, x + w * 0.2, -h - 12, w * 0.3, 1, "skyline");
    }
    if (kind === "lattice") {
      for (const dx of [6, w - 10]) {
        flat(ctx, x + dx, -h - 14, 4, 14, "skyline");
        line(ctx, [[x + dx - 2, -h - 14], [x + dx + 6, -h - 14]], "skyline", 1);
      }
      for (let k = 0; k < 3; k++) line(ctx, [[x + 8, -h - k * 4], [x + w - 8, -h - 4 - k * 4]], "skyline", 0.5);
    }
  }
  for (const [x, w, h] of LIT) {
    flat(ctx, x, -10 - h, w, h, flash ? "k1" : "#3a3024");
    flat(ctx, x, -10 - h, w, 1.5, flash ? "k3" : "k1");
    grid(ctx, x + 3, -6 - h, round((w - 4) / 5), round((h - 6) / 6), 3, 3.5, 2, 2.5, flash ? "k2" : "#140f0a");
  }
  shape(ctx, [[-2, 0], ...jagged(-2, 322, -12, 5, 6, 77), [322, 0]], "skyline");
  const r = rng(3);
  for (const [x, w, h] of TOWERS) {
    for (let i = 0; i < 3; i++) if (r() < 0.45) flat(ctx, x + 2 + r() * (w - 6), -10 - r() * (h - 16), 1.6, 1.6, flash ? "y3" : "a1");
  }
};

export const skyBackground: EnvAsset = {
  id: "skyBackground",
  box: [0, -170, 320, 0],
  anim: true,
  draw(ctx, state, t) {
    const ph = t % 3.2;
    const flash = state === 1 && ph < 0.55 && !(ph > 0.12 && ph < 0.22);
    const tone = flash ? SKY_F : SKY_N;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -170, 320, 170);
    ctx.clip();
    flat(ctx, 0, -170, 320, 170, tone[1] as string);
    for (const c of CLOUDS) if (!P.simple() || c.w > 50) shape(ctx, cloud(c.x, c.y, c.w, c.h, c.seed), tone[c.tone] as string);
    if (flash) {
      for (const b of BOLTS) {
        if (!P.simple()) for (const [x, y] of b.pts.filter((_, i) => i % 4 === 0)) glow(ctx, x, y, 14, "#ffffff", 0.18);
        line(ctx, b.pts, "#fff7d8", b.w + 1);
        line(ctx, b.pts, "#ffffff", b.w * 0.6);
      }
    }
    skyline(ctx, flash);
    ctx.restore();
  },
};

const hut = (ctx: CanvasRenderingContext2D, x: number, w: number, h: number, cols: number, rows: number, seed: number): void => {
  shape(ctx, [[x, 0], ...jagged(x, x + w, -h, 4, 6, seed), [x + w, 0]], "r1", "rLine");
  flat(ctx, x, -h + 1, w, 2, "r2");
  const gw = (w - 4) / cols;
  grid(ctx, x + 3, -h + 6, cols, rows, gw - 3, (h - 10) / rows - 3, 3, 3, "hole", "rLine");
  flat(ctx, x, -3, w, 3, "r0");
};

export const midgroundRuins: EnvAsset = {
  id: "midgroundRuins",
  box: [0, -64, 150, 0],
  draw(ctx) {
    hut(ctx, 0, 40, 60, 3, 5, 1);
    for (const [x, h] of [[48, 40], [58, 28], [72, 34]] as Pt[]) {
      pillar(ctx, x, -h, 4, h, "rust", 1);
      shape(ctx, [[x, -h], [x + 2, -h - 3], [x + 4, -h + 1]], "r1", "rLine");
    }
    beam(ctx, [48, -24], [76, -30], 2, "rust");
    hut(ctx, 86, 44, 42, 4, 3, 2);
    shape(ctx, [[132, 0], [132, -24], [146, -16], [150, -18], [150, 0]], "r1", "rLine");
    grid(ctx, 135, -16, 2, 2, 4, 5, 3, 2, "hole", "rLine");
  },
};

export const windowBuilding: EnvAsset = {
  id: "windowBuilding",
  box: [0, -102, 232, 0],
  draw(ctx) {
    const top: Pt[] = [[0, -66], [4, -72], [10, -70], [14, -80], [22, -84], [26, -92], [36, -95]];
    shape(ctx, [[0, 0], ...top, [190, -95], [190, 0]], "k2", "kLine");
    flat(ctx, 36, -98, 154, 4, "k3", "kLine");
    flat(ctx, 30, -94, 160, 2, "k1");
    rebar(ctx, top, 4);
    pillar(ctx, 172, -94, 14, 94, "concrete", 2);
    flat(ctx, 0, -6, 190, 6, "k1", "kLine");
    pane(ctx, 25, -70, 41, 41, 4, 4, 1);
    pane(ctx, 73, -70, 41, 41, 4, 4, 2, [92, -56, 15, 13]);
    pane(ctx, 120, -70, 41, 41, 4, 4, 3);
    slab(ctx, 190, -24, 40, 24, "concrete", 2);
    flat(ctx, 190, -24, 40, 3, "k3", "kLine");
    for (let x = 200; x < 230; x += 10) flat(ctx, x, -20, 1, 20, "k1");
  },
};

export const ruinedBuilding: EnvAsset = {
  id: "ruinedBuilding",
  box: [0, -144, 178, 0],
  draw(ctx) {
    slab(ctx, 40, -138, 56, 16, "concrete", 2);
    flat(ctx, 36, -142, 64, 4, "k3", "kLine");
    slab(ctx, 18, -122, 100, 30, "concrete", 2);
    flat(ctx, 22, -117, 92, 16, "k0", "kLine");
    for (let x = 22; x <= 110; x += 11) pillar(ctx, x, -117, 4, 16, "concrete", 2);
    flat(ctx, 14, -102, 108, 2, "k3", "kLine");
    flat(ctx, 0, -92, 178, 6, "k3", "kLine");
    flat(ctx, 0, -87, 178, 2, "k1");
    const left: Pt[] = [[4, 0], [4, -40], [0, -48], [6, -58], [4, -86]];
    shape(ctx, [...left, [176, -86], [176, 0]], "k2", "kLine");
    flat(ctx, 4, -70, 172, 3, "k1");
    grid(ctx, 16, -82, 6, 1, 18, 9, 9, 0, "k0", "kLine");
    pillar(ctx, 66, -67, 10, 67, "concrete", 2);
    pillar(ctx, 108, -67, 10, 67, "concrete", 2);
    const small = blob(90, -46, 11, 10, 9);
    hole(ctx, small);
    rebar(ctx, small, 2);
    const big = breach(146, 46, 46, 3);
    hole(ctx, big);
    rebar(ctx, big, 5);
    const left2 = blob(24, -24, 12, 14, 12);
    hole(ctx, left2, false);
    for (const [x, w, h] of [[120, 8, 4], [168, 10, 6], [128, 5, 3], [36, 7, 4]] as Pt3[]) {
      shape(ctx, [[x, 0], [x + w * 0.3, -h], [x + w, -h * 0.4], [x + w, 0]], "k1", "kLine");
    }
  },
};

export const colonnadeBuilding: EnvAsset = {
  id: "colonnadeBuilding",
  box: [0, -144, 200, 0],
  draw(ctx) {
    flat(ctx, 0, -140, 200, 32, "hole");
    flat(ctx, 0, -144, 200, 4, "k2", "kLine");
    for (let x = 4; x < 200; x += 28) pillar(ctx, x, -140, 11, 32, "concrete", 3);
    slab(ctx, 0, -110, 200, 36, "concrete", 2);
    flat(ctx, 0, -110, 200, 3, "k3", "kLine");
    flat(ctx, 0, -96, 200, 1.5, "k1");
    flat(ctx, 0, -76, 200, 4, "k0");
    text(ctx, "05", 182, -86, 11, "k1");
    flat(ctx, 0, -72, 200, 72, "hole");
    slab(ctx, 70, -64, 50, 64, "concrete", 1);
    if (!P.simple()) {
      flat(ctx, 80, -12, 20, 7, "m1", "mLine");
      for (let x = 82; x < 100; x += 3) flat(ctx, x, -11, 1.2, 5, "m0");
    }
    shape(ctx, [[0, -72], [200, -72], [200, -66], [0, -60]], "#00000088");
    for (const x of [0, 56, 120, 184]) {
      pillar(ctx, x, -72, 16, 72, "concrete", 2);
      flat(ctx, x - 2, -72, 20, 4, "k3", "kLine");
    }
  },
};

export const brickWall: EnvAsset = {
  id: "brickWall",
  box: [0, -168, 72, 0],
  draw(ctx, _state, _t, { w = 72, h = 168 }: Size) {
    bricks(ctx, 0, -h, w - 14, h, 7);
    flat(ctx, w - 14, -h, 14, h, "r0", "rust");
    cylV(ctx, w - 11, -h, 7, h, "concrete", 2);
    for (let y = -h + 18; y < 0; y += 36) box(ctx, w - 12.5, y, 10, 3, "concrete", 1);
  },
};

const FACADE: [string, number][] = [["pil", 18], ["brick", 22], ["panel", 62], ["pil", 18], ["panel", 62], ["brick", 22], ["pil", 12]];
const STOREY = 72;

const bracePanel = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void => {
  flat(ctx, x, y, w, h, "k0", "kLine");
  flat(ctx, x + 3, y + 3, w - 6, h - 6, "sky1");
  shape(ctx, [[x + 3, y + h - 3], [x + w - 3, y + 3], [x + w - 3, y + h - 3]], "sky0");
  flat(ctx, x + 3, y + 3, w - 6, 3, "#00000055");
  beam(ctx, [x + 4, y + 4], [x + w - 4, y + h - 4], 5, "concrete");
  beam(ctx, [x + 4, y + h * 0.5], [x + w * 0.5, y + h - 4], 3, "concrete");
  shape(ctx, [[x + 3, y + 3], [x + 14, y + 3], [x + 3, y + 14]], "k2", "kLine");
  shape(ctx, [[x + w - 3, y + h - 3], [x + w - 14, y + h - 3], [x + w - 3, y + h - 14]], "k2", "kLine");
  if (!P.simple()) rivets(ctx, x + 4, y + h - 1.5, w - 8, 6, "k3");
};

export const facadeTower: EnvAsset = {
  id: "facadeTower",
  box: [0, -336, 216, 0],
  draw(ctx) {
    let x = 0;
    for (const [kind, w] of FACADE) {
      if (kind === "pil") pillar(ctx, x, -336, w, 336, "concrete", 2);
      if (kind === "brick") bricks(ctx, x, -336, w, 336, x + 1, 11, 5);
      if (kind === "panel") {
        flat(ctx, x, -336, w, 336, "k1", "kLine");
        for (let y = -STOREY; y > -336; y -= STOREY) bracePanel(ctx, x + 4, y + 6, w - 8, STOREY - 10);
        grid(ctx, x + 6, -318, 4, 1, (w - 12) / 4 - 3, 18, 3, 0, "k0", "kLine");
      }
      x += w;
    }
    for (let y = 0; y > -336; y -= STOREY) slab(ctx, 0, y - 5, 216, 5, "concrete", 3);
    slab(ctx, 0, -336, 216, 12, "concrete", 2);
    flat(ctx, 0, -326, 216, 2, "k0");
  },
};

export const buildingAssets: EnvAsset[] = [skyBackground, midgroundRuins, windowBuilding, ruinedBuilding, colonnadeBuilding, facadeTower, brickWall];
