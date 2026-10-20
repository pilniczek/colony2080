import { describe, expect, it } from "vitest";
import { nearestFirst, TileCache, TILE_PX, visibleTiles } from "./tiles";

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

  describe("dropped tiles", () => {
    const freed: string[] = [];
    const keeper = (keep: number) => new TileCache<string>(keep, (tile) => freed.push(tile));

    it("reuses a recently dropped tile", () => {
      const cache = keeper(3);
      const { painted, make } = counter();
      cache.sync("a", view(0), make);
      cache.sync("a", view(500), make);
      painted.length = 0;
      cache.sync("a", view(0), make);
      expect(painted).toEqual([]);
      expect(cache.size).toBe(3);
    });

    it("evicts the oldest dropped tile past the cap and frees it", () => {
      freed.length = 0;
      const cache = keeper(2);
      const { painted, make } = counter();
      cache.sync("a", [[0, 0]], make);
      cache.sync("a", [[1, 0]], make);
      cache.sync("a", [[2, 0]], make);
      expect(freed).toEqual([]);
      cache.sync("a", [[3, 0]], make);
      expect(freed).toEqual(["0,0"]);
      painted.length = 0;
      cache.sync("a", [[1, 0]], make);
      cache.sync("a", [[0, 0]], make);
      expect(painted).toEqual(["0,0"]);
    });

    it("keeps the visible tiles of a dropped view over its margin ring", () => {
      freed.length = 0;
      const cache = keeper(2);
      const { painted, make } = counter();
      const at = { x: 130, y: 0, w: 100, h: 100 };
      const ring = nearestFirst(visibleTiles(at, 100, 1, { w: 1000, h: 100 }), at, 100);
      const need = visibleTiles(at, 100, 0, { w: 1000, h: 100 });
      for (let i = 0; i < 3; i++) cache.sync("a", need, make, { tiles: ring, budget: 1 });
      cache.sync("a", [[8, 0]], make);
      expect(freed.sort()).toEqual(["0,0", "3,0"]);
      painted.length = 0;
      cache.sync("a", need, make);
      expect(painted).toEqual([]);
    });

    it("never evicts the tiles of the first view after a key change", () => {
      freed.length = 0;
      const cache = new TileCache<string>(1, (tile) => freed.push(tile), true);
      const { painted, make } = counter();
      cache.sync("a", view(0), make);
      for (const x of [300, 500, 700]) cache.sync("a", view(x), make);
      expect(freed.sort()).toEqual(["3,0", "4,0", "6,0"]);
      painted.length = 0;
      cache.sync("a", view(0), make);
      expect(painted).toEqual([]);
    });

    it("clears kept tiles on a key change", () => {
      freed.length = 0;
      const cache = keeper(3);
      const { painted, make } = counter();
      cache.sync("a", view(0), make);
      cache.sync("a", view(500), make);
      cache.sync("b", view(500), make);
      expect(freed.sort()).toEqual(["0,0", "1,0", "2,0", "5,0", "6,0", "7,0"]);
      painted.length = 0;
      cache.sync("b", view(0), make);
      expect(painted.sort()).toEqual(["0,0", "1,0", "2,0"]);
    });
  });

  describe("prefetch", () => {
    const at = { x: 130, y: 0, w: 100, h: 100 };
    const ring = nearestFirst(visibleTiles(at, 100, 1, { w: 1000, h: 100 }), at, 100);
    const need = visibleTiles(at, 100, 0, { w: 1000, h: 100 });

    it("paints no margin tile on a sync that painted a visible tile", () => {
      const cache = new TileCache<string>();
      const { painted, make } = counter();
      const shown = cache.sync("a", need, make, { tiles: ring, budget: 1 });
      expect(shown.map(([c, r]) => `${c},${r}`).sort()).toEqual(["1,0", "2,0"]);
      expect(painted.sort()).toEqual(["1,0", "2,0"]);
    });

    it("then paints at most the budget of margin tiles per sync, nearest first", () => {
      const cache = new TileCache<string>();
      const { painted, make } = counter();
      cache.sync("a", need, make, { tiles: ring, budget: 1 });
      painted.length = 0;
      cache.sync("a", need, make, { tiles: ring, budget: 1 });
      expect(painted).toEqual(["0,0"]);
      cache.sync("a", need, make, { tiles: ring, budget: 1 });
      expect(painted).toEqual(["0,0", "3,0"]);
      cache.sync("a", need, make, { tiles: ring, budget: 1 });
      expect(painted).toEqual(["0,0", "3,0"]);
      expect(cache.size).toBe(4);
    });

    it("drops tiles outside the visible and margin tiles", () => {
      const cache = new TileCache<string>();
      const { make } = counter();
      cache.sync("a", need, make, { tiles: ring, budget: 4 });
      cache.sync("a", need, make, { tiles: ring, budget: 4 });
      const far = visibleTiles({ x: 750, y: 0, w: 100, h: 100 }, 100, 0, { w: 1000, h: 100 });
      cache.sync("a", far, make, { tiles: far, budget: 0 });
      expect(cache.size).toBe(2);
      expect(cache.has(1, 0)).toBe(false);
    });
  });
});

describe("nearestFirst", () => {
  it("orders tiles by the distance of their centre to the view centre", () => {
    const tiles: [number, number][] = [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1]];
    expect(nearestFirst(tiles, { x: 130, y: 0, w: 100, h: 100 }, 100)).toEqual([[1, 0], [2, 0], [1, 1], [0, 0], [3, 0]]);
  });
});
