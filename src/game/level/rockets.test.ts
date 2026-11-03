import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { TileGrid } from "../../engine/world/tiles";
import { createHero, type Hero } from "../hero/hero";
import { cfg, clips, dt } from "../hero/testWorld";
import { createEnemy, KIND_TUNING, shotsBy, STANCE_HOLD, stanceOf, updateEnemy, type EnemyJson } from "./enemy";
import { live, tick } from "./projectile";
import { flyRocket, launchRocket, type Rocket } from "./rockets";

const FLOOR = 8;
const W = 40;
const grid = new TileGrid([...Array<string>(FLOOR).fill(`#${".".repeat(W - 2)}#`), "#".repeat(W)]);
const ROCKET = KIND_TUNING.rocketRobot!.rocket!;
const MISSILES = KIND_TUNING.rocketDroid!.missiles!;

const heroAt = (x: number): Hero => createHero([x, FLOOR], "gun", cfg.energy.max);
const from = (x: number): [number, number] => [x, FLOOR - 1.1];

const fly = (rockets: Rocket[], hero: Hero, seconds: number): number => {
  let hits = 0;
  for (let i = 0; i < seconds / dt; i++) for (const r of rockets) hits += tick(r, dt, (p) => flyRocket(p, grid, hero, cfg.box, dt)).hits;
  return hits;
};

describe("rocket and missile stances", () => {
  it("fire at fireMs and again every reloadMs; a missile salvo fires count shots gapMs apart", () => {
    const rocket = stanceOf({ rocket: ROCKET, missiles: null })!;
    expect(shotsBy(ROCKET.fireMs / 1000 - 0.001, rocket)).toBe(0);
    expect(shotsBy(ROCKET.fireMs / 1000, rocket)).toBe(1);
    expect(shotsBy((ROCKET.fireMs + ROCKET.reloadMs) / 1000, rocket)).toBe(2);
    const salvo = stanceOf({ rocket: null, missiles: MISSILES })!;
    const last = (MISSILES.fireMs + (MISSILES.count - 1) * MISSILES.gapMs) / 1000;
    expect(shotsBy(last, salvo)).toBe(MISSILES.count);
    expect(shotsBy(last + MISSILES.reloadMs / 1000, salvo)).toBe(2 * MISSILES.count);
  });

  it("kneel and fire at once, stay down and fire again while the hero is seen, get up once he is lost", () => {
    const json = { ...(sandbox.enemies.find((e) => e.kind === "rocketRobot") as EnemyJson), x: 4.5, y: FLOOR, facing: 1 as const, patrol: undefined };
    const e = createEnemy(json, grid);
    expect(e.rocket).toBe(ROCKET);
    const hero = heroAt(12);
    const step = (seconds: number): number => {
      let fired = 0;
      for (let i = 0; i < seconds / dt; i++) fired += updateEnemy(e, grid, null, hero, clips, cfg, dt);
      return fired;
    };
    expect(step(ROCKET.fireMs / 1000 + 2 * dt)).toBe(1);
    expect(e.body.state).toBe("attack");
    expect(step(ROCKET.reloadMs / 1000)).toBe(1);
    expect(e.body.state).toBe("attack");
    hero.hidden = true;
    expect(step(ROCKET.kneelMs / 1000 - 2 * dt)).toBe(0);
    expect(e.body).toMatchObject({ state: "attack" });
    expect(e.body.time).toBeGreaterThanOrEqual(STANCE_HOLD);
    step(4 * dt);
    expect(e.body.state).toBe("walk");
  });
});

describe("straight rockets", () => {
  it("hit the hero only once the rocket reaches him, then burst", () => {
    const hero = heroAt(20);
    const rockets = [launchRocket(from(4), 1, ROCKET)];
    const travel = 16 / ROCKET.speed;
    expect(fly(rockets, hero, travel * 0.6)).toBe(0);
    expect(fly(rockets, hero, travel)).toBe(ROCKET.hits);
    expect(rockets[0]!).toMatchObject({ burst: true });
  });

  it("fly past a hidden hero and burst at a wall", () => {
    const hero = { ...heroAt(30), hidden: true };
    const rockets = [launchRocket(from(28), 1, ROCKET)];
    expect(fly(rockets, hero, 2)).toBe(0);
    expect(rockets[0]!).toMatchObject({ burst: true });
    expect(rockets[0]!.x).toBeGreaterThan(W - 1.5);
    expect(rockets[0]!.x).toBeLessThan(W - 1);
  });

  it("burst at their range", () => {
    const rockets = [launchRocket(from(2), 1, { ...ROCKET, range: 6 })];
    fly(rockets, heroAt(30), 1);
    expect(rockets[0]!.burst).toBe(true);
    expect(rockets[0]!.x).toBeCloseTo(8, 0);
  });

  it("drop out once the blast and the smoke are gone", () => {
    const rockets = [launchRocket(from(4), 1, ROCKET)];
    fly(rockets, heroAt(20), 1);
    expect(rockets.filter(live)).toHaveLength(1);
    fly(rockets, heroAt(20), 1.5);
    expect(rockets.filter(live)).toHaveLength(0);
  });
});
