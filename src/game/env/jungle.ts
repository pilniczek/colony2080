import { G } from "./grime";
import { P } from "./paint";

const { rng, path, color, flat, glow, stroke, shape, line, curve, hazard } = P;
const { PI, sin, cos, min, max, round } = Math;

export type Ctx = CanvasRenderingContext2D;
export type Pt = [number, number];
export type Tones = readonly [string, string, string, string];

export const simple = (): boolean => P.simple();

export const STONE: Tones = ["#2c2a22", "#4c493d", "#716c5a", "#a39c84"];
export const MOSS: Tones = ["#17220e", "#2a3c18", "#43602a", "#6c8a3c"];
export const LEAF: Tones = ["#0c1c14", "#183424", "#285034", "#457a48"];
export const BUNKER: Tones = ["#363c32", "#545448", "#606054", "#7c7c6a"];
export const RED: Tones = ["#4a0e08", "#86200e", "#b8381a", "#e06a3a"];
export const WATER: Tones = ["#546060", "#6c6c6c", "#788478", "#a8a8a8"];
export const ROCK: Tones = ["#303024", "#6c6254", "#84786c", "#a4a08c"];
export const TEAL: Tones = ["#182424", "#243030", "#3c4848", "#5c6c6c"];
export const DOME: Tones = ["#0c3024", "#1c4c3c", "#3c6c60", "#8ca8a0"];
export const BRASS: Tones = ["#3c3018", "#6c6030", "#9c8448", "#e4c048"];
export const ARMY: Tones = ["#1c3424", "#244830", "#3c6c48", "#5c8c64"];
export const CONDUIT: Tones = ["#101c1c", "#18483c", "#303c3c", "#3c8478"];
export const SPIKE: Tones = ["#1c2c28", "#54786c", "#a8b4b4", "#dce4e4"];
export const GOLD: Tones = ["#5c4c30", "#9c846c", "#c8a860", "#eed890"];
export const SLATE: Tones = ["#2c2a26", "#5c564c", "#787064", "#9c9484"];
export const WOOD: Tones = ["#2a1c10", "#483018", "#604824", "#8c6c3c"];
export const SLINE = "#12100b";
export const CLINE = "#080c08";
export const ROOF: Tones = ["#2a1c14", "#483024", "#5c3c28", "#7c5438"];

export const band = (ctx: Ctx, x: number, y: number, w: number, h: number, t: readonly string[], tone = 2, edge: string | null = CLINE): void => {
  const e = min(2, h / 4);
  const s = min(3, h / 4);
  flat(ctx, x, y, w, h, t[tone] as string);
  flat(ctx, x, y, w, e, t[min(3, tone + 1)] as string);
  flat(ctx, x, y + h - s, w, s, t[max(0, tone - 1)] as string);
  if (!edge) return;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, edge);
};

export const column = (ctx: Ctx, x: number, y: number, w: number, h: number, t: readonly string[], tone = 2, edge: string | null = CLINE): void => {
  const e = min(3, w / 4);
  const s = min(4, w / 4);
  flat(ctx, x, y, w, h, t[tone] as string);
  flat(ctx, x, y, e, h, t[min(3, tone + 1)] as string);
  flat(ctx, x + w - s, y, s, h, t[max(0, tone - 1)] as string);
  if (!edge) return;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, edge);
};

export const oval = (ctx: Ctx, cx: number, cy: number, rx: number, ry: number, fill: string, edge: string | null = null, rot = 0): void => {
  ctx.fillStyle = color(fill);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, PI * 2);
  ctx.fill();
  if (edge) stroke(ctx, edge);
};

export const within = (ctx: Ctx, pts: Pt[], draw: () => void): void => {
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  draw();
  ctx.restore();
};

export const eggPts = (cx: number, cy: number, rx: number, ry: number, rot: number, egg: number, seed: number, n = 30): Pt[] => {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2;
    const k = (1 + egg * cos(a)) * (0.97 + r() * 0.05);
    const x = cos(a) * rx * k;
    const y = sin(a) * ry * k;
    pts.push([cx + x * cos(rot) - y * sin(rot), min(0, cy + x * sin(rot) + y * cos(rot))]);
  }
  return pts;
};

export const beads = (ctx: Ctx, x: number, y: number, w: number): void => {
  flat(ctx, x, y, w, 3, "#6c4824", CLINE);
  if (simple()) return;
  for (let px = x + 2; px < x + w - 1; px += 4) flat(ctx, px, y + 0.8, 1.6, 1.4, px % 8 < 4 ? BRASS[3] : "#c87830");
};

export const blobPts = (cx: number, cy: number, rx: number, ry: number, seed: number, n = 9, jag = 0.18): Pt[] => {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2;
    const k = 1 - jag + r() * jag * 2;
    pts.push([cx + cos(a) * rx * k, cy + sin(a) * ry * k]);
  }
  return pts;
};

export const stone = (ctx: Ctx, cx: number, cy: number, rx: number, ry: number, seed: number, tones: readonly string[] = STONE): void => {
  const pts = blobPts(cx, cy, rx, ry, seed);
  shape(ctx, pts, tones[1] as string);
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  shape(ctx, blobPts(cx - rx * 0.14, cy - ry * 0.2, rx * 0.78, ry * 0.66, seed + 1), tones[2] as string);
  if (!simple()) shape(ctx, blobPts(cx - rx * 0.34, cy - ry * 0.46, rx * 0.34, ry * 0.24, seed + 2, 7), tones[3] as string);
  flat(ctx, cx - rx * 1.2, cy + ry * 0.52, rx * 2.4, ry, tones[0] as string);
  ctx.restore();
  path(ctx, pts);
  stroke(ctx, SLINE);
};

export const mossCap = (ctx: Ctx, x: number, y: number, w: number, seed: number, depth = 3): void => {
  const r = rng(seed);
  const pts: Pt[] = [[x, y + 0.6]];
  for (let px = x; px < x + w; px += 2 + r() * 3) pts.push([px, y - r() * 1.4]);
  pts.push([x + w, y]);
  for (let px = x + w; px > x; px -= 2 + r() * 3) pts.push([px, y + 0.8 + r() * depth]);
  shape(ctx, pts, MOSS[2], MOSS[0]);
  if (!simple()) for (let px = x + r() * 4; px < x + w; px += 3 + r() * 5) flat(ctx, px, y - 0.6, 1.2, 1, MOSS[3]);
};

export const leafBlob = (ctx: Ctx, cx: number, cy: number, rx: number, ry: number, seed: number, tones: readonly string[] = LEAF): void => {
  const r = rng(seed);
  const n = simple() ? 3 : 7;
  for (let i = 0; i < n; i++) {
    const a = r() * PI * 2;
    const d = r() * 0.55;
    shape(ctx, blobPts(cx + cos(a) * rx * d, cy + sin(a) * ry * d, rx * (0.45 + r() * 0.3), ry * (0.45 + r() * 0.3), seed + i * 7, 8, 0.3), tones[i % 2 ? 1 : 2] as string);
  }
  if (!simple()) for (let i = 0; i < 4; i++) shape(ctx, blobPts(cx - rx * 0.3 + r() * rx * 0.6, cy - ry * 0.4 + r() * ry * 0.3, rx * 0.2, ry * 0.15, seed + 90 + i, 6, 0.3), tones[3] as string);
};

export const frond = (ctx: Ctx, x: number, y: number, len: number, angle: number, seed: number, tones: readonly string[] = LEAF): void => {
  const r = rng(seed);
  const tip: Pt = [x + cos(angle) * len, y + sin(angle) * len];
  const mid: Pt = [x + cos(angle) * len * 0.5, y + sin(angle) * len * 0.5 - len * 0.18];
  curve(ctx, [[x, y], mid, tip], tones[1] as string, 1.1);
  if (simple()) return;
  for (let k = 0.15; k < 0.95; k += 0.12) {
    const px = x + (tip[0] - x) * k;
    const py = y + (tip[1] - y) * k - sin(k * PI) * len * 0.18;
    const l = len * 0.28 * (1 - k * 0.6);
    for (const s of [-1, 1]) line(ctx, [[px, py], [px + cos(angle + s * 1.1) * l, py + sin(angle + s * 1.1) * l + l * 0.2]], tones[r() < 0.5 ? 2 : 3] as string, 0.9);
  }
};

export const fern = (ctx: Ctx, x: number, h: number, seed: number, tones: readonly string[] = LEAF): void => {
  const r = rng(seed);
  const n = simple() ? 4 : 7;
  for (let i = 0; i < n; i++) {
    const a = -PI / 2 + (i / (n - 1) - 0.5) * 2.3 + (r() - 0.5) * 0.2;
    frond(ctx, x + (r() - 0.5) * 3, 0, h * (0.7 + r() * 0.4), a, seed + i * 11, tones);
  }
};

export const grass = (ctx: Ctx, x: number, w: number, h: number, seed: number): void => {
  const r = rng(seed);
  for (let px = x; px < x + w; px += simple() ? 2.4 : 1.2) {
    const l = h * (0.4 + r() * 0.6);
    line(ctx, [[px, 0], [px + (r() - 0.5) * 3, -l]], MOSS[1 + round(r() * 2)] as string, 0.8);
  }
};

export const vine = (ctx: Ctx, x: number, top: number, len: number, seed: number): void => {
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

export const slab = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number, moss = true): void => {
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

export const barredWindow = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number): void => {
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

export const bunkerBody = (ctx: Ctx, w: number, h: number, seed: number): void => {
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
  flat(ctx, -2, -h - 5, w + 4, 6, ROOF[1], CLINE);
  if (!simple()) {
    flat(ctx, -2, -h - 5, w + 4, 1.4, ROOF[3]);
    for (let x = 0; x < w; x += 3) flat(ctx, x, -h - 3.4, 1, 3.4, ROOF[0]);
  }
  flat(ctx, 0, -5, w, 5, BUNKER[0]);
};

export const bunkerGrime = (ctx: Ctx, w: number, h: number, seed: number): void => {
  const r = rng(seed);
  G.grain(ctx, G.rectRegion(ctx, 0, -h - 5, w, h + 5), seed);
  G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 0.6);
  G.drips(ctx, 0, -h + 1, w, h * 0.55, seed + 2, max(2, round(w / 16)), false);
  G.dirt(ctx, 0, -h, w, h, seed + 3, 0.35);
  G.chips(ctx, -2, -h - 4.6, w + 4, seed + 4, G.DIRT);
  mossCap(ctx, -2, -h - 5, w * (0.3 + r() * 0.4), seed + 5, 3);
  if (!simple()) for (const vx of [6 + r() * 10, w - 10 - r() * 10]) vine(ctx, vx, -h - 2, h * (0.4 + r() * 0.4), seed + round(vx));
};

export const bunkerWindows = (ctx: Ctx, w: number, h: number, from: number, to: number, seed: number, skip: Pt | null = null): void => {
  const wh = min(26, h - 34);
  for (let x = from; x + 30 <= to; x += 40) if (!skip || x + 30 < skip[0] || x > skip[1]) barredWindow(ctx, x, -h + 14, 30, wh, seed + x);
};

export const door = (ctx: Ctx, x: number, h: number, open: boolean, w = 28): void => {
  flat(ctx, x - 3, -h - 3, w + 6, h + 3, TEAL[0], CLINE);
  if (open) {
    flat(ctx, x, -h, w, h, "#060807");
    if (!simple()) {
      flat(ctx, x + 6, -h * 0.55, w - 12, 1.4, "#18201e");
      flat(ctx, x + 8, -h * 0.55 - 5, 5, 5, "#141a18");
    }
    for (const lx of [x, x + w - 5]) column(ctx, lx, -h, 5, h, TEAL, 2);
    oval(ctx, x + w / 2, -h - 1.5, 1.8, 1.8, "screen", CLINE);
    if (!simple()) glow(ctx, x + w / 2, -h - 1.5, 6, "screen", 0.4);
  } else {
    for (const lx of [x, x + w / 2]) {
      column(ctx, lx, -h, w / 2, h, TEAL, 2);
      if (simple()) continue;
      for (const y of [-h + 8, -h * 0.5, -12]) flat(ctx, lx + 2, y, w / 2 - 4, 1, TEAL[1]);
    }
    flat(ctx, x + w / 2 - 0.5, -h, 1, h, TEAL[0]);
    for (const hx of [x + w / 2 - 3.4, x + w / 2 + 1.6]) flat(ctx, hx, -h * 0.48, 1.8, 6, "m3", "mLine");
    const lx = x + 8;
    const ly = -h + 8;
    oval(ctx, lx, ly, 3.4, 3.4, RED[2], CLINE);
    line(ctx, [[lx - 1.8, ly - 1.8], [lx + 1.8, ly + 1.8]], RED[0], 0.9);
    line(ctx, [[lx + 1.8, ly - 1.8], [lx - 1.8, ly + 1.8]], RED[0], 0.9);
    if (!simple()) glow(ctx, lx, ly, 9, RED[3], 0.4);
    if (!simple()) G.rustPatch(ctx, x + w * 0.7, -14, 3, 2, 600 + x);
  }
  hazard(ctx, x, -4, w, 4, 3);
};

export const bunkerBlock = (ctx: Ctx, x: number, w: number, h: number, seed: number): void => {
  ctx.save();
  ctx.translate(x, 0);
  bunkerBody(ctx, w, h, seed);
  ctx.restore();
};

export const blockGrime = (ctx: Ctx, x: number, w: number, h: number, seed: number): void => {
  ctx.save();
  ctx.translate(x, 0);
  bunkerGrime(ctx, w, h, seed);
  ctx.restore();
};

export const stoneStack = (ctx: Ctx, x: number, w: number, h: number, seed: number): void => {
  const r = rng(seed);
  flat(ctx, x, -h + 6, w, h - 6, "#141810");
  const n = 3;
  const sh = (h - 10) / n;
  const cw = w * 0.47;
  for (const cx of [x, x + w - cw]) for (let i = 0; i < n; i++) slab(ctx, cx + (r() - 0.5) * 3, -sh * (i + 1) + 1, cw, sh - 1, seed + i * 5 + round(cx), false);
  beads(ctx, x - 2, -h + 6, w + 4);
  for (const cx of [x + w * 0.25, x + w * 0.75]) stone(ctx, cx, -h + 4, w * 0.22, 4.5, seed + 40 + round(cx));
  mossCap(ctx, x + 2, -h + 1, w * 0.6, seed + 50, 2.5);
  G.grain(ctx, G.rectRegion(ctx, x, -h, w, h), seed + 59, 0.5);
  G.dirt(ctx, x, -h, w, h, seed + 60, 0.3);
};

const signPts = (cx: number, cy: number, r: number): Pt[] => Array.from({ length: 8 }, (_, i) => [cx + cos(PI / 8 + (i * PI) / 4) * r, cy + sin(PI / 8 + (i * PI) / 4) * r] as Pt);

export const eSign = (ctx: Ctx, cx: number, cy: number, r: number, rot = 0): void => {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  shape(ctx, signPts(0, 0, r), BRASS[3], CLINE);
  const s = r / 5.5;
  flat(ctx, -2 * s, -3 * s, 1.4 * s, 6 * s, "#101010");
  for (const y of [-3, -0.7, 1.6]) flat(ctx, -2 * s, y * s, 4.4 * s, 1.4 * s, "#101010");
  if (!simple()) G.rustPatch(ctx, r * 0.5, r * 0.5, 1.4, 1, 806);
  ctx.restore();
};

export const conduit = (ctx: Ctx, pts: Pt[]): void => {
  line(ctx, pts, CLINE, 4.2, "butt");
  line(ctx, pts, CONDUIT[1], 3, "butt");
  if (!simple()) line(ctx, pts.map(([x, y]) => [x, y - 0.8] as Pt), CONDUIT[3], 0.7, "butt");
};

export const JUNGLE_IDS = [
  "flamethrowerDoor", "waterfall", "spikes", "boulder", "jeep", "cannonTurret", "distributionCabinet", "stonePuzzle", "tripwire", "mine", "canister", "cutters", "grenade", "flamethrower", "bonusPickup", "towerLift",
  "jungleSky", "farTrees", "farTowerRuin", "cobbleFill", "jungleWalkway", "caveWalkway", "plankBridge", "brassDeck", "girderColumn", "stoneParapet", "brickRuin", "caveChasm",
  "jungleBuilding", "jungleTower", "stoneStack", "coolantPipe", "rockLedges", "rockSlope", "rockDebris", "deckRailing", "fallenTree",
  "chemTank", "excavator", "caveCapsule", "rustBoiler", "helicopterWreck", "overgrownWreck", "fernBush", "logPile", "oilDrum", "rockVent", "energySign",
] as const;
