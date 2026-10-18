import cameraJson from "@config/camera.json";
import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { createFog, loadFog, revealedAt, sightRect, updateFog, type FogConfig } from "./fog";
import { cfg, game, run, tick, type Game } from "./hero/testWorld";

const fogCfg = loadFog(cameraJson);

const fogged = (g: Game, widthCells = fogCfg.widthCells): Game => {
  g.world.fog = createFog({ ...fogCfg, widthCells } satisfies FogConfig, g.hero, g.world.grid);
  return g;
};

describe("sight rect", () => {
  it("spans the original playfield: 6 cells each side, 6 rows above the feet and 1 below", () => {
    expect(sightRect(fogCfg, 10, 14)).toEqual({ left: 4, right: 16, top: 8, bottom: 15 });
  });
});

describe("reveal", () => {
  it("uncovers the cells whose centres are in sight", () => {
    const g = fogged(game({ x: 10, y: 14 }));
    const fog = g.world.fog!;
    expect(revealedAt(fog, 4, 13)).toBe(true);
    expect(revealedAt(fog, 15, 8)).toBe(true);
    expect(revealedAt(fog, 3, 13)).toBe(false);
    expect(revealedAt(fog, 16, 13)).toBe(false);
    expect(revealedAt(fog, 10, 7)).toBe(false);
  });

  it("keeps uncovered cells uncovered after the hero walks away", () => {
    const g = fogged(game({ x: 10.5, y: 14 }));
    run(g, 5, ["moveRight"]);
    expect(g.hero.x).toBeGreaterThan(17);
    expect(revealedAt(g.world.fog!, 5, 13)).toBe(true);
  });
});

describe("fog follow", () => {
  it("follows the hero sideways at once and eases to a new floor", () => {
    const g = fogged(game({ x: 3.5, y: 14 }));
    tick(g, [], ["up"]);
    run(g, 2, ["up"]);
    const fog = g.world.fog!;
    expect(fog.anchorY).toBeLessThan(14);
    expect(fog.anchorY - g.hero.y).toBeLessThan(0.5);
  });

  it("holds its height during a jump that stays inside", () => {
    const g = fogged(game({ x: 10.5, y: 14 }));
    tick(g, [], ["up"]);
    run(g, 0.3);
    expect(g.hero.onGround).toBe(false);
    expect(g.world.fog!.anchorY).toBe(14);
  });

  it("moves when the hero leaves it", () => {
    const g = game({ x: 10.5, y: 14 });
    g.world.fog = createFog(fogCfg, g.hero, g.world.grid);
    Object.assign(g.hero, { y: 4, onGround: false, state: "fall" });
    updateFog(g.world.fog, g.hero, cfg.box.height, 1 / 60);
    expect(g.world.fog.anchorY).toBeLessThan(14);
  });
});

describe("fog blocks shots", () => {
  it("drops hero bullets at the edge with no impact spark", () => {
    const g = fogged(game({ x: 2.5, y: 14, weapon: "gun" }));
    tick(g, ["shoot"], ["shoot"]);
    run(g, 3, ["shoot"]);
    expect(g.world.sparks).toHaveLength(0);
    expect(g.world.projectiles.every((p) => p.x <= 9)).toBe(true);
  });

  it("keeps an enemy in the fog safe from hero bullets", () => {
    const g = fogged(game({ x: 9.5, y: 4, weapon: "gun" }), 4);
    g.hero.facing = -1;
    Object.assign(g.world.enemy.body, { x: 4.5, facing: -1 });
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.5, ["shoot"]);
    expect(g.world.enemy.body.energy).toBe(sandbox.enemy.hits);
    expect(g.world.sparks).toHaveLength(0);
  });

  it("stops bullets an enemy fires from the fog", () => {
    const g = fogged(game({ x: 9.5, y: 4 }), 4);
    g.hero.facing = -1;
    Object.assign(g.world.enemy.body, { x: 4.5, facing: 1 });
    run(g, 2);
    expect(g.hero.energy).toBe(cfg.energy.max);
    expect(g.world.projectiles).toHaveLength(0);
  });
});
