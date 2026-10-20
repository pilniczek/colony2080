import { describe, expect, it } from "vitest";
import { FIXED_STEP } from "../../engine/loop";
import { objectLevel } from "../hero/testWorld";
import { loadSandbox, pickUp, type SandboxWorld } from "../level/sandboxLevel";
import { CUTSCENES } from "./index";
import { stepCutscene } from "./play";

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
