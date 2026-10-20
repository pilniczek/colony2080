import type { MovementConfig } from "../hero/config";
import type { Lift, Prop, SandboxWorld } from "./sandboxLevel";
import type { Run } from "./terrain";

const JUMP_UP = 1;
const STRICT_JUMP_CELLS = 3;
const JUMP_CLEARANCE = 3;

export interface Model {
  maxDrop: number;
  jumpCells: (drop: number) => number;
  blocked: (col: number, from: number, to: number) => boolean;
  landing: (col: number, row: number, from: number) => boolean;
  fromLadders: boolean;
}

export interface Edge {
  to: string;
  lift?: number;
  deck?: number;
  hole?: { lift: number; row: number };
}

export type Graph = Map<string, Edge[]>;

interface Origin {
  run: Run;
  key: string;
}

export interface Ladder {
  col: number;
  top: number;
  end: number;
}

export const stopId = (lift: number, row: number): string => `lift ${lift} ${row}`;
export const id = (r: Run): string => `${r.row},${r.col}`;
export const inShaft = (l: Lift, col: number): boolean => col >= l.x && col < l.x + l.w;
export const stopsAt = (l: Lift, row: number): boolean => l.stops.includes(row);

function standable(run: Run, ok: (col: number) => boolean): Run[] {
  const out: Run[] = [];
  let start = -1;
  for (let col = run.col; col <= run.col + run.w; col++) {
    const on = col < run.col + run.w && ok(col);
    if (on && start < 0) start = col;
    if (!on && start >= 0) {
      out.push(start === run.col && col === run.col + run.w ? run : { row: run.row, col: start, w: col - start });
      start = -1;
    }
  }
  return out;
}

export function reachOf(world: SandboxWorld, cfg: MovementConfig) {
  const { grid, lifts } = world;
  const { fallDeathCells } = cfg;
  const runs: Run[] = [...world.terrain.ledges, ...world.terrain.girders].flatMap((r) =>
    standable(r, (col) => !grid.solid(col, r.row - 1)),
  );
  const decks = new Map<Run, string>(
    lifts.flatMap((l, i) => l.stops.map((row): [Run, string] => [{ row, col: l.x, w: l.w }, stopId(i, row)])),
  );
  const deckOf = new Map(lifts.flatMap((l, i) => l.stops.map((row) => [stopId(i, row), { lift: i, row }] as const)));
  const floors = [...runs, ...decks.keys()];
  const node = (r: Run): string => decks.get(r) ?? id(r);

  const runAt = (row: number, col: number): Run | undefined => runs.find((r) => r.row === row && col >= r.col && col < r.col + r.w);
  const touching = (row: number, c0: number, c1: number): Run[] =>
    floors.filter((r) => r.row === row && r.col <= c1 + 1 && r.col + r.w - 1 >= c0 - 1);
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

  function landings(col: number, from: number, maxDrop: number): string[] {
    const out: string[] = [];
    let land = from + 1;
    while (land < grid.height && !grid.solid(col, land) && !grid.oneWay(col, land)) land++;
    lifts.forEach((l, i) => {
      for (const row of l.stops) {
        if (inShaft(l, col) && row > from && row <= land && row - from <= maxDrop) out.push(stopId(i, row));
      }
    });
    if (land >= grid.height || land - from > maxDrop) return out;
    const under = runAt(land, col);
    return [...out, ...(under ? [id(under)] : touching(land, col, col).map(node))];
  }

  const rowOf = new Map(floors.map((r) => [node(r), r.row]));
  const shaftThrough = (cols: number[], from: number, to: number): number | undefined => {
    const i = lifts.findIndex((l) => to > from && from < l.bottom && to >= l.top && cols.some((c) => inShaft(l, c)));
    return i < 0 ? undefined : i;
  };

  function jumps(r: Run, side: -1 | 1, m: Model): { to: string; cols: number[] }[] {
    const edge = side < 0 ? r.col : r.col + r.w - 1;
    return floors.flatMap((t) => {
      if (t === r || t.row < r.row - JUMP_UP || t.row - r.row > m.maxDrop) return [];
      const near = side < 0 ? t.col + t.w - 1 : t.col;
      const empty = (near - edge) * side - 1;
      if (empty < 0 || empty > m.jumpCells(t.row - r.row)) return [];
      const path = Array.from({ length: empty + 1 }, (_, k) => edge + side * (k + 1));
      if (path.slice(0, -1).some((c) => m.blocked(c, r.row, t.row))) return [];
      if (t.row > r.row && !path.some((c) => clear(c, r.row, t.row - 1))) return [];
      return m.landing(near, t.row, r.row) ? [{ to: node(t), cols: path.slice(0, -1) }] : [];
    });
  }

  function throughFloors(r: Run): Run[] {
    return runs.filter((t) => {
      if (t.row < r.row - JUMP_UP || t.row >= r.row) return false;
      const cols = Array.from({ length: Math.min(r.col + r.w, t.col + t.w) - Math.max(r.col, t.col) }, (_, k) => Math.max(r.col, t.col) + k);
      return cols.some((c) => grid.oneWay(c, t.row) && clear(c, t.row - 2, r.row - 1));
    });
  }

  function ladders(): Ladder[] {
    const out: Ladder[] = [];
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

  function graph(m: Model): Graph {
    const out: Graph = new Map(floors.map((r) => [node(r), []]));
    const link = (from: string[], to: string[], lift?: number): void => {
      for (const a of from) for (const b of to) if (a !== b) out.get(a)!.push({ to: b, ...(lift === undefined ? {} : { lift }) });
    };
    const both = (group: string[], lift?: number): void => link(group, group, lift);
    const leap = (from: string, row: number, to: { to: string; cols: number[] }[], hole?: Edge["hole"]): void => {
      for (const { to: b, cols } of to) {
        if (b === from) continue;
        const deck = deckOf.get(b)?.lift ?? shaftThrough(cols, row, rowOf.get(b)!);
        out.get(from)!.push({ to: b, ...(deck === undefined ? {} : { deck }), ...(hole ? { hole } : {}) });
      }
    };
    const drop = (col: number, row: number, m: Model) => landings(col, row, m.maxDrop).map((to) => ({ to, cols: [col] }));
    const origins: Origin[] = floors.map((run) => ({ run, key: node(run) }));
    lifts.forEach((l, i) => {
      both(l.stops.map((row) => stopId(i, row)), i);
      for (const row of l.stops) both([stopId(i, row), ...touching(row, l.x, l.x + l.w - 1).map(node)]);
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
      link([key], throughFloors(r).map(id));
      for (const side of [-1, 1] as const) {
        const c = side < 0 ? r.col - 1 : r.col + r.w;
        leap(key, r.row, jumps(r, side, m));
        if (grid.solid(c, r.row - 1)) {
          const step = runAt(r.row - 1, c);
          if (step && !grid.solid(c, r.row - 2)) link([key], [id(step)]);
          continue;
        }
        if (grid.solid(c, r.row) || grid.oneWay(c, r.row)) continue;
        const shaft = lifts.findIndex((l) => stopsAt(l, r.row) && inShaft(l, c));
        if (shaft < 0) leap(key, r.row, drop(c, r.row, m));
        else if (!decks.has(r)) leap(key, r.row, drop(c, r.row, m), { lift: shaft, row: r.row });
      }
    }
    return out;
  }

  function reach(g: Graph, from: string, without?: number): Set<string> {
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

  function nodesAt(prop: Prop): string[] {
    const row = prop.y ?? world.spawn[1];
    const reachX = (cfg.box.width + (prop.width ?? 0)) / 2;
    return floors.filter((r) => r.row === row && r.col <= prop.x + reachX && r.col + r.w >= prop.x - reachX).map(node);
  }

  return { runs, floors, decks, deckOf, node, runAt, landings, ladders, jumpCells, strict, generous, graph, reach, nodesAt };
}

export interface Ride {
  row: number;
  col: number;
  ys: number[];
}

export function route(world: SandboxWorld, cfg: MovementConfig, from: Ride, targets: (r: ReturnType<typeof reachOf>) => string[]): Ride | null {
  const r = reachOf(world, cfg);
  const g = r.graph(r.strict);
  const open = world.lifts.map((l) => l.enabledBy === undefined || world.flags.has(l.enabledBy));
  const start = r.floors.find((f) => f.row === from.row && from.col >= f.col && from.col < f.col + f.w);
  if (!start) return null;
  const goal = new Set(targets(r));
  const at0 = { node: r.node(start), ys: from.ys };
  const key = ({ node, ys }: typeof at0): string => `${node}|${ys.join(",")}`;
  const seen = new Set([key(at0)]);
  const todo = [at0];
  for (let at = todo.shift(); at !== undefined; at = todo.shift()) {
    if (goal.has(at.node)) {
      const run = r.floors.find((f) => r.node(f) === at.node)!;
      return { row: run.row, col: run.col, ys: at.ys };
    }
    for (const { to, lift, hole } of g.get(at.node) ?? []) {
      const deck = r.deckOf.get(to);
      if (hole && at.ys[hole.lift] === hole.row) continue;
      let ys = at.ys;
      if (lift !== undefined) {
        if (!open[lift]) continue;
        ys = ys.map((y, i) => (i === lift ? deck!.row : y));
      } else if (deck && at.ys[deck.lift] !== deck.row) continue;
      const next = { node: to, ys };
      if (seen.has(key(next))) continue;
      seen.add(key(next));
      todo.push(next);
    }
  }
  return null;
}
