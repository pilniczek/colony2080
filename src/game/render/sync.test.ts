import sandboxJson from "@config/levels/sandbox.json";
import cameraJson from "@config/camera.json";
import { describe, expect, it } from "vitest";
import { createFog, loadFog } from "../fog";
import { loadSandbox } from "../level/sandboxLevel";
import { cfg, clips } from "../hero/testWorld";
import { applySync, syncer } from "./sync";

const fogCfg = loadFog(cameraJson);
const tune = { cfg, clips };

const pair = () => {
  const world = loadSandbox(sandboxJson);
  world.fog = createFog(fogCfg, cfg, { x: world.spawn[0], y: world.spawn[1] }, world.grid);
  return { world, mirror: loadSandbox(sandboxJson), sync: syncer() };
};

describe("syncer", () => {
  it("sends flags, grid, fog and tuning once, then only what changed", () => {
    const { world, sync } = pair();
    const first = sync(world, tune);
    expect(first.flags).toEqual([]);
    expect(first.grid).toBeInstanceOf(Uint8Array);
    expect(first.fog?.fresh).toBe(true);
    expect(first.tune).toBe(tune);
    const second = sync(world, tune);
    expect([second.flags, second.grid, second.fog, second.tune]).toEqual([undefined, undefined, undefined, undefined]);
    world.flags.add("flag:test");
    world.grid.block(1, 1, true);
    world.fog!.version++;
    const third = sync(world, tune);
    expect(third.flags).toEqual(["flag:test"]);
    expect(third.grid).toBeInstanceOf(Uint8Array);
    expect(third.fog?.fresh).toBe(false);
  });

  it("marks a replaced fog as fresh and a removed fog as null", () => {
    const { world, sync } = pair();
    sync(world, tune);
    world.fog = createFog(fogCfg, cfg, { x: world.spawn[0], y: world.spawn[1] }, world.grid);
    expect(sync(world, tune).fog?.fresh).toBe(true);
    world.fog = null;
    expect(sync(world, tune).fog).toBeNull();
  });
});

describe("applySync", () => {
  it("brings the mirror world to the state the game world drew", () => {
    const { world, mirror, sync } = pair();
    world.lifts[0]!.y = 3.5;
    world.flags.add("flag:test");
    world.grid.block(2, 2, true);
    world.props[0]!.state = 1;
    applySync(mirror, fogCfg, sync(world, tune));
    expect(mirror.lifts[0]!.y).toBe(3.5);
    expect(mirror.flags.has("flag:test")).toBe(true);
    expect(mirror.grid.solid(2, 2)).toBe(true);
    expect(mirror.props[0]!.state).toBe(1);
    expect(mirror.fog?.revealed).toEqual(world.fog!.revealed);
    expect(mirror.fog?.grid).toBe(mirror.grid);
  });

  it("keeps the mirror fog object across versions so its caches survive", () => {
    const { world, mirror, sync } = pair();
    applySync(mirror, fogCfg, sync(world, tune));
    const kept = mirror.fog;
    world.fog!.seen[5] = 1;
    world.fog!.version++;
    applySync(mirror, fogCfg, sync(world, tune));
    expect(mirror.fog).toBe(kept);
    expect(mirror.fog!.seen[5]).toBe(1);
  });
});
