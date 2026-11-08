import config from "@config/cutscenes/pick-e-blaster.json";
import { drawRig } from "../../engine/rig/draw";
import type { GroupNode } from "../../engine/rig/tree";
import { drawEBlasterTop, EBLASTER_TOP_BOX } from "../robot/eblaster";
import { buildHand, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { fitStage, lineFor, random, tracks } from "./kit";

type Blot = { x: number; y: number; rx: number; ry: number; dark: boolean };

const S = config.stage;
const { width: W, height: H } = S;
const [SHADOW_DX, SHADOW_DY, SHADOW_ALPHA] = S.shadow as [number, number, number];
const palette = { ...config.palette };
const HAND_AT = [88, 438] as const;
const PALM_UP = [88, 470] as const;
const EDGE = [70, 130] as const;
const STRIPE = 60;
const [BOX_X0, , BOX_X1] = EBLASTER_TOP_BOX;

const { num: at } = tracks(config.tracks);

const pick = random(S.seed);
const blots: Blot[] = [];
for (let i = 0; i < S.blots; i++) blots.push({ x: -300 + pick() * 2200, y: -200 + pick() * 1300, rx: 20 + pick() * 110, ry: 10 + pick() * 50, dark: pick() < 0.5 });

let tree: GroupNode | null = null;
const hand = (): GroupNode => (tree ??= buildHand({ view: "palm", pose: "carry", forearm: true }));

function drawFloor(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = palette.floor;
  ctx.fillRect(-400, -400, W + 800, H + 800);
  for (const dark of [false, true]) {
    ctx.beginPath();
    for (const b of blots) {
      if (b.dark !== dark) continue;
      ctx.moveTo(b.x + b.rx, b.y);
      ctx.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, Math.PI * 2);
    }
    ctx.fillStyle = dark ? palette.blotDark : palette.blot;
    ctx.fill();
  }
  ctx.strokeStyle = palette.joint;
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let x = -S.slab; x < W + 2 * S.slab; x += S.slab) {
    ctx.moveTo(x, EDGE[1]);
    ctx.lineTo(x, H + 400);
  }
  for (let y = EDGE[1] + S.slab; y < H + 400; y += S.slab) {
    ctx.moveTo(-400, y);
    ctx.lineTo(W + 400, y);
  }
  ctx.stroke();
  ctx.fillStyle = palette.floorLight;
  ctx.fillRect(-400, EDGE[1], W + 800, 8);
  ctx.fillStyle = palette.stripeDark;
  ctx.fillRect(-400, EDGE[0], W + 800, EDGE[1] - EDGE[0]);
  ctx.fillStyle = palette.stripe;
  ctx.beginPath();
  for (let x = -400; x < W + 400; x += STRIPE * 2) {
    ctx.moveTo(x, EDGE[1]);
    ctx.lineTo(x + STRIPE, EDGE[1]);
    ctx.lineTo(x + STRIPE * 2, EDGE[0]);
    ctx.lineTo(x + STRIPE, EDGE[0]);
    ctx.closePath();
  }
  ctx.fill();
  ctx.fillStyle = palette.joint;
  ctx.fillRect(-400, -400, W + 800, EDGE[0] + 400);
}

function drawShadow(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.globalAlpha = SHADOW_ALPHA;
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(SHADOW_DX, S.itemY + SHADOW_DY, ((BOX_X1 - BOX_X0) * S.near) / 2, 60, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHands(ctx: CanvasRenderingContext2D, lineW: number): void {
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * S.spread, 0);
    ctx.scale(-side, -1);
    ctx.translate(PALM_UP[0] - HAND_AT[0], PALM_UP[1] - HAND_AT[1]);
    ctx.rotate(-Math.PI / 2);
    ctx.translate(-PALM_UP[0], -PALM_UP[1]);
    drawRig(ctx, hand(), { palette: ROBOT.palette, lineW });
    ctx.restore();
  }
}

function drawBlaster(ctx: CanvasRenderingContext2D, lineW: number): void {
  ctx.save();
  ctx.translate(0, S.itemY);
  ctx.scale(S.near, S.near);
  ctx.translate(-(BOX_X0 + BOX_X1) / 2, 0);
  drawEBlasterTop(ctx, { palette: ROBOT.palette, lineW });
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  ctx.save();
  fitStage(ctx, w, h, W, H);
  ctx.save();
  ctx.translate(at("panX", t), at("panY", t));
  drawFloor(ctx);
  ctx.restore();
  const k = S.scale * at("grow", t);
  ctx.save();
  ctx.translate(W / 2, S.palmY + (at("lift", t) + at("bob", t)) * S.scale);
  ctx.rotate((at("tilt", t) * Math.PI) / 180);
  ctx.scale(k, k);
  const lineW = lineFor(ctx, 1);
  drawShadow(ctx);
  drawHands(ctx, lineW);
  drawBlaster(ctx, lineW);
  ctx.restore();
  ctx.restore();
}

export const pickEBlaster: Cutscene = { id: "pickEBlaster", duration: config.duration, camera: config.camera, render };
