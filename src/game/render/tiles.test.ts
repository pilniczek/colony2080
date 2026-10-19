import { describe, expect, it } from "vitest";
import { TileCache, TILE_PX, visibleTiles } from "./tiles";

const sorted = (tiles: [number, number][]): string[] => tiles.map(([c, r]) => `${c},${r}`).sort();

describe("visibleTiles", () => {
  const limits = { w: 10 * 100, h: 6 * 100 };

  it("gives the tile under a view inside it plus the margin ring", () => {
    expect(sorted(visibleTiles({ x: 310, y: 210, w: 50, h: 50 }, 100, 1, limits))).toEqual(
      sorted([
        [2, 1], [3, 1], [4, 1],
        [2, 2], [3, 2], [4, 2],
        [2, 3], [3, 3], [4, 3],
      ]),
    );
  });

  it("clamps the margin ring to the layer", () => {
    expect(sorted(visibleTiles({ x: 910, y: 510, w: 50, h: 50 }, 100, 1, limits))).toEqual(
      sorted([
        [8, 4], [9, 4],
        [8, 5], [9, 5],
      ]),
    );
  });

  it("gives both neighbours of a seam", () => {
    expect(sorted(visibleTiles({ x: 150, y: 10, w: 100, h: 50 }, 100, 0, limits))).toEqual(sorted([[1, 0], [2, 0]]));
  });

  it("does not take the next tile when the view ends on a seam", () => {
    expect(sorted(visibleTiles({ x: 100, y: 0, w: 100, h: 100 }, 100, 0, limits))).toEqual(sorted([[1, 0]]));
  });

  it("gives one tile at the layer corner with no margin", () => {
    expect(sorted(visibleTiles({ x: 0, y: 0, w: 30, h: 30 }, 100, 0, limits))).toEqual(sorted([[0, 0]]));
  });

  it("counts a partial last tile as part of the layer", () => {
    expect(sorted(visibleTiles({ x: 940, y: 0, w: 60, h: 10 }, 100, 1, { w: 950, h: 100 }))).toEqual(sorted([[8, 0], [9, 0]]));
  });

  it("gives nothing for a view off the layer", () => {
    expect(visibleTiles({ x: 2000, y: 0, w: 100, h: 100 }, 100, 0, limits)).toEqual([]);
  });

  it("uses 512 device px tiles", () => {
    expect(TILE_PX).toBe(512);
  });
});

describe("TileCache", () => {
  const counter = () => {
    const painted: string[] = [];
    const make = (col: number, row: number): string => {
      painted.push(`${col},${row}`);
      return `${col},${row}`;
    };
    return { painted, make };
  };
  const view = (x: number) => visibleTiles({ x, y: 0, w: 250, h: 100 }, 100, 0, { w: 1000, h: 100 });

  it("paints each visible tile once", () => {
    const cache = new TileCache<string>();
    const { painted, make } = counter();
    cache.sync("a", view(0), make);
    cache.sync("a", view(0), make);
    expect(painted.sort()).toEqual(["0,0", "1,0", "2,0"]);
    expect(cache.size).toBe(3);
  });

  it("paints only the new column when scrolling one tile right and drops the far one", () => {
    const cache = new TileCache<string>();
    const { painted, make } = counter();
    cache.sync("a", view(0), make);
    painted.length = 0;
    const shown = cache.sync("a", view(100), make);
    expect(painted).toEqual(["3,0"]);
    expect(shown.map(([c, r]) => `${c},${r}`).sort()).toEqual(["1,0", "2,0", "3,0"]);
    expect(cache.size).toBe(3);
    expect(cache.has(0, 0)).toBe(false);
  });

  it("repaints an evicted tile when it comes back", () => {
    const cache = new TileCache<string>();
    const { painted, make } = counter();
    cache.sync("a", view(0), make);
    cache.sync("a", view(500), make);
    painted.length = 0;
    cache.sync("a", view(0), make);
    expect(painted.sort()).toEqual(["0,0", "1,0", "2,0"]);
  });

  it("returns each tile with its coordinates", () => {
    const cache = new TileCache<string>();
    const { make } = counter();
    expect(cache.sync("a", [[4, 2]], make)).toEqual([[4, 2, "4,2"]]);
  });

  it("repaints all visible tiles when the key changes", () => {
    const cache = new TileCache<string>();
    const { painted, make } = counter();
    cache.sync("a", view(0), make);
    painted.length = 0;
    cache.sync("b", view(0), make);
    expect(painted.sort()).toEqual(["0,0", "1,0", "2,0"]);
    expect(cache.size).toBe(3);
  });

  describe("prefetch", () => {
    const ring = visibleTiles({ x: 150, y: 0, w: 100, h: 100 }, 100, 1, { w: 1000, h: 100 });
    const need = visibleTiles({ x: 150, y: 0, w: 100, h: 100 }, 100, 0, { w: 1000, h: 100 });

    it("paints visible tiles now and at most the budget of margin tiles per sync", () => {
      const cache = new TileCache<string>();
      const { painted, make } = counter();
      const shown = cache.sync("a", need, make, { tiles: ring, budget: 1 });
      expect(shown.map(([c, r]) => `${c},${r}`).sort()).toEqual(["1,0", "2,0"]);
      expect(painted.sort()).toEqual(["0,0", "1,0", "2,0"]);
      painted.length = 0;
      cache.sync("a", need, make, { tiles: ring, budget: 1 });
      expect(painted).toEqual(["3,0"]);
      painted.length = 0;
      cache.sync("a", need, make, { tiles: ring, budget: 1 });
      expect(painted).toEqual([]);
      expect(cache.size).toBe(4);
    });

    it("drops tiles outside the visible and margin tiles", () => {
      const cache = new TileCache<string>();
      const { make } = counter();
      cache.sync("a", need, make, { tiles: ring, budget: 4 });
      const far = visibleTiles({ x: 750, y: 0, w: 100, h: 100 }, 100, 0, { w: 1000, h: 100 });
      cache.sync("a", far, make, { tiles: far, budget: 0 });
      expect(cache.size).toBe(2);
      expect(cache.has(1, 0)).toBe(false);
    });
  });
});
