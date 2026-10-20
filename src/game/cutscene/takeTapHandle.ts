import config from "@config/cutscenes/take-tap-handle.json";
import { sampleTrack, type TrackKey } from "../../engine/anim/keyed";
import { apply } from "../../engine/math/mat2d";
import { drawRig } from "../../engine/rig/draw";
import { locate, type Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset, P, PALETTE, type EnvAsset, type EnvPalette } from "../env/paint";
import { buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";

const TRACKS = config.tracks as unknown as Record<string, TrackKey[]>;
const { width: W, height: H, floorY: FLOOR, robot: RB, pipe: PIPE, wheel: WHEEL, close: CLOSE } = config.stage;
const palette: Record<string, string> = { ...config.palette };
const RAD = Math.PI / 180;
const LINE_W = 1.4;
const FULL_LINE_PX = 500;
const STAND = { hipNear: 0, kneeNear: 2, ankleNear: -1.4, hipFar: 0, kneeFar: 2, ankleFar: -1.4 };
const TAP_CENTER = { x: 6, y: -5, r: 5.6 };
const STREAM_W = 46;
const recolor = (color: string): EnvPalette => Object.fromEntries(Object.keys(PALETTE).map((k) => [k, color]));
const FLASH_PALETTE = recolor(palette.flash!);
const SHADOW_PALETTE = recolor("#000000");

const num = (name: string, t: number): number => sampleTrack(TRACKS[name]!, t) as number;
const text = (name: string, t: number): string => String(sampleTrack(TRACKS[name]!, t));

type Pebble = [number, number, number, number, boolean];

function gravelBed(seed: number, count: number, y0: number, y1: number, size: number): Pebble[] {
  const random = P.rng(seed);
  return Array.from({ length: count }, () => {
    const y = y0 + random() * (y1 - y0);
    const depth = (y - y0) / (y1 - y0);
    const w = size * (0.4 + depth) * (0.6 + random());
    return [random() * (W + 200) - 100, y, w, w * 0.3, random() < 0.35];
  });
}

const FAR_GRAVEL = gravelBed(28, 520, 560, 900, 14);
const NEAR_GRAVEL = gravelBed(29, 420, -20, 920, 34);

export interface ArmChain {
  h: Pt;
  s: Pt;
  e: Pt;
}

const circleCenter = (a: Pt, b: Pt, c: Pt): Pt => {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const q = (p: Pt): number => p[0] * p[0] + p[1] * p[1];
  return [
    (q(a) * (b[1] - c[1]) + q(b) * (c[1] - a[1]) + q(c) * (a[1] - b[1])) / d,
    (q(a) * (c[0] - b[0]) + q(b) * (a[0] - c[0]) + q(c) * (b[0] - a[0])) / d,
  ];
};

const chains = new Map<GroupNode, Record<string, ArmChain>>();

export function armChain(root: GroupNode, hook: string, keys: [string, string], stand: Pose): ArmChain {
  const key = `${keys[0]} ${hook}`;
  const known = chains.get(root)?.[key];
  if (known) return known;
  const hand = (a: number, b: number): Pt => {
    const m = locate(root, hook, { ...stand, [keys[0]]: a, [keys[1]]: b });
    if (!m) throw new Error(`no ${hook} hook`);
    return apply(m, [0, 0]);
  };
  const h = hand(0, 0);
  const chain = { h, s: circleCenter(h, hand(60, 0), hand(-60, 0)), e: circleCenter(h, hand(0, 60), hand(0, -60)) };
  chains.set(root, { ...chains.get(root), [key]: chain });
  return chain;
}

const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

export function reach(root: GroupNode, hook: string, keys: [string, string], stand: Pose, target: Pt, bend: number): Record<string, number> {
  const { h, s, e } = armChain(root, hook, keys, stand);
  const l1 = Math.hypot(e[0] - s[0], e[1] - s[1]);
  const l2 = Math.hypot(h[0] - e[0], h[1] - e[1]);
  const d = Math.min(l1 + l2 - 1, Math.max(Math.abs(l1 - l2) + 1, Math.hypot(target[0] - s[0], target[1] - s[1])));
  const rest = Math.atan2(e[1] - s[1], e[0] - s[0]);
  const bent = Math.atan2(h[1] - e[1], h[0] - e[0]) - rest;
  const upper = Math.atan2(target[1] - s[1], target[0] - s[0]) + bend * Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const elbow: Pt = [s[0] + l1 * Math.cos(upper), s[1] + l1 * Math.sin(upper)];
  const lower = Math.atan2(target[1] - elbow[1], target[0] - elbow[0]);
  return { [keys[0]]: wrap(upper - rest) / RAD, [keys[1]]: wrap(lower - upper - bent) / RAD };
}

export const toModel = (m: DOMMatrix, [x, y]: Pt): Pt => {
  const p = m.inverse().transformPoint(new DOMPoint(x, y));
  return [p.x, p.y];
};

let lineW = LINE_W;

const lineFor = (c: CanvasRenderingContext2D, k: number): number => {
  const m = c.getTransform();
  const robotPx = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k * ROBOT.FOOT_Y;
  return Math.min(LINE_W, Math.max(ROBOT.gameLine, (LINE_W * robotPx) / FULL_LINE_PX));
};

const scene = (draw: (c: CanvasRenderingContext2D) => void): EnvAsset => ({ id: "scene", box: [0, 0, 0, 0], draw: (c) => draw(c) });

function layer(c: CanvasRenderingContext2D, t: number, draw: (c: CanvasRenderingContext2D) => void, pal: EnvPalette = PALETTE): void {
  drawAsset(c, scene(draw), { t, lines: lineW, palette: pal });
}

function placeRobot(c: CanvasRenderingContext2D, root: GroupNode, m: DOMMatrix, pose: Pose): void {
  c.save();
  c.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  drawRig(c, root, { palette: ROBOT.palette, pose, hooks: {}, lineW });
  c.restore();
}

let rigs: { full: GroupNode; arm: GroupNode } | null = null;
const robots = () => (rigs ??= { full: buildSide({ farLimbs: true }), arm: buildSide({}) });

export function fitStage(c: CanvasRenderingContext2D, w: number, h: number): void {
  c.fillStyle = "#000";
  c.fillRect(0, 0, w, h);
  const s = Math.min(w / W, h / H);
  c.translate((w - W * s) / 2, (h - H * s) / 2);
  c.scale(s, s);
  c.beginPath();
  c.rect(0, 0, W, H);
  c.clip();
}

function gravel(c: CanvasRenderingContext2D, bed: Pebble[], lit: string): void {
  for (const [x, y, w, h, bright] of bed) {
    c.fillStyle = bright ? lit : palette.gravel!;
    c.fillRect(x, y, w, h);
  }
}

export function pool(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, alpha: number): void {
  c.save();
  c.translate(x, y);
  c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.globalAlpha = alpha;
  c.fillStyle = g;
  c.fillRect(-rx, -rx, 2 * rx, 2 * rx);
  c.restore();
}

function drawRoom(c: CanvasRenderingContext2D): void {
  c.fillStyle = palette.back!;
  c.fillRect(-200, -200, W + 400, H + 400);
  c.fillStyle = palette.floor!;
  c.fillRect(-200, 560, W + 400, H);
  pool(c, 860, 760, 760, 230, palette.floorLit!, 0.9);
  gravel(c, FAR_GRAVEL, palette.gravelLit!);
  P.shape(c, [[-200, -200], [360, -40], [360, 610], [-200, 920]], palette.wall!);
  P.shape(c, [[250, -70], [360, -40], [360, 610], [250, 660]], palette.wallLit!);
  for (const x of [40, 150, 250]) {
    const k = (x + 200) / 560;
    P.line(c, [[x, -200 + 160 * k], [x, 920 - 310 * k]], palette.seam!, 4, "butt");
    for (let i = 1; i < 7; i++) P.disc(c, x + 12, -200 + 160 * k + (i * (1120 - 470 * k)) / 7, 4, palette.seam!);
  }
  P.shape(c, [[-200, 520], [360, 430], [360, 455], [-200, 560]], palette.stain!);
}

function drawStream(c: CanvasRenderingContext2D, mid: number, top: number, flow: number, t: number): void {
  if (flow <= 0) {
    const fall = (t * 1.4) % 1;
    P.disc(c, mid, top + fall * (PIPE.floor - top), 5, palette.water!);
    return;
  }
  const sw = STREAM_W * flow;
  c.save();
  c.globalAlpha = 0.7;
  P.flat(c, mid - sw / 2, top, sw, PIPE.floor - top, palette.water!);
  c.restore();
  c.save();
  c.beginPath();
  c.rect(mid - sw / 2, top, sw, PIPE.floor - top);
  c.clip();
  const step = 46;
  const off = (t * 700) % step;
  for (let i = 0, y = top - step + off; y < PIPE.floor; y += step, i++) {
    const k = (i % 3) / 3;
    P.flat(c, mid - sw / 2 + sw * (0.15 + k * 0.5), y, 5, 24, "c3");
    P.flat(c, mid - sw / 2 + sw * (0.7 - k * 0.4), y + 18, 4, 18, palette.waterDark!);
  }
  c.restore();
  c.save();
  c.globalAlpha = 0.75;
  c.fillStyle = palette.water!;
  c.beginPath();
  c.ellipse(mid, PIPE.floor, sw * 1.4 + 10, 9, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
  for (let i = 0; i < 6; i++) {
    const p = (t * 2.2 + i / 6) % 1;
    const dx = (i % 2 ? 1 : -1) * (14 + p * 50) * flow;
    P.disc(c, mid + dx, PIPE.floor - 4 - 34 * Math.sin(p * Math.PI) * flow, 4, palette.water!);
  }
}

function drawPipe(c: CanvasRenderingContext2D, t: number): void {
  const { x, w, sleeveTop, bottom } = PIPE;
  const mid = x + w / 2;
  pool(c, mid + 50, PIPE.floor + 6, 170, 22, "#000000", 0.7);
  P.cylV(c, x, -120, w, sleeveTop + 130, "concrete", 2);
  P.cylV(c, x - 12, sleeveTop, w + 24, bottom - sleeveTop, "concrete", 1);
  for (const y of [sleeveTop - 6, bottom - 26]) P.box(c, x - 18, y, w + 36, 16, "concrete", 2, { vertical: true });
  P.flat(c, x + 18, 120, 8, 150, "k3");
  P.flat(c, x + 6, sleeveTop + 40, 10, bottom - sleeveTop - 80, "k2");
  c.fillStyle = PALETTE.hole!;
  c.beginPath();
  c.ellipse(mid, bottom - 10, w / 2 - 14, 9, 0, 0, Math.PI * 2);
  c.fill();
  drawStream(c, mid, bottom - 8, num("flow", t), t);
}

const rimPoint = (deg: number, x = WHEEL.x + 16, y = WHEEL.y): Pt => [x + WHEEL.r * WHEEL.depth * Math.sin(deg * RAD), y - WHEEL.r * Math.cos(deg * RAD)];

function drawWheel(c: CanvasRenderingContext2D, t: number): void {
  const { x, y, r, depth } = WHEEL;
  const cx = x + 16;
  P.box(c, PIPE.x + PIPE.w + 10, y - 10, cx - PIPE.x - PIPE.w - 6, 20, "steel", 2);
  const spin = num("wheel", t);
  for (let k = 0; k < 4; k++) P.beam(c, [cx, y], rimPoint(spin + k * 90), 6, "chrome");
  c.lineWidth = 14;
  c.strokeStyle = PALETTE.mLine!;
  c.beginPath();
  c.ellipse(cx, y, r * depth, r, 0, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = 9;
  c.strokeStyle = PALETTE.c1!;
  c.stroke();
  c.lineWidth = 3;
  c.strokeStyle = PALETTE.c3!;
  c.beginPath();
  c.ellipse(cx, y, r * depth, r, 0, Math.PI * 1.1, Math.PI * 1.6);
  c.stroke();
  P.disc(c, cx, y, 9, "c0", "mLine");
}

function drawHero(c: CanvasRenderingContext2D, t: number): void {
  const { full } = robots();
  const K = RB.scale;
  const m = new DOMMatrix().translate(RB.x, FLOOR).rotate(num("lean", t)).scale(-K, K).translate(-ROBOT.SIDE_AX, -ROBOT.FOOT_Y);
  const pose: Pose = { ...STAND, arm: 0, fore: 0, armFar: 0, foreFar: 0 };
  const blend = num("reach", t);
  const grip = num("grip", t);
  const hold = (hook: string, keys: [string, string], deg: number): void => {
    const rest = armChain(full, hook, keys, STAND).h;
    const rim = toModel(m, rimPoint(deg));
    const target: Pt = [rest[0] + (rim[0] - rest[0]) * blend, rest[1] + (rim[1] - rest[1]) * blend];
    Object.assign(pose, reach(full, hook, keys, STAND, target, 1));
  };
  hold("hand", ["arm", "fore"], grip);
  hold("handFar", ["armFar", "foreFar"], grip + 180);
  pool(c, RB.x - 20, FLOOR + 4, 170, 18, "#000000", 0.6);
  placeRobot(c, full, m, pose);
}

function drawPumpRoom(c: CanvasRenderingContext2D, t: number): void {
  const z = num("camZ", t);
  c.translate(W / 2, H / 2);
  c.scale(z, z);
  c.translate(-W / 2, -H / 2);
  lineW = lineFor(c, RB.scale);
  layer(c, t, (cc) => {
    drawRoom(cc);
    drawPipe(cc, t);
    drawWheel(cc, t);
  });
  drawHero(c, t);
}

function drawTap(c: CanvasRenderingContext2D, t: number, x: number, y: number, scale: number, tilt: number, spin: number, pal: EnvPalette): void {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale * tilt);
  c.rotate(spin * RAD);
  c.translate(-TAP_CENTER.x, -TAP_CENTER.y);
  drawAsset(c, ASSETS.tapHandle, { t, lines: lineW, palette: pal });
  c.restore();
}

function closeArm(c: CanvasRenderingContext2D, side: number, target: Pt, blend: number): void {
  const { arm } = robots();
  const k = CLOSE.arm;
  const shoulder: Pt = side < 0 ? [-260, 1120] : [W + 260, 1120];
  const { s } = armChain(arm, "hand", ["arm", "fore"], STAND);
  const m = new DOMMatrix().translate(shoulder[0], shoulder[1]).rotate(side * 58).scale(-side * k, k).translate(-s[0], -s[1]);
  const off: Pt = [shoulder[0] - side * 120, shoulder[1] + 200];
  const goal: Pt = [off[0] + (target[0] - off[0]) * blend, off[1] + (target[1] - off[1]) * blend];
  const pose: Pose = { ...STAND, ...reach(arm, "hand", ["arm", "fore"], STAND, toModel(m, goal), -side) };
  placeRobot(c, arm, m, pose);
}

function drawGrid(c: CanvasRenderingContext2D, g: number): void {
  if (g <= 0) return;
  const x0 = 60, y0 = 50, x1 = W - 60, y1 = H - 50, step = 64;
  const reachY = y0 + (y1 - y0) * g;
  c.save();
  c.globalAlpha = 0.85;
  c.strokeStyle = palette.grid!;
  c.lineWidth = 2;
  c.beginPath();
  for (let x = x0; x <= x1; x += step) {
    c.moveTo(x, y0);
    c.lineTo(x, reachY);
  }
  for (let y = y0; y <= reachY; y += step) {
    c.moveTo(x0, y);
    c.lineTo(x1, y);
  }
  c.stroke();
  c.restore();
}

function drawCloseUp(c: CanvasRenderingContext2D, t: number): void {
  lineW = LINE_W;
  const { x, y, rx, tilt } = CLOSE;
  const lift = num("lift", t);
  const scale = (rx / TAP_CENTER.r) * (1 + lift * 0.6);
  const cy = y + lift * 360;
  const squash = tilt * (1 - lift * 0.2);
  const spin = num("spin", t);
  layer(c, t, (cc) => {
    cc.fillStyle = palette.floor!;
    cc.fillRect(0, 0, W, H);
    pool(cc, 820, 520, 900, 520, palette.floorLit!, 0.75);
    gravel(cc, NEAR_GRAVEL, palette.gravelLit!);
    P.shape(cc, [[1120, -10], [W + 10, -10], [W + 10, 330], [1300, 170]], palette.wall!);
    P.poly(cc, [[500, -20], [1100, -20], [920, 400], [680, 400]], "concrete", 2, { dir: [1, 0] });
    P.poly(cc, [[560, 120], [1040, 120], [1024, 160], [576, 160]], "concrete", 1, { dir: [1, 0] });
    P.box(cc, 720, 360, 160, 60, "steel", 2, { vertical: true });
    P.cylV(cc, x - 18, 400, 36, y - 400, "chrome", 1);
    P.box(cc, x - 30, y - 16, 60, 26, "steel", 1, { vertical: true });
  });
  drawTap(c, t, x, cy + 22 * (1 + lift), scale, squash, spin, SHADOW_PALETTE);
  drawTap(c, t, x, cy, scale, squash, spin, num("flash", t) >= 0.5 ? FLASH_PALETTE : PALETTE);
  const hands = num("hands", t);
  if (hands > 0) for (const side of [-1, 1]) closeArm(c, side, [x + side * (scale * TAP_CENTER.r - 10), cy + 10], hands);
  drawGrid(c, num("grid", t));
}

function render(c: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  c.save();
  fitStage(c, w, h);
  if (text("shot", t) === "A") drawPumpRoom(c, t);
  else drawCloseUp(c, t);
  c.restore();
}

export const takeTapHandle: Cutscene = {
  id: "takeTapHandle",
  duration: config.duration,
  camera: config.camera,
  render,
};
