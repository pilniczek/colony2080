import movementJson from "@config/hero/movement.json";
import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { loadMovement } from "../hero/config";
import { loadSandbox, type Lift } from "./sandboxLevel";
import type { Run } from "./terrain";

const world = loadSandbox(sandbox);
const { grid, lifts } = world;
const cfg = loadMovement(movementJson);
const { fallDeathCells } = cfg;
const JUMP_UP = 1;
const STRICT_JUMP_CELLS = 3;
const JUMP_CLEARANCE = 3;
const PROBED_JUMP_CELLS: [number, number][] = [[-1, 3], [0, 4], [3, 6], [7, 7]];

type Stop = "top" | "bottom";

const runs: Run[] = [...world.terrain.ledges, ...world.terrain.girders];
const decks = new Map<Run, string>(
  lifts.flatMap((l, i) => (["top", "bottom"] as const).map((stop): [Run, string] => [{ row: l[stop], col: l.x, w: l.w }, stopId(i, stop)])),
);
const floors = [...runs, ...decks.keys()];
const id = (r: Run): string => `${r.row},${r.col}`;
function stopId(lift: number, stop: Stop): string {
  return `lift ${lift} ${stop}`;
}
const node = (r: Run): string => decks.get(r) ?? id(r);
const deckOf = new Map(lifts.flatMap((_, i) => [[stopId(i, "top"), i] as const, [stopId(i, "bottom"), i] as const]));

const inShaft = (l: Lift, col: number): boolean => col >= l.x && col < l.x + l.w;
const runAt = (row: number, col: number): Run | undefined => runs.find((r) => r.row === row && col >= r.col && col < r.col + r.w);
const touching = (row: number, c0: number, c1: number): Run[] =>
  floors.filter((r) => r.row === row && r.col <= c1 + 1 && r.col + r.w - 1 >= c0 - 1);
const stopsAt = (l: Lift, row: number): boolean => l.top === row || l.bottom === row;
const clear = (col: number, top: number, bottom: number): boolean => {
  for (let row = top; row <= bottom; row++) if (grid.solid(col, row)) return false;
  return true;
};

function fallTime(height: number): number {
  const capTime = cfg.maxFallSpeed / cfg.gravity;
  const capHeight = (cfg.gravity * capTime ** 2) / 2;
  return height <= capHeight ? Math.sqrt((2 * height) / cfg.gravity) : capTime + (height - capHeight) / cfg.maxFallSpeed;
}

const jumpCells = (drop: number): number => {
  const air = Math.sqrt((2 * cfg.jump.runHeight) / cfg.gravity) + fallTime(cfg.jump.runHeight + drop);
  return Math.floor(cfg.jump.runSpeed * air + cfg.box.width + 1);
};

interface Model {
  maxDrop: number;
  jumpCells: (drop: number) => number;
  blocked: (col: number, from: number, to: number) => boolean;
  landing: (col: number, row: number, from: number) => boolean;
  fromLadders: boolean;
}

const strict: Model = {
  maxDrop: fallDeathCells,
  jumpCells: () => STRICT_JUMP_CELLS,
  blocked: (col, from, to) => !clear(col, Math.min(from, to) - JUMP_CLEARANCE, Math.max(from, to) - 1),
  landing: (col, row, from) => clear(col, Math.min(from, row) - JUMP_CLEARANCE, row - 1),
  fromLadders: false,
};

const generous: Model = {
  maxDrop: fallDeathCells,
  jumpCells,
  blocked: (col, from) => grid.solid(col, from - 1) && grid.solid(col, from - 2),
  landing: () => true,
  fromLadders: true,
};

interface Edge {
  to: string;
  lift?: number;
  deck?: number;
}

interface Origin {
  run: Run;
  key: string;
}

function landings(col: number, from: number, maxDrop: number): string[] {
  const out: string[] = [];
  let land = from + 1;
  while (land < grid.height && !grid.solid(col, land) && !grid.ladderTop(col, land)) land++;
  lifts.forEach((l, i) => {
    for (const stop of ["top", "bottom"] as const) {
      if (inShaft(l, col) && l[stop] > from && l[stop] <= land && l[stop] - from <= maxDrop) out.push(stopId(i, stop));
    }
  });
  if (land >= grid.height || land - from > maxDrop) return out;
  const under = runAt(land, col);
  return [...out, ...(under ? [id(under)] : touching(land, col, col).map(node))];
}

function jumps(r: Run, side: -1 | 1, m: Model): string[] {
  const edge = side < 0 ? r.col : r.col + r.w - 1;
  return floors
    .filter((t) => t !== r && t.row >= r.row - JUMP_UP && t.row - r.row <= m.maxDrop)
    .filter((t) => {
      const near = side < 0 ? t.col + t.w - 1 : t.col;
      const empty = (near - edge) * side - 1;
      if (empty < 0 || empty > m.jumpCells(t.row - r.row)) return false;
      const path = Array.from({ length: empty + 1 }, (_, k) => edge + side * (k + 1));
      if (path.slice(0, -1).some((c) => m.blocked(c, r.row, t.row))) return false;
      if (t.row > r.row && !path.some((c) => clear(c, r.row, t.row - 1))) return false;
      return m.landing(near, t.row, r.row);
    })
    .map(node);
}

function ladders(): { col: number; top: number; end: number }[] {
  const out: { col: number; top: number; end: number }[] = [];
  for (let col = 0; col < grid.width; col++) {
    for (let top = 0; top < grid.height; top++) {
      if (!grid.ladderTop(col, top)) continue;
      let end = top;
      while (grid.at(col, end) === "H") end++;
      out.push({ col, top, end });
    }
  }
  return out;
}

function graph(m: Model): Map<string, Edge[]> {
  const out = new Map<string, Edge[]>(floors.map((r) => [node(r), []]));
  const link = (from: string[], to: string[], lift?: number): void => {
    for (const a of from) for (const b of to) if (a !== b) out.get(a)!.push({ to: b, lift });
  };
  const both = (group: string[], lift?: number): void => link(group, group, lift);
  const leap = (from: string, to: string[]): void => {
    for (const b of to) if (b !== from) out.get(from)!.push({ to: b, deck: deckOf.get(b) });
  };
  const origins: Origin[] = floors.map((run) => ({ run, key: node(run) }));
  lifts.forEach((l, i) => {
    both([stopId(i, "top"), stopId(i, "bottom")], i);
    for (const stop of ["top", "bottom"] as const) both([stopId(i, stop), ...touching(l[stop], l.x, l.x + l.w - 1).map(node)]);
  });
  for (const { col, top, end } of ladders()) {
    const group = [...touching(top, col, col), ...touching(end, col, col)].map(node);
    both(group);
    if (!m.fromLadders) continue;
    for (let row = top; row < end; row++) {
      const key = `ladder ${col},${row}`;
      out.set(key, []);
      link(group, [key]);
      origins.push({ run: { row, col, w: 1 }, key });
    }
  }
  for (const { run: r, key } of origins) {
    for (const side of [-1, 1] as const) {
      const c = side < 0 ? r.col - 1 : r.col + r.w;
      leap(key, jumps(r, side, m));
      if (grid.solid(c, r.row - 1)) {
        const step = runAt(r.row - 1, c);
        if (step && !grid.solid(c, r.row - 2)) link([key], [id(step)]);
        continue;
      }
      if (grid.solid(c, r.row) || grid.ladderTop(c, r.row) || lifts.some((l) => stopsAt(l, r.row) && inShaft(l, c))) continue;
      leap(key, landings(c, r.row, m.maxDrop));
    }
  }
  return out;
}

function reach(g: Map<string, Edge[]>, from: string, without?: number): Set<string> {
  const seen = new Set([from]);
  const todo = [from];
  for (let next = todo.pop(); next !== undefined; next = todo.pop()) {
    for (const { to, lift, deck } of g.get(next)!) {
      if (without !== undefined && (lift === without || deck === without)) continue;
      if (seen.has(to)) continue;
      seen.add(to);
      todo.push(to);
    }
  }
  return seen;
}

describe("sandbox reachability", () => {
  const conservative = graph(strict);
  const permissive = graph(generous);
  const spawn = id(runAt(world.spawn[1], Math.floor(world.spawn[0]))!);

  it("bounds the generous jump by the probed run jump reach", () => {
    for (const [drop, cells] of PROBED_JUMP_CELLS) expect(jumpCells(drop), `drop ${drop}`).toBeGreaterThanOrEqual(cells);
  });

  it("reaches every floor from the spawn by walking, short jumps, ladders, lifts and survivable drops", () => {
    const from = reach(conservative, spawn);
    expect(runs.filter((r) => !from.has(id(r)))).toEqual([]);
  });

  it("gets back to the spawn floor from every floor", () => {
    expect(runs.filter((r) => !reach(conservative, id(r)).has(spawn))).toEqual([]);
  });

  it("joins the two stops of each lift only through that lift, counting long jumps and ladder drop-offs", () => {
    lifts.forEach((l, i) => {
      expect(reach(permissive, stopId(i, "top"), i).has(stopId(i, "bottom")), `lift ${i} top to bottom`).toBe(false);
      expect(reach(permissive, stopId(i, "bottom"), i).has(stopId(i, "top")), `lift ${i} bottom to top`).toBe(false);
    });
  });

  it("starts each lift at the stop the spawn reaches without it", () => {
    lifts.forEach((l, i) => {
      const json = sandbox.lifts[i]!;
      const start: Stop = "start" in json && json.start === "top" ? "top" : "bottom";
      expect(l.y).toBe(l[start]);
      expect(reach(conservative, spawn, i).has(stopId(i, start)), `lift ${i}`).toBe(true);
    });
  });

  it("changes floors in the lower half only by lift, with no survivable drop off any edge", () => {
    for (const r of runs.filter((run) => run.row > 15)) {
      for (const c of [r.col - 1, r.col + r.w]) {
        if (grid.solid(c, r.row - 1) || grid.solid(c, r.row) || lifts.some((l) => stopsAt(l, r.row) && inShaft(l, c))) continue;
        expect(landings(c, r.row, fallDeathCells), `${id(r)} edge ${c}`).toEqual([]);
      }
    }
  });

  it("keeps ladders rare: the original one plus at most one in the lower half", () => {
    const all = ladders();
    expect(all.filter((l) => l.top < 16)).toEqual([{ col: 3, top: 4, end: 14 }]);
    expect(all.filter((l) => l.top >= 16).length).toBeLessThanOrEqual(1);
  });

  it("gives the lower half at least two lifts and three platforms", () => {
    expect(lifts.filter((l) => l.bottom > 15).length).toBeGreaterThanOrEqual(2);
    expect(runs.filter((r) => r.row > 15 && r.row < 28).length).toBeGreaterThanOrEqual(3);
  });

  it("leaves room for three enemy patrols of six flat cells off lift decks in the lower half", () => {
    const stretches = runs
      .filter((r) => r.row > 15)
      .flatMap((r) => {
        const out: number[] = [];
        let len = 0;
        for (let c = r.col; c <= r.col + r.w; c++) {
          const free = c < r.col + r.w && !lifts.some((l) => stopsAt(l, r.row) && inShaft(l, c));
          if (free) len++;
          if (free || !len) continue;
          out.push(len);
          len = 0;
        }
        return out;
      });
    expect(stretches.filter((len) => len >= 6).length).toBeGreaterThanOrEqual(3);
  });

  it("puts the E-Blaster on a floor the spawn reaches, off the right strip and every lift deck", () => {
    const prop = world.props.find((p) => p.kind === "weapon")!;
    const row = prop.y ?? world.spawn[1];
    const col = Math.floor(prop.x);
    const floor = runAt(row, col);
    expect(floor).toBeDefined();
    expect(reach(conservative, spawn).has(id(floor!))).toBe(true);
    expect(col < 40).toBe(true);
    expect(lifts.some((l) => stopsAt(l, row) && inShaft(l, col))).toBe(false);
  });

  it("keeps lift shafts apart horizontally", () => {
    const spans = lifts.map((l) => [l.x, l.x + l.w] as const).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < spans.length; i++) expect(spans[i]![0]).toBeGreaterThanOrEqual(spans[i - 1]![1]);
  });
});
