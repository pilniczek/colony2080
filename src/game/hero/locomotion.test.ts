import clipsJson from "@config/hero/clips.json";
import movementJson from "@config/hero/movement.json";
import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { stepProjectiles } from "../../engine/world/projectiles";
import { loadSandbox, updateEmitter, updateLift, type SandboxWorld } from "../level/sandboxLevel";
import { loadClips, loadMovement, type HeroState } from "./config";
import { createHero, updateHero, type Hero, type HeroEvent } from "./hero";

const dt = 1 / 60;
const cfg = loadMovement(movementJson);
const clips = loadClips(clipsJson);

interface Game {
  world: SandboxWorld;
  hero: Hero;
  events: HeroEvent[];
  seen: Set<HeroState>;
  frame: number;
  buffer: Map<string, number>;
}

const dropLevel = {
  ...sandbox,
  rows: [
    "########################################",
    ...Array.from({ length: 6 }, () => "#......................................#"),
    "###########............................#",
    ...Array.from({ length: 6 }, () => "#......................................#"),
    "########################################",
    "########################################",
  ],
  lift: { ...sandbox.lift, x: 34 },
};

function game(at?: { x: number; y: number; state?: HeroState }, level: unknown = sandbox): Game {
  const world = loadSandbox(level);
  const hero = createHero(world.spawn, "fists", cfg.energy.max);
  if (at) Object.assign(hero, at);
  return { world, hero, events: [], seen: new Set([hero.state]), frame: 0, buffer: new Map() };
}

function tick(g: Game, held: string[] = [], pressed: string[] = []): void {
  updateEmitter(g.world, dt);
  g.world.projectiles = stepProjectiles(g.world.projectiles, g.world.grid, dt);
  updateLift(g.world.lift, cfg.liftSpeed, dt);
  const dir = held.includes("moveRight") ? 1 : held.includes("moveLeft") ? -1 : 0;
  for (const action of pressed) g.buffer.set(action, g.frame);
  for (const [action, at] of g.buffer) if ((g.frame - at) * dt * 1000 > cfg.inputBufferMs) g.buffer.delete(action);
  const input = { held: new Set(held), pressed: new Set(g.buffer.keys()), dir } as const;
  g.events.push(...updateHero(g.hero, input, g.world, cfg, clips, dt, (action) => g.buffer.delete(action)));
  g.seen.add(g.hero.state);
  g.frame++;
}

function run(g: Game, seconds: number, held: string[] = []): void {
  for (let i = 0; i < Math.round(seconds * 60); i++) tick(g, held);
}

function runUntil(g: Game, done: (h: Hero) => boolean, held: string[] = [], seconds = 10): void {
  for (let i = 0; i < seconds * 60 && !done(g.hero); i++) tick(g, held);
}

describe("walk and run", () => {
  it("walks the walk clip travel per duration", () => {
    const g = game();
    run(g, 1, ["moveRight"]);
    expect(g.hero.state).toBe("walk");
    expect(Math.abs(g.hero.x - 7.5 - 2.0 / 1.1)).toBeLessThan(0.05);
  });

  it("runs the run clip travel per duration with the run modifier", () => {
    const g = game();
    run(g, 1, ["moveRight", "runModifier"]);
    expect(g.hero.state).toBe("run");
    expect(Math.abs(g.hero.x - 7.5 - 2.6 / 0.66)).toBeLessThan(0.05);
  });

  it("swaps walk and run when the run modifier toggles", () => {
    const g = game();
    run(g, 0.2, ["moveRight"]);
    tick(g, ["moveRight", "runModifier"]);
    expect(g.hero.state).toBe("run");
    tick(g, ["moveRight"]);
    expect(g.hero.state).toBe("walk");
    tick(g);
    expect(g.hero.state).toBe("idle");
  });
});

describe("turn", () => {
  it("commits to the turn clip and ends idle facing the other way", () => {
    const g = game();
    tick(g, ["moveLeft"]);
    expect(g.hero.state).toBe("turn");
    run(g, 14 / 60);
    expect(g.hero.state).toBe("turn");
    expect(g.hero.facing).toBe(-1);
    tick(g);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.facing).toBe(-1);
    expect(g.hero.x).toBe(7.5);
  });
});

describe("jumps", () => {
  it("crouches until the launch event, then the standing jump peaks at 1.0 cells", () => {
    const g = game();
    tick(g, [], ["up"]);
    expect(g.hero.state).toBe("standJump");
    const launchFrames = Math.floor(0.5 * 60);
    for (let i = 0; i < launchFrames - 1; i++) {
      tick(g);
      expect(g.hero.y).toBeCloseTo(14, 6);
    }
    let top = g.hero.y;
    for (let i = 0; i < 90; i++) {
      tick(g);
      top = Math.min(top, g.hero.y);
    }
    expect(Math.abs(14 - top - cfg.jump.standHeight)).toBeLessThan(0.05);
    expect(g.seen.has("land")).toBe(true);
    expect(g.hero.x).toBe(7.5);
  });

  it("clears the 3-cell gap with a running jump from x 27.6", () => {
    const g = game({ x: 27.6, y: 14, state: "run" });
    tick(g, ["moveRight", "runModifier"], ["up"]);
    expect(g.hero.state).toBe("runJump");
    runUntil(g, (h) => h.state === "idle");
    expect(g.seen.has("land")).toBe(true);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.y).toBeCloseTo(14, 6);
    expect(g.hero.x).toBeGreaterThan(31);
  });

  it("falls into the pit from a running jump at the 4-cell gap", () => {
    const g = game({ x: 33.6, y: 14, state: "run" });
    tick(g, ["moveRight", "runModifier"], ["up"]);
    run(g, 2);
    expect(g.hero.state).toBe("fallDeath");
    expect(g.seen.has("land")).toBe(false);
    expect(g.events.filter((e) => e.kind === "died")).toHaveLength(1);
  });
});

describe("falls", () => {
  it("survives a running jump down a 7-cell drop, measured from take-off", () => {
    const g = game({ x: 10.6, y: 7, state: "run" }, dropLevel);
    tick(g, ["moveRight", "runModifier"], ["up"]);
    expect(g.hero.state).toBe("runJump");
    runUntil(g, (h) => h.state === "idle");
    expect(g.seen.has("land")).toBe(true);
    expect(g.seen.has("fallDeath")).toBe(false);
    expect(g.hero.y).toBeCloseTo(14, 6);
  });

  it("survives walking off an exactly 7-cell drop", () => {
    const g = game({ x: 10, y: 7 }, dropLevel);
    runUntil(g, (h) => h.state === "fall", ["moveRight"]);
    runUntil(g, (h) => h.onGround);
    expect(g.hero.state).toBe("land");
    expect(g.hero.y).toBeCloseTo(14, 6);
  });

  it("dies walking off the left platform edge", () => {
    const g = game({ x: 10, y: 4 });
    runUntil(g, (h) => h.state === "fall", ["moveRight"]);
    expect(g.hero.state).toBe("fall");
    runUntil(g, (h) => h.onGround);
    expect(g.hero.state).toBe("fallDeath");
    expect(g.hero.y).toBeCloseTo(14, 6);
    expect(g.events.map((e) => e.kind)).toEqual(["died"]);
  });

  it("lands safely walking off the low ledge", () => {
    const g = game({ x: 15, y: 11 });
    runUntil(g, (h) => h.state === "fall", ["moveRight"]);
    expect(g.hero.state).toBe("fall");
    run(g, 1.5);
    expect(g.seen.has("land")).toBe(true);
    expect(g.seen.has("fallDeath")).toBe(false);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.y).toBeCloseTo(14, 6);
  });

  it("respawns at spawn with full energy 2 s after a fall death", () => {
    const g = game({ x: 10, y: 4 });
    runUntil(g, (h) => h.state === "fallDeath", ["moveRight"]);
    g.hero.energy = 0;
    run(g, cfg.respawnMs / 1000 - 0.1);
    expect(g.hero.state).toBe("fallDeath");
    run(g, 0.2);
    expect(g.hero.state).toBe("idle");
    expect([g.hero.x, g.hero.y]).toEqual(g.world.spawn);
    expect(g.hero.energy).toBe(cfg.energy.max);
  });
});

describe("ladder", () => {
  it("climbs from the floor to the platform at y 4 and returns to idle", () => {
    const g = game({ x: 3.4, y: 14 });
    tick(g, [], ["up"]);
    expect(g.hero.state).toBe("ladder");
    expect(g.hero.x).toBe(3.5);
    runUntil(g, (h) => h.state !== "ladder", ["up"]);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.y).toBeCloseTo(4, 6);
    expect(g.hero.climb).toBeCloseTo(10, 6);
    run(g, 0.5, ["up"]);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.y).toBeCloseTo(4, 6);
  });

  it("climbs down from the ladder top through the one-way floor", () => {
    const g = game({ x: 3.5, y: 4 });
    run(g, 0.1);
    expect(g.hero.state).toBe("idle");
    tick(g, ["down"]);
    expect(g.hero.state).toBe("ladder");
    runUntil(g, (h) => h.state !== "ladder", ["down"]);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.y).toBeCloseTo(14, 6);
  });
});

describe("buffered up", () => {
  it("drops an up tap made in the last frames of a climb", () => {
    const g = game({ x: 3.5, y: 14 });
    tick(g, [], ["up"]);
    runUntil(g, (h) => h.y < 4.1, ["up"]);
    tick(g, ["up"], ["up"]);
    runUntil(g, (h) => h.state !== "ladder", ["up"]);
    run(g, 0.5);
    expect([...g.seen]).toEqual(["idle", "ladder"]);
    expect(g.hero.y).toBeCloseTo(4, 6);
  });

  it("drops an up tap made while walking", () => {
    const g = game();
    run(g, 0.2, ["moveRight"]);
    tick(g, ["moveRight"], ["up"]);
    run(g, 0.5);
    expect([...g.seen]).toEqual(["idle", "walk"]);
  });
});

describe("lift", () => {
  it("rides to the top on one up press without jumping", () => {
    const g = game({ x: 18.5, y: 14 });
    tick(g);
    tick(g, [], ["up"]);
    run(g, 5);
    expect([...g.seen]).toEqual(["idle"]);
    expect(g.world.lift.y).toBe(4);
    expect(g.hero.y).toBeCloseTo(4, 6);
  });
});
