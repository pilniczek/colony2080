import config from "@config/cutscenes/take-tap-handle.json";
import type { Pose } from "../../engine/rig/pose";
import type { Mat2D } from "../../engine/math/mat2d";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { tapHandleTop } from "../env/props";
import { P, PALETTE, type EnvPalette } from "../env/paint";
import { buildHand, buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { armChain, fitStage, hookAt, layer, LINE_W, lineFor, placeRobot, pool, RAD, reach, recolor, STAND, stillLayer, toModel, tracks } from "./kit";

const { width: W, height: H, floorY: FLOOR, robot: RB, pipe: PIPE, wheel: WHEEL, close: CLOSE } = config.stage;
const palette: Record<string, string> = { ...config.palette };
export const TAP_CENTER = { x: 6, y: -5, r: 5 };
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

let rigs: Record<"reach" | "grip" | "near" | "far" | "wheelHand" | "backHand" | "palmHand", GroupNode> | null = null;
const robots = () =>
  (rigs ??= {
    reach: buildSide({ farLimbs: true, hold: "reach", farHold: "reach" }),
    grip: buildSide({ farLimbs: true, hold: "grip", farHold: "grip" }),
    near: buildSide({ farLimbs: true, hold: "grip" }),
    far: buildSide({ farLimbs: true, farHold: "grip" }),
    wheelHand: buildHand({ view: "thumb", pose: "grip", bare: true }),
    backHand: buildHand({ view: "back", pose: "grip", bare: true, stub: false }),
    palmHand: buildHand({ view: "palm", pose: "grip", bare: true, stub: false })
  });

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

function drawPipe(c: CanvasRenderingContext2D): void {
  const { x, w, sleeveTop, bottom } = PIPE;
  const mid = x + w / 2;
  pool(c, mid + 50, PIPE.floor + 6, 170, 22, "#000000", 0.7);
  P.cylV(c, x, bottom - 20, w, PIPE.floor - bottom + 20, "concrete", 2);
  P.box(c, x - 18, PIPE.floor - 16, w + 36, 16, "concrete", 2, { vertical: true });
  P.cylV(c, x, -120, w, sleeveTop + 130, "concrete", 2);
  P.cylV(c, x - 12, sleeveTop, w + 24, bottom - sleeveTop, "concrete", 1);
  for (const y of [sleeveTop - 6, bottom - 26]) P.box(c, x - 18, y, w + 36, 16, "concrete", 2, { vertical: true });
  P.flat(c, x + 18, 120, 8, 150, "k3");
  P.flat(c, x + 6, sleeveTop + 40, 10, bottom - sleeveTop - 80, "k2");
}

const rimPoint = (deg: number, x = WHEEL.x + 16, y = WHEEL.y): Pt => [x + WHEEL.r * WHEEL.depth * Math.sin(deg * RAD), y - WHEEL.r * Math.cos(deg * RAD)];

function drawWheel(c: CanvasRenderingContext2D, t: number): void {
  const { x, y, r, depth } = WHEEL;
  const cx = x + 16;
  P.box(c, PIPE.x + PIPE.w + 10, y - 10, cx - PIPE.x - PIPE.w - 6, 20, "steel", 2);
  const spin = num("wheel", t);
  for (let k = 0; k < 4; k++) P.beam(c, [cx, y], rimPoint(spin + k * 90), 6, "chrome");
  c.lineWidth = r * WHEEL.rim + 5;
  c.strokeStyle = PALETTE.mLine!;
  c.beginPath();
  c.ellipse(cx, y, r * depth, r, 0, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = r * WHEEL.rim;
  c.strokeStyle = PALETTE.c1!;
  c.stroke();
  c.lineWidth = r * WHEEL.rim * 0.3;
  c.strokeStyle = PALETTE.c3!;
  c.beginPath();
  c.ellipse(cx, y, r * depth, r, 0, Math.PI * 1.1, Math.PI * 1.6);
  c.stroke();
  P.disc(c, cx, y, 9, "c0", "mLine");
}

function drawHero(c: CanvasRenderingContext2D, t: number): void {
  const { reach: reachRig, grip: gripRig, near, far } = robots();
  const K = RB.scale;
  const m = new DOMMatrix().translate(RB.x, FLOOR).rotate(num("lean", t)).scale(-K, K).translate(-ROBOT.SIDE_AX, -ROBOT.FOOT_Y);
  const pose: Pose = { ...STAND, arm: 0, fore: 0, armFar: 0, foreFar: 0 };
  const blend = num("reach", t);
  const grip = num("grip", t);
  const hold = (rig: GroupNode, keys: [string, string], deg: number): void => {
    const rest = armChain(rig, "rod", keys).h;
    const rim = toModel(m, rimPoint(deg));
    const target: Pt = [rest[0] + (rim[0] - rest[0]) * blend, rest[1] + (rim[1] - rest[1]) * blend];
    Object.assign(pose, reach(rig, "rod", keys, target, 1));
  };
  hold(near, ["arm", "fore"], grip);
  hold(far, ["armFar", "foreFar"], grip + WHEEL.farGrip);
  pool(c, RB.x - 20, FLOOR + 4, 170, 18, "#000000", 0.6);
  if (blend < 1) return placeRobot(c, reachRig, m, { pose, hooks: {}, lineW });
  const base = c.getTransform();
  const behind = (): void => {
    c.save();
    c.setTransform(base);
    rimHand(c, robots().palmHand, m.multiply(domOf(hookAt(gripRig, "rodFar", pose))), -1, 0);
    const { x, y, r, depth } = WHEEL;
    c.beginPath();
    c.rect(x + 16 - r * depth - 12, y - r - 12, 2 * r * depth + 24, 2 * r + 24);
    c.clip();
    layer(c, t, (cc) => drawWheel(cc, t), lineW);
    c.restore();
  };
  const hidden: Pose = { ...pose, wrist: { sx: 0, sy: 0 }, wristFar: { sx: 0, sy: 0 } };
  placeRobot(c, gripRig, m, { pose: hidden, hooks: { rodFar: behind }, lineW });
  rimHand(c, robots().backHand, m.multiply(domOf(hookAt(gripRig, "rod", pose))), 1, 180);
}

const domOf = ({ a, b, c, d, e, f }: Mat2D): DOMMatrix => new DOMMatrix([a, b, c, d, e, f]);

function rimHand(c: CanvasRenderingContext2D, root: GroupNode, hook: DOMMatrix, flip: number, turn: number): void {
  const at = hook.transformPoint(new DOMPoint(0, 0));
  const along = Math.atan2(hook.b, hook.a) / RAD + turn;
  const k = Math.hypot(hook.a, hook.b);
  const m = new DOMMatrix().translate(at.x, at.y).rotate(along).scale(k, k * flip).multiply(domOf(hookAt(root, "rod", {})).inverse());
  placeRobot(c, root, m, { pose: {}, hooks: {}, lineW });
}

function drawPumpRoom(c: CanvasRenderingContext2D, t: number): void {
  const z = num("camZ", t);
  c.translate(W / 2, H / 2);
  c.scale(z, z);
  c.translate(-W / 2, -H / 2);
  lineW = lineFor(c, RB.scale);
  layer(c, t, (cc) => {
    drawRoom(cc);
    drawPipe(cc);
    drawWheel(cc, t);
  }, lineW);
  drawHero(c, t);
}

export function drawTap(c: CanvasRenderingContext2D, t: number, x: number, y: number, scale: number, pal: EnvPalette, lines: number): void {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.translate(-TAP_CENTER.x, 0);
  layer(c, t, tapHandleTop, lines, pal);
  c.restore();
}

export function wheelHands(c: CanvasRenderingContext2D, x: number, y: number, scale: number, blend: number, wheel: (c: CanvasRenderingContext2D) => void, lines: number): void {
  const root = robots().wheelHand;
  const rod = domOf(hookAt(root, "rod", {})).inverse();
  const k = scale * CLOSE.hand;
  for (const side of [-1, 1]) {
    const p: Pt = [x + side * scale * CLOSE.rim, y + (1 - blend) * 700];
    const m = new DOMMatrix().translate(p[0], p[1]).scale(side, 1).rotate(180).scale(k, k).multiply(rod);
    placeRobot(c, root, m, { pose: {}, hooks: {}, lineW: lines });
  }
  wheel(c);
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
  const { x, y, rx } = CLOSE;
  const lift = num("lift", t);
  const scale = (rx / TAP_CENTER.r) * (1 + lift * 0.6);
  const cy = y + lift * 360;
  closeBack(c, [], (b) => layer(b, t, closeBackdrop, lineW));
  drawTap(c, t, x, cy + 22 * (1 + lift), scale, SHADOW_PALETTE, lineW);
  const wheel = (cc: CanvasRenderingContext2D): void => drawTap(cc, t, x, cy, scale, num("flash", t) >= 0.5 ? FLASH_PALETTE : PALETTE, lineW);
  const hands = num("hands", t);
  if (hands > 0) wheelHands(c, x, cy, scale, hands, wheel, lineW);
  else wheel(c);
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
