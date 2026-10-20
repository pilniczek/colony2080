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

const { poly, box, flat, disc, line, glow, beam, curve } = P;

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
const LEGS: Record<"front" | "rear", [Pt, Pt, Pt]> = {
  front: [[42.5, 30], [36, 39], [39.5, 49.5]],
  rear: [[45, 30], [52, 40], [59.5, 49.5]],
};
const SPINE: Pt[] = [[19, 46], [12, 49], [6, 54], [2, 60], [-1, 65]];
const BACK_TUBES: [number, number, number][] = [[18, 24, 5.5], [15, 28, 6], [13, 33, 5]];

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
  const spine = SPINE.map(([x, y], i): Pt => [x, y - RAISE * (1 - i / 4)]);
  spine.slice(1).forEach((b, i) => beam(ctx, spine[i]!, b, 5.2 - i * 1.1, "guardMetal"));
  poly(ctx, [[0, 63], [-4, 68], [-1, 64.5]], "guardMetal", 2);
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

const leg = (ctx: CanvasRenderingContext2D, [hip, knee, ankle]: [Pt, Pt, Pt]): void => {
  beam(ctx, hip, knee, 4.2, "guardMetal");
  sideLegArmor(ctx, knee, ankle);
  line(ctx, [along(hip, knee, 0.2), along(hip, knee, 0.75)], "trim", 0.8, "butt");
  line(ctx, [along(knee, ankle, 0.3), along(knee, ankle, 0.85)], "trim", 0.7, "butt");
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
  poly(ctx, [[18, 42], [31, 42], [33, 47], [28, 51], [20, 51], [17, 47]], "guardChrome", 1, { dir: [1, 0] });
  if (!P.simple()) line(ctx, [[19, 46], [32, 46]], "trim", 0.6, "butt");
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

const head = (ctx: CanvasRenderingContext2D): void => {
  poly(ctx, [[30, 27], [29, 22], [34, 21], [35, 26]], "guardMetal", 0);
  fillPath(
    ctx,
    (c) => {
      c.moveTo(36, 18);
      c.quadraticCurveTo(28, 20, 20, 18);
      c.quadraticCurveTo(10, 14.5, 4, 10);
      c.quadraticCurveTo(14, 9.5, 24, 11);
      c.quadraticCurveTo(36, 12.5, 40.5, 15.5);
      c.lineTo(38, 18);
    },
    grad(ctx, 0, 9, 0, 20, [[0, "fc3"], [0.35, "fc2"], [0.75, "fc1"], [1, "fc0"]]),
    "gmLine",
  );
  if (!P.simple()) curve(ctx, [[8, 10.6], [20, 11.2], [34, 13.4]], "gc1", 0.7);
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
      c.moveTo(33, 21.6);
      c.lineTo(36, 22.6);
      c.lineTo(42.5, 23);
      c.quadraticCurveTo(46.4, 23.2, 46.6, 25);
      c.quadraticCurveTo(46.6, 27.4, 44, 28.2);
      c.lineTo(36.5, 28.4);
      c.quadraticCurveTo(32.6, 27.4, 33, 21.6);
    },
    grad(ctx, 0, 22.6, 0, 28.4, [[0, "gc2"], [0.3, "gc1"], [0.7, "gm3"], [1, "gm1"]]),
  );
  line(ctx, [[38, 23.2], [45.6, 23.6]], "gmLine", 0.6, "butt");
  if (!P.simple()) {
    glow(ctx, 41, 18.3, 3.6, "visorGlow", 0.45);
    disc(ctx, 35.4, 24, 1.1, "gm1", "gmLine");
    line(ctx, [[37, 26.6], [44.4, 26.4]], "gm2", 0.5, "butt");
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
  curve(ctx, [[23.4, 30.4], [28.2, 32.6], [33.2, 30.2]], "trim", 0.9);
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
  box: [-29, -72, 72, 72],
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
