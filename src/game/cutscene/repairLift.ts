import config from "@config/cutscenes/repair-lift.json";
import { sampleTrack, type TrackKey } from "../../engine/anim/keyed";
import { drawRig, shade, type HookDraw } from "../../engine/rig/draw";
import type { Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset } from "../env/paint";
import { buildFront, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";

const TRACKS = config.tracks as unknown as Record<string, TrackKey[]>;
const { width: W, height: H } = config.stage;
const [SUN_X, SUN_Y, SUN_R] = config.stage.sun as [number, number, number];
const RB = config.robot;
const LINE = 1.4;
const MIN_LINE = 0.6;
const BACKLIT = { brightness: 0.42, saturate: 0.8 };
const BOX: Pt[] = [[-60, 510], [1012, 426], [1028, 432], [1072, 960], [-60, 960]];
const BOX_SIDE: Pt[] = [[1012, 426], [1028, 432], [1072, 960], [1046, 960]];
const LAMP = [962, 600, 18, 26] as const;
const palette = { ...config.palette };

const num = (name: string, t: number): number => sampleTrack(TRACKS[name]!, t) as number;

const cloudBank = (seed: number, n: number, top: number, depth: number): [number, number, number, number][] => {
  let s = seed;
  const rnd = (): number => (s = (s * 16807) % 2147483647) / 2147483647;
  const list: [number, number, number, number][] = [];
  for (let i = 0; i < n; i++) list.push([rnd() * 1900 - 150, top + rnd() * depth, 160 + rnd() * 340, 18 + rnd() * 34]);
  return list;
};

const CLOUDS = cloudBank(7, 26, -40, 620);
let rig: GroupNode | null = null;

function poly(ctx: CanvasRenderingContext2D, pts: readonly Pt[], color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1]);
  ctx.closePath();
  ctx.fill();
}

function oval(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function sky(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, palette.sky0);
  g.addColorStop(0.35, palette.sky1);
  g.addColorStop(0.62, palette.sky2);
  g.addColorStop(0.82, palette.glow);
  g.addColorStop(1, palette.sun);
  ctx.fillStyle = g;
  ctx.fillRect(-200, -200, W + 400, H + 400);
  const sun = ctx.createRadialGradient(SUN_X, SUN_Y, 0, SUN_X, SUN_Y, SUN_R);
  sun.addColorStop(0, palette.sun);
  sun.addColorStop(0.3, palette.glow);
  sun.addColorStop(1, palette.glow + "00");
  ctx.fillStyle = sun;
  ctx.fillRect(SUN_X - SUN_R, SUN_Y - SUN_R, SUN_R * 2, SUN_R * 2);
  for (const [x, y, w, h] of CLOUDS) {
    ctx.globalAlpha = Math.min(1, 0.3 + y / 700);
    oval(ctx, x + w * 0.08, y + h * 0.35, w * 0.5, h * 0.6, palette.cloudLit);
    ctx.globalAlpha = 1;
    oval(ctx, x, y, w * 0.5, h * 0.5, palette.cloud);
    oval(ctx, x - w * 0.22, y - h * 0.3, w * 0.28, h * 0.45, palette.cloud);
  }
}

const controllerHook = (t: number, lineW: number): HookDraw => {
  const k = RB.controllerScale;
  return (c) => {
    c.save();
    c.rotate((num("wrist", t) * Math.PI) / 180);
    c.scale(k, k);
    c.translate(-8, 5);
    drawAsset(c, ASSETS.controller, { state: 0, lines: lineW });
    c.restore();
  };
};

function drawRobot(ctx: CanvasRenderingContext2D, t: number, lineW: number): void {
  rig ??= buildFront({});
  const pose: Pose = {
    body: { dy: num("crouch", t) },
    head: num("head", t),
    armR: num("armR", t),
    foreR: num("foreR", t),
    armL: num("armL", t),
    foreL: num("foreL", t),
  };
  const pal = { ...shade(ROBOT.palette, BACKLIT), visor: ROBOT.palette.visor! };
  ctx.save();
  ctx.translate(RB.x, RB.y);
  ctx.scale(RB.scale, RB.scale);
  ctx.translate(-ROBOT.AX, 0);
  drawRig(ctx, rig, { palette: pal, pose, hooks: { handR: controllerHook(t, lineW) }, lineW });
  ctx.restore();
}

function drawBox(ctx: CanvasRenderingContext2D, t: number, lineW: number): void {
  poly(ctx, BOX, palette.box);
  poly(ctx, BOX_SIDE, palette.boxSide);
  ctx.strokeStyle = palette.boxRim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(BOX[0]![0], BOX[0]![1]);
  ctx.lineTo(BOX[1]![0], BOX[1]![1]);
  ctx.lineTo(BOX[2]![0], BOX[2]![1]);
  ctx.stroke();
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = palette.boxGlow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(BOX[2]![0], BOX[2]![1]);
  ctx.lineTo(BOX[3]![0], BOX[3]![1]);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const lit = num("lit", t) >= 0.5;
  const [lx, ly, lw, lh] = LAMP;
  const on = lit || Math.floor(t * 9) % 3 === 0;
  ctx.fillStyle = on ? (lit ? palette.lampOn : palette.lampOff) : palette.boxSide;
  ctx.fillRect(lx, ly, lw, lh);
  if (on) {
    ctx.globalAlpha = lit ? 0.35 : 0.2;
    oval(ctx, lx + lw / 2, ly + lh / 2, lw * 1.6, lh * 1.1, lit ? palette.lampOn : palette.lampOff);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = palette.boxRim;
  ctx.lineWidth = lineW;
  ctx.strokeRect(lx, ly, lw, lh);
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
  const z = num("camZ", t);
  ctx.translate(W / 2 - num("camX", t) * z, H / 2 - num("camY", t) * z);
  ctx.scale(z, z);
  const lineW = Math.max(MIN_LINE, LINE * s * z);
  sky(ctx);
  drawRobot(ctx, t, lineW);
  drawBox(ctx, t, lineW);
  ctx.restore();
}

export const repairLift: Cutscene = {
  id: "repairLift",
  duration: config.duration,
  camera: config.camera,
  render,
};
