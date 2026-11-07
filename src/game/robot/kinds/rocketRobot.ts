import type { HookDraw, Palette } from "../../../engine/rig/draw";
import { apply, multiply, type Mat2D } from "../../../engine/math/mat2d";
import { locate, solve, type Pose } from "../../../engine/rig/pose";
import type { Pt } from "../../../engine/rig/tree";
import { P } from "../../env/paint";
import { createRigs, type HeroLook } from "../../hero/look";
import { KIND_TUNING } from "../../level/enemy";
import { holdPoses } from "../gun";
import { addHooks, backToBody, paintHook, rigKeys, stanceShot, type EnemyKind, type KindWeapon } from "../kinds";

const { box, poly, flat, disc, shape } = P;

const OWN: Palette = {
  rrA0: "#163049", rrA1: "#2c5c82", rrA2: "#5890b8", rrA3: "#a6d4ec", rrLine: "#060f18",
  rrM0: "#10181f", rrM1: "#1f2b36", rrM2: "#364654", rrM3: "#627688",
  rrC0: "#465560", rrC1: "#8698a4", rrC2: "#b8c8d0", rrC3: "#eef6fa",
  rrVisor: "#ffb020",
  o0: "#1c2614", o1: "#33452a", o2: "#52683e", o3: "#869c60", kLine: "#060f18",
  rrWarn: "#e8b020", rrWarhead: "#c4301c",
};

const DROP = 48;
const { kneelMs, fireMs, reloadMs, emptyMs } = KIND_TUNING.rocketRobot!.rocket!;
const SHOT = { settle: kneelMs / 1000, fire: fireMs / 1000, reload: reloadMs / 1000, empty: emptyMs / 1000 };
const LAUNCH: Pt = [566, 62];
const LYING = { x: 337, y: 136 };
const KNEEL = { body: 0, hipNear: -76, kneeNear: 84, ankleNear: 0, hipFar: 12, kneeFar: 78, ankleFar: 0 };
const GRIP = { near: [394, 112] as Pt, far: [478, 106] as Pt };
const REACH: [[number, number], [number, number]] = [[-170, 40], [-160, 30]];

const launcher = (ctx: CanvasRenderingContext2D, loaded: boolean): void => {
  poly(ctx, [[108, 22], [152, 32], [152, 92], [108, 102]], "olive", 1);
  box(ctx, 150, 32, 362, 60, "olive", 2);
  box(ctx, 230, 27, 30, 70, "steel", 1);
  box(ctx, 412, 27, 16, 70, "steel", 1);
  flat(ctx, 444, 33, 14, 58, "rrWarn");
  box(ctx, 500, 24, 34, 76, "steel", 2);
  box(ctx, 372, 2, 60, 24, "steel", 2);
  flat(ctx, 426, 7, 8, 14, "rrVisor");
  box(ctx, 384, 90, 24, 46, "steel", 1);
  box(ctx, 470, 90, 18, 34, "steel", 1);
  if (loaded) shape(ctx, [[532, 40], [554, 48], [566, 62], [554, 76], [532, 84]], "rrWarhead", "rrLine");
};

const rack = (ctx: CanvasRenderingContext2D): void => {
  box(ctx, 150, 128, 84, 180, "steel", 1);
  for (const x of [156, 180, 204]) {
    box(ctx, x, 112, 22, 30, "olive", 2);
    shape(ctx, [[x, 112], [x + 11, 92], [x + 22, 112]], "rrWarhead", "rrLine");
  }
  box(ctx, 146, 200, 92, 16, "steel", 0);
};

const helmet = (ctx: CanvasRenderingContext2D): void => {
  poly(ctx, [[270, 44], [276, 16], [300, 2], [356, 0], [384, 10], [398, 32], [398, 48], [270, 54]], "armor", 2);
  poly(ctx, [[350, 46], [402, 46], [402, 72], [350, 70]], "steel", 1);
  flat(ctx, 362, 53, 40, 9, "rrVisor");
  disc(ctx, 316, 70, 18, "m2", "rrLine");
  disc(ctx, 316, 70, 8, "a3");
  poly(ctx, [[296, 96], [390, 90], [398, 108], [300, 114]], "armor", 1);
};

const pauldron = (ctx: CanvasRenderingContext2D): void => {
  poly(ctx, [[232, 132], [244, 98], [296, 80], [350, 86], [380, 112], [388, 150], [370, 156], [356, 128], [300, 116], [254, 126], [246, 162], [230, 160]], "armor", 3);
  poly(ctx, [[300, 92], [348, 96], [342, 108], [300, 104]], "rrWarn", 2, { line: false });
};

const inverse = (m: Mat2D): Mat2D => {
  const det = m.a * m.d - m.b * m.c;
  return { a: m.d / det, b: -m.b / det, c: -m.c / det, d: m.a / det, e: (m.c * m.f - m.d * m.e) / det, f: (m.b * m.e - m.a * m.f) / det };
};

const hookAt = (root: Parameters<typeof locate>[0], hook: string, pose: Pose): Mat2D => {
  const m = locate(root, hook, pose);
  if (!m) throw new Error(`rocket robot rig has no ${hook} hook`);
  return m;
};

export const rocketRobot = (): EnemyKind => {
  const rigs = createRigs(true, true);
  addHooks(rigs.side, { head: ["helmet"], arm: ["pauldron"] });
  const held = backToBody(DROP);
  const gear = (pose: Pose): Mat2D => multiply(hookAt(rigs.side, "back", pose), held);
  const near = solve(rigs.side, "hand", {}, ["arm", "fore"], REACH, apply(gear({}), GRIP.near));
  const carry = { arm: near.arm as number, fore: near.fore as number };
  const inHand = multiply(inverse(hookAt(rigs.side, "hand", carry)), gear(carry));
  const hold = holdPoses(rigs.side, rigs.front, carry, apply(inHand, GRIP.far));
  const palette: Palette = { ...rigKeys(OWN, "rr"), ...OWN };
  const back = backToBody();
  const hooks = (look: HeroLook, lineW: number, fire: number | null): Record<string, HookDraw> => ({
    helmet: paintHook(lineW, helmet),
    pauldron: paintHook(lineW, pauldron),
    back: paintHook(
      lineW,
      (ctx) => {
        rack(ctx);
        if (look.gun !== "hand" && look.gun !== "slung") return;
        ctx.translate(0, DROP);
        launcher(ctx, fire === null || fire < SHOT.fire || (fire - SHOT.fire) % SHOT.reload > SHOT.empty);
      },
      back,
    ),
  });
  const weapon: KindWeapon = {
    draw: (ctx, { palette: pal = palette, lineW = 1 } = {}) => paintHook(lineW, (c) => {
      c.translate(-LYING.x, -LYING.y);
      launcher(c, true);
    })(ctx, pal),
    slung: () => {},
  };
  return { palette, rigs, hold, hooks, weapon, launch: apply(inHand, LAUNCH), clips: stanceShot(KNEEL, SHOT.settle) };
};
