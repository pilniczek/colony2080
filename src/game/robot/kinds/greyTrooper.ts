import type { HookDraw, Palette } from "../../../engine/rig/draw";
import type { Pt } from "../../../engine/rig/tree";
import { P } from "../../env/paint";
import { createRigs, type HeroLook } from "../../hero/look";
import { KIND_TUNING } from "../../level/enemy";
import { CARRY, holdPoses } from "../gun";
import { addHooks, backToBody, paintHook, rigKeys, type EnemyKind } from "../kinds";
import { createWeaponModel, toHook, type WeaponPart } from "../weaponModel";

const { box, poly, flat, disc, shape, glow } = P;

const OWN: Palette = {
  gtA0: "#2a2e32", gtA1: "#4c5258", gtA2: "#7a8288", gtA3: "#c2c8cc", gtLine: "#0b0d0e",
  gtM0: "#191b17", gtM1: "#2b2f29", gtM2: "#43483f", gtM3: "#6a7062",
  gtC0: "#585c5e", gtC1: "#989c9e", gtC2: "#c6cacc", gtC3: "#f2f4f4",
  gtVisor: "#ff3a20",
  tg0: "#1c1e20", tg1: "#323639", tg2: "#4e5256", tg3: "#7a7e82", gmLine: "#0b0d0e",
  gtMark: "#e0701e", gtMarkDark: "#b04010", gtMarkLight: "#f8d070", gtBrass: "#d8a840",
  vFire0: "#b04010", vFire1: "#e88a28", vFire2: "#f8d070", vFire3: "#ffffff",
};

const { shots, ms } = KIND_TUNING.greyTrooper!.burst!;
const BURST = { shots, gap: ms / (shots - 1) / 1000, frames: 3, flash: 40, casingLife: 0.35 };
const IN_HAND = { a: 0, b: 1, c: -1, d: 0, e: 0, f: 0 };
const MUZZLE: Pt = [328, -52];
const SUPPORT: Pt = [150, -24];

const rifleParts = (): WeaponPart[] => [
  { name: "stockPad", x: -124, y: -72, w: 14, h: 46, mat: "m", tone: 0 },
  { name: "stock", x: -112, y: -66, w: 78, h: 34, mat: "m", tone: 1 },
  { name: "grip", x: -14, y: -30, w: 26, h: 56, mat: "m", tone: 0 },
  { name: "receiver", x: -44, y: -80, w: 156, h: 52, mat: "m", tone: 2 },
  { name: "mark", x: 60, y: -80, w: 14, h: 52, mat: "a", tone: 1 },
  { name: "mag", x: 26, y: -32, w: 52, h: 58, mat: "m", tone: 1 },
  { name: "rail", x: -4, y: -98, w: 70, h: 18, mat: "c", tone: 1 },
  { name: "shroud", x: 112, y: -76, w: 124, h: 44, mat: "m", tone: 1 },
  { name: "vent1", x: 132, y: -68, w: 12, h: 28, mat: "c", tone: 0 },
  { name: "vent2", x: 160, y: -68, w: 12, h: 28, mat: "c", tone: 0 },
  { name: "vent3", x: 188, y: -68, w: 12, h: 28, mat: "c", tone: 0 },
  { name: "barrel", x: 236, y: -62, w: 70, h: 18, mat: "c", tone: 1 },
  { name: "brake", x: 300, y: -70, w: 28, h: 34, mat: "m", tone: 0 },
];

const rifle = createWeaponModel({
  buildParts: rifleParts,
  mat: {
    m: ["tg0", "tg1", "tg2", "tg3", "gmLine"],
    c: ["c0", "c1", "c2", "c3", "mLine"],
    a: ["gtMarkDark", "gtMark", "gtMark", "gtMarkLight", "gmLine"],
  },
});

const helmet = (ctx: CanvasRenderingContext2D): void => {
  poly(ctx, [[262, 108], [256, 44], [270, 12], [312, -6], [362, -4], [396, 14], [412, 44], [412, 82], [262, 96]], "armor", 2, { dir: [1, 0] });
  poly(ctx, [[300, -2], [362, 0], [398, 18], [404, 32], [300, 26]], "armor", 3, { line: false });
  box(ctx, 360, 48, 54, 18, "steel", 0);
  flat(ctx, 370, 53, 44, 7, "gtVisor");
  box(ctx, 372, 76, 42, 38, "steel", 1);
  disc(ctx, 306, 62, 16, "a1", "gtLine");
  flat(ctx, 300, 56, 12, 12, "gtMark");
};

const pauldron = (ctx: CanvasRenderingContext2D): void => {
  poly(ctx, [[222, 196], [220, 130], [244, 100], [298, 86], [352, 92], [386, 120], [394, 176], [376, 184], [300, 174], [244, 190]], "armor", 2);
  poly(ctx, [[236, 112], [298, 98], [350, 104], [378, 126], [300, 120], [240, 132]], "armor", 3, { line: false });
  shape(ctx, [[222, 196], [244, 190], [300, 174], [376, 184], [376, 194], [300, 186], [244, 202], [224, 206]], "gtMark", "gtLine");
};

const ammoPack = (ctx: CanvasRenderingContext2D): void => {
  box(ctx, 150, 120, 80, 150, "trooperGun", 1);
  box(ctx, 138, 150, 24, 96, "trooperGun", 2, { vertical: true });
  flat(ctx, 160, 132, 60, 10, "gtMark");
  disc(ctx, 190, 284, 28, "tg2", "gtLine");
  disc(ctx, 190, 284, 10, "tg0");
};

const flash = (ctx: CanvasRenderingContext2D, [x, y]: Pt, k: number, size: number): void => {
  const heat = k === 0 ? 1 : Math.max(0, 1 - k / 5);
  const len = size * (1.4 + heat * 1.2);
  if (!P.simple()) glow(ctx, x + len * 0.4, y, size * 2.4 * heat, "vFire1", 0.6 * heat);
  shape(ctx, [[x, y - size * 0.8], [x + len * 0.55, y - size * 0.9], [x + len, y], [x + len * 0.55, y + size * 0.9], [x, y + size * 0.8]], "vFire0");
  shape(ctx, [[x, y - size * 0.5], [x + len * 0.75, y], [x, y + size * 0.5]], "vFire1");
  shape(ctx, [[x, y - size * 0.3], [x + len * 0.45, y], [x, y + size * 0.3]], heat > 0.5 ? "vFire3" : "vFire2");
};

const casings = (ctx: CanvasRenderingContext2D, fire: number): void => {
  for (let k = 0; k < BURST.shots; k++) {
    const a = fire - k * BURST.gap;
    if (a < 0 || a > BURST.casingLife) continue;
    ctx.save();
    ctx.translate(40 - a * 500, -100 - a * 700 + a * a * 4200);
    ctx.rotate(a * 30);
    flat(ctx, -8, -4, 16, 8, "gtBrass");
    ctx.restore();
  }
};

const burst = (ctx: CanvasRenderingContext2D, fire: number | null): void => {
  if (fire === null || fire < 0) return;
  casings(ctx, fire);
  const shot = Math.floor(fire / BURST.gap);
  if (shot >= BURST.shots) return;
  flash(ctx, MUZZLE, Math.floor(((fire - shot * BURST.gap) / BURST.gap) * BURST.frames), BURST.flash);
};

export const greyTrooper = (): EnemyKind => {
  const rigs = createRigs(true, true);
  addHooks(rigs.side, { head: ["helmet"], arm: ["pauldron"] });
  const hold = holdPoses(rigs.side, rigs.front, CARRY, toHook(SUPPORT));
  const palette: Palette = { ...rigKeys(OWN, "gt"), ...OWN };
  const back = backToBody();
  const hooks = (look: HeroLook, lineW: number, fire: number | null): Record<string, HookDraw> => {
    const out: Record<string, HookDraw> = {
      helmet: paintHook(lineW, helmet),
      pauldron: paintHook(lineW, pauldron),
      back: paintHook(lineW, ammoPack, back),
    };
    if (look.gun === "hand")
      out.hand = paintHook(
        lineW,
        (c) => {
          rifle.draw(c, { palette: P.pal(), lineW, simple: true });
          burst(c, fire);
        },
        IN_HAND,
      );
    return out;
  };
  return { palette, rigs, hold, hooks };
};
