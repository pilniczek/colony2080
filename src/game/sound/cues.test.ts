import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import type { SoundCue } from "../../engine/audio/mixer";
import { game, tick } from "../hero/testWorld";
import { cue } from "./cues";

describe("cue", () => {
  it("appends with defaults", () => {
    const world: { sounds: SoundCue[] } = { sounds: [] };
    cue(world, "gunShot", 11025);
    expect(world.sounds).toEqual([{ id: "gunShot", rate: 11025, vol: 63, bus: "world" }]);
  });

  it("keeps given volume and bus", () => {
    const world: { sounds: SoundCue[] } = { sounds: [] };
    cue(world, "punch", 8000, 30, "ui");
    expect(world.sounds).toEqual([{ id: "punch", rate: 8000, vol: 30, bus: "ui" }]);
  });

  it("same input gives same cues", () => {
    const recording = Array.from({ length: 600 }, (_, i) => ({
      held: i < 300 ? ["moveRight", "shoot"] : i < 400 ? ["moveLeft"] : ["shoot"],
      pressed: i === 0 || i === 400 ? ["shoot"] : [],
    }));
    const played = () => {
      const g = game({ x: 7.5, y: 14, weapon: "gun" }, sandbox);
      for (const { held, pressed } of recording) tick(g, held, pressed);
      return g.world.sounds;
    };
    const first = played();
    expect(first.some((s) => s.id === "gunShot")).toBe(true);
    expect(played()).toEqual(first);
  });
});
