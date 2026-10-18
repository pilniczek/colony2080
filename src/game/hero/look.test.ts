import xbot from "@config/robots/xbot.json";
import { describe, expect, it } from "vitest";
import { holdPoses } from "../robot/gun";
import { createHero, type Hero } from "./hero";
import { createRigs, heroLook } from "./look";
import { cfg, clips } from "./testWorld";

const rigs = createRigs(true);
const hold = holdPoses(rigs.side, rigs.front);

const STAND = { body: 0, hipNear: 0, kneeNear: 2, ankleNear: -1.4, hipFar: 0, kneeFar: 2, ankleFar: -1.4 };

const hero = (patch: Partial<Hero>): Hero => Object.assign(createHero([7.5, 14], "fists", 100), patch);

const cellsPerUnit = cfg.heroHeightCells / (xbot.levels.foot - xbot.levels.head);

const angle = (pose: Record<string, unknown>, key: string): number => pose[key] as number;

describe("hero look", () => {
  it("idle is the standing pose on the ground", () => {
    const look = heroLook(hero({ state: "idle", time: 1.3 }), clips, rigs, hold);
    expect(look.view).toBe("side");
    expect(look.gun).toBe("none");
    expect(Object.keys(look.pose).sort()).toEqual(Object.keys(STAND).sort());
    for (const [k, v] of Object.entries(STAND)) expect(angle(look.pose, k)).toBeCloseTo(v, 6);
    expect(Math.abs(look.lift * cellsPerUnit)).toBeLessThan(0.01);
  });

  it("gun-mode walk keeps the forearm level with the carry", () => {
    for (let i = 0; i < 8; i++) {
      const look = heroLook(hero({ state: "walk", weapon: "gun", time: (i * 1.1) / 8 + 0.03 }), clips, rigs, hold);
      const p = look.pose;
      expect(look.gun).toBe("hand");
      expect(Math.abs(angle(p, "body") + angle(p, "arm") + angle(p, "fore") - 18 + 90)).toBeLessThan(0.5);
    }
  });

  it("ladder uses the back view with the gun slung", () => {
    const look = heroLook(hero({ state: "ladder", weapon: "gun", climb: 0.3, onGround: false }), clips, rigs, hold);
    expect(look.view).toBe("back");
    expect(look.gun).toBe("slung");
    expect(look.lift).toBe(0);
    expect(look.pose.thighL).toBeTypeOf("object");
    expect(look.pose.armL).toBeTypeOf("number");
  });

  it("ladder arms reach alternately with the climb", () => {
    const a = heroLook(hero({ state: "ladder", climb: 0.22 }), clips, rigs, hold).pose;
    const b = heroLook(hero({ state: "ladder", climb: 0.66 }), clips, rigs, hold).pose;
    expect(angle(a, "armL")).not.toBeCloseTo(angle(b, "armL"), 0);
    expect(angle(a, "armL")).toBeCloseTo(-angle(b, "armR"), 3);
  });

  it("death ends lying on the back", () => {
    const look = heroLook(hero({ state: "death", weapon: "gun", time: clips.death!.duration }), clips, rigs, hold);
    expect(look.rot).toBeCloseTo(-89, 6);
    expect(look.gun).toBe("dropped");
    expect(look.lift * cellsPerUnit).toBeLessThan(-0.05);
  });

  it("death carries the gun until it drops", () => {
    const carried = heroLook(hero({ state: "death", weapon: "gun", time: 0.6 }), clips, rigs, hold);
    expect(carried.gun).toBe("hand");
    expect(angle(carried.pose, "body") + angle(carried.pose, "arm") + angle(carried.pose, "fore") - 18).toBeCloseTo(-90, 6);
    expect(carried.pose.carry).toBeUndefined();
    const dropped = heroLook(hero({ state: "death", weapon: "gun", time: 1.05 }), clips, rigs, hold);
    expect(dropped.gun).toBe("dropped");
    expect(dropped.pose).toEqual(heroLook(hero({ state: "death", time: 1.05 }), clips, rigs, hold).pose);
  });

  it("death with fists never shows a gun", () => {
    expect(heroLook(hero({ state: "death", time: 0.2 }), clips, rigs, hold).gun).toBe("none");
    expect(heroLook(hero({ state: "death", time: 4 }), clips, rigs, hold).gun).toBe("none");
  });

  it("front view is never mirrored", () => {
    for (const facing of [1, -1] as const) {
      const look = heroLook(hero({ state: "hide", time: 0.05, facing }), clips, rigs, hold);
      expect(look).toMatchObject({ view: "front", flip: false });
    }
  });

  it("front view with the gun uses the front carry", () => {
    const look = heroLook(hero({ state: "hide", weapon: "gun", time: 0.05 }), clips, rigs, hold);
    expect(look.gun).toBe("hand");
    expect(look.pose).toMatchObject({ ...hold.FRONT_CARRY, ...hold.FRONT_CARRY_R });
  });

  it("weapon switch blends to the carry and drops the pseudo key", () => {
    const look = heroLook(hero({ state: "weaponSwitch", weapon: "gun", time: 1 }), clips, rigs, hold);
    expect(look.pose.carry).toBeUndefined();
    expect(look.gun).toBe("hand");
    expect(look.pose).toMatchObject({ arm: hold.CARRY.arm, fore: hold.CARRY.fore, ...hold.CARRY_FAR });
    expect(heroLook(hero({ state: "weaponSwitch", time: 0.05 }), clips, rigs, hold).gun).toBe("none");
  });

  it("hide is front view and fully tinted from the press frame", () => {
    expect(heroLook(hero({ state: "hide", time: 0 }), clips, rigs, hold)).toMatchObject({ view: "front", tint: 1 });
    expect(heroLook(hero({ state: "hide", time: 0.45 }), clips, rigs, hold).tint).toBe(1);
  });

  for (const state of ["standJump", "walkJump", "duckJump", "runJump"] as const) {
    it(`${state} eases its lift out from take-off`, () => {
      const at = (time: number) => heroLook(hero({ state, time, onGround: false }), clips, rigs, hold).lift * cellsPerUnit;
      for (let f = 0; f < 3; f++) expect(Math.abs(at((f + 1) / 60) - at(f / 60)), `frame ${f}`).toBeLessThan(0.1);
      expect(at(0.1)).toBe(0);
    });
  }

  it("weapon switch starts at rest and reaches the hip before the draw", () => {
    const start = heroLook(hero({ state: "weaponSwitch", time: 0 }), clips, rigs, hold).pose;
    expect(start).toMatchObject({ arm: 4, fore: -6 });
    const drawAt = clips.weaponSwitch!.gun!.find(([, g]) => g === "hand")![0];
    expect(heroLook(hero({ state: "weaponSwitch", time: drawAt - 0.01 }), clips, rigs, hold).pose).toMatchObject({ arm: 26, fore: -4 });
  });

  it("is zero in the air and the same for the same input", () => {
    const h = hero({ state: "fall", time: 0.1, onGround: false });
    expect(heroLook(h, clips, rigs, hold).lift).toBe(0);
    const d = hero({ state: "death", time: 1.4 });
    expect(heroLook(d, clips, rigs, hold)).toEqual(heroLook(d, clips, rigs, hold));
  });
});
