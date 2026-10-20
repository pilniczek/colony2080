import { BLAST, BLAST_PX, drawBlast, inBlastUnits } from "./blast";
import { fireFrame, flash } from "./flyer";
import { P, type EnvAsset } from "./paint";

type Pt = [number, number];

const { poly, box, flat, disc, line, glow } = P;

const ORIGIN: Pt = [24, 68];
const MUZZLE: Pt = [60, 33];
const FIRE_LOOP = 1.2;

export const SHOOT_GUARD_MUZZLE: Pt = [MUZZLE[0] - ORIGIN[0], MUZZLE[1] - ORIGIN[1]];
export const SHOOT_GUARD_FIRING = 1;
export const SHOOT_GUARD_EXPLODE = 2;

const legs = (ctx: CanvasRenderingContext2D): void => {
  poly(ctx, [[22, 50], [27, 53], [13, 66], [6, 66]], "guardMetal", 1, { dir: [1, 0] });
  poly(ctx, [[2, 64], [16, 63], [18, 68], [1, 68]], "guardMetal", 1);
  poly(ctx, [[25, 52], [33, 52], [32, 63], [26, 63]], "guardMetal", 2, { dir: [1, 0] });
  disc(ctx, 29, 53, 4.2, "gm1", "gmLine");
  poly(ctx, [[21, 62], [37, 62], [44, 66], [44, 68], [20, 68]], "guardMetal", 1);
  poly(ctx, [[30, 62], [37, 62], [42, 65], [30, 65]], "guardChrome", 2);
};

const hips = (ctx: CanvasRenderingContext2D): void => {
  poly(ctx, [[15, 42], [33, 42], [35, 50], [30, 56], [18, 56], [14, 50]], "guardMetal", 2, { dir: [1, 0] });
  poly(ctx, [[16, 43], [32, 43], [33, 46], [15, 46]], "guardChrome", 1);
  if (!P.simple()) {
    line(ctx, [[15, 49], [34, 49]], "gm0", 0.6, "butt");
    line(ctx, [[18, 53], [31, 53]], "trim", 0.6, "butt");
  }
};

const torso = (ctx: CanvasRenderingContext2D): void => {
  poly(ctx, [[10, 22], [18, 18], [20, 32], [14, 34]], "guardMetal", 0);
  poly(ctx, [[15, 24], [24, 22], [31, 25], [33, 33], [31, 41], [16, 43], [12, 34]], "guardMetal", 2, { dir: [1, 0] });
  poly(ctx, [[22, 24], [29, 25], [32, 32], [30, 39], [23, 40]], "guardChrome", 1, { dir: [1, 0] });
  line(ctx, [[15, 25], [30, 25]], "trim", 0.8, "butt");
  if (!P.simple()) for (const y of [30, 35]) line(ctx, [[13, y], [32, y]], "gm0", 0.5, "butt");
};

const head = (ctx: CanvasRenderingContext2D): void => {
  line(ctx, [[16, 19], [12, 13]], "gm2", 1, "butt");
  poly(ctx, [[20, 24], [26, 24], [26, 20], [20, 20]], "guardMetal", 0);
  poly(ctx, [[18, 18], [22, 15.5], [38, 15.5], [46, 17], [46, 19], [38, 20], [26, 21], [19, 21]], "guardMetal", 2);
  poly(ctx, [[26, 21], [38, 20], [46, 19], [45, 22.5], [36, 22.5], [28, 23]], "guardChrome", 1);
  flat(ctx, 39, 17.2, 2.4, 1.4, "eye");
  if (!P.simple()) {
    glow(ctx, 40.2, 17.9, 3, "eyeGlow", 0.4);
    line(ctx, [[23, 16.5], [37, 16.5]], "gc3", 0.4);
  }
};

const arm = (ctx: CanvasRenderingContext2D, fire: number): void => {
  disc(ctx, 26, 31, 3.6, "gm2", "gmLine");
  box(ctx, 26, 31, 13, 5, "guardChrome", 1);
  box(ctx, 38, 31.5, 4, 4.5, "guardMetal", 1);
  box(ctx, 41, 31.4, 19, 3, "trooperGun", 2);
  box(ctx, 47, 30, 6, 1.4, "trooperGun", 1);
  box(ctx, 42, 34.4, 2.2, 3.6, "trooperGun", 1, { vertical: true });
  if (!P.simple()) for (const x of [50, 54]) flat(ctx, x, 31.4, 0.6, 3, "tg0");
  if (fire >= 0) flash(ctx, MUZZLE[0], MUZZLE[1], 1, fire, 3.8);
};

const body = (ctx: CanvasRenderingContext2D, fire: number): void => {
  ctx.translate(-ORIGIN[0], -ORIGIN[1]);
  legs(ctx);
  hips(ctx);
  torso(ctx);
  head(ctx);
  arm(ctx, fire);
};

export const shootGuard: EnvAsset = {
  id: "shootGuard",
  box: [-24, -54, 66, 54],
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
