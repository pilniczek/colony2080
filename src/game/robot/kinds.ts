import heroClips from "@config/hero/clips.json";
import xbot from "@config/robots/xbot.json";
import { rotate, scale, translate, type Mat2D } from "../../engine/math/mat2d";
import { shade, type HookDraw, type Palette } from "../../engine/rig/draw";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import { drawAsset } from "../env/paint";
import type { ClipSet } from "../hero/config";
import { createRigs, type HeroLook, type Rigs } from "../hero/look";
import { STANCE_HOLD } from "../level/enemy";
import { holdPoses, type HoldPoses } from "./gun";
import { MUZZLE_IN_HOOK, type WeaponModel } from "./weaponModel";
import { ROBOT } from "./xbot";
import { caveTrooper } from "./kinds/caveTrooper";
import { greyTrooper } from "./kinds/greyTrooper";
import { rocketDroid } from "./kinds/rocketDroid";
import { rocketRobot } from "./kinds/rocketRobot";

export interface EnemyKind {
  palette: Palette;
  rigs: Rigs;
  hold: HoldPoses;
  muzzle?: Pt;
  launch?: Pt;
  laser?: Pt;
  clips?: ClipSet;
  hooks?: (look: HeroLook, lineW: number, fire: number | null) => Record<string, HookDraw>;
  dying?: Dying;
  weapon?: KindWeapon;
}

export type KindWeapon = Pick<WeaponModel, "draw" | "slung">;

export interface Dying {
  pose: Record<string, number>;
  back: number;
  up: number;
  seconds: number;
}

const groupNamed = (node: GroupNode, name: string): GroupNode | null => {
  if (node.name === name) return node;
  for (const kid of node.kids) {
    const found = kid.k === "g" ? groupNamed(kid, name) : null;
    if (found) return found;
  }
  return null;
};

export const addHooks = (root: GroupNode, hooks: Record<string, string[]>): GroupNode => {
  for (const [joint, names] of Object.entries(hooks)) {
    const group = groupNamed(root, joint);
    if (!group) throw new Error(`rig has no joint ${joint}`);
    for (const name of names) group.kids.push({ k: "hook", name });
  }
  return root;
};

const BACK = { x: 218, y: 170, deg: 30 };
const TORSO_SX = xbot.proportions.sideTorsoScaleX;

export const backToBody = (drop = 0): Mat2D => {
  let m = rotate({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, -BACK.deg);
  m = translate(scale(m, TORSO_SX, 1), -BACK.x, -BACK.y);
  return translate(scale(translate(m, ROBOT.SIDE_AX, 0), 1 / TORSO_SX, 1), -ROBOT.SIDE_AX, drop);
};

export const paintHook =
  (lineW: number, draw: (ctx: CanvasRenderingContext2D) => void, frame: Mat2D | null = null): HookDraw =>
  (ctx, palette) =>
    drawAsset(
      ctx,
      {
        id: "hook",
        box: [0, 0, 0, 0],
        draw: () => {
          if (frame) ctx.transform(frame.a, frame.b, frame.c, frame.d, frame.e, frame.f);
          draw(ctx);
        },
      },
      { palette, lines: lineW, lod: true },
    );

export const rigKeys = (pal: Palette, p: string): Palette => ({
  ...ROBOT.palette,
  a0: pal[p + "A0"]!, a1: pal[p + "A1"]!, a2: pal[p + "A2"]!, a3: pal[p + "A3"]!, aLine: pal[p + "Line"]!,
  m0: pal[p + "M0"]!, m1: pal[p + "M1"]!, m2: pal[p + "M2"]!, m3: pal[p + "M3"]!, mLine: pal[p + "Line"]!,
  c0: pal[p + "C0"]!, c1: pal[p + "C1"]!, c2: pal[p + "C2"]!, c3: pal[p + "C3"]!,
  visor: pal[p + "Visor"]!, badge: pal[p + "A2"]!, trefoil: pal[p + "Line"]!,
});

const STAND = heroClips.clips.idle.pose[0]![1] as Record<string, number>;

export const stanceShot = (stance: Record<string, number>, settle: number): ClipSet => ({
  shoot: {
    duration: STANCE_HOLD + settle,
    loop: false,
    pose: [
      [0, STAND],
      [settle, stance],
      [STANCE_HOLD, stance],
      [STANCE_HOLD + settle, STAND],
    ],
    rot: [[0, 0]],
  },
});

export const ENEMY_PALETTE: Palette = { ...shade(ROBOT.palette, { brightness: 1.1, saturate: 0 }), visor: ROBOT.palette.visor! };

export const walker = (): EnemyKind => {
  const rigs = createRigs(true, true);
  return { palette: ENEMY_PALETTE, rigs, hold: holdPoses(rigs.side, rigs.front), muzzle: MUZZLE_IN_HOOK };
};

const MAKERS: Record<string, () => EnemyKind> = { walker, rocketRobot, greyTrooper, rocketDroid, caveTrooper };

export const ENEMY_KINDS = Object.keys(MAKERS);

const made = new Map<string, EnemyKind>();

export const kindOf = (name: string): EnemyKind => {
  const known = made.get(name);
  if (known) return known;
  const maker = MAKERS[name];
  if (!maker) throw new Error(`unknown enemy kind ${name}`);
  const kind = maker();
  made.set(name, kind);
  return kind;
};
