import config from "@config/cutscenes/open-door.json";
import { drawRig, shade } from "../../engine/rig/draw";
import type { Pose } from "../../engine/rig/pose";
import type { GroupNode } from "../../engine/rig/tree";
import { buildFront, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { bank, camera, cloud, fitStage, oval, tracks } from "./kit";

const { width: W, height: H, horizon: HORIZON } = config.stage;
const [SUN_X, SUN_Y, SUN_R] = config.stage.sun as [number, number, number];
const RB = config.robot;
const LINE = 1.4;
const MIN_LINE = 0.6;
const DUSK = { brightness: 0.82, saturate: 0.9 };
const EDGE = 16;
const palette = { ...config.palette };

const { num } = tracks(config.tracks);

const CLOUDS = bank(11, 24, -150, 1900, -40, HORIZON - 60, 180, 360, 16, 30);
const STREAKS = bank(5, 9, 0, 1600, HORIZON + 20, 200, 120, 300, 2, 4);
let rig: GroupNode | null = null;

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
    cloud(ctx, x, y, w, h, Math.min(1, 0.25 + y / HORIZON), palette.cloudLit, palette.cloud);
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
  const s = fitStage(ctx, w, h, W, H);
  const z = num("camZ", t);
  camera(ctx, W, H, W / 2, H / 2, z);
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
