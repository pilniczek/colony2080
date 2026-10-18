import controls from "@config/controls.json";
import clipsJson from "@config/hero/clips.json";
import movementJson from "@config/hero/movement.json";
import sandboxJson from "@config/levels/sandbox.json";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { Input } from "../engine/input";
import { FIXED_STEP } from "../engine/loop";
import { stepProjectiles } from "../engine/world/projectiles";
import { loadClips, loadMovement } from "../game/hero/config";
import { createHero, updateHero, type Hero } from "../game/hero/hero";
import { loadSandbox, updateEmitter, updateLift } from "../game/level/sandboxLevel";
import { useSandbox } from "./store";

const store = () => useSandbox.getState();

beforeEach(() => store().resetTuning());

describe("movement tuning", () => {
  it("sets a value", () => {
    store().setMovementValue("gravity", 20);
    expect(store().movement.gravity).toBe(20);
  });

  it("keeps the old value for negatives and non-finite numbers", () => {
    for (const bad of [-1, NaN, Infinity]) store().setMovementValue("gravity", bad);
    expect(store().movement.gravity).toBe(30);
  });

  it("sets nested values and ignores unknown paths", () => {
    store().setMovementValue("jump.runSpeed", 7);
    store().setMovementValue("jump.nope", 1);
    store().setMovementValue("status", 1);
    expect(store().movement.jump.runSpeed).toBe(7);
    expect(store().movement).not.toHaveProperty("jump.nope");
    expect(store().movement.status).toBe("draft");
  });

  it("exports JSON that loads back as the edited config", () => {
    store().setMovementValue("gravity", 20);
    store().setMovementValue("box.width", 0.8);
    const loaded = loadMovement(JSON.parse(store().exportTuning().movement));
    expect(loaded).toEqual(store().movement);
    expect(loaded.gravity).toBe(20);
    expect(loaded.status).toBe("draft");
    expect(loaded.source).toBe(movementJson.source);
  });

  it("resetTuning restores the file values", () => {
    store().setMovementValue("gravity", 20);
    store().setClipValue("walk", "duration", 2);
    store().resetTuning();
    expect(store().movement).toEqual(loadMovement(movementJson));
    expect(store().clips).toEqual(loadClips(clipsJson));
  });
});

describe("clip tuning", () => {
  it("sets duration and travel", () => {
    store().setClipValue("walk", "duration", 1.4);
    store().setClipValue("walk", "travel", 2.2);
    expect(store().clips.walk).toMatchObject({ duration: 1.4, travel: 2.2 });
  });

  it("rejects non-positive durations, negative travel and unknown clips", () => {
    store().setClipValue("walk", "duration", 0);
    store().setClipValue("walk", "travel", -1);
    store().setClipValue("walk", "duration", NaN);
    store().setClipValue("nope", "duration", 1);
    expect(store().clips.walk).toMatchObject({ duration: 1.1, travel: 2 });
    expect(store().clips).not.toHaveProperty("nope");
  });

  it("exports the clips file unchanged when nothing was edited", () => {
    expect(store().exportTuning().clips).toBe(readFileSync("config/hero/clips.json", "utf8"));
  });

  it("exports the wrapped clips file with the edits", () => {
    store().setClipValue("run", "duration", 0.9);
    const json = JSON.parse(store().exportTuning().clips);
    expect(json.status).toBe("draft");
    expect(json.source).toBe(clipsJson.source);
    expect(loadClips(json)).toEqual(store().clips);
    expect(json.clips.run.duration).toBe(0.9);
  });
});

describe("replay", () => {
  const cfg = loadMovement(movementJson);
  const clips = loadClips(clipsJson);
  const script: Record<number, ["down" | "up", string][]> = {
    0: [["down", "ArrowRight"], ["down", "AltLeft"]],
    40: [["down", "ArrowUp"]],
    44: [["up", "ArrowUp"]],
    80: [["up", "AltLeft"]],
    95: [["down", "ControlLeft"]],
    97: [["up", "ControlLeft"], ["up", "ArrowRight"]],
  };

  function run(input: Input, live: boolean): Hero {
    const world = loadSandbox(sandboxJson);
    world.emitter.on = true;
    const hero = createHero(world.spawn, "gun", cfg.energy.max);
    for (let f = 0; f < 120; f++) {
      for (const [type, code] of live ? (script[f] ?? []) : []) {
        if (type === "down") input.keyDown(code);
        else input.keyUp(code);
      }
      const frame = input.frame();
      updateEmitter(world, FIXED_STEP);
      world.projectiles = stepProjectiles(world.projectiles, world.grid, FIXED_STEP);
      updateLift(world.lift, cfg.liftSpeed, FIXED_STEP);
      updateHero(hero, frame, world, cfg, clips, FIXED_STEP, (action) => input.consume(action));
    }
    return hero;
  }

  it("repeats a recorded run from spawn", () => {
    let wall = 0;
    const input = new Input(controls.keyboard, () => (wall += 7), cfg.inputBufferMs);
    input.startRecording();
    const recorded = run(input, true);
    const record = input.stopRecording();
    input.play(record);
    const replayed = run(input, false);
    expect(recorded.x).toBeGreaterThan(sandboxJson.spawn[0]! + 3);
    expect({ x: replayed.x, y: replayed.y, state: replayed.state }).toEqual({ x: recorded.x, y: recorded.y, state: recorded.state });
  });
});
