import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { applyAssists, assisted, fogWanted } from "./assists";
import { EFFECTS, presetPicks, type Difficulty } from "./difficulty";
import { createHero, damage, drain } from "./hero/hero";
import { cfg } from "./hero/testWorld";
import { fallLimit, loadSandbox, resetWorld } from "./level/sandboxLevel";

const only = (...assists: string[]): Difficulty => ({ level: "custom", assists: ["hideAnywhere", ...assists] });

describe("assisted movement config", () => {
  it("keeps today's values without config picks and caches per config and difficulty", () => {
    const none = only();
    const plain = assisted(cfg, none);
    expect(plain).toEqual(cfg);
    expect(assisted(cfg, none)).toBe(plain);
    expect(assisted(cfg, only())).not.toBe(plain);
  });

  it("adds a shield, 50% more ammo with the 1500 cap, double punches and half damage", () => {
    const all = assisted(cfg, only("extraShield", "moreAmmo", "strongPunches", "halfDamage"));
    expect(all.energy.shields).toBe(cfg.energy.shields + 1);
    expect(all.ammo).toBe(Math.round(cfg.ammo * 1.5));
    expect(all.bonuses.ammo).toEqual({ add: Math.round(cfg.bonuses.ammo.add * 1.5), cap: EFFECTS.moreAmmo.ammoCap });
    expect(all.blaster.ammo).toBe(Math.round(cfg.blaster.ammo * 1.5));
    expect(all.toaster.ammo).toBe(Math.round(cfg.toaster.ammo * 1.5));
    expect(all.punch.damage).toBe(cfg.punch.damage * 2);
    expect(all.damageScale).toBe(0.5);
    expect(cfg.damageScale).toBe(1);
  });

  it("halves every hit and hazard drain", () => {
    const half = assisted(cfg, only("halfDamage"));
    const hit = createHero([2, 2], "gun", 100, 0, 0, false);
    damage(hit, half);
    expect(hit.energy).toBe(100 - cfg.energy.hit / 2);
    const burnt = createHero([2, 2], "gun", 100, 0, 0, false);
    drain(burnt, half, 10);
    expect(burnt.energy).toBe(95);
  });
});

describe("world assists", () => {
  it("lets enemies fire 250 ms after spotting the hero without SLOWER ENEMY REACTION, 400 ms with it", () => {
    const world = loadSandbox(sandbox);
    world.difficulty = presetPicks("normal");
    resetWorld(world, cfg);
    expect(world.enemies.every((e) => e.sightMs === 400)).toBe(true);
    world.difficulty = only();
    resetWorld(world, cfg);
    expect(world.enemies.every((e) => e.sightMs === EFFECTS.lateEnemies.offSightMs)).toBe(true);
    applyAssists(world);
    expect(world.enemies[0]!.sightMs).toBe(EFFECTS.lateEnemies.offSightMs);
  });

  it("drops fall death with NO FALL DEATH and fog with FOG OFF", () => {
    const world = loadSandbox(sandbox);
    world.difficulty = only("noFallDeath");
    expect(fallLimit(world, cfg)).toBe(Infinity);
    world.difficulty = only();
    expect(fallLimit(world, cfg)).toBe(cfg.fallDeathCells);
    expect(fogWanted(only("fogOff"))).toBe(false);
    expect(fogWanted(presetPicks("normal"))).toBe(true);
  });
});
