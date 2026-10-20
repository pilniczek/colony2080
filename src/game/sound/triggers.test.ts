import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { cfg, dt, game, run, runUntil, tick, type Game } from "../hero/testWorld";
import { ENEMY_SHOT } from "../level/enemy";
import { missionJson } from "../level/missions";
import { loadSandbox, type Prop } from "../level/sandboxLevel";
import { runUse } from "../level/tasks";
import { hitShootable } from "../shots";
import { openInventory } from "./ui";

const WIDTH = 30;
const open = `#${".".repeat(WIDTH - 2)}#`;
const solid = "#".repeat(WIDTH);

const arena = (extra: object = {}) => ({
  rows: [...Array<string>(8).fill(open), solid, solid],
  spawn: [3.5, 8],
  sky: "skyBackground",
  backdrop: [],
  dressing: [],
  lifts: [],
  enemies: [],
  props: [],
  ...extra,
});

const droid = (x: number, extra: object = {}) => ({ x, y: 8, facing: -1, hits: 7, respawnMs: null, reactMs: 250, burst: { shots: 9, ms: 280 }, pauseMs: 400, patrol: [1.5, 28.5], ...extra });

const FLIGHT = sandbox.enemies.find((e) => "flight" in e)!.flight;

const cues = (g: Game, id: string) => g.world.sounds.filter((s) => s.id === id);

describe("hero weapon cues", () => {
  it("hero shot cues gunShot 15000", () => {
    const g = game({ x: 3.5, y: 8, weapon: "gun" }, arena());
    tick(g, ["shoot"], ["shoot"]);
    expect(g.world.sounds).toEqual([{ id: "gunShot", rate: 15000, vol: 63, bus: "world" }]);
  });

  it("beam tick cues beam 8000", () => {
    const g = game({ x: 3.5, y: 8, weapon: "blaster" }, arena());
    g.hero.blaster = cfg.blaster.ammo;
    tick(g, ["shoot"], ["shoot"]);
    expect(g.world.sounds).toEqual([{ id: "beam", rate: 8000, vol: 63, bus: "world" }]);
  });

  it("punch frame cues punch 13000, hit or miss", () => {
    const g = game({ x: 3.5, y: 8, weapon: "fists" }, arena());
    tick(g, ["shoot"], ["shoot"]);
    run(g, 1, ["shoot"]);
    expect(cues(g, "punch").length).toBeGreaterThan(0);
    expect(cues(g, "punch")[0]).toEqual({ id: "punch", rate: 13000, vol: 63, bus: "world" });
  });
});

describe("enemy fire cues", () => {
  it("mesto droid shot is silent", () => {
    const g = game({ x: 5.5, y: 8 }, arena({ mission: "mesto", enemies: [droid(9.5)] }));
    run(g, 1);
    expect(g.world.projectiles.some((p) => p.tag === ENEMY_SHOT) || g.hero.energy < cfg.energy.max).toBe(true);
    expect(cues(g, "cannon")).toHaveLength(0);
  });

  it("vesnice droid shot cues cannon 15000, one per bullet", () => {
    const g = game({ x: 5.5, y: 8 }, arena({ mission: "vesnice", enemies: [droid(9.5)] }));
    tick(g);
    expect(cues(g, "cannon")).toEqual([{ id: "cannon", rate: 15000, vol: 63, bus: "world" }]);
    run(g, 0.5);
    expect(cues(g, "cannon").length).toBe(9);
  });

  it("missions carry their id so droids know to stay silent in mesto", () => {
    expect(missionJson("mesto").mission).toBe("mesto");
    expect(missionJson("vesnice").mission).toBe("vesnice");
    expect(loadSandbox(missionJson("jeskyne")).mission).toBe("jeskyne");
    expect(loadSandbox(arena()).mission).toBeNull();
  });

  it("flyer shot cues laser 15000, in mesto too", () => {
    const g = game({ x: 5.5, y: 8 }, arena({ mission: "mesto", enemies: [droid(9.5, { flight: FLIGHT })] }));
    runUntil(g, () => cues(g, "laser").length > 0, [], 5);
    expect(cues(g, "laser")[0]).toEqual({ id: "laser", rate: 15000, vol: 63, bus: "world" });
    expect(cues(g, "cannon")).toHaveLength(0);
  });
});

describe("explosions", () => {
  it("explosion rate within 8000-9999 when a droid dies", () => {
    const g = game({ x: 5.5, y: 8, weapon: "gun" }, arena({ enemies: [droid(9.5)] }));
    tick(g, ["shoot"], ["shoot"]);
    run(g, 3, ["shoot"]);
    const blasts = cues(g, "explosion");
    expect(blasts).toHaveLength(1);
    expect(Number.isInteger(blasts[0]!.rate)).toBe(true);
    expect(blasts[0]!.rate).toBeGreaterThanOrEqual(8000);
    expect(blasts[0]!.rate).toBeLessThanOrEqual(9999);
  });

  const guard: Prop = { kind: "gate", id: "shootGuard", asset: "shootGuard", x: 10, y: 8, shootable: { hits: 2, state: 1 }, fires: { facing: -1, burst: { shots: 9, ms: 280 }, pauseMs: 400, states: [0] } };
  const hull: Prop = { kind: "object", id: "crashedShip", x: 10, y: 8, width: 4, height: 3, shootable: { hits: 2, state: 1 } };

  it("a guard breaking explodes, a shot open hull does not", () => {
    for (const [prop, blasts] of [[guard, 1], [hull, 0]] as const) {
      const world = loadSandbox(arena({ props: [prop] }));
      hitShootable(world, world.props[0]!);
      expect(world.sounds).toHaveLength(0);
      hitShootable(world, world.props[0]!);
      expect(world.sounds.filter((s) => s.id === "explosion")).toHaveLength(blasts);
    }
  });

  it("explosion rates vary from a seeded source that a world reset restarts", () => {
    const rates = () => {
      const world = loadSandbox(arena({ props: Array.from({ length: 6 }, () => guard) }));
      for (const prop of world.props) for (let i = 0; i < 2; i++) hitShootable(world, prop);
      return world.sounds.map((s) => s.rate);
    };
    const first = rates();
    expect(new Set(first).size).toBeGreaterThan(1);
    expect(rates()).toEqual(first);
  });
});

describe("hero state cues", () => {
  it("siren repeats every 1.25 s below 20 energy", () => {
    const g = game({ x: 3.5, y: 8 }, arena());
    run(g, 0.5);
    expect(cues(g, "siren")).toHaveLength(0);
    g.hero.energy = 19;
    tick(g);
    expect(cues(g, "siren")).toEqual([{ id: "siren", rate: 8500, vol: 34, bus: "world" }]);
    run(g, 1.25 - 2 * dt);
    expect(cues(g, "siren")).toHaveLength(1);
    run(g, 2 * dt);
    expect(cues(g, "siren")).toHaveLength(2);
    run(g, 1.25);
    expect(cues(g, "siren")).toHaveLength(3);
    g.hero.energy = 20;
    run(g, 3);
    expect(cues(g, "siren")).toHaveLength(3);
  });

  it("no siren from a dead hero", () => {
    const g = game({ x: 3.5, y: 8, state: "death" }, arena());
    g.hero.energy = 10;
    run(g, 1);
    expect(cues(g, "siren")).toHaveLength(0);
  });

  it("a spent shield cues power 20000", () => {
    const g = game({ x: 3.5, y: 8 }, arena());
    Object.assign(g.hero, { energy: cfg.energy.hit, shields: 1 });
    g.world.projectiles.push({ x: g.hero.x, y: g.hero.y - 1, vx: -1, r: 0.2, tag: ENEMY_SHOT });
    tick(g);
    expect(g.hero.shields).toBe(0);
    expect(cues(g, "power")).toEqual([{ id: "power", rate: 20000, vol: 63, bus: "world" }]);
  });

  it("steps alternate rates 10000 and 9400 at vol 33, two per gait cycle", () => {
    for (const [mode, cycle] of [["walk", 1.1], ["run", 0.66]] as const) {
      const g = game({ x: 3.5, y: 8 }, arena());
      g.hero.running = mode === "run";
      run(g, cycle * 3, ["moveRight"]);
      const steps = cues(g, "step");
      expect(steps.length).toBeGreaterThanOrEqual(5);
      expect(steps.length).toBeLessThanOrEqual(6);
      steps.forEach((s, i) => expect(s).toEqual({ id: "step", rate: i % 2 ? 9400 : 10000, vol: 33, bus: "world" }));
    }
  });

  it("no step while firing", () => {
    const g = game({ x: 3.5, y: 8, weapon: "gun" }, arena());
    g.hero.running = false;
    tick(g, ["moveRight"]);
    run(g, 0.3, ["moveRight"]);
    expect(g.hero.state).toBe("walk");
    tick(g, ["moveRight", "shoot"], ["shoot"]);
    run(g, 2, ["moveRight", "shoot"]);
    const before = cues(g, "step").length;
    expect(g.hero.state).toBe("walk");
    expect(g.hero.fireTime).not.toBeNull();
    run(g, 2, ["moveRight", "shoot"]);
    expect(cues(g, "step").length).toBe(before);
  });

  it("landing cues land 8500 vol 44", () => {
    const g = game({ x: 3.5, y: 5, state: "fall" }, arena());
    g.hero.onGround = false;
    g.hero.fallFrom = 5;
    runUntil(g, (h) => h.onGround, [], 2);
    expect(cues(g, "land")).toEqual([{ id: "land", rate: 8500, vol: 44, bus: "world" }]);
    const j = game({ x: 3.5, y: 8 }, arena());
    tick(j, [], ["up"]);
    runUntil(j, (h) => !h.onGround, [], 1);
    runUntil(j, (h) => h.onGround, [], 2);
    expect(cues(j, "land")).toHaveLength(1);
  });
});

describe("world cues", () => {
  it("lift start and stop", () => {
    const g = game({ x: 18.5, y: 14 }, sandbox);
    g.hero.onLift = true;
    tick(g, [], ["up"]);
    expect(g.world.lifts[0]!.target).toBe(4);
    expect(cues(g, "liftStart")).toEqual([{ id: "liftStart", rate: 8000, vol: 63, bus: "world" }]);
    runUntil(g, () => g.world.lifts[0]!.target === null, [], 10);
    expect(cues(g, "liftStop")).toEqual([{ id: "liftStop", rate: 8000, vol: 63, bus: "world" }]);
    expect(cues(g, "liftStart")).toHaveLength(1);
  });

  const doorLevel = arena({
    props: [
      { kind: "object", id: "switchboard", x: 6, width: 3 },
      { kind: "gate", id: "metroTunnel", asset: "tunnelGate", x: 10, state: 0 },
      { kind: "object", id: "trainDoor", asset: "trainDoor", x: 14, width: 3, state: 0 },
      { kind: "object", id: "wireBox", asset: "wireBox", x: 18, width: 3, state: 0 },
    ],
    tasks: {
      tasks: [
        { id: "wire", object: "switchboard", requires: [], gives: ["flag:power"], sets: { metroTunnel: 1 }, subtitle: "Power." },
        { id: "door", object: "trainDoor", requires: [], gives: ["flag:open"], state: 2, subtitle: "Open." },
        { id: "box", object: "wireBox", requires: [], gives: ["flag:wires"], state: 1, subtitle: "Wires." },
      ],
    },
  });

  it("a door asset opening cues door 11000, a grate asset grate 18000, other props nothing", () => {
    const world = loadSandbox(doorLevel);
    const prop = (id: string) => world.props.find((p) => p.id === id)!;
    runUse(world, prop("switchboard"));
    expect(world.sounds).toEqual([{ id: "grate", rate: 18000, vol: 63, bus: "world" }]);
    runUse(world, prop("trainDoor"));
    expect(world.sounds.at(-1)).toEqual({ id: "door", rate: 11000, vol: 63, bus: "world" });
    runUse(world, prop("wireBox"));
    expect(world.sounds).toHaveLength(2);
  });

  it("weapon key and auto switch cue click 20000 vol 45 on the ui bus", () => {
    const g = game({ x: 3.5, y: 8, weapon: "gun" }, arena());
    tick(g, [], ["weapon2"]);
    expect(g.hero.weapon).toBe("fists");
    expect(g.world.sounds).toEqual([{ id: "click", rate: 20000, vol: 45, bus: "ui" }]);
    tick(g, [], ["weapon2"]);
    expect(g.world.sounds).toHaveLength(1);
    const empty = game({ x: 3.5, y: 8, weapon: "gun" }, arena());
    empty.hero.ammo = 0;
    tick(empty);
    expect(empty.hero.weapon).toBe("fists");
    expect(cues(empty, "click")).toHaveLength(1);
  });

  it("teleport pad use cues teleport 13000", () => {
    const rows = [...Array<string>(8).fill(open), solid, solid];
    const g = game({ x: 5.5, y: 8 }, arena({ rows, teleports: [{ id: "pad", from: [5, 7], col: 4, w: 3, to: [15, 7] }] }));
    tick(g, [], ["up"]);
    expect(g.hero.x).toBe(15.5);
    expect(g.world.sounds).toEqual([{ id: "teleport", rate: 13000, vol: 63, bus: "world" }]);
  });

  it("spark only on marked hazard, every 0.3125 s", () => {
    const zone = { kind: "damage", col: 4, row: 7, w: 10, h: 1, perSecond: 0 };
    const g = game({ x: 5.5, y: 8 }, arena({ hazards: [{ ...zone, id: "spark", sound: "spark" }] }));
    tick(g);
    expect(cues(g, "spark")).toEqual([{ id: "spark", rate: 12000, vol: 63, bus: "world" }]);
    run(g, 0.3125 * 4);
    expect(cues(g, "spark")).toHaveLength(5);
    const plain = game({ x: 5.5, y: 8 }, arena({ hazards: [{ ...zone, id: "plain" }] }));
    run(plain, 2);
    expect(cues(plain, "spark")).toHaveLength(0);
  });

  it("mesto thunders at seeded 8-20 s gaps while not filming", () => {
    const g = game({ x: 3.5, y: 8 }, arena({ mission: "mesto" }));
    const times: number[] = [];
    for (let i = 0; i < 70 / dt; i++) {
      const before = cues(g, "thunder").length;
      tick(g);
      if (cues(g, "thunder").length > before) times.push(i * dt);
    }
    expect(cues(g, "thunder")[0]).toEqual({ id: "thunder", rate: 9000, vol: 63, bus: "world" });
    expect(times.length).toBeGreaterThanOrEqual(3);
    expect(times[0]).toBeGreaterThanOrEqual(8 - dt);
    expect(times[0]).toBeLessThanOrEqual(20 + dt);
    times.slice(1).forEach((t, i) => {
      expect(t - times[i]!).toBeGreaterThanOrEqual(8 - dt);
      expect(t - times[i]!).toBeLessThanOrEqual(20 + dt);
    });
    const again = game({ x: 3.5, y: 8 }, arena({ mission: "mesto" }));
    run(again, 70);
    expect(cues(again, "thunder")).toHaveLength(times.length);
  });

  it("no thunder outside mesto or while filming", () => {
    const other = game({ x: 3.5, y: 8 }, arena({ mission: "vesnice" }));
    run(other, 25);
    expect(cues(other, "thunder")).toHaveLength(0);
    const filming = game({ x: 3.5, y: 8 }, arena({ mission: "mesto" }));
    filming.world.cutscene = { id: "missionStart", prop: null, t: 0 };
    run(filming, 25);
    expect(cues(filming, "thunder")).toHaveLength(0);
  });
});

describe("ui cues", () => {
  it("inventory open stops world then cues ui inventory", () => {
    const calls: unknown[] = [];
    openInventory({ stopAll: (bus) => calls.push(["stopAll", bus]), play: (cue) => calls.push(["play", cue]) });
    expect(calls).toEqual([
      ["stopAll", undefined],
      ["play", { id: "inventory", rate: 8000, vol: 63, bus: "ui" }],
    ]);
  });
});
