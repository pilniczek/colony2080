import config from "@config/cutscenes/search-corpse.json";
import { drawRig, type HookDraw } from "../../engine/rig/draw";
import type { GroupNode } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset } from "../env/paint";
import { buildFront, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { camera, feet, fitStage, LINE_W, lineFor, rect, shadow, sheetBlit, sheetDraw, tracks } from "./kit";

const ST = config.stage;
const W = ST.width;
const H = ST.height;
const palette = { ...config.palette };
const BLOCK_WIDTHS = [150, 210, 120, 180, 240, 140, 200, 170];
const BLOCK_H = 74;
const ITEM_GAP = 9;
let robot: GroupNode | null = null;
let lineW = LINE_W;

const { num: at } = tracks(config.tracks);

function drawBlocks(ctx: CanvasRenderingContext2D, lit: boolean | null, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let row = 0; row * BLOCK_H < ST.wallBase + 400; row++) {
    const y = -400 + row * BLOCK_H;
    let x = -400 - (row % 3) * 60;
    for (let i = row; x < W + 400; i++) {
      const w = BLOCK_WIDTHS[i % BLOCK_WIDTHS.length]!;
      if (lit === null) ctx.rect(x + 4, y + BLOCK_H - 14, w - 8, 10);
      else if ((i % 3 === 0) === lit) ctx.rect(x + 4, y + 4, w - 8, BLOCK_H - 8);
      x += w;
    }
  }
  ctx.fill();
}

function drawWall(ctx: CanvasRenderingContext2D): void {
  rect(ctx, -400, -400, W + 800, ST.wallBase + 400, palette.wall);
  drawBlocks(ctx, true, palette.wallLit);
  drawBlocks(ctx, false, palette.block);
  drawBlocks(ctx, null, palette.wallDark);
  rect(ctx, -400, 300, W + 800, 42, palette.pipeDark);
  rect(ctx, -400, 300, W + 800, 16, palette.pipe);
  rect(ctx, -400, 304, W + 800, 5, palette.pipeLit);
  rect(ctx, 1130, -400, 150, ST.wallBase + 400, palette.panel);
  rect(ctx, 1130, -400, 22, ST.wallBase + 400, palette.panelDark);
  rect(ctx, 1258, -400, 22, ST.wallBase + 400, palette.panelDark);
  for (let y = 40; y < ST.wallBase; y += 120) {
    ctx.fillStyle = palette.rivet;
    ctx.beginPath();
    ctx.arc(1205, y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  rect(ctx, -400, ST.wallBase - 70, W + 800, 70, palette.skirt);
  rect(ctx, -400, ST.wallBase - 70, W + 800, 8, palette.wallLit);
}

function drawFloor(ctx: CanvasRenderingContext2D): void {
  rect(ctx, -400, ST.wallBase, W + 800, H - ST.wallBase + 400, palette.floor);
  rect(ctx, -400, ST.wallBase, W + 800, 30, palette.floorLit);
  ctx.strokeStyle = palette.grate;
  ctx.lineWidth = 4;
  ctx.beginPath();
  const vx = W / 2;
  const vy = ST.wallBase - 600;
  for (let x = -1600; x <= W + 1600; x += 110) {
    const k = (ST.wallBase - vy) / (H + 400 - vy);
    ctx.moveTo(vx + (x - vx) * k, ST.wallBase);
    ctx.lineTo(x, H + 400);
  }
  for (let y = ST.wallBase + 24, g = 24; y < H + 400; g *= 1.35, y += g) {
    ctx.moveTo(-400, y);
    ctx.lineTo(W + 400, y);
  }
  ctx.stroke();
}

function drawShadow(ctx: CanvasRenderingContext2D, t: number): void {
  const lean = at("lean", t);
  shadow(ctx, ST.robotX + 360 + lean * 12, ST.wallBase - 120 + at("crouch", t) * 120, 170, 260, 0.35, palette.shadow, 0.2);
}

const drawItems: HookDraw = (c) => {
  const k = ST.itemScale;
  const m = c.getTransform();
  c.save();
  c.rotate(-Math.atan2(m.b, m.a));
  c.scale(k, k);
  c.translate(-7, -3);
  drawAsset(c, ASSETS.card, { lines: lineW });
  c.translate(ITEM_GAP, 2);
  drawAsset(c, ASSETS.holoPlan, { lines: lineW });
  c.restore();
};

function drawRobot(ctx: CanvasRenderingContext2D, t: number): void {
  robot ??= buildFront({ rightArmFirst: true });
  const crouch = at("crouch", t);
  const k = ST.robotScale;
  const pose = {
    body: { rot: at("lean", t), sy: 1 - ST.squash * crouch },
    armL: at("armL", t),
    foreL: at("foreL", t),
    armR: at("armR", t),
    foreR: at("foreR", t),
    face: at("head", t),
  };
  const holding = at("taken", t) >= 1;
  ctx.save();
  feet(ctx, ST.robotX + crouch * ST.crouchX, ST.floorY + crouch * ST.crouchY, k, k, ROBOT.AX);
  drawRig(ctx, robot, { palette: ROBOT.palette, pose, hooks: { handR: holding ? drawItems : undefined }, lineW });
  ctx.restore();
}

function drawCorpse(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.save();
  ctx.translate(ST.corpseX, ST.corpseY);
  ctx.scale(-ST.corpseScale, ST.corpseScale);
  drawAsset(ctx, ASSETS.corpse, { state: at("taken", t) >= 1 ? 1 : 0, lines: lineW });
  ctx.restore();
}

function drawHandFront(ctx: CanvasRenderingContext2D, t: number): void {
  const sheet = sheetDraw(ctx, "searchCorpse", (c) => drawRobot(c, t));
  sheetBlit(ctx, sheet);
  drawCorpse(ctx, t);
  const [x, y, w, h] = ST.handFront as [number, number, number, number];
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  sheetBlit(ctx, sheet);
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  ctx.save();
  fitStage(ctx, w, h, W, H);
  const z = at("camZ", t);
  camera(ctx, W, H, at("camX", t), at("camY", t), z);
  lineW = lineFor(ctx, ST.robotScale);
  drawWall(ctx);
  drawFloor(ctx);
  drawShadow(ctx, t);
  if (at("handFront", t) >= 1) drawHandFront(ctx, t);
  else {
    drawRobot(ctx, t);
    drawCorpse(ctx, t);
  }
  ctx.restore();
}

export const searchCorpse: Cutscene = {
  id: "searchCorpse",
  duration: config.duration,
  camera: config.camera,
  render,
};
