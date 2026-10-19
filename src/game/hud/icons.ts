import { drawRig } from "../../engine/rig/draw";
import type { GroupNode, RigNode } from "../../engine/rig/tree";
import { ASSETS } from "../env/assets";
import { drawAsset } from "../env/paint";
import { drawGun } from "../robot/gun";
import { buildSide, ROBOT } from "../robot/xbot";
import { HAND_SCALE, type HudIcon, type HudIcons } from "./svg";

const PX_PER_UNIT = 12;
const CROWBAR_SIZE = { w: 14 * HAND_SCALE, h: 4 * HAND_SCALE };
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
  const crowbar = icon(CROWBAR_SIZE.w, CROWBAR_SIZE.h, (ctx) => {
    const [x0, y0, x1, y1] = ASSETS.crowbar.box;
    const s = CROWBAR_SIZE.w / (x1 - x0);
    ctx.scale(s, s);
    ctx.translate(-x0, -y0 + (CROWBAR_SIZE.h / s - (y1 - y0)) / 2);
    drawAsset(ctx, ASSETS.crowbar, { state: 0, lod: false, lines: 1 });
  });
  return { gun, fist, items: { crowbar } };
}
