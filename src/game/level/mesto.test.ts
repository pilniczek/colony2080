import { describe, expect, it } from "vitest";
import enemies from "@config/levels/mesto/enemies.json";
import map from "@config/levels/mesto/map.json";
import tasks from "@config/levels/mesto/tasks.json";
import { ITEMS } from "../items";
import { loadMesto } from "./mesto";
import { terrain } from "./terrain";

const world = loadMesto();
const { grid, spawn, lifts } = world;

const droids = enemies.enemies.filter((e) => e.type === "chromeDroid");

describe("mesto map", () => {
  it("loads 160 x 80", () => {
    expect(grid.width).toBe(160);
    expect(grid.height).toBe(80);
  });

  it("loads the task web", () => {
    expect(world.tasks.map((t) => t.id)).toContain("repairCrane");
  });

  it("spawns on a floor", () => {
    expect(spawn).toEqual([62.5, 59]);
    expect(grid.solid(Math.floor(spawn[0]), spawn[1])).toBe(true);
    expect(grid.solid(Math.floor(spawn[0]), spawn[1] - 1)).toBe(false);
  });

  it("has floors every 7 rows", () => {
    for (const row of [16, 23, 30, 37, 44, 51, 59]) {
      expect(Array.from({ length: grid.width }, (_, col) => grid.solid(col, row)).some(Boolean)).toBe(true);
    }
  });

  it("keeps every lift deck inside the map", () => {
    expect(lifts).toHaveLength(15);
    for (const lift of lifts) {
      expect(lift.x).toBeGreaterThanOrEqual(0);
      expect(lift.x + lift.w).toBeLessThanOrEqual(grid.width);
      expect(lift.top).toBeGreaterThan(0);
      expect(lift.bottom).toBeLessThan(grid.height);
      expect(lift.stops).toContain(lift.y);
    }
  });

  it("keeps every lift shaft open from above its top stop down to its bottom stop", () => {
    for (const lift of lifts) {
      for (let row = lift.top - 2; row <= lift.bottom; row++) {
        for (let col = lift.x; col < lift.x + lift.w; col++) expect(grid.at(col, row), `${col},${row}`).toBe(".");
      }
    }
  });

  it("stops lift 14 on three floors and starts it at the bottom", () => {
    const lift = lifts.find((l) => l.x === 122)!;
    expect(lift.stops).toEqual([16, 23, 30]);
    expect(lift.y).toBe(30);
  });

  it("closes every floor end with a wall or an invisible blocker", () => {
    const shaft = (col: number, row: number): boolean => lifts.some((l) => l.top <= row && row <= l.bottom && col >= l.x && col < l.x + l.w);
    for (const row of [10, 16, 23, 30, 37, 41, 44, 51, 59, 70, 75]) {
      for (let col = 1; col < grid.width - 1; col++) {
        if (!grid.wall(col, row) || grid.solid(col, row - 1)) continue;
        for (const next of [col - 1, col + 1]) {
          if (grid.solid(next, row) || shaft(next, row)) continue;
          expect(grid.solid(next, row - 1), `${next},${row - 1}`).toBe(true);
        }
      }
    }
  });

  it("runs every wall column up to the floor above", () => {
    const liftFloor = (col: number, row: number): boolean => lifts.some((l) => l.bottom === row && col >= l.x && col < l.x + l.w);
    const short: string[] = [];
    for (const wall of terrain(grid).walls.filter((w) => w.h > 1)) {
      for (let col = wall.col; col < wall.col + wall.w; col++) {
        const floorAbove = Array.from({ length: wall.row }, (_, row) => grid.wall(col, row)).some(Boolean);
        if (floorAbove && !grid.wall(col, wall.row - 1) && !liftFloor(col, wall.row - 1)) short.push(`${col},${wall.row}`);
      }
    }
    expect(short).toEqual([]);
  });

  it("leaves task walls out of the grid on a walkable plank", () => {
    expect(map.taskWalls.map((w) => w.id).sort()).toEqual(["cardDoor", "metroTunnel", "plasmaBarrier", "waterPipe"]);
    for (const w of map.taskWalls) {
      expect(grid.wall(w.col, w.bottom + 1)).toBe(true);
      for (let row = w.top; row <= w.bottom; row++) expect(grid.at(w.col, row)).toBe(".");
    }
  });

  it("places 27 droids, no flyers", () => {
    expect(droids).toHaveLength(27);
    expect(world.enemies).toHaveLength(27);
    expect(world.enemies.every((e) => e.respawnMs === null)).toBe(true);
  });

  it("takes the droid cells and patrols from the research list", () => {
    expect(map.droids).toEqual(droids.map((d) => ({ cell: d.cell, patrol: d.patrol })));
  });

  it("stands every droid on a floor", () => {
    const off = droids.filter((d) => !grid.solid(d.cell[0]!, d.cell[1]! + 1) || grid.solid(d.cell[0]!, d.cell[1]!)).map((d) => d.id);
    expect(off).toEqual([]);
  });
});

describe("mesto props", () => {
  const { props } = world;
  const objects = ["dyingRebel", "wireBox", "switchboard", "trainDoor", "tapValveWheel", "corpse", "barDoor", "crashedShip", "codeLock", "damagedLift", "acidTank", "cardDoor", "crane"];
  const gates = ["metroTunnel", "waterPipe", "plasmaBarrier"];

  it("places every interactive object once", () => {
    const ids = props.filter((p) => p.kind === "object").map((p) => p.id).sort();
    expect(ids).toEqual([...objects].sort());
    expect(props.filter((p) => p.kind === "gate").map((p) => p.id).sort()).toEqual([...gates].sort());
  });

  it("places the map items at their original cells", () => {
    const items = Object.fromEntries(props.filter((p) => p.kind === "item" && !p.shownBy).map((p) => [p.item, [p.x, p.y]]));
    expect(items).toEqual({ crowbar: [24.5, 44], controller: [111.5, 51], craneKey: [20.5, 16] });
  });

  it("names a known item on every item prop", () => {
    for (const p of props.filter((q) => q.kind === "item")) expect(ITEMS[p.item!], p.item).toBeDefined();
  });

  it("finds a prop for every task object", () => {
    const ids = new Set(props.map((p) => p.id));
    for (const t of tasks.tasks) expect(ids.has(t.object), t.object).toBe(true);
    for (const t of tasks.tasks) for (const id of Object.keys((t as { sets?: object }).sets ?? {})) expect(ids.has(id), id).toBe(true);
  });

  it("puts the E-Blaster at its original cell on the metro floor", () => {
    expect(props.filter((p) => p.kind === "weapon")).toEqual([{ kind: "weapon", weapon: "blaster", x: 40.5, y: 75 }]);
  });

  it("drops the ship part in front of the ship once the hull cover is off", () => {
    const part = props.find((p) => p.item === "shipPart")!;
    expect(part).toMatchObject({ kind: "item", y: 41, shownBy: "flag:hullOpen" });
    expect(Math.abs(part.x - props.find((p) => p.id === "crashedShip")!.x)).toBeLessThanOrEqual(2);
  });

  it("drops the controller task for the controller pickup", () => {
    expect(tasks.tasks.map((t) => t.object)).not.toContain("controller");
  });

  it("stands every prop on a floor", () => {
    const off = props.filter((p) => p.y === undefined || !grid.wall(Math.floor(p.x), p.y) || grid.wall(Math.floor(p.x), p.y - 1));
    expect(off.map((p) => p.id ?? p.item)).toEqual([]);
  });

  it("blocks the task wall cells until the task opens them", () => {
    for (const w of map.taskWalls) {
      const p = props.find((q) => q.id === w.id)!;
      expect(p.solidStates, w.id).toEqual([0]);
      expect(p.cells, w.id).toEqual({ col: w.col, row: w.top, w: 1, h: w.bottom - w.top + 1 });
      expect(grid.solid(w.col, w.bottom), w.id).toBe(true);
    }
  });

  it("opens the ship hull by gunfire", () => {
    const ship = props.find((p) => p.id === "crashedShip")!;
    expect(ship.shootable).toMatchObject({ hits: 7, state: 1, gives: ["flag:hullOpen"] });
    expect(typeof ship.shootable!.subtitle).toBe("string");
  });
});
