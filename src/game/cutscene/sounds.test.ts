import { beforeAll, describe, expect, it } from "vitest";
import { FIXED_STEP } from "../../engine/loop";
import { objectLevel } from "../hero/testWorld";
import { loadSandbox, pickUp, type SandboxWorld } from "../level/sandboxLevel";
import { SOUNDS } from "../sound/index";
import { CUTSCENE_IDS, filmOf, loadFilms, type CutsceneId } from "./index";
import { stepCutscene } from "./play";
import { filmSounds, soundsOf, type FilmSound } from "./sounds";

beforeAll(() => loadFilms());

const filming = (id: CutsceneId): SandboxWorld => {
  const world = loadSandbox(objectLevel);
  world.cutscene = { id, prop: null, t: 0 };
  return world;
};

const cued = (world: SandboxWorld) => world.sounds.map((s) => s.id);

describe("film cues", () => {
  it("film cues fire when time crosses", () => {
    const w = filming("pickCrowbar");
    const [[first], [second]] = soundsOf("pickCrowbar") as [FilmSound, FilmSound];
    while (w.cutscene!.t + FIXED_STEP < first) stepCutscene(w, FIXED_STEP, false);
    expect(w.sounds).toEqual([]);
    stepCutscene(w, FIXED_STEP, false);
    expect(w.sounds).toEqual([{ id: "servo", rate: 16000, vol: 63, bus: "world" }]);
    while (w.cutscene!.t < second) stepCutscene(w, FIXED_STEP, false);
    expect(cued(w)).toEqual(["servo", "servo"]);
    while (stepCutscene(w, FIXED_STEP, false));
    expect(cued(w)).toEqual(["servo", "servo"]);
  });

  it("cue at 0 fires on first step", () => {
    const w = filming("openDoor");
    stepCutscene(w, FIXED_STEP, false);
    expect(w.sounds).toEqual([{ id: "power", rate: 13000, vol: 63, bus: "world" }]);
  });

  it("skip drops later cues", () => {
    const w = filming("pickCrowbar");
    stepCutscene(w, FIXED_STEP, false);
    expect(stepCutscene(w, FIXED_STEP, true)).toBe(false);
    expect(w.sounds).toEqual([]);
  });

  it("every film cue id is a SoundId", () => {
    for (const id of CUTSCENE_IDS) for (const [, sound] of soundsOf(id)) expect(Object.keys(SOUNDS)).toContain(sound);
  });

  it("loader rejects an unknown sound id", () => {
    expect(() => filmSounds("x", [[0, "strelba", 11025]])).toThrow("bad sound cue");
    expect(filmSounds("x", [[0, "step", 7000, 40]])).toEqual([[0, "step", 7000, 40]]);
  });

  it("cue times within film duration", () => {
    for (const id of CUTSCENE_IDS) {
      const times = soundsOf(id).map(([t]) => t);
      for (const t of times) expect(t >= 0 && t <= filmOf(id)!.duration, `${id} ${t}`).toBe(true);
      expect(times).toEqual([...times].sort((a, b) => a - b));
    }
  });

  it("a door opened at a film end plays no open sound", () => {
    const w = loadSandbox(objectLevel);
    pickUp(w, "crowbar");
    w.flags.add("flag:metroPowered");
    const door = w.props.find((p) => p.id === "trainDoor")!;
    door.asset = "trainDoor";
    w.cutscene = { id: "crowbarDoor", prop: door, t: 0 };
    while (stepCutscene(w, FIXED_STEP, false));
    expect(door.state).toBe(2);
    expect(cued(w)).not.toContain("door");
  });
});
