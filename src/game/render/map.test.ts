import { describe, expect, it } from "vitest";
import { TileGrid } from "../../engine/world/tiles";
import type { Fog } from "../fog";
import type { Lift } from "../level/sandboxLevel";
import { MAP_CELLS, mapCells, mapFit } from "./map";

const ROWS = ["#....", "#H...", "#H..#", "#####"];

const kinds = (cells: Uint8Array): string[] => [...cells].map((c) => MAP_CELLS[c]!.charAt(0));

describe("mapCells", () => {
  it("shows every cell without fog", () => {
    const lift = { x: 3, w: 1, top: 0, bottom: 3 } as unknown as Lift;
    expect(kinds(mapCells({ grid: new TileGrid(ROWS), lifts: [lift], fog: null })).join("")).toBe("wooso" + "wsoso" + "wsosw" + "wwwww");
  });

  it("hides cells the hero never uncovered", () => {
    const grid = new TileGrid(ROWS);
    const revealed = new Uint8Array(grid.width * grid.height);
    revealed[6] = revealed[15] = 1;
    const fog = { width: grid.width, height: grid.height, revealed } as unknown as Fog;
    expect(kinds(mapCells({ grid, lifts: [], fog })).join("")).toBe("uuuuu" + "usuuu" + "uuuuu" + "wuuuu");
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
