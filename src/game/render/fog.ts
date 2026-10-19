import type { ViewTransform } from "../../engine/render/view";
import { revealedAt, type Fog } from "../fog";
import type { Rect } from "../geometry";

const paths = new WeakMap<Fog, { version: number; cell: number; path: Path2D }>();

export function revealedPath(fog: Fog, cell: number): Path2D {
  const cached = paths.get(fog);
  if (cached && cached.version === fog.version && cached.cell === cell) return cached.path;
  const path = new Path2D();
  for (let row = 0; row < fog.height; row++) {
    for (let col = 0; col < fog.width; col++) {
      if (!revealedAt(fog, col, row)) continue;
      const start = col;
      while (revealedAt(fog, col + 1, row)) col++;
      path.rect(start * cell, row * cell, (col + 1 - start) * cell, cell);
    }
  }
  paths.set(fog, { version: fog.version, cell, path });
  return path;
}

const SOFT_CELL_PX = 8;

interface Layer {
  version: number;
  mask: HTMLCanvasElement;
  soft: HTMLCanvasElement;
  window: HTMLCanvasElement;
  windowKey: string;
}

const layers = new WeakMap<Fog, Layer>();

function paintMask(fog: Fog, canvas: HTMLCanvasElement): void {
  canvas.width = fog.width;
  canvas.height = fog.height;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(fog.width, fog.height);
  const n = parseInt(fog.cfg.color.slice(1), 16);
  const alpha = Math.round(fog.cfg.opacity * 255);
  for (let i = 0; i < fog.revealed.length; i++) {
    image.data.set([(n >> 16) & 255, (n >> 8) & 255, n & 255, fog.revealed[i] ? 0 : alpha], i * 4);
  }
  ctx.putImageData(image, 0, 0);
}

function paintSoft(fog: Fog, mask: HTMLCanvasElement, canvas: HTMLCanvasElement): void {
  canvas.width = fog.width * SOFT_CELL_PX;
  canvas.height = fog.height * SOFT_CELL_PX;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
}

function layer(fog: Fog): Layer {
  let cached = layers.get(fog);
  if (!cached) {
    const canvas = () => document.createElement("canvas");
    cached = { version: NaN, mask: canvas(), soft: canvas(), window: canvas(), windowKey: "" };
    layers.set(fog, cached);
  }
  if (cached.version !== fog.version) {
    paintMask(fog, cached.mask);
    paintSoft(fog, cached.mask, cached.soft);
    cached.version = fog.version;
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
  const key = `${fog.version}:${w}:${h}:${left}:${top}:${k}`;
  if (cached.windowKey !== key) {
    if (cached.window.width !== w || cached.window.height !== h) {
      cached.window.width = w;
      cached.window.height = h;
    }
    paintWindow(fog, cached, left, top, k);
    cached.windowKey = key;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(cached.window, x, y);
  ctx.restore();
}
