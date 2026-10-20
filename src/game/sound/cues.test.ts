import { describe, expect, it } from "vitest";
import type { SoundCue } from "../../engine/audio/mixer";
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

  it.todo("same input gives same cues");
});
