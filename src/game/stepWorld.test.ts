import controls from "@config/controls.json";
import clipsJson from "@config/hero/clips.json";
import movementJson from "@config/hero/movement.json";
import sandboxJson from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { Input } from "../engine/input";
import { FIXED_STEP } from "../engine/loop";
import { loadClips, loadMovement } from "./hero/config";
import { createHero, type Hero } from "./hero/hero";
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
  world.emitter.on = true;
  const hero = createHero(world.spawn, "gun", cfg.energy.max);
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
    expect(recorded.state).toBe("jumpDeath");
    expect(replayed).toEqual(recorded);
  });
});
