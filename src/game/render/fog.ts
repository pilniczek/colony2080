import type { ViewTransform } from "../../engine/render/view";
import { seenAt, type Fog, type SightSpan } from "../fog";
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
  glide: Map<number, number>;
  image: ImageData | null;
  mask: HTMLCanvasElement;
  soft: HTMLCanvasElement;
  hardY: HTMLCanvasElement;
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

function cellBox(fog: Fog, cells: Iterable<number>): CellBox {
  let [c0, r0, c1, r1] = [fog.width, fog.height, -1, -1];
  for (const i of cells) {
    const [col, row] = [i % fog.width, Math.floor(i / fog.width)];
    [c0, r0, c1, r1] = [Math.min(c0, col), Math.min(r0, row), Math.max(c1, col), Math.max(r1, row)];
  }
  return { col: c0, row: r0, w: c1 - c0 + 1, h: r1 - r0 + 1 };
}

const alphaOf = (opacity: number): number => Math.round(opacity * 255);

export function glideOf(fog: Fog, span: SightSpan | undefined): Map<number, number> {
  const glide = new Map<number, number>();
  if (!span) return glide;
  const [covered, remembered] = [alphaOf(fog.cfg.opacity), alphaOf(fog.cfg.rememberedOpacity)];
  const edges: [number, number, number][] = [
    [Math.floor(span.left), 1, Math.floor(span.left) + 1 - span.left],
    [Math.floor(span.right), -1, span.right - Math.floor(span.right)],
  ];
  for (let row = Math.max(0, span.top); row < Math.min(fog.height, span.bottom); row++) {
    for (const [col, inward, cover] of edges) {
      if (cover <= 0 || cover >= 1 || col < 0 || col >= fog.width) continue;
      const i = row * fog.width + col;
      const inner = col + inward;
      if (!fog.seen[i] && !(inner >= 0 && inner < fog.width && fog.seen[i + inward])) continue;
      glide.set(i, Math.round((1 - cover) * (fog.seen[i] || fog.revealed[i] ? remembered : covered)));
    }
  }
  return glide;
}

const sameGlide = (a: Map<number, number>, b: Map<number, number>): boolean => a.size === b.size && [...a].every(([i, v]) => b.get(i) === v);

function paintMask(fog: Fog, cached: Layer, box: CellBox): void {
  const ctx = cached.mask.getContext("2d")!;
  const image = (cached.image ??= ctx.createImageData(fog.width, fog.height));
  const n = parseInt(fog.cfg.color.slice(1), 16);
  const rgb = ((n >> 16) & 0xff) | (n & 0xff00) | ((n & 0xff) << 16);
  const pixel = (alpha: number): number => (rgb | (alpha << 24)) >>> 0;
  const [covered, remembered] = [alphaOf(fog.cfg.opacity), alphaOf(fog.cfg.rememberedOpacity)];
  const pixels = new Uint32Array(image.data.buffer);
  for (let row = box.row; row < box.row + box.h; row++) {
    for (let i = row * fog.width + box.col, end = i + box.w; i < end; i++) {
      const alpha = cached.glide.get(i) ?? (fog.seen[i] ? 0 : fog.revealed[i] ? remembered : covered);
      pixels[i] = alpha ? pixel(alpha) : 0;
    }
  }
  ctx.putImageData(image, 0, 0, box.col, box.row, box.w, box.h);
}

const blocksSight = (fog: Fog, col: number, row: number): boolean => fog.grid.opaque(col, row) || fog.grid.floor(col, row);

export function hardEdges(fog: Fog, alpha: (i: number) => number, box: CellBox): [number, number][] {
  const edges: [number, number][] = [];
  for (let row = Math.max(1, box.row); row < Math.min(fog.height, box.row + box.h + 1); row++) {
    for (let col = box.col; col < box.col + box.w; col++) {
      const i = row * fog.width + col;
      if (alpha(i) === alpha(i - fog.width)) continue;
      if (blocksSight(fog, col, row - 1) || blocksSight(fog, col, row)) edges.push([col, row]);
    }
  }
  return edges;
}

function grow(fog: Fog, box: CellBox, cells: number): CellBox {
  const col = Math.max(0, box.col - cells);
  const row = Math.max(0, box.row - cells);
  return { col, row, w: Math.min(fog.width, box.col + box.w + cells) - col, h: Math.min(fog.height, box.row + box.h + cells) - row };
}

function paintSoft(fog: Fog, cached: Layer, box: CellBox): CellBox {
  const ctx = cached.soft.getContext("2d")!;
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
  ctx.drawImage(cached.mask, from.col, from.row, from.w, from.h, from.col * px, from.row * px, from.w * px, from.h * px);
  const pixels = new Uint32Array(cached.image!.data.buffer);
  const hard = hardEdges(fog, (i) => pixels[i]! >>> 24, blur);
  if (hard.length) {
    const hy = cached.hardY.getContext("2d")!;
    hy.clearRect(from.col, from.row * px, from.w, from.h * px);
    hy.imageSmoothingEnabled = false;
    hy.drawImage(cached.mask, from.col, from.row, from.w, from.h, from.col, from.row * px, from.w, from.h * px);
    ctx.beginPath();
    for (const [col, row] of hard) ctx.rect(col * px, row * px - px / 2, px, px);
    ctx.clip();
    ctx.clearRect(blur.col * px, blur.row * px, blur.w * px, blur.h * px);
    ctx.drawImage(cached.hardY, from.col, from.row * px, from.w, from.h * px, from.col * px, from.row * px, from.w * px, from.h * px);
  }
  ctx.restore();
  return blur;
}

const SPLIT_CELLS = 8;

function boxesOf(fog: Fog, cells: number[]): CellBox[] {
  if (!cells.length) return [];
  const cols = cells.map((i) => i % fog.width);
  const [lo, hi] = [Math.min(...cols), Math.max(...cols)];
  if (hi - lo <= SPLIT_CELLS) return [cellBox(fog, cells)];
  const mid = (lo + hi) / 2;
  return [cellBox(fog, cells.filter((_, n) => cols[n]! < mid)), cellBox(fog, cells.filter((_, n) => cols[n]! >= mid))];
}

const flipped = (before: number[], after: number[]): number[] => {
  const was = new Set(before);
  const now = new Set(after);
  return [...before.filter((i) => !now.has(i)), ...after.filter((i) => !was.has(i))];
};

function layer(fog: Fog, span: SightSpan | undefined): { cached: Layer; dirty: CellBox[] } {
  let cached = layers.get(fog);
  if (!cached) {
    const canvas = () => document.createElement("canvas");
    cached = { version: NaN, shown: [], glide: new Map(), image: null, mask: canvas(), soft: canvas(), hardY: canvas(), window: canvas(), windowKey: "", left: 0, top: 0 };
    cached.mask.width = fog.width;
    cached.mask.height = fog.height;
    cached.soft.width = fog.width * SOFT_CELL_PX;
    cached.soft.height = fog.height * SOFT_CELL_PX;
    cached.hardY.width = fog.width;
    cached.hardY.height = fog.height * SOFT_CELL_PX;
    layers.set(fog, cached);
  }
  const glide = glideOf(fog, span);
  const moved = cached.version !== fog.version;
  if (!moved && sameGlide(glide, cached.glide)) return { cached, dirty: [] };
  const changed = [...cached.glide.keys(), ...glide.keys(), ...(moved ? flipped(cached.shown, fog.seenCells) : [])];
  const boxes = Number.isNaN(cached.version) ? [{ col: 0, row: 0, w: fog.width, h: fog.height }] : boxesOf(fog, changed);
  cached.glide = glide;
  cached.version = fog.version;
  cached.shown = fog.seenCells;
  for (const box of boxes) paintMask(fog, cached, box);
  return { cached, dirty: boxes.map((box) => paintSoft(fog, cached, box)) };
}

function paintWindow(fog: Fog, cached: Layer, left: number, top: number, k: number, part?: Rect): void {
  const out = cached.window;
  const ctx = out.getContext("2d")!;
  const r = part ?? { x: 0, y: 0, w: out.width, h: out.height };
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(r.x, r.y, r.w, r.h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "low";
  ctx.drawImage(cached.soft, left, top, Math.round(fog.width * k), Math.round(fog.height * k));
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = fog.cfg.scanlineColor;
  const gap = fog.cfg.scanlineGapPx;
  const first = r.y + ((((top - r.y) % gap) + gap) % gap);
  for (let y = first; y < r.y + r.h; y += gap) ctx.fillRect(r.x, y, r.w, 1);
  ctx.restore();
}

function windowPart(fog: Fog, box: CellBox, left: number, top: number, k: number, out: HTMLCanvasElement): Rect | null {
  const sx = Math.round(fog.width * k) / fog.width;
  const sy = Math.round(fog.height * k) / fog.height;
  const x0 = Math.max(0, Math.floor(left + box.col * sx) - 1);
  const y0 = Math.max(0, Math.floor(top + box.row * sy) - 1);
  const x1 = Math.min(out.width, Math.ceil(left + (box.col + box.w) * sx) + 1);
  const y1 = Math.min(out.height, Math.ceil(top + (box.row + box.h) * sy) + 1);
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

export function drawFog(ctx: CanvasRenderingContext2D, fog: Fog, view: ViewTransform, cell: number, area: Rect, span?: SightSpan): void {
  const { cached, dirty } = layer(fog, span);
  const x = Math.round(area.x);
  const y = Math.round(area.y);
  const w = Math.round(area.w);
  const h = Math.round(area.h);
  const k = cell * view.scale;
  const left = Math.round(view.offsetX) - x;
  const top = Math.round(view.offsetY) - y;
  const key = `${w}:${h}:${k}`;
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
  } else {
    for (const box of dirty) {
      const part = windowPart(fog, box, cached.left + margin, cached.top + margin, k, cached.window);
      if (part) paintWindow(fog, cached, cached.left + margin, cached.top + margin, k, part);
    }
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(cached.window, margin - (left - cached.left), margin - (top - cached.top), w, h, x, y, w, h);
  ctx.restore();
}
