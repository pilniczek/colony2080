import config from "@config/cutscenes/crowbar-door.json";
import { sampleTrack, type TrackKey } from "../../engine/anim/keyed";
import { apply, rotate, type Mat2D } from "../../engine/math/mat2d";
import { drawRig, type HookDraw } from "../../engine/rig/draw";
import { locate, solve, type Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { buildBack, buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";

type Palette = typeof config.palette;
type Stage = { ctx: CanvasRenderingContext2D; t: number };

const TRACKS = config.tracks as unknown as Record<string, TrackKey[]>;
const { width: W, height: H, floorY: FLOOR, doorSeamX: SEAM, doorHalfWidth: DOOR_HALF } = config.stage;
const DOOR = { x: SEAM - DOOR_HALF, w: 2 * DOOR_HALF, top: 322, bottom: 705 };
const RB = config.robot;
const K = RB.scale;
const BAR = config.crowbar;
const LINE_W = 1.4;
const FULL_LINE_PX = 500;
let lineW = LINE_W;

const lineFor = (ctx: CanvasRenderingContext2D): number => {
  const t = ctx.getTransform();
  const robotPx = Math.sqrt(Math.abs(t.a * t.d - t.b * t.c)) * K * ROBOT.FOOT_Y;
  return Math.min(LINE_W, Math.max(ROBOT.gameLine, (LINE_W * robotPx) / FULL_LINE_PX));
};
const STAND = { hipNear: 0, kneeNear: 2, ankleNear: -1.4, hipFar: 0, kneeFar: 2, ankleFar: -1.4 };
const FAR_RANGES: [[number, number], [number, number]] = [[-150, 90], [-140, 10]];
const ORIGIN: Pt = [0, 0];
const DEG = 180 / Math.PI;
const palette: Palette = { ...config.palette };

const num = (name: string, t: number): number => sampleTrack(TRACKS[name]!, t) as number;
const text = (name: string, t: number): string => String(sampleTrack(TRACKS[name]!, t));

let rigs: { side: GroupNode; back: GroupNode } | null = null;
const robots = () => (rigs ??= { side: buildSide({ farLimbs: true, propBehindArm: true }), back: buildBack({ leftArmBehind: true, rightForeBehind: true }) });
let farSeed: Record<string, number> | null = null;

function poly(ctx: CanvasRenderingContext2D, pts: Pt[], color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1]);
  ctx.closePath();
  ctx.fill();
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

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

function floorShadow(ctx: CanvasRenderingContext2D, x: number, w: number): void {
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(x, FLOOR + 4, w, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawCrowbar(c: CanvasRenderingContext2D, reach: number, w: number, butt: number): void {
  const t = c.getTransform();
  const lw = lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
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

const fromDom = ({ a, b, c, d, e, f }: DOMMatrix): Mat2D => ({ a, b, c, d, e, f });

const hookAt = (root: GroupNode, hook: string, pose: Pose, base?: Mat2D): Mat2D => {
  const m = locate(root, hook, pose, base);
  if (!m) throw new Error(`no ${hook} hook`);
  return m;
};

function placeRobot(ctx: CanvasRenderingContext2D, root: GroupNode, m: DOMMatrix, pose: Pose, hooks: Record<string, HookDraw | undefined>): void {
  ctx.save();
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  drawRig(ctx, root, { palette: ROBOT.palette, pose, hooks, lineW });
  ctx.restore();
}

function drawProfile({ ctx, t }: Stage): void {
  const { side } = robots();
  const pose: Record<string, number> = { ...STAND, arm: num("armB", t), fore: num("foreB", t), armFar: 0, foreFar: 0 };
  const blend = num("farGrip", t);
  const turn = num("barTurnB", t);
  if (blend > 0) {
    const rest = apply(hookAt(side, "handFar", pose), ORIGIN);
    const grip = apply(rotate(hookAt(side, "hand", pose), RB.barTilt * DEG + turn), [RB.farGripOffset, 0]);
    const target: Pt = [rest[0] + (grip[0] - rest[0]) * blend, rest[1] + (grip[1] - rest[1]) * blend];
    farSeed = solve(side, "handFar", pose, ["armFar", "foreFar"], FAR_RANGES, target, farSeed);
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
  floorShadow(ctx, RB.x, 70);
  placeRobot(ctx, side, robotMatrix(ROBOT.SIDE_AX), pose, { hand });
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
  floorShadow(ctx, RB.x, 90);
  placeRobot(ctx, back, m, pose, {});
}

function render(ctx: CanvasRenderingContext2D, w: number, h: number, clipT: number): void {
  const t = clipT + config.clip.start;
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
  const sh = num("shake", t);
  const cx = num("camX", t) + Math.sin(t * 90) * sh * 0.4;
  const cy = num("camY", t) + Math.cos(t * 77) * sh * 0.4;
  ctx.translate(W / 2 - cx * z, H / 2 - cy * z);
  ctx.scale(z, z);
  lineW = lineFor(ctx);
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
