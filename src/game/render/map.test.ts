import { describe, expect, it } from "vitest";
import { TileGrid } from "../../engine/world/tiles";
import type { Fog } from "../fog";
import type { Lift } from "../level/sandboxLevel";
import { MAP_CELLS, coordMarks, mapCells, mapFit, mapLifts } from "./map";

const ROWS = ["#....", "#H...", "#H..#", "#####"];

const kinds = (cells: Uint8Array): string[] => [...cells].map((c) => MAP_CELLS[c]!.charAt(0));

describe("mapCells", () => {
  it("shows every cell without fog", () => {
    expect(kinds(mapCells({ grid: new TileGrid(ROWS), fog: null })).join("")).toBe("woooo" + "wlooo" + "wloow" + "wwwww");
  });

  it("shows one-way floors as walls", () => {
    expect(kinds(mapCells({ grid: new TileGrid([".==.", "...."]), fog: null })).join("")).toBe("owwo" + "oooo");
  });

  it("hides cells the hero never uncovered", () => {
    const grid = new TileGrid(ROWS);
    const revealed = new Uint8Array(grid.width * grid.height);
    revealed[6] = revealed[15] = 1;
    const fog = { width: grid.width, height: grid.height, revealed } as unknown as Fog;
    expect(kinds(mapCells({ grid, fog })).join("")).toBe("uuuuu" + "uluuu" + "uuuuu" + "wuuuu");
  });
});

describe("mapLifts", () => {
  const lift = { x: 3, w: 1, top: 1, bottom: 3 } as unknown as Lift;
  const fogAt = (cell: number): Fog => {
    const revealed = new Uint8Array(20);
    revealed[cell] = 1;
    return { width: 5, height: 4, revealed } as unknown as Fog;
  };

  it("shows a lift once any cell of its shaft or the room over its top stop is uncovered", () => {
    expect(mapLifts({ lifts: [lift], fog: null })).toEqual([lift]);
    expect(mapLifts({ lifts: [lift], fog: fogAt(3) })).toEqual([lift]);
    expect(mapLifts({ lifts: [lift], fog: fogAt(13) })).toEqual([lift]);
    expect(mapLifts({ lifts: [lift], fog: fogAt(18) })).toEqual([]);
  });
});

describe("mapFit", () => {
  it("fits the map by its tighter side and centres it", () => {
    const fit = mapFit(160, 80, { x: 10, y: 20, w: 1000, h: 400 });
    expect(fit.cell).toBeCloseTo((400 - 32) / 80);
    expect(fit.y).toBeCloseTo(36);
    expect(fit.x).toBeCloseTo(10 + (1000 - 160 * fit.cell) / 2);
  });
});

describe("coordMarks", () => {
  it("marks every tenth cell from the map origin, inside the map", () => {
    expect(coordMarks(35)).toEqual([0, 10, 20, 30]);
    expect(coordMarks(30)).toEqual([0, 10, 20]);
  });
});
