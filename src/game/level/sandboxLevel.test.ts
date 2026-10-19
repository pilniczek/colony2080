import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { moveBox } from "../../engine/world/collide";
import { callLift, loadSandbox, updateLift } from "./sandboxLevel";

const dt = 1 / 60;

function ride(dir: -1 | 1, speed: number): void {
  const world = loadSandbox(sandbox);
  const { lift, grid } = world;
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
    const { lift } = loadSandbox(sandbox);
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
