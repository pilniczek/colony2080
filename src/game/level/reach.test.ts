import movementJson from "@config/hero/movement.json";
import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { loadMovement } from "../hero/config";
import { game, RUNNING, run, tick } from "../hero/testWorld";
import { loadMesto, mestoJson } from "./mesto";
import { id, inShaft, reachOf, stopId, stopsAt } from "./reach";
import { loadSandbox, type SandboxWorld } from "./sandboxLevel";

const PROBED_JUMP_CELLS: [number, number][] = [[-1, 3], [0, 4], [3, 6], [7, 7]];
const cfg = loadMovement(movementJson);
const { fallDeathCells } = cfg;
const world = loadSandbox(sandbox);
const { grid, lifts } = world;
const { runs, runAt, landings, ladders, jumpCells, strict, generous, graph, reach } = reachOf(world, cfg);

type Stop = "top" | "bottom";

function liftBypasses(w: SandboxWorld): string[] {
  const r = reachOf(w, cfg);
  const g = r.graph(r.generous);
  return w.lifts.flatMap((l, i) =>
    l.stops.flatMap((a) =>
      l.stops.filter((b) => b !== a && r.reach(g, stopId(i, a), i).has(stopId(i, b))).map((b) => `lift ${i} ${a} to ${b}`),
    ),
  );
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
      expect(reach(permissive, stopId(i, l.top), i).has(stopId(i, l.bottom)), `lift ${i} top to bottom`).toBe(false);
      expect(reach(permissive, stopId(i, l.bottom), i).has(stopId(i, l.top)), `lift ${i} bottom to top`).toBe(false);
    });
  });

  it("starts each lift at the stop the spawn reaches without it", () => {
    lifts.forEach((l, i) => {
      const json = sandbox.lifts[i]!;
      const start: Stop = "start" in json && json.start === "top" ? "top" : "bottom";
      expect(l.y).toBe(l[start]);
      expect(reach(conservative, spawn, i).has(stopId(i, l[start])), `lift ${i}`).toBe(true);
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

describe("lift reach rule", () => {
  it("joins the stops of each sandbox lift only through that lift", () => {
    expect(liftBypasses(world)).toEqual([]);
  });

  it("joins the stops of each mesto lift only through that lift, deadly shaft drops aside", () => {
    expect(liftBypasses(loadMesto())).toEqual([]);
  });

  it("lets the hero out of each mesto shaft floor pit with a running jump while the deck is away", () => {
    const mesto = loadMesto();
    const pits = mesto.lifts.filter((l) => Array.from({ length: l.w }, (_, k) => mesto.grid.at(l.x + k, l.bottom + 1)).every((c) => c === "|"));
    expect(pits.map((l) => [l.x, l.bottom + 1])).toEqual([[33, 31], [52, 17]]);
    for (const pit of pits) {
      for (let k = 0; k < pit.w; k++) {
        for (const dir of ["moveLeft", "moveRight"]) {
          const g = game({ x: pit.x + k + 0.5, y: pit.bottom + 1 }, mestoJson());
          g.world.lifts.find((l) => l.x === pit.x)!.y = pit.top;
          run(g, 0.3);
          const held = [dir, RUNNING];
          for (let i = 0; i < 3; i++) tick(g, held);
          tick(g, held, ["up"]);
          run(g, 1.5, held);
          expect(g.hero.y, `lift ${pit.x} col ${pit.x + k} ${dir}`).toBe(pit.bottom);
        }
      }
    }
  });
});
