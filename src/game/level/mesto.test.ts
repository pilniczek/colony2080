import cameraJson from "@config/camera.json";
import { describe, expect, it } from "vitest";
import { createFog, loadFog, seenAt } from "../fog";
import enemies from "@config/levels/mesto/enemies.json";
import map from "@config/levels/mesto/map.json";
import tasks from "@config/levels/mesto/tasks.json";
import { ITEMS } from "../items";
import { cfg, game, run, runUntil, tick, type Game } from "../hero/testWorld";
import { loadMesto, mestoJson } from "./mesto";
import { coverClips } from "./cover";
import { guardHidden } from "./guards";
import { applyBlocks } from "./tasks";

const world = loadMesto();
const { grid, spawn, lifts } = world;

const droids = enemies.enemies.filter((e) => e.type === "chromeDroid");
const flyers = enemies.enemies.filter((e) => e.type === "flyer");

describe("mesto map", () => {
  it("loads 143 x 80", () => {
    expect(grid.width).toBe(143);
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

  it("stops lift 14 at its ends only and starts it at the bottom", () => {
    const lift = lifts.find((l) => l.x === 122)!;
    expect(lift.stops).toEqual([16, 30]);
    expect(lift.y).toBe(30);
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
  const gates = ["trainCarriage", "metroTunnel", "waterPipe", "plasmaBarrier", "acidGuard", "shootGuard"];
  const lights = props.filter((p) => p.id === "metroLight");

  it("places every interactive object once", () => {
    const ids = props.filter((p) => p.kind === "object").map((p) => p.id).sort();
    expect(ids).toEqual([...objects].sort());
    expect([...new Set(props.filter((p) => p.kind === "gate").map((p) => p.id))].sort()).toEqual([...gates, "metroLight"].sort());
  });

  it("draws gate and pillar art up to the ceiling", () => {
    const ceiling = (col: number, floor: number): number => {
      let row = floor - 1;
      while (row >= 0 && map.rows[row]![col] !== "#") row--;
      return row + 1;
    };
    for (const id of ["switchboard", "plasmaBarrier", "cardDoor"]) {
      const p = props.find((q) => q.id === id)!;
      expect(p.y! - (p.art?.top ?? 0), id).toBe(ceiling(Math.floor(p.x), p.y!));
    }
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

  it("shows the dying rebel only once his approach film is due", () => {
    const rebel = props.find((p) => p.id === "dyingRebel")!;
    expect(rebel.shownBy).toBe(rebel.approach!.gives);
  });

  it("drops the controller task for the controller pickup", () => {
    expect(tasks.tasks.map((t) => t.object)).not.toContain("controller");
  });

  it("blocks the task wall cells until the task opens them", () => {
    for (const w of map.taskWalls) {
      const p = props.find((q) => q.id === w.id)!;
      expect(p.solidStates, w.id).toEqual([0]);
      expect(p.cells, w.id).toMatchObject({ col: w.col, row: w.top, h: w.bottom - w.top + 1 });
      expect(grid.solid(w.col, w.bottom), w.id).toBe(true);
    }
  });

  it("opens the ship hull on the first shot or punch, with a film for each", () => {
    const ship = props.find((p) => p.id === "crashedShip")!;
    expect(ship.shootable).toMatchObject({ hits: 1, state: 1, gives: ["flag:hullOpen"], cutscene: { shot: "hullCover", punch: "hullCoverPunch" } });
    expect(typeof ship.shootable!.subtitle).toBe("string");
  });

  it("opens the tunnel wall with the train door only", () => {
    expect(world.tasks.find((t) => t.id === "openTrainDoor")!.sets).toEqual({ metroTunnel: 1 });
    expect(world.tasks.find((t) => t.id === "wireSwitchboard")!.sets).toEqual({ metroLight: 0 });
  });

  it("keeps every metro strip light off until the switchboard is wired", () => {
    expect(lights).toHaveLength(10);
    for (const p of lights) expect(p).toMatchObject({ kind: "gate", asset: "stripLight", state: 1 });
  });
});

describe("mesto train passage", () => {
  const opened = (at: { x: number; y: number }): Game => {
    const g = game(at, mestoJson());
    g.world.immortal = true;
    for (const p of g.world.props) if (p.id === "trainDoor") p.state = 2;
    for (const p of g.world.props) if (p.id === "metroTunnel") p.state = 1;
    applyBlocks(g.world);
    return g;
  };

  it("covers the hero in the always open far door, at the train door only once it is open", () => {
    const g = game(undefined, mestoJson());
    expect(coverClips(g.world.props, 54, 70)).toHaveLength(1);
    expect(coverClips(g.world.props, 61, 70)).toHaveLength(0);
    expect(coverClips(opened({ x: 63, y: 70 }).world.props, 61, 70)).toHaveLength(1);
    expect(coverClips(g.world.props, 52, 70)).toHaveLength(0);
  });

  it("walks the hero through the wall inside the open train", () => {
    const g = opened({ x: 63, y: 70 });
    runUntil(g, (h) => h.x < 53, ["moveLeft"]);
    expect(g.hero.x).toBeLessThan(53);
    expect(g.hero.y).toBe(70);
  });

  it("stops a jumping hero at the train body and keeps a hero inside from jumping", () => {
    const g = opened({ x: 62.5, y: 70 });
    tick(g, ["moveLeft"], ["up"]);
    runUntil(g, (h) => h.onGround && h.state !== "walkJump" && h.state !== "runJump", ["moveLeft"], 3);
    expect([...g.seen].some((state) => state.endsWith("Jump"))).toBe(true);
    expect(g.hero.x).toBeGreaterThan(59.9);
    const inside = opened({ x: 57.5, y: 70 });
    tick(inside, [], ["up"]);
    expect(inside.hero.onGround).toBe(true);
  });

  it("keeps the metro droids out of the train", () => {
    const metro = world.enemies.filter((e) => Math.abs(e.spot[1] - 70) < 1.5 && e.spot[0] > 50 && e.spot[0] < 80);
    expect(metro.length).toBeGreaterThan(0);
    for (const e of metro) {
      expect(e.patrol[0], String(e.spot)).toBeGreaterThan(62.083);
      expect(e.spot[0]).toBeGreaterThanOrEqual(e.patrol[0]);
    }
  });
});

describe("mesto acid guard", () => {
  const guardOf = (g: Game) => g.world.props.find((p) => p.id === "acidGuard")!;

  const onDeckEdge = 107 - cfg.box.width / 2;
  const offLift = onDeckEdge + 0.05;
  const atWall = 109 - cfg.box.width / 2;

  it("leaves a hero on the lift deck alone", () => {
    const g = game({ x: onDeckEdge, y: 30 }, mestoJson());
    run(g, 1);
    expect(g.hero.energy).toBe(cfg.energy.max);
  });

  it("hits a hero stepping off the lift once for 5 energy and pushes him back a cell", () => {
    const g = game({ x: offLift, y: 30 }, mestoJson());
    tick(g);
    expect(g.hero.energy).toBe(cfg.energy.max - 5 * cfg.energy.hit);
    expect(g.hero.x).toBeCloseTo(offLift - 1);
    expect(guardOf(g).fireTime).toBeGreaterThanOrEqual(0);
    run(g, 1);
    expect(g.hero.energy).toBe(cfg.energy.max - 5 * cfg.energy.hit);
  });

  it("keeps a hero walking into it out", () => {
    const g = game({ x: 105.5, y: 30 }, mestoJson());
    run(g, 3, ["moveRight"]);
    expect(g.hero.x).toBeLessThanOrEqual(atWall);
    expect(g.hero.energy).toBeLessThan(cfg.energy.max);
  });

  it("hides until the hero first steps off the lift, then comes in a film once", () => {
    const g = game({ x: offLift, y: 30 }, mestoJson());
    expect(guardHidden(guardOf(g), g.world.flags)).toBe(true);
    tick(g);
    expect(g.world.cutscene?.id).toBe("acidGuardComes");
    expect(guardHidden(guardOf(g), g.world.flags)).toBe(false);
    g.world.cutscene = null;
    run(g, 1.5);
    g.hero.x = offLift;
    tick(g);
    expect(g.world.cutscene).toBeNull();
    expect(g.hero.energy).toBe(cfg.energy.max - 10 * cfg.energy.hit);
  });

  it("lets the hero see past it from the lift deck, hidden or not", () => {
    for (const shown of [false, true]) {
      const g = game({ x: onDeckEdge, y: 30 }, mestoJson());
      if (shown) g.world.flags.add(guardOf(g).shownBy!);
      g.world.fog = createFog(loadFog(cameraJson), cfg, g.hero, g.world.grid);
      expect(seenAt(g.world.fog, 113, 28)).toBe(true);
    }
  });

  it("does nothing once wrecked", () => {
    const g = game({ x: offLift, y: 30 }, mestoJson());
    guardOf(g).state = 1;
    tick(g);
    expect(g.hero.energy).toBe(cfg.energy.max);
    expect(g.hero.x).toBe(offLift);
  });

  it("takes no damage from hero shots", () => {
    const g = game({ x: 104.5, y: 30, weapon: "gun" }, mestoJson());
    g.hero.facing = 1;
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.5, ["shoot"]);
    expect(guardOf(g).state).toBe(0);
  });
});

describe("mesto shoot guard", () => {
  const guardOf = (g: Game) => g.world.props.find((p) => p.id === "shootGuard")!;

  it("blocks the way to the crane key while it stands", () => {
    expect(grid.solid(25, 14)).toBe(true);
    expect(grid.solid(26, 14)).toBe(true);
  });

  it("fires bursts at a hero on its right and hurts him", () => {
    const g = game({ x: 30.5, y: 16 }, mestoJson());
    tick(g);
    expect(g.hero.energy).toBe(cfg.energy.max - cfg.energy.hit);
    run(g, 1);
    expect(g.hero.energy).toBeLessThan(cfg.energy.max);
  });

  it("shrugs off hero shots", () => {
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
