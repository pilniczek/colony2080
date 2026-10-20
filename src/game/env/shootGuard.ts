import robotJson from "@config/robots/xbot.json";
import { apply } from "../../engine/math/mat2d";
import { drawRig, type HookDraw } from "../../engine/rig/draw";
import { locate } from "../../engine/rig/pose";
import type { GroupNode, RigNode } from "../../engine/rig/tree";
import { buildSide, ROBOT } from "../robot/xbot";
import { BLAST, BLAST_PX, drawBlast, inBlastUnits } from "./blast";
import { fireFrame, flash } from "./flyer";
import { FAR_LEG, fillPath, grad, GUARD_SIZE, sideLegArmor } from "./guard";
import { P, TILE, type EnvAsset, type EnvPalette } from "./paint";

type Pt = [number, number];

const { poly, box, flat, disc, line, glow, beam } = P;

const ORIGIN: Pt = [24, 68];
const ARM_PX = ((1.9 * TILE) / (ROBOT.FOOT_Y - robotJson.levels.head)) * 1.35;
const ARM_SHOULDER: Pt = [28, 29];
const ARM_PIVOT: Pt = [300, 150];
const ARM_POSE = { arm: 0, fore: -72 };
const RIFLE_MUZZLE: Pt = [17.5, -2.1];
const FIRE_LOOP = 1.2;
const HIP: Pt = [26, 47];
const RAISE = 23.5 * GUARD_SIZE - (68 - HIP[1]);
const GUARD_HIP: Pt = [42.5, 53.5];
const KNEE_PAD = 1.15;
const TRIM = 0.9;
const LEGS: Record<"front" | "rear", [Pt, Pt, Pt]> = {
  front: [[42.5, 30], [36, 39], [39.5, 49.5]],
  rear: [[45, 30], [52, 40], [59.5, 49.5]],
};
const BACK_TUBES: [number, number, number][] = [[16.5, 29.5, 5.5], [14.5, 34, 6], [15, 38.5, 5]];

const findNode = (node: RigNode, name: string): GroupNode | null => {
  if (node.k !== "g") return null;
  if (node.name === name) return node;
  for (const kid of node.kids) {
    const hit = findNode(kid, name);
    if (hit) return hit;
  }
  return null;
};

const armNodes = new Map<boolean, GroupNode>();

const armNode = (lod: boolean): GroupNode => {
  const cached = armNodes.get(lod);
  if (cached) return cached;
  const node = findNode(buildSide({ enemy: true, lod }), "arm");
  if (!node) throw new Error("robot side tree has no arm");
  armNodes.set(lod, node);
  return node;
};

const armPalette = (pal: EnvPalette): EnvPalette => ({
  ...ROBOT.palette,
  a0: pal.gm0!, a1: pal.gm2!, a2: pal.gm3!, a3: pal.gc1!, aLine: pal.gmLine!,
  m0: pal.gm0!, m1: pal.gm1!, m2: pal.gm2!, m3: pal.gm3!, mLine: pal.gmLine!,
  c0: pal.gc0!, c1: pal.gc1!, c2: pal.gc2!, c3: pal.gc3!,
});

const muzzle = (): Pt => {
  const hand = locate(armNode(false), "hand", ARM_POSE);
  if (!hand) throw new Error("robot arm has no hand hook");
  const [x, y] = apply(hand, [-RIFLE_MUZZLE[1] / ARM_PX, RIFLE_MUZZLE[0] / ARM_PX]);
  return [ARM_SHOULDER[0] + (x - ARM_PIVOT[0]) * ARM_PX, ARM_SHOULDER[1] + (y - ARM_PIVOT[1]) * ARM_PX - RAISE];
};

const MUZZLE = muzzle();

export const SHOOT_GUARD_MUZZLE: Pt = [MUZZLE[0] - ORIGIN[0], MUZZLE[1] - ORIGIN[1]];
export const SHOOT_GUARD_FIRING = 1;
export const SHOOT_GUARD_EXPLODE = 2;

const tail = (ctx: CanvasRenderingContext2D): void => {
  const spine: Pt[] = [[19, 46 - RAISE], [15, 44], [11, 51.5], [5, 57.5], [-3, 61.5]];
  spine.slice(1).forEach((b, i) => beam(ctx, spine[i]!, b, 5.2 - i * 1.1, "guardMetal"));
  poly(ctx, [[-2.5, 60.6], [-8, 63], [-2.5, 62.6]], "guardMetal", 2);
  if (!P.simple()) spine.slice(1, 4).forEach(([x, y], i) => line(ctx, [[x - 1.6 + i * 0.3, y - 1.8 + i * 0.3], [x + 1.6 - i * 0.3, y + 1.8 - i * 0.3]], "gm0", 0.6, "butt"));
};

const inGuardLegUnits = (ctx: CanvasRenderingContext2D, draw: () => void): void => {
  ctx.save();
  ctx.translate(HIP[0], 68);
  ctx.scale(-GUARD_SIZE, GUARD_SIZE);
  ctx.translate(-GUARD_HIP[0], -GUARD_HIP[1]);
  draw();
  ctx.restore();
};

const along = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

const across = (a: Pt, b: Pt, t: number, half: number): Pt[] => {
  const [x, y] = along(a, b, t);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [nx, ny] = [((a[1] - b[1]) / len) * half, ((b[0] - a[0]) / len) * half];
  return [[x - nx, y - ny], [x + nx, y + ny]];
};

const leg = (ctx: CanvasRenderingContext2D, [hip, knee, ankle]: [Pt, Pt, Pt]): void => {
  beam(ctx, hip, knee, 5.2, "guardMetal");
  const w = TRIM / GUARD_SIZE;
  sideLegArmor(ctx, knee, ankle, { forward: true, pad: KNEE_PAD, trim: w, padAt: along(knee, hip, 0.22) });
  line(ctx, across(hip, knee, 0.5, 2.6), "trim", w, "butt");
  disc(ctx, hip[0], hip[1], 3.4, "gm2", "gmLine");
  disc(ctx, hip[0], hip[1], 1.5, "gc1", "gmLine");
  line(ctx, across(knee, ankle, 0.55, (7 + 2.5 * 0.55) / 2), "trim", w, "butt");
};

const legs = (ctx: CanvasRenderingContext2D): void => {
  inGuardLegUnits(ctx, () => {
    ctx.save();
    ctx.filter = FAR_LEG.shade;
    leg(ctx, LEGS.rear);
    ctx.restore();
  });
  tail(ctx);
  ctx.save();
  ctx.translate(0, -RAISE);
  fillPath(
    ctx,
    (c) => {
      c.moveTo(18, 42);
      c.lineTo(31, 42);
      c.quadraticCurveTo(34.5, 44, 33, 48);
      c.quadraticCurveTo(31, 51.5, 25, 51.5);
      c.quadraticCurveTo(18.5, 51.5, 17, 47.5);
      c.quadraticCurveTo(16, 43.5, 18, 42);
    },
    grad(ctx, 16, 0, 34, 0, [[0, "gc0"], [0.4, "gc1"], [0.8, "gc2"], [1, "gc1"]]),
  );
  line(ctx, [[16.8, 46], [33.4, 46]], "trim", TRIM, "butt");
  ctx.restore();
  inGuardLegUnits(ctx, () => leg(ctx, LEGS.front));
};

const torso = (ctx: CanvasRenderingContext2D): void => {
  for (const [x, y, len] of BACK_TUBES) beam(ctx, [x, y], [x - len * 0.55, y - len * 0.8], 4.2, "guardMetal");
  poly(ctx, [[15, 25], [26, 21], [33, 26], [34, 34], [30, 42], [18, 43], [13, 35]], "flyerShell", 1, { dir: [1, 0] });
  poly(ctx, [[22, 23], [30, 24.5], [33.5, 30], [24, 31]], "guardMetal", 2);
  poly(ctx, [[24, 32], [33.6, 31], [33, 36], [25, 37]], "guardChrome", 1);
  poly(ctx, [[19, 38.5], [31.5, 38], [29.5, 42], [19, 42.5]], "guardMetal", 1);
  if (!P.simple()) line(ctx, [[23, 24], [29, 25.2]], "gc2", 0.5);
};

const DOME = { at: [38.5, 20.4] as Pt, tilt: 0.17, length: 26, r: 4.6 };

const dome = (ctx: CanvasRenderingContext2D): void => {
  const { length: l, r } = DOME;
  ctx.save();
  ctx.translate(DOME.at[0], DOME.at[1]);
  ctx.rotate(DOME.tilt);
  fillPath(
    ctx,
    (c) => {
      c.moveTo(0, -r);
      c.lineTo(-l, -r);
      c.arc(-l, 0, r, -Math.PI / 2, Math.PI / 2, true);
      c.lineTo(0, r);
    },
    grad(ctx, 0, -r, 0, r, [[0, "fc3"], [0.35, "fc2"], [0.75, "fc1"], [1, "fc0"]]),
    "gmLine",
  );
  line(ctx, [[-3, -r + 1], [-l + 1, -r + 1]], "gc1", 0.6, "butt");
  if (!P.simple()) {
    for (const x of [-9, -14, -19, -24]) line(ctx, [[x, -r + 0.4], [x, r * 0.55]], "fc0", 0.5, "butt");
    line(ctx, [[-4, 1.8], [-l, 1.8]], "fc0", 0.5, "butt");
    for (const x of [-11.5, -16.5, -21.5]) disc(ctx, x, 3, 0.6, "gc1");
  }
  line(ctx, [[-6, -r], [-6, r]], "trim", TRIM, "butt");
  ctx.restore();
};

const head = (ctx: CanvasRenderingContext2D): void => {
  poly(ctx, [[30, 27], [29, 22], [34, 21], [35, 26]], "guardMetal", 0);
  dome(ctx);
  fillPath(
    ctx,
    (c) => {
      c.moveTo(34, 15.2);
      c.lineTo(40, 15.4);
      c.quadraticCurveTo(42.6, 16.4, 42.4, 17.6);
      c.lineTo(41.8, 19.4);
      c.quadraticCurveTo(43.8, 20.6, 43.2, 21.6);
      c.lineTo(41.8, 22);
      c.lineTo(42, 22.8);
      c.lineTo(35, 23);
      c.quadraticCurveTo(33.4, 19, 34, 15.2);
    },
    grad(ctx, 34, 0, 43, 0, [[0, "gc0"], [0.45, "gc1"], [0.85, "gc2"], [1, "gc1"]]),
  );
  fillPath(
    ctx,
    (c) => {
      c.moveTo(34.8, 17.9);
      c.lineTo(42.5, 17.7);
      c.lineTo(42.3, 18.6);
      c.lineTo(35, 18.8);
    },
    grad(ctx, 34.8, 0, 42.5, 0, [[0, "visor0"], [0.35, "visor1"], [0.75, "visor2"], [0.92, "visor3"], [1, "visor1"]]),
    "gmLine",
  );
  fillPath(
    ctx,
    (c) => {
      c.moveTo(33.4, 21.8);
      c.lineTo(36, 22.6);
      c.lineTo(42.5, 23);
      c.lineTo(44, 23.3);
      c.lineTo(44, 25.4);
      c.lineTo(42.2, 26.8);
      c.lineTo(36.5, 26.8);
      c.lineTo(33.6, 25.6);
    },
    grad(ctx, 0, 22.6, 0, 26.8, [[0, "gc2"], [0.3, "gc1"], [0.7, "gm3"], [1, "gm1"]]),
  );
  line(ctx, [[38, 23.2], [43.4, 23.4]], "gmLine", 0.6, "butt");
  if (!P.simple()) {
    glow(ctx, 41, 18.3, 3.6, "visorGlow", 0.45);
    disc(ctx, 35.4, 24, 1.1, "gm1", "gmLine");
    line(ctx, [[37, 25.6], [42.4, 25.5]], "gm2", 0.5, "butt");
  }
};

const rifle = (ctx: CanvasRenderingContext2D, fire: number): void => {
  box(ctx, -2, -3.6, 19, 3, "trooperGun", 2);
  box(ctx, 4, -5, 6, 1.4, "trooperGun", 1);
  box(ctx, -1, -0.6, 2.2, 3.6, "trooperGun", 1, { vertical: true });
  if (!P.simple()) for (const x of [7, 11]) flat(ctx, x, -3.6, 0.6, 3, "tg0");
  if (fire >= 0) flash(ctx, RIFLE_MUZZLE[0], RIFLE_MUZZLE[1], 1, fire, 3.8);
};

const arm = (ctx: CanvasRenderingContext2D, fire: number): void => {
  const t = ctx.getTransform();
  const lineW = P.lw(ctx) * Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
  const hand: HookDraw = (c) => {
    c.save();
    c.transform(0, 1, -1, 0, 0, 0);
    c.scale(1 / ARM_PX, 1 / ARM_PX);
    rifle(c, fire);
    c.restore();
  };
  ctx.save();
  ctx.translate(ARM_SHOULDER[0], ARM_SHOULDER[1]);
  ctx.scale(ARM_PX, ARM_PX);
  ctx.translate(-ARM_PIVOT[0], -ARM_PIVOT[1]);
  drawRig(ctx, armNode(P.simple()), { palette: armPalette(P.pal()), pose: ARM_POSE, hooks: { hand }, lineW, simple: P.simple() });
  ctx.restore();
  line(ctx, [[23.3, 28.6], [32.5, 28.6]], "trim", TRIM, "butt");
};

const body = (ctx: CanvasRenderingContext2D, fire: number): void => {
  ctx.translate(-ORIGIN[0], -ORIGIN[1]);
  legs(ctx);
  ctx.translate(0, -RAISE);
  torso(ctx);
  head(ctx);
  arm(ctx, fire);
};

export const shootGuard: EnvAsset = {
  id: "shootGuard",
  box: [-29, -74, 72, 74],
  anim: true,
  draw(ctx, state, t) {
    if (state !== SHOOT_GUARD_EXPLODE) return body(ctx, state === SHOOT_GUARD_FIRING ? fireFrame(t % FIRE_LOOP) : -1);
    const age = t % BLAST.loop;
    if (age < BLAST.hideBody) {
      ctx.save();
      body(ctx, -1);
      ctx.restore();
    }
    inBlastUnits(ctx, 0, 0, BLAST_PX, () => drawBlast(ctx, age));
  },
};
