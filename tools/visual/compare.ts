import { drawGun, gunHook, gunSlung, holdPoses } from "../../src/game/robot/gun";
import { drawRig, type HookDraw, type Palette } from "../../src/engine/rig/draw";
import type { Pose } from "../../src/engine/rig/pose";
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

type SpikeHook = (ctx: CanvasRenderingContext2D, pal: Palette) => void;

interface SpikeGunOptions {
  pal?: Palette;
  lineW?: number;
  simple?: boolean;
}

interface SpikeGun {
  holdPoses(side: SpikeNode, front: SpikeNode): { CARRY: Pose; CARRY_FAR: Pose; FRONT_CARRY: Pose; FRONT_CARRY_R: Pose };
  draw(ctx: CanvasRenderingContext2D, opts: SpikeGunOptions): void;
  hook(ctx: CanvasRenderingContext2D, opts: SpikeGunOptions): void;
  slung(ctx: CanvasRenderingContext2D, opts: SpikeGunOptions): void;
}

interface Spike {
  buildFront(opts: Options): SpikeNode;
  buildSide(opts: Options): SpikeNode;
  buildBack(opts: Options): SpikeNode;
  render(ctx: CanvasRenderingContext2D, node: SpikeNode, opts: { pal: Palette; lineW: number; simple: boolean; pose?: Pose; hooks?: Record<string, SpikeHook> }): void;
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
    GUN: SpikeGun;
    __visualCount?: number;
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
  ["front", { rightArmFirst: true, propBehindArm: true }],
  ["side", { farLimbs: true, badge: true, propBehindArm: true }],
];

type Carry = "side" | "front" | "slung";

const carries: [View, Options, Carry][] = [
  ["side", { farLimbs: true, propBehindArm: true }, "side"],
  ["front", { rightArmFirst: true, propBehindArm: true }, "front"],
  ["back", { thumbsBehind: true, forearmsUnder: true }, "slung"],
];

const CLIMB: Pose = { armL: 149, foreL: 101, armR: -149, foreR: -140, thighR: { sy: 0.6 }, shinR: { dy: -68 } };
const GUN_ALONE_SHIFT: [number, number] = [250, 130];

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

const drawPort = (tree: GroupNode, simple: boolean, pose?: Pose, hooks?: Record<string, HookDraw>): CanvasRenderingContext2D => {
  const ctx = canvas();
  drawRig(ctx, tree, { palette: ROBOT.palette, lineW: LINE_W, simple, pose, hooks });
  return ctx;
};

interface Scene {
  spikePose?: Pose;
  portPose?: Pose;
  spikeHooks?: Record<string, SpikeHook>;
  portHooks?: Record<string, HookDraw>;
  spikeAfter?: (ctx: CanvasRenderingContext2D) => void;
  portAfter?: (ctx: CanvasRenderingContext2D) => void;
}

const gunScene = (carry: Carry, simple: boolean): Scene => {
  const spikeHold = window.GUN.holdPoses(window.XBOT.buildSide({ farLimbs: true, propBehindArm: true }), window.XBOT.buildFront({ rightArmFirst: true, propBehindArm: true }));
  const portHold = holdPoses(buildSide({ farLimbs: true, propBehindArm: true }), buildFront({ rightArmFirst: true, propBehindArm: true }));
  const spikeGun = (ctx: CanvasRenderingContext2D, pal: Palette) => window.GUN.hook(ctx, { pal, lineW: LINE_W, simple });
  const portGun: HookDraw = (ctx, pal) => gunHook(ctx, pal, { lineW: LINE_W, simple });
  if (carry === "side")
    return {
      spikePose: { ...spikeHold.CARRY, ...spikeHold.CARRY_FAR },
      portPose: { ...portHold.CARRY, ...portHold.CARRY_FAR },
      spikeHooks: { hand: spikeGun },
      portHooks: { hand: portGun },
    };
  if (carry === "front")
    return {
      spikePose: { ...spikeHold.FRONT_CARRY, ...spikeHold.FRONT_CARRY_R },
      portPose: { ...portHold.FRONT_CARRY, ...portHold.FRONT_CARRY_R },
      spikeHooks: { handL: spikeGun },
      portHooks: { handL: portGun },
    };
  return {
    spikePose: CLIMB,
    portPose: CLIMB,
    spikeAfter: (ctx) => window.GUN.slung(ctx, { pal: ROBOT.palette, lineW: LINE_W, simple }),
    portAfter: (ctx) => gunSlung(ctx, ROBOT.palette, { lineW: LINE_W, simple }),
  };
};

const report = (name: string, r: { mismatches: number; copiedDiff: number; diff: number; matrixDelta: number }, spike: HTMLCanvasElement, own: HTMLCanvasElement, out: HTMLElement): VisualResult => {
  const result = { name, ...r, pass: r.mismatches === 0 && r.copiedDiff === 0 && r.diff <= MAX_OWN_DIFF && r.matrixDelta <= MAX_MATRIX_DELTA };
  const box = document.createElement("div");
  box.className = "case";
  box.append(spike, own, document.createElement("br"), `${name} mismatches ${r.mismatches} copiedDiff ${r.copiedDiff} diff ${r.diff} matrixDelta ${r.matrixDelta}`);
  out.append(box);
  return result;
};

const runCase = (label: string, view: View, opts: Options, out: HTMLElement, scene: Scene = {}): VisualResult => {
  const spikeBuild = { front: window.XBOT.buildFront, side: window.XBOT.buildSide, back: window.XBOT.buildBack }[view];
  const spikeTree = spikeBuild(opts);
  const portTree = port[view](opts);
  const copiedTree = port[view](opts);
  copySpikeMatrices(spikeTree, copiedTree);
  const simple = !!opts.lod;
  const spike = canvas();
  window.XBOT.render(spike, spikeTree, { pal: ROBOT.palette, lineW: LINE_W, simple, pose: scene.spikePose, hooks: scene.spikeHooks });
  scene.spikeAfter?.(spike);
  const own = drawPort(portTree, simple, scene.portPose, scene.portHooks);
  scene.portAfter?.(own);
  const copied = drawPort(copiedTree, simple, scene.portPose, scene.portHooks);
  scene.portAfter?.(copied);
  const r = {
    mismatches: mismatches(spikeTree, portTree),
    copiedDiff: pixelDiff(spike, copied),
    diff: pixelDiff(spike, own),
    matrixDelta: matrixDelta(spikeTree, portTree),
  };
  return report(label, r, spike.canvas, own.canvas, out);
};

const runGunAlone = (simple: boolean, out: HTMLElement): VisualResult => {
  const spike = canvas();
  const own = canvas();
  spike.translate(...GUN_ALONE_SHIFT);
  own.translate(...GUN_ALONE_SHIFT);
  window.GUN.draw(spike, { pal: ROBOT.palette, lineW: LINE_W, simple });
  drawGun(own, { palette: ROBOT.palette, lineW: LINE_W, simple });
  const diff = pixelDiff(spike, own);
  return report(`gun alone ${JSON.stringify({ lod: simple })}`, { mismatches: 0, copiedDiff: diff, diff, matrixDelta: 0 }, spike.canvas, own.canvas, out);
};

const out = document.getElementById("out");
if (!out) throw new Error("missing #out");
const lods = [false, true];
const robotCases = views.flatMap(([view, opts]) => lods.map((lod) => (o: HTMLElement) => runCase(`${view} ${JSON.stringify({ ...opts, lod })}`, view, { ...opts, lod }, o)));
const gunCases = [
  ...lods.map((lod) => (o: HTMLElement) => runGunAlone(lod, o)),
  ...carries.flatMap(([view, opts, carry]) =>
    lods.map((lod) => (o: HTMLElement) => runCase(`gun ${carry} ${JSON.stringify({ ...opts, lod })}`, view, { ...opts, lod }, o, gunScene(carry, lod))),
  ),
];
const cases = [...robotCases, ...gunCases];
window.__visualCount = cases.length;
window.__visual = cases.map((run) => run(out));
