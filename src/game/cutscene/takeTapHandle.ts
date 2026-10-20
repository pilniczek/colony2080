import config from "@config/cutscenes/take-tap-handle.json";
import type { Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset, P, PALETTE, type EnvPalette } from "../env/paint";
import { buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { armChain, fitStage, layer, LINE_W, lineFor, placeRobot, pool, RAD, reach, recolor, STAND, stillLayer, toModel, tracks } from "./kit";

const { width: W, height: H, floorY: FLOOR, robot: RB, pipe: PIPE, wheel: WHEEL, close: CLOSE } = config.stage;
const palette: Record<string, string> = { ...config.palette };
export const TAP_CENTER = { x: 6, y: -5, r: 5.6 };
const STREAM_W = 46;
const FLASH_PALETTE = recolor(palette.flash!);
const SHADOW_PALETTE = recolor("#000000");

const { num, text } = tracks(config.tracks);

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

let lineW = LINE_W;
const closeBack = stillLayer();

let rigs: { full: GroupNode; arm: GroupNode } | null = null;
const robots = () => (rigs ??= { full: buildSide({ farLimbs: true }), arm: buildSide({}) });

function gravel(c: CanvasRenderingContext2D, bed: Pebble[], lit: string): void {
  for (const [x, y, w, h, bright] of bed) {
    c.fillStyle = bright ? lit : palette.gravel!;
    c.fillRect(x, y, w, h);
  }
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
    const rest = armChain(full, hook, keys).h;
    const rim = toModel(m, rimPoint(deg));
    const target: Pt = [rest[0] + (rim[0] - rest[0]) * blend, rest[1] + (rim[1] - rest[1]) * blend];
    Object.assign(pose, reach(full, hook, keys, target, 1));
  };
  hold("hand", ["arm", "fore"], grip);
  hold("handFar", ["armFar", "foreFar"], grip + 180);
  pool(c, RB.x - 20, FLOOR + 4, 170, 18, "#000000", 0.6);
  placeRobot(c, full, m, { pose, hooks: {}, lineW });
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
  }, lineW);
  drawHero(c, t);
}

export function drawTap(c: CanvasRenderingContext2D, t: number, x: number, y: number, scale: number, tilt: number, spin: number, pal: EnvPalette, lines: number): void {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale * tilt);
  c.rotate(spin * RAD);
  c.translate(-TAP_CENTER.x, -TAP_CENTER.y);
  drawAsset(c, ASSETS.tapHandle, { t, lines, palette: pal });
  c.restore();
}

function closeArm(c: CanvasRenderingContext2D, side: number, target: Pt, blend: number): void {
  const { arm } = robots();
  const k = CLOSE.arm;
  const shoulder: Pt = side < 0 ? [-260, 1120] : [W + 260, 1120];
  const { s } = armChain(arm, "hand", ["arm", "fore"]);
  const m = new DOMMatrix().translate(shoulder[0], shoulder[1]).rotate(side * 58).scale(-side * k, k).translate(-s[0], -s[1]);
  const off: Pt = [shoulder[0] - side * 120, shoulder[1] + 200];
  const goal: Pt = [off[0] + (target[0] - off[0]) * blend, off[1] + (target[1] - off[1]) * blend];
  const pose: Pose = { ...STAND, ...reach(arm, "hand", ["arm", "fore"], toModel(m, goal), -side) };
  placeRobot(c, arm, m, { pose, hooks: {}, lineW });
}

export function drawGrid(c: CanvasRenderingContext2D, g: number, color: string): void {
  if (g <= 0) return;
  const x0 = 60, y0 = 50, x1 = W - 60, y1 = H - 50, step = 64;
  const reachY = y0 + (y1 - y0) * g;
  c.save();
  c.globalAlpha = 0.85;
  c.strokeStyle = color;
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

function closeBackdrop(cc: CanvasRenderingContext2D): void {
  const { x, y } = CLOSE;
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
}

function drawCloseUp(c: CanvasRenderingContext2D, t: number): void {
  lineW = LINE_W;
  const { x, y, rx, tilt } = CLOSE;
  const lift = num("lift", t);
  const scale = (rx / TAP_CENTER.r) * (1 + lift * 0.6);
  const cy = y + lift * 360;
  const squash = tilt * (1 - lift * 0.2);
  const spin = num("spin", t);
  closeBack(c, [], (b) => layer(b, t, closeBackdrop, lineW));
  drawTap(c, t, x, cy + 22 * (1 + lift), scale, squash, spin, SHADOW_PALETTE, lineW);
  drawTap(c, t, x, cy, scale, squash, spin, num("flash", t) >= 0.5 ? FLASH_PALETTE : PALETTE, lineW);
  const hands = num("hands", t);
  if (hands > 0) for (const side of [-1, 1]) closeArm(c, side, [x + side * (scale * TAP_CENTER.r - 10), cy + 10], hands);
  drawGrid(c, num("grid", t), palette.grid!);
}

function render(c: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  c.save();
  fitStage(c, w, h, W, H);
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
