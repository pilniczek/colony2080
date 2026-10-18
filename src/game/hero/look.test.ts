import xbot from "@config/robots/xbot.json";
import { describe, expect, it } from "vitest";
import { holdPoses } from "../robot/gun";
import { gaitBob, gaitPose, RUN, SPIKE_K, TAU, WALK } from "./gait";
import { createHero, damage, type Hero } from "./hero";
import { createRigs, heroLook } from "./look";
import { cfg, clips, game, tick } from "./testWorld";

const rigs = createRigs(true);
const hold = holdPoses(rigs.side, rigs.front);

const STAND = { body: 0, hipNear: 0, kneeNear: 2, ankleNear: -1.4, hipFar: 0, kneeFar: 2, ankleFar: -1.4 };

const hero = (patch: Partial<Hero>): Hero => Object.assign(createHero([7.5, 14], "fists", 100), patch);

const cellsPerUnit = cfg.heroHeightCells / (xbot.levels.foot - xbot.levels.head);

const angle = (pose: Record<string, unknown>, key: string): number => pose[key] as number;

const LEGS = ["body", "hipNear", "kneeNear", "ankleNear", "hipFar", "kneeFar", "ankleFar"];
const LEAP = { body: 6, hipNear: -68, kneeNear: 66, ankleNear: 14, hipFar: 4, kneeFar: 58, ankleFar: 18 };
const LONG_LEAP = { body: 10, hipNear: -80, kneeNear: 76, ankleNear: 14, hipFar: 4, kneeFar: 72, ankleFar: 18 };
const DUCK = { body: 16, hipNear: -86, kneeNear: 124, ankleNear: -54, hipFar: -68, kneeFar: 128, ankleFar: -76, arm: -38, fore: -92, armFar: -30, foreFar: -96 };

const expectPose = (pose: Record<string, unknown>, want: Record<string, number>, digits = 6): void => {
  for (const [k, v] of Object.entries(want)) expect(angle(pose, k), k).toBeCloseTo(v, digits);
};

const legsOf = (pose: Record<string, number>): Record<string, number> => Object.fromEntries(LEGS.map((k) => [k, pose[k]!]));

describe("hero look", () => {
  it("idle is the standing pose on the ground", () => {
    const look = heroLook(hero({ state: "idle", time: 1.3 }), clips, rigs, hold);
    expect(look.view).toBe("side");
    expect(look.gun).toBe("none");
    expect(Object.keys(look.pose).sort()).toEqual(Object.keys(STAND).sort());
    for (const [k, v] of Object.entries(STAND)) expect(angle(look.pose, k)).toBeCloseTo(v, 6);
    expect(Math.abs(look.lift * cellsPerUnit)).toBeLessThan(0.01);
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
      for (let f = 0; f < 3; f++) {
        if (state === "duckJump") expect(Math.abs(at((f + 1) / 60)), `frame ${f}`).toBeLessThan(Math.abs(at(f / 60)));
        else expect(Math.abs(at((f + 1) / 60) - at(f / 60)), `frame ${f}`).toBeLessThan(0.1);
      }
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

  for (const [state, g] of [["walk", WALK], ["run", RUN]] as const) {
    it(`${state} pose and height come from the gait engine`, () => {
      for (let i = 0; i < 12; i++) {
        const time = (i * g.cycle) / 12 + 0.01;
        const look = heroLook(hero({ state, time }), clips, rigs, hold);
        const phase = (TAU * time) / clips[state]!.duration;
        expectPose(look.pose, gaitPose(g, phase));
        expect(look.lift).toBeCloseTo(gaitBob(g, phase) / SPIKE_K, 6);
      }
    });

    it(`gun ${state} keeps the forearm at one world angle over a cycle`, () => {
      const world = Array.from({ length: 24 }, (_, i) => {
        const look = heroLook(hero({ state, weapon: "gun", time: (i * g.cycle) / 24 }), clips, rigs, hold);
        expect(look.gun).toBe("hand");
        return angle(look.pose, "body") + angle(look.pose, "arm") + angle(look.pose, "fore");
      });
      const mean = world.reduce((a, b) => a + b, 0) / world.length;
      for (const w of world) expect(Math.abs(w - mean)).toBeLessThan(0.5);
    });
  }

  it("turning while walking stays in side view and keeps the gait phase", () => {
    const g = game();
    for (let i = 0; i < 20; i++) tick(g, ["moveRight"]);
    for (let i = 0; i < 20; i++) {
      const before = g.hero.time;
      tick(g, [i < 10 ? "moveLeft" : "moveRight"]);
      expect(g.hero.state).toBe("walk");
      expect(g.hero.time).toBeCloseTo(before + 1 / 60, 9);
      const look = heroLook(g.hero, clips, rigs, hold);
      expect(look.view).toBe("side");
      expect(look.flip).toBe(i < 10);
      expectPose(look.pose, gaitPose(WALK, (TAU * g.hero.time) / clips.walk!.duration));
    }
  });

  it("hide is front view with full tint on the press frame", () => {
    const g = game();
    tick(g, ["hide"]);
    expect(heroLook(g.hero, clips, rigs, hold)).toMatchObject({ view: "front", tint: 1 });
  });

  it("standing jump uses the leap legs", () => {
    expectPose(heroLook(hero({ state: "standJump", time: 0.1, onGround: false }), clips, rigs, hold).pose, LEAP);
  });

  it("duck jump launches straight from the duck pose into the leap", () => {
    const start = heroLook(hero({ state: "duckJump", time: 0, onGround: false }), clips, rigs, hold);
    const ducked = heroLook(hero({ state: "duck", time: clips.duck!.duration }), clips, rigs, hold);
    expectPose(start.pose, DUCK);
    expect(start.lift).toBeCloseTo(ducked.lift, 6);
    expectPose(heroLook(hero({ state: "duckJump", time: 0.1, onGround: false }), clips, rigs, hold).pose, LEAP);
  });

  for (const [state, gait, g, leap] of [["walkJump", "walk", WALK, LEAP], ["runJump", "run", RUN, LONG_LEAP]] as const) {
    it(`${state} blends from the gait pose at take-off into the leap`, () => {
      const g0 = game();
      for (let i = 0; i < 23; i++) tick(g0, gait === "run" ? ["moveRight", "runModifier"] : ["moveRight"]);
      expect(g0.hero.state).toBe(gait);
      const before = heroLook(g0.hero, clips, rigs, hold);
      tick(g0, gait === "run" ? ["moveRight", "runModifier"] : ["moveRight"], ["up"]);
      expect(g0.hero.state).toBe(state);
      const after = heroLook(g0.hero, clips, rigs, hold);
      for (const k of LEGS) expect(Math.abs(angle(after.pose, k) - angle(before.pose, k)), k).toBeLessThan(15);
      const flying = heroLook({ ...g0.hero, time: 0.1 }, clips, rigs, hold);
      expectPose(flying.pose, leap);
      expect(legsOf(flying.pose as Record<string, number>)).not.toEqual(legsOf(gaitPose(g, 0)));
    });
  }

  it("a hit flashes the chest and head and snaps the head back", () => {
    const at = (hitAge: number) => heroLook(hero({ state: "attack", weapon: "gun", time: 0.3, hitAge }), clips, rigs, hold);
    const first = at(0);
    expect(first.hit!.flash).toBe(1);
    expect(first.hit!.headSnap).toBeCloseTo(0, 9);
    const tinted = Object.entries(first.pose).filter(([, v]) => typeof v === "object" && v !== null && "tint" in v).map(([k]) => k);
    expect(tinted.sort()).toEqual(["chest", "head"]);
    const peak = Math.max(...Array.from({ length: 30 }, (_, i) => Math.abs(at(i / 100).hit!.headSnap)));
    expect(peak).toBeGreaterThan(9);
    expect(peak).toBeLessThan(11);
    for (let age = 0.35; age <= 0.6; age += 0.01) expect(Math.abs(at(age).hit!.headSnap)).toBeLessThan(age >= 0.4 ? 1 : 1.5);
    expect(at(0.3).hit!.flash).toBe(0);
    expect(at(0.7).hit).toBeNull();
    expect(heroLook(hero({ state: "idle" }), clips, rigs, hold).hit).toBeNull();
  });

  it("keeps the base move under a hit", () => {
    const base = heroLook(hero({ state: "runJump", time: 0.2, onGround: false }), clips, rigs, hold);
    const hit = heroLook(hero({ state: "runJump", time: 0.2, onGround: false, hitAge: 0.1 }), clips, rigs, hold);
    const { head, chest, ...rest } = hit.pose;
    expect(head).toBeTypeOf("object");
    expect(chest).toBeTypeOf("object");
    expect(rest).toEqual(base.pose);
    expect(hit.lift).toBe(base.lift);
  });

  it("the hit star sits at the impact point and fades in 0.3 s", () => {
    const at = (hitAge: number) => heroLook(hero({ state: "idle", hitAge }), clips, rigs, hold).hit!;
    expect(at(0).spark).toBe(0);
    expect(at(0.15).spark).toBeCloseTo(0.5, 6);
    expect(at(0.3).spark).toBe(1);
    expect(at(0.1).star).toEqual(at(0.4).star);
  });

  it("death in a running jump goes limp, lies down and drops the gun on landing", () => {
    const g = game();
    for (let i = 0; i < 20; i++) tick(g, ["moveRight", "runModifier"]);
    tick(g, ["moveRight", "runModifier"], ["up"]);
    for (let i = 0; i < 10; i++) tick(g, ["moveRight", "runModifier"]);
    g.hero.weapon = "gun";
    g.hero.energy = cfg.energy.hit;
    damage(g.hero, cfg);
    expect(g.hero.state).toBe("jumpDeath");
    expect(heroLook(g.hero, clips, rigs, hold).gun).toBe("none");
    const limp = heroLook({ ...g.hero, time: 0.2 }, clips, rigs, hold);
    expectPose(limp.pose, { body: 0, hipNear: -30, kneeNear: 40, ankleNear: 20, arm: -150, armFar: -130 });
    for (let i = 0; i < 120; i++) tick(g);
    const lying = heroLook(g.hero, clips, rigs, hold);
    expect(lying.rot).toBeCloseTo(-89, 6);
    expect(lying.gun).toBe("dropped");
    expect(lying.lift * cellsPerUnit).toBeLessThan(-0.05);
  });
});
