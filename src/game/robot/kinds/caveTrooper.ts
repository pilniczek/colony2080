import type { HookDraw, Palette } from "../../../engine/rig/draw";
import type { Pt } from "../../../engine/rig/tree";
import { P } from "../../env/paint";
import { ellipse } from "../../env/vesnice";
import { createRigs } from "../../hero/look";
import { KIND_TUNING } from "../../level/enemy";
import { holdPoses } from "../gun";
import { addHooks, paintHook, type EnemyKind } from "../kinds";
import { createWeaponModel, toHook, type WeaponPart } from "../weaponModel";
import { ROBOT } from "../xbot";

const { poly, box, flat, line, curve, disc, shape } = P;

const PALETTE: Palette = {
  ...ROBOT.palette,
  a0: "#142c4a", a1: "#244c78", a2: "#3a70a6", a3: "#88b8de", aLine: "#050c16",
  m0: "#101418", m1: "#1e252c", m2: "#323c46", m3: "#5c6a76", mLine: "#05070a",
  c0: "#4a5866", c1: "#8494a2", c2: "#b8c6d0", c3: "#eef4f8",
  tb0: "#5a3c10", tb1: "#a07020", tb2: "#d8a438", tb3: "#f8dc8c",
  visor: "#4cf0ff", badge: "#d8a438", trefoil: "#101418", screen: "#5ce8ff", hole: "#101418",
  tCell: "#5ce8ff",
  tp0: "#1c48b8", tp1: "#3c9cff", tp2: "#b0f0ff", tp3: "#ffffff",
};

const READY = { arm: -18, fore: -54 };
const DEATH_ARMS = { arm: -62, fore: -50 };
const DEATH_LEAN = -13;
const DEATH_LEGS = { hipNear: 3 - DEATH_LEAN, kneeNear: 22, ankleNear: -10, hipFar: -33 - DEATH_LEAN, kneeFar: 8, ankleFar: 8 };
const ORIGINAL_PX = 24;
const DEATH = { back: 44 / ORIGINAL_PX, up: 22 / ORIGINAL_PX, seconds: 11 / 32 };
const SUPPORT: Pt = [150, -26];
const MUZZLE: Pt = [322, -46];
const { shots, ms } = KIND_TUNING.caveTrooper!.burst!;
const BURST = { shots, every: ms / (shots - 1) / 1000, tickHz: 32, size: 34 };

const rifleParts = (): WeaponPart[] => [
  { name: "stock", x: -130, y: -74, w: 84, h: 44, mat: "m", tone: 1 },
  { name: "grip", x: -16, y: -34, w: 26, h: 60, mat: "m", tone: 1 },
  { name: "mag", x: 34, y: -34, w: 38, h: 50, mat: "m", tone: 0 },
  { name: "receiver", x: -50, y: -90, w: 184, h: 62, mat: "a", tone: 2 },
  { name: "shroud", x: 128, y: -84, w: 132, h: 34, mat: "m", tone: 1 },
  { name: "railLow", x: 128, y: -48, w: 178, h: 12, mat: "c", tone: 2 },
  { name: "railTop", x: 128, y: -94, w: 152, h: 9, mat: "c", tone: 1 },
  { name: "brake", x: 300, y: -58, w: 22, h: 26, mat: "m", tone: 0 },
  { name: "cellHousing", x: -8, y: -76, w: 70, h: 28, mat: "m", tone: 0 },
  { name: "cell", x: -2, y: -68, w: 58, h: 12, mat: "cell", tone: 2 },
  { name: "band", x: -44, y: -29, w: 172, h: 6, mat: "brass", tone: 2 },
  { name: "optic", x: 6, y: -118, w: 76, h: 26, mat: "m", tone: 2 },
  { name: "lens", x: 76, y: -114, w: 8, h: 18, mat: "lens", tone: 2 },
];

const rifle = createWeaponModel({
  buildParts: rifleParts,
  mat: {
    m: ["m0", "m1", "m2", "m3", "mLine"],
    c: ["c0", "c1", "c2", "c3", "mLine"],
    a: ["a0", "a1", "a2", "a3", "aLine"],
    brass: ["tb0", "tb1", "tb2", "tb3", "aLine"],
    cell: ["tCell", "tCell", "tCell", "tCell", "mLine"],
    lens: ["visor", "visor", "visor", "visor", "mLine"],
  },
});

const helmet = (ctx: CanvasRenderingContext2D): void => {
  poly(ctx, [[274, 70], [276, 30], [288, 12], [320, 6], [364, 8], [390, 24], [396, 48], [396, 54], [352, 54], [344, 70], [300, 78]], "armor", 2);
  poly(ctx, [[288, 12], [320, 6], [364, 8], [358, 18], [302, 22]], "armor", 3, { line: false });
  poly(ctx, [[340, 50], [398, 48], [400, 66], [340, 68]], "steel", 0);
  flat(ctx, 348, 53, 52, 10, "visor");
  line(ctx, [[276, 46], [342, 50]], "tb2", 5, "butt");
  poly(ctx, [[268, 32], [252, 10], [260, 8], [280, 26]], "steel", 1);
};

const pauldron = (ctx: CanvasRenderingContext2D): void => {
  poly(ctx, [[236, 130], [266, 104], [320, 96], [366, 110], [388, 146], [384, 196], [360, 216], [300, 224], [250, 212], [230, 176]], "armor", 2);
  poly(ctx, [[254, 124], [300, 108], [348, 116], [366, 140], [300, 138]], "armor", 3, { line: false });
  curve(ctx, [[234, 182], [260, 210], [300, 220], [360, 212], [384, 192]], "tb2", 8);
  for (const x of [262, 338]) disc(ctx, x, 164, 6, "tb1", "aLine");
};

const vambrace = (ctx: CanvasRenderingContext2D): void => {
  poly(ctx, [[258, 300], [366, 296], [372, 352], [262, 356]], "armor", 2, { dir: [1, 0] });
  line(ctx, [[260, 330], [370, 327]], "tb2", 6, "butt");
};

const powerCell = (ctx: CanvasRenderingContext2D): void => {
  ctx.save();
  ctx.transform(0, 1, -1, 0, 0, 0);
  box(ctx, -70, -20, 170, 44, "steel", 1);
  box(ctx, -56, -32, 142, 12, "chrome", 2);
  flat(ctx, -40, -10, 110, 12, "tCell");
  for (const x of [-60, 90]) line(ctx, [[x, -32], [x, 24]], "tb2", 8, "butt");
  ctx.restore();
};

const plasmaFlash = (ctx: CanvasRenderingContext2D, k: number): void => {
  const heat = Math.max(0, 1 - k / 5);
  if (heat <= 0) return;
  const [x, y] = MUZZLE;
  const size = BURST.size;
  const len = size * (1.5 + heat);
  ctx.save();
  ctx.transform(0, 1, -1, 0, 0, 0);
  shape(ctx, [[x, y - size * 0.75], [x + len * 0.5, y - size * 0.4], [x + len, y], [x + len * 0.5, y + size * 0.4], [x, y + size * 0.75]], "tp0");
  for (const s of [-1, 1]) shape(ctx, [[x + size * 0.2, y], [x + size * 0.9, y + s * size * 1.4 * heat], [x + size * 0.75, y]], "tp1");
  shape(ctx, [[x, y - size * 0.45], [x + len * 0.75, y], [x, y + size * 0.45]], "tp1");
  ellipse(ctx, x + size * 0.4, y, size * 0.55 * heat + 0.2, size * 0.36 * heat + 0.2, heat > 0.5 ? "tp3" : "tp2");
  ctx.restore();
};

const shotAge = (fire: number | null): number | null => {
  if (fire === null || fire < 0) return null;
  const shot = Math.floor(fire / BURST.every);
  return shot < BURST.shots ? fire - shot * BURST.every : null;
};

export const caveTrooper = (): EnemyKind => {
  const rigs = createRigs(true, true);
  addHooks(rigs.side, { head: ["helmet"], arm: ["pauldron"], armFar: ["pauldronFar"], fore: ["vambrace"], foreFar: ["vambraceFar"] });
  const deathHold = holdPoses(rigs.side, rigs.front, DEATH_ARMS, toHook(SUPPORT));
  return {
    palette: PALETTE,
    rigs,
    hold: holdPoses(rigs.side, rigs.front, READY, toHook(SUPPORT)),
    dying: { ...DEATH, pose: { body: DEATH_LEAN, ...DEATH_LEGS, ...deathHold.CARRY, ...deathHold.CARRY_FAR } },
    hooks: (look, lineW, fire) => {
      if (look.view !== "side") return {};
      const hooks: Record<string, HookDraw> = {
        helmet: paintHook(lineW, helmet),
        pauldron: paintHook(lineW, pauldron),
        pauldronFar: paintHook(lineW, pauldron),
        vambrace: paintHook(lineW, vambrace),
        vambraceFar: paintHook(lineW, vambrace),
        back: paintHook(lineW, powerCell),
      };
      if (look.gun !== "hand") return hooks;
      const age = shotAge(fire);
      const flash = age === null ? null : paintHook(lineW, (ctx) => plasmaFlash(ctx, age * BURST.tickHz));
      hooks.hand = (ctx, palette) => {
        rifle.hook(ctx, palette, { lineW, simple: true });
        flash?.(ctx, palette);
      };
      return hooks;
    },
  };
};
