import { describe, expect, it } from "vitest";
import { TileGrid } from "../../engine/world/tiles";
import type { Fog } from "../fog";
import { createHero, type Hero } from "../hero/hero";
import { cfg, dt } from "../hero/testWorld";
import { KIND_TUNING } from "./enemy";
import { CLOSE, flyMissile, launchMissile, type Missile } from "./missiles";
import { tick } from "./projectile";

const FLOOR = 8;
const W = 40;
const open = (rows: number): string[] => Array<string>(rows).fill(`#${".".repeat(W - 2)}#`);
const grid = new TileGrid([...open(FLOOR), "#".repeat(W)]);
const MISSILES = KIND_TUNING.rocketDroid!.missiles!;
const TURN = (MISSILES.turn * Math.PI) / 180;

const heroAt = (x: number): Hero => createHero([x, FLOOR], "gun", cfg.energy.max);
const rack = (x: number): [number, number] => [x, FLOOR - MISSILES.muzzle[1]!];
const launch = (x: number): Missile => launchMissile(rack(x), 1, MISSILES);
const step = (m: Missile, hero: Hero, map = grid, fog: Fog | null = null): number => tick(m, dt, (p) => flyMissile(p, map, fog, hero, cfg.box, dt)).hits;

const fly = (m: Missile, hero: Hero, seconds: number, map = grid, fog: Fog | null = null): number => {
  let hits = 0;
  for (let i = 0; i < seconds / dt; i++) hits += step(m, hero, map, fog);
  return hits;
};

const seeing = (cols: [number, number]): Fog => {
  const seen = new Uint8Array(W * (FLOOR + 1));
  for (let row = 0; row <= FLOOR; row++) for (let c = cols[0]; c <= cols[1]; c++) seen[row * W + c] = 1;
  return { width: W, height: FLOOR + 1, seen } as unknown as Fog;
};

describe("homing missiles", () => {
  it("climb first, then come down onto the hero", () => {
    const hero = heroAt(20);
    const m = launch(6);
    let peak = m.y;
    for (let i = 0; i < 3 / dt && m.ended === null; i++) {
      step(m, hero);
      peak = Math.min(peak, m.y);
    }
    expect(peak).toBeLessThan(rack(6)[1] - 0.5);
    expect(m.burst).toBe(true);
    expect(Math.abs(m.x - hero.x)).toBeLessThanOrEqual(cfg.box.width / 2 + 0.3);
  });

  it("hit a hero at any distance in a 5-row corridor, even beside the shooter, on a smooth path that ends level far out", () => {
    const corridor = new TileGrid([...Array<string>(FLOOR - 5).fill("#".repeat(W)), ...open(5), "#".repeat(W)]);
    for (const d of [0, 0.5, 1, 2, 3, 5, 8, 12, 20, 32]) {
      const hero = heroAt(4 + d);
      const m = launch(4);
      let hit = step(m, hero, corridor);
      let [prev, sharpest] = [m.heading, 0];
      for (let i = 0; i < 6 / dt && m.ended === null; i++) {
        hit += step(m, hero, corridor);
        sharpest = Math.max(sharpest, Math.abs(Math.atan2(Math.sin(m.heading - prev), Math.cos(m.heading - prev))));
        prev = m.heading;
      }
      expect(hit, `hero ${d} cells away`).toBe(MISSILES.hits);
      expect(sharpest).toBeLessThanOrEqual(TURN * (1 + CLOSE.tighter) * dt + 1e-9);
      if (d >= 8) expect(Math.abs(Math.sin(m.heading)), `level at ${d}`).toBeLessThan(0.1);
    }
  });

  it("fly on to where a hiding hero was last seen, pass it, then straight on", () => {
    const hero = heroAt(24);
    const m = launch(6);
    fly(m, hero, 0.3);
    hero.hidden = true;
    let closest = Infinity;
    for (let i = 0; i < 3 / dt && m.ended === null && m.x < 26; i++) {
      step(m, hero);
      closest = Math.min(closest, Math.hypot(m.x - 24, m.y - (FLOOR - cfg.box.height / 2)));
    }
    expect(closest).toBeLessThan(0.5);
    const heading = m.heading;
    fly(m, hero, 0.1);
    expect(m.ended !== null || m.heading === heading).toBe(true);
  });

  it("snap back onto a hero the step he stops hiding", () => {
    const hero = heroAt(30);
    const m = launch(6);
    fly(m, hero, 0.3);
    hero.hidden = true;
    fly(m, hero, 0.1);
    hero.x = 8;
    const heading = m.heading;
    hero.hidden = false;
    step(m, hero);
    expect(Math.abs(Math.atan2(Math.sin(m.heading - heading), Math.cos(m.heading - heading)))).toBeGreaterThan(TURN * dt * 2);
    expect(fly(m, hero, 3)).toBe(MISSILES.hits);
  });

  it("burst early on a low ceiling", () => {
    const low = new TileGrid([...open(FLOOR - 3), `#${"#".repeat(W - 2)}#`, ...open(2), "#".repeat(W)]);
    const m = launch(6);
    expect(fly(m, heroAt(25), 3, low)).toBe(0);
    expect(m).toMatchObject({ burst: true });
    expect(m.y).toBeGreaterThan(FLOOR - 3);
  });

  it("follow the hero through his own sight and vanish without a burst once it leaves it", () => {
    expect(fly(launch(6), heroAt(20), 3, grid, seeing([0, W - 1]))).toBe(MISSILES.hits);
    const lost = launch(6);
    expect(fly(lost, heroAt(20), 3, grid, seeing([0, 8]))).toBe(0);
    expect(lost.ended).not.toBeNull();
    expect(lost.burst).toBe(false);
    expect(fly(launch(6), heroAt(20), 3, grid, seeing([10, W - 1]))).toBe(MISSILES.hits);
  });
});
