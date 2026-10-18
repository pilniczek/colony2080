import { describe, expect, it } from "vitest";
import { holdPoses } from "../robot/gun";
import { createHero, type Hero } from "../hero/hero";
import { createRigs, heroLook } from "../hero/look";
import { cfg, clips } from "../hero/testWorld";
import { castsShadow } from "./scene";

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
