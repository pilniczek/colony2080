import { createWeaponModel, type WeaponPart } from "../robot/weaponModel";
import { ROBOT } from "../robot/xbot";
import robotJson from "@config/robots/xbot.json";
import { P, TILE, type EnvAsset } from "./paint";

type Pt = [number, number];

const { poly, flat, line, shape, glow } = P;

const FIRE_TICKS = 9;
const TICK_HZ = 32;
const FIRE_LOOP = 1.2;
const HULL_CENTER: Pt = [24.5, 10.5];
const GUN_PX = (1.9 * TILE) / (ROBOT.FOOT_Y - robotJson.levels.head);
const GUN_BARREL_X = 70;
const MOUNT_BARREL = 150;
const MOUNT: Pt = [16.5, 14.6];
const MOUNT_MUZZLE = (GUN_BARREL_X + MOUNT_BARREL + 2) * GUN_PX;
const MUZZLE_UP = 40 * GUN_PX;

export const FLYER_HULL = { w: 49, h: 18 };
export const FLYER_MUZZLE: Pt = [MOUNT[0] + MOUNT_MUZZLE - HULL_CENTER[0], MOUNT[1] - MUZZLE_UP - HULL_CENTER[1]];

const fireFrame = (t: number): number => {
  const k = Math.floor(t * TICK_HZ);
  return k < FIRE_TICKS ? k : -1;
};

const ellipse = (ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, fill: string, outline?: string): void => {
  ctx.fillStyle = P.pal()[fill] || fill;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  if (outline) P.stroke(ctx, outline);
};

const flash = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, k: number, size: number): void => {
  const heat = k === 0 ? 1 : Math.max(0, 1 - k / 5);
  if (heat <= 0) return;
  const len = size * (1.2 + heat);
  if (!P.simple()) glow(ctx, x + dir * len * 0.4, y, size * 2.2 * heat, "fire1", 0.6 * heat);
  shape(ctx, [[x, y - size * 0.7], [x + dir * len, y], [x, y + size * 0.7]], "fire0");
  shape(ctx, [[x, y - size * 0.45], [x + dir * len * 0.7, y], [x, y + size * 0.45]], "fire1");
  ellipse(ctx, x + dir * size * 0.35, y, size * 0.45 * heat + 0.3, size * 0.3 * heat + 0.3, heat > 0.5 ? "fire3" : "fire2");
};

const mountParts = (length: number): WeaponPart[] => [
  { name: "pylon", x: -10, y: -92, w: 40, h: 30, mat: "m", tone: 0 },
  { name: "receiver", x: -40, y: -70, w: 110, h: 60, mat: "m", tone: 2 },
  { name: "stripe", x: -10, y: -70, w: 14, h: 60, mat: "a", tone: 1 },
  { name: "feed", x: -30, y: -12, w: 60, h: 30, mat: "m", tone: 0 },
  { name: "barrelBack", x: GUN_BARREL_X, y: -62, w: length - 6, h: 44, mat: "m", tone: 0 },
  { name: "barrelTop", x: GUN_BARREL_X, y: -62, w: length, h: 12, mat: "c", tone: 1 },
  { name: "barrelMid", x: GUN_BARREL_X, y: -46, w: length, h: 12, mat: "c", tone: 2 },
  { name: "barrelLow", x: GUN_BARREL_X, y: -30, w: length, h: 12, mat: "c", tone: 1 },
  { name: "ringRear", x: GUN_BARREL_X + 14, y: -70, w: 16, h: 60, mat: "m", tone: 0 },
  { name: "ringFront", x: GUN_BARREL_X + length - 30, y: -68, w: 14, h: 56, mat: "m", tone: 0 },
];

const mountedGun = createWeaponModel({
  buildParts: mountParts,
  mat: { m: ["fh0", "fh1", "fh2", "fh3", "fhLine"], c: ["c0", "c1", "c2", "c3", "fhLine"], a: ["fs0", "fs1", "fs2", "fs3", "fhLine"] },
});

const sideGun = (ctx: CanvasRenderingContext2D, [x, y]: Pt, barrel: number): void => {
  const t = ctx.getTransform();
  const lineW = P.lw(ctx) * Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(GUN_PX, GUN_PX);
  mountedGun.draw(ctx, { palette: P.pal(), lineW, simple: P.simple(), barrel });
  ctx.restore();
};

export const flyerHull = (ctx: CanvasRenderingContext2D, { hot = false, hump = true, patch = true } = {}): void => {
  poly(ctx, [[4, 14.2], [38, 14.2], [46.5, 13], [38, 15.8], [26, 17.2], [12, 17.4], [4, 16.6], [3.2, 15]], "flyerHull", 0);
  poly(ctx, [[4, 11], [26, 11], [47.5, 11.2], [49, 11.8], [46.5, 13], [38, 14.2], [4, 14.2]], "flyerHull", 2);
  poly(ctx, [[4, 8], [19, 8.2], [26, 8.4], [26, 11], [4, 11]], "flyerHull", 2);
  poly(ctx, [[26, 8.4], [38, 9.2], [47.5, 11.2], [26, 11]], "flyerStripe", 1, { dir: [1, 0] });
  poly(ctx, [[19, 3.6], [26, 3.4], [34, 4.6], [40, 6.4], [44, 8.4], [47.5, 11.2], [38, 9.2], [26, 8.4], [19, 8.2]], "flyerShell", 1);
  poly(ctx, [[3.5, 5.2], [10.5, 4.8], [10.5, 8], [4, 8]], "flyerHull", 0);
  if (hump) {
    poly(ctx, [[10.5, 4.8], [11, 2.2], [18.5, 2.2], [19.2, 4], [19, 8.2], [10.5, 8]], "flyerHump", 2);
    flat(ctx, 12.5, 5.2, 2.6, 1.8, "fWindow", "fhLine");
  } else {
    poly(ctx, [[3.5, 5.2], [10.5, 4.4], [19.4, 3.5], [19, 8.2], [4, 8]], "flyerHull", 1);
  }
  if (!P.simple()) {
    for (const x of [10.5, 19, 26]) line(ctx, [[x, 11.2], [x, 14]], "fh0", 0.4, "butt");
    line(ctx, [[5, 9.5], [9, 9.5]], "fh3", 0.4, "butt");
    if (patch) flat(ctx, 26.5, 12, 2.5, 1.6, "fPatch");
    line(ctx, [[20, 3.8], [33, 5]], "fc3", 0.4);
  }
  for (const x of [9, 11.5, 14, 16.5, 19, 21.5, 24]) flat(ctx, x, 11.1, 1.2, 1, x === 24 && hot ? "fLightHot" : "fLight");
};

const engine = (ctx: CanvasRenderingContext2D, t: number): void => {
  const flicker = 0.8 + 0.2 * Math.sin(t * 31) * Math.sin(t * 13);
  ellipse(ctx, 2.6, 10.5, 1.9, 7, "e0", "fhLine");
  ellipse(ctx, 2.9, 10.5, 1.3, 5.6, "e1");
  ctx.save();
  ctx.globalAlpha = flicker;
  ellipse(ctx, 3.2, 10.5, 0.9, 4.6, "e2");
  ellipse(ctx, 3.4, 10.5, 0.5, 3.2, "e3");
  ctx.restore();
  if (!P.simple()) glow(ctx, 1.5, 10.5, 7 * flicker, "eGlow", 0.35);
};

export const flyer: EnvAsset = {
  id: "flyer",
  box: [-32, -10, 60, 20],
  anim: true,
  draw(ctx, state, t) {
    const fire = state === 1 ? fireFrame(t % FIRE_LOOP) : -1;
    ctx.translate(-HULL_CENTER[0], -HULL_CENTER[1] + Math.sin(t * 2.4) * 0.6);
    ellipse(ctx, 8.5, 17, 3.2, 2, "fBelly", "fhLine");
    if (!P.simple()) ellipse(ctx, 8.5, 17, 1.6, 0.9, "fh0");
    flyerHull(ctx, { hot: fire >= 0 });
    sideGun(ctx, MOUNT, MOUNT_BARREL);
    if (fire >= 0) flash(ctx, MOUNT[0] + MOUNT_MUZZLE, MOUNT[1] - MUZZLE_UP, 1, fire, 3.4);
    engine(ctx, t);
  },
};
