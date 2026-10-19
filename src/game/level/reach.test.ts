import movementJson from "@config/hero/movement.json";
import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { loadMovement } from "../hero/config";
import { loadSandbox, type Lift } from "./sandboxLevel";
import type { Run } from "./terrain";

const world = loadSandbox(sandbox);
const { grid, lifts } = world;
const { fallDeathCells } = loadMovement(movementJson);
const JUMP_UP = 1;
const JUMP_GAP = 4;
const JUMP_CLEARANCE = 3;

const runs: Run[] = [...world.terrain.ledges, ...world.terrain.girders];
const decks: Run[] = lifts.map((l) => ({ row: l.top, col: l.x, w: l.w }));
const floors = [...runs, ...decks];
const id = (r: Run): string => `${r.row},${r.col}`;
const deckId = (i: number): string => `deck ${i}`;
const node = (r: Run): string => (decks.includes(r) ? deckId(decks.indexOf(r)) : id(r));

const inShaft = (l: Lift, col: number): boolean => col >= l.x && col < l.x + l.w;
const runAt = (row: number, col: number): Run | undefined => runs.find((r) => r.row === row && col >= r.col && col < r.col + r.w);
const touching = (row: number, c0: number, c1: number): Run[] =>
  floors.filter((r) => r.row === row && r.col <= c1 + 1 && r.col + r.w - 1 >= c0 - 1);
const bottomStop = (l: Lift): Run[] => runs.filter((r) => r.row === l.bottom && r.col <= l.x + l.w - 1 && r.col + r.w - 1 >= l.x);
const clear = (col: number, top: number, bottom: number): boolean => {
  for (let row = top; row <= bottom; row++) if (grid.solid(col, row)) return false;
  return true;
};

interface Edge {
  to: string;
  lift?: number;
}

function landings(col: number, from: number, maxDrop: number): string[] {
  const out: string[] = [];
  let land = from + 1;
  while (land < grid.height && !grid.solid(col, land) && !grid.ladderTop(col, land)) land++;
  lifts.forEach((l, i) => {
    if (inShaft(l, col) && l.top > from && l.top <= land && l.top - from <= maxDrop) out.push(deckId(i));
  });
  if (land >= grid.height || land - from > maxDrop) return out;
  const under = runAt(land, col);
  return [...out, ...(under ? [id(under)] : touching(land, col, col).map(node))];
}

function jumps(r: Run, side: -1 | 1, maxDrop: number): string[] {
  const edge = side < 0 ? r.col : r.col + r.w - 1;
  return floors
    .filter((t) => t !== r && t.row >= r.row - JUMP_UP && t.row - r.row <= maxDrop)
    .filter((t) => {
      const near = side < 0 ? t.col + t.w - 1 : t.col;
      const gap = (near - edge) * side;
      if (gap < 1 || gap > JUMP_GAP) return false;
      const top = Math.min(r.row, t.row) - JUMP_CLEARANCE;
      for (let c = edge + side; c !== near; c += side) if (!clear(c, top, Math.max(r.row, t.row) - 1)) return false;
      return clear(near, top, t.row - 1);
    })
    .map(node);
}

function graph(maxDrop: number): Map<string, Edge[]> {
  const out = new Map<string, Edge[]>(floors.map((r) => [node(r), []]));
  const link = (from: string[], to: string[], lift?: number): void => {
    for (const a of from) for (const b of to) if (a !== b) out.get(a)!.push({ to: b, lift });
  };
  const both = (group: string[], lift?: number): void => link(group, group, lift);
  lifts.forEach((l, i) => {
    both([deckId(i), ...bottomStop(l).map(id)], i);
    both([deckId(i), ...touching(l.top, l.x, l.x + l.w - 1).map(node)]);
  });
  for (let col = 0; col < grid.width; col++) {
    for (let row = 0; row < grid.height; row++) {
      if (!grid.ladderTop(col, row)) continue;
      let end = row;
      while (grid.at(col, end) === "H") end++;
      both([...touching(row, col, col), ...touching(end, col, col)].map(node));
    }
  }
  for (const r of floors) {
    for (const side of [-1, 1] as const) {
      const c = side < 0 ? r.col - 1 : r.col + r.w;
      link([node(r)], jumps(r, side, maxDrop));
      if (grid.solid(c, r.row - 1)) {
        const step = runAt(r.row - 1, c);
        if (step && !grid.solid(c, r.row - 2)) link([node(r)], [id(step)]);
        continue;
      }
      if (grid.solid(c, r.row) || grid.ladderTop(c, r.row) || lifts.some((l) => l.top === r.row && inShaft(l, c))) continue;
      link([node(r)], landings(c, r.row, maxDrop));
    }
  }
  return out;
}

function reach(g: Map<string, Edge[]>, from: string, without?: number): Set<string> {
  const seen = new Set([from]);
  const todo = [from];
  for (let next = todo.pop(); next !== undefined; next = todo.pop()) {
    for (const { to, lift } of g.get(next)!) {
      if (lift !== undefined && lift === without) continue;
      if (seen.has(to)) continue;
      seen.add(to);
      todo.push(to);
    }
  }
  return seen;
}

describe("sandbox reachability", () => {
  const survivable = graph(fallDeathCells);
  const spawn = id(runAt(world.spawn[1], Math.floor(world.spawn[0]))!);

  it("reaches every floor from the spawn by walking, jumps, ladders, lifts and survivable drops", () => {
    const from = reach(survivable, spawn);
    expect(runs.filter((r) => !from.has(id(r)))).toEqual([]);
  });

  it("gets back to the spawn floor from every floor", () => {
    expect(runs.filter((r) => !reach(survivable, id(r)).has(spawn))).toEqual([]);
  });

  it("joins the two stops of each lift only through that lift", () => {
    lifts.forEach((l, i) => {
      const bottom = bottomStop(l).map(id);
      expect(bottom.length, `lift ${i} bottom stop`).toBeGreaterThan(0);
      const fromTop = reach(survivable, deckId(i), i);
      expect(bottom.filter((b) => fromTop.has(b)), `lift ${i} top to bottom`).toEqual([]);
      for (const b of bottom) expect(reach(survivable, b, i).has(deckId(i)), `lift ${i} bottom to top`).toBe(false);
    });
  });

  it("starts each lift at the stop the spawn reaches without it", () => {
    lifts.forEach((l, i) => {
      expect(l.y).toBe(l.bottom);
      const from = reach(survivable, spawn, i);
      expect(bottomStop(l).some((b) => from.has(id(b))), `lift ${i}`).toBe(true);
    });
  });

  it("gives the lower half at least two lifts, three platforms and a ladder", () => {
    expect(lifts.filter((l) => l.top > 15).length).toBeGreaterThanOrEqual(2);
    expect(runs.filter((r) => r.row > 15 && r.row < 28).length).toBeGreaterThanOrEqual(3);
    expect([...Array(grid.width).keys()].some((c) => grid.ladderTop(c, 21))).toBe(true);
  });

  it("keeps lift shafts apart horizontally", () => {
    const spans = lifts.map((l) => [l.x, l.x + l.w] as const).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < spans.length; i++) expect(spans[i]![0]).toBeGreaterThanOrEqual(spans[i - 1]![1]);
  });
});
