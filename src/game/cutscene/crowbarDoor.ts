import config from "@config/cutscenes/crowbar-door.json";
import { apply, rotate } from "../../engine/math/mat2d";
import type { HookDraw } from "../../engine/rig/draw";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { buildBack, buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { camera, fastSolve, fitStage, fromDom, hookAt, LINE_W, lineFor, ORIGIN, placeRobot, poly, rect, shadow, STAND, tracks, unitScale } from "./kit";

type Palette = typeof config.palette;
type Stage = { ctx: CanvasRenderingContext2D; t: number };

const { width: W, height: H, floorY: FLOOR, doorSeamX: SEAM, doorHalfWidth: DOOR_HALF } = config.stage;
const DOOR = { x: SEAM - DOOR_HALF, w: 2 * DOOR_HALF, top: 322, bottom: 705 };
const RB = config.robot;
const K = RB.scale;
const BAR = config.crowbar;
let lineW = LINE_W;

const FAR_RANGES: [[number, number], [number, number]] = [[-150, 90], [-140, 10]];
const DEG = 180 / Math.PI;
const palette: Palette = { ...config.palette };

const { num, text } = tracks(config.tracks);

let rigs: { side: GroupNode; back: GroupNode } | null = null;
const robots = () => (rigs ??= { side: buildSide({ farLimbs: true, propBehindArm: true }), back: buildBack({ leftArmBehind: true, rightForeBehind: true }) });
let farSeed: Record<string, number> | null = null;

function drawDoorHalf(ctx: CanvasRenderingContext2D, x: number, left: boolean): void {
  const { top, bottom } = DOOR;
  rect(ctx, x, top, DOOR_HALF, bottom - top, palette.door);
  rect(ctx, left ? x : x + DOOR_HALF - 20, top, 20, bottom - top, palette.doorShade);
  rect(ctx, x + 20, top + 38, DOOR_HALF - 40, 120, palette.window);
  ctx.globalAlpha = 0.6;
  poly(ctx, [[x + 30, top + 38], [x + 50, top + 38], [x + 28, top + 158], [x + 20, top + 158]], palette.windowGlint);
  ctx.globalAlpha = 1;
}

function drawWorld({ ctx, t }: Stage): void {
  rect(ctx, -2000, -1000, 6000, 3000, palette.tunnel);
  rect(ctx, -2000, 120, 6000, 600, palette.wall);
  rect(ctx, -2000, -1000, 6000, 1120, palette.ceiling);
  ctx.globalAlpha = 0.07;
  for (let x = 100; x < 1800; x += 420) poly(ctx, [[x - 18, 118], [x + 18, 118], [x + 130, 720], [x - 130, 720]], palette.lampCone);
  ctx.globalAlpha = 1;
  for (let x = 100; x < 1800; x += 420) rect(ctx, x - 22, 104, 44, 12, palette.lamp);

  const gap = num("gap", t);
  const glow = num("glow", t);
  poly(ctx, [[180, 250], [1620, 250], [1650, 280], [1650, 705], [150, 705], [150, 280]], palette.wagon);
  rect(ctx, 150, 640, 1500, 65, palette.wagonShade);
  rect(ctx, 150, 560, 1500, 24, palette.stripe);
  poly(ctx, [[180, 250], [1620, 250], [1650, 280], [150, 280]], palette.wagonShade);
  for (const x of [260, 470, 1110, 1320]) {
    rect(ctx, x, 340, 150, 150, palette.window);
    ctx.globalAlpha = 0.6;
    poly(ctx, [[x + 20, 340], [x + 70, 340], [x + 10, 490], [x - 0, 490]], palette.windowGlint);
    ctx.globalAlpha = 1;
  }

  const { x: dx, w: dw, top, bottom } = DOOR;
  const dh = bottom - top;
  rect(ctx, dx, top, dw, dh, palette.interior);
  if (glow > 0) {
    ctx.globalAlpha = 0.55 * glow;
    poly(ctx, [[dx + 25, top + 8], [dx + dw - 25, top + 8], [dx + dw - 5, bottom], [dx + 5, bottom]], palette.interiorLight);
    ctx.globalAlpha = 0.9 * glow;
    rect(ctx, SEAM - 5, top + 8, 8, dh - 8, palette.interior);
    rect(ctx, dx + 35, 520, dw - 70, 10, palette.interior);
    ctx.globalAlpha = 1;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(dx, top, dw, dh);
  ctx.clip();
  drawDoorHalf(ctx, dx - gap / 2, true);
  drawDoorHalf(ctx, SEAM + gap / 2, false);
  ctx.restore();
  rect(ctx, dx - 10, top - 10, dw + 20, 12, palette.doorFrame);
  rect(ctx, dx - 10, top - 10, 10, dh + 10, palette.doorFrame);
  rect(ctx, dx + dw, top - 10, 10, dh + 10, palette.doorFrame);

  rect(ctx, -2000, 705, 6000, 900, palette.platform);
  rect(ctx, -2000, 712, 6000, 12, palette.safety);
  for (let x = -2000; x < 4000; x += 160) rect(ctx, x, 724, 4, 900, palette.platformLine);
  rect(ctx, -2000, 800, 6000, 3, palette.platformLine);
}

function drawCrowbar(c: CanvasRenderingContext2D, reach: number, w: number, butt: number): void {
  const lw = lineW / unitScale(c);
  const len = reach + butt - w * 0.2;
  c.strokeStyle = ROBOT.palette.mLine!;
  c.lineWidth = lw;
  c.save();
  c.translate(reach - w * 0.2, 0);
  c.rotate(-0.9);
  c.fillStyle = palette.crowbarShade;
  c.fillRect(0, -w / 2, w * 2.4, w);
  c.strokeRect(0, -w / 2, w * 2.4, w);
  c.restore();
  c.fillStyle = palette.crowbarShade;
  c.fillRect(-butt, -w / 2, len, w);
  c.fillStyle = palette.crowbar;
  c.fillRect(-butt, -w / 2, len, w * 0.55);
  c.strokeRect(-butt, -w / 2, len, w);
}

const robotMatrix = (ax: number, lean = 0): DOMMatrix => new DOMMatrix().translate(RB.x, FLOOR).rotate(lean).scale(K).translate(-ax, -ROBOT.FOOT_Y);

function drawProfile({ ctx, t }: Stage): void {
  const { side } = robots();
  const pose: Record<string, number> = { ...STAND, arm: num("armB", t), fore: num("foreB", t), armFar: 0, foreFar: 0 };
  const blend = num("farGrip", t);
  const turn = num("barTurnB", t);
  if (blend > 0) {
    const rest = apply(hookAt(side, "handFar", pose), ORIGIN);
    const grip = apply(rotate(hookAt(side, "hand", pose), RB.barTilt * DEG + turn), [RB.farGripOffset, 0]);
    const target: Pt = [rest[0] + (grip[0] - rest[0]) * blend, rest[1] + (grip[1] - rest[1]) * blend];
    farSeed = fastSolve(side, "handFar", pose, ["armFar", "foreFar"], FAR_RANGES, target, farSeed);
    Object.assign(pose, farSeed);
  }
  const k = num("barLen", t);
  const hand: HookDraw | undefined =
    num("barShown", t) >= 0.5
      ? (c) => {
          c.save();
          c.rotate(RB.barTilt + (turn * Math.PI) / 180);
          c.translate(RB.farGripOffset * blend, 0);
          drawCrowbar(c, BAR.reach * k, BAR.width, BAR.butt * k);
          c.restore();
        }
      : undefined;
  shadow(ctx, RB.x, FLOOR + 4, 70, 12, 0.35, palette.shadow);
  placeRobot(ctx, side, robotMatrix(ROBOT.SIDE_AX), { pose, hooks: { hand }, lineW });
}

function drawBack({ ctx, t }: Stage): void {
  const { back } = robots();
  const pry = num("pry", t);
  const pull = { arm: RB.pullArmDeg * pry, fore: RB.pullForeDeg * pry };
  const pose = { armL: -12 + pull.arm, foreL: -70 + pull.fore, armR: -20 + pull.arm, foreR: -64 + pull.fore };
  const m = robotMatrix(ROBOT.AX, -2 * pry);
  const [ex, ey] = apply(hookAt(back, "handL", pose, fromDom(m)), ORIGIN);
  const [fx, fy] = apply(hookAt(back, "handR", pose, fromDom(m)), ORIGIN);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(Math.atan2(fy - ey, fx - ex));
  ctx.scale(K, K);
  drawCrowbar(ctx, BAR.reach, BAR.width, BAR.butt);
  ctx.restore();
  shadow(ctx, RB.x, FLOOR + 4, 90, 12, 0.35, palette.shadow);
  placeRobot(ctx, back, m, { pose, hooks: {}, lineW });
}

function render(ctx: CanvasRenderingContext2D, w: number, h: number, clipT: number): void {
  const t = clipT + config.clip.start;
  ctx.save();
  fitStage(ctx, w, h, W, H);
  const z = num("camZ", t);
  const sh = num("shake", t);
  const cx = num("camX", t) + Math.sin(t * 90) * sh * 0.4;
  const cy = num("camY", t) + Math.cos(t * 77) * sh * 0.4;
  camera(ctx, W, H, cx, cy, z);
  lineW = lineFor(ctx, K);
  const stage = { ctx, t };
  drawWorld(stage);
  if (text("shot", t) === "C") drawBack(stage);
  else drawProfile(stage);
  ctx.restore();
}

export const crowbarDoor: Cutscene = {
  id: "crowbarDoor",
  duration: config.clip.end - config.clip.start,
  camera: "CAM 03 METRO",
  render,
};
