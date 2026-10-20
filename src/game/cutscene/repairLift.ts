import config from "@config/cutscenes/repair-lift.json";
import { drawRig, shade, type HookDraw } from "../../engine/rig/draw";
import type { Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset } from "../env/paint";
import { buildFront, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { bank, camera, cloud, fitStage, oval, poly, rowFill, stroke, tracks } from "./kit";

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

const { num } = tracks(config.tracks);

const CLOUDS = bank(7, 26, -150, 1900, -40, 620, 160, 340, 18, 34);
let rig: GroupNode | null = null;

function sky(ctx: CanvasRenderingContext2D): void {
  rowFill(ctx, (c) => {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, palette.sky0);
    g.addColorStop(0.35, palette.sky1);
    g.addColorStop(0.62, palette.sky2);
    g.addColorStop(0.82, palette.glow);
    g.addColorStop(1, palette.sun);
    c.fillStyle = g;
    c.fillRect(-200, -200, W + 400, H + 400);
  });
  const sun = ctx.createRadialGradient(SUN_X, SUN_Y, 0, SUN_X, SUN_Y, SUN_R);
  sun.addColorStop(0, palette.sun);
  sun.addColorStop(0.3, palette.glow);
  sun.addColorStop(1, palette.glow + "00");
  ctx.fillStyle = sun;
  ctx.fillRect(SUN_X - SUN_R, SUN_Y - SUN_R, SUN_R * 2, SUN_R * 2);
  for (const [x, y, w, h] of CLOUDS) {
    cloud(ctx, x, y, w, h, Math.min(1, 0.3 + y / 700), palette.cloudLit, palette.cloud);
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
  stroke(ctx, BOX.slice(0, 3), palette.boxRim, 3);
  ctx.globalAlpha = 0.7;
  stroke(ctx, BOX.slice(2, 4), palette.boxGlow, 2);
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
  const s = fitStage(ctx, w, h, W, H);
  const z = num("camZ", t);
  camera(ctx, W, H, num("camX", t), num("camY", t), z);
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
