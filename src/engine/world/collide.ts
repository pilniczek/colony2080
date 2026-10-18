import type { TileGrid } from "./tiles";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Platform {
  x: number;
  y: number;
  w: number;
  vy: number;
}

export interface MoveResult {
  x: number;
  y: number;
  hitX: boolean;
  hitY: boolean;
  onGround: boolean;
  platform: Platform | null;
}

export interface MoveOptions {
  ignoreOneWay?: boolean;
}

interface Surface {
  y: number;
  platform: Platform | null;
}

const MAX_SUBSTEP = 0.25;
const EDGE = 1e-6;
const SUPPORT = 1e-3;

function cellRange(lo: number, hi: number): [number, number] {
  return [Math.floor(lo + EDGE), Math.ceil(hi - EDGE) - 1];
}

function solidInRect(grid: TileGrid, x0: number, x1: number, y0: number, y1: number): boolean {
  const [c0, c1] = cellRange(x0, x1);
  const [r0, r1] = cellRange(y0, y1);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (grid.solid(c, r)) return true;
  return false;
}

function overlapsPlatform(left: number, right: number, p: Platform): boolean {
  return right > p.x + EDGE && left < p.x + p.w - EDGE;
}

function landingSurface(
  left: number,
  right: number,
  fromY: number,
  toY: number,
  grid: TileGrid,
  platforms: Platform[],
): number {
  let best = Infinity;
  const [c0, c1] = cellRange(left, right);
  const [r0, r1] = cellRange(fromY, toY);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (grid.ladderTop(c, r) && fromY <= r + EDGE && toY > r) best = Math.min(best, r);
    }
  }
  for (const p of platforms) {
    if (overlapsPlatform(left, right, p) && fromY <= p.y + EDGE && toY > p.y) best = Math.min(best, p.y);
  }
  return best;
}

function floorRow(left: number, right: number, fromY: number, toY: number, grid: TileGrid): number {
  const [c0, c1] = cellRange(left, right);
  const [, r1] = cellRange(fromY, toY);
  for (let r = Math.floor(fromY); r <= r1; r++) {
    for (let c = c0; c <= c1; c++) if (grid.solid(c, r)) return r;
  }
  return Infinity;
}

function findSupport(box: Box, grid: TileGrid, platforms: Platform[], ignoreOneWay: boolean): Surface | null {
  const left = box.x - box.w / 2;
  const right = box.x + box.w / 2;
  if (!ignoreOneWay) {
    for (const p of platforms) {
      if (overlapsPlatform(left, right, p) && Math.abs(p.y - box.y) <= SUPPORT) return { y: box.y, platform: p };
    }
    const row = Math.round(box.y);
    if (Math.abs(row - box.y) <= SUPPORT) {
      const [c0, c1] = cellRange(left, right);
      for (let c = c0; c <= c1; c++) if (grid.ladderTop(c, row)) return { y: box.y, platform: null };
    }
  }
  const underfoot = solidInRect(grid, left, right, box.y + SUPPORT, box.y + SUPPORT + EDGE * 2);
  return underfoot ? { y: box.y, platform: null } : null;
}

export function moveBox(
  box: Box,
  dx: number,
  dy: number,
  grid: TileGrid,
  platforms: Platform[],
  options: MoveOptions = {},
): MoveResult {
  const ignoreOneWay = options.ignoreOneWay ?? false;
  const half = box.w / 2;
  const substeps = (d: number) => Math.max(1, Math.ceil(Math.abs(d) / MAX_SUBSTEP));
  let x = box.x;
  let y = box.y;
  let hitX = false;
  let hitY = false;

  const nx = substeps(dx);
  for (let i = 0; i < nx && dx !== 0; i++) {
    const next = x + dx / nx;
    if (solidInRect(grid, next - half, next + half, y - box.h, y)) {
      hitX = true;
      x = dx > 0 ? Math.ceil(next + half - EDGE) - 1 - half : Math.floor(next - half + EDGE) + 1 + half;
      break;
    }
    x = next;
  }

  const ny = substeps(dy);
  for (let i = 0; i < ny && dy !== 0; i++) {
    const next = y + dy / ny;
    if (dy > 0) {
      const solid = floorRow(x - half, x + half, y, next, grid);
      const oneWay = ignoreOneWay ? Infinity : landingSurface(x - half, x + half, y, next, grid, platforms);
      const surface = Math.min(solid, oneWay);
      if (surface !== Infinity) {
        hitY = true;
        y = surface;
        break;
      }
    } else if (solidInRect(grid, x - half, x + half, next - box.h, next)) {
      hitY = true;
      y = Math.floor(next - box.h + EDGE) + 1 + box.h;
      break;
    }
    y = next;
  }

  const support = findSupport({ ...box, x, y }, grid, platforms, ignoreOneWay);
  return { x, y, hitX, hitY, onGround: support !== null, platform: support?.platform ?? null };
}
