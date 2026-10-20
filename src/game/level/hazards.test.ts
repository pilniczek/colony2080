import { describe, expect, it } from "vitest";
import { isDead } from "../hero/hero";
import { cfg, game, run, runUntil, tick } from "../hero/testWorld";
import { loadSandbox } from "./sandboxLevel";
import { conveyorVx, fallLimit } from "./hazards";

const WIDTH = 20;
const open = `#${".".repeat(WIDTH - 2)}#`;
const solid = "#".repeat(WIDTH);

function level(extra: object = {}, rows: string[] = [...Array<string>(8).fill(open), solid, solid]) {
  return { rows, spawn: [3.5, 8], sky: "skyBackground", backdrop: [], dressing: [], lifts: [], enemies: [], props: [], ...extra };
}

const ledge = `#${"#".repeat(4)}${".".repeat(WIDTH - 6)}#`;
const tower = [...Array<string>(4).fill(open), ledge, ...Array<string>(20).fill(open), solid, solid];

describe("fall limit", () => {
  it("reads the hero config when the world leaves it out and Infinity for null", () => {
    expect(fallLimit(loadSandbox(level()), cfg)).toBe(cfg.fallDeathCells);
    expect(fallLimit(loadSandbox(level({ fallDeathCells: null })), cfg)).toBe(Infinity);
    expect(fallLimit(loadSandbox(level({ fallDeathCells: 3 })), cfg)).toBe(3);
  });

  it("null fallDeathCells survives a 20 row drop", () => {
    const g = game({ x: 4.5, y: 4 }, level({ fallDeathCells: null }, tower));
    runUntil(g, (h) => h.x > 6, ["moveRight"]);
    runUntil(g, (h) => h.onGround);
    run(g, 0.5);
    expect(g.hero.y).toBe(25);
    expect(isDead(g.hero.state)).toBe(false);
  });

  it("missing fallDeathCells keeps the config limit", () => {
    const g = game({ x: 4.5, y: 4 }, level({}, tower));
    runUntil(g, (h) => h.x > 6, ["moveRight"]);
    runUntil(g, (h) => h.onGround);
    expect(g.hero.state).toBe("fallDeath");
  });
});

describe("hazards", () => {
  const lava = { id: "lava", kind: "death", col: 8, row: 7, w: 4, h: 1 };

  it("death hazard kills a hero whose centre and foot cell are inside it", () => {
    const g = game({ x: 9.5, y: 8 }, level({ hazards: [lava] }));
    tick(g);
    expect(isDead(g.hero.state)).toBe(true);
    expect(g.events).toContainEqual({ kind: "died", x: 9.5, y: 8, reason: "hazard" });
  });

  it("misses a hero whose centre is outside the rect", () => {
    const g = game({ x: 7.9, y: 8 }, level({ hazards: [lava] }));
    run(g, 0.5);
    expect(isDead(g.hero.state)).toBe(false);
  });

  it("standing on the floor directly under a death rect does not kill", () => {
    const g = game({ x: 9.5, y: 8 }, level({ hazards: [{ ...lava, row: 5, h: 2 }] }));
    run(g, 0.5);
    expect(isDead(g.hero.state)).toBe(false);
  });

  it("dropping into a death rect kills", () => {
    const shelf = `#${".".repeat(WIDTH - 2)}#`.split("");
    shelf[9] = "#";
    const rows = [...Array<string>(4).fill(open), shelf.join(""), open, open, open, solid, solid];
    const g = game({ x: 9.5, y: 4 }, level({ hazards: [{ ...lava, row: 5, h: 2 }] }, rows));
    run(g, 0.2);
    expect(isDead(g.hero.state)).toBe(false);
    runUntil(g, (h) => isDead(h.state), ["moveRight"], 2);
    expect(isDead(g.hero.state)).toBe(true);
    expect(g.events.find((e) => e.kind === "died")).toMatchObject({ reason: "hazard" });
  });

  it("damage hazard takes perSecond energy and pushes by push cells per second", () => {
    const acid = { id: "acid", kind: "damage", col: 2, row: 7, w: 16, h: 1, perSecond: 30, push: 2 };
    const g = game({ x: 6.5, y: 8 }, level({ hazards: [acid] }));
    run(g, 1);
    expect(g.hero.energy).toBeCloseTo(cfg.energy.max - 30, 5);
    expect(g.hero.x).toBeCloseTo(8.5, 5);
  });

  it("damage hazard spends a shield at empty energy", () => {
    const acid = { id: "acid", kind: "damage", col: 2, row: 7, w: 16, h: 1, perSecond: cfg.energy.max * 2.5 };
    const g = game({ x: 6.5, y: 8, shields: 1 } as never, level({ hazards: [acid] }));
    run(g, 0.5);
    expect(g.hero.shields).toBe(0);
    expect(isDead(g.hero.state)).toBe(false);
    run(g, 0.5);
    expect(isDead(g.hero.state)).toBe(true);
  });

  it("does nothing while a film plays", () => {
    const g = game({ x: 9.5, y: 8 }, level({ hazards: [lava] }));
    g.world.cutscene = { id: "crowbarDoor", prop: null, t: 0 };
    tick(g);
    expect(isDead(g.hero.state)).toBe(false);
  });
});

describe("conveyors", () => {
  const belt = { col: 1, row: 8, w: 18, vx: 3 };

  it("conveyor carries a standing hero at vx and stops at a wall", () => {
    const g = game({ x: 5.5, y: 8 }, level({ conveyors: [belt] }));
    run(g, 1);
    expect(g.hero.x).toBeCloseTo(8.5, 5);
    run(g, 5);
    expect(g.hero.x).toBeCloseTo(WIDTH - 1 - cfg.box.width / 2, 5);
  });

  it("conveyor does not move an airborne hero", () => {
    const g = game({ x: 5.5, y: 4, state: "fall" }, level({ conveyors: [belt] }));
    g.hero.onGround = false;
    expect(conveyorVx(g.world, g.hero)).toBe(0);
    const airborne: number[] = [];
    for (let i = 0; i < 120 && !g.hero.onGround; i++) {
      airborne.push(g.hero.x);
      tick(g);
    }
    expect(airborne.length).toBeGreaterThan(10);
    expect(new Set(airborne)).toEqual(new Set([5.5]));
  });

  it("leaves a hero off the run alone", () => {
    const g = game({ x: 5.5, y: 8 }, level({ conveyors: [{ ...belt, col: 10, w: 5 }] }));
    run(g, 1);
    expect(g.hero.x).toBe(5.5);
  });
});
