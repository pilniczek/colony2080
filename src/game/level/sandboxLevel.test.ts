import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { moveBox } from "../../engine/world/collide";
import { stepProjectiles } from "../../engine/world/projectiles";
import { callLift, loadSandbox, updateEmitter, updateLift } from "./sandboxLevel";

const dt = 1 / 60;

describe("lift", () => {
  it("carries a standing box to the top, stops exactly and clears the target", () => {
    const world = loadSandbox(sandbox);
    const { lift, grid } = world;
    let hero = { x: 18.5, y: lift.y, w: 0.7, h: 1.9 };
    callLift(lift, -1);
    expect(lift.target).toBe(4);
    for (let i = 0; i < 1000 && lift.target !== null; i++) {
      updateLift(lift, 3, dt);
      const carried = moveBox(hero, 0, lift.vy * dt, grid, [lift]);
      const settled = moveBox({ ...hero, x: carried.x, y: carried.y }, 0, 0.02, grid, [lift]);
      hero = { ...hero, x: settled.x, y: settled.y };
      expect(settled.platform).toBe(lift);
      if (i === 5) {
        const before = lift.target;
        callLift(lift, 1);
        expect(lift.target).toBe(before);
      }
    }
    expect(lift.y).toBe(4);
    expect(lift.target).toBeNull();
    expect(lift.vy).toBe(0);
    const final = moveBox(hero, 0, 0.02, grid, [lift]);
    expect(final.y).toBe(4);
    expect(final.platform).toBe(lift);
  });

  it("moves down on a bottom call", () => {
    const { lift } = loadSandbox(sandbox);
    lift.y = 4;
    callLift(lift, 1);
    expect(lift.target).toBe(14);
    updateLift(lift, 3, dt);
    expect(lift.vy).toBe(3);
  });
});

describe("emitter", () => {
  it("spawns nothing while off", () => {
    const world = loadSandbox(sandbox);
    for (let i = 0; i < 600; i++) updateEmitter(world, dt);
    expect(world.projectiles).toHaveLength(0);
  });

  it("spawns one projectile per period while on and loses it at the wall", () => {
    const world = loadSandbox(sandbox);
    world.emitter.on = true;
    for (let i = 0; i < 120; i++) updateEmitter(world, dt);
    expect(world.projectiles).toHaveLength(1);
    expect(world.projectiles[0]).toMatchObject({ x: 38.5, y: 12.6, vx: -8, r: 0.15 });
    world.emitter.on = false;
    for (let i = 0; i < 600; i++) world.projectiles = stepProjectiles(world.projectiles, world.grid, dt);
    expect(world.projectiles).toHaveLength(0);
  });
});
