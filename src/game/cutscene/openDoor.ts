import config from "@config/cutscenes/open-door.json";
import { sampleTrack, type TrackKey } from "../../engine/anim/keyed";
import { drawRig, shade } from "../../engine/rig/draw";
import type { Pose } from "../../engine/rig/pose";
import type { GroupNode } from "../../engine/rig/tree";
import { buildFront, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";

type Blot = [number, number, number, number];

const TRACKS = config.tracks as unknown as Record<string, TrackKey[]>;
const { width: W, height: H, horizon: HORIZON } = config.stage;
const [SUN_X, SUN_Y, SUN_R] = config.stage.sun as [number, number, number];
const RB = config.robot;
const LINE = 1.4;
const MIN_LINE = 0.6;
const DUSK = { brightness: 0.82, saturate: 0.9 };
const EDGE = 16;
const palette = { ...config.palette };

const num = (name: string, t: number): number => sampleTrack(TRACKS[name]!, t) as number;

const bank = (seed: number, n: number, x0: number, span: number, top: number, depth: number, w0: number, wSpan: number, h0: number, hSpan: number): Blot[] => {
  let s = seed;
  const rnd = (): number => (s = (s * 16807) % 2147483647) / 2147483647;
  const list: Blot[] = [];
  for (let i = 0; i < n; i++) list.push([x0 + rnd() * span, top + rnd() * depth, w0 + rnd() * wSpan, h0 + rnd() * hSpan]);
  return list;
};

const CLOUDS = bank(11, 24, -150, 1900, -40, HORIZON - 60, 180, 360, 16, 30);
const STREAKS = bank(5, 9, 0, 1600, HORIZON + 20, 200, 120, 300, 2, 4);
let rig: GroupNode | null = null;

function oval(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function sky(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, palette.sky0);
  g.addColorStop(0.4, palette.sky1);
  g.addColorStop(0.75, palette.sky2);
  g.addColorStop(0.92, palette.glow);
  g.addColorStop(1, palette.sun);
  ctx.fillStyle = g;
  ctx.fillRect(-200, -200, W + 400, HORIZON + 200);
  const ground = ctx.createLinearGradient(0, HORIZON, 0, H);
  ground.addColorStop(0, palette.glow);
  ground.addColorStop(0.35, palette.ground);
  ground.addColorStop(1, palette.groundFar);
  ctx.fillStyle = ground;
  ctx.fillRect(-200, HORIZON, W + 400, H - HORIZON + 200);
  ctx.save();
  ctx.translate(SUN_X, SUN_Y);
  ctx.scale(1, 0.32);
  const sun = ctx.createRadialGradient(0, 0, 0, 0, 0, SUN_R);
  sun.addColorStop(0, palette.sun);
  sun.addColorStop(0.35, palette.glow);
  sun.addColorStop(1, palette.glow + "00");
  ctx.fillStyle = sun;
  ctx.fillRect(-SUN_R, -SUN_R, SUN_R * 2, SUN_R * 2);
  ctx.restore();
  for (const [x, y, w, h] of STREAKS) {
    ctx.globalAlpha = 0.45;
    oval(ctx, x, y, w, h, palette.sun);
  }
  for (const [x, y, w, h] of CLOUDS) {
    ctx.globalAlpha = Math.min(1, 0.25 + y / HORIZON);
    oval(ctx, x + w * 0.08, y + h * 0.35, w * 0.5, h * 0.6, palette.cloudLit);
    ctx.globalAlpha = 1;
    oval(ctx, x, y, w * 0.5, h * 0.5, palette.cloud);
    oval(ctx, x - w * 0.22, y - h * 0.3, w * 0.28, h * 0.45, palette.cloud);
  }
}

function drawRobot(ctx: CanvasRenderingContext2D, t: number, lineW: number): void {
  rig ??= buildFront({});
  const pose: Pose = {
    body: { dy: num("breathe", t) },
    head: num("head", t),
    armL: num("armL", t),
    foreL: num("foreL", t),
    armR: num("armR", t),
    foreR: num("foreR", t),
  };
  ctx.save();
  ctx.translate(RB.x, RB.y);
  ctx.scale(RB.scale, RB.scale);
  ctx.translate(-ROBOT.AX, 0);
  drawRig(ctx, rig, { palette: shade(ROBOT.palette, DUSK), pose, lineW });
  ctx.restore();
}

function drawDoor(ctx: CanvasRenderingContext2D, t: number): void {
  const x = num("door", t);
  if (x >= W) return;
  ctx.fillStyle = palette.door;
  ctx.fillRect(x, -200, W + 400 - x, H + 400);
  ctx.fillStyle = palette.doorEdge;
  ctx.fillRect(x, -200, EDGE, H + 400);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = palette.doorTube;
  ctx.fillRect(x + 6, -200, 3, H + 400);
  ctx.fillStyle = palette.glow;
  ctx.fillRect(x, -200, 2, H + 400);
  ctx.globalAlpha = 1;
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
  ctx.translate(W / 2 - (W / 2) * z, H / 2 - (H / 2) * z);
  ctx.scale(z, z);
  const lineW = Math.max(MIN_LINE, LINE * s * z);
  sky(ctx);
  drawRobot(ctx, t, lineW);
  drawDoor(ctx, t);
  ctx.restore();
}

export const openDoor: Cutscene = {
  id: "openDoor",
  duration: config.duration,
  camera: config.camera,
  render,
};
