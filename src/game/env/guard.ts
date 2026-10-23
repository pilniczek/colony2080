import { fireFrame, flash, flyerHull } from "./flyer";
import { P, type EnvAsset } from "./paint";

type Pt = [number, number];
type Trace = (ctx: CanvasRenderingContext2D) => void;
type Stops = [number, string][];

const { box, flat, poly, disc, line, beam, stroke, shape, glow, curve } = P;

export const GUARD_SIZE = 1.4;
const SQUASH = 0.5;
const BROW = 22;
const GUN_BACK = 2;
const FIRE_LOOP = 1.4;
const MUZZLE: Pt = [20 + GUN_BACK, 33.7];
const ORIGIN: Pt = [58.5, 53.5];

export const ACID_GUARD_FIRING = 2;
const HULL = { nose: 21, rear: 54, top: 9, sx: 33 / 45.8, sy: 24 / 15.2 };
const LEG = 1 / 12;
const KNEE_PAD = 0.75;
const FRONT_BROW = -32.5;
const FRONT_BELLY = -14.5;
const FRONT_LIP = -30.4;
const FRONT_STRIPE = -34.58;
const GUN_HEX = { y: -19.2, r: 3.8 };
const FRONT_KNEE = 53.5 - 38.5;
const FRONT_STEP = { period: 0.8, lift: 3, bob: 0.8 };
export const ACID_GUARD_FRONT = { idle: 0, firing: 1, walk: 2 } as const;
const FOOT_AHEAD = 2;
const PLATE = { up: 1.2, ahead: 2 };
export const FAR_LEG = { dx: 2.5, shade: { brightness: 0.6, saturate: 0.8 } };
const SIDE_LEG = {
  joint: [300, 486] as Pt,
  cap: [[300, 448], [340, 452], [362, 478], [362, 510], [344, 534], [318, 532], [310, 500]] as Pt[],
  shin: [[256, 500], [340, 500], [354, 690], [240, 690]] as Pt[],
  foot: [[204, 688], [384, 688], [402, 712], [398, 744], [202, 744]] as Pt[],
  toe: [[300, 688], [384, 688], [396, 706], [300, 706]] as Pt[],
};

const FRONT_LEG = {
  axis: 211,
  shin: [[164, 508], [262, 508], [278, 690], [150, 690]] as Pt[],
  foot: [[146, 688], [282, 688], [290, 714], [286, 744], [142, 744], [136, 714]] as Pt[],
  toe: [[152, 688], [276, 688], [282, 706], [146, 706]] as Pt[],
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
  flyerHull(ctx, { hump: false, patch: false, fullStripe: true });
  ctx.restore();
};

const tiltedLip = (ctx: CanvasRenderingContext2D): void => {
  ctx.save();
  ctx.translate(23, 23.35);
  ctx.rotate(-0.0206);
  slit(ctx, 0, 16.4, 0, 0.9, [[0, "glint"], [0.14, "glint"], [0.2, "lip0"], [0.5, "lip1"], [0.85, "lip2"], [1, "lip1"]]);
  ctx.restore();
};

const sideHead = (ctx: CanvasRenderingContext2D): void => {
  squashAbove(ctx, 21, (top) => sideHull(ctx, top ? BROW : 0));
  tiltedLip(ctx);
};

const inRigUnits = (ctx: CanvasRenderingContext2D, at: Pt, sx: number, sy: number, origin: Pt, draw: () => void): void => {
  ctx.save();
  ctx.translate(at[0], at[1]);
  ctx.scale(sx, sy);
  ctx.translate(-origin[0], -origin[1]);
  draw();
  ctx.restore();
};

export interface KneeOptions {
  forward?: boolean;
  pad?: number;
  trim?: number;
  padAt?: Pt;
}

export const sideLegArmor = (ctx: CanvasRenderingContext2D, knee: Pt, ankle: Pt, { forward = false, pad = KNEE_PAD, trim = 0, padAt = knee }: KneeOptions = {}): void => {
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
  inRigUnits(ctx, padAt, (forward ? -1 : 1) * LEG * pad, LEG * pad, SIDE_LEG.joint, () => {
    disc(ctx, 300, 486, 30, "gm1", "gmLine");
    poly(ctx, SIDE_LEG.cap, "guardChrome", 1);
    if (trim) line(ctx, [[309.5, 488], [362, 488]], "trim", trim / (LEG * pad), "butt");
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
  P.inShade(FAR_LEG.shade, () => guardLeg(ctx, FAR_LEG.dx));
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

const canopy = (ctx: CanvasRenderingContext2D, trace: Trace, top: number, bottom: number, shine: Pt[]): void => {
  fillPath(ctx, trace, grad(ctx, 0, top, 0, bottom, [[0, "fc3"], [0.2, "fc2"], [1, "fc1"]]), "fc0");
  if (!P.simple()) curve(ctx, shine, "fc3", 0.5);
};

const bellyAt = (x: number): number => {
  const t = (9.4 - x) / 18.8;
  return -23.5 + 2 * t * (1 - t) * (FRONT_BELLY + 23.5);
};

const frontRecess = (ctx: CanvasRenderingContext2D): void => {
  ctx.fillStyle = P.pal().groove as string;
  ctx.fillRect(-12, FRONT_STRIPE, 24, FRONT_LIP - FRONT_STRIPE);
  slit(ctx, -8, 8, FRONT_STRIPE, FRONT_LIP - FRONT_STRIPE, [[0, "fs1"], [0.5, "fs2"], [1, "fs1"]]);
  slit(ctx, -10, 10, FRONT_LIP, 0.9, [[0, "lip0"], [0.3, "lip1"], [0.45, "glint"], [0.55, "glint"], [0.7, "lip1"], [1, "lip0"]]);
  const keel = [-7.2, -5.4, -3.6, -1.8, 0, 1.8, 3.6, 5.4, 7.2].map((x): Pt => [x, bellyAt(x)]);
  poly(ctx, [...keel, [5.2, -24.3], [0, -26.9], [-5.2, -24.3]], "guardMetal", 1, { dir: [1, 0] });
  if (!P.simple()) {
    for (const x of [-6.2, -5.2, 5.2, 6.2]) flat(ctx, x - 0.3, -28.4, 0.6, 3.4, "gm0");
    for (const x of [7.8, 9]) for (const y of [-27.6, -26.4]) for (const side of [-1, 1]) disc(ctx, side * x, y, 0.35, "gm0");
  }
  line(ctx, [[-12, FRONT_STRIPE], [12, FRONT_STRIPE]], "gmLine", 0.5, "butt");
  for (const x of [-8, 8]) line(ctx, [[x, FRONT_STRIPE], [x, FRONT_LIP]], "gmLine", 0.4, "butt");
};

const frontShell = (ctx: CanvasRenderingContext2D): void => {
  const shell: Trace = (c) => {
    c.moveTo(-9.6, -34);
    c.bezierCurveTo(-9, -45.4, 9, -45.4, 9.6, -34);
    c.quadraticCurveTo(11.2, -29, 9.4, -23.5);
    c.quadraticCurveTo(0, FRONT_BELLY, -9.4, -23.5);
    c.quadraticCurveTo(-11.2, -29, -9.6, -34);
  };
  fillPath(ctx, shell, grad(ctx, 0, -39, 0, -21, [[0, "shell2"], [0.35, "shell1"], [0.7, "gm1"], [1, "shell0"]]));
  ctx.save();
  ctx.beginPath();
  shell(ctx);
  ctx.clip();
  canopy(
    ctx,
    (c) => {
      c.moveTo(-12, FRONT_BROW);
      c.lineTo(-12, -44);
      c.lineTo(12, -44);
      c.lineTo(12, FRONT_BROW);
      c.quadraticCurveTo(0, FRONT_BROW - 1.5, -12, FRONT_BROW);
    },
    -41,
    FRONT_BROW,
    [[-7, -37.2], [-2, -39.6], [4, -39.2]],
  );
  frontRecess(ctx);
  ctx.restore();
};

const burst = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, k: number): void => {
  const heat = k === 0 ? 1 : Math.max(0, 1 - k / 5);
  if (heat <= 0) return;
  if (!P.simple()) glow(ctx, x, y, r * 2.4 * heat, "fire1", 0.6 * heat);
  const spikes = 7;
  const pts = Array.from({ length: spikes * 2 }, (_, i): Pt => {
    const a = (i / (spikes * 2)) * Math.PI * 2 + k;
    const rr = (i % 2 ? 0.55 : 1) * r * (0.5 + heat * 0.5);
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
  });
  shape(ctx, pts, "fire1");
  disc(ctx, x, y, r * 0.45 * heat + 0.3, heat > 0.5 ? "fire3" : "fire2");
};

const frontLeg = (ctx: CanvasRenderingContext2D, side: number, lift: number): void => {
  const x = side * 7;
  poly(ctx, [[x - 3, -24], [x + 3, -24], [x + 2.6, -FRONT_KNEE + 0.5 - lift], [x - 2.6, -FRONT_KNEE + 0.5 - lift]], "guardMetal", 1, { dir: [1, 0] });
  inRigUnits(ctx, [x, -lift], side * LEG, FRONT_KNEE / (744 - (FRONT_LEG.shin[0] as Pt)[1]), [FRONT_LEG.axis, 744], () => {
    poly(ctx, FRONT_LEG.shin, "guardMetal", 2, { dir: [1, 0] });
    poly(ctx, FRONT_LEG.foot, "guardMetal", 1);
    poly(ctx, FRONT_LEG.toe, "guardChrome", 2);
  });
};

const frontGun = (ctx: CanvasRenderingContext2D, side: number, fire: number): void => {
  const x = side * 14;
  const { y, r } = GUN_HEX;
  const h = r * 0.866;
  fillPath(
    ctx,
    (c) => {
      c.moveTo(side * 9.8, -28.3);
      c.lineTo(side * 8.7, -24.5);
      c.lineTo(x - side * r * 0.75, y - h / 2);
      c.lineTo(x, y);
      c.lineTo(x + (side * r) / 2, y - h);
      c.lineTo(side * 11.7, -25.3);
    },
    grad(ctx, side * 8.7, 0, x, 0, [[0, "gm1"], [0.6, "gm2"], [1, "gc1"]]),
  );
  poly(ctx, [[x - r, y], [x - r / 2, y - h], [x + r / 2, y - h], [x + r, y], [x + r / 2, y + h], [x - r / 2, y + h]], "guardMetal", 2);
  disc(ctx, x, y, 2.1, "gm0", "gmLine");
  if (!P.simple()) disc(ctx, x, y, 1, "gc0");
  if (fire >= 0) burst(ctx, x, y, 5, fire);
};

const frontStep = (t: number): { left: number; right: number; bob: number } => {
  const s = Math.sin((t / FRONT_STEP.period) * Math.PI * 2);
  return { left: Math.max(0, s) * FRONT_STEP.lift, right: Math.max(0, -s) * FRONT_STEP.lift, bob: Math.abs(s) * FRONT_STEP.bob };
};

export const acidGuardFront: EnvAsset = {
  id: "acidGuardFront",
  box: [-35, -70, 70, 70],
  anim: true,
  draw(ctx, state, t) {
    const fire = state === ACID_GUARD_FRONT.firing ? fireFrame(t % FIRE_LOOP) : -1;
    const step = state === ACID_GUARD_FRONT.walk ? frontStep(t) : { left: 0, right: 0, bob: 0 };
    ctx.scale(GUARD_SIZE, GUARD_SIZE);
    frontLeg(ctx, -1, step.left);
    frontLeg(ctx, 1, step.right);
    ctx.translate(0, -step.bob);
    squashAbove(ctx, FRONT_BROW, () => frontShell(ctx));
    frontGun(ctx, -1, fire < 0 ? -1 : Math.max(0, fire - 2));
    frontGun(ctx, 1, fire);
  },
};

export const guardAssets: EnvAsset[] = [acidGuard, acidGuardFront];
