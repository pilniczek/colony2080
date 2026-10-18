import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { cfg, clips, dt, game, run, tick, type Game } from "../hero/testWorld";
import { ENEMY_SHOT, hitEnemy, isDead, updateEnemy } from "./enemy";

const PATROL = { left: 1 + cfg.box.width / 2, right: 11 - cfg.box.width / 2 };

const kill = (g: Game): void => {
  for (let i = 0; i < sandbox.enemy.hits; i++) hitEnemy(g.world.enemy);
};

const enemyShots = (g: Game) => g.world.projectiles.filter((p) => p.tag === ENEMY_SHOT);

const facingRight = (g: Game, x: number): void => {
  Object.assign(g.world.enemy.body, { x, facing: 1 });
};

describe("sandbox enemy", () => {
  it("starts walking on the top platform with full hits", () => {
    const { enemy } = game().world;
    expect(enemy.body).toMatchObject({ x: sandbox.enemy.x, y: sandbox.enemy.y, facing: sandbox.enemy.facing, state: "walk", weapon: "gun" });
    expect(enemy.body.energy).toBe(sandbox.enemy.hits);
    expect(isDead(enemy)).toBe(false);
  });

  it("walks edge to edge and never leaves the platform", () => {
    const g = game();
    let [min, max] = [Infinity, -Infinity];
    const faced = new Set<number>();
    for (let i = 0; i < 30 / dt; i++) {
      tick(g);
      const { x, y, facing } = g.world.enemy.body;
      [min, max] = [Math.min(min, x), Math.max(max, x)];
      faced.add(facing);
      expect(y).toBe(sandbox.enemy.y);
    }
    expect(min).toBeGreaterThanOrEqual(PATROL.left - 1e-9);
    expect(max).toBeLessThanOrEqual(PATROL.right + 1e-9);
    expect(min).toBeLessThan(PATROL.left + 0.1);
    expect(max).toBeGreaterThan(PATROL.right - 0.1);
    expect(faced).toEqual(new Set([1, -1]));
  });

  it("stops and shoots a hero it sees ahead on its floor", () => {
    const g = game({ x: 9.5, y: 4 });
    facingRight(g, 5.5);
    tick(g);
    const x = g.world.enemy.body.x;
    expect(g.world.enemy.body.state).toBe("attack");
    expect(enemyShots(g)).toHaveLength(1);
    expect(enemyShots(g)[0]!.vx).toBeCloseTo(cfg.shot.speed, 9);
    run(g, 1.1);
    expect(g.world.enemy.body.x).toBe(x);
    expect(g.hero.energy).toBeLessThan(cfg.energy.max);
  });

  it("does not see a hero behind it, hidden or on another floor", () => {
    const behind = game({ x: 2.5, y: 4 });
    facingRight(behind, 5.5);
    const hidden = game({ x: 9.5, y: 4, state: "hide" });
    hidden.hero.hidden = true;
    facingRight(hidden, 5.5);
    const below = game({ x: 9.5, y: 14 });
    facingRight(below, 5.5);
    for (let i = 0; i < 10; i++) {
      tick(behind);
      tick(hidden, ["hide"]);
      tick(below);
    }
    for (const g of [behind, hidden, below]) {
      expect(g.world.enemy.body.state).toBe("walk");
      expect(enemyShots(g)).toHaveLength(0);
    }
  });

  it("walks on when the hero hides", () => {
    const g = game({ x: 9.5, y: 4 });
    facingRight(g, 5.5);
    run(g, 0.3);
    expect(g.world.enemy.body.state).toBe("attack");
    tick(g, ["hide"]);
    tick(g, ["hide"]);
    expect(g.world.enemy.body).toMatchObject({ state: "walk", fireTime: null });
  });

  it("dies on the last hit and flashes on each hit", () => {
    const g = game();
    for (let i = 1; i < sandbox.enemy.hits; i++) expect(hitEnemy(g.world.enemy)).toBe(true);
    expect(isDead(g.world.enemy)).toBe(false);
    expect(g.world.enemy.body.hitAge).toBe(0);
    hitEnemy(g.world.enemy);
    expect(isDead(g.world.enemy)).toBe(true);
    expect(hitEnemy(g.world.enemy)).toBe(false);
  });

  it("stays put while dead and comes back walking with full hits 5 s after death", () => {
    const g = game();
    kill(g);
    const x = g.world.enemy.body.x;
    for (let i = 0; i < 4.9 / dt; i++) updateEnemy(g.world.enemy, g.world.grid, null, g.hero, clips, dt);
    expect(isDead(g.world.enemy)).toBe(true);
    expect(g.world.enemy.body.x).toBe(x);
    for (let i = 0; i < 0.2 / dt; i++) updateEnemy(g.world.enemy, g.world.grid, null, g.hero, clips, dt);
    expect(isDead(g.world.enemy)).toBe(false);
    expect(g.world.enemy.body).toMatchObject({ energy: sandbox.enemy.hits, hitAge: null, state: "walk", facing: sandbox.enemy.facing });
    expect(Math.abs(g.world.enemy.body.x - sandbox.enemy.x)).toBeLessThan(0.2);
  });

  it("takes hero bullets on its floor with a spark where they hit", () => {
    const g = game({ x: 9.5, y: 4, weapon: "gun" });
    g.hero.facing = -1;
    Object.assign(g.world.enemy.body, { x: 4.5, facing: -1 });
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.5, ["shoot"]);
    const { enemy } = g.world;
    expect(enemy.body.energy).toBeLessThan(sandbox.enemy.hits);
    expect(g.world.sparks.some((s) => Math.abs(s.x - enemy.body.x) < cfg.box.width)).toBe(true);
  });
});
