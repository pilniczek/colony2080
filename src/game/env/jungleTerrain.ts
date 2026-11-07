import { G } from "./grime";
import { blobPts, CLINE, fern, grass, mossCap, MOSS, simple, stone, vine, type Ctx, type Pt } from "./jungle";
import { P, TILE, type EnvAsset } from "./paint";

const { rng, path, flat, disc, stroke, shape, line, curve } = P;
const { PI, sin, cos, min, max, floor, ceil, round, abs, sqrt } = Math;

type View = [number, number, number, number];
type CellDraw = (x: number, y: number, i: number, j: number) => void;

const SKY = { light: "#3c6c60", mist: "#306054", air: "#245448", canopy: "#184830", trunk: "#0c3024", band: "#00240c" };
const UNDER = ["#00240c", "#243018", "#304824", "#3c5a2c"] as const;
const FAR = ["#061e14", "#0c3024", "#123c2c", "#184830"] as const;
const RUINF = ["#061a0e", "#0c3018", "#123a20", "#1a4428"] as const;
const COBBLE = [["#2a3024", "#3c483c", "#5a6250"], ["#2c2e24", "#45483a", "#606054"], ["#262e2a", "#3a4440", "#545c54"]] as const;
const GROUT = "#182418";
const XPLATE = ["#182418", "#303024", "#484830", "#606048"] as const;
const BLOCK = ["#3c3c30", "#606054", "#786c60", "#8c8270"] as const;
const BOULD = ["#303024", "#6c6458", "#84786c", "#a09c88"] as const;
const BEAD = ["#241808", "#c86a24", "#e4c048", "#18483c"] as const;
const CAVE = ["#0c180e", "#182418", "#18483c", "#3c8478"] as const;
const WOOD = ["#1c140c", "#302818", "#483c24", "#604824", "#6c3c18", "#8a5a30"] as const;
const BOLT = ["#3c3018", "#9c846c", "#d4c098"] as const;
const BRASS = ["#3c3018", "#6c6030", "#9c8440", "#e4c048"] as const;
const PANEL = ["#101814", "#243030", "#3c483c", "#546060"] as const;
const COLLAR = ["#3c4040", "#909078", "#c0c0a8"] as const;
const FOOT = ["#545448", "#909078", "#b4b49c", "#d8d8c0"] as const;
const BRICK = ["#1c1410", "#483024", "#54483a", "#60543c", "#6c603c"] as const;
const LAMP = "#e8ece0";

const MARGIN = 24;
const shown = (ctx: Ctx): View => {
  const m = ctx.getTransform();
  if (m.b || m.c || !m.a || !m.d) return [-Infinity, -Infinity, Infinity, Infinity];
  const xa = -m.e / m.a;
  const xb = (ctx.canvas.width - m.e) / m.a;
  const ya = -m.f / m.d;
  const yb = (ctx.canvas.height - m.f) / m.d;
  return [min(xa, xb) - MARGIN, min(ya, yb) - MARGIN, max(xa, xb) + MARGIN, max(ya, yb) + MARGIN];
};
const eachCell = (ctx: Ctx, x: number, y: number, w: number, h: number, cw: number, ch: number, draw: CellDraw, pad = 0): void => {
  const [vx0, vy0, vx1, vy1] = shown(ctx).map((v, k) => (k < 2 ? v - pad : v + pad)) as View;
  const i0 = max(0, floor((vx0 - x) / cw));
  const i1 = min(ceil(w / cw - 0.001), ceil((vx1 - x) / cw));
  const j0 = max(0, floor((vy0 - y) / ch));
  const j1 = min(ceil(h / ch - 0.001), ceil((vy1 - y) / ch));
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) draw(x + i * cw, y + j * ch, i, j);
};
const cellSeed = (seed: number, i: number, j: number): number => seed + i * 131 + j * 977;
const wrap = (i: number, n: number): number => ((i % n) + n) % n;
const clipRect = (ctx: Ctx, x: number, y: number, w: number, h: number, draw: () => void): void => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  draw();
  ctx.restore();
};
const clipPts = (ctx: Ctx, pts: Pt[], draw: () => void): void => {
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  draw();
  ctx.restore();
};
const jag = (x0: number, x1: number, y: number, amp: number, step: number, seed: number): Pt[] => {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let x = x0; x < x1; x += step * (0.5 + r())) pts.push([x, y - r() * amp]);
  pts.push([x1, y - r() * amp]);
  return pts;
};
const rounded = (x: number, y: number, w: number, h: number, rad: number): Pt[] => {
  const k = rad * 0.3;
  return [[x + rad, y], [x + w - rad, y], [x + w - k, y + k], [x + w, y + rad], [x + w, y + h - rad], [x + w - k, y + h - k], [x + w - rad, y + h], [x + rad, y + h], [x + k, y + h - k], [x, y + h - rad], [x, y + rad], [x + k, y + k]];
};
const foliage = (ctx: Ctx, cx: number, cy: number, rx: number, ry: number, seed: number, c: string, n = 6): void => {
  const r = rng(seed);
  const k = simple() ? round(n * 1.5) : n * 3;
  for (let i = 0; i < k; i++) {
    const a = r() * PI * 2;
    const d = sqrt(r()) * 0.85;
    const s = 0.17 + r() * 0.18;
    shape(ctx, blobPts(cx + cos(a) * rx * d, cy + sin(a) * ry * d, rx * s, ry * s * 1.3, seed + i * 7, simple() ? 8 : 13, 0.55), c);
  }
};
const trunk = (ctx: Ctx, x: number, y0: number, y1: number, wd: number, lean: number, c: string, seed: number): Pt => {
  const r = rng(seed);
  const h = y0 - y1;
  const bend = (r() - 0.5) * wd * 3;
  const pts: Pt[] = [];
  const back: Pt[] = [];
  for (let k = 0; k <= 6; k++) {
    const u = k / 6;
    const cx = x + lean * u + sin(u * PI) * bend;
    const half = (wd / 2) * (1 - u * 0.35) + (k === 0 ? wd * 0.5 : 0);
    pts.push([cx - half, y0 - h * u]);
    back.push([cx + half, y0 - h * u]);
  }
  shape(ctx, [...pts, ...back.reverse()], c);
  return [x + lean, y1];
};

const rectPts = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const edge = (ctx: Ctx, x: number, y: number, w: number, h: number, c: string): void => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, c);
};

const COBBLE_TILE = 16;
const COBBLE_SEED = 7100;
const stoneTone = (ctx: Ctx, pts: Pt[], t: readonly string[], lit: () => void): void => {
  shape(ctx, pts, t[1] as string);
  clipPts(ctx, pts, () => lit());
  path(ctx, pts);
  stroke(ctx, CLINE, 0.6);
};
const cobble = (ctx: Ctx, x: number, y: number, s: number, mossy: boolean): void => {
  const r = rng(s);
  const t = COBBLE[floor(r() * 3)] as readonly string[];
  const u = COBBLE[floor(r() * 3)] as readonly string[];
  const v = COBBLE[floor(r() * 3)] as readonly string[];
  const jx = (r() - 0.5) * 1.2;
  const wide = rounded(x + 1.4 + jx, y + 0.8, 21.6 - r() * 1.2, 10.4, 4.4);
  stoneTone(ctx, wide, t, () => {
    flat(ctx, x, y + 7.4, 24, 4, t[0] as string);
    flat(ctx, x + 4 + jx, y + 1.6, 16, 2, t[2] as string);
  });
  const cx = x + 19.6 + (r() - 0.5);
  const cy = y + 17.4;
  const rad = 6.1 + r() * 0.5;
  const ball = blobPts(cx, cy, rad * 0.95, rad, s + 5, simple() ? 10 : 16, 0.06);
  stoneTone(ctx, ball, u, () => {
    disc(ctx, cx + rad * 0.35, cy + rad * 0.4, rad * 0.9, u[0] as string);
    disc(ctx, cx - rad * 0.25, cy - rad * 0.3, rad * 0.75, u[1] as string);
    if (!simple()) disc(ctx, cx - rad * 0.4, cy - rad * 0.55, rad * 0.35, u[2] as string);
  });
  const sq = rounded(x + 4.6 + r() * 0.6, y + 12.4 + r() * 0.5, 8 + r() * 0.6, 8.6, 1.8);
  stoneTone(ctx, sq, v, () => {
    flat(ctx, x + 4, y + 18.4, 10, 3, v[0] as string);
    flat(ctx, x + 5.6, y + 13.2, 6, 1.4, v[2] as string);
  });
  if (mossy && r() < 0.45) {
    const mw = 6 + r() * 10;
    shape(ctx, blobPts(x + 12 + jx, y + 1.4, mw / 2, 1.8 + r(), s + 3, 8, 0.35), MOSS[r() < 0.5 ? 1 : 2]);
    if (!simple() && r() < 0.5) line(ctx, [[x + 12, y + 2], [x + 12 + (r() - 0.5) * 2, y + 5 + r() * 6]], MOSS[1], 0.8);
  }
};
const worldCells = (ctx: Ctx, x: number, y: number, w: number, h: number, c: number, draw: CellDraw, pad = 0): void => {
  const [vx0, vy0, vx1, vy1] = shown(ctx);
  for (let j = floor((max(y, vy0) - pad) / c); j < ceil((min(y + h, vy1) + pad) / c); j++)
    for (let i = floor((max(x, vx0) - pad) / c); i < ceil((min(x + w, vx1) + pad) / c); i++) draw(i * c, j * c, i, j);
};
const cobbleField = (ctx: Ctx, x: number, y: number, w: number, h: number, mossy: boolean, seed: number): void => {
  flat(ctx, x, y, w, h, GROUT);
  worldCells(ctx, x, y, w, h, TILE, (cx, cy, i, j) => cobble(ctx, cx, cy, cellSeed(seed, wrap(i, COBBLE_TILE), wrap(j, COBBLE_TILE)), mossy), TILE);
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed + 1, 0.6);
  worldCells(ctx, x, y, w, h, 96, (cx, cy, i, j) => {
    const r = rng(cellSeed(seed + 5, wrap(i, 4), wrap(j, 4)));
    if (r() < 0.5) G.drips(ctx, cx + r() * 60, cy + 10 + r() * 50, 30, 18, seed + 6 + wrap(i, 4) + wrap(j, 4) * 7, 1, false);
    if (mossy && r() < 0.6) vine(ctx, cx + 10 + r() * 70, cy + r() * 30, 14 + r() * 20, seed + 9 + wrap(i, 4) * 3 + wrap(j, 4));
  }, 48);
};

const jungleSky: EnvAsset = {
  id: "jungleSky",
  box: [0, -170, 320, 0],
  draw(ctx) {
    const layers: ((dx: number, r: () => number) => void)[] = [
      (dx, r) => {
        for (let i = 0; i < 9; i++) shape(ctx, blobPts(dx + 20 + i * 36 + r() * 16, -150 + r() * 70, 26 + r() * 22, 12 + r() * 10, 9110 + i, 10, 0.35), SKY.mist);
        for (let i = 0; i < 5; i++) shape(ctx, blobPts(dx + 30 + i * 64 + r() * 20, -120 + r() * 40, 14 + r() * 10, 6 + r() * 5, 9130 + i, 9, 0.35), SKY.light);
      },
      (dx, r) => {
        for (let i = 0; i < 11; i++) {
          const x = dx + 6 + i * 29 + r() * 14;
          const top = trunk(ctx, x, -68, -170, 1.6 + r() * 1.6, (r() - 0.5) * 18, SKY.canopy, 9150 + i);
          if (r() < 0.6) line(ctx, [[x + (top[0] - x) * 0.6, -130], [x + (top[0] - x) * 0.6 + (r() - 0.5) * 30, -150 - r() * 12]], SKY.canopy, 1.2);
        }
        for (let i = 0; i < 12; i++) foliage(ctx, dx + i * 28 + r() * 14, -150 + r() * 30, 20 + r() * 12, 9 + r() * 6, 9180 + i, SKY.canopy, 7);
        for (let i = 0; i < 6; i++) foliage(ctx, dx + 10 + i * 54 + r() * 20, -108 + r() * 26, 14 + r() * 10, 6 + r() * 4, 9200 + i, SKY.canopy, 5);
      },
      (dx, r) => {
        for (let i = 0; i < 5; i++) {
          const x = dx + 18 + i * 66 + r() * 22;
          const lean = (r() - 0.5) * 34;
          const top = trunk(ctx, x, -66, -172, 3.2 + r() * 3, lean, SKY.trunk, 9220 + i);
          const fork: Pt = [x + lean * 0.55, -124];
          for (const s of [-1, 1]) curve(ctx, [fork, [fork[0] + s * (8 + r() * 10), -140], [fork[0] + s * (18 + r() * 18), -152 - r() * 14]], SKY.trunk, 1.6 + r());
          foliage(ctx, top[0], -164, 24 + r() * 12, 10 + r() * 6, 9240 + i, SKY.trunk, 6);
        }
        foliage(ctx, dx + 6, -166, 40, 14, 9260, SKY.trunk, 7);
      },
      (dx, r) => {
        for (let i = 0; i < 8; i++) shape(ctx, blobPts(dx + 20 + i * 42 + r() * 10, -72, 30 + r() * 14, 4 + r() * 2, 9265 + i, 10, 0.3), SKY.mist);
        const ground: Pt[] = [[dx, 0], [dx, -66], ...jag(dx + 8, dx + 312, -66, 3, 10, 9270), [dx + 320, -66], [dx + 320, 0]];
        shape(ctx, ground, SKY.band);
      },
      (dx, r) => {
        for (let i = 0; i < 4; i++) {
          const cx = dx + 40 + i * 80 + r() * 30;
          foliage(ctx, cx, -22, 22 + r() * 12, 16 + r() * 6, 9280 + i, UNDER[1], 8);
          foliage(ctx, cx - 4, -28, 14 + r() * 6, 9 + r() * 4, 9290 + i, UNDER[2], 5);
        }
      },
      (dx, r) => {
        for (let i = 0; i < 9; i++) {
          ctx.save();
          ctx.translate(dx + 8 + i * 36 + r() * 18, 0);
          fern(ctx, 0, 26 + r() * 22, 9300 + i, UNDER);
          ctx.restore();
        }
      },
      (dx, r) => {
        for (let i = 0; i < 6; i++) {
          const x = dx + 20 + i * 56 + r() * 20;
          const s = r() < 0.5 ? -1 : 1;
          const len = 30 + r() * 20;
          const tip: Pt = [x + s * len * 0.8, -len * 0.9];
          shape(ctx, [[x, 0], [x + s * len * 0.3, -len * 0.62], tip, [x + s * len * 0.42, -len * 0.5], [x + s * 4, 0]], UNDER[2]);
          line(ctx, [[x + s, 0], [x + s * len * 0.34, -len * 0.56], tip], UNDER[1], 0.6);
        }
        flat(ctx, dx, -4, 320, 4, UNDER[0]);
      },
    ];
    clipRect(ctx, 0, -170, 320, 170, () => {
      flat(ctx, 0, -170, 320, 170, SKY.air);
      layers.forEach((layer, k) => {
        for (const dx of [-320, 0, 320]) layer(dx, rng(9100 + k * 97));
      });
    });
  },
};

const farTrees: EnvAsset = {
  id: "farTrees",
  box: [0, -240, 96, 0],
  draw(ctx, state, _t, { w = 96, h = 240 }) {
    const seed = 9400 + round(w * 7 + h * 3) + state * 11;
    const r = rng(seed);
    const n = max(1, round(w / 34));
    const trunks: [number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) * w) / n + (r() - 0.5) * 10;
      const wd = 5 + r() * 5;
      const lean = (r() - 0.5) * 16;
      trunk(ctx, x, 0, -h, wd, lean, i % 2 ? FAR[0] : FAR[1], seed + i);
      trunks.push([x, wd, lean]);
      const fy = -h * (0.55 + r() * 0.2);
      for (const s of [-1, 1]) if (r() < 0.7) curve(ctx, [[x + lean * 0.6, fy], [x + lean * 0.6 + s * 8, fy - 14], [x + lean * 0.6 + s * (14 + r() * 8), fy - 30]], FAR[1], 2 + r());
    }
    G.inside(ctx, () => {
      ctx.beginPath();
      for (const [x, wd, lean] of trunks) ctx.rect(x - wd, -h, wd * 2 + abs(lean) + 4, h);
    }, () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 20, 0.5);
      G.drips(ctx, 0, -h * 0.6, w, h * 0.3, seed + 21, max(2, round(w / 20)), false);
    });
    for (let y = -h; y < -h * 0.4; y += 34) for (let x = 0; x < w + 10; x += 30 + r() * 10) if (r() < 0.75) foliage(ctx, x + (r() - 0.5) * 10, y + r() * 16, 18 + r() * 8, 10 + r() * 5, seed + round(x * 3 - y), r() < 0.6 ? FAR[3] : FAR[2], 6);
    if (state === 1) {
      for (let x = 4; x < w - 2; x += 8 + r() * 10) {
        const top = -h * (0.5 + r() * 0.4);
        const len = h * (0.25 + r() * 0.35);
        const pts: Pt[] = [];
        for (let k = 0; k <= 5; k++) pts.push([x + sin(k * 1.4 + x) * 2, top + (len * k) / 5]);
        curve(ctx, pts, FAR[0], 1.1);
        if (!simple()) for (let k = 1; k <= 5; k++) if (r() < 0.6) shape(ctx, blobPts((pts[k] as Pt)[0] + (r() - 0.5) * 3, (pts[k] as Pt)[1], 2.4, 1.6, seed + round(x) + k, 6, 0.3), FAR[2]);
      }
    }
    const base: Pt[][] = [rectPts(0, -3, w, 3)];
    for (let x = -4; x < w + 4; x += 12 + r() * 10) {
      const bw = 18 + r() * 14;
      const pts: Pt[] = [[x - bw / 2, 0], ...jag(x - bw / 2, x + bw / 2, -8 - r() * 8, 6, 4, seed + round(x) + 40), [x + bw / 2, 0]];
      shape(ctx, pts, FAR[1]);
      base.push(pts);
    }
    G.inside(ctx, G.polysRegion(ctx, base), () => G.dirt(ctx, 0, -20, w, 20, seed + 50, 0.6));
    flat(ctx, 0, -3, w, 3, FAR[0]);
  },
};

const ruinVines = (ctx: Ctx, x0: number, x1: number, top: number, len: number, seed: number): void => {
  const r = rng(seed);
  for (let x = x0 + 2; x < x1; x += 7 + r() * 12) {
    const l = len * (0.3 + r() * 0.7);
    const pts: Pt[] = [];
    for (let k = 0; k <= 5; k++) pts.push([x + sin(k * 1.3 + x) * 1.6, top + (l * k) / 5]);
    curve(ctx, pts, RUINF[3], 1);
    if (!simple()) for (let k = 1; k <= 5; k++) if (r() < 0.5) shape(ctx, blobPts((pts[k] as Pt)[0], (pts[k] as Pt)[1], 2.2, 1.5, seed + round(x) + k, 6, 0.3), RUINF[3]);
  }
};

const farTowerRuin: EnvAsset = {
  id: "farTowerRuin",
  box: [0, -288, 72, 0],
  draw(ctx, state, _t, { w = 72, h = 288 }) {
    const seed = 9600 + round(w * 5 + h * 7) + state * 13;
    const r = rng(seed);
    if (state === 0) {
      const top = h * 0.82;
      const a = w * 0.14;
      const b = w * 0.36;
      const legs: [number, number, number, number][] = [[a, 0, b, -top], [w - a, 0, w - b, -top]];
      for (const [x0, y0, x1, y1] of legs) line(ctx, [[x0, y0], [x1, y1]], RUINF[2], 3.2, "butt");
      const n = max(3, round(top / 36));
      for (let k = 0; k < n; k++) {
        const u0 = k / n;
        const u1 = (k + 1) / n;
        const lx0 = a + (b - a) * u0;
        const lx1 = a + (b - a) * u1;
        const rx0 = w - lx0;
        const rx1 = w - lx1;
        const y0 = -top * u0;
        const y1 = -top * u1;
        if (k === 2 && r() < 0.8) {
          line(ctx, [[lx0, y0], [lx0 + (rx1 - lx0) * 0.45, y0 + (y1 - y0) * 0.3]], RUINF[1], 1.4);
        } else {
          line(ctx, [[lx0, y0], [rx1, y1]], RUINF[1], 1.4);
          line(ctx, [[rx0, y0], [lx1, y1]], RUINF[1], 1.4);
        }
        line(ctx, [[lx1, y1], [rx1, y1]], RUINF[2], 1.8);
      }
      const cab: Pt[] = [[b - 6, -top], [b - 6, -top - 22], [w * 0.5, -top - 30], ...jag(w * 0.5, w - b + 6, -top - 26, 8, 4, seed + 1), [w - b + 6, -top]];
      shape(ctx, cab, RUINF[2]);
      G.grain(ctx, G.polyRegion(ctx, cab), seed + 2, 0.5);
      flat(ctx, b - 2, -top - 16, 8, 7, RUINF[0]);
      flat(ctx, w - b - 8, -top - 15, 6, 6, RUINF[0]);
      line(ctx, [[w * 0.5 - 2, -top - 30], [w * 0.5 + 6, -h + 4]], RUINF[2], 1.4);
      G.drips(ctx, b - 6, -top - 20, w - 2 * b + 12, 30, seed + 3, 3, false);
      G.dirt(ctx, 0, -top, w, top, seed + 4, 0.2);
      ruinVines(ctx, b - 6, w - b + 6, -top, top * 0.45, seed + 5);
      for (const [x0, , x1, y1] of legs) {
        const pts: Pt[] = [];
        for (let k = 0; k <= 6; k++) pts.push([x1 + (x0 - x1) * (k / 6) + sin(k * 2.1) * 2.5, y1 + (-y1 * k) / 6]);
        curve(ctx, pts, RUINF[3], 1.2);
      }
    } else {
      const bh = h * 0.42;
      const roof: Pt[] = [[0, -bh * 0.78], ...jag(0, w * 0.45, -bh, 10, 5, seed + 6), [w * 0.55, -bh * 0.7], ...jag(w * 0.55, w, -bh * 0.55, 8, 5, seed + 7)];
      const out: Pt[] = [[0, 0], ...roof, [w, 0]];
      shape(ctx, out, RUINF[2]);
      const windows: Pt[][] = [];
      clipPts(ctx, out, () => {
        flat(ctx, 0, -bh, 5, bh, RUINF[3]);
        flat(ctx, w - 6, -bh, 6, bh, RUINF[1]);
        flat(ctx, 0, -bh * 0.5, w, 2, RUINF[3]);
        for (let x = 8; x < w - 12; x += 20) {
          flat(ctx, x, -bh * 0.42, 12, 10, RUINF[0]);
          windows.push(rectPts(x, -bh * 0.42, 12, 10));
          if (!simple()) for (let bx = x + 3; bx < x + 12; bx += 3) flat(ctx, bx, -bh * 0.42, 0.8, 10, RUINF[2]);
        }
        G.inside(ctx, null, () => {
          G.grain(ctx, G.polyRegion(ctx, out), seed + 8, 0.5);
          G.drips(ctx, 0, -bh * 0.7, w, bh * 0.4, seed + 9, round(w / 12), false);
          G.dirt(ctx, 0, -bh, w, bh, seed + 10, 0.35);
        }, windows);
      });
      const hole = blobPts(w * 0.62, -bh * 0.3, 9, 8, seed + 11, 10, 0.3);
      clipPts(ctx, out, () => G.inside(ctx, null, () => G.scorch(ctx, hole, seed + 12), windows));
      shape(ctx, hole, RUINF[0]);
      G.rim(ctx, hole, seed + 13, RUINF[3], RUINF[0]);
      const tx = w * 0.3;
      const ty = -bh * 0.9;
      const crown = ty - min(70, h * 0.25);
      trunk(ctx, tx, ty + 4, crown, 4, 8, RUINF[1], seed + 14);
      curve(ctx, [[tx + 3, crown + 24], [tx - 8, crown + 10], [tx - 16, crown + 4]], RUINF[1], 2);
      foliage(ctx, tx + 6, crown, w * 0.42, 22, seed + 15, RUINF[2], 9);
      foliage(ctx, tx + 2, crown - 6, w * 0.25, 12, seed + 16, RUINF[3], 5);
      ruinVines(ctx, 0, w, -bh * 0.75, bh * 0.6, seed + 17);
    }
    for (let x = 0; x < w; x += 14 + r() * 10) {
      const bw = 16 + r() * 10;
      shape(ctx, [[x - bw / 2, 0], ...jag(x - bw / 2, x + bw / 2, -6 - r() * 8, 5, 4, seed + 40 + round(x)), [x + bw / 2, 0]], RUINF[1]);
    }
  },
};

const cobbleFill: EnvAsset = {
  id: "cobbleFill",
  box: [0, -48, 48, 0],
  draw(ctx, state, _t, { w = 48, h = 48, at = [0, 0] }) {
    const [ax, ay] = at;
    clipRect(ctx, 0, -h, w, h, () => {
      ctx.save();
      ctx.translate(-ax, -ay);
      cobbleField(ctx, ax, ay - h, w, h, state === 1, COBBLE_SEED);
      ctx.restore();
    });
  },
};

const xPlate = (ctx: Ctx, x: number, y: number, w: number, h: number, s: number): void => {
  const r = rng(s);
  flat(ctx, x, y, w, h, XPLATE[2]);
  clipRect(ctx, x, y, w, h, () => {
    const bar = w * 0.2;
    for (const [ax, ay, bx, by] of [[x, y, x + w, y + h], [x + w, y, x, y + h]] as const) {
      line(ctx, [[ax, ay], [bx, by]], XPLATE[1], bar, "butt");
      if (!simple()) line(ctx, [[ax, ay - bar * 0.35], [bx, by - bar * 0.35]], XPLATE[3], bar * 0.22, "butt");
    }
    shape(ctx, [[x + w / 2, y + h * 0.34], [x + w * 0.66, y + h / 2], [x + w / 2, y + h * 0.66], [x + w * 0.34, y + h / 2]], XPLATE[0]);
  });
  flat(ctx, x, y, w, 1.2, XPLATE[3]);
  flat(ctx, x, y + h - 1.4, w, 1.4, XPLATE[0]);
  flat(ctx, x + 1, y, 2.4, h, BOLT[0]);
  flat(ctx, x + 1.4, y, 1.2, h, BRASS[2]);
  if (!simple()) for (let by = y + 3; by < y + h - 1; by += 5) flat(ctx, x + 1.4, by, 1.4, 1.4, BOLT[2]);
  edge(ctx, x, y, w, h, CLINE);
  if (r() < 0.4) G.rustPatch(ctx, x + w * (0.3 + r() * 0.4), y + h * 0.7, 2.4, 1.2, s + 1);
};
const stoneBlock = (ctx: Ctx, x: number, y: number, w: number, h: number, s: number): void => {
  const r = rng(s);
  flat(ctx, x, y, w, h, BLOCK[1]);
  clipRect(ctx, x, y, w, h, () => {
    for (let k = 0; k < (simple() ? 2 : 5); k++) shape(ctx, blobPts(x + r() * w, y + r() * h, 3 + r() * 4, 2 + r() * 3, s + k, 8, 0.35), k % 2 ? BLOCK[2] : BLOCK[0]);
    if (!simple()) for (let k = 0; k < 3; k++) shape(ctx, blobPts(x + r() * w, y + r() * h * 0.6, 1.5 + r() * 2, 1 + r(), s + 10 + k, 7, 0.3), BLOCK[3]);
  });
  flat(ctx, x, y, w, 1.4, BLOCK[3]);
  flat(ctx, x, y + h - 1.6, w, 1.6, BLOCK[0]);
  edge(ctx, x, y, w, h, CLINE);
};
const beads = (ctx: Ctx, x: number, y: number, w: number): void => {
  flat(ctx, x, y, w, 3.2, BEAD[0]);
  if (simple()) {
    flat(ctx, x, y + 0.8, w, 1.6, BEAD[1]);
    return;
  }
  for (let bx = x + 0.4; bx < x + w - 0.6; bx += 2.4) {
    flat(ctx, bx, y + 0.6, 1.6, 2, round(bx / 2.4) % 4 ? BEAD[1] : BEAD[2]);
    flat(ctx, bx + 0.2, y + 0.6, 1.2, 0.6, BEAD[2]);
  }
  flat(ctx, x, y + 2.6, w, 0.6, BEAD[3]);
};
const hangBoulders = (ctx: Ctx, w: number, seed: number): void => {
  eachCell(ctx, 0, 22, w, 24, 24, 24, (x, _y, i) => {
    const r = rng(seed + i * 41);
    const cx = x + 12 + (r() - 0.5) * 3;
    const rx = 13.5 + r() * 2;
    const ry = 7.5 + r() * 2.5;
    stone(ctx, cx, 24 + ry * 0.7, rx, ry, seed + i * 41 + 1, BOULD);
    if (!simple() && r() < 0.35) line(ctx, [[cx - 2, 24], [cx + 1, 30], [cx - 1, 34]], BOULD[0], 0.6);
  }, 14);
};
const caveBand = (ctx: Ctx, w: number, seed: number): void => {
  flat(ctx, 0, 24, w, 18, CAVE[1]);
  flat(ctx, 0, 24, w, 1.2, CAVE[0]);
  flat(ctx, 0, 27.4, w, 1, CAVE[2]);
  if (!simple()) flat(ctx, 0, 27.4, w, 0.4, CAVE[3]);
  eachCell(ctx, 0, 24, w, 18, 24, 18, (x, _y, i) => {
    const r = rng(seed + i * 29);
    if (i % 2 === 0) {
      flat(ctx, x + 6, 30, 12, 5, BOULD[1], CLINE);
      if (!simple()) for (let ly = 31; ly < 35; ly += 1.6) flat(ctx, x + 7, ly, 10, 0.7, BOULD[3]);
    }
    if (r() < 0.4) line(ctx, [[x + 4 + r() * 16, 28], [x + 4 + r() * 16, 36 + r() * 5]], CAVE[2], 0.6);
  });
  G.grain(ctx, G.rectRegion(ctx, 0, 24, w, 18), seed + 1, 0.6);
  G.drips(ctx, 0, 28, w, 10, seed + 2, max(1, round(w / 30)), false);
  ctx.save();
  ctx.globalAlpha = 0.5;
  flat(ctx, 0, 38, w, 4, CAVE[0]);
  ctx.restore();
};
const walkway = (ctx: Ctx, state: number, w: number): void => {
  const seed = 9800 + state * 7;
  if (state === 0) hangBoulders(ctx, w, seed + 100);
  if (state === 1) caveBand(ctx, w, seed + 200);
  flat(ctx, 0, 15, w, 9, CAVE[1]);
  eachCell(ctx, 0, 0, w, 24, 24, 24, (x, _y, i) => {
    const s = seed + i * 37;
    if (i % 2 === 0) {
      xPlate(ctx, x, 0, 24, 15, s);
      flat(ctx, x + 4, 18, 14, 6, XPLATE[2], CLINE);
      if (!simple()) {
        flat(ctx, x + 4.6, 18.6, 12.8, 1, XPLATE[3]);
        flat(ctx, x + 10, 20, 2, 2, BOLT[1]);
      }
    } else stoneBlock(ctx, x, 0, 24, 15, s);
  });
  beads(ctx, 0, 15, w);
  if (!simple()) eachCell(ctx, 0, 21, w, 3, 12, 3, (x, _y, i) => {
    if (i % 2) flat(ctx, x + 2, 21.6, 6, 1, CAVE[2]);
  });
  G.grain(ctx, G.rectRegion(ctx, 0, 0, w, 24), seed + 1);
  G.chips(ctx, 0, 0.4, w, seed + 2, G.DIRT);
  G.drips(ctx, 0, 18, w, 5, seed + 3, max(1, round(w / 30)), false);
  G.dirt(ctx, 0, 4, w, 11, seed + 4, 0.4);
  eachCell(ctx, 0, 0, w, 24, 72, 24, (x, _y, i) => {
    const r = rng(seed + 50 + i);
    const mx = x + r() * 50;
    if (r() < 0.55 && mx < w - 4) mossCap(ctx, mx, 0, min(6 + r() * 14, w - mx), seed + 51 + i, 2);
    const gx = x + 20 + r() * 40;
    if (state !== 1 && r() < 0.4 && gx < w - 6) grass(ctx, gx, min(4 + r() * 6, w - gx), 4, seed + 52 + i);
  });
};

const jungleWalkway: EnvAsset = {
  id: "jungleWalkway",
  box: [0, -6, 120, 48],
  draw(ctx, state, _t, { w = 120 }) {
    walkway(ctx, state, w);
  },
};

const caveWalkway: EnvAsset = {
  id: "caveWalkway",
  box: [0, -6, 120, 48],
  draw(ctx, _state, _t, { w = 120 }) {
    walkway(ctx, 1, w);
  },
};

const plankBridge: EnvAsset = {
  id: "plankBridge",
  box: [0, -24, 120, 6],
  draw(ctx, _state, _t, { w = 120 }) {
    const seed = 9900 + round(w);
    flat(ctx, 0, -24, w, 3, WOOD[4], CLINE);
    if (!simple()) flat(ctx, 0, -24, w, 0.8, WOOD[5]);
    flat(ctx, 0, -21, w, 12, WOOD[2]);
    eachCell(ctx, 0, -21, w, 12, 12, 12, (x, _y, i) => {
      const r = rng(seed + i * 17);
      flat(ctx, x + 1.4, -19.6, 9.2, 9, WOOD[1], CLINE);
      flat(ctx, x + 2.2, -18.8, 7.6, 1, WOOD[0]);
      flat(ctx, x + 2.2, -11.6, 7.6, 1, WOOD[3]);
      disc(ctx, x + 6, -15, 1.9, BOLT[1], CLINE);
      if (!simple()) disc(ctx, x + 5.5, -15.5, 0.7, BOLT[2]);
      flat(ctx, x, -21, 0.8, 12, WOOD[0]);
      if (r() < 0.3) G.rustPatch(ctx, x + 6, -13, 2.4, 1.3, seed + i * 17 + 1);
    });
    flat(ctx, 0, -9, w, 4, WOOD[3], CLINE);
    flat(ctx, 0, -5, w, 3.2, WOOD[4], CLINE);
    if (!simple()) {
      flat(ctx, 0, -9, w, 0.7, WOOD[5]);
      eachCell(ctx, 0, -9, w, 7, 30, 7, (x, _y, i) => {
        const r = rng(seed + 300 + i);
        line(ctx, [[x + r() * 6, -7], [x + 12 + r() * 14, -7.2]], WOOD[2], 0.5);
        line(ctx, [[x + 4 + r() * 10, -3.4], [x + 18 + r() * 10, -3.2]], WOOD[1], 0.5);
        flat(ctx, x + 29, -9, 0.8, 7.2, WOOD[0]);
      });
    }
    flat(ctx, 0, -1.8, w, 1.8, WOOD[0]);
    G.grain(ctx, G.rectRegion(ctx, 0, -24, w, 24), seed + 1);
    G.chips(ctx, 0, -23.6, w, seed + 2, G.DIRT);
    G.drips(ctx, 0, -9, w, 12, seed + 3, max(1, round(w / 20)));
    G.dirt(ctx, 0, -21, w, 12, seed + 4, 0.35);
    eachCell(ctx, 0, -24, w, 24, 60, 24, (x, _y, i) => {
      const r = rng(seed + 60 + i);
      const mx = x + r() * 40;
      if (r() < 0.5 && mx < w - 4) mossCap(ctx, mx, -24, min(6 + r() * 12, w - mx), seed + 61 + i, 1.6);
      const vx = x + 10 + r() * 40;
      if (!simple() && r() < 0.35 && vx < w - 6) vine(ctx, vx, -2, 6 + r() * 6, seed + 62 + i);
    });
    for (const x of [0, w - 5]) {
      flat(ctx, x, -24, 5, 24, PANEL[2], CLINE);
      flat(ctx, x + 0.8, -24, 1.4, 24, PANEL[3]);
      flat(ctx, x + 3.6, -24, 1.4, 24, PANEL[1]);
      G.surface(ctx, x, -24, 5, 24, seed + 70 + x, { rise: 0.4, drip: 1, dripLen: 10, edge: false });
    }
  },
};

const brassDeck: EnvAsset = {
  id: "brassDeck",
  box: [0, -24, 120, 25],
  draw(ctx, _state, _t, { w = 120 }) {
    const seed = 10000 + round(w);
    flat(ctx, 0, -24, w, 48, PANEL[0]);
    flat(ctx, 0, -24, w, 3, CAVE[1], CLINE);
    if (!simple()) flat(ctx, 0, -24, w, 0.8, PANEL[3]);
    const bracket = (x: number, y: number, h: number): void => {
      flat(ctx, x + 3.4, y + 3.4, 20.6, h - 3.4, PANEL[1]);
      flat(ctx, x + 3.4, y + 3.4, 20.6, 1.2, PANEL[2]);
      flat(ctx, x, y, 24, 3.4, BRASS[2], CLINE);
      flat(ctx, x, y, 3.4, h, BRASS[2], CLINE);
      flat(ctx, x, y, 24, 0.9, BRASS[3]);
      flat(ctx, x, y, 0.9, h, BRASS[3]);
      flat(ctx, x, y + 2.6, 24, 0.8, BRASS[0]);
      flat(ctx, x + 2.6, y, 0.8, h, BRASS[0]);
    };
    eachCell(ctx, 0, -21, w, 45, 24, 45, (x, _y, i) => {
      const r = rng(seed + i * 23);
      bracket(x, -21, 13);
      flat(ctx, x, -8, 24, 5, PANEL[2], CLINE);
      if (!simple()) flat(ctx, x, -8, 24, 0.8, PANEL[3]);
      if (i % 2 === 1) {
        flat(ctx, x + 7, -7.6, 5, 4.2, PANEL[0]);
        edge(ctx, x + 7, -7.6, 5, 4.2, LAMP);
        flat(ctx, x + 8.2, -6.6, 2.6, 2.2, "#bcc4b0");
      }
      flat(ctx, x, -3, 24, 3, PANEL[0]);
      bracket(x, 0, 14);
      flat(ctx, x + 1, 14, 3, 10, PANEL[0], CLINE);
      flat(ctx, x + 14, 14, 3, 10, PANEL[0], CLINE);
      flat(ctx, x + 4, 15, 10, 9, PANEL[1]);
      if (!simple()) flat(ctx, x + 4, 15, 10, 0.8, PANEL[2]);
      if (r() < 0.45) G.rustPatch(ctx, x + 4 + r() * 16, -14 + r() * 20, 2.6, 1.4, seed + i * 23 + 1);
      if (r() < 0.4) G.drips(ctx, x + 2, -18, 20, 8, seed + i * 23 + 2, 1);
    });
    G.grain(ctx, G.rectRegion(ctx, 0, -24, w, 48), seed + 1);
    G.chips(ctx, 0, -23.6, w, seed + 2, G.DIRT);
    G.dirt(ctx, 0, 0, w, 24, seed + 3, 0.5);
    G.drips(ctx, 0, -3, w, 10, seed + 4, max(1, round(w / 30)));
    eachCell(ctx, 0, -24, w, 24, 72, 24, (x, _y, i) => {
      const r = rng(seed + 80 + i);
      const mx = x + r() * 50;
      if (r() < 0.4 && mx < w - 4) mossCap(ctx, mx, -24, min(6 + r() * 10, w - mx), seed + 81 + i, 1.6);
    });
  },
};

const columnCell = (ctx: Ctx, x: number, y: number, w: number, s: number, top: boolean): void => {
  const r = rng(s);
  flat(ctx, x, y, w, 24, XPLATE[2]);
  clipRect(ctx, x, y + 2, w, 19, () => {
    const bar = w * 0.28;
    for (const [ax, bx] of [[x + 3, x + w - 3], [x + w - 3, x + 3]] as const) {
      line(ctx, [[ax, y + 2], [(ax + bx) / 2, y + 11.5], [ax, y + 21]], XPLATE[1], bar, "butt");
      if (!simple()) line(ctx, [[ax, y + 1], [(ax + bx) / 2 + (bx > ax ? -0.6 : 0.6), y + 10.5], [ax, y + 20]], XPLATE[3], bar * 0.22, "butt");
    }
  });
  flat(ctx, x, y, w, 2, XPLATE[0]);
  if (top) flat(ctx, x - 1, y, w + 2, 2.4, COLLAR[1], CLINE);
  flat(ctx, x, y + 21, w, 3, COLLAR[1], CLINE);
  if (!simple()) {
    flat(ctx, x, y + 21, w, 0.8, COLLAR[2]);
    flat(ctx, x, y + 22.6, w, 0.8, COLLAR[0]);
    for (const bx of [x + 1.4, x + w - 2.8]) for (let by = y + 4; by < y + 20; by += 5) flat(ctx, bx, by, 1.4, 1.4, BOLT[1]);
  }
  edge(ctx, x, y, w, 24, CLINE);
  if (r() < 0.2) G.rustPatch(ctx, x + w * 0.5, y + 14, 2.2, 1.2, s + 1);
  G.drips(ctx, x + 1, y + 2, w - 2, 12, s + 2, 1, r() < 0.3);
};
const footBlock = (ctx: Ctx, x: number, y: number, w: number, s: number): void => {
  flat(ctx, x, y, w, 24, FOOT[1]);
  clipRect(ctx, x, y + 6, w, 18, () => {
    line(ctx, [[x, y + 6], [x + w, y + 24]], FOOT[0], 3.4, "butt");
    line(ctx, [[x + w, y + 6], [x, y + 24]], FOOT[0], 3.4, "butt");
    if (!simple()) line(ctx, [[x, y + 5], [x + w, y + 23]], FOOT[3], 0.8, "butt");
  });
  flat(ctx, x, y + 6, w * 0.22, 18, FOOT[2]);
  flat(ctx, x + w * 0.2, y + 0.6, w * 0.6, 5, BRASS[1], CLINE);
  if (!simple()) for (let gx = x + w * 0.24; gx < x + w * 0.78; gx += 2) flat(ctx, gx, y + 1.4, 0.9, 3.4, BRASS[3]);
  edge(ctx, x, y, w, 24, CLINE);
  G.surface(ctx, x, y, w, 24, s, { rise: 0.6, drip: 1, dripLen: 10, edge: false });
};

const girderColumn: EnvAsset = {
  id: "girderColumn",
  box: [0, -96, 24, 0],
  draw(ctx, state, _t, { h = state === 1 ? 24 : 96 }) {
    const seed = 10100 + state * 9;
    const n = max(1, round(h / 24));
    const w = state === 1 ? 18 : 24;
    const x = (24 - w) / 2;
    for (let k = 0; k < n; k++) {
      const y = -h + k * 24;
      const last = k === n - 1;
      if (last && state === 0 && n > 1) footBlock(ctx, x, y, w, seed + k);
      else columnCell(ctx, x, y, w, seed + k * 13, k === 0 && state === 1);
    }
    G.grain(ctx, G.rectRegion(ctx, x, -h, w, h), seed + 1, 0.5);
    G.dirt(ctx, x, -h, w, h, seed + 2, min(0.3, 40 / h));
    if (state === 1) {
      flat(ctx, x - 2, -2, w + 4, 2, XPLATE[0], CLINE);
      grass(ctx, x - 3, w + 6, 4, seed + 3);
    }
  },
};

const stoneParapet: EnvAsset = {
  id: "stoneParapet",
  box: [0, -96, 144, 0],
  draw(ctx, state, _t, { w = state === 1 ? 24 : 144, h = state === 1 ? 96 : 48 }) {
    const seed = 10300 + state * 11;
    const n = max(1, round(h / 24));
    const cw = state === 1 ? w : 24;
    clipRect(ctx, 0, -h, w, h, () => {
      for (let j = 0; j < n; j++) {
        const y = -h + j * 24;
        const off = state === 0 && j % 2 ? 12 : 0;
        eachCell(ctx, -off, y, w + off, 20, cw, 20, (x, _y, i) => stoneBlock(ctx, x, y, cw, 20, cellSeed(seed, i, j)));
        beads(ctx, 0, y + 20, w);
        flat(ctx, 0, y + 23.2, w, 0.8, CAVE[0]);
      }
    });
    edge(ctx, 0, -h, w, h, CLINE);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 0.6);
    G.drips(ctx, 0, -h + 20, w, h - 20, seed + 2, max(1, round(w / 20)), false);
    G.dirt(ctx, 0, -h, w, h, seed + 3, 0.35);
    G.chips(ctx, 0, -h + 0.4, w, seed + 4, G.DIRT);
    eachCell(ctx, 0, -h, w, 2, 48, 2, (x, _y, i) => {
      const r = rng(seed + 50 + i);
      const mx = x + r() * 24;
      if (mx < w - 4) mossCap(ctx, mx, -h, min(8 + r() * 16, w - mx), seed + 51 + i, 2.4);
    });
    if (state === 0) grass(ctx, 1, min(10, w - 2), 4, seed + 5);
  },
};

const BRICK_W = 8;
const BRICK_H = 4;

const brickRuin: EnvAsset = {
  id: "brickRuin",
  box: [0, -120, 120, 0],
  draw(ctx, state, _t, { w = 120, h = 120 }) {
    const seed = 10200 + state * 17 + round(w + h * 3);
    const r = rng(seed);
    const cols = ceil(w / (BRICK_W / 2));
    const tops: number[] = [];
    for (let c = 0; c <= cols; c++) {
      const u = c / cols;
      const f = state === 0 ? 0.12 + 0.88 * min(1, max(0, (u - 0.15) / 0.7)) ** 1.3 : 0.18 + 0.12 * sin(u * 7 + seed);
      tops.push(-round((h * f) / BRICK_H) * BRICK_H - floor(r() * 2) * BRICK_H);
    }
    const pts: Pt[] = [[0, 0]];
    tops.forEach((y, c) => {
      const x = min(w, c * (BRICK_W / 2));
      pts.push([x, y], [min(w, x + BRICK_W / 2), y]);
    });
    pts.push([w, 0]);
    shape(ctx, pts, BRICK[0]);
    clipPts(ctx, pts, () => {
      const top = min(...tops);
      eachCell(ctx, 0, top, w, -top, BRICK_W, BRICK_H, (x, y) => {
        const row = round((y - top) / BRICK_H) + round(top / BRICK_H);
        const off = wrap(row, 2) ? BRICK_W / 2 : 0;
        for (const bx of [x - off, x - off + BRICK_W]) {
          const rr = rng(cellSeed(seed, round(bx / 6), row));
          const k = rr();
          const c = k < 0.4 ? BRICK[1] : k < 0.75 ? BRICK[2] : BRICK[3];
          flat(ctx, bx + 0.5, y + 0.5, BRICK_W - 1, BRICK_H - 1, c);
          if (!simple()) {
            flat(ctx, bx + 0.6, y + 0.6, BRICK_W - 1.2, 0.6, k < 0.75 ? BRICK[3] : BRICK[4]);
          }
          if (rr() < 0.07) flat(ctx, bx + 0.6, y + 0.6, BRICK_W - 1.2, BRICK_H - 1.2, "#140c08");
        }
      }, BRICK_W);
      G.grain(ctx, G.polyRegion(ctx, pts), seed + 1);
      G.dirt(ctx, 0, top, w, -top, seed + 2, min(0.45, 60 / -top));
      G.drips(ctx, 0, top, w, -top * 0.5, seed + 3, max(2, round(w / 14)), false);
      const blot = blobPts(w * (0.4 + r() * 0.3), -min(-top, h) * 0.45, w * 0.12, h * 0.08, seed + 4, 10, 0.35);
      G.scorch(ctx, blot, seed + 5);
      if (state === 0) {
        const hole = blobPts(w * 0.72, -h * 0.55, 7, 5, seed + 6, 9, 0.3);
        G.scorch(ctx, hole, seed + 7);
        shape(ctx, hole, "#0a0806");
        G.rim(ctx, hole, seed + 8, BRICK[4], BRICK[0]);
      }
    });
    path(ctx, pts);
    stroke(ctx, CLINE);
    tops.forEach((y, c) => {
      const x = c * (BRICK_W / 2);
      if (x >= w) return;
      G.chips(ctx, x, y + 0.4, min(BRICK_W / 2, w - x), seed + 20 + c, G.DUST);
      if (rng(seed + 30 + c)() < 0.25) mossCap(ctx, x, y, BRICK_W / 2, seed + 31 + c, 1.6);
    });
    for (let k = 0; k < round(w / 24); k++) {
      const bx = r() * w * (state === 0 ? 0.5 : 1);
      const by = -1.6 - r() * 3;
      const a = (r() - 0.5) * 0.8;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(a);
      flat(ctx, -5, -2.2, 10, 4.4, r() < 0.5 ? BRICK[2] : BRICK[1], CLINE);
      ctx.restore();
    }
    grass(ctx, 0, w, 5, seed + 40);
  },
};

const caveChasm: EnvAsset = {
  id: "caveChasm",
  box: [0, -240, 96, 0],
  draw(ctx, _state, _t, { w = 96, h = 240 }) {
    clipRect(ctx, 0, -h, w, h, () => {
      const bands = ["#0b0f0c", "#080b09", "#050706", "#030404", "#020202"];
      const step = h / bands.length;
      bands.forEach((c, i) => flat(ctx, 0, -h + i * step, w, step + 0.5, c));
      const seed = 660 + round(w);
      const r = rng(seed);
      if (!simple()) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        for (let y = -h + 6; y < -h + 60; y += 9) shape(ctx, blobPts(w * (0.3 + r() * 0.4), y, w * 0.25, 4, 661 + round(y), 8, 0.4), "#5c7468");
        ctx.restore();
        for (let i = 0; i < 4; i++) flat(ctx, w * 0.25 + w * 0.5 * r(), -h, 0.8, 10 + r() * 30, "#24302a");
      }
      for (const side of [0, 1]) {
        const pts: Pt[] = [];
        for (let y = -h; y < 0; y += TILE / 2) {
          const d = 4 + rng(seed + side * 50 + round(y))() * 12;
          const ex = side ? w - d : d;
          pts.push([ex, y], [ex, y + TILE / 2]);
        }
        const lip: Pt[] = side ? [[w, -h], ...pts, [w, 0]] : [[0, -h], ...pts, [0, 0]];
        clipPts(ctx, lip, () => cobbleField(ctx, side ? w - TILE : 0, -h, TILE, h, side === 1, COBBLE_SEED + 40 + side));
        ctx.save();
        ctx.globalAlpha = 0.6;
        for (let k = 0; k < pts.length; k += 2) {
          const [ex, ey] = pts[k] as Pt;
          flat(ctx, side ? ex - 2.4 : ex, ey, 2.4, TILE / 2, "#020202");
        }
        ctx.restore();
        G.inside(ctx, G.polyRegion(ctx, lip), () => G.dirt(ctx, side ? w - 20 : 0, -h, 20, h, seed + 70 + side, 0.15));
      }
    });
  },
};

export const jungleTerrainAssets: EnvAsset[] = [jungleSky, farTrees, farTowerRuin, cobbleFill, jungleWalkway, caveWalkway, plankBridge, brassDeck, girderColumn, stoneParapet, brickRuin, caveChasm];
