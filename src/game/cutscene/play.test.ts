import controls from "@config/controls.json";
import { beforeAll, describe, expect, it } from "vitest";
import { Input } from "../../engine/input";
import { FIXED_STEP } from "../../engine/loop";
import { objectLevel } from "../hero/testWorld";
import { loadSandbox, pickUp, type SandboxWorld } from "../level/sandboxLevel";
import { filmOf, loadFilms } from "./index";
import { captionOf, playFilm, stepCutscene } from "./play";

const filmed = (): SandboxWorld => {
  const world = loadSandbox(objectLevel);
  pickUp(world, "crowbar");
  world.flags.add("flag:metroPowered");
  world.cutscene = { id: "crowbarDoor", prop: world.props.find((p) => p.id === "trainDoor")!, t: 0 };
  return world;
};
beforeAll(() => loadFilms());

const door = (w: SandboxWorld) => w.props.find((p) => p.id === "trainDoor")!;

describe("stepCutscene", () => {
  it("plays the whole film, then applies the task", () => {
    const w = filmed();
    const steps = Math.ceil(filmOf("crowbarDoor")!.duration / FIXED_STEP);
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

describe("film caption", () => {
  const talking = (): SandboxWorld => {
    const world = loadSandbox({ ...objectLevel, tasks: { tasks: [{ id: "talk", object: "switchboard", requires: [], gives: [], subtitle: "Find the bar man." }] } });
    world.cutscene = { id: "talkRebel", prop: world.props.find((p) => p.id === "switchboard")!, t: 0 };
    return world;
  };

  it("shows the task subtitle as a film caption from the film caption time", () => {
    const w = talking();
    const at = captionOf("talkRebel")!;
    while (w.cutscene!.t + FIXED_STEP < at) stepCutscene(w, FIXED_STEP, false);
    expect(w.subtitle).toBeNull();
    stepCutscene(w, FIXED_STEP, false);
    expect(w.subtitle).toMatchObject({ text: "Find the bar man.", film: true });
  });

  it("shows no caption for a film without one", () => {
    const w = filmed();
    for (let t = 0; t < 3; t += FIXED_STEP) stepCutscene(w, FIXED_STEP, false);
    expect(w.subtitle).toBeNull();
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
    expect(playFilm(w, keys, FIXED_STEP)).toBe("playing");
    expect(playFilm(w, keys, FIXED_STEP)).toBe("playing");
  });

  it("skips on a press made during the film and drops presses at its end", () => {
    const w = filmed();
    const keys = input();
    playFilm(w, keys, FIXED_STEP);
    keys.keyDown("KeyI");
    keys.keyDown("Escape");
    expect(playFilm(w, keys, FIXED_STEP)).toBe("skipped");
    expect(door(w).state).toBe(2);
    expect(keys.consume("inventory")).toBe(false);
  });

  it("reports a film played to its end as ended", () => {
    const w = filmed();
    const keys = input();
    const steps = Math.ceil(filmOf("crowbarDoor")!.duration / FIXED_STEP);
    for (let i = 1; i < steps; i++) playFilm(w, keys, FIXED_STEP);
    expect(playFilm(w, keys, FIXED_STEP)).toBe("ended");
  });

  it("clears enemy hits, sparks and the beam when the film ends", () => {
    const w = filmed();
    w.heroHits = 2;
    w.sparks.push({ x: 5, y: 7, age: 0 } as never);
    stepCutscene(w, FIXED_STEP, true);
    expect(w.heroHits).toBe(0);
    expect(w.sparks).toEqual([]);
    expect(w.beam).toBeNull();
  });
});
