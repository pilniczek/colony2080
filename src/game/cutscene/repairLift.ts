import config from "@config/cutscenes/repair-lift.json";
import { apply } from "../../engine/math/mat2d";
import { drawRig, type HookDraw } from "../../engine/rig/draw";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset } from "../env/paint";
import { buildHand, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { bank, camera, cloud, fitStage, hookAt, LINE_W, lineFor, rect, rowFill, stroke, tracks } from "./kit";

const { width: W, height: H, floor: FLOOR } = config.stage;
const [SUN_X, SUN_Y, SUN_R] = config.stage.sun as [number, number, number];
const PANEL = config.panel;
const S = PANEL.scale;
const HAND = config.hand;
const SEAT: Pt = [PANEL.x + PANEL.seat[0]! * S, PANEL.y + PANEL.seat[1]! * S];
const SCREEN: Pt = [PANEL.x + PANEL.screen[0]! * S, PANEL.y + PANEL.screen[1]! * S];
const FORE_LEN = 190;
const palette = { ...config.palette };

const { num: at } = tracks(config.tracks);

const CLOUDS = bank(7, 26, -150, 1900, -40, 620, 160, 340, 18, 34);
let lineW = LINE_W;
let hands: { pinch: GroupNode; reach: GroupNode } | null = null;

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

function drawRoof(ctx: CanvasRenderingContext2D): void {
  rect(ctx, -200, FLOOR, W + 400, H - FLOOR + 200, palette.roof);
  stroke(ctx, [[-200, FLOOR], [W + 200, FLOOR]], palette.roofRim, 3);
}

function drawPanel(ctx: CanvasRenderingContext2D, t: number): void {
  const lit = at("lit", t) >= 0.5;
  ctx.save();
  ctx.translate(PANEL.x, PANEL.y);
  ctx.scale(S, S);
  drawAsset(ctx, ASSETS.liftPanel, { state: lit ? 0 : 1, t, lines: lineW });
  ctx.restore();
  const glow = at("glow", t);
  if (glow <= 0) return;
  const [x, y] = SCREEN;
  const r = 9 * S;
  const halo = ctx.createRadialGradient(x, y, 0, x, y, r);
  halo.addColorStop(0, palette.lampOn);
  halo.addColorStop(1, palette.lampOn + "00");
  ctx.globalAlpha = 0.5 * glow;
  ctx.fillStyle = halo;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

const controllerAt = (t: number): Pt => (at("placed", t) >= 0.5 ? SEAT : [SEAT[0] + at("carryX", t), SEAT[1] + at("carryY", t)]);

function drawController(ctx: CanvasRenderingContext2D, t: number): void {
  const [x, y] = controllerAt(t);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S, S);
  drawAsset(ctx, ASSETS.controller, { state: 0, lines: lineW });
  ctx.restore();
}

function drawHand(ctx: CanvasRenderingContext2D, t: number): void {
  hands ??= {
    pinch: buildHand({ view: "thumb", pose: "pinch", forearm: true }),
    reach: buildHand({ view: "thumb", pose: "reach", forearm: true }),
  };
  const placed = at("placed", t) >= 0.5;
  const [gx, gy] = apply(hookAt(hands.pinch, "item", {}), HAND.pinchAt as Pt);
  const [cx, cy] = controllerAt(t);
  const base = ctx.getTransform();
  const held: HookDraw = (c) => {
    c.save();
    c.setTransform(base);
    drawController(c, t);
    c.restore();
  };
  ctx.save();
  ctx.translate(cx + HAND.grip[0]! * S + at("handX", t), cy + HAND.grip[1]! * S + at("handY", t));
  ctx.rotate(((at("rot", t) + HAND.turn) * Math.PI) / 180);
  ctx.scale(HAND.scale, HAND.scale);
  ctx.translate(-gx, -gy);
  if (placed) {
    ctx.translate(HAND.palm[0]!, HAND.palm[1]!);
    ctx.rotate(-Math.PI / 2);
    ctx.translate(-HAND.palm[0]!, -HAND.palm[1]!);
  }
  drawRig(ctx, placed ? hands.reach : hands.pinch, { palette: ROBOT.palette, hooks: { item: placed ? undefined : held }, lineW });
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  ctx.save();
  fitStage(ctx, w, h, W, H);
  camera(ctx, W, H, at("camX", t), at("camY", t), at("camZ", t));
  lineW = lineFor(ctx, HAND.scale, FORE_LEN);
  sky(ctx);
  drawRoof(ctx);
  drawPanel(ctx, t);
  if (at("placed", t) >= 0.5 && at("lit", t) < 0.5) drawController(ctx, t);
  drawHand(ctx, t);
  ctx.restore();
}

export const repairLift: Cutscene = {
  id: "repairLift",
  duration: config.duration,
  camera: config.camera,
  render,
};
