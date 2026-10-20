import { fireFrame, flash, flyerHull } from "./flyer";
import { P, type EnvAsset } from "./paint";

type Pt = [number, number];
type Trace = (ctx: CanvasRenderingContext2D) => void;
type Stops = [number, string][];

const { box, flat, poly, disc, line, beam, stroke } = P;

const GUARD_SIZE = 1.4;
const SQUASH = 0.5;
const BROW = 22;
const GUN_BACK = 2;
const FIRE_LOOP = 1.4;
const MUZZLE: Pt = [20 + GUN_BACK, 33.7];
const ORIGIN: Pt = [58.5, 53.5];

export const ACID_GUARD_MUZZLE: Pt = [(MUZZLE[0] - ORIGIN[0]) * GUARD_SIZE, (MUZZLE[1] - ORIGIN[1]) * GUARD_SIZE];
export const ACID_GUARD_FIRING = 2;
const HULL = { nose: 21, rear: 54, top: 9, sx: 33 / 45.8, sy: 24 / 15.2 };
const LEG = 1 / 12;
const KNEE_PAD = 0.75;
const FOOT_AHEAD = 2;
const PLATE = { up: 1.2, ahead: 2 };
const FAR_LEG = { dx: 2.5, shade: "brightness(0.6) saturate(0.8)" };
const SIDE_LEG = {
  joint: [300, 486] as Pt,
  cap: [[300, 448], [340, 452], [362, 478], [362, 510], [344, 534], [318, 532], [310, 500]] as Pt[],
  shin: [[256, 500], [340, 500], [354, 690], [240, 690]] as Pt[],
  foot: [[204, 688], [384, 688], [402, 712], [398, 744], [202, 744]] as Pt[],
  toe: [[300, 688], [384, 688], [396, 706], [300, 706]] as Pt[],
};

export const grad = (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: Stops): CanvasGradient => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [at, c] of stops) g.addColorStop(at, P.pal()[c] || c);
  return g;
};

export const fillPath = (ctx: CanvasRenderingContext2D, trace: Trace, fill: CanvasGradient, outline = "gmLine"): void => {
  ctx.beginPath();
  trace(ctx);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  stroke(ctx, outline);
};

const slit = (ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, h: number, stops: Stops): void => {
  ctx.fillStyle = grad(ctx, x0, 0, x1, 0, stops);
  ctx.fillRect(x0, y, x1 - x0, h);
};

const squashAbove = (ctx: CanvasRenderingContext2D, y: number, draw: (top: boolean) => void): void => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(-100, y, 200, 200);
  ctx.clip();
  draw(false);
  ctx.restore();
  ctx.save();
  ctx.translate(0, y);
  ctx.scale(1, SQUASH);
  ctx.translate(0, -y);
  ctx.beginPath();
  ctx.rect(-100, y - 200, 200, 200);
  ctx.clip();
  draw(true);
  ctx.restore();
};

const sideHull = (ctx: CanvasRenderingContext2D, front: number): void => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(front, 0);
  ctx.lineTo(60, 0);
  ctx.lineTo(60, 60);
  ctx.lineTo(0, 60);
  ctx.lineTo(0, 24.2);
  ctx.lineTo(front, 24.2);
  ctx.closePath();
  ctx.clip();
  ctx.translate(HULL.rear + 3.2 * HULL.sx, HULL.top - 2.2 * HULL.sy);
  ctx.scale(-HULL.sx, HULL.sy);
  flyerHull(ctx, { hump: false, patch: false });
  ctx.restore();
};

const sideVisor = (ctx: CanvasRenderingContext2D): void => {
  line(ctx, [[BROW, 21], [26, 21]], "gmLine", 0.5, "butt");
  ctx.fillStyle = P.pal().groove as string;
  ctx.fillRect(26, 21, 16, 1.1);
  slit(ctx, 26, 41, 22.1, 1.1, [[0, "visor0"], [0.3, "visor1"], [0.75, "visor2"], [0.92, "visor3"], [1, "visor1"]]);
  ctx.fillStyle = P.pal().band as string;
  ctx.fillRect(26, 23.2, 16, 1);
  line(ctx, [[26, 21], [26, 24.2]], "gmLine", 0.4, "butt");
  slit(ctx, HULL.nose, 42, 24.2, 0.9, [[0, "glint"], [0.14, "glint"], [0.2, "lip0"], [0.5, "lip1"], [0.85, "lip2"], [1, "lip1"]]);
};

const sideHead = (ctx: CanvasRenderingContext2D): void => {
  squashAbove(ctx, 21, (top) => sideHull(ctx, top ? BROW : 26));
  sideVisor(ctx);
};

const inRigUnits = (ctx: CanvasRenderingContext2D, at: Pt, sx: number, sy: number, origin: Pt, draw: () => void): void => {
  ctx.save();
  ctx.translate(at[0], at[1]);
  ctx.scale(sx, sy);
  ctx.translate(-origin[0], -origin[1]);
  draw();
  ctx.restore();
};

const sideLegArmor = (ctx: CanvasRenderingContext2D, knee: Pt, ankle: Pt): void => {
  const len = Math.hypot(ankle[0] - knee[0], ankle[1] - knee[1]);
  ctx.save();
  ctx.translate(knee[0], knee[1]);
  ctx.rotate(Math.atan2(ankle[1] - knee[1], ankle[0] - knee[0]) - Math.PI / 2);
  inRigUnits(ctx, [0, 0], -LEG, len / 190, [298, 500], () => poly(ctx, SIDE_LEG.shin, "guardMetal", 2, { dir: [1, 0] }));
  ctx.restore();
  const [, , bottomRight, bottomLeft] = SIDE_LEG.shin as [Pt, Pt, Pt, Pt];
  const half = ((bottomRight[0] - bottomLeft[0]) * LEG) / 2;
  const side: Pt = [(half * (ankle[1] - knee[1])) / len, (-half * (ankle[0] - knee[0])) / len];
  const front = side[0] <= 0 ? 1 : -1;
  const edge: Pt = [ankle[0] + side[0] * front, ankle[1] + side[1] * front];
  const up: Pt = [edge[0] - (PLATE.up * (ankle[0] - knee[0])) / len, edge[1] - (PLATE.up * (ankle[1] - knee[1])) / len];
  const footTop = 53.5 - (744 - (SIDE_LEG.foot[0] as Pt)[1]) * LEG;
  const footX = ankle[0] - FOOT_AHEAD;
  poly(ctx, [[ankle[0], footTop + 0.5], edge, up, [edge[0] - PLATE.ahead, footTop + 0.5]], "guardMetal", 1);
  inRigUnits(ctx, [footX, 53.5], -LEG, LEG, [300, 744], () => {
    poly(ctx, SIDE_LEG.foot, "guardMetal", 1);
    poly(ctx, SIDE_LEG.toe, "guardChrome", 2);
  });
  inRigUnits(ctx, knee, LEG * KNEE_PAD, LEG * KNEE_PAD, SIDE_LEG.joint, () => {
    disc(ctx, 300, 486, 30, "gm1", "gmLine");
    poly(ctx, SIDE_LEG.cap, "guardChrome", 1);
  });
};

const guardLeg = (ctx: CanvasRenderingContext2D, dx: number): void => {
  const hip: Pt = [42.5 + dx, 30];
  const knee: Pt = [47.5 + dx, 38.5];
  const ankle: Pt = [41.5 + dx, 49.5];
  beam(ctx, hip, knee, 4.2, "guardMetal");
  sideLegArmor(ctx, knee, ankle);
};

const farLeg = (ctx: CanvasRenderingContext2D): void => {
  ctx.save();
  ctx.filter = FAR_LEG.shade;
  guardLeg(ctx, FAR_LEG.dx);
  ctx.restore();
};

const shoulder = (ctx: CanvasRenderingContext2D): void => {
  fillPath(
    ctx,
    (c) => {
      c.moveTo(35, 27);
      c.lineTo(40.5, 27);
      c.lineTo(21 + GUN_BACK + 22, 31);
      c.lineTo(36, 31);
      c.quadraticCurveTo(34.6, 29.2, 35, 27);
    },
    grad(ctx, 35, 0, 45, 0, [[0, "gm1"], [0.6, "gm2"], [1, "gc1"]]),
  );
};

const guardBody = (ctx: CanvasRenderingContext2D, fire: number): void => {
  farLeg(ctx);
  box(ctx, 26, 30, 14, 3, "guardMetal", 0);
  sideHead(ctx);
  guardLeg(ctx, 0);
  const g = GUN_BACK;
  box(ctx, 21 + g, 31, 22, 5.5, "guardMetal", 2);
  if (!P.simple()) {
    for (const x of [26, 31, 36]) flat(ctx, x + g, 31, 0.8, 5.5, "gm0");
    line(ctx, [[22 + g, 32.2], [42 + g, 32.2]], "gm3", 0.5, "butt");
  }
  box(ctx, 20 + g, 31.5, 1.8, 4.5, "guardChrome", 2, { vertical: true });
  if (fire >= 0) flash(ctx, MUZZLE[0], MUZZLE[1], -1, fire, 4.2);
  shoulder(ctx);
};

const WRECK_RODS: [Pt, Pt][] = [[[10, 70], [18, 59]], [[20, 72], [28, 60]], [[24, 66], [32, 64]]];

const guardWreck = (ctx: CanvasRenderingContext2D): void => {
  poly(ctx, [[4, 72], [8, 57], [14, 53], [22, 54.5], [30, 50.5], [40, 52], [48, 49.5], [58, 52.5], [66, 56], [70, 72]], "guardMetal", 1);
  poly(ctx, [[10, 56], [14, 53], [22, 54.5], [30, 50.5], [40, 52], [48, 49.5], [56, 52], [48, 53.5], [36, 54.5], [24, 57], [14, 58]], "guardChrome", 2, { line: false });
  for (const [a, b] of WRECK_RODS) beam(ctx, a, b, 1.6, "rust");
  poly(ctx, [[36, 58], [44, 52], [44, 58]], "guardMetal", 2);
  box(ctx, 47, 60, 22, 12, "guardMetal", 1);
  if (!P.simple()) {
    flat(ctx, 48, 62, 6, 2, "gc2");
    flat(ctx, 30, 62, 6, 1, "visor");
    line(ctx, [[12, 64], [40, 66]], "gm0", 0.6);
  }
};

export const acidGuard: EnvAsset = {
  id: "acidGuard",
  box: [-56, -56, 54, 56],
  anim: true,
  draw(ctx, state, t) {
    ctx.scale(GUARD_SIZE, GUARD_SIZE);
    if (state === 1) {
      ctx.translate(-21, 0);
      ctx.scale(0.6, 0.6);
      ctx.translate(-37, -72);
      guardWreck(ctx);
      return;
    }
    ctx.translate(-ORIGIN[0], -ORIGIN[1]);
    guardBody(ctx, state === ACID_GUARD_FIRING ? fireFrame(t % FIRE_LOOP) : -1);
  },
};

export const guardAssets: EnvAsset[] = [acidGuard];
