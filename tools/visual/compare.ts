import { drawRig, type Palette } from "../../src/engine/rig/draw";
import type { GroupNode, RigNode } from "../../src/engine/rig/tree";
import { buildBack, buildFront, buildSide, ROBOT } from "../../src/game/robot/xbot";

interface SpikeNode {
  k: string;
  m?: DOMMatrix | null;
  name?: string;
  kids?: SpikeNode[];
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
  diff: number;
  matrixDelta: number;
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
const KEYS = ["a", "b", "c", "d", "e", "f"] as const;

const matrixDelta = (s: SpikeNode, p: RigNode): number => {
  if (s.k !== p.k) return Infinity;
  if (p.k !== "g") return 0;
  const kids = s.kids ?? [];
  if (kids.length !== p.kids.length || (s.name ?? null) !== (p.name ?? null)) return Infinity;
  const sm = s.m;
  const pm = p.m;
  if (!sm !== !pm) return Infinity;
  let d = sm && pm ? Math.max(...KEYS.map((key) => Math.abs(sm[key] - pm[key]))) : 0;
  p.kids.forEach((kid, i) => {
    d = Math.max(d, matrixDelta(kids[i] as SpikeNode, kid));
  });
  return d;
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

const runCase = (view: View, opts: Options, out: HTMLElement): VisualResult => {
  const spikeBuild = { front: window.XBOT.buildFront, side: window.XBOT.buildSide, back: window.XBOT.buildBack }[view];
  const spikeTree = spikeBuild(opts);
  const portTree = port[view](opts);
  const simple = !!opts.lod;
  const a = canvas();
  const b = canvas();
  window.XBOT.render(a, spikeTree, { pal: ROBOT.palette, lineW: LINE_W, simple });
  drawRig(b, portTree, { palette: ROBOT.palette, lineW: LINE_W, simple });
  const result = { name: `${view} ${JSON.stringify(opts)}`, diff: pixelDiff(a, b), matrixDelta: matrixDelta(spikeTree, portTree) };
  const box = document.createElement("div");
  box.className = "case";
  box.append(a.canvas, b.canvas, document.createElement("br"), `${result.name} diff ${result.diff} matrixDelta ${result.matrixDelta}`);
  out.append(box);
  return result;
};

const out = document.getElementById("out");
if (!out) throw new Error("missing #out");
window.__visual = views.flatMap(([view, opts]) => [false, true].map((lod) => runCase(view, { ...opts, lod }, out)));
