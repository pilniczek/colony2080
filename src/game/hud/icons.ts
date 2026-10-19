import { drawRig } from "../../engine/rig/draw";
import type { GroupNode, RigNode } from "../../engine/rig/tree";
import { ASSETS, type AssetId } from "../env/assets";
import { drawAsset } from "../env/paint";
import { drawGun } from "../robot/gun";
import { buildSide, ROBOT } from "../robot/xbot";
import { ITEMS, type Item } from "../items";
import { HAND_BOX } from "./layout";
import type { HudIcon, HudIcons } from "./svg";

const PX_PER_UNIT = 12;
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

function placeholder(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const r = Math.min(w, h) * 0.32;
  ctx.fillStyle = "#6a4206";
  ctx.strokeStyle = "#f0a818";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.roundRect(w / 2 - r, h / 2 - r, 2 * r, 2 * r, 1);
  ctx.fill();
  ctx.stroke();
}

function assetIcon(ctx: CanvasRenderingContext2D, asset: AssetId, state: number, tilt: number, w: number, h: number): void {
  const def = ASSETS[asset];
  const [x0, y0, x1, y1] = def.box;
  const angle = (tilt * Math.PI) / 180;
  const reach = (x1 - x0) * Math.cos(angle) + (y1 - y0) * Math.sin(angle);
  const s = Math.min(w, h) / reach;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-angle);
  ctx.scale(s, s);
  ctx.translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
  drawAsset(ctx, def, { state, lod: false, lines: 1 });
}

function itemIcon({ icon: { asset, state, tilt, scale } }: Item): HudIcon {
  const w = HAND_BOX.w * scale;
  const h = HAND_BOX.h * scale;
  return icon(w, h, (ctx) => (asset === null ? placeholder(ctx, w, h) : assetIcon(ctx, asset, state, tilt, w, h)));
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
  return { gun, fist, items: Object.fromEntries(Object.entries(ITEMS).map(([id, item]) => [id, itemIcon(item)])) };
}
