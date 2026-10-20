import type { Bus, SoundCue } from "../../engine/audio/mixer";
import type { SoundId } from "./index";

const DEFAULT_VOL = 63;

export function cue(world: { sounds: SoundCue[] }, id: SoundId, rate: number, vol: number = DEFAULT_VOL, bus: Bus = "world"): void {
  world.sounds.push({ id, rate, vol, bus });
}
