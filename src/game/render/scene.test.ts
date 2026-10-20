import { describe, expect, it } from "vitest";
import { holdPoses } from "../robot/gun";
import { createHero, type Hero } from "../hero/hero";
import { createRigs, heroLook } from "../hero/look";
import { cfg, clips } from "../hero/testWorld";
import type { Enemy } from "../level/enemy";
import type { Fog } from "../fog";
import { castsShadow, feetSeen, heroBehindEnemies, visibleEnemies, viewCells, weaponHooks } from "./scene";

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

  it("shows for an enemy only when the cell above its feet is seen", () => {
    const seen = new Uint8Array(4 * 4);
    seen[3 * 4 + 1] = 1;
    const fog = { width: 4, height: 4, seen } as unknown as Fog;
    expect(feetSeen(null, { x: 1.5, y: 3 })).toBe(true);
    expect(feetSeen(fog, { x: 1.5, y: 3 })).toBe(false);
    expect(feetSeen(fog, { x: 1.5, y: 4 })).toBe(true);
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

describe("visible enemies", () => {
  const at = (x: number, y: number) => ({ body: hero({ x, y }) }) as Enemy;
  const view = { x: 10, y: 10, w: 20, h: 12 };

  it("skips enemies outside the view", () => {
    const near = at(20, 15);
    expect(visibleEnemies([at(50, 15), near, at(20, 40)], view, 2)).toEqual([near]);
  });

  it("keeps an enemy partly inside the margin", () => {
    const edge = at(31.5, 15);
    const below = at(20, 23.5);
    expect(visibleEnemies([edge, below, at(32.5, 15)], view, 2)).toEqual([edge, below]);
  });
});

describe("view cells", () => {
  it("maps the game window through the view transform", () => {
    const rect = viewCells({ scale: 2, offsetX: -480, offsetY: -240 }, { x: 0, y: 0, w: 960, h: 480 }, 24);
    expect(rect).toEqual({ x: 10, y: 5, w: 20, h: 10 });
  });
});
