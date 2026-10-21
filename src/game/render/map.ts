import { revealedAt } from "../fog";
import type { Rect } from "../geometry";
import type { Hero } from "../hero/hero";
import type { Lift, SandboxWorld } from "../level/sandboxLevel";
import { filled } from "../level/terrain";

export const MAP_CELLS = ["unknown", "open", "wall", "ladder"] as const;
export type MapCell = (typeof MAP_CELLS)[number];

const COLORS: Record<MapCell, [number, number, number, number]> = {
  unknown: [0, 0, 0, 0],
  open: [0xc4, 0xc2, 0xbc, 255],
  wall: [0x2b, 0x29, 0x25, 255],
  ladder: [0x55, 0x52, 0x4c, 255],
};

const code = (kind: MapCell): number => MAP_CELLS.indexOf(kind);

const BACK = "#5a5248";
const GRID = "#71695e";
const GRID_DOT = "#d8d2c4";
const LIFT = "#2b2925";
const HERO = "#f0c020";
const HERO_EDGE = "#1a1814";
const GRID_CELLS = 8;
const COORD_CELLS = 10;
const COORD_LINE = "rgba(240, 192, 32, 0.35)";
const COORD_TEXT = "#f0c020";
const COORD_EDGE = "#1a1814";
const COORD_MIN_PX = 9;
const COORD_MAX_PX = 14;
const COORD_SHARE = 0.4;
const MARGIN_SHARE = 0.04;
const MIN_MARKER_PX = 3;
const SHAFT_SHARE = 0.3;
const DECK_SHARE = 0.25;
const MIN_LINE_PX = 2;

type MapWorld = Pick<SandboxWorld, "grid" | "lifts" | "fog">;

export function mapCells({ grid, fog }: Pick<MapWorld, "grid" | "fog">): Uint8Array {
  const cells = new Uint8Array(grid.width * grid.height);
  for (let row = 0; row < grid.height; row++) {
    for (let col = 0; col < grid.width; col++) {
      if (fog && !revealedAt(fog, col, row)) continue;
      cells[row * grid.width + col] = code(filled(grid, col, row) ? "wall" : grid.at(col, row) === "H" ? "ladder" : "open");
    }
  }
  return cells;
}

const liftKnown = (fog: MapWorld["fog"], lift: Lift): boolean => {
  if (!fog) return true;
  for (let row = Math.floor(lift.top) - 1; row < Math.ceil(lift.bottom); row++) {
    for (let col = Math.floor(lift.x); col < Math.ceil(lift.x + lift.w); col++) if (revealedAt(fog, col, row)) return true;
  }
  return false;
};

export const mapLifts = ({ lifts, fog }: Pick<MapWorld, "lifts" | "fog">): Lift[] => lifts.filter((lift) => liftKnown(fog, lift));

function drawLift(ctx: CanvasRenderingContext2D, lift: Lift, fit: MapFit): void {
  const at = (x: number, y: number): [number, number] => [fit.x + x * fit.cell, fit.y + y * fit.cell];
  const shaft = Math.max(MIN_LINE_PX, SHAFT_SHARE * fit.cell);
  const deck = Math.max(MIN_LINE_PX, DECK_SHARE * fit.cell);
  const [left, top] = at(lift.x, lift.top);
  const [, bottom] = at(lift.x, lift.bottom);
  ctx.fillStyle = LIFT;
  ctx.fillRect(left + (lift.w * fit.cell - shaft) / 2, top, shaft, bottom - top);
  for (const stop of lift.stops) ctx.fillRect(left, at(0, stop)[1] - deck / 2, lift.w * fit.cell, deck);
}

export interface MapFit {
  x: number;
  y: number;
  cell: number;
}

export function mapFit(cols: number, rows: number, rect: Rect): MapFit {
  const margin = Math.min(rect.w, rect.h) * MARGIN_SHARE;
  const cell = Math.max(0, Math.min((rect.w - 2 * margin) / cols, (rect.h - 2 * margin) / rows));
  return { x: rect.x + (rect.w - cols * cell) / 2, y: rect.y + (rect.h - rows * cell) / 2, cell };
}

const images = new WeakMap<MapWorld, { fog: MapWorld["fog"]; version: number; canvas: HTMLCanvasElement }>();

function mapImage(world: MapWorld): HTMLCanvasElement {
  const version = world.fog?.version ?? -1;
  const cached = images.get(world);
  if (cached && cached.fog === world.fog && cached.version === version) return cached.canvas;
  const { width, height } = world.grid;
  const canvas = cached?.canvas ?? document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(width, height);
  mapCells(world).forEach((kind, i) => image.data.set(COLORS[MAP_CELLS[kind]!], i * 4));
  ctx.putImageData(image, 0, 0);
  images.set(world, { fog: world.fog, version, canvas });
  return canvas;
}

function drawGrid(ctx: CanvasRenderingContext2D, rect: Rect, fit: MapFit): void {
  const step = fit.cell * GRID_CELLS;
  if (step <= 0) return;
  const first = (origin: number, start: number): number => origin - Math.floor((origin - start) / step) * step;
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = first(fit.x, rect.x); x <= rect.x + rect.w; x += step) {
    ctx.moveTo(Math.round(x) + 0.5, rect.y);
    ctx.lineTo(Math.round(x) + 0.5, rect.y + rect.h);
  }
  for (let y = first(fit.y, rect.y); y <= rect.y + rect.h; y += step) {
    ctx.moveTo(rect.x, Math.round(y) + 0.5);
    ctx.lineTo(rect.x + rect.w, Math.round(y) + 0.5);
  }
  ctx.stroke();
  ctx.fillStyle = GRID_DOT;
  for (let x = first(fit.x, rect.x); x <= rect.x + rect.w; x += step) {
    for (let y = first(fit.y, rect.y); y <= rect.y + rect.h; y += step) ctx.fillRect(Math.round(x) - 0.5, Math.round(y) - 0.5, 2, 2);
  }
}

export const coordMarks = (cells: number): number[] => Array.from({ length: Math.ceil(cells / COORD_CELLS) }, (_, i) => i * COORD_CELLS);

function drawCoords(ctx: CanvasRenderingContext2D, cols: number, rows: number, fit: MapFit): void {
  const right = fit.x + cols * fit.cell;
  const bottom = fit.y + rows * fit.cell;
  ctx.strokeStyle = COORD_LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const col of coordMarks(cols)) {
    const x = Math.round(fit.x + col * fit.cell) + 0.5;
    ctx.moveTo(x, fit.y);
    ctx.lineTo(x, bottom);
  }
  for (const row of coordMarks(rows)) {
    const y = Math.round(fit.y + row * fit.cell) + 0.5;
    ctx.moveTo(fit.x, y);
    ctx.lineTo(right, y);
  }
  ctx.stroke();
  const px = Math.round(Math.min(COORD_MAX_PX, Math.max(COORD_MIN_PX, COORD_SHARE * COORD_CELLS * fit.cell)));
  ctx.font = `${px}px monospace`;
  ctx.lineWidth = Math.max(2, px / 4);
  ctx.lineJoin = "round";
  ctx.strokeStyle = COORD_EDGE;
  ctx.fillStyle = COORD_TEXT;
  const label = (text: string, x: number, y: number): void => {
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  };
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  for (const col of coordMarks(cols)) label(String(col), fit.x + col * fit.cell + 2, fit.y + 2);
  for (const row of coordMarks(rows)) if (row > 0) label(String(row), fit.x + 2, fit.y + row * fit.cell + 2);
}

const heroLabel = (hero: Pick<Hero, "x" | "y">): string => `moveto(${Math.round(hero.x * 10) / 10},${Math.round(hero.y * 10) / 10})`;

export function drawMap(ctx: CanvasRenderingContext2D, world: MapWorld, hero: Pick<Hero, "x" | "y">, heroHeight: number, rect: Rect, coords = false): void {
  const { width, height } = world.grid;
  const fit = mapFit(width, height, rect);
  ctx.fillStyle = BACK;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  drawGrid(ctx, rect, fit);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(mapImage(world), fit.x, fit.y, width * fit.cell, height * fit.cell);
  for (const lift of mapLifts(world)) drawLift(ctx, lift, fit);
  const w = Math.max(MIN_MARKER_PX, fit.cell);
  const h = Math.max(MIN_MARKER_PX, heroHeight * fit.cell);
  ctx.fillStyle = HERO;
  ctx.strokeStyle = HERO_EDGE;
  ctx.lineWidth = 1;
  ctx.fillRect(fit.x + hero.x * fit.cell - w / 2, fit.y + hero.y * fit.cell - h, w, h);
  ctx.strokeRect(fit.x + hero.x * fit.cell - w / 2, fit.y + hero.y * fit.cell - h, w, h);
  if (!coords) return;
  ctx.save();
  drawCoords(ctx, width, height, fit);
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  const [x, y] = [fit.x + width * fit.cell, fit.y + height * fit.cell + 2];
  ctx.strokeText(heroLabel(hero), x, y);
  ctx.fillText(heroLabel(hero), x, y);
  ctx.restore();
}
