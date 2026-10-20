import metro from "@config/cutscenes/crowbar-door.json";
import config from "@config/cutscenes/wire-switchboard.json";
import { drawRig, type HookDraw } from "../../engine/rig/draw";
import type { GroupNode } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset } from "../env/paint";
import { buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { camera, fitStage, LINE_W, lineFor, poly, rect, shadow, STAND, tracks } from "./kit";

const { width: W, height: H, floorY: FLOOR, platformY: PLATFORM, pillarX: PILLAR_X } = config.stage;
const K = config.robot.scale;
const ENV_K = config.robot.envScale;
const PILLAR_S = K * ENV_K;
const LUNGE: Record<string, number> = config.lunge;
const palette = { ...metro.palette, ...config.palette };
let lineW = LINE_W;
let side: GroupNode | null = null;

const { num: at } = tracks(config.tracks);

function drawTunnel(ctx: CanvasRenderingContext2D): void {
  rect(ctx, -400, -400, 2400, 1600, palette.tunnel);
  rect(ctx, -400, 120, 2400, 600, palette.wall);
  rect(ctx, -400, -400, 2400, 520, palette.ceiling);
  ctx.globalAlpha = 0.07;
  for (let x = 100; x < 1900; x += 420) poly(ctx, [[x - 18, 118], [x + 18, 118], [x + 130, 720], [x - 130, 720]], palette.lampCone);
  ctx.globalAlpha = 1;
  for (let x = 100; x < 1900; x += 420) rect(ctx, x - 22, 104, 44, 12, palette.lamp);
}

function drawWagon(ctx: CanvasRenderingContext2D): void {
  poly(ctx, [[-400, 170], [590, 170], [620, 200], [620, 700], [-400, 700]], palette.wagon);
  rect(ctx, -400, 630, 1020, 70, palette.wagonShade);
  rect(ctx, -400, 550, 1020, 26, palette.stripe);
  poly(ctx, [[-400, 170], [590, 170], [620, 200], [-400, 200]], palette.wagonShade);
  rect(ctx, 600, 200, 20, 500, palette.wagonShade);
  for (const x of [-250, 20, 330]) {
    rect(ctx, x, 270, 200, 190, palette.window);
    ctx.globalAlpha = 0.6;
    poly(ctx, [[x + 24, 270], [x + 90, 270], [x + 14, 460], [x, 460]], palette.windowGlint);
    ctx.globalAlpha = 1;
  }
}

function drawPlatform(ctx: CanvasRenderingContext2D): void {
  rect(ctx, -400, PLATFORM, 2400, 600, palette.platform);
  rect(ctx, -400, PLATFORM + 7, 2400, 12, palette.safety);
  for (let x = -400; x < 2000; x += 160) rect(ctx, x, PLATFORM + 19, 4, 600, palette.platformLine);
  rect(ctx, -400, PLATFORM + 95, 2400, 3, palette.platformLine);
}

function drawPillar(ctx: CanvasRenderingContext2D, t: number): void {
  const base = FLOOR - 30;
  rect(ctx, PILLAR_X, -400, 26 * PILLAR_S, base - 70 * PILLAR_S + 400, palette.pillarTop);
  shadow(ctx, PILLAR_X + 13 * PILLAR_S, base + 4, 16 * PILLAR_S, 10, 0.35, palette.shadow);
  ctx.save();
  ctx.translate(PILLAR_X, base);
  ctx.scale(PILLAR_S, PILLAR_S);
  drawAsset(ctx, ASSETS.switchboard, { state: at("lit", t) >= 0.5 ? 1 : 0, lines: lineW });
  ctx.restore();
}

function drawRobot(ctx: CanvasRenderingContext2D, t: number): void {
  side ??= buildSide({ farLimbs: true });
  const k = at("lunge", t);
  const pose: Record<string, number> = { arm: at("arm", t), fore: at("fore", t), armFar: at("armFar", t), foreFar: at("foreFar", t), head: at("head", t) };
  for (const name in STAND) pose[name] = STAND[name]! + (LUNGE[name]! - STAND[name]!) * k;
  const hand: HookDraw | undefined =
    at("wire", t) >= 0.5
      ? (c) => {
          c.save();
          c.scale(ENV_K, ENV_K);
          c.translate(-9, 6);
          drawAsset(c, ASSETS.wires, { lines: lineW });
          c.restore();
        }
      : undefined;
  const x = at("x", t);
  shadow(ctx, x, FLOOR + 4, 150, 12, 0.35, palette.shadow);
  ctx.save();
  ctx.translate(x, FLOOR);
  ctx.rotate((-at("lean", t) * Math.PI) / 180);
  ctx.scale(-K, K);
  ctx.translate(-ROBOT.SIDE_AX, -ROBOT.FOOT_Y + config.robot.lungeDrop * k);
  drawRig(ctx, side, { palette: ROBOT.palette, pose, hooks: { hand }, lineW });
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  ctx.save();
  fitStage(ctx, w, h, W, H);
  const z = at("camZ", t);
  camera(ctx, W, H, at("camX", t), at("camY", t), z);
  lineW = lineFor(ctx, K);
  drawTunnel(ctx);
  drawWagon(ctx);
  drawPlatform(ctx);
  drawPillar(ctx, t);
  drawRobot(ctx, t);
  ctx.restore();
}

export const wireSwitchboard: Cutscene = { id: "wireSwitchboard", duration: config.duration, camera: config.camera, render };
