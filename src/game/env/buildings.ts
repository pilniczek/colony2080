import crowbarDoor from "@config/cutscenes/crowbar-door.json";
import { G } from "./grime";
import { P, type EnvAsset, type Size } from "./paint";

const { rng, path, color, flat, box, cylV, cylH, disc, rivets, truss, glow, text, stroke, tones, shape, line, curve, beam, slab } = P;
const TRAIN = crowbarDoor.palette;
const { PI, sin, cos, round, min, max } = Math;

type Pt = [number, number];

const pillar = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mat = "concrete", tone = 2, flutes = 0): void => {
  const t = tones(mat) as string[];
  flat(ctx, x, y, w, h, t[tone] as string);
  flat(ctx, x, y, w * 0.22, h, t[min(3, tone + 1)] as string);
  flat(ctx, x + w * 0.72, y, w * 0.28, h, t[max(0, tone - 1)] as string);
  for (let i = 1; i <= flutes; i++) flat(ctx, x + (i * w) / (flutes + 1) - 0.4, y + 2, 0.8, h - 4, t[max(0, tone - 1)] as string);
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
    G.surface(ctx, 40, -138, 56, 16, 31, { rise: 0.4, drip: 2, dripLen: 10 });
    flat(ctx, 36, -142, 64, 4, "k3", "kLine");
    G.chips(ctx, 36, -142, 64, 32, G.DIRT);
    slab(ctx, 18, -122, 100, 30, "concrete", 2);
    G.surface(ctx, 18, -122, 100, 30, 33, { rise: 0.25 });
    flat(ctx, 22, -117, 92, 16, "k0", "kLine");
    for (let x = 22; x <= 110; x += 11) pillar(ctx, x, -117, 4, 16, "concrete", 2);
    G.drips(ctx, 22, -101, 92, 8, 34, 5);
    flat(ctx, 14, -102, 108, 2, "k3", "kLine");
    flat(ctx, 0, -92, 178, 6, "k3", "kLine");
    G.chips(ctx, 0, -92, 178, 35, G.DIRT);
    flat(ctx, 0, -87, 178, 2, "k1");
    const left: Pt[] = [[4, 0], [4, -40], [0, -48], [6, -58], [4, -86]];
    const wall: Pt[] = [...left, [176, -86], [176, 0]];
    shape(ctx, wall, "k2", "kLine");
    G.grain(ctx, G.polyRegion(ctx, wall), 36);
    G.drips(ctx, 4, -86, 172, 40, 37, 9);
    G.dirt(ctx, 4, -86, 172, 86, 38, 0.28);
    G.rustPatch(ctx, 40, -60, 7, 4, 39);
    G.rustPatch(ctx, 160, -78, 5, 3, 40);
    flat(ctx, 4, -70, 172, 3, "k1");
    grid(ctx, 16, -82, 6, 1, 18, 9, 9, 0, "k0", "kLine");
    G.drips(ctx, 16, -73, 160, 14, 41, 6, false);
    pillar(ctx, 66, -67, 10, 67, "concrete", 2);
    pillar(ctx, 108, -67, 10, 67, "concrete", 2);
    for (const [x, seed] of [[66, 42], [108, 43]] as Pt[]) G.surface(ctx, x, -67, 10, 67, seed, { rise: 0.35, drip: 1, dripLen: 30 });
    const small = blob(90, -46, 11, 10, 9);
    const big = breach(146, 46, 46, 3);
    const left2 = blob(24, -24, 12, 14, 12);
    G.scorch(ctx, small, 44);
    G.scorch(ctx, big, 45);
    G.scorch(ctx, left2, 46);
    hole(ctx, small);
    G.rim(ctx, small, 47, "k3", "kLine");
    rebar(ctx, small, 2);
    hole(ctx, big);
    G.rim(ctx, big, 48, "k3", "kLine");
    rebar(ctx, big, 5);
    hole(ctx, left2, false);
    G.rim(ctx, left2, 49, "k3", "kLine");
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
  draw(ctx, _state, _t, { w = 216, h = 336 }: Size) {
    const grow = (w - 216) / 2;
    let x = 0;
    for (const [kind, base] of FACADE) {
      const width = kind === "panel" ? base + grow : base;
      if (kind === "pil") pillar(ctx, x, -h, width, h, "concrete", 2);
      if (kind === "brick") bricks(ctx, x, -h, width, h, x + 1, 11, 5);
      if (kind === "panel") {
        flat(ctx, x, -h, width, h, "k1", "kLine");
        for (let y = -STOREY; y > -h; y -= STOREY) bracePanel(ctx, x + 4, y + 6, width - 8, STOREY - 10);
        grid(ctx, x + 6, -h + 18, 4, 1, (width - 12) / 4 - 3, 18, 3, 0, "k0", "kLine");
      }
      x += width;
    }
    for (let y = 0; y > -h; y -= STOREY) slab(ctx, 0, y - 5, w, 5, "concrete", 3);
    slab(ctx, 0, -h, w, 12, "concrete", 2);
    flat(ctx, 0, -h + 10, w, 2, "k0");
  },
};

type Tag = [string, number, Pt[]];

const TAGS: Tag[] = (() => {
  const r = rng(23);
  return ["neon", "a1", "neon", "c3", "a2", "neon", "y2", "c3", "a1"].map((c): Tag => {
    const x0 = 30 + r() * 90;
    const y0 = -10 - r() * 30;
    const pts: Pt[] = [];
    for (let k = 0, n = 4 + round(r() * 5); k < n; k++) pts.push([x0 + k * (3 + r() * 4), y0 - (k % 2 ? 4 + r() * 10 : r() * 3)]);
    return [c, c === "c3" ? 1 : 1.6 + r() * 1.8, pts];
  });
})();

const GRAFFITI_TOP: Pt[] = [[0, -30], [5, -36], [9, -34], [14, -46], [20, -44], [26, -56], [33, -54], [38, -64], [48, -62], [54, -68]];
const GRAFFITI_RIGHT: Pt[] = [[168, -72], [164, -60], [168, -50], [162, -36], [166, -22], [160, -12], [164, 0]];
const STAINS: [number, number, number, number, number][] = [[30, -24, 10, 6, 1], [140, -50, 12, 8, 2], [96, -58, 14, 5, 3]];
const CRACKS: Pt[][] = [[[22, -40], [26, -30], [24, -18]], [[146, -66], [142, -52], [148, -40]]];

export const graffitiWall: EnvAsset = {
  id: "graffitiWall",
  box: [0, -74, 168, 0],
  draw(ctx) {
    shape(ctx, [[0, 0], ...GRAFFITI_TOP, [54, -72], ...GRAFFITI_RIGHT], "k2", "kLine");
    flat(ctx, 54, -72, 112, 4, "k3", "kLine");
    flat(ctx, 0, -4, 164, 4, "k1");
    for (const [cx, cy, rx, ry, sd] of STAINS) shape(ctx, blob(cx, cy, rx, ry, sd), "#5a504066");
    shape(ctx, blob(16, -10, 4, 4, 4, 8), "hole");
    rebar(ctx, GRAFFITI_TOP, 8);
    rebar(ctx, GRAFFITI_RIGHT, 9);
    for (const [c, w, pts] of TAGS) {
      if (P.simple() && w < 2) continue;
      curve(ctx, pts, "#1a0a06", w + 1.2);
      curve(ctx, pts, c, w);
    }
    if (!P.simple()) for (const pts of CRACKS) line(ctx, pts, "k0", 0.6);
  },
};

export const gantryBuilding: EnvAsset = {
  id: "gantryBuilding",
  box: [0, -126, 182, 0],
  draw(ctx) {
    truss(ctx, 0, -120, 182, 20, "rust", 2.5);
    for (const x of [34, 150]) {
      box(ctx, x, -124, 20, 28, "steel", 2);
      if (!P.simple()) for (const y of [-121, -99]) rivets(ctx, x, y, 20, 5, "m3");
    }
    flat(ctx, 0, -72, 182, 4, "m1", "mLine");
    for (let x = 2; x < 182; x += 22) flat(ctx, x, -94, 1.6, 22, "m2", "mLine");
    for (const y of [-94, -84]) flat(ctx, 0, y, 182, 1.6, "m2", "mLine");
    box(ctx, 0, -68, 182, 10, "steel", 1);
    for (let x = 6; x < 176; x += 26) {
      flat(ctx, x, -66, 16, 6, "water", "mLine");
      flat(ctx, x + 1, -65.5, 14, 1.5, "plasma");
      if (!P.simple()) glow(ctx, x + 8, -63, 10, "plasma", 0.25);
    }
    box(ctx, 0, -58, 182, 8, "rust", 2);
    for (const [x0, x1] of [[15, 85], [107, 153]] as Pt[]) {
      flat(ctx, x0, -50, x1 - x0, 28, "hole");
      for (let x = x0; x < x1; x += 18) {
        flat(ctx, x + 6, -50, 6, 2, "y3");
        if (!P.simple()) glow(ctx, x + 9, -47, 9, "y2", 0.3);
      }
      for (let x = x0; x < x1 - 1; x += (x1 - x0) / 3) {
        slab(ctx, x, -22, (x1 - x0) / 3, 22, "rust", 1);
        flat(ctx, x + 3, -18, (x1 - x0) / 3 - 6, 12, "r0", "rLine");
      }
    }
    for (const [x, w] of [[0, 15], [85, 7], [100, 7], [153, 29]] as Pt[]) pillar(ctx, x, -50, w, 50, "rust", 2);
    flat(ctx, 159, -42, 16, 30, "r1", "rLine");
  },
};

type Glyph = "B" | "A" | "R";

const GLYPHS: Record<Glyph, (c: CanvasRenderingContext2D) => void> = {
  B: (c) => {
    c.moveTo(0, 20);
    c.lineTo(0, 0);
    c.lineTo(9, 0);
    c.ellipse(9, 5, 6, 5, 0, -PI / 2, PI / 2);
    c.lineTo(0, 10);
    c.moveTo(9, 10);
    c.ellipse(9, 15, 7, 5, 0, -PI / 2, PI / 2);
    c.lineTo(0, 20);
  },
  A: (c) => {
    c.moveTo(0, 20);
    c.lineTo(8, 0);
    c.lineTo(16, 20);
    c.moveTo(4, 12);
    c.lineTo(12, 12);
  },
  R: (c) => {
    c.moveTo(0, 20);
    c.lineTo(0, 0);
    c.lineTo(9, 0);
    c.ellipse(9, 5.5, 6, 5.5, 0, -PI / 2, PI / 2);
    c.lineTo(0, 11);
    c.moveTo(7, 11);
    c.lineTo(15, 20);
  },
};

const NEON_LIT: [string, number][] = [["#2a0806", 7.4], ["#c22a1a", 6], ["neon", 4], ["#ffb89a", 1.2]];
const NEON_OFF: [string, number][] = [["mLine", 7.4], ["m1", 6], ["m2", 4]];

const glyph = (ctx: CanvasRenderingContext2D, ch: Glyph, x: number, y: number, lit: boolean): void => {
  ctx.save();
  ctx.translate(x, y);
  if (lit && !P.simple()) glow(ctx, 8, 10, 18, "neonGlow", 0.35);
  for (const [c, w] of lit ? NEON_LIT : NEON_OFF) {
    ctx.beginPath();
    GLYPHS[ch](ctx);
    ctx.strokeStyle = color(c);
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }
  ctx.restore();
};

const SIGN_LEGS: [Pt, Pt][] = [[[30, -62], [12, 0]], [[66, -62], [84, 0]], [[34, -62], [26, 0]], [[62, -62], [70, 0]]];
const SIGN_FRAME: [Pt, Pt][] = [[[3, -68], [3, -94]], [[93, -68], [93, -94]], [[3, -94], [93, -94]], [[60, -94], [64, -104]]];

export const barSign: EnvAsset = {
  id: "barSign",
  box: [0, -106, 96, 0],
  anim: true,
  draw(ctx, state, t) {
    for (const [a, b] of SIGN_LEGS) beam(ctx, a, b, 2.4, "rust");
    for (const [y0, y1] of [[-52, -36], [-36, -20], [-20, -4]] as Pt[]) {
      const l0 = 30 - (y0 + 62) * 0.29;
      const r0 = 66 + (y0 + 62) * 0.29;
      const l1 = 30 - (y1 + 62) * 0.29;
      const r1 = 66 + (y1 + 62) * 0.29;
      beam(ctx, [l0, y0], [r1, y1], 1.2, "rust");
      beam(ctx, [r0, y0], [l1, y1], 1.2, "rust");
      beam(ctx, [l1, y1], [r1, y1], 1.4, "rust");
    }
    box(ctx, 24, -64, 48, 4, "rust", 2);
    box(ctx, 2, -68, 92, 4, "rust", 1);
    for (const [a, b] of SIGN_FRAME) beam(ctx, a, b, 1.4, "rust");
    const rOn = state === 0 || ((t * 1.7) % 1 < 0.35 && t % 2.3 > 0.4);
    glyph(ctx, "B", 6, -90, true);
    glyph(ctx, "A", 38, -90, true);
    glyph(ctx, "R", 70, -90, rOn);
  },
};

const fluted = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void => {
  pillar(ctx, x, y, w, h, "concrete", 2, 3);
  flat(ctx, x - 1.5, y - 3, w + 3, 3, "k3", "kLine");
  flat(ctx, x - 1.5, -3, w + 3, 3, "k1", "kLine");
};

const BAR_TOP: Pt[] = [[0, -78], ...jagged(6, 138, -84, 12, 7, 21), [144, -86]];

export const barDoor: EnvAsset = {
  id: "barDoor",
  box: [0, -100, 144, 0],
  draw(ctx, state) {
    shape(ctx, [[0, 0], ...BAR_TOP, [144, 0]], "k2", "kLine");
    rebar(ctx, BAR_TOP, 3);
    flat(ctx, 0, -66, 144, 3, "k1");
    flat(ctx, 0, -5, 144, 5, "k1", "kLine");
    flat(ctx, 8, -58, 38, 26, "hole", "kLine");
    flat(ctx, 6, -32, 42, 2, "k3", "kLine");
    for (let x = 14; x < 46; x += 7) flat(ctx, x, -58, 1.4, 26 - (x % 3) * 4, "m2");
    flat(ctx, 68, -62, 52, 62, "k0", "kLine");
    flat(ctx, 70, -60, 48, 3, "k1");
    flat(ctx, 72, -74, 14, 9, "c2", "kLine");
    flat(ctx, 72, -71, 14, 3, "neon");
    flat(ctx, 68, -60, 52, 60, "m1", "mLine");
    if (state === 1) {
      flat(ctx, 70, -58, 25, 58, "hole");
      shape(ctx, [[72, 0], [76, -54], [89, -54], [93, 0]], "#c9a85a55");
      disc(ctx, 82.5, -40, 5, "#1a1210");
      shape(ctx, [[73.5, -18], [76.5, -32], [88.5, -32], [91.5, -18]], "#1a1210");
      for (const ex of [80.5, 84.5]) flat(ctx, ex - 0.6, -41, 1.2, 0.8, "a2");
    } else {
      box(ctx, 70, -58, 25, 58, "steel", 3, { vertical: true });
      flat(ctx, 76, -46, 9, 12, "c2", "mLine");
      for (const y of [-43, -40, -37]) flat(ctx, 77.5, y, 6, 0.8, "m1");
      flat(ctx, 89, -32, 3, 6, "m1", "mLine");
    }
    box(ctx, 95, -58, 23, 58, "steel", 3, { vertical: true });
    flat(ctx, 95, -58, 23, 58, "#0e2a2a88");
    flat(ctx, 95, -58, 2.5, 58, "hole");
    flat(ctx, 98, -32, 3, 6, "m1", "mLine");
    fluted(ctx, 56, -62, 12, 62);
    fluted(ctx, 120, -62, 12, 62);
  },
};

const HULL: Pt[] = [[0, -40], [14, -52], [70, -61], [128, -57], [168, -42], [192, -22], [186, -16], [150, -12], [40, -12], [6, -20]];
const HULL_TOP: Pt[] = [[14, -52], [70, -61], [128, -57], [168, -42], [124, -45], [66, -48], [20, -44]];
const HULL_LOW: Pt[] = [[6, -20], [40, -12], [150, -12], [186, -16], [192, -22], [150, -27], [40, -27], [3, -30]];
const COCKPIT: Pt[] = [[122, -51], [150, -45], [170, -36], [148, -38], [120, -45]];
const COVER = [8, -38, 20, 12] as const;

const strut = (ctx: CanvasRenderingContext2D, x: number): void => {
  beam(ctx, [x, -14], [x - 6, -2], 2.4, "steel");
  beam(ctx, [x + 4, -14], [x + 10, -2], 2.4, "steel");
  box(ctx, x - 10, -3, 24, 3, "steel", 1);
};

export const crashedShip: EnvAsset = {
  id: "crashedShip",
  box: [-10, -64, 196, 0],
  draw(ctx, state) {
    strut(ctx, 46);
    strut(ctx, 138);
    shape(ctx, HULL, "k2", "kLine");
    shape(ctx, HULL_TOP, "k3");
    shape(ctx, HULL_LOW, "k1");
    path(ctx, HULL);
    stroke(ctx, "kLine");
    if (!P.simple()) for (const x of [60, 98, 140]) line(ctx, [[x, -58 + (x - 60) * 0.05], [x - 4, -13]], "k1", 0.5);
    line(ctx, [[4, -30], [40, -27], [150, -27], [192, -22]], "k0", 0.7);
    shape(ctx, COCKPIT, "glass", "mLine");
    if (!P.simple()) shape(ctx, [[128, -49], [136, -47], [126, -45]], "m3");
    flat(ctx, 96, -36, 10, 3, "y2", "yLine");
    if (!P.simple()) glow(ctx, 101, -34, 10, "y2", 0.35);
    for (const y of [-40, -29]) {
      cylH(ctx, -8, y, 10, 8, "steel", 2);
      disc(ctx, -8, y + 4, 3, "hole", "mLine");
    }
    const [cx, cy, cw, ch] = COVER;
    if (state === 0) {
      box(ctx, cx, cy, cw, ch, "steel", 2);
      if (!P.simple()) for (const y of [cy + 2, cy + ch - 2]) rivets(ctx, cx, y, cw, 5, "m3");
      return;
    }
    const torn = blob(cx + cw / 2, cy + ch / 2, cw * 0.62, ch * 0.7, 17, 16);
    shape(ctx, blob(cx + cw / 2, cy + ch / 2, cw * 0.8, ch * 0.9, 18, 16), "k0");
    shape(ctx, torn, "hole", "kLine");
    if (!P.simple()) for (let i = 0; i < 5; i++) line(ctx, [[cx + 3 + i * 3.5, cy + ch - 2], [cx + 4 + i * 3.5, cy + 3]], "m1", 0.6);
    if (state === 1) {
      if (!P.simple()) glow(ctx, cx + cw / 2, cy + ch / 2, 14, "a1", 0.45);
      for (const [px, py] of torn.filter((_, i) => i % 3 === 0)) disc(ctx, px, py, 0.9, "a2");
    }
  },
};

const SPLAT = "#9c1410";

const splat = (ctx: CanvasRenderingContext2D, x: number, y: number, seed: number, drips = 2): void => {
  const r = rng(seed);
  shape(ctx, blob(x, y, 3 + r() * 2, 1.6 + r(), seed, 10), SPLAT);
  for (let i = 0; i < drips; i++) {
    const dx = x + (r() - 0.5) * 5;
    const len = 3 + r() * 9;
    line(ctx, [[dx, y], [dx, y + len]], SPLAT, 0.9);
    disc(ctx, dx, y + len, 0.7, SPLAT);
  }
};

const glint = (ctx: CanvasRenderingContext2D, pts: Pt[]): void => {
  ctx.globalAlpha = 0.6;
  shape(ctx, pts, TRAIN.windowGlint);
  ctx.globalAlpha = 1;
};

export const metroTrain: EnvAsset = {
  id: "metroTrain",
  box: [0, -62, 140, 0],
  draw(ctx) {
    flat(ctx, 0, -9, 124, 9, "m0", "mLine");
    for (const x of [20, 34, 92, 106]) {
      disc(ctx, x, -4, 3.6, "m1", "mLine");
      disc(ctx, x, -4, 1.2, "m3");
    }
    flat(ctx, 0, -55, 124, 46, TRAIN.wagon, "mLine");
    shape(ctx, [[3, -58], [121, -58], [124, -55], [0, -55]], TRAIN.wagonShade, "mLine");
    flat(ctx, 0, -55, 124, 1.5, "c1");
    flat(ctx, 0, -15, 124, 6, TRAIN.wagonShade);
    flat(ctx, 0, -27, 124, 1, TRAIN.wagonShade);
    flat(ctx, 0, -24, 124, 3.5, TRAIN.stripe);
    flat(ctx, 0, -19, 124, 1, TRAIN.wagonShade);
    G.wagon(ctx, 0, -55, 124, 46, 81);
    for (const [x, w] of [[34, 19], [55, 19], [96, 22]] as Pt[]) {
      flat(ctx, x - 1, -50, w + 2, 20, TRAIN.wagonShade);
      flat(ctx, x, -49, w, 18, TRAIN.window);
      G.dirt(ctx, x, -49, w, 18, x, 0.35);
      glint(ctx, [[x + 2, -49], [x + 6.5, -49], [x + 1, -31], [x, -31]]);
    }
    flat(ctx, 80, -48, 9, 15, "c1", "mLine");
    flat(ctx, 5, -52, 24, 43, TRAIN.doorFrame, "mLine");
    flat(ctx, 7, -50, 20, 41, TRAIN.interior);
    for (const [x, edge] of [[7, 7], [17, 25]] as Pt[]) {
      flat(ctx, x, -50, 10, 41, TRAIN.door);
      flat(ctx, edge, -50, 2, 41, TRAIN.doorShade);
      flat(ctx, x + 2, -46, 6, 13, TRAIN.window);
      glint(ctx, [[x + 3, -46], [x + 4.5, -46], [x + 3, -33], [x + 2, -33]]);
    }
    flat(ctx, 16.6, -50, 0.8, 41, TRAIN.interior);
    G.grain(ctx, G.rectRegion(ctx, 7, -50, 20, 41), 82);
    G.dirt(ctx, 7, -50, 20, 41, 83, 0.4);
    for (const [x, y, seed, drips] of [[44, -51, 3, 3], [100, -51, 4, 2], [62, -29, 5, 2], [116, -33, 6, 1]] as [number, number, number, number][]) splat(ctx, x, y, seed, P.simple() ? 1 : drips);
    slab(ctx, 126, -62, 14, 62, "concrete", 1);
  },
};

export const buildingAssets: EnvAsset[] = [skyBackground, midgroundRuins, windowBuilding, ruinedBuilding, colonnadeBuilding, facadeTower, brickWall, graffitiWall, gantryBuilding, barSign, barDoor, crashedShip, metroTrain];
