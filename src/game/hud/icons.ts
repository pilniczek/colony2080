import { drawRig } from "../../engine/rig/draw";
import type { GroupNode, RigNode } from "../../engine/rig/tree";
import { ASSETS, type AssetId } from "../env/assets";
import { drawAsset } from "../env/paint";
import { drawGun } from "../robot/gun";
import { buildFront, buildSide, ROBOT } from "../robot/xbot";
import { ITEMS, type Item } from "../items";
import { BODY_BOX, GUN_SCALE, INVENTORY_BOXES, ITEM_FILL, STAT_COLOR, type InventoryArt } from "./inventory";
import { HAND_BOX } from "./layout";
import type { HudIcon, HudIcons } from "./svg";

const PX_PER_UNIT = 12;
const FIST_BOX = { x: 290, y: -386, w: 194, h: 146 };
const STAGE = 2400;
const ITEM_ZOOM = 8;
const OUTLINE_STEPS = [[-6, 0], [6, 0], [0, -6], [0, 6], [-4, -4], [4, 4], [-4, 4], [4, -4]] as const;
const DIAGRAM_FILL = 0.18;

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
  return icon(w, h, (ctx) => assetIcon(ctx, asset, state, tilt, w, h));
}

const gunIcon = (scale = 1): HudIcon =>
  icon(35 * scale, 14 * scale, (ctx) => {
    ctx.scale(0.1 * scale, 0.1 * scale);
    ctx.translate(84, 98);
    drawGun(ctx);
  });

export function hudIcons(): HudIcons {
  const gun = gunIcon();
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

function stage(paint: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = STAGE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.translate(STAGE / 2, STAGE / 2);
  paint(ctx);
  return canvas;
}

function trimmed(canvas: HTMLCanvasElement, w: number, h: number): HudIcon {
  const { data } = canvas.getContext("2d")!.getImageData(0, 0, STAGE, STAGE);
  let x0 = STAGE, y0 = STAGE, x1 = 0, y1 = 0;
  for (let y = 0; y < STAGE; y++) {
    for (let x = 0; x < STAGE; x++) {
      if (data[(y * STAGE + x) * 4 + 3] === 0) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const k = Math.min(w / bw, h / bh);
  return icon(bw * k, bh * k, (ctx) => {
    ctx.scale(k, k);
    ctx.drawImage(canvas, -x0, -y0);
  });
}

function outline(source: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const silhouette = stage((ctx) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, STAGE, STAGE);
  });
  return stage((ctx) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const [dx, dy] of OUTLINE_STEPS) ctx.drawImage(silhouette, dx, dy);
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(silhouette, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = DIAGRAM_FILL;
    ctx.drawImage(silhouette, 0, 0);
  });
}

function bigItem({ icon: { asset, state, tilt } }: Item): HudIcon {
  const { w, h } = INVENTORY_BOXES.item;
  const canvas = stage((ctx) => {
    ctx.rotate((-tilt * Math.PI) / 180);
    ctx.scale(ITEM_ZOOM, ITEM_ZOOM);
    drawAsset(ctx, ASSETS[asset], { state, lod: false, lines: 1 });
  });
  return trimmed(canvas, w * ITEM_FILL, h * ITEM_FILL);
}

export function inventoryArt(): InventoryArt {
  const robot = stage((ctx) => drawRig(ctx, buildFront(), { palette: ROBOT.palette }));
  const { w, h } = INVENTORY_BOXES.robot;
  return {
    robot: trimmed(robot, w, h),
    body: trimmed(outline(robot, STAT_COLOR), BODY_BOX.w, BODY_BOX.h),
    gun: gunIcon(GUN_SCALE),
    items: Object.fromEntries(Object.entries(ITEMS).map(([id, item]) => [id, bigItem(item)])),
  };
}
