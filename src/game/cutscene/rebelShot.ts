import config from "@config/cutscenes/rebel-shot.json";
import { sampleTrack, type TrackKey } from "../../engine/anim/keyed";
import { apply } from "../../engine/math/mat2d";
import { drawRig, shade, type HookDraw, type Palette } from "../../engine/rig/draw";
import { locate, type Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { PALETTE as SKIN } from "../env/paint";
import { gunHook, MUZZLE, MUZZLE_IN_HOOK } from "../robot/gun";
import { buildBack, buildFront, buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";

type Ctx = CanvasRenderingContext2D;
type Seed = [number, number, number, number];
type Fill = string | CanvasGradient;

export interface RebelFace {
  turn: number;
  mouth: number;
  lids: number;
  look: number;
  brow: number;
  blood: number;
}

interface RebelPose {
  lean: number;
  bob: number;
  head: number;
  legNear: number;
  kneeNear: number;
  legFar: number;
  kneeFar: number;
  armNear: number;
  elbowNear: number;
  armFar: number;
  elbowFar: number;
}

const TRACKS = config.tracks as unknown as Record<string, TrackKey[]>;
const { width: W, height: H } = config.stage;
const palette = config.palette;
const ENEMY_PALETTE: Palette = { ...shade(ROBOT.palette, { brightness: 1.1, saturate: 0 }), visor: ROBOT.palette.visor! };
const { AX, SIDE_AX, FOOT_Y } = ROBOT;
const PI = Math.PI;
const DEG = PI / 180;
const LINE_W = 1.4;
const FULL_LINE_PX = 500;
const HUMAN_LINE = 1.2;

const num = (name: string, t: number): number => sampleTrack(TRACKS[name]!, t) as number;
const text = (name: string, t: number): string => String(sampleTrack(TRACKS[name]!, t));
const skin = (key: string): string => SKIN[key]!;

const rng = (seed: number): (() => number) => {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
};

export const scatter = (seed: number, count: number, x0: number, x1: number, y0: number, y1: number): Seed[] => {
  const r = rng(seed);
  const out: Seed[] = [];
  for (let i = 0; i < count; i++) out.push([x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), r(), r()]);
  return out;
};

const unitLine = (ctx: Ctx, px: number): number => {
  const m = ctx.getTransform();
  return px / Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
};

const robotLine = (ctx: Ctx, k: number): number => {
  const m = ctx.getTransform();
  const robotPx = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k * FOOT_Y;
  return Math.min(LINE_W, Math.max(ROBOT.gameLine, (LINE_W * robotPx) / FULL_LINE_PX));
};

function path(ctx: Ctx, pts: Pt[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1]);
  ctx.closePath();
}

export function poly(ctx: Ctx, pts: Pt[], color: string): void {
  ctx.fillStyle = color;
  path(ctx, pts);
  ctx.fill();
}

function cel(ctx: Ctx, pts: Pt[], color: string): void {
  poly(ctx, pts, color);
  ctx.strokeStyle = skin("kLine");
  ctx.lineWidth = unitLine(ctx, HUMAN_LINE);
  ctx.stroke();
}

export function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: Fill): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function oval(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, PI * 2);
  ctx.fill();
}

function capsule(ctx: Ctx, [ax, ay]: Pt, [bx, by]: Pt, r0: number, r1: number, color: string): void {
  const a = Math.atan2(by - ay, bx - ax);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(ax, ay, r0, a + PI / 2, a + PI * 1.5);
  ctx.arc(bx, by, r1, a - PI / 2, a + PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = skin("kLine");
  ctx.lineWidth = unitLine(ctx, HUMAN_LINE);
  ctx.stroke();
}

const reach = ([x, y]: Pt, deg: number, len: number): Pt => [x + Math.sin(deg * DEG) * len, y + Math.cos(deg * DEG) * len];

function limb(ctx: Ctx, root: Pt, upper: number, bend: number, lens: [number, number], widths: [number, number, number], colors: [string, string]): { end: Pt; dir: number } {
  const mid = reach(root, upper, lens[0]);
  const end = reach(mid, upper + bend, lens[1]);
  capsule(ctx, root, mid, widths[0], widths[1], colors[0]);
  capsule(ctx, mid, end, widths[1], widths[2], colors[1]);
  return { end, dir: upper + bend };
}

function boot(ctx: Ctx, [x, y]: Pt, deg: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-deg * DEG);
  cel(ctx, [[-6, -4], [6, -4], [9, 2], [20, 4], [21, 9], [-7, 9]], color);
  ctx.restore();
}

function hand(ctx: Ctx, [x, y]: Pt, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, PI * 2);
  ctx.fill();
  ctx.strokeStyle = skin("kLine");
  ctx.lineWidth = unitLine(ctx, HUMAN_LINE);
  ctx.stroke();
}

function sideHead(ctx: Ctx, [x, y]: Pt, tilt: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt * DEG);
  cel(ctx, [[-4, 8], [4, 8], [5, 20], [-5, 20]], skin("skin1"));
  cel(ctx, [[-11, -6], [-6, -15], [4, -16], [12, -9], [13, -2], [16, 3], [12, 5], [12, 11], [5, 16], [-4, 15], [-11, 6]], skin("skin2"));
  poly(ctx, [[6, 9], [12, 11], [5, 16], [-1, 15]], skin("skin1"));
  cel(ctx, [[-13, 2], [-14, -8], [-8, -17], [3, -19], [13, -12], [13, -7], [5, -9], [-1, -7], [-4, -1], [-8, 4]], skin("hair1"));
  poly(ctx, [[-8, -15], [3, -17], [10, -12], [2, -13], [-5, -10]], skin("hair2"));
  oval(ctx, -3, 0, 3, 4, skin("skin1"));
  rect(ctx, 6, -4, 4, 1.6, skin("hair0"));
  ctx.restore();
}

const runnerPose = (phase: number): RebelPose => {
  const s = Math.sin(phase * PI * 2);
  return {
    lean: 14,
    bob: -5 * Math.abs(Math.cos(phase * PI * 2)),
    head: 8,
    legNear: 42 * s,
    kneeNear: -(22 + 50 * (0.5 - 0.5 * s)),
    legFar: -42 * s,
    kneeFar: -(22 + 50 * (0.5 + 0.5 * s)),
    armNear: -45 * s,
    elbowNear: 85,
    armFar: 45 * s,
    elbowFar: 85,
  };
};

function rebelFigure(ctx: Ctx, p: RebelPose): void {
  const hip: Pt = [0, p.bob];
  const up = 180 - p.lean;
  const shoulder = reach(hip, up, 60);
  const neck = reach(hip, up, 70);
  const legLens: [number, number] = [46, 46];
  const legW: [number, number, number] = [12, 9, 6.5];
  const armLens: [number, number] = [30, 28];
  const armW: [number, number, number] = [8, 6.5, 5];
  const farArm = limb(ctx, reach(shoulder, 0, 4), p.armFar, p.elbowFar, armLens, armW, [skin("jac0"), skin("jac0")]);
  hand(ctx, reach(farArm.end, farArm.dir, 4), 5, skin("skin1"));
  const farLeg = limb(ctx, [-2, hip[1]], p.legFar, p.kneeFar, legLens, legW, [skin("den0"), skin("den0")]);
  boot(ctx, farLeg.end, p.legFar + p.kneeFar, skin("boot0"));
  const back = reach(hip, up + 90, 12);
  const front = reach(hip, up - 90, 12);
  const backTop = reach(shoulder, up + 90, 15);
  const frontTop = reach(shoulder, up - 90, 13);
  cel(ctx, [back, reach(back, up, 34), backTop, reach(neck, up + 90, 5), reach(neck, up - 90, 5), frontTop, reach(front, up, 30), front], skin("jac2"));
  poly(ctx, [back, reach(back, up, 34), backTop, reach(backTop, up - 90, 8), reach(back, up - 90, 7)], skin("jac1"));
  cel(ctx, [reach(back, 0, -2), reach(front, 0, -2), reach(front, 0, 6), reach(back, 0, 6)], skin("den1"));
  const nearLeg = limb(ctx, hip, p.legNear, p.kneeNear, legLens, legW, [skin("den2"), skin("den1")]);
  boot(ctx, nearLeg.end, p.legNear + p.kneeNear, skin("boot1"));
  sideHead(ctx, reach(neck, up, 13), p.head);
  const nearArm = limb(ctx, shoulder, p.armNear, p.elbowNear, armLens, armW, [skin("jac2"), skin("jac1")]);
  hand(ctx, reach(nearArm.end, nearArm.dir, 4), 5, skin("skin2"));
}

function drawRebel(ctx: Ctx, x: number, y: number, k: number, flip: boolean, rot: number, p: RebelPose): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot * DEG);
  ctx.scale(flip ? -k : k, k);
  rebelFigure(ctx, p);
  ctx.restore();
}

function eye(ctx: Ctx, x: number, ey: number, side: number, f: RebelFace): void {
  poly(ctx, [[x - 26, ey - 14], [x + 24, ey - 16], [x + 22, ey + 8], [x - 22, ey + 10]], skin("skin1"));
  const open = 5.5 * (1 - f.lids);
  oval(ctx, x, ey, 13, Math.max(0.6, open), skin("c1"));
  if (open > 1.5) oval(ctx, x + f.look * 5, ey + 0.5, 4.5, open, skin("hair0"));
  ctx.strokeStyle = skin("kLine");
  ctx.lineWidth = unitLine(ctx, HUMAN_LINE * 1.6);
  ctx.beginPath();
  ctx.moveTo(x - 17, ey + 1);
  ctx.quadraticCurveTo(x, ey - open * 1.6 - 1, x + 17, ey - 1);
  ctx.stroke();
  const b = f.brow * side * 3;
  poly(ctx, [[x - 24, ey - 17 - b], [x + 24, ey - 20 + b], [x + 22, ey - 11 + b], [x - 24, ey - 9 - b]], skin("hair1"));
}

function face(ctx: Ctx, f: RebelFace): void {
  const turn = f.turn;
  const ex = 30 * (1 - 0.25 * turn);
  const ey = -14;
  const sh = turn * 10;
  cel(ctx, [[-200, 150], [-90, 110], [-40, 100], [50, 100], [100, 115], [210, 150], [270, 300], [-270, 300]], skin("jac2"));
  poly(ctx, [[-200, 150], [-90, 110], [-60, 140], [-120, 300], [-270, 300]], skin("jac1"));
  cel(ctx, [[-50, 50], [50, 50], [62, 150], [0, 168], [-58, 150]], skin("skin1"));
  poly(ctx, [[-50, 50], [10, 72], [30, 140], [0, 168], [-58, 150]], skin("skin0"));
  cel(ctx, [[-90, 110], [-40, 100], [0, 168], [-30, 175]], skin("jac3"));
  cel(ctx, [[100, 115], [50, 100], [0, 168], [30, 175]], skin("jac3"));
  cel(ctx, [[-88, -30], [-92, -80], [-60, -118], [0, -128], [60, -114], [88, -76], [90, -20], [70, 10], [-70, 10]], skin("hair0"));
  cel(ctx, [[-76, -40], [-62, -84], [-20, -106], [40, -102], [74, -70], [80, -10], [72, 40], [48 + sh, 84], [12 + sh, 104], [-24 + sh, 98], [-56, 70], [-74, 22]], skin("skin2"));
  poly(ctx, [[-76, -40], [-74, 22], [-56, 70], [-24 + sh, 98], [-36 + sh, 64], [-52, 24], [-58, -28]], skin("skin1"));
  poly(ctx, [[74, -70], [80, -10], [72, 40], [60, 6], [62, -40]], skin("skin1"));
  poly(ctx, [[-50 + sh, 10], [-28 + sh, 14], [-46, 26]], skin("skin3"));
  poly(ctx, [[44 + sh, 10], [62, 8], [58, 22]], skin("skin3"));
  poly(ctx, [[-56, 70], [-24 + sh, 98], [12 + sh, 104], [48 + sh, 84], [40 + sh, 70], [0 + sh, 82], [-40, 60]], skin("skin1"));
  cel(ctx, [[76, -26], [92, -30], [96, -2], [88, 22], [74, 18]], skin("skin2"));
  poly(ctx, [[80, -16], [88, -18], [88, 6], [80, 10]], skin("skin1"));
  for (const side of [-1, 1]) eye(ctx, sh + side * ex, ey, side, f);
  poly(ctx, [[sh + 2, -8], [sh - 8, 30], [sh - 2, 42], [sh + 18, 40], [sh + 12, 28], [sh + 8, -6]], skin("skin1"));
  poly(ctx, [[sh + 6, -6], [sh + 14, 30], [sh + 18, 40], [sh + 10, 36]], skin("skin3"));
  oval(ctx, sh + 2, 40, 4, 2.4, skin("skin0"));
  oval(ctx, sh + 16, 40, 3, 2, skin("skin0"));
  const mx = sh + 4;
  const my = 64;
  const open = f.mouth * 14;
  oval(ctx, mx, my + open / 2, 22, 3 + open / 2, skin("hole"));
  if (open > 2) rect(ctx, mx - 12, my - 1, 24, Math.min(4, open / 3), skin("c2"));
  ctx.strokeStyle = skin("kLine");
  ctx.lineWidth = unitLine(ctx, HUMAN_LINE * 1.6);
  ctx.beginPath();
  ctx.moveTo(mx - 26, my + 2);
  ctx.quadraticCurveTo(mx, my - 3, mx + 24, my);
  ctx.stroke();
  poly(ctx, [[mx - 18, my + 6 + open], [mx + 18, my + 6 + open], [mx + 10, my + 12 + open], [mx - 12, my + 12 + open]], skin("skin1"));
  cel(ctx, [[-70, -36], [-66, -80], [-30, -108], [30, -110], [72, -84], [84, -50], [74, -40], [56, -62], [30, -72], [36, -58], [8, -70], [-14, -62], [-10, -76], [-40, -62], [-56, -40]], skin("hair1"));
  poly(ctx, [[-50, -84], [-20, -102], [30, -104], [10, -92], [-26, -84]], skin("hair2"));
  poly(ctx, [[30, -72], [44, -54], [52, -64]], skin("hair1"));
  if (f.blood > 0) {
    ctx.globalAlpha = f.blood;
    poly(ctx, [[mx + 20, my + 2], [mx + 28, my + 4], [mx + 34, my + 40], [mx + 26, my + 44], [mx + 22, my + 20]], skin("blood"));
    poly(ctx, [[-40, -64], [-26, -70], [-30, -50], [-36, -40]], skin("blood"));
    ctx.globalAlpha = 1;
  }
}

export function drawFace(ctx: Ctx, x: number, y: number, k: number, rot: number, f: RebelFace): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot * DEG);
  ctx.scale(k, k);
  face(ctx, f);
  ctx.restore();
}

const SKY_STREAKS = scatter(11, 60, -400, 2000, 0, 1);
const GROUND_STREAKS = scatter(12, 70, -400, 2000, 0, 1);
const SPRAY = scatter(31, 14, 0, 140, -60, 60);
const SPARKS = scatter(41, 16, -60, 60, -60, 60);
const TRACERS = scatter(43, 6, 0, 1, -1, 1);

type Waste = [string, string, string, string, string, string, string, string, string];

function wasteland(ctx: Ctx, t: number, horizon: number, colors: Waste): void {
  const sky = ctx.createLinearGradient(0, -600, 0, horizon);
  sky.addColorStop(0, colors[0]);
  sky.addColorStop(0.7, colors[1]);
  sky.addColorStop(1, colors[2]);
  rect(ctx, -1200, -600, 4000, horizon + 600, sky);
  for (const [x, f, a, b] of SKY_STREAKS) {
    const y = -500 + f * (horizon + 480);
    const drift = ((x + t * (20 + b * 30)) % 2400) - 400;
    ctx.globalAlpha = 0.15 + a * 0.35;
    oval(ctx, drift, y, 200 + a * 420, 3 + b * 12 * f, b < 0.55 ? colors[3] : colors[4]);
  }
  ctx.globalAlpha = 1;
  const ground = ctx.createLinearGradient(0, horizon, 0, horizon + 700);
  ground.addColorStop(0, colors[5]);
  ground.addColorStop(1, colors[6]);
  rect(ctx, -1200, horizon, 4000, 1600, ground);
  for (const [x, f, a, b] of GROUND_STREAKS) {
    const y = horizon + 6 + f * f * 900;
    ctx.globalAlpha = 0.2 + a * 0.3;
    oval(ctx, x, y, 40 + a * 160 * (0.3 + f), 2 + f * 8, b < 0.5 ? colors[7] : colors[8]);
  }
  ctx.globalAlpha = 1;
}

const WASTE_A = (): Waste => [palette.skyTop, palette.skyMid, palette.skyLow, palette.cloudDark, palette.cloudLight, palette.dirtFar, palette.dirtNear, palette.dirtDark, palette.dirtLight];
const WASTE_B = (): Waste => [palette.skyTop, palette.skyMid, palette.skyLow, palette.cloudDark, palette.cloudLight, palette.rustFar, palette.rustNear, palette.dirtDark, palette.rustLight];

function scaffold(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.strokeStyle = palette.girder;
  ctx.lineWidth = 7;
  ctx.beginPath();
  for (let i = 0; i <= 4; i++) {
    ctx.moveTo(x + (w * i) / 4, y);
    ctx.lineTo(x + (w * i) / 4, y + h);
  }
  for (let i = 0; i <= 3; i++) {
    ctx.moveTo(x, y + (h * i) / 3);
    ctx.lineTo(x + w, y + (h * i) / 3);
  }
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w / 2, y);
  ctx.stroke();
}

function rustTower(ctx: Ctx, x: number, y: number): void {
  poly(ctx, [[x, y], [x + 30, y - 160], [x + 80, y - 175], [x + 110, y - 90], [x + 150, y - 70], [x + 150, y]], palette.rust);
  poly(ctx, [[x + 80, y - 175], [x + 110, y - 90], [x + 150, y - 70], [x + 150, y], [x + 100, y]], palette.rustDark);
}

let trees: { front: GroupNode; side: GroupNode; back: GroupNode; droid: GroupNode; heroBack: GroupNode } | null = null;
const rigs = () =>
  (trees ??= {
    front: buildFront(),
    side: buildSide({ farLimbs: true }),
    back: buildBack({}),
    droid: buildFront({ enemy: true }),
    heroBack: buildBack({ rightForeBehind: true }),
  });

function placeBot(ctx: Ctx, root: GroupNode, x: number, y: number, k: number, ax: number, sx: number, pose: Pose, hooks: Record<string, HookDraw | undefined>, pal: Palette): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k * sx, k);
  ctx.translate(-ax, -FOOT_Y);
  const lineW = robotLine(ctx, 1);
  drawRig(ctx, root, { palette: pal, pose, hooks, lineW });
  ctx.restore();
}

function shotTurn(ctx: Ctx, t: number): void {
  wasteland(ctx, t, 470, WASTE_A());
  scaffold(ctx, 1080, 250, 300, 220);
  rustTower(ctx, 1220, 470);
  poly(ctx, [[60, 470], [110, 330], [130, 340], [100, 470]], palette.rustDark);
  poly(ctx, [[130, 470], [200, 380], [214, 392], [170, 470]], palette.rust);
  const turn = num("turn", t);
  const c = Math.cos(turn * DEG);
  const { front, side, back } = rigs();
  const x = num("botX", t);
  const y = num("botY", t);
  const k = num("botK", t);
  const pose = { arm: 10, fore: -20, armFar: -10, foreFar: -20, armL: 8, armR: -8, foreL: -6, foreR: 6 };
  const pal = shade(ROBOT.palette, { brightness: config.light.dusk, saturate: 1 });
  if (turn < 55) placeBot(ctx, front, x, y, k, AX, c, pose, {}, pal);
  else if (turn < 125) placeBot(ctx, side, x, y, k, SIDE_AX, Math.sin(turn * DEG), pose, {}, pal);
  else placeBot(ctx, back, x, y, k, AX, -c, pose, {}, pal);
}

function wreck(ctx: Ctx): void {
  poly(ctx, [[1000, 560], [1060, 330], [1150, 290], [1180, 330], [1120, 400], [1090, 560]], palette.rust);
  poly(ctx, [[1060, 330], [1150, 290], [1180, 330], [1140, 340]], palette.rustLight);
  ctx.strokeStyle = palette.rod;
  ctx.lineWidth = 7;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.moveTo(1170 + i * 46, 500);
    ctx.lineTo(1210 + i * 52, 300 + i * 8);
  }
  ctx.stroke();
  poly(ctx, [[1130, 520], [1430, 450], [1600, 500], [1560, 570], [1170, 590]], palette.wreck);
  poly(ctx, [[1130, 520], [1430, 450], [1460, 474], [1160, 546]], palette.wreckLight);
  ctx.strokeStyle = palette.rod;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(1050, 600);
  ctx.lineTo(1150, 660);
  ctx.moveTo(1150, 600);
  ctx.lineTo(1050, 660);
  ctx.moveTo(1100, 590);
  ctx.lineTo(1100, 670);
  ctx.moveTo(-60, 470);
  ctx.lineTo(-50, 60);
  ctx.stroke();
}

function droid(ctx: Ctx, x: number, y: number, k: number, rot: number, t: number): void {
  const { droid: root } = rigs();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot * DEG);
  const pose = { body: Math.sin(t * 5) * 2, armL: -24, foreL: -66, armR: 30, foreR: -50 };
  placeBot(ctx, root, 0, 0, k, AX, 1, pose, { handL: (c, pal) => gunHook(c, pal, { lineW: robotLine(c, k), simple: false }) }, ENEMY_PALETTE);
  ctx.restore();
}

function shotRun(ctx: Ctx, t: number): void {
  wasteland(ctx, t, 440, WASTE_B());
  wreck(ctx);
  droid(ctx, 1450, 660, 0.3, 0, t);
  if (text("bust", t) === "run") drawRebel(ctx, num("runX", t), num("runY", t), num("runK", t), true, 0, runnerPose(num("phase", t)));
  else drawFace(ctx, num("faceX", t), num("faceY", t), num("faceK", t), -4, { turn: num("faceTurn", t), mouth: 0.15, lids: 0.3, look: 0.6, brow: 1, blood: 0 });
}

function ruin(ctx: Ctx): void {
  rect(ctx, -400, -400, 2400, 960, palette.ruinSky);
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 4; j++) {
      rect(ctx, -300 + i * 230, 60 + j * 120, 200, 100, j === 3 ? palette.glassLit : palette.glass);
    }
  ctx.fillStyle = palette.beam;
  for (let i = 0; i <= 6; i++) ctx.fillRect(-310 + i * 230, 40, 18, 520);
  for (let j = 0; j <= 4; j++) ctx.fillRect(-310, 46 + j * 120, 1400, 14);
  poly(ctx, [[1060, 560], [1060, 140], [1180, 120], [1200, 560]], palette.ruinSky);
  rect(ctx, 1300, -400, 220, 960, palette.brick);
  ctx.fillStyle = palette.brickDark;
  for (let y = -380; y < 560; y += 30) ctx.fillRect(1300, y, 220, 4);
  for (let y = -380; y < 560; y += 60) ctx.fillRect(1380, y, 4, 30);
  rect(ctx, 1300, -400, 30, 960, palette.brickDark);
  poly(ctx, [[560, 300], [1000, 280], [1010, 560], [570, 580]], palette.block);
  poly(ctx, [[1000, 280], [1040, 300], [1046, 556], [1010, 560]], palette.blockDark);
  const ground = ctx.createLinearGradient(0, 560, 0, 1100);
  ground.addColorStop(0, palette.sandFar);
  ground.addColorStop(1, palette.sandNear);
  rect(ctx, -400, 560, 2400, 700, ground);
  for (const [x, f, a, b] of GROUND_STREAKS) {
    ctx.globalAlpha = 0.25 + a * 0.3;
    oval(ctx, x, 570 + f * f * 500, 30 + a * 120 * (0.3 + f), 2 + f * 7, b < 0.5 ? palette.sandDark : palette.sandLight);
  }
  ctx.globalAlpha = 1;
}

function shotHit(ctx: Ctx, t: number): void {
  ruin(ctx);
  const p: RebelPose = {
    lean: num("lean", t),
    bob: 0,
    head: num("headTilt", t),
    legNear: num("legNear", t),
    kneeNear: num("kneeNear", t),
    legFar: num("legFar", t),
    kneeFar: num("kneeFar", t),
    armNear: num("armNear", t),
    elbowNear: num("elbowNear", t),
    armFar: num("armFar", t),
    elbowFar: num("elbowFar", t),
  };
  const x = num("hitX", t);
  const y = num("hitY", t);
  drawRebel(ctx, x, y, 4.6, true, num("fall", t), p);
  const spray = num("spray", t);
  if (spray > 0) {
    ctx.globalAlpha = spray;
    for (const [dx, dy, a] of SPRAY) oval(ctx, x + 40 + dx * (1.4 - spray), y - 230 + dy * (1.4 - spray), 6 + a * 10, 6 + a * 10, skin("blood"));
    ctx.globalAlpha = 1;
  }
}

function bricks(ctx: Ctx): void {
  rect(ctx, 1460, -400, 600, 1500, palette.brick);
  ctx.fillStyle = palette.brickDark;
  for (let y = -380, row = 0; y < 1100; y += 34, row++) {
    ctx.fillRect(1460, y, 600, 5);
    for (let x = 1460 + (row % 2) * 40; x < 2060; x += 80) ctx.fillRect(x, y, 5, 34);
  }
  rect(ctx, 1460, -400, 24, 1500, palette.brickDark);
}

function battlefield(ctx: Ctx, t: number): void {
  wasteland(ctx, t, 300, WASTE_B());
  poly(ctx, [[-100, 300], [-60, 200], [40, 210], [60, 300]], palette.wreck);
  poly(ctx, [[380, 300], [420, 210], [450, 205], [500, 300]], palette.rust);
  poly(ctx, [[900, 300], [960, 160], [1000, 150], [1010, 300]], palette.rust);
  poly(ctx, [[1000, 300], [1100, 200], [1250, 250], [1250, 300]], palette.wreck);
  ctx.strokeStyle = palette.rod;
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(1060 + i * 40, 280);
    ctx.lineTo(1090 + i * 44, 170);
  }
  ctx.stroke();
  bricks(ctx);
}

const gunWithFlash =
  (k: number, flash: number): HookDraw =>
  (c, pal) => {
    gunHook(c, pal, { lineW: robotLine(c, k), simple: false });
    if (flash > 0) {
      c.save();
      c.transform(0, 1, -1, 0, 0, 0);
      c.translate(MUZZLE[0], MUZZLE[1]);
      c.globalAlpha = flash;
      poly(c, [[0, 0], [60, -40], [40, -8], [110, 0], [40, 8], [60, 40]], palette.flash);
      oval(c, 10, 0, 30, 22, palette.flashCore);
      c.restore();
    }
  };

function shotFire(ctx: Ctx, t: number): void {
  battlefield(ctx, t);
  const fall = num("droidFall", t);
  const hit = num("droidHit", t);
  const dx = 1300;
  const dy = 470;
  droid(ctx, dx, dy + fall * 6, 0.17, fall * 60, t);
  if (hit > 0) {
    ctx.globalAlpha = hit;
    for (const [sx, sy, a] of SPARKS) oval(ctx, dx + sx, dy - 80 + sy, 4 + a * 8, 4 + a * 8, palette.flash);
    ctx.globalAlpha = 1;
  }
  const { heroBack } = rigs();
  const aim = num("aim", t);
  const firing = num("fire", t) > 0;
  const flash = firing ? (Math.floor(t * 24) % 2 ? 1 : 0.4) : 0;
  const pose = { armR: -6 - 82 * aim, foreR: -4 * aim, armL: 6, foreL: 4, body: -4 * aim };
  const bx = 560 + num("recoil", t) * Math.sin(t * 80) * 4;
  const by = 960;
  const k = 0.95;
  placeBot(ctx, heroBack, bx, by, k, AX, 1, pose, { handR: gunWithFlash(k, flash) }, ROBOT.palette);
  if (firing) {
    const hookAt = locate(heroBack, "handR", pose);
    if (!hookAt) throw new Error("no handR hook");
    const [px, py] = apply(hookAt, MUZZLE_IN_HOOK);
    const mx = bx + (px - AX) * k;
    const my = by + (py - FOOT_Y) * k;
    ctx.strokeStyle = palette.flash;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (const [u, , v] of TRACERS) {
      const a = (u + t * 6) % 1;
      const b = Math.min(1, a + 0.12);
      const tx = dx + v * 20;
      const ty = dy - 90 + v * 30;
      ctx.moveTo(mx + (tx - mx) * a, my + (ty - my) * a);
      ctx.lineTo(mx + (tx - mx) * b, my + (ty - my) * b);
    }
    ctx.stroke();
  }
}

const SHOTS: Record<string, (ctx: Ctx, t: number) => void> = { A: shotTurn, B: shotRun, C: shotHit, D: shotFire };

function render(ctx: Ctx, w: number, h: number, t: number): void {
  ctx.save();
  rect(ctx, 0, 0, w, h, "#000");
  const s = Math.min(w / W, h / H);
  ctx.translate((w - W * s) / 2, (h - H * s) / 2);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  const z = num("camZ", t);
  ctx.translate(W / 2 - num("camX", t) * z, H / 2 - num("camY", t) * z);
  ctx.scale(z, z);
  SHOTS[text("shot", t)]!(ctx, t);
  ctx.restore();
}

export const rebelShot: Cutscene = {
  id: "rebelShot",
  duration: config.duration,
  camera: config.camera,
  render,
};
