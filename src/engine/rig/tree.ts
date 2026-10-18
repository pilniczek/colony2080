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
}

export interface Highlight {
  pts?: Pt[];
  ellipse?: [number, number, number, number];
  inside?: boolean;
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
  path?: Path2D;
  unitPath?: Path2D;
  fill?: string | CanvasGradient;
  fillKey?: string;
  band?: CanvasGradient;
  bandKey?: string;
  hl?: Highlight | null;
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
    parent.kids.push({ k: "part", spec, box: bbox(spec.pts) });
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
