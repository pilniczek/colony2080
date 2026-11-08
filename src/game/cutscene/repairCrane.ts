import config from "@config/cutscenes/repair-crane.json";
import { drawRig, shade, type HookDraw, type Palette } from "../../engine/rig/draw";
import type { Pose } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset, PALETTE as ENV_PALETTE } from "../env/paint";
import { buildBack, buildFront, buildSide, ROBOT } from "../robot/xbot";
import type { Cutscene } from "./index";
import { bank, camera, cloud, feet, fitStage, oval, poly, rowFill, type Spot, stillLayer, stroke, tracks, unitScale } from "./kit";

type Frame = { x: number; y: number; a: number; k: number };
type Arms = { armL: number; foreL: number; armR: number; foreR: number };
export type Walk = { rate: number; phase?: number; cut: number; legs: number[][] };
export type Sky = { palette: Record<string, string>; sun: number[] };

const ST = config.stage;
const { width: W, height: H } = ST;
const RB = config.robot;
const CR = config.crane;
const WALK = config.walk;
const LINE = 1.4;
const MIN_LINE = 0.6;
const LIT = { brightness: 0.9, saturate: 1 };
const BEAM_MID = 84;
const CHAIN_TOP = -100;
const HANG: Pt = [BEAM_MID, CHAIN_TOP - CR.hang];
const CRANE_K0 = config.tracks.craneK[0]![1] as number;
const palette = { ...config.palette };
const SKY: Sky = { palette, sun: ST.sun };

const { num, text } = tracks(config.tracks);

const ROOF_CLOUDS = bank(13, 30, 600, 2400, -360, 640, 200, 380, 18, 32);
const STREAKS = bank(19, 10, -200, 2200, 120, 500, 160, 320, 6, 10);
const POSTS: [number, number][] = [[-300, 50], [60, 50], [380, 40]];
let rigs: { side: GroupNode; front: GroupNode; back: GroupNode } | null = null;

const backdrop = stillLayer();

export const robots = () => (rigs ??= { side: buildSide({ farLimbs: true }), front: buildFront({}), back: buildBack({}) });

export function sky(ctx: CanvasRenderingContext2D, { palette, sun: [sunX, sunY, sunR] }: Sky, horizon: number, clouds: Spot[]): void {
  rowFill(ctx, (c) => {
    const g = c.createLinearGradient(0, horizon - 900, 0, horizon);
    g.addColorStop(0, palette.sky0!);
    g.addColorStop(0.4, palette.sky1!);
    g.addColorStop(0.75, palette.sky2!);
    g.addColorStop(0.92, palette.glow!);
    g.addColorStop(1, palette.sun!);
    c.fillStyle = g;
    c.fillRect(-1000, -1000, 4600, horizon + 1000);
  });
  ctx.save();
  ctx.translate(sunX!, sunY!);
  ctx.scale(1, 0.4);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, sunR!);
  glow.addColorStop(0, palette.sun!);
  glow.addColorStop(0.35, palette.glow!);
  glow.addColorStop(1, palette.glow + "00");
  ctx.fillStyle = glow;
  ctx.fillRect(-sunR!, -sunR!, sunR! * 2, sunR! * 2);
  ctx.restore();
  for (const [x, y, w, h] of clouds) {
    cloud(ctx, x, y, w, h, Math.min(1, 0.25 + (y - horizon + 900) / 900), palette.cloudLit!, palette.cloud!);
  }
}

export const lineFor = (c: CanvasRenderingContext2D): number => {
  return Math.max(MIN_LINE, LINE * unitScale(c));
};

export const walkPose = (walk: Walk, base: Arms, t: number, stride: number): { lift: number; pose: Pose } => {
  const lift = Math.sin((t + (walk.phase ?? 0)) * Math.PI * 2 * walk.rate) * stride;
  const swing = lift * 0.25;
  return {
    lift,
    pose: { ...base, body: { dy: -Math.abs(lift) * 0.3 }, armL: base.armL + swing, armR: base.armR + swing },
  };
};

export function walker(ctx: CanvasRenderingContext2D, walk: Walk, rig: GroupNode, pose: Pose, pal: Palette, lineW: number, lift: number): void {
  const [[lx, lw], [rx, rw]] = walk.legs as [[number, number], [number, number]];
  const { cut } = walk;
  const legs: [number, number, number][] = [[lx, lw, Math.max(0, lift)], [rx, rw, Math.max(0, -lift)]];
  for (const [x, w, up] of legs) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, cut, w, 500);
    ctx.clip();
    ctx.translate(x + w / 2, cut);
    ctx.scale(1 + up * 0.004, 1);
    ctx.translate(-(x + w / 2), -cut - up);
    drawRig(ctx, rig, { palette: pal, pose, lineW });
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(-400, -400, 1440, 1400);
  ctx.rect(lx, cut, lw, 500);
  ctx.rect(rx, cut, rw, 500);
  ctx.clip("evenodd");
  drawRig(ctx, rig, { palette: pal, pose, lineW });
  ctx.restore();
}

const craneFrame = (t: number): Frame => ({ x: num("craneX", t), y: num("craneY", t), a: (num("craneSwing", t) * Math.PI) / 180, k: num("craneK", t) });

const cranePoint = (f: Frame, px: number, py: number): Pt => {
  const dx = (px - HANG[0]) * f.k, dy = (py - HANG[1]) * f.k;
  return [f.x + dx * Math.cos(f.a) - dy * Math.sin(f.a), f.y + dx * Math.sin(f.a) + dy * Math.cos(f.a)];
};

function drawCrane(ctx: CanvasRenderingContext2D, f: Frame): void {
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(f.a);
  ctx.scale(f.k, f.k);
  ctx.translate(-HANG[0], -HANG[1]);
  const lineW = lineFor(ctx);
  stroke(ctx, [[BEAM_MID, HANG[1] - 400], [BEAM_MID, CHAIN_TOP]], ENV_PALETTE.c0!, 2.4);
  stroke(ctx, [[BEAM_MID, HANG[1] - 400], [BEAM_MID, CHAIN_TOP]], ENV_PALETTE.c1!, 1.2);
  drawAsset(ctx, ASSETS.crane, { state: 1, lines: lineW });
  ctx.restore();
}

function drawCity(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = palette.void;
  ctx.fillRect(ST.cityX - 400, ST.cityY - 2, 3000, 1000);
  ctx.save();
  ctx.translate(ST.cityX, ST.cityY);
  ctx.scale(ST.cityScale, ST.cityScale);
  ctx.beginPath();
  ctx.rect(0, -110, 320, 110);
  ctx.clip();
  drawAsset(ctx, ASSETS.skyBackground, { state: 0, lines: lineFor(ctx) });
  ctx.restore();
}

function drawTowers(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = palette.brick;
  ctx.fillRect(480, -600, 600, 1170);
  ctx.fillStyle = palette.mortar;
  for (let y = -600; y < 570; y += 26) ctx.fillRect(480, y, 600, 3);
  ctx.fillStyle = palette.brickLit;
  ctx.fillRect(560, -600, 64, 1170);
  ctx.fillRect(1010, -600, 70, 1170);
  ctx.fillStyle = palette.woodDark;
  ctx.fillRect(-420, -600, 900, 1170);
  for (const [x, w] of POSTS) {
    ctx.fillStyle = palette.wood;
    ctx.fillRect(x, -600, w, 1170);
    ctx.fillStyle = palette.woodLit;
    ctx.fillRect(x + w - 10, -600, 10, 1170);
  }
  for (const y of [-300, 60]) {
    stroke(ctx, [[-250, y], [60, y + 340]], palette.wood, 30);
    stroke(ctx, [[60, y], [-250, y + 340]], palette.wood, 30);
    stroke(ctx, [[110, y], [380, y + 340]], palette.wood, 26);
    stroke(ctx, [[380, y], [110, y + 340]], palette.wood, 26);
  }
  ctx.fillStyle = palette.woodLit;
  ctx.fillRect(-420, -60, 900, 40);
  ctx.fillRect(-420, 380, 900, 30);
}

function drawDeck(ctx: CanvasRenderingContext2D): void {
  const top = ST.deckTop, front = ST.deckFront, right = ST.deckRight;
  poly(ctx, [[-600, top], [right, top], [right - 90, front], [-600, front]], palette.deck);
  for (const [x, y, w, h] of STREAKS) if (y > 0 && x - 400 + w < right - 90) oval(ctx, x - 400, top + (y - 120) * 0.38, w, h * 0.6, palette.deckStreak);
  poly(ctx, [[-600, top], [right, top], [right - 4, top + 10], [-600, top + 10]], palette.deckLit);
  poly(ctx, [[-600, front], [right - 90, front], [right - 90, 1200], [-600, 1200]], palette.deckFront);
  poly(ctx, [[right - 90, front], [right, top], [right, top + 60], [right - 90, 1200]], palette.deckSide);
}

export const arms = (num: (name: string, t: number) => number, t: number): Arms => ({ armL: num("armL", t), foreL: num("foreL", t), armR: num("armR", t), foreR: num("foreR", t) });

function roofHero(ctx: CanvasRenderingContext2D, t: number, f: Frame): void {
  const { side, front, back } = robots();
  const kind = text("pose", t);
  const k = num("heroK", t);
  ctx.save();
  if (kind === "side") {
    feet(ctx, RB.x, RB.y, -k, k, ROBOT.SIDE_AX);
    const pose: Pose = { arm: num("armB", t), fore: num("foreB", t) };
    const turn = (num("keyTurn", t) * Math.PI) / 180;
    const hand: HookDraw = (c) => {
      c.save();
      c.rotate(turn);
      c.scale(RB.keyScale, RB.keyScale);
      c.translate(-4, 3);
      drawAsset(c, ASSETS.craneKey, { state: 0, lines: lineFor(c) });
      c.restore();
    };
    drawRig(ctx, side, { palette: shade(ROBOT.palette, LIT), pose, hooks: { hand }, lineW: lineFor(ctx) });
  } else if (kind === "front") {
    const [bx, by] = cranePoint(craneFrame(5.8), RB.aboardX, 0);
    const w = num("walk", t);
    feet(ctx, RB.x + (bx - RB.x) * w, RB.y + (by - RB.y) * w, k, k, ROBOT.AX);
    const { lift, pose } = walkPose(WALK, arms(num, t), t, num("stride", t));
    walker(ctx, WALK, front, pose, shade(ROBOT.palette, LIT), lineFor(ctx), lift);
  } else {
    const [x, y] = cranePoint(f, RB.aboardX, 0);
    const kf = (k * f.k) / CRANE_K0;
    feet(ctx, x, y, kf, kf, ROBOT.AX, f.a);
    drawRig(ctx, back, { palette: shade(ROBOT.palette, LIT), pose: { armL: 10, armR: -10 }, lineW: lineFor(ctx) });
  }
  ctx.restore();
}

function drawPanel(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(CR.panelX, RB.y);
  ctx.scale(CR.panelScale, CR.panelScale);
  drawAsset(ctx, ASSETS.craneMast, { lines: lineFor(ctx), size: { h: 200 } });
  ctx.restore();
}

function roofShot(ctx: CanvasRenderingContext2D, t: number): void {
  const f = craneFrame(t);
  backdrop(ctx, ["roof"], (c) => {
    sky(c, SKY, ST.deckTop, ROOF_CLOUDS);
    drawCity(c);
    drawTowers(c);
    drawDeck(c);
    drawPanel(c);
  });
  const aboard = text("pose", t) === "back";
  if (!aboard) roofHero(ctx, t, f);
  drawCrane(ctx, f);
  if (aboard) roofHero(ctx, t, f);
}

function render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  ctx.save();
  fitStage(ctx, w, h, W, H);
  camera(ctx, W, H, num("camX", t), num("camY", t), num("camZ", t));
  roofShot(ctx, t);
  ctx.restore();
}

export const repairCrane: Cutscene = {
  id: "repairCrane",
  duration: config.duration,
  camera: config.camera,
  render,
};
