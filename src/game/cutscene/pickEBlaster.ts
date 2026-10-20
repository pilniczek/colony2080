import config from "@config/cutscenes/pick-e-blaster.json";
import { sampleTrack, type TrackKey } from "../../engine/anim/keyed";
import { drawRig, type HookDraw } from "../../engine/rig/draw";
import type { Pose } from "../../engine/rig/pose";
import type { GroupNode } from "../../engine/rig/tree";
import { eblasterHook } from "../robot/eblaster";
import { buildFront, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { random } from "./pickController";

type Blot = { x: number; y: number; rx: number; ry: number; dark: boolean };

const TRACKS = config.tracks as unknown as Record<string, TrackKey[]>;
const S = config.stage;
const { width: W, height: H, floorY: FLOOR, robotScale: K } = S;
const [RAIL_TOP, RAIL_BOTTOM] = S.railY as [number, number];
const palette = { ...config.palette };
const LINE_W = 1.4;
const FULL_LINE_PX = 500;

const at = (name: string, t: number): number => sampleTrack(TRACKS[name]!, t) as number;

const pick = random(S.seed);
const blots: Blot[] = [];
for (let i = 0; i < S.blots; i++) blots.push({ x: -300 + pick() * 2200, y: 100 + pick() * 520, rx: 30 + pick() * 120, ry: 12 + pick() * 40, dark: pick() < 0.5 });

let rig: GroupNode | null = null;
const robot = (): GroupNode => (rig ??= buildFront({}));

const lineFor = (ctx: CanvasRenderingContext2D): number => {
  const m = ctx.getTransform();
  const robotPx = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * K * ROBOT.FOOT_Y;
  return Math.min(LINE_W, Math.max(ROBOT.gameLine, (LINE_W * robotPx) / FULL_LINE_PX));
};

function drawWall(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = palette.wallDark;
  ctx.fillRect(-1000, -1000, 3600, 3000);
  ctx.fillStyle = palette.wall;
  ctx.fillRect(-1000, S.lightY + 30, 3600, RAIL_TOP - S.lightY - 30);
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
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = palette.lightGlow;
  ctx.beginPath();
  ctx.moveTo(-400, S.lightY);
  ctx.lineTo(2000, S.lightY);
  ctx.lineTo(2300, S.lightY + 260);
  ctx.lineTo(-700, S.lightY + 260);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.light;
  ctx.fillRect(-400, S.lightY - 12, 2400, 24);
  ctx.fillStyle = palette.rail;
  ctx.fillRect(-1000, RAIL_TOP, 3600, RAIL_BOTTOM - RAIL_TOP);
  ctx.fillStyle = palette.railLight;
  ctx.fillRect(-1000, RAIL_TOP, 3600, 8);
  ctx.fillRect(-1000, RAIL_TOP + (RAIL_BOTTOM - RAIL_TOP) / 2, 3600, 6);
  ctx.fillStyle = palette.floor;
  ctx.fillRect(-1000, RAIL_BOTTOM, 3600, 2000);
}

const blasterHook: HookDraw = (c) => {
  c.save();
  c.scale(-1, 1);
  eblasterHook(c, ROBOT.palette, { lineW: LINE_W });
  c.restore();
};

function drawRobot(ctx: CanvasRenderingContext2D, t: number): void {
  const grow = at("foreGrow", t);
  const pose: Pose = {
    body: { dy: at("bob", t) },
    armL: at("armL", t),
    armR: at("armR", t),
    foreR: { rot: at("foreR", t), sx: grow, sy: grow },
  };
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(S.robotX, FLOOR, 260 * K, 22 * K, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(S.robotX, FLOOR);
  ctx.scale(K, K);
  ctx.translate(-ROBOT.AX, -ROBOT.FOOT_Y);
  drawRig(ctx, robot(), { palette: ROBOT.palette, pose, hooks: { handR: blasterHook }, lineW: lineFor(ctx) });
  ctx.restore();
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
  const z = at("camZ", t);
  ctx.translate(W / 2 - at("camX", t) * z, H / 2 - at("camY", t) * z);
  ctx.scale(z, z);
  drawWall(ctx);
  drawRobot(ctx, t);
  ctx.restore();
}

export const pickEBlaster: Cutscene = { id: "pickEBlaster", duration: config.duration, camera: config.camera, render };
