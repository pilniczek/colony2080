import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { moveBox, type Box, type Platform } from "./collide";
import { stepProjectiles } from "./projectiles";
import { TileGrid } from "./tiles";

const grid = new TileGrid(sandbox.rows);
const box = (x: number, y: number): Box => ({ x, y, w: 0.7, h: 1.9 });

describe("TileGrid", () => {
  it("is solid on the sides and top, empty below, one-way on ladder tops", () => {
    expect(grid.solid(-1, 5)).toBe(true);
    expect(grid.solid(40, 5)).toBe(true);
    expect(grid.solid(5, -1)).toBe(true);
    expect(grid.solid(5, 16)).toBe(false);
    expect(grid.at(5, 99)).toBe(".");
    expect(grid.solid(0, 0)).toBe(true);
    expect(grid.ladderAt(3.5, 10)).toBe(true);
    expect(grid.ladderAt(5.5, 10)).toBe(false);
    expect(grid.ladderTop(3, 4)).toBe(true);
    expect(grid.ladderTop(3, 5)).toBe(false);
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
    const r = moveBox(box(27.9, 14), 0.5, 0.1, grid, []);
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

describe("stepProjectiles", () => {
  it("drops projectiles in walls or outside the grid", () => {
    const list = [
      { x: 5, y: 12.6, vx: -8, r: 0.15 },
      { x: 1.2, y: 12.6, vx: -8, r: 0.15 },
    ];
    const next = stepProjectiles(list, grid, 0.1);
    expect(next).toHaveLength(1);
    expect(next[0]?.x).toBeCloseTo(4.2, 6);
  });
});
