import config from "@config/cutscenes/hull-cover.json";
import { drawRig, shade } from "../../engine/rig/draw";
import type { Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset, P, PALETTE, type EnvAsset } from "../env/paint";
import { gunHook, gunSlung, holdPoses, MUZZLE_IN_HOOK } from "../robot/gun";
import { buildBack, buildFront, buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { camera, feet, fitStage, hookAt, LINE_W, lineFor, poly, random, shadow, stillLayer, tracks } from "./kit";

type View = { horizon: number; shipX: number; shipY: number; shipScale: number };
type Rock = { pts: Pt[]; tone: number };

const S = config.stage;
const { width: W, height: H } = S;
const palette: Record<string, string> = { ...config.palette };
const FIRE_AT = config.tracks.fire[1]![0] as number;
const COVER = [8, -38, 20, 12] as const;
const [FLY_X, FLY_Y, FLY_G] = S.coverFly as [number, number, number];
const shipPalette = shade(PALETTE, { brightness: S.shipShade });
const plate: EnvAsset = { id: "hullPlate", box: [0, 0, 0, 0], draw: (c) => P.box(c, -COVER[2] / 2, -COVER[3] / 2, COVER[2], COVER[3], "steel", 2) };

const { num: at, text } = tracks(config.tracks);

const pick = random(S.seed);
const rocks: Rock[] = [];
for (let i = 0; i < 26; i++) {
  const x = -600 + i * 120 + pick() * 60;
  const w = 120 + pick() * 160;
  const top = -40 + pick() * 120;
  const low = 180 + pick() * 220;
  rocks.push({ pts: [[x, top], [x + w, top + pick() * 60], [x + w * (0.7 + pick() * 0.3), low], [x + w * pick() * 0.3, low - pick() * 80]], tone: 1 + Math.floor(pick() * 3) });
}

let rigs: { side: GroupNode; back: GroupNode; carry: ReturnType<typeof holdPoses> } | null = null;
const robots = () => {
  if (rigs) return rigs;
  const side = buildSide({ farLimbs: true, propBehindArm: true });
  return (rigs = { side, back: buildBack({}), carry: holdPoses(side, buildFront({})) });
};

function drawHangar(ctx: CanvasRenderingContext2D, view: View, shift: number): void {
  ctx.fillStyle = palette.dark!;
  ctx.fillRect(-1000, -1000, 3600, 3000);
  for (const r of rocks) poly(ctx, r.pts.map(([x, y]): Pt => [x + shift, y]), palette[`rock${r.tone}`]!);
  const hz = view.horizon;
  ctx.fillStyle = palette.floorFar!;
  ctx.fillRect(-1000, hz - 30, 3600, 30);
  ctx.fillStyle = palette.floor!;
  ctx.fillRect(-1000, hz, 3600, 2000);
  ctx.beginPath();
  for (let i = 1; i < 16; i++) {
    const y = hz + 520 / (0.5 + i * 0.45) - 40;
    if (y <= hz) continue;
    ctx.moveTo(-1000, y);
    ctx.lineTo(2600, y);
  }
  for (let k = -14; k <= 14; k++) {
    ctx.moveTo(800 + shift * 0.3 + k * 30, hz);
    ctx.lineTo(800 + shift * 0.3 + k * 420, hz + 1400);
  }
  ctx.strokeStyle = palette.floorLine!;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawShip(ctx: CanvasRenderingContext2D, view: View, state: number): void {
  ctx.save();
  ctx.translate(view.shipX, view.shipY);
  ctx.scale(view.shipScale, view.shipScale);
  drawAsset(ctx, ASSETS.crashedShip, { state, lines: LINE_W, palette: shipPalette });
  ctx.restore();
}

const backdrop = stillLayer();

const legUp = (r: number): [Pose[string], Pose[string]] => [{ sy: 1 - 0.5 * r }, { dy: -85 * r }];

function drawWalk(ctx: CanvasRenderingContext2D, t: number): void {
  const V = S.walk;
  backdrop(ctx, [], (c) => {
    drawHangar(c, V, 0);
    drawShip(c, V, 0);
  });
  const k = at("walkScale", t);
  const x = at("walkX", t);
  const y = at("walkY", t);
  const swing = Math.sin((2 * Math.PI * t) / V.stepSeconds);
  const [thighL, shinL] = legUp(V.lift * Math.max(0, swing));
  const [thighR, shinR] = legUp(V.lift * Math.max(0, -swing));
  const pose: Pose = { body: { dy: -V.bob * Math.abs(swing) }, thighL: thighL!, shinL: shinL!, thighR: thighR!, shinR: shinR!, armL: -V.swing * swing, armR: -V.swing * swing };
  shadow(ctx, x, y, 230 * k, 26 * k, 0.4, palette.shadow!);
  ctx.save();
  feet(ctx, x, y, k, k, ROBOT.AX);
  const lineW = lineFor(ctx, k);
  drawRig(ctx, robots().back, { palette: ROBOT.palette, pose, lineW });
  gunSlung(ctx, ROBOT.palette, { lineW });
  ctx.restore();
}

function drawFlash(ctx: CanvasRenderingContext2D, m: DOMMatrix, on: boolean): void {
  if (!on) return;
  const tip = m.transformPoint(new DOMPoint(MUZZLE_IN_HOOK[0], MUZZLE_IN_HOOK[1]));
  const ahead = m.transformPoint(new DOMPoint(MUZZLE_IN_HOOK[0], MUZZLE_IN_HOOK[1] + 1));
  const dx = ahead.x - tip.x;
  const dy = ahead.y - tip.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const star: Pt[] = [];
  for (let i = 0; i < 12; i++) {
    const a = Math.atan2(uy, ux) + (i * Math.PI) / 6;
    const r = i % 2 ? 22 : i === 0 ? 90 : 48;
    star.push([tip.x + ux * 20 + Math.cos(a) * r, tip.y + uy * 20 + Math.sin(a) * r]);
  }
  poly(ctx, star, palette.flashEdge!);
  ctx.fillStyle = palette.flash!;
  ctx.beginPath();
  ctx.arc(tip.x + ux * 24, tip.y + uy * 24, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.flashCore!;
  ctx.beginPath();
  ctx.arc(tip.x + ux * 22, tip.y + uy * 22, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.flash!;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(tip.x + ux * 120, tip.y + uy * 120);
  ctx.lineTo(tip.x + ux * (120 + S.tracer), tip.y + uy * (120 + S.tracer));
  ctx.stroke();
}

const coverCentre = (view: View): Pt => [view.shipX + (COVER[0] + COVER[2] / 2) * view.shipScale, view.shipY + (COVER[1] + COVER[3] / 2) * view.shipScale];

function drawHits(ctx: CanvasRenderingContext2D, view: View, t: number, frame: number): void {
  if (at("hits", t) < 0.5) return;
  const [cx, cy] = coverCentre(view);
  const spark = random(frame + 7);
  ctx.strokeStyle = palette.spark!;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = spark() * Math.PI * 2;
    const r0 = 10 + spark() * 20;
    const r1 = r0 + 30 + spark() * 50;
    const ox = (spark() - 0.5) * COVER[2] * view.shipScale * 0.8;
    const oy = (spark() - 0.5) * COVER[3] * view.shipScale * 0.8;
    ctx.moveTo(cx + ox + Math.cos(a) * r0, cy + oy + Math.sin(a) * r0);
    ctx.lineTo(cx + ox + Math.cos(a) * r1, cy + oy + Math.sin(a) * r1);
  }
  ctx.stroke();
}

function drawDebris(ctx: CanvasRenderingContext2D, view: View, t: number): void {
  const k = view.shipScale;
  const [cx, cy] = coverCentre(view);
  const drop = at("partDrop", t);
  if (at("cover", t) >= 0.5) {
    ctx.save();
    ctx.translate(cx, cy + drop * S.partDrop);
    ctx.scale(S.partScale, S.partScale);
    ctx.rotate(drop * 0.6);
    ctx.translate(-9, 6);
    drawAsset(ctx, ASSETS.shipPart, { state: 1, lines: LINE_W, palette: shipPalette });
    ctx.restore();
  }
  const fly = at("coverFly", t);
  if (fly <= 0 || fly >= 1) return;
  ctx.save();
  ctx.translate(cx + FLY_X * fly, cy + FLY_Y * fly + (FLY_G * fly * fly) / 2);
  ctx.rotate(fly * 7);
  ctx.scale(k, k);
  drawAsset(ctx, plate, { lines: LINE_W, palette: shipPalette });
  ctx.restore();
}

function drawAim(ctx: CanvasRenderingContext2D, t: number): void {
  const V = S.aim;
  const { side, carry } = robots();
  const z = at("camZ", t);
  camera(ctx, W, H, at("camX", t), at("camY", t), z);
  drawHangar(ctx, V, 420);
  drawShip(ctx, V, at("cover", t) >= 0.5 ? 1 : 0);
  drawDebris(ctx, V, t);
  const raise = at("raise", t);
  const firing = at("fire", t) >= 0.5;
  const frame = Math.floor((t - FIRE_AT) / S.flashSeconds);
  const on = firing && frame % 2 === 0;
  const kick = on ? -3 : 0;
  const pose: Pose = { arm: carry.CARRY.arm * raise + kick, fore: carry.CARRY.fore * raise, armFar: carry.CARRY_FAR.armFar * raise + kick, foreFar: carry.CARRY_FAR.foreFar * raise };
  const m = new DOMMatrix().translate(V.x, V.floorY).scale(V.scale).translate(-ROBOT.SIDE_AX, -ROBOT.FOOT_Y);
  shadow(ctx, V.x, V.floorY, 200 * V.scale, 22 * V.scale, 0.4, palette.shadow!);
  ctx.save();
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  const lineW = lineFor(ctx, V.scale);
  drawRig(ctx, side, { palette: ROBOT.palette, pose, hooks: { hand: (c) => gunHook(c, ROBOT.palette, { lineW }) }, lineW });
  ctx.restore();
  const hand = hookAt(side, "hand", pose);
  drawFlash(ctx, m.multiply(new DOMMatrix([hand.a, hand.b, hand.c, hand.d, hand.e, hand.f])), on);
  if (firing) drawHits(ctx, V, t, frame);
}

function render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  ctx.save();
  fitStage(ctx, w, h, W, H);
  if (text("shot", t) === "A") drawWalk(ctx, t);
  else drawAim(ctx, t);
  ctx.restore();
}

export const hullCover: Cutscene = { id: "hullCover", duration: config.duration, camera: config.camera, render };
