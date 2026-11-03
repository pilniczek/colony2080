import { G } from "./grime";
import { P, type EnvAsset } from "./paint";

const { rng, path, flat, box, poly, cylV, disc, rivets, glow, stroke, shape, line, curve, hazard } = P;
const { PI, sin, cos, min, max, round, floor, abs } = Math;

type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];
type Tones = readonly [string, string, string, string];

const simple = (): boolean => P.simple();

const ROCK: Tones = ["#0e0906", "#1c130d", "#2c1f15", "#46321f"];
const RUSTY: Tones = ["#2a1206", "#5e2a10", "#9a4e20", "#d08442"];
const MOSSY: Tones = ["#10160c", "#1e2a16", "#33452a", "#566a3e"];
const CART: Tones = ["#2e2e0e", "#5c5e1c", "#8e8e30", "#c2c05a"];
const LAVA: Tones = ["#4a0c02", "#a82806", "#ee6612", "#ffd25a"];
const ICE: Tones = ["#14324e", "#2e6c9c", "#6ab4e0", "#dcf4ff"];
const STONE: Tones = ["#2e2a24", "#4c463c", "#6e6656", "#968c78"];
const PEBBLE: Tones = ["#221d14", "#3e3626", "#585036", "#76704e"];
const MACH: Tones = ["#111814", "#1f2b25", "#324238", "#4e6255"];
const MLINE = "#050806";
const RLINE = "#060403";
const ROCK_UNITS = 192;
const ROCK_PX = 4;
const DOOR_H = 120;

const jag = (x0: number, x1: number, y: number, amp: number, step: number, seed: number): Pt[] => {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let x = x0; x < x1; x += step * (0.6 + r() * 0.8)) pts.push([x, y + (r() - 0.5) * 2 * amp]);
  pts.push([x1, y + (r() - 0.5) * 2 * amp]);
  return pts;
};

const veil = (ctx: Ctx, pts: Pt[], c: string, alpha: number): void => {
  ctx.save();
  ctx.globalAlpha = alpha;
  shape(ctx, pts, c);
  ctx.restore();
};

const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, n = 8, jitter = 0.28): Pt[] => {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i): Pt => {
    const a = (i / n) * PI * 2;
    const k = 1 - jitter + r() * jitter * 2;
    return [cx + cos(a) * rx * k, cy + sin(a) * ry * k];
  });
};

const lump = (g: Ctx, cx: number, cy: number, rx: number, ry: number, seed: number, tone: 1 | 2): void => {
  shape(g, blob(cx + 0.8, cy + 0.9, rx, ry, seed), ROCK[0]);
  shape(g, blob(cx, cy, rx, ry, seed), ROCK[tone]);
  veil(g, blob(cx - rx * 0.25, cy - ry * 0.3, rx * 0.6, ry * 0.45, seed + 1, 7), ROCK[3], 0.35);
  veil(g, blob(cx + rx * 0.3, cy + ry * 0.35, rx * 0.55, ry * 0.4, seed + 2, 7), ROCK[0], 0.45);
};

const rockCell = (g: Ctx, x: number, y: number, seed: number): void => {
  const r = rng(seed);
  for (let i = 0; i < 6; i++) {
    const rx = 4.5 + r() * 4;
    const ry = 3.4 + r() * 3;
    const cx = x + rx + 0.4 + r() * (23.2 - rx * 2);
    const cy = y + ry + 0.4 + r() * (23.2 - ry * 2);
    lump(g, cx, cy, rx, ry, seed + i * 13, r() < 0.4 ? 1 : 2);
  }
  if (r() < 0.08) {
    const vx = x + 5 + r() * 12;
    const vy = y + 4 + r() * 12;
    curve(g, [[vx, vy], [vx + 2 + r() * 3, vy + 3], [vx + 1 + r() * 5, vy + 6]], RUSTY[1], 0.9);
  }
  for (let i = 0; i < 6; i++) flat(g, x + 1 + r() * 22, y + 1 + r() * 22, 0.8, 0.8, r() < 0.4 ? ROCK[3] : ROCK[0]);
};

const rockCracks = (g: Ctx): void => {
  const r = rng(760);
  for (let i = 0; i < 6; i++) {
    let x = 14 + r() * (ROCK_UNITS - 28);
    let y = 12 + r() * (ROCK_UNITS - 70);
    const pts: Pt[] = [[x, y]];
    for (let k = 0; k < 5; k++) {
      x = min(ROCK_UNITS - 8, max(8, x + (r() - 0.5) * 12));
      y += 4 + r() * 6;
      pts.push([x, y]);
    }
    line(g, pts.map(([px, py]): Pt => [px + 0.6, py + 0.6]), ROCK[3], 0.5);
    line(g, pts, ROCK[0], 0.9);
  }
};

let rockCanvas: OffscreenCanvas | null | undefined;

const makeRock = (): OffscreenCanvas | null => {
  if (typeof OffscreenCanvas === "undefined") return null;
  const c = new OffscreenCanvas(ROCK_UNITS * ROCK_PX, ROCK_UNITS * ROCK_PX);
  const g = c.getContext("2d") as unknown as Ctx | null;
  if (!g) return null;
  g.scale(ROCK_PX, ROCK_PX);
  flat(g, 0, 0, ROCK_UNITS, ROCK_UNITS, ROCK[1]);
  for (let j = 0; j < ROCK_UNITS / 24; j++) for (let i = 0; i < ROCK_UNITS / 24; i++) rockCell(g, i * 24, j * 24, 700 + j * 11 + i * 5);
  rockCracks(g);
  return c;
};

const rockFill = (ctx: Ctx, x: number, y: number, w: number, h: number): void => {
  if (rockCanvas === undefined) rockCanvas = makeRock();
  const p = rockCanvas ? ctx.createPattern(rockCanvas, "repeat") : null;
  if (!p) return flat(ctx, x, y, w, h, ROCK[1]);
  p.setTransform(new DOMMatrix([1 / ROCK_PX, 0, 0, 1 / ROCK_PX, 0, 0]));
  ctx.save();
  ctx.fillStyle = p;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.restore();
};

const caveRock: EnvAsset = {
  id: "caveRock",
  box: [0, -168, 72, 0],
  draw(ctx, _state, _t, { w = 72, h = 168 } = {}) {
    rockFill(ctx, 0, -h, w, h);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), 760 + round(w * 3 + h), 0.6);
  },
};

const mossLip = (ctx: Ctx, x: number, w: number, seed: number, tones: Tones = MOSSY): void => {
  const r = rng(seed);
  for (let px = x + r() * 8; px < x + w - 3; px += 6 + r() * 14) {
    const mw = 3 + r() * 8;
    const end = min(x + w, px + mw);
    shape(ctx, [[px, 0.4], ...jag(px, end, -0.6, 0.5, 2, seed + round(px)), [end, 0.4], [px + mw * 0.5, 1.6 + r() * 1.6]], tones[r() < 0.5 ? 1 : 2]);
    if (!simple() && r() < 0.6) flat(ctx, px + mw * 0.3, -0.6, 1.2, 0.8, tones[3]);
  }
};

const caveRockTop: EnvAsset = {
  id: "caveRockTop",
  box: [0, -3, 120, 24],
  draw(ctx, _state, _t, { w = 120 } = {}) {
    const seed = 780 + round(w) * 5;
    rockFill(ctx, 0, 0, w, 24);
    G.grain(ctx, G.rectRegion(ctx, 0, 0, w, 24), seed, 0.6);
    shape(ctx, [[0, 3], ...jag(0, w, 0, 0.8, 4, seed + 1), [w, 3], ...jag(0, w, 3.2, 0.7, 5, seed + 2).reverse()], ROCK[3]);
    line(ctx, jag(0, w, 3.4, 0.6, 5, seed + 2), ROCK[0], 0.9);
    mossLip(ctx, 0, w, seed + 3);
    G.chips(ctx, 0, 0.4, w, seed + 4);
    G.drips(ctx, 0, 3, w, 10, seed + 5, max(1, round(w / 40)), false);
  },
};

const pebbles = (ctx: Ctx, w: number, y: number, seed: number, big: number): void => {
  const r = rng(seed);
  for (let x = -2 - r() * 3; x < w + 2;) {
    const sw = big * (0.7 + r() * 0.6);
    const sh = 2.6 + r() * 1.6;
    const tone = r() < 0.3 ? 3 : r() < 0.6 ? 2 : 1;
    const pts: Pt[] = [[x, y + sh * 0.2], [x + sw * 0.2, y - sh * 0.5], [x + sw * 0.75, y - sh * 0.55], [x + sw, y], [x + sw * 0.8, y + sh * 0.5], [x + sw * 0.2, y + sh * 0.55]];
    shape(ctx, pts, PEBBLE[tone]);
    if (!simple()) flat(ctx, x + sw * 0.25, y - sh * 0.35, sw * 0.35, 0.7, r() < 0.3 ? MOSSY[3] : STONE[3]);
    path(ctx, pts);
    stroke(ctx, RLINE);
    x += sw + 0.3;
  }
};

const floorStrip = (ctx: Ctx, w: number, seed: number, under: number, moss: boolean): void => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, -3, w, under + 4);
  ctx.clip();
  shape(ctx, [[0, 0], [w, 0], ...jag(0, w, under, 1.6, 4, seed).reverse()], ROCK[1]);
  shape(ctx, [[0, 2.5], [w, 2.5], ...jag(0, w, under * 0.6, 1.2, 5, seed + 1).reverse()], ROCK[0]);
  pebbles(ctx, w, 1.4, seed + 2, 5.5);
  if (moss) mossLip(ctx, 0, w, seed + 3);
  ctx.restore();
  G.grain(ctx, G.rectRegion(ctx, 0, -1, w, under), seed + 4, 0.7);
  G.chips(ctx, 0, -0.6, w, seed + 5);
};

const caveFloor: EnvAsset = {
  id: "caveFloor",
  box: [0, -3, 120, 12],
  draw(ctx, _state, _t, { w = 120 } = {}) {
    floorStrip(ctx, w, 800 + round(w) * 7, 8, false);
  },
};

const rockLedge: EnvAsset = {
  id: "rockLedge",
  box: [0, -27, 120, -10],
  draw(ctx, _state, _t, { w = 120 } = {}) {
    ctx.translate(0, -24);
    floorStrip(ctx, w, 820 + round(w) * 7, 12, true);
  },
};

const caveBackdrop: EnvAsset = {
  id: "caveBackdrop",
  box: [0, -170, 320, 0],
  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -170, 320, 170);
    ctx.clip();
    const g = ctx.createLinearGradient(0, -170, 0, 0);
    for (const [at, c] of [[0, "#07050a"], [0.35, "#0f0a08"], [0.8, "#140c08"], [0.93, "#2a1006"], [1, "#6a2208"]] as [number, string][]) g.addColorStop(at, c);
    ctx.fillStyle = g;
    ctx.fillRect(0, -170, 320, 170);
    const r = rng(901);
    for (let y = -168; y < -4; y += 3 + r() * 4) veil(ctx, [...jag(0, 320, y, 0.5, 10, round(y * 7)), [320, y + 1.2], [0, y + 1.2]], "#1c130c", 0.25);
    const n = simple() ? 120 : 360;
    for (let i = 0; i < n; i++) {
      const x = r() * 320;
      const y = -170 + r() * 160;
      const k = 0.6 + r() * 1.6;
      veil(ctx, blob(x, y, k * 1.6, k, 920 + i, 6), r() < 0.5 ? "#1e150e" : "#080504", 0.5);
    }
    glow(ctx, 160, 0, 120, "#ff5a10", 0.12);
    flat(ctx, 0, -3, 320, 3, "#a83a0c");
    ctx.restore();
  },
};

const bowPts = (x: number, top: number, bot: number, b: number): Pt[] =>
  Array.from({ length: 7 }, (_, i): Pt => {
    const t = i / 6;
    return [x + b * 4 * t * (1 - t), top + (bot - top) * t];
  });

const TUBE_SHADE: [number, string][] = [[0, "rgba(0,0,0,0.6)"], [0.2, "rgba(0,0,0,0.12)"], [0.34, "rgba(255,210,150,0.14)"], [0.5, "rgba(0,0,0,0)"], [0.76, "rgba(0,0,0,0.3)"], [1, "rgba(0,0,0,0.72)"]];

const ribs = (ctx: Ctx, len: number, dia: number, seed: number): void => {
  const step = 10 + (seed % 3);
  const th = step * 0.55;
  const b = dia * 0.28;
  for (let x = -b - step + (seed % 5); x < len + step; x += step) {
    shape(ctx, [...bowPts(x + th * 0.5, -dia, 0, b), ...bowPts(x + th * 1.35, 0, -dia, b * 0.9)], "#160803");
    shape(ctx, [...bowPts(x, -dia, 0, b), ...bowPts(x + th, 0, -dia, b * 0.9)], RUSTY[2]);
    shape(ctx, [...bowPts(x, -dia, 0, b), ...bowPts(x + th * 0.35, 0, -dia, b * 0.95)], RUSTY[3]);
  }
};

const collar = (ctx: Ctx, x: number, dia: number): void => {
  box(ctx, x - 3.5, -dia - 1.5, 7, dia + 3, "steel", 1, { vertical: true });
  for (let y = -dia + 4; y < -2; y += 7) disc(ctx, x, y, 0.9, "m3");
};

const tubeHatch = (ctx: Ctx, x: number, dia: number, seed: number): void => {
  const w = 26;
  flat(ctx, x, -dia, w, dia, MACH[1], MLINE);
  flat(ctx, x, -dia, w, 2, MACH[3]);
  flat(ctx, x, -2, w, 2, MACH[0]);
  for (let y = -dia + 4; y < -2; y += 6) {
    disc(ctx, x + 2.5, y, 0.8, MACH[3]);
    disc(ctx, x + w - 2.5, y, 0.8, MACH[3]);
  }
  const cx = x + w / 2;
  const cy = -dia / 2;
  const rr = min(9, dia * 0.28);
  disc(ctx, cx, cy, rr, MACH[0], MLINE);
  disc(ctx, cx, cy, rr * 0.7, MACH[2], MLINE);
  line(ctx, [[cx - rr * 0.7, cy], [cx + rr * 0.7, cy]], MLINE, 1.4);
  line(ctx, [[cx, cy - rr * 0.7], [cx, cy + rr * 0.7]], MLINE, 1.4);
  disc(ctx, cx, cy, 1.6, MACH[3], MLINE);
  G.rustPatch(ctx, x + w * 0.7, -dia * 0.25, 3, 2, seed);
};

const tubeBody = (ctx: Ctx, len: number, dia: number, seed: number, broken: boolean): void => {
  const r = rng(seed + 3);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, -dia, len, dia);
  ctx.clip();
  flat(ctx, 0, -dia, len, dia, RUSTY[0]);
  ribs(ctx, len, dia, seed);
  for (let x = 10 + r() * 40; x < len - 10; x += 34 + r() * 60) G.rustPatch(ctx, x, -dia * (0.3 + r() * 0.5), 3 + r() * 3, 2 + r() * 2, seed + round(x));
  const hatch = len >= 120 && r() < 0.6 ? round(len * (0.3 + r() * 0.4) - 13) : null;
  if (hatch !== null) tubeHatch(ctx, hatch, dia, seed + 4);
  if (broken) {
    const hx = len * (0.3 + r() * 0.4);
    const hole: Pt[] = [[hx - 9, -dia * 0.7], [hx - 2, -dia * 0.82], [hx + 8, -dia * 0.66], [hx + 10, -dia * 0.36], [hx + 1, -dia * 0.22], [hx - 8, -dia * 0.34]];
    G.scorch(ctx, hole, seed + 5);
    shape(ctx, hole, "#050302");
    G.rim(ctx, hole, seed + 6, RUSTY[3], RUSTY[0]);
  }
  const g = ctx.createLinearGradient(0, -dia, 0, 0);
  for (const [at, c] of TUBE_SHADE) g.addColorStop(at, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, -dia, len, dia);
  G.grain(ctx, G.rectRegion(ctx, 0, -dia, len, dia), seed + 7, 0.8);
  G.dirt(ctx, 0, -dia, len, dia, seed + 8, 0.3);
  ctx.restore();
  const joints = [0, len];
  for (let x = 70 + r() * 40; x < len - 50; x += 90 + r() * 50) if (hatch === null || abs(x - hatch - 13) > 30) joints.push(x);
  for (const x of joints) collar(ctx, min(len - 3.5, max(3.5, x)), dia);
  flat(ctx, 0, -dia, len, 1.2, RLINE);
  flat(ctx, 0, -1.2, len, 1.2, RLINE);
  G.drips(ctx, 0, -dia + 1.5, len, dia * 0.55, seed + 9, max(2, round(len / 24)));
};

const rustTube: EnvAsset = {
  id: "rustTube",
  box: [0, -72, 192, 0],
  draw(ctx, state, _t, { w = 192, h = 72 } = {}) {
    const seed = 840 + round(w) * 3 + round(h);
    if (h <= w) return tubeBody(ctx, w, h, seed, state === 1);
    ctx.transform(0, -1, -1, 0, 0, 0);
    tubeBody(ctx, h, w, seed, state === 1);
  },
};

const housing = (ctx: Ctx, x: number, top: number, w: number, h: number): void => {
  flat(ctx, x, top, w, h, MACH[1], MLINE);
  flat(ctx, x + 1, top + 1, w - 2, 1.6, MACH[3]);
  flat(ctx, x + 1, top + h - 2.6, w - 2, 1.6, MACH[0]);
  for (let i = x + 3; i < x + w - 1; i += 6) {
    disc(ctx, i, top + 3.6, 0.8, MACH[3]);
    disc(ctx, i, top + h - 3.6, 0.8, MACH[3]);
  }
};

type Module = (ctx: Ctx, x: number, top: number, w: number, h: number, r: () => number) => void;

const gaugeModule: Module = (ctx, x, top, w, h, r) => {
  housing(ctx, x, top, w, h);
  const cx = x + w / 2;
  const rr = min(w * 0.22, h * 0.14, 7);
  const cy = top + 7 + rr;
  disc(ctx, cx, cy, rr + 1.5, MACH[0], MLINE);
  disc(ctx, cx, cy, rr, "#8c8268", MLINE);
  const a = -PI * (0.2 + r() * 0.6);
  line(ctx, [[cx, cy], [cx + cos(a) * rr * 0.8, cy + sin(a) * rr * 0.8]], "#8a1a10", 1);
  const ly = cy + rr + 6;
  ["#e0a030", "#5ac060", "#d03818"].forEach((c, i) => disc(ctx, x + w * (0.25 + i * 0.25), ly, 1.6, r() < 0.7 ? c : "#2a2420", MLINE));
  if (ly + 14 < top + h) {
    flat(ctx, x + 4, ly + 5, w - 8, top + h - ly - 11, MACH[2], MLINE);
    flat(ctx, x + w - 9, ly + 8, 3, 5, MACH[3], MLINE);
  }
};

const finsModule: Module = (ctx, x, top, w, h) => {
  housing(ctx, x, top, w, h);
  flat(ctx, x + 3, top + 6, w - 6, h - 12, MACH[0], MLINE);
  for (let y = top + 8; y < top + h - 8; y += 4) {
    flat(ctx, x + 3, y, w - 6, 2, MACH[2]);
    flat(ctx, x + 3, y, w - 6, 0.6, MACH[3]);
  }
};

const wheelModule: Module = (ctx, x, top, w, h) => {
  housing(ctx, x, top, w, h);
  const rr = min(w, h) * 0.24;
  const cx = x + w / 2;
  const cy = top + h - rr * 1.3 - 6;
  line(ctx, [[cx - rr * 0.9, cy], [cx - 1.5, top + 8]], "#0a0806", 1.6);
  line(ctx, [[cx + rr * 0.9, cy], [cx + 1.5, top + 8]], "#0a0806", 1.6);
  disc(ctx, cx, top + 8, 3, MACH[2], MLINE);
  cog(ctx, cx, cy, rr, 10);
};

const pistonModule: Module = (ctx, x, top, w, h, r) => {
  flat(ctx, x, top, w, h, MACH[0], MLINE);
  line(ctx, [[x + 5, top + 4], [x + w - 5, top + h - 4]], MACH[1], 2);
  line(ctx, [[x + w - 5, top + 4], [x + 5, top + h - 4]], MACH[1], 2);
  for (const px of [x, x + w - 5]) {
    flat(ctx, px, top, 5, h, MACH[2], MLINE);
    flat(ctx, px + 1, top, 1, h, MACH[3]);
  }
  const cw = min(12, w * 0.4);
  const cx = x + w / 2 - cw / 2;
  const ext = h * (0.2 + r() * 0.2);
  cylV(ctx, cx, top + h * 0.45, cw, h * 0.55 - 4, "steel", 1);
  cylV(ctx, cx + cw * 0.3, top + h * 0.45 - ext, cw * 0.4, ext, "chrome", 1);
  box(ctx, cx - 2, top + h * 0.45 - ext - 4, cw + 4, 5, "steel", 2);
};

const ventModule: Module = (ctx, x, top, w, h) => {
  housing(ctx, x, top, w, h);
  const vx = x + 4;
  const vy = top + h * 0.3;
  const vw = w - 8;
  const vh = h * 0.45;
  flat(ctx, vx, vy, vw, vh, "#0a0604", MLINE);
  glow(ctx, vx + vw / 2, vy + vh / 2, min(vw, vh) * 0.7, "#ff7020", 0.4);
  for (let y = vy + 2; y < vy + vh - 1; y += 3.4) flat(ctx, vx, y, vw, 1.6, MACH[2]);
};

const MODULES: Module[] = [gaugeModule, finsModule, wheelModule, pistonModule, ventModule];

const caveMachine: EnvAsset = {
  id: "caveMachine",
  box: [0, -72, 72, 0],
  draw(ctx, state, _t, { w = 72, h = 72 } = {}) {
    const seed = 860 + round(w) * 3 + round(h) + state * 53;
    const r = rng(seed);
    const n = max(1, round(w / 30));
    const pw = w / n;
    let last = -1;
    for (let i = 0; i < n; i++) {
      let k = i === 0 ? state % MODULES.length : floor(r() * MODULES.length);
      if (k === last) k = (k + 1) % MODULES.length;
      last = k;
      (MODULES[k] as Module)(ctx, i * pw, -h + 5, pw, h - 10, r);
    }
    box(ctx, -1, -h, w + 2, 5, "steel", 1);
    box(ctx, -2, -5, w + 4, 5, "steel", 0);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 2);
    G.drips(ctx, 0, -h + 4, w, min(h * 0.3, 22), seed + 3, max(1, round(w / 26)));
    G.dirt(ctx, 0, -h, w, h, seed + 4, min(0.45, 34 / h));
    G.chips(ctx, 0, -h + 0.6, w, seed + 5);
    G.rustPatch(ctx, w * (0.2 + r() * 0.6), -h * (0.3 + r() * 0.4), 3, 2.5, seed + 6);
  },
};

const metalPillars: EnvAsset = {
  id: "metalPillars",
  box: [-3, -84, 21, 0],
  draw(ctx, _state, _t, { h = 72 } = {}) {
    const seed = 880 + round(h);
    box(ctx, -3, -6, 24, 6, "steel", 1);
    cylV(ctx, 1, -h + 10, 16, h - 16, "chrome", 1);
    if (!simple()) for (let y = -h + 16; y < -10; y += 12) flat(ctx, 1, y, 16, 1.4, "c0");
    box(ctx, -2, -h + 4, 22, 7, "steel", 2);
    box(ctx, 2, -h, 14, 5, "steel", 3);
    glow(ctx, 9, -h - 2, 14, "#f4ecd0", 0.35);
    flat(ctx, 4, -h - 1.5, 10, 2, "#fff6dc");
    G.grain(ctx, G.rectRegion(ctx, -3, -h, 24, h), seed);
    G.drips(ctx, 1, -h + 10, 16, h * 0.4, seed + 1, 2);
    G.dirt(ctx, -3, -h, 24, h, seed + 2, min(0.3, 24 / h));
  },
};

const chainLink = (ctx: Ctx, y: number, side: boolean): void => {
  if (side) {
    line(ctx, [[0, y], [0, y + 5.4]], RLINE, 2.4);
    line(ctx, [[0, y + 0.4], [0, y + 5]], "#5a4a3a", 1.2);
    return;
  }
  ctx.beginPath();
  ctx.ellipse(0, y + 2.6, 2.1, 3.1, 0, 0, PI * 2);
  ctx.strokeStyle = "#2a2420";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (simple()) return;
  ctx.beginPath();
  ctx.ellipse(0, y + 2.6, 2.1, 3.1, 0, PI * 1.1, PI * 1.6);
  ctx.strokeStyle = RUSTY[2];
  ctx.lineWidth = 0.7;
  ctx.stroke();
};

const ropeColumn: EnvAsset = {
  id: "ropeColumn",
  box: [-4, -96, 4, 0],
  draw(ctx, _state, _t, { h = 96 } = {}) {
    box(ctx, -4, -h, 8, 4, "rust", 1);
    for (let y = -h + 4, i = 0; y < -6; y += 4.6, i++) chainLink(ctx, y, i % 2 === 1);
    poly(ctx, [[-2.5, -6], [2.5, -6], [1.5, 0], [-1.5, 0]], "rust", 1);
  },
};

const caveStalactites: EnvAsset = {
  id: "caveStalactites",
  box: [0, -2, 96, 42],
  draw(ctx, state, _t, { w = 96 } = {}) {
    const seed = 900 + round(w) * 3 + state * 17;
    const r = rng(seed);
    const len = state === 1 ? 40 : 22;
    for (let x = r() * 4; x < w - 4;) {
      const sw = 5 + r() * 9;
      const l = len * (0.3 + r() * 0.7);
      const tip = x + sw * (0.4 + r() * 0.2);
      shape(ctx, [[x, 0], [x + sw, 0], [tip + 0.6, l], [tip - 0.4, l]], ROCK[2]);
      shape(ctx, [[x, 0], [x + sw * 0.35, 0], [tip - 0.2, l * 0.9]], ROCK[3]);
      if (!simple()) shape(ctx, [[x + sw * 0.7, 0], [x + sw, 0], [tip + 0.5, l * 0.95]], ROCK[1]);
      path(ctx, [[x, 0], [tip, l], [x + sw, 0]]);
      stroke(ctx, RLINE);
      if (!simple() && r() < 0.35) disc(ctx, tip, l + 1.4, 0.7, "#8ab0c0");
      x += sw * (0.7 + r() * 0.8);
    }
    shape(ctx, [[0, -2], [w, -2], ...jag(0, w, 2.5, 1.2, 4, seed + 1).reverse()], ROCK[1]);
  },
};

const stalactiteBody: Pt[] = [[-6, -2], [54, -2], [48, 30], [40, 64], [32, 100], [26, 140], [22, 140], [14, 98], [6, 60], [0, 26]];

const stalactite: EnvAsset = {
  id: "stalactite",
  box: [-8, -2, 56, 146],
  draw(ctx, state) {
    if (state === 2) {
      shape(ctx, [[-6, -2], [54, -2], [44, 14], [30, 22], [14, 20], [0, 12]], ROCK[2], RLINE);
      shape(ctx, [[14, 20], [30, 22], [34, 17], [18, 15]], "#a07040");
      return;
    }
    ctx.save();
    if (state === 1) {
      ctx.translate(24, 60);
      ctx.rotate(0.12);
      ctx.translate(-24, -50);
    }
    shape(ctx, stalactiteBody, ROCK[2]);
    ctx.save();
    path(ctx, stalactiteBody);
    ctx.clip();
    shape(ctx, [[-6, -2], [16, -2], [18, 40], [22, 120], [12, 80], [2, 30]], ROCK[3]);
    shape(ctx, [[36, -2], [54, -2], [46, 40], [30, 110]], ROCK[1]);
    for (let y = 8; y < 130; y += 11) line(ctx, jag(-6, 54, y, 1.2, 6, 940 + y), ROCK[0], 0.8);
    G.grain(ctx, G.rectRegion(ctx, -8, -2, 64, 146), 945);
    ctx.restore();
    path(ctx, stalactiteBody);
    stroke(ctx, RLINE, 1.2);
    const crack: Pt[] = [[28, 30], [24, 46], [29, 58], [25, 70]];
    line(ctx, crack, "#d09048", 1.1);
    line(ctx, crack, RLINE, 0.5);
    if (!simple()) for (const [x, y] of [[24, 142], [30, 108], [12, 90]] as Pt[]) disc(ctx, x, y, 0.9, "#9ac0d0");
    ctx.restore();
    if (state === 1) for (let i = 0; i < 6; i++) shape(ctx, [[8 + i * 7, 20 + i * 9], [12 + i * 7, 18 + i * 9], [11 + i * 7, 24 + i * 9]], ROCK[3]);
  },
};

const crystalPrism = (ctx: Ctx, x: number, base: number, w: number, h: number, lean: number): void => {
  const pts: Pt[] = [[x, base], [x + lean, base - h + w * 0.4], [x + lean + w / 2, base - h], [x + lean + w, base - h + w * 0.4], [x + w, base]];
  shape(ctx, pts, ICE[1]);
  shape(ctx, [[x + w * 0.5, base], [x + lean + w * 0.5, base - h], [x + lean + w, base - h + w * 0.4], [x + w, base]], ICE[2]);
  line(ctx, [[x + w * 0.3, base - 3], [x + lean + w * 0.42, base - h + w * 0.5]], ICE[3], 0.9);
  path(ctx, pts);
  stroke(ctx, "#08121c");
};

const crystal: EnvAsset = {
  id: "crystal",
  box: [-36, -132, 108, 12],
  draw(ctx, state) {
    if (state === 1) {
      const r = rng(961);
      for (let i = 0; i < 9; i++) {
        const x = 4 + r() * 62;
        const s = 4 + r() * 6;
        shape(ctx, [[x, 0], [x + s * 0.4, -s], [x + s, 0]], ICE[(1 + (i % 3)) as 1 | 2 | 3], "#08121c");
      }
      glow(ctx, 36, -4, 30, ICE[2], 0.25);
      return;
    }
    glow(ctx, 36, -60, 70, ICE[2], 0.35);
    shape(ctx, [[2, 0], [10, -10], [62, -10], [70, 0]], ROCK[2], RLINE);
    crystalPrism(ctx, 4, -4, 16, 70, -4);
    crystalPrism(ctx, 48, -4, 18, 82, 5);
    crystalPrism(ctx, 22, -4, 26, 120, 1);
    crystalPrism(ctx, 14, -4, 12, 48, -6);
    crystalPrism(ctx, 40, -4, 13, 56, 6);
    glow(ctx, 36, -70, 26, ICE[3], 0.3);
  },
};

const leverBank: EnvAsset = {
  id: "leverBank",
  box: [-20, -42, 20, 0],
  draw(ctx, state) {
    box(ctx, -7, -24, 14, 24, "steel", 1);
    hazard(ctx, -5, -8, 10, 4, 3);
    flat(ctx, -1.5, -22, 3, 8, "m0", "mLine");
    const a = state === 0 ? 2.5 : state === 1 ? -0.65 : -PI / 2;
    const tip: Pt = [cos(a) * 18, -18 + sin(a) * 18];
    line(ctx, [[0, -18], tip], "mLine", 3.4);
    line(ctx, [[0, -18], tip], "m3", 2);
    disc(ctx, tip[0], tip[1], 2.6, "#b02818", "mLine");
    disc(ctx, 0, -18, 2.2, "m2", "mLine");
    G.grain(ctx, G.rectRegion(ctx, -7, -24, 14, 24), 970);
    G.dirt(ctx, -7, -24, 14, 24, 971, 0.4);
  },
};

const doorSlab = (ctx: Ctx, top: number, h: number, seed: number): void => {
  box(ctx, 0, top, 24, h, "rust", 1, { vertical: true });
  for (let y = top + 10; y < top + h - 8; y += 14) {
    flat(ctx, 1, y, 22, 2, "r0");
    flat(ctx, 1, y + 2, 22, 0.8, "r3");
  }
  if (!simple()) {
    for (let y = top + 5; y < top + h - 4; y += 14) {
      disc(ctx, 3, y, 0.8, "r3");
      disc(ctx, 21, y, 0.8, "r3");
    }
  }
  G.grain(ctx, G.rectRegion(ctx, 0, top, 24, h), seed);
  G.drips(ctx, 0, top, 24, h * 0.5, seed + 1, 3);
  G.dirt(ctx, 0, top, 24, h, seed + 2, 0.25);
};

const slidingDoor = (ctx: Ctx, shut: number, seed: number, lamp: () => void): void => {
  const slabH = 16 + shut * (DOOR_H - 16);
  doorSlab(ctx, -DOOR_H, slabH, seed);
  if (shut < 1) hazard(ctx, 0, -DOOR_H + slabH - 6, 24, 6, 5);
  box(ctx, -5, -DOOR_H - 4, 34, 6, "steel", 1);
  cylV(ctx, -5, -DOOR_H, 5, DOOR_H, "steel", 1);
  cylV(ctx, 24, -DOOR_H, 5, DOOR_H, "steel", 1);
  G.grain(ctx, G.rectRegion(ctx, -5, -DOOR_H - 4, 34, 6), seed + 3);
  for (const x of [-5, 24]) G.grain(ctx, G.rectRegion(ctx, x, -DOOR_H, 5, DOOR_H), seed + 4 + x);
  lamp();
};

const shutOf = (state: number, open: number): number => (state === open ? 0 : state === 0 ? 1 : 0.5);

const leverDoor: EnvAsset = {
  id: "leverDoor",
  box: [-6, -126, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, shutOf(state, 2), 980, () => disc(ctx, 12, -DOOR_H - 1, 1.8, state === 2 ? "#5ac060" : "#d03818", "mLine"));
  },
};

const KEY_COLOURS = ["#e8c21a", "#ee7a1a", "#3a70e0"];

const keyDoors: EnvAsset = {
  id: "keyDoors",
  box: [-6, -126, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, shutOf(state, 2), 990, () => {
      KEY_COLOURS.forEach((c, i) => {
        flat(ctx, 4 + i * 6.5, -DOOR_H + 6, 4, 4, "m0", "mLine");
        disc(ctx, 6 + i * 6.5, -DOOR_H + 8, 1.4, state === 2 ? c : "#2a2220");
      });
    });
  },
};

const reader = (ctx: Ctx, x: number, y: number, lit: string): void => {
  box(ctx, x, y, 8, 14, "steel", 1);
  flat(ctx, x + 1.5, y + 2, 5, 3, "#0c1a10", "mLine");
  flat(ctx, x + 2, y + 7, 4, 1.2, "#000000");
  disc(ctx, x + 4, y + 11, 1, lit);
};

const caveCardDoor: EnvAsset = {
  id: "caveCardDoor",
  box: [-16, -126, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, shutOf(state, 2), 1000, () => reader(ctx, -15, -52, state === 2 ? "#5ac060" : "#d03818"));
  },
};

const airlock: EnvAsset = {
  id: "airlock",
  box: [-6, -132, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, state === 0 ? 0 : state === 2 ? 1 : 0.5, 1010, () => {
      box(ctx, 6, -DOOR_H - 10, 12, 6, "steel", 2);
      disc(ctx, 12, -DOOR_H - 7, 2, state === 2 ? "#ff4020" : "#e8c21a");
      if (state !== 2) glow(ctx, 12, -DOOR_H - 7, 9, "#e8c21a", 0.35);
      hazard(ctx, -5, -6, 34, 6, 5);
    });
  },
};

const cog = (ctx: Ctx, cx: number, cy: number, r: number, teeth: number): void => {
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * PI * 2;
    shape(ctx, [[cos(a - 0.12) * r, sin(a - 0.12) * r], [cos(a - 0.08) * r * 1.3, sin(a - 0.08) * r * 1.3], [cos(a + 0.08) * r * 1.3, sin(a + 0.08) * r * 1.3], [cos(a + 0.12) * r, sin(a + 0.12) * r]], "m2", "mLine");
  }
  disc(ctx, 0, 0, r, "m2", "mLine");
  disc(ctx, 0, 0, r * 0.35, "m0", "mLine");
  ctx.restore();
};

const liftLock: EnvAsset = {
  id: "liftLock",
  box: [0, -48, 72, 0],
  draw(ctx, state) {
    box(ctx, 2, -36, 68, 36, "steel", 1);
    flat(ctx, 6, -32, 60, 28, "m0", "mLine");
    cog(ctx, 24, -18, 10, 10);
    const bolt = state === 0 ? 0 : 14;
    box(ctx, 34 + bolt, -21, 26, 7, "rust", 2);
    hazard(ctx, 40 + bolt, -21, 14, 7, 4);
    box(ctx, 50, -44, 16, 10, "steel", 2);
    flat(ctx, 55, -42, 6, 6, "#000000");
    disc(ctx, 10, -40, 2, state === 0 ? "#d03818" : "#5ac060", "mLine");
    rivets(ctx, 4, -34, 64, 8, "m3");
    G.grain(ctx, G.rectRegion(ctx, 2, -44, 68, 44), 1020);
    G.drips(ctx, 2, -36, 68, 18, 1021, 3);
    G.dirt(ctx, 2, -36, 68, 36, 1022, 0.3);
  },
};

const keySlots: EnvAsset = {
  id: "keySlots",
  box: [0, -44, 36, 0],
  draw(ctx, state) {
    box(ctx, 2, -42, 32, 42, "steel", 1);
    flat(ctx, 5, -38, 26, 22, "m0", "mLine");
    KEY_COLOURS.forEach((c, i) => {
      const x = 8 + i * 7.5;
      flat(ctx, x, -34, 5, 14, c, "mLine");
      flat(ctx, x + 1.5, -32, 2, 10, "#050403");
      const full = state === 2 || (state === 1 && i === 0);
      if (full) flat(ctx, x + 1, -36, 3, 6, c, "mLine");
      disc(ctx, x + 2.5, -17.5, 1.1, full ? "#5ac060" : "#3a1410");
    });
    box(ctx, 0, -6, 36, 6, "steel", 0);
    G.grain(ctx, G.rectRegion(ctx, 2, -42, 32, 42), 1030);
    G.dirt(ctx, 2, -42, 32, 42, 1031, 0.3);
  },
};

const stoneBlock = (ctx: Ctx, y: number, seed: number, crack: boolean): void => {
  const r = rng(seed);
  const pts: Pt[] = [[0.5, y + 1], [23.5, y + 0.5], [23, y + 23.5], [1, y + 23.5]];
  shape(ctx, pts, STONE[1]);
  shape(ctx, [[1.5, y + 2], [22.5, y + 1.5], [20, y + 5], [4, y + 5]], STONE[2]);
  shape(ctx, [[3, y + 20], [22.5, y + 18], [23, y + 23.5], [1, y + 23.5]], STONE[0]);
  if (!simple()) for (let i = 0; i < 4; i++) flat(ctx, 3 + r() * 17, y + 6 + r() * 12, 1.2, 1.2, STONE[3]);
  if (crack) line(ctx, [[6, y + 2], [11, y + 9], [9, y + 14], [15, y + 22]], RLINE, 1);
  path(ctx, pts);
  stroke(ctx, RLINE);
};

const stoneBlocks: EnvAsset = {
  id: "stoneBlocks",
  box: [-2, -50, 26, 0],
  draw(ctx, state) {
    if (state === 2) {
      const r = rng(1041);
      for (let i = 0; i < 8; i++) {
        const x = r() * 20;
        const s = 3 + r() * 5;
        shape(ctx, [[x, 0], [x + s * 0.3, -s], [x + s, -s * 0.8], [x + s * 1.1, 0]], STONE[(1 + (i % 3)) as 1 | 2 | 3], RLINE);
      }
      return;
    }
    stoneBlock(ctx, -48, 1042, state === 1);
    stoneBlock(ctx, -24, 1043, state === 1);
    G.grain(ctx, G.rectRegion(ctx, 0, -48, 24, 48), 1044);
    G.dirt(ctx, 0, -48, 24, 48, 1045, 0.3);
  },
};

const explosiveTank: EnvAsset = {
  id: "explosiveTank",
  box: [-4, -52, 52, 0],
  draw(ctx, state) {
    if (state === 2) {
      const pts: Pt[] = [[4, 0], [6, -12], [14, -8], [20, -18], [28, -10], [38, -16], [42, 0]];
      G.scorch(ctx, pts, 1050);
      shape(ctx, pts, "#1a0c06", RLINE);
      return;
    }
    if (state === 1) {
      glow(ctx, 24, -24, 40, "#ffd25a", 0.8);
      glow(ctx, 24, -24, 24, "#ffffff", 0.7);
      return;
    }
    cylV(ctx, 4, -44, 40, 44, "armor", 1);
    flat(ctx, 2, -48, 44, 5, "#3a1006", "aLine");
    flat(ctx, 2, -4, 44, 4, "#3a1006", "aLine");
    hazard(ctx, 4, -32, 40, 7, 5);
    disc(ctx, 24, -15, 6, "#f4e0a0", "aLine");
    shape(ctx, [[24, -20], [27, -14], [24, -11], [21, -14]], "#c02010");
    G.grain(ctx, G.rectRegion(ctx, 2, -48, 44, 48), 1051);
    G.drips(ctx, 4, -44, 40, 20, 1052, 3);
    G.dirt(ctx, 4, -44, 40, 44, 1053, 0.3);
  },
};

const cart = (ctx: Ctx, x: number, seed: number): void => {
  const r = rng(seed);
  const body: Pt[] = [[x, 0], [x + 44, 0], [x + 40, 17], [x + 4, 17]];
  shape(ctx, [[x + 2, 0], ...jag(x + 2, x + 42, -2.6, 1.4, 3, seed), [x + 42, 0]], ROCK[3]);
  shape(ctx, body, CART[1]);
  shape(ctx, [[x + 1, 0.5], [x + 43, 0.5], [x + 42.5, 3], [x + 1.5, 3]], CART[3]);
  shape(ctx, [[x + 3, 13], [x + 41, 13], [x + 40, 17], [x + 4, 17]], CART[0]);
  for (const cx of [x + 14, x + 26]) line(ctx, [[cx - 3, 6], [cx + 1, 9], [cx - 3, 12]], CART[0], 1.6);
  path(ctx, body);
  stroke(ctx, "#141404");
  for (const wx of [x + 10, x + 34]) {
    disc(ctx, wx, 19.5, 3.6, "m1", "mLine");
    disc(ctx, wx, 19.5, 1.2, "m3");
  }
  if (r() < 0.6) G.rustPatch(ctx, x + 8 + r() * 28, 8 + r() * 5, 3, 2, seed + 2);
};

const mineCarts: EnvAsset = {
  id: "mineCarts",
  box: [0, -6, 192, 26],
  draw(ctx, _state, _t, { w = 192 } = {}) {
    const seed = 1060 + round(w);
    flat(ctx, 0, 22.5, w, 2, "m2", "mLine");
    if (!simple()) for (let x = 3; x < w; x += 8) flat(ctx, x, 24, 4, 1.5, "r1");
    for (let x = 1; x < w - 40; x += 47) cart(ctx, x, seed + x);
    G.grain(ctx, G.rectRegion(ctx, 0, -4, w, 28), seed + 1, 0.8);
    G.dirt(ctx, 0, 0, w, 24, seed + 2, 0.3);
  },
};

const cartCrusher: EnvAsset = {
  id: "cartCrusher",
  box: [-6, -100, 78, 50],
  draw(ctx) {
    box(ctx, -4, -98, 76, 12, "steel", 1);
    cylV(ctx, -4, -86, 8, 134, "steel", 1);
    cylV(ctx, 64, -86, 8, 134, "steel", 1);
    hazard(ctx, -4, -98, 76, 5, 6);
    cog(ctx, 22, -40, 16, 12);
    cog(ctx, 48, 4, 16, 12);
    if (!simple()) for (const [x, y] of [[30, -14], [36, -18], [40, -10], [33, -6], [44, -16]] as Pt[]) line(ctx, [[x, y], [x + 3, y - 2]], "#ffe080", 0.9);
    glow(ctx, 36, -12, 18, "#ffb040", 0.35);
    G.grain(ctx, G.rectRegion(ctx, -4, -98, 76, 12), 1070);
    for (const x of [-4, 64]) G.grain(ctx, G.rectRegion(ctx, x, -86, 8, 134), 1072 + x);
    G.drips(ctx, -4, -86, 76, 30, 1071, 4);
  },
};

const lavaSurface = (ctx: Ctx, w: number, top: number, h: number, seed: number): void => {
  const r = rng(seed);
  const g = ctx.createLinearGradient(0, top, 0, top + h);
  g.addColorStop(0, LAVA[3]);
  g.addColorStop(0.3, LAVA[2]);
  g.addColorStop(1, LAVA[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, top, w, h);
  for (let x = r() * 6; x < w - 2; x += 5 + r() * 9) {
    const cw = 3 + r() * 6;
    veil(ctx, [[x, top + 3 + r() * 4], [x + cw, top + 2 + r() * 4], [x + cw * 0.8, top + 8 + r() * 6], [x + 0.5, top + 7 + r() * 6]], LAVA[0], 0.55);
  }
  if (!simple()) for (let i = 0; i < w / 10; i++) disc(ctx, r() * w, top + 1 + r() * 3, 0.6 + r(), LAVA[3]);
};

const lavaPit: EnvAsset = {
  id: "lavaPit",
  box: [0, -24, 48, 26],
  draw(ctx, _state, _t, { w = 48 } = {}) {
    const g = ctx.createLinearGradient(0, -24, 0, 6);
    g.addColorStop(0, "rgba(255,90,16,0)");
    g.addColorStop(1, "rgba(255,110,24,0.45)");
    ctx.fillStyle = g;
    ctx.fillRect(0, -24, w, 30);
    lavaSurface(ctx, w, 6, 18, 1080 + round(w));
  },
};

const lavaFall: EnvAsset = {
  id: "lavaFall",
  box: [-4, -148, 148, 2],
  draw(ctx, _state, _t, { w = 144, h = 144 } = {}) {
    const seed = 1090 + round(w) + round(h);
    const r = rng(seed);
    glow(ctx, w / 2, -h * 0.35, w * 0.6, "#ff5a10", 0.3);
    const opening: Pt[] = [
      ...jag(w * 0.16, w * 0.84, -h + 2, 2.5, 8, seed),
      ...jag(-h + 2, -9, w * 0.9, 3, 10, seed + 1).map(([y, x]): Pt => [x + (y + h) * 0.06, y]),
      ...jag(w * 0.04, w * 0.97, -9, 1.5, 9, seed + 2).reverse(),
      ...jag(-h + 2, -9, w * 0.1, 3, 10, seed + 3).map(([y, x]): Pt => [x - (y + h) * 0.05, y]).reverse(),
    ];
    const [mx, my] = [w / 2, -h / 2];
    const ring = opening.map(([x, y]): Pt => [mx + (x - mx) * 1.1, my + (y - my) * 1.06]);
    shape(ctx, ring, CEIL[2], RLINE);
    G.grain(ctx, G.polyRegion(ctx, ring), seed + 8, 0.8);
    shape(ctx, opening, "#0c0402");
    ctx.save();
    path(ctx, opening);
    ctx.clip();
    const inner = ctx.createLinearGradient(0, -h, 0, 0);
    inner.addColorStop(0, "rgba(120,30,6,0.1)");
    inner.addColorStop(1, "rgba(255,110,30,0.4)");
    ctx.fillStyle = inner;
    ctx.fillRect(0, -h, w, h);
    const fall: Pt[] = [[w * 0.32, -h], [w * 0.68, -h], [w * 0.74, -h * 0.5], [w * 0.8, 0], [w * 0.2, 0], [w * 0.26, -h * 0.5]];
    const g = ctx.createLinearGradient(w * 0.2, 0, w * 0.8, 0);
    g.addColorStop(0, LAVA[1]);
    g.addColorStop(0.3, LAVA[2]);
    g.addColorStop(0.5, LAVA[3]);
    g.addColorStop(0.7, LAVA[2]);
    g.addColorStop(1, LAVA[1]);
    ctx.fillStyle = g;
    path(ctx, fall);
    ctx.fill();
    ctx.save();
    path(ctx, fall);
    ctx.clip();
    for (let x = w * 0.2 + r() * 3; x < w * 0.8; x += 2.5 + r() * 3.5) {
      const wob = rng(seed + round(x * 7));
      const pts: Pt[] = [];
      for (let y = -h; y <= 0; y += 12) pts.push([x + (wob() - 0.5) * 2.4, y]);
      line(ctx, pts, r() < 0.5 ? LAVA[3] : LAVA[1], 0.8 + r() * 1.2);
    }
    for (let i = 0; i < w / 6; i++) {
      const cx = w * 0.22 + r() * w * 0.56;
      const cy = -h + r() * h;
      veil(ctx, blob(cx, cy, 1.2 + r() * 1.6, 4 + r() * 6, seed + i * 3, 6), LAVA[0], 0.4);
    }
    ctx.restore();
    glow(ctx, w / 2, -10, w * 0.42, "#ffb040", 0.6);
    ctx.restore();
    line(ctx, [...opening, opening[0] as Pt], LAVA[1], 1.6);
    path(ctx, opening);
    stroke(ctx, RLINE, 0.8);
    const sill: Pt[] = [[-4, 2], ...jag(-4, w + 4, -13, 2.2, 7, seed + 5), [w + 4, 2]];
    shape(ctx, sill, ROCK[2], RLINE);
    line(ctx, jag(w * 0.08, w * 0.92, -13.5, 1.2, 7, seed + 5), LAVA[2], 1.2);
    G.grain(ctx, G.polyRegion(ctx, sill), seed + 6, 0.8);
    G.chips(ctx, w * 0.1, -13, w * 0.8, seed + 7);
  },
};

const chasm: EnvAsset = {
  id: "chasm",
  box: [0, -6, 96, 74],
  draw(ctx, _state, _t, { w = 96 } = {}) {
    const seed = 1100 + round(w);
    const r = rng(seed);
    const g = ctx.createLinearGradient(0, 0, 0, 72);
    g.addColorStop(0, "rgba(40,6,2,0)");
    g.addColorStop(0.35, "rgba(70,14,4,0.28)");
    g.addColorStop(1, "rgba(20,4,2,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, 72);
    for (let i = 0; i < 5; i++) {
      const y = 14 + r() * 50;
      veil(ctx, [...jag(r() * w * 0.3, w - r() * w * 0.3, y, 1.6, 8, seed + i), [w * 0.6, y + 4], [w * 0.3, y + 3]], "#a03a20", 0.12);
    }
    if (!simple()) for (let i = 0; i < w / 12; i++) disc(ctx, r() * w, 20 + r() * 50, 0.5 + r() * 0.5, "#ff8a40");
  },
};

const rod: EnvAsset = {
  id: "rod",
  box: [-16, -8, 16, 0],
  draw(ctx, state) {
    if (state === 2) return;
    line(ctx, [[-14, -2], [12, -5]], "mLine", 3.2);
    line(ctx, [[-14, -2], [12, -5]], "m3", 1.8);
    box(ctx, 10, -8, 5, 6, "rust", 2);
  },
};

const keyCard = (c: string, id: string): EnvAsset => ({
  id,
  box: [-9, -14, 9, 0],
  draw(ctx, state) {
    if (state === 2) return;
    shape(ctx, [[-8, -2], [6, -2], [8, -4], [8, -12], [-8, -12]], c, "#1a1206");
    flat(ctx, -6, -10, 4, 3, "#f0e8c0", "#1a1206");
    flat(ctx, -1, -6, 7, 1.4, "#1a1206");
  },
});

const entryCard: EnvAsset = {
  id: "entryCard",
  box: [-9, -14, 9, 0],
  draw(ctx, state) {
    if (state === 2) return;
    flat(ctx, -8, -12, 16, 10, "#e8e8e0", "#141414");
    flat(ctx, -8, -9.5, 16, 2.4, "#202020");
    flat(ctx, -6, -6, 5, 3, "#c8a018");
  },
};

const WOOD: Tones = ["#1a1009", "#33210f", "#4e3519", "#6c4c26"];

const CEIL: Tones = ["#080605", "#0d0a07", "#13100b", "#1a160f"];
const GROUND: Tones = ["#0a0705", "#16110c", "#231b13", "#33291c"];

const flowstone = (ctx: Ctx, x: number, cw: number, h: number, seed: number): void => {
  const r = rng(seed);
  const waist = cw * (0.3 + r() * 0.2);
  const left: Pt[] = [[x - cw * 0.7, -h - 1], [x - waist, -h * 0.55], [x - waist * 0.8, -h * 0.4], [x - cw * 0.6, 1]];
  const right: Pt[] = [[x + cw * 0.6, 1], [x + waist * 0.9, -h * 0.45], [x + waist, -h * 0.6], [x + cw * 0.7, -h - 1]];
  const body = [...left, ...right];
  shape(ctx, body, CEIL[2]);
  ctx.save();
  path(ctx, body);
  ctx.clip();
  shape(ctx, [...left, [x - cw * 0.15, 1], [x - waist * 0.3, -h * 0.5], [x - cw * 0.15, -h - 1]], CEIL[3]);
  shape(ctx, [[x + cw * 0.25, -h - 1], [x + waist * 0.35, -h * 0.5], [x + cw * 0.3, 1], ...right], CEIL[0]);
  for (let y = -h + 6 + r() * 6; y < -4; y += 6 + r() * 8) line(ctx, [[x - cw, y], [x, y + 1.5], [x + cw, y]], CEIL[1], 0.8);
  ctx.restore();
};

const stalagmite = (ctx: Ctx, x: number, y: number, ht: number): void => {
  const bw = ht * 0.32;
  veil(ctx, [[x, y], [x + bw * 2.6, y + 1.5], [x + bw * 2.2, y + 3], [x - bw * 0.4, y + 2]], GROUND[0], 0.6);
  shape(ctx, [[x - bw, y], [x - bw * 0.2, y - ht * 0.7], [x, y - ht], [x + bw * 0.25, y - ht * 0.65], [x + bw, y]], GROUND[2]);
  shape(ctx, [[x - bw, y], [x - bw * 0.2, y - ht * 0.7], [x, y - ht], [x - bw * 0.05, y]], GROUND[3]);
  shape(ctx, [[x - bw * 0.15, y - ht * 0.72], [x, y - ht], [x + bw * 0.1, y - ht * 0.75]], "#4c3f2e");
};

const farScaffold = (ctx: Ctx, w: number, y: number, r: () => number): void => {
  const x0 = w * (0.1 + r() * 0.2);
  const x1 = w * (0.6 + r() * 0.3);
  const deck = y - 10;
  for (let x = x0 + 2; x < x1 - 4; x += 22 + r() * 10) {
    flat(ctx, x, deck, 2.4, y - deck, CEIL[3]);
    line(ctx, [[x + 1, deck + 2], [x + 9, y]], CEIL[2], 1.2);
  }
  flat(ctx, x0, deck, x1 - x0, 2.4, CEIL[3]);
  flat(ctx, x0, deck - 7, x1 - x0, 1, CEIL[3]);
  for (let x = x0 + 4; x < x1; x += 12) flat(ctx, x, deck - 7, 0.9, 7, CEIL[2]);
  for (let x = x0 + 8; x < x1; x += 30 + r() * 20) {
    glow(ctx, x, deck - 10, 9, "#ffb050", 0.5);
    disc(ctx, x, deck - 10, 1.1, "#e8a848");
  }
};

const caveDepths: EnvAsset = {
  id: "caveDepths",
  box: [0, -144, 240, 0],
  draw(ctx, state, _t, { w = 240, h = 144 } = {}) {
    const seed = 1120 + round(w) * 3 + round(h) * 7 + state * 101;
    const r = rng(seed);
    const band = -min(h * 0.55, 58);
    const horizon = -min(h * 0.38, 40);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -h, w, h);
    ctx.clip();
    flat(ctx, 0, -h, w, h, CEIL[1]);
    for (let i = 0; i < (w * (h + band)) / 260; i++) {
      const x = r() * w;
      const y = -h + r() * (h + band);
      const rx = 4 + r() * 8;
      const ry = 3 + r() * 5;
      shape(ctx, blob(x + 0.8, y + 0.9, rx, ry, seed + i), CEIL[0]);
      shape(ctx, blob(x, y, rx, ry, seed + i), CEIL[r() < 0.5 ? 1 : 2]);
      veil(ctx, blob(x - rx * 0.3, y - ry * 0.3, rx * 0.5, ry * 0.4, seed + i + 1, 7), r() < 0.3 ? "#1c2012" : CEIL[3], 0.3);
    }
    shape(ctx, [...jag(-4, w + 4, band, 2.5, 7, seed + 1), [w + 4, horizon + 2], [-4, horizon + 2]], "#070504");
    for (let x = r() * 6; x < w; x += 5 + r() * 10) {
      const l = 3 + r() * min(16, (horizon - band) * 0.5);
      const sw = 3 + r() * 5;
      shape(ctx, [[x, band - 3], [x + sw, band - 3], [x + sw * 0.5, band + l]], CEIL[1]);
    }
    if (state !== 2) for (let x = 30 + r() * 60; x < w - 12; x += 110 + r() * 120) flowstone(ctx, x, 10 + r() * 10, h, seed + round(x) * 5);
    const ground = ctx.createLinearGradient(0, horizon, 0, 0);
    ground.addColorStop(0, GROUND[1]);
    ground.addColorStop(0.8, GROUND[3]);
    ground.addColorStop(1, GROUND[2]);
    ctx.fillStyle = ground;
    path(ctx, [...jag(-4, w + 4, horizon, 1.2, 10, seed + 2), [w + 4, 1], [-4, 1]]);
    ctx.fill();
    for (let y = horizon + 4; y < -3; y += 4 + r() * 4) veil(ctx, jag(r() * w * 0.5, w * (0.5 + r() * 0.5), y, 0.6, 12, seed + round(y) * 9), GROUND[0], 0.5);
    if (state === 0) {
      const ry = horizon * 0.6;
      const lava = ctx.createLinearGradient(0, ry - 22, 0, ry);
      lava.addColorStop(0, "rgba(255,90,20,0)");
      lava.addColorStop(1, "rgba(255,100,24,0.16)");
      ctx.fillStyle = lava;
      ctx.fillRect(0, ry - 22, w, 22);
      const bank = jag(-4, w + 4, ry, 0.8, 6, seed + 3);
      shape(ctx, [...bank, ...jag(-4, w + 4, ry + 2.2, 0.6, 8, seed + 4).reverse()], LAVA[0]);
      line(ctx, bank, LAVA[1], 0.8);
      for (let x = r() * 6; x < w; x += 4 + r() * 8) flat(ctx, x, ry + 0.6, 2 + r() * 3, 0.6, LAVA[1]);
    }
    const mites: Pt[] = [];
    for (let i = 0; i < w / 18; i++) mites.push([r() * w, horizon + 3 + r() * (-horizon - 6)]);
    mites.sort((a, b) => a[1] - b[1]);
    for (const [x, y] of mites) stalagmite(ctx, x, y, (6 + r() * 18) * (0.5 + (y - horizon) / -horizon));
    if (state === 2) farScaffold(ctx, w, horizon + 8, r);
    const shade = ctx.createLinearGradient(0, -h, 0, band);
    shade.addColorStop(0, "rgba(0,0,0,0.45)");
    shade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, -h, w, h + band);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 3, 0.35);
    ctx.restore();
  },
};

const timberV = (ctx: Ctx, x: number, top: number, h: number, seed: number): void => {
  const r = rng(seed);
  flat(ctx, x, top, 8, h, WOOD[1], RLINE);
  flat(ctx, x + 1, top, 2, h, WOOD[2]);
  flat(ctx, x + 6, top, 1.6, h, WOOD[0]);
  for (let i = 0; i < 3; i++) {
    const gx = x + 2 + r() * 4;
    line(ctx, [[gx, top + r() * h * 0.3], [gx + (r() - 0.5) * 1.5, top + h * (0.5 + r() * 0.5)]], WOOD[0], 0.6);
  }
  G.grain(ctx, G.rectRegion(ctx, x, top, 8, h), seed + 1);
  G.dirt(ctx, x, top, 8, h, seed + 2, min(0.4, 30 / h));
  for (const y of [top + h * (0.25 + r() * 0.1), top + h * 0.7]) {
    flat(ctx, x - 0.6, y, 9.2, 3, "m1", "mLine");
    disc(ctx, x + 4, y + 1.5, 0.8, "m3");
    G.drips(ctx, x, y + 3, 8, 7, seed + round(y), 1);
  }
};

const timberH = (ctx: Ctx, x: number, y: number, w: number, seed: number): void => {
  flat(ctx, x, y, w, 9, WOOD[1], RLINE);
  flat(ctx, x, y + 1, w, 1.8, WOOD[3]);
  flat(ctx, x, y + 7, w, 1.6, WOOD[0]);
  const r = rng(seed);
  for (let i = 0; i < w / 12; i++) {
    const gx = x + r() * w;
    line(ctx, [[gx, y + 3 + r() * 3], [gx + 6 + r() * 8, y + 3 + r() * 3]], WOOD[0], 0.6);
  }
  G.grain(ctx, G.rectRegion(ctx, x, y, w, 9), seed + 1);
  G.chips(ctx, x, y + 0.6, w, seed + 2);
};

const mineShoring: EnvAsset = {
  id: "mineShoring",
  box: [-4, -96, 76, 0],
  draw(ctx, state, _t, { w = 72, h = 96 } = {}) {
    const seed = 1130 + round(w) * 3 + round(h) + state * 41;
    const top = -h + 9;
    const brace = (a: Pt, b: Pt): void => {
      line(ctx, [a, b], RLINE, 5.4, "butt");
      line(ctx, [a, b], WOOD[1], 4, "butt");
      line(ctx, [a, b], WOOD[2], 1.2, "butt");
    };
    timberV(ctx, 0, top, h - 9, seed + 1);
    timberV(ctx, w - 8, top, h - 9, seed + 2);
    brace([8, top + 14], [20, top]);
    if (state === 2) {
      ctx.save();
      ctx.translate(-4, -h);
      ctx.rotate(0.05);
      timberH(ctx, 0, 0, w * 0.58, seed + 3);
      ctx.restore();
      ctx.save();
      ctx.translate(w + 4, -h);
      ctx.rotate(-0.16);
      timberH(ctx, -w * 0.5, 0, w * 0.5, seed + 4);
      ctx.restore();
      shape(ctx, [[w * 0.52, -h + 1], [w * 0.58, -h + 4], [w * 0.5, -h + 9], [w * 0.55, -h + 5]], WOOD[3], RLINE);
      return;
    }
    brace([w - 8, top + 14], [w - 20, top]);
    timberH(ctx, -4, -h, w + 8, seed + 3);
    if (state !== 1) return;
    const lx = w / 2;
    line(ctx, [[lx, top], [lx, top + 9]], RLINE, 0.8);
    glow(ctx, lx, top + 15, 26, "#ffb850", 0.45);
    box(ctx, lx - 3, top + 9, 6, 3, "steel", 1);
    disc(ctx, lx, top + 15.5, 3.4, "#ffd890");
    for (const dx of [-2.4, 0, 2.4]) line(ctx, [[lx + dx, top + 12], [lx + dx * 1.4, top + 16], [lx + dx, top + 19.5]], "mLine", 0.6);
  },
};

const rockPile: EnvAsset = {
  id: "rockPile",
  box: [-4, -26, 56, 2],
  draw(ctx, state) {
    const seed = 1140 + state * 13;
    const r = rng(seed);
    if (state === 1) {
      line(ctx, [[4, -1], [40, -21]], RLINE, 5.6, "butt");
      line(ctx, [[4, -1], [40, -21]], WOOD[2], 4, "butt");
      line(ctx, [[2, -3], [28, -7], [50, -1]], "mLine", 2.8);
      line(ctx, [[2, -3], [28, -7], [50, -1]], "m2", 1.4);
    }
    for (let i = 0; i < 9; i++) {
      const big = 1 - i / 9;
      const rx = 3 + big * 7 + r() * 2;
      const ry = 2.5 + big * 5 + r();
      const cx = 6 + r() * 40;
      const cy = -ry * 0.75 - (big > 0.5 ? r() * 4 : 0);
      const pts = blob(cx, cy, rx, ry, seed + i * 7);
      shape(ctx, blob(cx + 0.8, cy + 0.8, rx, ry, seed + i * 7), RLINE);
      shape(ctx, pts, i % 3 === 0 ? STONE[1] : ROCK[3]);
      veil(ctx, blob(cx - rx * 0.25, cy - ry * 0.35, rx * 0.55, ry * 0.4, seed + i * 7 + 1, 7), STONE[2], 0.5);
      G.grain(ctx, G.polyRegion(ctx, pts), seed + i, 0.8);
      path(ctx, pts);
      stroke(ctx, RLINE);
    }
    G.dirt(ctx, 0, -10, 52, 10, seed + 2, 0.5);
  },
};

const ROPE: Tones = ["#1c1a14", "#36342a", "#585444", "#7e7862"];

const cableTwist: EnvAsset = {
  id: "cableTwist",
  box: [0, -240, 48, 0],
  draw(ctx, _state, _t, { w = 48, h = 240 } = {}) {
    const seed = 1150 + round(w) + round(h) * 3;
    const cw = w * 0.72;
    const x0 = (w - cw) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, -h, cw, h);
    ctx.clip();
    const g = ctx.createLinearGradient(x0, 0, x0 + cw, 0);
    g.addColorStop(0, ROPE[0]);
    g.addColorStop(0.3, ROPE[2]);
    g.addColorStop(0.55, ROPE[1]);
    g.addColorStop(1, ROPE[0]);
    ctx.fillStyle = g;
    ctx.fillRect(x0, -h, cw, h);
    const pitch = cw * 0.9;
    for (let y = -h - pitch; y < pitch; y += pitch * 0.5) {
      const band: Pt[] = [[x0 - 2, y], [x0 + cw * 0.5, y + pitch * 0.32], [x0 + cw + 2, y + pitch * 0.5], [x0 + cw + 2, y + pitch * 0.66], [x0 + cw * 0.5, y + pitch * 0.48], [x0 - 2, y + pitch * 0.16]];
      shape(ctx, band, RUSTY[1]);
      line(ctx, [band[0] as Pt, band[1] as Pt, band[2] as Pt], RUSTY[3], 0.9);
      line(ctx, [band[5] as Pt, band[4] as Pt, band[3] as Pt], ROPE[0], 1.2);
    }
    const shade = ctx.createLinearGradient(x0, 0, x0 + cw, 0);
    shade.addColorStop(0, "rgba(0,0,0,0.55)");
    shade.addColorStop(0.35, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = shade;
    ctx.fillRect(x0, -h, cw, h);
    G.grain(ctx, G.rectRegion(ctx, x0, -h, cw, h), seed, 0.8);
    ctx.restore();
    for (const y of [-h + 2, -8]) {
      box(ctx, x0 - 3, y, cw + 6, 6, "steel", 1);
      G.drips(ctx, x0, y + 6, cw, 10, seed + round(y), 1);
    }
    G.dirt(ctx, x0, -h * 0.25, cw, h * 0.25, seed + 1, 0.6);
  },
};

const rockRoots: EnvAsset = {
  id: "rockRoots",
  box: [-10, -240, 10, 0],
  draw(ctx, _state, _t, { h = 240 } = {}) {
    const seed = 1160 + round(h) * 7;
    const r = rng(seed);
    const pts: Pt[] = [];
    for (let y = -h; y <= 0; y += 6) pts.push([sin(y * 0.11 + seed) * 2.6 + (r() - 0.5) * 1.6, y]);
    for (let y = -h + 8 + r() * 10; y < -6; y += 10 + r() * 16) {
      const side = r() < 0.5 ? -1 : 1;
      const x = sin(y * 0.11 + seed) * 2.6;
      const twig: Pt[] = [[x, y], [x + side * (3 + r() * 3), y + 3 + r() * 3], [x + side * (5 + r() * 4), y + 7 + r() * 5]];
      line(ctx, twig, "#1a0d05", 1.4);
      line(ctx, twig, "#5a3418", 0.6);
    }
    line(ctx, pts, "#140a04", 3);
    line(ctx, pts, "#3c2210", 2);
    line(ctx, pts.map(([x, y]): Pt => [x - 0.6, y]), "#5e3a1c", 0.6);
    for (let y = -h + r() * 12; y < -2; y += 9 + r() * 14) disc(ctx, sin(y * 0.11 + seed) * 2.6 + (r() - 0.5) * 3, y, 0.7, RUSTY[2]);
  },
};

export const JESKYNE_IDS = [
  "caveRock", "caveRockTop", "caveFloor", "rockLedge", "caveBackdrop", "rustTube", "caveMachine", "metalPillars", "ropeColumn", "caveStalactites", "stalactite", "crystal", "leverBank", "leverDoor",
  "keyDoors", "caveCardDoor", "airlock", "liftLock", "keySlots", "stoneBlocks", "explosiveTank", "mineCarts", "cartCrusher", "lavaPit", "lavaFall", "chasm", "rod", "yellowKey", "orangeKey",
  "blueKey", "entryCard", "caveDepths", "mineShoring", "rockPile", "cableTwist", "rockRoots",
] as const;

export const jeskyneAssets: EnvAsset[] = [
  caveRock, caveRockTop, caveFloor, rockLedge, caveBackdrop, rustTube, caveMachine, metalPillars, ropeColumn, caveStalactites, stalactite, crystal, leverBank, leverDoor,
  keyDoors, caveCardDoor, airlock, liftLock, keySlots, stoneBlocks, explosiveTank, mineCarts, cartCrusher, lavaPit, lavaFall, chasm, rod, keyCard("#e8c21a", "yellowKey"), keyCard("#ee7a1a", "orangeKey"),
  keyCard("#3a70e0", "blueKey"), entryCard, caveDepths, mineShoring, rockPile, cableTwist, rockRoots,
];
