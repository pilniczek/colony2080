export const TILE = 24;

export type EnvPalette = Record<string, string>;

export type Material = "rust" | "concrete" | "brick" | "steel" | "chrome" | "green" | "armor" | "yellow" | "olive" | "denim" | "jacket" | "skin" | "hair" | "boot" | "ship" | "flyerHull" | "flyerShell" | "flyerStripe" | "flyerHump" | "guardMetal" | "guardChrome" | "trooperGun";

type Tones = [string, string, string, string, string];

export interface Size {
  w?: number;
  h?: number;
  top?: number;
  py?: number;
  rung?: number;
}

export interface EnvAsset {
  id: string;
  box: [number, number, number, number];
  anim?: boolean;
  draw(ctx: CanvasRenderingContext2D, state: number, t: number, size: Size): void;
}

export interface DrawOptions {
  state?: number;
  t?: number;
  palette?: EnvPalette;
  lines?: number;
  lod?: boolean;
  size?: Size;
}

type Pt = [number, number];

export const PALETTE: EnvPalette = {
  r0: "#24160c", r1: "#4e3218", r2: "#7c5228", r3: "#b88648", rLine: "#0e0804",
  k0: "#2e2820", k1: "#5a5040", k2: "#867a62", k3: "#bcb092", kLine: "#100e0a",
  b0: "#3a1c12", b1: "#6a3420", b2: "#94502e", b3: "#c27c4e", bLine: "#140a06",
  m0: "#142427", m1: "#25393d", m2: "#3c5458", m3: "#6f878b", mLine: "#070d0e",
  c0: "#5d686c", c1: "#a3adb1", c2: "#d4dbdd", c3: "#ffffff",
  g0: "#1a2a18", g1: "#2e4a2a", g2: "#4c7040", g3: "#86a86a", gLine: "#080e08",
  a0: "#8c3c0c", a1: "#e2701a", a2: "#f5973a", a3: "#ffd2a0", aLine: "#3a1806",
  y0: "#6a5208", y1: "#c8a018", y2: "#e8c21a", y3: "#fff08a", yLine: "#2a2004",
  hazard: "#e8c21a", hazardDark: "#141414", hole: "#0c0806", glass: "#1c2a30",
  neon: "#ff3a2a", neonGlow: "#ff7a50", screen: "#3fa34a", screenOff: "#16301a",
  blood: "#5a0a08", acid: "#7ed43a", acidDark: "#2e6a12", water: "#3a7aa0", plasma: "#7ae0ff", plasmaCore: "#ffffff",
  o0: "#5c4c1e", o1: "#7b6834", o2: "#9a854c", o3: "#c0ab6d",
  den0: "#141a52", den1: "#2433a0", den2: "#3f5ad8", den3: "#7c92f0",
  jac0: "#232a22", jac1: "#414b3c", jac2: "#646f5a", jac3: "#8c967c",
  skin0: "#5a2e16", skin1: "#9a5a32", skin2: "#c98a5a", skin3: "#e8b88a",
  hair0: "#120c08", hair1: "#2a1a10", hair2: "#46301e", hair3: "#5e4630",
  boot0: "#110e0c", boot1: "#262019", boot2: "#3e352a", boot3: "#5a4e3e",
  sky0: "#2a1008", sky1: "#5a2a14", sky2: "#8a4a28", sky3: "#b8744a", skyline: "#0e0a08", skyline2: "#1e1410",
  sh0: "#0c2416", sh1: "#1c3c28", sh2: "#2c5036", sh3: "#46684a", shLine: "#060e0a",
  fh0: "#182424", fh1: "#2c3838", fh2: "#404c4c", fh3: "#586464", fhLine: "#070d0e",
  fc0: "#061204", fc1: "#0c2008", fc2: "#182414", fc3: "#2c3c24",
  fs0: "#0c3020", fs1: "#285038", fs2: "#305840", fs3: "#406c48",
  fk0: "#282420", fk1: "#3c3a34", fk2: "#545048", fk3: "#686458",
  fWindow: "#244830", fLight: "#c89a30", fLightHot: "#f0d070", fBelly: "#1c140c", fPatch: "#98a8a8",
  e0: "#202488", e1: "#4c70a0", e2: "#c4cccc", e3: "#f4f4f4", eGlow: "#6084f4",
  fire0: "#b04010", fire1: "#e88a28", fire2: "#f8d070", fire3: "#ffffff",
  gm0: "#182424", gm1: "#2c3838", gm2: "#404c4c", gm3: "#586464", gmLine: "#070d0e",
  gc0: "#445854", gc1: "#6c7c7a", gc2: "#98a8a8", gc3: "#c4cccc",
  top0: "#061204", top1: "#0c2008", top2: "#182414", top3: "#2c3c24",
  stripe0: "#163220", stripe1: "#285038", stripe2: "#305840", stripe3: "#406c48",
  light: "#c89a30", glint: "#4a7068",
  shell0: "#2c3838", shell1: "#404c4c", shell2: "#4c5858", shell3: "#586464", groove: "#202a28", band: "#304040",
  visor0: "#582404", visor1: "#78200c", visor2: "#ac2c0c", visor3: "#d8401c",
  lip0: "#808078", lip1: "#b8b8b8", lip2: "#fcfcfc", stain: "#805c38",
  visor: "#ac2c0c", visorGlow: "#ff5a30", fume: "#a8c890",
  tg0: "#241e0c", tg1: "#3c341c", tg2: "#585020", tg3: "#7c7434",
  trim: "#a08540", eye: "#d8401c", eyeGlow: "#ff5a30",
};

export const MAT: Record<Material, Tones> = {
  rust: ["r0", "r1", "r2", "r3", "rLine"],
  concrete: ["k0", "k1", "k2", "k3", "kLine"],
  brick: ["b0", "b1", "b2", "b3", "bLine"],
  steel: ["m0", "m1", "m2", "m3", "mLine"],
  chrome: ["c0", "c1", "c2", "c3", "mLine"],
  green: ["g0", "g1", "g2", "g3", "gLine"],
  armor: ["a0", "a1", "a2", "a3", "aLine"],
  yellow: ["y0", "y1", "y2", "y3", "yLine"],
  olive: ["o0", "o1", "o2", "o3", "kLine"],
  denim: ["den0", "den1", "den2", "den3", "kLine"],
  jacket: ["jac0", "jac1", "jac2", "jac3", "kLine"],
  skin: ["skin0", "skin1", "skin2", "skin3", "kLine"],
  hair: ["hair0", "hair1", "hair2", "hair3", "kLine"],
  boot: ["boot0", "boot1", "boot2", "boot3", "kLine"],
  ship: ["sh0", "sh1", "sh2", "sh3", "shLine"],
  flyerHull: ["fh0", "fh1", "fh2", "fh3", "fhLine"],
  flyerShell: ["fc0", "fc1", "fc2", "fc3", "fhLine"],
  flyerStripe: ["fs0", "fs1", "fs2", "fs3", "fhLine"],
  flyerHump: ["fk0", "fk1", "fk2", "fk3", "fhLine"],
  guardMetal: ["gm0", "gm1", "gm2", "gm3", "gmLine"],
  guardChrome: ["gc0", "gc1", "gc2", "gc3", "gmLine"],
  trooperGun: ["tg0", "tg1", "tg2", "tg3", "gmLine"],
};

let pal = PALETTE;
let lineW = 1;
let simple = false;

const matKeys = (mat: string): Tones | undefined => (MAT as Record<string, Tones | undefined>)[mat];

const rng = (seed: number): (() => number) => {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
};

const path = (ctx: CanvasRenderingContext2D, pts: Pt[]): void => {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
};

const color = (c: string): string => pal[c] || c;

export interface Shade {
  brightness: number;
  saturate: number;
}

const HEX = /^#[0-9a-f]{6}$/i;
const SHADES_KEPT = 64;

export const shadeHex = (hex: string, { brightness, saturate: s }: Shade): string => {
  if (!HEX.test(hex)) return hex;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) * brightness) as [number, number, number];
  return (
    "#" +
    [
      (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b,
      (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b,
      (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b,
    ]
      .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0"))
      .join("")
  );
};

const shadedPalettes = new WeakMap<EnvPalette, Map<string, EnvPalette>>();

const shadePalette = (base: EnvPalette, shade: Shade): EnvPalette => {
  const key = `${shade.brightness} ${shade.saturate}`;
  let known = shadedPalettes.get(base);
  if (!known || known.size > SHADES_KEPT) shadedPalettes.set(base, (known = new Map()));
  let shaded = known.get(key);
  if (!shaded) known.set(key, (shaded = Object.fromEntries(Object.entries(base).map(([name, c]) => [name, shadeHex(c, shade)]))));
  return shaded;
};

const inShade = (shade: Shade, draw: () => void): void => {
  const base = pal;
  pal = shadePalette(base, shade);
  try {
    draw();
  } finally {
    pal = base;
  }
};

const lw = (ctx: CanvasRenderingContext2D, k = 1): number => {
  const t = ctx.getTransform();
  return (lineW * k) / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
};

const tones = (mat: string): string[] => (matKeys(mat) as Tones).map((k) => pal[k] as string);

const bands = (ctx: CanvasRenderingContext2D, mat: string, tone: number, x0: number, y0: number, x1: number, y1: number): CanvasGradient => {
  const [c0, c1, c2, c3] = tones(mat) as [string, string, string, string];
  const t = [c0, c1, c2, c3];
  const top = t[Math.min(3, tone + 1)] as string;
  const mid = t[tone] as string;
  const low = t[Math.max(0, tone - 1)] as string;
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  const stops: [number, string][] = simple
    ? [[0, top], [0.25, top], [0.25, mid], [0.75, mid], [0.75, low], [1, low]]
    : [[0, top], [0.22, top], [0.22, mid], [0.72, mid], [0.72, low], [1, low]];
  for (const [at, c] of stops) g.addColorStop(at, c);
  return g;
};

const stroke = (ctx: CanvasRenderingContext2D, mat: string, k = 1): void => {
  if (!lineW) return;
  const line = matKeys(mat)?.[4];
  ctx.strokeStyle = (line !== undefined ? pal[line] : undefined) || pal[mat] || mat;
  ctx.lineJoin = "round";
  ctx.lineWidth = lw(ctx, k);
  ctx.stroke();
};

interface BoxOptions {
  vertical?: boolean;
  line?: boolean;
}

const box = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mat: string, tone = 2, { vertical = false, line = true }: BoxOptions = {}): void => {
  ctx.fillStyle = vertical ? bands(ctx, mat, tone, x, 0, x + w, 0) : bands(ctx, mat, tone, 0, y, 0, y + h);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  if (line) stroke(ctx, mat);
};

const flat = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string, line: string | null = null): void => {
  ctx.fillStyle = pal[c] || c;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  if (line) stroke(ctx, line);
};

interface PolyOptions {
  dir?: [number, number];
  line?: boolean;
}

const poly = (ctx: CanvasRenderingContext2D, pts: Pt[], mat: string, tone = 2, { dir = [0, 1], line = true }: PolyOptions = {}): void => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  ctx.fillStyle = matKeys(mat)
    ? bands(ctx, mat, tone, dir[0] ? x0 : 0, dir[1] ? y0 : 0, dir[0] ? x1 : 0, dir[1] ? y1 : 0)
    : pal[mat] || mat;
  path(ctx, pts);
  ctx.fill();
  if (line) stroke(ctx, matKeys(mat) ? mat : "mLine");
};

const cylV = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mat: string, tone = 2): void => {
  box(ctx, x, y, w, h, mat, tone, { vertical: true });
};

const cylH = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mat: string, tone = 2): void => {
  box(ctx, x, y, w, h, mat, tone);
};

const disc = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c: string, line: string | null = null): void => {
  ctx.fillStyle = pal[c] || c;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  if (line) stroke(ctx, line);
};

const rivets = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, step: number, c = "r3"): void => {
  if (simple) return;
  for (let i = x + step / 2; i < x + w; i += step) flat(ctx, i - 0.75, y - 0.75, 1.5, 1.5, c);
};

interface HazardColors {
  fill?: string;
  dark?: string;
  line?: string;
}

const hazard = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, step = 6, { fill = "hazard", dark = "hazardDark", line = "yLine" }: HazardColors = {}): void => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  flat(ctx, x, y, w, h, fill);
  ctx.fillStyle = color(dark);
  for (let i = x - h; i < x + w; i += step * 2) {
    ctx.beginPath();
    ctx.moveTo(i, y + h);
    ctx.lineTo(i + step, y + h);
    ctx.lineTo(i + step + h, y);
    ctx.lineTo(i + h, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, line);
};

const mesh = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c = "c1", step = 4): void => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = pal[c] as string;
  ctx.globalAlpha = simple ? 0.35 : 0.55;
  ctx.lineWidth = simple ? 0.5 : 0.6;
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

const truss = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mat: Material = "steel", bar = 2.5): void => {
  const vertical = h > w;
  const n = Math.max(1, Math.round(vertical ? h / w : w / h));
  ctx.save();
  ctx.lineCap = "square";
  const c1 = tones(mat)[1] as string;
  const diag = (ax: number, ay: number, bx: number, by: number): void => {
    ctx.strokeStyle = pal[MAT[mat][4]] as string;
    ctx.lineWidth = bar + lw(ctx) * 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.strokeStyle = c1;
    ctx.lineWidth = bar;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  };
  for (let i = 0; i < n; i++) {
    if (vertical) {
      const s = h / n;
      const yy = y + i * s;
      diag(x, yy, x + w, yy + s);
      diag(x + w, yy, x, yy + s);
    } else {
      const s = w / n;
      const xx = x + i * s;
      diag(xx, y, xx + s, y + h);
      diag(xx, y + h, xx + s, y);
    }
  }
  ctx.restore();
  if (vertical) {
    box(ctx, x - bar / 2, y, bar * 1.4, h, mat, 2, { vertical: true });
    box(ctx, x + w - bar / 2, y, bar * 1.4, h, mat, 2, { vertical: true });
  } else {
    box(ctx, x, y - bar / 2, w, bar * 1.4, mat, 2);
    box(ctx, x, y + h - bar / 2, w, bar * 1.4, mat, 2);
  }
};

const trefoil = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void => {
  disc(ctx, cx, cy, r, "hazard", "yLine");
  ctx.fillStyle = pal.hazardDark as string;
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r * 0.84, a - Math.PI / 6, a + Math.PI / 6);
    ctx.closePath();
    ctx.fill();
  }
  disc(ctx, cx, cy, r * 0.2, "hazard");
  disc(ctx, cx, cy, r * 0.12, "hazardDark");
};

const slab = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mat = "concrete", tone = 2): void => {
  const t = tones(mat);
  const e = Math.min(2, h / 4);
  const s = Math.min(3, h / 4);
  flat(ctx, x, y, w, h, t[tone] as string);
  flat(ctx, x, y, w, e, t[Math.min(3, tone + 1)] as string);
  flat(ctx, x, y + h - s, w, s, t[Math.max(0, tone - 1)] as string);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, mat);
};

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

const curve = (ctx: CanvasRenderingContext2D, pts: Pt[], c: string, w: number): void => {
  ctx.strokeStyle = color(c);
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  const [first] = pts as [Pt];
  ctx.moveTo(first[0], first[1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i] as Pt;
    const q = pts[i + 1] as Pt;
    ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  const last = pts[pts.length - 1] as Pt;
  ctx.lineTo(last[0], last[1]);
  ctx.stroke();
};

const beam = (ctx: CanvasRenderingContext2D, a: Pt, b: Pt, w: number, mat: string): void => {
  const [, c1, c2, , edge] = tones(mat) as [string, string, string, string, string];
  line(ctx, [a, b], edge, w + 1, "butt");
  line(ctx, [a, b], c1, w, "butt");
  line(ctx, [a, b], c2, w * 0.35, "butt");
};

const glow = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c: string, alpha = 0.5): void => {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, pal[c] || c);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const text = (ctx: CanvasRenderingContext2D, str: string, x: number, y: number, size: number, c: string, align: CanvasTextAlign = "center"): void => {
  ctx.fillStyle = pal[c] || c;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(str, x, y);
};

export const drawAsset = (ctx: CanvasRenderingContext2D, asset: EnvAsset, { state, t = 0, palette = PALETTE, lines = 1, lod = false, size }: DrawOptions = {}): void => {
  pal = palette;
  lineW = lines;
  simple = lod;
  ctx.save();
  asset.draw(ctx, state ?? 0, t, size ?? {});
  ctx.restore();
};

export const P = {
  rng, path, color, box, flat, poly, cylV, cylH, disc, rivets, hazard, mesh, truss, trefoil, glow, text, stroke, tones, lw, shape, line, curve, beam, slab, inShade,
  simple: (): boolean => simple,
  pal: (): EnvPalette => pal,
};
