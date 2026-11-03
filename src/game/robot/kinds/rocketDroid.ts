import type { HookDraw, Palette } from "../../../engine/rig/draw";
import type { Pt } from "../../../engine/rig/tree";
import { P } from "../../env/paint";
import { createRigs } from "../../hero/look";
import { KIND_TUNING } from "../../level/enemy";
import { holdPoses } from "../gun";
import { paintHook, stanceShot, type EnemyKind } from "../kinds";
import { createWeaponModel, toHook, type WeaponPart } from "../weaponModel";
import { ROBOT } from "../xbot";

const { box, flat, poly, disc, line, glow, hazard, path } = P;

const DROID_PALETTE: Palette = {
  ...ROBOT.palette,
  a0: "#6e5a3c", a1: "#a8916a", a2: "#d4c39e", a3: "#f6eed8", aLine: "#2a2014",
  m0: "#17170f", m1: "#29291b", m2: "#40402c", m3: "#646446", mLine: "#080806",
  c0: "#5a4a3c", c1: "#8c7a68", c2: "#b8a894", c3: "#ece0d0",
  r0: "#4a1e0c", r1: "#8a3a14", r2: "#c05a20", r3: "#e8945a", rLine: "#1c0a04",
  hazard: "#e8c21a", hazardDark: "#141008",
  visor: "#ff2a1a", badge: "#e8c21a", trefoil: "#080806",
  tip: "#d8301c", lens: "#9cff5a", char: "#141010",
};

const TORSO_TILT = 30;
const RACK = { x0: -96, x1: 34, y0: -250, y1: 90, cells: 3, lid: 26 };
const DESIGNATOR_MUZZLE: Pt = [104, -40];
const DESIGNATOR_SUPPORT: Pt = [30, -20];
const CARRY = { arm: -20, fore: -62 };
const BRACE = { body: 0, hipNear: -34, kneeNear: 30, ankleNear: 4, hipFar: 26, kneeFar: 0, ankleFar: -26 };
const SETTLE = KIND_TUNING.rocketDroid!.missiles!.braceMs / 1000;

const designatorParts = (): WeaponPart[] => [
  { name: "body", x: -10, y: -64, w: 112, h: 40, mat: "m", tone: 2 },
  { name: "sight", x: 10, y: -84, w: 54, h: 20, mat: "r", tone: 2 },
  { name: "lens", x: 96, y: -54, w: 10, h: 22, mat: "v", tone: 2 },
];

const designator = createWeaponModel({
  buildParts: designatorParts,
  mat: {
    m: ["m0", "m1", "m2", "m3", "mLine"],
    r: ["r0", "r1", "r2", "r3", "rLine"],
    v: ["visor", "visor", "visor", "visor", "mLine"],
  },
});

const cellX = (i: number): number => RACK.x0 + ((i + 0.5) * (RACK.x1 - RACK.x0)) / RACK.cells;

const rack = (ctx: CanvasRenderingContext2D): void => {
  const { x0, x1, y0, y1, cells, lid } = RACK;
  const w = (x1 - x0) / cells;
  poly(ctx, [[x1 - 4, y0 + 70], [x1 + 36, y0 + 90], [x1 + 36, y0 + 150], [x1 - 4, y0 + 170]], "steel", 1);
  poly(ctx, [[x1 - 4, y1 - 120], [x1 + 30, y1 - 100], [x1 + 30, y1 - 50], [x1 - 4, y1 - 30]], "steel", 1);
  box(ctx, x0, y0, x1 - x0, y1 - y0, "rust", 2, { vertical: true });
  box(ctx, x0 - 10, y0 + 70, 14, 220, "steel", 1, { vertical: true });
  for (let i = 1; i < cells; i++) line(ctx, [[x0 + i * w, y0], [x0 + i * w, y1 - 60]], "rLine", 3, "butt");
  box(ctx, x0 - 6, y1 - 60, x1 - x0 + 12, 60, "steel", 1);
  ctx.save();
  path(ctx, [[x0, y0 + 150], [x1, y0 + 150], [x1, y0 + 190], [x0, y0 + 190]]);
  ctx.clip();
  hazard(ctx, x0, y0 + 150, x1 - x0, 40, 26, { fill: "hazard", dark: "hazardDark", line: "rLine" });
  ctx.restore();
  for (let i = 0; i < cells; i++) {
    const cx = cellX(i);
    poly(ctx, [[cx - w / 2 + 2, y0], [cx - w / 2 + 8, y0 - lid * 0.5], [cx + w / 2 - 8, y0 - lid * 0.5], [cx + w / 2 - 2, y0]], "steel", 2);
    disc(ctx, cx, y0 - lid * 0.25, 6, "tip");
  }
  if (P.simple()) return;
  for (const y of [y0 + 30, y0 + 110, y0 + 230]) line(ctx, [[x0 + 8, y], [x1 - 8, y]], "r0", 3, "butt");
  line(ctx, [[x0 + 10, y0 + 12], [x0 + 10, y1 - 70]], "r3", 4, "butt");
  for (let i = 0; i < 4; i++) flat(ctx, x0 + 14 + i * 28, y1 - 44, 18, 26, "char");
  box(ctx, x1 - 30, y0 - 46, 14, 46, "steel", 2, { vertical: true });
  disc(ctx, x1 - 23, y0 - 50, 9, "lens", "mLine");
  glow(ctx, x1 - 23, y0 - 50, 26, "lens", 0.35);
};

export const rocketDroid = (): EnemyKind => {
  const rigs = createRigs(true, true);
  return {
    weapon: designator,
    palette: DROID_PALETTE,
    rigs,
    hold: holdPoses(rigs.side, rigs.front, CARRY, toHook(DESIGNATOR_SUPPORT)),
    laser: toHook(DESIGNATOR_MUZZLE),
    clips: stanceShot(BRACE, SETTLE),
    hooks: (look, lineW) => {
      if (look.view !== "side") return {};
      const hooks: Record<string, HookDraw> = {
        back: paintHook(lineW, (c) => {
          c.rotate((-TORSO_TILT * Math.PI) / 180);
          rack(c);
        }),
      };
      if (look.gun === "hand") hooks.hand = (c, pal) => designator.hook(c, pal, { lineW, simple: true });
      return hooks;
    },
  };
};
