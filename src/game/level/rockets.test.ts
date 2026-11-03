import { describe, expect, it } from "vitest";
import { TileGrid } from "../../engine/world/tiles";
import type { Fog } from "../fog";
import { createHero, type Hero } from "../hero/hero";
import { cfg, clips, dt } from "../hero/testWorld";
import sandbox from "@config/levels/sandbox.json";
import { createEnemy, shotsBy, STANCE_HOLD, updateEnemy, type EnemyJson, type RocketJson } from "./enemy";
import { CLOSE, flyRockets, launch, liveRockets, type Rocket } from "./rockets";

const FLOOR = 8;
const W = 40;
const open = (rows: number): string[] => Array<string>(rows).fill(`#${".".repeat(W - 2)}#`);
const grid = new TileGrid([...open(FLOOR), "#".repeat(W)]);
const STRAIGHT: RocketJson = { kneelMs: 120, fireMs: 150, reloadMs: 900, speed: 22, hits: 9, range: 16, muzzle: [0.9, 1.1], trailMs: 350 };
const HOMING: RocketJson = { kneelMs: 200, fireMs: 300, reloadMs: 1600, salvo: { count: 3, gapMs: 220 }, speed: 12, hits: 3, muzzle: [-0.3, 2.2], trailMs: 900, homing: { climb: 45, turn: 320, steerMs: 120, glide: 2.5, level: 1.2 }, fins: true };

const heroAt = (x: number): Hero => createHero([x, FLOOR], "gun", cfg.energy.max);
const from = (x: number): [number, number] => [x, FLOOR - 1.1];

const fly = (rockets: Rocket[], hero: Hero, seconds: number, map = grid, fog: Fog | null = null): number => {
  let hits = 0;
  for (let i = 0; i < seconds / dt; i++) hits += flyRockets(rockets, map, fog, hero, cfg.box, dt).hits;
  return hits;
};

const seeing = (cols: [number, number]): Fog => {
  const seen = new Uint8Array(W * (FLOOR + 1));
  for (let row = 0; row <= FLOOR; row++) for (let c = cols[0]; c <= cols[1]; c++) seen[row * W + c] = 1;
  return { width: W, height: FLOOR + 1, seen } as unknown as Fog;
};

describe("enemy rockets", () => {
  it("fire a volley at fireMs and again every reloadMs", () => {
    expect(shotsBy(0.149, STRAIGHT)).toBe(0);
    expect(shotsBy(0.15, STRAIGHT)).toBe(1);
    expect(shotsBy(1.05, STRAIGHT)).toBe(2);
    expect(shotsBy(0.3 + 0.44, HOMING)).toBe(3);
    expect(shotsBy(0.3 + 1.6 + 0.44, HOMING)).toBe(6);
  });

  it("kneel and fire at once, stay down and fire again while the hero is seen, get up once he is lost", () => {
    const json = { ...(sandbox.enemies.find((e) => e.kind === "rocketRobot") as EnemyJson), x: 4.5, y: FLOOR, facing: 1 as const, patrol: undefined, rocket: STRAIGHT };
    const e = createEnemy(json, grid);
    const hero = heroAt(12);
    const step = (seconds: number): number => {
      let fired = 0;
      for (let i = 0; i < seconds / dt; i++) fired += updateEnemy(e, grid, null, hero, clips, cfg, dt);
      return fired;
    };
    expect(step(STRAIGHT.fireMs / 1000 + 2 * dt)).toBe(1);
    expect(e.body.state).toBe("attack");
    expect(step(STRAIGHT.reloadMs / 1000)).toBe(1);
    expect(e.body.state).toBe("attack");
    hero.hidden = true;
    expect(step(STRAIGHT.kneelMs / 1000 - 2 * dt)).toBe(0);
    expect(e.body).toMatchObject({ state: "attack" });
    expect(e.body.time).toBeGreaterThanOrEqual(STANCE_HOLD);
    step(4 * dt);
    expect(e.body.state).toBe("walk");
  });

  it("hit the hero only once the rocket reaches him, then burst", () => {
    const hero = heroAt(20);
    const rockets = [launch(from(4), 1, STRAIGHT)];
    expect(fly(rockets, hero, 0.3)).toBe(0);
    expect(fly(rockets, hero, 0.5)).toBe(STRAIGHT.hits);
    expect(rockets[0]!).toMatchObject({ burst: true });
  });

  it("fly past a hidden hero and burst at a wall", () => {
    const hero = { ...heroAt(20), hidden: true };
    const rockets = [launch(from(24), 1, { ...STRAIGHT, range: 40 })];
    expect(fly(rockets, hero, 2)).toBe(0);
    expect(rockets[0]!).toMatchObject({ burst: true });
    expect(rockets[0]!.x).toBeGreaterThan(W - 1.5);
    expect(rockets[0]!.x).toBeLessThan(W - 1);
  });

  it("home: climb first, then come down onto the hero", () => {
    const hero = heroAt(20);
    const rocket = launch(from(6), 1, HOMING);
    let peak = rocket.y;
    for (let i = 0; i < 3 / dt && rocket.ended === null; i++) {
      flyRockets([rocket], grid, null, hero, cfg.box, dt);
      peak = Math.min(peak, rocket.y);
    }
    expect(peak).toBeLessThan(FLOOR - 2.5);
    expect(peak).toBeGreaterThan(FLOOR - 4);
    expect(rocket.burst).toBe(true);
    expect(Math.abs(rocket.x - hero.x)).toBeLessThanOrEqual(cfg.box.width / 2 + 0.3);
  });

  it("home onto a hero at any distance in a 5-row corridor, even beside the shooter, on a smooth path that ends level far out", () => {
    const corridor = new TileGrid([...Array<string>(FLOOR - 5).fill("#".repeat(W)), ...open(5), "#".repeat(W)]);
    for (const d of [0, 0.5, 1, 2, 3, 5, 8, 12, 20, 32]) {
      const hero = heroAt(4 + d);
      const r = launch([4, FLOOR - HOMING.muzzle[1]!], 1, HOMING);
      let hit = flyRockets([r], corridor, null, hero, cfg.box, dt).hits;
      let [prev, sharpest] = [r.heading, 0];
      for (let i = 0; i < 6 / dt && r.ended === null; i++) {
        hit += flyRockets([r], corridor, null, hero, cfg.box, dt).hits;
        sharpest = Math.max(sharpest, Math.abs(Math.atan2(Math.sin(r.heading - prev), Math.cos(r.heading - prev))));
        prev = r.heading;
      }
      expect(hit, `hero ${d} cells away`).toBe(HOMING.hits);
      expect(sharpest).toBeLessThanOrEqual(((HOMING.homing!.turn * Math.PI) / 180) * (1 + CLOSE.tighter) * dt + 1e-9);
      if (d >= 8) expect(Math.abs(Math.sin(r.heading)), `level at ${d}`).toBeLessThan(0.1);
    }
  });

  it("fly on to where a hiding hero was last seen, pass it, then straight on", () => {
    const hero = heroAt(24);
    const rocket = launch(from(6), 1, HOMING);
    fly([rocket], hero, 0.3);
    hero.hidden = true;
    let closest = Infinity;
    for (let i = 0; i < 3 / dt && rocket.ended === null && rocket.x < 26; i++) {
      flyRockets([rocket], grid, null, hero, cfg.box, dt);
      closest = Math.min(closest, Math.hypot(rocket.x - 24, rocket.y - (FLOOR - cfg.box.height / 2)));
    }
    expect(closest).toBeLessThan(0.5);
    const heading = rocket.heading;
    fly([rocket], hero, 0.1);
    expect(rocket.ended !== null || rocket.heading === heading).toBe(true);
  });

  it("snap back onto a hero the step he stops hiding", () => {
    const hero = heroAt(30);
    const rocket = launch(from(6), 1, HOMING);
    fly([rocket], hero, 0.3);
    hero.hidden = true;
    fly([rocket], hero, 0.1);
    hero.x = 8;
    const heading = rocket.heading;
    hero.hidden = false;
    flyRockets([rocket], grid, null, hero, cfg.box, dt);
    const sharp = Math.abs(Math.atan2(Math.sin(rocket.heading - heading), Math.cos(rocket.heading - heading)));
    expect(sharp).toBeGreaterThan(((HOMING.homing!.turn * Math.PI) / 180) * dt * 2);
    expect(fly([rocket], hero, 3)).toBe(HOMING.hits);
  });

  it("burst early on a low ceiling", () => {
    const low = new TileGrid([...open(FLOOR - 3), `#${"#".repeat(W - 2)}#`, ...open(2), "#".repeat(W)]);
    const rocket = launch(from(6), 1, HOMING);
    expect(fly([rocket], heroAt(25), 3, low)).toBe(0);
    expect(rocket).toMatchObject({ burst: true });
    expect(rocket.y).toBeGreaterThan(FLOOR - 2);
    expect(rocket.y).toBeLessThan(FLOOR - 1.5);
  });

  it("follow the hero through his own sight and vanish without a burst once it leaves it", () => {
    const followed = launch(from(6), 1, HOMING);
    expect(fly([followed], heroAt(20), 3, grid, seeing([0, W - 1]))).toBe(HOMING.hits);
    const lost = launch(from(6), 1, HOMING);
    expect(fly([lost], heroAt(20), 3, grid, seeing([0, 8]))).toBe(0);
    expect(lost.ended).not.toBeNull();
    expect(lost.burst).toBe(false);
    const unseenStart = launch(from(6), 1, HOMING);
    expect(fly([unseenStart], heroAt(20), 3, grid, seeing([10, W - 1]))).toBe(HOMING.hits);
  });

  it("drop out once the blast and the smoke are gone", () => {
    const rockets = [launch(from(4), 1, STRAIGHT)];
    fly(rockets, heroAt(20), 1);
    expect(liveRockets(rockets)).toHaveLength(1);
    fly(rockets, heroAt(20), 1.5);
    expect(liveRockets(rockets)).toHaveLength(0);
  });
});
