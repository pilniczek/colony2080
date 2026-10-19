import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import type { Hero } from "./hero";
import { cfg, clips, dt, game, run, runUntil, RUNNING, tick, type Game } from "./testWorld";

const walkSpeed = clips.walk!.travel! / clips.walk!.duration;
const runSpeed = clips.run!.travel! / clips.run!.duration;

const dropLevel = {
  ...sandbox,
  rows: [
    "########################################",
    ...Array.from({ length: 6 }, () => "#......................................#"),
    "###########............................#",
    ...Array.from({ length: 6 }, () => "#......................................#"),
    "########################################",
    "########################################",
  ],
  lifts: [{ ...sandbox.lifts[0]!, x: 34 }],
};

const highLedge = { x: 22, y: 4 };

describe("walk and run", () => {
  it("walks the walk clip travel per duration", () => {
    const g = game();
    run(g, 1, ["moveRight"]);
    expect(g.hero.state).toBe("walk");
    expect(Math.abs(g.hero.x - 7.5 - walkSpeed)).toBeLessThan(0.05);
  });

  it("runs the run clip travel per duration with the run modifier", () => {
    const g = game();
    run(g, 1, ["moveRight", RUNNING]);
    expect(g.hero.state).toBe("run");
    expect(Math.abs(g.hero.x - 7.5 - runSpeed)).toBeLessThan(0.05);
  });

  it("toggles between walk and run on each run press and keeps the mode", () => {
    const g = game();
    run(g, 0.2, ["moveRight"]);
    tick(g, ["moveRight"], ["runToggle"]);
    expect(g.hero).toMatchObject({ state: "run", running: true });
    run(g, 0.5, ["moveRight"]);
    expect(g.hero.state).toBe("run");
    tick(g);
    expect(g.hero.state).toBe("idle");
    tick(g, ["moveLeft"]);
    tick(g, ["moveLeft"]);
    expect(g.hero.state).toBe("run");
    tick(g, ["moveLeft"], ["runToggle"]);
    expect(g.hero).toMatchObject({ state: "walk", running: false });
  });

  it("toggles run mode while standing", () => {
    const g = game();
    tick(g, [], ["runToggle"]);
    expect(g.hero).toMatchObject({ state: "idle", running: true });
    tick(g, ["moveRight"]);
    expect(g.hero.state).toBe("run");
  });
});

describe("turn", () => {
  it("flips facing in place from idle on the press frame", () => {
    const g = game();
    tick(g, ["moveLeft"]);
    expect(g.hero).toMatchObject({ state: "idle", facing: -1, x: 7.5 });
    tick(g, ["moveLeft"]);
    expect(g.hero.state).toBe("walk");
    expect(g.hero.x).toBeLessThan(7.5);
  });

  it("flips facing in one tick while walking and keeps the walk phase", () => {
    const g = game();
    run(g, 0.2, ["moveRight"]);
    const time = g.hero.time;
    tick(g, ["moveLeft"]);
    expect(g.hero).toMatchObject({ state: "walk", facing: -1 });
    expect(g.hero.time).toBeCloseTo(time + 1 / 60, 9);
    expect(g.hero.vx).toBeCloseTo(-walkSpeed, 9);
  });
});

const peakAndAir = (g: Game, held: (frame: number) => string[] = () => []) => {
  const y0 = g.hero.fallFrom;
  let top = g.hero.y;
  let frames = 0;
  while (!g.hero.onGround && frames < 300) {
    tick(g, held(frames));
    top = Math.min(top, g.hero.y);
    frames++;
  }
  return { peak: y0 - top, frames };
};

const landsNextTick = (h: Hero): boolean => {
  const vy = Math.min(h.vy + cfg.gravity * dt, cfg.maxFallSpeed);
  return h.vy > 0 && h.y + ((h.vy + vy) / 2) * dt >= 14 - 1e-9;
};

describe("jumps", () => {
  for (const [jump, gait, held] of [["walkJump", "walk", ["moveRight"]], ["runJump", "run", ["moveRight", RUNNING]]] as const) {
    it(`${jump} lands back into ${gait} at take-off phase plus air time`, () => {
      const g = game();
      run(g, 0.4, [...held]);
      tick(g, [...held], ["up"]);
      expect(g.hero.state).toBe(jump);
      const takeOff = g.hero.gaitTime;
      let air = 0;
      while (g.hero.state === jump) {
        air = g.hero.time;
        tick(g, [...held]);
      }
      air += dt;
      expect(g.hero.state).toBe(gait);
      expect(g.hero.landing).toMatchObject({ from: jump, age: 0 });
      expect(g.hero.landing!.time).toBeCloseTo(air, 9);
      const duration = clips[gait]!.duration;
      expect(g.hero.time).toBeCloseTo((takeOff + air) % duration, 9);
    });
  }

  for (const [jump, held, speed] of [["walkJump", ["moveRight"], walkSpeed], ["runJump", ["moveRight", RUNNING], cfg.jump.runSpeed]] as const) {
    it(`${jump} with up buffered before touchdown jumps again keeping the gait phase and speed`, () => {
      const takeOff = (): Game => {
        const g = game();
        run(g, 0.4, [...held]);
        tick(g, [...held], ["up"]);
        return g;
      };
      const plain = takeOff();
      let frames = 0;
      for (; plain.hero.state === jump; frames++) tick(plain, [...held]);
      const g = takeOff();
      const gaitTime = g.hero.gaitTime;
      run(g, (frames - 3) / 60, [...held]);
      tick(g, [...held], ["up"]);
      run(g, 1 / 60, [...held]);
      const air = g.hero.time + dt;
      tick(g, [...held]);
      expect(g.seen.has("standJump")).toBe(false);
      expect(g.hero).toMatchObject({ state: jump, time: 0 });
      expect(g.hero.vy).toBeLessThan(0);
      expect(g.hero.vx).toBeCloseTo(speed, 9);
      expect(g.hero.gaitTime).toBeCloseTo((gaitTime + air) % clips[clips[jump]!.gait!]!.duration, 9);
    });
  }

  it("lands a duck jump with down held straight into the full duck", () => {
    const g = game();
    run(g, 0.3, ["down"]);
    tick(g, ["down", "up"], ["up"]);
    expect(g.hero.state).toBe("duckJump");
    runUntil(g, (h) => h.onGround, ["down"]);
    expect(g.hero.state).toBe("duck");
    expect(g.hero.time).toBe(clips.duck!.duration);
  });

  it("leaves the floor on the press frame and the standing jump peaks at 1.0 cells", () => {
    const g = game();
    tick(g, [], ["up"]);
    expect(g.hero.state).toBe("standJump");
    expect(g.hero.vy).toBeLessThan(0);
    expect(g.hero.y).toBeLessThan(14);
    const { peak } = peakAndAir(g);
    expect(Math.abs(peak - cfg.jump.standHeight)).toBeLessThan(0.05);
    expect(g.hero).toMatchObject({ state: "idle", x: 7.5 });
  });

  it("jumps again on the landing frame when up is pressed as the hero lands", () => {
    const g = game();
    tick(g, [], ["up"]);
    runUntil(g, landsNextTick);
    expect(g.hero.state).toBe("standJump");
    tick(g, ["up"], ["up"]);
    expect(g.hero.state).toBe("standJump");
    expect(g.hero.time).toBe(0);
    expect(g.hero.vy).toBeLessThan(0);
    tick(g, ["up"]);
    expect(g.hero.y).toBeLessThan(14);
  });

  it("walking jump launches from walk with walk speed and peaks at walkHeight", () => {
    const g = game();
    run(g, 0.2, ["moveRight"]);
    tick(g, ["moveRight"], ["up"]);
    expect(g.hero.state).toBe("walkJump");
    expect(g.hero.vy).toBeLessThan(0);
    expect(g.hero.vx).toBeCloseTo(walkSpeed, 9);
    const { peak } = peakAndAir(g, () => ["moveRight"]);
    expect(Math.abs(peak - cfg.jump.walkHeight)).toBeLessThan(0.05);
  });

  it("duck jump launches from duck with the standing jump height", () => {
    const g = game();
    run(g, 0.3, ["down"]);
    expect(g.hero.state).toBe("duck");
    tick(g, ["down", "up"], ["up"]);
    expect(g.hero.state).toBe("duckJump");
    expect(g.hero.vy).toBeLessThan(0);
    const { peak } = peakAndAir(g);
    expect(Math.abs(peak - cfg.jump.standHeight)).toBeLessThan(0.05);
    expect(g.hero.x).toBe(7.5);
  });

  it("returns to walk when landing with an arrow held", () => {
    const g = game();
    tick(g, [], ["up"]);
    peakAndAir(g, () => ["moveRight"]);
    expect(g.hero.state).toBe("walk");
  });

  it("flips and reverses speed on an opposite arrow mid-air with arc and air time unchanged", () => {
    const plain = game({ x: 7.5, y: 14, state: "run" });
    tick(plain, ["moveRight", RUNNING], ["up"]);
    const base = peakAndAir(plain);
    const g = game({ x: 7.5, y: 14, state: "run" });
    tick(g, ["moveRight", RUNNING], ["up"]);
    expect(g.hero.vx).toBeCloseTo(cfg.jump.runSpeed, 9);
    tick(g, ["moveLeft"]);
    expect(g.hero).toMatchObject({ state: "runJump", facing: -1 });
    expect(g.hero.vx).toBeCloseTo(-cfg.jump.runSpeed, 9);
    const flipped = peakAndAir(g);
    expect(Math.abs(flipped.peak - base.peak)).toBeLessThan(0.01);
    expect(flipped.frames + 1).toBe(base.frames);
  });

  it("flips once per opposite press for many presses mid-air", () => {
    const g = game({ x: 7.5, y: 14, state: "run" });
    tick(g, ["moveRight", RUNNING], ["up"]);
    const keys = ["moveLeft", "moveLeft", "", "moveRight", "moveRight", "", "moveLeft", "moveLeft"];
    for (const key of keys) tick(g, key ? [key] : []);
    expect(g.hero).toMatchObject({ state: "runJump", facing: -1 });
    expect(g.hero.vx).toBeCloseTo(-cfg.jump.runSpeed, 9);
    const plain = game({ x: 7.5, y: 14, state: "run" });
    tick(plain, ["moveRight", RUNNING], ["up"]);
    run(plain, keys.length / 60);
    expect(g.hero.y).toBeCloseTo(plain.hero.y, 9);
    expect(g.hero.vy).toBeCloseTo(plain.hero.vy, 9);
  });

  it("clears the 3-cell gap with a running jump from x 27.6", () => {
    const g = game({ x: 27.6, y: 14, state: "run" });
    tick(g, ["moveRight", RUNNING], ["up"]);
    expect(g.hero.state).toBe("runJump");
    runUntil(g, (h) => h.onGround);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.y).toBeCloseTo(14, 6);
    expect(g.hero.x).toBeGreaterThan(31);
  });

  it("falls into the pit from a running jump at the 4-cell gap", () => {
    const g = game({ x: 33.6, y: 14, state: "run" });
    tick(g, ["moveRight", RUNNING], ["up"]);
    run(g, 2);
    expect(g.hero.state).toBe("fallDeath");
    expect(g.seen.has("idle")).toBe(false);
    expect(g.events.filter((e) => e.kind === "died")).toHaveLength(1);
  });
});

describe("falls", () => {
  it("survives a running jump down a 7-cell drop, measured from take-off", () => {
    const g = game({ x: 10.6, y: 7, state: "run" }, dropLevel);
    tick(g, ["moveRight", RUNNING], ["up"]);
    expect(g.hero.state).toBe("runJump");
    runUntil(g, (h) => h.onGround);
    expect(g.hero.state).toBe("idle");
    expect(g.seen.has("fallDeath")).toBe(false);
    expect(g.hero.y).toBeCloseTo(14, 6);
  });

  it("survives walking off an exactly 7-cell drop", () => {
    const g = game({ x: 10, y: 7 }, dropLevel);
    runUntil(g, (h) => h.state === "fall", ["moveRight"]);
    runUntil(g, (h) => h.onGround);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.y).toBeCloseTo(14, 6);
  });

  it("keeps walk speed while falling off the left platform", () => {
    const g = game({ x: 10, y: 4 });
    runUntil(g, (h) => h.state === "fall", ["moveRight"]);
    expect(g.hero.vx).toBeCloseTo(walkSpeed, 9);
    for (let i = 0; i < 20; i++) {
      tick(g);
      expect(g.hero.state).toBe("fall");
      expect(g.hero.vx).toBeCloseTo(walkSpeed, 9);
    }
    runUntil(g, (h) => h.onGround);
    expect(g.hero).toMatchObject({ state: "idle", y: 11 });
  });

  it("lands a walk off a ledge back into walk at the walk-off phase plus fall time", () => {
    const g = game({ x: 15, y: 11 });
    runUntil(g, (h) => h.state === "fall", ["moveRight"]);
    const takeOff = g.hero.gaitTime;
    expect(takeOff).toBeGreaterThan(0);
    let air = 0;
    while (g.hero.state === "fall") {
      air = g.hero.time;
      tick(g, ["moveRight"]);
    }
    air += dt;
    expect(g.hero.state).toBe("walk");
    expect(g.hero.time).toBeCloseTo((takeOff + air) % clips.walk!.duration, 9);
  });

  it("dies walking off the right high platform", () => {
    const g = game(highLedge);
    runUntil(g, (h) => h.state === "fall", ["moveRight"]);
    expect(g.hero.state).toBe("fall");
    runUntil(g, (h) => h.onGround);
    expect(g.hero.state).toBe("fallDeath");
    expect(g.hero.y).toBeCloseTo(14, 6);
    expect(g.events.map((e) => e.kind)).toEqual(["died"]);
  });

  it("lands safely walking off the low ledge", () => {
    const g = game({ x: 15, y: 11 });
    runUntil(g, (h) => h.state === "fall", ["moveRight"]);
    expect(g.hero.state).toBe("fall");
    run(g, 1.5);
    expect(g.seen.has("fallDeath")).toBe(false);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.y).toBeCloseTo(14, 6);
  });

  it("respawns at spawn with full energy 2 s after a fall death", () => {
    const g = game(highLedge);
    runUntil(g, (h) => h.state === "fallDeath", ["moveRight"]);
    g.hero.energy = 0;
    run(g, cfg.respawnMs / 1000 - 0.1);
    expect(g.hero.state).toBe("fallDeath");
    run(g, 0.2);
    expect(g.hero.state).toBe("idle");
    expect([g.hero.x, g.hero.y]).toEqual(g.world.spawn);
    expect(g.hero.energy).toBe(cfg.energy.max);
  });

  it("keeps the run mode on respawn", () => {
    for (const running of [false, true]) {
      const g = game(highLedge);
      runUntil(g, (h) => h.state === "fallDeath", ["moveRight"]);
      g.hero.running = running;
      run(g, cfg.respawnMs / 1000 + 0.1);
      expect(g.hero.running).toBe(running);
    }
  });
});

describe("ladder", () => {
  it("climbs from the floor to the platform at y 4 and returns to idle", () => {
    const g = game({ x: 3.4, y: 14 });
    tick(g, [], ["up"]);
    expect(g.hero.state).toBe("ladder");
    expect(g.hero.x).toBe(3.5);
    runUntil(g, (h) => h.state !== "ladder", ["up"]);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.y).toBeCloseTo(4, 6);
    expect(g.hero.climb).toBeCloseTo(10, 6);
    run(g, 0.5, ["up"]);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.y).toBeCloseTo(4, 6);
  });

  it("climbs down from the ladder top through the one-way floor", () => {
    const g = game({ x: 3.5, y: 4 });
    run(g, 0.1);
    expect(g.hero.state).toBe("idle");
    tick(g, ["down"]);
    expect(g.hero.state).toBe("ladder");
    expect(g.hero.climb).toBeCloseTo(14 - g.hero.y, 6);
    runUntil(g, (h) => h.state !== "ladder", ["down"]);
    expect(g.hero.state).toBe("idle");
    expect(g.hero.y).toBeCloseTo(14, 6);
    expect(g.hero.climb).toBeCloseTo(0, 6);
  });
});

describe("ladder dismount", () => {
  for (const [key, facing] of [["moveRight", 1], ["moveLeft", -1]] as const) {
    it(`drops off the ladder on ${key}`, () => {
      const g = game({ x: 3.5, y: 14 });
      tick(g, [], ["up"]);
      run(g, 1, ["up"]);
      const y = g.hero.y;
      tick(g, [key]);
      expect(g.hero).toMatchObject({ state: "fall", facing, fallFrom: y });
      expect(g.hero.vx).toBeCloseTo(facing * walkSpeed, 6);
      runUntil(g, (h) => h.onGround);
      expect(g.hero.y).toBeCloseTo(14, 6);
      expect(Math.sign(g.hero.x - 3.5)).toBe(facing);
      expect(g.hero.state).toBe("idle");
    });
  }
});

describe("ladder from a gait", () => {
  for (const held of [["moveRight"], ["moveRight", RUNNING]]) {
    it(`grabs the ladder on up while ${held.length > 1 ? "running" : "walking"}`, () => {
      const g = game({ x: 3.15, y: 14, state: held.length > 1 ? "run" : "walk" });
      tick(g, held, ["up"]);
      expect(g.hero).toMatchObject({ state: "ladder", x: 3.5 });
    });
  }
});

describe("buffered up", () => {
  it("drops an up tap made in the last frames of a climb", () => {
    const g = game({ x: 3.5, y: 14 });
    tick(g, [], ["up"]);
    runUntil(g, (h) => h.y < 4.1, ["up"]);
    tick(g, ["up"], ["up"]);
    runUntil(g, (h) => h.state !== "ladder", ["up"]);
    run(g, 0.5);
    expect([...g.seen]).toEqual(["idle", "ladder"]);
    expect(g.hero.y).toBeCloseTo(4, 6);
  });

});

describe("lift", () => {
  it("stops a walk and calls the lift on up without jumping", () => {
    const g = game({ x: 18.5, y: 14 });
    tick(g);
    run(g, 0.1, ["moveRight"]);
    expect(g.hero).toMatchObject({ state: "walk", onLift: true });
    tick(g, ["moveRight"], ["up"]);
    expect(g.hero).toMatchObject({ state: "idle", onGround: true });
    expect(g.world.lifts[0]!.target).toBe(4);
    expect(g.seen.has("walkJump")).toBe(false);
  });

  it("still run jumps across the lift", () => {
    const g = game({ x: 18.5, y: 14 });
    tick(g);
    tick(g, ["moveRight", RUNNING]);
    expect(g.hero).toMatchObject({ state: "run", onLift: true });
    tick(g, ["moveRight", RUNNING], ["up"]);
    expect(g.hero.state).toBe("runJump");
    expect(g.world.lifts[0]!.target).toBeNull();
  });

  it("rides to the top on one up press without jumping", () => {
    const g = game({ x: 18.5, y: 14 });
    tick(g);
    tick(g, [], ["up"]);
    run(g, 5);
    expect([...g.seen]).toEqual(["idle"]);
    expect(g.world.lifts[0]!.y).toBe(4);
    expect(g.hero.y).toBeCloseTo(4, 6);
  });
});
