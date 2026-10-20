import { describe, expect, it } from "vitest";
import enemies from "@config/levels/mesto/enemies.json";
import map from "@config/levels/mesto/map.json";
import tasks from "@config/levels/mesto/tasks.json";
import { ITEMS } from "../items";
import { cfg, game, run, tick, type Game } from "../hero/testWorld";
import { ENEMY_SHOT } from "./enemy";
import { loadMesto, mestoJson } from "./mesto";
import { terrain } from "./terrain";

const world = loadMesto();
const { grid, spawn, lifts } = world;

const droids = enemies.enemies.filter((e) => e.type === "chromeDroid");
const flyers = enemies.enemies.filter((e) => e.type === "flyer");

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

  it("places 27 droids and 17 flyers that never respawn", () => {
    expect(droids).toHaveLength(27);
    expect(flyers).toHaveLength(17);
    expect(world.enemies.filter((e) => !e.flight)).toHaveLength(27);
    expect(world.enemies.filter((e) => e.flight)).toHaveLength(17);
    expect(world.enemies.every((e) => e.respawnMs === null)).toBe(true);
  });

  it("takes the flyer cells and patrols from the research list over the plank row of their floor", () => {
    expect(map.flyers).toEqual(flyers.map((f) => ({ cell: f.cell, patrol: f.patrol, floor: f.engine.y! + 6 })));
  });

  it("hovers every flyer above a floor, in the air, at its column", () => {
    const placed = world.enemies.filter((e) => e.flight);
    map.flyers.forEach((f, i) => {
      const e = placed[i]!;
      expect(e.body.x).toBe(f.cell[0]! + 0.5);
      expect(e.spot[1]).toBe(f.floor);
      expect(grid.solid(f.cell[0]!, f.floor)).toBe(true);
      expect(grid.solid(f.cell[0]!, Math.floor(e.body.y))).toBe(false);
      expect(e.patrol[0]).toBeLessThanOrEqual(e.body.x);
      expect(e.patrol[1]).toBeGreaterThanOrEqual(e.body.x);
    });
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
  const gates = ["metroTunnel", "waterPipe", "plasmaBarrier", "acidGuard", "shootGuard"];

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
    expect(props.filter((p) => p.kind === "weapon")).toMatchObject([{ kind: "weapon", weapon: "blaster", x: 40.5, y: 75 }]);
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

describe("mesto acid guard", () => {
  const shots = (g: Game) => g.world.projectiles.filter((p) => p.tag === ENEMY_SHOT);
  const guardOf = (g: Game) => g.world.props.find((p) => p.id === "acidGuard")!;

  it("fires bursts at a hero it sees on its floor and hurts him", () => {
    const g = game({ x: 101.5, y: 30 }, mestoJson());
    run(g, 1);
    expect(g.hero.energy).toBeLessThan(cfg.energy.max);
  });

  it("starts its burst at once with a bullet from its cannon", () => {
    const g = game({ x: 101.5, y: 30 }, mestoJson());
    tick(g);
    expect(shots(g).length + g.world.sparks.length).toBeGreaterThan(0);
    expect(guardOf(g).fireTime).toBe(0);
  });

  it("ignores a hidden hero, a hero out of sight and fires no more once wrecked", () => {
    const hidden = game({ x: 101.5, y: 30, state: "hide" }, mestoJson());
    hidden.hero.hidden = true;
    const far = game({ x: 108.5 - cfg.sightCells - 1.5, y: 30 }, mestoJson());
    const wrecked = game({ x: 101.5, y: 30 }, mestoJson());
    guardOf(wrecked).state = 1;
    for (let i = 0; i < 30; i++) {
      tick(hidden, ["hide"]);
      tick(far);
      tick(wrecked);
    }
    for (const g of [hidden, far, wrecked]) {
      expect(shots(g)).toHaveLength(0);
      expect(g.hero.energy).toBe(cfg.energy.max);
    }
  });

  it("takes no damage from hero bullets", () => {
    const g = game({ x: 104.5, y: 30, weapon: "gun" }, mestoJson());
    g.hero.facing = 1;
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.5, ["shoot"]);
    expect(guardOf(g).state).toBe(0);
  });
});

describe("mesto shoot guard", () => {
  const shots = (g: Game) => g.world.projectiles.filter((p) => p.tag === ENEMY_SHOT);
  const guardOf = (g: Game) => g.world.props.find((p) => p.id === "shootGuard")!;

  it("blocks the way to the crane key while it stands", () => {
    expect(grid.solid(25, 14)).toBe(true);
    expect(grid.solid(26, 14)).toBe(true);
  });

  it("fires bursts at a hero on its right and hurts him", () => {
    const g = game({ x: 30.5, y: 16 }, mestoJson());
    tick(g);
    expect(shots(g).length + g.world.sparks.length).toBeGreaterThan(0);
    run(g, 1);
    expect(g.hero.energy).toBeLessThan(cfg.energy.max);
  });

  it("shrugs off hero bullets", () => {
    const g = game({ x: 30.5, y: 16, weapon: "gun", state: "hide" }, mestoJson());
    g.hero.facing = -1;
    g.hero.hidden = false;
    Object.assign(g.hero, { state: "idle" });
    guardOf(g).fires!.states = [];
    tick(g, ["shoot"], ["shoot"]);
    run(g, 1, ["shoot"]);
    expect(guardOf(g).hitsTaken ?? 0).toBe(0);
    expect(guardOf(g).state).toBe(0);
  });

  it("falls to the E-Blaster beam, explodes and frees the way", () => {
    const g = game({ x: 28.5, y: 16, weapon: "blaster" }, mestoJson());
    g.hero.blaster = 400;
    g.hero.facing = -1;
    guardOf(g).fires!.states = [];
    tick(g, ["shoot"], ["shoot"]);
    for (let i = 0; i < 4 / (1 / 60) && guardOf(g).state === 0; i++) tick(g, ["shoot"]);
    expect(guardOf(g).state).toBe(1);
    expect(g.world.grid.solid(25, 14)).toBe(false);
    expect(guardOf(g).brokenAge).toBeGreaterThanOrEqual(0);
  });
});
