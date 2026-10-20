import config from "@config/cutscenes/pick-controller.json";
import { sampleTrack, type TrackKey } from "../../engine/anim/keyed";
import { multiply as mul, type Mat2D } from "../../engine/math/mat2d";
import { drawRig } from "../../engine/rig/draw";
import { locate, type Pose } from "../../engine/rig/pose";
import { ASSETS, isAssetId } from "../env/assets";
import { drawAsset, PALETTE, type EnvPalette } from "../env/paint";
import { buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene, CutsceneId } from "./index";

export interface PickupConfig {
  title: string;
  camera: string;
  duration: number;
  stage: {
    item: string;
    itemState: number;
    itemFlip: boolean;
    ground: string;
    seed: number;
    blades: number;
    yaw: number;
    horizon: number;
    height: number;
    focal: number;
    inset: number;
    edge: number;
    grout: number;
    gripAt: number;
    itemOffset: number[];
    itemTilt: number;
    itemScale: number;
    shadow: number[];
    gridBox: number[];
    gridCell: number;
    panel: number[];
    panelScan: number;
    wave: number[];
    waveRate: number;
    glyphRows: number;
    glyphBox: number[];
  };
  palette: Record<string, string>;
  tracks: unknown;
}

type Point3 = [number, number, number];
type Camera = { cos: number; sin: number; pan: number };
type Blade = { u: number; v: number; h: number; lean: number; tone: number };
type Glyph = { row: number; col: number; dots: number[] };
type Robot = { k: number; m: Mat2D; pose: Pose };

const FW = 1600;
const FH = 900;
const LINE_W = 1.4;
const FULL_LINE_PX = 500;
const SHOULDER = [300, 150] as const;
const NEAR = 18;
const FAR = 46;
const GLYPH = [3, 5] as const;
const GRASS_TONES = ["grass0", "grass1", "grass2"] as const;

export const random = (seed: number): (() => number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const invert = ({ a, b, c, d, e, f }: Mat2D): Mat2D => {
  const k = a * d - b * c;
  return { a: d / k, b: -b / k, c: -c / k, d: a / k, e: (c * f - d * e) / k, f: (b * e - a * f) / k };
};

const move = (x: number, y: number): Mat2D => ({ a: 1, b: 0, c: 0, d: 1, e: x, f: y });
const turn = (deg: number): Mat2D => {
  const r = (deg * Math.PI) / 180;
  return { a: Math.cos(r), b: Math.sin(r), c: -Math.sin(r), d: Math.cos(r), e: 0, f: 0 };
};
const grow = (x: number, y: number): Mat2D => ({ a: x, b: 0, c: 0, d: y, e: 0, f: 0 });

const tinted = (pick: (key: string) => string): EnvPalette => Object.fromEntries(Object.keys(PALETTE).map((k) => [k, pick(k)]));

export function pickupFilm(id: CutsceneId, CFG: PickupConfig): Cutscene {
  const S = CFG.stage;
  const palette: Record<string, string> = { ...CFG.palette };
  const color = (key: string): string => palette[key] as string;
  const tracks = CFG.tracks as Record<string, TrackKey[]>;
  const at = (name: string, t: number): number => sampleTrack(tracks[name]!, t) as number;
  if (!isAssetId(S.item)) throw new Error(`no asset ${S.item}`);
  const item = ASSETS[S.item];
  const flashPalette = tinted(() => color("flash"));
  const scanPalette = tinted((k) => (k.endsWith("Line") ? color("panelLine") : color("panelItem")));
  const root = buildSide({ propBehindArm: true });
  const blades: Blade[] = [];
  const pick = random(S.seed);
  const yaw0 = (S.yaw * Math.PI) / 180;
  const zNear = (S.height * S.focal) / (FH - S.horizon);
  const zFar = (S.height * S.focal) / -S.horizon;
  for (let i = 0; i < S.blades; i++) {
    const z = zNear * 0.95 + pick() * (zFar - zNear * 0.95);
    const x = ((pick() - 0.5) * 2.4 * z * FW) / 2 / S.focal;
    blades.push({ u: x * Math.cos(yaw0) + z * Math.sin(yaw0), v: -x * Math.sin(yaw0) + z * Math.cos(yaw0), h: 0.12 + pick() * 0.3, lean: (pick() - 0.5) * 0.9, tone: Math.floor(pick() * 3) });
  }
  const glyphs: Glyph[] = [];
  for (let row = 0; row < S.glyphRows; row++) {
    const count = 3 + Math.floor(pick() * 6);
    for (let col = 0; col < count; col++) {
      const dots: number[] = [];
      for (let i = 0; i < GLYPH[0] * GLYPH[1]; i++) if (pick() < 0.45) dots.push(i);
      glyphs.push({ row, col, dots });
    }
  }

  const lineFor = (ctx: CanvasRenderingContext2D, k: number): number => {
    const m = ctx.getTransform();
    const robotPx = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k * ROBOT.FOOT_Y;
    return Math.min(LINE_W, Math.max(ROBOT.gameLine, (LINE_W * robotPx) / FULL_LINE_PX));
  };

  const camera = (t: number): Camera => {
    const yaw = ((S.yaw + at("yaw", t)) * Math.PI) / 180;
    return { cos: Math.cos(yaw), sin: Math.sin(yaw), pan: at("pan", t) };
  };

  const project = (cam: Camera, u: number, v: number): Point3 => {
    const x = u * cam.cos - v * cam.sin + cam.pan;
    const z = u * cam.sin + v * cam.cos;
    return [FW / 2 + (x * S.focal) / z, S.horizon + (S.height * S.focal) / z, z];
  };

  const span = (base: number, slope: number, lo: number, hi: number): [number, number] => {
    const a = (NEAR - base) / slope;
    const b = (FAR - base) / slope;
    return [Math.max(lo, Math.min(a, b)), Math.min(hi, Math.max(a, b))];
  };

  function tileLines(cam: Camera, path: Path2D, shift: number): void {
    for (let k = -30; k <= 30; k++) {
      const [v0, v1] = span((k + shift) * cam.sin, cam.cos, -10, 60);
      if (v0 >= v1) continue;
      const a = project(cam, k + shift, v0);
      const b = project(cam, k + shift, v1);
      path.moveTo(a[0], a[1]);
      path.lineTo(b[0], b[1]);
    }
    for (let k = -10; k <= 60; k++) {
      const [u0, u1] = span((k + shift) * cam.cos, cam.sin, -30, 30);
      if (u0 >= u1) continue;
      const a = project(cam, u0, k + shift);
      const b = project(cam, u1, k + shift);
      path.moveTo(a[0], a[1]);
      path.lineTo(b[0], b[1]);
    }
  }

  function drawTiles(ctx: CanvasRenderingContext2D, cam: Camera): void {
    ctx.fillStyle = color("tile");
    ctx.fillRect(0, 0, FW, FH);
    const strokes: [string, number, number][] = [["tileShade", S.inset, S.edge], ["tileLight", -S.inset, S.edge], ["grout", 0, S.grout]];
    for (const [tone, shift, width] of strokes) {
      const path = new Path2D();
      tileLines(cam, path, shift);
      ctx.strokeStyle = color(tone);
      ctx.lineWidth = width;
      ctx.stroke(path);
    }
  }

  function drawGrass(ctx: CanvasRenderingContext2D, cam: Camera): void {
    ctx.fillStyle = color("soil");
    ctx.fillRect(0, 0, FW, FH);
    const paths = [new Path2D(), new Path2D(), new Path2D()];
    for (const b of blades) {
      const [x, y, z] = project(cam, b.u, b.v);
      if (z < NEAR || x < -40 || x > FW + 40 || y < -40 || y > FH + 80) continue;
      const k = S.focal / z;
      const h = b.h * k;
      const w = 0.035 * k;
      const p = paths[b.tone]!;
      p.moveTo(x - w, y);
      p.lineTo(x + w, y);
      p.lineTo(x + b.lean * h, y - h);
      p.closePath();
    }
    GRASS_TONES.forEach((tone, i) => {
      ctx.fillStyle = color(tone);
      ctx.fill(paths[i]!);
    });
  }

  const robotAt = (t: number): Robot => {
    const k = at("robotK", t);
    return { k, m: mul(mul(move(at("robotX", t), at("robotY", t)), grow(-k, k)), move(-SHOULDER[0], -SHOULDER[1])), pose: { arm: at("arm", t), fore: at("fore", t) } };
  };

  const handAt = (robot: Robot): Mat2D => {
    const m = locate(root, "hand", robot.pose);
    if (!m) throw new Error("no hand hook");
    return mul(robot.m, m);
  };

  const itemMatrix = (t: number): Mat2D => {
    const grip = handAt(robotAt(S.gripAt));
    const [x0, y0, x1, y1] = item.box;
    const ground = mul(mul(mul(move(grip.e + S.itemOffset[0]!, grip.f + S.itemOffset[1]!), turn(S.itemTilt)), grow(S.itemFlip ? -S.itemScale : S.itemScale, S.itemScale)), move(-(x0 + x1) / 2, -(y0 + y1) / 2));
    if (t < S.gripAt) return ground;
    return mul(mul(handAt(robotAt(t)), invert(grip)), ground);
  };

  function drawItem(ctx: CanvasRenderingContext2D, t: number): void {
    const m = itemMatrix(t);
    const lift = at("shadow", t);
    if (lift > 0) {
      const grip = itemMatrix(S.gripAt);
      const [dx, dy, rx, ry] = S.shadow as [number, number, number, number];
      ctx.globalAlpha = 0.45 * lift;
      ctx.fillStyle = color("shadow");
      ctx.beginPath();
      ctx.ellipse(grip.e + dx, grip.f + dy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    drawAsset(ctx, item, { state: S.itemState, t, lines: LINE_W, palette: at("flash", t) >= 0.5 ? flashPalette : PALETTE });
    ctx.restore();
  }

  function drawRobot(ctx: CanvasRenderingContext2D, t: number): void {
    const robot = robotAt(t);
    ctx.save();
    ctx.transform(robot.m.a, robot.m.b, robot.m.c, robot.m.d, robot.m.e, robot.m.f);
    drawRig(ctx, root, { palette: ROBOT.palette, pose: robot.pose, lineW: lineFor(ctx, robot.k) });
    ctx.restore();
  }

  function drawGrid(ctx: CanvasRenderingContext2D, t: number): void {
    const wipe = at("grid", t);
    if (wipe <= 0) return;
    const [x0, y0, x1, y1] = S.gridBox as [number, number, number, number];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + 2 * (x1 - x0) * wipe, y0);
    ctx.lineTo(x0, y0 + 2 * (y1 - y0) * wipe);
    ctx.closePath();
    ctx.clip();
    ctx.beginPath();
    for (let x = x0; x <= x1 + 0.5; x += S.gridCell) {
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
    }
    for (let y = y0; y <= y1 + 0.5; y += S.gridCell) {
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
    }
    ctx.strokeStyle = color("scan");
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawPanel(ctx: CanvasRenderingContext2D, t: number): void {
    const [x, y, w, h] = S.panel as [number, number, number, number];
    ctx.fillStyle = color("panel");
    ctx.fillRect(x, y, w, h);
    ctx.beginPath();
    for (let ly = y + 14; ly < y + h; ly += 22) {
      ctx.moveTo(x, ly);
      ctx.lineTo(x + w, ly);
    }
    for (let lx = x + 20; lx < x + w; lx += 40) {
      ctx.moveTo(lx, y);
      ctx.lineTo(lx, y + h);
    }
    ctx.strokeStyle = color("panelLine");
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;
    const [ix0, iy0, ix1, iy1] = item.box;
    const k = Math.min((w * 0.6) / (ix1 - ix0), (h * 0.6) / (iy1 - iy0));
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((at("panelSpin", t) * Math.PI) / 180);
    ctx.scale(k, k);
    ctx.translate(-(ix0 + ix1) / 2, -(iy0 + iy1) / 2);
    drawAsset(ctx, item, { state: S.itemState, t, lines: 1, palette: scanPalette });
    ctx.restore();
    const scan = y + h * ((t * S.panelScan) % 1);
    ctx.fillStyle = color("panelLine");
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x, scan, w, 6);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color("panelLine");
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
  }

  function drawWave(ctx: CanvasRenderingContext2D, t: number): void {
    const [x, y, w, h] = S.wave as [number, number, number, number];
    const n = 48;
    const frame = Math.floor(t * S.waveRate);
    const noise = random(frame * 97 + 13);
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const env = Math.sin((Math.PI * i) / n) * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.7 + frame)));
      const py = y + h / 2 + (noise() - 0.5) * h * env;
      if (i) ctx.lineTo(x + (w * i) / n, py);
      else ctx.moveTo(x, py);
    }
    ctx.strokeStyle = color("scan");
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawGlyphs(ctx: CanvasRenderingContext2D, t: number): void {
    const rows = Math.floor(at("glyphs", t));
    if (rows <= 0) return;
    const [x0, y0, dot, rowH, colW] = S.glyphBox as [number, number, number, number, number];
    const p = new Path2D();
    for (const g of glyphs) {
      if (g.row >= rows) continue;
      const gx = x0 + g.col * colW;
      const gy = y0 + g.row * rowH;
      for (const i of g.dots) p.rect(gx + (i % GLYPH[0]) * dot, gy + Math.floor(i / GLYPH[0]) * dot, dot * 0.8, dot * 0.8);
    }
    ctx.fillStyle = color("scan");
    ctx.fill(p);
  }

  function render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    ctx.save();
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    const s = Math.min(w / FW, h / FH);
    ctx.translate((w - FW * s) / 2, (h - FH * s) / 2);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.rect(0, 0, FW, FH);
    ctx.clip();
    const cam = camera(t);
    if (S.ground === "tiles") drawTiles(ctx, cam);
    else drawGrass(ctx, cam);
    drawItem(ctx, t);
    drawRobot(ctx, t);
    drawGrid(ctx, t);
    drawGlyphs(ctx, t);
    drawPanel(ctx, t);
    drawWave(ctx, t);
    ctx.restore();
  }

  return { id, duration: CFG.duration, camera: CFG.camera, render };
}

export const pickController: Cutscene = pickupFilm("pickController", config);
