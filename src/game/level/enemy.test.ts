import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { cfg, dt, game, run, tick, type Game } from "../hero/testWorld";
import { hitEnemy, isDead, updateEnemy } from "./enemy";

const kill = (g: Game): void => {
  for (let i = 0; i < sandbox.enemy.hits; i++) hitEnemy(g.world.enemy);
};

describe("sandbox enemy", () => {
  it("stands idle at its config spot facing the config way with full hits", () => {
    const { enemy } = game().world;
    expect(enemy.body).toMatchObject({ x: sandbox.enemy.x, y: 14, facing: sandbox.enemy.facing, state: "idle", weapon: "gun" });
    expect(enemy.body.energy).toBe(sandbox.enemy.hits);
    expect(isDead(enemy)).toBe(false);
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

  it("comes back with full hits 5 s after death", () => {
    const g = game();
    kill(g);
    for (let i = 0; i < 4.9 / dt; i++) updateEnemy(g.world.enemy, dt);
    expect(isDead(g.world.enemy)).toBe(true);
    for (let i = 0; i < 0.2 / dt; i++) updateEnemy(g.world.enemy, dt);
    expect(isDead(g.world.enemy)).toBe(false);
    expect(g.world.enemy.body).toMatchObject({ energy: sandbox.enemy.hits, hitAge: null, state: "idle" });
  });

  it("takes hero bullets with a spark where they hit", () => {
    const g = game({ x: 26.5, y: 14 });
    g.hero.weapon = "gun";
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.8, ["shoot"]);
    const { enemy } = g.world;
    expect(enemy.body.energy).toBeLessThan(sandbox.enemy.hits);
    const hits = g.world.sparks.filter((s) => Math.abs(s.x - enemy.body.x) < cfg.box.width);
    expect(hits.length).toBeGreaterThan(0);
  });

  it("is destroyed by sustained fire and lets bullets through its wreck", () => {
    const g = game({ x: 26.5, y: 14 });
    g.hero.weapon = "gun";
    tick(g, ["shoot"], ["shoot"]);
    run(g, 2.5, ["shoot"]);
    expect(isDead(g.world.enemy)).toBe(true);
    expect(g.world.projectiles.some((p) => p.tag === "hero" && p.x > g.world.enemy.body.x)).toBe(true);
  });

  it("ignores emitter bullets", () => {
    const g = game({ x: 10.5, y: 14 });
    g.world.emitter.on = true;
    run(g, 4);
    expect(g.world.enemy.body.energy).toBe(sandbox.enemy.hits);
  });
});
