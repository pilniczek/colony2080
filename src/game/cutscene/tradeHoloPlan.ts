import config from "@config/cutscenes/trade-holo-plan.json";
import { sampleTrack, type TrackKey } from "../../engine/anim/keyed";
import { apply, type Mat2D } from "../../engine/math/mat2d";
import { drawRig, type HookDraw } from "../../engine/rig/draw";
import { locate } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { ASSETS, type AssetId } from "../env/assets";
import { drawAsset } from "../env/paint";
import { buildBack, buildFront, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";

export interface DoorItems {
  robotBefore: string | null;
  robotAfter: string | null;
  manBefore: string | null;
  manAfter: string | null;
}

const TRACKS = config.tracks as unknown as Record<string, TrackKey[]>;
const DOOR_TRACKS = config.door.tracks as unknown as Record<string, TrackKey[]>;
const ST = config.stage;
const DOOR = config.door;
const ITEM_STATES: Record<string, number> = DOOR.itemStates;
const W = ST.width;
const H = ST.height;
const palette = { ...config.palette };
const LINE_W = 1.4;
const FULL_LINE_PX = 500;
const ORIGIN: Pt = [0, 0];
const HEAD_K = 2.3;
const ROBOT_X = 800;
const ROBOT_FEET = 1500;
const SHOULDER: Pt = [150, 130];
const PLAN_ROOMS: Pt[][] = [
  [[0, 0], [1, 0], [1, 1], [0, 1]],
  [[0.35, 0], [0.35, 0.55], [0, 0.55]],
  [[0.35, 0.3], [0.7, 0.3], [0.7, 0]],
  [[0.7, 0.3], [0.7, 0.75], [1, 0.75]],
  [[0.35, 0.55], [0.55, 0.55], [0.55, 1]],
];
let ctx: CanvasRenderingContext2D;
let lineW = LINE_W;
let rigs: { front: GroupNode; back: GroupNode } | null = null;

const robots = () => (rigs ??= { front: buildFront(), back: buildBack({ leftArmBehind: false }) });
const at = (name: string, t: number): number => sampleTrack(TRACKS[name]!, t) as number;
const atDoor = (name: string, t: number): number => sampleTrack(DOOR_TRACKS[name]!, t) as number;
const fromDom = ({ a, b, c, d, e, f }: DOMMatrix): Mat2D => ({ a, b, c, d, e, f });

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

function glow(x: number, y: number, r: number, color: string, alpha: number): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

const lineFor = (c: CanvasRenderingContext2D, k: number): number => {
  const m = c.getTransform();
  const robotPx = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k * ROBOT.FOOT_Y;
  return Math.min(LINE_W, Math.max(ROBOT.gameLine, (LINE_W * robotPx) / FULL_LINE_PX));
};

function grit(x0: number, y0: number, w: number, h: number, light: string, dark: string): void {
  for (let i = 0; i < 240; i++) {
    const x = x0 + ((i * 733) % w);
    const y = y0 + ((i * 389) % h);
    rect(x, y, 6 + (i % 5) * 4, 4 + (i % 3) * 3, i % 2 ? dark : light);
  }
}

function begin(c: CanvasRenderingContext2D, w: number, h: number): void {
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
}

function drawItem(c: CanvasRenderingContext2D, id: string, k: number): void {
  const item = ASSETS[id as AssetId];
  const m = c.getTransform();
  c.save();
  c.rotate(-Math.atan2(m.b, m.a));
  c.scale(k, k);
  const [x0, y0, x1, y1] = item.box;
  c.translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
  drawAsset(c, item, { state: ITEM_STATES[id] ?? 0, lines: lineW });
  c.restore();
}

function drawFace(t: number): void {
  const u = at("manTurn", t);
  const fx = u * 34;
  oval(-100 + fx * 0.4, 10, 18, 34, palette.skinDark);
  oval(100 + fx * 0.4, 10, 18, 34, palette.skinDark);
  rect(-55, 90, 110, 120, palette.skinDark);
  poly([[-170, 190], [170, 190], [230, 300], [-230, 300]], palette.collar);
  poly([[-55, 170], [55, 170], [0, 230]], palette.collarDark);
  const face: Pt[] = [[-95, -80], [-90, -120], [-60, -140], [0, -146], [60, -140], [90, -120], [95, -80], [92, 10], [80, 70], [50, 110], [20, 126], [-20, 126], [-50, 110], [-80, 70], [-92, 10]];
  poly(face, palette.skin);
  poly([[-95, -80], [-92, 10], [-80, 70], [-50, 110], [-20, 126], [-40, 90], [-62, 40], [-70, -40]], palette.skinDark);
  poly([[60 + fx, -100], [90, -110], [92, 10], [76, 40]], palette.skinLit);
  poly([[-95, -78], [-92, -118], [-60, -142], [0, -150], [60, -142], [92, -118], [95, -78], [80, -98], [40, -110], [0, -113], [-40, -110], [-80, -98]], palette.hair);
  poly([[-95, -78], [-92, -118], [-60, -142], [-40, -110], [-80, -98]], palette.hairDark);
  rect(-74 + fx, -50, 54, 11, palette.skinDeep);
  rect(20 + fx, -50, 54, 11, palette.skinDeep);
  oval(-44 + fx, -20, 9, 5, palette.skinDeep);
  oval(44 + fx, -20, 9, 5, palette.skinDeep);
  poly([[fx - 6, -14], [fx + 12, 42], [fx - 4, 52], [fx - 20, 46]], palette.skinDark);
  poly([[fx - 24, 50], [fx - 46, 82], [fx - 40, 84], [fx - 18, 56]], palette.skinDark);
  poly([[fx + 18, 52], [fx + 44, 82], [fx + 38, 84], [fx + 12, 58]], palette.skinDark);
  rect(fx - 32, 78, 64, 7, palette.lip);
  poly([[-30, 104], [30, 104], [16, 120], [-16, 120]], palette.skinDark);
  const glare = at("glare", t);
  ctx.strokeStyle = palette.glassRim;
  ctx.lineWidth = 5;
  for (const side of [-1, 1]) {
    ctx.globalAlpha = 0.12 + glare * 0.78;
    oval(side * 44 + fx, -20, 32, 26, palette.glass);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(side * 44 + fx, -20, 32, 26, 0, 0, Math.PI * 2);
    ctx.moveTo(side * 76 + fx, -24);
    ctx.lineTo(side * 98 + fx * 0.4, -14);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-12 + fx, -24);
  ctx.quadraticCurveTo(fx, -32, 12 + fx, -24);
  ctx.stroke();
}

function drawHatch(t: number): void {
  const [hx, hy, hw, hh] = ST.hatch as [number, number, number, number];
  rect(-100, -100, W + 200, H + 200, palette.wall);
  grit(-100, -100, W + 200, H + 200, palette.wallLit, palette.wallDark);
  rect(hx, hy, hw, hh, palette.hole);
  ctx.save();
  ctx.beginPath();
  ctx.rect(hx, hy, hw, hh);
  ctx.clip();
  ctx.globalAlpha = 0.5;
  poly([[hx + 200, hy], [hx + hw - 200, hy], [hx + hw, hy + hh], [hx, hy + hh]], palette.holeLight);
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(at("manX", t), at("manY", t));
  ctx.scale(HEAD_K * at("manScale", t), HEAD_K * at("manScale", t));
  drawFace(t);
  ctx.restore();
  const px = hx + at("slide", t) * hw;
  rect(px, hy, hw, hh, palette.panel);
  for (let x = px + 60; x < px + hw; x += 160) {
    rect(x, hy, 50, hh, palette.panelLit);
    rect(x + 50, hy, 14, hh, palette.panelDark);
  }
  for (let y = hy + 40; y < hy + hh; y += hh - 80) for (let x = px + 30; x < px + hw; x += 80) oval(x, y, 7, 7, palette.rivet);
  rect(px, hy, 18, hh, palette.panelDark);
  ctx.restore();
  rect(hx - 20, hy - 20, hw + 40, 20, palette.wallDark);
  rect(hx - 20, hy, 20, hh, palette.wallDark);
  rect(hx, hy + hh, hw, 16, palette.wallLit);
}

function drawSky(t: number): void {
  rect(0, 0, W, H, palette.sky);
  const drift = (at("camY", t) - 1000) * 0.4;
  rect(0, 560 + drift, W, 400, palette.skyLit);
  rect(0, 0, W, 180 + drift, palette.skyDark);
  for (const [x, y, rx, ry] of [[200, 260, 320, 70], [900, 180, 420, 60], [1400, 340, 300, 80], [600, 480, 380, 50], [1250, 620, 360, 60]] as const) {
    oval(x, y + drift, rx, ry, palette.cloudDark);
    oval(x - 40, y - 18 + drift, rx * 0.7, ry * 0.55, palette.cloud);
  }
}

function drawHologram([hx, hy]: Pt, t: number): void {
  const k = at("holo", t);
  if (k <= 0) return;
  const flicker = 0.85 + 0.15 * Math.sin(t * 47);
  const top = hy - 170;
  const w = 190;
  const h = 90;
  const corner = (u: number, v: number): Pt => [hx - w / 2 + u * w + (1 - v) * 24 - 12, top + v * h];
  ctx.globalAlpha = 0.14 * k * flicker;
  poly([[hx - 8, hy - 18], [hx + 8, hy - 18], corner(1, 1), corner(1, 0), corner(0, 0), corner(0, 1)], palette.holo);
  ctx.globalAlpha = 0.3 * k * flicker;
  poly([corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)], palette.holo);
  ctx.globalAlpha = 0.9 * k * flicker;
  ctx.strokeStyle = palette.holo;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const room of PLAN_ROOMS) room.forEach(([u, v], i) => (i ? ctx.lineTo(...corner(u, v)) : ctx.moveTo(...corner(u, v))));
  ctx.stroke();
  ctx.globalAlpha = 0.3 * k;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let v = 0.1; v < 1; v += 0.12) {
    ctx.moveTo(...corner(0, v));
    ctx.lineTo(...corner(1, v));
  }
  ctx.stroke();
  ctx.globalAlpha = k * (Math.sin(t * 9) > 0 ? 1 : 0.35);
  oval(...corner(0.82, 0.86), 4, 3, palette.holoCore);
  ctx.globalAlpha = 1;
  glow(hx, hy - 18, 26, palette.holo, 0.6 * k);
}

function drawHolo(t: number): void {
  const { front } = robots();
  drawSky(t);
  const z = at("camZ", t);
  ctx.translate(W / 2 - ROBOT_X * z, H / 2 - at("camY", t) * z);
  ctx.scale(z, z);
  lineW = lineFor(ctx, ST.robotScale);
  const pose = { armL: at("armL", t), foreL: at("foreL", t) };
  const m = new DOMMatrix().translate(ROBOT_X, ROBOT_FEET).scale(ST.robotScale).translate(-ROBOT.AX, -ROBOT.FOOT_Y);
  ctx.save();
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  drawRig(ctx, front, { palette: ROBOT.palette, pose, hooks: { handL: (c) => drawItem(c, "holoPlan", ST.itemScale) }, lineW });
  ctx.restore();
  const shoulder = m.transformPoint(new DOMPoint(...SHOULDER));
  const lamp = at("lamp", t);
  oval(shoulder.x, shoulder.y, 9, 9, palette.lamp);
  glow(shoulder.x, shoulder.y, 70, palette.lamp, 0.8 * lamp);
  const hand = locate(front, "handL", pose, fromDom(m));
  if (!hand) throw new Error("no handL hook");
  drawHologram(apply(hand, ORIGIN), t);
}

function drawManArm(t: number, item: string | null): void {
  const reach = atDoor("reach", t);
  if (reach <= 0) return;
  const bx = DOOR.hinge + 180;
  const by = 580;
  const hx = bx + reach * DOOR.manReach;
  const hy = 550;
  poly([[bx - 80, by - 50], [hx - 10, hy - 32], [hx - 10, hy + 30], [bx - 80, by + 60]], palette.sleeve);
  poly([[bx - 80, by + 14], [hx - 10, hy + 8], [hx - 10, hy + 30], [bx - 80, by + 60]], palette.sleeveDark);
  oval(hx + 22, hy, 34, 24, palette.skin);
  poly([[hx + 30, hy - 20], [hx + 74, hy - 12], [hx + 74, hy + 2], [hx + 40, hy + 4]], palette.skinDark);
  if (item) {
    ctx.save();
    ctx.translate(hx + 40, hy - 6);
    drawItem(ctx, item, DOOR.itemScale * DOOR.robotScale);
    ctx.restore();
  }
}

function drawLeaf(t: number): void {
  const a = atDoor("swing", t) * Math.PI * 0.53;
  const { hinge, leafWidth: L, top } = DOOR;
  const fx = hinge + L * Math.cos(a);
  const ft = top - 110 * Math.sin(a);
  const fb = H + 200;
  const edge = 30 * Math.sin(a);
  poly([[hinge, top], [fx, ft], [fx, fb], [hinge, fb]], Math.cos(a) >= 0 ? palette.door : palette.doorDark);
  if (Math.cos(a) >= 0) {
    for (let k = 0.15; k < 1; k += 0.2) {
      const x = hinge + (fx - hinge) * k;
      const y = top + (ft - top) * k;
      poly([[x, y + 30], [x + (fx - hinge) * 0.06, y + 30 - 6 * Math.sin(a)], [x + (fx - hinge) * 0.06, fb], [x, fb]], palette.doorLit);
    }
  }
  poly([[fx, ft], [fx - edge, ft + 6], [fx - edge, fb], [fx, fb]], palette.doorEdge);
}

function drawDoorRobot(t: number, item: string | null): void {
  const { back } = robots();
  const pose = { armL: atDoor("armL", t), foreL: atDoor("foreL", t), armR: 10, foreR: 20 };
  const x = DOOR.robotX + atDoor("robotShift", t);
  ctx.globalAlpha = 0.45;
  oval(x + 230, 520, 200, 420, palette.shadow);
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(x, DOOR.robotY);
  ctx.scale(DOOR.robotScale, DOOR.robotScale);
  ctx.translate(-ROBOT.AX, -ROBOT.FOOT_Y);
  const handL: HookDraw | undefined = item ? (c) => drawItem(c, item, DOOR.itemScale) : undefined;
  drawRig(ctx, back, { palette: ROBOT.palette, pose, hooks: { handL }, lineW });
  ctx.restore();
}

export function drawDoorShot(c: CanvasRenderingContext2D, w: number, h: number, t: number, items: DoorItems): void {
  begin(c, w, h);
  ctx.translate(W / 2 - atDoor("camX", t), 0);
  lineW = lineFor(ctx, DOOR.robotScale);
  const swapped = atDoor("swap", t) >= 1;
  rect(-200, -100, W + 400, H + 200, palette.plaster);
  grit(-200, -100, W + 400, H + 200, palette.plasterLit, palette.plasterDark);
  rect(DOOR.hinge - 26, DOOR.top - 26, DOOR.leafWidth + 52, H, palette.plasterDark);
  rect(DOOR.hinge, DOOR.top, DOOR.leafWidth, H, palette.hole);
  ctx.globalAlpha = 0.35;
  poly([[DOOR.hinge + 120, DOOR.top], [DOOR.hinge + DOOR.leafWidth, DOOR.top], [DOOR.hinge + DOOR.leafWidth, H], [DOOR.hinge + 300, H]], palette.holeLight);
  ctx.globalAlpha = 1;
  drawManArm(t, swapped ? items.manAfter : items.manBefore);
  drawLeaf(t);
  drawDoorRobot(t, swapped ? items.robotAfter : items.robotBefore);
  ctx.restore();
}

function render(c: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  if (t >= ST.doorStart) return drawDoorShot(c, w, h, t - ST.doorStart, config.items);
  begin(c, w, h);
  if (t < ST.holoStart) drawHatch(t);
  else drawHolo(t);
  ctx.restore();
}

export const tradeHoloPlan: Cutscene = {
  id: "tradeHoloPlan",
  duration: config.duration,
  camera: config.camera,
  render,
};
