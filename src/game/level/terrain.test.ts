import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TileGrid } from "../../engine/world/tiles";
import { terrain, type Rect, type Run } from "./terrain";

const loadJson = (): { rows: string[] } => JSON.parse(readFileSync("config/levels/sandbox.json", "utf8"));
const cellsOfRect = (r: Rect): string[] =>
  Array.from({ length: r.h * r.w }, (_, i) => `${r.col + (i % r.w)},${r.row + Math.floor(i / r.w)}`);
const cellsOfRun = (r: Run): string[] => cellsOfRect({ ...r, h: 1 });
const solidCells = (grid: TileGrid): string[] => {
  const out: string[] = [];
  for (let row = 0; row < grid.height; row++) for (let col = 0; col < grid.width; col++) if (grid.solid(col, row)) out.push(`${col},${row}`);
  return out;
};

const grid = new TileGrid(loadJson().rows);
const t = terrain(grid);

describe("terrain", () => {
  it("finds the two free-standing platforms as girders", () => {
    expect(t.girders).toEqual([{ row: 4, col: 20, w: 4 }, { row: 11, col: 12, w: 4 }]);
  });

  it("treats wall-backed runs as ledges", () => {
    expect(t.ledges).toEqual(expect.arrayContaining([
      { row: 4, col: 1, w: 2 }, { row: 4, col: 4, w: 7 }, { row: 13, col: 26, w: 1 }, { row: 14, col: 1, w: 25 },
    ]));
  });

  it("covers every solid cell once as wall or girder", () => {
    const cells = [...t.walls.flatMap(cellsOfRect), ...t.girders.flatMap(cellsOfRun)];
    expect(new Set(cells).size).toBe(cells.length);
    expect(new Set(cells)).toEqual(new Set(solidCells(grid)));
  });
});
