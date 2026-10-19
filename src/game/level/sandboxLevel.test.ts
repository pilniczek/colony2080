import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { moveBox } from "../../engine/world/collide";
import { cfg, game, run, runUntil, RUNNING, tick } from "../hero/testWorld";
import { callLift, loadSandbox, onGround, pickUp, resetWorld, updateLift } from "./sandboxLevel";

const dt = 1 / 60;

function ride(dir: -1 | 1, speed: number): void {
  const world = loadSandbox(sandbox);
  const { grid } = world;
  const lift = world.lifts[0]!;
  const start = dir < 0 ? lift.bottom : lift.top;
  lift.y = start;
  let hero = { x: 18.5, y: start, w: 0.7, h: 1.9 };
  callLift(lift, dir);
  const target = lift.target;
  let frames = 0;
  while (lift.target !== null && frames++ < 2000) {
    if (frames === 6) {
      callLift(lift, dir === -1 ? 1 : -1);
      expect(lift.target).toBe(target);
    }
    updateLift(lift, speed, dt);
    const carried = moveBox(hero, 0, lift.vy * dt, grid, [lift]);
    const settled = moveBox({ ...hero, y: carried.y }, 0, 0.02, grid, [lift]);
    hero = { ...hero, y: settled.y };
    expect(settled.platform).toBe(lift);
    expect(settled.y).toBeCloseTo(lift.y, 9);
  }
  expect(lift.y).toBe(target);
  expect(lift.target).toBeNull();
  updateLift(lift, speed, dt);
  expect(lift.vy).toBe(0);
}

describe("lift", () => {
  it("refuses a call until its flag is set", () => {
    const world = loadSandbox(sandbox);
    const lift = world.lifts[0]!;
    lift.enabledBy = "flag:open";
    const flags = new Set<string>();
    expect(callLift(lift, -1, flags)).toBe(false);
    expect(lift.target).toBeNull();
    flags.add("flag:open");
    expect(callLift(lift, -1, flags)).toBe(true);
    expect(lift.target).not.toBeNull();
  });

  it("carries a standing box up, stops exactly on top and clears the target", () => ride(-1, 3.7));
  it("carries a standing box down, stopping exactly on the bottom", () => ride(1, 3.7));

  it("starts at the bottom stop unless the level says top", () => {
    const lift = { x: 1, width: 3, top: 4, bottom: 14 };
    expect(loadSandbox({ ...sandbox, lifts: [lift] }).lifts[0]!.y).toBe(14);
    expect(loadSandbox({ ...sandbox, lifts: [{ ...lift, start: "top" }] }).lifts[0]!.y).toBe(4);
  });

  it("moves down on a bottom call", () => {
    const lift = loadSandbox(sandbox).lifts[0]!;
    lift.y = 4;
    callLift(lift, 1);
    expect(lift.target).toBe(14);
    updateLift(lift, 3, dt);
    expect(lift.vy).toBe(3);
  });
});

describe("lift stops", () => {
  const three = { x: 1, width: 3, top: 4, bottom: 18, stops: [4, 11, 18] };

  it("defaults to its top and bottom stops", () => {
    expect(loadSandbox(sandbox).lifts.map((l) => l.stops)).toEqual(sandbox.lifts.map((l) => [l.top, l.bottom]));
  });

  it("goes to the next stop in the pressed direction", () => {
    const lift = loadSandbox({ ...sandbox, lifts: [three] }).lifts[0]!;
    expect(lift.y).toBe(18);
    callLift(lift, -1);
    expect(lift.target).toBe(11);
    lift.y = 11;
    lift.target = null;
    callLift(lift, -1);
    expect(lift.target).toBe(4);
    lift.y = 4;
    lift.target = null;
    callLift(lift, 1);
    expect(lift.target).toBe(11);
    lift.y = 11;
    lift.target = null;
    callLift(lift, 1);
    expect(lift.target).toBe(18);
  });

  it("starts at the start row when the level gives one", () => {
    expect(loadSandbox({ ...sandbox, lifts: [{ ...three, startRow: 11 }] }).lifts[0]!.y).toBe(11);
  });
});

describe("sandbox scenery", () => {
  it("rejects an unknown asset id", () => {
    expect(() => loadSandbox({ ...sandbox, dressing: [{ asset: "nope", x: 1 }] })).toThrow("unknown asset: nope");
  });

  it("has no bag or target prop", () => {
    const kinds = loadSandbox(sandbox).props.map((p) => p.kind);
    expect(kinds).not.toContain("bag");
    expect(kinds).not.toContain("target");
  });
});

const twoLifts = { ...sandbox, lifts: [sandbox.lifts[0]!, { x: 30, width: 3, top: 4, bottom: 14 }] };

describe("several lifts", () => {
  it("rides only the lift it stands on", () => {
    const g = game({ x: 18.5, y: 14 }, twoLifts);
    tick(g);
    tick(g, [], ["up"]);
    run(g, 0.5);
    expect(g.world.lifts[0]!.target).toBe(4);
    expect(g.world.lifts[1]!.target).toBeNull();
    expect(g.world.lifts[1]!.y).toBe(14);
  });

  it("calls the second lift from its own shaft", () => {
    const g = game({ x: 31.5, y: 14 }, twoLifts);
    tick(g);
    tick(g, [], ["up"]);
    run(g, 0.5);
    expect(g.world.lifts[1]!.target).toBe(4);
    expect(g.world.lifts[0]!.target).toBeNull();
  });

  it("jumps instead of calling the lift from the deck edge", () => {
    const g = game({ x: 16.8, y: 14 }, twoLifts);
    tick(g);
    expect(g.hero.onLift).toBe(true);
    tick(g, [], ["up"]);
    expect(g.hero.state).toBe("standJump");
    expect(g.world.lifts[0]!.target).toBeNull();
  });

  it("carries only its own lift while both move", () => {
    const g = game({ x: 18.5, y: 14 }, twoLifts);
    callLift(g.world.lifts[1]!, -1);
    tick(g);
    tick(g, [], ["up"]);
    run(g, 1);
    const [a, b] = g.world.lifts;
    expect(a!.target).toBe(4);
    expect(b!.y).toBeLessThan(14);
    expect(g.hero.y).toBeCloseTo(a!.y, 6);
    run(g, 5);
    expect(g.hero.y).toBeCloseTo(4, 6);
  });
});

describe("moving lift", () => {
  it("keeps a running hero on the deck when up is pressed mid-ride", () => {
    const g = game({ x: 17.8, y: 14 });
    tick(g);
    tick(g, [], ["up"]);
    run(g, 1);
    const lift = g.world.lifts[0]!;
    expect(lift.target).toBe(4);
    for (let i = 0; i < 4; i++) tick(g, ["moveRight", RUNNING]);
    expect(g.hero.state).toBe("run");
    tick(g, ["moveRight", RUNNING], ["up"]);
    tick(g);
    expect(g.seen.has("runJump")).toBe(false);
    expect(g.hero.onLift).toBe(true);
    runUntil(g, () => lift.target === null);
    run(g, 0.2);
    expect(g.hero.y).toBeCloseTo(4, 6);
    expect(g.hero.onLift).toBe(true);
  });

  it("loads four enemies, the three new ones without respawn", () => {
    const { enemies } = loadSandbox(sandbox);
    expect(enemies).toHaveLength(4);
    expect(enemies[0]!.respawnMs).toBe(5000);
    expect(enemies.slice(1).every((e) => e.respawnMs === null)).toBe(true);
  });

  it("damages only the enemy a hero bullet reaches", () => {
    const target = sandbox.enemies[2]!;
    const g = game({ x: target.x - 3, y: target.y, weapon: "gun" });
    g.hero.facing = 1;
    Object.assign(g.world.enemies[2]!.body, { x: target.x, facing: -1 });
    tick(g, ["shoot"], ["shoot"]);
    run(g, 0.5, ["shoot"]);
    const energy = g.world.enemies.map((e) => e.body.energy);
    expect(energy[2]).toBeLessThan(cfg.energy.max);
    expect(energy[2]).toBeLessThan(target.hits);
    expect(energy.filter((v) => v < sandbox.enemies[0]!.hits)).toHaveLength(1);
  });
});

describe("inventory", () => {
  it("takes the crowbar from its prop and shows it", () => {
    const g = game({ x: 9.5, y: 14 });
    expect(g.world.inventory).toEqual({ items: [], shown: null });
    tick(g, ["down"]);
    runUntil(g, (h) => h.state === "idle");
    expect(g.world.inventory).toEqual({ items: ["crowbar"], shown: "crowbar" });
  });

  it("shows the newest item and keeps the older one in the list", () => {
    const world = loadSandbox(sandbox);
    pickUp(world, "crowbar");
    pickUp(world, "craneKey");
    expect(world.inventory).toEqual({ items: ["crowbar", "craneKey"], shown: "craneKey" });
  });

  it("empties and restores the props when the map resets", () => {
    const g = game({ x: 9.5, y: 14 });
    pickUp(g.world, "crowbar");
    pickUp(g.world, "craneKey");
    g.world.props.forEach((p) => (p.taken = true));
    resetWorld(g.world, cfg);
    expect(g.world.inventory).toEqual({ items: [], shown: null });
    expect(g.world.props.filter((p) => p.kind === "item").map((p) => [p.item, p.taken])).toEqual([["crowbar", undefined], ["craneKey", undefined]]);
  });

  it("rejects an item prop with an unknown item", () => {
    expect(() => loadSandbox({ ...sandbox, props: [{ kind: "item", x: 1, item: "nope" }] })).toThrow("unknown item: nope");
  });
});

describe("weapon prop", () => {
  it("loads the E-Blaster prop of the sandbox", () => {
    expect(loadSandbox(sandbox).props.filter((p) => p.kind === "weapon").map((p) => p.weapon)).toEqual(["blaster"]);
  });

  it("rejects a weapon prop with an unknown weapon", () => {
    expect(() => loadSandbox({ ...sandbox, props: [{ kind: "weapon", x: 1, weapon: "nope" }] })).toThrow("unknown weapon: nope");
  });

  it("lies on the ground only while the hero has no E-Blaster", () => {
    const world = loadSandbox(sandbox);
    const prop = world.props.find((p) => p.kind === "weapon")!;
    expect(onGround(prop, { blaster: null })).toBe(true);
    expect(onGround(prop, { blaster: 0 })).toBe(false);
    resetWorld(world, cfg);
    expect(onGround(world.props.find((p) => p.kind === "weapon")!, { blaster: 400 })).toBe(false);
    expect(onGround({ kind: "item", item: "crowbar", x: 1 }, { blaster: 400 })).toBe(true);
    expect(onGround({ kind: "item", item: "crowbar", x: 1, taken: true }, { blaster: null })).toBe(false);
  });
});
