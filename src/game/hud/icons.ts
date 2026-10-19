import { drawRig } from "../../engine/rig/draw";
import type { GroupNode, RigNode } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset } from "../env/paint";
import { drawGun } from "../robot/gun";
import { buildSide, ROBOT } from "../robot/xbot";
import { CROWBAR_SCALE, HAND_BOX, type HudIcon, type HudIcons } from "./svg";

const PX_PER_UNIT = 12;
const CROWBAR_TILT = Math.PI / 4;
const FIST_BOX = { x: 290, y: -386, w: 194, h: 146 };

function icon(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void): HudIcon {
  const canvas = document.createElement("canvas");
  canvas.width = w * PX_PER_UNIT;
  canvas.height = h * PX_PER_UNIT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.scale(PX_PER_UNIT, PX_PER_UNIT);
  paint(ctx);
  return { url: canvas.toDataURL(), w, h };
}

export function findGroup(node: RigNode, name: string): GroupNode | null {
  if (node.k !== "g") return null;
  if (node.name === name) return node;
  for (const kid of node.kids) {
    const hit = findGroup(kid, name);
    if (hit) return hit;
  }
  return null;
}

export function hudIcons(): HudIcons {
  const gun = icon(35, 14, (ctx) => {
    ctx.scale(0.1, 0.1);
    ctx.translate(84, 98);
    drawGun(ctx);
  });
  const fist = icon(20, 15, (ctx) => {
    const fore = findGroup(buildSide(), "fore");
    if (!fore) throw new Error("side rig has no fore joint");
    const s = 15 / FIST_BOX.h;
    ctx.scale(s, s);
    ctx.translate(-FIST_BOX.x, -FIST_BOX.y);
    ctx.beginPath();
    ctx.rect(FIST_BOX.x, FIST_BOX.y, FIST_BOX.w, FIST_BOX.h);
    ctx.clip();
    ctx.rotate(-Math.PI / 2);
    drawRig(ctx, { ...fore, m: null, name: undefined }, { palette: ROBOT.palette });
  });
  const crowbarBox = { w: HAND_BOX.w * CROWBAR_SCALE, h: HAND_BOX.h * CROWBAR_SCALE };
  const crowbar = icon(crowbarBox.w, crowbarBox.h, (ctx) => {
    const [x0, y0, x1, y1] = ASSETS.crowbar.box;
    const reach = (x1 - x0 + (y1 - y0)) * Math.cos(CROWBAR_TILT);
    const s = Math.min(crowbarBox.w, crowbarBox.h) / reach;
    ctx.translate(crowbarBox.w / 2, crowbarBox.h / 2);
    ctx.rotate(-CROWBAR_TILT);
    ctx.scale(s, s);
    ctx.translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    drawAsset(ctx, ASSETS.crowbar, { state: 0, lod: false, lines: 1 });
  });
  return { gun, fist, items: { crowbar } };
}
