import { apply } from "../../engine/math/mat2d";
import { drawRig, shade, type HookDraw, type Palette } from "../../engine/rig/draw";
import { locate, solve, type Pose, type Tint } from "../../engine/rig/pose";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { createWeaponModel, toHook, type WeaponPart } from "../robot/weaponModel";
import { buildSide, ROBOT } from "../robot/xbot";
import { P, type EnvAsset } from "./paint";
import { shadow, smoke, spark } from "./vesnice";

const { box, poly, glow } = P;

const GUARD_PAL: Palette = {
  a0: "#3a3418", a1: "#5c5428", a2: "#7e7440", a3: "#b0a468", aLine: "#141008",
  m0: "#1c2018", m1: "#30362a", m2: "#4a5040", m3: "#6e7460", mLine: "#0a0c08",
  c0: "#5a5c50", c1: "#8a8c7c", c2: "#b4b4a2", c3: "#e0e0cc",
  badge: "#7e7440", trefoil: "#141008", visor: "#e0281e", screen: "#3fa34a", hole: "#120e08",
};
const GUARD_H = 60;
const GUARD_WIDE = 1.18;
const GUARD_POSE = { hipNear: -14, kneeNear: 18, ankleNear: -4, hipFar: 12, kneeFar: 6, ankleFar: -16, body: 3 };
const RIFLE_SUPPORT: Pt = [40, -14];
const RIFLE_MUZZLE: Pt = [262, -44];
const WRECK_TINT: Tint = { brightness: 0.55, saturate: 0.5 };

const rifleParts = (): WeaponPart[] => [
  { name: "stock", x: -96, y: -60, w: 70, h: 30, mat: "m", tone: 1 },
  { name: "grip", x: -14, y: -24, w: 22, h: 50, mat: "m", tone: 0 },
  { name: "receiver", x: -40, y: -66, w: 130, h: 40, mat: "m", tone: 2 },
  { name: "mag", x: 30, y: -30, w: 26, h: 54, mat: "m", tone: 0 },
  { name: "scope", x: -10, y: -88, w: 70, h: 18, mat: "c", tone: 1 },
  { name: "barrel", x: 90, y: -56, w: 160, h: 18, mat: "c", tone: 1 },
  { name: "guard", x: 90, y: -62, w: 70, h: 30, mat: "m", tone: 1 },
  { name: "brake", x: 240, y: -60, w: 22, h: 26, mat: "m", tone: 0 },
];

const rifle = createWeaponModel({
  buildParts: rifleParts,
  mat: {
    m: ["m0", "m1", "m2", "m3", "mLine"],
    c: ["c0", "c1", "c2", "c3", "mLine"],
    a: ["a0", "a1", "a2", "a3", "aLine"],
  },
});

interface GuardRig {
  root: GroupNode;
  pose: Pose;
}

const rigs = new Map<boolean, GuardRig>();

const guardRig = (lod: boolean): GuardRig => {
  const known = rigs.get(lod);
  if (known) return known;
  const root = buildSide({ enemy: true, lod, farLimbs: true });
  const carry = { ...GUARD_POSE, arm: -8, fore: -76 };
  const hand = locate(root, "hand", carry);
  if (!hand) throw new Error("guard rig has no hand hook");
  const far = solve(root, "handFar", carry, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], apply(hand, toHook(RIFLE_SUPPORT)));
  const rig = { root, pose: { ...carry, ...far } };
  rigs.set(lod, rig);
  return rig;
};

const muzzleFlash = (ctx: CanvasRenderingContext2D, x: number, y: number, k: number): void => {
  if (!P.simple()) glow(ctx, x + 20, y, 70 * k + 20, "a2", 0.7);
  poly(ctx, [[x, y - 14], [x + 50 * k + 20, y - 26], [x + 30, y - 6], [x + 80 * k + 30, y], [x + 30, y + 6], [x + 50 * k + 20, y + 26], [x, y + 14]], "a1", 2, { line: false });
  poly(ctx, [[x, y - 8], [x + 40 * k + 14, y], [x, y + 8]], "y3", 2, { line: false });
};

const backpack: HookDraw = (ctx) => {
  ctx.save();
  ctx.transform(0, 1, -1, 0, 0, 0);
  box(ctx, -40, -10, 150, 80, "olive", 1);
  box(ctx, -30, 60, 130, 24, "olive", 0);
  ctx.restore();
};

const guardFigure = (ctx: CanvasRenderingContext2D, fire: number, tint?: Tint): void => {
  const lod = P.simple();
  const { root, pose } = guardRig(lod);
  const k = GUARD_H / (ROBOT.FOOT_Y - 2);
  const palette = tint ? shade(GUARD_PAL, tint) : GUARD_PAL;
  ctx.save();
  ctx.scale(k * GUARD_WIDE, k);
  ctx.translate(-ROBOT.SIDE_AX, -ROBOT.FOOT_Y);
  const t = ctx.getTransform();
  const lineW = P.lw(ctx) * Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
  const hand: HookDraw = (c) => {
    c.save();
    c.transform(0, 1, -1, 0, 0, 0);
    rifle.draw(c, { palette, lineW, simple: lod });
    if (fire >= 0) {
      c.translate(RIFLE_MUZZLE[0], RIFLE_MUZZLE[1]);
      c.scale(1.6, 1.6);
      muzzleFlash(c, 0, 0, fire);
    }
    c.restore();
  };
  drawRig(ctx, root, { palette, pose, hooks: { hand, back: backpack }, lineW, simple: lod });
  ctx.restore();
};

export const bridgeGuard: EnvAsset = {
  id: "bridgeGuard",
  box: [-30, -64, 60, 0],
  anim: true,
  draw(ctx, state, t) {
    shadow(ctx, 0, 34, 0.45);
    if (state === 2) {
      ctx.save();
      ctx.translate(30, -9);
      ctx.rotate(-Math.PI / 2);
      guardFigure(ctx, -1, WRECK_TINT);
      ctx.restore();
      if (!P.simple()) {
        smoke(ctx, -4, -10, t, 3, 24);
        spark(ctx, 6, -6, t, 4);
      }
      return;
    }
    const ph = (t * 4) % 1;
    guardFigure(ctx, state === 1 && ph < 0.4 ? 1 - ph / 0.4 : -1);
  },
};
