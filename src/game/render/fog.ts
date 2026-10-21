import type { ViewTransform } from "../../engine/render/view";
import { seenAt, type Fog } from "../fog";
import type { Rect } from "../geometry";

const paths = new WeakMap<Fog, { version: number; cell: number; path: Path2D }>();

export function seenPath(fog: Fog, cell: number): Path2D {
  const cached = paths.get(fog);
  if (cached && cached.version === fog.version && cached.cell === cell) return cached.path;
  const path = new Path2D();
  for (let row = 0; row < fog.height; row++) {
    for (let col = 0; col < fog.width; col++) {
      if (!seenAt(fog, col, row)) continue;
      const start = col;
      while (seenAt(fog, col + 1, row)) col++;
      path.rect(start * cell, row * cell, (col + 1 - start) * cell, cell);
    }
  }
  paths.set(fog, { version: fog.version, cell, path });
  return path;
}

const SOFT_CELL_PX = 8;
const WINDOW_MARGIN_PX = 128;
const SOFT_BLUR_CELLS = 2;
const SOFT_PAD_CELLS = 2;

interface Layer {
  version: number;
  shown: number[];
  image: ImageData | null;
  mask: HTMLCanvasElement;
  soft: HTMLCanvasElement;
  window: HTMLCanvasElement;
  windowKey: string;
  left: number;
  top: number;
}

interface CellBox {
  col: number;
  row: number;
  w: number;
  h: number;
}

const layers = new WeakMap<Fog, Layer>();

function cellBox(fog: Fog, cells: number[]): CellBox {
  let [c0, r0, c1, r1] = [fog.width, fog.height, -1, -1];
  for (const i of cells) {
    const [col, row] = [i % fog.width, Math.floor(i / fog.width)];
    [c0, r0, c1, r1] = [Math.min(c0, col), Math.min(r0, row), Math.max(c1, col), Math.max(r1, row)];
  }
  return { col: c0, row: r0, w: c1 - c0 + 1, h: r1 - r0 + 1 };
}

function paintMask(fog: Fog, cached: Layer, box: CellBox): void {
  const ctx = cached.mask.getContext("2d")!;
  const image = (cached.image ??= ctx.createImageData(fog.width, fog.height));
  const n = parseInt(fog.cfg.color.slice(1), 16);
  const rgb = ((n >> 16) & 0xff) | (n & 0xff00) | ((n & 0xff) << 16);
  const pixel = (opacity: number): number => (rgb | (Math.round(opacity * 255) << 24)) >>> 0;
  const [covered, remembered] = [pixel(fog.cfg.opacity), pixel(fog.cfg.rememberedOpacity)];
  const pixels = new Uint32Array(image.data.buffer);
  for (let row = box.row; row < box.row + box.h; row++) {
    for (let i = row * fog.width + box.col, end = i + box.w; i < end; i++) pixels[i] = fog.seen[i] ? 0 : fog.revealed[i] ? remembered : covered;
  }
  ctx.putImageData(image, 0, 0, box.col, box.row, box.w, box.h);
}

function grow(fog: Fog, box: CellBox, cells: number): CellBox {
  const col = Math.max(0, box.col - cells);
  const row = Math.max(0, box.row - cells);
  return { col, row, w: Math.min(fog.width, box.col + box.w + cells) - col, h: Math.min(fog.height, box.row + box.h + cells) - row };
}

function paintSoft(fog: Fog, mask: HTMLCanvasElement, soft: HTMLCanvasElement, box: CellBox): void {
  const ctx = soft.getContext("2d")!;
  const px = SOFT_CELL_PX;
  const blur = grow(fog, box, SOFT_BLUR_CELLS);
  const from = grow(fog, box, SOFT_BLUR_CELLS + SOFT_PAD_CELLS);
  ctx.save();
  ctx.beginPath();
  ctx.rect(blur.col * px, blur.row * px, blur.w * px, blur.h * px);
  ctx.clip();
  ctx.clearRect(blur.col * px, blur.row * px, blur.w * px, blur.h * px);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(mask, from.col, from.row, from.w, from.h, from.col * px, from.row * px, from.w * px, from.h * px);
  ctx.restore();
}

function layer(fog: Fog): Layer {
  let cached = layers.get(fog);
  if (!cached) {
    const canvas = () => document.createElement("canvas");
    cached = { version: NaN, shown: [], image: null, mask: canvas(), soft: canvas(), window: canvas(), windowKey: "", left: 0, top: 0 };
    cached.mask.width = fog.width;
    cached.mask.height = fog.height;
    cached.soft.width = fog.width * SOFT_CELL_PX;
    cached.soft.height = fog.height * SOFT_CELL_PX;
    layers.set(fog, cached);
  }
  if (cached.version !== fog.version) {
    const box = Number.isNaN(cached.version) ? { col: 0, row: 0, w: fog.width, h: fog.height } : cellBox(fog, [...cached.shown, ...fog.seenCells]);
    if (box.w > 0 && box.h > 0) {
      paintMask(fog, cached, box);
      paintSoft(fog, cached.mask, cached.soft, box);
    }
    cached.version = fog.version;
    cached.shown = fog.seenCells;
  }
  return cached;
}

function paintWindow(fog: Fog, cached: Layer, left: number, top: number, k: number): void {
  const out = cached.window;
  const ctx = out.getContext("2d")!;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "low";
  ctx.drawImage(cached.soft, left, top, Math.round(fog.width * k), Math.round(fog.height * k));
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = fog.cfg.scanlineColor;
  const gap = fog.cfg.scanlineGapPx;
  for (let y = ((top % gap) + gap) % gap; y < out.height; y += gap) ctx.fillRect(0, y, out.width, 1);
}

export function drawFog(ctx: CanvasRenderingContext2D, fog: Fog, view: ViewTransform, cell: number, area: Rect): void {
  const cached = layer(fog);
  const x = Math.round(area.x);
  const y = Math.round(area.y);
  const w = Math.round(area.w);
  const h = Math.round(area.h);
  const k = cell * view.scale;
  const left = Math.round(view.offsetX) - x;
  const top = Math.round(view.offsetY) - y;
  const key = `${fog.version}:${w}:${h}:${k}`;
  const margin = WINDOW_MARGIN_PX;
  if (cached.windowKey !== key || Math.abs(left - cached.left) > margin || Math.abs(top - cached.top) > margin) {
    if (cached.window.width !== w + 2 * margin || cached.window.height !== h + 2 * margin) {
      cached.window.width = w + 2 * margin;
      cached.window.height = h + 2 * margin;
    }
    paintWindow(fog, cached, left + margin, top + margin, k);
    cached.windowKey = key;
    cached.left = left;
    cached.top = top;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(cached.window, margin - (left - cached.left), margin - (top - cached.top), w, h, x, y, w, h);
  ctx.restore();
}
