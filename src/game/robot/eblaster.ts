import type { Palette } from "../../engine/rig/draw";
import type { Pt } from "../../engine/rig/tree";
import { ARC, stroke } from "../arcLook";
import { BARREL, createWeaponModel, type MatKeys, type WeaponPart } from "./weaponModel";

export { MUZZLE as EBLASTER_MUZZLE, MUZZLE_IN_HOOK as EBLASTER_MUZZLE_IN_HOOK, SUPPORT as EBLASTER_SUPPORT } from "./weaponModel";

const PRONG = 48;
const COILS = 4;

const buildParts = (length: number): WeaponPart[] => {
  const end = BARREL.x + length;
  const coilStep = (length - PRONG - 24) / COILS;
  return [
    { name: "grip", x: -14, y: -14, w: 26, h: 56, mat: "m", tone: 1 },
    { name: "stock", x: -78, y: -60, w: 20, h: 42, mat: "m", tone: 0 },
    { name: "cell", x: -44, y: -90, w: 92, h: 22, mat: "m", tone: 1 },
    { name: "cellWindow", x: -34, y: -86, w: 72, h: 10, mat: "e", tone: 2 },
    { name: "receiver", x: -60, y: -72, w: 130, h: 62, mat: "c", tone: 1 },
    { name: "stripe", x: -14, y: -72, w: 12, h: 62, mat: "e", tone: 1 },
    { name: "pack", x: 14, y: -10, w: 46, h: 34, mat: "m", tone: 0 },
    { name: "packLight", x: 22, y: -2, w: 30, h: 8, mat: "e", tone: 2 },
    { name: "neck", x: BARREL.x, y: -58, w: length - PRONG + 4, h: 36, mat: "c", tone: 2 },
    { name: "core", x: BARREL.x, y: -44, w: length - PRONG + 4, h: 8, mat: "e", tone: 2 },
    ...Array.from({ length: COILS }, (_, i): WeaponPart => ({ name: `coil${i}`, x: BARREL.x + 14 + i * coilStep, y: -66, w: 12, h: 52, mat: "m", tone: 0 })),
    { name: "prongBase", x: end - PRONG - 4, y: -74, w: 14, h: 68, mat: "m", tone: 0 },
    { name: "prongTop", x: end - PRONG, y: -74, w: PRONG, h: 12, mat: "c", tone: 1 },
    { name: "prongLow", x: end - PRONG, y: -18, w: PRONG, h: 12, mat: "c", tone: 1 },
  ];
};

const MAT: Record<string, MatKeys> = {
  m: ["m0", "m1", "m2", "m3", "mLine"],
  c: ["c0", "c1", "c2", "c3", "mLine"],
  a: ["a0", "a1", "a2", "a3", "aLine"],
  e: ["e0", "e1", "e2", "e3", "eLine"],
};

const EMITTER_ARC: Pt[] = [[-6, -62], [2, -54], [-4, -46], [4, -40], [-4, -34], [2, -26], [-6, -18]];

const emitter = (ctx: CanvasRenderingContext2D, length: number, simple: boolean): void => {
  const end = BARREL.x + length;
  const pts = EMITTER_ARC.map(([x, y]): Pt => [end + x, y]);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.5;
  stroke(ctx, pts, ARC.glow, 16);
  ctx.globalAlpha = 1;
  stroke(ctx, pts, ARC.e1, 8);
  if (!simple) stroke(ctx, pts, ARC.grey, 5);
  stroke(ctx, pts, ARC.core, simple ? 3 : 2.4);
  ctx.restore();
};

const model = createWeaponModel({ buildParts, mat: MAT, colors: ARC as Palette, after: emitter });

export const EBLASTER_PARTS = model.parts;
export const drawEBlaster = model.draw;
export const eblasterHook = model.hook;
export const eblasterSlung = model.slung;
