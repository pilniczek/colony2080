import controls from "@config/controls.json";
import clipsJson from "@config/hero/clips.json";
import movementJson from "@config/hero/movement.json";
import sandboxJson from "@config/levels/sandbox.json";
import cameraJson from "@config/camera.json";
import { describe, expect, it } from "vitest";
import { Input } from "../engine/input";
import { FIXED_STEP } from "../engine/loop";
import { loadClips, loadMovement } from "./hero/config";
import { createFog, loadFog } from "./fog";
import { createHero, kill, type Hero } from "./hero/hero";
import { loadSandbox } from "./level/sandboxLevel";
import { stepWorld } from "./stepWorld";

const scenario = loadMovement(movementJson);
const SCENARIO_SHOT = { speed: 8, radius: 0.15 };
const cfg = { ...scenario, shot: SCENARIO_SHOT };
const clips = loadClips(clipsJson);
const STEPS = 720;
const script: Record<number, ["down" | "up", string][]> = {
  0: [["down", "ArrowRight"], ["down", "AltLeft"]],
  40: [["down", "ArrowUp"]],
  44: [["up", "ArrowUp"]],
  80: [["up", "AltLeft"]],
  95: [["down", "ControlLeft"]],
  97: [["up", "ControlLeft"], ["up", "ArrowRight"]],
  120: [["down", "ArrowLeft"]],
  200: [["up", "ArrowLeft"]],
  676: [["down", "ArrowUp"]],
  680: [["up", "ArrowUp"]],
};

function fromSpawn(input: Input, live: boolean): Hero {
  const world = loadSandbox(sandboxJson);
  const hero = createHero(world.spawn, "gun", 4 * cfg.energy.hit, 0, cfg.ammo);
  world.fog = createFog(loadFog(cameraJson), hero, world.grid);
  for (let f = 0; f < STEPS; f++) {
    for (const [type, code] of live ? (script[f] ?? []) : []) {
      if (type === "down") input.keyDown(code);
      else input.keyUp(code);
    }
    stepWorld(world, hero, input.frame(), cfg, clips, FIXED_STEP, (action) => input.consume(action));
  }
  return hero;
}

describe("record and replay", () => {
  it("replays a recorded run from spawn to the same end", () => {
    let wall = 0;
    const input = new Input(controls.keyboard, () => (wall += 7), cfg.inputBufferMs);
    input.startRecording();
    const recorded = fromSpawn(input, true);
    const record = input.stopRecording();
    input.play(record);
    const replayed = fromSpawn(input, false);
    expect(record.length).toBe(Object.values(script).flat().length);
    expect(recorded.x).not.toBe(sandboxJson.spawn[0]);
    expect(recorded.state).toBe("idle");
    expect(replayed).toEqual(recorded);
  });
});

describe("map reset on hero respawn", () => {
  it("restores the map when the hero respawns after a death", () => {
    const input = new Input(controls.keyboard, () => 0, cfg.inputBufferMs);
    const step = (world: ReturnType<typeof loadSandbox>, hero: Hero): void => {
      stepWorld(world, hero, input.frame(), cfg, clips, FIXED_STEP, (action) => input.consume(action));
    };
    const fresh = loadSandbox(sandboxJson);
    const freshHero = createHero(fresh.spawn, "gun", cfg.energy.max, 0, cfg.ammo);
    fresh.fog = createFog(loadFog(cameraJson), freshHero, fresh.grid);
    step(fresh, freshHero);

    const world = loadSandbox(sandboxJson);
    const hero = createHero(world.spawn, "gun", cfg.energy.max, 0, cfg.ammo);
    world.fog = createFog(loadFog(cameraJson), hero, world.grid);
    world.props.find((p) => p.kind === "item")!.taken = true;
    world.props.find((p) => p.kind === "panel")!.on = true;
    for (const lift of world.lifts) {

      lift.target = lift.top;
    }
    world.fog.revealed.fill(1);
    world.enemies[0]!.hits = 1;
    world.enemies[1]!.deadAge = 0;
    world.projectiles.push({ x: world.spawn[0] + 1, y: world.spawn[1] - 1, vx: 1, r: 0.1 });
    world.sparks.push({ x: world.spawn[0] + 1, y: world.spawn[1] - 1, age: 0 });
    hero.ammo = 3;
    kill(hero);
    stepWorld(world, hero, input.frame(), cfg, clips, FIXED_STEP, () => false);
    expect(world.projectiles.length + world.sparks.length).toBeGreaterThan(0);
    for (let i = 0; i < Math.ceil(cfg.respawnMs / 1000 / FIXED_STEP) + 5; i++) step(world, hero);

    expect(world.props.find((p) => p.kind === "item")!.taken).toBeFalsy();
    expect(world.props.find((p) => p.kind === "panel")!.on).toBeFalsy();
    expect(world.lifts.map((l) => [l.y, l.target])).toEqual(fresh.lifts.map((l) => [l.y, null]));
    expect(world.enemies.map((e) => [e.hits, e.deadAge])).toEqual(fresh.enemies.map((e) => [e.hits, null]));
    expect(world.projectiles).toEqual([]);
    expect(world.sparks).toEqual([]);
    const covered = (w: typeof world): number => w.fog!.revealed.reduce((n, v) => n + v, 0);
    expect(covered(world)).toBe(covered(fresh));
    expect(hero.ammo).toBe(3);
  });
});
