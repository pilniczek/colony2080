import config from "@config/cutscenes/unlock-plasma.json";
import { sampleTrack, type TrackKey } from "../../engine/anim/keyed";
import { drawRig } from "../../engine/rig/draw";
import type { GroupNode, Pt, RigNode } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset, PALETTE as ENV_PALETTE } from "../env/paint";
import { buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";

const TRACKS = config.tracks as unknown as Record<string, TrackKey[]>;
const { width: W, height: H, grid: GRID } = config.stage;
const LOCK = config.lock;
const S = LOCK.scale;
const HAND = config.hand;
const DECODER: Pt = [LOCK.x + (LOCK.decoderAt[0]! - 11) * S, LOCK.y + (LOCK.decoderAt[1]! + 36) * S];
const HAND_HOOK: Pt = [312, 438];
const FORE_LEN = 190;
const LINE_W = 1.4;
const FULL_LINE_PX = 500;
const palette = { ...config.palette };
let lineW = LINE_W;
let forearm: GroupNode | null = null;
let speckles: [number, number, number, number, boolean][] | null = null;

const at = (name: string, t: number): number => sampleTrack(TRACKS[name]!, t) as number;

const lineFor = (ctx: CanvasRenderingContext2D): number => {
  const m = ctx.getTransform();
  const handPx = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * HAND.scale * FORE_LEN;
  return Math.min(LINE_W, Math.max(ROBOT.gameLine, (LINE_W * handPx) / FULL_LINE_PX));
};

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function poly(ctx: CanvasRenderingContext2D, pts: Pt[], color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1]);
  ctx.closePath();
  ctx.fill();
}

const random = (seed: number): (() => number) => {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const findGroup = (node: RigNode, name: string): GroupNode | null => {
  if (node.k !== "g") return null;
  if (node.name === name) return node;
  for (const kid of node.kids) {
    const hit = findGroup(kid, name);
    if (hit) return hit;
  }
  return null;
};

const makeSpeckles = (): [number, number, number, number, boolean][] => {
  const rnd = random(2080);
  return Array.from({ length: config.stage.speckles }, () => [-100 + rnd() * 1800, -100 + rnd() * 1100, 6 + rnd() * 14, 4 + rnd() * 8, rnd() < 0.5]);
};

function drawWall(ctx: CanvasRenderingContext2D): void {
  rect(ctx, -200, -200, 2000, 1300, palette.wall);
  speckles ??= makeSpeckles();
  for (const [x, y, w, h, dark] of speckles) rect(ctx, x, y, w, h, dark ? palette.speckDark : palette.speckLight);
  const x0 = LOCK.x - 11 * S;
  const y0 = LOCK.y - 14 * S;
  ctx.globalAlpha = 0.8;
  poly(ctx, [[x0 + 22 * S, y0 + 2 * S], [x0 + 34 * S, y0 + 6 * S], [x0 + 36 * S, y0 + 40 * S], [x0 + 6 * S, y0 + 42 * S], [x0 + 2 * S, y0 + 34 * S], [x0 + 22 * S, y0 + 34 * S]], palette.shadow);
  ctx.globalAlpha = 1;
}

function drawLock(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.save();
  ctx.translate(LOCK.x - 11 * S, LOCK.y + 36 * S);
  ctx.scale(S, S);
  drawAsset(ctx, ASSETS.codeLock, { state: at("open", t) >= 0.5 ? 1 : 0, lines: lineW });
  ctx.restore();
}

const decoderAt = (t: number): Pt => (at("placed", t) >= 0.5 ? DECODER : [DECODER[0] + at("carryX", t), DECODER[1] + at("carryY", t)]);

function drawDecoder(ctx: CanvasRenderingContext2D, t: number): void {
  const [x, y] = decoderAt(t);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S, S);
  drawAsset(ctx, ASSETS.decoder, { lines: lineW });
  const led = at("led", t);
  if (led > 0) {
    const glow = ctx.createRadialGradient(3.5, -6.5, 0, 3.5, -6.5, 5);
    glow.addColorStop(0, at("open", t) >= 0.5 ? ENV_PALETTE.screen! : ENV_PALETTE.neonGlow!);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.globalAlpha = 0.8 * led;
    ctx.fillStyle = glow;
    ctx.fillRect(-1.5, -11.5, 10, 10);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawHand(ctx: CanvasRenderingContext2D, t: number): void {
  forearm ??= { k: "g", m: null, kids: findGroup(buildSide(), "fore")!.kids };
  const [dx, dy] = decoderAt(t);
  ctx.save();
  ctx.translate(dx + HAND.grip[0]! + at("handX", t), dy + HAND.grip[1]! + at("handY", t));
  ctx.rotate((at("rot", t) * Math.PI) / 180);
  ctx.scale(HAND.scale, HAND.scale);
  ctx.translate(-HAND_HOOK[0], -HAND_HOOK[1]);
  drawRig(ctx, forearm, { palette: ROBOT.palette, lineW });
  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, t: number): void {
  const grid = at("grid", t);
  if (grid > 0) {
    ctx.globalAlpha = 0.75 * grid;
    for (let x = 40; x < W; x += GRID) rect(ctx, x, 0, 2, H, palette.grid);
    for (let y = 30; y < H; y += GRID) rect(ctx, 0, y, W, 2, palette.grid);
    ctx.globalAlpha = 1;
  }
  rect(ctx, 56, 40, 300, 170, palette.monitorEdge);
  rect(ctx, 62, 46, 288, 158, palette.monitor);
  rect(ctx, 130, 80, 150, 100, palette.monitorInk);
  rect(ctx, 136, 86, 138, 88, palette.monitor);
  ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 5));
  rect(ctx, 206, 100, 56, 60, at("open", t) >= 0.5 ? ENV_PALETTE.screen! : palette.monitorGlow);
  ctx.globalAlpha = 1;
  const tick = Math.floor(t * 8);
  for (let row = 0; row < 14; row++) {
    const rnd = random(row * 31 + tick);
    for (let col = 0; col < 4; col++) if (rnd() < 0.6) rect(ctx, 60 + col * 34, 260 + row * 22, 10 + rnd() * 18, 8, palette.readout);
  }
  for (let col = 0; col < 6; col++) {
    const rnd = random(col * 17 + tick);
    if (rnd() < 0.7) rect(ctx, 1300 + col * 40, 50, 14 + rnd() * 20, 10, palette.readout);
  }
}

function render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  const s = Math.min(w / W, h / H);
  ctx.translate((w - W * s) / 2, (h - H * s) / 2);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  ctx.save();
  const z = at("camZ", t);
  ctx.translate(W / 2 - at("camX", t) * z, H / 2 - at("camY", t) * z);
  ctx.scale(z, z);
  lineW = lineFor(ctx);
  drawWall(ctx);
  drawLock(ctx, t);
  drawDecoder(ctx, t);
  drawHand(ctx, t);
  ctx.restore();
  drawHud(ctx, t);
  ctx.restore();
}

export const unlockPlasma: Cutscene = { id: "unlockPlasma", duration: config.duration, camera: config.camera, render };
