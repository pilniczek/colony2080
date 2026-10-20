import { joint, type Pose, type Tint } from "./pose";
import { clipHalf, clipPoly, flatten, roundedPath, type FlatNode, type Material, type PartNode, type PartSpec, type Pt, type RigNode, type Tone, type ToneBand } from "./tree";

export type Palette = Record<string, string>;
export type HookDraw = (ctx: CanvasRenderingContext2D, palette: Palette) => void;

export interface DrawOptions {
  palette: Palette;
  pose?: Pose;
  hooks?: Record<string, HookDraw | undefined>;
  lineW?: number;
  simple?: boolean;
}

interface DrawState {
  pose: Pose;
  hooks: Record<string, HookDraw | undefined>;
  lineW: number;
  simple: boolean;
}

const MAT: Record<Material, [string, string, string, string, string]> = {
  armor: ["a0", "a1", "a2", "a3", "aLine"],
  metal: ["m0", "m1", "m2", "m3", "mLine"],
  chrome: ["c0", "c1", "c2", "c3", "mLine"],
};

const partPath = (node: PartNode | FlatNode): Path2D => {
  if (!node.path) node.path = new Path2D(roundedPath(node.k === "part" ? node.spec.pts : node.pts, node.r));
  return node.path;
};

type Stripe = [Tone, number, number];
type Shaded = Exclude<PartSpec["shade"], "none" | "dome" | undefined>;

const BOX_STRIPES: Stripe[] = [[2, -Infinity, 0.355], [0, 0.805, Infinity]];

const STRIPES: Record<Shaded, Record<"full" | "simple", Stripe[]>> = {
  box: { full: BOX_STRIPES, simple: BOX_STRIPES },
  cyl: {
    full: [[2, -Infinity, 0.3], [3, 0.12, 0.2], [0, 0.75, Infinity]],
    simple: [[2, -Infinity, 0.3], [0, 0.75, Infinity]],
  },
  hcyl: {
    full: [[2, -Infinity, 0.32], [3, 0.14, 0.22], [0, 0.72, Infinity]],
    simple: [[2, -Infinity, 0.32], [0, 0.72, Infinity]],
  },
};

const DOME_STEPS = 48;

const ring = (cx: number, cy: number, rx: number, ry: number, steps: number): Pt[] =>
  Array.from({ length: steps }, (_, i): Pt => [cx + rx * Math.cos((i * 2 * Math.PI) / steps), cy + ry * Math.sin((i * 2 * Math.PI) / steps)]);

const along = (shade: Shaded, [x0, y0, x1, y1]: PartNode["box"]): ((p: Pt) => number) => {
  const w = x1 - x0;
  const h = y1 - y0;
  if (shade === "cyl") return (p) => (p[0] - x0) / w;
  if (shade === "hcyl") return (p) => (p[1] - y0) / h;
  const a = (0.09 * w) / h;
  const c = w / (1 + a * a);
  const len = c * c * (1 + a * a);
  return (p) => ((p[0] - x0) * c + (p[1] - y0) * c * a) / len;
};

const stripe = (poly: Pt[], t: (p: Pt) => number, lo: number, hi: number): Pt[] => {
  const above = lo === -Infinity ? poly : clipHalf(poly, (p) => t(p) - lo);
  return hi === Infinity ? above : clipHalf(above, (p) => hi - t(p));
};

const bottomBand = (poly: Pt[], [x0, y0, x1, y1]: PartNode["box"]): Pt[] => {
  const w = x1 - x0;
  const h = y1 - y0;
  const b = (0.04 * h) / w;
  const c = h / (1 + b * b);
  const dx = -c * b;
  const dy = c;
  const cut = 0.88 * (dx * dx + dy * dy);
  return clipHalf(poly, (p) => (p[0] - x0) * dx + (p[1] - y0) * dy - cut);
};

const highlight = (shade: PartSpec["shade"], [x0, y0, x1, y1]: PartNode["box"]): Pt[] | null => {
  const w = x1 - x0;
  const h = y1 - y0;
  if (shade === "dome") return ring(x0 + w * 0.3, y0 + h * 0.26, w * 0.09, h * 0.06, 24);
  if (shade !== "box" || w <= 24 || h <= 24) return null;
  return [
    [x0 + w * 0.1, y0 + h * 0.08],
    [x0 + w * 0.22, y0 + h * 0.08],
    [x0 + w * 0.15, y0 + h * 0.4],
    [x0 + w * 0.06, y0 + h * 0.4],
  ];
};

const toneShapes = (node: PartNode, simple: boolean): [Tone, Pt[]][] => {
  const shade = node.spec.shade ?? "box";
  if (shade === "none") return [];
  const poly = flatten(node.spec.pts, node.r);
  const [x0, y0, x1, y1] = node.box;
  const w = x1 - x0;
  const h = y1 - y0;
  const shapes: [Tone, Pt[]][] =
    shade === "dome"
      ? [
          [1, clipPoly(poly, ring(x0 + w * 0.44, y0 + h * 0.44, w * 0.5, h * 0.5, DOME_STEPS))],
          [2, clipPoly(poly, ring(x0 + w * 0.36, y0 + h * 0.34, w * 0.29, h * 0.29, DOME_STEPS))],
        ]
      : STRIPES[shade][simple ? "simple" : "full"].map(([tone, lo, hi]): [Tone, Pt[]] => [tone, stripe(poly, along(shade, node.box), lo, hi)]);
  if (simple) return shapes;
  if (shade === "box") shapes.push([0, bottomBand(poly, node.box)]);
  const hl = highlight(shade, node.box);
  if (hl) shapes.push([3, clipPoly(poly, hl)]);
  return shapes;
};

const tonePaths = (shapes: [Tone, Pt[]][]): ToneBand[] => {
  const merged: [Tone, Pt[][]][] = [];
  for (const [tone, pts] of shapes) {
    if (pts.length < 3) continue;
    const last = merged[merged.length - 1];
    if (last && last[0] === tone) last[1].push(pts);
    else merged.push([tone, [pts]]);
  }
  return merged.map(([tone, polys]): ToneBand => [tone, new Path2D(polys.map((pts) => "M" + pts.map((p) => p.join(",")).join("L") + "Z").join(""))]);
};

const shadeBands = (node: PartNode, simple: boolean): ToneBand[] => {
  node.tones ??= {};
  return (node.tones[simple ? "simple" : "full"] ??= tonePaths(toneShapes(node, simple)));
};

const unitScale = ({ a, b, c, d }: { a: number; b: number; c: number; d: number }): number => Math.sqrt(Math.abs(a * d - b * c));

const drawPart = (ctx: CanvasRenderingContext2D, node: PartNode, pal: Palette, lineW: number, simple: boolean): void => {
  const { mat = "armor", shade = "box", line = true, lw = 1 } = node.spec;
  const [c0, c1, c2, c3, cl] = MAT[mat].map((k) => pal[k] as string) as [string, string, string, string, string];
  const tones = [c0, c1, c2, c3];
  const path = partPath(node);
  ctx.fillStyle = shade === "dome" ? c0 : c1;
  ctx.fill(path);
  for (const [tone, band] of shadeBands(node, simple)) {
    ctx.fillStyle = tones[tone] as string;
    ctx.fill(band);
  }
  if (line && lineW) {
    ctx.strokeStyle = cl;
    ctx.lineJoin = "round";
    ctx.lineWidth = lineW * lw;
    ctx.stroke(path);
  }
};

const drawTrefoil = (ctx: CanvasRenderingContext2D, r: number, pal: Palette, lineW: number, outer: number): void => {
  ctx.fillStyle = pal.badge as string;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  if (lineW) {
    ctx.strokeStyle = pal.aLine as string;
    ctx.lineWidth = lineW;
    ctx.stroke();
  }
  ctx.fillStyle = pal.trefoil as string;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.17, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / 3 - Math.PI / 6;
    const a1 = a0 + Math.PI / 3;
    ctx.beginPath();
    ctx.arc(0, 0, r * outer, a0, a1);
    ctx.arc(0, 0, r * 0.3, a1, a0, true);
    ctx.fill();
  }
};

const shadeColor = (hex: string, brightness: number, saturate: number): string => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const s = saturate;
  const k = brightness;
  const out = [
    (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b,
    (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b,
    (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b,
  ].map((v) => Math.round(Math.min(255, Math.max(0, v * k)))) as [number, number, number];
  return "#" + ((1 << 24) | (out[0] << 16) | (out[1] << 8) | out[2]).toString(16).slice(1);
};

const SHADE_MEMO = 32;

const shaded = new WeakMap<Palette, Map<string, { sig: string; out: Palette }>>();

export const shade = (palette: Palette, { brightness = 1, saturate = 1 }: Tint = {}): Palette => {
  if (brightness === 1 && saturate === 1) return palette;
  let memo = shaded.get(palette);
  if (!memo) shaded.set(palette, (memo = new Map()));
  const key = brightness + "," + saturate;
  const sig = Object.values(palette).join();
  const hit = memo.get(key);
  if (hit && hit.sig === sig) return hit.out;
  const out: Palette = {};
  for (const k in palette) out[k] = shadeColor(palette[k] as string, brightness, saturate);
  if (memo.size >= SHADE_MEMO) memo.clear();
  memo.set(key, { sig, out });
  return out;
};

const drawNode = (ctx: CanvasRenderingContext2D, node: RigNode, pal: Palette, st: DrawState, unit: number): void => {
  if (node.k === "g") {
    ctx.save();
    if (node.m) ctx.transform(node.m.a, node.m.b, node.m.c, node.m.d, node.m.e, node.m.f);
    const dimmed = node.dim ? shade(pal, { brightness: node.dim }) : pal;
    const j = joint(node, st.pose);
    const p = j?.tint ? shade(dimmed, j.tint) : dimmed;
    if (j) {
      ctx.translate(j.dx + j.pivot[0], j.dy + j.pivot[1]);
      ctx.rotate((j.rot * Math.PI) / 180);
      ctx.scale(j.sx, j.sy);
      ctx.translate(-j.pivot[0], -j.pivot[1]);
    }
    const inner = unit * (node.m ? unitScale(node.m) : 1) * (j ? Math.sqrt(Math.abs(j.sx * j.sy)) : 1);
    for (const kid of node.kids) drawNode(ctx, kid, p, st, inner);
    ctx.restore();
  } else if (node.k === "part") {
    drawPart(ctx, node, pal, st.lineW / unit, st.simple);
  } else if (node.k === "flat") {
    ctx.fillStyle = pal[node.fill] || node.fill;
    ctx.fill(partPath(node));
  } else if (node.k === "ellipse") {
    ctx.save();
    ctx.globalAlpha *= node.opacity;
    ctx.fillStyle = pal[node.fill] || node.fill;
    ctx.beginPath();
    ctx.ellipse(node.cx, node.cy, node.rx, node.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (node.k === "trefoil") {
    drawTrefoil(ctx, node.r, pal, st.lineW / unit, node.outer);
  } else {
    st.hooks[node.name]?.(ctx, pal);
  }
};

export const drawRig = (ctx: CanvasRenderingContext2D, root: RigNode, { palette, pose = {}, hooks = {}, lineW = 1.4, simple = false }: DrawOptions): void =>
  drawNode(ctx, root, palette, { pose, hooks, lineW, simple }, unitScale(ctx.getTransform()));
