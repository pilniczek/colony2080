import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { EFFECTS, presetPicks } from "../difficulty";
import { createHero } from "../hero/hero";
import { cfg } from "../hero/testWorld";
import { DROP_TEXT, dropEnergy, isSpecial, pickDrops } from "./drops";
import { hitEnemy } from "./enemy";
import { loadSandbox } from "./sandboxLevel";

const withDrops = () => {
  const world = loadSandbox(sandbox);
  world.difficulty = { level: "custom", assists: ["hideAnywhere", "specialDrops"] };
  return world;
};

const kill = (world: ReturnType<typeof loadSandbox>, i: number) => hitEnemy(world.enemies[i]!, world.enemies[i]!.hits);

describe("energy drops", () => {
  it("marks the flyer and the rocket robot special, the walker and grey trooper base", () => {
    const world = loadSandbox(sandbox);
    const roles = Object.fromEntries(world.enemies.map((e) => [e.flight ? "flyer" : e.kind, isSpecial(e)]));
    expect(roles).toMatchObject({ walker: false, flyer: true, rocketRobot: true, greyTrooper: false });
  });

  it("drops one cell on the floor under a killed special enemy, only with the pick", () => {
    const world = withDrops();
    const flyer = world.enemies.findIndex((e) => e.flight);
    const walker = world.enemies.findIndex((e) => e.kind === "walker" && !e.flight);
    kill(world, flyer);
    kill(world, walker);
    dropEnergy(world);
    dropEnergy(world);
    expect(world.drops).toEqual([{ x: world.enemies[flyer]!.body.x, y: world.enemies[flyer]!.spot[1], from: flyer, taken: false }]);
    const plain = loadSandbox(sandbox);
    plain.difficulty = presetPicks("story");
    kill(plain, flyer);
    dropEnergy(plain);
    expect(plain.drops).toEqual([]);
  });

  it("gives +50 energy up to the max on touch, once", () => {
    const world = withDrops();
    world.drops.push({ x: 5, y: 10, from: 0, taken: false });
    const hero = createHero([5, 10], "gun", 30, 0, 0, false);
    pickDrops(world, hero, cfg);
    pickDrops(world, hero, cfg);
    expect(hero.energy).toBe(30 + EFFECTS.specialDrops.energy);
    expect(world.drops[0]!.taken).toBe(true);
    expect(world.subtitle?.text).toBe(DROP_TEXT);
    world.drops.push({ x: 5, y: 10, from: 1, taken: false });
    pickDrops(world, hero, cfg);
    expect(hero.energy).toBe(cfg.energy.max);
  });
});
