import { G } from "./grime";
import { P, type EnvAsset } from "./paint";

const { rng, path, color, flat, box, poly, cylH, disc, glow, stroke, shape, line, curve, mesh } = P;
const { PI, sin, cos, min, max, round } = Math;

type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];
type Tones = readonly [string, string, string, string];

const simple = (): boolean => P.simple();

const STONE: Tones = ["#2c2a22", "#4c493d", "#716c5a", "#a39c84"];
const MOSS: Tones = ["#17220e", "#2a3c18", "#43602a", "#6c8a3c"];
const LEAF: Tones = ["#0c1c14", "#183424", "#285034", "#457a48"];
const BUNKER: Tones = ["#3e3a36", "#5e5852", "#7e7770", "#a39b92"];
const RED: Tones = ["#4a0e08", "#86200e", "#b8381a", "#e06a3a"];
const WATER: Tones = ["#4c6266", "#7c9498", "#a8bcbe", "#dce8e8"];
const SLINE = "#12100b";
const CLINE = "#080c08";

const blobPts = (cx: number, cy: number, rx: number, ry: number, seed: number, n = 9, jag = 0.18): Pt[] => {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2;
    const k = 1 - jag + r() * jag * 2;
    pts.push([cx + cos(a) * rx * k, cy + sin(a) * ry * k]);
  }
  return pts;
};

const stone = (ctx: Ctx, cx: number, cy: number, rx: number, ry: number, seed: number, tones: Tones = STONE): void => {
  const pts = blobPts(cx, cy, rx, ry, seed);
  shape(ctx, pts, tones[1]);
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  shape(ctx, blobPts(cx - rx * 0.14, cy - ry * 0.2, rx * 0.78, ry * 0.66, seed + 1), tones[2]);
  if (!simple()) shape(ctx, blobPts(cx - rx * 0.34, cy - ry * 0.46, rx * 0.34, ry * 0.24, seed + 2, 7), tones[3]);
  flat(ctx, cx - rx * 1.2, cy + ry * 0.52, rx * 2.4, ry, tones[0]);
  ctx.restore();
  path(ctx, pts);
  stroke(ctx, SLINE);
};

const mossCap = (ctx: Ctx, x: number, y: number, w: number, seed: number, depth = 3): void => {
  const r = rng(seed);
  const pts: Pt[] = [[x, y + 0.6]];
  for (let px = x; px < x + w; px += 2 + r() * 3) pts.push([px, y - r() * 1.4]);
  pts.push([x + w, y]);
  for (let px = x + w; px > x; px -= 2 + r() * 3) pts.push([px, y + 0.8 + r() * depth]);
  shape(ctx, pts, MOSS[2], MOSS[0]);
  if (!simple()) for (let px = x + r() * 4; px < x + w; px += 3 + r() * 5) flat(ctx, px, y - 0.6, 1.2, 1, MOSS[3]);
};

const leafBlob = (ctx: Ctx, cx: number, cy: number, rx: number, ry: number, seed: number, tones: Tones = LEAF): void => {
  const r = rng(seed);
  const n = simple() ? 3 : 7;
  for (let i = 0; i < n; i++) {
    const a = r() * PI * 2;
    const d = r() * 0.55;
    shape(ctx, blobPts(cx + cos(a) * rx * d, cy + sin(a) * ry * d, rx * (0.45 + r() * 0.3), ry * (0.45 + r() * 0.3), seed + i * 7, 8, 0.3), tones[i % 2 ? 1 : 2]);
  }
  if (!simple()) for (let i = 0; i < 4; i++) shape(ctx, blobPts(cx - rx * 0.3 + r() * rx * 0.6, cy - ry * 0.4 + r() * ry * 0.3, rx * 0.2, ry * 0.15, seed + 90 + i, 6, 0.3), tones[3]);
};

const frond = (ctx: Ctx, x: number, y: number, len: number, angle: number, seed: number, tones: Tones = LEAF): void => {
  const r = rng(seed);
  const tip: Pt = [x + cos(angle) * len, y + sin(angle) * len];
  const mid: Pt = [x + cos(angle) * len * 0.5, y + sin(angle) * len * 0.5 - len * 0.18];
  curve(ctx, [[x, y], mid, tip], tones[1], 1.1);
  if (simple()) return;
  for (let k = 0.15; k < 0.95; k += 0.12) {
    const px = x + (tip[0] - x) * k;
    const py = y + (tip[1] - y) * k - sin(k * PI) * len * 0.18;
    const l = len * 0.28 * (1 - k * 0.6);
    for (const s of [-1, 1]) line(ctx, [[px, py], [px + cos(angle + s * 1.1) * l, py + sin(angle + s * 1.1) * l + l * 0.2]], tones[r() < 0.5 ? 2 : 3], 0.9);
  }
};

const fern = (ctx: Ctx, x: number, h: number, seed: number, tones: Tones = LEAF): void => {
  const r = rng(seed);
  const n = simple() ? 4 : 7;
  for (let i = 0; i < n; i++) {
    const a = -PI / 2 + (i / (n - 1) - 0.5) * 2.3 + (r() - 0.5) * 0.2;
    frond(ctx, x + (r() - 0.5) * 3, 0, h * (0.7 + r() * 0.4), a, seed + i * 11, tones);
  }
};

const grass = (ctx: Ctx, x: number, w: number, h: number, seed: number): void => {
  const r = rng(seed);
  for (let px = x; px < x + w; px += simple() ? 2.4 : 1.2) {
    const l = h * (0.4 + r() * 0.6);
    line(ctx, [[px, 0], [px + (r() - 0.5) * 3, -l]], MOSS[1 + round(r() * 2)] as string, 0.8);
  }
};

const vine = (ctx: Ctx, x: number, top: number, len: number, seed: number): void => {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let k = 0; k <= 6; k++) pts.push([x + sin(k * 1.3 + seed) * 1.6, top + (len * k) / 6]);
  curve(ctx, pts, MOSS[1], 1);
  if (simple()) return;
  for (let k = 1; k < 6; k++) {
    if (r() < 0.35) continue;
    const [px, py] = pts[k] as Pt;
    shape(ctx, blobPts(px + (r() - 0.5) * 3, py, 1.6, 1.1, seed + k, 6, 0.2), MOSS[2 + (k % 2)] as string);
  }
};

const slab = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number, moss = true): void => {
  const r = rng(seed);
  const top = y + r() * 2;
  const pts: Pt[] = [[x, top + 2], [x + w * 0.2, top], [x + w * 0.7, top + r() * 1.5], [x + w, top + 1.5], [x + w - r() * 3, y + h * 0.6], [x + w - 2 - r() * 3, y + h], [x + w * 0.3, y + h - r() * 2], [x + 2, y + h], [x - r() * 2, y + h * 0.5]];
  shape(ctx, pts, STONE[1]);
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  flat(ctx, x - 4, top, w + 8, h * 0.6, STONE[2]);
  if (!simple()) {
    flat(ctx, x - 4, top, w + 8, 1.6, STONE[3]);
    for (let k = 0; k < 3; k++) {
      const cx = x + w * (0.15 + r() * 0.7);
      line(ctx, [[cx, top + h * 0.35], [cx + (r() - 0.5) * 5, top + h * (0.6 + r() * 0.3)]], STONE[0], 0.7);
    }
  }
  flat(ctx, x - 4, y + h * 0.84, w + 8, h * 0.3, STONE[0]);
  ctx.restore();
  path(ctx, pts);
  stroke(ctx, SLINE);
  if (moss) mossCap(ctx, x + 2, top + 0.5, w * (0.4 + r() * 0.5), seed + 3, 2.5);
};

const barredWindow = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number): void => {
  flat(ctx, x - 2, y - 2, w + 4, h + 4, BUNKER[0], CLINE);
  flat(ctx, x, y, w, h, "#10181c");
  if (!simple()) {
    const r = rng(seed);
    for (let i = 0; i < 3; i++) flat(ctx, x + r() * (w - 4), y + r() * (h - 3), 3, 2, "#2a3c44");
  }
  for (let bx = x + w / 4; bx < x + w - 1; bx += w / 4) flat(ctx, bx - 0.7, y, 1.4, h, "#c8ccc4");
  flat(ctx, x, y + h / 2 - 0.7, w, 1.4, "#c8ccc4");
  flat(ctx, x - 3, y + h + 2, w + 6, 2.5, BUNKER[3], CLINE);
};

const bunkerBody = (ctx: Ctx, w: number, h: number, seed: number): void => {
  const r = rng(seed);
  flat(ctx, 0, -h, w, h, BUNKER[1], CLINE);
  for (let x = 0; x < w; x += 24) {
    flat(ctx, x, -h, min(24, w - x), h, r() < 0.5 ? BUNKER[2] : BUNKER[1]);
    if (!simple()) flat(ctx, x, -h, 0.8, h, BUNKER[0]);
  }
  for (const x of [0, w - 10]) {
    flat(ctx, x, -h, 10, h, BUNKER[2], CLINE);
    if (!simple()) flat(ctx, x + 1, -h, 2, h, BUNKER[3]);
  }
  flat(ctx, -2, -h - 5, w + 4, 6, BUNKER[2], CLINE);
  if (!simple()) flat(ctx, -2, -h - 5, w + 4, 1.4, BUNKER[3]);
  flat(ctx, 0, -5, w, 5, BUNKER[0]);
};

const bunkerGrime = (ctx: Ctx, w: number, h: number, seed: number): void => {
  const r = rng(seed);
  G.grain(ctx, G.rectRegion(ctx, 0, -h - 5, w, h + 5), seed);
  G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 0.6);
  G.drips(ctx, 0, -h + 1, w, h * 0.55, seed + 2, max(2, round(w / 16)), false);
  G.dirt(ctx, 0, -h, w, h, seed + 3, 0.35);
  G.chips(ctx, -2, -h - 4.6, w + 4, seed + 4, G.DIRT);
  mossCap(ctx, -2, -h - 5, w * (0.3 + r() * 0.4), seed + 5, 3);
  if (!simple()) for (const vx of [6 + r() * 10, w - 10 - r() * 10]) vine(ctx, vx, -h - 2, h * (0.4 + r() * 0.4), seed + round(vx));
};

const bunkerWindows = (ctx: Ctx, w: number, h: number, from: number, to: number, seed: number, skip: Pt | null = null): void => {
  const wh = min(26, h - 34);
  for (let x = from; x + 30 <= to; x += 40) if (!skip || x + 30 < skip[0] || x > skip[1]) barredWindow(ctx, x, -h + 14, 30, wh, seed + x);
};

const door = (ctx: Ctx, x: number, h: number, open: boolean): void => {
  flat(ctx, x - 4, -h, 36, h, BUNKER[0], CLINE);
  if (open) {
    flat(ctx, x, -h + 4, 28, h - 4, "#060807");
    shape(ctx, [[x, -h + 4], [x + 9, -h + 8], [x + 9, -2], [x, 0]], "m1", "mLine");
    return;
  }
  flat(ctx, x, -h + 4, 28, h - 4, "m2", "mLine");
  for (const y of [-h + 10, -h * 0.5, -10]) flat(ctx, x + 2, y, 24, 2, "m1");
  flat(ctx, x + 21, -h * 0.45, 4, 3, "c1", "mLine");
  if (!simple()) {
    flat(ctx, x + 1, -h + 5, 1.2, h - 6, "m3");
    G.rustPatch(ctx, x + 8, -12, 4, 3, 600 + x);
  }
};

const flamethrowerDoor: EnvAsset = {
  id: "flamethrowerDoor",
  box: [-3, -102, 243, 0],
  draw(ctx, state, _t, { w = 240, h = 96 }) {
    const seed = 580 + round(w);
    const dh = min(h - 18, 54);
    bunkerBody(ctx, w, h, seed);
    door(ctx, 28, dh, state === 1);
    disc(ctx, 42, -dh - 9, 3, RED[2], CLINE);
    if (!simple()) {
      disc(ctx, 41, -dh - 10, 1, RED[3]);
      glow(ctx, 42, -dh - 9, 10, RED[3], 0.4);
    }
    bunkerWindows(ctx, w, h, 80, w - 16, seed + 7);
    bunkerGrime(ctx, w, h, seed + 9);
  },
};

const waterFlow = (ctx: Ctx, w: number, h: number, t: number): void => {
  const r = rng(630 + round(w));
  ctx.save();
  ctx.globalAlpha *= 0.55;
  for (let x = 1; x < w - 1; x += 4 + r() * 5) {
    const speed = 150 + r() * 90;
    const gap = 48 + r() * 50;
    const len = 10 + r() * 18;
    const width = 1 + r() * 1.6;
    const shift = (r() * gap + t * speed) % gap;
    for (let y = -h - gap + shift; y < -len; y += gap) if (y > -h) flat(ctx, x, y, width, len, WATER[3]);
    if (simple()) x += 6;
  }
  ctx.restore();
};

const waterfall: EnvAsset = {
  id: "waterfall",
  box: [-10, -441, 154, 10],
  anim: true,
  draw(ctx, state, t, { w = 144, h = 432 }) {
    if (state === 1) return waterFlow(ctx, w, h, t);
    const seed = 620 + round(w);
    const r = rng(seed);
    flat(ctx, 0, -h, w, h, WATER[1]);
    for (let x = 0; x < w; x += 3 + r() * 4) flat(ctx, x, -h, 1 + r() * 3, h, WATER[r() < 0.5 ? 0 : 2]);
    if (!simple()) for (let x = 2; x < w; x += 6 + r() * 6) for (let y = -h + r() * 30; y < -8; y += 24 + r() * 40) flat(ctx, x, y, 1.4, 6 + r() * 14, WATER[3]);
    for (const x of [0, w]) shape(ctx, blobPts(x, -h + 6, 10, 9, seed + x, 9, 0.3), STONE[1], SLINE);
    flat(ctx, -2, -h, w + 4, 4, WATER[3]);
    ctx.save();
    ctx.globalAlpha = 0.85;
    for (let x = -4; x < w + 4; x += 7 + r() * 5) shape(ctx, blobPts(x, -2, 6 + r() * 4, 4 + r() * 3, seed + round(x) * 5, 8, 0.35), WATER[3]);
    ctx.restore();
    if (!simple()) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      for (let x = 0; x < w; x += 14) shape(ctx, blobPts(x + 7, -12, 11, 8, seed + x + 77, 8, 0.4), WATER[3]);
      ctx.restore();
    }
  },
};

const spikes: EnvAsset = {
  id: "spikes",
  box: [0, -21, 192, 1],
  draw(ctx, _state, _t, { w = 192 }) {
    const r = rng(640 + round(w));
    flat(ctx, 0, -3, w, 3, "r0", "rLine");
    for (let x = 1; x < w - 3; x += 4.6) {
      const hh = 14 + r() * 5;
      shape(ctx, [[x, -2], [x + 1.9, -hh], [x + 3.8, -2]], "c1", "mLine");
      if (!simple()) {
        line(ctx, [[x + 1.9, -hh + 1], [x + 1.2, -3]], "c3", 0.5);
        if (r() < 0.3) shape(ctx, [[x + 1.2, -hh + 4], [x + 1.9, -hh], [x + 2.6, -hh + 4]], "blood");
      }
    }
    G.grain(ctx, G.rectRegion(ctx, 0, -21, w, 21), 641 + round(w), 0.6);
    G.dirt(ctx, 0, -8, w, 8, 642, 0.5);
  },
};

const caveChasm: EnvAsset = {
  id: "caveChasm",
  box: [0, -240, 96, 0],
  draw(ctx, _state, _t, { w = 96, h = 240 }) {
    const bands = ["#0b0f0c", "#080b09", "#050706", "#030404", "#020202"];
    const step = h / bands.length;
    bands.forEach((c, i) => flat(ctx, 0, -h + i * step, w, step + 0.5, c));
    if (simple()) return;
    const r = rng(660 + round(w));
    ctx.save();
    ctx.globalAlpha = 0.18;
    for (let y = -h + 6; y < -h + 60; y += 9) shape(ctx, blobPts(w * r(), y, w * 0.4, 4, 661 + round(y), 8, 0.4), "#5c7468");
    ctx.restore();
    for (let i = 0; i < 4; i++) flat(ctx, w * (0.1 + r() * 0.8), -h, 0.8, 10 + r() * 30, "#24302a");
  },
};

const strut = (ctx: Ctx, a: Pt, b: Pt, w: number, c: string): void => {
  line(ctx, [a, b], "kLine", w + 1.2, "butt");
  line(ctx, [a, b], c, w, "butt");
};

const JEEP: Pt[] = [[0, -14], [2, -28], [18, -30], [26, -40], [52, -40], [56, -30], [84, -30], [86, -14]];

const jeep: EnvAsset = {
  id: "jeep",
  box: [-14, -50, 90, 1],
  draw(ctx, state) {
    const seed = 740;
    for (const x of [16, 66]) {
      disc(ctx, x, -9, 9, "#141412", "kLine");
      disc(ctx, x, -9, 4, "m2", "mLine");
    }
    poly(ctx, JEEP, "olive", 1);
    ctx.save();
    path(ctx, JEEP);
    ctx.clip();
    flat(ctx, 0, -32, 90, 4, "o2");
    flat(ctx, 0, -18, 90, 4, "o0");
    ctx.restore();
    path(ctx, JEEP);
    stroke(ctx, "kLine");
    shape(ctx, [[28, -38], [34, -48], [36, -48], [32, -38]], "glass", "kLine");
    line(ctx, [[34, -48], [52, -48]], "m1", 1.6);
    flat(ctx, 58, -36, 24, 6, "o0", "kLine");
    flat(ctx, 36, -30, 0.8, 16, "kLine");
    flat(ctx, -10, -24, 12, 10, "m1", "mLine");
    disc(ctx, -4, -19, 4, "m2", "mLine");
    if (!simple()) {
      for (let a = 0; a < PI * 2; a += PI / 3) flat(ctx, -4 + cos(a) * 2.5 - 0.5, -19 + sin(a) * 2.5 - 0.5, 1, 1, "m3");
      curve(ctx, [[-8, -16], [-12, -6], [-12, 0]], "c0", 0.8);
      disc(ctx, 46, -22, 2.6, "o3");
      flat(ctx, 84, -24, 3, 3, state === 1 ? "y2" : "y0");
    }
    G.grain(ctx, G.polyRegion(ctx, JEEP), seed);
    G.rustPatch(ctx, 70, -20, 6, 3, seed + 1);
    G.drips(ctx, 2, -30, 82, 12, seed + 2, 4);
    G.dirt(ctx, 0, -30, 86, 16, seed + 3, 0.6);
    mossCap(ctx, 58, -30.5, 18, seed + 4, 1.5);
  },
};

const TRUNK: Pt[] = [[-12, -84], [-196, -148], [-202, -132], [-18, -60]];
const ROOT = blobPts(-2, -64, 26, 62, 761, 14, 0.2);

const fallenTree: EnvAsset = {
  id: "fallenTree",
  box: [-220, -170, 34, 14],
  draw(ctx) {
    const seed = 760;
    poly(ctx, TRUNK, "rust", 1, { dir: [0, 1] });
    ctx.save();
    path(ctx, TRUNK);
    ctx.clip();
    if (!simple()) for (let k = 0; k < 8; k++) line(ctx, [[-14, -82 + k * 3], [-200, -146 + k * 2]], k % 2 ? "r0" : "r2", 0.7);
    G.grain(ctx, G.polyRegion(ctx, TRUNK), seed + 7);
    ctx.restore();
    path(ctx, TRUNK);
    stroke(ctx, "rLine");
    mossCap(ctx, -150, -140, 60, seed + 8, 2);
    for (const [x, y, a, l] of [[-90, -114, -2.2, 34], [-140, -130, -1.9, 28], [-176, -142, 2.7, 24], [-60, -104, 2.4, 22]] as [number, number, number, number][]) strut(ctx, [x, y], [x + cos(a) * l, y + sin(a) * l], 3, "r1");
    leafBlob(ctx, -192, -154, 26, 14, seed + 1);
    leafBlob(ctx, -124, -150, 16, 10, seed + 2);
    const r = rng(seed + 3);
    for (let i = 0; i < 7; i++) {
      const x = -22 + i * 7;
      curve(ctx, [[x, -10], [x + (r() - 0.5) * 8, 2], [x + (r() - 0.5) * 12, 8 + r() * 6]], "r1", 1.4 + r());
    }
    shape(ctx, ROOT, "#2a1c10", "rLine");
    ctx.save();
    path(ctx, ROOT);
    ctx.clip();
    for (let i = 0; i < 16; i++) {
      const y = -120 + r() * 110;
      curve(ctx, [[-30, y], [-6 + (r() - 0.5) * 10, y + (r() - 0.5) * 20], [30, y + (r() - 0.5) * 30]], i % 2 ? "r1" : "r2", 1.6 + r() * 2.4);
    }
    for (let i = 0; i < 8; i++) stone(ctx, -20 + r() * 36, -120 + r() * 110, 4 + r() * 4, 3 + r() * 3, seed + 20 + i);
    G.grain(ctx, G.polyRegion(ctx, ROOT), seed + 4);
    G.dirt(ctx, -30, -126, 60, 126, seed + 5, 0.4);
    ctx.restore();
    mossCap(ctx, -22, -124, 36, seed + 6, 4);
    if (!simple()) {
      for (const x of [-20, -6, 10]) vine(ctx, x, -118, 34, seed + 40 + x);
      fern(ctx, 30, 18, seed + 50);
    }
  },
};

const cannonTurret: EnvAsset = {
  id: "cannonTurret",
  box: [-4, -46, 58, 1],
  draw(ctx, state) {
    const off = state === 1;
    flat(ctx, 10, -14, 28, 14, "m1", "mLine");
    for (let x = 12; x < 36; x += 6) flat(ctx, x, -6, 3, 3, "hazard");
    flat(ctx, 16, -24, 16, 10, "m2", "mLine");
    strut(ctx, [34, -32], [56, -32], 4.4, off ? "m1" : "m2");
    flat(ctx, 50, -35, 6, 6, "m1", "mLine");
    ctx.beginPath();
    ctx.arc(24, -24, 16, PI, PI * 2);
    ctx.closePath();
    ctx.fillStyle = color("c1");
    ctx.fill();
    stroke(ctx, "mLine");
    if (!simple()) {
      ctx.beginPath();
      ctx.arc(24, -24, 11, PI * 1.1, PI * 1.6);
      stroke(ctx, "c3", 2);
      flat(ctx, 8, -26, 32, 2, "c0");
      flat(ctx, 30, -34, 4, 3, off ? "#300a08" : "neon");
      if (!off) glow(ctx, 32, -32, 7, "neonGlow", 0.5);
    }
    G.grain(ctx, G.rectRegion(ctx, 8, -40, 32, 40), 781);
    G.drips(ctx, 10, -24, 28, 18, 782, 4);
    G.dirt(ctx, 10, -14, 28, 14, 783, 0.6);
    if (off) G.scorch(ctx, [[18, -36], [34, -36], [34, -24], [18, -24]], 784);
  },
};

const distributionCabinet: EnvAsset = {
  id: "distributionCabinet",
  box: [-5, -42, 41, 1],
  draw(ctx, state) {
    const broken = state === 1;
    flat(ctx, 2, -40, 32, 40, "m1", "mLine");
    flat(ctx, 4, -38, 28, 34, broken ? "#0a0c0c" : "m2", "mLine");
    if (broken) {
      shape(ctx, [[4, -38], [-4, -34], [-4, -2], [4, -4]], "m1", "mLine");
      for (const [x, y] of [[12, -30], [22, -24], [16, -14]] as Pt[]) line(ctx, [[x, y], [x + 6, y + 3], [x + 2, y + 8]], "a1", 0.8);
      G.scorch(ctx, [[6, -36], [30, -36], [30, -10], [6, -10]], 801);
    } else {
      shape(ctx, [[18, -30], [22, -36], [14, -33], [20, -26], [12, -20], [20, -24], [16, -30]], "hazard", "yLine");
      flat(ctx, 8, -14, 20, 3, "m0");
      if (!simple()) flat(ctx, 28, -20, 2, 6, "c1");
    }
    curve(ctx, [[30, -2], [36, -1], [40, 0]], "kLine", 2);
    G.grain(ctx, G.rectRegion(ctx, 2, -40, 32, 40), 802);
    G.drips(ctx, 2, -40, 32, 20, 803, 4);
    G.dirt(ctx, 2, -40, 32, 40, 804, 0.4);
  },
};

const stonePuzzle: EnvAsset = {
  id: "stonePuzzle",
  box: [-3, -32, 51, 1],
  draw(ctx, state) {
    slab(ctx, 0, -20, 48, 20, 820, true);
    for (let i = 0; i < 4; i++) {
      const pressed = state === 1;
      const x = 7 + i * 11.3;
      const y = pressed ? -20 : -24;
      stone(ctx, x, y, 4.4, pressed ? 2.2 : 4.4, 821 + i);
      if (!simple()) line(ctx, [[x - 1.5, y], [x + 1.5, y]], "y1", 0.6);
    }
    if (!simple()) for (const x of [10, 22, 34]) line(ctx, [[x, -12], [x + 3, -8], [x, -4]], STONE[0], 0.8);
  },
};

const tripwire: EnvAsset = {
  id: "tripwire",
  box: [-2, -31, 98, 1],
  draw(ctx, state) {
    const cut = state === 1;
    for (const x of [4, 88]) {
      shape(ctx, [[x - 2, 0], [x - 1.4, -20], [x + 1.4, -20], [x + 2, 0]], "r1", "rLine");
      if (!simple()) flat(ctx, x - 1, -18, 2, 1, "r3");
    }
    if (cut) {
      curve(ctx, [[5, -14], [16, -8], [22, -1]], "c1", 0.6);
      curve(ctx, [[87, -14], [76, -8], [70, -1]], "c1", 0.6);
    } else {
      line(ctx, [[5, -14], [87, -14]], "c2", 0.6);
      if (!simple()) line(ctx, [[5, -13.6], [87, -13.6]], "#00000060", 0.4);
    }
    shape(ctx, blobPts(88, -24, 3.4, 4.6, 841, 8, 0.05), "o1", "kLine");
    if (!simple()) {
      for (let y = -27; y < -21; y += 2) flat(ctx, 85, y, 6, 0.6, "o0");
      flat(ctx, 87, -29.5, 2, 1.6, "m2");
    }
    grass(ctx, 0, 14, 8, 842);
    grass(ctx, 78, 18, 9, 843);
  },
};

const mine: EnvAsset = {
  id: "mine",
  box: [-10, -8, 10, 1],
  draw(ctx, state) {
    if (state === 1) {
      shape(ctx, blobPts(0, -0.5, 9, 2.4, 861, 10, 0.3), "#0b0806");
      G.scorch(ctx, [[-8, -1], [8, -1], [6, 0], [-6, 0]], 862);
      return;
    }
    ctx.beginPath();
    ctx.ellipse(0, -1, 7, 4.6, 0, PI, PI * 2);
    ctx.closePath();
    ctx.fillStyle = color("o1");
    ctx.fill();
    stroke(ctx, "kLine");
    flat(ctx, -1.6, -6.4, 3.2, 1.6, "m2", "mLine");
    if (!simple()) {
      flat(ctx, -0.5, -6.2, 1, 1, "neon");
      glow(ctx, 0, -5.8, 3, "neonGlow", 0.5);
      flat(ctx, -6, -3, 12, 0.6, "o0");
    }
    grass(ctx, -9, 6, 4, 863);
    grass(ctx, 4, 6, 4, 864);
  },
};

const CAN: Pt[] = [[0, 0], [0, -17], [3, -20], [16, -20], [16, 0]];

const canister: EnvAsset = {
  id: "canister",
  box: [-1, -25, 17, 1],
  draw(ctx) {
    poly(ctx, CAN, "brick", 2, { dir: [1, 0] });
    flat(ctx, 3, -24, 4, 4, "m2", "mLine");
    line(ctx, [[8, -20], [13, -23], [15, -20]], "m1", 1.6);
    if (!simple()) {
      line(ctx, [[2, -16], [14, -4]], "b3", 0.8);
      line(ctx, [[14, -16], [2, -4]], "b3", 0.8);
      flat(ctx, 1, -10, 14, 1, "b0");
    }
    G.grain(ctx, G.polyRegion(ctx, CAN), 881);
    G.dirt(ctx, 0, -20, 16, 20, 882, 0.4);
  },
};

const cutters: EnvAsset = {
  id: "cutters",
  box: [-1, -9, 25, 1],
  draw(ctx) {
    for (const [a, b] of [[[1, -3], [14, -5]], [[1, -6], [14, -4.4]]] as [Pt, Pt][]) strut(ctx, a, b, 2, RED[2]);
    shape(ctx, [[14, -6], [24, -5.6], [22, -4.6], [14, -3.4]], "c1", "mLine");
    disc(ctx, 14, -4.7, 1.1, "m2", "mLine");
  },
};

const grenade: EnvAsset = {
  id: "grenade",
  box: [-5, -13, 5, 1],
  draw(ctx) {
    shape(ctx, blobPts(0, -4.6, 3.6, 4.6, 901, 10, 0.04), "o1", "kLine");
    if (!simple()) for (let y = -8; y < -1; y += 2) flat(ctx, -3, y, 6, 0.6, "o0");
    flat(ctx, -1.4, -11, 2.8, 2, "m2", "mLine");
    line(ctx, [[1.4, -10], [4, -8], [3.4, -4]], "m1", 0.8);
    disc(ctx, -2.6, -11.4, 1.2, "m3", "mLine");
  },
};

const flamethrower: EnvAsset = {
  id: "flamethrower",
  box: [-1, -15, 43, 1],
  draw(ctx) {
    cylH(ctx, 6, -13, 12, 8, "brick", 2);
    flat(ctx, 16, -8, 22, 3, "m2", "mLine");
    flat(ctx, 36, -9, 6, 5, "m1", "mLine");
    flat(ctx, 10, -5, 4, 5, "m1", "mLine");
    flat(ctx, 0, -9, 7, 3, "m1", "mLine");
    if (!simple()) {
      flat(ctx, 8, -12, 8, 1, "b3");
      disc(ctx, 40, -6.5, 1, "a1");
    }
  },
};

const bonusPickup: EnvAsset = {
  id: "bonusPickup",
  box: [-1, -15, 17, 1],
  draw(ctx, state) {
    if (state === 1) return;
    box(ctx, 0, -12, 16, 12, "steel", 2);
    flat(ctx, 6.5, -10, 3, 8, "acid");
    flat(ctx, 4, -7.5, 8, 3, "acid");
    if (!simple()) glow(ctx, 8, -6, 11, "acid", 0.35);
    G.grain(ctx, G.rectRegion(ctx, 0, -12, 16, 12), 921);
  },
};

const towerLift: EnvAsset = {
  id: "towerLift",
  box: [-4, -384, 100, 1],
  draw(ctx, state, _t, { h = 384 }) {
    if (state === 1) {
      flat(ctx, 0, -6, 96, 6, "m1", "mLine");
      for (const x of [2, 90]) {
        flat(ctx, x, -60, 4, 60, "r1", "rLine");
        if (!simple()) flat(ctx, x + 1, -60, 1, 60, "r3");
      }
      flat(ctx, 2, -62, 92, 5, "r2", "rLine");
      for (let x = 8; x < 90; x += 8) flat(ctx, x, -57, 1.2, 51, "m2");
      G.grain(ctx, G.rectRegion(ctx, 0, -62, 96, 62), 941);
      G.drips(ctx, 2, -62, 92, 24, 942, 6);
      return;
    }
    flat(ctx, 60, -h, 14, h, "m1", "mLine");
    for (let y = -h + 6; y < -60; y += 12) {
      flat(ctx, 61, y, 12, 1.6, "m0");
      if (!simple()) flat(ctx, 62, y + 2, 1, 1, "m3");
    }
    G.grain(ctx, G.rectRegion(ctx, 60, -h, 14, h), 943);
    G.drips(ctx, 60, -h, 14, min(h * 0.4, 90), 944, 2);
    flat(ctx, 0, -64, 96, 6, "r2", "rLine");
    flat(ctx, 0, -6, 96, 6, "m1", "mLine");
    for (const x of [0, 92]) flat(ctx, x, -64, 4, 64, "r1", "rLine");
    mesh(ctx, 4, -58, 88, 52, "r2", 6);
    flat(ctx, 76, -40, 10, 12, "m2", "mLine");
    if (!simple()) {
      flat(ctx, 79, -37, 4, 2, "neon");
      flat(ctx, 79, -33, 4, 2, "screen");
      for (const x of [20, 48]) line(ctx, [[x, -64], [x, -h]], "kLine", 0.8);
    }
    G.grain(ctx, G.rectRegion(ctx, 0, -64, 96, 64), 945);
    G.drips(ctx, 0, -64, 96, 30, 946, 6);
    G.dirt(ctx, 0, -64, 96, 64, 947, 0.4);
  },
};

export const JUNGLE_IDS = [
  "flamethrowerDoor", "waterfall", "spikes", "caveChasm", "jeep", "fallenTree", "cannonTurret", "distributionCabinet", "stonePuzzle", "tripwire", "mine", "canister", "cutters",
  "grenade", "flamethrower", "bonusPickup", "towerLift",
] as const;

export const jungleAssets: EnvAsset[] = [
  flamethrowerDoor, waterfall, spikes, caveChasm, jeep, fallenTree, cannonTurret, distributionCabinet, stonePuzzle, tripwire, mine, canister, cutters, grenade, flamethrower,
  bonusPickup, towerLift,
];
