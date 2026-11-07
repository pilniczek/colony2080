import { BEAM_FRAMES, drawBeam } from "../../src/game/render/beam";
import { drawEBlaster, eblasterHook } from "../../src/game/robot/eblaster";
import { drawToaster, TOASTER_WEAPON, toasterHook } from "../../src/game/robot/toaster";
import { drawToasterShot, drawToasterSight } from "../../src/game/render/toasterShot";
import { drawFlamethrower, FLAMETHROWER_WEAPON, flamethrowerHook } from "../../src/game/robot/flamethrower";
import { drawFlame, drawFlameStream } from "../../src/game/render/flameShot";
import { drawGun, frontBarrel, GUN_WEAPON, gunHook, holdPoses } from "../../src/game/robot/gun";
import { drawRig, type HookDraw, type Palette } from "../../src/engine/rig/draw";
import type { Pose } from "../../src/engine/rig/pose";
import type { GroupNode, PartSpec, RigNode } from "../../src/engine/rig/tree";
import { drawAsset, type EnvAsset, type Size } from "../../src/game/env/paint";
import { assetList } from "../../src/game/env/assets";
import { buildBack, buildFront, buildSide, ROBOT } from "../../src/game/robot/xbot";
import { CUTSCENE_IDS, loadFilms, type Cutscene, type CutsceneId } from "../../src/game/cutscene";
import { drawSecurityCam } from "../../src/game/cutscene/securityCam";
import { drawRobotView } from "../../src/game/cutscene/robotView";

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
  barrel?: number;
}

interface SpikeGun {
  holdPoses(side: SpikeNode, front: SpikeNode): { CARRY: Pose; CARRY_FAR: Pose; FRONT_CARRY: Pose; FRONT_CARRY_R: Pose; FRONT_BARREL: number };
  draw(ctx: CanvasRenderingContext2D, opts: SpikeGunOptions): void;
  hook(ctx: CanvasRenderingContext2D, opts: SpikeGunOptions): void;
}

interface SpikeEBlaster extends SpikeGun {
  beam(ctx: CanvasRenderingContext2D, length: number, frame: number, seed: number): void;
}

interface SpikeToaster extends SpikeGun {
  shot(ctx: CanvasRenderingContext2D, length: number, tick: number, simple?: boolean): void;
  sight(ctx: CanvasRenderingContext2D, firing?: boolean, simple?: boolean): void;
}

interface SpikeFlamethrower extends SpikeGun {
  flame(ctx: CanvasRenderingContext2D, age: number, seed: number, simple?: boolean): void;
  stream(ctx: CanvasRenderingContext2D, tick: number, simple?: boolean): void;
}

interface SpikeEnvAsset {
  id: string;
  box: [number, number, number, number];
}

interface SpikeEnv {
  ASSETS: SpikeEnvAsset[];
  draw(ctx: CanvasRenderingContext2D, asset: SpikeEnvAsset, opts: { state?: number; t?: number; lines?: number; lod?: boolean; size?: Size }): void;
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
    EBLASTER: SpikeEBlaster;
    TOASTER: SpikeToaster;
    FLAMETHROWER: SpikeFlamethrower;
    ENV: SpikeEnv;
    CUTSCENES: Record<CutsceneId, { duration: number; camera: string; render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void }> & {
      securityCam(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, label: string): void;
    };
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
  ["back", { enemy: true }],
  ["front", { rightArmFirst: true, propBehindArm: true }],
  ["side", { farLimbs: true, badge: true, propBehindArm: true }],
  ["front", { rightArmFirst: true, propBehindArm: true, enemy: true }],
  ["side", { farLimbs: true, badge: true, propBehindArm: true, enemy: true }],
];

type Carry = "side" | "front";
type WeaponKind = "gun" | "eblaster" | "toaster" | "flamethrower";

const carries: [View, Options, Carry][] = [
  ["side", { farLimbs: true, propBehindArm: true }, "side"],
  ["front", { rightArmFirst: true, propBehindArm: true }, "front"],
];

const HIT_TINT = { brightness: 1.6, saturate: 2 };
const HIT: Pose = { head: { rot: -16, tint: HIT_TINT }, chest: { tint: HIT_TINT } };
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
  const { pts, r = DEFAULT_PART_R, mat, shade, line, lw } = spec ?? { pts: [] };
  return [pts, r, mat, shade, line, lw];
};

const nodeMismatch = (s: SpikeNode, p: RigNode): boolean => {
  if (s.k !== p.k) return true;
  if (p.k === "g") return (s.name ?? null) !== (p.name ?? null) || !same(s.pivot, p.pivot) || (s.dim || 0) !== (p.dim || 0) || !s.m !== !p.m || (s.kids ?? []).length !== p.kids.length;
  if (p.k === "part") return !same(specFields(s.spec), specFields(p.spec)) || s.r !== p.r;
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
}

const weaponDraws = {
  gun: { spike: () => window.GUN, hook: gunHook, draw: drawGun },
  eblaster: { spike: () => window.EBLASTER, hook: eblasterHook, draw: drawEBlaster },
  toaster: { spike: () => window.TOASTER, hook: toasterHook, draw: drawToaster },
  flamethrower: { spike: () => window.FLAMETHROWER, hook: flamethrowerHook, draw: drawFlamethrower },
};

const holdsOf = { gun: { spike: () => window.GUN, weapon: GUN_WEAPON }, eblaster: { spike: () => window.EBLASTER, weapon: GUN_WEAPON }, toaster: { spike: () => window.TOASTER, weapon: TOASTER_WEAPON }, flamethrower: { spike: () => window.FLAMETHROWER, weapon: FLAMETHROWER_WEAPON } };

const gunScene = (carry: Carry, simple: boolean, kind: WeaponKind = "gun"): Scene => {
  const weapon = weaponDraws[kind];
  const holds = holdsOf[kind];
  const spikeHold = holds.spike().holdPoses(window.XBOT.buildSide({ farLimbs: true, propBehindArm: true }), window.XBOT.buildFront({ rightArmFirst: true, propBehindArm: true }));
  const portHold = holdPoses(buildSide({ farLimbs: true, propBehindArm: true }), buildFront({ rightArmFirst: true, propBehindArm: true }));
  const barrel = carry === "front" ? spikeHold.FRONT_BARREL : undefined;
  const spikeGun = (ctx: CanvasRenderingContext2D, pal: Palette) => weapon.spike().hook(ctx, { pal, lineW: LINE_W, simple, barrel });
  const portGun: HookDraw = (ctx, pal) => weapon.hook(ctx, pal, { lineW: LINE_W, simple, barrel });
  if (carry === "side")
    return {
      spikePose: { ...spikeHold.CARRY, ...spikeHold.CARRY_FAR },
      portPose: { ...portHold.CARRY, ...portHold.CARRY_FAR },
      spikeHooks: { hand: spikeGun },
      portHooks: { hand: portGun },
    };
  return {
    spikePose: { ...spikeHold.FRONT_CARRY, ...spikeHold.FRONT_CARRY_R },
    portPose: { ...portHold.FRONT_CARRY, ...portHold.FRONT_CARRY_R },
    spikeHooks: { handL: spikeGun },
    portHooks: { handL: portGun },
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
  const own = drawPort(portTree, simple, scene.portPose, scene.portHooks);
  const copied = drawPort(copiedTree, simple, scene.portPose, scene.portHooks);
  const r = {
    mismatches: mismatches(spikeTree, portTree),
    copiedDiff: pixelDiff(spike, copied),
    diff: pixelDiff(spike, own),
    matrixDelta: matrixDelta(spikeTree, portTree),
  };
  return report(label, r, spike.canvas, own.canvas, out);
};

const runGunAlone = (simple: boolean, out: HTMLElement, kind: WeaponKind = "gun"): VisualResult => {
  const weapon = weaponDraws[kind];
  const spike = canvas();
  const own = canvas();
  spike.translate(...GUN_ALONE_SHIFT);
  own.translate(...GUN_ALONE_SHIFT);
  weapon.spike().draw(spike, { pal: ROBOT.palette, lineW: LINE_W, simple });
  weapon.draw(own, { palette: ROBOT.palette, lineW: LINE_W, simple });
  const diff = pixelDiff(spike, own);
  return report(`${kind} alone ${JSON.stringify({ lod: simple })}`, { mismatches: 0, copiedDiff: diff, diff, matrixDelta: 0 }, spike.canvas, own.canvas, out);
};

const BEAM_LENGTH = 216;
const BEAM_SEEDS = [1, 2];
const BEAM_SHIFT: [number, number] = [20, 20];

const runBeam = (frame: number, seed: number, out: HTMLElement): VisualResult => {
  const spike = canvas();
  const own = canvas();
  spike.translate(...BEAM_SHIFT);
  own.translate(...BEAM_SHIFT);
  window.EBLASTER.beam(spike, BEAM_LENGTH, frame, seed);
  drawBeam(own, BEAM_LENGTH, frame, seed);
  const diff = pixelDiff(spike, own);
  return report(`beam ${JSON.stringify({ frame, seed })}`, { mismatches: 0, copiedDiff: diff, diff, matrixDelta: 0 }, spike.canvas, own.canvas, out);
};

const runShot = (tick: number, simple: boolean, out: HTMLElement): VisualResult => {
  const spike = canvas();
  const own = canvas();
  spike.translate(...BEAM_SHIFT);
  own.translate(...BEAM_SHIFT);
  window.TOASTER.shot(spike, BEAM_LENGTH, tick, simple);
  drawToasterShot(own, BEAM_LENGTH, tick, simple);
  const diff = pixelDiff(spike, own);
  return report(`toaster shot ${JSON.stringify({ tick, lod: simple })}`, { mismatches: 0, copiedDiff: diff, diff, matrixDelta: 0 }, spike.canvas, own.canvas, out);
};

const runSight = (firing: boolean, simple: boolean, out: HTMLElement): VisualResult => {
  const spike = canvas();
  const own = canvas();
  for (const c of [spike, own]) {
    c.translate(...BEAM_SHIFT);
    c.translate(40, 0);
    c.scale(4, 4);
  }
  window.TOASTER.sight(spike, firing, simple);
  drawToasterSight(own, firing, simple);
  const diff = pixelDiff(spike, own);
  return report(`toaster sight ${JSON.stringify({ firing, lod: simple })}`, { mismatches: 0, copiedDiff: diff, diff, matrixDelta: 0 }, spike.canvas, own.canvas, out);
};

const runFlame = (age: number, seed: number, simple: boolean, out: HTMLElement): VisualResult => {
  const spike = canvas();
  const own = canvas();
  for (const c of [spike, own]) {
    c.translate(...BEAM_SHIFT);
    c.translate(20, 20);
    c.scale(3, 3);
  }
  window.FLAMETHROWER.flame(spike, age, seed, simple);
  drawFlame(own, age, seed, simple);
  const diff = pixelDiff(spike, own);
  return report(`flame ${JSON.stringify({ age, seed, lod: simple })}`, { mismatches: 0, copiedDiff: diff, diff, matrixDelta: 0 }, spike.canvas, own.canvas, out);
};

const runFlameStream = (tick: number, simple: boolean, out: HTMLElement): VisualResult => {
  const spike = canvas();
  const own = canvas();
  spike.translate(...BEAM_SHIFT);
  own.translate(...BEAM_SHIFT);
  window.FLAMETHROWER.stream(spike, tick, simple);
  drawFlameStream(own, tick, simple);
  const diff = pixelDiff(spike, own);
  return report(`flame stream ${JSON.stringify({ tick, lod: simple })}`, { mismatches: 0, copiedDiff: diff, diff, matrixDelta: 0 }, spike.canvas, own.canvas, out);
};

const runFrontBarrel = (kind: WeaponKind, lod: boolean) => (out: HTMLElement): VisualResult => {
  const { spike, weapon } = holdsOf[kind];
  const spikeBarrel = spike().holdPoses(window.XBOT.buildSide({ farLimbs: true, propBehindArm: true, lod }), window.XBOT.buildFront({ rightArmFirst: true, propBehindArm: true, lod })).FRONT_BARREL;
  const front = buildFront({ rightArmFirst: true, propBehindArm: true, lod });
  const port = frontBarrel(front, holdPoses(buildSide({ farLimbs: true, propBehindArm: true, lod }), front), weapon);
  const mismatches = Number(port !== spikeBarrel);
  const name = `${kind} front barrel ${JSON.stringify({ lod })} spike ${spikeBarrel} port ${port}`;
  const box = document.createElement("div");
  box.className = "case";
  box.append(`${name} mismatches ${mismatches}`);
  out.append(box);
  return { name, mismatches, copiedDiff: 0, diff: 0, matrixDelta: 0, pass: mismatches === 0 };
};

const frontBarrelCases = (["gun", "eblaster", "toaster", "flamethrower"] as const).flatMap((kind) => [false, true].map((lod) => runFrontBarrel(kind, lod)));

const envAssets: EnvAsset[] = assetList;
const ENV_SCALE = 2;
const ENV_PAD = 16;
const ENV_ANIM_T = 0.7;

const runEnvCase = (id: string, state: number, lod: boolean, size: Size | undefined, out: HTMLElement, t = 0): VisualResult => {
  const spikeAsset = window.ENV.ASSETS.find((a) => a.id === id);
  const portAsset = envAssets.find((a: EnvAsset) => a.id === id);
  if (!spikeAsset || !portAsset) throw new Error(`missing env asset ${id}`);
  const [bx, by, bw, bh] = spikeAsset.box;
  const x0 = Math.min(bx, 0) - ENV_PAD;
  const y0 = Math.min(by, -(size?.h ?? 0)) - ENV_PAD;
  const x1 = Math.max(bx + bw, size?.w ?? 0) + ENV_PAD;
  const y1 = Math.max(by + bh, 24) + ENV_PAD;
  const make = (): CanvasRenderingContext2D => {
    const c = document.createElement("canvas");
    c.width = Math.ceil((x1 - x0) * ENV_SCALE);
    c.height = Math.ceil((y1 - y0) * ENV_SCALE);
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("no 2d context");
    ctx.scale(ENV_SCALE, ENV_SCALE);
    ctx.translate(-x0, -y0);
    return ctx;
  };
  const spike = make();
  const own = make();
  const opts = { state, t, lines: 1, lod, size };
  window.ENV.draw(spike, spikeAsset, opts);
  drawAsset(own, portAsset, opts);
  const a = spike.getImageData(0, 0, spike.canvas.width, spike.canvas.height).data;
  const b = own.getImageData(0, 0, own.canvas.width, own.canvas.height).data;
  let diff = 0;
  for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) diff++;
  const name = `env ${id} ${JSON.stringify({ state, lod, size, t })}`;
  const result = { name, mismatches: 0, copiedDiff: diff, diff, matrixDelta: 0, pass: diff === 0 };
  const box = document.createElement("div");
  box.className = "case";
  box.append(spike.canvas, own.canvas, document.createElement("br"), `${name} diff ${diff}`);
  out.append(box);
  return result;
};

const CUTSCENE_SIZES = [{ w: 480, h: 270 }, { w: 300, h: 300 }];
const CUTSCENES = Object.fromEntries((await loadFilms()).map((film) => [film.id, film])) as Record<CutsceneId, Cutscene>;
const CROWBAR_TS = [0, 0.5, 1.0, 1.1, 1.8, 2.6, 3.2, CUTSCENES.crowbarDoor.duration];
const FILM_SHARES = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.93, 1];
const cutsceneTimes = (id: CutsceneId): number[] => (id === "crowbarDoor" ? CROWBAR_TS : FILM_SHARES.map((k) => k * CUTSCENES[id].duration));

const runCutscene = (id: CutsceneId, t: number, size: { w: number; h: number }, filmed: boolean, out: HTMLElement): VisualResult => {
  const make = (): CanvasRenderingContext2D => {
    const canvas = document.createElement("canvas");
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("no 2d context");
    return ctx;
  };
  const spike = make();
  const own = make();
  const film = CUTSCENES[id];
  window.CUTSCENES[id].render(spike, size.w, size.h, t);
  film.render(own, size.w, size.h, t);
  if (filmed) {
    window.CUTSCENES.securityCam(spike, size.w, size.h, t, window.CUTSCENES[id].camera);
    drawSecurityCam(own, size.w, size.h, t, film.camera);
  }
  const a = spike.getImageData(0, 0, size.w, size.h).data;
  const b = own.getImageData(0, 0, size.w, size.h).data;
  let diff = 0;
  for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) diff++;
  const name = `cutscene ${id} ${JSON.stringify({ t, size, filmed })}`;
  const box = document.createElement("div");
  box.className = "case";
  box.append(spike.canvas, own.canvas, document.createElement("br"), `${name} diff ${diff}`);
  out.append(box);
  return { name, mismatches: 0, copiedDiff: 0, diff, matrixDelta: 0, pass: diff <= MAX_OWN_DIFF };
};

const runEnvCoverage = (out: HTMLElement): VisualResult => {
  const missing = window.ENV.ASSETS.filter((a) => !envAssets.some((p) => p.id === a.id)).map((a) => a.id);
  const name = `env coverage, unported: ${missing.join(", ") || "none"}`;
  const box = document.createElement("div");
  box.className = "case";
  box.append(name);
  out.append(box);
  return { name, mismatches: missing.length, copiedDiff: 0, diff: 0, matrixDelta: 0, pass: missing.length === 0 };
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
const eblasterCases = [
  ...lods.map((lod) => (o: HTMLElement) => runGunAlone(lod, o, "eblaster")),
  ...carries.flatMap(([view, opts, carry]) =>
    lods.map((lod) => (o: HTMLElement) => runCase(`eblaster ${carry} ${JSON.stringify({ ...opts, lod })}`, view, { ...opts, lod }, o, gunScene(carry, lod, "eblaster"))),
  ),
];
const toasterCases = [
  ...lods.map((lod) => (o: HTMLElement) => runGunAlone(lod, o, "toaster")),
  ...carries.flatMap(([view, opts, carry]) =>
    lods.map((lod) => (o: HTMLElement) => runCase(`toaster ${carry} ${JSON.stringify({ ...opts, lod })}`, view, { ...opts, lod }, o, gunScene(carry, lod, "toaster"))),
  ),
  ...[1, 2, 3, 6, 9, 13].flatMap((tick) => lods.map((lod) => (o: HTMLElement) => runShot(tick, lod, o))),
  ...[false, true].flatMap((firing) => lods.map((lod) => (o: HTMLElement) => runSight(firing, lod, o))),
];
const flamethrowerCases = [
  ...lods.map((lod) => (o: HTMLElement) => runGunAlone(lod, o, "flamethrower")),
  ...carries.flatMap(([view, opts, carry]) =>
    lods.map((lod) => (o: HTMLElement) => runCase(`flamethrower ${carry} ${JSON.stringify({ ...opts, lod })}`, view, { ...opts, lod }, o, gunScene(carry, lod, "flamethrower"))),
  ),
  ...[1, 8, 14, 20, 26].flatMap((age) => lods.map((lod) => (o: HTMLElement) => runFlame(age, 3, lod, o))),
  ...[0, 9, 40].flatMap((tick) => lods.map((lod) => (o: HTMLElement) => runFlameStream(tick, lod, o))),
];
const beamCases = BEAM_SEEDS.flatMap((seed) => Array.from({ length: BEAM_FRAMES }, (_, frame) => (o: HTMLElement) => runBeam(frame, seed, o)));
const hitCases = lods.map((lod) => (o: HTMLElement) => runCase(`side hit ${JSON.stringify({ lod })}`, "side", { lod }, o, { spikePose: HIT, portPose: HIT }));
const jungleStates: Record<string, number[]> = {
  flamethrowerDoor: [0, 1], waterfall: [0, 1], spikes: [0, 1], boulder: [0, 1], jeep: [0, 1, 2], cannonTurret: [0, 1, 2], distributionCabinet: [0, 1], stonePuzzle: [0, 1], tripwire: [0, 1], mine: [0, 1], canister: [0, 1, 2], flamethrower: [0, 1], bonusPickup: [0, 1], towerLift: [0, 1],
  farTrees: [0, 1], farTowerRuin: [0, 1], cobbleFill: [0, 1], jungleWalkway: [0, 1, 2], girderColumn: [0, 1], stoneParapet: [0, 1], brickRuin: [0, 1],
  jungleBuilding: [0, 1, 2, 3], stoneStack: [0, 1], coolantPipe: [0, 1, 2], rockLedges: [0, 1, 2], rockDebris: [0, 1], deckRailing: [0, 1],
  chemTank: [0, 1], overgrownWreck: [0, 1, 2], fernBush: [0, 1, 2], logPile: [0, 1], oilDrum: [0, 1], rockVent: [0, 1], energySign: [0, 1],
};
const jungleSizes: [string, Size][] = [
  ["farTrees", { w: 144, h: 192 }], ["farTowerRuin", { w: 96, h: 216 }], ["cobbleFill", { w: 96, h: 72 }], ["jungleWalkway", { w: 72 }], ["caveWalkway", { w: 72 }], ["plankBridge", { w: 72 }], ["brassDeck", { w: 72 }], ["girderColumn", { h: 96 }], ["stoneParapet", { w: 144, h: 48 }], ["brickRuin", { w: 72, h: 96 }],
  ["jungleBuilding", { w: 144, h: 96 }], ["jungleTower", { h: 192 }], ["stoneStack", { h: 72 }], ["coolantPipe", { w: 96 }], ["rockLedges", { w: 144, h: 192 }], ["rockDebris", { w: 72 }], ["deckRailing", { w: 72 }], ["waterfall", { w: 96, h: 240 }],
];
const envStates: Record<string, number[]> = { brickWall: [0, 1], stripLight: [0, 1], tunnelGate: [0, 1], skyBackground: [0, 1], barSign: [0, 1], barDoor: [0, 1], crashedShip: [0, 1, 2], lift: [0, 1, 2], wireBox: [0, 1], switchboard: [0, 1], trainDoor: [0, 1, 2], tapValveWheel: [0, 1], waterPipe: [0, 1], plasmaBarrier: [0, 1], codeLock: [0, 1], acidTank: [0, 1, 2, 3], acidGuard: [0, 1, 2], flyer: [0, 1], shootGuard: [0, 1, 2], crane: [0, 1, 2], cardDoor: [0, 1], liftPanel: [0, 1], damagedLift: [0, 1, 2], dyingRebel: [0, 1], corpse: [0, 1], crowbar: [0, 1], eBlaster: [0, 1], craneKey: [0, 2], shipPart: [0, 1, 2], controller: [0, 1], wires: [0, 1], tapHandle: [0, 1], card: [0, 1], holoPlan: [0, 1], shipPlan: [0, 1], decoder: [0, 1], sourceTeleport: [0, 1, 2], targetTeleport: [0, 1], brokenTeleport: [0, 1], fuseBox: [0, 1, 2], electricCabinet: [0, 1], cannon: [0, 1], energyBarrier: [0, 1], fireBarricade: [0, 1], dynamiteWall: [0, 1], powerBridge: [0, 1], bridgeGuardPost: [0, 1], radioGuard: [0, 1, 2], smoulderingRemains: [0, 1], smallKey: [0, 1], walkieTalkie: [0, 1], detonator: [0, 1], projectile: [0, 1], fuse: [0, 1], dynamite: [0, 1, 2], navCircuit: [0, 1], toaster: [0, 1], energyPickup: [0, 1], ammoPickup: [0, 1], shieldPickup: [0, 1], projectileCrate: [0, 1], stalactite: [0, 1, 2], crystal: [0, 1], leverBank: [0, 1, 2], leverDoor: [0, 1, 2, 3], keyDoors: [0, 1, 2], caveCardDoor: [0, 1, 2], airlock: [0, 1, 2], liftLock: [0, 1], keySlots: [0, 1, 2], stoneBlocks: [0, 1, 2], explosiveTank: [0, 1, 2], farPalms: [0, 1], farRuins: [0, 1], rivetWall: [0, 1], plankWall: [0, 1], grassyWalkway: [0, 1], villageHouse: [0, 1], stiltBuilding: [0, 1], powerHouse: [0, 1], latticeMast: [0, 1], warningLamp: [0, 1], junctionBox: [0, 1], rubbleHeap: [0, 1], militaryWreck: [0, 1, 2], fuelDrum: [0, 1, 2], sandbags: [0, 1], shellCrate: [0, 1], chainFence: [0, 1, 2, 3], pipeColumn: [0, 1], storageTank: [0, 1], farStalagmites: [0, 1], rockRibs: [0, 1], caveFloor: [0, 1], rockLedge: [0, 1], ropeColumn: [0, 1], minePipe: [0, 1], metalPillars: [0, 1, 2], safetyRail: [0, 1], caveLamp: [0, 1], explosiveSign: [0, 1], screeHeap: [0, 1], mineWreck: [0, 1], powderKeg: [0, 1, 2], toolCrate: [0, 1, 2], rod: [0, 1, 2], yellowKey: [0, 1, 2], orangeKey: [0, 1, 2], blueKey: [0, 1, 2], entryCard: [0, 1, 2], shaftHead: [0], ...jungleStates };
const envSizes: [string, Size][] = [
  ["streetWalkway", { w: 96 }],
  ["girderBridge", { w: 96 }],
  ["brickWall", { w: 24, h: 384 }],
  ["brickWall", { w: 960, h: 48 }],
  ["lift", { w: 72, top: -272, py: -120 }],
  ["liftLanding", { w: 48 }],
  ["switchboard", { top: -96 }],
  ["plasmaBarrier", { top: -144 }],
  ["cardDoor", { top: -144 }],
  ["pipeColumn", { h: 312 }],
  ["latticePylon", { h: 96 }],
  ["chainFence", { w: 72 }],
  ["mineCarts", { w: 96 }],
  ["lavaPit", { w: 24 }],
  ["chasm", { w: 48 }],
  ["farPalms", { w: 144, h: 144 }],
  ["farRuins", { w: 72, h: 120 }],
  ["crateWall", { w: 48, h: 144 }],
  ["crateWall", { w: 144, h: 48 }],
  ["rivetWall", { w: 24, h: 192 }],
  ["rivetWall", { w: 96, h: 48 }],
  ["plankWall", { w: 48, h: 192 }],
  ["grassyWalkway", { w: 72 }],
  ["steelDeckPlate", { w: 48 }],
  ["trussWalkway", { w: 96 }],
  ["villageHouse", { w: 144, h: 96 }],
  ["villageHouse", { w: 264, h: 144 }],
  ["stiltBuilding", { w: 192, h: 144 }],
  ["powerHouse", { w: 120, h: 96 }],
  ["latticeMast", { h: 96 }],
  ["pipeColumn", { h: 96 }],
  ["overheadPipeline", { w: 216 }],
  ["rockCliff", { w: 96, h: 96 }],
  ...jungleSizes,
  ["mineCarts", { w: 240 }],
  ["lavaPit", { w: 96 }],
  ["farStalagmites", { w: 96, h: 96 }],
  ["caveRock", { w: 48, h: 96, at: [24, 48] }],
  ["caveRock", { w: 96, h: 48 }],
  ["caveRock", { w: 72, h: 72, region: (c: number, r: number) => c >= 0 && c < 3 && r >= -3 && r < 0 && !(c === 2 && r === -3) }],
  ["rockRibs", { w: 144, h: 72 }],
  ["lavaFall", { w: 72, h: 96 }],
  ["caveFloor", { w: 72 }],
  ["rockLedge", { w: 48 }],
  ["ropeColumn", { h: 96 }],
  ["minePipe", { w: 96 }],
  ["metalPillars", { w: 144, h: 72 }],
  ["safetyRail", { w: 144 }],
  ["pressureTank", { h: 72 }],
  ["screeHeap", { w: 48 }],
];
const envSpecs: [string, number, boolean, Size | undefined, number][] = [
  ...envAssets.flatMap((a) => (envStates[a.id] ?? [0]).flatMap((state) => lods.map((lod): [string, number, boolean, Size | undefined, number] => [a.id, state, lod, undefined, 0]))),
  ...envSizes.flatMap(([id, size]) => lods.map((lod): [string, number, boolean, Size | undefined, number] => [id, 0, lod, size, 0])),
  ...envAssets.filter((a) => a.anim).flatMap((a) => (envStates[a.id] ?? [0]).map((state): [string, number, boolean, Size | undefined, number] => [a.id, state, false, undefined, ENV_ANIM_T])),
];
const envCaseIds = envSpecs.map(([id]) => id);
const envCases = [runEnvCoverage, ...envSpecs.map(([id, state, lod, size, t]) => (o: HTMLElement) => runEnvCase(id, state, lod, size, o, t))];
const filmParity = (id: CutsceneId): VisualResult => {
  const spike = window.CUTSCENES[id];
  const own = CUTSCENES[id];
  const pass = Math.abs(spike.duration - own.duration) < 1e-9 && spike.camera === own.camera;
  return { name: `cutscene ${id} duration and camera`, mismatches: pass ? 0 : 1, copiedDiff: 0, diff: 0, matrixDelta: 0, pass };
};
const only = new URLSearchParams(location.search).get("only")?.split(",") ?? null;
const cutsceneCases = [...CUTSCENE_IDS].filter((id) => !only || only.includes(id)).flatMap((id) => [
  () => filmParity(id),
  ...cutsceneTimes(id).map((t) => (o: HTMLElement) => runCutscene(id, t, CUTSCENE_SIZES[0]!, false, o)),
  ...CUTSCENE_SIZES.flatMap((size) => cutsceneTimes(id).map((t) => (o: HTMLElement) => runCutscene(id, t, size, true, o))),
]);
const ROBOT_VIEW_TS = [0.3, 1.0, 2.5];
const runRobotView = (t: number, size: { w: number; h: number }, out: HTMLElement): VisualResult => {
  const spikeView = (window as unknown as { ROBOT_VIEW: { draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void } }).ROBOT_VIEW;
  const make = (): CanvasRenderingContext2D => {
    const canvas = document.createElement("canvas");
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("no 2d context");
    return ctx;
  };
  const base = make();
  window.CUTSCENES.pickCrowbar.render(base, size.w, size.h, 1.2);
  const spike = make();
  const own = make();
  spike.drawImage(base.canvas, 0, 0);
  own.drawImage(base.canvas, 0, 0);
  spikeView.draw(spike, size.w, size.h, t);
  drawRobotView(own, size.w, size.h, t);
  const a = spike.getImageData(0, 0, size.w, size.h).data;
  const b = own.getImageData(0, 0, size.w, size.h).data;
  let diff = 0;
  for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) diff++;
  const name = `robot view ${JSON.stringify({ t, size })}`;
  const box = document.createElement("div");
  box.className = "case";
  box.append(spike.canvas, own.canvas, document.createElement("br"), `${name} diff ${diff}`);
  out.append(box);
  return { name, mismatches: 0, copiedDiff: 0, diff, matrixDelta: 0, pass: diff === 0 };
};
const robotViewCases = CUTSCENE_SIZES.flatMap((size) => ROBOT_VIEW_TS.map((t) => (o: HTMLElement) => runRobotView(t, size, o)));
const onlyEnv = only ? envCases.slice(1).filter((_, i) => only.includes(envCaseIds[i] ?? "")) : [];
const cases = only ? [...onlyEnv, ...cutsceneCases, ...robotViewCases] : [...robotCases, ...hitCases, ...gunCases, ...eblasterCases, ...toasterCases, ...flamethrowerCases, ...beamCases, ...frontBarrelCases, ...envCases, ...cutsceneCases, ...robotViewCases];
window.__visualCount = cases.length;
window.__visual = cases.map((run) => run(out));
