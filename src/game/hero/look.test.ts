import xbot from "@config/robots/xbot.json";
import { describe, expect, it } from "vitest";
import { holdPoses } from "../robot/gun";
import { gaitBob, gaitPose, RUN, SPIKE_K, TAU, WALK } from "./gait";
import { createHero, damage, type Hero } from "./hero";
import { apply } from "../../engine/math/mat2d";
import { locate } from "../../engine/rig/pose";
import { ROBOT } from "../robot/xbot";
import { createRigs, heroLook, RUNG, spikeUnit } from "./look";
import { cfg, clips, game, RUNNING, tick, type Game } from "./testWorld";

const rigs = createRigs(true);
const hold = holdPoses(rigs.side, rigs.front);

const STAND = { body: 0, hipNear: 0, kneeNear: 2, ankleNear: -1.4, hipFar: 0, kneeFar: 2, ankleFar: -1.4 };

const hero = (patch: Partial<Hero>): Hero => Object.assign(createHero([7.5, 14], "fists", 100), patch);

const cellsPerUnit = cfg.heroHeightCells / (xbot.levels.foot - xbot.levels.head);

const angle = (pose: Record<string, unknown>, key: string): number => pose[key] as number;

const LEGS = ["body", "hipNear", "kneeNear", "ankleNear", "hipFar", "kneeFar", "ankleFar"];
const LEAP = { body: 6, hipNear: -58, kneeNear: 66, ankleNear: 14, hipFar: -6, kneeFar: 58, ankleFar: 18, arm: -40, armFar: 30, fore: -40, foreFar: -50 };
const DUCK = { body: 16, hipNear: -86, kneeNear: 124, ankleNear: -44, hipFar: -68, kneeFar: 128, ankleFar: -76, arm: -52, fore: -92, armFar: -44, foreFar: -96 };
const FLAT_BACK = { body: 0, hipNear: -6.5, kneeNear: 2, ankleNear: 0, hipFar: -6.5, kneeFar: 2, ankleFar: 0, arm: 0, armFar: 0, fore: 0, foreFar: 0 };

const expectPose = (pose: Record<string, unknown>, want: Record<string, number>, digits = 6): void => {
  for (const [k, v] of Object.entries(want)) expect(angle(pose, k), k).toBeCloseTo(v, digits);
};

const legsOf = (pose: Record<string, number>): Record<string, number> => Object.fromEntries(LEGS.map((k) => [k, pose[k]!]));

describe("hero look", () => {
  it("idle is the standing pose on the ground", () => {
    const look = heroLook(hero({ state: "idle", time: 1.3 }), clips, rigs, hold, cfg);
    expect(look.view).toBe("side");
    expect(look.gun).toBe("none");
    expect(Object.keys(look.pose).sort()).toEqual(Object.keys(STAND).sort());
    for (const [k, v] of Object.entries(STAND)) expect(angle(look.pose, k)).toBeCloseTo(v, 6);
    expect(Math.abs(look.lift * cellsPerUnit)).toBeLessThan(0.01);
  });

  it("ladder uses the back view with the gun slung", () => {
    const look = heroLook(hero({ state: "ladder", weapon: "gun", climb: 0.3, onGround: false }), clips, rigs, hold, cfg);
    expect(look.view).toBe("back");
    expect(look.gun).toBe("slung");
    expect(look.lift).toBe(0);
    expect(look.pose.thighL).toBeTypeOf("object");
    expect(look.pose.armL).toBeTypeOf("number");
  });

  const rungCells = (RUNG * spikeUnit(cfg)) / cfg.cellPx;
  const ladderPose = (climb: number) => heroLook(hero({ state: "ladder", climb, onGround: false }), clips, rigs, hold, cfg).pose;
  const aboveFeet = (pose: Record<string, unknown>, hook: string): number => (ROBOT.FOOT_Y - apply(locate(rigs.climber, hook, pose as never)!, [0, 0])[1]) * SPIKE_K;

  it("ladder climb starts with one foot on the floor and the other on the first rung", () => {
    const pose = ladderPose(0);
    expect(pose.thighL).toEqual({ sy: 1 });
    expect((pose.shinL as { dy: number }).dy).toBeCloseTo(0, 9);
    expect(aboveFeet(pose, "footR") - aboveFeet(pose, "footL")).toBeCloseTo(RUNG, 0);
  });

  it("ladder hands stay on their rung while the body climbs, then move up two rungs", () => {
    const heights = [0, 0.2, 0.4, 0.6, 0.8, 0.95].map((k) => {
      const climb = k * RUNG;
      return climb + aboveFeet(ladderPose((climb / RUNG) * rungCells), "handL");
    });
    for (const h of heights) expect(Math.abs(h - (7 * RUNG - 1.5))).toBeLessThan(3);
    const moved = 2 * RUNG + aboveFeet(ladderPose(2 * rungCells), "handL");
    expect(Math.abs(moved - (9 * RUNG - 1.5))).toBeLessThan(3);
  });

  it("ladder hands lock one rung apart and swap each rung", () => {
    const a = ladderPose(0);
    const b = ladderPose(rungCells);
    expect(angle(a, "armL")).toBeCloseTo(-angle(b, "armR"), 3);
    expect(angle(a, "foreL")).toBeCloseTo(-angle(b, "foreR"), 3);
  });

  it("death ends lying on the back", () => {
    const look = heroLook(hero({ state: "death", weapon: "gun", time: clips.death!.duration }), clips, rigs, hold, cfg);
    expect(look.rot).toBeCloseTo(-89, 6);
    expect(look.gun).toBe("dropped");
    expect(look.lift * cellsPerUnit).toBeLessThan(-0.05);
  });

  it("death carries the gun until it drops", () => {
    const carried = heroLook(hero({ state: "death", weapon: "gun", time: 0.6 }), clips, rigs, hold, cfg);
    expect(carried.gun).toBe("hand");
    expect(angle(carried.pose, "body") + angle(carried.pose, "arm") + angle(carried.pose, "fore") - 18).toBeCloseTo(-90, 6);
    expect(carried.pose.carry).toBeUndefined();
    const dropped = heroLook(hero({ state: "death", weapon: "gun", time: 1.05 }), clips, rigs, hold, cfg);
    expect(dropped.gun).toBe("dropped");
    expect(dropped.pose).not.toEqual(heroLook(hero({ state: "death", time: 1.05 }), clips, rigs, hold, cfg).pose);
    const letGo = heroLook(hero({ state: "death", weapon: "gun", time: 1.3 }), clips, rigs, hold, cfg);
    expect(letGo.pose).toEqual(heroLook(hero({ state: "death", time: 1.3 }), clips, rigs, hold, cfg).pose);
  });

  it("drops the gun with a 20 px slide back in 0.3 s", () => {
    const slide = (time: number) => heroLook(hero({ state: "death", weapon: "gun", time }), clips, rigs, hold, cfg).gunSlide;
    expect(slide(0.9)).toBe(0);
    expect(slide(1.15)).toBeCloseTo(0.5, 6);
    expect(slide(1.3)).toBe(1);
  });

  for (const [state, at] of [["fallDeath", 0], ["jumpDeath", 0.36]] as const) {
    it(`${state} raises the landing dust for 0.4 s`, () => {
      const dust = (time: number, onGround = true) => heroLook(hero({ state, time, onGround }), clips, rigs, hold, cfg).dust;
      expect(dust(at + 0.2)).toBeCloseTo(0.5, 6);
      expect(dust(at + 0.2, false)).toBeNull();
      expect(dust(at + 0.45)).toBeNull();
    });
  }

  it("death raises no dust", () => {
    for (let time = 0; time < 3; time += 0.1) expect(heroLook(hero({ state: "death", time }), clips, rigs, hold, cfg).dust).toBeNull();
  });

  for (const state of ["death", "fallDeath", "jumpDeath"] as const) {
    it(`${state} folds into FLAT_BACK and keeps the body on the floor`, () => {
      const clip = clips[state]!;
      expectPose(clip.pose[clip.pose.length - 1]![1], FLAT_BACK);
      const [fold, flat] = clip.pose.slice(-2).map(([t]) => t) as [number, number];
      expect(flat - fold).toBeCloseTo(0.4, 9);
      expect(clip.rot![clip.rot!.length - 1]![1]).toBe(-89);
      const lifts = Array.from({ length: 60 }, (_, i) => heroLook(hero({ state, time: fold + i / 60 }), clips, rigs, hold, cfg).lift * SPIKE_K);
      for (let i = 1; i < lifts.length; i++) expect(Math.abs(lifts[i]! - lifts[i - 1]!), `frame ${i}`).toBeLessThan(6);
    });
  }

  it("death with fists never shows a gun", () => {
    expect(heroLook(hero({ state: "death", time: 0.2 }), clips, rigs, hold, cfg).gun).toBe("none");
    expect(heroLook(hero({ state: "death", time: 4 }), clips, rigs, hold, cfg).gun).toBe("none");
  });

  it("front view is never mirrored", () => {
    for (const facing of [1, -1] as const) {
      const look = heroLook(hero({ state: "hide", time: 0.05, facing }), clips, rigs, hold, cfg);
      expect(look).toMatchObject({ view: "front", flip: false });
    }
  });

  it("front view with the gun uses the front carry", () => {
    const look = heroLook(hero({ state: "hide", weapon: "gun", time: 0.05 }), clips, rigs, hold, cfg);
    expect(look.gun).toBe("hand");
    expect(look.pose).toMatchObject({ ...hold.FRONT_CARRY, ...hold.FRONT_CARRY_R });
  });

  it("weapon switch is a front view clip that blends to the front carry and drops the pseudo key", () => {
    const look = heroLook(hero({ state: "weaponSwitch", weapon: "gun", time: 1 }), clips, rigs, hold, cfg);
    expect(look.view).toBe("front");
    expect(look.pose.carry).toBeUndefined();
    expect(look.gun).toBe("hand");
    expect(look.pose).toMatchObject({ ...hold.FRONT_CARRY, ...hold.FRONT_CARRY_R });
    expect(heroLook(hero({ state: "weaponSwitch", time: 0.05 }), clips, rigs, hold, cfg).gun).toBe("none");
  });

  it("keeps the hide tint while switching behind cover", () => {
    expect(heroLook(hero({ state: "weaponSwitch", time: 0.5, hidden: true }), clips, rigs, hold, cfg).tint).toBe(1);
    expect(heroLook(hero({ state: "weaponSwitch", time: 0.5 }), clips, rigs, hold, cfg).tint).toBe(0);
  });

  for (const state of ["standJump", "walkJump", "duckJump", "runJump"] as const) {
    it(`${state} eases its lift out from take-off`, () => {
      const at = (time: number) => heroLook(hero({ state, time, onGround: false }), clips, rigs, hold, cfg).lift * cellsPerUnit;
      for (let f = 0; f < 3; f++) {
        if (state === "duckJump") expect(Math.abs(at((f + 1) / 60)), `frame ${f}`).toBeLessThan(Math.abs(at(f / 60)));
        else expect(Math.abs(at((f + 1) / 60) - at(f / 60)), `frame ${f}`).toBeLessThan(0.1);
      }
      expect(at(0.1)).toBe(0);
    });
  }

  it("weapon switch moves the hand from rest toward the carry without lifting it", () => {
    const at = (time: number) => heroLook(hero({ state: "weaponSwitch", weapon: "gun", time }), clips, rigs, hold, cfg).pose;
    expect([at(0).armL ?? 0, at(0).foreL ?? 0]).toEqual([0, 0]);
    const drawAt = clips.weaponSwitch!.gun!.find(([, g]) => g === "hand")![0];
    for (const t of [drawAt, 0.3, 0.45]) {
      expect(at(t).armL).toBeLessThanOrEqual(0);
      expect(at(t).armL).toBeGreaterThanOrEqual(hold.FRONT_CARRY.armL);
    }
  });

  it("is zero in the air and the same for the same input", () => {
    const h = hero({ state: "fall", time: 0.1, onGround: false });
    expect(heroLook(h, clips, rigs, hold, cfg).lift).toBe(0);
    const d = hero({ state: "death", time: 1.4 });
    expect(heroLook(d, clips, rigs, hold, cfg)).toEqual(heroLook(d, clips, rigs, hold, cfg));
  });

  for (const [state, g] of [["walk", WALK], ["run", RUN]] as const) {
    it(`${state} pose and height come from the gait engine`, () => {
      for (let i = 0; i < 12; i++) {
        const time = (i * g.cycle) / 12 + 0.01;
        const look = heroLook(hero({ state, time }), clips, rigs, hold, cfg);
        const phase = (TAU * time) / clips[state]!.duration;
        expectPose(look.pose, gaitPose(g, phase));
        expect(look.lift).toBeCloseTo(gaitBob(g, phase) / SPIKE_K, 6);
      }
    });

    it(`gun ${state} keeps the forearm at one world angle over a cycle`, () => {
      const world = Array.from({ length: 24 }, (_, i) => {
        const look = heroLook(hero({ state, weapon: "gun", time: (i * g.cycle) / 24 }), clips, rigs, hold, cfg);
        expect(look.gun).toBe("hand");
        return angle(look.pose, "body") + angle(look.pose, "arm") + angle(look.pose, "fore");
      });
      const mean = world.reduce((a, b) => a + b, 0) / world.length;
      expect(Math.abs(mean + 72)).toBeLessThan(0.5);
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
      const look = heroLook(g.hero, clips, rigs, hold, cfg);
      expect(look.view).toBe("side");
      expect(look.flip).toBe(i < 10);
      expectPose(look.pose, gaitPose(WALK, (TAU * g.hero.time) / clips.walk!.duration));
    }
  });

  it("hide is front view with full tint on the press frame", () => {
    const g = game();
    tick(g, ["hide"]);
    expect(heroLook(g.hero, clips, rigs, hold, cfg)).toMatchObject({ view: "front", tint: 1 });
    for (let i = 0; i < 27; i++) tick(g, ["hide"]);
    expect(heroLook(g.hero, clips, rigs, hold, cfg)).toMatchObject({ view: "front", tint: 1 });
  });

  const angleOr0 = (pose: Record<string, unknown>, k: string): number => (typeof pose[k] === "number" ? (pose[k] as number) : 0);
  const maxStep = (a: Record<string, unknown>, b: Record<string, unknown>): number =>
    Math.max(0, ...[...new Set([...Object.keys(a), ...Object.keys(b)])].map((k) => Math.abs(angleOr0(b, k) - angleOr0(a, k))));

  const jumpFrom = (held: string[]) => (g: Game) => {
    for (let i = 0; i < 20; i++) tick(g, held);
    tick(g, held, ["up"]);
  };
  const walkOff = (g: Game) => {
    while (g.hero.state !== "fall") tick(g, ["moveRight"]);
  };
  for (const [state, start, at, held, end, window, slope] of [
    ["standJump", jumpFrom([]), undefined, [], "idle", 0.06, 1],
    ["walkJump", jumpFrom(["moveRight"]), undefined, ["moveRight"], "walk", 0.06, 1],
    ["runJump", jumpFrom(["moveRight", RUNNING]), undefined, ["moveRight", RUNNING], "run", 0.06, 1],
    ["fall", walkOff, { x: 15, y: 11 }, [], "idle", 0.06, 1],
  ] as const) {
    it(`${state} lands without a pose snap`, () => {
      const g = game(at);
      start(g);
      expect(g.hero.state).toBe(state);
      const looks: Record<string, unknown>[] = [];
      const targets: Record<string, unknown>[] = [];
      let landed = -1;
      for (let i = 0; i < 90 && (landed < 0 || i < landed + 12); i++) {
        tick(g, [...held]);
        if (landed < 0 && g.hero.state !== state) landed = i;
        looks.push(heroLook(g.hero, clips, rigs, hold, cfg).pose);
        targets.push(heroLook({ ...g.hero, landing: null }, clips, rigs, hold, cfg).pose);
      }
      expect(landed).toBeGreaterThan(0);
      expect(g.hero.state).toBe(end);
      const gap = maxStep(looks[landed]!, targets[landed]!);
      const rate = Math.max(...targets.slice(landed, -1).map((t, i) => maxStep(t, targets[landed + i + 1]!)));
      const bound = rate + (gap * slope) / (window * 60) + 1;
      expect(gap).toBeGreaterThan(30);
      for (let i = landed - 2; i < looks.length - 1; i++) expect(maxStep(looks[i]!, looks[i + 1]!), `frame ${i - landed}`).toBeLessThan(bound);
    });
  }

  it("every jump uses the one leap pose after the shared 0.08 s blend", () => {
    for (const state of ["standJump", "duckJump", "walkJump", "runJump"] as const) {
      expectPose(heroLook(hero({ state, time: 0.08, onGround: false }), clips, rigs, hold, cfg).pose, LEAP);
      const early = heroLook(hero({ state, time: 0.04, onGround: false }), clips, rigs, hold, cfg).pose;
      expect(Math.abs(angle(early, "arm") - LEAP.arm), state).toBeGreaterThan(1);
    }
  });

  it("fall and fall death share the fall pose", () => {
    const fall = heroLook(hero({ state: "fall", time: 0.2, onGround: false }), clips, rigs, hold, cfg).pose;
    const death = heroLook(hero({ state: "fallDeath", time: 0 }), clips, rigs, hold, cfg).pose;
    expect(death).toEqual(fall);
  });

  it("duck, duck punch and duck shoot share the duck legs, with punch arms leveled to the stance lean", () => {
    const legs = (state: "duck" | "duckAttack", weapon: "fists" | "gun", time: number) =>
      legsOf(heroLook(hero({ state, weapon, time }), clips, rigs, hold, cfg).pose as Record<string, number>);
    const duck = legs("duck", "fists", clips.duck!.duration);
    expect(duck).toEqual(legsOf(DUCK));
    expect(legs("duckAttack", "fists", 0.5)).toEqual(duck);
    expect(legs("duckAttack", "gun", 0.5)).toEqual(duck);
    for (let i = 0; i < 24; i++) {
      const time = (i * 1.2) / 24;
      const stand = heroLook(hero({ state: "attack", time }), clips, rigs, hold, cfg).pose as Record<string, number>;
      const low = heroLook(hero({ state: "duckAttack", time }), clips, rigs, hold, cfg).pose as Record<string, number>;
      for (const k of ["arm", "armFar"]) expect(low.body! + low[k]!, `${k} at ${time}`).toBeCloseTo(stand.body! + stand[k]!, 6);
      for (const k of ["fore", "foreFar"]) expect(low[k], `${k} at ${time}`).toBeCloseTo(stand[k]!, 6);
    }
  });

  it("use lowers the gun and reaches with the far arm", () => {
    const rest = heroLook(hero({ state: "use", weapon: "gun", time: 0 }), clips, rigs, hold, cfg);
    expect(rest).toMatchObject({ gun: "hand", pose: { arm: 4, fore: -6 } });
    const reach = heroLook(hero({ state: "use", weapon: "fists", time: 0.8 }), clips, rigs, hold, cfg).pose;
    expect(heroLook(hero({ state: "use", weapon: "gun", time: 0.8 }), clips, rigs, hold, cfg).pose).toMatchObject({ armFar: reach.arm, foreFar: reach.fore });
  });

  it("kneel keeps the gun in carry", () => {
    for (const time of [0, 0.45, 0.8, 1.6]) {
      const look = heroLook(hero({ state: "kneel", weapon: "gun", time }), clips, rigs, hold, cfg);
      expect(look.gun).toBe("hand");
      expect(angle(look.pose, "body") + angle(look.pose, "arm")).toBeCloseTo(hold.CARRY.arm, 6);
      expect(angle(look.pose, "fore")).toBeCloseTo(hold.CARRY.fore, 6);
    }
  });

  it("duck jump launches straight from the duck pose into the leap", () => {
    const start = heroLook(hero({ state: "duckJump", time: 0, onGround: false }), clips, rigs, hold, cfg);
    const ducked = heroLook(hero({ state: "duck", time: clips.duck!.duration }), clips, rigs, hold, cfg);
    expectPose(start.pose, DUCK);
    expect(start.lift).toBeCloseTo(ducked.lift, 6);
    expectPose(heroLook(hero({ state: "duckJump", time: 0.1, onGround: false }), clips, rigs, hold, cfg).pose, LEAP);
  });

  it("duck jump landing with down held goes straight from the leap into the duck pose", () => {
    const g = game();
    for (let i = 0; i < 18; i++) tick(g, ["down"]);
    tick(g, ["down", "up"], ["up"]);
    expect(g.hero.state).toBe("duckJump");
    while (g.hero.state === "duckJump") tick(g, ["down"]);
    expect(g.hero.state).toBe("duck");
    for (let i = 0; i < 10; i++) {
      expectPose(heroLook(g.hero, clips, rigs, hold, cfg).pose, DUCK);
      tick(g, ["down"]);
    }
  });

  for (const [state, gait, g, leap] of [["walkJump", "walk", WALK, LEAP], ["runJump", "run", RUN, LEAP]] as const) {
    it(`${state} blends from the gait pose at take-off into the leap`, () => {
      const g0 = game();
      for (let i = 0; i < 23; i++) tick(g0, gait === "run" ? ["moveRight", RUNNING] : ["moveRight"]);
      expect(g0.hero.state).toBe(gait);
      const before = heroLook(g0.hero, clips, rigs, hold, cfg);
      tick(g0, gait === "run" ? ["moveRight", RUNNING] : ["moveRight"], ["up"]);
      expect(g0.hero.state).toBe(state);
      const after = heroLook(g0.hero, clips, rigs, hold, cfg);
      for (const k of LEGS) expect(Math.abs(angle(after.pose, k) - angle(before.pose, k)), k).toBeLessThan(15);
      const flying = heroLook({ ...g0.hero, time: 0.1 }, clips, rigs, hold, cfg);
      expectPose(flying.pose, leap);
      expect(legsOf(flying.pose as Record<string, number>)).not.toEqual(legsOf(gaitPose(g, 0)));
    });
  }

  it("a hit flashes the chest and head and snaps the head back", () => {
    const at = (hitAge: number) => heroLook(hero({ state: "attack", weapon: "gun", time: 0.3, hitAge }), clips, rigs, hold, cfg);
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
    expect(heroLook(hero({ state: "idle" }), clips, rigs, hold, cfg).hit).toBeNull();
  });

  it("keeps the base move under a hit", () => {
    const base = heroLook(hero({ state: "runJump", time: 0.2, onGround: false }), clips, rigs, hold, cfg);
    const hit = heroLook(hero({ state: "runJump", time: 0.2, onGround: false, hitAge: 0.1 }), clips, rigs, hold, cfg);
    const { head, chest, ...rest } = hit.pose;
    expect(head).toBeTypeOf("object");
    expect(chest).toBeTypeOf("object");
    expect(rest).toEqual(base.pose);
    expect(hit.lift).toBe(base.lift);
  });

  it("the hit star sits at the impact point and fades in 0.3 s", () => {
    const at = (hitAge: number) => heroLook(hero({ state: "idle", hitAge }), clips, rigs, hold, cfg).hit!;
    expect(at(0).spark).toBe(0);
    expect(at(0.15).spark).toBeCloseTo(0.5, 6);
    expect(at(0.3).spark).toBe(1);
    expect(at(0.1).star).toEqual(at(0.4).star);
  });

  it("death in a running jump goes limp, lies down and drops the gun on landing", () => {
    const g = game();
    for (let i = 0; i < 20; i++) tick(g, ["moveRight", RUNNING]);
    tick(g, ["moveRight", RUNNING], ["up"]);
    for (let i = 0; i < 10; i++) tick(g, ["moveRight", RUNNING]);
    g.hero.weapon = "gun";
    g.hero.energy = cfg.energy.hit;
    damage(g.hero, cfg);
    expect(g.hero.state).toBe("jumpDeath");
    expect(heroLook(g.hero, clips, rigs, hold, cfg).gun).toBe("hand");
    const limp = heroLook({ ...g.hero, time: 0.2 }, clips, rigs, hold, cfg);
    expectPose(limp.pose, { body: 0, hipNear: -30, kneeNear: 40, ankleNear: 20 });
    expect(limp.gun).toBe("hand");
    for (let i = 0; i < 120; i++) tick(g);
    const lying = heroLook(g.hero, clips, rigs, hold, cfg);
    expect(lying.rot).toBeCloseTo(-89, 6);
    expect(lying.gun).toBe("dropped");
    expect(lying.lift * cellsPerUnit).toBeLessThan(-0.05);
  });
});
