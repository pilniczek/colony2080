import { drawRig, type Palette } from "../../src/engine/rig/draw";
import type { GroupNode, PartSpec, RigNode } from "../../src/engine/rig/tree";
import { buildBack, buildFront, buildSide, ROBOT } from "../../src/game/robot/xbot";

interface SpikeNode {
  k: string;
  m?: DOMMatrix | null;
  name?: string;
  pivot?: [number, number];
  dim?: number;
  kids?: SpikeNode[];
  spec?: PartSpec;
  fill?: string;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  opacity?: number;
  r?: number;
  outer?: number;
}

type Options = Record<string, boolean>;

interface Spike {
  buildFront(opts: Options): SpikeNode;
  buildSide(opts: Options): SpikeNode;
  buildBack(opts: Options): SpikeNode;
  render(ctx: CanvasRenderingContext2D, node: SpikeNode, opts: { pal: Palette; lineW: number; simple: boolean }): void;
}

interface VisualResult {
  name: string;
  mismatches: number;
  copiedDiff: number;
  diff: number;
  matrixDelta: number;
  pass: boolean;
}

declare global {
  interface Window {
    XBOT: Spike;
    __visual?: VisualResult[];
  }
}

type View = "front" | "side" | "back";

const port: Record<View, (opts: Options) => GroupNode> = { front: buildFront, side: buildSide, back: buildBack };

const views: [View, Options][] = [
  ["front", {}],
  ["side", {}],
  ["side", { badge: true }],
  ["side", { farLimbs: true }],
  ["back", {}],
  ["back", { leftArmBehind: true, rightForeBehind: true }],
  ["back", { thumbsBehind: true, forearmsUnder: true }],
];

const W = 640;
const H = 780;
const LINE_W = 2.2;
const MAX_OWN_DIFF = 50;
const MAX_MATRIX_DELTA = 1e-4;
const DEFAULT_PART_R = 4;
const KEYS = ["a", "b", "c", "d", "e", "f"] as const;

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

const specFields = (spec: PartSpec | undefined) => {
  const { pts, r = DEFAULT_PART_R, mat, shade, line } = spec ?? { pts: [] };
  return [pts, r, mat, shade, line];
};

const nodeMismatch = (s: SpikeNode, p: RigNode): boolean => {
  if (s.k !== p.k) return true;
  if (p.k === "g") return (s.name ?? null) !== (p.name ?? null) || !same(s.pivot, p.pivot) || (s.dim || 0) !== (p.dim || 0) || !s.m !== !p.m || (s.kids ?? []).length !== p.kids.length;
  if (p.k === "part") return !same(specFields(s.spec), specFields(p.spec));
  if (p.k === "flat") return s.fill !== p.fill;
  if (p.k === "ellipse") return !same([s.cx, s.cy, s.rx, s.ry, s.fill, s.opacity], [p.cx, p.cy, p.rx, p.ry, p.fill, p.opacity]);
  if (p.k === "trefoil") return s.r !== p.r || s.outer !== p.outer;
  return s.name !== p.name;
};

const mismatches = (s: SpikeNode, p: RigNode): number => {
  if (nodeMismatch(s, p)) return 1;
  if (p.k !== "g") return 0;
  const kids = s.kids ?? [];
  return p.kids.reduce((n, kid, i) => n + mismatches(kids[i] as SpikeNode, kid), 0);
};

const matrixDelta = (s: SpikeNode, p: RigNode): number => {
  if (s.k !== p.k) return Infinity;
  if (p.k !== "g") return 0;
  const kids = s.kids ?? [];
  if (kids.length !== p.kids.length) return Infinity;
  const sm = s.m;
  const pm = p.m;
  if (!sm !== !pm) return Infinity;
  let d = sm && pm ? Math.max(...KEYS.map((key) => Math.abs(sm[key] - pm[key]))) : 0;
  p.kids.forEach((kid, i) => {
    d = Math.max(d, matrixDelta(kids[i] as SpikeNode, kid));
  });
  return d;
};

const copySpikeMatrices = (s: SpikeNode, p: RigNode): void => {
  if (p.k !== "g" || s.k !== "g") return;
  const sm = s.m;
  if (sm && p.m) p.m = { a: sm.a, b: sm.b, c: sm.c, d: sm.d, e: sm.e, f: sm.f };
  const kids = s.kids ?? [];
  p.kids.forEach((kid, i) => {
    const sk = kids[i];
    if (sk) copySpikeMatrices(sk, kid);
  });
};

const canvas = (): CanvasRenderingContext2D => {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("no 2d context");
  return ctx;
};

const pixelDiff = (a: CanvasRenderingContext2D, b: CanvasRenderingContext2D): number => {
  const x = a.getImageData(0, 0, W, H).data;
  const y = b.getImageData(0, 0, W, H).data;
  let n = 0;
  for (let i = 0; i < x.length; i += 4) if (x[i] !== y[i] || x[i + 1] !== y[i + 1] || x[i + 2] !== y[i + 2] || x[i + 3] !== y[i + 3]) n++;
  return n;
};

const drawPort = (tree: GroupNode, simple: boolean): CanvasRenderingContext2D => {
  const ctx = canvas();
  drawRig(ctx, tree, { palette: ROBOT.palette, lineW: LINE_W, simple });
  return ctx;
};

const runCase = (view: View, opts: Options, out: HTMLElement): VisualResult => {
  const spikeBuild = { front: window.XBOT.buildFront, side: window.XBOT.buildSide, back: window.XBOT.buildBack }[view];
  const spikeTree = spikeBuild(opts);
  const portTree = port[view](opts);
  const copiedTree = port[view](opts);
  copySpikeMatrices(spikeTree, copiedTree);
  const simple = !!opts.lod;
  const spike = canvas();
  window.XBOT.render(spike, spikeTree, { pal: ROBOT.palette, lineW: LINE_W, simple });
  const own = drawPort(portTree, simple);
  const copied = drawPort(copiedTree, simple);
  const r = {
    name: `${view} ${JSON.stringify(opts)}`,
    mismatches: mismatches(spikeTree, portTree),
    copiedDiff: pixelDiff(spike, copied),
    diff: pixelDiff(spike, own),
    matrixDelta: matrixDelta(spikeTree, portTree),
  };
  const result = { ...r, pass: r.mismatches === 0 && r.copiedDiff === 0 && r.diff <= MAX_OWN_DIFF && r.matrixDelta <= MAX_MATRIX_DELTA };
  const box = document.createElement("div");
  box.className = "case";
  box.append(spike.canvas, own.canvas, document.createElement("br"), `${result.name} mismatches ${result.mismatches} copiedDiff ${result.copiedDiff} diff ${result.diff} matrixDelta ${result.matrixDelta}`);
  out.append(box);
  return result;
};

const out = document.getElementById("out");
if (!out) throw new Error("missing #out");
window.__visual = views.flatMap(([view, opts]) => [false, true].map((lod) => runCase(view, { ...opts, lod }, out)));
