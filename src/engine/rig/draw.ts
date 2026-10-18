import { joint, type Pose } from "./pose";
import { roundedPath, type FlatNode, type Highlight, type Material, type PartNode, type Pt, type RigNode } from "./tree";

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

const CLEAR = "rgba(0,0,0,0)";

const bands = (g: CanvasGradient, colors: string[], stops: number[]): CanvasGradient => {
  g.addColorStop(0, colors[0] as string);
  stops.forEach((s, i) => {
    g.addColorStop(s, colors[i] as string);
    g.addColorStop(s, colors[i + 1] as string);
  });
  g.addColorStop(1, colors[colors.length - 1] as string);
  return g;
};

const partPath = (node: PartNode | FlatNode): Path2D => {
  if (!node.path) node.path = new Path2D(roundedPath(node.k === "part" ? node.spec.pts : node.pts, node.k === "part" ? (node.spec.r ?? 4) : node.r));
  return node.path;
};

const baseFill = (ctx: CanvasRenderingContext2D, node: PartNode, simple: boolean, c0: string, c1: string, c2: string, c3: string): string | CanvasGradient => {
  const key = (simple ? "s" : "f") + c0 + c1 + c2 + c3;
  if (node.fillKey === key && node.fill !== undefined) return node.fill;
  const shade = node.spec.shade ?? "box";
  const [x0, y0, x1, y1] = node.box;
  const w = x1 - x0;
  const h = y1 - y0;
  let fill: string | CanvasGradient = c1;
  if (shade === "box") {
    const a = (0.09 * w) / h;
    const c = w / (1 + a * a);
    fill = bands(ctx.createLinearGradient(x0, y0, x0 + c, y0 + c * a), [c2, c1, c0], [0.355, 0.805]);
  } else if (shade === "cyl") {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    fill = simple ? bands(g, [c2, c1, c0], [0.3, 0.75]) : bands(g, [c2, c3, c2, c1, c0], [0.12, 0.2, 0.3, 0.75]);
  } else if (shade === "hcyl") {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    fill = simple ? bands(g, [c2, c1, c0], [0.32, 0.72]) : bands(g, [c2, c3, c2, c1, c0], [0.14, 0.22, 0.32, 0.72]);
  } else if (shade === "dome") fill = bands(ctx.createRadialGradient(0.36, 0.34, 0.29, 0.44, 0.44, 0.5), [c2, c1, c0], [0, 1]);
  node.fill = fill;
  node.fillKey = key;
  return fill;
};

const bottomBand = (ctx: CanvasRenderingContext2D, node: PartNode, c0: string): CanvasGradient => {
  if (node.bandKey === c0 && node.band) return node.band;
  const [x0, y0, x1, y1] = node.box;
  const w = x1 - x0;
  const h = y1 - y0;
  const b = (0.04 * h) / w;
  const c = h / (1 + b * b);
  node.band = bands(ctx.createLinearGradient(x0, y0, x0 - c * b, y0 + c), [CLEAR, c0], [0.88]);
  node.bandKey = c0;
  return node.band;
};

const lineWidth = (ctx: CanvasRenderingContext2D, lineW: number): number => {
  const t = ctx.getTransform();
  return lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
};

const unitPath = (node: PartNode): Path2D => {
  const [x0, y0, x1, y1] = node.box;
  const p = new Path2D();
  p.addPath(partPath(node), new DOMMatrix().scale(1 / (x1 - x0), 1 / (y1 - y0)).translate(-x0, -y0));
  return p;
};

const fillUnit = (ctx: CanvasRenderingContext2D, node: PartNode): void => {
  const [x0, y0, x1, y1] = node.box;
  node.unitPath ||= unitPath(node);
  ctx.save();
  ctx.translate(x0, y0);
  ctx.scale(x1 - x0, y1 - y0);
  ctx.fill(node.unitPath);
  ctx.restore();
};

const highlight = (node: PartNode): Highlight | null => {
  const [x0, y0, x1, y1] = node.box;
  const w = x1 - x0;
  const h = y1 - y0;
  const shade = node.spec.shade ?? "box";
  if (shade === "box" && w > 24 && h > 24)
    return {
      pts: [
        [x0 + w * 0.1, y0 + h * 0.08],
        [x0 + w * 0.22, y0 + h * 0.08],
        [x0 + w * 0.15, y0 + h * 0.4],
        [x0 + w * 0.06, y0 + h * 0.4],
      ],
    };
  if (shade === "dome") return { ellipse: [x0 + w * 0.3, y0 + h * 0.26, w * 0.09, h * 0.06] };
  return null;
};

let probe: CanvasRenderingContext2D | null = null;

const insidePath = (path: Path2D, pts: Pt[]): boolean => {
  probe ||= document.createElement("canvas").getContext("2d");
  const p = probe;
  return !!p && pts.every(([x, y]) => p.isPointInPath(path, x, y));
};

const highlightSamples = ({ pts, ellipse }: Highlight): Pt[] => {
  if (pts)
    return pts.flatMap((p, i): Pt[] => {
      const q = pts[(i + 1) % pts.length] as Pt;
      return [p, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]];
    });
  const [cx, cy, rx, ry] = ellipse ?? [0, 0, 0, 0];
  return Array.from({ length: 8 }, (_, i): Pt => [cx + rx * Math.cos((i * Math.PI) / 4), cy + ry * Math.sin((i * Math.PI) / 4)]);
};

const drawHighlight = (ctx: CanvasRenderingContext2D, node: PartNode, c3: string): void => {
  const path = partPath(node);
  if (node.hl === undefined) {
    node.hl = highlight(node);
    if (node.hl) node.hl.inside = insidePath(path, highlightSamples(node.hl));
  }
  const hl = node.hl;
  if (!hl) return;
  if (!hl.inside) {
    ctx.save();
    ctx.clip(path);
  }
  ctx.fillStyle = c3;
  ctx.beginPath();
  if (hl.pts) hl.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  else if (hl.ellipse) ctx.ellipse(...hl.ellipse, 0, 0, Math.PI * 2);
  ctx.fill();
  if (!hl.inside) ctx.restore();
};

const drawPart = (ctx: CanvasRenderingContext2D, node: PartNode, pal: Palette, lineW: number, simple: boolean): void => {
  const { mat = "armor", shade = "box", line = true } = node.spec;
  const [c0, c1, c2, c3, cl] = MAT[mat].map((k) => pal[k] as string) as [string, string, string, string, string];
  const path = partPath(node);
  ctx.fillStyle = baseFill(ctx, node, simple, c0, c1, c2, c3);
  if (shade === "dome") fillUnit(ctx, node);
  else ctx.fill(path);
  if (!simple) {
    if (shade === "box") {
      ctx.fillStyle = bottomBand(ctx, node, c0);
      ctx.fill(path);
    }
    drawHighlight(ctx, node, c3);
  }
  if (line && lineW) {
    ctx.strokeStyle = cl;
    ctx.lineJoin = "round";
    ctx.lineWidth = lineWidth(ctx, lineW);
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
    ctx.lineWidth = lineWidth(ctx, lineW);
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

export const shade = (palette: Palette, { brightness = 1, saturate = 1 }: { brightness?: number; saturate?: number } = {}): Palette => {
  if (brightness === 1 && saturate === 1) return palette;
  const out: Palette = {};
  for (const k in palette) out[k] = shadeColor(palette[k] as string, brightness, saturate);
  return out;
};

const drawNode = (ctx: CanvasRenderingContext2D, node: RigNode, pal: Palette, st: DrawState): void => {
  if (node.k === "g") {
    ctx.save();
    if (node.m) ctx.transform(node.m.a, node.m.b, node.m.c, node.m.d, node.m.e, node.m.f);
    const p = node.dim ? shade(pal, { brightness: node.dim }) : pal;
    const j = joint(node, st.pose);
    if (j) {
      ctx.translate(j.dx + j.pivot[0], j.dy + j.pivot[1]);
      ctx.rotate((j.rot * Math.PI) / 180);
      ctx.scale(j.sx, j.sy);
      ctx.translate(-j.pivot[0], -j.pivot[1]);
    }
    for (const kid of node.kids) drawNode(ctx, kid, p, st);
    ctx.restore();
  } else if (node.k === "part") {
    drawPart(ctx, node, pal, st.lineW, st.simple);
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
    drawTrefoil(ctx, node.r, pal, st.lineW, node.outer);
  } else {
    st.hooks[node.name]?.(ctx, pal);
  }
};

export const drawRig = (ctx: CanvasRenderingContext2D, root: RigNode, { palette, pose = {}, hooks = {}, lineW = 2.2, simple = false }: DrawOptions): void =>
  drawNode(ctx, root, palette, { pose, hooks, lineW, simple });
