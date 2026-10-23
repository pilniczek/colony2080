import { drawRig } from "../../engine/rig/draw";
import type { Pose } from "../../engine/rig/pose";
import type { GroupNode, RigNode } from "../../engine/rig/tree";
import { ASSETS, type AssetId } from "../env/assets";
import { drawAsset } from "../env/paint";
import { drawGun } from "../robot/gun";
import { buildFront, buildSide, ROBOT } from "../robot/xbot";
import { ITEMS, type Item, type ItemId } from "../items";
import { BODY_BOX, GUN_SCALE, INVENTORY_BOXES, ITEM_FILL, STAT_COLOR, type InventoryArt } from "./inventory";
import { CONTENT_SCALE, HAND_BOX, ICON_H, TOGGLE_W } from "./layout";
import { READOUT, type HudIcon, type HudIcons } from "./svg";

const PX_PER_UNIT = 12;
const FIST_BOX = { x: 290, y: -386, w: 194, h: 146 };
const STAGE = 2400;
const PROBE_SHRINK = 8;
const STAGE_PAD = 16;
const ITEM_ZOOM = 8;
const LIFT_PANEL = { w: 15, h: 14 };
const OUTLINE_STEPS = [[-6, 0], [6, 0], [0, -6], [0, 6], [-4, -4], [4, 4], [-4, 4], [4, -4]] as const;
const DIAGRAM_FILL = 0.18;
const RUN_POSE = { body: 27, hipNear: { rot: -70, sx: 0.6 }, kneeNear: 80, ankleNear: -10, hipFar: { rot: 0, sx: 0.6 }, kneeFar: 30, ankleFar: 0, arm: -40, armFar: 40, fore: -78, foreFar: -78 };
const WALK_POSE = { body: 4, hipNear: { rot: -25, sx: 0.6 }, kneeNear: 20, ankleNear: 0, hipFar: { rot: 18, sx: 0.6 }, kneeFar: 12, ankleFar: -8, arm: 20, armFar: -20, fore: -25, foreFar: -25 };

function icon(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void, cropToInk = false): HudIcon {
  const canvas = document.createElement("canvas");
  canvas.width = w * PX_PER_UNIT;
  canvas.height = h * PX_PER_UNIT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.scale(PX_PER_UNIT, PX_PER_UNIT);
  paint(ctx);
  return cropToInk ? inkColumns(canvas, h) : { url: canvas.toDataURL(), w, h };
}

function inkColumns(canvas: HTMLCanvasElement, h: number): HudIcon {
  const { width, height } = canvas;
  const pixels = new Uint32Array(canvas.getContext("2d")!.getImageData(0, 0, width, height).data.buffer);
  const inked = (x: number): boolean => {
    for (let y = 0; y < height; y++) if (pixels[y * width + x]! >>> 24) return true;
    return false;
  };
  let left = 0;
  while (left < width && !inked(left)) left++;
  if (left === width) return { url: canvas.toDataURL(), w: width / PX_PER_UNIT, h };
  let right = width - 1;
  while (!inked(right)) right--;
  const cropped = document.createElement("canvas");
  cropped.width = right - left + 1;
  cropped.height = height;
  cropped.getContext("2d")!.drawImage(canvas, -left, 0);
  return { url: cropped.toDataURL(), w: cropped.width / PX_PER_UNIT, h };
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
  return icon(w, h, (ctx) => assetIcon(ctx, asset, state, tilt, w, h), true);
}

const gunIcon = (scale = 1): HudIcon =>
  icon(35 * scale, 14 * scale, (ctx) => {
    ctx.scale(0.1 * scale, 0.1 * scale);
    ctx.translate(84, 98);
    drawGun(ctx);
  });

export function hudIcons(): HudIcons {
  const gun = gunIcon(CONTENT_SCALE);
  const fist = icon(20 * CONTENT_SCALE, 15 * CONTENT_SCALE, (ctx) => {
    const fore = findGroup(buildSide(), "fore");
    if (!fore) throw new Error("side rig has no fore joint");
    const s = (15 * CONTENT_SCALE) / FIST_BOX.h;
    ctx.scale(s, s);
    ctx.translate(-FIST_BOX.x, -FIST_BOX.y);
    ctx.beginPath();
    ctx.rect(FIST_BOX.x, FIST_BOX.y, FIST_BOX.w, FIST_BOX.h);
    ctx.clip();
    ctx.rotate(-Math.PI / 2);
    drawRig(ctx, { ...fore, m: null, name: undefined }, { palette: ROBOT.palette });
  });
  return { gun, fist, run: robotIcon(RUN_POSE), walk: robotIcon(WALK_POSE), items: Object.fromEntries(Object.entries(ITEMS).map(([id, item]) => [id, itemIcon(item)])) };
}

function robotIcon(pose: Pose): HudIcon {
  const robot = stage((ctx) => {
    ctx.scale(1.5, 1.5);
    ctx.translate(-350, -350);
    drawRig(ctx, buildSide({ farLimbs: true, lod: true }), { palette: ROBOT.palette, pose, simple: true });
  }, READOUT);
  return trimmed(robot, TOGGLE_W, ICON_H);
}

function canvasOf(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("no 2d context");
  return [canvas, ctx];
}

function recolor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, color: string): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function stage(paint: (ctx: CanvasRenderingContext2D) => void, color?: string): HTMLCanvasElement {
  const [probe, rough] = canvasOf(STAGE / PROBE_SHRINK, STAGE / PROBE_SHRINK);
  rough.scale(1 / PROBE_SHRINK, 1 / PROBE_SHRINK);
  rough.translate(STAGE / 2, STAGE / 2);
  paint(rough);
  const ink = inkBox(probe);
  const x0 = Math.max(0, ink.x0 * PROBE_SHRINK - STAGE_PAD);
  const y0 = Math.max(0, ink.y0 * PROBE_SHRINK - STAGE_PAD);
  const x1 = Math.min(STAGE, (ink.x1 + 1) * PROBE_SHRINK + STAGE_PAD);
  const y1 = Math.min(STAGE, (ink.y1 + 1) * PROBE_SHRINK + STAGE_PAD);
  const [canvas, ctx] = canvasOf(Math.max(1, x1 - x0), Math.max(1, y1 - y0));
  ctx.translate(STAGE / 2 - x0, STAGE / 2 - y0);
  paint(ctx);
  if (color) recolor(canvas, ctx, color);
  return canvas;
}

function inkBox(canvas: HTMLCanvasElement): { x0: number; y0: number; x1: number; y1: number } {
  const { width, height } = canvas;
  const pixels = new Uint32Array(canvas.getContext("2d")!.getImageData(0, 0, width, height).data.buffer);
  const inkRow = (y: number): boolean => {
    for (let i = y * width, end = i + width; i < end; i++) if (pixels[i]! >>> 24) return true;
    return false;
  };
  let y0 = 0;
  while (y0 < height && !inkRow(y0)) y0++;
  if (y0 === height) return { x0: width, y0: height, x1: 0, y1: 0 };
  let y1 = height - 1;
  while (!inkRow(y1)) y1--;
  const inkColumn = (x: number): boolean => {
    for (let y = y0; y <= y1; y++) if (pixels[y * width + x]! >>> 24) return true;
    return false;
  };
  let x0 = 0;
  while (!inkColumn(x0)) x0++;
  let x1 = width - 1;
  while (!inkColumn(x1)) x1--;
  return { x0, y0, x1, y1 };
}

function trimmed(canvas: HTMLCanvasElement, w: number, h: number): HudIcon {
  const { x0, y0, x1, y1 } = inkBox(canvas);
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const k = Math.min(w / bw, h / bh);
  return icon(bw * k, bh * k, (ctx) => {
    ctx.scale(k, k);
    ctx.drawImage(canvas, -x0, -y0);
  });
}

function outline(source: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const [silhouette, shape] = canvasOf(source.width, source.height);
  shape.drawImage(source, 0, 0);
  recolor(silhouette, shape, color);
  const [canvas, ctx] = canvasOf(source.width, source.height);
  for (const [dx, dy] of OUTLINE_STEPS) ctx.drawImage(silhouette, dx, dy);
  ctx.globalCompositeOperation = "destination-out";
  ctx.drawImage(silhouette, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = DIAGRAM_FILL;
  ctx.drawImage(silhouette, 0, 0);
  return canvas;
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

export function inventoryArtJobs(): { jobs: (() => void)[]; art: InventoryArt } {
  const art = { items: {} } as InventoryArt;
  let robot: HTMLCanvasElement | null = null;
  const { w, h } = INVENTORY_BOXES.robot;
  const robotJob = (): void => {
    robot = stage((ctx) => drawRig(ctx, buildFront(), { palette: ROBOT.palette }));
    art.robot = trimmed(robot, w, h);
  };
  const bodyJob = (): void => {
    art.body = trimmed(outline(robot!, STAT_COLOR), BODY_BOX.w, BODY_BOX.h);
  };
  const itemJobs = Object.entries(ITEMS).map(([id, item]) => (): void => {
    art.items[id as ItemId] = bigItem(item);
  });
  const panelJob = (): void => {
    art.liftPanel = icon(LIFT_PANEL.w, LIFT_PANEL.h, (ctx) => assetIcon(ctx, "liftPanel", 0, 0, LIFT_PANEL.w, LIFT_PANEL.h), true);
  };
  return { jobs: [robotJob, bodyJob, () => (art.gun = gunIcon(GUN_SCALE)), panelJob, ...itemJobs], art };
}

export function inventoryArt(): InventoryArt {
  const { jobs, art } = inventoryArtJobs();
  for (const job of jobs) job();
  return art;
}
