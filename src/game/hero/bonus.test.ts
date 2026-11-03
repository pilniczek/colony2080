import { describe, expect, it } from "vitest";
import { loadMesto } from "../level/mesto";
import { loadMission } from "../level/missions";
import { resetWorld, type Prop } from "../level/sandboxLevel";
import { loadSnapshot, takeSnapshot } from "../save/snapshot";
import type { BonusKind } from "./config";
import { BONUS_TEXT } from "./hero";
import { cfg, game, tick, type Game } from "./testWorld";

const bonusOf = (g: Game, kind: BonusKind): Prop => g.world.props.find((p) => p.kind === "bonus" && p.bonus === kind)!;

const touch = (g: Game, kind: BonusKind): Prop => {
  const prop = bonusOf(g, kind);
  Object.assign(g.hero, { x: prop.x, y: prop.y ?? g.world.spawn[1], state: "idle" });
  tick(g);
  return prop;
};

describe("bonus pickups", () => {
  it("adds ammo up to its cap", () => {
    const g = game();
    g.hero.ammo = 100;
    touch(g, "ammo");
    expect(g.hero.ammo).toBe(100 + cfg.bonuses.ammo.add);
    expect(g.world.subtitle?.text).toBe(BONUS_TEXT.ammo);
    const full = game();
    full.hero.ammo = cfg.bonuses.ammo.cap - 10;
    touch(full, "ammo");
    expect(full.hero.ammo).toBe(cfg.bonuses.ammo.cap);
  });

  it("refills energy to the max and adds a shield up to five", () => {
    const g = game();
    g.hero.energy = 12;
    touch(g, "energy");
    expect(g.hero.energy).toBe(cfg.energy.max);
    g.hero.shields = 4;
    touch(g, "shield");
    expect(g.hero.shields).toBe(5);
    const full = game();
    full.hero.shields = 5;
    touch(full, "shield");
    expect(full.hero.shields).toBe(5);
  });

  it("is taken once and comes back with the level on a reset", () => {
    const g = game();
    const prop = touch(g, "ammo");
    expect(prop.taken).toBe(true);
    const ammo = g.hero.ammo;
    tick(g);
    expect(g.hero.ammo).toBe(ammo);
    resetWorld(g.world, cfg);
    expect(bonusOf(g, "ammo").taken).toBeFalsy();
  });

  it("keeps a taken bonus taken through a save and load", () => {
    const g = game();
    touch(g, "shield");
    const snap = JSON.parse(JSON.stringify(takeSnapshot(g.world, g.hero)));
    const fresh = game();
    expect(loadSnapshot(fresh.world, fresh.hero, snap, cfg)).toBeNull();
    expect(bonusOf(fresh, "shield").taken).toBe(true);
    expect(fresh.hero.shields).toBe(g.hero.shields);
  });

  it("places the original bonuses of missions 1 and 2", () => {
    const at = (props: Prop[]) => props.filter((p) => p.kind === "bonus").map((p) => [p.bonus, Math.floor(p.x), p.y]);
    expect(at(loadMesto().props)).toEqual([["shield", 24, 23], ["energy", 126, 23]]);
    expect(at(loadMission("vesnice").props)).toEqual([["energy", 83, 23], ["ammo", 129, 41], ["shield", 41, 41]]);
  });
});
