import { parseTransform, type Mat2D } from "../math/mat2d";

export type Pt = [number, number];
export type Box = [number, number, number, number];
export type Material = "armor" | "metal" | "chrome";
export type Shade = "box" | "dome" | "cyl" | "hcyl" | "none";

export interface PartSpec {
  pts: Pt[];
  r?: number;
  mat?: Material;
  shade?: Shade;
  line?: boolean;
  lw?: number;
}

export interface GroupNode {
  k: "g";
  m: Mat2D | null;
  name?: string;
  pivot?: Pt;
  dim?: number;
  kids: RigNode[];
}

export interface PartNode {
  k: "part";
  spec: PartSpec;
  box: Box;
  r: number;
  path?: Path2D;
  unitPath?: Path2D;
  fill?: string | CanvasGradient;
  fillKey?: string;
  band?: Path2D | null;
  hl?: Path2D | null;
}

export interface FlatNode {
  k: "flat";
  pts: Pt[];
  r: number;
  fill: string;
  path?: Path2D;
}

export interface EllipseNode {
  k: "ellipse";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  fill: string;
  opacity: number;
}

export interface TrefoilNode {
  k: "trefoil";
  r: number;
  outer: number;
}

export interface HookNode {
  k: "hook";
  name: string;
}

export type RigNode = GroupNode | PartNode | FlatNode | EllipseNode | TrefoilNode | HookNode;

export interface LodLimits {
  minThickness: number;
  minArea: number;
  minRadius: number;
}

export const roundedPath = (pts: Pt[], r: number): string => {
  if (!r) return "M" + pts.map((p) => p.join(",")).join("L") + "Z";
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const p = pts[i] as Pt;
    const a = pts[(i - 1 + n) % n] as Pt;
    const b = pts[(i + 1) % n] as Pt;
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const rr = Math.min(r, la / 2, lb / 2);
    const s = [p[0] + ((a[0] - p[0]) / la) * rr, p[1] + ((a[1] - p[1]) / la) * rr];
    const e = [p[0] + ((b[0] - p[0]) / lb) * rr, p[1] + ((b[1] - p[1]) / lb) * rr];
    d += (i ? "L" : "M") + s.join(",") + "Q" + p.join(",") + " " + e.join(",");
  }
  return d + "Z";
};

const DEFAULT_RADIUS = 4;

export const flatten = (pts: Pt[], r: number, steps = 6): Pt[] => {
  if (!r) return pts;
  const n = pts.length;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i] as Pt;
    const a = pts[(i - 1 + n) % n] as Pt;
    const b = pts[(i + 1) % n] as Pt;
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const rr = Math.min(r, la / 2, lb / 2);
    const s: Pt = [p[0] + ((a[0] - p[0]) / la) * rr, p[1] + ((a[1] - p[1]) / la) * rr];
    const e: Pt = [p[0] + ((b[0] - p[0]) / lb) * rr, p[1] + ((b[1] - p[1]) / lb) * rr];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const u = 1 - t;
      out.push([u * u * s[0] + 2 * u * t * p[0] + t * t * e[0], u * u * s[1] + 2 * u * t * p[1] + t * t * e[1]]);
    }
  }
  return out;
};

export const clipHalf = (poly: Pt[], side: (p: Pt) => number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i] as Pt;
    const q = poly[(i + 1) % poly.length] as Pt;
    const dp = side(p);
    const dq = side(q);
    if (dp >= 0) out.push(p);
    if (dp * dq < 0) {
      const t = dp / (dp - dq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
};

export const clipPoly = (poly: Pt[], convex: Pt[]): Pt[] => {
  const n = convex.length;
  const area = convex.reduce((sum, p, i) => {
    const q = convex[(i + 1) % n] as Pt;
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0);
  const sgn = Math.sign(area);
  let out = poly;
  for (let i = 0; i < n && out.length; i++) {
    const a = convex[i] as Pt;
    const b = convex[(i + 1) % n] as Pt;
    out = clipHalf(out, (p) => sgn * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])));
  }
  return out;
};

export const bbox = (pts: Pt[]): Box => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};

export const mirrorPts = (pts: Pt[], ax: number): Pt[] => pts.map(([x, y]): Pt => [2 * ax - x, y]).reverse();

export const createBuilder = (lod: LodLimits | null) => {
  const tiny = (pts: Pt[]): boolean => {
    if (!lod) return false;
    const [x0, y0, x1, y1] = bbox(pts);
    const w = x1 - x0;
    const h = y1 - y0;
    return Math.min(w, h) < lod.minThickness || w * h < lod.minArea;
  };

  const root = (): GroupNode => ({ k: "g", m: null, kids: [] });

  const G = (parent: GroupNode, tf: string | null, name?: string, pivot?: Pt, extra: { dim?: number } = {}): GroupNode => {
    const n: GroupNode = { k: "g", m: tf ? parseTransform(tf) : null, name, pivot, kids: [], ...extra };
    parent.kids.push(n);
    return n;
  };

  const P = (parent: GroupNode, spec: PartSpec): void => {
    if (tiny(spec.pts)) return;
    const r = spec.r ?? DEFAULT_RADIUS;
    parent.kids.push({ k: "part", spec, box: bbox(spec.pts), r: lod && r < lod.minRadius ? 0 : r });
  };

  const F = (parent: GroupNode, pts: Pt[], fill: string, r = 0): void => {
    if (fill !== "visor" && tiny(pts)) return;
    parent.kids.push({ k: "flat", pts, r, fill });
  };

  const E = (parent: GroupNode, cx: number, cy: number, rx: number, ry: number, fill: string, opacity = 1): void => {
    if (tiny([[cx - rx, cy - ry], [cx + rx, cy + ry]])) return;
    parent.kids.push({ k: "ellipse", cx, cy, rx, ry, fill, opacity });
  };

  const hook = (parent: GroupNode, name: string): void => {
    parent.kids.push({ k: "hook", name });
  };

  const trefoil = (parent: GroupNode, x: number, y: number, r: number, sx = 1, outer = 0.84): void => {
    G(parent, `translate(${x} ${y}) scale(${sx} 1)`).kids.push({ k: "trefoil", r, outer });
  };

  return { root, G, P, F, E, hook, trefoil, tiny };
};

export type Builder = ReturnType<typeof createBuilder>;
