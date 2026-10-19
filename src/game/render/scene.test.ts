import { describe, expect, it } from "vitest";
import { holdPoses } from "../robot/gun";
import { createHero, type Hero } from "../hero/hero";
import { createRigs, heroLook } from "../hero/look";
import { cfg, clips } from "../hero/testWorld";
import { castsShadow, heroBehindEnemies, weaponHooks } from "./scene";

const rigs = createRigs(true);
const hold = holdPoses(rigs.side, rigs.front);
const hero = (patch: Partial<Hero>): Hero => Object.assign(createHero([7.5, 14], "fists", 100), patch);
const shadowed = (patch: Partial<Hero>): boolean => {
  const h = hero(patch);
  return castsShadow(h, heroLook(h, clips, rigs, hold, cfg));
};

describe("shadow", () => {
  it("is cast on the ground and never while airborne", () => {
    expect(shadowed({ state: "idle" })).toBe(true);
    expect(shadowed({ state: "walk", time: 0.3 })).toBe(true);
    for (const state of ["standJump", "duckJump", "walkJump", "runJump", "fall", "jumpDeath"] as const)
      expect(shadowed({ state, time: 0.2, onGround: false }), state).toBe(false);
    expect(shadowed({ state: "jumpDeath", time: 0.5 })).toBe(true);
  });

  it("is not cast on the ladder", () => {
    expect(shadowed({ state: "ladder", climb: 2, onGround: false })).toBe(false);
  });
});

describe("draw order", () => {
  it("puts the hero behind enemies only while hidden", () => {
    expect(heroBehindEnemies(hero({ state: "hide", hidden: true }))).toBe(true);
    expect(heroBehindEnemies(hero({ state: "weaponSwitch", hidden: true }))).toBe(true);
    for (const state of ["idle", "walk", "duck"] as const) expect(heroBehindEnemies(hero({ state })), state).toBe(false);
  });
});

describe("weapon hooks", () => {
  const hooks = (patch: Partial<Hero>): string[] => {
    const h = hero(patch);
    return Object.keys(weaponHooks(heroLook(h, clips, rigs, hold, cfg), 1)).sort();
  };

  it("draws only the held weapon, never the other owned one on the back", () => {
    expect(hooks({ state: "idle", weapon: "blaster", blaster: 400 })).toEqual(["hand"]);
    expect(hooks({ state: "idle", weapon: "gun", blaster: 400 })).toEqual(["hand"]);
    expect(hooks({ state: "idle", weapon: "gun" })).toEqual(["hand"]);
    expect(hooks({ state: "idle", weapon: "fists", blaster: 400 })).toEqual([]);
  });

  it("uses the front hand hook in the front view and no hook on the ladder", () => {
    expect(hooks({ state: "hide", hidden: true, weapon: "blaster", blaster: 400, time: 0.05 })).toEqual(["handL"]);
    expect(hooks({ state: "ladder", weapon: "blaster", blaster: 400, onGround: false })).toEqual([]);
  });
});
