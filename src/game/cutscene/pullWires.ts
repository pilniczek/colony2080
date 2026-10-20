import config from "@config/cutscenes/pull-wires.json";
import { sampleTrack, type TrackKey } from "../../engine/anim/keyed";
import { drawRig, type HookDraw } from "../../engine/rig/draw";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset, PALETTE as ENV_PALETTE } from "../env/paint";
import { buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";

const TRACKS = config.tracks as unknown as Record<string, TrackKey[]>;
const { width: W, height: H, floorY: FLOOR, brick: BRICK, pipeX: PIPE_X } = config.stage;
const K = config.robot.scale;
const X = config.robot.x;
const BOX = config.box;
const INSET = 22 * 0.22;
const INNER = 22 - INSET * 2;
const PANEL_TOP = -40;
const STAND = { hipNear: 0, kneeNear: 2, ankleNear: -1.4, hipFar: 0, kneeFar: 2, ankleFar: -1.4 };
const LINE_W = 1.4;
const FULL_LINE_PX = 500;
const palette = { ...config.palette };
let lineW = LINE_W;
let side: GroupNode | null = null;

const at = (name: string, t: number): number => sampleTrack(TRACKS[name]!, t) as number;

const lineFor = (ctx: CanvasRenderingContext2D): number => {
  const m = ctx.getTransform();
  const robotPx = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * K * ROBOT.FOOT_Y;
  return Math.min(LINE_W, Math.max(ROBOT.gameLine, (LINE_W * robotPx) / FULL_LINE_PX));
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

function drawWall(ctx: CanvasRenderingContext2D): void {
  rect(ctx, -200, -200, 2000, 1400, palette.wall);
  for (let row = 0, y = -200; y < 1200; row++, y += BRICK.h) {
    rect(ctx, -200, y + 3, 2000, 3, palette.brickLight);
    rect(ctx, -200, y, 2000, 3, palette.brickLine);
    for (let x = -200 + ((row % 2) * BRICK.w) / 2; x < 1800; x += BRICK.w) rect(ctx, x, y, 3, BRICK.h, palette.brickLine);
  }
  rect(ctx, PIPE_X - 30, -200, 60, 1400, palette.pipeDark);
  rect(ctx, PIPE_X - 24, -200, 48, 1400, palette.pipe);
  rect(ctx, PIPE_X - 14, -200, 12, 1400, palette.pipeLight);
  for (let y = 40; y < 1200; y += 360) {
    rect(ctx, PIPE_X - 36, y, 72, 22, palette.pipeDark);
    rect(ctx, PIPE_X - 32, y + 3, 64, 8, palette.pipe);
  }
}

function drawDoor(ctx: CanvasRenderingContext2D, angle: number): void {
  const a = (angle * Math.PI) / 180;
  const x0 = INSET;
  const y0 = PANEL_TOP + INSET;
  const x1 = x0 + INNER * Math.cos(a);
  const spread = INNER * 0.18 * Math.sin(a);
  const pts: Pt[] = [[x0, y0], [x1, y0 - spread], [x1, y0 + INNER + spread], [x0, y0 + INNER]];
  ctx.lineJoin = "round";
  ctx.lineWidth = lineW / Math.sqrt(Math.abs(ctx.getTransform().a * ctx.getTransform().d));
  ctx.strokeStyle = ENV_PALETTE.gLine!;
  poly(ctx, pts, Math.cos(a) > 0 ? ENV_PALETTE.g2! : palette.doorBack);
  ctx.stroke();
  if (Math.cos(a) > 0.2) {
    const k = Math.cos(a);
    poly(ctx, [[x0 + 1.5 * k, y0 + 1.5], [x1 - 1.5 * k, y0 - spread + 1.5], [x1 - 1.5 * k, y0 + INNER + spread - 1.5], [x0 + 1.5 * k, y0 + INNER - 1.5]], ENV_PALETTE.g1!);
    ctx.fillStyle = ENV_PALETTE.c1!;
    ctx.beginPath();
    ctx.arc(x0 + (x1 - x0) * 0.82, y0 + INNER / 2, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBox(ctx: CanvasRenderingContext2D, t: number): void {
  const s = BOX.scale;
  ctx.save();
  ctx.translate(BOX.x, BOX.y - PANEL_TOP * s);
  ctx.scale(s, s);
  ctx.globalAlpha = 0.35;
  rect(ctx, 1.5, PANEL_TOP + 2.5, 22, 22, palette.shadow);
  ctx.globalAlpha = 1;
  drawAsset(ctx, ASSETS.wireBox, { state: at("torn", t) >= 0.5 ? 1 : 0, lines: lineW });
  drawDoor(ctx, at("door", t));
  ctx.restore();
}

function drawSparks(ctx: CanvasRenderingContext2D, t: number): void {
  const flash = at("flash", t);
  const arcs = at("arcs", t);
  if (flash <= 0 && arcs <= 0) return;
  const cx = BOX.x + (INSET + INNER / 2) * BOX.scale;
  const cy = BOX.y + (INSET + INNER / 2) * BOX.scale;
  const frame = Math.floor(t * 24);
  if (flash > 0) {
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 260);
    glow.addColorStop(0, palette.spark);
    glow.addColorStop(0.25, palette.sparkGlow);
    glow.addColorStop(1, "rgba(255, 242, 168, 0)");
    ctx.globalAlpha = flash;
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 260, cy - 260, 520, 520);
    ctx.globalAlpha = 1;
  }
  if (arcs <= 0) return;
  const rnd = random(frame + 1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < 4; i++) {
    const dir = rnd() * Math.PI * 2;
    const len = 60 + rnd() * 90;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let k = 1; k <= 4; k++) {
      const d = (len * k) / 4;
      const off = (rnd() - 0.5) * 36;
      ctx.lineTo(cx + Math.cos(dir) * d - Math.sin(dir) * off, cy + Math.sin(dir) * d + Math.cos(dir) * off);
    }
    ctx.strokeStyle = palette.arc;
    ctx.lineWidth = 7 * arcs;
    ctx.stroke();
    ctx.strokeStyle = palette.spark;
    ctx.lineWidth = 3 * arcs;
    ctx.stroke();
  }
}

function drawRobot(ctx: CanvasRenderingContext2D, t: number): void {
  side ??= buildSide({ farLimbs: true });
  const pose = { ...STAND, arm: at("arm", t), fore: at("fore", t), armFar: -6, foreFar: -14, head: at("head", t) };
  const hand: HookDraw | undefined =
    at("wire", t) >= 0.5
      ? (c) => {
          c.save();
          c.scale(BOX.envScale, BOX.envScale);
          c.translate(-9, 6);
          drawAsset(c, ASSETS.wires, { lines: lineW });
          c.restore();
        }
      : undefined;
  ctx.save();
  ctx.translate(X, FLOOR);
  ctx.rotate((-at("lean", t) * Math.PI) / 180);
  ctx.scale(-K, K);
  ctx.translate(-ROBOT.SIDE_AX, -ROBOT.FOOT_Y);
  drawRig(ctx, side, { palette: ROBOT.palette, pose, hooks: { hand }, lineW });
  ctx.restore();
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
  const z = at("camZ", t);
  const sh = at("shake", t);
  const cx = at("camX", t) + Math.sin(t * 90) * sh;
  const cy = at("camY", t) + Math.cos(t * 77) * sh;
  ctx.translate(W / 2 - cx * z, H / 2 - cy * z);
  ctx.scale(z, z);
  lineW = lineFor(ctx);
  drawWall(ctx);
  drawBox(ctx, t);
  drawRobot(ctx, t);
  drawSparks(ctx, t);
  ctx.restore();
}

export const pullWires: Cutscene = { id: "pullWires", duration: config.duration, camera: config.camera, render };
