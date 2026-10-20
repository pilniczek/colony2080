import config from "@config/cutscenes/mission-start.json";
import { sampleTrack, type TrackKey } from "../../engine/anim/keyed";
import { drawRig, shade, type HookDraw, type Palette } from "../../engine/rig/draw";
import { locate, type Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset } from "../env/paint";
import { FRONT_BARREL, gunHook, holdPoses } from "../robot/gun";
import { buildBack, buildFront, buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";

type Spot = [number, number, number, number];
type Shot = (t: number) => void;
type MarchFile = (typeof config.march.files)[number];
interface RobotOptions {
  ax?: number;
  pose?: Pose;
  pal?: Palette;
  hooks?: Record<string, HookDraw | undefined>;
  simple?: boolean;
  sx?: number;
  lineW?: number;
}

const TRACKS = config.tracks as unknown as Record<string, TrackKey[]>;
const { width: W, height: H } = config.stage;
const palette = { ...config.palette };
const BOT = ROBOT.palette;
const DEG = Math.PI / 180;
const LINE_W = 1.4;
const FULL_LINE_PX = 500;
const MONO = "Share Tech Mono, monospace";
let ctx: CanvasRenderingContext2D;

const num = (name: string, t: number): number => sampleTrack(TRACKS[name]!, t) as number;
const text = (name: string, t: number): string => String(sampleTrack(TRACKS[name]!, t));

function rng(seed: number): () => number {
  let a = seed + 0x6d2b79f5;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function scatter(seed: number, n: number, x0: number, y0: number, w: number, h: number): Spot[] {
  const r = rng(seed);
  const pts: Spot[] = [];
  for (let i = 0; i < n; i++) pts.push([x0 + r() * w, y0 + r() * h, r(), r()]);
  return pts;
}

const STARS = scatter(11, 260, 0, 0, W, H);
const GRASS = scatter(23, 140, 0, 540, W, 360);
const CRACKS = scatter(37, 70, -600, 360, 3200, 600);
const DEBRIS = scatter(41, 26, -200, 520, 1500, 220);
const SKY_PUFFS = scatter(53, 40, -400, 20, 2600, 420);

function rect(x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function poly(pts: Pt[], color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1]);
  ctx.closePath();
  ctx.fill();
}

function oval(x: number, y: number, rx: number, ry: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function outline(pts: Pt[], color: string, width: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1]);
  ctx.stroke();
}

function vertical(y0: number, y1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [k, c] of stops) g.addColorStop(k, c);
  return g;
}

function glowDisc(x: number, y: number, r: number, color: string, alpha: number): void {
  ctx.globalAlpha = alpha;
  oval(x, y, r, r, color);
  ctx.globalAlpha = alpha * 0.5;
  oval(x, y, r * 1.8, r * 1.8, color);
  ctx.globalAlpha = 1;
}

function veil(color: string, alpha: number): void {
  if (alpha <= 0) return;
  ctx.globalAlpha = Math.min(1, alpha);
  rect(0, 0, W, H, color);
  ctx.globalAlpha = 1;
}

function camera(cx: number, cy: number, z: number): void {
  ctx.translate(W / 2 - cx * z, H / 2 - cy * z);
  ctx.scale(z, z);
}

interface Rigs {
  side: GroupNode;
  front: GroupNode;
  enemyFront: GroupNode;
  sideLod: GroupNode;
  badge: GroupNode;
  back: GroupNode;
  hold: ReturnType<typeof holdPoses>;
}

let rigs: Rigs | null = null;
function robots(): Rigs {
  if (rigs) return rigs;
  const side = buildSide({ farLimbs: true });
  const front = buildFront();
  const enemyFront = buildFront({ enemy: true });
  rigs = {
    side,
    front,
    enemyFront,
    sideLod: buildSide({ farLimbs: true, lod: true }),
    badge: buildSide({ farLimbs: true, badge: true }),
    back: buildBack(),
    hold: holdPoses(side, front),
  };
  return rigs;
}

const ENEMY: Palette = { ...shade(BOT, { brightness: 1.1, saturate: 0 }), visor: BOT.visor! };
const tones: Record<string, Palette> = {};
function dimmed(base: Palette, key: string, k: number): Palette {
  const id = key + k;
  return tones[id] ?? (tones[id] = shade(base, { brightness: k }));
}

let wire: Palette | null = null;
function wirePalette(): Palette {
  if (wire) return wire;
  const made: Palette = {};
  for (const key of Object.keys(BOT)) made[key] = key.endsWith("Line") ? palette.wire : palette.wireFill;
  wire = made;
  return made;
}

function lineFor(k: number): number {
  const m = ctx.getTransform();
  const px = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k * ROBOT.FOOT_Y;
  return Math.min(LINE_W, Math.max(ROBOT.gameLine, (LINE_W * px) / FULL_LINE_PX));
}

function robot(root: GroupNode, x: number, floorY: number, k: number, { ax = ROBOT.SIDE_AX, pose = {}, pal = BOT, hooks = {}, simple = false, sx = 1, lineW = 0 }: RobotOptions = {}): void {
  ctx.save();
  ctx.translate(x, floorY);
  ctx.scale(k * sx, k);
  ctx.translate(-ax, -ROBOT.FOOT_Y);
  drawRig(ctx, root, { palette: pal, pose, hooks, lineW: lineW || lineFor(k), simple });
  ctx.restore();
}

function walkPose(phase: number): Pose {
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  return {
    hipNear: -22 * s,
    hipFar: 22 * s,
    kneeNear: 2 + 34 * Math.max(0, c),
    kneeFar: 2 + 34 * Math.max(0, -c),
    ankleNear: -1.4 - 10 * Math.max(0, c),
    ankleFar: -1.4 - 10 * Math.max(0, -c),
    arm: 16 * s,
    fore: -18,
    armFar: -16 * s,
    foreFar: -18,
  };
}

function guard(x: number, floorY: number, k: number, pal: Palette): void {
  const { enemyFront, hold } = robots();
  const pose = { ...hold.FRONT_CARRY, ...hold.FRONT_CARRY_R };
  const lineW = lineFor(k);
  robot(enemyFront, x, floorY, k, {
    ax: ROBOT.AX,
    pose,
    pal,
    lineW,
    hooks: { handL: (c) => gunHook(c, pal, { lineW, barrel: FRONT_BARREL }) },
  });
}

function stars(dx: number, dy: number): void {
  ctx.fillStyle = palette.star;
  for (const [x, y, a, b] of STARS) {
    ctx.globalAlpha = 0.3 + a * 0.7;
    const s = b < 0.85 ? 2 : 4;
    ctx.fillRect((((x + dx) % W) + W) % W, (((y + dy) % H) + H) % H, s, s);
  }
  ctx.globalAlpha = 1;
}

function marchFile(file: MarchFile, fi: number, t: number): void {
  const { sideLod, side } = robots();
  const pal = dimmed(BOT, "hero", file.dim);
  for (let i = 0; i < file.n; i++) {
    const x = file.x0 + i * file.gap + t * file.speed;
    if (x < -400 || x > 1820) continue;
    const phase = (t * config.march.cadence + i * 0.37 + fi * 0.5) * Math.PI * 2;
    const bob = Math.abs(Math.cos(phase)) * 10 * file.k;
    robot(file.lod ? sideLod : side, x, file.floorY - bob, file.k, { pose: walkPose(phase), pal, simple: file.lod });
  }
}

function march(t: number): void {
  const M = config.march;
  ctx.save();
  camera(num("marchCamX", t), 470, num("marchZ", t));
  rect(-1200, -400, 4400, 960, palette.hangarWall);
  for (let x = -1100; x < 3000; x += 360) {
    rect(x, -400, 44, 960, palette.hangarPillar);
    rect(x, -400, 8, 960, palette.hangarPillarLit);
  }
  rect(-1200, 110, 4400, 26, palette.hangarBeam);
  rect(1520, 250, 230, 310, palette.hatch);
  ctx.globalAlpha = 0.18;
  poly([[1520, 560], [1750, 560], [1980, 760], [1300, 760]], palette.hatchGlow);
  ctx.globalAlpha = 1;
  rect(-1200, 560, 4400, 800, palette.plate);
  ctx.strokeStyle = palette.plateLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = -2400; x < 4400; x += 90) {
    ctx.moveTo(x, 560);
    ctx.lineTo(800 + (x - 800) * 2.6, 1300);
  }
  for (let d = 8; d < 800; d *= 1.35) {
    ctx.moveTo(-1200, 560 + d);
    ctx.lineTo(3200, 560 + d);
  }
  ctx.stroke();
  rect(-1200, 560, 4400, 6, palette.plateShine);
  marchFile(M.files[0]!, 0, t);
  for (const g of M.guards) guard(g.x, g.floorY, g.k, dimmed(ENEMY, "enemy", g.dim));
  marchFile(M.files[1]!, 1, t);
  ctx.restore();
  ctx.fillStyle = vertical(0, H, [[0, "rgba(0,0,0,0.55)"], [0.45, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.35)"]]);
  ctx.fillRect(0, 0, W, H);
}

function shipThrust(x: number, y: number, len: number, alpha: number): void {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha * 0.45;
  poly([[x, y - 9], [x - len, y - 3], [x - len, y + 3], [x, y + 9]], palette.thrustGlow);
  ctx.globalAlpha = alpha;
  rect(x - 3, y - 4, 4, 8, palette.thrust);
  ctx.globalAlpha = 1;
}

function sideShip(x: number, y: number, k: number, rot: number, state: number, thrust: number, t: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot * DEG);
  ctx.scale(k, k);
  drawAsset(ctx, ASSETS.crashedShip, { state, t });
  shipThrust(-8, -36, 40 + 30 * thrust, thrust);
  shipThrust(-8, -25, 40 + 30 * thrust, thrust);
  ctx.restore();
}

function hangar(t: number): void {
  ctx.save();
  camera(num("hangCamX", t), 430, num("hangZ", t));
  rect(-1200, -600, 4600, 1900, palette.space);
  ctx.save();
  ctx.beginPath();
  ctx.rect(1250, -150, 1350, 790);
  ctx.clip();
  ctx.translate(1250, -150);
  stars(0, 0);
  ctx.restore();
  const planet = ctx.createRadialGradient(1700, 140, 40, 1820, 260, 380);
  planet.addColorStop(0, palette.planetLit);
  planet.addColorStop(0.55, palette.planet);
  planet.addColorStop(1, palette.planetDark);
  ctx.fillStyle = planet;
  ctx.beginPath();
  ctx.arc(1820, 260, 360, 0, Math.PI * 2);
  ctx.fill();
  rect(-1200, -600, 2450, 1240, palette.bayWall);
  rect(1250, -600, 1350, 450, palette.bayWall);
  rect(2600, -600, 1000, 1240, palette.bayWall);
  for (let x = -1100; x < 1250; x += 220) rect(x, -600, 10, 1240, palette.bayPanel);
  rect(-1200, 120, 2450, 12, palette.bayPanel);
  rect(1230, -170, 20, 810, palette.railShade);
  rect(2600, -170, 20, 810, palette.railShade);
  ctx.fillStyle = vertical(640, 1300, [[0, palette.bayFloorFar], [1, palette.bayFloor]]);
  ctx.fillRect(-1200, 640, 4800, 700);
  const lift = num("shipLift", t);
  const go = num("shipGo", t);
  ctx.globalAlpha = 0.35 * Math.max(0, 1 - lift / 160);
  oval(200 + go + 470, 650, 520, 22, palette.shadow);
  ctx.globalAlpha = 1;
  sideShip(200 + go, 640 - lift, 4.8, 0, 0, num("thrust", t), t);
  for (let x = 380; x < 3000; x += 340) rect(x, 600, 16, 260, palette.railShade);
  rect(300, 590, 2700, 18, palette.rail);
  rect(300, 604, 2700, 6, palette.railShade);
  ctx.restore();
  veil(palette.white, num("hangFlash", t));
}

function rearShip(x: number, y: number, k: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  poly([[-520, 34], [-120, -6], [540, -70], [120, 22]], palette.wing);
  poly([[-170, -90], [170, -90], [190, 80], [-190, 80]], palette.hull);
  poly([[-170, -90], [170, -90], [150, -60], [-150, -60]], palette.hullTop);
  rect(-190, 60, 380, 20, palette.hullDark);
  rect(-118, -34, 236, 26, palette.thrust);
  rect(-118, 6, 236, 26, palette.thrust);
  ctx.globalAlpha = 0.3;
  rect(-150, -50, 300, 100, palette.thrustGlow);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function station(x: number, z: number): void {
  ctx.save();
  ctx.translate(800, 450);
  ctx.scale(z, z);
  ctx.translate(-800 + x, -450);
  poly([[-260, 330], [1480, 250], [1780, 420], [1780, 720], [-260, 780]], palette.station);
  poly([[-260, 330], [1480, 250], [1640, 310], [-160, 390]], palette.stationTop);
  poly([[-260, 690], [1780, 640], [1780, 720], [-260, 780]], palette.stationDark);
  rect(960, 110, 120, 230, palette.stationTop);
  rect(1040, 110, 40, 230, palette.station);
  rect(1010, 20, 8, 90, palette.stationTop);
  poly([[1180, 300], [1560, 280], [1560, 360], [1180, 390]], palette.stationDark);
  for (const [bx, by, bw, bh] of [[-100, 560, 420, 70], [700, 560, 380, 60], [1180, 470, 520, 90], [200, 640, 900, 50]] as const) {
    rect(bx, by, bw, bh, palette.stationDark);
    rect(bx, by, bw, 8, palette.stationTop);
  }
  for (let px = 1200; px < 1700; px += 90) {
    oval(px, 330, 40, 22, palette.stationTop);
    oval(px, 336, 40, 16, palette.station);
  }
  const r = rng(5);
  ctx.fillStyle = palette.stationLight;
  for (const row of [450, 520, 600]) for (let wx = -200; wx < 1740; wx += 46) if (r() < 0.55) ctx.fillRect(wx, row - (wx + 260) * 0.03, 24, 6);
  const pod = ctx.createRadialGradient(470, 430, 20, 520, 480, 170);
  pod.addColorStop(0, palette.pod);
  pod.addColorStop(1, palette.podDark);
  ctx.fillStyle = pod;
  ctx.beginPath();
  ctx.ellipse(520, 480, 190, 150, 0, 0, Math.PI * 2);
  ctx.fill();
  oval(600, 500, 46, 46, palette.lens);
  oval(612, 492, 16, 16, palette.white);
  ctx.restore();
}

function planetDisc(x: number, y: number, r: number): void {
  const g = ctx.createRadialGradient(x + r * 0.5, y - r * 0.2, r * 0.1, x, y, r);
  g.addColorStop(0, palette.planetLit);
  g.addColorStop(0.5, palette.planet);
  g.addColorStop(1, palette.planetDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function orbit(t: number): void {
  rect(0, 0, W, H, palette.space);
  stars(num("stationX", t) * 0.05, 0);
  planetDisc(330, 470, 520);
  if (t >= 16.6) rearShip(num("orbitShipX", t), num("orbitShipY", t), num("orbitShip", t) * 0.4);
  station(num("stationX", t), num("stationZ", t));
}

function frontShip(x: number, y: number, k: number, roll: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(roll * DEG);
  ctx.scale(k, k);
  poly([[-520, 6], [-70, -34], [70, -34], [520, 6], [70, 18], [-70, 18]], palette.wing);
  oval(0, 0, 120, 64, palette.hull);
  oval(0, -22, 96, 34, palette.hullTop);
  oval(0, -16, 52, 18, palette.glassLit);
  rect(-140, 30, 30, 50, palette.hullDark);
  rect(110, 30, 30, 50, palette.hullDark);
  ctx.restore();
}

const shipAt = (t: number): [number, number, number] => [num("sdX", t), num("sdY", t), num("sdZ", t)];

function shotDown(t: number): void {
  ctx.fillStyle = vertical(0, 540, [[0, palette.skyHigh], [0.5, palette.skyMid], [0.88, palette.skyLow], [1, palette.skyGlow]]);
  ctx.fillRect(0, 0, W, 540);
  for (const [x, y, a, b] of SKY_PUFFS) {
    ctx.globalAlpha = 0.18 + a * 0.2;
    oval(((x + t * 12) % 2200) - 300, y * 0.7, 160 + b * 260, 14 + a * 22, b < 0.5 ? palette.cloud : palette.cloudDark);
  }
  ctx.globalAlpha = 1;
  poly([[0, 540], [0, 520], [200, 512], [420, 522], [700, 508], [960, 520], [1200, 510], [1600, 522], [1600, 540]], palette.hills);
  ctx.fillStyle = vertical(540, H, [[0, palette.grassFar], [1, palette.grassNear]]);
  ctx.fillRect(0, 540, W, H - 540);
  for (const [x, y, a, b] of GRASS) {
    ctx.globalAlpha = 0.35;
    const d = (y - 540) / 360;
    oval(x, y, 30 + d * 160 * a, 3 + d * 18 * b, palette.grassSpot);
  }
  ctx.globalAlpha = 1;
  const hit = num("sdHit", t);
  if (hit > 0) {
    for (let i = 8; i >= 1; i--) {
      const tt = t - i * 0.08;
      if (tt < 23.12) continue;
      const [px, py, pz] = shipAt(tt);
      ctx.globalAlpha = 0.5 * (1 - i / 9);
      oval(px, py, 40 * pz + i * 14, 30 * pz + i * 10, palette.smoke);
    }
    ctx.globalAlpha = 1;
  }
  const [x, y, z] = shipAt(t);
  frontShip(x, y, z, num("sdRoll", t));
  const boom = num("sdBoom", t);
  if (boom > 0 && boom < 1) {
    ctx.globalAlpha = 0.7 * (1 - boom);
    oval(x, y, 60 + boom * 420, 40 + boom * 260, palette.fire);
    ctx.globalAlpha = 1;
  }
  if (hit > 0) {
    const f = 0.6 + 0.4 * Math.sin(t * 40);
    glowDisc(x + 80 * z, y + 10 * z, 40 * z * f, palette.fire, 0.8);
    oval(x + 80 * z, y + 10 * z, 16 * z, 16 * z, palette.fireHot);
  }
  veil(palette.white, num("sdFlash", t));
}

function hold(t: number): void {
  ctx.save();
  camera(num("holdCamX", t), 450, 1);
  rect(-200, -100, 2000, 1100, palette.holdWall);
  for (let x = -160; x < 1800; x += 150) rect(x, -100, 34, 1100, palette.holdRib);
  rect(-200, 40, 2000, 30, palette.holdPipe);
  rect(-200, 820, 2000, 300, palette.holdRib);
  const { front } = robots();
  for (const r of config.hold.robots) {
    if (r.enemy) guard(r.x, r.floorY, r.k, dimmed(ENEMY, "enemy", 0.6));
    else robot(front, r.x, r.floorY, r.k, { ax: ROBOT.AX, pal: dimmed(BOT, "hero", 0.62) });
  }
  poly([[1180, 380], [1740, 300], [1740, 1000], [1180, 1000]], palette.crate);
  poly([[1180, 380], [1740, 300], [1740, 330], [1180, 410]], palette.crateTop);
  ctx.strokeStyle = palette.crateLine;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 1; i < 12; i++) {
    ctx.moveTo(1180, 410 + i * 18);
    ctx.lineTo(1740, 330 + i * 18);
  }
  ctx.stroke();
  ctx.restore();
  const flick = rng(Math.floor(t * 15))();
  veil(palette.black, 0.25 + flick * 0.25);
  veil(palette.white, num("holdFlash", t));
}

function sparks(x: number, y: number, t: number): void {
  const r = rng(Math.floor(t * 24) + 7);
  ctx.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2;
    const len = 20 + r() * 70;
    const d = r() * 20;
    const sx = x + Math.cos(a) * d;
    const sy = y + Math.sin(a) * d;
    ctx.strokeStyle = r() < 0.5 ? palette.spark : palette.sparkHot;
    ctx.lineWidth = 2 + r() * 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.lineCap = "butt";
}

function fall(t: number): void {
  const sh = num("fallShake", t);
  ctx.save();
  ctx.translate(800 + Math.sin(t * 90) * sh, 450 + Math.cos(t * 77) * sh);
  ctx.rotate(-14 * DEG);
  rect(-1200, -900, 2400, 1800, palette.fallWall);
  ctx.strokeStyle = palette.fallLine;
  ctx.lineWidth = 8;
  ctx.beginPath();
  for (let x = -1200; x < 1200; x += 300) {
    ctx.moveTo(x, -900);
    ctx.lineTo(x, 900);
  }
  for (let y = -900; y < 900; y += 260) {
    ctx.moveTo(-1200, y);
    ctx.lineTo(1200, y);
  }
  ctx.stroke();
  const k = 2.3;
  ctx.translate(-120, num("fallDrop", t));
  ctx.rotate(num("fallAngle", t) * DEG);
  ctx.scale(k, k);
  ctx.translate(-ROBOT.SIDE_AX - 30, -150);
  const pose = { head: num("fallHead", t), arm: num("fallArm", t), fore: -30, armFar: 20, foreFar: -20, hipNear: -10, kneeNear: 20 };
  drawRig(ctx, robots().badge, { palette: BOT, pose, lineW: lineFor(1) });
  if (num("sparks", t) > 0.5) {
    sparks(360, 100, t);
    sparks(250, 200, t + 0.5);
  }
  ctx.restore();
  veil(palette.white, num("fallFlash", t));
}

function noise(t: number): void {
  rect(0, 0, W, H, palette.staticBase);
  const r = rng(Math.floor(t * 24) + 101);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = r() < 0.5 ? palette.staticLight : palette.staticDark;
    ctx.fillRect(Math.floor(r() * W), Math.floor(r() * H), 6 + Math.floor(r() * 10), 4);
  }
}

function hand(t: number): void {
  if (num("handStatic", t) > 0.5) {
    noise(t);
    return;
  }
  ctx.save();
  camera(800, 450, num("handCamZ", t));
  rect(-200, -200, 2000, 1300, palette.deck);
  ctx.save();
  ctx.translate(800, 450);
  ctx.rotate(-28 * DEG);
  ctx.strokeStyle = palette.deckLine;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let d = -1400; d < 1400; d += 64) {
    ctx.moveTo(d, -1400);
    ctx.lineTo(d, 1400);
    ctx.moveTo(-1400, d);
    ctx.lineTo(1400, d);
  }
  ctx.stroke();
  ctx.restore();
  const { side } = robots();
  const pose = { arm: -86, fore: num("handFore", t), armFar: 10, foreFar: -10 };
  const m = locate(side, "hand", pose);
  if (!m) throw new Error("no hand hook");
  const k = 2.6;
  ctx.save();
  ctx.translate(980, 360);
  ctx.rotate(-128 * DEG);
  ctx.scale(k, k);
  ctx.translate(-m.e, -m.f);
  drawRig(ctx, side, { palette: BOT, pose, lineW: lineFor(1) });
  ctx.restore();
  const wr = rng(Math.floor(t * 12) + 3);
  const wave: Pt[] = [];
  for (let i = 0; i <= 24; i++) wave.push([1160 + i * 14, 170 + (wr() - 0.5) * 70 * Math.sin((i / 24) * Math.PI)]);
  outline(wave, palette.wave, 3);
  ctx.restore();
  let left = Math.floor(num("handText", t));
  ctx.font = `58px ${MONO}`;
  ctx.fillStyle = palette.diag;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  config.diagnostic.forEach((line, i) => {
    const shown = line.slice(0, Math.max(0, left));
    left -= line.length;
    if (shown) ctx.fillText(shown, 90, 590 + i * 66);
  });
}

function screenShape(): void {
  ctx.beginPath();
  ctx.moveTo(380, 190);
  ctx.quadraticCurveTo(800, 150, 1220, 190);
  ctx.quadraticCurveTo(1290, 450, 1220, 710);
  ctx.quadraticCurveTo(800, 750, 380, 710);
  ctx.quadraticCurveTo(310, 450, 380, 190);
  ctx.closePath();
}

function wireRobot(t: number): void {
  const { front, back, side } = robots();
  const a = num("monTurn", t) * DEG;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const pal = wirePalette();
  const lineW = 3;
  if (Math.abs(c) >= Math.SQRT1_2) robot(c > 0 ? front : back, 800, 690, 0.7, { ax: ROBOT.AX, pal, sx: Math.abs(c), lineW });
  else robot(side, 800, 690, 0.7, { pal, sx: s > 0 ? -Math.abs(s) : Math.abs(s), lineW });
}

function wireMap(t: number): void {
  const z = num("mapZoom", t);
  const turn = num("mapTurn", t) * DEG;
  const height = (gx: number, gz: number): number => 26 * Math.sin(gx * 0.9 + gz * 0.4) + 18 * Math.cos(gz * 1.3 - gx * 0.5);
  const project = (gx: number, gz: number, h: number): Pt => {
    const rx = gx * Math.cos(turn) - gz * Math.sin(turn);
    const rz = gx * Math.sin(turn) + gz * Math.cos(turn);
    return [800 + rx * 62 * z, 470 - rz * 26 * z - h * 0.35 * z];
  };
  ctx.globalAlpha = 0.3;
  poly(([[-7, -7], [7, -7], [7, 7], [-7, 7]] as const).map(([gx, gz]) => project(gx, gz, 0)), palette.wireFill);
  ctx.strokeStyle = palette.wire;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  for (let gz = -7; gz <= 7; gz++)
    for (let gx = -7; gx <= 7; gx++) {
      const p = project(gx, gz, height(gx, gz));
      if (gx > -7) {
        const q = project(gx - 1, gz, height(gx - 1, gz));
        ctx.moveTo(q[0], q[1]);
        ctx.lineTo(p[0], p[1]);
      }
      if (gz > -7) {
        const q = project(gx, gz - 1, height(gx, gz - 1));
        ctx.moveTo(q[0], q[1]);
        ctx.lineTo(p[0], p[1]);
      }
    }
  for (const [bx, bz, bh] of [[-2, 1, 120], [1, -2, 90], [3, 2, 150], [-3, -3, 70]] as const) {
    const base = height(bx, bz);
    for (const [ex, ez] of [[0, 0], [0.6, 0], [0.6, 0.6], [0, 0.6]] as const) {
      const p = project(bx + ex, bz + ez, base);
      const q = project(bx + ex, bz + ez, base + bh);
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
    }
  }
  ctx.stroke();
  ctx.globalAlpha = 0.8;
  const mark = ([[0, 1], [2, 1], [2, 3], [0, 3]] as const).map(([gx, gz]) => project(gx, gz, height(gx, gz)));
  poly(mark, palette.mapMark);
  ctx.globalAlpha = 1;
}

function monitor(t: number): void {
  const mode = text("monitorMode", t);
  ctx.save();
  camera(800, num("monCamY", t), num("monZ", t));
  rect(-400, -900, 2400, 2000, palette.panel);
  ctx.strokeStyle = palette.panelLine;
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let x = -300; x < 2000; x += 260) {
    ctx.moveTo(x, -900);
    ctx.lineTo(x, 1100);
  }
  ctx.stroke();
  rect(560, -560, 420, 520, palette.panelDark);
  const blink = rng(Math.floor(t * 6) + 17);
  for (let i = 0; i < 6; i++) rect(600, -520 + i * 70, 110, 34, blink() < 0.6 ? palette.lampOn : palette.lampOff);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) rect(760 + j * 100, -520 + i * 78, 84, 60, blink() < 0.5 ? palette.keyOn : palette.keyOff);
  rect(290, 110, 1020, 680, palette.bezel);
  rect(290, 110, 1020, 14, palette.bezelLit);
  ctx.save();
  screenShape();
  const glass = ctx.createRadialGradient(800, 450, 60, 800, 450, 560);
  glass.addColorStop(0, palette.crtLit);
  glass.addColorStop(1, palette.crtDark);
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.clip();
  if (mode === "robot") wireRobot(t);
  if (mode === "map") wireMap(t);
  ctx.globalAlpha = 0.18;
  for (let y = 150; y < 760; y += 8) rect(300, y, 1000, 3, palette.black);
  ctx.globalAlpha = 0.07;
  oval(640, 300, 260, 110, palette.white);
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.restore();
}

function overShip(x: number, y: number, k: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  poly([[0, -260], [420, 110], [150, 150], [0, 120], [-150, 150], [-420, 110]], palette.wing);
  poly([[0, -260], [420, 110], [150, 120], [0, 40], [-150, 120], [-420, 110]], palette.hullDark);
  rect(-90, -200, 180, 330, palette.wing);
  rect(-80, -200, 70, 330, palette.hull);
  glowDisc(0, 150, 46, palette.fire, 0.7);
  oval(0, 150, 22, 22, palette.fireHot);
  ctx.restore();
}

function crash(t: number): void {
  ctx.save();
  camera(num("crashCamX", t), num("crashCamY", t), 1);
  ctx.fillStyle = vertical(-200, 360, [[0, palette.duskHigh], [1, palette.duskLow]]);
  ctx.fillRect(-600, -200, 3200, 560);
  for (const [x, y, a, b] of SKY_PUFFS) {
    ctx.globalAlpha = 0.25 + a * 0.25;
    oval(x, y * 0.6 - 120, 200 + b * 300, 16 + a * 26, palette.dustCloud);
  }
  ctx.globalAlpha = 1;
  poly([[-600, 360], [-600, 330], [-200, 316], [100, 336], [500, 300], [700, 330], [1300, 322], [1900, 300], [2600, 330], [2600, 360]], palette.mesa);
  ctx.fillStyle = vertical(360, 1100, [[0, palette.desertFar], [1, palette.desertNear]]);
  ctx.fillRect(-600, 360, 3200, 740);
  ctx.strokeStyle = palette.crack;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const [x, y, a, b] of CRACKS) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + 40 + a * 90, y + (b - 0.5) * 30);
    ctx.lineTo(x + 70 + a * 160, y + (a - 0.5) * 40);
  }
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  poly([[240, 640], [900, 610], [1100, 700], [200, 720]], palette.shadow);
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(240, 700);
  ctx.rotate(-18 * DEG);
  ctx.scale(3.4, 3.4);
  drawAsset(ctx, ASSETS.crashedShip, { state: 1, t });
  ctx.restore();
  poly([[100, 700], [380, 620], [700, 600], [900, 640], [1080, 760], [100, 780]], palette.desertFar);
  for (const [x, y, a, b] of DEBRIS) poly([[x, y], [x + 30 + a * 60, y - 10 - b * 30], [x + 60 + a * 80, y + 8], [x + 10, y + 14]], a < 0.5 ? palette.hullDark : palette.crack);
  for (let x = 1500; x <= 1820; x += 80) rect(x, 160, 12, 520, palette.scaffold);
  for (let y = 200; y <= 640; y += 110) rect(1490, y, 342, 10, palette.scaffold);
  outline([[1500, 640], [1580, 530], [1660, 640], [1740, 530], [1820, 640]], palette.scaffoldLit, 6);
  const sx = num("flyShadow", t);
  ctx.globalAlpha = 0.35;
  poly([[sx - 300, 760], [sx + 300, 760], [sx + 140, 820], [sx - 140, 820]], palette.shadow);
  ctx.globalAlpha = 1;
  ctx.restore();
  veil(palette.black, 0.25);
  if (t >= 51.4) overShip(num("flyX", t), num("flyY", t), num("flyZ", t));
}

function ruin(x: number, w: number, h: number, seed: number, color: string): void {
  const r = rng(seed);
  const pts: Pt[] = [[x, 640], [x, 640 - h]];
  for (let i = 1; i < 6; i++) pts.push([x + (w * i) / 6, 640 - h * (0.55 + r() * 0.45)]);
  pts.push([x + w, 640 - h * 0.7], [x + w, 640]);
  poly(pts, color);
}

function city(t: number): void {
  ctx.save();
  camera(num("cityCamX", t), 450, 1);
  ctx.fillStyle = vertical(-200, 640, [[0, palette.ruinSkyHigh], [1, palette.ruinSkyLow]]);
  ctx.fillRect(-600, -200, 3200, 860);
  for (const [x, y, a, b] of SKY_PUFFS) {
    ctx.globalAlpha = 0.3 + a * 0.3;
    oval(x + t * 8, y, 140 + b * 220, 40 + a * 40, b < 0.5 ? palette.ruinCloud : palette.ruinCloudDark);
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 12; i++) ruin(-300 + i * 230, 180, 160 + ((i * 73) % 190), i + 1, palette.ruinFar);
  for (let i = 0; i < 5; i++) {
    const gx = 120 + i * 420;
    ctx.strokeStyle = palette.ruinMid;
    ctx.lineWidth = 8;
    ctx.strokeRect(gx, 330 - (i % 3) * 60, 160, 310 + (i % 3) * 60);
    outline([[gx, 640], [gx + 160, 330 - (i % 3) * 60]], palette.ruinMid, 6);
  }
  rect(-600, 640, 3200, 600, palette.rubble);
  rect(-300, 100, 420, 700, palette.brick);
  for (let y = 140; y < 640; y += 120) for (let x = -260; x < 100; x += 110) rect(x, y, 50, 70, palette.brickDark);
  const dust = num("cityDust", t);
  sideShip(num("cityShipX", t), num("cityShipY", t), num("cityShipZ", t), num("cityShipRot", t), 0, 1, t);
  if (dust > 0) {
    ctx.globalAlpha = 0.5 * (1 - dust * 0.5);
    for (let i = 0; i < 5; i++) oval(num("cityShipX", t) + 60 + i * 80, 610 - i * 6, 80 + dust * 120, 30 + dust * 30, palette.dust);
    ctx.globalAlpha = 1;
  }
  poly([[-600, 900], [-600, 700], [200, 660], [520, 700], [900, 640], [1300, 690], [1700, 650], [2600, 700], [2600, 900]], palette.rubble);
  ctx.restore();
}

const SHOTS: Record<string, Shot> = { march, hangar, orbit, shotDown, hold, fall, hand, monitor, crash, city };

function render(c: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  ctx = c;
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  const s = Math.min(w / W, h / H);
  ctx.translate((w - W * s) / 2, (h - H * s) / 2);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  SHOTS[text("shot", t)]!(t);
  ctx.restore();
}

export const missionStart: Cutscene = {
  id: "missionStart",
  duration: config.duration,
  camera: config.camera,
  render,
};
