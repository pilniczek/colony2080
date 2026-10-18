import type { ViewTransform } from "../../engine/render/view";
import { revealedAt, type Fog } from "../fog";

interface Layer {
  key: string;
  canvas: HTMLCanvasElement;
}

const paths = new WeakMap<Fog, { version: number; cell: number; path: Path2D }>();
const layers = new WeakMap<Fog, Layer>();

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

function mask(fog: Fog): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
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
  return canvas;
}

function layer(fog: Fog, w: number, h: number): HTMLCanvasElement {
  const key = `${fog.version}:${w}:${h}`;
  const cached = layers.get(fog);
  if (cached?.key === key) return cached.canvas;
  const canvas = cached?.canvas ?? document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(mask(fog), 0, 0, w, h);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = fog.cfg.scanlineColor;
  for (let y = 0; y < h; y += fog.cfg.scanlineGapPx) ctx.fillRect(0, y, w, 1);
  layers.set(fog, { key, canvas });
  return canvas;
}

export function drawFog(ctx: CanvasRenderingContext2D, fog: Fog, view: ViewTransform, cell: number): void {
  const k = cell * view.scale;
  const w = Math.round(fog.width * k);
  const h = Math.round(fog.height * k);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layer(fog, w, h), Math.round(view.offsetX), Math.round(view.offsetY));
  ctx.restore();
}
