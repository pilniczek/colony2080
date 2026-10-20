import type { TileGrid } from "../engine/world/tiles";
import type { MovementConfig } from "./hero/config";
import type { Hero } from "./hero/hero";

export interface FogConfig {
  enabled: boolean;
  rowsAbove: number;
  rowsBelow: number;
  followRate: number;
  color: string;
  opacity: number;
  rememberedOpacity: number;
  scanlineColor: string;
  scanlineGapPx: number;
}

export interface SightRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Fog {
  cfg: FogConfig;
  grid: TileGrid;
  anchorY: number;
  width: number;
  height: number;
  revealed: Uint8Array;
  seen: Uint8Array;
  seenCells: number[];
  version: number;
}

export function loadFog(json: unknown): FogConfig {
  const { fogOfWar } = json as { fogOfWar: FogConfig };
  return { ...fogOfWar };
}

type Sight = Pick<MovementConfig, "box" | "sightCells">;

const EYE_SHARE = 0.85;
const INSET = 0.1;

export function sightRect(cfg: FogConfig, sightCells: number, x: number, anchorY: number): SightRect {
  return { left: x - sightCells, right: x + sightCells, top: anchorY - cfg.rowsAbove, bottom: anchorY + cfg.rowsBelow };
}

const inside = (fog: Fog, col: number, row: number): boolean => col >= 0 && col < fog.width && row >= 0 && row < fog.height;

export const revealedAt = (fog: Fog, col: number, row: number): boolean => inside(fog, col, row) && fog.revealed[row * fog.width + col] === 1;

export const seenAt = (fog: Fog, col: number, row: number): boolean => inside(fog, col, row) && fog.seen[row * fog.width + col] === 1;

function clearLine(grid: TileGrid, [ax, ay]: [number, number], [bx, by]: [number, number]): boolean {
  const [dx, dy] = [bx - ax, by - ay];
  const [stepX, stepY] = [Math.sign(dx), Math.sign(dy)];
  const [endCol, endRow] = [Math.floor(bx), Math.floor(by)];
  let [col, row] = [Math.floor(ax), Math.floor(ay)];
  const [deltaX, deltaY] = [Math.abs(1 / dx), Math.abs(1 / dy)];
  let tx = dx > 0 ? (col + 1 - ax) / dx : dx < 0 ? (ax - col) / -dx : Infinity;
  let ty = dy > 0 ? (row + 1 - ay) / dy : dy < 0 ? (ay - row) / -dy : Infinity;
  while (col !== endCol || row !== endRow) {
    if (grid.solid(col, row) || grid.floor(col, row)) return false;
    if (tx < ty) [tx, col] = [tx + deltaX, col + stepX];
    else [ty, row] = [ty + deltaY, row + stepY];
  }
  return true;
}

function inSight(grid: TileGrid, eye: [number, number], col: number, row: number): boolean {
  const [lo, hi] = [INSET, 1 - INSET];
  const points: [number, number][] = [[0.5, 0.5], [lo, lo], [hi, lo], [lo, hi], [hi, hi]];
  return points.some(([px, py]) => clearLine(grid, eye, [col + px, row + py]));
}

const sameCells = (a: number[], b: number[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);

function reveal(fog: Fog, r: SightRect, eye: [number, number]): void {
  const cells: number[] = [];
  for (let row = Math.max(0, Math.ceil(r.top - 0.5)); row < Math.min(fog.height, Math.floor(r.bottom + 0.5)); row++) {
    for (let col = Math.max(0, Math.ceil(r.left - 0.5)); col < Math.min(fog.width, Math.floor(r.right + 0.5)); col++) {
      if (inSight(fog.grid, eye, col, row)) cells.push(row * fog.width + col);
    }
  }
  if (sameCells(cells, fog.seenCells)) return;
  for (const i of fog.seenCells) fog.seen[i] = 0;
  for (const i of cells) fog.seen[i] = fog.revealed[i] = 1;
  fog.seenCells = cells;
  fog.version++;
}

const revealAround = (fog: Fog, x: number, sight: Sight): void =>
  reveal(fog, sightRect(fog.cfg, sight.sightCells, x, fog.anchorY), [x, fog.anchorY - sight.box.height * EYE_SHARE]);

export function createFog(cfg: FogConfig, sight: Sight, hero: Pick<Hero, "x" | "y">, grid: TileGrid): Fog {
  const fog = { cfg, grid, anchorY: hero.y, width: grid.width, height: grid.height, revealed: new Uint8Array(grid.width * grid.height), seen: new Uint8Array(grid.width * grid.height), seenCells: [], version: 0 };
  revealAround(fog, hero.x, sight);
  return fog;
}

const settled = (h: Hero): boolean => h.onGround || h.state === "ladder";

export function updateFog(fog: Fog, h: Hero, sight: Sight, dt: number): void {
  const { cfg } = fog;
  const outside = h.y > fog.anchorY + cfg.rowsBelow || h.y - sight.box.height < fog.anchorY - cfg.rowsAbove;
  if (settled(h) || outside) fog.anchorY += (h.y - fog.anchorY) * Math.min(1, cfg.followRate * dt);
  revealAround(fog, h.x, sight);
}

export const visible = (fog: Fog, x: number, y: number): boolean => seenAt(fog, Math.floor(x), Math.floor(y));

export function fogEdge(fog: Fog, x: number, y: number, dir: number): number {
  if (dir === 0) return 0;
  const row = Math.floor(y);
  if (row < 0 || row >= fog.height) return dir * Infinity;
  let col = Math.floor(x);
  if (!seenAt(fog, col, row)) return -dir * Infinity;
  while (seenAt(fog, col + dir, row)) col += dir;
  const next = col + dir;
  if (next < 0 || next >= fog.width) return dir * Infinity;
  return dir > 0 ? next : col;
}
