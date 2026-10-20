import controls from "@config/controls.json";
import { describe, expect, it } from "vitest";
import { Input } from "../../engine/input";
import { FIXED_STEP } from "../../engine/loop";
import { objectLevel } from "../hero/testWorld";
import { loadSandbox, pickUp, type SandboxWorld } from "../level/sandboxLevel";
import { CUTSCENES } from "./index";
import { playFilm, stepCutscene } from "./play";

const filmed = (): SandboxWorld => {
  const world = loadSandbox(objectLevel);
  pickUp(world, "crowbar");
  world.flags.add("flag:metroPowered");
  world.cutscene = { id: "crowbarDoor", prop: world.props.find((p) => p.id === "trainDoor")!, t: 0 };
  return world;
};
const door = (w: SandboxWorld) => w.props.find((p) => p.id === "trainDoor")!;

describe("stepCutscene", () => {
  it("plays the whole film, then applies the task", () => {
    const w = filmed();
    const steps = Math.ceil(CUTSCENES.crowbarDoor.duration / FIXED_STEP);
    for (let i = 1; i < steps; i++) expect(stepCutscene(w, FIXED_STEP, false)).toBe(true);
    expect(w.flags.has("task:openTrainDoor")).toBe(false);
    expect(stepCutscene(w, FIXED_STEP, false)).toBe(false);
    expect(w.cutscene).toBeNull();
    expect(door(w).state).toBe(2);
    expect(w.flags.has("flag:metroOpen")).toBe(true);
    expect(w.subtitle?.text).toBe("The door gives way.");
  });

  it("skips to the end and applies the task", () => {
    const w = filmed();
    expect(stepCutscene(w, FIXED_STEP, true)).toBe(false);
    expect(w.cutscene).toBeNull();
    expect(door(w).state).toBe(2);
  });
});

describe("playFilm", () => {
  const clock = { now: 0 };
  const input = (): Input => new Input(controls.keyboard, () => clock.now, 150);

  it("does not skip on a key held into the film", () => {
    const w = filmed();
    const keys = input();
    keys.keyDown("Enter");
    keys.consume("useItem");
    expect(playFilm(w, keys, FIXED_STEP)).toBe(true);
    expect(playFilm(w, keys, FIXED_STEP)).toBe(true);
  });

  it("skips on a press made during the film and drops presses at its end", () => {
    const w = filmed();
    const keys = input();
    playFilm(w, keys, FIXED_STEP);
    keys.keyDown("KeyI");
    keys.keyDown("Escape");
    expect(playFilm(w, keys, FIXED_STEP)).toBe(false);
    expect(door(w).state).toBe(2);
    expect(keys.consume("inventory")).toBe(false);
  });

  it("clears bullets, sparks and the beam when the film ends", () => {
    const w = filmed();
    w.projectiles.push({ x: 5, y: 7, vx: -8, r: 0.15 });
    w.sparks.push({ x: 5, y: 7, age: 0 } as never);
    stepCutscene(w, FIXED_STEP, true);
    expect(w.projectiles).toEqual([]);
    expect(w.sparks).toEqual([]);
    expect(w.beam).toBeNull();
  });
});
