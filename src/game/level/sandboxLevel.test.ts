import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { moveBox } from "../../engine/world/collide";
import { game, run, tick } from "../hero/testWorld";
import { callLift, loadSandbox, updateLift } from "./sandboxLevel";

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
  it("carries a standing box up, stops exactly on top and clears the target", () => ride(-1, 3.7));
  it("carries a standing box down, stopping exactly on the bottom", () => ride(1, 3.7));

  it("moves down on a bottom call", () => {
    const lift = loadSandbox(sandbox).lifts[0]!;
    lift.y = 4;
    callLift(lift, 1);
    expect(lift.target).toBe(14);
    updateLift(lift, 3, dt);
    expect(lift.vy).toBe(3);
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

const twoLifts = { ...sandbox, lifts: [...sandbox.lifts, { x: 30, width: 3, top: 4, bottom: 14 }] };

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

  it("carries and calls from the deck edge with the center outside the span", () => {
    const g = game({ x: 16.8, y: 14 }, twoLifts);
    tick(g);
    expect(g.hero.onLift).toBe(true);
    tick(g, [], ["up"]);
    run(g, 1);
    expect(g.world.lifts[0]!.target).toBe(4);
    expect(g.hero.onGround).toBe(true);
    expect(g.hero.y).toBeCloseTo(g.world.lifts[0]!.y, 6);
    expect(g.hero.y).toBeLessThan(14);
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
