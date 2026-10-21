import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { moveBox, type Box, type Platform } from "./collide";
import { TileGrid } from "./tiles";

const grid = new TileGrid(sandbox.rows);
const box = (x: number, y: number): Box => ({ x, y, w: 0.7, h: 1.9 });
const shelf = new TileGrid(["........", "........", "........", "........", "..====..", "........", "........", "........", "########"]);

describe("TileGrid", () => {
  it("is solid on the sides and top, empty below, one-way on ladder tops", () => {
    expect(grid.solid(-1, 5)).toBe(true);
    expect(grid.solid(grid.width, 5)).toBe(true);
    expect(grid.solid(5, -1)).toBe(true);
    expect(grid.solid(5, grid.height)).toBe(false);
    expect(grid.at(5, 99)).toBe(".");
    expect(grid.solid(0, 0)).toBe(true);
    expect(grid.ladderAt(3.5, 10)).toBe(true);
    expect(grid.ladderAt(5.5, 10)).toBe(false);
    expect(grid.ladderTop(3, 4)).toBe(true);
    expect(grid.ladderTop(3, 5)).toBe(false);
  });

  it("marks one-way floors and ladder tops as one-way but not solid", () => {
    const g = new TileGrid(["=.#", ".H.", ".H."]);
    expect(g.oneWay(0, 0)).toBe(true);
    expect(g.solid(0, 0)).toBe(false);
    expect(g.wall(0, 0)).toBe(false);
    expect(g.oneWay(1, 1)).toBe(true);
    expect(g.oneWay(1, 2)).toBe(false);
    expect(g.oneWay(1, 0)).toBe(false);
    expect(g.oneWay(2, 0)).toBe(false);
  });

  it("treats an invisible blocker as solid", () => {
    const blocked = new TileGrid(["|.#"]);
    expect(blocked.solid(0, 0)).toBe(true);
    expect(blocked.solid(1, 0)).toBe(false);
    expect(blocked.solid(2, 0)).toBe(true);
  });

  it("blocks overlay cells as solid but not as wall until cleared", () => {
    const g = new TileGrid(["...", "..."]);
    g.block(1, 0, true);
    g.block(2, 1, true);
    expect(g.solid(1, 0)).toBe(true);
    expect(g.wall(1, 0)).toBe(false);
    expect(g.at(1, 0)).toBe(".");
    g.block(1, 0, false);
    expect(g.solid(1, 0)).toBe(false);
    g.clearBlocks();
    expect(g.solid(2, 1)).toBe(false);
  });

  it("lets see-through blocks stop movement but not sight", () => {
    const g = new TileGrid(["...", "#.."]);
    g.block(1, 0, true, true);
    expect(g.solid(1, 0)).toBe(true);
    expect(g.opaque(1, 0)).toBe(false);
    expect(g.opaque(0, 1)).toBe(true);
    g.block(1, 0, true);
    expect(g.opaque(1, 0)).toBe(true);
  });

  it("counts a version only when blocks change", () => {
    const g = new TileGrid(["...", "..."]);
    const start = g.version;
    g.block(1, 0, false);
    expect(g.version).toBe(start);
    g.block(1, 0, true);
    g.block(1, 0, true);
    expect(g.version).toBe(start + 1);
    g.clearBlocks();
    expect(g.version).toBe(start + 2);
  });
});

describe("moveBox", () => {
  it("lands on the floor", () => {
    const r = moveBox(box(7.5, 13), 0, 2, grid, []);
    expect(r.y).toBe(14);
    expect(r.onGround).toBe(true);
    expect(r.hitY).toBe(true);
  });

  it("hits the step", () => {
    const r = moveBox(box(25, 14), 1, 0, grid, []);
    expect(r.hitX).toBe(true);
    expect(r.x).toBeCloseTo(26 - 0.35, 6);
  });

  it("walks off a ledge into the gap", () => {
    const r = moveBox(box(33.9, 14), 0.5, 0.1, grid, []);
    expect(r.onGround).toBe(false);
    expect(r.y).toBeCloseTo(14.1, 6);
  });

  it("does not tunnel on a huge dy", () => {
    const r = moveBox(box(7.5, 5), 0, 40, grid, []);
    expect(r.y).toBe(14);
    expect(r.onGround).toBe(true);
    const upper = moveBox(box(7.5, 1), 0, 40, grid, []);
    expect(upper.y).toBe(4);
  });

  it("falls out below the grid", () => {
    const pit = new TileGrid(["#...#", "##.##"]);
    const r = moveBox(box(2.5, 1), 0, 5, pit, []);
    expect(r.y).toBeGreaterThan(pit.height);
    expect(r.onGround).toBe(false);
  });

  it("bumps the ceiling", () => {
    const r = moveBox(box(7.5, 14), 0, -12, grid, []);
    expect(r.hitY).toBe(true);
    expect(r.y).toBeCloseTo(5 + 1.9, 6);
  });

  it("stops on a ladder top and passes it going up", () => {
    const down = moveBox(box(3.5, 2), 0, 5, grid, []);
    expect(down.y).toBe(4);
    expect(down.onGround).toBe(true);
    const up = moveBox(box(3.5, 8), 0, -3, grid, []);
    expect(up.y).toBeCloseTo(5, 6);
    expect(up.hitY).toBe(false);
  });

  it("ignores one-way floors on request", () => {
    const r = moveBox(box(3.5, 4), 0, 1, grid, [], { ignoreOneWay: true });
    expect(r.y).toBeCloseTo(5, 6);
    expect(r.onGround).toBe(false);
  });

  it("lands on a one-way floor from above", () => {
    const r = moveBox(box(3.5, 2), 0, 5, shelf, []);
    expect(r.y).toBe(4);
    expect(r.hitY).toBe(true);
    expect(r.onGround).toBe(true);
    const idle = moveBox(box(3.5, 4), 0, 0, shelf, []);
    expect(idle.onGround).toBe(true);
  });

  it("jumps up through a one-way floor", () => {
    const r = moveBox(box(3.5, 8), 0, -5, shelf, []);
    expect(r.y).toBeCloseTo(3, 6);
    expect(r.hitY).toBe(false);
    expect(r.onGround).toBe(false);
  });

  it("walks under a one-way floor", () => {
    const r = moveBox(box(0.5, 5), 6, 0, shelf, []);
    expect(r.hitX).toBe(false);
    expect(r.x).toBeCloseTo(6.5, 6);
  });

  it("drops through a one-way floor on request", () => {
    const r = moveBox(box(3.5, 4), 0, 1, shelf, [], { ignoreOneWay: true });
    expect(r.y).toBeCloseTo(5, 6);
    expect(r.onGround).toBe(false);
  });

  it("lands on a platform from above only and reports it", () => {
    const p: Platform = { x: 17, y: 8, w: 3, vy: 0 };
    const down = moveBox(box(18.5, 3), 0, 10, grid, [p]);
    expect(down.y).toBe(8);
    expect(down.platform).toBe(p);
    const up = moveBox(box(18.5, 13), 0, -6, grid, [p]);
    expect(up.y).toBeCloseTo(7, 6);
    expect(up.platform).toBeNull();
    const skipped = moveBox(box(18.5, 3), 0, 20, grid, [p], { ignoreOneWay: true });
    expect(skipped.y).toBe(14);
  });
});
