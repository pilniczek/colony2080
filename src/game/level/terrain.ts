import type { TileGrid } from "../../engine/world/tiles";

export interface Run {
  row: number;
  col: number;
  w: number;
}

export interface Rect {
  row: number;
  col: number;
  w: number;
  h: number;
}

function runsOf(width: number, row: number, keep: (col: number) => boolean): Run[] {
  const runs: Run[] = [];
  let start = -1;
  for (let col = 0; col <= width; col++) {
    const on = col < width && keep(col);
    if (on && start < 0) start = col;
    if (!on && start >= 0) {
      runs.push({ row, col: start, w: col - start });
      start = -1;
    }
  }
  return runs;
}

const attached = (grid: TileGrid, col: number, row: number): boolean => grid.wall(col, row) || grid.at(col, row) === "H";

export function terrain(grid: TileGrid): { walls: Rect[]; ledges: Run[]; girders: Run[] } {
  const ledges: Run[] = [];
  const girders: Run[] = [];
  const taken = new Set<string>();
  const key = (col: number, row: number): string => `${col},${row}`;
  for (let row = 1; row < grid.height; row++) {
    const surface = runsOf(grid.width, row, (col) => grid.wall(col, row) && !grid.wall(col, row - 1));
    for (const run of surface) {
      const last = run.col + run.w - 1;
      let free = !attached(grid, run.col - 1, row) && !attached(grid, last + 1, row);
      for (let col = run.col; col <= last; col++) if (grid.wall(col, row + 1)) free = false;
      if (free) {
        girders.push(run);
        for (let col = run.col; col <= last; col++) taken.add(key(col, row));
      } else ledges.push(run);
    }
  }
  const walls: Rect[] = [];
  const merged = new Set<string>();
  for (let row = 0; row < grid.height; row++) {
    const rest = runsOf(grid.width, row, (col) => grid.wall(col, row) && !taken.has(key(col, row)));
    for (const run of rest) {
      if (merged.has(key(run.col, row))) continue;
      let h = 1;
      while (runsOf(grid.width, row + h, (col) => grid.wall(col, row + h) && !taken.has(key(col, row + h))).some((r) => r.col === run.col && r.w === run.w)) {
        merged.add(key(run.col, row + h));
        h++;
      }
      walls.push({ ...run, h });
    }
  }
  return { walls, ledges, girders };
}
